'use client'

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

type LeaderRow = {
  project_id: string
  title: string
  table_number: string | null
  avgPoints: number
  judgeCount: number
  eligibilityFailed: boolean
  eligibilityDisputed: boolean
}

type Top3Row = { project_id: string; title: string; mentions: number; firsts: number }

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
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

  const loadResults = useCallback(async (tid: string) => {
    if (!tid) return
    setLoading(true)
    setError('')
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

    for (const part of chunk(done.map((a) => a.id), 100)) {
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

    const { data: picks } = await supabase.from('top3_picks').select('project_id, rank')
    const pickIds = Array.from(new Set((picks || []).map((p) => p.project_id)))
    const titleById = new Map<string, string>()
    for (const part of chunk(pickIds, 200)) {
      const { data } = await supabase.from('projects').select('id, title').in('id', part)
      for (const p of (data || []) as { id: string; title: string }[]) titleById.set(p.id, p.title)
    }

    const tally = new Map<string, { mentions: number; firsts: number }>()
    for (const p of (picks || []) as { project_id: string; rank: number }[]) {
      const entry = tally.get(p.project_id) || { mentions: 0, firsts: 0 }
      entry.mentions++
      if (p.rank === 1) entry.firsts++
      tally.set(p.project_id, entry)
    }
    setTop3(
      Array.from(tally.entries())
        .map(([project_id, v]) => ({
          project_id,
          title: titleById.get(project_id) || 'Project',
          mentions: v.mentions,
          firsts: v.firsts,
        }))
        .sort((a, b) => b.mentions - a.mentions || b.firsts - a.firsts)
        .slice(0, 10)
    )

    setLoading(false)
  }, [])

  useEffect(() => {
    if (trackId) loadResults(trackId)
  }, [trackId, loadResults])

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

  const exportResults = () => {
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
      {
        name: 'Top 3 tally',
        rows: top3.map((t, i) => ({
          Rank: i + 1,
          Project: t.title,
          'Top-3 mentions': t.mentions,
          'First-place votes': t.firsts,
        })),
      },
    ])
    if (!ok) setError('Nothing to export yet — no submitted scores for this track.')
  }

  return (
    <div className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}

      <Banner tone="info">
        Leaderboards use the <span className="font-semibold">average</span> of each judge’s total, not
        the sum, so a judge who never submitted cannot drag a project down. Only submitted score
        sheets count.
      </Banner>

      <Panel title="View" description="Pick a track, then set how close two scores must be to count as a tie worth reviewing.">
        <div className="p-5 grid md:grid-cols-3 gap-4">
          <Field label="Track">
            <select value={trackId} onChange={(e) => setTrackId(e.target.value)} className={selectClass}>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type === 'sponsor' ? 'sponsor' : 'in-house'})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Near-tie margin (points)" hint="Projects within this many points of each other near the top get flagged.">
            <input
              type="number"
              min={0}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <div className="flex items-end">
            <button
              onClick={() => loadResults(trackId)}
              disabled={loading}
              className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
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
      </Panel>

      <Panel
        title={`${selectedTrack?.name || 'Track'} leaderboard`}
        description="Projects that failed an eligibility check are pushed below eligible ones rather than hidden, so you can still see how they scored."
        actions={<ExportButton onClick={exportResults} disabled={rows.length === 0} />}
      >
        {rows.length === 0 ? (
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
                    <td className="p-3 text-gray-400">{i + 1}</td>
                    <td className="p-3">
                      <p className="text-white font-medium">{r.title}</p>
                      <p className="text-xs text-gray-500">Table {r.table_number || 'TBD'}</p>
                    </td>
                    <td className="p-3 text-yellow-400 font-bold">{r.avgPoints}</td>
                    <td className="p-3 text-gray-300">{r.judgeCount}</td>
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

      <Panel
        title="Overall main-track contenders"
        description="Tallied from every judge’s confirmed top 3 across all tracks. Ties on mentions break on number of first-place picks."
      >
        {top3.length === 0 ? (
          <EmptyState
            title="No top 3 submissions yet"
            description="Judges confirm their top 3 only after submitting every score sheet on their list."
          />
        ) : (
          <ul className="divide-y divide-white/10">
            {top3.map((r, i) => (
              <li key={r.project_id} className="p-4 flex justify-between items-center gap-3">
                <span className="text-white">
                  <span className="text-gray-500 mr-2">#{i + 1}</span>
                  {r.title}
                </span>
                <span className="text-sm text-gray-400 shrink-0">
                  <span className="text-yellow-400 font-bold">{r.mentions}</span> mentions ·{' '}
                  {r.firsts} first place
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
