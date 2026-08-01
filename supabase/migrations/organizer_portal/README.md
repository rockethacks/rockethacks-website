# Organizer Portal Migrations

Apply these in order in the **Supabase SQL Editor**:

1. [`020_organizer_schema.sql`](020_organizer_schema.sql) — tables, seed teams *(idempotent; safe to re-run)*
2. [`021_organizer_rls.sql`](021_organizer_rls.sql) — rewrite `is_admin` / RLS harden applicants
3. [`022_organizer_functions.sql`](022_organizer_functions.sql) — redeem / request / add_organizer_by_email
4. [`023_organizer_cutover.sql`](023_organizer_cutover.sql) — pivot admins, drop `applicants.role`

Or paste [`APPLY_ALL.sql`](APPLY_ALL.sql) once (020 is now idempotent).

**If you already ran 020 successfully** (got `organizer_role already exists` on retry): skip 020 and run **021 → 022 → 023** only.

After apply, confirm:

```sql
select email, role from organizer_profiles;
select name from org_teams order by sort_order;
select column_name from information_schema.columns
  where table_name = 'applicants' and column_name = 'role'; -- should be empty
```
