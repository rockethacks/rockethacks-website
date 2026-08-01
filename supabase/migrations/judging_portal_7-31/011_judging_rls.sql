-- RocketHacks Judging Portal
-- Migration 011: Row Level Security (new tables only)
-- Run AFTER 010_judging_schema.sql, BEFORE 012_judging_functions.sql.
--
-- Safety: Does NOT alter applicants policies or rewrite public.is_admin().
-- Adds is_judging_admin() / is_judge() that compose existing is_admin().

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Existing public.is_admin() reads applicants.role = 'admin' — leave it alone.
-- Judging admin = RocketHacks admin OR head_judge on judge_profiles.
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
      select 1 from judge_profiles
      where user_id = auth.uid()
      and role = 'head_judge'
    ),
    false
  );
$$;

create or replace function public.is_judge()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    public.is_judging_admin()
    or exists (
      select 1 from judge_profiles
      where user_id = auth.uid()
    ),
    false
  );
$$;

grant execute on function public.is_judging_admin() to authenticated;
grant execute on function public.is_judge() to authenticated;

-- ============================================================
-- JUDGE PROFILES
-- ============================================================

alter table judge_profiles enable row level security;

create policy "judge_profiles_select_own_or_admin"
  on judge_profiles for select
  using (user_id = auth.uid() or is_judging_admin());

create policy "judge_profiles_update_own_limited"
  on judge_profiles for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    -- judges cannot escalate their own role
    and role = (select jp.role from judge_profiles jp where jp.user_id = auth.uid())
  );

create policy "judge_profiles_admin_full_write"
  on judge_profiles for all
  using (is_judging_admin())
  with check (is_judging_admin());

-- ============================================================
-- TAGS / JUDGE_TAGS / PROJECT_TAGS
-- ============================================================

alter table tags enable row level security;
alter table judge_tags enable row level security;
alter table project_tags enable row level security;

create policy "tags_select_authenticated"
  on tags for select
  using (auth.role() = 'authenticated');

create policy "tags_admin_write"
  on tags for all
  using (is_judging_admin())
  with check (is_judging_admin());

create policy "judge_tags_select"
  on judge_tags for select
  using (judge_id = auth.uid() or is_judging_admin());

create policy "judge_tags_admin_write"
  on judge_tags for all
  using (is_judging_admin())
  with check (is_judging_admin());

create policy "project_tags_select_judge_or_admin"
  on project_tags for select
  using (
    is_judging_admin()
    or exists (
      select 1 from judge_assignments ja
      where ja.project_id = project_tags.project_id
      and ja.judge_id = auth.uid()
    )
  );

create policy "project_tags_admin_write"
  on project_tags for all
  using (is_judging_admin())
  with check (is_judging_admin());

-- ============================================================
-- TRACKS
-- ============================================================

alter table tracks enable row level security;

create policy "tracks_select_authenticated"
  on tracks for select
  using (auth.role() = 'authenticated');

create policy "tracks_admin_write"
  on tracks for all
  using (is_judging_admin())
  with check (is_judging_admin());

-- ============================================================
-- CRITERIA SETS / ITEMS / BANDS
-- ============================================================

alter table criteria_sets enable row level security;
alter table criteria_items enable row level security;
alter table criteria_bands enable row level security;

create policy "criteria_sets_select_authenticated"
  on criteria_sets for select
  using (auth.role() = 'authenticated');

create policy "criteria_sets_admin_write"
  on criteria_sets for all
  using (is_judging_admin())
  with check (is_judging_admin());

create policy "criteria_items_select_authenticated"
  on criteria_items for select
  using (auth.role() = 'authenticated');

create policy "criteria_items_admin_write"
  on criteria_items for all
  using (is_judging_admin())
  with check (is_judging_admin());

create policy "criteria_bands_select_authenticated"
  on criteria_bands for select
  using (auth.role() = 'authenticated');

create policy "criteria_bands_admin_write"
  on criteria_bands for all
  using (is_judging_admin())
  with check (is_judging_admin());

-- ============================================================
-- PROJECTS / SPONSOR TRACKS / TEAM MEMBERS
-- ============================================================

alter table projects enable row level security;
alter table project_sponsor_tracks enable row level security;
alter table project_team_members enable row level security;

