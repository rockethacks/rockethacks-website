'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Banner, EmptyState, LoadingScreen, Pill } from '@/components/judging/ui'
import { loadSession } from '@/lib/judging/session'

type RankedProject = {
  project_id: string
  title: string
  table_number: string | null
  total: number
}

export default function JudgeTop3Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState('')
  const [message, setMessage] = useState('')
  const [ranked, setRanked] = useState<RankedProject[]>([])
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function load() {
      let auth
      try {
        auth = await loadSession()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not verify your session.')
        setLoading(false)
        return
      }

      if (!auth.user || !auth.isJudge) {
        router.replace('/judge/login')
        return
      }
      setUserId(auth.user.id)

      const supabase = createClient()
      const { data: assignments } = await supabase
        .from('judge_assignments')
        .select('id, status, project_id, project:projects(id, title, table_number)')
        .eq('judge_id', auth.user.id)

      const list = (assignments || []) as unknown as {
        id: string
        status: string
        project_id: string
        project: { title: string; table_number: string | null } | null
      }[]

      if (list.length === 0) {
        setBlocked('You do not have any assigned projects yet.')
        setLoading(false)
        return
      }

      const pending = list.filter((a) => a.status !== 'submitted').length
      if (pending > 0) {
        setBlocked(
          `Submit all of your score sheets first — ${pending} still open. Ranking early would use incomplete scores.`
        )
        setLoading(false)
        return
      }

      const { data: allScores } = await supabase
        .from('scores')
        .select('assignment_id, points_value')
        .in(
          'assignment_id',
          list.map((a) => a.id)
        )

      const totals = new Map<string, number>()
      for (const s of allScores || []) {
        totals.set(s.assignment_id, (totals.get(s.assignment_id) || 0) + (s.points_value || 0))
      }

      const scored: RankedProject[] = list.map((a) => ({
        project_id: a.project_id,
        title: a.project?.title || 'Project',
        table_number: a.project?.table_number ?? null,
        total: totals.get(a.id) || 0,
      }))
      scored.sort((a, b) => b.total - a.total)

      const { data: existing } = await supabase
        .from('top3_picks')
        .select('project_id, rank')
        .eq('judge_id', auth.user.id)
        .order('rank')

      if (existing && existing.length > 0) {
        setMessage('Your top 3 is already saved. Adjust the order below if you want to change it.')
        const rankByProject = new Map(existing.map((e) => [e.project_id, e.rank]))
        scored.sort((a, b) => {
          const ra = rankByProject.get(a.project_id) ?? 99
          const rb = rankByProject.get(b.project_id) ?? 99
          if (ra !== rb) return ra - rb
          return b.total - a.total
        })
      }

      setRanked(scored)
      setLoading(false)
    }
    load()
  }, [router])

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir
    if (j < 0 || j >= ranked.length) return
    const next = [...ranked]
    ;[next[index], next[j]] = [next[j], next[index]]
    setRanked(next)
    setMessage('')
  }

  const setRank = (index: number, rank: 1 | 2 | 3) => {
    const slot = rank - 1
    if (index === slot) return
    const next = [...ranked]
    const [item] = next.splice(index, 1)
    next.splice(slot, 0, item)
    setRanked(next)
    setMessage('')
  }

  const saveTop3 = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    const top3 = ranked.slice(0, 3)
    const supabase = createClient()
    const { error: dErr } = await supabase.from('top3_picks').delete().eq('judge_id', userId)
    if (dErr) {
      setError(dErr.message)
      setSaving(false)
      return
    }
    const { error: iErr } = await supabase.from('top3_picks').insert(
      top3.map((p, i) => ({ judge_id: userId, project_id: p.project_id, rank: i + 1 }))
    )
    if (iErr) setError(iErr.message)
    else setMessage('Top 3 saved. You are done — thank you for judging!')
    setSaving(false)
  }

  if (loading) return <LoadingScreen message="Tallying your scores…" />

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] py-8 px-4 pb-[max(7rem,env(safe-area-inset-bottom))]">
      <div className="max-w-xl mx-auto space-y-5">
        <div>
          <Link
            href="/judge"
            className="inline-flex items-center min-h-11 text-sm text-blue-400 font-medium"
          >
            ← Your projects
          </Link>
          <h1 className="text-3xl font-bold text-white mt-1">Confirm your Top 3</h1>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            Ranked by your scores. Use Set as #1–#3 if your gut order differs from the points.
          </p>
        </div>

        {blocked ? (
          <div className="bg-white/5 rounded-2xl border border-white/10">
            <EmptyState
              title="Not ready yet"
              description={blocked}
              action={
                <Link
                  href="/judge"
                  className="inline-flex items-center justify-center min-h-11 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
                >
                  Back to your projects
                </Link>
              }
            />
          </div>
        ) : (
          <>
            {error && <Banner tone="error">{error}</Banner>}
            {message && <Banner tone="success">{message}</Banner>}

            <ul className="space-y-3">
              {ranked.map((p, i) => (
                <li
                  key={p.project_id}
                  className={`rounded-xl p-4 space-y-3 border ${
                    i < 3 ? 'bg-yellow-500/10 border-yellow-500/40' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="min-w-0">
                    {i < 3 ? (
                      <Pill tone="yellow">#{i + 1}</Pill>
                    ) : (
                      <Pill>Not in top 3</Pill>
                    )}
                    <p className="text-white font-semibold mt-1.5 line-clamp-2">{p.title}</p>
                    <p className="text-sm text-gray-400">
                      {p.total} pts · Table {p.table_number || 'TBD'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {([1, 2, 3] as const).map((rank) => {
                      const active = i === rank - 1
                      return (
                        <button
                          key={rank}
                          type="button"
                          onClick={() => setRank(i, rank)}
                          className={`min-h-11 min-w-[3.25rem] px-3 rounded-lg text-sm font-bold transition ${
                            active
                              ? 'bg-yellow-400 text-[#030c1b]'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                          aria-label={`Set ${p.title} as #${rank}`}
                          aria-pressed={active}
                        >
                          #{rank}
                        </button>
                      )
                    })}
                    <div className="flex gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="min-h-9 min-w-9 px-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded text-white text-sm transition"
                        aria-label={`Move ${p.title} up`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === ranked.length - 1}
                        className="min-h-9 min-w-9 px-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded text-white text-sm transition"
                        aria-label={`Move ${p.title} down`}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div
              className="fixed bottom-0 inset-x-0 z-40 px-4 pt-3 bg-[#0a1628]/95 border-t border-white/10 backdrop-blur"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              <div className="max-w-xl mx-auto">
                <button
                  type="button"
                  onClick={saveTop3}
                  disabled={saving}
                  className="w-full min-h-12 py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl transition"
                >
                  {saving ? 'Saving…' : `Confirm top ${Math.min(3, ranked.length)}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
