-- ISO fixture for founder-approved internal pilot, never production.
\set ON_ERROR_STOP on
alter table public.content_items add column difficulty smallint not null default 2;
alter table public.content_items add column exam_frequency_tag text not null default 'unknown';
alter table public.content_items add column exam_importance_weight numeric not null default 0.5;
alter table public.content_items add column version integer not null default 1;
alter table public.content_items add column updated_at timestamptz not null default now();
insert into public.profiles(id,role,active,display_name) values
('40000000-0000-4000-8000-000000000001','owner',true,'Test founder');
delete from public.content_items where id like 'test-q%';
insert into public.content_items(id,course_id,unit_id,concept_id,dimension,item_type,status,prompt_ar,rubric_json,source_ids,metadata)
select t.id,'qa-qu-lawc101-rights','week-1','topic-1',t.dim,'essay','legal_review',
 'Source-reviewed pilot exercise with legally accurate content: '||t.id,
 jsonb_build_object('prompt_en','English legally reviewed learning exercise for '||t.id),
 array['qa-civil-2004-art39','qa-civil-2004-art40']::text[],
 '{"legal_approval":false,"learning_approval":false}'::jsonb
from (values('rights-v1-s1-recall','recall'),('rights-v1-s1-understanding','understanding'),('rights-v1-s1-exam','exam_execution')) as t(id,dim);
