-- RocketHacks Organizer Portal
-- Migration 032: Restrict task comment posting to assignees + admin
-- Previously any organizer/admin could comment on any task; now only a
-- task's assignees and admins may post — everyone else has view-only access.
-- Run AFTER 031.

drop policy if exists task_comments_insert on public.task_comments;

create policy task_comments_insert on public.task_comments for insert with check (
  public.is_admin()
  or exists (
    select 1 from public.task_assignees
    where task_id = task_comments.task_id
      and organizer_id = auth.uid()
  )
);
