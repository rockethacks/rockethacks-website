'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Banner, Panel, Pill } from '@/components/judging/ui'

type TrackSummary = {
  id: string
  name: string
  type: string
  projects: number
  assignments: number
  submitted: number
  hasRubric: boolean
}

export default function JudgingOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    tracks: 0,
    projects: 0,
    judges: 0,
    invitesOpen: 0,
    assignments: 0,
    submitted: 0,
    top3Judges: 0,
  })
  const [trackRows, setTrackRows] = useState<TrackSummary[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [tracksRes, projectsRes, judgesRes, invitesRes, assignRes, setsRes, sponsorRes, picksRes] =
        await Promise.all([
          supabase.from('tracks').select('id, name, type, is_active').order('sort_order').order('name'),
          supabase.from('projects').select('id, main_track_id'),
          supabase.from('judge_profiles').select('user_id'),
          supabase.from('judge_invites').select('id, used, expires_at'),
          supabase.from('judge_assignments').select('id, track_context_id, status'),
          supabase.from('criteria_sets').select('id, applies_to, track_id'),
          supabase.from('project_sponsor_tracks').select('project_id, track_id'),
          supabase.from('top3_picks').select('judge_id'),
        ])

      const tracks = (tracksRes.data || []) as {
        id: string
        name: string
        type: string
        is_active: boolean
      }[]
      const projects = (projectsRes.data || []) as { id: string; main_track_id: string | null }[]
      const assignments = (assignRes.data || []) as {
        track_context_id: string
        status: string
      }[]
      const sets = (setsRes.data || []) as { applies_to: string; track_id: string | null }[]
      const sponsorLinks = (sponsorRes.data || []) as { track_id: string }[]
      const invites = (invitesRes.data || []) as { used: boolean; expires_at: string }[]

      const sharedSet = sets.some((s) => s.applies_to === 'in_house_shared')

      setStats({
        tracks: tracks.length,
        projects: projects.length,
        judges: (judgesRes.data || []).length,
        invitesOpen: invites.filter((i) => !i.used && new Date(i.expires_at) > new Date()).length,
        assignments: assignments.length,
        submitted: assignments.filter((a) => a.status === 'submitted').length,
        top3Judges: new Set((picksRes.data || []).map((p: { judge_id: string }) => p.judge_id)).size,
      })

      setTrackRows(
        tracks.map((t) => {
          const trackAssignments = assignments.filter((a) => a.track_context_id === t.id)
          const projectCount =
            t.type === 'sponsor'
              ? sponsorLinks.filter((s) => s.track_id === t.id).length
              : projects.filter((p) => p.main_track_id === t.id).length
          return {
            id: t.id,
            name: t.name,
            type: t.type,
            projects: projectCount,
            assignments: trackAssignments.length,
            submitted: trackAssignments.filter((a) => a.status === 'submitted').length,
            hasRubric: t.type === 'sponsor' ? sets.some((s) => s.track_id === t.id) : sharedSet,
          }
        })
      )
      setLoading(false)
    }
    load()
  }, [])

  const checklist = [
    {
      done: stats.tracks > 0,
      label: 'Create your tracks',
      detail: 'Four in-house tracks plus one per sponsor prize.',
      href: '/admin/judging/tracks',
    },
    {
      done: trackRows.length > 0 && trackRows.every((t) => t.hasRubric),
      label: 'Publish a rubric for every track',
      detail: 'One shared in-house rubric, plus a set per sponsor track.',
      href: '/admin/judging/criteria',
    },
    {
      done: stats.projects > 0,
      label: 'Import the Devpost export',
      detail: 'Brings in projects, teams, tech tags, and sponsor opt-ins.',
      href: '/admin/judging/import',
    },
    {
      done: stats.judges > 0,
      label: 'Invite judges',
      detail: 'They activate their own profile from the invite link.',
      href: '/admin/judging/judges',
    },
    {
      done: stats.assignments > 0,
      label: 'Assign judges to projects',
      detail: 'Auto-suggest, then check coverage per project.',
      href: '/admin/judging/assignments',
    },
  ]

  const cards = [
    { label: 'Tracks', value: stats.tracks, href: '/admin/judging/tracks' },
    { label: 'Projects', value: stats.projects, href: '/admin/judging/import' },
    { label: 'Judges', value: stats.judges, href: '/admin/judging/judges' },
    { label: 'Invites open', value: stats.invitesOpen, href: '/admin/judging/judges' },
    { label: 'Assignments', value: stats.assignments, href: '/admin/judging/assignments' },
    { label: 'Sheets submitted', value: stats.submitted, href: '/admin/judging/results' },
  ]

  const progress = stats.assignments
    ? Math.round((stats.submitted / stats.assignments) * 100)
    : 0

  return (
    <div className="space-y-6">
      <p className="text-gray-400 max-w-3xl leading-relaxed">
        Everything for judging day lives here. Work down the checklist in order — each step depends on
        the one above it. On the day itself, the Assignments and Results tabs are the two you will
        keep open.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-5 hover:bg-white/10 transition-all"
          >
            <p className="text-gray-400 text-xs uppercase">{c.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{loading ? '—' : c.value}</p>
          </Link>
        ))}
      </div>

      {stats.assignments > 0 && (
        <Panel title="Judging progress" description="Share of assigned score sheets that judges have submitted.">
          <div className="p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">
                {stats.submitted} of {stats.assignments} submitted
              </span>
              <span className="text-yellow-400 font-bold">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-500">
              {stats.top3Judges} judges have confirmed a top 3, which feeds the overall main-track
              winner.
            </p>
          </div>
        </Panel>
      )}

      <Panel title="Setup checklist" description="Judges see an empty score sheet if any of these are incomplete.">
        <ul className="divide-y divide-white/10">
          {checklist.map((step) => (
            <li key={step.label} className="p-4 flex items-start gap-3">
              <span
                className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                  step.done ? 'bg-green-500 text-black' : 'bg-white/10 text-gray-400'
                }`}
              >
                {step.done ? '✓' : ''}
              </span>
              <div className="flex-1 min-w-0">
                <Link href={step.href} className="text-white font-medium hover:text-yellow-400 transition">
                  {step.label}
                </Link>
                <p className="text-sm text-gray-500">{step.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="By track"
        description="Projects counts come from the main track for in-house tracks, and from opt-in prizes for sponsor tracks."
      >
        {trackRows.length === 0 ? (
          <div className="p-6">
            <Banner tone="warning">
              No tracks yet. <Link href="/admin/judging/tracks" className="underline">Create your tracks</Link>{' '}
              to get started.
            </Banner>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[640px]">
              <thead className="bg-white/5 text-gray-400">
                <tr>
                  <th className="p-3 font-medium">Track</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Projects</th>
                  <th className="p-3 font-medium">Assignments</th>
                  <th className="p-3 font-medium">Submitted</th>
                  <th className="p-3 font-medium">Rubric</th>
                </tr>
              </thead>
              <tbody>
                {trackRows.map((t) => (
                  <tr key={t.id} className="border-t border-white/10 text-white">
                    <td className="p-3">{t.name}</td>
                    <td className="p-3">
                      <Pill tone={t.type === 'sponsor' ? 'orange' : 'neutral'}>
                        {t.type === 'sponsor' ? 'Sponsor' : 'In-house'}
                      </Pill>
                    </td>
                    <td className="p-3 text-gray-300">{t.projects}</td>
                    <td className="p-3 text-gray-300">{t.assignments}</td>
                    <td className="p-3 text-gray-300">
                      {t.submitted}
                      {t.assignments > 0 && (
                        <span className="text-gray-500"> / {t.assignments}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {t.hasRubric ? <Pill tone="green">Ready</Pill> : <Pill tone="red">Missing</Pill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
