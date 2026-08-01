-- RocketHacks Judging Portal — SEED: tracks + rubrics
-- Source of truth: "RocketHacks-Scoresheet Final.xlsx" and the Devpost export
-- projects-rocket-hacks-2026-...-2026-07-31-18_03_22.csv
--
-- Track names are copied VERBATIM from the CSV so the importer can match them:
--   * in-house names match "Which Main Track Do You Want To Participate In?"
--   * sponsor names match the exact strings in "Opt-In Prizes"
-- Change a character and the import will report them as unmatched.
--
-- Re-runnable: tracks insert only when the name is absent, rubrics are rebuilt.
-- Touches judging tables only.

begin;

-- ============================================================
-- TRACKS
-- ============================================================

insert into tracks (name, type, sponsor_name, timer_seconds, sort_order)
select v.name, v.ttype::track_type, v.sponsor, v.timer, v.sort_order
from (values
  ('Finance',                                                                     'in_house', null,             300,  1),
  ('Healthcare',                                                                  'in_house', null,             300,  2),
  ('Sustainability',                                                              'in_house', null,             300,  3),
  ('Hardware',                                                                    'in_house', null,             300,  4),
  ('AWS - Best use of AWS services integrated into a Hackathon Solution',         'sponsor',  'AWS',            240, 10),
  ('Base44- Build an app that makes a real-world impact across one of the tracks', 'sponsor',  'Base44',         240, 11),
  ('Featherless.AI - Best projects using Featherless.AI inference',               'sponsor',  'Featherless.AI', 240, 12),
  ('ElevenLabs- Best project built with ElevenLabs + MLH - Best Use of ElevenLabs','sponsor',  'ElevenLabs',     240, 13),
  ('Jaseci Labs- Best Use of Agentic AI',                                         'sponsor',  'Jaseci Labs',    240, 14),
  ('MLH - Best Use of Google Gemini API',                                         'sponsor',  'MLH',            240, 15),
  ('MLH - Best Use of MongoDB Atlas',                                             'sponsor',  'MLH',            240, 16),
  ('MLH - Best Use of Vultr',                                                     'sponsor',  'MLH',            240, 17),
  ('MLH - Best Use of Solana',                                                    'sponsor',  'MLH',            240, 18)
) as v(name, ttype, sponsor, timer, sort_order)
where not exists (select 1 from tracks t where lower(t.name) = lower(v.name));

-- ============================================================
-- RUBRICS — rebuilt from scratch every run
-- Deleting a set cascades to its items, bands and any scores that used them.
-- ============================================================

delete from criteria_sets
where name in (
  'Main Track Rubric',
  'AWS Track Rubric',
  'Base44 Track Rubric',
  'Featherless.AI Track Rubric (PLACEHOLDER)',
  'ElevenLabs Track Rubric (PLACEHOLDER)',
  'Jaseci Labs Track Rubric (PLACEHOLDER)',
  'MLH Gemini Track Rubric (PLACEHOLDER)',
  'MLH MongoDB Track Rubric (PLACEHOLDER)',
  'MLH Vultr Track Rubric (PLACEHOLDER)',
  'MLH Solana Track Rubric (PLACEHOLDER)'
);

-- ------------------------------------------------------------
-- Main track rubric — shared by Finance / Healthcare /
-- Sustainability / Hardware. 100 points across 6 criteria.
-- ------------------------------------------------------------

insert into criteria_sets (name, applies_to, track_id)
values ('Main Track Rubric', 'in_house_shared', null);

insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
select id, 'eligibility'::criteria_type, 'Completion',
       'Is the project complete enough to judge? A working demo or prototype was shown, not just slides.',
       null::int, 1
