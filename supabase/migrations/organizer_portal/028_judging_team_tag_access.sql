-- RocketHacks Organizer Portal
-- Migration 028: Judging org-team tag also grants judging portal access
-- (role = judging_team OR membership on org_teams.name = 'Judging')
-- Run AFTER 025+.

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
      select 1
      from organizer_team_members otm
      join org_teams t on t.id = otm.team_id
      where otm.organizer_id = auth.uid()
        and t.name = 'Judging'
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
