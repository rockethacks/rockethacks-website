'use client'

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AssignmentStatus, CriteriaType, Track } from '@/types/judging'
import {
  Banner,
  EmptyState,
  ExportButton,
  Field,
  LoadingScreen,
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

type Member = {
  first_name: string | null
  last_name: string | null
  email: string | null
  is_submitter: boolean
}

type AssignmentRow = {
  id: string
  judge_id: string
  project_id: string
  track_context_id: string
  status: AssignmentStatus
  notes: string | null
  judge: { full_name: string | null; email: string } | null
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

type TrackBundle = {
  track: Track
  criteria: CriterionRow[]
  maxPoints: number
  sheets: Sheet[]
  avg: number
  spread: number
  disagreement: number
  eligibilityDisputed: boolean
  submittedCount: number
  pendingCount: number
}

type ProjectCard = {
  project_id: string
  title: string
  table_number: string | null
  about: string | null
  submission_url: string | null
  github_url: string | null
  video_url: string | null
  main_track: Track | null
  sponsor_tracks: Track[]
  members: Member[]
  focus: TrackBundle | null
  otherTracks: TrackBundle[]
  allTracks: TrackBundle[]
  split: boolean
}

type OpenSections = {
  meta: boolean
  trackIds: Set<string>
}

const PAGE = 1000

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

function memberLabel(m: Member) {
  const name = [m.first_name, m.last_name].filter(Boolean).join(' ').trim()
  if (name && m.email) return `${name} · ${m.email}`
  return name || m.email || 'Team member'
}

function buildBundle(
  track: Track,
  criteria: CriterionRow[],
  sheets: Sheet[]
): TrackBundle {
  const scored = criteria.filter((c) => c.type === 'scored')
  const maxPoints = scored.reduce((sum, c) => sum + (c.max_points || 0), 0)
  const done = sheets.filter((s) => s.submitted)
  const totals = done.map((s) => s.total)
  const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0

  let disagreement = 0
  for (const item of scored) {
    const values = done
      .map((s) => s.cells.get(item.id)?.points_value)
      .filter((v): v is number => typeof v === 'number')
    if (values.length < 2 || !item.max_points) continue
    disagreement = Math.max(disagreement, (Math.max(...values) - Math.min(...values)) / item.max_points)
  }

  const eligibilityDisputed = criteria
    .filter((i) => i.type === 'eligibility')
    .some((i) => {
      const vals = done.map((s) => s.cells.get(i.id)?.eligibility_value)
      return vals.includes(true) && vals.includes(false)
    })

  return {
    track,
    criteria,
    maxPoints,
    sheets,
    avg: Math.round(avg * 10) / 10,
    spread: totals.length ? Math.max(...totals) - Math.min(...totals) : 0,
    disagreement,
    eligibilityDisputed,
    submittedCount: done.length,
    pendingCount: sheets.length - done.length,
  }
}

export default function ScorecardsAdminPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading scorecards…" />}>
      <ScorecardsAdminInner />
    </Suspense>
  )
}

