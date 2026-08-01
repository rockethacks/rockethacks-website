/**
 * Short first-run hover copy, aligned with public/docs/judging-portal-guide.md.
 * Keep each tip to ~1–2 sentences so tooltips stay readable.
 */

export const JUDGING_TIPS = {
  visit:
    'A visit is one judge standing at one table. Time is charged per visit, not per sheet. Extra rubrics at the same table cost nothing more.',
  sheet:
    'A sheet is one judge filling one rubric for one project. One visit can produce several sheets when the table has a main track plus sponsor prizes.',
  window:
    'The judging floor window (usually 60 minutes, stretch to 90). Changing this clears an unsaved preview. Recruiting more judges is a last resort after n=1 at the 90-minute max.',
  walkTime:
    'Minutes added between table stops. Visit length = longest rubric timer at that table + this walk time. Changing this clears an unsaved preview.',
  judgesPerProject:
    'How many judges should see each table. Saved with the plan settings; changing it clears an unsaved preview. Coverage and load come first; affinity ranks who goes where.',
  linkedJudgesOnly:
    'Only judges linked to this sponsor track may fill its rubric. It cannot ride along on another judge\'s visit, so it costs extra stops.',
  trackNames:
    'Names must match the Devpost export exactly (main track and opt-in prizes). Unmatched values are reported and skipped, never guessed.',
  importIdempotent:
    'Projects are keyed on submission URL. Re-importing updates existing rows instead of duplicating. Need one more project after the CSV is in? Use Add a project below — do not redo the whole assignment plan.',
  lateAddProject:
    'Use this when you need an additional project after import (or instead of a CSV). It lands on the next free table and can assign lightest-loaded judges. Then reseat on Tables if you want short walks again.',
  tableAssign:
    'Import fills blank tables as T01… by main track. After you commit a plan, use Reseat for short walks to pack co-judged projects together.',
  reseat:
    'Rewrites every table number from the current visit graph so judges walk less (assumes low→high table order). Export first if you need the old map.',
  moveJudge:
    'Repoints this judge\'s sheets onto another table for tracks that table still qualifies for. Sheets for tracks the destination lacks are dropped after you confirm. COI blocks moves onto a team that lists the judge\'s email.',
  reopen:
    'Sets a submitted sheet back to in progress so the judge can edit and resubmit. Every reopen is logged in Audit.',
  resultsVsScorecards:
    'Results is the ranking. Scorecards is whether to trust it: open near-ties sorted by disagreement and see which criterion judges split on.',
  tags:
    'Affinity ranks judges after coverage and minute load — shared tags, industry ↔ track, and company ↔ sponsor. Thin tags never leave a table unjudged.',
  headJudge:
    'Head judges get the judging portal but not applicant management. Same invite flow with role head_judge.',
  workloadVisits:
    'Headline load is visits and minutes against the window. Sheets are secondary: one visit can carry several rubrics.',
  eligibility:
    'Yes/no gates. If any fail, the sheet is not eligible to win even if scored items are high.',
  scoredBands:
    'Point bands for a criterion. Judges pick a band; the points feed the sheet total and the track leaderboard average.',
} as const

export type JudgingTipKey = keyof typeof JUDGING_TIPS

export const NAV_TIPS: Record<string, string> = {
  '/admin/judging':
    'Setup checklist, live submission progress, and a per-track breakdown of projects, assignments, and rubric readiness.',
  '/admin/judging/tracks':
    'Create in-house and sponsor tracks, optional judges-per-project overrides, and Linked judges only for sponsor prizes. Names must match Devpost exactly.',
  '/admin/judging/criteria':
    'Build rubrics: one shared in-house set plus one per sponsor track. Eligibility gates and scored items with point bands.',
  '/admin/judging/judges':
    'Invite judges (never added to applicants), copy sign-in links, set tags and track links, or remove a judge to revoke access. Track links are required for Linked judges only prizes.',
  '/admin/judging/import':
    'Upload the Devpost CSV, then map and import. Need an additional project? Use Add a project on this page — assign lightest-loaded judges there; the new table lands last until you reseat.',
  '/admin/judging/assignments':
    'Build a visit-based plan once, then commit. Changing judges-per-project, window, or walk time clears an unsaved preview. If a plan already exists, use Redo plan. Recruit more judges only after n=1 at a 90-minute window still falls short.',
  '/admin/judging/tables':
    'Floor board by table number. See who goes where, move judges, reseat for short walks, and export a seating sheet.',
  '/admin/judging/workload':
    'Visits per judge against the window, sheets as secondary, estimated minutes, and how many judges these settings need.',
  '/admin/judging/results':
    'Per-track leaderboard from submitted sheet averages, or Overall for the cross-track top-3 tally. Project names open that table on Tables.',
  '/admin/judging/scorecards':
    'Open a project for main + sponsor scores together. Check disagreement, reopen sheets, and verify close races.',
  '/admin/judging/audit':
    'Plain-language log of every score and assignment change, with raw payloads.',
}
