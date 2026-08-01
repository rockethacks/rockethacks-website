-- RocketHacks Organizer Portal
-- Migration 022: Functions — redeem / request invite, updated_at
-- Run AFTER 021.

-- ============================================================
-- UPDATED_AT
-- ============================================================

create or replace function public.set_organizer_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_organizer_profiles_updated_at on organizer_profiles;
create trigger trg_organizer_profiles_updated_at
  before update on organizer_profiles
  for each row execute function public.set_organizer_updated_at();

-- ============================================================
-- INVITE PRE-CHECK (anon-safe)
-- ============================================================

create or replace function public.request_organizer_access(
  p_email text,
  p_invite_code text
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from organizer_invites
    where lower(email) = lower(trim(p_email))
      and invite_code = upper(trim(p_invite_code))
      and used = false
      and expires_at > now()
  );
$$;

grant execute on function public.request_organizer_access(text, text) to anon;
grant execute on function public.request_organizer_access(text, text) to authenticated;

-- ============================================================
-- REDEEM ORGANIZER INVITE
-- Upserts organizer_profiles + team memberships.
-- Never touches applicants. Refuses if email has a hacker application.
-- ============================================================

create or replace function public.redeem_organizer_invite(p_invite_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite organizer_invites%rowtype;
  v_email text;
  v_full_name text;
  v_assignment jsonb;
  v_team_id uuid;
  v_is_leader boolean;
begin
  if auth.uid() is null then
    raise exception 'Must be authenticated to redeem an invite';
  end if;

  select email, raw_user_meta_data ->> 'full_name'
  into v_email, v_full_name
  from auth.users
  where id = auth.uid();

  select * into v_invite
  from organizer_invites
  where invite_code = upper(trim(p_invite_code))
    and used = false
    and expires_at > now();

  if not found then
    raise exception 'Invalid or expired invite code';
  end if;

  if lower(v_invite.email) is distinct from lower(v_email) then
    raise exception 'Invite code does not match the signed in account';
  end if;

  -- Exclusive staff: block if this email already has a hacker application
  if exists (
    select 1 from applicants
    where lower(email) = lower(v_email)
       or user_id = auth.uid()
  ) then
    raise exception 'This email has a hacker application; use a staff email';
  end if;

  insert into organizer_profiles (
    user_id,
    email,
    full_name,
    role
  )
  values (
    auth.uid(),
    v_email,
    coalesce(v_invite.full_name, v_full_name),
    v_invite.role
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, organizer_profiles.full_name),
    role = excluded.role,
    updated_at = now();

  -- Apply team assignments from invite
  delete from organizer_team_members where organizer_id = auth.uid();

  for v_assignment in
    select * from jsonb_array_elements(coalesce(v_invite.team_assignments, '[]'::jsonb))
  loop
    v_team_id := (v_assignment ->> 'team_id')::uuid;
    v_is_leader := coalesce((v_assignment ->> 'is_leader')::boolean, false);

    if v_team_id is not null and exists (select 1 from org_teams where id = v_team_id) then
      insert into organizer_team_members (organizer_id, team_id, is_leader)
      values (auth.uid(), v_team_id, v_is_leader)
      on conflict (organizer_id, team_id) do update set is_leader = excluded.is_leader;
    end if;
  end loop;

  update organizer_invites
  set used = true
  where id = v_invite.id;
end;
$$;

grant execute on function public.redeem_organizer_invite(text) to authenticated;

-- ============================================================
-- ADD EXISTING AUTH USER AS ORGANIZER (admin only)
-- Looks up auth.users by email; never creates applicants rows.
-- ============================================================

create or replace function public.add_organizer_by_email(
  p_email text,
  p_role organizer_role default 'organizer',
  p_full_name text default null,
  p_team_assignments jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_assignment jsonb;
  v_team_id uuid;
  v_is_leader boolean;
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  v_email := lower(trim(p_email));

  select id into v_user_id
  from auth.users
  where lower(email) = v_email;

  if v_user_id is null then
    raise exception 'No auth account found for that email. Create an invite instead.';
  end if;

  if exists (
    select 1 from applicants
    where user_id = v_user_id or lower(email) = v_email
  ) then
    raise exception 'This email has a hacker application; use a staff email';
  end if;

  insert into organizer_profiles (user_id, email, full_name, role)
  values (v_user_id, v_email, nullif(trim(p_full_name), ''), p_role)
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, organizer_profiles.full_name),
    role = excluded.role,
    updated_at = now();

  delete from organizer_team_members where organizer_id = v_user_id;

  for v_assignment in
    select * from jsonb_array_elements(coalesce(p_team_assignments, '[]'::jsonb))
  loop
    v_team_id := (v_assignment ->> 'team_id')::uuid;
    v_is_leader := coalesce((v_assignment ->> 'is_leader')::boolean, false);
    if v_team_id is not null and exists (select 1 from org_teams where id = v_team_id) then
      insert into organizer_team_members (organizer_id, team_id, is_leader)
      values (v_user_id, v_team_id, v_is_leader)
      on conflict (organizer_id, team_id) do update set is_leader = excluded.is_leader;
    end if;
  end loop;

  return v_user_id;
end;
$$;

grant execute on function public.add_organizer_by_email(text, organizer_role, text, jsonb) to authenticated;
