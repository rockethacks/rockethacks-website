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