from criteria_sets where name = 'Main Track Rubric';

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Innovation',
         'How original is the idea, and how creative is the approach compared to existing solutions?',
         20, 2
  from criteria_sets where name = 'Main Track Rubric'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  5, 'The idea is very common and shows little creativity. It is similar to existing solutions.', 1),
  ('Average',        10, 'The idea has some creativity but is mostly a typical solution to a known problem.',        2),
  ('Proficient',     15, 'The idea shows clear creativity and introduces interesting features or approaches.',       3),
  ('Exceptional',    20, 'The idea is very original and creative. It presents a unique solution or a new way to solve a problem.', 4)
) as b(label, points, description, sort_order);

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Technical Execution',
         'How difficult and how well built is the technical work behind the project?',
         25, 3
  from criteria_sets where name = 'Main Track Rubric'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  5, 'The project has major technical problems or does not work properly. Important features may be missing.', 1),
  ('Average',        12, 'The project works but the technical work is fairly simple or has several issues.',                       2),
  ('Proficient',     18, 'The project works well and shows solid technical effort and implementation.',                            3),
  ('Exceptional',    25, 'The project is technically impressive, uses complex tools or systems, and runs smoothly with few issues.', 4)
) as b(label, points, description, sort_order);

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Design & UX',
         'How clear, usable and thought through is the interface and overall experience?',
         10, 4
  from criteria_sets where name = 'Main Track Rubric'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  2, 'The project is difficult to use or confusing. The design is not clear or organized.', 1),
  ('Average',         4, 'The project is usable but the design is basic and could be improved.',                2),
  ('Proficient',      7, 'The project is easy to use and the design is clear and well thought out.',            3),
  ('Exceptional',    10, 'The project has a polished design that is intuitive, accessible, and pleasant to use.', 4)
) as b(label, points, description, sort_order);

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Presentation',
         'How clearly did the team explain the problem, the solution and the demo?',
         20, 5
  from criteria_sets where name = 'Main Track Rubric'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  5, 'The team struggles to explain their project or the demo is unclear.',                 1),
  ('Average',        10, 'The team explains the project but some parts are confusing or not well organized.',   2),
  ('Proficient',     15, 'The team clearly explains the project and demonstrates the main features.',           3),
  ('Exceptional',    20, 'The team gives a strong, organized presentation and clearly explains the problem, solution, and demo.', 4)
) as b(label, points, description, sort_order);

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Real World Potential',
         'Does this solve a real problem, and could it realistically be used or developed further?',
         15, 6
  from criteria_sets where name = 'Main Track Rubric'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  3, 'The project does not clearly solve a real problem or has little practical use.', 1),
  ('Average',         7, 'The project addresses a problem but its usefulness or impact is limited.',       2),
  ('Proficient',     11, 'The project solves a meaningful problem and could be useful in real life.',      3),
  ('Exceptional',    15, 'The project has strong real-world value and could realistically be developed further.', 4)
) as b(label, points, description, sort_order);

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Adherence to Track',
         'How well does the project fit the main track the team selected on Devpost?',
         10, 7
  from criteria_sets where name = 'Main Track Rubric'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  2, 'The project does not clearly relate to the assigned track. The connection to the track theme is weak.', 1),
  ('Average',         5, 'The project relates to the selected track, but the alignment is basic or only partly clear.',           2),
  ('Proficient',      8, 'The project clearly fits the selected track and supports its theme well.',                              3),
  ('Exceptional',    10, 'The project strongly fits the selected track and shows a clear, intentional focus.',                    4)
) as b(label, points, description, sort_order);

-- ------------------------------------------------------------
-- AWS sponsor rubric — 4 eligibility gates + 20 points
-- ------------------------------------------------------------

insert into criteria_sets (name, applies_to, track_id)
select 'AWS Track Rubric', 'sponsor', id
from tracks where name = 'AWS - Best use of AWS services integrated into a Hackathon Solution';

insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
select cs.id, 'eligibility'::criteria_type, v.title, v.description, null::int, v.sort_order
from criteria_sets cs, (values
  ('E1 — 4+ AWS Services',      'Solution integrates 4 or more distinct AWS services (e.g. Lambda, S3, DynamoDB, Rekognition, Bedrock).', 1),
  ('E2 — Meaningful Integration','Services interact meaningfully (e.g. Lambda writes to S3, API Gateway triggers Lambda).',               2),
  ('E3 — AWS AI Service',       'At least one AWS AI/ML service is used (Bedrock, Rekognition, Comprehend, Polly, Lex, SageMaker).',      3),
  ('E4 — Working Demo',         'A live or recorded demo shows the AWS services actually functioning in the solution.',                   4)
) as v(title, description, sort_order)
where cs.name = 'AWS Track Rubric';

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Service Integration',
         'Are the services meaningfully connected? Does the architecture show thoughtful design rather than isolated calls?',
         10, 5
  from criteria_sets where name = 'AWS Track Rubric'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  2, 'Services are called in isolation with no real architecture behind them.', 1),
  ('Average',         5, 'Services are connected but the design is basic or partly manual.',        2),
  ('Proficient',      8, 'Services are well connected and the architecture is deliberate.',         3),
  ('Exceptional',    10, 'Architecture is thoughtful, resilient and clearly explained.',            4)
) as b(label, points, description, sort_order);

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'AI/ML Implementation',
         'Is the AWS AI/ML service central to the solution and does it add real value?',
         10, 6
  from criteria_sets where name = 'AWS Track Rubric'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  2, 'The AI/ML service is bolted on and adds little value.',            1),
  ('Average',         5, 'The AI/ML service is used but is not central to the solution.',    2),
  ('Proficient',      8, 'The AI/ML service is central and clearly improves the solution.',  3),
  ('Exceptional',    10, 'The AI/ML service is central, well tuned and drives the product.', 4)
) as b(label, points, description, sort_order);

-- ------------------------------------------------------------
-- Base44 sponsor rubric — 2 eligibility gates + 20 points
-- ------------------------------------------------------------

insert into criteria_sets (name, applies_to, track_id)
select 'Base44 Track Rubric', 'sponsor', id
from tracks where name = 'Base44- Build an app that makes a real-world impact across one of the tracks';

insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
select cs.id, 'eligibility'::criteria_type, v.title, v.description, null::int, v.sort_order
from criteria_sets cs, (values
  ('E1 — Base44 Account',    'All team members created a Base44 account with a student email and applied the Base44 credits.', 1),
  ('E2 — Working Prototype', 'A working prototype or demo of the app is submitted and functional.',                            2)
) as v(title, description, sort_order)
where cs.name = 'Base44 Track Rubric';

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Impact',
         'How well does the app solve the problem and benefit the target audience? Is the real-world value clear?',
         20, 3
  from criteria_sets where name = 'Base44 Track Rubric'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  5, 'The audience and the benefit are unclear.',                     1),
  ('Average',        10, 'There is a plausible benefit but it is limited or unproven.',   2),
  ('Proficient',     15, 'The app clearly helps a defined audience.',                     3),
  ('Exceptional',    20, 'Strong, obvious real-world value with a clear path to adoption.', 4)
) as b(label, points, description, sort_order);

-- ------------------------------------------------------------
-- Featherless.AI — PLACEHOLDER
-- The Featherless.AI tab in the workbook has no criteria filled in.
-- Replace this in the Rubrics tab before the real event.
-- ------------------------------------------------------------

insert into criteria_sets (name, applies_to, track_id)
select 'Featherless.AI Track Rubric (PLACEHOLDER)', 'sponsor', id
from tracks where name = 'Featherless.AI - Best projects using Featherless.AI inference';

insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
select id, 'eligibility'::criteria_type, 'E1 — Uses Featherless.AI inference',
       'The project calls Featherless.AI inference and the judge saw it working.',
       null::int, 1
from criteria_sets where name = 'Featherless.AI Track Rubric (PLACEHOLDER)';

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Quality of Use',
         'PLACEHOLDER — how central and how well applied is Featherless.AI inference in the project?',
         20, 2
  from criteria_sets where name = 'Featherless.AI Track Rubric (PLACEHOLDER)'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  5, 'Inference is barely used.',                            1),
  ('Average',        10, 'Inference is used but is not important to the product.', 2),
  ('Proficient',     15, 'Inference is central and used well.',                   3),
  ('Exceptional',    20, 'Inference is central, well tuned and clearly explained.', 4)
) as b(label, points, description, sort_order);

