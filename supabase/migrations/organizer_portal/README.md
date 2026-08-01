# Organizer Portal Migrations

Apply these in order in the **Supabase SQL Editor**:

1. [`020_organizer_schema.sql`](020_organizer_schema.sql) — tables, seed teams *(idempotent; safe to re-run)*
2. [`021_organizer_rls.sql`](021_organizer_rls.sql) — rewrite `is_admin` / RLS harden applicants
3. [`022_organizer_functions.sql`](022_organizer_functions.sql) — redeem / request / add_organizer_by_email
4. [`023_organizer_cutover.sql`](023_organizer_cutover.sql) — pivot admins, drop `applicants.role`
5. [`024_judging_team_role.sql`](024_judging_team_role.sql) — add `judging_team` enum value
6. [`025_judging_team_helper.sql`](025_judging_team_helper.sql) — update `is_judging_admin()` *(must be a separate run after 024)*

**If you already ran 020–023:** run **024**, then **025** as two separate queries (Postgres cannot use a new enum value in the same transaction that adds it).

If 024 already succeeded and only 025 failed with `unsafe use of new value`, just run [`025_judging_team_helper.sql`](025_judging_team_helper.sql) alone now.
