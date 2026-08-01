-- RocketHacks Judging Portal
-- Migration 012: Functions and triggers
-- Run AFTER 010 and 011.
--
-- Safety: No handle_new_user / profiles signup trigger (would fight applicants flow).
-- redeem_judge_invite writes judge_profiles only — never applicants.

-- ============================================================
-- UPDATED_AT MAINTENANCE
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_judge_profiles_updated_at on judge_profiles;
create trigger trg_judge_profiles_updated_at
  before update on judge_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on projects;
create trigger trg_projects_updated_at
  before update on projects
  for each row execute function public.set_updated_at();

drop trigger if exists trg_scores_updated_at on scores;
create trigger trg_scores_updated_at
  before update on scores
  for each row execute function public.set_updated_at();

-- ============================================================
-- REDEEM JUDGE INVITE
-- Upserts judge_profiles from invite metadata; never touches applicants.
-- ============================================================

create or replace function public.redeem_judge_invite(p_invite_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite judge_invites%rowtype;
  v_email text;
  v_full_name text;
begin
  if auth.uid() is null then
    raise exception 'Must be authenticated to redeem an invite';
  end if;

  select email, raw_user_meta_data ->> 'full_name'
  into v_email, v_full_name
  from auth.users
  where id = auth.uid();

  select * into v_invite
  from judge_invites
  where invite_code = p_invite_code
  and used = false
  and expires_at > now();

  if not found then
    raise exception 'Invalid or expired invite code';
  end if;

  if lower(v_invite.email) is distinct from lower(v_email) then
    raise exception 'Invite code does not match the signed in account';
  end if;

  insert into judge_profiles (
    user_id,
    email,
    full_name,
    role,
    industry,
    job_title,
    company
  )
  values (
    auth.uid(),
    v_email,
    coalesce(v_invite.full_name, v_full_name),
    v_invite.role,
    v_invite.industry,
    v_invite.job_title,
    v_invite.company
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, judge_profiles.full_name),
    role = excluded.role,
    industry = coalesce(excluded.industry, judge_profiles.industry),
    job_title = coalesce(excluded.job_title, judge_profiles.job_title),
    company = coalesce(excluded.company, judge_profiles.company),
    updated_at = now();

  update judge_invites
  set used = true
  where id = v_invite.id;
end;
$$;

grant execute on function public.redeem_judge_invite(text) to authenticated;

-- ============================================================
-- SYNC POINTS_VALUE FROM SELECTED BAND
-- ============================================================

create or replace function public.sync_score_points()
returns trigger
language plpgsql
as $$
begin
  if new.band_id is not null then
    select points into new.points_value from criteria_bands where id = new.band_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_score_points on scores;
create trigger trg_sync_score_points
  before insert or update on scores
  for each row execute function public.sync_score_points();

-- ============================================================
-- AUDIT LOGGING
-- ============================================================

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  values (
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    lower(TG_OP),
    auth.uid(),
    case when TG_OP = 'DELETE' then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_scores_audit on scores;
create trigger trg_scores_audit
  after insert or update or delete on scores
  for each row execute function public.write_audit_log();

drop trigger if exists trg_assignments_audit on judge_assignments;
create trigger trg_assignments_audit
  after insert or update or delete on judge_assignments
  for each row execute function public.write_audit_log();

-- ============================================================
-- ASSIGNMENT AUTO-SUGGEST (preview; admin commits separately)
-- Even coverage, load balance, soft tag affinity, hard COI blocks.
-- ============================================================

create or replace function public.suggest_judge_assignments(
  p_track_context_id uuid,
  p_judges_per_project int default 3
)
returns table (
  judge_id uuid,
  project_id uuid,
  track_context_id uuid,
  affinity_score int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project record;
  v_judge record;
  v_needed int;
  v_assigned int;
begin
  if not public.is_judging_admin() then
    raise exception 'Only judging admins can run assignment suggestions';
  end if;

  if p_judges_per_project < 1 then
    raise exception 'judges_per_project must be >= 1';
  end if;

  -- Temp load counters
  create temporary table if not exists tmp_judge_load (
    judge_id uuid primary key,
    load_count int not null default 0
  ) on commit drop;

  truncate tmp_judge_load;

  insert into tmp_judge_load (judge_id, load_count)
  select jp.user_id, 0
  from judge_profiles jp
  where jp.role in ('judge', 'head_judge');

  if not exists (select 1 from tmp_judge_load) then
    return;
  end if;

  for v_project in
    select p.id as project_id
    from projects p
    where p.status = 'submitted'
      and (
        p.main_track_id = p_track_context_id
        or exists (
          select 1 from project_sponsor_tracks pst
          where pst.project_id = p.id and pst.track_id = p_track_context_id
        )
      )
    order by p.title
  loop
    v_needed := p_judges_per_project;
    v_assigned := 0;

    for v_judge in
      select
        jl.judge_id,
        jl.load_count,
        (
          select count(*)::int
          from judge_tags jt
          join project_tags pt on pt.tag_id = jt.tag_id
          where jt.judge_id = jl.judge_id
            and pt.project_id = v_project.project_id
        ) as affinity
      from tmp_judge_load jl
      where not exists (
        -- already assigned this project+track
        select 1 from judge_assignments ja
        where ja.judge_id = jl.judge_id
          and ja.project_id = v_project.project_id
          and ja.track_context_id = p_track_context_id
      )
      and not exists (
        -- conflict: judge email matches a team member
        select 1
        from project_team_members ptm
        join judge_profiles jp on jp.user_id = jl.judge_id
        where ptm.project_id = v_project.project_id
          and lower(ptm.email) = lower(jp.email)
      )
      order by jl.load_count asc, affinity desc, jl.judge_id
    loop
      exit when v_assigned >= v_needed;

      judge_id := v_judge.judge_id;
      project_id := v_project.project_id;
      track_context_id := p_track_context_id;
      affinity_score := v_judge.affinity;
      return next;

      update tmp_judge_load
      set load_count = load_count + 1
      where tmp_judge_load.judge_id = v_judge.judge_id;

      v_assigned := v_assigned + 1;
    end loop;
  end loop;
end;
$$;

grant execute on function public.suggest_judge_assignments(uuid, int) to authenticated;
