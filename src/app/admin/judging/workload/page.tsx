'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AssignmentStatus, JudgeProfile, JudgingSettings, Track } from '@/types/judging'
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
import { exportWorkbook, minutes as toMinutes } from '@/lib/judging/export'
import {
  FALLBACK_SETTINGS,
  buildVisits,
  formatDuration,
  minutesLabel,
  visitsPerJudge,
  type Visit,
} from '@/lib/judging/visits'

type AssignmentRow = {
  id: string
  judge_id: string
  project_id: string
  track_context_id: string
  status: AssignmentStatus
  project: { title: string; table_number: string | null } | null
}

type JudgeLoad = {
  judge: JudgeProfile
  visits: Visit<AssignmentRow>[]
  sheets: number
  seconds: number
  submitted: number
  mainVisits: number
  sponsorOnlyVisits: number
}

const PAGE = 1000

function initials(judge: JudgeProfile) {
  const source = judge.full_name?.trim() || judge.email
  return source
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function WorkloadAdminPage() {
  const [settings, setSettings] = useState<JudgingSettings>(FALLBACK_SETTINGS)
  const [tracks, setTracks] = useState<Track[]>([])
  const [judges, setJudges] = useState<JudgeProfile[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [trackFilter, setTrackFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [windowMinutes, setWindowMinutes] = useState(60)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const [settingsRes, trackRes, judgeRes] = await Promise.all([
      supabase.from('judging_settings').select('*').maybeSingle(),
      supabase.from('tracks').select('*').order('sort_order').order('name'),
      supabase.from('judge_profiles').select('*').order('full_name'),
    ])

    if (trackRes.error || judgeRes.error) {
      setError(trackRes.error?.message || judgeRes.error?.message || 'Could not load judges.')
      setLoading(false)
      return
    }

    if (settingsRes.data) {
      const s = settingsRes.data as JudgingSettings
      setSettings(s)
      setWindowMinutes(s.window_minutes)
    }

    const collected: AssignmentRow[] = []
    for (let page = 0; ; page++) {
      const { data, error: aErr } = await supabase
        .from('judge_assignments')
        .select(
          `id, judge_id, project_id, track_context_id, status,
           project:projects(title, table_number)`
        )
        .order('assigned_at')
        .range(page * PAGE, page * PAGE + PAGE - 1)

      if (aErr) {
        setError(aErr.message)
        setLoading(false)
        return
      }
      const batch = (data || []) as unknown as AssignmentRow[]
      collected.push(...batch)
      if (batch.length < PAGE) break
    }

    setTracks((trackRes.data || []) as Track[])
    setJudges((judgeRes.data || []) as JudgeProfile[])
    setAssignments(collected)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const trackById = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks])

  const scoped = useMemo(
    () =>
      trackFilter === 'all'
        ? assignments
        : assignments.filter((a) => a.track_context_id === trackFilter),
    [assignments, trackFilter]
  )

  const visits = useMemo(
    () => buildVisits(scoped, trackById, settings),
    [scoped, trackById, settings]
  )

  const loads = useMemo<JudgeLoad[]>(() => {
    const byJudge = new Map<string, Visit<AssignmentRow>[]>()
    for (const visit of visits) {
      const list = byJudge.get(visit.judgeId) || []
      list.push(visit)
      byJudge.set(visit.judgeId, list)
    }

    return judges
      .map((judge) => {
        const list = (byJudge.get(judge.user_id) || []).sort((a, b) =>
          (a.assignments[0]?.project?.table_number || '').localeCompare(
            b.assignments[0]?.project?.table_number || ''
          )
        )
        let sheets = 0
        let seconds = 0
        let submitted = 0
        let mainVisits = 0
        let sponsorOnlyVisits = 0

        for (const visit of list) {
          sheets += visit.assignments.length
          seconds += visit.seconds
          submitted += visit.submitted
          const hasMain = visit.trackIds.some((id) => trackById.get(id)?.type === 'in_house')
          if (hasMain) mainVisits++
          else sponsorOnlyVisits++
        }

        return { judge, visits: list, sheets, seconds, submitted, mainVisits, sponsorOnlyVisits }
      })
      .sort(
        (a, b) =>
          b.visits.length - a.visits.length ||
          (a.judge.full_name || '').localeCompare(b.judge.full_name || '')
      )
  }, [judges, visits, trackById])

  const visibleLoads = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return loads
    return loads.filter((l) =>
      [l.judge.full_name, l.judge.email, l.judge.company, l.judge.industry]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    )
  }, [loads, search])

  const windowSeconds = windowMinutes * 60

  const stats = useMemo(() => {
    const seconds = loads.map((l) => l.seconds)
    const totalVisits = visits.length
    const totalSheets = scoped.length
    const avgVisit = totalVisits
      ? Math.round(visits.reduce((sum, v) => sum + v.seconds, 0) / totalVisits)
      : settings.default_visit_seconds + settings.transition_seconds
    const perJudge = visitsPerJudge(windowMinutes, avgVisit)
    return {
      tables: new Set(visits.map((v) => v.projectId)).size,
      totalVisits,
      totalSheets,
      avgVisit,
      over: loads.filter((l) => l.seconds > windowSeconds).length,
      idle: loads.filter((l) => l.visits.length === 0).length,
      longest: seconds.length ? Math.max(...seconds) : 0,
      needed: perJudge > 0 ? Math.ceil(totalVisits / perJudge) : 0,
      perJudge,
    }
  }, [loads, visits, scoped.length, windowMinutes, windowSeconds, settings])

  const trackLoad = useMemo(() => {
    const byTrack = new Map<string, { sheets: number; projects: Set<string>; judges: Set<string> }>()
    for (const row of assignments) {
      const entry = byTrack.get(row.track_context_id) || {
        sheets: 0,
        projects: new Set<string>(),
        judges: new Set<string>(),
      }
      entry.sheets++
      entry.projects.add(row.project_id)
      entry.judges.add(row.judge_id)
      byTrack.set(row.track_context_id, entry)
    }
    return Array.from(byTrack.entries())
      .map(([trackId, entry]) => ({
        track: trackById.get(trackId),
        sheets: entry.sheets,
        projects: entry.projects.size,
        judges: entry.judges.size,
      }))
      .sort((a, b) => b.sheets - a.sheets)
  }, [assignments, trackById])

  const scale = Math.max(stats.longest, windowSeconds, 1)

  const exportWorkload = () => {
    exportWorkbook('Workload', [
      {
        name: 'Judges',
        rows: loads.map((l) => ({
          Judge: l.judge.full_name || l.judge.email,
          Email: l.judge.email,
          Company: l.judge.company || '',
          Visits: l.visits.length,
          Sheets: l.sheets,
          'Free ride-alongs': l.sheets - l.visits.length,
          'Sponsor-only stops': l.sponsorOnlyVisits,
          Minutes: toMinutes(l.seconds),
          'Window (min)': windowMinutes,
          'Headroom (min)': toMinutes(windowSeconds - l.seconds),
          Submitted: l.submitted,
          Tables: l.visits
            .map((v) => v.assignments[0]?.project?.table_number || v.assignments[0]?.project?.title)
            .filter(Boolean)
            .join(', '),
        })),
      },
      {
        name: 'Visits',
        rows: loads.flatMap((l) =>
          l.visits.map((v) => ({
            Judge: l.judge.full_name || l.judge.email,
            Table: v.assignments[0]?.project?.table_number || '',
            Project: v.assignments[0]?.project?.title || '',
            Rubrics: v.trackIds
              .map((id) => trackById.get(id)?.name)
              .filter(Boolean)
              .join(', '),
            Minutes: toMinutes(v.seconds),
            Done: v.done ? 'Yes' : 'No',
          }))
        ),
      },
      {
        name: 'Tracks',
        rows: trackLoad.map((t) => ({
          Track: t.track?.name || 'Unknown',
          Type: t.track?.type === 'sponsor' ? 'Sponsor' : 'In-house',
          'Linked judges only': t.track?.sponsor_judges_only ? 'Yes' : 'No',
          Sheets: t.sheets,
          Projects: t.projects,
          Judges: t.judges,
        })),
      },
    ])
  }

  const toneFor = (seconds: number) => {
    if (seconds === 0) return 'idle'
    if (seconds <= windowSeconds) return 'ok'
    if (seconds <= settings.window_max_minutes * 60) return 'warn'
    return 'over'
  }

  const barClass = {
    idle: 'bg-white/10',
    ok: 'bg-blue-500',
    warn: 'bg-yellow-500',
    over: 'bg-red-500',
  } as const

  const sponsorBarClass = {
    idle: 'bg-white/5',
    ok: 'bg-blue-400/50',
    warn: 'bg-yellow-400/50',
    over: 'bg-red-400/50',
  } as const

  const pillTone = { idle: 'neutral', ok: 'green', warn: 'yellow', over: 'red' } as const

  if (loading) {
    return (
      <Panel>
        <div className="p-10 text-center text-gray-400 text-sm">Loading judge workload…</div>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel title="Workload">
        <div className="p-5 space-y-3">
          <Banner tone="error">{error}</Banner>
          <button
            onClick={load}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
          >
            Try again
          </button>
        </div>
      </Panel>
    )
  }

  if (judges.length === 0) {
    return (
      <Panel title="Workload">
        <EmptyState
          title="No judges yet"
          description="Invite judges first. Their load appears here as soon as you assign projects to them."
          action={
            <Link href="/admin/judging/judges" className="text-sm text-blue-400 hover:underline">
              Go to Judges
            </Link>
          }
        />
      </Panel>
    )
  }

  if (assignments.length === 0) {
    return (
      <Panel title="Workload">
        <EmptyState
          title="Nothing assigned yet"
          description="Build the judging plan first. This tab then shows how long each judge is on the floor and where the day is uneven."
          action={
            <Link href="/admin/judging/assignments" className="text-sm text-blue-400 hover:underline">
              Go to Assignments
            </Link>
          }
        />
      </Panel>
    )
  }

  return (
    <div className="space-y-6">
      <Panel
        title="Judge workload"
        description="Measured in table visits. One visit is one judge at one table, and it costs the same whether they fill one rubric there or five."
        actions={<ExportButton onClick={exportWorkload} />}
      >
        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            label="Judging window (minutes)"
            hint={`Everything is coloured against this. Your hard stop is ${settings.window_max_minutes} min.`}
          >
            <input
              type="number"
              min={15}
              max={240}
              value={windowMinutes}
              onChange={(e) => setWindowMinutes(Math.max(15, Number(e.target.value) || 60))}
              className={inputClass}
            />
          </Field>
          <Field label="Track" hint="Narrow the view to one track's contribution.">
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className={selectClass}
            >
              <option value="all">All tracks</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Find a judge" hint="Name, email, company or industry.">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search judges"
              className={inputClass}
            />
          </Field>
          <div className="flex items-end">
            <button
              onClick={load}
              className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-lg transition"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Table visits"
            value={stats.totalVisits}
            note={`${stats.totalSheets} sheets across ${stats.tables} tables`}
          />
          <StatCard
            label="Average visit"
            value={Math.round(stats.avgVisit / 60)}
            note={`minutes · ${stats.perJudge} visits fit in ${windowMinutes} min`}
          />
          <StatCard
            label="Over the window"
            value={stats.over}
            note={stats.idle > 0 ? `${stats.idle} with nothing` : 'no idle judges'}
            tone={stats.over > 0 ? 'over' : 'ok'}
          />
          <StatCard
            label="Judges needed"
            value={stats.needed}
            note={`to finish inside ${windowMinutes} min`}
            tone={stats.needed > judges.length ? 'warn' : 'ok'}
          />
        </div>

        {stats.over > 0 && (
          <div className="px-5 pb-5">
            <Banner tone={stats.needed > judges.length * 1.5 ? 'error' : 'warning'}>
              {stats.over} of {judges.length} judges need more than {windowMinutes} minutes. The
              busiest is on the floor for about {formatDuration(stats.longest)}.{' '}
              {stats.needed > judges.length
                ? `Finishing on time needs roughly ${stats.needed} judges — recruit more, or lower judges per project on the Assignments tab.`
                : 'Move a few tables to the lighter judges below.'}
            </Banner>
          </div>
        )}
      </Panel>

      <Panel
        title="Time per judge"
        description="Solid bar is visits that include a main-track rubric, faded bar is sponsor-only stops. The white line is your window. Select a judge to see their tables."
      >
        {visibleLoads.length === 0 ? (
          <EmptyState
            title="No judges match that search"
            description="Clear the search box to see everyone again."
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {visibleLoads.map((load) => {
              const tone = toneFor(load.seconds)
              const isOpen = expanded === load.judge.user_id
              const visitCount = load.visits.length
              return (
                <li key={load.judge.user_id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : load.judge.user_id)}
                    aria-expanded={isOpen}
                    className="w-full text-left p-4 sm:p-5 hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="shrink-0 w-9 h-9 rounded-full bg-white/10 text-gray-200 text-xs font-bold flex items-center justify-center">
                        {initials(load.judge)}
                      </span>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <p className="text-white font-semibold truncate">
                            {load.judge.full_name || load.judge.email}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm text-gray-400">
                              {formatDuration(load.seconds)}
                            </span>
                            <Pill tone={pillTone[tone]}>{visitCount} visits</Pill>
                          </div>
                        </div>

                        <div className="relative h-2.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 flex"
                            style={{ width: `${(load.seconds / scale) * 100}%` }}
                          >
                            <span
                              className={`h-full ${barClass[tone]}`}
                              style={{
                                width: visitCount ? `${(load.mainVisits / visitCount) * 100}%` : '0%',
                              }}
                            />
                            <span
                              className={`h-full ${sponsorBarClass[tone]}`}
                              style={{
                                width: visitCount
                                  ? `${(load.sponsorOnlyVisits / visitCount) * 100}%`
                                  : '0%',
                              }}
                            />
                          </div>
                          <span
                            className="absolute inset-y-0 w-px bg-white/70"
                            style={{ left: `${(windowSeconds / scale) * 100}%` }}
                            aria-hidden
                          />
                        </div>

                        <p className="text-xs text-gray-500">
                          {load.sheets} sheets
                          {load.sheets > visitCount &&
                            ` · ${load.sheets - visitCount} ride along for free`}
                          {load.submitted > 0 && ` · ${load.submitted} submitted`}
                          {load.judge.company && ` · ${load.judge.company}`}
                        </p>
                      </div>

                      <span className="shrink-0 text-gray-500 text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 space-y-3">
                      {visitCount === 0 ? (
                        <Banner tone="info">
                          This judge has nothing assigned. They are the first person to move work to.
                        </Banner>
                      ) : (
                        <ul className="space-y-2">
                          {load.visits.map((visit) => {
                            const project = visit.assignments[0]?.project
                            return (
                              <li
                                key={`${visit.judgeId}-${visit.projectId}`}
                                className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10"
                              >
                                <span className="text-xs text-gray-500 w-12 shrink-0">
                                  {project?.table_number || '—'}
                                </span>
                                <span className="text-sm text-white truncate flex-1 min-w-[10rem]">
                                  {project?.title || 'Project'}
                                </span>
                                <span className="flex flex-wrap gap-1.5">
                                  {visit.trackIds.map((id) => (
                                    <Pill
                                      key={id}
                                      tone={
                                        trackById.get(id)?.type === 'sponsor' ? 'orange' : 'blue'
                                      }
                                    >
                                      {trackById.get(id)?.name.slice(0, 26) || 'Track'}
                                    </Pill>
                                  ))}
                                </span>
                                <span className="text-xs text-gray-500 shrink-0">
                                  {minutesLabel(visit.seconds)}
                                  {visit.done && ' · done'}
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      )}

                      <Link
                        href="/admin/judging/assignments"
                        className="inline-block text-sm text-blue-400 hover:underline"
                      >
                        Change this judge&apos;s assignments →
                      </Link>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <Panel
        title="Where the load comes from"
        description="Sheets created by each track. Sheets that share a table with another rubric are nearly free — it is the tracks that force extra stops that cost you time."
      >
        <ul className="p-5 space-y-3">
          {trackLoad.map((entry) => (
            <li key={entry.track?.id || 'unknown'} className="space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm text-gray-200 truncate">
                  {entry.track?.name || 'Unknown track'}
                  {entry.track?.sponsor_judges_only && (
                    <span className="text-orange-300 text-xs"> · linked judges only</span>
                  )}
                </span>
                <span className="text-xs text-gray-500 shrink-0">
                  {entry.sheets} sheets · {entry.projects} projects · {entry.judges} judges
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full ${entry.track?.type === 'sponsor' ? 'bg-orange-400/60' : 'bg-blue-500/80'}`}
                  style={{
                    width: `${(entry.sheets / Math.max(...trackLoad.map((t) => t.sheets), 1)) * 100}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

function StatCard({
  label,
  value,
  note,
  tone = 'neutral',
}: {
  label: string
  value: number
  note: string
  tone?: 'neutral' | 'idle' | 'ok' | 'warn' | 'over'
}) {
  const valueClass = {
    neutral: 'text-white',
    idle: 'text-gray-400',
    ok: 'text-green-300',
    warn: 'text-yellow-300',
    over: 'text-red-300',
  }[tone]

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{note}</p>
    </div>
  )
}
