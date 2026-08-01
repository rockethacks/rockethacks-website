-- RocketHacks Judging Portal
-- Migration 015: persist judges_per_project + layered plan builder
-- Run AFTER 014.
--
-- Why this exists:
--  1. judges_per_project was UI-only and reset to 3 on reload; preview could
--     disagree with the input after settings changed.
--  2. The old planner filled each project to depth before moving on (alpha
--     order), so late titles starved when capacity was tight.
--  3. Judge ranking now balances minute load first, then affinity.

-- ============================================================
-- SETTINGS
-- ============================================================

alter table judging_settings
  add column if not exists judges_per_project int not null default 3;

alter table judging_settings
  drop constraint if exists judging_settings_judges_per_project_check;

alter table judging_settings
  add constraint judging_settings_judges_per_project_check
  check (judges_per_project >= 1);

-- ============================================================
-- PLAN BUILDER (layered coverage)
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
  v_layer int;
  v_max_needed int;
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

  create temporary table if not exists tmp_projects (
    project_id uuid primary key,
    title text not null,
    visit_seconds int not null,
    open_tracks uuid[] not null,
    needed int not null,
    placed int not null default 0
  ) on commit drop;
  truncate tmp_projects;

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

  -- Candidate tables for unrestricted rubrics.
  insert into tmp_projects (project_id, title, visit_seconds, open_tracks, needed)
  select p.id,
         p.title,
         public.project_visit_seconds(p.id),
         array(
           select t.id
           from tracks t
           where t.is_active
             and not t.sponsor_judges_only
             and (
               t.id = p.main_track_id
               or t.id in (select pst.track_id from project_sponsor_tracks pst where pst.project_id = p.id)
             )
         ),
         coalesce((
           select max(coalesce(t.judges_per_project, p_judges_per_project))
           from tracks t
           where t.is_active
             and not t.sponsor_judges_only
             and (
               t.id = p.main_track_id
               or t.id in (select pst.track_id from project_sponsor_tracks pst where pst.project_id = p.id)
             )
         ), p_judges_per_project)
  from projects p
  where p.status = 'submitted';

  delete from tmp_projects
  where open_tracks is null
     or array_length(open_tracks, 1) is null
     or needed < 1;

  select coalesce(max(needed), 0) into v_max_needed from tmp_projects;

  -- ---------- Pass 1: layered draws (1st judge for everyone, then 2nd, …) ----------
  for v_layer in 1..v_max_needed loop
    for v_project in
      select tp.project_id,
             tp.visit_seconds,
             tp.open_tracks,
             tp.needed,
             tp.placed,
             (
               select count(*)::int
               from tmp_load jl
               where not exists (
                       select 1 from tmp_plan x
                       where x.judge_id = jl.judge_id and x.project_id = tp.project_id
                     )
                 and not exists (
                       select 1 from judge_assignments ja
                       where ja.judge_id = jl.judge_id and ja.project_id = tp.project_id
                     )
                 and not exists (
                       select 1
                       from project_team_members ptm
                       join judge_profiles jp on jp.user_id = jl.judge_id
                       where ptm.project_id = tp.project_id
                         and lower(ptm.email) = lower(jp.email)
                     )
                 and jl.seconds + tp.visit_seconds <= p_window_seconds
             ) as eligible
      from tmp_projects tp
      where tp.needed >= v_layer
        and tp.placed = v_layer - 1
      order by eligible asc, tp.visit_seconds desc, tp.title
    loop
      -- One judge per project in this layer (Nth judge only after N-1 succeeded).
      select jl.judge_id,
             public.judge_project_affinity(jl.judge_id, v_project.project_id) as affinity
        into v_judge
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
        and jl.seconds + v_project.visit_seconds <= p_window_seconds
      order by jl.seconds asc,
               jl.visits asc,
               public.judge_project_affinity(jl.judge_id, v_project.project_id) desc,
               jl.judge_id
      limit 1;

      if found then
        insert into tmp_plan (judge_id, project_id, track_ids, visit_seconds, affinity)
        values (
          v_judge.judge_id,
          v_project.project_id,
          v_project.open_tracks,
          v_project.visit_seconds,
          v_judge.affinity
        );

        update tmp_load
        set visits = tmp_load.visits + 1,
            seconds = tmp_load.seconds + v_project.visit_seconds
        where tmp_load.judge_id = v_judge.judge_id;

        update tmp_projects
        set placed = tmp_projects.placed + 1
        where tmp_projects.project_id = v_project.project_id;
      end if;
    end loop;
  end loop;

  insert into tmp_short (project_id, reason)
  select tp.project_id,
         format(
           '%s of %s judges placed — no one left with room in the window',
           tp.placed,
           tp.needed
         )
  from tmp_projects tp
  where tp.placed < tp.needed;

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
      order by jl.seconds asc, jl.visits asc, affinity desc, jl.judge_id
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
