-- EPHEMERAL CI-ONLY fixtures. Copied into a disposable Supabase CLI directory
-- before migrations 004/005. NEVER apply to hosted production. No PII, no real students.
-- Production already has a manually provisioned founder and fully seeded source bank;
-- the repository's historical migrations assume those records exist.
insert into auth.users
 (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values
 ('91000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated','authenticated','temporary-founder@lexlearn-ci.invalid',
  crypt('local-only-unusable-test-password',gen_salt('bf')),now(),now(),now())
on conflict(id) do nothing;

insert into public.profiles(id,role,username,display_name,active)
values ('91000000-0000-4000-8000-000000000001'::uuid,
        'owner','temporary-founder-ci','LOCAL CI FOUNDER ONLY',true)
on conflict(id) do update set role='owner',active=true;

insert into public.courses(id,country_code,institution_key,course_code,title_ar,title_en,status)
values ('qa-qu-lawc101-rights','qa','local-fixture-only','LAWC101',
        'نظرية الحق - مواد اختبار مؤقتة','Theory of Rights — synthetic CI only','review')
on conflict(id) do nothing;

insert into public.content_sources(id,country_code,title,authority,status,excerpt,metadata)
select 'qa-civil-2004-art'||n,'qa','STAGING ONLY article '||n,
 'CI SYNTHETIC / NOT AN OFFICIAL STATUTE','approved',
 'Synthetic local legal reference for test migration order. Never publish as official content.',
 '{"staging_only":true}'::jsonb
from (values (39),(40),(49),(50),(62),(63)) as t(n)
on conflict(id) do nothing;

-- Exactly 24 topics (sessions 1..29 excluding checkpoints 5,10,15,20,25)
-- x three assessed dimensions = 72 temporary essay items.
insert into public.content_items(
 id,course_id,unit_id,concept_id,dimension,difficulty,item_type,prompt_ar,
 rubric_json,source_ids,status,version,metadata)
select
 'rights-v1-s'||s.n||'-'||d.name,
 'qa-qu-lawc101-rights',
 'week-'||ceil(s.n::numeric/5)::integer,
 'topic-'||s.n,
 d.dimension,2,'essay',
 'إجابة اختبارية اصطناعية فقط: اشرح العلاقة القانونية للحالة '||s.n||' في '||d.name,
 jsonb_build_object(
   'prompt_en','Local synthetic test question for session '||s.n||' about '||d.name,
   'reference_rule_ar','مادة اختبارية اصطناعية للمسار المحلي ولا يجوز استخدامها للتصحيح القانوني الفعلي',
   'criteria',jsonb_build_array(jsonb_build_object('id','birth','label','تمام الولادة حيا','weight',1))
 ),
 array['qa-civil-2004-art39']::text[],
 'legal_review',1,
 '{"staging_only":true,"legal_approval":false,"learning_approval":false}'::jsonb
from generate_series(1,29) as s(n)
cross join (values
 ('recall','recall'),
 ('understanding','understanding'),
 ('exam','exam_execution')
) as d(name,dimension)
where s.n%5<>0
on conflict(id) do nothing;

do $$ begin
 if (select count(*) from public.content_items
      where course_id='qa-qu-lawc101-rights'
      and metadata->>'staging_only'='true')<>72 then
  raise exception 'CI ephemeral prerequisite failed: expected 72 essay fixtures';
 end if;
end $$;
