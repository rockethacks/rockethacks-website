-- RocketHacks Organizer Portal
-- Migration 025: Wire judging_team into is_judging_admin()
-- Run AFTER 024 has been committed (separate SQL Editor run).

create or replace function public.is_judging_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    public.is_admin()
    or exists (
      select 1 from organizer_profiles
      where user_id = auth.uid()
        and role = 'judging_team'
    )
    or exists (
      select 1 from judge_profiles
      where user_id = auth.uid()
        and role = 'head_judge'
    ),
    false
  );
$$;

grant execute on function public.is_judging_admin() to authenticated;
