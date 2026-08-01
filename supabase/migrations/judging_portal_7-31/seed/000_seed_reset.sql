-- RocketHacks Judging Portal — SEED RESET
-- Run this BEFORE a test round and AFTER you are done.
--
-- SCOPE: judging tables only.
--   * public.applicants is never read for writes, never updated, never deleted.
--   * auth.users rows are only deleted when the email ends in @seed.rockethacks.test
--     AND that user has no applicants row.
--   * Judge accounts you activated through the real UI are KEPT (their assignments
--     and scores are cleared). To remove one entirely, use the commented block at
--     the bottom or delete the user in Supabase Dashboard > Authentication.
--
-- Order matters: scores/assignments are audited, so audit_log is cleared last.

begin;

-- Before/after sanity number. This must not change.
do $$
begin
  raise notice 'applicants rows before reset: %', (select count(*) from public.applicants);
end $$;

-- 1. Judging activity
delete from public.top3_picks;
delete from public.scores;
delete from public.judge_assignments;

-- 2. Imported project data
delete from public.project_team_members;
delete from public.project_sponsor_tracks;
delete from public.project_tags;
delete from public.projects;

-- 3. Rubrics (criteria_items and criteria_bands cascade)
delete from public.criteria_sets;

-- 4. Taxonomy and judge↔track links (judge_tracks arrives with migration 014)
delete from public.judge_tags;
delete from public.tags;
do $$
begin
  if to_regclass('public.judge_tracks') is not null then
    delete from public.judge_tracks;
  end if;
end $$;

-- 5. Seed judges only (real activated judges are left alone)
delete from public.judge_profiles
where email ilike '%@seed.rockethacks.test';

delete from auth.users u
where u.email ilike '%@seed.rockethacks.test'
  and not exists (select 1 from public.applicants a where a.user_id = u.id);

-- 6. Invites and tracks
delete from public.judge_invites;
delete from public.tracks;

-- Reset the shared timing knobs when migration 014 is present.
do $$
begin
  if to_regclass('public.judging_settings') is not null then
    update public.judging_settings
    set transition_seconds = 60,
        window_minutes = 60,
        window_max_minutes = 90,
        default_visit_seconds = 360,
        updated_at = now()
    where id = true;
  end if;
end $$;

-- 7. Audit trail last, so the deletes above do not repopulate it
delete from public.audit_log;

commit;

-- Verification: applicants unchanged, everything else zero.
select
  (select count(*) from public.applicants)        as applicants_must_be_318,
  (select count(*) from public.tracks)            as tracks,
  (select count(*) from public.criteria_sets)     as criteria_sets,
  (select count(*) from public.projects)          as projects,
  (select count(*) from public.judge_profiles)    as judges_remaining,
  (select count(*) from public.judge_assignments) as assignments,
  (select count(*) from public.scores)            as scores,
  (select count(*) from public.top3_picks)        as top3_picks,
  (select count(*) from public.judge_invites)     as invites,
  (select count(*) from public.audit_log)         as audit_rows;

-- Optional: fully remove a judge account you activated through the UI.
-- Replace the email, then run. Applicant accounts are protected by the guard.
--
-- delete from public.judge_profiles where email = 'you+judge@example.com';
-- delete from auth.users u
--  where u.email = 'you+judge@example.com'
--    and not exists (select 1 from public.applicants a where a.user_id = u.id);
