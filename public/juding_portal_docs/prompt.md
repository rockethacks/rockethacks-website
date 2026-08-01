# RocketHacks Judging Portal, Build Spec

This document is the full spec for adding a Judging Portal to the existing RocketHacks admin app. It assumes Supabase as the backend (Postgres, Auth, RLS) on the free tier. Read this entire file before writing code. Do not invent scope beyond what is described here, if something is ambiguous, leave a `TODO` comment and flag it instead of guessing silently.

## 0. Assumptions to confirm before starting

This spec assumes the existing app is Next.js (App Router) with TypeScript, Tailwind, and `@supabase/supabase-js` / `@supabase/ssr` for auth. If the existing codebase uses a different stack, adapt the structure below but keep the data model and RLS design identical, that part is stack agnostic and already implemented in the migration files.

The three SQL files in `/migrations` (`001_schema.sql`, `002_rls_policies.sql`, `003_functions_triggers.sql`) must be run in order against the Supabase project before any app code will work. Run them through the Supabase SQL editor or `supabase db push` if migrations are wired into the CLI.

## 1. Roles

Four roles exist on `profiles.role`: `admin`, `head_judge`, `judge`, `participant`. `participant` is the default for anyone who signs up through the normal hacker registration flow, this role has no special access and should behave exactly like today. `head_judge` is an optional escalated role for a judging captain who can resolve flags and reassign projects without full admin access to unrelated parts of the app (sponsorship, finance, etc), if you don't need that distinction yet, treat `head_judge` as equivalent to `admin` for now but keep the enum value so it's easy to split permissions later.

Never let a client set its own role. Role changes happen two ways only: an admin changing a profile's role directly (already covered by the `profiles_admin_write` policy), or a judge redeeming an invite code through the `redeem_judge_invite` function, which runs as `security definer` specifically so this one escalation path exists without a general purpose role-write policy for regular users.

## 2. Judge onboarding flow

Do not route judges through the normal participant registration screen. Build a separate entry point at `/judge/login` (or similar) that feels distinct. The flow:

1. Admin creates a judge record ahead of time from the admin portal: name, email, industry, job title, company, tags, plus generates an invite code (a row in `judge_invites` with a random code and an expiry, default expiry of the event weekend).
2. Judge receives the code (or a magic link containing it) and lands on `/judge/login`.
3. They authenticate via Supabase magic link auth using their email.
4. On first login, the client calls `redeem_judge_invite(invite_code)`, which validates the code against their authenticated email and escalates their `profiles.role` to `judge`.
5. From then on they log in normally through `/judge/login` and land on their assignment list.

Validate the invite code server side only, through the RPC call, never trust a client-supplied role or a client-side check that "this email is a judge."

## 3. Admin portal additions

### 3.1 Judge management

A table of all profiles with `role in ('judge', 'head_judge')`. Clicking into a judge shows their profile (industry, job title, company, bio, tags) and their current project assignments in a side panel. Admin can add/remove tags, edit assignments here, and generate/revoke invite codes.

### 3.2 CSV import

Upload the Devpost export. Do not import blindly. Show a column mapping preview screen first, list the CSV's actual header row and let admin map each column to a system field (title, submission url, about, video, github, opt-in prizes, main track, team member columns). Devpost's export headers shift slightly between events, hardcoding column positions will break next year.

On confirm, upsert into `projects` keyed on `submission_url` (the unique constraint already in the schema handles this, use `on conflict (submission_url) do update`). This makes re-imports safe for last minute submissions without creating duplicates.

Team member columns in the export are numbered and repeat (`Team Member 1 First Name`, `Team Member 1 Email`, `Team Member 2 First Name`, etc). Parse all numbered groups present in the header into rows in `project_team_members`.

The `Opt-In Prizes` column is how sponsor track participation is captured. Parse it (it will contain track names, possibly comma or semicolon separated depending on export) and insert matching rows into `project_sponsor_tracks`, matching against `tracks.name` where `type = 'sponsor'`. Flag in the UI any opt-in value that doesn't match an existing sponsor track name, rather than silently dropping it, since a mismatch usually means the sponsor track name in `tracks` needs to be added or corrected first.

The `Built With` column is a reasonable source for auto-generated tags, split on commas and upsert into `tags` with `category = 'tech'`, then link via `project_tags`. Treat this as a convenience default, admin should be able to add or remove tags manually afterward.

