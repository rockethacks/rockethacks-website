-- RocketHacks Organizer Portal
-- Migration 020: Core schema (additive â€” does NOT yet drop applicants.role)
-- Idempotent: safe to re-run if a previous attempt partially/fully succeeded.
--
-- Staff RBAC lives here, exclusive from applicants (mirrors judge_profiles).

-- ============================================================
-- ENUM
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'organizer_role') then
    create type organizer_role as enum ('organizer', 'admin');
  end if;
end $$;

-- ============================================================
-- ORGANIZER PROFILES
-- Separate from applicants. Role only via invite redeem or admin write.
-- ============================================================

create table if not exists organizer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role organizer_role not null default 'organizer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_organizer_profiles_role on organizer_profiles(role);
create index if not exists idx_organizer_profiles_email on organizer_profiles(email);
create unique index if not exists idx_organizer_profiles_email_lower on organizer_profiles (lower(email));

-- ============================================================
-- ORG TEAMS (tags)
-- ============================================================

create table if not exists org_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists organizer_team_members (
  organizer_id uuid not null references organizer_profiles(user_id) on delete cascade,
  team_id uuid not null references org_teams(id) on delete cascade,
  is_leader boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (organizer_id, team_id)
);

create index if not exists idx_organizer_team_members_team on organizer_team_members(team_id);

-- ============================================================
-- ORGANIZER INVITES
-- team_assignments: [{ "team_id": "<uuid>", "is_leader": false }, ...]
-- ============================================================

create table if not exists organizer_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invite_code text not null unique,
  role organizer_role not null default 'organizer',
  full_name text,
  team_assignments jsonb not null default '[]'::jsonb,
  used boolean not null default false,
  expires_at timestamptz not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_organizer_invites_email on organizer_invites(email);
create index if not exists idx_organizer_invites_email_lower on organizer_invites (lower(email));

-- ============================================================
-- SEED TEAMS
-- ============================================================

insert into org_teams (name, sort_order) values
  ('Logistics', 1),
  ('Product', 2),
  ('Development', 3),
  ('Corporate Relations', 4),
  ('Safety', 5),
  ('Volunteer', 6)
on conflict (name) do nothing;
-- RocketHacks Organizer Portal
-- Migration 021: RLS + rewrite staff helpers to organizer_profiles
-- Run AFTER 020.

-- ============================================================
-- STAFF HELPERS (source of truth: organizer_profiles)
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    exists (
      select 1 from organizer_profiles
      where user_id = auth.uid()
        and role = 'admin'
    ),
    false
  );
$$;

create or replace function public.is_organizer_or_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    exists (
      select 1 from organizer_profiles
      where user_id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.get_user_role(user_uuid uuid)
returns text
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_role text;
begin
  select role::text into v_role
  from organizer_profiles
  where user_id = user_uuid;

  if found then
    return v_role;
  end if;

  return 'participant';
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_organizer_or_admin() to authenticated;
grant execute on function public.get_user_role(uuid) to authenticated;

-- ============================================================
-- ORGANIZER PROFILES RLS
-- ============================================================

alter table organizer_profiles enable row level security;

create policy "organizer_profiles_select_own_or_staff"
  on organizer_profiles for select
  using (user_id = auth.uid() or is_organizer_or_admin());

create policy "organizer_profiles_update_own_limited"
  on organizer_profiles for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and role = (select op.role from organizer_profiles op where op.user_id = auth.uid())
  );

create policy "organizer_profiles_admin_all"
  on organizer_profiles for all
  using (is_admin())
  with check (is_admin());

-- Freeze role / user_id for non-admins (defense in depth)
create or replace function public.enforce_organizer_profile_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'Cannot change organizer user_id';
  end if;

  if new.role is distinct from old.role then
    raise exception 'Cannot change own organizer role';
  end if;

  if new.email is distinct from old.email then
    raise exception 'Cannot change organizer email';
  end if;

  return new;
end;
$$;

create trigger trg_organizer_profiles_limits
  before update on organizer_profiles
  for each row execute function public.enforce_organizer_profile_limits();

-- ============================================================
-- ORG TEAMS / MEMBERSHIPS RLS
-- ============================================================

alter table org_teams enable row level security;

create policy "org_teams_select_staff"
  on org_teams for select
  using (is_organizer_or_admin());

create policy "org_teams_admin_write"
  on org_teams for all
  using (is_admin())
  with check (is_admin());

alter table organizer_team_members enable row level security;

create policy "organizer_team_members_select_staff"
  on organizer_team_members for select
  using (is_organizer_or_admin());

create policy "organizer_team_members_admin_write"
  on organizer_team_members for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- ORGANIZER INVITES RLS (admin only)
-- ============================================================

alter table organizer_invites enable row level security;

create policy "organizer_invites_admin_only"
  on organizer_invites for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- APPLICANTS RLS CLEANUP
-- Drop overlapping / insecure policies, rebuild clean set.
-- Privilege columns (status, checked_in*) guarded by trigger until role dropped.
-- ============================================================

