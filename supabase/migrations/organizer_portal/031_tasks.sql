-- RocketHacks Organizer Portal
-- Migration 031: Cross-team task management
-- Tables: tasks, task_assignees, task_watchers, task_comments, task_labels, task_notifications
-- Also sets portal_key on all non-judging org_teams
-- Run AFTER 030.

-- ─── Portal keys for all non-judging teams ───────────────────────────────────

update org_teams set portal_key = 'logistics'           where name = 'Logistics'           and portal_key is null;
update org_teams set portal_key = 'product'             where name = 'Product'             and portal_key is null;
update org_teams set portal_key = 'development'         where name = 'Development'         and portal_key is null;
update org_teams set portal_key = 'corporate-relations' where name = 'Corporate Relations' and portal_key is null;
update org_teams set portal_key = 'safety'              where name = 'Safety'              and portal_key is null;
update org_teams set portal_key = 'volunteer'           where name = 'Volunteer'           and portal_key is null;

-- ─── Enums ───────────────────────────────────────────────────────────────────

do $$ begin
  create type task_priority as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status_enum as enum ('open', 'completed');
exception when duplicate_object then null; end $$;

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  module      text not null, -- matches org_teams.portal_key, e.g. 'logistics'
  creator_id  uuid not null references public.organizer_profiles (user_id) on delete cascade,
  deadline    timestamptz,
  priority    task_priority not null default 'medium',
  status      task_status_enum not null default 'open',
  completed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_tasks_module   on public.tasks (module);
create index if not exists idx_tasks_status   on public.tasks (status);
create index if not exists idx_tasks_creator  on public.tasks (creator_id);
create index if not exists idx_tasks_deadline on public.tasks (deadline);

-- task_assignees: who is responsible for the task
create table if not exists public.task_assignees (
  task_id      uuid not null references public.tasks (id) on delete cascade,
  organizer_id uuid not null references public.organizer_profiles (user_id) on delete cascade,
  assigned_at  timestamptz not null default now(),
  primary key (task_id, organizer_id)
);

-- task_watchers: who receives notifications
create table if not exists public.task_watchers (
  task_id      uuid not null references public.tasks (id) on delete cascade,
  organizer_id uuid not null references public.organizer_profiles (user_id) on delete cascade,
  added_at     timestamptz not null default now(),
  primary key (task_id, organizer_id)
);

