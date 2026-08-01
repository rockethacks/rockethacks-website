'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { JudgeProfile, Project, Track } from '@/types/judging'
import {
  Banner,
  EmptyState,
  Field,
  Panel,
  Pill,
  inputClass,
  selectClass,
} from '@/components/judging/ui'

type Suggestion = {
  judge_id: string
  project_id: string
  track_context_id: string
  affinity_score: number
}

type ExistingAssignment = {
  id: string
  judge_id: string
  project_id: string
  status: string
  judge: { full_name: string | null; email: string } | null
  project: { title: string; table_number: string | null } | null
}

export default function AssignmentsAdminPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [judges, setJudges] = useState<JudgeProfile[]>([])
  const [scopeProjects, setScopeProjects] = useState<Project[]>([])
  const [trackId, setTrackId] = useState('')
  const [perProject, setPerProject] = useState(3)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [existing, setExisting] = useState<ExistingAssignment[]>([])
  const [manualJudge, setManualJudge] = useState('')
  const [manualProject, setManualProject] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const loadBase = useCallback(async () => {
    const supabase = createClient()
    const [t, j] = await Promise.all([
      supabase.from('tracks').select('*').eq('is_active', true).order('sort_order').order('name'),
      supabase.from('judge_profiles').select('*').order('full_name'),
    ])
    const trackList = (t.data || []) as Track[]
    setTracks(trackList)
    setJudges((j.data || []) as JudgeProfile[])
    setTrackId((prev) => prev || trackList[0]?.id || '')
  }, [])

  const loadTrackData = useCallback(async (tid: string) => {
    if (!tid) return
    const supabase = createClient()

    const [{ data: mainProjects }, { data: sponsorLinks }] = await Promise.all([
      supabase.from('projects').select('*').eq('main_track_id', tid).eq('status', 'submitted'),
      supabase.from('project_sponsor_tracks').select('project_id').eq('track_id', tid),
    ])

    const sponsorIds = (sponsorLinks || []).map((r: { project_id: string }) => r.project_id)
    let sponsorProjects: Project[] = []
    if (sponsorIds.length) {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .in('id', sponsorIds)
        .eq('status', 'submitted')
      sponsorProjects = (data || []) as Project[]
    }

    const merged = new Map<string, Project>()
    for (const p of [...((mainProjects || []) as Project[]), ...sponsorProjects]) merged.set(p.id, p)
    setScopeProjects(Array.from(merged.values()).sort((a, b) => a.title.localeCompare(b.title)))

    const { data: assignments } = await supabase
      .from('judge_assignments')
      .select(
        `id, judge_id, project_id, status,
         judge:judge_profiles(full_name, email),
         project:projects(title, table_number)`
      )
      .eq('track_context_id', tid)
      .order('assigned_at')
    setExisting((assignments || []) as unknown as ExistingAssignment[])
  }, [])

  useEffect(() => {
    loadBase()
  }, [loadBase])

  useEffect(() => {
    if (trackId) {
      setSuggestions([])
      loadTrackData(trackId)
    }
  }, [trackId, loadTrackData])

  const coverage = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of existing) counts.set(a.project_id, (counts.get(a.project_id) || 0) + 1)
    return scopeProjects.map((p) => ({
      project: p,
      judges: counts.get(p.id) || 0,
    }))
  }, [existing, scopeProjects])

  const judgeLoad = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of existing) counts.set(a.judge_id, (counts.get(a.judge_id) || 0) + 1)
    return judges
      .map((j) => ({ judge: j, count: counts.get(j.user_id) || 0 }))
      .sort((a, b) => b.count - a.count)
  }, [existing, judges])

  const underCovered = coverage.filter((c) => c.judges < perProject).length
  const uncovered = coverage.filter((c) => c.judges === 0).length

  const runSuggest = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    const supabase = createClient()
    const { data, error: rpcErr } = await supabase.rpc('suggest_judge_assignments', {
      p_track_context_id: trackId,
      p_judges_per_project: perProject,
    })
    if (rpcErr) setError(rpcErr.message)
    else {
      const list = (data || []) as Suggestion[]
      setSuggestions(list)
      setMessage(
        list.length === 0
          ? 'No suggestions generated. Check that judges exist and projects are assigned to this track.'
          : `${list.length} suggested assignments ready to review. Nothing is saved until you commit.`
      )
    }
    setBusy(false)
  }

  const commitSuggestions = async () => {
    if (!suggestions.length) return
    setBusy(true)
    setError('')
    const supabase = createClient()
    const { error: iErr } = await supabase.from('judge_assignments').upsert(
      suggestions.map((s) => ({
        judge_id: s.judge_id,
        project_id: s.project_id,
        track_context_id: s.track_context_id,
        status: 'assigned',
      })),
      { onConflict: 'judge_id,project_id,track_context_id', ignoreDuplicates: true }
    )
    if (iErr) setError(iErr.message)
    else {
      setMessage(`Committed ${suggestions.length} assignments.`)
      setSuggestions([])
      await loadTrackData(trackId)
    }
    setBusy(false)
  }

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
      await loadTrackData(trackId)
    }
  }

  const removeAssignment = async (id: string) => {
    const supabase = createClient()
    const { error: dErr } = await supabase.from('judge_assignments').delete().eq('id', id)
    if (dErr) setError(dErr.message)
    else await loadTrackData(trackId)
  }

  const reassign = async (id: string, newJudgeId: string) => {
    const supabase = createClient()
    const { error: uErr } = await supabase
      .from('judge_assignments')
      .update({ judge_id: newJudgeId })
      .eq('id', id)
    if (uErr) setError(uErr.message)
    else await loadTrackData(trackId)
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
      await loadTrackData(trackId)
    }
  }

  const judgeName = (id: string) => {
    const j = judges.find((x) => x.user_id === id)
    return j?.full_name || j?.email || id.slice(0, 8)
  }
  const projectName = (id: string) => scopeProjects.find((p) => p.id === id)?.title || id.slice(0, 8)

  return (
    <div className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}
      {message && <Banner tone="success">{message}</Banner>}

      <Banner tone="info">
        Auto-suggest spreads projects evenly, balances each judge’s stack, skips judges who appear on
        a project’s team, and prefers matching tags without leaving a project short. Review the
        preview before committing.
      </Banner>

      <Panel title="Track context" description="Assignments are per track. A project judged on both a main and a sponsor rubric gets one assignment for each.">
        <div className="p-5 grid md:grid-cols-4 gap-4">
          <Field label="Track" hint="Only active tracks are listed.">
            <select value={trackId} onChange={(e) => setTrackId(e.target.value)} className={selectClass}>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type === 'sponsor' ? 'sponsor' : 'in-house'})
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Judges per project"
            hint="Every project gets this many judges, ±1 when the numbers do not divide evenly."
          >
            <input
              type="number"
              min={1}
              max={10}
              value={perProject}
              onChange={(e) => setPerProject(Number(e.target.value))}
              className={inputClass}
            />
          </Field>

          <div className="flex items-end">
            <button
              onClick={runSuggest}
              disabled={busy || !trackId}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
            >
              {busy ? 'Working…' : 'Auto-suggest'}
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={commitSuggestions}
              disabled={busy || !suggestions.length}
              className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold rounded-lg transition"
            >
              Commit preview
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Projects in track', value: scopeProjects.length },
            { label: 'Assignments', value: existing.length },
            { label: 'Below target', value: underCovered, warn: underCovered > 0 },
            { label: 'No judge yet', value: uncovered, warn: uncovered > 0 },
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

      {suggestions.length > 0 && (
        <Panel
          title={`Preview (${suggestions.length})`}
          description="Not saved yet. Commit to create these assignments, or run auto-suggest again after changing the target."
        >
          <ul className="max-h-64 overflow-y-auto divide-y divide-white/10 custom-scrollbar text-sm">
            {suggestions.map((s, i) => (
              <li key={`${s.judge_id}-${s.project_id}-${i}`} className="p-3 flex justify-between gap-2">
                <span className="text-gray-300">
                  <span className="text-white">{judgeName(s.judge_id)}</span> → {projectName(s.project_id)}
                </span>
                <span className="text-gray-500 shrink-0">
                  {s.affinity_score > 0 ? `${s.affinity_score} tag match` : 'no tag match'}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel
          title="Coverage by project"
          description={`Target is ${perProject} judges each. Projects below target are highlighted so you can top them up before judging starts.`}
        >
          {coverage.length === 0 ? (
            <EmptyState
              title="No projects in this track"
              description="Import projects and make sure their main track or opt-in prize matches this track name."
            />
          ) : (
            <ul className="divide-y divide-white/10 max-h-[420px] overflow-y-auto custom-scrollbar">
              {coverage.map((c) => (
                <li key={c.project.id} className="p-4 flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{c.project.title}</p>
                    <p className="text-xs text-gray-500">Table {c.project.table_number || 'TBD'}</p>
                  </div>
                  <Pill
                    tone={c.judges === 0 ? 'red' : c.judges < perProject ? 'yellow' : 'green'}
                  >
                    {c.judges} / {perProject}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Load by judge"
          description="Keep these numbers close together. Large gaps mean someone will still be judging when everyone else is done."
        >
          {judgeLoad.length === 0 ? (
            <EmptyState
              title="No judges yet"
              description="Invite judges from the Judges tab. They appear here once they activate their invite."
            />
          ) : (
            <ul className="divide-y divide-white/10 max-h-[420px] overflow-y-auto custom-scrollbar">
              {judgeLoad.map(({ judge, count }) => (
                <li key={judge.user_id} className="p-4 flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {judge.full_name || judge.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{judge.company || '—'}</p>
                  </div>
                  <Pill tone={count === 0 ? 'yellow' : 'neutral'}>{count} projects</Pill>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Add one manually"
        description="Use this to fix a gap or hand a specific project to a specific judge."
      >
        <div className="p-5 grid md:grid-cols-3 gap-4">
          <Field label="Judge">
            <select value={manualJudge} onChange={(e) => setManualJudge(e.target.value)} className={selectClass}>
              <option value="">Select judge</option>
              {judges.map((j) => (
                <option key={j.user_id} value={j.user_id}>
                  {j.full_name || j.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Project" hint="Only projects in the selected track are listed.">
            <select
              value={manualProject}
              onChange={(e) => setManualProject(e.target.value)}
              className={selectClass}
            >
              <option value="">Select project</option>
              {scopeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <button
              onClick={addManual}
              disabled={!manualJudge || !manualProject}
              className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white font-semibold rounded-lg transition"
            >
              Add assignment
            </button>
          </div>
        </div>
      </Panel>

      <Panel
        title={`Assignments in this track (${existing.length})`}
        description="Change the judge to reassign. Reopening a submitted sheet lets that judge edit and resubmit it."
      >
        {existing.length === 0 ? (
          <EmptyState
            title="Nothing assigned yet"
            description="Run auto-suggest above, review the preview, then commit. You can still adjust everything afterwards."
          />
        ) : (
          <ul className="divide-y divide-white/10 max-h-[480px] overflow-y-auto custom-scrollbar">
            {existing.map((a) => (
              <li key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{a.project?.title}</p>
                  <p className="text-xs text-gray-500">
                    Table {a.project?.table_number || 'TBD'} ·{' '}
                    {a.judge?.full_name || a.judge?.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Pill
                    tone={
                      a.status === 'submitted' ? 'green' : a.status === 'in_progress' ? 'blue' : 'yellow'
                    }
                  >
                    {a.status.replace('_', ' ')}
                  </Pill>
                  <select
                    value={a.judge_id}
                    onChange={(e) => reassign(a.id, e.target.value)}
                    className="px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-sm [&>option]:bg-[#0a1628]"
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
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Reopen
                    </button>
                  )}
                  <button
                    onClick={() => removeAssignment(a.id)}
                    className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
