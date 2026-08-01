-- RocketHacks Judging Portal — SEED: judges, expertise tags, invites
--
-- Creates 8 SIMULATED judges. They exist only so you can exercise the
-- assignment engine, coverage math, leaderboards and audit log without
-- opening 8 browser sessions.
--
-- These accounts CANNOT log in: they have no password and no auth.identities
-- row. That is deliberate. Test the real judge experience with the invites at
-- the bottom of this file, which go through the normal activation flow.
--
-- Every seeded address ends in @seed.rockethacks.test, which is what
-- 000_seed_reset.sql keys off. Applicant accounts are never touched.

begin;

-- ============================================================
-- EXPERTISE TAGS
-- Names match the Devpost "Built With" values exactly, because the
-- assignment engine matches judges to projects on shared tag_id.
-- The importer upserts the same names on conflict, so seeding first is safe.
-- ============================================================

insert into tags (name, category)
select v.name, 'tech'
from (values
  ('python'), ('javascript'), ('typescript'), ('fastapi'), ('react'),
  ('next.js'), ('mongodb'), ('amazon-web-services'), ('amazon-dynamodb'),
  ('gemini'), ('elevenlabs'), ('featherless.ai'), ('base44'), ('firebase'),
  ('flask'), ('tailwind'), ('vite'), ('css'), ('html'), ('node.js'),
  ('numpy'), ('google-maps'), ('java'), ('git')
) as v(name)
where not exists (select 1 from tags t where t.name = v.name);

-- ============================================================
-- SIMULATED JUDGE ACCOUNTS
-- ============================================================

insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  v.email,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', v.full_name, 'seed', true),
  now(),
  now()
from (values
  ('ava.chen@seed.rockethacks.test',     'Ava Chen'),
  ('marcus.hall@seed.rockethacks.test',  'Marcus Hall'),
  ('priya.raman@seed.rockethacks.test',  'Priya Raman'),
  ('diego.santos@seed.rockethacks.test', 'Diego Santos'),
  ('sofia.novak@seed.rockethacks.test',  'Sofia Novak'),
  ('liam.oconnor@seed.rockethacks.test', 'Liam O''Connor'),
  ('hana.kim@seed.rockethacks.test',     'Hana Kim'),
  ('noah.weiss@seed.rockethacks.test',   'Noah Weiss')
) as v(email, full_name)
where not exists (select 1 from auth.users u where u.email = v.email);

insert into judge_profiles (user_id, email, full_name, role, industry, job_title, company)
select u.id, u.email, v.full_name, v.jrole::judging_role, v.industry, v.job_title, v.company
from (values
  ('ava.chen@seed.rockethacks.test',     'Ava Chen',      'judge', 'Software',      'Staff Engineer',      'Vercel'),
  ('marcus.hall@seed.rockethacks.test',  'Marcus Hall',   'judge', 'Cloud',         'Solutions Architect', 'AWS'),
  ('priya.raman@seed.rockethacks.test',  'Priya Raman',   'judge', 'AI / ML',       'ML Engineer',         'Featherless.AI'),
  ('diego.santos@seed.rockethacks.test', 'Diego Santos',  'judge', 'Fintech',       'Engineering Manager', 'Stripe'),
  ('sofia.novak@seed.rockethacks.test',  'Sofia Novak',   'judge', 'Healthcare',    'Data Scientist',      'Epic Systems'),
  ('liam.oconnor@seed.rockethacks.test', 'Liam O''Connor','judge', 'Hardware',      'Firmware Lead',       'Texas Instruments'),
  ('hana.kim@seed.rockethacks.test',     'Hana Kim',      'judge', 'Sustainability','Product Lead',        'Watershed'),
  ('noah.weiss@seed.rockethacks.test',   'Noah Weiss',    'judge', 'Design',        'UX Director',         'Figma')
) as v(email, full_name, jrole, industry, job_title, company)
join auth.users u on u.email = v.email
where not exists (select 1 from judge_profiles jp where jp.user_id = u.id);

-- ============================================================
-- JUDGE EXPERTISE TAGS
-- These drive the affinity_score column in the assignment preview.
-- ============================================================

insert into judge_tags (judge_id, tag_id)
select jp.user_id, t.id
from (values
  ('ava.chen@seed.rockethacks.test',     'react'),
  ('ava.chen@seed.rockethacks.test',     'next.js'),
  ('ava.chen@seed.rockethacks.test',     'typescript'),
  ('marcus.hall@seed.rockethacks.test',  'amazon-web-services'),
  ('marcus.hall@seed.rockethacks.test',  'amazon-dynamodb'),
  ('marcus.hall@seed.rockethacks.test',  'python'),
  ('priya.raman@seed.rockethacks.test',  'python'),
  ('priya.raman@seed.rockethacks.test',  'featherless.ai'),
  ('priya.raman@seed.rockethacks.test',  'gemini'),
  ('diego.santos@seed.rockethacks.test', 'typescript'),
  ('diego.santos@seed.rockethacks.test', 'node.js'),
  ('diego.santos@seed.rockethacks.test', 'mongodb'),
  ('sofia.novak@seed.rockethacks.test',  'python'),
  ('sofia.novak@seed.rockethacks.test',  'fastapi'),
  ('sofia.novak@seed.rockethacks.test',  'numpy'),
  ('liam.oconnor@seed.rockethacks.test', 'python'),
  ('liam.oconnor@seed.rockethacks.test', 'firebase'),
  ('liam.oconnor@seed.rockethacks.test', 'git'),
  ('hana.kim@seed.rockethacks.test',     'javascript'),
  ('hana.kim@seed.rockethacks.test',     'css'),
  ('hana.kim@seed.rockethacks.test',     'html'),
  ('noah.weiss@seed.rockethacks.test',   'react'),
  ('noah.weiss@seed.rockethacks.test',   'tailwind'),
  ('noah.weiss@seed.rockethacks.test',   'vite')
) as v(email, tag_name)
join judge_profiles jp on jp.email = v.email
join tags t on t.name = v.tag_name
on conflict do nothing;

-- ============================================================
-- REAL INVITES — for testing activation, login and the judge UI
-- EDIT THESE EMAILS to addresses you can receive mail at.
-- Codes must be uppercase: request_judge_access() upper-cases input.
-- ============================================================

insert into judge_invites (email, invite_code, role, full_name, industry, job_title, company, expires_at)
values
  ('you+judge@example.com',     'SEEDJUDGE1', 'judge',      'Test Judge',      'Software', 'Engineer',    'RocketHacks', now() + interval '14 days'),
  ('you+headjudge@example.com', 'SEEDHEAD1',  'head_judge', 'Test Head Judge', 'Software', 'Head of Eng', 'RocketHacks', now() + interval '14 days');

commit;

-- Verification
select jp.full_name, jp.email, jp.role, jp.industry,
       string_agg(t.name, ', ' order by t.name) as expertise_tags
from judge_profiles jp
left join judge_tags jt on jt.judge_id = jp.user_id
left join tags t on t.id = jt.tag_id
group by jp.full_name, jp.email, jp.role, jp.industry
order by jp.full_name;

select email, invite_code, role, used, expires_at from judge_invites order by created_at;
