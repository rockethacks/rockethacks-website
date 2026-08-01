'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { AssignmentStatus } from '@/types/judging'
import { Banner, EmptyState, LoadingScreen, Pill } from '@/components/judging/ui'

type AssignmentRow = {
  id: string
  status: AssignmentStatus
  track_context_id: string
  project: { id: string; title: string; table_number: string | null } | null
  track: { id: string; name: string; type: string } | null
}

const STATUS_META: Record<AssignmentStatus, { label: string; tone: 'yellow' | 'blue' | 'green' }> = {
  assigned: { label: 'Not started', tone: 'yellow' },
  in_progress: { label: 'In progress', tone: 'blue' },
  submitted: { label: 'Submitted', tone: 'green' },
}

export default function JudgeHomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [hasTop3, setHasTop3] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const auth = await fetch('/api/auth/user').then((r) => r.json())
      if (!auth.user || !auth.isJudge) {
        router.replace('/judge/login')
        return
      }
      setName(auth.user.full_name || auth.user.email || '')

      const supabase = createClient()
      const { data, error: qErr } = await supabase
        .from('judge_assignments')
        .select(
          `id, status, track_context_id,
           project:projects(id, title, table_number),
           track:tracks!judge_assignments_track_context_id_fkey(id, name, type)`
        )
        .eq('judge_id', auth.user.id)
        .order('assigned_at', { ascending: true })

      if (qErr) setError(qErr.message)
      else setAssignments((data || []) as unknown as AssignmentRow[])

      const { data: picks } = await supabase
        .from('top3_picks')
        .select('id')
        .eq('judge_id', auth.user.id)
      setHasTop3((picks || []).length > 0)

      setLoading(false)
    }
    load()
  }, [router])

  const submittedCount = assignments.filter((a) => a.status === 'submitted').length
  const allSubmitted = assignments.length > 0 && submittedCount === assignments.length
  const progress = assignments.length ? Math.round((submittedCount / assignments.length) * 100) : 0

  const grouped = useMemo(() => {
    const map = new Map<string, { trackName: string; trackType: string; rows: AssignmentRow[] }>()
    for (const a of assignments) {
      const key = a.track_context_id
      const entry = map.get(key) || {
        trackName: a.track?.name || 'Track',
        trackType: a.track?.type || 'in_house',
        rows: [],
      }
      entry.rows.push(a)
      map.set(key, entry)
    }
    return Array.from(map.values())
  }, [assignments])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/judge/login')
  }

  if (loading) return <LoadingScreen message="Loading your assignments…" />

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex justify-between items-start gap-4">
          <div>
            <p className="text-yellow-400 text-xs font-semibold uppercase tracking-[0.2em]">Judge Portal</p>
            <h1 className="text-3xl font-bold text-white mt-1">Your projects</h1>
            {name && <p className="text-sm text-gray-400 mt-1">Signed in as {name}</p>}
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-lg transition"
          >
            Log out
          </button>
        </header>

        {error && <Banner tone="error">{error}</Banner>}

        {assignments.length > 0 && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300 font-medium">
                {submittedCount} of {assignments.length} submitted
              </span>
              <span className="text-yellow-400 font-bold">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Score every project on your list. Once all are submitted you will be asked to confirm
              your top 3 overall.
            </p>
          </div>
        )}

        {allSubmitted && (
          <Link
            href="/judge/top3"
            className="block w-full text-center px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition"
          >
            {hasTop3 ? 'Review your Top 3' : 'Confirm your Top 3'}
          </Link>
        )}

        {grouped.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
            <EmptyState
              title="No projects assigned yet"
              description="Organizers assign projects shortly before judging starts. Keep this page open and refresh — your list will appear here with table numbers."
            />
          </div>
        ) : (
          grouped.map((group) => (
            <section key={group.trackName} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">{group.trackName}</h2>
                <Pill tone={group.trackType === 'sponsor' ? 'orange' : 'neutral'}>
                  {group.trackType === 'sponsor' ? 'Sponsor track' : 'Main track'}
                </Pill>
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                <ul className="divide-y divide-white/10">
                  {group.rows.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/judge/score/${a.id}`}
                        className="flex items-center justify-between gap-4 p-4 hover:bg-white/5 transition"
                      >
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">
                            {a.project?.title || 'Project'}
                          </p>
                          <p className="text-sm text-gray-400">
                            Table {a.project?.table_number || 'TBD'}
                          </p>
                        </div>
                        <Pill tone={STATUS_META[a.status].tone}>{STATUS_META[a.status].label}</Pill>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