-- ------------------------------------------------------------
-- Remaining sponsor tracks — PLACEHOLDER rubrics
-- The workbook has no tabs for these. Same shape as Featherless:
-- 1 eligibility gate + one 20-point scored item. Replace before event.
-- ------------------------------------------------------------

-- ElevenLabs
insert into criteria_sets (name, applies_to, track_id)
select 'ElevenLabs Track Rubric (PLACEHOLDER)', 'sponsor', id
from tracks
where name = 'ElevenLabs- Best project built with ElevenLabs + MLH - Best Use of ElevenLabs';

insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
select id, 'eligibility'::criteria_type, 'E1 — Uses ElevenLabs',
       'The project uses ElevenLabs (voice/audio) and the judge saw it working.',
       null::int, 1
from criteria_sets where name = 'ElevenLabs Track Rubric (PLACEHOLDER)';

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Quality of Use',
         'PLACEHOLDER — how central and how well applied is ElevenLabs in the project?',
         20, 2
  from criteria_sets where name = 'ElevenLabs Track Rubric (PLACEHOLDER)'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  5, 'ElevenLabs is barely used.',                              1),
  ('Average',        10, 'ElevenLabs is used but is not important to the product.',  2),
  ('Proficient',     15, 'ElevenLabs is central and used well.',                     3),
  ('Exceptional',    20, 'ElevenLabs is central, well tuned and clearly explained.', 4)
) as b(label, points, description, sort_order);

-- Jaseci Labs
insert into criteria_sets (name, applies_to, track_id)
select 'Jaseci Labs Track Rubric (PLACEHOLDER)', 'sponsor', id
from tracks where name = 'Jaseci Labs- Best Use of Agentic AI';

insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
select id, 'eligibility'::criteria_type, 'E1 — Uses Agentic AI (Jaseci)',
       'The project uses Jaseci / agentic AI and the judge saw it working.',
       null::int, 1
from criteria_sets where name = 'Jaseci Labs Track Rubric (PLACEHOLDER)';

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Quality of Use',
         'PLACEHOLDER — how central and how well applied is agentic AI (Jaseci) in the project?',
         20, 2
  from criteria_sets where name = 'Jaseci Labs Track Rubric (PLACEHOLDER)'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  5, 'Agentic AI is barely used.',                              1),
  ('Average',        10, 'Agentic AI is used but is not important to the product.',  2),
  ('Proficient',     15, 'Agentic AI is central and used well.',                     3),
  ('Exceptional',    20, 'Agentic AI is central, well tuned and clearly explained.', 4)
) as b(label, points, description, sort_order);

-- MLH Gemini
insert into criteria_sets (name, applies_to, track_id)
select 'MLH Gemini Track Rubric (PLACEHOLDER)', 'sponsor', id
from tracks where name = 'MLH - Best Use of Google Gemini API';

insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
select id, 'eligibility'::criteria_type, 'E1 — Uses Google Gemini API',
       'The project calls the Google Gemini API and the judge saw it working.',
       null::int, 1
from criteria_sets where name = 'MLH Gemini Track Rubric (PLACEHOLDER)';

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Quality of Use',
         'PLACEHOLDER — how central and how well applied is the Gemini API in the project?',
         20, 2
  from criteria_sets where name = 'MLH Gemini Track Rubric (PLACEHOLDER)'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  5, 'Gemini is barely used.',                              1),
  ('Average',        10, 'Gemini is used but is not important to the product.',  2),
  ('Proficient',     15, 'Gemini is central and used well.',                     3),
  ('Exceptional',    20, 'Gemini is central, well tuned and clearly explained.', 4)
) as b(label, points, description, sort_order);

-- MLH MongoDB Atlas
insert into criteria_sets (name, applies_to, track_id)
select 'MLH MongoDB Track Rubric (PLACEHOLDER)', 'sponsor', id
from tracks where name = 'MLH - Best Use of MongoDB Atlas';

insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
select id, 'eligibility'::criteria_type, 'E1 — Uses MongoDB Atlas',
       'The project uses MongoDB Atlas and the judge saw it working.',
       null::int, 1
from criteria_sets where name = 'MLH MongoDB Track Rubric (PLACEHOLDER)';

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Quality of Use',
         'PLACEHOLDER — how central and how well applied is MongoDB Atlas in the project?',
         20, 2
  from criteria_sets where name = 'MLH MongoDB Track Rubric (PLACEHOLDER)'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  5, 'MongoDB Atlas is barely used.',                              1),
  ('Average',        10, 'MongoDB Atlas is used but is not important to the product.',  2),
  ('Proficient',     15, 'MongoDB Atlas is central and used well.',                     3),
  ('Exceptional',    20, 'MongoDB Atlas is central, well designed and clearly explained.', 4)
) as b(label, points, description, sort_order);

-- MLH Vultr
insert into criteria_sets (name, applies_to, track_id)
select 'MLH Vultr Track Rubric (PLACEHOLDER)', 'sponsor', id
from tracks where name = 'MLH - Best Use of Vultr';

insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
select id, 'eligibility'::criteria_type, 'E1 — Uses Vultr',
       'The project is deployed on or uses Vultr and the judge saw it working.',
       null::int, 1
from criteria_sets where name = 'MLH Vultr Track Rubric (PLACEHOLDER)';

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Quality of Use',
         'PLACEHOLDER — how central and how well applied is Vultr in the project?',
         20, 2
  from criteria_sets where name = 'MLH Vultr Track Rubric (PLACEHOLDER)'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  5, 'Vultr is barely used.',                              1),
  ('Average',        10, 'Vultr is used but is not important to the product.',  2),
  ('Proficient',     15, 'Vultr is central and used well.',                     3),
  ('Exceptional',    20, 'Vultr is central, well configured and clearly explained.', 4)
) as b(label, points, description, sort_order);

-- MLH Solana
insert into criteria_sets (name, applies_to, track_id)
select 'MLH Solana Track Rubric (PLACEHOLDER)', 'sponsor', id
from tracks where name = 'MLH - Best Use of Solana';

insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
select id, 'eligibility'::criteria_type, 'E1 — Uses Solana',
       'The project uses Solana and the judge saw it working.',
       null::int, 1
from criteria_sets where name = 'MLH Solana Track Rubric (PLACEHOLDER)';

with i as (
  insert into criteria_items (criteria_set_id, type, title, description, max_points, sort_order)
  select id, 'scored'::criteria_type, 'Quality of Use',
         'PLACEHOLDER — how central and how well applied is Solana in the project?',
         20, 2
  from criteria_sets where name = 'MLH Solana Track Rubric (PLACEHOLDER)'
  returning id
)
insert into criteria_bands (criteria_item_id, label, points, description, sort_order)
select i.id, b.label, b.points, b.description, b.sort_order
from i, (values
  ('Underachieving',  5, 'Solana is barely used.',                              1),
  ('Average',        10, 'Solana is used but is not important to the product.',  2),
  ('Proficient',     15, 'Solana is central and used well.',                     3),
  ('Exceptional',    20, 'Solana is central, well designed and clearly explained.', 4)
) as b(label, points, description, sort_order);

commit;

-- Verification: 13 tracks, 10 rubrics (1 shared + 9 sponsor), point totals.
select cs.name as rubric,
       count(*) filter (where ci.type = 'eligibility') as eligibility_gates,
       count(*) filter (where ci.type = 'scored')      as scored_items,
       coalesce(sum(ci.max_points), 0)                 as total_points
from criteria_sets cs
join criteria_items ci on ci.criteria_set_id = cs.id
group by cs.name
order by cs.name;

-- Tracks still missing a rubric (should be empty after this seed)
select t.name
from tracks t
where t.type = 'sponsor'
  and t.is_active
  and not exists (
    select 1 from criteria_sets cs
    where cs.applies_to = 'sponsor' and cs.track_id = t.id
  )
order by t.name;