create policy "projects_select_assigned_or_admin"
  on projects for select
  using (
    is_judging_admin()
    or exists (
      select 1 from judge_assignments ja
      where ja.project_id = projects.id
      and ja.judge_id = auth.uid()
    )
  );

create policy "projects_admin_write"
  on projects for all
  using (is_judging_admin())
  with check (is_judging_admin());

create policy "project_sponsor_tracks_select"
  on project_sponsor_tracks for select
  using (
    is_judging_admin()
    or exists (
      select 1 from judge_assignments ja
      where ja.project_id = project_sponsor_tracks.project_id
      and ja.judge_id = auth.uid()
    )
  );

create policy "project_sponsor_tracks_admin_write"
  on project_sponsor_tracks for all
  using (is_judging_admin())
  with check (is_judging_admin());

create policy "project_team_members_select"
  on project_team_members for select
  using (
    is_judging_admin()
    or exists (
      select 1 from judge_assignments ja
      where ja.project_id = project_team_members.project_id
      and ja.judge_id = auth.uid()
    )
  );

create policy "project_team_members_admin_write"
  on project_team_members for all
  using (is_judging_admin())
  with check (is_judging_admin());

-- ============================================================
-- JUDGE ASSIGNMENTS
-- ============================================================

alter table judge_assignments enable row level security;

create policy "assignments_select_own_or_admin"
  on judge_assignments for select
  using (judge_id = auth.uid() or is_judging_admin());

create policy "assignments_judge_update_own_status"
  on judge_assignments for update
  using (judge_id = auth.uid())
  with check (
    judge_id = auth.uid()
    and project_id = (select project_id from judge_assignments a2 where a2.id = judge_assignments.id)
    and judge_id = (select judge_id from judge_assignments a2 where a2.id = judge_assignments.id)
    and track_context_id = (select track_context_id from judge_assignments a2 where a2.id = judge_assignments.id)
  );

create policy "assignments_admin_write"
  on judge_assignments for all
  using (is_judging_admin())
  with check (is_judging_admin());

-- ============================================================
-- SCORES
-- ============================================================

alter table scores enable row level security;

create policy "scores_select_own_assignment_or_admin"
  on scores for select
  using (
    is_judging_admin()
    or exists (
      select 1 from judge_assignments ja
      where ja.id = scores.assignment_id
      and ja.judge_id = auth.uid()
    )
  );

create policy "scores_judge_write_own_assignment"
  on scores for insert
  with check (
    exists (
      select 1 from judge_assignments ja
      where ja.id = scores.assignment_id
      and ja.judge_id = auth.uid()
      and ja.status <> 'submitted'
    )
  );

create policy "scores_judge_update_own_assignment"
  on scores for update
  using (
    exists (
      select 1 from judge_assignments ja
      where ja.id = scores.assignment_id
      and ja.judge_id = auth.uid()
      and ja.status <> 'submitted'
    )
  )
  with check (
    exists (
      select 1 from judge_assignments ja
      where ja.id = scores.assignment_id
      and ja.judge_id = auth.uid()
    )
  );

create policy "scores_admin_write"
  on scores for all
  using (is_judging_admin())
  with check (is_judging_admin());

-- ============================================================
-- TOP3 PICKS
-- ============================================================

alter table top3_picks enable row level security;

create policy "top3_select_own_or_admin"
  on top3_picks for select
  using (judge_id = auth.uid() or is_judging_admin());

create policy "top3_judge_write_own"
  on top3_picks for insert
  with check (judge_id = auth.uid());

create policy "top3_judge_update_own"
  on top3_picks for update
  using (judge_id = auth.uid())
  with check (judge_id = auth.uid());

create policy "top3_judge_delete_own"
  on top3_picks for delete
  using (judge_id = auth.uid());

create policy "top3_admin_write"
  on top3_picks for all
  using (is_judging_admin())
  with check (is_judging_admin());

-- ============================================================
-- JUDGE INVITES
-- ============================================================

alter table judge_invites enable row level security;

create policy "judge_invites_admin_only"
  on judge_invites for all
  using (is_judging_admin())
  with check (is_judging_admin());

-- ============================================================
-- AUDIT LOG
-- ============================================================

alter table audit_log enable row level security;

create policy "audit_log_admin_select"
  on audit_log for select
  using (is_judging_admin());
