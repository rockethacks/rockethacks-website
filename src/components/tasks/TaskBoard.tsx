'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { fetchTasks, fetchMentionedTaskIds } from '@/lib/tasks/api'
import type { Task, TaskPriority } from '@/types/tasks'
import { TaskDetailPanel } from './TaskDetailPanel'
import { CreateTaskModal } from './CreateTaskModal'

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
}

const PRIORITY_ORDER: TaskPriority[] = ['critical', 'high', 'medium', 'low']

function formatModuleLabel(key: string): string {
  return key.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

function TaskRow({ task, showModule, dimmed, onClick }: { task: Task; showModule: boolean; dimmed?: boolean; onClick: () => void }) {
  const assignees = task.assignees ?? []
  const visible = assignees.slice(0, 3)
  const overflow = assignees.length - 3
  const overdue = task.deadline ? new Date(task.deadline) < new Date() : false

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition text-left ${dimmed ? 'opacity-55' : ''}`}
    >
      <span className="shrink-0 rounded-full" style={{ width: 8, height: 8, backgroundColor: PRIORITY_COLORS[task.priority] }} title={task.priority} />

      <span className="flex-1 min-w-0 text-sm text-white truncate">{task.title}</span>

      {task.is_mentioned && (
        <span
          className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/25 text-blue-400 text-[10px] font-bold leading-none"
          title="You were mentioned in this task"
        >
          @
        </span>
      )}

      {showModule && (
        <span className="shrink-0 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-xs font-medium">
          {formatModuleLabel(task.module)}
        </span>
      )}

      {visible.length > 0 && (
        <span className="shrink-0 flex items-center">
          {visible.map((a, i) => (
            <span
              key={a.organizer_id}
              title={a.full_name ?? a.email}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-[9px] font-bold border border-[#0a1628]"
              style={{ width: 24, height: 24, marginLeft: i === 0 ? 0 : -4, zIndex: visible.length - i, position: 'relative' }}
            >
              {getInitials(a.full_name, a.email)}
            </span>
          ))}
          {overflow > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-white/10 text-gray-300 text-[9px] font-bold border border-[#0a1628]" style={{ width: 24, height: 24, marginLeft: -4, position: 'relative', zIndex: 0 }}>
              +{overflow}
            </span>
          )}
        </span>
      )}

      {task.deadline && (
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded font-medium ${overdue ? 'bg-red-500/20 text-red-300 font-bold' : 'bg-white/10 text-gray-400'}`}>
          {overdue ? 'Overdue' : new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}

      {typeof task.comment_count === 'number' && task.comment_count > 0 && (
        <span className="shrink-0 flex items-center gap-1 text-xs text-gray-500">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3l2 2 2-2h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
          </svg>
          <span>{task.comment_count}</span>
        </span>
      )}
    </button>
  )
}

// ─── TaskBoard ────────────────────────────────────────────────────────────────

export function TaskBoard({ module, modules, isAdmin }: { module: string | null; modules?: string[]; isAdmin: boolean }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | null>(null)
  const [myTasksOnly, setMyTasksOnly] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [completedOpen, setCompletedOpen] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id)
    })
  }, [])

  // Stable key for the modules array so useCallback doesn't fire on every render
  const modulesKey = modules?.join(',')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetchArg = modules ?? module
      const [fetched, mentionedIds] = await Promise.all([
        fetchTasks(fetchArg),
        fetchMentionedTaskIds(),
      ])
      setTasks(fetched.map((t) => ({ ...t, is_mentioned: mentionedIds.has(t.id) })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, modulesKey])

  useEffect(() => { load() }, [load])

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (priorityFilter && t.priority !== priorityFilter) return false
    if (myTasksOnly && !(t.assignees ?? []).some((a) => a.organizer_id === currentUserId)) return false
    return true
  })

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, is_mentioned: false } : t))
  }

  const active = filtered.filter((t) => t.status === 'open')
  const completed = filtered.filter((t) => t.status === 'completed')
  const title = module ? `${formatModuleLabel(module)} Tasks` : 'All Tasks'
  const showModule = module === null || modules !== undefined
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition shrink-0"
        >
          + New Task
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] max-w-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <button
          type="button"
          onClick={() => setMyTasksOnly((v) => !v)}
          disabled={!currentUserId}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border shrink-0 disabled:opacity-50 ${myTasksOnly ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-transparent text-gray-400 border-white/10 hover:bg-white/10'}`}
        >
          View My Tasks
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPriorityFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${priorityFilter === null ? 'bg-white/20 text-white border-white/20' : 'bg-transparent text-gray-400 border-white/10 hover:bg-white/10'}`}
          >
            All
          </button>
          {PRIORITY_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(priorityFilter === p ? null : p)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition border"
              style={
                priorityFilter === p
                  ? { backgroundColor: PRIORITY_COLORS[p] + '33', borderColor: PRIORITY_COLORS[p] + '66', color: PRIORITY_COLORS[p] }
                  : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }
              }
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">{error}</div>
      )}

      {loading && <div className="py-12 text-center text-gray-400 text-sm">Loading tasks…</div>}

      {!loading && !error && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {/* Active tasks */}
          <div>
            <div className="px-4 py-2.5 border-b border-white/5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Tasks ({active.length})</span>
            </div>
            {active.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">{search || priorityFilter ? 'No tasks match your filters.' : 'No active tasks.'}</p>
              </div>
            ) : (
              active.map((task) => (
                <TaskRow key={task.id} task={task} showModule={showModule} onClick={() => handleSelectTask(task.id)} />
              ))
            )}
          </div>

          {/* Completed tasks */}
          {completed.length > 0 && (
            <div className="border-t border-white/10">
              <button
                type="button"
                onClick={() => setCompletedOpen((o) => !o)}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 transition text-left"
              >
                <span className="text-gray-500 text-xs">{completedOpen ? '▼' : '▶'}</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed ({completed.length})</span>
              </button>
              {completedOpen && completed.map((task) => (
                <TaskRow key={task.id} task={task} showModule={showModule} dimmed onClick={() => handleSelectTask(task.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task detail panel */}
      <AnimatePresence>
        {selectedTask && currentUserId && (
          <TaskDetailPanel
            key={selectedTask.id}
            task={selectedTask}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onClose={() => setSelectedTaskId(null)}
            onUpdated={load}
            onEdit={() => { setEditingTask(selectedTask); setSelectedTaskId(null) }}
          />
        )}
      </AnimatePresence>

      {/* Create modal */}
      {showCreate && (
        <CreateTaskModal
          defaultModule={module ?? undefined}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load() }}
        />
      )}

      {/* Edit modal */}
      {editingTask && (
        <CreateTaskModal
          taskToEdit={editingTask}
          defaultModule={editingTask.module}
          onClose={() => setEditingTask(null)}
          onCreated={() => { setEditingTask(null); load() }}
        />
      )}
    </div>
  )
}
