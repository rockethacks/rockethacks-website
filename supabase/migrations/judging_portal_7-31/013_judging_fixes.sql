-- RocketHacks Judging Portal
-- Migration 013: Onboarding + assignment integrity fixes
-- Run AFTER 010, 011, 012.
--
-- Why this exists:
--  1. Judges are external people with no hacker account. The app needs to verify
--     an invite BEFORE sending a magic link, without exposing judge_invites to anon.
--  2. The original judge UPDATE policy used self-referencing subqueries. Replaced
--     with a simple policy + a trigger that enforces field immutability and the
--     submit lock, which is easier to reason about and cheaper to evaluate.
--
-- Safety: judging objects only. No changes to applicants.

-- ============================================================
-- INVITE PRE-CHECK
-- Returns true only when the email AND code match an unused,
-- unexpired invite. Requires both values, so it is not an
-- enumeration path for judge emails.
-- ============================================================

create or replace function public.request_judge_access(
  p_email text,
  p_invite_code text
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from judge_invites
    where lower(email) = lower(trim(p_email))
      and invite_code = upper(trim(p_invite_code))
      and used = false
      and expires_at > now()
  );
$$;

grant execute on function public.request_judge_access(text, text) to anon;
grant execute on function public.request_judge_access(text, text) to authenticated;

-- ============================================================
-- ASSIGNMENT INTEGRITY
-- Judges may only move their own assignment forward. They can
-- never repoint it to another judge/project/track, and they can
-- never reopen a submitted assignment (admins still can).
-- ============================================================

create or replace function public.enforce_assignment_judge_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_judging_admin() then
    return new;
  end if;

  if new.judge_id is distinct from old.judge_id
     or new.project_id is distinct from old.project_id
     or new.track_context_id is distinct from old.track_context_id then
    raise exception 'Judges cannot reassign an assignment';
  end if;

  if old.status = 'submitted' and new.status is distinct from 'submitted' then
    raise exception 'Submitted assignments can only be reopened by an organizer';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_assignment_judge_limits on judge_assignments;
create trigger trg_assignment_judge_limits
  before update on judge_assignments
  for each row execute function public.enforce_assignment_judge_limits();

drop policy if exists "assignments_judge_update_own_status" on judge_assignments;

create policy "assignments_judge_update_own_status"
  on judge_assignments for update
  using (judge_id = auth.uid())
  with check (judge_id = auth.uid());
