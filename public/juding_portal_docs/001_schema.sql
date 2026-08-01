-- RocketHacks Judging Portal
-- Migration 001: Core schema (enums, tables, indexes)
-- Run this in the Supabase SQL editor or via the CLI in order: 001, 002, 003

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('admin', 'head_judge', 'judge', 'participant');
create type track_type as enum ('in_house', 'sponsor');
create type criteria_type as enum ('eligibility', 'scored');
create type project_status as enum ('submitted', 'no_show', 'disqualified');
create type assignment_status as enum ('assigned', 'in_progress', 'submitted');

-- ============================================================
-- PROFILES
-- Extends auth.users. Created automatically via trigger in 003.
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'participant',
  industry text,
  job_title text,
  company text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on profiles(role);

-- ============================================================
-- TAGS (shared taxonomy for judges and projects)
-- ============================================================

create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text, -- e.g. 'industry', 'tech', 'expertise'
  created_at timestamptz not null default now()
);

create table judge_tags (
  judge_id uuid not null references profiles(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (judge_id, tag_id)
);

-- ============================================================
-- TRACKS
-- The 4 in-house tracks and every sponsor track are rows here.
-- ============================================================

create table tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type track_type not null,
  sponsor_name text, -- null for in_house tracks
  timer_seconds int not null default 300,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CRITERIA SETS / ITEMS / BANDS
-- One shared criteria_set for all 4 in-house tracks (track_id is
-- null, applies_to = 'in_house_shared'). Each sponsor track gets
-- its own criteria_set (track_id set, applies_to = 'sponsor').
-- ============================================================

create table criteria_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  applies_to text not null check (applies_to in ('in_house_shared', 'sponsor')),
  track_id uuid references tracks(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint sponsor_set_needs_track check (
    (applies_to = 'sponsor' and track_id is not null) or
    (applies_to = 'in_house_shared' and track_id is null)
  )
);

create table criteria_items (
  id uuid primary key default gen_random_uuid(),
  criteria_set_id uuid not null references criteria_sets(id) on delete cascade,
  type criteria_type not null,
  title text not null,
  description text,
  max_points int, -- null for eligibility items
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint scored_needs_max_points check (
    (type = 'scored' and max_points is not null) or
    (type = 'eligibility' and max_points is null)
  )
);

create table criteria_bands (
  id uuid primary key default gen_random_uuid(),
  criteria_item_id uuid not null references criteria_items(id) on delete cascade,
  label text not null, -- e.g. 'Underachieving', 'Proficient'
  points int not null,
  description text,
  sort_order int not null default 0
);

-- ============================================================
-- PROJECTS (imported from Devpost CSV)
-- ============================================================

create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  submission_url text not null unique, -- import dedupe key
  about text,
  video_url text,
  github_url text,
  table_number text,
  main_track_id uuid references tracks(id),
  status project_status not null default 'submitted',
  submitted_at timestamptz,
  imported_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_main_track on projects(main_track_id);
create index idx_projects_status on projects(status);

create table project_tags (
  project_id uuid not null references projects(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (project_id, tag_id)
);

create table project_sponsor_tracks (
  project_id uuid not null references projects(id) on delete cascade,
  track_id uuid not null references tracks(id) on delete cascade,
  primary key (project_id, track_id)
);

create table project_team_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  is_submitter boolean not null default false
);

create index idx_team_members_project on project_team_members(project_id);
create index idx_team_members_email on project_team_members(email);

-- ============================================================
-- JUDGE ASSIGNMENTS
-- track_context_id is the track this specific assignment scores
-- against, either a project's main_track_id or a sponsor track.
-- A project can have multiple assignment rows per judge if it is
-- judged on both the main rubric and a sponsor rubric.
-- ============================================================

create table judge_assignments (
  id uuid primary key default gen_random_uuid(),
  judge_id uuid not null references profiles(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  track_context_id uuid not null references tracks(id),
  status assignment_status not null default 'assigned',
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,
  unique (judge_id, project_id, track_context_id)
);

create index idx_assignments_judge on judge_assignments(judge_id);
create index idx_assignments_project on judge_assignments(project_id);
create index idx_assignments_track_context on judge_assignments(track_context_id);

-- ============================================================
-- SCORES
-- One row per criteria item per assignment.
-- ============================================================

create table scores (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references judge_assignments(id) on delete cascade,
  criteria_item_id uuid not null references criteria_items(id) on delete cascade,
  eligibility_value boolean, -- for eligibility type items
  band_id uuid references criteria_bands(id), -- for scored type items
  points_value int, -- denormalized copy of the band's points, for fast aggregation
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, criteria_item_id)
);

create index idx_scores_assignment on scores(assignment_id);

-- ============================================================
-- TOP 3 PICKS
-- Confirmed by a judge after finishing their assigned list.
-- ============================================================

create table top3_picks (
  id uuid primary key default gen_random_uuid(),
  judge_id uuid not null references profiles(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  rank int not null check (rank between 1 and 3),
  created_at timestamptz not null default now(),
  unique (judge_id, rank),
  unique (judge_id, project_id)
);

-- ============================================================
-- JUDGE INVITES
-- Admin pre-creates a judge record and an invite code so judges
-- do not go through the normal participant registration flow.
-- ============================================================

create table judge_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invite_code text not null unique,
  role user_role not null default 'judge',
  used boolean not null default false,
  expires_at timestamptz not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- AUDIT LOG
-- Populated by triggers in 003, never written to directly by
-- the client.
-- ============================================================

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null, -- insert, update, delete
  changed_by uuid references profiles(id),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_log_table_record on audit_log(table_name, record_id);
