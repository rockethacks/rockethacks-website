-- RocketHacks Judging Portal
-- Migration 014: visit-based judging plan
-- Run AFTER 010–013.
--
-- Why this exists:
--  A judge standing at one table scores every rubric that table qualifies for.
--  Costing that as one sheet per track over-counted the day badly: 372 sheets
--  looked like 372 stops when the real number is one stop per judge per table.
--
--  A "visit" is judge_id + project_id. No change to judge_assignments is needed:
--  a visit is simply several rows sharing a judge and a project with different
--  track_context_id values.
--
-- Time model (flat per visit):
--   visit_seconds = max(timer_seconds of the rubrics at that table) + transition_seconds
--  Adding a second or fifth rubric to a visit costs nothing extra.
--
-- Safety: judging objects only. No changes to applicants.

-- ============================================================
-- SETTINGS (single row)
-- ============================================================

create table if not exists judging_settings (
  id boolean primary key default true,
  transition_seconds int not null default 60,
  window_minutes int not null default 60,
  window_max_minutes int not null default 90,
  default_visit_seconds int not null default 360,
  updated_at timestamptz not null default now(),
  constraint judging_settings_single_row check (id)
);

insert into judging_settings (id) values (true) on conflict (id) do nothing;

-- ============================================================
-- TRACK OPTIONS
--  sponsor_judges_only: this rubric may only be filled by judges linked to the
--                       track, so it cannot ride along on someone else's visit.
--  judges_per_project : per-track override of the plan-wide target.
-- ============================================================

alter table tracks add column if not exists sponsor_judges_only boolean not null default false;
alter table tracks add column if not exists judges_per_project int;

-- ============================================================
-- JUDGE ↔ TRACK LINKS
-- Hard filter for sponsor_judges_only tracks, soft affinity everywhere else.
-- ============================================================

create table if not exists judge_tracks (
  judge_id uuid not null references judge_profiles(user_id) on delete cascade,
  track_id uuid not null references tracks(id) on delete cascade,
  primary key (judge_id, track_id)
);

create index if not exists idx_judge_tracks_track on judge_tracks(track_id);

-- ============================================================
-- RLS
-- ============================================================

alter table judging_settings enable row level security;
alter table judge_tracks enable row level security;

drop policy if exists "judging_settings_select_authenticated" on judging_settings;
create policy "judging_settings_select_authenticated"
  on judging_settings for select
  using (auth.role() = 'authenticated');

drop policy if exists "judging_settings_admin_write" on judging_settings;
create policy "judging_settings_admin_write"
  on judging_settings for all
  using (is_judging_admin())
  with check (is_judging_admin());

drop policy if exists "judge_tracks_select_authenticated" on judge_tracks;
create policy "judge_tracks_select_authenticated"
  on judge_tracks for select
  using (auth.role() = 'authenticated');

drop policy if exists "judge_tracks_admin_write" on judge_tracks;
create policy "judge_tracks_admin_write"
  on judge_tracks for all
  using (is_judging_admin())
  with check (is_judging_admin());

-- ============================================================
-- VISIT LENGTH
-- Longest rubric at the table wins, plus one transition allowance.
-- ============================================================

create or replace function public.project_visit_seconds(p_project uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
           (
             select max(t.timer_seconds)
             from tracks t
             where t.id = (select p.main_track_id from projects p where p.id = p_project)
                or t.id in (select pst.track_id from project_sponsor_tracks pst where pst.project_id = p_project)
           ),
           (select s.default_visit_seconds from judging_settings s limit 1),
           360
         )
       + coalesce((select s.transition_seconds from judging_settings s limit 1), 60);
$$;

grant execute on function public.project_visit_seconds(uuid) to authenticated;

-- ============================================================
-- AFFINITY
-- Multi-signal so thin tags degrade to plain load balancing instead of noise.
--   +3 per shared tag        (best signal, needs good Built With data)
--   +2 industry ↔ main track (works with no project tags at all)
--   +4 sponsor link or company match on a sponsor track at that table
-- ============================================================

create or replace function public.judging_industry_matches(p_industry text, p_track_name text)
returns boolean
language sql
immutable
as $$
  select case
    when p_industry is null or p_track_name is null then false
    else exists (
      select 1
      from (values
        ('finance',        array['finance','fintech','banking','payment','investment','trading','financial','wealth']),
        ('healthcare',     array['health','medical','medicine','biotech','clinical','pharma','life science','care']),
        ('sustainability', array['sustainab','climate','energy','environment','green','cleantech','carbon','conservation']),
        ('hardware',       array['hardware','embedded','robotic','iot','firmware','electronic','device','manufactur','mechanical'])
      ) as m(track_key, words)
      where lower(p_track_name) like '%' || m.track_key || '%'
        and exists (select 1 from unnest(m.words) w where lower(p_industry) like '%' || w || '%')
    )
  end;
$$;

