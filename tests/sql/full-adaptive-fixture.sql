-- Non-production generated topics for SQL progression testing only.
-- All values synthetic; does not assert actual statute accuracy or academic review.
\set ON_ERROR_STOP on
update public.content_items set rubric_json=rubric_json ||
 jsonb_build_object('reference_rule_ar','تبدأ الشخصية القانونية بالولادة حيا وتنتهي بالوفاة حسب القانون')
where id in ('rights-v1-s1-recall','rights-v1-s1-understanding','rights-v1-s1-exam');
insert into public.content_items
 (id,course_id,unit_id,concept_id,dimension,item_type,status,prompt_ar,rubric_json,source_ids,metadata)
select 'rights-v1-s'||n.i||'-'||x.suffix,'qa-qu-lawc101-rights',
 'week-'||(ceil(n.i/5.0))::int,'topic-'||n.i,x.dimension,'essay','legal_review',
 'Synthetic exercise for isolated PostgreSQL tests, topic '||n.i||', dimension '||x.dimension,
 jsonb_build_object(
  'prompt_en','Synthetic English question for isolated database test session '||n.i||' / '||x.dimension,
  'reference_rule_ar','تبدأ الشخصية القانونية بالولادة حيا وتنتهي بالوفاة حسب القانون',
  'topic_title_ar','عنوان افتراضي للجلسة '||n.i,'topic_title_en','Synthetic topic '||n.i),
 array['qa-civil-2004-art39']::text[],
 '{"legal_approval":false,"learning_approval":false}'::jsonb
from generate_series(2,29) n(i)
cross join (values('recall','recall'),('understanding','understanding'),('exam_execution','exam')) x(dimension,suffix)
where n.i%5<>0;