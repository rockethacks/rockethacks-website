# Organizer Portal Migrations

Apply these in order in the **Supabase SQL Editor**:

1. [`020_organizer_schema.sql`](020_organizer_schema.sql) — tables, seed teams *(idempotent; safe to re-run)*
2. [`021_organizer_rls.sql`](021_organizer_rls.sql) — rewrite `is_admin` / RLS harden applicants
3. [`022_organizer_functions.sql`](022_organizer_functions.sql) — redeem / request / add_organizer_by_email
4. [`023_organizer_cutover.sql`](023_organizer_cutover.sql) — pivot admins, drop `applicants.role`
5. [`024_judging_team_role.sql`](024_judging_team_role.sql) — add `judging_team` enum value
6. [`025_judging_team_helper.sql`](025_judging_team_helper.sql) — update `is_judging_admin()` *(must be a separate run after 024)*
7. [`026_admin_purge_user.sql`](026_admin_purge_user.sql) — `admin_purge_user()` deletes profile + `auth.users` login (admin UI remove)
8. [`027_redeem_pending_organizer_invite.sql`](027_redeem_pending_organizer_invite.sql) — auto-redeem open staff invite after email confirm / password login
9. [`028_judging_team_tag_access.sql`](028_judging_team_tag_access.sql) — Judging org-team tag also unlocks judging portal (same as role `judging_team`)
10. [`029_organizer_phone.sql`](029_organizer_phone.sql) — `organizer_profiles.phone` for roster export / member detail

**If you already ran 020–023:** run **024**, then **025** as two separate queries (Postgres cannot use a new enum value in the same transaction that adds it).

If 024 already succeeded and only 025 failed with `unsafe use of new value`, just run [`025_judging_team_helper.sql`](025_judging_team_helper.sql) alone now.

If staff/judge/applicant remove in the admin UI should also wipe Authentication logins, run [`026_admin_purge_user.sql`](026_admin_purge_user.sql).

If organizers land on `/dashboard` after confirming email, run [`027_redeem_pending_organizer_invite.sql`](027_redeem_pending_organizer_invite.sql) (app callback/login also fixed to not rewrite `/login?org_code=` → `/apply`).

If organizers on the Judging team tag cannot open the Judging tab, run [`028_judging_team_tag_access.sql`](028_judging_team_tag_access.sql).

For staff roster phone numbers, run [`029_organizer_phone.sql`](029_organizer_phone.sql).