create or replace function public.judge_project_affinity(p_judge uuid, p_project uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select
      3 * coalesce((
        select count(*)
        from judge_tags jt
        join project_tags pt on pt.tag_id = jt.tag_id
        where jt.judge_id = p_judge and pt.project_id = p_project
      ), 0)::int
    + 2 * (case when exists (
        select 1
        from projects p
        join tracks t on t.id = p.main_track_id
        join judge_profiles jp on jp.user_id = p_judge
        where p.id = p_project
          and public.judging_industry_matches(jp.industry, t.name)
      ) then 1 else 0 end)
    + 4 * coalesce((
        select count(*)
        from project_sponsor_tracks pst
        join tracks t on t.id = pst.track_id
        join judge_profiles jp on jp.user_id = p_judge
        where pst.project_id = p_project
          and (
            exists (select 1 from judge_tracks jtk where jtk.judge_id = p_judge and jtk.track_id = t.id)
            or (jp.company is not null and t.sponsor_name is not null
                and lower(jp.company) = lower(t.sponsor_name))
          )
      ), 0)::int;
$$;

grant execute on function public.judge_project_affinity(uuid, uuid) to authenticated;

-- ============================================================
-- PLAN BUILDER
-- One draw per table instead of one draw per track.
--
-- Returns visit rows. A row with judge_id = null is a shortfall: coverage the
-- plan could not fill, with the reason in shortfall_reason.
-- ============================================================

create or replace function public.suggest_judging_plan(
  p_judges_per_project int default 3,
  p_window_seconds int default 3600
)
returns table (
  judge_id uuid,
  project_id uuid,
  track_ids uuid[],
  visit_seconds int,
  affinity_score int,
  shortfall_reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project record;
  v_judge record;
  v_restricted record;
  v_needed int;
  v_added int;
  v_visit int;
  v_open uuid[];
begin
  if not public.is_judging_admin() then
    raise exception 'Only judging admins can build a judging plan';
  end if;

  if p_judges_per_project < 1 then
    raise exception 'judges_per_project must be >= 1';
  end if;

  create temporary table if not exists tmp_plan (
    judge_id uuid not null,
    project_id uuid not null,
    track_ids uuid[] not null,
    visit_seconds int not null,
    affinity int not null default 0,
    primary key (judge_id, project_id)
  ) on commit drop;
  truncate tmp_plan;

  create temporary table if not exists tmp_load (
    judge_id uuid primary key,
    visits int not null default 0,
    seconds int not null default 0
  ) on commit drop;
  truncate tmp_load;

  create temporary table if not exists tmp_short (
    project_id uuid,
    reason text
  ) on commit drop;
  truncate tmp_short;

  -- Existing assignments already consume the judge's window.
  insert into tmp_load (judge_id, visits, seconds)
  select jp.user_id,
         coalesce(v.visits, 0),
         coalesce(v.seconds, 0)
  from judge_profiles jp
  left join (
    select d.judge_id,
           count(*)::int as visits,
           coalesce(sum(public.project_visit_seconds(d.project_id)), 0)::int as seconds
    from (select distinct ja.judge_id, ja.project_id from judge_assignments ja) d
    group by d.judge_id
  ) v on v.judge_id = jp.user_id;

  if not exists (select 1 from tmp_load) then
    return;
  end if;

  -- ---------- Pass 1: one draw per table for the unrestricted rubrics ----------
  for v_project in
    select p.id as project_id,
           public.project_visit_seconds(p.id) as visit_seconds,
           array(
             select t.id
             from tracks t
             where t.is_active
               and not t.sponsor_judges_only
               and (
                 t.id = p.main_track_id
                 or t.id in (select pst.track_id from project_sponsor_tracks pst where pst.project_id = p.id)
               )
           ) as open_tracks,
           coalesce((
             select max(coalesce(t.judges_per_project, p_judges_per_project))
             from tracks t
             where t.is_active
               and not t.sponsor_judges_only
               and (
                 t.id = p.main_track_id
                 or t.id in (select pst.track_id from project_sponsor_tracks pst where pst.project_id = p.id)
               )
           ), p_judges_per_project) as needed
    from projects p
    where p.status = 'submitted'
    order by p.title
  loop
    v_open := v_project.open_tracks;
    continue when v_open is null or array_length(v_open, 1) is null;

    v_needed := v_project.needed;
    v_visit := v_project.visit_seconds;
    v_added := 0;

    for v_judge in
      select jl.judge_id,
             jl.visits,
             jl.seconds,
             public.judge_project_affinity(jl.judge_id, v_project.project_id) as affinity
      from tmp_load jl
      where not exists (
              select 1 from tmp_plan tp
              where tp.judge_id = jl.judge_id and tp.project_id = v_project.project_id
            )
        and not exists (
              select 1 from judge_assignments ja
              where ja.judge_id = jl.judge_id and ja.project_id = v_project.project_id
            )
        and not exists (
              select 1
              from project_team_members ptm
              join judge_profiles jp on jp.user_id = jl.judge_id
              where ptm.project_id = v_project.project_id
                and lower(ptm.email) = lower(jp.email)
            )
        and jl.seconds + v_visit <= p_window_seconds
      order by jl.visits asc, affinity desc, jl.judge_id
    loop
      exit when v_added >= v_needed;

      insert into tmp_plan (judge_id, project_id, track_ids, visit_seconds, affinity)
      values (v_judge.judge_id, v_project.project_id, v_open, v_visit, v_judge.affinity);

      update tmp_load
      set visits = tmp_load.visits + 1,
          seconds = tmp_load.seconds + v_visit
      where tmp_load.judge_id = v_judge.judge_id;

      v_added := v_added + 1;
    end loop;

    if v_added < v_needed then
      insert into tmp_short (project_id, reason)
      values (
        v_project.project_id,
        format('%s of %s judges placed — no one left with room in the window', v_added, v_needed)
      );
    end if;
  end loop;

  -- ---------- Pass 2: restricted sponsor rubrics ----------
  for v_restricted in
    select t.id as track_id,
           t.name as track_name,
           pst.project_id,
           coalesce(t.judges_per_project, p_judges_per_project) as needed,
           public.project_visit_seconds(pst.project_id) as visit_seconds
    from project_sponsor_tracks pst
    join tracks t on t.id = pst.track_id
    join projects p on p.id = pst.project_id
    where t.is_active
      and t.sponsor_judges_only
      and p.status = 'submitted'
    order by t.name, pst.project_id
  loop
    v_needed := v_restricted.needed;
    v_added := 0;

    -- Judges already stopping at this table cost nothing extra.
    for v_judge in
      select tp.judge_id
      from tmp_plan tp
      join judge_tracks jtk on jtk.judge_id = tp.judge_id and jtk.track_id = v_restricted.track_id
      where tp.project_id = v_restricted.project_id
        and not (v_restricted.track_id = any (tp.track_ids))
      order by tp.judge_id
    loop
      exit when v_added >= v_needed;

      update tmp_plan
      set track_ids = array_append(tmp_plan.track_ids, v_restricted.track_id)
      where tmp_plan.judge_id = v_judge.judge_id
        and tmp_plan.project_id = v_restricted.project_id;

      v_added := v_added + 1;
    end loop;

    -- Anyone else linked to the track needs their own stop.
    for v_judge in
      select jl.judge_id,
             jl.visits,
             jl.seconds,
             public.judge_project_affinity(jl.judge_id, v_restricted.project_id) as affinity
      from tmp_load jl
      join judge_tracks jtk on jtk.judge_id = jl.judge_id and jtk.track_id = v_restricted.track_id
      where not exists (
              select 1 from tmp_plan tp
              where tp.judge_id = jl.judge_id and tp.project_id = v_restricted.project_id
            )
        and not exists (
              select 1 from judge_assignments ja
              where ja.judge_id = jl.judge_id
                and ja.project_id = v_restricted.project_id
                and ja.track_context_id = v_restricted.track_id
            )
        and not exists (
              select 1
              from project_team_members ptm
              join judge_profiles jp on jp.user_id = jl.judge_id
              where ptm.project_id = v_restricted.project_id
                and lower(ptm.email) = lower(jp.email)
            )
        and jl.seconds + v_restricted.visit_seconds <= p_window_seconds
      order by jl.visits asc, affinity desc, jl.judge_id
    loop
      exit when v_added >= v_needed;

      insert into tmp_plan (judge_id, project_id, track_ids, visit_seconds, affinity)
      values (
        v_judge.judge_id,
        v_restricted.project_id,
        array[v_restricted.track_id],
        v_restricted.visit_seconds,
        v_judge.affinity
      );

      update tmp_load
      set visits = tmp_load.visits + 1,
          seconds = tmp_load.seconds + v_restricted.visit_seconds
      where tmp_load.judge_id = v_judge.judge_id;

      v_added := v_added + 1;
    end loop;

    if v_added < v_needed then
      insert into tmp_short (project_id, reason)
      values (
        v_restricted.project_id,
        format('%s: %s of %s linked judges available', v_restricted.track_name, v_added, v_needed)
      );
    end if;
  end loop;

  return query
    select tp.judge_id, tp.project_id, tp.track_ids, tp.visit_seconds, tp.affinity, null::text
    from tmp_plan tp
    order by tp.judge_id, tp.project_id;

  return query
    select null::uuid, ts.project_id, null::uuid[], 0, 0, ts.reason
    from tmp_short ts;
end;
$$;

grant execute on function public.suggest_judging_plan(int, int) to authenticated;

-- ============================================================
-- VERIFICATION
-- ============================================================

-- select * from judging_settings;
-- select name, sponsor_judges_only, judges_per_project, timer_seconds from tracks order by sort_order;
-- select * from public.suggest_judging_plan(3, 3600);