Sanitize every cell before it touches the database or gets rendered. Devpost exports are user submitted free text, strip or escape anything that looks like a spreadsheet formula injection (`=`, `+`, `-`, `@` as a leading character) if you ever offer a re-export to Excel/Sheets, and always render project descriptions as escaped text, never as raw HTML.

### 3.3 Track and criteria builder

Tracks screen: list of tracks with type (`in_house` / `sponsor`), sponsor name if applicable, and a per-track timer in seconds. The 4 in-house tracks and however many sponsor tracks exist this year are managed here. Admin can add, rename, deactivate.

Criteria builder: one criteria set is shared across all 4 in-house tracks (`criteria_sets.applies_to = 'in_house_shared'`), and each sponsor track gets its own independent criteria set (`applies_to = 'sponsor'`, `track_id` set). Within a set, admin adds criteria items, each item is either:

- **Eligibility**: title, description, no points. Rendered to judges as a single yes/no toggle. All eligibility items in a set must be YES for the project to be considered eligible for that track's prize, but this does not block scoring, see section 5.3 for how a failed eligibility check is handled.
- **Scored**: title, description, and a set of point bands. Each band has a label (e.g. "Proficient"), a point value, and a description of what that band means, mirroring last year's rubric structure. Admin defines however many bands they want per item, the UI should default to offering 4 bands but not hardcode that number.

Below the builder, show a read only table view of the full criteria set (criteria down the rows, band point values across the columns) so admin can sanity check the whole rubric at a glance before the event. This same table structure should be reused (read only) on the judge's scoring page for context.

### 3.4 Assignment engine

This is the highest risk piece to get wrong manually at 300+ projects, so build an auto-suggest algorithm with manual override rather than a fully manual drag and drop from zero.

Inputs: list of active judges (with their tags), list of projects needing assignment for a given track context (main track or a specific sponsor track), and a target number of judges per project (admin configurable, default something like 3).

Constraints the algorithm must satisfy:

1. Even coverage: every project in scope gets the same number of judges, plus or minus one if the totals don't divide evenly.
2. No conflict of interest: a judge must never be assigned to a project where any `project_team_members.email` domain matches their own school affiliation, or more directly, cross reference `project_team_members.email` against the judge's known school/employer if you track that, at minimum never assign a judge to a project where they appear as a team member.
3. Load balance across judges: no judge should get a wildly larger stack than another unless admin explicitly weights them.
4. Tag affinity as a soft preference, not a hard constraint: prefer matching judges to projects with overlapping tags where possible, but never leave a project under-assigned just to satisfy a tag match.

Implement this as a Postgres function or an Edge Function, not client side JavaScript looping over hundreds of rows in the browser, both for performance and so the logic isn't duplicated if you ever need to re-run it. Output is a batch of `judge_assignments` rows, shown to admin as a preview (which judge got which projects) before committing, with drag and drop reassignment available before or after commit.

### 3.5 Results and tie flagging dashboard

Aggregate view per track. For the main track leaderboard, average each project's `points_value` sum across all its `submitted` assignments for that track context (average, not raw sum, since a no-show judge could otherwise skew totals). For the derived overall main track winner, separately tally `top3_picks` counts across all judges and surface the projects with the most top-3 mentions.

For each sponsor track, show the leaderboard filtered to that track's `criteria_set`, and visually separate projects that failed one or more eligibility items (shown below fully eligible projects, not hidden).

Flag ties: any two projects within a small configurable margin (default 2 points) of each other at the top of a leaderboard get a visual flag for manual review, don't just show an exact-tie flag, near-ties matter just as much on the day of.

## 4. Judge portal

### 4.1 Assignment list

After login, a judge sees their assigned projects for whichever track context is active (most judges will only have one, but a judge pulled into sponsor track duty will see both). Each row shows team name, table number, and status (not started / in progress / submitted).

### 4.2 Scoring page, mobile first

This is the page judges live in on the day of, design mobile-first, test at a 375px viewport before anything else.