-- task_comments: progress thread entries
create table if not exists public.task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks (id) on delete cascade,
  author_id  uuid not null references public.organizer_profiles (user_id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_task_comments_task on public.task_comments (task_id, created_at);

-- task_labels: color-coded priority/category tags
create table if not exists public.task_labels (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks (id) on delete cascade,
  label      text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_task_labels_task on public.task_labels (task_id);

-- task_notifications: in-portal notification inbox
create table if not exists public.task_notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  task_id    uuid not null references public.tasks (id) on delete cascade,
  type       text not null check (type in ('assigned', 'commented', 'completed', 'watching')),
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_task_notifications_user    on public.task_notifications (user_id, is_read);
create index if not exists idx_task_notifications_task    on public.task_notifications (task_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.tasks              enable row level security;
alter table public.task_assignees     enable row level security;
alter table public.task_watchers      enable row level security;
alter table public.task_comments      enable row level security;
alter table public.task_labels        enable row level security;
alter table public.task_notifications enable row level security;

-- tasks
create policy tasks_select on public.tasks for select using (public.is_organizer_or_admin());
create policy tasks_insert on public.tasks for insert with check (public.is_organizer_or_admin());
create policy tasks_update on public.tasks for update using (creator_id = auth.uid() or public.is_admin());
create policy tasks_delete on public.tasks for delete using (creator_id = auth.uid() or public.is_admin());

-- task_assignees
create policy task_assignees_select on public.task_assignees for select using (public.is_organizer_or_admin());
create policy task_assignees_insert on public.task_assignees for insert with check (
  public.is_admin()
  or exists (select 1 from public.tasks where id = task_id and creator_id = auth.uid())
);
create policy task_assignees_delete on public.task_assignees for delete using (
  public.is_admin()
  or exists (select 1 from public.tasks where id = task_id and creator_id = auth.uid())
);

-- task_watchers (self-managed + admin)
create policy task_watchers_select on public.task_watchers for select using (public.is_organizer_or_admin());
create policy task_watchers_insert on public.task_watchers for insert with check (
  organizer_id = auth.uid() or public.is_admin()
);
create policy task_watchers_delete on public.task_watchers for delete using (
  organizer_id = auth.uid() or public.is_admin()
);

-- task_comments
create policy task_comments_select on public.task_comments for select using (public.is_organizer_or_admin());
create policy task_comments_insert on public.task_comments for insert with check (public.is_organizer_or_admin());
create policy task_comments_delete on public.task_comments for delete using (
  author_id = auth.uid() or public.is_admin()
);

-- task_labels
create policy task_labels_select on public.task_labels for select using (public.is_organizer_or_admin());
create policy task_labels_insert on public.task_labels for insert with check (
  public.is_admin()
  or exists (select 1 from public.tasks where id = task_id and creator_id = auth.uid())
);
create policy task_labels_delete on public.task_labels for delete using (
  public.is_admin()
  or exists (select 1 from public.tasks where id = task_id and creator_id = auth.uid())
);

-- task_notifications (own only)
create policy task_notifications_select on public.task_notifications for select using (user_id = auth.uid());
create policy task_notifications_update on public.task_notifications for update using (user_id = auth.uid());

-- ─── Trigger functions ────────────────────────────────────────────────────────

-- updated_at
create or replace function public.set_task_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace trigger trg_task_updated_at
  before update on public.tasks
  for each row execute function public.set_task_updated_at();

-- When a task is created: auto-watch the creator
create or replace function public.task_after_create()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.task_watchers (task_id, organizer_id)
  values (NEW.id, NEW.creator_id)
  on conflict do nothing;
  return NEW;
end;
$$;

create or replace trigger trg_task_after_create
  after insert on public.tasks
  for each row execute function public.task_after_create();

-- When an assignee is added: auto-watch them + notify
create or replace function public.task_assignee_after_add()
returns trigger language plpgsql security definer
set search_path = public as $$
declare v_user_id uuid;
begin
  -- Auto-watch
  insert into public.task_watchers (task_id, organizer_id)
  values (NEW.task_id, NEW.organizer_id)
  on conflict do nothing;

  -- Notify (look up auth.users via organizer_profiles)
  select user_id into v_user_id
  from public.organizer_profiles
  where user_id = NEW.organizer_id;

  if v_user_id is not null and v_user_id <> (select creator_id from public.tasks where id = NEW.task_id) then
    insert into public.task_notifications (user_id, task_id, type)
    values (v_user_id, NEW.task_id, 'assigned');
  end if;

  return NEW;
end;
$$;

create or replace trigger trg_task_assignee_after_add
  after insert on public.task_assignees
  for each row execute function public.task_assignee_after_add();

-- When a comment is added: notify all watchers (except the commenter)
create or replace function public.task_comment_after_add()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.task_notifications (user_id, task_id, type)
  select tw.organizer_id, NEW.task_id, 'commented'
  from public.task_watchers tw
  where tw.task_id = NEW.task_id
    and tw.organizer_id <> NEW.author_id
  on conflict do nothing;

  return NEW;
end;
$$;

create or replace trigger trg_task_comment_after_add
  after insert on public.task_comments
  for each row execute function public.task_comment_after_add();

-- When a task is completed: notify all watchers (except the one who completed it)
create or replace function public.task_after_complete()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if OLD.status <> 'completed' and NEW.status = 'completed' then
    insert into public.task_notifications (user_id, task_id, type)
    select tw.organizer_id, NEW.id, 'completed'
    from public.task_watchers tw
    where tw.task_id = NEW.id
      and tw.organizer_id <> auth.uid()
    on conflict do nothing;
  end if;
  return NEW;
end;
$$;

create or replace trigger trg_task_after_complete
  after update on public.tasks
  for each row execute function public.task_after_complete();

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Enable Realtime for live comment updates and notification badge

alter publication supabase_realtime add table public.task_comments;
alter publication supabase_realtime add table public.task_notifications;
