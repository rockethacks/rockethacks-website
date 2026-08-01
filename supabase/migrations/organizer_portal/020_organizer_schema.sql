-- RocketHacks Organizer Portal
-- Migration 020: Core schema (additive — does NOT yet drop applicants.role)
-- Idempotent: safe to re-run if a previous attempt partially/fully succeeded.
--
-- Staff RBAC lives here, exclusive from applicants (mirrors judge_profiles).

-- ============================================================
-- ENUM
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'organizer_role') then
    create type organizer_role as enum ('organizer', 'judging_team', 'admin');
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
  ('Volunteer', 6),
  ('Judging', 7)
on conflict (name) do nothing;
