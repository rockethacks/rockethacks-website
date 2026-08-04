'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskComment } from '@/types/tasks'
import {
  fetchComments,
  addComment,
  completeTask,
  reopenTask,
  deleteTask,
  watchTask,
  unwatchTask,
  isWatching,
  markNotificationsRead,
  remindAssignees,
} from '@/lib/tasks/api'

// ─── Helpers ────────────────────────────────────────────────────────────────

const URL_RE = /https?:\/\/[^\s<>"]+/g

function linkify(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  URL_RE.lastIndex = 0
  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const url = match[0].replace(/[.,;:!?)]+$/, '')
    nodes.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 underline underline-offset-2 hover:text-blue-300 break-all transition-colors"
      >
        {url}
      </a>
    )
    last = match.index + url.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

function formatDeadline(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

function initials(fullName: string | null | undefined, email: string): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function displayName(fullName: string | null | undefined, email: string): string {
  return fullName?.trim() || email
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
}

function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] ?? '#6b7280'
  return (
    <span
      className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}33`, color }}
    >
      {priority}
    </span>
  )
}

function ModuleBadge({ module }: { module: string }) {
  const label = module.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <span className="bg-amber-500/15 text-amber-300 text-xs font-medium px-2 py-0.5 rounded-full">
      {label}
    </span>
  )
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const isOverdue = new Date(deadline) < new Date()
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-gray-400'}`}>
      {isOverdue ? `Overdue · ${formatDeadline(deadline)}` : formatDeadline(deadline)}
    </span>
  )
}

function Avatar({ fullName, email, size = 'sm' }: { fullName: string | null | undefined; email: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'md' ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-[10px]'
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-white/10 text-white font-semibold shrink-0 ${sizeClass}`}>
      {initials(fullName, email)}
    </span>
  )
}

const LABEL_COLORS = [
  'bg-purple-500/20 text-purple-300',
  'bg-cyan-500/20 text-cyan-300',
  'bg-pink-500/20 text-pink-300',
  'bg-indigo-500/20 text-indigo-300',
  'bg-teal-500/20 text-teal-300',
  'bg-orange-500/20 text-orange-300',
]

function LabelChip({ label, index }: { label: string; index: number }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${LABEL_COLORS[index % LABEL_COLORS.length]}`}>
      {label}
    </span>
  )
}

function ThreadNode({ borderColor, children }: { borderColor: string; children: React.ReactNode }) {
  return (
    <div className="relative pl-8 pb-5 last:pb-0">
      {/* dot: left-[7px] centers a 10px circle on the left-3 (12px) line */}
      <span className="absolute left-[7px] top-[3px] w-2.5 h-2.5 rounded-full bg-[#0a1628] border-2" style={{ borderColor }} />
      {children}
    </div>
  )
}

