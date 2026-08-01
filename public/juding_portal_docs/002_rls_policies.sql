-- RocketHacks Judging Portal
-- Migration 002: Row Level Security
-- Every table gets RLS enabled with an explicit default deny.
-- Client code should never use the service role key. All access
-- goes through these policies using the anon/authenticated roles.

-- ============================================================
-- HELPER FUNCTIONS
-- security definer so they can read profiles.role without
-- recursively hitting the profiles RLS policy being evaluated.
-- ============================================================

create or replace function public.current_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role from profiles where id = auth.uid()) in ('admin', 'head_judge'), false);
$$;

create or replace function public.is_judge()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role from profiles where id = auth.uid()) in ('admin', 'head_judge', 'judge'), false);
$$;

-- ============================================================
-- PROFILES
-- ============================================================

alter table profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on profiles for select
  using (id = auth.uid() or is_admin());

create policy "profiles_update_own_limited"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_full_write"
  on profiles for all
  using (is_admin())
  with check (is_admin());

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
  using (is_admin())
  with check (is_admin());

create policy "judge_tags_select"
  on judge_tags for select
  using (judge_id = auth.uid() or is_admin());

create policy "judge_tags_admin_write"
  on judge_tags for all
  using (is_admin())
  with check (is_admin());

create policy "project_tags_select_judge_or_admin"
  on project_tags for select
  using (
    is_admin()
    or exists (
      select 1 from judge_assignments ja
      where ja.project_id = project_tags.project_id
      and ja.judge_id = auth.uid()
    )
  );

create policy "project_tags_admin_write"
  on project_tags for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- TRACKS
-- ============================================================

alter table tracks enable row level security;

create policy "tracks_select_authenticated"
  on tracks for select
  using (auth.role() = 'authenticated');

create policy "tracks_admin_write"
  on tracks for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- CRITERIA SETS / ITEMS / BANDS
-- Judges need read access to render the scoring form.
-- ============================================================

alter table criteria_sets enable row level security;
alter table criteria_items enable row level security;
alter table criteria_bands enable row level security;

create policy "criteria_sets_select_authenticated"
  on criteria_sets for select
  using (auth.role() = 'authenticated');

create policy "criteria_sets_admin_write"
  on criteria_sets for all
  using (is_admin())
  with check (is_admin());

create policy "criteria_items_select_authenticated"
  on criteria_items for select
  using (auth.role() = 'authenticated');

create policy "criteria_items_admin_write"
  on criteria_items for all
  using (is_admin())
  with check (is_admin());

create policy "criteria_bands_select_authenticated"
  on criteria_bands for select
  using (auth.role() = 'authenticated');

create policy "criteria_bands_admin_write"
  on criteria_bands for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- PROJECTS / PROJECT_SPONSOR_TRACKS / PROJECT_TEAM_MEMBERS
-- Judges may only see projects they are assigned to. Admins see
-- everything. No client ever writes projects directly, imports
-- go through a server side function using the service role.
-- ============================================================

alter table projects enable row level security;
alter table project_sponsor_tracks enable row level security;
alter table project_team_members enable row level security;

create policy "projects_select_assigned_or_admin"
  on projects for select
  using (
    is_admin()
    or exists (
      select 1 from judge_assignments ja
      where ja.project_id = projects.id
      and ja.judge_id = auth.uid()
    )
  );

create policy "projects_admin_write"
  on projects for all
  using (is_admin())
  with check (is_admin());

create policy "project_sponsor_tracks_select"
  on project_sponsor_tracks for select
  using (
    is_admin()
    or exists (
      select 1 from judge_assignments ja
      where ja.project_id = project_sponsor_tracks.project_id
      and ja.judge_id = auth.uid()
    )
  );

create policy "project_sponsor_tracks_admin_write"
  on project_sponsor_tracks for all
  using (is_admin())
  with check (is_admin());

create policy "project_team_members_select"
  on project_team_members for select
  using (
    is_admin()
    or exists (
      select 1 from judge_assignments ja
      where ja.project_id = project_team_members.project_id
      and ja.judge_id = auth.uid()
    )
  );

create policy "project_team_members_admin_write"
  on project_team_members for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- JUDGE ASSIGNMENTS
-- Judges see and update only their own rows, and only the
-- progress fields, never who the assignment belongs to.
-- ============================================================

alter table judge_assignments enable row level security;

create policy "assignments_select_own_or_admin"
  on judge_assignments for select
  using (judge_id = auth.uid() or is_admin());

create policy "assignments_judge_update_own_status"
  on judge_assignments for update
  using (judge_id = auth.uid())
  with check (
    judge_id = auth.uid()
    -- judges cannot repoint an assignment to a different project or judge
    and project_id = (select project_id from judge_assignments a2 where a2.id = judge_assignments.id)
    and judge_id = (select judge_id from judge_assignments a2 where a2.id = judge_assignments.id)
  );

create policy "assignments_admin_write"
  on judge_assignments for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- SCORES
-- A judge may only write scores tied to their own assignment.
-- ============================================================

alter table scores enable row level security;

create policy "scores_select_own_assignment_or_admin"
  on scores for select
  using (
    is_admin()
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
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- TOP3 PICKS
-- ============================================================

alter table top3_picks enable row level security;

create policy "top3_select_own_or_admin"
  on top3_picks for select
  using (judge_id = auth.uid() or is_admin());

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
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- JUDGE INVITES
-- Admin only. Redemption happens through a server side function
-- (security definer) so the anon role never needs direct access.
-- ============================================================

alter table judge_invites enable row level security;

create policy "judge_invites_admin_only"
  on judge_invites for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- AUDIT LOG
-- Read only for admins, no client insert path. Rows are written
-- exclusively by the trigger functions in 003 (security definer).
-- ============================================================

alter table audit_log enable row level security;

create policy "audit_log_admin_select"
  on audit_log for select
  using (is_admin());
