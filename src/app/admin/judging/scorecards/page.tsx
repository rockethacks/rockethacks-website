'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AssignmentStatus, CriteriaType, Track } from '@/types/judging'
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

type CriterionRow = {
  id: string
  type: CriteriaType
  title: string
  description: string | null
  max_points: number | null
  sort_order: number
}

type AssignmentRow = {
  id: string
  judge_id: string
  project_id: string
  status: AssignmentStatus
  notes: string | null
  judge: { full_name: string | null; email: string } | null
  project: { title: string; table_number: string | null } | null
}

type ScoreRow = {
  assignment_id: string
  criteria_item_id: string
  eligibility_value: boolean | null
  band_id: string | null
  points_value: number | null
}

type Sheet = {
  assignment: AssignmentRow
  judgeName: string
  submitted: boolean
  total: number
  cells: Map<string, ScoreRow>
}

type ProjectCard = {
  project_id: string
  title: string
  table_number: string | null
  sheets: Sheet[]
  submittedCount: number
  pendingCount: number
  avg: number
  spread: number
  disagreement: number
  eligibilityDisputed: boolean
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function heatClass(points: number, max: number) {
  if (max <= 0) return 'bg-white/5 text-gray-200'
  const ratio = points / max
  if (ratio >= 0.85) return 'bg-green-500/20 text-green-200'
  if (ratio >= 0.6) return 'bg-blue-500/20 text-blue-100'
  if (ratio >= 0.35) return 'bg-yellow-500/20 text-yellow-100'
  return 'bg-red-500/20 text-red-200'
}

export default function ScorecardsAdminPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [trackId, setTrackId] = useState('')
  const [criteria, setCriteria] = useState<CriterionRow[]>([])
  const [bandLabel, setBandLabel] = useState<Map<string, string>>(new Map())
  const [cards, setCards] = useState<ProjectCard[]>([])
  const [rubricMissing, setRubricMissing] = useState(false)
  const [sortBy, setSortBy] = useState<'score' | 'disagreement' | 'table'>('score')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadTracks() {
      const supabase = createClient()
      const { data } = await supabase.from('tracks').select('*').order('sort_order').order('name')
      const list = (data || []) as Track[]
      setTracks(list)
      setTrackId((prev) => prev || list[0]?.id || '')
    }
    loadTracks()
  }, [])

  const loadTrack = useCallback(
    async (tid: string, track: Track | undefined) => {
      if (!tid || !track) return
      setLoading(true)
      setError('')
      setRubricMissing(false)
      const supabase = createClient()

      const setQuery = supabase.from('criteria_sets').select('id').order('created_at')
      const { data: setRows } =
        track.type === 'sponsor'
          ? await setQuery.eq('applies_to', 'sponsor').eq('track_id', track.id)
          : await setQuery.eq('applies_to', 'in_house_shared').is('track_id', null)

      const setId = (setRows || [])[0]?.id as string | undefined
      if (!setId) {
        setRubricMissing(true)
        setCriteria([])
        setCards([])
        setLoading(false)
        return
      }

      const [itemRes, assignmentRes] = await Promise.all([
        supabase
          .from('criteria_items')
          .select('id, type, title, description, max_points, sort_order')
          .eq('criteria_set_id', setId)
          .order('sort_order'),
        supabase
          .from('judge_assignments')
          .select(
            `id, judge_id, project_id, status, notes,
             judge:judge_profiles(full_name, email),
             project:projects(title, table_number)`
          )
          .eq('track_context_id', tid),
      ])

      if (itemRes.error || assignmentRes.error) {
        setError(itemRes.error?.message || assignmentRes.error?.message || 'Could not load scores.')
        setLoading(false)
        return
      }

      const items = (itemRes.data || []) as CriterionRow[]
      const assignments = (assignmentRes.data || []) as unknown as AssignmentRow[]
      setCriteria(items)

      const { data: bands } = await supabase
        .from('criteria_bands')
        .select('id, label')
        .in(
          'criteria_item_id',
          items.map((i) => i.id)
        )
      setBandLabel(
        new Map(((bands || []) as { id: string; label: string }[]).map((b) => [b.id, b.label]))
      )

      const scores: ScoreRow[] = []
      for (const part of chunk(
        assignments.map((a) => a.id),
        100
      )) {
        if (part.length === 0) continue
        const { data } = await supabase
          .from('scores')
          .select('assignment_id, criteria_item_id, eligibility_value, band_id, points_value')
          .in('assignment_id', part)
        scores.push(...((data || []) as ScoreRow[]))
      }

      const byAssignment = new Map<string, Map<string, ScoreRow>>()
      for (const s of scores) {
        const cells = byAssignment.get(s.assignment_id) || new Map<string, ScoreRow>()
        cells.set(s.criteria_item_id, s)
        byAssignment.set(s.assignment_id, cells)
      }

      const scoredItems = items.filter((i) => i.type === 'scored')
      const byProject = new Map<string, Sheet[]>()
      for (const a of assignments) {
        const cells = byAssignment.get(a.id) || new Map<string, ScoreRow>()
        const total = scoredItems.reduce((sum, i) => sum + (cells.get(i.id)?.points_value || 0), 0)
        const list = byProject.get(a.project_id) || []
        list.push({
          assignment: a,
          judgeName: a.judge?.full_name || a.judge?.email || 'Judge',
          submitted: a.status === 'submitted',
          total,
          cells,
        })
        byProject.set(a.project_id, list)
      }

      const built: ProjectCard[] = []
      for (const [project_id, sheetList] of byProject) {
        sheetList.sort((a, b) => Number(b.submitted) - Number(a.submitted) || b.total - a.total)
        const done = sheetList.filter((s) => s.submitted)
        const totals = done.map((s) => s.total)
        const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0

        let disagreement = 0
        for (const item of scoredItems) {
          const values = done
            .map((s) => s.cells.get(item.id)?.points_value)
            .filter((v): v is number => typeof v === 'number')
          if (values.length < 2 || !item.max_points) continue
          const range = Math.max(...values) - Math.min(...values)
          disagreement = Math.max(disagreement, range / item.max_points)
        }

        const eligibilityValues = items
          .filter((i) => i.type === 'eligibility')
          .map((i) => done.map((s) => s.cells.get(i.id)?.eligibility_value))
        const eligibilityDisputed = eligibilityValues.some(
          (vals) => vals.includes(true) && vals.includes(false)
        )

        built.push({
          project_id,
          title: sheetList[0].assignment.project?.title || 'Project',
          table_number: sheetList[0].assignment.project?.table_number ?? null,
          sheets: sheetList,
          submittedCount: done.length,
          pendingCount: sheetList.length - done.length,
          avg: Math.round(avg * 10) / 10,
          spread: totals.length ? Math.max(...totals) - Math.min(...totals) : 0,
          disagreement,
          eligibilityDisputed,
        })
      }

      setCards(built)
      setLoading(false)
    },
    []
  )

  const track = useMemo(() => tracks.find((t) => t.id === trackId), [tracks, trackId])

  useEffect(() => {
    if (trackId && track) {
      setExpanded(null)
      setMessage('')
      loadTrack(trackId, track)
    }
  }, [trackId, track, loadTrack])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? cards.filter(
          (c) =>
            c.title.toLowerCase().includes(q) || (c.table_number || '').toLowerCase().includes(q)
        )
      : cards
    const sorted = [...filtered]
    if (sortBy === 'score') sorted.sort((a, b) => b.avg - a.avg)
    if (sortBy === 'disagreement') sorted.sort((a, b) => b.disagreement - a.disagreement)
    if (sortBy === 'table')
      sorted.sort((a, b) => (a.table_number || '').localeCompare(b.table_number || ''))
    return sorted
  }, [cards, search, sortBy])

  const totals = useMemo(
    () => ({
      projects: cards.length,
      submitted: cards.reduce((n, c) => n + c.submittedCount, 0),
      pending: cards.reduce((n, c) => n + c.pendingCount, 0),
      split: cards.filter((c) => c.disagreement >= 0.4 || c.eligibilityDisputed).length,
    }),
    [cards]
  )

  const reopen = async (assignmentId: string) => {
    const supabase = createClient()
    const { error: uErr } = await supabase
      .from('judge_assignments')
      .update({ status: 'in_progress', submitted_at: null })
      .eq('id', assignmentId)
    if (uErr) setError(uErr.message)
    else {
      setMessage('Sheet reopened. The judge can edit and resubmit it, and the change is in Audit.')
      await loadTrack(trackId, track)
    }
  }

  const maxPoints = criteria.reduce((sum, c) => sum + (c.max_points || 0), 0)

  const exportScorecards = () => {
    const trackName = track?.name || 'Track'
    const answer = (sheet: Sheet, criterion: CriterionRow) => {
      const cell = sheet.cells.get(criterion.id)
      if (!cell) return ''
      if (criterion.type === 'eligibility')
        return cell.eligibility_value === null ? '' : cell.eligibility_value ? 'Yes' : 'No'
      const label = cell.band_id ? bandLabel.get(cell.band_id) : ''
      return cell.points_value === null ? label || '' : `${cell.points_value} (${label || '—'})`
    }

    const long = cards.flatMap((card) =>
      card.sheets.flatMap((sheet) =>
        criteria.map((criterion) => ({
          Track: trackName,
          Table: card.table_number || '',
          Project: card.title,
          Judge: sheet.judgeName,
          Status: sheet.submitted ? 'Submitted' : 'Open',
          Criterion: criterion.title,
          Type: criterion.type === 'scored' ? 'Scored' : 'Eligibility',
          'Max points': criterion.max_points ?? '',
          Answer: answer(sheet, criterion),
          Points: sheet.cells.get(criterion.id)?.points_value ?? '',
          Notes: sheet.assignment.notes || '',
        }))
      )
    )

    const wide = cards.flatMap((card) =>
      card.sheets.map((sheet) => {
        const row: Record<string, string | number | null> = {
          Table: card.table_number || '',
          Project: card.title,
          Judge: sheet.judgeName,
          Status: sheet.submitted ? 'Submitted' : 'Open',
          Total: sheet.total,
        }
        for (const criterion of criteria) row[criterion.title] = answer(sheet, criterion)
        row['Notes'] = sheet.assignment.notes || ''
        return row
      })
    )

    const ok = exportWorkbook(`Scorecards_${trackName.slice(0, 20)}`, [
      { name: 'By judge', rows: wide },
      { name: 'Long format', rows: long },
      {
        name: 'Summary',
        rows: cards.map((c) => ({
          Table: c.table_number || '',
          Project: c.title,
          'Average score': c.avg,
          'Max possible': maxPoints,
          'Sheets submitted': c.submittedCount,
          'Still open': c.pendingCount,
          Spread: c.spread,
          'Judges split': c.disagreement >= 0.4 ? 'Yes' : 'No',
          'Eligibility disputed': c.eligibilityDisputed ? 'Yes' : 'No',
        })),
      },
    ])
    if (!ok) setError('Nothing to export for this track yet.')
  }

  return (
    <div className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}
      {message && <Banner tone="success">{message}</Banner>}

      <Panel
        title="Scorecards"
        description="Every judge's answer for every criterion, one project at a time. Use it to sanity-check a close result before you lock in a winner."
        actions={<ExportButton onClick={exportScorecards} disabled={cards.length === 0} />}
      >
        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Track" hint="Sponsor tracks use their own rubric.">
            <select
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              className={selectClass}
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type === 'sponsor' ? 'sponsor' : 'in-house'})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Order by" hint="Disagreement surfaces the projects judges saw differently.">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={selectClass}
            >
              <option value="score">Average score</option>
              <option value="disagreement">Judge disagreement</option>
              <option value="table">Table number</option>
            </select>
          </Field>
          <Field label="Find a project" hint="Title or table number.">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects"
              className={inputClass}
            />
          </Field>
          <div className="flex items-end">
            <button
              onClick={() => loadTrack(trackId, track)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 text-white text-sm font-semibold rounded-lg transition"
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Projects', value: totals.projects, tone: 'text-white' },
            { label: 'Sheets submitted', value: totals.submitted, tone: 'text-white' },
            {
              label: 'Still open',
              value: totals.pending,
              tone: totals.pending > 0 ? 'text-yellow-300' : 'text-white',
            },
            {
              label: 'Worth a second look',
              value: totals.split,
              tone: totals.split > 0 ? 'text-orange-300' : 'text-white',
            },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </Panel>

      {rubricMissing ? (
        <Panel title={track?.name || 'Track'}>
          <EmptyState
            title="This track has no rubric"
            description="Judges cannot score a track without criteria, so there is nothing to show. Build one on the Criteria tab."
            action={
              <Link href="/admin/judging/criteria" className="text-sm text-blue-400 hover:underline">
                Go to Criteria
              </Link>
            }
          />
        </Panel>
      ) : (
        <Panel
          title={`${track?.name || 'Track'} — ${maxPoints} points per sheet`}
          description="Select a project to open the judge-by-criterion grid. Cells are shaded by how much of the criterion's points the judge awarded."
        >
          {visible.length === 0 ? (
            <EmptyState
              title={cards.length === 0 ? 'Nothing assigned in this track' : 'No project matches'}
              description={
                cards.length === 0
                  ? 'Assign judges to this track first, then their scores appear here as they submit.'
                  : 'Clear the search box to see every project again.'
              }
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {visible.map((card) => {
                const isOpen = expanded === card.project_id
                const split = card.disagreement >= 0.4
                return (
                  <li key={card.project_id}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : card.project_id)}
                      aria-expanded={isOpen}
                      className="w-full text-left p-4 sm:p-5 hover:bg-white/5 transition"
                    >
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="flex-1 min-w-[12rem]">
                          <p className="text-white font-semibold truncate">{card.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Table {card.table_number || 'TBD'} · {card.submittedCount} submitted
                            {card.pendingCount > 0 && ` · ${card.pendingCount} open`}
                            {card.submittedCount > 1 && ` · spread ${card.spread} pts`}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {split && <Pill tone="orange">Judges split</Pill>}
                          {card.eligibilityDisputed && <Pill tone="red">Eligibility disputed</Pill>}
                          {card.pendingCount > 0 && <Pill tone="yellow">Incomplete</Pill>}
                          <span className="text-yellow-400 font-bold tabular-nums">
                            {card.submittedCount ? card.avg : '—'}
                          </span>
                          <span className="text-gray-500 text-xs">{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-5 space-y-4">
                        {card.submittedCount === 0 && (
                          <Banner tone="warning">
                            No judge has submitted this sheet yet, so the grid below is empty or
                            partial.
                          </Banner>
                        )}

                        <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-sm text-left min-w-[640px]">
                            <thead>
                              <tr className="text-gray-400">
                                <th className="p-3 font-medium w-64">Criterion</th>
                                {card.sheets.map((sheet) => (
                                  <th key={sheet.assignment.id} className="p-3 font-medium">
                                    <span className="block text-white truncate max-w-[10rem]">
                                      {sheet.judgeName}
                                    </span>
                                    <span className="block text-xs font-normal mt-0.5">
                                      {sheet.submitted ? (
                                        <span className="text-green-300">Submitted</span>
                                      ) : (
                                        <span className="text-yellow-300">
                                          {sheet.assignment.status === 'in_progress'
                                            ? 'In progress'
                                            : 'Not started'}
                                        </span>
                                      )}
                                    </span>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {criteria.map((item) => {
                                const values = card.sheets
                                  .filter((s) => s.submitted)
                                  .map((s) => s.cells.get(item.id)?.points_value)
                                  .filter((v): v is number => typeof v === 'number')
                                const range =
                                  values.length > 1 ? Math.max(...values) - Math.min(...values) : 0
                                const rowSplit =
                                  item.type === 'scored' &&
                                  item.max_points != null &&
                                  range / item.max_points >= 0.4

                                return (
                                  <tr key={item.id} className="border-t border-white/10 align-top">
                                    <td className="p-3">
                                      <p className="text-gray-200 font-medium">{item.title}</p>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {item.type === 'eligibility'
                                          ? 'Yes / no gate'
                                          : `out of ${item.max_points}`}
                                        {rowSplit && (
                                          <span className="text-orange-300">
                                            {' '}
                                            · {range} pts apart
                                          </span>
                                        )}
                                      </p>
                                    </td>
                                    {card.sheets.map((sheet) => {
                                      const cell = sheet.cells.get(item.id)
                                      if (!cell) {
                                        return (
                                          <td
                                            key={sheet.assignment.id}
                                            className="p-3 text-gray-600"
                                          >
                                            —
                                          </td>
                                        )
                                      }
                                      if (item.type === 'eligibility') {
                                        return (
                                          <td key={sheet.assignment.id} className="p-3">
                                            {cell.eligibility_value === true && (
                                              <Pill tone="green">Yes</Pill>
                                            )}
                                            {cell.eligibility_value === false && (
                                              <Pill tone="red">No</Pill>
                                            )}
                                            {cell.eligibility_value == null && (
                                              <span className="text-gray-600">—</span>
                                            )}
                                          </td>
                                        )
                                      }
                                      const points = cell.points_value || 0
                                      return (
                                        <td key={sheet.assignment.id} className="p-2">
                                          <div
                                            className={`rounded-lg px-3 py-2 ${heatClass(points, item.max_points || 0)}`}
                                          >
                                            <span className="font-bold tabular-nums">{points}</span>
                                            {cell.band_id && bandLabel.get(cell.band_id) && (
                                              <span className="block text-xs opacity-80 mt-0.5 truncate">
                                                {bandLabel.get(cell.band_id)}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      )
                                    })}
                                  </tr>
                                )
                              })}
                              <tr className="border-t border-white/20 bg-white/5">
                                <td className="p-3 text-white font-semibold">Total</td>
                                {card.sheets.map((sheet) => (
                                  <td
                                    key={sheet.assignment.id}
                                    className="p-3 font-bold tabular-nums text-yellow-400"
                                  >
                                    {sheet.submitted ? sheet.total : '—'}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {card.sheets.some((s) => s.assignment.notes) && (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-white">Judge notes</p>
                            {card.sheets
                              .filter((s) => s.assignment.notes)
                              .map((s) => (
                                <p key={s.assignment.id} className="text-sm text-gray-300">
                                  <span className="text-gray-500">{s.judgeName}: </span>
                                  {s.assignment.notes}
                                </p>
                              ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {card.sheets
                            .filter((s) => s.submitted)
                            .map((s) => (
                              <button
                                key={s.assignment.id}
                                onClick={() => reopen(s.assignment.id)}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
                              >
                                Reopen {s.judgeName}&apos;s sheet
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      )}
    </div>
  )
}
