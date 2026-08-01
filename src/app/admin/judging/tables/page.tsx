'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AssignmentStatus, JudgingSettings, Track } from '@/types/judging'
import {
  Banner,
  EmptyState,
  ExportButton,
  Field,
  Panel,
  Pill,
  inputClass,
  selectClass,
} from '@/components/judging/ui'
import { exportWorkbook } from '@/lib/judging/export'
import { reseatByVisits, type ReseatResult } from '@/lib/judging/tables'
import {
  FALLBACK_SETTINGS,
  formatDuration,
  visitSeconds,
} from '@/lib/judging/visits'

type ProjectRow = {
  id: string
  title: string
  table_number: string | null
  main_track_id: string | null
}

type AssignmentRow = {
  id: string
  judge_id: string
  project_id: string
  track_context_id: string
  status: AssignmentStatus
  judge: { full_name: string | null; email: string } | null
}

type MemberRow = {
  project_id: string
  email: string | null
}

type JudgeSheet = {
  trackId: string
  status: AssignmentStatus
}

type JudgeAtTable = {
  judgeId: string
  name: string
  email: string
  trackIds: string[]
  sheets: JudgeSheet[]
  assignmentIds: string[]
  submitted: number
  total: number
}

type TableCard = {
  project: ProjectRow
  trackIds: string[]
  judges: JudgeAtTable[]
  seconds: number
  staffing: 'empty' | 'thin' | 'ok'
  sheetsSubmitted: number
  sheetsTotal: number
}

type FilterMode = 'all' | 'understaffed' | 'empty' | 'sponsors'
type SortMode = 'table' | 'judges' | 'tracks'

const PAGE = 1000
const DEFAULT_TARGET = 3

