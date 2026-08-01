-- RocketHacks Judging Portal
-- Migration 003: Trigger functions

-- ============================================================
-- AUTO CREATE PROFILE ON SIGNUP
-- Every new auth.users row gets a matching profiles row with
-- role = 'participant' by default. Role is escalated to judge
-- only through the invite redemption function below, never by
-- the client directly.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'participant'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function public.set_updated_at();

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function public.set_updated_at();

create trigger trg_scores_updated_at
  before update on scores
  for each row execute function public.set_updated_at();

-- ============================================================
-- REDEEM JUDGE INVITE
-- Called from the app with the invite code once a judge has
-- authenticated (via magic link or normal signup). Runs as
-- security definer so it can escalate the caller's own role
-- without granting the client a general profiles write policy
-- for role changes.
-- ============================================================

create or replace function public.redeem_judge_invite(p_invite_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite judge_invites%rowtype;
begin
  select * into v_invite
  from judge_invites
  where invite_code = p_invite_code
  and used = false
  and expires_at > now();

  if not found then
    raise exception 'Invalid or expired invite code';
  end if;

  if v_invite.email is distinct from (select email from auth.users where id = auth.uid()) then
    raise exception 'Invite code does not match the signed in account';
  end if;

  update profiles
  set role = v_invite.role
  where id = auth.uid();

  update judge_invites
  set used = true
  where id = v_invite.id;
end;
$$;

-- ============================================================
-- SYNC POINTS_VALUE FROM SELECTED BAND
-- Keeps scores.points_value denormalized for fast leaderboard
-- aggregation without a join on every read.
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

create trigger trg_sync_score_points
  before insert or update on scores
  for each row execute function public.sync_score_points();

-- ============================================================
-- AUDIT LOGGING
-- Applied to the tables where a dispute or recount is most
-- likely: scores and judge_assignments. Extend to other tables
-- the same way if needed.
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

create trigger trg_scores_audit
  after insert or update or delete on scores
  for each row execute function public.write_audit_log();

create trigger trg_assignments_audit
  after insert or update or delete on judge_assignments
  for each row execute function public.write_audit_log();
