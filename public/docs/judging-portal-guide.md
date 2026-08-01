# RocketHacks Judging Portal — Operator Guide

How the judging system works for organizers and judges. Everything here is additive: `applicants` data, roles, and policies were never modified. Judges live in `judge_profiles`, separate from hackers.

## What exists

**Database** — new judging tables, RLS, and RPCs. Run order is in `supabase/migrations/judging_portal_7-31/JUDGING_RUNBOOK.md` (files `010` → `014`).

**App**
- Organizer UI under `/admin/judging/*`
- Judge portal under `/judge/*`
- Middleware gates `/judge` and gives head judges access to `/admin/judging`
- Link from the main Admin page → **Judging Portal**

---

## The visit model (read this first)

A **sheet** is one judge filling one rubric for one project. A **visit** is one judge standing at one table. A visit can produce several sheets when that table qualifies for a main track and one or more sponsor prizes.

Time is charged per visit, not per sheet:

```
visit length = longest track timer at that table + walk-between-tables
```

Adding a second or fifth rubric to a visit costs nothing extra. That is why the Assignments tab builds **one draw per table** instead of one draw per track: the same three judges who see a Healthcare project also fill its Gemini and ElevenLabs sheets while they are already there.

The floor window is 60 minutes by default and may stretch to 90. The planner will never silently assign more visits than fit in the window — it reports shortfalls instead.

---

## Provisioning judges

Judges are guests. They are never added to `applicants`. You create an invite, they use it once to set their own password, and from then on they sign in from the normal login page — the backend recognises the judge account and sends them to the judge portal.

### What you need
1. The judge's **email** — the invite only works for this exact address
2. Optional context: name, industry, job title, company (used for matching and conflict spotting)
3. Role: `judge` or `head_judge`
4. Optional: which tracks they represent (sponsor company links)

### Steps
1. Sign in as an admin and go to `/admin/judging/judges`.
2. Fill in **Invite a judge** and create the invite.
3. Click **Copy sign-in link** on the new invite and send it to them.
4. They open the link and set a password. The invite code is checked before any account is created, so only invited people can register as judges.
5. They appear under **Judges** as soon as they activate. If your Supabase project has email confirmation on, they confirm once first and activation completes automatically.
6. Open the judge and set expertise tags and track links. Track links are required for any sponsor track marked **Linked judges only**.

**Head judge:** same flow with role `head_judge`. They get `/admin/judging/*` but not applicant management.

**Revoke:** unused invites can be revoked on the Judges tab. Codes also expire on their own.

**Tags:** bias the planner toward relevant projects but never leave a project short of judges. Matching also uses industry ↔ main track and company ↔ sponsor name when tags are thin.

---

## Organizer tabs (`/admin/judging`)

| Tab | What it does |
|-----|--------------|
| **Overview** | Setup checklist, live submission progress, and a per-track breakdown of projects, assignments, and rubric readiness. |
| **Tracks** | Create in-house and sponsor tracks, optional judges-per-project override, and the **Linked judges only** switch for sponsor tracks. |
| **Criteria** | Build rubrics: one shared in-house set plus one per sponsor track. Eligibility (yes/no) items and scored items with point bands, with a preview of max score. |
| **Judges** | Invites with copyable sign-in links, judge profiles, expertise tags, track links, and each judge's assignments. |
| **Import** | Upload the Devpost CSV, map columns, then review a summary before anything is written. Or add a single late project by hand (next free table, lightest-loaded judges). Also writes main-track and sponsor names as project tags so affinity has a floor when Built With is empty. Blank table numbers on CSV import are auto-filled as `T01…` clustered by main track (mapped CSV table values are never overwritten). |
| **Assignments** | Build a visit-based judging plan once: judges per project, window minutes, walk time. Preview visits against the window, see shortfalls, then commit. If a plan already exists, **Redo plan** clears assignments/scores and rebuilds — building on top of an existing plan is blocked. Per-track manual add / reassign / remove / reopen stay. Accepts `?project=&track=` deep links from Tables. |
| **Tables** | Floor board of every submitted project by table number. Each tile shows judges and track coverage. Open a tile to move a judge to another table (sheets transfer only when the destination still qualifies for that track) or jump into Assignments for a full edit. After a plan is committed, **Reseat for short walks** rewrites tables from the visit graph so co-judged projects sit near each other. **Export to Excel** includes a Seating sheet (table → team name, tracks, members, judges). |
| **Workload** | Visits per judge against the window, sheets as a secondary count, estimated minutes, which tables each judge holds, and how many judges you would need at these settings. |
| **Results** | Per-track leaderboard using the average of submitted sheets, near-tie flags, eligibility fail and dispute flags, plus the overall top-3 tally. |
| **Scorecards** | Browse by track, then open a project for main + sponsor scores together. Shows Devpost / GitHub / video links, team members, and collapsible per-track judge grids. Flags splits and can reopen sheets. |
| **Audit** | Plain-language log of every score and assignment change, with raw payloads. |

Every tab has **Export to Excel** with the fields that matter for that view.

