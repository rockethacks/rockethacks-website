-- RocketHacks Judging Portal — SEED: post-import helpers
--
-- Run the blocks in this file INDIVIDUALLY (highlight, then Run), in the order
-- the test plan calls for them. Each block is independent.
--
--   A. Table numbers      — fallback only (import auto-assigns blanks)
--   B. Conflict of interest — before testing auto-suggest
--   C. Simulated scoring   — after you have created assignments
--   D. Simulated top 3     — after block C
--   E. Verification        — any time
--
-- Only the 8 @seed.rockethacks.test judges are simulated. Assignments belonging
-- to a judge you activated through the UI are left untouched so you can score
-- them by hand. Applicant data is never read or written.

-- ============================================================
-- A. TABLE NUMBERS (fallback)
-- CSV Import now auto-assigns blank tables clustered by main track.
-- Keep this block for databases imported before that change, or if you
-- need to backfill nulls outside the UI. It only fills nulls (T01…).
-- Prefer Tables → "Reseat for short walks" after committing a plan.
-- ============================================================

with numbered as (
  select id, 'T' || lpad(row_number() over (order by title)::text, 2, '0') as table_number
  from projects
)
update projects p
set table_number = n.table_number
from numbered n
where n.id = p.id
  and p.table_number is null;

-- ============================================================
-- B. CONFLICT OF INTEREST
-- suggest_judge_assignments() blocks a judge whose email matches any team
-- member on the project. This plants one so you can prove the block works.
-- Note the project title it prints — Marcus Hall must never be suggested for it.
-- ============================================================

insert into project_team_members (project_id, first_name, last_name, email, is_submitter)
select p.id, 'Marcus', 'Hall', 'marcus.hall@seed.rockethacks.test', false
from projects p
where p.main_track_id is not null
order by p.title
limit 1;

select p.title as conflicted_project, m.email as conflicted_judge
from project_team_members m
join projects p on p.id = m.project_id
where m.email = 'marcus.hall@seed.rockethacks.test';

-- ============================================================
-- C. SIMULATED SCORING
-- Fills every criterion for every seed-judge assignment and marks it submitted.
-- Deterministic: the same assignment always gets the same band, so re-running
-- does not reshuffle the leaderboard. Roughly 1 in 12 eligibility answers is
-- NO, which is what lights up the "Eligibility not met" and "Judges disagree"
-- flags on the Results tab.
-- ============================================================

with target as (
  select a.id as assignment_id, a.track_context_id, t.type as track_type
  from judge_assignments a
  join judge_profiles jp on jp.user_id = a.judge_id
  join tracks t on t.id = a.track_context_id
  where jp.email ilike '%@seed.rockethacks.test'
    and a.status <> 'submitted'
),
rubric as (
  select tg.assignment_id, ci.id as criteria_item_id, ci.type
  from target tg
  join criteria_sets cs
    on (tg.track_type = 'in_house' and cs.applies_to = 'in_house_shared' and cs.track_id is null)
    or (tg.track_type = 'sponsor'  and cs.applies_to = 'sponsor'         and cs.track_id = tg.track_context_id)
  join criteria_items ci on ci.criteria_set_id = cs.id
)
insert into scores (assignment_id, criteria_item_id, eligibility_value, band_id)
select
  r.assignment_id,
  r.criteria_item_id,
  case when r.type = 'eligibility'
       then mod(abs(hashtext(r.assignment_id::text || r.criteria_item_id::text)::bigint), 12) > 0
       else null end,
  case when r.type = 'scored' then pick.id else null end
from rubric r
left join lateral (
  select b.id
  from criteria_bands b
  where b.criteria_item_id = r.criteria_item_id
  order by b.sort_order
  offset mod(
    abs(hashtext(r.assignment_id::text || r.criteria_item_id::text)::bigint),
    greatest((select count(*) from criteria_bands b2 where b2.criteria_item_id = r.criteria_item_id), 1)
  )
  limit 1
) pick on true
where r.type = 'eligibility' or pick.id is not null
on conflict (assignment_id, criteria_item_id) do nothing;

update judge_assignments a
set status = 'submitted',
    started_at = coalesce(a.started_at, now() - interval '12 minutes'),
    submitted_at = now()
from judge_profiles jp
where jp.user_id = a.judge_id
  and jp.email ilike '%@seed.rockethacks.test'
  and a.status <> 'submitted'
  and exists (select 1 from scores s where s.assignment_id = a.id);

-- ============================================================
-- D. SIMULATED TOP 3
-- Each seed judge nominates their three highest scoring main-track projects.
-- ============================================================

insert into top3_picks (judge_id, project_id, rank)
select judge_id, project_id, rn
from (
  select a.judge_id,
         a.project_id,
         row_number() over (
           partition by a.judge_id
           order by sum(coalesce(s.points_value, 0)) desc, a.project_id
         ) as rn
  from judge_assignments a
  join judge_profiles jp on jp.user_id = a.judge_id
  join tracks t on t.id = a.track_context_id and t.type = 'in_house'
  join scores s on s.assignment_id = a.id
  where jp.email ilike '%@seed.rockethacks.test'
    and a.status = 'submitted'
  group by a.judge_id, a.project_id
) ranked
where rn <= 3
on conflict do nothing;

-- ============================================================
-- E. VERIFICATION
-- ============================================================

-- Import health: how the CSV landed
select
  (select count(*) from projects)                                      as projects,
  (select count(*) from projects where main_track_id is not null)      as with_main_track,
  (select count(*) from projects where table_number is not null)       as with_table_number,
  (select count(*) from project_sponsor_tracks)                        as sponsor_optins,
  (select count(*) from project_team_members)                          as team_members,
  (select count(*) from project_tags)                                  as project_tag_links,
  (select count(*) from tags where category = 'tech')                  as tech_tags;

-- Coverage per track: every project should hit your judges-per-project target
select t.name,
       t.type,
       count(distinct p.id)  as projects,
       count(a.id)           as assignments,
       round(count(a.id)::numeric / nullif(count(distinct p.id), 0), 2) as judges_per_project,
       count(a.id) filter (where a.status = 'submitted') as submitted
from tracks t
left join projects p on p.main_track_id = t.id
left join judge_assignments a on a.track_context_id = t.id
group by t.name, t.type
order by t.type, t.name;

-- Load per judge
select jp.full_name,
       count(a.id)                                       as assigned,
       count(a.id) filter (where a.status = 'submitted') as submitted
from judge_profiles jp
left join judge_assignments a on a.judge_id = jp.user_id
group by jp.full_name
order by assigned desc, jp.full_name;

-- Leaderboard the Results tab should be showing for main tracks
select t.name as track,
       p.title,
       round(avg(x.total), 1) as avg_score,
       count(*)               as judges_scored
from judge_assignments a
join tracks t on t.id = a.track_context_id and t.type = 'in_house'
join projects p on p.id = a.project_id
join lateral (
  select sum(coalesce(s.points_value, 0)) as total
  from scores s where s.assignment_id = a.id
) x on true
where a.status = 'submitted'
group by t.name, p.title
order by t.name, avg_score desc;
