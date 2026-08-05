import { createClient } from '@/lib/supabase/client'
import type { Task, TaskComment, TaskAssignee, TaskLabel, OrganizerOption } from '@/types/tasks'

const db = () => createClient()

export async function fetchTasks(module?: string | string[] | null): Promise<Task[]> {
  const supabase = db()

  let q = supabase
    .from('tasks')
    .select(`
      *,
      creator:organizer_profiles!creator_id(full_name, email),
      assignees:task_assignees(organizer_id, organizer_profiles(full_name, email)),
      labels:task_labels(id, task_id, label),
      comment_count:task_comments(count)
    `)
    .order('deadline', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (Array.isArray(module)) {
    if (module.length === 0) return []
    q = q.in('module', module)
  } else if (module) {
    q = q.eq('module', module)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  return (data ?? []).map((row: Record<string, unknown>) => {
    const assignees = ((row.assignees as Array<{ organizer_id: string; organizer_profiles: { full_name: string | null; email: string } | null }>) ?? []).map((a) => ({
      organizer_id: a.organizer_id,
      full_name: a.organizer_profiles?.full_name ?? null,
      email: a.organizer_profiles?.email ?? '',
    })) as TaskAssignee[]

    const commentCountArr = row.comment_count as Array<{ count: number }> | null
    const comment_count = commentCountArr?.[0]?.count ?? 0

    const creatorRaw = row.creator as { full_name: string | null; email: string } | null

    return {
      ...(row as unknown as Task),
      creator: creatorRaw ?? undefined,
      assignees,
      labels: (row.labels as TaskLabel[]) ?? [],
      comment_count,
    }
  })
}

export async function createTask(data: {
  title: string
  description?: string
  module: string
  deadline?: string
  priority: string
  assigneeIds: string[]
  labels: string[]
}): Promise<Task> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title: data.title,
      description: data.description || null,
      module: data.module,
      deadline: data.deadline || null,
      priority: data.priority,
      creator_id: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await Promise.all([
    data.assigneeIds.length > 0
      ? supabase.from('task_assignees').insert(data.assigneeIds.map((id) => ({ task_id: task.id, organizer_id: id }))).then()
      : Promise.resolve(),
    data.labels.length > 0
      ? supabase.from('task_labels').insert(data.labels.map((label) => ({ task_id: task.id, label }))).then()
      : Promise.resolve(),
  ])
  return task as Task
}

export async function updateTask(
  id: string,
  data: Partial<{ title: string; description: string; module: string; deadline: string; priority: string; assigneeIds: string[]; labels: string[] }>
): Promise<void> {
  const supabase = db()
  const updates: Record<string, unknown> = {}
  if (data.title !== undefined) updates.title = data.title
  if (data.description !== undefined) updates.description = data.description || null
  if (data.module !== undefined) updates.module = data.module
  if (data.deadline !== undefined) updates.deadline = data.deadline || null
  if (data.priority !== undefined) updates.priority = data.priority

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id)
    if (error) throw new Error(error.message)
  }

  if (data.assigneeIds !== undefined) {
    await supabase.from('task_assignees').delete().eq('task_id', id)
    if (data.assigneeIds.length > 0) {
      await supabase.from('task_assignees').insert(
        data.assigneeIds.map((organizer_id) => ({ task_id: id, organizer_id }))
      )
    }
  }

  if (data.labels !== undefined) {
    await supabase.from('task_labels').delete().eq('task_id', id)
    if (data.labels.length > 0) {
      await supabase.from('task_labels').insert(
        data.labels.map((label) => ({ task_id: id, label }))
      )
    }
  }
}

export async function completeTask(id: string): Promise<void> {
  const supabase = db()
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reopenTask(id: string): Promise<void> {
  const supabase = db()
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'open', completed_at: null })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = db()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchComments(taskId: string): Promise<TaskComment[]> {
  const supabase = db()
  const { data, error } = await supabase
    .from('task_comments')
    .select('*, author:organizer_profiles!author_id(full_name, email)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as TaskComment[]
}

export async function addComment(taskId: string, content: string): Promise<TaskComment> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, author_id: user.id, content })
    .select('*, author:organizer_profiles!author_id(full_name, email)')
    .single()
  if (error) throw new Error(error.message)
  return data as TaskComment
}

export async function remindAssignees(taskId: string, message?: string): Promise<void> {
  const res = await fetch('/api/admin/tasks/remind', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, message: message?.trim() || null }),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error((json as { error?: string }).error ?? 'Failed to send reminder')
  }
}

export async function fetchMentionedTaskIds(): Promise<Set<string>> {
  const supabase = db()
  const { data } = await supabase
    .from('task_notifications')
    .select('task_id')
    .eq('type', 'mentioned')
    .eq('is_read', false)
  return new Set((data ?? []).map((r: { task_id: string }) => r.task_id))
}

export async function fetchUnreadCount(): Promise<number> {
  const supabase = db()
  const { count, error } = await supabase
    .from('task_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
  if (error) return 0
  return count ?? 0
}

export async function markNotificationsRead(taskId: string): Promise<void> {
  const supabase = db()
  await supabase
    .from('task_notifications')
    .update({ is_read: true })
    .eq('task_id', taskId)
    .eq('is_read', false)
}

export async function isWatching(taskId: string, organizerId: string): Promise<boolean> {
  const supabase = db()
  const { data } = await supabase
    .from('task_watchers')
    .select('task_id')
    .eq('task_id', taskId)
    .eq('organizer_id', organizerId)
    .maybeSingle()
  return !!data
}

export async function watchTask(taskId: string): Promise<void> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('task_watchers').upsert({ task_id: taskId, organizer_id: user.id })
}

export async function unwatchTask(taskId: string): Promise<void> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('task_watchers').delete().eq('task_id', taskId).eq('organizer_id', user.id)
}

export async function fetchOrganizers(): Promise<OrganizerOption[]> {
  const supabase = db()
  const { data, error } = await supabase
    .from('organizer_profiles')
    .select('user_id, full_name, email')
    .order('full_name')
  if (error) throw new Error(error.message)
  return (data ?? []) as OrganizerOption[]
}
