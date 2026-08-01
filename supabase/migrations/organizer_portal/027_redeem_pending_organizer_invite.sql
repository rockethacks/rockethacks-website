-- RocketHacks Organizer Portal
-- Migration 027: Auto-redeem pending staff invite for the signed-in email
-- (used after email confirmation / password login when org_code was lost)
-- Run AFTER 026.

create or replace function public.redeem_pending_organizer_invite()
returns boolean
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

  if v_email is null then
    return false;
  end if;

  -- Already staff
  if exists (select 1 from organizer_profiles where user_id = auth.uid()) then
    return true;
  end if;

  select * into v_invite
  from organizer_invites
  where lower(email) = lower(v_email)
    and used = false
    and expires_at > now()
  order by created_at desc
  limit 1;

  if not found then
    return false;
  end if;

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

  return true;
end;
$$;

revoke all on function public.redeem_pending_organizer_invite() from public;
grant execute on function public.redeem_pending_organizer_invite() to authenticated;
