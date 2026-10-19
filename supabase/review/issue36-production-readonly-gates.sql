-- Issue #36: production READ-ONLY sign-off gate. NEVER flips approval flags.
-- Run under a read-only auditing database role before approving any migration/deploy.
-- Empty/not-ready results MUST block student-program production release.
with expected_diagnostic (code, item_id, source_id, expected_key) as (
 values
 ('q39r','rights-official-diagnostic-v2-q39r','qa-civil-2004-art39',0),
 ('q49r','rights-official-diagnostic-v2-q49r','qa-civil-2004-art49',1),
 ('q62r','rights-official-diagnostic-v2-q62r','qa-civil-2004-art62',2),
 ('q39u','rights-official-diagnostic-v2-q39u','qa-civil-2004-art39',1),
 ('q50u','rights-official-diagnostic-v2-q50u','qa-civil-2004-art50',1),
 ('q63a','rights-official-diagnostic-v2-q63a','qa-civil-2004-art63',2)
), diag as (
 select e.code,e.item_id,
  i.id is not null as item_exists,
  coalesce(i.status='approved' and i.reviewed_at is not null
   and i.legal_reviewer is not null and i.learning_reviewer is not null
   and i.legal_reviewer<>i.learning_reviewer
   and i.metadata->>'legal_approval'='true'
   and i.metadata->>'learning_approval'='true'
   and i.metadata->>'publication_prohibited' is distinct from 'true'
   and i.metadata->>'official_diagnostic_v2_id'=e.code
   and (i.answer_key_json->>'correct_index')::int=e.expected_key
   and jsonb_typeof(i.options_json->'ar')='array'
   and jsonb_typeof(i.options_json->'en')='array'
   and i.source_ids @> array[e.source_id]::text[],false) as approved
 from expected_diagnostic e
 left join public.content_items i on i.id=e.item_id and i.course_id='qa-qu-lawc101-rights'
), first_level as (
 select i.id,
  (i.status='approved' and i.reviewed_at is not null
   and i.legal_reviewer is not null and i.learning_reviewer is not null
   and i.legal_reviewer<>i.learning_reviewer
   and i.metadata->>'legal_approval'='true'
   and i.metadata->>'learning_approval'='true'
   and i.source_ids @> array['qa-civil-2004-art39','qa-civil-2004-art40']::text[]
   and i.concept_id='topic-1' and i.unit_id='week-1'
   and i.item_type='essay') as approved
 from public.content_items i
 where i.course_id='qa-qu-lawc101-rights'
 and i.id in ('rights-v1-s1-recall','rights-v1-s1-understanding','rights-v1-s1-exam')
), schema_gate as (
 select count(*)::integer as table_count
 from information_schema.tables
 where table_schema='public'
  and table_name in ('student_diagnostic_runs','student_level_releases',
                     'student_level_completions','student_level_responses')
)
select 'server_lifecycle_tables' as gate,
 schema_gate.table_count::text||'/4' as result, (schema_gate.table_count=4) as ready
from schema_gate
union all
select 'official_diagnostic_questions',
 count(*) filter (where approved)::text||'/6',
 count(*) filter (where approved)=6 from diag
union all
select 'first_level_approved_essays',
 count(*) filter (where approved)::text||'/3',
 count(*) filter (where approved)=3 and count(*)=3 from first_level;
-- Additional staged audit required: genuine JWT cohort RLS negative cases, rollback
-- and 1->2 locks, direct URL, consent, production deployment SHA and private browser.
