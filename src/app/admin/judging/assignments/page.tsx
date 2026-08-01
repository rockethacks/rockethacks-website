'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { JudgeProfile, JudgingSettings, PlannedVisit, Project, Track } from '@/types/judging'
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
import { exportWorkbook, minutes as toMinutes } from '@/lib/judging/export'
import {
  FALLBACK_SETTINGS,
  buildVisits,
  formatDuration,
  minutesLabel,
  visitSeconds,
  visitsPerJudge,
  type AssignmentLite,
} from '@/lib/judging/visits'
import { ConfirmRemoveDialog } from '@/components/staff/ConfirmRemoveDialog'

type AssignmentRow = AssignmentLite & {
  judge: { full_name: string | null; email: string } | null
  project: { title: string; table_number: string | null } | null
}

const PAGE = 1000

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export default function AssignmentsAdminPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading assignments…" />}>
      <AssignmentsAdminInner />
    </Suspense>
  )
}

function AssignmentsAdminInner() {
  const searchParams = useSearchParams()
  const manualPanelRef = useRef<HTMLDivElement | null>(null)
  const deepLinkApplied = useRef(false)

  const [settings, setSettings] = useState<JudgingSettings>(FALLBACK_SETTINGS)
  const [tracks, setTracks] = useState<Track[]>([])
  const [judges, setJudges] = useState<JudgeProfile[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [sponsorLinks, setSponsorLinks] = useState<{ project_id: string; track_id: string }[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [taggedProjects, setTaggedProjects] = useState(0)
  const [taggedJudges, setTaggedJudges] = useState(0)

  const [perProject, setPerProject] = useState(FALLBACK_SETTINGS.judges_per_project)
  const [windowMinutes, setWindowMinutes] = useState(60)
  const [transitionMinutes, setTransitionMinutes] = useState(1)
  const [plan, setPlan] = useState<PlannedVisit[]>([])
  /** Settings the current preview was built with — cleared when inputs diverge. */
  const [planBuiltWith, setPlanBuiltWith] = useState<{
    perProject: number
    windowMinutes: number
    transitionMinutes: number
  } | null>(null)

  const [trackId, setTrackId] = useState('')
  const [manualJudge, setManualJudge] = useState('')
  const [manualProject, setManualProject] = useState('')
  const [highlightProjectId, setHighlightProjectId] = useState('')

  const [busy, setBusy] = useState(false)
  const [confirmRedo, setConfirmRedo] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()

    const [settingsRes, trackRes, judgeRes, projectRes, sponsorRes, ptRes, jtRes] =
      await Promise.all([
        supabase.from('judging_settings').select('*').maybeSingle(),
        supabase.from('tracks').select('*').order('sort_order').order('name'),
        supabase.from('judge_profiles').select('*').order('full_name'),
        supabase.from('projects').select('*').eq('status', 'submitted').order('title'),
        supabase.from('project_sponsor_tracks').select('project_id, track_id'),
        supabase.from('project_tags').select('project_id'),
        supabase.from('judge_tags').select('judge_id'),
      ])

    if (settingsRes.data) {
      const s = settingsRes.data as JudgingSettings
      setSettings(s)
      setWindowMinutes(s.window_minutes)
      setTransitionMinutes(Math.round(s.transition_seconds / 60))
      setPerProject(s.judges_per_project ?? FALLBACK_SETTINGS.judges_per_project)
    }

    const trackList = (trackRes.data || []) as Track[]
    setTracks(trackList)
    setJudges((judgeRes.data || []) as JudgeProfile[])
    setProjects((projectRes.data || []) as Project[])
    setSponsorLinks((sponsorRes.data || []) as { project_id: string; track_id: string }[])
    setTrackId((prev) => prev || trackList.find((t) => t.is_active)?.id || '')
    setTaggedProjects(
      new Set(((ptRes.data || []) as { project_id: string }[]).map((r) => r.project_id)).size
    )
    setTaggedJudges(
      new Set(((jtRes.data || []) as { judge_id: string }[]).map((r) => r.judge_id)).size
    )

    const collected: AssignmentRow[] = []
    for (let page = 0; ; page++) {
      const { data, error: aErr } = await supabase
        .from('judge_assignments')
        .select(
          `id, judge_id, project_id, track_context_id, status,
           judge:judge_profiles(full_name, email),
           project:projects(title, table_number)`
        )
        .order('assigned_at')
        .range(page * PAGE, page * PAGE + PAGE - 1)
      if (aErr) {
        setError(aErr.message)
        break
      }
      const batch = (data || []) as unknown as AssignmentRow[]
      collected.push(...batch)
      if (batch.length < PAGE) break
    }
    setAssignments(collected)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Deep link from Tables: /admin/judging/assignments?project=&track=
  useEffect(() => {
    if (deepLinkApplied.current || tracks.length === 0 || projects.length === 0) return
    const trackParam = searchParams.get('track')
    const projectParam = searchParams.get('project')
    if (!trackParam && !projectParam) return

    deepLinkApplied.current = true
    if (trackParam && tracks.some((t) => t.id === trackParam)) setTrackId(trackParam)
    if (projectParam && projects.some((p) => p.id === projectParam)) {
      setManualProject(projectParam)
      setHighlightProjectId(projectParam)
    }
    requestAnimationFrame(() => {
      manualPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [searchParams, tracks, projects])

  const trackById = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks])
  const activeSettings = useMemo(
    () => ({ ...settings, transition_seconds: transitionMinutes * 60 }),
    [settings, transitionMinutes]
  )

  /** Every rubric that applies at a table, split by whether it can ride along. */
  const tables = useMemo(() => {
    const sponsorByProject = new Map<string, string[]>()
    for (const link of sponsorLinks) {
      const list = sponsorByProject.get(link.project_id) || []
      list.push(link.track_id)
      sponsorByProject.set(link.project_id, list)
    }

    return projects.map((p) => {
      const ids = [p.main_track_id, ...(sponsorByProject.get(p.id) || [])].filter(
        (id): id is string => Boolean(id)
      )
      const active = ids.map((id) => trackById.get(id)).filter((t): t is Track => Boolean(t?.is_active))
      const open = active.filter((t) => !t.sponsor_judges_only)
      const restricted = active.filter((t) => t.sponsor_judges_only)
      const neededOpen = open.length
        ? Math.max(...open.map((t) => t.judges_per_project ?? perProject))
        : 0
      const neededRestricted = restricted.reduce(
        (sum, t) => sum + (t.judges_per_project ?? perProject),
        0
      )
      return {
        project: p,
        open,
        restricted,
        neededOpen,
        neededRestricted,
        seconds: visitSeconds(
          active.map((t) => t.id),
          trackById,
          activeSettings
        ),
      }
    })
  }, [projects, sponsorLinks, trackById, perProject, activeSettings])

  const feasibility = useMemo(() => {
    const withRubrics = tables.filter((t) => t.open.length > 0 || t.restricted.length > 0)
    const visitsNeeded = withRubrics.reduce((sum, t) => sum + t.neededOpen + t.neededRestricted, 0)
    const openTargets = withRubrics.filter((t) => t.neededOpen > 0).map((t) => t.neededOpen)
    const effectivePerProject = openTargets.length
      ? Math.round(
          (openTargets.reduce((sum, n) => sum + n, 0) / openTargets.length) * 10
        ) / 10
      : perProject
    const avgVisit = withRubrics.length
      ? Math.round(withRubrics.reduce((sum, t) => sum + t.seconds, 0) / withRubrics.length)
      : activeSettings.default_visit_seconds + activeSettings.transition_seconds
    const perJudge = visitsPerJudge(windowMinutes, avgVisit)
    const capacity = perJudge * judges.length
    const judgesNeeded = perJudge > 0 ? Math.ceil(visitsNeeded / perJudge) : 0
    const atLastResort =
      perProject <= 1 && windowMinutes >= (settings.window_max_minutes || 90)
    return {
      tables: withRubrics.length,
      visitsNeeded,
      effectivePerProject,
      avgVisit,
      perJudge,
      capacity,
      judgesNeeded,
      affordablePerProject:
        withRubrics.length > 0 ? Math.floor(capacity / withRubrics.length) : 0,
      feasible: capacity >= visitsNeeded,
      atLastResort,
      hardShortage: atLastResort && capacity < visitsNeeded,
    }
  }, [tables, windowMinutes, judges.length, activeSettings, perProject, settings.window_max_minutes])

  /** Changing plan inputs invalidates an unsaved preview so shortfalls cannot lie. */
  const updatePerProject = (value: number) => {
    const next = Math.max(1, value || 1)
    setPerProject(next)
    if (plan.length > 0) {
      setPlan([])
      setPlanBuiltWith(null)
      setMessage('Settings changed — rebuild the plan to preview with the new judges-per-project.')
    }
  }

  const updateWindowMinutes = (value: number) => {
    const next = Math.max(15, value || 60)
    setWindowMinutes(next)
    if (plan.length > 0) {
      setPlan([])
      setPlanBuiltWith(null)
      setMessage('Settings changed — rebuild the plan to preview with the new window.')
    }
  }

  const updateTransitionMinutes = (value: number) => {
    const next = Math.max(0, value || 0)
    setTransitionMinutes(next)
    if (plan.length > 0) {
      setPlan([])
      setPlanBuiltWith(null)
      setMessage('Settings changed — rebuild the plan to preview with the new walk time.')
    }
  }

  const currentVisits = useMemo(
    () => buildVisits(assignments, trackById, activeSettings),
    [assignments, trackById, activeSettings]
  )

  const judgeLoad = useMemo(() => {
    const byJudge = new Map<string, { visits: number; seconds: number }>()
    for (const v of currentVisits) {
      const entry = byJudge.get(v.judgeId) || { visits: 0, seconds: 0 }
      entry.visits++
      entry.seconds += v.seconds
      byJudge.set(v.judgeId, entry)
    }
    return judges
      .map((j) => ({ judge: j, ...(byJudge.get(j.user_id) || { visits: 0, seconds: 0 }) }))
      .sort((a, b) => b.visits - a.visits)
  }, [currentVisits, judges])

  const planSummary = useMemo(() => {
    const visits = plan.filter((p) => p.judge_id)
    const shortfalls = plan.filter((p) => !p.judge_id)
    const byJudge = new Map<string, { visits: number; seconds: number }>()
    let sheets = 0
    for (const v of visits) {
      sheets += v.track_ids?.length || 0
      const entry = byJudge.get(v.judge_id as string) || { visits: 0, seconds: 0 }
      entry.visits++
      entry.seconds += v.visit_seconds
      byJudge.set(v.judge_id as string, entry)
    }
    const rows = Array.from(byJudge.entries())
      .map(([judgeId, v]) => ({
        judgeId,
        ...v,
        over: v.seconds > windowMinutes * 60,
      }))
      .sort((a, b) => b.seconds - a.seconds)
    return { visits, shortfalls, sheets, rows }
  }, [plan, windowMinutes])

  const hasCommittedPlan = assignments.length > 0

  const runSuggestPlan = async () => {
    const supabase = createClient()

    await supabase
      .from('judging_settings')
      .update({
        window_minutes: windowMinutes,
        transition_seconds: transitionMinutes * 60,
        judges_per_project: perProject,
        updated_at: new Date().toISOString(),
      })
      .eq('id', true)

    const { data, error: rpcErr } = await supabase.rpc('suggest_judging_plan', {
      p_judges_per_project: perProject,
      p_window_seconds: windowMinutes * 60,
    })

    if (rpcErr) {
      setError(rpcErr.message)
      return false
    }

    const rows = (data || []) as PlannedVisit[]
    setPlan(rows)
    setPlanBuiltWith({ perProject, windowMinutes, transitionMinutes })
    setSettings((prev) => ({
      ...prev,
      window_minutes: windowMinutes,
      transition_seconds: transitionMinutes * 60,
      judges_per_project: perProject,
    }))
    const visits = rows.filter((r) => r.judge_id).length
    setMessage(
      visits === 0
        ? 'Nothing to plan. Check that projects are imported, tracks are active and judges exist.'
        : `${visits} visits ready to review. Nothing is saved until you commit.`
    )
    return true
  }

  const buildPlan = async () => {
    if (hasCommittedPlan) {
      setError(
        'A plan is already committed. Building again on top of it would mess up the existing visits. Use Redo plan to clear everything and build fresh.'
      )
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    await runSuggestPlan()
    setBusy(false)
  }

  const commitPlan = async () => {
    if (hasCommittedPlan) {
      setError(
        'Assignments already exist. Discard this preview, or use Redo plan if you want a full replacement.'
      )
      return
    }
    const rows = plan
      .filter((p) => p.judge_id && p.track_ids?.length)
      .flatMap((p) =>
        (p.track_ids as string[]).map((trackContextId) => ({
          judge_id: p.judge_id as string,
          project_id: p.project_id,
          track_context_id: trackContextId,
          status: 'assigned',
        }))
      )
    if (rows.length === 0) return

    setBusy(true)
    setError('')
    const supabase = createClient()
    for (const part of chunk(rows, 200)) {
      const { error: iErr } = await supabase
        .from('judge_assignments')
        .upsert(part, {
          onConflict: 'judge_id,project_id,track_context_id',
          ignoreDuplicates: true,
        })
      if (iErr) {
        setError(iErr.message)
        setBusy(false)
        return
      }
    }
    setMessage(
      `Committed ${rows.length} score sheets across ${planSummary.visits.length} visits. Open Tables → Reseat for short walks to pack co-judged projects together.`
    )
    setPlan([])
    setPlanBuiltWith(null)
    await load()
    setBusy(false)
  }

  const redoPlan = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    const supabase = createClient()
    const { error: dErr } = await supabase
      .from('judge_assignments')
      .delete()
      .not('id', 'is', null)
    if (dErr) {
      setError(dErr.message)
      setBusy(false)
      return
    }

    setConfirmRedo(false)
    setPlan([])
    setPlanBuiltWith(null)
    await load()
    await runSuggestPlan()
    setBusy(false)
  }

  // ---------- per-track manual controls ----------

  const scopeProjects = useMemo(() => {
    if (!trackId) return []
    const sponsorIds = new Set(
      sponsorLinks.filter((l) => l.track_id === trackId).map((l) => l.project_id)
    )
    return projects.filter((p) => p.main_track_id === trackId || sponsorIds.has(p.id))
  }, [projects, sponsorLinks, trackId])

  const trackAssignments = useMemo(
    () => assignments.filter((a) => a.track_context_id === trackId),
    [assignments, trackId]
  )

  const coverage = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of trackAssignments) counts.set(a.project_id, (counts.get(a.project_id) || 0) + 1)
    const target = trackById.get(trackId)?.judges_per_project ?? perProject
    return scopeProjects.map((p) => ({
      project: p,
      judges: counts.get(p.id) || 0,
      target,
    }))
  }, [trackAssignments, scopeProjects, trackById, trackId, perProject])

  const addManual = async () => {
    if (!manualJudge || !manualProject || !trackId) return
    setError('')
    const supabase = createClient()
    const { error: iErr } = await supabase.from('judge_assignments').insert({
      judge_id: manualJudge,
      project_id: manualProject,
      track_context_id: trackId,
    })
    if (iErr)
      setError(
        iErr.message.includes('duplicate')
          ? 'That judge is already assigned to this project for this track.'
          : iErr.message
      )
    else {
      setMessage('Assignment added.')
      setManualProject('')
      await load()
    }
  }

  const removeAssignment = async (id: string) => {
    const supabase = createClient()
    const { error: dErr } = await supabase.from('judge_assignments').delete().eq('id', id)
    if (dErr) setError(dErr.message)
    else await load()
  }

  const reassign = async (id: string, newJudgeId: string) => {
    const supabase = createClient()
    const { error: uErr } = await supabase
      .from('judge_assignments')
      .update({ judge_id: newJudgeId })
      .eq('id', id)
    if (uErr) setError(uErr.message)
    else await load()
  }

  const reopen = async (id: string) => {
    const supabase = createClient()
    const { error: uErr } = await supabase
      .from('judge_assignments')
      .update({ status: 'in_progress', submitted_at: null })
      .eq('id', id)
    if (uErr) setError(uErr.message)
    else {
      setMessage('Assignment reopened — the judge can edit and resubmit it.')
      await load()
    }
  }

  const judgeName = (id: string) => {
    const j = judges.find((x) => x.user_id === id)
    return j?.full_name || j?.email || id.slice(0, 8)
  }
  const projectName = (id: string) =>
    projects.find((p) => p.id === id)?.title || id.slice(0, 8)

  const restrictedTracks = tracks.filter((t) => t.is_active && t.sponsor_judges_only)

  const exportAssignments = () => {
    const projectById = new Map(projects.map((p) => [p.id, p]))
    const ok = exportWorkbook('Assignments', [
      {
        name: 'Visits',
        rows: currentVisits
          .map((v) => {
            const project = projectById.get(v.projectId)
            return {
              Judge: judgeName(v.judgeId),
              Table: project?.table_number || '',
              Project: project?.title || '',
              Rubrics: v.trackIds
                .map((id) => trackById.get(id)?.name)
                .filter(Boolean)
                .join(', '),
              'Sheets at table': v.assignments.length,
              'Minutes': toMinutes(v.seconds),
              Status: v.done ? 'Submitted' : `${v.submitted}/${v.assignments.length} submitted`,
            }
          })
          .sort((a, b) => a.Judge.localeCompare(b.Judge) || a.Table.localeCompare(b.Table)),
      },
      {
        name: 'Score sheets',
        rows: assignments.map((a) => ({
          Judge: a.judge?.full_name || a.judge?.email || '',
          Table: a.project?.table_number || '',
          Project: a.project?.title || '',
          Track: trackById.get(a.track_context_id)?.name || '',
          'Track type':
            trackById.get(a.track_context_id)?.type === 'sponsor' ? 'Sponsor' : 'In-house',
          Status: a.status.replace('_', ' '),
        })),
      },
      {
        name: 'Judge totals',
        rows: judgeLoad.map(({ judge, visits, seconds }) => ({
          Judge: judge.full_name || judge.email,
          Company: judge.company || '',
          Visits: visits,
          Minutes: toMinutes(seconds),
          'Window (min)': windowMinutes,
          'Over window': seconds > windowMinutes * 60 ? 'Yes' : 'No',
        })),
      },
    ])
    if (!ok) setError('Nothing to export yet — commit a plan first.')
  }

  return (
    <div className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}
      {message && <Banner tone="success">{message}</Banner>}

      <Panel
        title="Build the judging plan"
        tip="visit"
        description="One draw per table, not one per track. A judge who stops at a table scores every rubric that table qualifies for, so the stop costs the same whether it carries one rubric or five."
      >
        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            label="Judges per project"
            tip="judgesPerProject"
            hint="How many judges should see each table. A track can override this on the Tracks tab."
          >
            <input
              type="number"
              min={1}
              max={10}
              value={perProject}
              onChange={(e) => updatePerProject(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field
            label="Judging window (minutes)"
            tip="window"
            hint={`How long judging runs on the floor. Hard stop at ${settings.window_max_minutes} min.`}
          >
            <input
              type="number"
              min={15}
              max={settings.window_max_minutes}
              value={windowMinutes}
              onChange={(e) => updateWindowMinutes(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field
            label="Walk between tables (minutes)"
            tip="walkTime"
            hint="Added to every visit. Visit length itself comes from the track timers."
          >
            <input
              type="number"
              min={0}
              max={10}
              value={transitionMinutes}
              onChange={(e) => updateTransitionMinutes(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <button
                onClick={buildPlan}
                disabled={busy || hasCommittedPlan}
                title={
                  hasCommittedPlan
                    ? 'A plan is already committed. Use Redo plan to replace it.'
                    : undefined
                }
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {busy ? 'Working…' : 'Build plan'}
              </button>
              <button
                onClick={commitPlan}
                disabled={busy || planSummary.visits.length === 0 || hasCommittedPlan}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold rounded-lg transition"
              >
                Commit
              </button>
            </div>
            {hasCommittedPlan && (
              <button
                onClick={() => setConfirmRedo(true)}
                disabled={busy}
                className="w-full px-4 py-2.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {busy ? 'Working…' : 'Redo plan'}
              </button>
            )}
          </div>
        </div>

        {hasCommittedPlan && (
          <div className="px-5 pb-2">
            <Banner tone="info">
              A plan is already committed ({assignments.length} sheets). Building again on top of it
              is blocked because it overlays the existing visits. Use <span className="font-semibold text-white">Redo plan</span> to
              clear assignments and scores, then build fresh with the settings above. Late walk-ups
              belong on Import → Add a project.
            </Banner>
          </div>
        )}

        <div className="px-5 pb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Tables to cover" value={feasibility.tables} note={`avg visit ${minutesLabel(feasibility.avgVisit)}`} />
          <Stat
            label="Visits needed"
            value={feasibility.visitsNeeded}
            note={
              feasibility.effectivePerProject === perProject
                ? `at ${perProject} judges each`
                : `~${feasibility.effectivePerProject} judges each (track overrides)`
            }
          />
          <Stat
            label="Your capacity"
            value={feasibility.capacity}
            note={`${judges.length} judges × ${feasibility.perJudge} visits`}
            tone={feasibility.feasible ? 'ok' : 'over'}
          />
          <Stat
            label="Judges needed"
            value={feasibility.judgesNeeded}
            note={`for ${windowMinutes} min of judging`}
            tone={feasibility.judgesNeeded > judges.length ? 'warn' : 'ok'}
          />
        </div>

        <div className="px-5 pb-5 space-y-3">
          {feasibility.hardShortage && feasibility.tables > 0 && (
            <Banner tone="error">
              Not enough judges. At 1 judge per project and a {settings.window_max_minutes}-minute
              window, this floor still needs about {feasibility.judgesNeeded} judges and you have{' '}
              {judges.length}. Recruiting more is the remaining lever — the plan settings cannot
              stretch further.
            </Banner>
          )}

          {!feasibility.feasible && !feasibility.hardShortage && feasibility.tables > 0 && (
            <Banner tone="warning">
              {judges.length} judges can cover {feasibility.capacity} visits in {windowMinutes}{' '}
              minutes, but this plan needs {feasibility.visitsNeeded}. Drop to{' '}
              {Math.max(1, feasibility.affordablePerProject)} judge
              {feasibility.affordablePerProject === 1 ? '' : 's'} per project, stretch the window
              toward {settings.window_max_minutes} minutes, or add judges. Recruiting is a last
              resort after 1 judge per project at the {settings.window_max_minutes}-minute max.
            </Banner>
          )}

          <p className="text-xs text-gray-500 leading-relaxed">
            Matching signal: {taggedProjects} of {projects.length} projects and {taggedJudges} of{' '}
            {judges.length} judges carry tags. Affinity ranks who goes where after coverage and
            minute load, so thin tags never leave a project unjudged.
            {restrictedTracks.length > 0 &&
              ` ${restrictedTracks.length} track${restrictedTracks.length === 1 ? ' is' : 's are'} limited to linked judges and cannot ride along on someone else's visit.`}
          </p>
        </div>
      </Panel>

      {plan.length > 0 && (
        <Panel
          title={`Preview — ${planSummary.visits.length} visits, ${planSummary.sheets} sheets`}
          description="Nothing is saved yet. Each row is one judge walking to one table and filling every rubric listed."
          actions={
            <button
              onClick={() => {
                setPlan([])
                setPlanBuiltWith(null)
              }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-lg transition"
            >
              Discard
            </button>
          }
        >
          {planSummary.shortfalls.length > 0 && (
            <div className="px-5 pt-5 space-y-3">
              {planBuiltWith &&
                planBuiltWith.perProject <= 1 &&
                planBuiltWith.windowMinutes >= (settings.window_max_minutes || 90) && (
                  <Banner tone="error">
                    Not enough judges. This preview was built at 1 judge per project and a{' '}
                    {planBuiltWith.windowMinutes}-minute window, and{' '}
                    {planSummary.shortfalls.length} table
                    {planSummary.shortfalls.length === 1 ? '' : 's'} still could not be covered.
                    Recruit about {feasibility.judgesNeeded} judges for this floor — plan settings
                    cannot stretch further.
                  </Banner>
                )}
              <Banner tone="warning">
                {planSummary.shortfalls.length} coverage gap
                {planSummary.shortfalls.length === 1 ? '' : 's'} the plan could not fill
                {planBuiltWith ? ` (built at ${planBuiltWith.perProject} judges/project)` : ''}:
                <ul className="mt-2 space-y-1">
                  {planSummary.shortfalls.slice(0, 6).map((s, i) => (
                    <li key={i} className="text-xs">
                      {projectName(s.project_id)} — {s.shortfall_reason}
                    </li>
                  ))}
                </ul>
              </Banner>
            </div>
          )}

          <div className="p-5 space-y-2">
            {planSummary.rows.map((row) => (
              <div key={row.judgeId} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white truncate">{judgeName(row.judgeId)}</span>
                  <span className={row.over ? 'text-red-300' : 'text-gray-400'}>
                    {row.visits} visits · {formatDuration(row.seconds)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full ${row.over ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{
                      width: `${Math.min(100, (row.seconds / (windowMinutes * 60)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <ul className="max-h-72 overflow-y-auto divide-y divide-white/5 custom-scrollbar text-sm">
            {planSummary.visits.map((v, i) => (
              <li key={`${v.judge_id}-${v.project_id}-${i}`} className="p-3 flex flex-wrap gap-2 justify-between">
                <span className="text-gray-300 min-w-0">
                  <span className="text-white">{judgeName(v.judge_id as string)}</span> →{' '}
                  {projectName(v.project_id)}
                </span>
                <span className="flex flex-wrap gap-1.5 shrink-0">
                  {(v.track_ids || []).map((tid) => (
                    <Pill key={tid} tone={trackById.get(tid)?.type === 'sponsor' ? 'orange' : 'blue'}>
                      {trackById.get(tid)?.name.slice(0, 28) || 'Track'}
                    </Pill>
                  ))}
                  <span className="text-gray-500 text-xs self-center">
                    {minutesLabel(v.visit_seconds)}
                    {v.affinity_score > 0 && ` · affinity ${v.affinity_score}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel
        title="Where the day stands"
        description="Committed work, measured in table visits rather than sheets. A judge over the window will still be judging when everyone else has finished."
        actions={
          assignments.length > 0 ? (
            <div className="flex gap-2">
              <ExportButton onClick={exportAssignments} />
              <button
                onClick={() => setConfirmRedo(true)}
                disabled={busy}
                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
              >
                Redo plan
              </button>
            </div>
          ) : undefined
        }
      >
        {judgeLoad.length === 0 ? (
          <EmptyState
            title="No judges yet"
            description="Invite judges from the Judges tab. They appear here once they activate their invite."
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {judgeLoad.map(({ judge, visits, seconds }) => {
              const over = seconds > windowMinutes * 60
              return (
                <li key={judge.user_id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {judge.full_name || judge.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{judge.company || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${over ? 'text-red-300' : 'text-gray-400'}`}>
                      {formatDuration(seconds)}
                    </span>
                    <Pill tone={visits === 0 ? 'yellow' : over ? 'red' : 'neutral'}>
                      {visits} visits
                    </Pill>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <div ref={manualPanelRef}>
      <Panel
        title="Fix one track by hand"
        tip="sheet"
        description="The planner covers everything at once. Use this when you need to top up a single track or hand a project to a specific judge. Links from the Tables tab land here with the project selected."
      >
        {highlightProjectId && (
          <div className="px-5 pt-5">
            <Banner tone="info">
              Opened from Tables for{' '}
              <span className="font-semibold text-white">
                {projects.find((p) => p.id === highlightProjectId)?.title || 'this project'}
              </span>
              . Track and project are prefilled below.
            </Banner>
          </div>
        )}
        <div className="p-5 grid md:grid-cols-3 gap-4">
          <Field label="Track">
            <select value={trackId} onChange={(e) => setTrackId(e.target.value)} className={selectClass}>
              {tracks
                .filter((t) => t.is_active)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.type === 'sponsor' ? 'sponsor' : 'in-house'})
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Judge">
            <select
              value={manualJudge}
              onChange={(e) => setManualJudge(e.target.value)}
              className={selectClass}
            >
              <option value="">Select judge</option>
              {judges.map((j) => (
                <option key={j.user_id} value={j.user_id}>
                  {j.full_name || j.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Project" hint="Only projects in the selected track are listed.">
            <div className="flex gap-2">
              <select
                value={manualProject}
                onChange={(e) => {
                  setManualProject(e.target.value)
                  setHighlightProjectId(e.target.value)
                }}
                className={selectClass}
              >
                <option value="">Select project</option>
                {scopeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <button
                onClick={addManual}
                disabled={!manualJudge || !manualProject}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition shrink-0"
              >
                Add
              </button>
            </div>
          </Field>
        </div>

        <div className="grid lg:grid-cols-2 gap-px bg-white/5">
          <div className="bg-[#0a1628]/40 p-5">
            <p className="text-sm font-semibold text-white mb-3">Coverage in this track</p>
            {coverage.length === 0 ? (
              <p className="text-sm text-gray-500">
                No projects here. Check that a main track or opt-in prize matches this track name.
              </p>
            ) : (
              <ul className="divide-y divide-white/5 max-h-80 overflow-y-auto custom-scrollbar">
                {coverage.map((c) => (
                  <li
                    key={c.project.id}
                    className={`py-2 flex justify-between items-center gap-3 rounded-lg px-2 -mx-2 ${
                      highlightProjectId === c.project.id
                        ? 'bg-yellow-500/10 ring-1 ring-yellow-400/40'
                        : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{c.project.title}</p>
                      <p className="text-xs text-gray-500">Table {c.project.table_number || 'TBD'}</p>
                    </div>
                    <Pill tone={c.judges === 0 ? 'red' : c.judges < c.target ? 'yellow' : 'green'}>
                      {c.judges} / {c.target}
                    </Pill>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-[#0a1628]/40 p-5">
            <p className="text-sm font-semibold text-white mb-3">
              Sheets in this track ({trackAssignments.length})
            </p>
            {trackAssignments.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing assigned in this track yet.</p>
            ) : (
              <ul className="divide-y divide-white/5 max-h-80 overflow-y-auto custom-scrollbar">
                {trackAssignments.map((a) => (
                  <li key={a.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{a.project?.title}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {a.judge?.full_name || a.judge?.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Pill
                        tone={
                          a.status === 'submitted'
                            ? 'green'
                            : a.status === 'in_progress'
                              ? 'blue'
                              : 'yellow'
                        }
                      >
                        {a.status.replace('_', ' ')}
                      </Pill>
                      <select
                        value={a.judge_id}
                        onChange={(e) => reassign(a.id, e.target.value)}
                        className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs [&>option]:bg-[#0a1628]"
                      >
                        {judges.map((j) => (
                          <option key={j.user_id} value={j.user_id}>
                            {j.full_name || j.email}
                          </option>
                        ))}
                      </select>
                      {a.status === 'submitted' && (
                        <button
                          onClick={() => reopen(a.id)}
                          title="Sets the sheet back to in progress so the judge can edit and resubmit. Logged in Audit."
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded transition"
                        >
                          Reopen
                        </button>
                      )}
                      <button
                        onClick={() => removeAssignment(a.id)}
                        className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded transition"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Panel>
      </div>

      <ConfirmRemoveDialog
        open={confirmRedo}
        title="Redo the plan?"
        description={
          'This deletes every assignment and submitted score, then builds a fresh plan with the settings above.\n\n' +
          'Table numbers stay as-is until you reseat on the Tables tab.'
        }
        confirmLabel="Redo plan"
        busyLabel="Working…"
        busy={busy}
        onCancel={() => setConfirmRedo(false)}
        onConfirm={redoPlan}
      />
    </div>
  )
}

function Stat({
  label,
  value,
  note,
  tone = 'neutral',
}: {
  label: string
  value: number
  note: string
  tone?: 'neutral' | 'ok' | 'warn' | 'over'
}) {
  const valueClass = {
    neutral: 'text-white',
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
