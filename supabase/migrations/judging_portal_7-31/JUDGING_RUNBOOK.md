# Judging Portal — SQL Editor Runbook

Run these **manually** in the Supabase SQL Editor. Do **not** use MCP `apply_migration` unless you explicitly choose to.

**Order matters.** Paste and run one file at a time.

| Step | File | Purpose |
|------|------|---------|
| 1 | [`010_judging_schema.sql`](./010_judging_schema.sql) | Enums + new tables only |
| 2 | [`011_judging_rls.sql`](./011_judging_rls.sql) | Helpers + RLS on new tables |
| 3 | [`012_judging_functions.sql`](./012_judging_functions.sql) | Invite redeem, score sync, audit, assignment suggest |
| 4 | [`013_judging_fixes.sql`](./013_judging_fixes.sql) | Invite pre-check RPC, assignment immutability + submit lock |

## Safety guarantees

- No `ALTER` / `UPDATE` / `DELETE` on `applicants`
- No changes to existing applicants RLS policies
- Existing `is_admin()` / `is_organizer_or_admin()` / `get_user_role()` are left as-is
- New helpers: `is_judging_admin()`, `is_judge()`

## Verification after 010

```sql
select tablename
from pg_tables
where schemaname = 'public'
order by tablename;
-- Expect: applicants + judge_profiles, tags, tracks, criteria_*, projects, ...
```

```sql
select count(*) as applicant_count from applicants;
-- Must match pre-migration count (data untouched)
```

## Verification after 011

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'judge_profiles','tags','tracks','criteria_sets','projects',
    'judge_assignments','scores','top3_picks','judge_invites','audit_log'
  );
-- All rowsecurity = true
```

```sql
select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('is_judging_admin', 'is_judge', 'is_admin');
```

## Verification after 012

```sql
select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('redeem_judge_invite', 'suggest_judge_assignments', 'sync_score_points');
```

## Verification after 013

```sql
select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('request_judge_access', 'enforce_assignment_judge_limits');

select tgname from pg_trigger
where tgrelid = 'public.judge_assignments'::regclass
  and not tgisinternal;
-- Expect trg_assignment_judge_limits and trg_assignments_audit
```

## Smoke test (after app wiring)

1. As admin: create an invite from `/admin/judging/judges`.
2. Judge signs in at `/judge/login`, redeems code.
3. Confirm `judge_profiles` row exists; `applicants.role` for that user (if any) is unchanged.
4. As judge: `select * from judge_assignments` returns only own rows (empty until assigned).
5. As judge: attempting to read another judge’s scores should return nothing (RLS).
