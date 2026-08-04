-- RocketHacks Organizer Portal
-- Migration 030: org_teams.portal_key — team membership unlocks staff portal tabs
-- Judging access: portal_key = 'judging' (plus legacy role/name checks)
-- Run AFTER 028+.

alter table org_teams
  add column if not exists portal_key text;

create unique index if not exists idx_org_teams_portal_key
  on org_teams (portal_key)
  where portal_key is not null;

update org_teams
set portal_key = 'judging'
where name = 'Judging'
  and (portal_key is null or portal_key is distinct from 'judging');

-- True if current user may open a staff portal module keyed by p_key
-- (e.g. 'judging'). Admin always allowed. Legacy judging_team role and
-- name = 'Judging' kept until all rows use portal_key.
create or replace function public.has_org_portal(p_key text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    public.is_admin()
    or exists (
      select 1
      from organizer_team_members otm
      join org_teams t on t.id = otm.team_id
      where otm.organizer_id = auth.uid()
        and t.portal_key = lower(trim(p_key))
    )
    or (
      lower(trim(p_key)) = 'judging'
      and (
        exists (
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
      )
    ),
    false
  );
$$;

revoke all on function public.has_org_portal(text) from public;
grant execute on function public.has_org_portal(text) to authenticated;

create or replace function public.is_judging_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    public.has_org_portal('judging')
    or exists (
      select 1 from judge_profiles
      where user_id = auth.uid()
        and role = 'head_judge'
    ),
    false
  );
$$;

grant execute on function public.is_judging_admin() to authenticated;