**Day-of order:** Tracks → Criteria → Judges → Import → Assignments (build + commit plan) → Tables (Reseat for short walks, spot empty / thin tables, move judges) → Workload check → (judges score) → Results / Scorecards.

### Things worth knowing

- **Track names must match Devpost exactly.** Opt-in prize values are matched case-insensitively against sponsor track names. Anything unmatched is reported before import and then skipped, never guessed.
- **Import is idempotent.** Projects are keyed on submission URL, so re-importing after late submissions updates instead of duplicating.
- **Tables are assigned in two stages.** Import fills blanks by main-track clusters so same-track projects sit together before anyone is assigned. After you commit the visit plan, Tables → **Reseat for short walks** rewrites every table number from the real co-visit graph (judges assumed to walk low→high). Export first if you need the old map.
- **Plan against the window, not against sheets.** Three judges per project looks fine on every track individually, but the same people absorb every track. The planner measures in table visits and refuses to overfill a judge's hour.
- **A sheet is not a demo.** A project entered in two tracks produces two sheets for the same judge — one visit, two rubrics. Workload counts visits as the headline and sheets as secondary.
- **Moving a judge on Tables** rewrites that judge's assignment rows from table A onto table B for every track B still qualifies for (main or sponsor opt-in). Sheets for tracks B does not have are dropped after a confirm summary. COI still blocks a move onto a team that lists the judge's email.
- **Linked judges only** is the per-track switch for sponsor prizes that must be scored by that sponsor's people. Everyone else can fill sponsor rubrics as part of their visit.
- **Reopening a sheet** sets it back to in progress so the judge can edit and resubmit. Every reopen is recorded in Audit. You can do it from Assignments or from Scorecards.
- **Results tells you the ranking, Scorecards tells you whether to trust it.** When two projects are within the near-tie margin, open both on Scorecards sorted by disagreement and look at which criterion the judges split on.
- **Rebuild old plans.** Assignments built by the old per-track engine are still valid rows, but clear them and rebuild from Assignments after running migration `014` so you get the bundling.

---

## For judges

### Signing in
1. **First time:** open the link the organizers sent (or go to `/judge/login`), enter the invite email, invite code, and a password of your choosing.
2. **Every time after:** sign in at `/login` with that email and password. You land on the judge portal automatically.

Forgot password, password reset, and changing your password all work through the standard pages — a judge account is a normal account with judging access attached.

### What a judge can do

| Capability | Behavior |
|------------|----------|
| See tables | Assignments grouped by table: project title, table number, rubric chips, and "2 of 3 rubrics done". |
| Score a table | One page per table. Project context once, one visit timer, every rubric for that table as sections. Autosave on every tap. |
| Submit | Requires every criterion on every rubric at that table answered, asks for confirmation, then locks all those sheets. Only an organizer can reopen. |
| Top 3 | Unlocked once every sheet is submitted — auto-ranked by their own scores, reorderable, feeds the overall main-track winner. |
| Cannot | See other judges' scores or assignments, change their own role, or reach applicant admin. |

### URLs

| URL | Purpose |
|-----|---------|
| `/login` | Normal sign-in once activated; judges are routed to `/judge` |
| `/judge/login` | One-time activation with the invite code |
| `/judge` | Table list and progress |
| `/judge/table/[projectId]` | Visit page — every rubric for that table |
| `/judge/score/[assignmentId]` | Redirects into the table page, anchored on that rubric |
| `/judge/top3` | Confirm top 3 after everything is submitted |

---

## Security behavior

- UI hiding is not the boundary; **RLS** is.
- `is_judging_admin()` covers `applicants.role = 'admin'` and head judges.
- Judges read and write only their own assignments and scores, and only until they submit.
- `request_judge_access(email, code)` verifies an invite before any account is created; it requires both values and reveals nothing on its own.
- Signing up through the normal `/signup` page grants no judging access — only a redeemed invite creates a judge profile.
- `redeem_judge_invite(code)` is the only path that creates a judge profile, and it never touches `applicants`.
- A database trigger blocks judges from repointing an assignment or reopening their own submitted sheet.
- No service-role key is used anywhere in the browser.

---

## Dry run before the event

1. Run migrations `010` → `014` from the runbook if you have not already.
2. Create tracks (and mark any sponsor-only tracks), then a shared in-house rubric with at least two scored criteria.
3. Invite yourself at a second email address, activate it, then sign out and sign back in at `/login` to confirm you land on `/judge`.
4. Import a small CSV, or add one project, and confirm the counts on Overview.
5. On Assignments: set judges per project and the window, **Build plan**, read the feasibility numbers, then **Commit**. If a plan already exists, use **Redo plan** instead of building again.
6. Open Tables — run **Reseat for short walks**, confirm the floor board, move one judge, and use Edit on Assignments to confirm the deep link.
7. Check Workload — visits should sit inside the window.
8. As the test judge, open a table, fill every rubric, submit. Confirm the sheets lock.
9. Check Results for the score, Scorecards for the grid, Audit for the write, then reopen a sheet and confirm the judge can edit again.
10. Export any tab you care about and open the file offline.