function ScorecardsAdminInner() {
  const searchParams = useSearchParams()
  const deepLinkApplied = useRef(false)

  const [tracks, setTracks] = useState<Track[]>([])
  const [trackId, setTrackId] = useState('')
  const [cards, setCards] = useState<ProjectCard[]>([])
  const [bandLabel, setBandLabel] = useState<Map<string, string>>(new Map())
  const [sortBy, setSortBy] = useState<'score' | 'disagreement' | 'table'>('score')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sections, setSections] = useState<Record<string, OpenSections>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadTracks() {
      const supabase = createClient()
      const { data } = await supabase.from('tracks').select('*').order('sort_order').order('name')
      const list = (data || []) as Track[]
      setTracks(list)
      const trackParam = searchParams.get('track')
      setTrackId((prev) => {
        if (prev) return prev
        if (trackParam && list.some((t) => t.id === trackParam)) return trackParam
        return list[0]?.id || ''
      })
    }
    loadTracks()
  }, [searchParams])

  useEffect(() => {
    if (deepLinkApplied.current || cards.length === 0) return
    const projectParam = searchParams.get('project')
    if (!projectParam) return
    if (!cards.some((c) => c.project_id === projectParam)) return
    deepLinkApplied.current = true
    setExpanded(projectParam)
  }, [searchParams, cards])

  const trackById = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks])
  const focusTrack = useMemo(() => tracks.find((t) => t.id === trackId), [tracks, trackId])

  const load = useCallback(
    async (focusId: string) => {
      if (!focusId) return
      setLoading(true)
      setError('')
      const supabase = createClient()

      const [
        projectRes,
        sponsorRes,
        memberRes,
        setRes,
        itemRes,
        bandRes,
      ] = await Promise.all([
        supabase
          .from('projects')
          .select(
            'id, title, table_number, about, submission_url, github_url, video_url, main_track_id, status'
          )
          .eq('status', 'submitted')
          .order('title'),
        supabase.from('project_sponsor_tracks').select('project_id, track_id'),
        supabase
          .from('project_team_members')
          .select('project_id, first_name, last_name, email, is_submitter'),
        supabase.from('criteria_sets').select('id, applies_to, track_id').order('created_at'),
        supabase
          .from('criteria_items')
          .select('id, criteria_set_id, type, title, description, max_points, sort_order')
          .order('sort_order'),
        supabase.from('criteria_bands').select('id, label, criteria_item_id'),
      ])

      if (projectRes.error || sponsorRes.error) {
        setError(projectRes.error?.message || sponsorRes.error?.message || 'Could not load projects.')
        setLoading(false)
        return
      }

      const projects = (projectRes.data || []) as {
        id: string
        title: string
        table_number: string | null
        about: string | null
        submission_url: string | null
        github_url: string | null
        video_url: string | null
        main_track_id: string | null
      }[]

      const sponsorsByProject = new Map<string, string[]>()
      for (const row of (sponsorRes.data || []) as { project_id: string; track_id: string }[]) {
        const list = sponsorsByProject.get(row.project_id) || []
        list.push(row.track_id)
        sponsorsByProject.set(row.project_id, list)
      }

      const membersByProject = new Map<string, Member[]>()
      for (const row of (memberRes.data || []) as (Member & { project_id: string })[]) {
        const list = membersByProject.get(row.project_id) || []
        list.push(row)
        membersByProject.set(row.project_id, list)
      }

      const sets = (setRes.data || []) as {
        id: string
        applies_to: string
        track_id: string | null
      }[]
      const items = (itemRes.data || []) as (CriterionRow & { criteria_set_id: string })[]
      const bands = (bandRes.data || []) as { id: string; label: string; criteria_item_id: string }[]
      setBandLabel(new Map(bands.map((b) => [b.id, b.label])))

      const criteriaBySet = new Map<string, CriterionRow[]>()
      for (const item of items) {
        const list = criteriaBySet.get(item.criteria_set_id) || []
        list.push(item)
        criteriaBySet.set(item.criteria_set_id, list)
      }

      const sharedSet = sets.find((s) => s.applies_to === 'in_house_shared' && !s.track_id)
      const setForTrack = (track: Track) => {
        if (track.type === 'sponsor') {
          return sets.find((s) => s.applies_to === 'sponsor' && s.track_id === track.id)
        }
        return sharedSet
      }

      const assignments: AssignmentRow[] = []
      for (let page = 0; ; page++) {
        const { data, error: aErr } = await supabase
          .from('judge_assignments')
          .select(
            `id, judge_id, project_id, track_context_id, status, notes,
             judge:judge_profiles(full_name, email)`
          )
          .order('assigned_at')
          .range(page * PAGE, page * PAGE + PAGE - 1)
        if (aErr) {
          setError(aErr.message)
          setLoading(false)
          return
        }
        const batch = (data || []) as unknown as AssignmentRow[]
        assignments.push(...batch)
        if (batch.length < PAGE) break
      }

      const scores: ScoreRow[] = []
      for (const part of chunk(
        assignments.map((a) => a.id),
        100
      )) {
        if (!part.length) continue
        const { data } = await supabase
          .from('scores')
          .select('assignment_id, criteria_item_id, eligibility_value, band_id, points_value')
          .in('assignment_id', part)
        scores.push(...((data || []) as ScoreRow[]))
      }

      const cellsByAssignment = new Map<string, Map<string, ScoreRow>>()
      for (const s of scores) {
        const cells = cellsByAssignment.get(s.assignment_id) || new Map<string, ScoreRow>()
        cells.set(s.criteria_item_id, s)
        cellsByAssignment.set(s.assignment_id, cells)
      }

      const assignmentsByProject = new Map<string, AssignmentRow[]>()
      for (const a of assignments) {
        const list = assignmentsByProject.get(a.project_id) || []
        list.push(a)
        assignmentsByProject.set(a.project_id, list)
      }

      const focusProjects = projects.filter((p) => {
        if (p.main_track_id === focusId) return true
        return (sponsorsByProject.get(p.id) || []).includes(focusId)
      })

      // Also include projects that only appear via assignments on the focus track
      // (covers edge cases where main_track_id is null but they were scored there).
      const assignedFocusIds = new Set(
        assignments.filter((a) => a.track_context_id === focusId).map((a) => a.project_id)
      )
      const byId = new Map(projects.map((p) => [p.id, p]))
      for (const id of assignedFocusIds) {
        if (!focusProjects.some((p) => p.id === id) && byId.has(id)) {
          focusProjects.push(byId.get(id)!)
        }
      }

      const built: ProjectCard[] = []

      for (const project of focusProjects) {
        const projectAssignments = assignmentsByProject.get(project.id) || []
        const trackIds = new Set<string>()
        if (project.main_track_id) trackIds.add(project.main_track_id)
        for (const tid of sponsorsByProject.get(project.id) || []) trackIds.add(tid)
        for (const a of projectAssignments) trackIds.add(a.track_context_id)

        const bundles: TrackBundle[] = []
        for (const tid of trackIds) {
          const track = trackById.get(tid)
          if (!track) continue
          const set = setForTrack(track)
          const criteria = set ? criteriaBySet.get(set.id) || [] : []
          const trackAssignments = projectAssignments.filter((a) => a.track_context_id === tid)
          if (trackAssignments.length === 0 && criteria.length === 0) continue

          const sheets: Sheet[] = trackAssignments.map((a) => {
            const cells = cellsByAssignment.get(a.id) || new Map<string, ScoreRow>()
            const scored = criteria.filter((c) => c.type === 'scored')
            const total = scored.reduce((sum, c) => sum + (cells.get(c.id)?.points_value || 0), 0)
            return {
              assignment: a,
              judgeName: a.judge?.full_name || a.judge?.email || 'Judge',
              submitted: a.status === 'submitted',
              total,
              cells,
            }
          })
          sheets.sort((a, b) => Number(b.submitted) - Number(a.submitted) || b.total - a.total)
          if (sheets.length === 0) continue
          bundles.push(buildBundle(track, criteria, sheets))
        }

        bundles.sort((a, b) => {
          if (a.track.id === focusId) return -1
          if (b.track.id === focusId) return 1
          if (a.track.type !== b.track.type) return a.track.type === 'in_house' ? -1 : 1
          return a.track.sort_order - b.track.sort_order || a.track.name.localeCompare(b.track.name)
        })

        if (bundles.length === 0) continue

        const focus = bundles.find((b) => b.track.id === focusId) || null
        const otherTracks = bundles.filter((b) => b.track.id !== focusId)
        const split = bundles.some((b) => b.disagreement >= 0.4 || b.eligibilityDisputed)

        built.push({
          project_id: project.id,
          title: project.title,
          table_number: project.table_number,
          about: project.about,
          submission_url: project.submission_url,
          github_url: project.github_url,
          video_url: project.video_url,
          main_track: project.main_track_id ? trackById.get(project.main_track_id) || null : null,
          sponsor_tracks: (sponsorsByProject.get(project.id) || [])
            .map((id) => trackById.get(id))
            .filter((t): t is Track => !!t),
          members: membersByProject.get(project.id) || [],
          focus,
          otherTracks,
          allTracks: bundles,
          split,
        })
      }

      setCards(built)
      setLoading(false)
    },
    [trackById]
  )

  useEffect(() => {
    if (trackId) {
      setExpanded(null)
      setMessage('')
      load(trackId)
    }
  }, [trackId, load])

  const ensureSections = (card: ProjectCard): OpenSections => {
    const existing = sections[card.project_id]
    if (existing) return existing
    return {
      meta: true,
      trackIds: new Set(card.focus ? [card.focus.track.id] : []),
    }
  }

  const toggleMeta = (projectId: string, card: ProjectCard) => {
    const current = ensureSections(card)
    setSections((prev) => ({
      ...prev,
      [projectId]: { ...current, meta: !current.meta, trackIds: new Set(current.trackIds) },
    }))
  }

  const toggleTrackSection = (projectId: string, card: ProjectCard, tid: string) => {
    const current = ensureSections(card)
    const next = new Set(current.trackIds)
    if (next.has(tid)) next.delete(tid)
    else next.add(tid)
    setSections((prev) => ({
      ...prev,
      [projectId]: { meta: current.meta, trackIds: next },
    }))
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? cards.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            (c.table_number || '').toLowerCase().includes(q) ||
            (c.main_track?.name || '').toLowerCase().includes(q) ||
            c.sponsor_tracks.some((t) => t.name.toLowerCase().includes(q)) ||
            c.members.some(
              (m) =>
                (m.email || '').toLowerCase().includes(q) ||
                `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase().includes(q)
            )
        )
      : cards

    const sorted = [...filtered]
    if (sortBy === 'score') {
      sorted.sort((a, b) => (b.focus?.avg || 0) - (a.focus?.avg || 0))
    } else if (sortBy === 'disagreement') {
      sorted.sort(
        (a, b) =>
          Math.max(...b.allTracks.map((t) => t.disagreement), 0) -
          Math.max(...a.allTracks.map((t) => t.disagreement), 0)
      )
    } else {
      sorted.sort((a, b) => (a.table_number || '').localeCompare(b.table_number || ''))
    }
    return sorted
  }, [cards, search, sortBy])

  const totals = useMemo(
    () => ({
      projects: cards.length,
      withSponsors: cards.filter((c) => c.sponsor_tracks.length > 0).length,
      submitted: cards.reduce((n, c) => n + (c.focus?.submittedCount || 0), 0),
      split: cards.filter((c) => c.split).length,
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
      setMessage('Sheet reopened. The judge can edit and resubmit it.')
      await load(trackId)
    }
  }

  const exportScorecards = () => {
    const focusName = focusTrack?.name || 'Track'
    const answer = (sheet: Sheet, criterion: CriterionRow) => {
      const cell = sheet.cells.get(criterion.id)
      if (!cell) return ''
      if (criterion.type === 'eligibility')
        return cell.eligibility_value === null ? '' : cell.eligibility_value ? 'Yes' : 'No'
      const label = cell.band_id ? bandLabel.get(cell.band_id) : ''
      return cell.points_value === null ? label || '' : `${cell.points_value} (${label || '—'})`
    }

    const long = cards.flatMap((card) =>
      card.allTracks.flatMap((bundle) =>
        bundle.sheets.flatMap((sheet) =>
          bundle.criteria.map((criterion) => ({
            Table: card.table_number || '',
            Project: card.title,
            'Main track': card.main_track?.name || '',
            'Sponsor tracks': card.sponsor_tracks.map((t) => t.sponsor_name || t.name).join(', '),
            'Score track': bundle.track.name,
            'Track type': bundle.track.type === 'sponsor' ? 'Sponsor' : 'In-house',
            Judge: sheet.judgeName,
            Status: sheet.submitted ? 'Submitted' : 'Open',
            Criterion: criterion.title,
            Type: criterion.type === 'scored' ? 'Scored' : 'Eligibility',
            Answer: answer(sheet, criterion),
            Points: sheet.cells.get(criterion.id)?.points_value ?? '',
            'Submission URL': card.submission_url || '',
            GitHub: card.github_url || '',
            Team: card.members.map(memberLabel).join('; '),
            Notes: sheet.assignment.notes || '',
          }))
        )
      )
    )

    const summary = cards.map((c) => ({
      Table: c.table_number || '',
      Project: c.title,
      'Main track': c.main_track?.name || '',
      Sponsors: c.sponsor_tracks.map((t) => t.sponsor_name || t.name).join(', '),
      [`${focusName} avg`]: c.focus?.avg ?? '',
      'Other tracks scored': c.otherTracks.length,
      'Submission URL': c.submission_url || '',
      GitHub: c.github_url || '',
      Team: c.members.map(memberLabel).join('; '),
      Flags: [
        c.split ? 'Judges split' : '',
        c.allTracks.some((t) => t.eligibilityDisputed) ? 'Eligibility disputed' : '',
      ]
        .filter(Boolean)
        .join(', '),
    }))

    const ok = exportWorkbook(`Scorecards_${focusName.slice(0, 20)}`, [
      { name: 'Summary', rows: summary },
      { name: 'Long format', rows: long },
    ])
    if (!ok) setError('Nothing to export for this track yet.')
  }

  return (
    <div className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}
      {message && <Banner tone="success">{message}</Banner>}

      <Panel
        title="Scorecards"
        description="Pick a track to browse its projects. Open any project to see main-track and sponsor scores together, plus the Devpost links and team."
        actions={<ExportButton onClick={exportScorecards} disabled={cards.length === 0} />}
      >
        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Browse by track" hint="Filters the list. Opening a project still shows every track it was scored in.">
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
          <Field label="Order by" hint="Disagreement looks across every track on the project.">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={selectClass}
            >
              <option value="score">Focus-track average</option>
              <option value="disagreement">Judge disagreement</option>
              <option value="table">Table number</option>
            </select>
          </Field>
          <Field label="Find a project" hint="Title, table, track, or team member.">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects"
              className={inputClass}
            />
          </Field>
          <div className="flex items-end">
            <button
              onClick={() => load(trackId)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 text-white text-sm font-semibold rounded-lg transition"
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Projects in view', value: totals.projects },
            { label: 'Also in sponsor tracks', value: totals.withSponsors },
            { label: 'Focus sheets submitted', value: totals.submitted },
            {
              label: 'Worth a second look',
              value: totals.split,
              warn: totals.split > 0,
            },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.warn ? 'text-orange-300' : 'text-white'}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title={focusTrack ? `${focusTrack.name}` : 'Projects'}
        description="Collapsed rows stay quiet. Expand a project for identity, links, team, then score grids per track."
      >
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading scorecards…</div>
        ) : visible.length === 0 ? (
          <EmptyState
            title={cards.length === 0 ? 'Nothing assigned in this track' : 'No project matches'}
            description={
              cards.length === 0
                ? 'Assign judges to this track first, then scores appear here as they submit.'
                : 'Clear the search box to see every project again.'
            }
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {visible.map((card) => {
              const isOpen = expanded === card.project_id
              const open = ensureSections(card)
              const focusAvg = card.focus?.submittedCount ? card.focus.avg : null

              return (
                <li key={card.project_id} className="motion-safe:transition-colors">
                  <button
                    type="button"
                    onClick={() => {
                      setExpanded(isOpen ? null : card.project_id)
                      if (!isOpen && !sections[card.project_id]) {
                        setSections((prev) => ({
                          ...prev,
                          [card.project_id]: {
                            meta: true,
                            trackIds: new Set(card.focus ? [card.focus.track.id] : []),
                          },
                        }))
                      }
                    }}
                    aria-expanded={isOpen}
                    className="w-full text-left p-4 sm:p-5 hover:bg-white/[0.04] transition-colors duration-150"
                  >
                    <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                      <div className="flex-1 min-w-[14rem] space-y-1.5">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          {card.table_number && (
                            <span className="text-xs font-semibold text-gray-500 tabular-nums">
                              {card.table_number}
                            </span>
                          )}
                          <p className="text-white font-semibold text-wrap [text-wrap:balance]">
                            {card.title}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {card.main_track && (
                            <Pill tone="blue">{card.main_track.name}</Pill>
                          )}
                          {card.sponsor_tracks.slice(0, 3).map((t) => (
                            <Pill key={t.id} tone="orange">
                              {t.sponsor_name || t.name}
                            </Pill>
                          ))}
                          {card.sponsor_tracks.length > 3 && (
                            <Pill tone="neutral">+{card.sponsor_tracks.length - 3} more</Pill>
                          )}
                          {!card.main_track && card.sponsor_tracks.length === 0 && (
                            <span className="text-xs text-gray-500">No track on file</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {card.allTracks.length} track
                          {card.allTracks.length === 1 ? '' : 's'} scored
                          {card.focus &&
                            ` · focus ${card.focus.submittedCount}/${card.focus.sheets.length} submitted`}
                          {card.focus && card.focus.submittedCount > 1 && ` · spread ${card.focus.spread}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {card.split && <Pill tone="orange">Judges split</Pill>}
                        {card.allTracks.some((t) => t.eligibilityDisputed) && (
                          <Pill tone="red">Eligibility disputed</Pill>
                        )}
                        {card.focus && card.focus.pendingCount > 0 && (
                          <Pill tone="yellow">Incomplete</Pill>
                        )}
                        <span className="text-yellow-400 font-bold tabular-nums text-lg min-w-[3ch] text-right">
                          {focusAvg ?? '—'}
                        </span>
                        <span
                          className={`text-gray-500 text-xs transition-transform duration-150 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
                          aria-hidden
                        >
                          ▼
                        </span>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 space-y-3">
                      {/* 1. Identity + links + team */}
                      <section className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleMeta(card.project_id, card)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                          aria-expanded={open.meta}
                        >
                          <span className="text-sm font-semibold text-white">Project details</span>
                          <span className="text-xs text-gray-500">
                            {open.meta ? 'Hide' : 'Show'} links & team
                          </span>
                        </button>

                        {open.meta && (
                          <div className="px-4 pb-4 space-y-4 border-t border-white/10">
                            <div className="pt-3 grid gap-3 sm:grid-cols-2">
                              <MetaRow label="Main track">
                                {card.main_track?.name || '—'}
                              </MetaRow>
                              <MetaRow label="Sponsor opt-ins">
                                {card.sponsor_tracks.length
                                  ? card.sponsor_tracks
                                      .map((t) => t.sponsor_name || t.name)
                                      .join(', ')
                                  : 'None'}
                              </MetaRow>
                              <MetaRow label="Submission">
                                {card.submission_url ? (
                                  <a
                                    href={card.submission_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-400 hover:underline break-all"
                                  >
                                    Devpost
                                  </a>
                                ) : (
                                  '—'
                                )}
                              </MetaRow>
                              <MetaRow label="GitHub / demo">
                                {card.github_url ? (
                                  <a
                                    href={card.github_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-400 hover:underline break-all"
                                  >
                                    Open link
                                  </a>
                                ) : (
                                  '—'
                                )}
                              </MetaRow>
                              <MetaRow label="Video">
                                {card.video_url ? (
                                  <a
                                    href={card.video_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-400 hover:underline break-all"
                                  >
                                    Watch
                                  </a>
                                ) : (
                                  '—'
                                )}
                              </MetaRow>
                              <MetaRow label="Table">
                                {card.table_number || 'TBD'}
                              </MetaRow>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-gray-400 mb-2">Team</p>
                              {card.members.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                  No team members imported for this project.
                                </p>
                              ) : (
                                <ul className="space-y-1">
                                  {card.members.map((m, i) => (
                                    <li
                                      key={`${m.email || m.first_name}-${i}`}
                                      className="text-sm text-gray-200 flex flex-wrap items-center gap-2"
                                    >
                                      <span>{memberLabel(m)}</span>
                                      {m.is_submitter && <Pill tone="neutral">Submitter</Pill>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {card.about && (
                              <div>
                                <p className="text-xs font-medium text-gray-400 mb-1">About</p>
                                <p className="text-sm text-gray-300 leading-relaxed max-w-prose text-pretty">
                                  {card.about}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </section>

                      {/* 2. Scores per track, focus open by default */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-400 px-1">
                          Scores by track · {card.allTracks.length} total
                        </p>
                        {card.allTracks.map((bundle) => {
                          const trackOpen = open.trackIds.has(bundle.track.id)
                          const isFocus = bundle.track.id === trackId
                          return (
                            <section
                              key={bundle.track.id}
                              className="rounded-xl border border-white/10 overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  toggleTrackSection(card.project_id, card, bundle.track.id)
                                }
                                className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors"
                                aria-expanded={trackOpen}
                              >
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                  <span className="text-sm font-semibold text-white truncate">
                                    {bundle.track.name}
                                  </span>
                                  <Pill tone={bundle.track.type === 'sponsor' ? 'orange' : 'blue'}>
                                    {bundle.track.type === 'sponsor' ? 'Sponsor' : 'Main'}
                                  </Pill>
                                  {isFocus && <Pill tone="yellow">Browsing</Pill>}
                                  {bundle.disagreement >= 0.4 && (
                                    <Pill tone="orange">Judges split</Pill>
                                  )}
                                  {bundle.eligibilityDisputed && (
                                    <Pill tone="red">Eligibility disputed</Pill>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                                  <span>
                                    {bundle.submittedCount}/{bundle.sheets.length} submitted
                                    {bundle.maxPoints > 0 && ` · /${bundle.maxPoints}`}
                                  </span>
                                  <span className="text-yellow-400 font-bold tabular-nums text-sm">
                                    {bundle.submittedCount ? bundle.avg : '—'}
                                  </span>
                                  <span
                                    className={`transition-transform duration-150 motion-reduce:transition-none ${trackOpen ? 'rotate-180' : ''}`}
                                    aria-hidden
                                  >
                                    ▼
                                  </span>
                                </div>
                              </button>

                              {trackOpen && (
                                <div className="border-t border-white/10 px-3 sm:px-4 pb-4 pt-2 space-y-3">
                                  {bundle.criteria.length === 0 ? (
                                    <Banner tone="warning">
                                      No rubric for this track yet.{' '}
                                      <Link
                                        href="/admin/judging/criteria"
                                        className="underline"
                                      >
                                        Add criteria
                                      </Link>
                                    </Banner>
                                  ) : (
                                    <ScoreGrid
                                      bundle={bundle}
                                      bandLabel={bandLabel}
                                      onReopen={reopen}
                                    />
                                  )}
                                </div>
                              )}
                            </section>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
      <div className="text-sm text-gray-200">{children}</div>
    </div>
  )
}

function ScoreGrid({
  bundle,
  bandLabel,
  onReopen,
}: {
  bundle: TrackBundle
  bandLabel: Map<string, string>
  onReopen: (id: string) => void
}) {
  return (
    <div className="space-y-3">
      {bundle.submittedCount === 0 && (
        <Banner tone="warning">No submitted sheets on this track yet.</Banner>
      )}

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left min-w-[560px]">
          <thead>
            <tr className="text-gray-400">
              <th className="p-2.5 font-medium w-56">Criterion</th>
              {bundle.sheets.map((sheet) => (
                <th key={sheet.assignment.id} className="p-2.5 font-medium">
                  <span className="block text-white truncate max-w-[9rem]">
                    {sheet.judgeName}
                  </span>
                  <span className="block text-xs font-normal mt-0.5">
                    {sheet.submitted ? (
                      <span className="text-green-300">Submitted</span>
                    ) : (
                      <span className="text-yellow-300">
                        {sheet.assignment.status === 'in_progress' ? 'In progress' : 'Not started'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bundle.criteria.map((item) => {
              const values = bundle.sheets
                .filter((s) => s.submitted)
                .map((s) => s.cells.get(item.id)?.points_value)
                .filter((v): v is number => typeof v === 'number')
              const range = values.length > 1 ? Math.max(...values) - Math.min(...values) : 0
              const rowSplit =
                item.type === 'scored' &&
                item.max_points != null &&
                range / item.max_points >= 0.4

              return (
                <tr key={item.id} className="border-t border-white/10 align-top">
                  <td className="p-2.5">
                    <p className="text-gray-200 font-medium">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.type === 'eligibility' ? 'Yes / no gate' : `out of ${item.max_points}`}
                      {rowSplit && (
                        <span className="text-orange-300"> · {range} pts apart</span>
                      )}
                    </p>
                  </td>
                  {bundle.sheets.map((sheet) => {
                    const cell = sheet.cells.get(item.id)
                    if (!cell) {
                      return (
                        <td key={sheet.assignment.id} className="p-2.5 text-gray-600">
                          —
                        </td>
                      )
                    }
                    if (item.type === 'eligibility') {
                      return (
                        <td key={sheet.assignment.id} className="p-2.5">
                          {cell.eligibility_value === true && <Pill tone="green">Yes</Pill>}
                          {cell.eligibility_value === false && <Pill tone="red">No</Pill>}
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
              <td className="p-2.5 text-white font-semibold">Total</td>
              {bundle.sheets.map((sheet) => (
                <td
                  key={sheet.assignment.id}
                  className="p-2.5 font-bold tabular-nums text-yellow-400"
                >
                  {sheet.submitted ? sheet.total : '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {bundle.sheets.some((s) => s.assignment.notes) && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-400">Judge notes</p>
          {bundle.sheets
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
        {bundle.sheets
          .filter((s) => s.submitted)
          .map((s) => (
            <button
              key={s.assignment.id}
              type="button"
              onClick={() => onReopen(s.assignment.id)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
            >
              Reopen {s.judgeName}&apos;s sheet
            </button>
          ))}
      </div>
    </div>
  )
}