function OverflowMenu({
  onEdit, onDelete, onRemind, isAdmin, canDelete, hasAssignees,
}: {
  onEdit: () => void
  onDelete: () => void
  onRemind: () => void
  isAdmin: boolean
  canDelete: boolean
  hasAssignees: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!isAdmin && !canDelete) return null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition"
        aria-label="More options"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-white/10 bg-[#0f1f3a] shadow-xl z-10 py-1 overflow-hidden">
          {isAdmin && (
            <button type="button" onClick={() => { setOpen(false); onEdit() }} className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/10 transition">
              Edit task
            </button>
          )}
          {isAdmin && hasAssignees && (
            <button type="button" onClick={() => { setOpen(false); onRemind() }} className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/10 transition flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-blue-400">
                <path d="M7 1v1M2.6 3.6l.7.7M11.4 3.6l-.7.7M1 9h12M3 9c0-2.2 1.8-4 4-4s4 1.8 4 4M5.5 9v.5a1.5 1.5 0 0 0 3 0V9" />
              </svg>
              Remind assignees
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={() => { setOpen(false); onDelete() }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition">
              Delete task
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TaskDetailPanelProps {
  task: Task
  currentUserId: string
  isAdmin: boolean
  onClose: () => void
  onUpdated: () => void
  onEdit: () => void
}

export function TaskDetailPanel({ task, currentUserId, isAdmin, onClose, onUpdated, onEdit }: TaskDetailPanelProps) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [watching, setWatching] = useState(false)
  const [watchLoading, setWatchLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [remindOpen, setRemindOpen] = useState(false)
  const [remindMessage, setRemindMessage] = useState('')
  const [reminding, setReminding] = useState(false)
  const [remindError, setRemindError] = useState<string | null>(null)
  const [remindSent, setRemindSent] = useState(false)

  const threadEndRef = useRef<HTMLDivElement>(null)
  const canComplete = isAdmin || currentUserId === task.creator_id
  const canDelete = isAdmin || currentUserId === task.creator_id
  const canComment = isAdmin || (task.assignees ?? []).some((a) => a.organizer_id === currentUserId)
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoadingComments(true)
      const [fetched] = await Promise.all([
        fetchComments(task.id),
        markNotificationsRead(task.id),
        isWatching(task.id, currentUserId).then((v) => { if (!cancelled) setWatching(v) }),
      ])
      if (!cancelled) { setComments(fetched); setLoadingComments(false) }
    }
    init()
    return () => { cancelled = true }
  }, [task.id, currentUserId])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`task_comments_${task.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_comments', filter: `task_id=eq.${task.id}` }, (payload) => {
        setComments((prev) => prev.some((c) => c.id === (payload.new as TaskComment).id) ? prev : [...prev, payload.new as TaskComment])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [task.id])

  useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments])

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleToggleWatch = useCallback(async () => {
    setWatchLoading(true)
    try {
      if (watching) { await unwatchTask(task.id); setWatching(false) }
      else { await watchTask(task.id); setWatching(true) }
    } finally { setWatchLoading(false) }
  }, [watching, task.id])

  const handlePostComment = useCallback(async () => {
    const content = commentText.trim()
    if (!content) return
    setPosting(true)
    try {
      const comment = await addComment(task.id, content)
      setComments((prev) => prev.some((c) => c.id === comment.id) ? prev : [...prev, comment])
      setCommentText('')
    } finally { setPosting(false) }
  }, [commentText, task.id])

  const handleComplete = useCallback(async () => {
    setActionLoading(true)
    try { await completeTask(task.id); onUpdated() } finally { setActionLoading(false) }
  }, [task.id, onUpdated])

  const handleReopen = useCallback(async () => {
    setActionLoading(true)
    try { await reopenTask(task.id); onUpdated() } finally { setActionLoading(false) }
  }, [task.id, onUpdated])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try { await deleteTask(task.id); onClose(); onUpdated() } finally { setDeleting(false) }
  }, [task.id, onClose, onUpdated])

  const handleRemind = useCallback(async () => {
    setReminding(true)
    setRemindError(null)
    try {
      await remindAssignees(task.id, remindMessage)
      setRemindSent(true)
      setRemindMessage('')
      setTimeout(() => { setRemindSent(false); setRemindOpen(false) }, 2500)
    } catch (e) {
      setRemindError(e instanceof Error ? e.message : 'Failed to send reminder.')
    } finally { setReminding(false) }
  }, [task.id, remindMessage])

  const panelTransition = shouldReduce
    ? { duration: 0.01 }
    : { type: 'tween' as const, duration: 0.28, ease: [0.22, 1, 0.36, 1] }
  const exitTransition = shouldReduce
    ? { duration: 0.01 }
    : { type: 'tween' as const, duration: 0.2, ease: [0.55, 0, 1, 0.45] }

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/40 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: shouldReduce ? 0.01 : 0.2 } }}
        exit={{ opacity: 0, transition: { duration: shouldReduce ? 0.01 : 0.15 } }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        className="fixed top-0 right-0 bottom-0 w-full max-w-[560px] z-50 flex flex-col bg-[#0a1628] border-l border-white/10 shadow-2xl"
        initial={{ x: '100%' }}
        animate={{ x: 0, transition: panelTransition }}
        exit={{ x: '100%', transition: exitTransition }}
        role="dialog"
        aria-modal="true"
        aria-label={task.title}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#0a1628] border-b border-white/10 p-4 space-y-2.5 shrink-0">
          <div className="flex items-start gap-3">
            <button type="button" onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition shrink-0 mt-0.5" aria-label="Close panel">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10 4L6 8l4 4" />
              </svg>
            </button>
            <h2 className="flex-1 text-lg font-semibold text-white leading-snug min-w-0 line-clamp-2">{task.title}</h2>
            <OverflowMenu
              onEdit={onEdit}
              onDelete={() => setConfirmDelete(true)}
              onRemind={() => { setRemindOpen(true); setRemindError(null); setRemindSent(false) }}
              isAdmin={isAdmin}
              canDelete={canDelete}
              hasAssignees={(task.assignees?.length ?? 0) > 0}
            />
          </div>
          <div className="flex flex-wrap gap-2 pl-9">
            <PriorityBadge priority={task.priority} />
            <ModuleBadge module={task.module} />
            {task.deadline && <DeadlineBadge deadline={task.deadline} />}
            {task.status === 'completed' && (
              <span className="bg-green-500/15 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">Completed</span>
            )}
          </div>
        </header>

        {/* Meta */}
        <div className="border-b border-white/10 p-4 space-y-3 shrink-0">
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-xs text-gray-500 w-20 shrink-0 pt-0.5">Assigned to</span>
              <div className="flex flex-wrap gap-2">
                {task.assignees.map((a) => (
                  <span key={a.organizer_id} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full pl-1 pr-2.5 py-0.5">
                    <Avatar fullName={a.full_name} email={a.email} size="sm" />
                    <span className="text-xs text-gray-200">{displayName(a.full_name, a.email)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {task.creator && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-20 shrink-0">Created by</span>
              <span className="flex items-center gap-1.5">
                <Avatar fullName={task.creator.full_name} email={task.creator.email} size="sm" />
                <span className="text-xs text-gray-300">
                  {displayName(task.creator.full_name, task.creator.email)} · {formatDate(task.created_at)}
                </span>
              </span>
            </div>
          )}
          {task.labels && task.labels.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-xs text-gray-500 w-20 shrink-0 pt-0.5">Labels</span>
              <div className="flex flex-wrap gap-1.5">
                {task.labels.map((l, i) => <LabelChip key={l.id} label={l.label} index={i} />)}
              </div>
            </div>
          )}
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto p-4">
          {task.description && (
            <p className="text-sm text-gray-300 leading-relaxed mb-5 whitespace-pre-wrap break-words">{linkify(task.description)}</p>
          )}
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />

            <ThreadNode borderColor="rgba(59,130,246,0.4)">
              <div className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-blue-400 shrink-0">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6 3v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-xs text-gray-500">
                  Task created{task.creator && <> by <span className="text-gray-400">{displayName(task.creator.full_name, task.creator.email)}</span></>} · {timeAgo(task.created_at)}
                </span>
              </div>
            </ThreadNode>

            {loadingComments ? (
              [1, 2].map((i) => (
                <ThreadNode key={i} borderColor="rgba(255,255,255,0.15)">
                  <div className="flex gap-2.5 animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-2 pt-0.5">
                      <div className="h-3 bg-white/10 rounded w-32" />
                      <div className="h-3 bg-white/10 rounded w-full" />
                    </div>
                  </div>
                </ThreadNode>
              ))
            ) : (
              <AnimatePresence initial={false}>
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: shouldReduce ? 0.1 : 0.24, ease: [0.22, 1, 0.36, 1] } }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  >
                    <ThreadNode borderColor="rgba(255,255,255,0.3)">
                      <div className="flex gap-2.5">
                        <Avatar fullName={comment.author?.full_name} email={comment.author?.email ?? comment.author_id} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-200">
                              {displayName(comment.author?.full_name, comment.author?.email ?? comment.author_id)}
                            </span>
                            <span className="text-xs text-gray-500">{timeAgo(comment.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{linkify(comment.content)}</p>
                        </div>
                      </div>
                    </ThreadNode>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {task.status === 'completed' && task.completed_at && (
              <ThreadNode borderColor="rgba(34,197,94,0.4)">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-green-400 shrink-0">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3.5 6l1.75 1.75L8.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs text-gray-500">Task completed · {timeAgo(task.completed_at)}</span>
                </div>
              </ThreadNode>
            )}

            <div ref={threadEndRef} />
          </div>
        </div>

        {/* Compose */}
        <div className="sticky bottom-0 bg-[#0a1628] border-t border-white/10 p-4 space-y-3 shrink-0">
          {confirmDelete && (
            <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              <span className="text-sm text-red-300">Delete this task?</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition disabled:opacity-50">Cancel</button>
                <button type="button" onClick={handleDelete} disabled={deleting} className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition disabled:opacity-50">
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          )}

          {remindOpen && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-300">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 1v1M2.6 3.6l.7.7M11.4 3.6l-.7.7M1 9h12M3 9c0-2.2 1.8-4 4-4s4 1.8 4 4M5.5 9v.5a1.5 1.5 0 0 0 3 0V9" />
                  </svg>
                  Remind {task.assignees?.length ?? 0} {(task.assignees?.length ?? 0) === 1 ? 'assignee' : 'assignees'} via email
                </span>
                <button
                  type="button"
                  onClick={() => { setRemindOpen(false); setRemindMessage(''); setRemindError(null) }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition"
                >
                  Cancel
                </button>
              </div>

              {remindSent ? (
                <div className="flex items-center gap-2 py-1">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7" cy="7" r="6" /><path d="M4.5 7l1.75 1.75L9.5 5" />
                  </svg>
                  <span className="text-xs text-green-400 font-medium">Reminder sent.</span>
                </div>
              ) : (
                <>
                  <textarea
                    rows={2}
                    value={remindMessage}
                    onChange={(e) => setRemindMessage(e.target.value)}
                    placeholder="Add a custom message for the assignees (optional)…"
                    className="w-full resize-none bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
                  />
                  {remindError && (
                    <p className="text-xs text-red-400">{remindError}</p>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleRemind}
                      disabled={reminding}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50"
                    >
                      {reminding ? (
                        <span className="inline-block w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 1l12 6-12 6V9l8-2-8-2V1z" />
                        </svg>
                      )}
                      {reminding ? 'Sending…' : 'Send Reminder'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {canComment ? (
            <textarea
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handlePostComment() } }}
              placeholder="Add a comment… (⌘+Enter to post)"
              className="w-full resize-none bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          ) : (
            <p className="text-xs text-gray-500 italic px-1">
              Only assignees and admins can comment on this task. You have view-only access.
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleWatch}
              disabled={watchLoading}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${watching ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20' : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill={watching ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                <path d="M7 1.5a5.833 5.833 0 0 1 5.833 5.833A5.833 5.833 0 0 1 7 13.167a5.833 5.833 0 0 1-5.833-5.834A5.833 5.833 0 0 1 7 1.5z" />
                <circle cx="7" cy="7.333" r="1.75" fill="currentColor" stroke="none" />
              </svg>
              {watching ? 'Unwatch' : 'Watch'}
            </button>
            <div className="flex-1" />
            {canComplete && (
              <button
                type="button"
                onClick={task.status === 'completed' ? handleReopen : handleComplete}
                disabled={actionLoading}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${task.status === 'completed' ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10' : 'border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20'}`}
              >
                {task.status === 'completed' ? 'Reopen' : actionLoading ? 'Saving…' : 'Mark Complete'}
              </button>
            )}
            {canComment && (
              <button
                type="button"
                onClick={handlePostComment}
                disabled={posting || !commentText.trim()}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {posting ? <span className="inline-block w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Post
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}
