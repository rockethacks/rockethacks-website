-- 033_task_mention_notifications.sql
-- Adds 'mentioned' notification type and a trigger to fire it when
-- a comment contains @[Full Name] tags.
-- Run AFTER 032.

-- ─── Extend the type check constraint ────────────────────────────────────────

alter table public.task_notifications
  drop constraint if exists task_notifications_type_check;

alter table public.task_notifications
  add constraint task_notifications_type_check
  check (type in ('assigned', 'commented', 'completed', 'watching', 'mentioned'));

-- ─── Trigger: notify mentioned users on comment insert ────────────────────────

create or replace function public.notify_mentions_on_comment()
returns trigger language plpgsql security definer as $$
declare
  v_mention text;
  v_user_id uuid;
begin
  for v_mention in
    select (regexp_matches(NEW.content, '@\[([^\]]+)\]', 'g'))[1]
  loop
    select user_id into v_user_id
    from public.organizer_profiles
    where full_name = v_mention
    limit 1;

    if v_user_id is not null and v_user_id <> NEW.author_id then
      insert into public.task_notifications (user_id, task_id, type)
      values (v_user_id, NEW.task_id, 'mentioned')
      on conflict do nothing;
    end if;
  end loop;

  return NEW;
end;
$$;

drop trigger if exists notify_mentions_after_comment on public.task_comments;

create trigger notify_mentions_after_comment
  after insert on public.task_comments
  for each row execute function public.notify_mentions_on_comment();
