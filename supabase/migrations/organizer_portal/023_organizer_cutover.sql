-- RocketHacks Organizer Portal
-- Migration 023: Pivot staff from applicants.role → organizer_profiles, drop role column
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

-- Drop trigger body references to role after column drop — rewrite first
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
