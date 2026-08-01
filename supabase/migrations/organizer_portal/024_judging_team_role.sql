-- RocketHacks Organizer Portal
-- Migration 024: Add judging_team to organizer_role enum ONLY
--
-- Postgres requires the new enum value to be committed before it can be
-- referenced in SQL. Run this, then run 025 in a separate query/session.

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'organizer_role'
      and e.enumlabel = 'judging_team'
  ) then
    alter type organizer_role add value 'judging_team';
  end if;
end $$;
