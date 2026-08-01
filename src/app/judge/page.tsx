'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { AssignmentStatus } from '@/types/judging'
import { Banner, EmptyState, LoadingScreen, Pill } from '@/components/judging/ui'
import { loadSession } from '@/lib/judging/session'

type AssignmentRow = {
  id: string
  status: AssignmentStatus
  track_context_id: string
  project: { id: string; title: string; table_number: string | null } | null
  track: { id: string; name: string; type: string } | null
}

type TableCard = {
  projectId: string
  title: string
  tableNumber: string | null
  rubrics: AssignmentRow[]
  done: number
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

  const tables = useMemo<TableCard[]>(() => {
    const byProject = new Map<string, TableCard>()
    for (const row of assignments) {
      const projectId = row.project?.id
      if (!projectId) continue
      const card = byProject.get(projectId) || {
        projectId,
        title: row.project?.title || 'Project',
        tableNumber: row.project?.table_number || null,
        rubrics: [],
        done: 0,
      }
      card.rubrics.push(row)
      if (row.status === 'submitted') card.done++
      byProject.set(projectId, card)
    }
    return Array.from(byProject.values()).sort((a, b) =>
      (a.tableNumber || 'zz').localeCompare(b.tableNumber || 'zz')
    )
  }, [assignments])

  const tablesDone = tables.filter((t) => t.done === t.rubrics.length).length
  const allSubmitted = assignments.length > 0 && tablesDone === tables.length
  const progress = tables.length ? Math.round((tablesDone / tables.length) * 100) : 0
  const bundled = assignments.length - tables.length

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/judge/login')
  }

  if (loading) return <LoadingScreen message="Loading your tables…" />

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex justify-between items-start gap-4">
          <div>
            <p className="text-yellow-400 text-xs font-semibold uppercase tracking-[0.2em]">
              Judge Portal
            </p>
            <h1 className="text-3xl font-bold text-white mt-1">Your tables</h1>
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

        {tables.length > 0 && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300 font-medium">
                {tablesDone} of {tables.length} tables done
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
              You visit each table once and score every rubric it qualifies for while you are there.
              {bundled > 0 &&
                ` ${bundled} of your ${assignments.length} score sheets are extra prizes on tables you were already visiting.`}{' '}
              When every table is done you will confirm your top 3 overall.
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

        {tables.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
            <EmptyState
              title="No tables assigned yet"
              description="Organizers assign tables shortly before judging starts. Keep this page open and refresh — your list will appear here with table numbers."
            />
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            <ul className="divide-y divide-white/10">
              {tables.map((table) => {
                const complete = table.done === table.rubrics.length
                return (
                  <li key={table.projectId}>
                    <Link
                      href={`/judge/table/${table.projectId}`}
                      className="block p-4 hover:bg-white/5 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Table {table.tableNumber || 'TBD'}
                          </p>
                          <p className="text-white font-semibold truncate mt-0.5">{table.title}</p>
                        </div>
                        <Pill tone={complete ? 'green' : table.done > 0 ? 'blue' : 'yellow'}>
                          {complete
                            ? 'Done'
                            : `${table.done} of ${table.rubrics.length} rubrics`}
                        </Pill>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {table.rubrics.map((rubric) => (
                          <span
                            key={rubric.id}
                            className={`px-2 py-1 text-xs rounded-lg border ${
                              rubric.status === 'submitted'
                                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                : rubric.track?.type === 'sponsor'
                                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-200'
                                  : 'bg-white/5 border-white/10 text-gray-300'
                            }`}
                          >
                            {rubric.track?.name || 'Rubric'}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
