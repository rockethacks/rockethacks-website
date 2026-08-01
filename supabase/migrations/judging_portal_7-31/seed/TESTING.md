# Judging Portal — test plan

Tests one feature at a time, in dependency order. Each step says what to do, what
you should see, and the SQL that proves it. Everything is reversible with
`000_seed_reset.sql`.

Applicant data is never touched by any script here.

**Prerequisite:** migrations `010` → `014` must already be applied (see
`JUDGING_RUNBOOK.md`). Migration `014` adds the visit model, `judging_settings`,
`judge_tracks`, and `suggest_judging_plan`.

## Files

| File | When to run |
| --- | --- |
| `000_seed_reset.sql` | Before a round, and after you finish |
| `001_seed_tracks_criteria.sql` | Step 1 — tracks and rubrics |
| `002_seed_judges.sql` | Step 2 — 8 simulated judges + 2 real invites |
| `003_seed_after_import.sql` | Blocks A–E, run individually after the import |

Run them in the Supabase SQL Editor. `002` has two invite emails you must edit to
addresses you can actually receive mail at.

## Ground rules

1. **Start clean.** Stop the dev server, delete `.next`, then `npm run dev`. A
   stale build is what made the overview page render unstyled last time.
2. **Two browsers.** Your normal profile stays signed in as admin. Use a private
   window for the judge account so both sessions can exist at once.
3. **Run the reset first.** It prints the applicant count before and after — the
   number must be identical (318 at the time of writing).
4. **Think in visits, not sheets.** One judge at one table is one visit, even when
   they fill a main track plus several sponsor rubrics there.

---

## Step 0 — Reset

Run `000_seed_reset.sql`. The verification block at the bottom should return
`applicants_must_be_318 = 318` and zero for everything else.

---

## Step 1 — Tracks

Run `001_seed_tracks_criteria.sql`.

Open **Admin → Judging → Tracks**.

- 13 tracks: 4 in-house (Finance, Healthcare, Sustainability, Hardware) and 9
  sponsor tracks named exactly as the Devpost opt-in prizes.
- Project counts are 0 for all of them.
- Rubric status shows **Ready** for AWS, Base44 and Featherless.AI, **Missing**
  for the other 6 sponsor tracks. That is intentional — it is the warning you
  want to see before an event.

Then test the UI itself, since seeds bypass it:

- Rename a track inline, save, refresh — the new name persists.
- Change a timer to 180 — that becomes the visit length when this track is the
  longest rubric at a table (plus walk time from Assignments settings).
- On a sponsor track, toggle **Linked judges only** and set a judges-per-project
  override of 1 or 2. Confirm both persist.
- Create a throwaway track, deactivate it, confirm it disappears from planning,
  then hard-delete it.
- Export to Excel and confirm the file has the new columns.

> The in-house names must stay character-identical to the CSV's
> "Which Main Track Do You Want To Participate In?" values or the import cannot
> match them. Same for sponsor names vs "Opt-In Prizes".

---

## Step 2 — Rubrics

Still from `001`. Open **Admin → Judging → Criteria**.

- **Main Track Rubric** (shared): 1 eligibility gate (Completion) + 6 scored
  items totalling 100 points, each with 4 bands carrying the wording from the
  scoresheet.
- **AWS Track Rubric**: 4 eligibility gates + 2 scored items (20 points).
- **Base44 Track Rubric**: 2 gates + 1 scored item (20 points).
- **Featherless.AI Track Rubric (PLACEHOLDER)**: the workbook tab was empty, so
  this is invented. Replace it before the real event.

UI checks: add a band to Innovation and confirm the preview table and the running
total update, then delete it again. Add and delete an eligibility item.

---

## Step 3 — Import (the real thing, through the UI)

**Admin → Judging → Import**, upload
`public/juding_portal_docs/projects-rocket-hacks-2026-…-18_03_22.csv`.

Two things to fix on the mapping screen — auto-detection gets them wrong:

1. `"Try it out" Links` and `Github Repo Link (Must Be Public*)` both auto-map to
   **GitHub URL**, and the first one wins. Set `"Try it out" Links` to **Skip**.
2. There is no table number column in a Devpost export. Leave it unmapped;
   import auto-assigns `T01…` clustered by main track for blank tables.
   Block A of `003` is only a fallback if you imported before that existed.

Expected on the review screen:

