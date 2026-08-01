'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CriteriaBand, CriteriaItem } from '@/types/judging'
import { Banner, EmptyState, LoadingScreen, Pill } from '@/components/judging/ui'

type ScoredItem = CriteriaItem & { bands: CriteriaBand[] }
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

export default function JudgeScorePage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [locked, setLocked] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const [project, setProject] = useState<ProjectContext | null>(null)
  const [trackName, setTrackName] = useState('')
  const [trackType, setTrackType] = useState('in_house')
  const [tags, setTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const [eligibilityItems, setEligibilityItems] = useState<CriteriaItem[]>([])
  const [scoredItems, setScoredItems] = useState<ScoredItem[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [criteriaMissing, setCriteriaMissing] = useState(false)

  const [totalSeconds, setTotalSeconds] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [timerRunning, setTimerRunning] = useState(true)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      const auth = await fetch('/api/auth/user').then((r) => r.json())
      if (!auth.user || !auth.isJudge) {
        router.replace('/judge/login')
        return
      }

      const supabase = createClient()
      const { data: assignment, error: aErr } = await supabase
        .from('judge_assignments')
        .select(
          `id, status, notes, judge_id, track_context_id,
           project:projects(id, title, about, table_number, submission_url, video_url, github_url),
           track:tracks!judge_assignments_track_context_id_fkey(id, name, type, timer_seconds)`
        )
        .eq('id', assignmentId)
        .maybeSingle()

      if (aErr || !assignment) {
        setError(aErr?.message || 'This assignment does not exist or is not assigned to you.')
        setLoading(false)
        return
      }

      const proj = assignment.project as unknown as ProjectContext
      const track = assignment.track as unknown as {
        id: string
        name: string
        type: string
        timer_seconds: number
      }

      setProject(proj)
      setTrackName(track.name)
      setTrackType(track.type)
      setNotes(assignment.notes || '')
      setLocked(assignment.status === 'submitted')
      setTotalSeconds(track.timer_seconds)
      setSecondsLeft(track.timer_seconds)
      setTimerRunning(assignment.status !== 'submitted')

      if (assignment.status === 'assigned') {
        await supabase
          .from('judge_assignments')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('id', assignmentId)
      }

      const { data: tagRows } = await supabase
        .from('project_tags')
        .select('tag:tags(name)')
        .eq('project_id', proj.id)
      const tagList = (tagRows || []) as unknown as { tag: { name: string } | null }[]
      setTags(tagList.map((r) => r.tag?.name).filter(Boolean) as string[])

      const setQuery = supabase.from('criteria_sets').select('id').order('created_at')
      const { data: setRows } =
        track.type === 'sponsor'
          ? await setQuery.eq('applies_to', 'sponsor').eq('track_id', track.id)
          : await setQuery.eq('applies_to', 'in_house_shared').is('track_id', null)

      const setRow = setRows?.[0]
      if (!setRow) {
        setCriteriaMissing(true)
        setLoading(false)
        return
      }

      const { data: items } = await supabase
        .from('criteria_items')
        .select('*')
        .eq('criteria_set_id', setRow.id)
        .order('sort_order')

      const itemList = (items || []) as CriteriaItem[]
      const scored = itemList.filter((i) => i.type === 'scored')
      setEligibilityItems(itemList.filter((i) => i.type === 'eligibility'))

      const { data: allBands } = await supabase
        .from('criteria_bands')
        .select('*')
        .in(
          'criteria_item_id',
          scored.map((s) => s.id)
        )
        .order('sort_order')

      setScoredItems(
        scored.map((item) => ({
          ...item,
          bands: ((allBands || []) as CriteriaBand[]).filter((b) => b.criteria_item_id === item.id),
        }))
      )

      const { data: existingScores } = await supabase
        .from('scores')
        .select('*')
        .eq('assignment_id', assignmentId)

      const next: Record<string, Draft> = {}
      for (const item of itemList) {
        const existing = (existingScores || []).find(
          (s: { criteria_item_id: string }) => s.criteria_item_id === item.id
        )
        next[item.id] = {
          eligibility_value: existing?.eligibility_value ?? null,
          band_id: existing?.band_id ?? null,
          points_value: existing?.points_value ?? null,
        }
      }
      setDrafts(next)
      setCriteriaMissing(itemList.length === 0)
      setLoading(false)
    }
    load()
  }, [assignmentId, router])

  useEffect(() => {
    if (!timerRunning || locked || secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [timerRunning, locked, secondsLeft])

  const runningTotal = useMemo(
    () => Object.values(drafts).reduce((sum, d) => sum + (d.points_value || 0), 0),
    [drafts]
  )

  const maxTotal = useMemo(
    () =>
      scoredItems.reduce(
        (sum, item) => sum + Math.max(0, ...item.bands.map((b) => b.points), 0),
        0
      ),
    [scoredItems]
  )

  const unanswered = useMemo(() => {
    const missing: string[] = []
    for (const item of eligibilityItems) {
      if (drafts[item.id]?.eligibility_value === null || drafts[item.id]?.eligibility_value === undefined)
        missing.push(item.title)
    }
    for (const item of scoredItems) {
      if (!drafts[item.id]?.band_id) missing.push(item.title)
    }
    return missing
  }, [drafts, eligibilityItems, scoredItems])

  const answeredCount = eligibilityItems.length + scoredItems.length - unanswered.length
  const totalCount = eligibilityItems.length + scoredItems.length

  const saveScore = useCallback(
    async (itemId: string, draft: Draft) => {
      if (locked) return
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
    [assignmentId, locked]
  )

  const choose = (itemId: string, draft: Draft) => {
    setDrafts((d) => ({ ...d, [itemId]: draft }))
    saveScore(itemId, draft)
  }

  const onNotesChange = (value: string) => {
    setNotes(value)
    if (locked) return
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      const supabase = createClient()
      await supabase.from('judge_assignments').update({ notes: value }).eq('id', assignmentId)
    }, 800)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    const supabase = createClient()
    await supabase.from('judge_assignments').update({ notes }).eq('id', assignmentId)
    const { error: sErr } = await supabase
      .from('judge_assignments')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', assignmentId)
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

  if (loading) return <LoadingScreen message="Loading score sheet…" />

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] p-6">
        <div className="max-w-xl mx-auto space-y-4">
          <Banner tone="error">{error}</Banner>
          <Link href="/judge" className="text-blue-400 text-sm">
            ← Back to your projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] pb-32">
      <div className="sticky top-0 z-40 bg-[#0a1628]/95 border-b border-white/10 backdrop-blur">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/judge" className="text-sm text-blue-400 shrink-0">
            ← Projects
          </Link>
          <div className="text-center">
            <p className={`text-2xl font-bold tabular-nums leading-none ${timerTone}`}>
              {formatTime(secondsLeft)}
            </p>
            {!locked && (
              <div className="flex gap-2 justify-center mt-1">
                <button
                  onClick={() => setTimerRunning((r) => !r)}
                  className="text-[11px] text-gray-400 hover:text-white"
                >
                  {timerRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={() => {
                    setSecondsLeft(totalSeconds)
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
            <p className="text-[11px] text-gray-400 leading-none">Score</p>
            <p className="text-lg font-bold text-white leading-tight">
              {runningTotal}
              {maxTotal > 0 && <span className="text-gray-500 text-sm">/{maxTotal}</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-5">
        {error && <Banner tone="error">{error}</Banner>}
        {secondsLeft === 0 && !locked && (
          <Banner tone="warning">
            Time is up. You can still finish scoring — the timer is a pacing guide, not a hard stop.
          </Banner>
        )}

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={trackType === 'sponsor' ? 'orange' : 'neutral'}>{trackName}</Pill>
            <Pill tone="yellow">Table {project?.table_number || 'TBD'}</Pill>
            {locked && <Pill tone="green">Submitted</Pill>}
          </div>
          <h1 className="text-2xl font-bold text-white leading-snug">{project?.title}</h1>
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

        {locked && (
          <Banner tone="success">
            You submitted this score sheet. It is locked to keep results auditable — ask an organizer
            if a correction is needed.
          </Banner>
        )}

        {criteriaMissing ? (
          <div className="bg-white/5 rounded-2xl border border-white/10">
            <EmptyState
              title="No rubric published for this track"
              description="Organizers have not finished the criteria for this track yet. Let them know before scoring — submitting now would record an empty score."
            />
          </div>
        ) : (
          <>
            {totalCount > 0 && (
              <p className="text-xs text-gray-500">
                {answeredCount} of {totalCount} answered
              </p>
            )}

            {eligibilityItems.length > 0 && (
              <section className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Eligibility</h2>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    These are pass/fail checks for this prize. They do not add points — answer
                    honestly and keep scoring the rubric either way.
                  </p>
                </div>
                {eligibilityItems.map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-white font-medium">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[true, false].map((val) => {
                        const selected = drafts[item.id]?.eligibility_value === val
                        return (
                          <button
                            key={String(val)}
                            disabled={locked}
                            onClick={() =>
                              choose(item.id, {
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
              </section>
            )}

            {scoredItems.length > 0 && (
              <section className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Scoring</h2>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Pick the one band per criterion that best describes the project. Your running
                    total is shown in the header.
                  </p>
                </div>
                {scoredItems.map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div>
                      <div className="flex justify-between gap-2 items-start">
                        <p className="text-white font-medium">{item.title}</p>
                        {drafts[item.id]?.points_value !== null &&
                          drafts[item.id]?.points_value !== undefined && (
                            <span className="text-yellow-400 font-bold text-sm shrink-0">
                              {drafts[item.id].points_value} pts
                            </span>
                          )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      {item.bands.map((band) => {
                        const selected = drafts[item.id]?.band_id === band.id
                        return (
                          <button
                            key={band.id}
                            disabled={locked}
                            onClick={() =>
                              choose(item.id, {
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
                              <span className="text-yellow-400 font-bold shrink-0">{band.points} pts</span>
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
                ))}
              </section>
            )}

            <section className="space-y-2">
              <div>
                <label htmlFor="judge-notes" className="text-white font-medium">
                  Notes for organizers
                </label>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Optional. Flag anything unusual — no-show team, suspected rule issue, or a project
                  worth a second look. Only organizers see this.
                </p>
              </div>
              <textarea
                id="judge-notes"
                disabled={locked}
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Team wasn't at their table…"
              />
            </section>
          </>
        )}
      </div>

      {!locked && !criteriaMissing && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-[#0a1628]/95 border-t border-white/10 backdrop-blur">
          <div className="max-w-xl mx-auto space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">
                {saveState === 'saving' && 'Saving…'}
                {saveState === 'saved' && 'Saved'}
                {saveState === 'error' && 'Save failed'}
                {saveState === 'idle' && 'Answers save as you tap'}
              </span>
              {unanswered.length > 0 && (
                <span className="text-yellow-400">{unanswered.length} left</span>
              )}
            </div>
            <button
              onClick={() => setConfirming(true)}
              disabled={submitting || unanswered.length > 0}
              className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-white/10 disabled:text-gray-500 text-white font-bold rounded-xl transition"
            >
              {unanswered.length > 0
                ? `Answer all criteria to submit (${answeredCount}/${totalCount})`
                : `Submit score (${runningTotal} pts)`}
            </button>
          </div>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#0a1628] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Submit this score?</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              You are recording <span className="text-yellow-400 font-bold">{runningTotal} points</span>{' '}
              for {project?.title}. After submitting you cannot change it — an organizer would need to
              reopen it for you.
            </p>
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
