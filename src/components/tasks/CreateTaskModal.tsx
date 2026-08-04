'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createTask, fetchOrganizers, updateTask } from '@/lib/tasks/api'
import type { OrganizerOption, Task, TaskPriority } from '@/types/tasks'

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
}

const PRIORITY_ORDER: TaskPriority[] = ['low', 'medium', 'high', 'critical']

const inputClass = 'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50'
const labelClass = 'block text-sm font-medium text-gray-200 mb-1.5'

interface OrgTeam { name: string; portal_key: string }

interface CreateTaskModalProps {
  defaultModule?: string
  onClose: () => void
  onCreated: () => void
  taskToEdit?: Task | null
}

export function CreateTaskModal({ defaultModule, onClose, onCreated, taskToEdit }: CreateTaskModalProps) {
  const isEditing = !!taskToEdit

  const [title, setTitle] = useState(taskToEdit?.title ?? '')
  const [description, setDescription] = useState(taskToEdit?.description ?? '')
  const [selectedModule, setSelectedModule] = useState(taskToEdit?.module ?? defaultModule ?? '')
  const [deadline, setDeadline] = useState(taskToEdit?.deadline ? taskToEdit.deadline.slice(0, 10) : '')
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority ?? 'medium')
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(taskToEdit?.assignees?.map((a) => a.organizer_id) ?? [])
  const [labels, setLabels] = useState<string[]>(taskToEdit?.labels?.map((l) => l.label) ?? [])
  const [labelInput, setLabelInput] = useState('')

  const [teams, setTeams] = useState<OrgTeam[]>([])
  const [organizers, setOrganizers] = useState<OrganizerOption[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const supabase = createClient()
        const [teamsRes, orgs] = await Promise.all([
          supabase.from('org_teams').select('name, portal_key').not('portal_key', 'is', null).neq('portal_key', 'judging').order('sort_order'),
          fetchOrganizers(),
        ])
        if (cancelled) return
        const teamRows = (teamsRes.data ?? []) as OrgTeam[]
        setTeams(teamRows)
        setOrganizers(orgs)
        if (!selectedModule && !defaultModule && teamRows.length > 0) {
          setSelectedModule(teamRows[0].portal_key)
        }
      } catch { /* non-fatal */ } finally {
        if (!cancelled) setLoadingData(false)
      }
    }
    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose()
  }

  function toggleAssignee(id: string) {
    setSelectedAssigneeIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function addLabel(raw: string) {
    const trimmed = raw.trim().toLowerCase()
    if (!trimmed || labels.includes(trimmed) || labels.length >= 8) return
    setLabels((prev) => [...prev, trimmed])
    setLabelInput('')
  }

  function handleLabelKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addLabel(labelInput) }
    else if (e.key === 'Backspace' && labelInput === '' && labels.length > 0) {
      setLabels((prev) => prev.slice(0, -1))
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    if (!selectedModule) { setError('Please select a module.'); return }
    setSubmitting(true)
    setError(null)
    try {
      if (isEditing && taskToEdit) {
        await updateTask(taskToEdit.id, { title: title.trim(), description: description.trim(), module: selectedModule, deadline: deadline || undefined, priority, assigneeIds: selectedAssigneeIds, labels })
      } else {
        await createTask({ title: title.trim(), description: description.trim() || undefined, module: selectedModule, deadline: deadline || undefined, priority, assigneeIds: selectedAssigneeIds, labels })
      }
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={handleOverlayClick}>
      <div className="w-full max-w-lg bg-[#0a1628] border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-base font-bold text-white">{isEditing ? 'Edit Task' : 'New Task'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition text-lg leading-none" aria-label="Close">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className={labelClass}>Title <span className="text-yellow-400">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className={inputClass} autoFocus />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details…" rows={3} className={`${inputClass} resize-none`} />
          </div>

          <div>
            <label className={labelClass}>Module <span className="text-yellow-400">*</span></label>
            {loadingData ? (
              <div className={`${inputClass} text-gray-500`}>Loading…</div>
            ) : (
              <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} className={`${inputClass} [&>option]:bg-[#0a1628] [&>option]:text-white`}>
                {!selectedModule && <option value="" disabled>Select a module</option>}
                {teams.map((t) => <option key={t.portal_key} value={t.portal_key}>{t.name}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className={labelClass}>Priority</label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITY_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition border"
                  style={priority === p
                    ? { backgroundColor: PRIORITY_COLORS[p] + '33', borderColor: PRIORITY_COLORS[p] + '88', color: PRIORITY_COLORS[p] }
                    : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
          </div>

          <div>
            <label className={labelClass}>Assignees</label>
            {loadingData ? (
              <p className="text-xs text-gray-500">Loading members…</p>
            ) : organizers.length === 0 ? (
              <p className="text-xs text-gray-500">No organizers found.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                {organizers.map((o) => {
                  const selected = selectedAssigneeIds.includes(o.user_id)
                  return (
                    <button
                      key={o.user_id}
                      type="button"
                      onClick={() => toggleAssignee(o.user_id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition border"
                      style={selected
                        ? { backgroundColor: 'rgba(59,130,246,0.2)', borderColor: 'rgba(59,130,246,0.5)', color: '#93c5fd' }
                        : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}
                    >
                      {o.full_name ?? o.email}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Labels <span className="text-gray-500 font-normal">(Enter to add, max 8)</span></label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {labels.map((l) => (
                <span key={l} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-gray-300 text-xs">
                  {l}
                  <button type="button" onClick={() => setLabels((prev) => prev.filter((x) => x !== l))} className="text-gray-500 hover:text-white transition leading-none" aria-label={`Remove ${l}`}>×</button>
                </span>
              ))}
            </div>
            {labels.length < 8 && (
              <input type="text" value={labelInput} onChange={(e) => setLabelInput(e.target.value)} onKeyDown={handleLabelKeyDown} placeholder="Type a label and press Enter…" className={inputClass} />
            )}
          </div>

          {error && <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">{error}</div>}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 shrink-0">
          <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">Cancel</button>
          <button
            type="button"
            disabled={submitting || !title.trim() || !selectedModule}
            onClick={() => handleSubmit()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
          >
            {submitting ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save Changes' : 'Create Task')}
          </button>
        </div>
      </div>
    </div>
  )
}