- **51 usable rows, 10 skipped.** The 10 skipped are Drafts with no submission
  URL. Nothing filters on project status, so if a draft ever had a URL it would
  import as a normal project.
- **0 unmatched prizes and 0 unmatched main tracks.** Anything else means a
  track name drifted from the CSV.
- **51 new projects, 0 updated.**

Run the import. The success banner should mention table numbers assigned by
main track. Then run **block E**'s first query. Expect exactly:

- 51 projects, 48 with a main track (3 submitted rows never picked one)
- 76 sponsor opt-ins, 201 tech tags, 51 with a table number
- 38 team member rows — one per project that filled in "Team Member 1". The
  submitter columns are not imported at all (see gap 6)

On **Tables**, tiles for the same main track should sit in contiguous blocks
(e.g. Healthcare together) rather than pure title order.

Re-run the same import to test idempotency: it should report **0 new, 51
updated**, and project count stays at 51 (`submission_url` is unique).

---

## Step 4 — Judges

Run `002_seed_judges.sql` after editing the two invite emails.

**Admin → Judging → Judges** should show 8 simulated judges with industry, job
title, company and expertise tags, plus 2 open invites.

The 8 seeded accounts **cannot log in** — no password, no identity row. They
exist to make the assignment and results math realistic. Test the real flow with
the invites:

1. Copy the sign-in link for `SEEDJUDGE1`, open it in a private window.
2. Activation form: email + invite code + new password. Password rules are
   enforced client and server side — try a weak one first and confirm it is
   rejected.
3. After activation you land on `/judge`, not `/apply`.
4. Sign out, sign in again through the **normal** `/login` page with that email
   and password — the server should redirect you to `/judge`.
5. Use **Forgot password** on that account, complete the reset, sign in again.
   The reset must land on `/reset-password`, never `/apply`.
6. Reuse `SEEDJUDGE1` from another browser — it must be rejected as already used.
7. Try a wrong code with a valid email — rejected without revealing anything.

Also redeem `SEEDHEAD1` on a second address to test the head judge role: that
account gets `/admin/judging` access but not the rest of `/admin`.

Admin-side checks on the same page: edit a judge's industry and role inline, add
a new expertise tag, toggle a track link (especially for a sponsor track you
marked Linked judges only), and confirm the tag appears in the tag list for
other judges too (tags are shared).

---

## Step 5 — Assignments (visit planner)

**Admin → Judging → Assignments**.

First run **block B** of `003`. It adds Marcus Hall as a team member on one
project and prints the title. Keep that title handy. If you still have the old
per-track assignments from earlier testing, click **Clear all and replan**.

1. Set judges per project to 3, window to 60 minutes, walk to 1 minute.
2. Press **Build plan**. You get a **preview** — nothing is written yet.
3. Read the feasibility strip:
   - visits needed ≈ projects × judges per project (bundled, not per track),
   - your capacity = judges × visits that fit in the window,
   - judges needed for these settings.
4. With 8 seeded judges and a 60-minute window the plan will likely **not** fit
   3 judges per project. Drop to what the banner says is affordable (often 1),
   or stretch the window to 90, and rebuild.
5. Check the preview against the rules:
   - each visit lists multiple rubrics when the project opted into sponsors,
   - judge loads are within one visit of each other,
   - **Marcus Hall never appears on the conflicted project** from block B,
   - affinity > 0 when industry, company, track links or tags match.
6. Commit, then open **Tables**. Click **Reseat for short walks**, read the
   walk-cost preview, confirm, and check that co-judged projects moved closer
   together on the board. Open a tile, confirm its judges and track chips match
   the plan, then **Move** one judge to another table and accept the
   transfer/drop summary. Use **Edit on Assignments** and confirm the URL lands
   with `?project=` / `?track=` and the manual panel is prefilled and
   highlighted for that project.
7. Open **Workload**. Headline numbers are visits and minutes against the
   window — not sheets against an arbitrary target.
8. Manually add one sheet on a track, reassign it, then remove it. Export
   Assignments, Tables, and Workload to Excel and open the files.

Give your real activated judge a few table visits manually (or leave them in
the committed plan); those are the ones you will score by hand next.

---

## Step 6 — Judge scoring (one page per table)

In the private window as your real judge, open `/judge`.

- Assignments are grouped by **table**, not by track. Each card shows the
  project, table number, rubric chips, and "2 of 3 rubrics done".