drop policy if exists "Admins can view all applications" on public.applicants;
drop policy if exists "Organizers can view all applications" on public.applicants;
drop policy if exists "Admins can update all applications" on public.applicants;
drop policy if exists "Admins can update any application" on public.applicants;
drop policy if exists "Organizers can update check-in status" on public.applicants;
drop policy if exists "Organizers can update check-in" on public.applicants;
drop policy if exists "Users can view applications" on public.applicants;
drop policy if exists "Users can update applications" on public.applicants;
drop policy if exists "Users can view their own application" on public.applicants;
drop policy if exists "Users can update their own application" on public.applicants;
drop policy if exists "Users can create their own application" on public.applicants;
drop policy if exists "select_own_or_admin" on public.applicants;
drop policy if exists "update_own_or_admin" on public.applicants;
drop policy if exists "insert_own_application" on public.applicants;
drop policy if exists "delete_own_application" on public.applicants;

create policy "applicants_select_own_or_staff"
  on public.applicants for select
  to authenticated
  using (auth.uid() = user_id or public.is_organizer_or_admin());

create policy "applicants_insert_own"
  on public.applicants for insert
  to authenticated
  with check (
    auth.uid() = user_id
    -- Staff accounts cannot create hacker applications
    and not public.is_organizer_or_admin()
  );

create policy "applicants_update_own_profile"
  on public.applicants for update
  to authenticated
  using (auth.uid() = user_id and not public.is_organizer_or_admin())
  with check (auth.uid() = user_id and not public.is_organizer_or_admin());

create policy "applicants_admin_update"
  on public.applicants for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "applicants_organizer_checkin_update"
  on public.applicants for update
  to authenticated
  using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());

create policy "applicants_delete_own"
  on public.applicants for delete
  to authenticated
  using (auth.uid() = user_id and not public.is_organizer_or_admin());

-- Block participants from changing privilege columns on self-update
create or replace function public.enforce_applicant_self_update_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admins may change anything
  if public.is_admin() then
    return new;
  end if;

  -- Organizers may only touch check-in fields
  if public.is_organizer_or_admin() then
    if new.user_id is distinct from old.user_id
       or new.email is distinct from old.email
       or new.status is distinct from old.status
       or (to_jsonb(new) - 'checked_in' - 'checked_in_at' - 'checked_in_by' - 'updated_at')
          is distinct from
          (to_jsonb(old) - 'checked_in' - 'checked_in_at' - 'checked_in_by' - 'updated_at')
    then
      -- Allow only check-in related diffs for organizers who aren't admins
      if new.status is distinct from old.status
         or new.role is distinct from old.role
         or new.user_id is distinct from old.user_id
      then
        raise exception 'Organizers may only update check-in fields';
      end if;
    end if;
    return new;
  end if;

  -- Participants: freeze privilege columns
  if new.role is distinct from old.role then
    raise exception 'Cannot change application role';
  end if;
  if new.status is distinct from old.status then
    raise exception 'Cannot change application status';
  end if;
  if new.checked_in is distinct from old.checked_in
     or new.checked_in_at is distinct from old.checked_in_at
     or new.checked_in_by is distinct from old.checked_in_by
  then
    raise exception 'Cannot change check-in fields';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'Cannot change application user_id';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_applicant_self_update_limits on public.applicants;
create trigger trg_applicant_self_update_limits
  before update on public.applicants
  for each row execute function public.enforce_applicant_self_update_limits();
-- RocketHacks Organizer Portal
-- Migration 022: Functions â€” redeem / request invite, updated_at
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
-- RocketHacks Organizer Portal
-- Migration 023: Pivot staff from applicants.role â†’ organizer_profiles, drop role column
-- Run AFTER 022. Requires is_admin() already reading organizer_profiles (021).

-- ============================================================
-- PIVOT existing admins/organizers
-- ============================================================

insert into organizer_profiles (user_id, email, full_name, role)
select
  user_id,
  email,
  nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''),
  case when role = 'admin' then 'admin'::organizer_role else 'organizer'::organizer_role end
from applicants
where role in ('admin', 'organizer')
on conflict (user_id) do update set
  email = excluded.email,
  full_name = coalesce(excluded.full_name, organizer_profiles.full_name),
  role = excluded.role,
  updated_at = now();

-- Exclusive staff: remove hacker applications for pivoted accounts
delete from applicants
where user_id in (select user_id from organizer_profiles);

-- ============================================================
-- DROP applicants.role (closes self-escalation hole)
-- ============================================================

-- Drop trigger body references to role after column drop â€” rewrite first
create or replace function public.enforce_applicant_self_update_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if public.is_organizer_or_admin() then
    if new.status is distinct from old.status
       or new.user_id is distinct from old.user_id
    then
      raise exception 'Organizers may only update check-in fields';
    end if;
    -- Ensure non-check-in columns unchanged (compare without check-in + updated_at)
    if (to_jsonb(new) - 'checked_in' - 'checked_in_at' - 'checked_in_by' - 'updated_at')
       is distinct from
       (to_jsonb(old) - 'checked_in' - 'checked_in_at' - 'checked_in_by' - 'updated_at')
    then
      raise exception 'Organizers may only update check-in fields';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    raise exception 'Cannot change application status';
  end if;
  if new.checked_in is distinct from old.checked_in
     or new.checked_in_at is distinct from old.checked_in_at
     or new.checked_in_by is distinct from old.checked_in_by
  then
    raise exception 'Cannot change check-in fields';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'Cannot change application user_id';
  end if;

  return new;
end;
$$;

alter table public.applicants drop constraint if exists valid_role;
drop index if exists idx_applicants_role;
alter table public.applicants drop column if exists role;
