import type { AssignmentStatus, JudgingSettings, Track } from '@/types/judging'

/**
 * A visit is one judge standing at one table. It costs a flat block of time no
 * matter how many rubrics they fill there, so the day is measured in visits.
 */

export const FALLBACK_SETTINGS: JudgingSettings = {
  id: true,
  transition_seconds: 60,
  window_minutes: 60,
  window_max_minutes: 90,
  default_visit_seconds: 360,
  judges_per_project: 3,
  updated_at: '',
}

export type AssignmentLite = {
  id: string
  judge_id: string
  project_id: string
  track_context_id: string
  status: AssignmentStatus
}

export type Visit<T extends AssignmentLite = AssignmentLite> = {
  judgeId: string
  projectId: string
  trackIds: string[]
  assignments: T[]
  seconds: number
  submitted: number
  done: boolean
}

/** Longest rubric at the table wins, plus one transition allowance. */
export function visitSeconds(
  trackIds: string[],
  trackById: Map<string, Track>,
  settings: JudgingSettings
): number {
  const timers = trackIds
    .map((id) => trackById.get(id)?.timer_seconds)
    .filter((n): n is number => typeof n === 'number')
  const longest = timers.length ? Math.max(...timers) : settings.default_visit_seconds
  return longest + settings.transition_seconds
}

export function buildVisits<T extends AssignmentLite>(
  rows: T[],
  trackById: Map<string, Track>,
  settings: JudgingSettings
): Visit<T>[] {
  const byKey = new Map<string, Visit<T>>()

  for (const row of rows) {
    const key = `${row.judge_id}:${row.project_id}`
    const visit =
      byKey.get(key) ||
      ({
        judgeId: row.judge_id,
        projectId: row.project_id,
        trackIds: [],
        assignments: [],
        seconds: 0,
        submitted: 0,
        done: false,
      } as Visit<T>)

    visit.assignments.push(row)
    if (!visit.trackIds.includes(row.track_context_id)) visit.trackIds.push(row.track_context_id)
    if (row.status === 'submitted') visit.submitted++
    byKey.set(key, visit)
  }

  for (const visit of byKey.values()) {
    visit.seconds = visitSeconds(visit.trackIds, trackById, settings)
    visit.done = visit.submitted === visit.assignments.length
  }

  return Array.from(byKey.values())
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m'
  const minutes = Math.round(totalSeconds / 60)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  if (rest === 0) return `${hours}h`
  return `${hours}h ${rest}m`
}

export function minutesLabel(seconds: number): string {
  return `${Math.round(seconds / 60)} min`
}

/** How many tables one judge can cover in the window at this visit length. */
export function visitsPerJudge(windowMinutes: number, avgVisitSeconds: number): number {
  if (avgVisitSeconds <= 0) return 0
  return Math.floor((windowMinutes * 60) / avgVisitSeconds)
}