function initials(name: string) {
  return name
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function tableSortKey(table: string | null) {
  if (!table) return 'zzz'
  const m = table.match(/(\d+)/)
  if (m) return m[1].padStart(4, '0')
  return table.toLowerCase()
}

export default function TablesAdminPage() {
  const [settings, setSettings] = useState<JudgingSettings>(FALLBACK_SETTINGS)
  const [tracks, setTracks] = useState<Track[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [sponsorLinks, setSponsorLinks] = useState<{ project_id: string; track_id: string }[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [members, setMembers] = useState<MemberRow[]>([])
  const [targetJudges, setTargetJudges] = useState(DEFAULT_TARGET)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [sortBy, setSortBy] = useState<SortMode>('table')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [movingJudgeId, setMovingJudgeId] = useState<string | null>(null)
  const [moveDestId, setMoveDestId] = useState('')
  const [movePreview, setMovePreview] = useState<{
    move: string[]
    drop: string[]
  } | null>(null)
  const [reseatPreview, setReseatPreview] = useState<ReseatResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const trackById = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks])

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    const quiet = opts?.quiet === true
    if (!quiet) {
      setLoading(true)
      setError('')
    }
    const supabase = createClient()

    const [settingsRes, trackRes, projectRes, sponsorRes, memberRes] = await Promise.all([
      supabase.from('judging_settings').select('*').maybeSingle(),
      supabase.from('tracks').select('*').order('sort_order').order('name'),
      supabase
        .from('projects')
        .select('id, title, table_number, main_track_id')
        .eq('status', 'submitted')
        .order('title'),
      supabase.from('project_sponsor_tracks').select('project_id, track_id'),
      supabase.from('project_team_members').select('project_id, email'),
    ])

    if (trackRes.error || projectRes.error) {
      if (!quiet) {
        setError(trackRes.error?.message || projectRes.error?.message || 'Could not load tables.')
        setLoading(false)
      }
      return
    }

    if (settingsRes.data) setSettings(settingsRes.data as JudgingSettings)
    setTracks((trackRes.data || []) as Track[])
    setProjects((projectRes.data || []) as ProjectRow[])
    setSponsorLinks((sponsorRes.data || []) as { project_id: string; track_id: string }[])
    setMembers((memberRes.data || []) as MemberRow[])

    const collected: AssignmentRow[] = []
    for (let page = 0; ; page++) {
      const { data, error: aErr } = await supabase
        .from('judge_assignments')
        .select(
          `id, judge_id, project_id, track_context_id, status,
           judge:judge_profiles(full_name, email)`
        )
        .order('assigned_at')
        .range(page * PAGE, page * PAGE + PAGE - 1)
      if (aErr) {
        if (!quiet) {
          setError(aErr.message)
          setLoading(false)
        }
        return
      }
      const batch = (data || []) as unknown as AssignmentRow[]
      collected.push(...batch)
      if (batch.length < PAGE) break
    }
    setAssignments(collected)
    if (!quiet) setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Quiet poll so sheet fills update while organizers watch the board.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !busy) load({ quiet: true })
    }, 15000)
    return () => window.clearInterval(id)
  }, [load, busy])

  const sponsorsByProject = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const link of sponsorLinks) {
      const list = map.get(link.project_id) || []
      list.push(link.track_id)
      map.set(link.project_id, list)
    }
    return map
  }, [sponsorLinks])

  const qualifyTrackIds = useCallback(
    (project: ProjectRow) => {
      const ids = new Set<string>()
      if (project.main_track_id) ids.add(project.main_track_id)
      for (const tid of sponsorsByProject.get(project.id) || []) ids.add(tid)
      return ids
    },
    [sponsorsByProject]
  )

  const cards = useMemo<TableCard[]>(() => {
    const byProject = new Map<string, AssignmentRow[]>()
    for (const a of assignments) {
      const list = byProject.get(a.project_id) || []
      list.push(a)
      byProject.set(a.project_id, list)
    }

    return projects.map((project) => {
      const qualify = qualifyTrackIds(project)
      const trackIds = Array.from(qualify).filter((id) => trackById.has(id))
      trackIds.sort((a, b) => {
        const ta = trackById.get(a)!
        const tb = trackById.get(b)!
        if (ta.type !== tb.type) return ta.type === 'in_house' ? -1 : 1
        return ta.sort_order - tb.sort_order || ta.name.localeCompare(tb.name)
      })

      const rows = byProject.get(project.id) || []
      const byJudge = new Map<string, JudgeAtTable>()
      for (const row of rows) {
        const entry = byJudge.get(row.judge_id) || {
          judgeId: row.judge_id,
          name: row.judge?.full_name || row.judge?.email || 'Judge',
          email: row.judge?.email || '',
          trackIds: [],
          sheets: [],
          assignmentIds: [],
          submitted: 0,
          total: 0,
        }
        entry.assignmentIds.push(row.id)
        entry.sheets.push({ trackId: row.track_context_id, status: row.status })
        if (!entry.trackIds.includes(row.track_context_id)) entry.trackIds.push(row.track_context_id)
        entry.total++
        if (row.status === 'submitted') entry.submitted++
        byJudge.set(row.judge_id, entry)
      }

      const judges = Array.from(byJudge.values()).sort((a, b) => a.name.localeCompare(b.name))
      const count = judges.length
      const staffing: TableCard['staffing'] =
        count === 0 ? 'empty' : count < targetJudges ? 'thin' : 'ok'
      const sheetsSubmitted = judges.reduce((n, j) => n + j.submitted, 0)
      const sheetsTotal = judges.reduce((n, j) => n + j.total, 0)

      return {
        project,
        trackIds,
        judges,
        seconds: visitSeconds(trackIds, trackById, settings),
        staffing,
        sheetsSubmitted,
        sheetsTotal,
      }
    })
  }, [projects, assignments, qualifyTrackIds, trackById, settings, targetJudges])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = cards

    if (filter === 'empty') list = list.filter((c) => c.staffing === 'empty')
    if (filter === 'understaffed') list = list.filter((c) => c.staffing !== 'ok')
    if (filter === 'sponsors') list = list.filter((c) => c.trackIds.some((id) => trackById.get(id)?.type === 'sponsor'))

    if (q) {
      list = list.filter((c) => {
        if ((c.project.table_number || '').toLowerCase().includes(q)) return true
        if (c.project.title.toLowerCase().includes(q)) return true
        if (c.judges.some((j) => j.name.toLowerCase().includes(q) || j.email.toLowerCase().includes(q)))
          return true
        if (
          c.trackIds.some((id) => {
            const t = trackById.get(id)
            return (
              (t?.name || '').toLowerCase().includes(q) ||
              (t?.sponsor_name || '').toLowerCase().includes(q)
            )
          })
        )
          return true
        return false
      })
    }

    const sorted = [...list]
    if (sortBy === 'table') {
      sorted.sort(
        (a, b) =>
          tableSortKey(a.project.table_number).localeCompare(tableSortKey(b.project.table_number)) ||
          a.project.title.localeCompare(b.project.title)
      )
    } else if (sortBy === 'judges') {
      sorted.sort((a, b) => a.judges.length - b.judges.length || a.project.title.localeCompare(b.project.title))
    } else {
      sorted.sort((a, b) => b.trackIds.length - a.trackIds.length || a.project.title.localeCompare(b.project.title))
    }
    return sorted
  }, [cards, search, filter, sortBy, trackById])

  const selected = useMemo(
    () => cards.find((c) => c.project.id === selectedId) || null,
    [cards, selectedId]
  )

  const stats = useMemo(
    () => ({
      tables: cards.length,
      empty: cards.filter((c) => c.staffing === 'empty').length,
      thin: cards.filter((c) => c.staffing === 'thin').length,
      withSponsors: cards.filter((c) =>
        c.trackIds.some((id) => trackById.get(id)?.type === 'sponsor')
      ).length,
    }),
    [cards, trackById]
  )

  const destinationOptions = useMemo(() => {
    if (!selected || !movingJudgeId) return []
    return cards
      .filter((c) => c.project.id !== selected.project.id)
      .filter((c) => !c.judges.some((j) => j.judgeId === movingJudgeId))
      .sort(
        (a, b) =>
          tableSortKey(a.project.table_number).localeCompare(tableSortKey(b.project.table_number)) ||
          a.project.title.localeCompare(b.project.title)
      )
  }, [cards, selected, movingJudgeId])

  const beginMove = (judgeId: string) => {
    setMovingJudgeId(judgeId)
    setMoveDestId('')
    setMovePreview(null)
    setMessage('')
    setError('')
  }

  const previewMove = (destProjectId: string) => {
    setMoveDestId(destProjectId)
    setMovePreview(null)
    if (!selected || !movingJudgeId || !destProjectId) return

    const judge = selected.judges.find((j) => j.judgeId === movingJudgeId)
    const dest = cards.find((c) => c.project.id === destProjectId)
    if (!judge || !dest) return

    const destQualify = qualifyTrackIds(dest.project)
    const move: string[] = []
    const drop: string[] = []
    for (const tid of judge.trackIds) {
      const name = trackById.get(tid)?.name || tid
      if (destQualify.has(tid)) move.push(name)
      else drop.push(name)
    }
    setMovePreview({ move, drop })
  }

  const confirmMove = async () => {
    if (!selected || !movingJudgeId || !moveDestId || !movePreview) return
    const dest = cards.find((c) => c.project.id === moveDestId)
    const judge = selected.judges.find((j) => j.judgeId === movingJudgeId)
    if (!dest || !judge) return

    const destEmails = members
      .filter((m) => m.project_id === dest.project.id && m.email)
      .map((m) => m.email!.toLowerCase())
    if (judge.email && destEmails.includes(judge.email.toLowerCase())) {
      setError('That judge is on the destination team. Conflict of interest blocks the move.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')
    const supabase = createClient()
    const sourceRows = assignments.filter(
      (a) => a.judge_id === movingJudgeId && a.project_id === selected.project.id
    )
    const destQualify = qualifyTrackIds(dest.project)

    const transferable = sourceRows.filter((a) => destQualify.has(a.track_context_id))
    const droppable = sourceRows.filter((a) => !destQualify.has(a.track_context_id))

    // Conflict with existing destination sheets for same track
    for (const row of transferable) {
      const clash = assignments.find(
        (a) =>
          a.judge_id === movingJudgeId &&
          a.project_id === dest.project.id &&
          a.track_context_id === row.track_context_id
      )
      if (clash) {
        setError(
          `Already has a sheet on ${trackById.get(row.track_context_id)?.name || 'that track'} at the destination.`
        )
        setBusy(false)
        return
      }
    }

    for (const row of transferable) {
      const { error: uErr } = await supabase
        .from('judge_assignments')
        .update({ project_id: dest.project.id })
        .eq('id', row.id)
      if (uErr) {
        setError(uErr.message)
        setBusy(false)
        return
      }
    }

    if (droppable.length) {
      const { error: dErr } = await supabase
        .from('judge_assignments')
        .delete()
        .in(
          'id',
          droppable.map((r) => r.id)
        )
      if (dErr) {
        setError(dErr.message)
        setBusy(false)
        return
      }
    }

    setMessage(
      `Moved ${judge.name} to ${dest.project.table_number || 'that table'}: ${movePreview.move.length} sheet${movePreview.move.length === 1 ? '' : 's'} transferred` +
        (movePreview.drop.length
          ? `, ${movePreview.drop.length} dropped (destination has no matching track).`
          : '.')
    )
    setMovingJudgeId(null)
    setMoveDestId('')
    setMovePreview(null)
    setSelectedId(dest.project.id)
    await load()
    setBusy(false)
  }

  const beginReseat = () => {
    setError('')
    setMessage('')
    if (assignments.length === 0) {
      setError('Commit a judging plan first — reseat needs real visits.')
      return
    }
    const visits = assignments.map((a) => ({
      judgeId: a.judge_id,
      projectId: a.project_id,
    }))
    const result = reseatByVisits(projects, visits)
    setReseatPreview(result)
  }

  const confirmReseat = async () => {
    if (!reseatPreview) return
    setBusy(true)
    setError('')
    setMessage('')
    const supabase = createClient()
    const entries = Array.from(reseatPreview.assignment.entries())
    for (let i = 0; i < entries.length; i += 50) {
      const part = entries.slice(i, i + 50)
      const results = await Promise.all(
        part.map(([id, table_number]) =>
          supabase.from('projects').update({ table_number }).eq('id', id)
        )
      )
      const failed = results.find((r) => r.error)
      if (failed?.error) {
        setError(failed.error.message)
        setBusy(false)
        return
      }
    }
    setMessage(
      `Reseated ${entries.length} tables. Walk cost ${reseatPreview.oldCost} → ${reseatPreview.newCost} (lower is shorter walks).`
    )
    setReseatPreview(null)
    await load()
    setBusy(false)
  }

  const exportTables = () => {
    const ok = exportWorkbook('Tables', [
      {
        name: 'Floor board',
        rows: visible.map((c) => ({
          Table: c.project.table_number || '',
          Project: c.project.title,
          Judges: c.judges.length,
          'Judge names': c.judges.map((j) => j.name).join(', '),
          Tracks: c.trackIds.map((id) => trackById.get(id)?.name || '').filter(Boolean).join(', '),
          Sheets: c.sheetsTotal,
          Submitted: c.sheetsSubmitted,
          Progress:
            c.sheetsTotal > 0
              ? `${Math.round((c.sheetsSubmitted / c.sheetsTotal) * 100)}%`
              : '',
          'Visit minutes': Math.round(c.seconds / 60),
          Staffing: c.staffing,
        })),
      },
      {
        name: 'Judge visits',
        rows: visible.flatMap((c) =>
          c.judges.map((j) => ({
            Table: c.project.table_number || '',
            Project: c.project.title,
            Judge: j.name,
            Email: j.email,
            Rubrics: j.trackIds.map((id) => trackById.get(id)?.name || '').join(', '),
            Submitted: `${j.submitted}/${j.total}`,
          }))
        ),
      },
    ])
    if (!ok) setError('Nothing to export yet.')
  }

  const focusTrackId = (card: TableCard) =>
    card.project.main_track_id || card.trackIds[0] || tracks[0]?.id || ''

  /** Sheet fill: green opacity rises with submitted/total. Staffing still owns the border. */
  const tileStyle = (card: TableCard): CSSProperties | undefined => {
    if (card.staffing === 'empty' || card.sheetsTotal === 0) return undefined
    const ratio = card.sheetsSubmitted / card.sheetsTotal
    // 0 → faint, 1 → readable green wash (still lets text stay legible)
    const alpha = 0.05 + ratio * 0.32
    return {
      backgroundColor: `rgba(34, 197, 94, ${alpha.toFixed(3)})`,
    }
  }

  const tileClass = (card: TableCard, selected: boolean) => {
    const base =
      'relative overflow-hidden text-left rounded-xl border p-3 min-h-[7.5rem] transition-[background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
    const done = card.sheetsTotal > 0 && card.sheetsSubmitted === card.sheetsTotal
    const state =
      card.staffing === 'empty'
        ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15'
        : done
          ? 'border-green-400/45 hover:border-green-400/60'
          : card.staffing === 'thin'
            ? 'border-yellow-500/40 hover:border-yellow-500/55'
            : 'border-white/15 hover:border-white/25'
    const ring = selected ? ' ring-2 ring-yellow-400 border-yellow-400/50' : ''
    return `${base} ${state}${ring}`
  }

  const judgeDotClass = (j: JudgeAtTable) => {
    if (j.total === 0) return 'border-white/20'
    if (j.submitted === j.total) return 'border-green-400/80'
    if (j.submitted > 0) return 'border-yellow-400/70'
    return 'border-white/25'
  }

  return (
    <div className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}
      {message && <Banner tone="success">{message}</Banner>}

      <Panel
        title="Tables"
        description="One tile per project, ordered like a floor board. Open a tile to see who walks there and which rubrics that stop covers."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={beginReseat}
              disabled={busy || loading || assignments.length === 0}
              className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 disabled:opacity-40 border border-yellow-500/40 text-yellow-100 text-xs font-semibold rounded-lg transition"
            >
              Reseat for short walks
            </button>
            <ExportButton onClick={exportTables} disabled={cards.length === 0} />
          </div>
        }
      >
        {reseatPreview && (
          <div className="mx-5 mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3">
            <p className="text-sm font-semibold text-white">Reseat preview</p>
            <p className="text-xs text-gray-300 leading-relaxed">
              Rewrites every submitted project&apos;s table number from the current visit graph.
              Judges are assumed to walk low→high. Export first if you need the old map.
            </p>
            <p className="text-sm text-gray-200">
              Walk cost{' '}
              <span className="text-yellow-200 font-semibold">{reseatPreview.oldCost}</span>
              {' → '}
              <span className="text-green-300 font-semibold">{reseatPreview.newCost}</span>
              {reseatPreview.newCost < reseatPreview.oldCost
                ? ' (shorter)'
                : reseatPreview.newCost === reseatPreview.oldCost
                  ? ' (same)'
                  : ''}
              · {reseatPreview.moves.length} table{reseatPreview.moves.length === 1 ? '' : 's'} move
            </p>
            {reseatPreview.moves.length > 0 && (
              <ul className="text-xs text-gray-400 space-y-1">
                {reseatPreview.moves.slice(0, 6).map((m) => {
                  const title = projects.find((p) => p.id === m.projectId)?.title || 'Project'
                  return (
                    <li key={m.projectId}>
                      {m.from || '—'} → {m.to} · {title}
                    </li>
                  )
                })}
                {reseatPreview.moves.length > 6 && (
                  <li>+{reseatPreview.moves.length - 6} more</li>
                )}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || reseatPreview.moves.length === 0}
                onClick={confirmReseat}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition"
              >
                {busy ? 'Applying…' : 'Confirm reseat'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setReseatPreview(null)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Find" hint="Table, project, judge, or track.">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tables"
              className={inputClass}
            />
          </Field>
          <Field label="Show">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterMode)}
              className={selectClass}
            >
              <option value="all">All tables</option>
              <option value="understaffed">Understaffed</option>
              <option value="empty">No judges</option>
              <option value="sponsors">Has sponsor tracks</option>
            </select>
          </Field>
          <Field label="Sort by">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMode)}
              className={selectClass}
            >
              <option value="table">Table number</option>
              <option value="judges">Fewest judges</option>
              <option value="tracks">Most tracks</option>
            </select>
          </Field>
          <Field
            label="Target judges / table"
            hint="Colors empty and thin tiles against this number."
          >
            <input
              type="number"
              min={1}
              max={10}
              value={targetJudges}
              onChange={(e) => setTargetJudges(Math.max(1, Number(e.target.value) || 1))}
              className={inputClass}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={load}
              disabled={loading || busy}
              className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 text-white text-sm font-semibold rounded-lg transition"
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Tables', value: stats.tables },
            { label: 'No judges', value: stats.empty, warn: stats.empty > 0 },
            { label: 'Under target', value: stats.thin, warn: stats.thin > 0 },
            { label: 'With sponsors', value: stats.withSponsors },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.warn ? 'text-yellow-300' : 'text-white'}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-6 items-start">
        <Panel
          title={`Floor board (${visible.length})`}
          description="Green wash = sheets submitted (deeper = further along). Border: red empty, yellow under target, green done. Select a tile for judges and moves."
        >
          {loading ? (
            <div className="p-10 text-center text-sm text-gray-400">Loading tables…</div>
          ) : visible.length === 0 ? (
            <EmptyState
              title={cards.length === 0 ? 'No projects yet' : 'No tables match'}
              description={
                cards.length === 0
                  ? 'Import projects and commit a judging plan first.'
                  : 'Clear search or change the filter.'
              }
            />
          ) : (
            <div
              className="p-4 grid gap-3"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
            >
              {visible.map((card) => {
                const isSelected = selectedId === card.project.id
                const progress =
                  card.sheetsTotal > 0 ? card.sheetsSubmitted / card.sheetsTotal : 0
                const sheetLabel =
                  card.sheetsTotal === 0
                    ? 'No sheets'
                    : `${card.sheetsSubmitted}/${card.sheetsTotal}`
                return (
                  <button
                    key={card.project.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(isSelected ? null : card.project.id)
                      setMovingJudgeId(null)
                      setMoveDestId('')
                      setMovePreview(null)
                    }}
                    aria-pressed={isSelected}
                    aria-label={`${card.project.table_number || 'No table'}, ${card.project.title}, ${sheetLabel} sheets submitted`}
                    className={tileClass(card, isSelected)}
                    style={tileStyle(card)}
                  >
                    {/* Bottom progress rail: length = submitted share */}
                    {card.sheetsTotal > 0 && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/5"
                      >
                        <span
                          className="block h-full bg-green-400/80 transition-[width] duration-300 ease-out motion-reduce:transition-none"
                          style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xl font-bold text-white tabular-nums leading-none">
                        {card.project.table_number || '—'}
                      </p>
                      <span
                        className={`text-[10px] font-semibold tabular-nums shrink-0 ${
                          card.sheetsTotal === 0
                            ? 'text-red-300'
                            : progress >= 1
                              ? 'text-green-200'
                              : progress > 0
                                ? 'text-green-300/90'
                                : 'text-gray-400'
                        }`}
                      >
                        {sheetLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-200 mt-2 line-clamp-2 leading-snug">
                      {card.project.title}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex -space-x-1.5">
                        {card.judges.slice(0, 4).map((j) => (
                          <span
                            key={j.judgeId}
                            title={`${j.name}: ${j.submitted}/${j.total} submitted`}
                            className={`inline-flex w-6 h-6 items-center justify-center rounded-full bg-[#0a1628] border-2 text-[10px] font-bold text-gray-200 ${judgeDotClass(j)}`}
                          >
                            {initials(j.name)}
                          </span>
                        ))}
                        {card.judges.length === 0 && (
                          <span className="text-[10px] text-red-300 font-semibold">Empty</span>
                        )}
                        {card.judges.length > 4 && (
                          <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-white/10 text-[10px] text-gray-300">
                            +{card.judges.length - 4}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {card.trackIds.length} track{card.trackIds.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </Panel>

        <Panel
          title={selected ? selected.project.table_number || 'Table' : 'Table detail'}
          description={
            selected
              ? selected.project.title
              : 'Select a tile on the board to inspect judges and tracks.'
          }
        >
          {!selected ? (
            <EmptyState
              title="Nothing selected"
              description="Click a table tile. From here you can move a judge to another table or jump into Assignments."
            />
          ) : (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {selected.trackIds.map((id) => {
                    const t = trackById.get(id)
                    if (!t) return null
                    return (
                      <Pill key={id} tone={t.type === 'sponsor' ? 'orange' : 'blue'}>
                        {t.type === 'sponsor' ? t.sponsor_name || t.name : t.name}
                      </Pill>
                    )
                  })}
                  {selected.trackIds.length === 0 && (
                    <span className="text-xs text-gray-500">No tracks on file</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {selected.judges.length} judge{selected.judges.length === 1 ? '' : 's'} ·{' '}
                  {formatDuration(selected.seconds)} visit ·{' '}
                  {selected.sheetsSubmitted}/{selected.sheetsTotal} sheets submitted
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/judging/assignments?project=${selected.project.id}&track=${focusTrackId(selected)}`}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Edit on Assignments
                </Link>
                <Link
                  href={`/admin/judging/scorecards?track=${focusTrackId(selected)}&project=${selected.project.id}`}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
                >
                  Open Scorecards
                </Link>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400">Judges at this table</p>
                {selected.judges.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nobody assigned yet. Use Assignments to add a judge, or move someone here from
                    another tile.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selected.judges.map((j) => {
                      const ratio = j.total > 0 ? j.submitted / j.total : 0
                      const done = j.total > 0 && j.submitted === j.total
                      const wash = j.total === 0 ? undefined : `rgba(34, 197, 94, ${(0.04 + ratio * 0.22).toFixed(3)})`
                      return (
                        <li
                          key={j.judgeId}
                          className={`relative overflow-hidden rounded-lg border p-3 space-y-2 transition-[background-color,border-color] duration-200 ease-out motion-reduce:transition-none ${
                            done
                              ? 'border-green-400/40'
                              : ratio > 0
                                ? 'border-green-500/20'
                                : 'border-white/10'
                          }`}
                          style={wash ? { backgroundColor: wash } : undefined}
                        >
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/5"
                          >
                            <span
                              className="block h-full bg-green-400/80 transition-[width] duration-300 ease-out motion-reduce:transition-none"
                              style={{ width: `${Math.round(ratio * 100)}%` }}
                            />
                          </span>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{j.name}</p>
                              <p
                                className={`text-xs tabular-nums ${
                                  done
                                    ? 'text-green-200'
                                    : ratio > 0
                                      ? 'text-green-300/90'
                                      : 'text-gray-400'
                                }`}
                              >
                                {j.submitted}/{j.total} submitted
                                {done ? ' · complete' : ''}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => beginMove(j.judgeId)}
                              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition shrink-0"
                            >
                              Move
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1 pb-1">
                            {j.sheets.map((sheet, idx) => {
                              const t = trackById.get(sheet.trackId)
                              const label = (
                                t?.sponsor_name ||
                                t?.name ||
                                'Track'
                              ).slice(0, 22)
                              const submitted = sheet.status === 'submitted'
                              const inProgress = sheet.status === 'in_progress'
                              return (
                                <span
                                  key={`${sheet.trackId}-${idx}`}
                                  title={`${label}: ${sheet.status.replace('_', ' ')}`}
                                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border transition-opacity duration-200 ${
                                    submitted
                                      ? t?.type === 'sponsor'
                                        ? 'bg-orange-500/25 border-orange-400/50 text-orange-100'
                                        : 'bg-green-500/25 border-green-400/50 text-green-100'
                                      : inProgress
                                        ? 'bg-yellow-500/15 border-yellow-500/35 text-yellow-100/90'
                                        : 'bg-white/5 border-white/10 text-gray-500'
                                  }`}
                                >
                                  {label}
                                </span>
                              )
                            })}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {movingJudgeId && (
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-3">
                  <p className="text-sm font-semibold text-white">
                    Move{' '}
                    {selected.judges.find((j) => j.judgeId === movingJudgeId)?.name || 'judge'}
                  </p>
                  <Field
                    label="Destination table"
                    hint="Sheets transfer only for tracks the destination also qualifies for."
                  >
                    <select
                      value={moveDestId}
                      onChange={(e) => previewMove(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select table</option>
                      {destinationOptions.map((c) => (
                        <option key={c.project.id} value={c.project.id}>
                          {c.project.table_number || '—'} · {c.project.title}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {movePreview && (
                    <div className="text-xs text-gray-300 space-y-1">
                      <p>
                        <span className="text-green-300 font-semibold">
                          {movePreview.move.length}
                        </span>{' '}
                        sheet{movePreview.move.length === 1 ? '' : 's'} move
                        {movePreview.move.length > 0 && `: ${movePreview.move.join(', ')}`}
                      </p>
                      {movePreview.drop.length > 0 && (
                        <p>
                          <span className="text-orange-300 font-semibold">
                            {movePreview.drop.length}
                          </span>{' '}
                          dropped (no matching track): {movePreview.drop.join(', ')}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || !moveDestId || !movePreview || movePreview.move.length === 0}
                      onClick={confirmMove}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition"
                    >
                      {busy ? 'Moving…' : 'Confirm move'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setMovingJudgeId(null)
                        setMoveDestId('')
                        setMovePreview(null)
                      }}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
