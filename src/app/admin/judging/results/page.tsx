'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Track } from '@/types/judging'
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

const OVERALL = '__overall__'

type LeaderRow = {
  project_id: string
  title: string
  table_number: string | null
  avgPoints: number
  judgeCount: number
  eligibilityFailed: boolean
  eligibilityDisputed: boolean
}

type Top3Row = {
  project_id: string
  title: string
  table_number: string | null
  mentions: number
  firsts: number
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function tablesHref(projectId: string) {
  return `/admin/judging/tables?project=${encodeURIComponent(projectId)}`
}

export default function ResultsAdminPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [trackId, setTrackId] = useState('')
  const [margin, setMargin] = useState(2)
  const [rows, setRows] = useState<LeaderRow[]>([])
  const [top3, setTop3] = useState<Top3Row[]>([])
  const [pending, setPending] = useState(0)
  const [submitted, setSubmitted] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const viewingOverall = trackId === OVERALL

  useEffect(() => {
    async function loadTracks() {
      const supabase = createClient()
      const { data } = await supabase.from('tracks').select('*').order('sort_order').order('name')
      const list = (data || []) as Track[]
      setTracks(list)
      setTrackId((prev) => prev || list[0]?.id || OVERALL)
    }
    loadTracks()
  }, [])

  const loadOverall = useCallback(async () => {
    setLoading(true)
    setError('')
    setRows([])
    setPending(0)
    setSubmitted(0)
    const supabase = createClient()

    const { data: picks, error: pErr } = await supabase
      .from('top3_picks')
      .select('project_id, rank')
    if (pErr) {
      setError(pErr.message)
      setLoading(false)
      return
    }

    const pickRows = (picks || []) as { project_id: string; rank: number }[]
    const pickIds = Array.from(new Set(pickRows.map((p) => p.project_id)))
    const metaById = new Map<string, { title: string; table_number: string | null }>()
    for (const part of chunk(pickIds, 200)) {
      if (!part.length) continue
      const { data } = await supabase
        .from('projects')
        .select('id, title, table_number')
        .in('id', part)
      for (const p of (data || []) as {
        id: string
        title: string
        table_number: string | null
      }[]) {
        metaById.set(p.id, { title: p.title, table_number: p.table_number })
      }
    }

    const tally = new Map<string, { mentions: number; firsts: number }>()
    for (const p of pickRows) {
      const entry = tally.get(p.project_id) || { mentions: 0, firsts: 0 }
      entry.mentions++
      if (p.rank === 1) entry.firsts++
      tally.set(p.project_id, entry)
    }

    setTop3(
      Array.from(tally.entries())
        .map(([project_id, v]) => {
          const meta = metaById.get(project_id)
          return {
            project_id,
            title: meta?.title || 'Project',
            table_number: meta?.table_number ?? null,
            mentions: v.mentions,
            firsts: v.firsts,
          }
        })
        .sort((a, b) => b.mentions - a.mentions || b.firsts - a.firsts)
        .slice(0, 10)
    )
    setLoading(false)
  }, [])

  const loadTrackResults = useCallback(async (tid: string) => {
    if (!tid) return
    setLoading(true)
    setError('')
    setTop3([])
    const supabase = createClient()

    const { data: assignments, error: aErr } = await supabase
      .from('judge_assignments')
      .select('id, project_id, status, project:projects(id, title, table_number)')
      .eq('track_context_id', tid)

    if (aErr) {
      setError(aErr.message)
      setLoading(false)
      return
    }

    const list = (assignments || []) as unknown as {
      id: string
      project_id: string
      status: string
      project: { title: string; table_number: string | null } | null
    }[]

    const done = list.filter((a) => a.status === 'submitted')
    setSubmitted(done.length)
    setPending(list.length - done.length)

    const scoreRows: {
      assignment_id: string
      points_value: number | null
      eligibility_value: boolean | null
      criteria_item: { type: string } | null
    }[] = []

    for (const part of chunk(
      done.map((a) => a.id),
      100
    )) {
      if (!part.length) continue
      const { data } = await supabase
        .from('scores')
        .select('assignment_id, points_value, eligibility_value, criteria_item:criteria_items(type)')
        .in('assignment_id', part)
      scoreRows.push(...((data || []) as unknown as typeof scoreRows))
    }

    const perAssignment = new Map<string, { points: number; fails: number; passes: number }>()
    for (const s of scoreRows) {
      const entry = perAssignment.get(s.assignment_id) || { points: 0, fails: 0, passes: 0 }
      if (s.criteria_item?.type === 'scored') entry.points += s.points_value || 0
      if (s.criteria_item?.type === 'eligibility') {
        if (s.eligibility_value === false) entry.fails++
        if (s.eligibility_value === true) entry.passes++
      }
      perAssignment.set(s.assignment_id, entry)
    }

    const byProject = new Map<
      string,
      { title: string; table_number: string | null; totals: number[]; fails: number[]; passes: number[] }
    >()
    for (const a of done) {
      const stats = perAssignment.get(a.id) || { points: 0, fails: 0, passes: 0 }
      const entry = byProject.get(a.project_id) || {
        title: a.project?.title || 'Project',
        table_number: a.project?.table_number ?? null,
        totals: [],
        fails: [],
        passes: [],
      }
      entry.totals.push(stats.points)
      entry.fails.push(stats.fails)
      entry.passes.push(stats.passes)
      byProject.set(a.project_id, entry)
    }

    const leaderboard: LeaderRow[] = []
    for (const [project_id, entry] of byProject) {
      const avg = entry.totals.reduce((a, b) => a + b, 0) / (entry.totals.length || 1)
      const anyFail = entry.fails.some((f) => f > 0)
      const anyPass = entry.passes.some((p) => p > 0) && entry.fails.some((f) => f === 0)
      leaderboard.push({
        project_id,
        title: entry.title,
        table_number: entry.table_number,
        avgPoints: Math.round(avg * 100) / 100,
        judgeCount: entry.totals.length,
        eligibilityFailed: anyFail,
        eligibilityDisputed: anyFail && anyPass,
      })
    }

    leaderboard.sort((a, b) => {
      if (a.eligibilityFailed !== b.eligibilityFailed) return a.eligibilityFailed ? 1 : -1
      return b.avgPoints - a.avgPoints
    })
    setRows(leaderboard)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!trackId) return
    if (trackId === OVERALL) loadOverall()
    else loadTrackResults(trackId)
  }, [trackId, loadOverall, loadTrackResults])

  const flagged = useMemo(() => {
    const eligible = rows.filter((r) => !r.eligibilityFailed)
    const flags = new Set<string>()
    for (let i = 0; i < eligible.length; i++) {
      for (let j = i + 1; j < eligible.length; j++) {
        if (Math.abs(eligible[i].avgPoints - eligible[j].avgPoints) <= margin) {
          flags.add(eligible[i].project_id)
          flags.add(eligible[j].project_id)
        }
      }
      if (i >= 4) break
    }
    return flags
  }, [rows, margin])

  const selectedTrack = tracks.find((t) => t.id === trackId)
  const podium = top3.slice(0, 3)
  const restOverall = top3.slice(3)
  const maxMentions = Math.max(...top3.map((t) => t.mentions), 1)

  const exportResults = () => {
    if (viewingOverall) {
      const ok = exportWorkbook('Results_Overall', [
        {
          name: 'Top 3 tally',
          rows: top3.map((t, i) => ({
            Rank: i + 1,
            Project: t.title,
            Table: t.table_number || '',
            'Top-3 mentions': t.mentions,
            'First-place votes': t.firsts,
          })),
        },
      ])
      if (!ok) setError('Nothing to export yet. Judges have not confirmed a top 3.')
      return
    }

    const trackName = selectedTrack?.name || 'Track'
    const ok = exportWorkbook(`Results_${trackName.slice(0, 20)}`, [
      {
        name: 'Leaderboard',
        rows: rows.map((r, i) => ({
          Rank: i + 1,
          Project: r.title,
          Table: r.table_number || '',
          Track: trackName,
          'Average points': r.avgPoints,
          'Judges scored': r.judgeCount,
          'Near tie': flagged.has(r.project_id) ? 'Yes' : 'No',
          'Eligibility not met': r.eligibilityFailed ? 'Yes' : 'No',
          'Judges disagree': r.eligibilityDisputed ? 'Yes' : 'No',
        })),
      },
    ])
    if (!ok) setError('Nothing to export yet — no submitted scores for this track.')
  }

  const refresh = () => {
    if (viewingOverall) loadOverall()
    else loadTrackResults(trackId)
  }

  return (
    <div className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}

      <Banner tone="info">
        {viewingOverall ? (
          <>
            Overall tallies every judge&apos;s confirmed top 3 across all tracks. Ties on mentions
            break on first-place votes.
          </>
        ) : (
          <>
            Leaderboards use the <span className="font-semibold">average</span> of each judge&apos;s
            total, not the sum, so a judge who never submitted cannot drag a project down. Only
            submitted score sheets count.
          </>
        )}
      </Banner>

      <Panel
        title="View"
        tip="resultsVsScorecards"
        description="Pick a track for its score leaderboard, or Overall for the cross-track top-3 tally."
      >
        <div className="p-5 grid md:grid-cols-3 gap-4">
          <Field label="Track">
            <select
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              className={selectClass}
            >
              <option value={OVERALL}>Overall</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type === 'sponsor' ? 'sponsor' : 'in-house'})
                </option>
              ))}
            </select>
          </Field>
          {!viewingOverall && (
            <Field
              label="Near-tie margin (points)"
              hint="Projects within this many points of each other near the top get flagged."
            >
              <input
                type="number"
                min={0}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
          )}
          <div className={`flex items-end ${viewingOverall ? 'md:col-start-3' : ''}`}>
            <button
              onClick={refresh}
              disabled={loading}
              className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
        {!viewingOverall && (
          <div className="px-5 pb-5 grid grid-cols-3 gap-3">
            {[
              { label: 'Sheets submitted', value: submitted },
              { label: 'Still open', value: pending, warn: pending > 0 },
              { label: 'Projects scored', value: rows.length },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.warn ? 'text-yellow-400' : 'text-white'}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {viewingOverall ? (
        <Panel
          title="Overall main-track contenders"
          description="Confirmed top-3 picks from every judge. Open a project on Tables to check the floor assignment."
          actions={<ExportButton onClick={exportResults} disabled={top3.length === 0} />}
        >
          {loading ? (
            <div className="p-10 text-center text-sm text-gray-400">Loading overall tally…</div>
          ) : top3.length === 0 ? (
            <EmptyState
              title="No top 3 submissions yet"
              description="Judges confirm their top 3 only after submitting every score sheet on their list."
            />
          ) : (
            <div className="p-5 space-y-8">
              <OverallPodium items={podium} maxMentions={maxMentions} />

              {restOverall.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-400 px-1">Also mentioned</p>
                  <ul className="divide-y divide-white/10 rounded-xl border border-white/10 overflow-hidden">
                    {restOverall.map((r, i) => (
                      <li
                        key={r.project_id}
                        className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]"
                      >
                        <div className="min-w-0 flex items-baseline gap-3">
                          <span className="text-gray-500 tabular-nums text-sm w-6">#{i + 4}</span>
                          <div className="min-w-0">
                            <Link
                              href={tablesHref(r.project_id)}
                              className="text-white font-medium hover:text-blue-300 transition-colors"
                            >
                              {r.title}
                            </Link>
                            <p className="text-xs text-gray-500">
                              Table {r.table_number || 'TBD'}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-400 shrink-0">
                          <span className="text-yellow-400 font-bold tabular-nums">{r.mentions}</span>{' '}
                          mentions · {r.firsts} first
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Panel>
      ) : (
        <Panel
          title={`${selectedTrack?.name || 'Track'} leaderboard`}
          description="Projects that failed an eligibility check are pushed below eligible ones rather than hidden. Project names open the table detail on Tables."
          actions={<ExportButton onClick={exportResults} disabled={rows.length === 0} />}
        >
          {loading ? (
            <div className="p-10 text-center text-sm text-gray-400">Loading leaderboard…</div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No submitted scores yet"
              description="Results appear as judges submit. If judging has started and this is still empty, check the Assignments tab for this track."
            />
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left min-w-[720px]">
                <thead className="bg-white/5 text-gray-400">
                  <tr>
                    <th className="p-3 font-medium">#</th>
                    <th className="p-3 font-medium">Project</th>
                    <th className="p-3 font-medium">Avg points</th>
                    <th className="p-3 font-medium">Judges</th>
                    <th className="p-3 font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r.project_id}
                      className={`border-t border-white/10 ${r.eligibilityFailed ? 'bg-red-500/5' : ''}`}
                    >
                      <td className="p-3 text-gray-400 tabular-nums">{i + 1}</td>
                      <td className="p-3">
                        <Link
                          href={tablesHref(r.project_id)}
                          className="text-white font-medium hover:text-blue-300 transition-colors"
                        >
                          {r.title}
                        </Link>
                        <p className="text-xs text-gray-500">Table {r.table_number || 'TBD'}</p>
                      </td>
                      <td className="p-3 text-yellow-400 font-bold tabular-nums">{r.avgPoints}</td>
                      <td className="p-3 text-gray-300 tabular-nums">{r.judgeCount}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5">
                          {flagged.has(r.project_id) && <Pill tone="yellow">Near tie</Pill>}
                          {r.eligibilityFailed && <Pill tone="red">Eligibility not met</Pill>}
                          {r.eligibilityDisputed && <Pill tone="orange">Judges disagree</Pill>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}

function OverallPodium({ items, maxMentions }: { items: Top3Row[]; maxMentions: number }) {
  // Visual order: 2nd · 1st · 3rd
  const slots: { place: 1 | 2 | 3; row: Top3Row | undefined; height: string }[] = [
    { place: 2, row: items[1], height: 'h-24 sm:h-28' },
    { place: 1, row: items[0], height: 'h-32 sm:h-40' },
    { place: 3, row: items[2], height: 'h-20 sm:h-24' },
  ]

  const placeStyle = (place: 1 | 2 | 3) => {
    if (place === 1)
      return {
        ring: 'ring-yellow-400/50',
        bar: 'from-yellow-500/35 via-yellow-400/15 to-transparent',
        badge: 'bg-yellow-400 text-[#0a1628]',
        glow: 'shadow-[0_0_40px_-8px_rgba(250,204,21,0.45)]',
        label: '1st',
      }
    if (place === 2)
      return {
        ring: 'ring-slate-300/40',
        bar: 'from-slate-300/25 via-slate-400/10 to-transparent',
        badge: 'bg-slate-300 text-[#0a1628]',
        glow: 'shadow-[0_0_28px_-10px_rgba(203,213,225,0.35)]',
        label: '2nd',
      }
    return {
      ring: 'ring-amber-700/45',
      bar: 'from-amber-700/30 via-amber-600/10 to-transparent',
      badge: 'bg-amber-700 text-amber-50',
      glow: 'shadow-[0_0_28px_-10px_rgba(180,83,9,0.4)]',
      label: '3rd',
    }
  }

  return (
    <div
      className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent px-3 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-5 overflow-hidden"
      aria-label="Top three podium"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent"
        aria-hidden
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
        {slots.map(({ place, row, height }) => {
          const style = placeStyle(place)
          if (!row) {
            return (
              <div key={place} className="flex flex-col items-center gap-3 opacity-30">
                <div
                  className={`w-full max-w-[9rem] ${height} rounded-t-xl border border-dashed border-white/15 bg-white/[0.03]`}
                />
                <span className="text-xs text-gray-600">{style.label}</span>
              </div>
            )
          }

          const fill = Math.max(12, Math.round((row.mentions / maxMentions) * 100))

          return (
            <div
              key={row.project_id}
              className={`flex flex-col items-center gap-3 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out ${
                place === 1 ? 'sm:-translate-y-1' : ''
              }`}
            >
              <div className="text-center space-y-1.5 px-1 min-w-0 w-full">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold tabular-nums ${style.badge} ring-2 ${style.ring}`}
                >
                  {place}
                </span>
                <Link
                  href={tablesHref(row.project_id)}
                  className={`block text-sm sm:text-base font-semibold text-white hover:text-blue-300 transition-colors leading-snug text-balance line-clamp-2 ${
                    place === 1 ? 'sm:text-lg' : ''
                  }`}
                >
                  {row.title}
                </Link>
                <p className="text-[11px] sm:text-xs text-gray-500">
                  Table {row.table_number || 'TBD'}
                </p>
              </div>

              <div
                className={`relative w-full max-w-[9rem] ${height} rounded-t-xl border border-white/10 bg-gradient-to-t ${style.bar} ${style.glow} overflow-hidden`}
              >
                <div
                  className="absolute inset-x-0 bottom-0 bg-yellow-400/25 motion-safe:transition-[height] motion-safe:duration-500 motion-safe:ease-out"
                  style={{ height: `${fill}%` }}
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 text-center space-y-0.5">
                  <p className="text-yellow-300 font-bold text-lg sm:text-xl tabular-nums leading-none">
                    {row.mentions}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide">
                    mentions
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 tabular-nums">
                    {row.firsts} first
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