- Open one. Check the project context once at the top: title, table, tags,
  about, Devpost / video / GitHub.
- One visit timer at the top — start / pause / reset. Length comes from the
  longest rubric at that table plus walk time.
- Every rubric for that table is a section on the same page. Answer criteria
  and watch each section's running total.
- Leave mid-way and come back — answers persist (autosave).
- Try to submit with one criterion unanswered — blocked with a clear message.
- Complete every rubric and submit once. All sheets for that table lock.
- Try to reopen as the judge — impossible. Reopen from admin Assignments or
  Scorecards — allowed (`enforce_assignment_judge_limits`).
- Old links at `/judge/score/<assignmentId>` should redirect into the table page.

Security probe: copy another judge's assignment id from SQL and open
`/judge/score/<that id>`. RLS should make it unavailable, not a blank page.

---

## Step 7 — Top 3

Finish every assignment for your real judge, then open `/judge/top3`.

- It is unreachable until all assignments are submitted.
- It auto-ranks by total score and lets you reorder.
- Save, refresh, and confirm the order stuck. Save a second time with a
  different order to confirm it replaces rather than appends (`top3_picks` has a
  unique constraint per judge and per rank).

Now run **block C** then **block D** of `003` to simulate the other 8 judges
scoring and nominating. Blocks C and D skip anything already submitted, so your
hand-scored sheets are preserved.

---

## Step 8 — Results

**Admin → Judging → Results**.

- Leaderboards per track ordered by average score. Cross-check the top few rows
  against the last query in block E — they must agree.
- Submitted vs pending counts per project.
- **Near tie** flags where two projects sit inside the margin. Change the margin
  and watch the flags move.
- **Eligibility not met** and **Judges disagree** appear because block C answers
  roughly 1 in 12 eligibility questions NO. If you see none, the simulation did
  not run.
- The top-3 tally counts mentions and first-place votes across all judges.

---

## Step 9 — Scorecards, audit, overview, exports

**Scorecards** tab: pick a track, open a project, confirm the judge-by-criterion
grid, disagreement flags, and that Export produces both a long sheet and a wide
pivot.

**Audit** tab: every score and assignment write is logged. You should see plain
language rows like "Assignment changed from assigned to in progress by Ava Chen".
Rows written by the seed SQL show no author, because `auth.uid()` is null in the
SQL editor — expected, and a useful way to tell real activity from simulated.

**Overview** tab: the setup checklist should now be fully green, and the progress
percentage should match `submitted / total assignments` from block E.

Click **Export to Excel** on Tracks, Criteria, Judges, Import, Assignments,
Tables, Workload, Results, Scorecards and Audit. Each file should open with the
fields that match that tab.

---

## Step 10 — Access control

Quick negative pass, all of it should fail cleanly rather than 500 or hang:

- Signed out: `/judge`, `/judge/top3`, `/admin/judging` all redirect to login.
- Signed in as a normal participant: `/judge` and `/admin/judging` both bounce.
- Signed in as the head judge: `/admin/judging` works, `/admin` (check-in, etc.)
  does not.
- Signed in as admin: everything works, and `/judge` is reachable because admins
  count as judges for read purposes.

---

## Teardown

Run `000_seed_reset.sql` again. Confirm the applicant count is unchanged. If you
also want to delete the judge accounts you activated by hand, uncomment the block
at the bottom of that file and put their emails in.

---

## Gaps this plan will surface

Worth deciding on before the event rather than during it:

1. **Table numbers have no UI.** Devpost does not export them and no admin screen
   sets them, so today they can only be set with SQL (block A).
2. **Draft rows are not filtered.** Only the missing submission URL keeps them
   out. A draft with a URL would import as a judgeable project.
3. **Import auto-mapping picks `"Try it out" Links` over the GitHub column.**
   Must be corrected by hand on every import.
4. **The Featherless.AI rubric does not exist** in the scoresheet workbook.
5. **Submitters are not imported as team members.** The importer only reads
   "Team Member N" columns, so `Submitter Email` never lands in
   `project_team_members` — and conflict-of-interest matches on that table. A
   judge who submitted a project would not be blocked from judging it. Only 38
   of 51 projects have any team member row at all.
6. **8 seeded judges cannot cover 3-per-project in 60 minutes.** That is the
   planner working correctly — use it to decide whether to recruit, stretch the
   window, or drop judges per project.
