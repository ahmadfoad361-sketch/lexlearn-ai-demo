-- LexLearn Issue 36 - Stage 1 approved adaptive essay practice.
-- NEW PROPOSED MIGRATION. Does not approve academic materials or run on production.
begin;
create table if not exists public.student_level_responses (
 user_id uuid not null references public.profiles(id) on delete cascade,
 course_id text not null references public.courses(id) on delete cascade,
 level_number integer not null check(level_number=1),
 item_id text not null references public.content_items(id) on delete restrict,
 answer_text text not null check(length(trim(answer_text)) between 4 and 12000),
 review_status text not null default 'pending_human_review'
   check(review_status in ('pending_human_review','human_reviewed')),
 submitted_at timestamptz not null default now(),
 primary key (user_id,course_id,level_number,item_id)
);
create index if not exists idx_student_level_responses_cohort
 on public.student_level_responses(course_id,level_number,user_id);
alter table public.student_level_responses enable row level security;
revoke all on public.student_level_responses from public,anon,authenticated;
grant select on public.student_level_responses to authenticated;
drop policy if exists "level responses own read" on public.student_level_responses;
create policy "level responses own read" on public.student_level_responses
 for select to authenticated using (
  user_id=auth.uid() and public.is_active_user()
 );
-- No INSERT / UPDATE / DELETE grant or RLS policy for students.
-- All writes go through authenticated, server-authorised RPC.

create or replace function public.lex_level_one_open(p_course text)
returns jsonb language plpgsql stable security definer
set search_path='' as $$
declare
 v_uid uuid;
 v_access jsonb;
 v_plan jsonb;
 v_mode text;
 v_order text[];
 v_count integer;
 v_tasks jsonb;
 v_saved jsonb;
begin
 v_uid:=public.lex_require_student(p_course);
 v_access:=public.lex_level_access(p_course,1);
 if (v_access->>'allowed') is distinct from 'true' then
  return jsonb_build_object('allowed',false,'reason',v_access->>'reason',
    'level',1,'tasks','[]'::jsonb,'saved','[]'::jsonb);
 end if;
 select d.training_plan into v_plan
 from public.student_diagnostic_runs d
 where d.user_id=v_uid and d.course_id=p_course and d.status='completed';
 if v_plan is null then raise exception 'official_diagnostic_missing' using errcode='42501'; end if;
 v_mode:=v_plan->>'mode';
 v_order:=case v_mode
   when 'recall-led' then array['understanding','exam_execution','recall']::text[]
   when 'understanding-led' then array['recall','understanding','exam_execution']::text[]
   when 'balanced' then array['exam_execution','understanding','recall']::text[]
   else array['understanding','recall','exam_execution']::text[]
 end;
 -- The exact three trusted, legally reviewed topic-one items are the ONLY stage-one bank.
 select count(*) into v_count from public.content_items i
 where i.course_id=p_course
  and i.id in ('rights-v1-s1-recall','rights-v1-s1-understanding','rights-v1-s1-exam')
  and i.concept_id='topic-1' and i.unit_id='week-1'
  and i.item_type='essay' and i.status='approved'
  and i.reviewed_at is not null
  and i.legal_reviewer is not null and i.learning_reviewer is not null
  and i.legal_reviewer<>i.learning_reviewer
  and i.metadata->>'legal_approval'='true' and i.metadata->>'learning_approval'='true'
  and cardinality(i.source_ids)>0
  and coalesce(length(trim(i.prompt_ar)),0)>15
  and coalesce(length(trim(i.rubric_json->>'prompt_en')),0)>15;
 if v_count<>3 then
  return jsonb_build_object('allowed',false,'reason','level_one_items_not_approved',
    'level',1,'tasks','[]'::jsonb,'saved','[]'::jsonb);
 end if;
 select jsonb_agg(jsonb_build_object('id',i.id,'dimension',i.dimension,
   'title_ar',case i.dimension
    when 'recall' then 'الاسترجاع من الذاكرة'
    when 'understanding' then 'اشرح القاعدة بأسلوبك'
    else 'بناء الإجابة القانونية' end,
   'title_en',case i.dimension
    when 'recall' then 'Retrieval from memory'
    when 'understanding' then 'Explain the rule'
    else 'Structure a legal answer' end,
   'prompt_ar',i.prompt_ar,
   'prompt_en',i.rubric_json->>'prompt_en',
   'source_ids',to_jsonb(i.source_ids))
   order by array_position(v_order,i.dimension))
 into v_tasks
 from public.content_items i
 where i.course_id=p_course
 and i.id in ('rights-v1-s1-recall','rights-v1-s1-understanding','rights-v1-s1-exam')
 and i.concept_id='topic-1' and i.unit_id='week-1'
 and i.status='approved';
 select coalesce(jsonb_agg(jsonb_build_object('item_id',r.item_id,'answer_text',r.answer_text,
 'review_status',r.review_status,'submitted_at',r.submitted_at)),'[]'::jsonb)
 into v_saved
 from public.student_level_responses r
 where r.user_id=v_uid and r.course_id=p_course and r.level_number=1;
 return jsonb_build_object('allowed',true,'level',1,'plan_mode',v_mode,
  'reason_ar',v_plan->>'reason_ar','reason_en',v_plan->>'reason_en',
  'tasks',coalesce(v_tasks,'[]'::jsonb),'saved',v_saved,
  'status',case when jsonb_array_length(v_saved)=3
   then 'practice_completed_pending_review' else 'in_progress' end,
  'review_status','not_auto_graded');
end $$;

create or replace function public.lex_level_one_submit(
 p_course text,p_item_id text,p_answer text)
returns jsonb language plpgsql security definer
set search_path='' as $$
declare v_uid uuid; v_view jsonb; v_allowed boolean;
begin
 v_uid:=public.lex_require_student(p_course);
 v_view:=public.lex_level_one_open(p_course);
 if (v_view->>'allowed') is distinct from 'true' then
  raise exception 'level_one_not_released' using errcode='42501';
 end if;
 if p_item_id is null or not exists(
   select 1 from jsonb_array_elements(v_view->'tasks') t
   where t->>'id'=p_item_id) then
   raise exception 'item_not_authorized_for_this_level' using errcode='42501';
 end if;
 if length(trim(coalesce(p_answer,'')))<4 or length(p_answer)>12000 then
   raise exception 'invalid_essay_answer' using errcode='22023';
 end if;
 insert into public.student_level_responses
   (user_id,course_id,level_number,item_id,answer_text)
 values (v_uid,p_course,1,p_item_id,trim(p_answer))
 on conflict (user_id,course_id,level_number,item_id) do nothing;
 -- Idempotent: the original answer remains authoritative after retry/double click.
 return public.lex_level_one_open(p_course);
end $$;

revoke all on function public.lex_level_one_open(text) from public,anon;
revoke all on function public.lex_level_one_submit(text,text,text) from public,anon;
grant execute on function public.lex_level_one_open(text) to authenticated;
grant execute on function public.lex_level_one_submit(text,text,text) to authenticated;
commit;
