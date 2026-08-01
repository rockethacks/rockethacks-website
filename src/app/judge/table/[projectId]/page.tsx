'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type {
  AssignmentStatus,
  CriteriaBand,
  CriteriaItem,
  JudgingSettings,
} from '@/types/judging'
import { Banner, EmptyState, LoadingScreen, Pill } from '@/components/judging/ui'
import { loadSession } from '@/lib/judging/session'
import { FALLBACK_SETTINGS } from '@/lib/judging/visits'

type Draft = { eligibility_value: boolean | null; band_id: string | null; points_value: number | null }
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

type ProjectContext = {
  id: string
  title: string
  about: string | null
  table_number: string | null
  submission_url: string | null
  video_url: string | null
  github_url: string | null
}

type Rubric = {
  assignmentId: string
  trackId: string
  trackName: string
  trackType: string
  status: AssignmentStatus
  eligibility: CriteriaItem[]
  scored: (CriteriaItem & { bands: CriteriaBand[] })[]
  hasRubric: boolean
}

const key = (assignmentId: string, itemId: string) => `${assignmentId}|${itemId}`

export default function JudgeTablePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const [project, setProject] = useState<ProjectContext | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [notes, setNotes] = useState('')

  const [visitSeconds, setVisitSeconds] = useState(360)
  const [secondsLeft, setSecondsLeft] = useState(360)
  const [timerRunning, setTimerRunning] = useState(true)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

      const supabase = createClient()

      const [assignmentRes, projectRes, settingsRes, tagRes] = await Promise.all([
        supabase
          .from('judge_assignments')
          .select(
            `id, status, notes, track_context_id,
             track:tracks!judge_assignments_track_context_id_fkey(id, name, type, timer_seconds)`
          )
          .eq('judge_id', auth.user.id)
          .eq('project_id', projectId),
        supabase
          .from('projects')
          .select('id, title, about, table_number, submission_url, video_url, github_url')
          .eq('id', projectId)
          .maybeSingle(),
        supabase.from('judging_settings').select('*').maybeSingle(),
        supabase.from('project_tags').select('tag:tags(name)').eq('project_id', projectId),
      ])

      const assignmentRows = (assignmentRes.data || []) as unknown as {
        id: string
        status: AssignmentStatus
        notes: string | null
        track_context_id: string
        track: { id: string; name: string; type: string; timer_seconds: number } | null
      }[]

      if (assignmentRes.error || assignmentRows.length === 0 || !projectRes.data) {
        setError(
          assignmentRes.error?.message ||
            'This table is not assigned to you, or the project no longer exists.'
        )
        setLoading(false)
        return
      }

      setProject(projectRes.data as ProjectContext)
      setNotes(assignmentRows.find((a) => a.notes)?.notes || '')

      const settings = (settingsRes.data as JudgingSettings) || FALLBACK_SETTINGS
      const longest = Math.max(
        ...assignmentRows.map((a) => a.track?.timer_seconds || settings.default_visit_seconds)
      )
      const total = longest + settings.transition_seconds
      setVisitSeconds(total)
      setSecondsLeft(total)
      setTimerRunning(assignmentRows.some((a) => a.status !== 'submitted'))

      const tagList = (tagRes.data || []) as unknown as { tag: { name: string } | null }[]
      setTags(tagList.map((r) => r.tag?.name).filter(Boolean) as string[])

      const notStarted = assignmentRows.filter((a) => a.status === 'assigned').map((a) => a.id)
      if (notStarted.length > 0) {
        await supabase
          .from('judge_assignments')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .in('id', notStarted)
      }

      const { data: setRows } = await supabase
        .from('criteria_sets')
        .select('id, applies_to, track_id')
        .order('created_at')

      const sets = (setRows || []) as { id: string; applies_to: string; track_id: string | null }[]
      const sharedSet = sets.find((s) => s.applies_to === 'in_house_shared' && !s.track_id)

      const setIdByAssignment = new Map<string, string>()
      for (const row of assignmentRows) {
        const set =
          row.track?.type === 'sponsor'
            ? sets.find((s) => s.applies_to === 'sponsor' && s.track_id === row.track?.id)
            : sharedSet
        if (set) setIdByAssignment.set(row.id, set.id)
      }

      const setIds = Array.from(new Set(setIdByAssignment.values()))
      const { data: itemRows } = setIds.length
        ? await supabase
            .from('criteria_items')
            .select('*')
            .in('criteria_set_id', setIds)
            .order('sort_order')
        : { data: [] }

      const items = (itemRows || []) as CriteriaItem[]
      const scoredIds = items.filter((i) => i.type === 'scored').map((i) => i.id)
      const { data: bandRows } = scoredIds.length
        ? await supabase
            .from('criteria_bands')
            .select('*')
            .in('criteria_item_id', scoredIds)
            .order('sort_order')
        : { data: [] }
      const bands = (bandRows || []) as CriteriaBand[]

      const { data: scoreRows } = await supabase
        .from('scores')
        .select('*')
        .in(
          'assignment_id',
          assignmentRows.map((a) => a.id)
        )
      const scores = (scoreRows || []) as {
        assignment_id: string
        criteria_item_id: string
        eligibility_value: boolean | null
        band_id: string | null
        points_value: number | null
      }[]

      const built: Rubric[] = assignmentRows
        .map((row) => {
          const setId = setIdByAssignment.get(row.id)
          const own = items.filter((i) => i.criteria_set_id === setId)
          return {
            assignmentId: row.id,
            trackId: row.track?.id || row.track_context_id,
            trackName: row.track?.name || 'Track',
            trackType: row.track?.type || 'in_house',
            status: row.status,
            eligibility: own.filter((i) => i.type === 'eligibility'),
            scored: own
              .filter((i) => i.type === 'scored')
              .map((i) => ({ ...i, bands: bands.filter((b) => b.criteria_item_id === i.id) })),
            hasRubric: own.length > 0,
          }
        })
        .sort((a, b) => (a.trackType === b.trackType ? 0 : a.trackType === 'in_house' ? -1 : 1))

      const nextDrafts: Record<string, Draft> = {}
      for (const rubric of built) {
        for (const item of [...rubric.eligibility, ...rubric.scored]) {
          const existing = scores.find(
            (s) => s.assignment_id === rubric.assignmentId && s.criteria_item_id === item.id
          )
          nextDrafts[key(rubric.assignmentId, item.id)] = {
            eligibility_value: existing?.eligibility_value ?? null,
            band_id: existing?.band_id ?? null,
            points_value: existing?.points_value ?? null,
          }
        }
      }

      setRubrics(built)
      setDrafts(nextDrafts)
      setLoading(false)
    }
    load()
  }, [projectId, router])

  useEffect(() => {
    if (!timerRunning || secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [timerRunning, secondsLeft])

  const openRubrics = useMemo(() => rubrics.filter((r) => r.status !== 'submitted'), [rubrics])
  const allSubmitted = rubrics.length > 0 && openRubrics.length === 0

  const unanswered = useMemo(() => {
    let count = 0
    for (const rubric of openRubrics) {
      for (const item of rubric.eligibility) {
        const d = drafts[key(rubric.assignmentId, item.id)]
        if (d?.eligibility_value === null || d?.eligibility_value === undefined) count++
      }
      for (const item of rubric.scored) {
        if (!drafts[key(rubric.assignmentId, item.id)]?.band_id) count++
      }
    }
    return count
  }, [openRubrics, drafts])

  const totalQuestions = useMemo(
    () => openRubrics.reduce((sum, r) => sum + r.eligibility.length + r.scored.length, 0),
    [openRubrics]
  )

  const rubricTotal = useCallback(
    (rubric: Rubric) =>
      rubric.scored.reduce(
        (sum, item) => sum + (drafts[key(rubric.assignmentId, item.id)]?.points_value || 0),
        0
      ),
    [drafts]
  )

  const rubricMax = (rubric: Rubric) =>
    rubric.scored.reduce((sum, item) => sum + Math.max(0, ...item.bands.map((b) => b.points), 0), 0)

  const saveScore = useCallback(
    async (assignmentId: string, itemId: string, draft: Draft) => {
      setSaveState('saving')
      const supabase = createClient()
      const { error: uErr } = await supabase.from('scores').upsert(
        {
          assignment_id: assignmentId,
          criteria_item_id: itemId,
          eligibility_value: draft.eligibility_value,
          band_id: draft.band_id,
          points_value: draft.points_value,
        },
        { onConflict: 'assignment_id,criteria_item_id' }
      )
      if (uErr) {
        setError(uErr.message)
        setSaveState('error')
      } else {
        setSaveState('saved')
        setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
      }
    },
    []
  )

  const choose = (assignmentId: string, itemId: string, draft: Draft) => {
    setDrafts((d) => ({ ...d, [key(assignmentId, itemId)]: draft }))
    saveScore(assignmentId, itemId, draft)
  }

  const onNotesChange = (value: string) => {
    setNotes(value)
    if (openRubrics.length === 0) return
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      const supabase = createClient()
      await supabase
        .from('judge_assignments')
        .update({ notes: value })
        .in(
          'id',
          openRubrics.map((r) => r.assignmentId)
        )
    }, 800)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    const supabase = createClient()
    const ids = openRubrics.map((r) => r.assignmentId)
    await supabase.from('judge_assignments').update({ notes }).in('id', ids)
    const { error: sErr } = await supabase
      .from('judge_assignments')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .in('id', ids)
    if (sErr) {
      setError(sErr.message)
      setSubmitting(false)
      setConfirming(false)
      return
    }
    router.replace('/judge')
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const timerTone =
    secondsLeft === 0 ? 'text-red-400' : secondsLeft < 60 ? 'text-orange-400' : 'text-yellow-400'

  if (loading) return <LoadingScreen message="Loading this table…" />

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] p-6">
        <div className="max-w-xl mx-auto space-y-4">
          <Banner tone="error">{error}</Banner>
          <Link href="/judge" className="text-blue-400 text-sm">
            ← Back to your tables
          </Link>
        </div>
      </div>
    )
  }

  const noRubrics = rubrics.every((r) => !r.hasRubric)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] pb-32">
      <div className="sticky top-0 z-40 bg-[#0a1628]/95 border-b border-white/10 backdrop-blur">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/judge" className="text-sm text-blue-400 shrink-0">
            ← Tables
          </Link>
          <div className="text-center">
            <p className={`text-2xl font-bold tabular-nums leading-none ${timerTone}`}>
              {formatTime(secondsLeft)}
            </p>
            {!allSubmitted && (
              <div className="flex gap-2 justify-center mt-1">
                <button
                  onClick={() => setTimerRunning((r) => !r)}
                  className="text-[11px] text-gray-400 hover:text-white"
                >
                  {timerRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={() => {
                    setSecondsLeft(visitSeconds)
                    setTimerRunning(true)
                  }}
                  className="text-[11px] text-gray-400 hover:text-white"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] text-gray-400 leading-none">Rubrics</p>
            <p className="text-lg font-bold text-white leading-tight">
              {rubrics.filter((r) => r.status === 'submitted').length}
              <span className="text-gray-500 text-sm">/{rubrics.length}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-5">
        {error && <Banner tone="error">{error}</Banner>}
        {secondsLeft === 0 && !allSubmitted && (
          <Banner tone="warning">
            Time is up for this table. You can still finish — the timer paces the room, it does not
            block you.
          </Banner>
        )}

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="yellow">Table {project?.table_number || 'TBD'}</Pill>
            {allSubmitted && <Pill tone="green">Submitted</Pill>}
          </div>
          <h1 className="text-2xl font-bold text-white leading-snug">{project?.title}</h1>
          {rubrics.length > 1 && (
            <p className="text-sm text-gray-400 leading-relaxed">
              This team entered {rubrics.length} prizes you are judging. Watch the demo once, then
              answer all {rubrics.length} rubrics below before you move on.
            </p>
          )}
          {project?.about && (
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
              {project.about.length > 400 ? `${project.about.slice(0, 400)}…` : project.about}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.slice(0, 8).map((t) => (
                <span key={t} className="px-2 py-1 text-xs rounded-lg bg-white/10 text-gray-300">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {project?.submission_url && (
              <a
                href={project.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              >
                Devpost ↗
              </a>
            )}
            {project?.video_url && (
              <a
                href={project.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              >
                Demo video ↗
              </a>
            )}
            {project?.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              >
                Code ↗
              </a>
            )}
          </div>
        </div>

        {allSubmitted && (
          <Banner tone="success">
            Everything for this table is submitted and locked to keep results auditable. Ask an
            organizer if a correction is needed.
          </Banner>
        )}

        {noRubrics ? (
          <div className="bg-white/5 rounded-2xl border border-white/10">
            <EmptyState
              title="No rubric published yet"
              description="Organizers have not finished the criteria for this table's tracks. Let them know before scoring — submitting now would record an empty score."
            />
          </div>
        ) : (
          rubrics.map((rubric) => {
            const locked = rubric.status === 'submitted'
            const max = rubricMax(rubric)
            return (
              <section
                key={rubric.assignmentId}
                id={`rubric-${rubric.assignmentId}`}
                className="space-y-3 scroll-mt-24"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Pill tone={rubric.trackType === 'sponsor' ? 'orange' : 'blue'}>
                      {rubric.trackType === 'sponsor' ? 'Sponsor prize' : 'Main track'}
                    </Pill>
                    <h2 className="text-lg font-semibold text-white truncate">{rubric.trackName}</h2>
                  </div>
                  <span className="text-sm shrink-0">
                    {locked && <span className="text-green-400 mr-2">Submitted</span>}
                    <span className="text-yellow-400 font-bold">{rubricTotal(rubric)}</span>
                    {max > 0 && <span className="text-gray-500">/{max}</span>}
                  </span>
                </div>

                {!rubric.hasRubric && (
                  <Banner tone="warning">
                    No criteria published for {rubric.trackName}. Tell an organizer — you cannot score
                    this prize yet.
                  </Banner>
                )}

                {rubric.eligibility.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Pass/fail checks for this prize. They add no points — answer honestly and keep
                      scoring either way.
                    </p>
                    {rubric.eligibility.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
                      >
                        <div>
                          <p className="text-white font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[true, false].map((val) => {
                            const selected =
                              drafts[key(rubric.assignmentId, item.id)]?.eligibility_value === val
                            return (
                              <button
                                key={String(val)}
                                disabled={locked}
                                onClick={() =>
                                  choose(rubric.assignmentId, item.id, {
                                    eligibility_value: val,
                                    band_id: null,
                                    points_value: null,
                                  })
                                }
                                className={`py-3 rounded-lg font-semibold border transition disabled:opacity-60 ${
                                  selected
                                    ? val
                                      ? 'bg-green-600 border-green-500 text-white'
                                      : 'bg-red-600 border-red-500 text-white'
                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                }`}
                              >
                                {val ? 'Yes' : 'No'}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {rubric.scored.map((item) => {
                  const draft = drafts[key(rubric.assignmentId, item.id)]
                  return (
                    <div
                      key={item.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
                    >
                      <div>
                        <div className="flex justify-between gap-2 items-start">
                          <p className="text-white font-medium">{item.title}</p>
                          {draft?.points_value !== null && draft?.points_value !== undefined && (
                            <span className="text-yellow-400 font-bold text-sm shrink-0">
                              {draft.points_value} pts
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        {item.bands.map((band) => {
                          const selected = draft?.band_id === band.id
                          return (
                            <button
                              key={band.id}
                              disabled={locked}
                              onClick={() =>
                                choose(rubric.assignmentId, item.id, {
                                  eligibility_value: null,
                                  band_id: band.id,
                                  points_value: band.points,
                                })
                              }
                              className={`text-left p-3 rounded-lg border transition disabled:opacity-60 ${
                                selected
                                  ? 'bg-blue-600/40 border-blue-400 text-white'
                                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex justify-between gap-2">
                                <span className="font-semibold">{band.label}</span>
                                <span className="text-yellow-400 font-bold shrink-0">
                                  {band.points} pts
                                </span>
                              </div>
                              {band.description && (
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                  {band.description}
                                </p>
                              )}
                            </button>
                          )
                        })}
                        {item.bands.length === 0 && (
                          <p className="text-xs text-red-300">
                            No score bands configured for this criterion. Tell an organizer.
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </section>
            )
          })
        )}

        {!allSubmitted && !noRubrics && (
          <section className="space-y-2">
            <div>
              <label htmlFor="judge-notes" className="text-white font-medium">
                Notes for organizers
              </label>
              <p className="text-xs text-gray-500 leading-relaxed">
                Optional, and shared across every rubric at this table. Flag anything unusual — no-show
                team, suspected rule issue, or a project worth a second look.
              </p>
            </div>
            <textarea
              id="judge-notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Team wasn't at their table…"
            />
          </section>
        )}
      </div>

      {!allSubmitted && !noRubrics && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-[#0a1628]/95 border-t border-white/10 backdrop-blur">
          <div className="max-w-xl mx-auto space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">
                {saveState === 'saving' && 'Saving…'}
                {saveState === 'saved' && 'Saved'}
                {saveState === 'error' && 'Save failed'}
                {saveState === 'idle' && 'Answers save as you tap'}
              </span>
              {unanswered > 0 && <span className="text-yellow-400">{unanswered} left</span>}
            </div>
            <button
              onClick={() => setConfirming(true)}
              disabled={submitting || unanswered > 0}
              className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-white/10 disabled:text-gray-500 text-white font-bold rounded-xl transition"
            >
              {unanswered > 0
                ? `Answer everything to submit (${totalQuestions - unanswered}/${totalQuestions})`
                : `Submit ${openRubrics.length} rubric${openRubrics.length === 1 ? '' : 's'} and leave the table`}
            </button>
          </div>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#0a1628] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Submit this table?</h3>
            <div className="text-sm text-gray-400 leading-relaxed space-y-2">
              <p>
                You are submitting {openRubrics.length} rubric
                {openRubrics.length === 1 ? '' : 's'} for {project?.title}:
              </p>
              <ul className="space-y-1">
                {openRubrics.map((r) => (
                  <li key={r.assignmentId} className="flex justify-between gap-3">
                    <span className="truncate">{r.trackName}</span>
                    <span className="text-yellow-400 font-bold shrink-0">
                      {rubricTotal(r)} pts
                    </span>
                  </li>
                ))}
              </ul>
              <p>After submitting you cannot change it — an organizer would need to reopen it.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition"
              >
                Keep editing
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-lg transition"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