- Fixed timer at the top, counting down from the admin-configured `tracks.timer_seconds` for the active track context. Should be visible without scrolling at all times, sticky positioning.
- Below the timer, project context: team name, table number, track, and any project tags.
- Eligibility items (if this track context has any) render as simple yes/no toggles, all visible before the scored items.
- Scored items render as a tap-to-select grid or button group per criterion, one band selectable at a time, showing the band label, point value, and description so judges have the same context as the admin rubric table.
- Running total visible as they score.
- Submit locks the assignment (`status = 'submitted'`), after which the `scores_judge_update_own_assignment` RLS policy blocks further edits from that judge, admin can unlock by resetting `status` if there's a legitimate correction needed.
- A notes field, free text, for anything worth flagging to organizers later.

### 4.3 Top 3 confirmation

Once every assignment in a judge's list is `submitted`, show a dedicated screen, not a column on the scoring page, that auto-ranks their scored projects highest to lowest and lets them confirm or manually adjust their top 3. Write the result to `top3_picks` only from this screen, not incrementally while scoring, so a judge's early picks don't get stuck stale before they've seen their whole list.

## 5. Cross-cutting requirements

### 5.1 RBAC, enforced at the database, not just the UI

Every table has RLS enabled, see `002_rls_policies.sql`. UI-level role checks (hiding admin buttons from judges, etc) are for user experience only, they are not the security boundary. Do not add any code path that uses the Supabase service role key from client-side code, ever. The service role key should only ever be used from a trusted server context (a Next.js server action, route handler, or Edge Function) for operations that genuinely need to bypass RLS, such as the CSV import writing hundreds of rows in bulk. Even then, prefer writing as an authenticated admin user under RLS where performance allows, and reserve the service role for cases where that's genuinely impractical.

### 5.2 Supabase free tier constraints to design around

The free tier caps the database at 500MB, projects pause automatically after 7 days with no API activity, and there's a limit on concurrent realtime connections (around 200 on the free tier, subject to change so verify current limits before launch). None of that is a problem for row counts here, a few hundred projects, a few dozen judges, and even tens of thousands of score rows is nowhere near 500MB. What actually matters:

- Do not open a realtime subscription per judge on the scoring page, judges don't need live updates from other judges. Reserve realtime (if you use it at all) for the admin results dashboard, and even there, poll on an interval or use a manual refresh button instead of a persistent channel if the connection limit becomes a concern with many admin viewers.
- Since the project can pause after a week of inactivity, make sure someone on the team logs into the Supabase dashboard or hits the API at least once in the weeks leading up to the event so it isn't paused the morning of. Worth a calendar reminder, not a code fix.
- Avoid storing project images or video files in Supabase Storage, link out to the Devpost URLs already captured in the CSV instead. Keeps you well under the 1GB free storage cap and avoids re-hosting content you don't need to.
- Edge Functions on the free tier have a request timeout, keep the CSV import and the assignment engine efficient (bulk inserts, not one row at a time in a loop) so a large event doesn't risk timing out mid-import.

### 5.3 Eligibility fail handling

When a project fails one or more eligibility items in a sponsor track, do not zero out its score automatically and do not exclude it from the leaderboard. Continue letting the judge score the rest of the rubric normally. On the results dashboard, visually separate "eligible" from "eligibility not met" within that track's leaderboard, and if two judges disagree on the same eligibility item for the same project, surface that specifically as a discrepancy for admin review rather than averaging it away.

### 5.4 Audit trail

Score and assignment changes are logged automatically by the triggers in `003_functions_triggers.sql`. Build a simple admin-only view over `audit_log` filtered by project or judge, useful if a team disputes a result after the event.

## 6. Suggested build order

1. Run all three migrations against a fresh or existing Supabase project.
2. Auth and role wiring: judge login flow, invite redemption, confirm RLS is actually blocking cross-role access (test as a judge account trying to read another judge's assignments, it should return nothing).
3. Admin: tracks and criteria builder, since nothing else can be tested without at least one criteria set existing.
4. Admin: CSV import with column mapping.
5. Admin: judge management and manual assignment (before building the auto-suggest algorithm, so you have a working baseline).
6. Judge portal: assignment list and scoring page.
7. Assignment auto-suggest engine.
8. Top 3 confirmation flow.
9. Results and tie-flagging dashboard.
10. Audit log viewer.

Build and test each stage against real-ish data before moving to the next, the CSV attached to this project (a real prior year Devpost export) is a good fixture to import early and use throughout.
