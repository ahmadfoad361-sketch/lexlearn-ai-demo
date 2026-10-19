-- LexLearn: restore internally calculated preliminary percentage for free legal responses.
-- Applies to an independently approved Level-1 bank only; not deployed to production.
begin;
alter table public.student_level_responses add column if not exists evaluation jsonb;
-- Internal v1: deterministic and grounded in the approved Qatar Arts 39-40 topic-one rubric.
-- Percentage is *provisional legal-element assessment*, never university-certified semantic correctness.
-- No API/model dependency. Conservative contradiction detection refuses ambiguous legal claims.
create or replace function public.lex_internal_personality_grade(p_item text,p_answer text)
returns jsonb language plpgsql immutable set search_path='' as $$
declare
 t text:=regexp_replace(translate(lower(coalesce(p_answer,'')),'أإآىةؤئ','ااايهوي'),'[ًٌٍَُِّْـ]','','g');
 b boolean; d boolean; u boolean; correct boolean; links boolean;
 a boolean; r boolean; issue boolean; application boolean; outcome boolean; cues boolean; cue_links boolean;
 has_wrong boolean; denied_wrong boolean;
 met text[]:=array[]::text[]; missed text[]:=array[]::text[];
 pts integer:=0; maximum integer:=0; pct integer; reason text; label text;
begin
 if p_item not in ('diagnostic-legal-personality','rights-v1-s1-recall','rights-v1-s1-understanding','rights-v1-s1-exam')
 then return jsonb_build_object('status','needs_human_review','provisional_percent',null,'reason','unsupported_task');end if;
 if length(trim(t))<4 then
   return jsonb_build_object('status','needs_human_review','provisional_percent',null,'reason','empty_or_short');end if;
 -- Evaluate legal *relationships*, not merely answer length or the presence of a single keyword.
 b:=(t~'(تبدا|يبدا|بدايه).{0,80}(شخص|personality).{0,60}(ولاد|ولد|birth|born).{0,18}(حي|live|alive)'
   or t~'(شخص|personality).{0,50}(تبدا|بدايه|starts|begins).{0,55}(ولاد|ولد|birth|born).{0,18}(حي|live|alive)'
   or t~'(ولاد|ولد|birth|born).{0,18}(حي|live|alive).{0,50}(تبدا|بدايه|starts|begins).{0,38}(شخص|personality)'
   or t~'personality.{0,35}(begins|starts).{0,40}(live birth|born alive)'
   or t~'(live birth|born alive).{0,40}(begins|starts).{0,30}personality');
 d:=t~'(وفا|موت|death|died)' and t~'(تنتهي|نهايه|end|ends)'
   and t~'(شخص|personality)';
 u:=t~'(حمل|جنين|unborn|prenatal)' and t~'(حق|حقوق|rights?)'
   and t~'(شرط|مشروط|بشرط|conditional|depends|subject to)'
   and t~'(ولاد|ولد|born|birth)' and t~'(حي|live|alive)';
 a:=t~'(قبول|accept)' and t~'(لا يحتاج|لا تحتاج|لا تتطلب|بدون|دون|no acceptance|does not require|without|not require)';
 links:=t~'(لان|لذلك|حيث|اذا|بسبب|لأن|نتيجه|فان|because|therefore|since|thus|so that|if)';
 -- The examination's wrong comparison example is not treated as the learner's conclusion
 -- when explicitly identified as incorrect.
 has_wrong:=t~'((تبدا|يبدا).{0,30}الشخصيه.{0,30}(بالحمل|من الحمل|عند الحمل)|الشخصيه.{0,45}(تبدا|بدا).{0,30}(بالحمل|من الحمل|عند الحمل)|personality.{0,30}(starts|begins).{0,30}(conception|pregnancy)|الولاده.{0,30}تنهي.{0,20}الشخصيه|birth ends personality|الحمل.{0,35}كامل.{0,20}اهليه)';
 denied_wrong:=t~'(خطا|خاطئ|غير دقيق|غير صحيح|لا تبدا.{0,30}الحمل|incorrect|false|wrong|not true|does not begin at conception)';
 if has_wrong and not denied_wrong then
   return jsonb_build_object('status','needs_human_review','provisional_percent',null,
    'reason','possible_legal_contradiction','confidence','low',
    'warning_ar','قد تتضمن الإجابة استنتاجًا يخالف حكم الشخصية القانونية؛ يحتاج تدقيق المعنى.',
    'warning_en','The answer may assert a legally inconsistent conclusion; meaning requires review.',
    'method','internal_qatar_rights_rules_v1');
 end if;
 if p_item='diagnostic-legal-personality' then
   maximum:=1;
   if b then pts:=1;met:=array_append(met,'live_birth');
   else missed:=array_append(missed,'live_birth');end if;
 elsif p_item='rights-v1-s1-recall' then
   maximum:=8;
   cues:=t~'(مفتاح|مفاتيح|←|->|=>|cue|remember|key word|keyword)';
   cue_links:=cues and b and d and u;
   if b then pts:=pts+2;met:=array_append(met,'live_birth');else missed:=array_append(missed,'live_birth');end if;
   if d then pts:=pts+2;met:=array_append(met,'death_end');else missed:=array_append(missed,'death_end');end if;
   if u and a then pts:=pts+2;met:=array_append(met,'prenatal_conditional_rights');else missed:=array_append(missed,'prenatal_conditional_rights');end if;
   if cues then pts:=pts+1;met:=array_append(met,'memory_cues');else missed:=array_append(missed,'memory_cues');end if;
   if cue_links then pts:=pts+1;met:=array_append(met,'cues_with_meaning');else missed:=array_append(missed,'cues_with_meaning');end if;
 elsif p_item='rights-v1-s1-understanding' then
   maximum:=7;
   correct:=t~'(خطا|خاطئ|غير دقيق|غير صحيح|لا تبدا|ليس|الفرق|تمييز|incorrect|wrong|distinguish|not)'
     and t~'(حمل|unborn|prenatal|conception)' and b;
   if b and links then pts:=pts+2;met:=array_append(met,'explain_live_birth');else missed:=array_append(missed,'explain_live_birth');end if;
   if d and links then pts:=pts+2;met:=array_append(met,'explain_death');else missed:=array_append(missed,'explain_death');end if;
   if u and a and links then pts:=pts+2;met:=array_append(met,'explain_prenatal_condition');else missed:=array_append(missed,'explain_prenatal_condition');end if;
   if correct then pts:=pts+1;met:=array_append(met,'correct_wrong_comparison');else missed:=array_append(missed,'correct_wrong_comparison');end if;
 else
   maximum:=3;
   issue:=t~'(مسال|سؤال|issue|question)' and t~'(حق|حقوق|right|شرط|condition)';
   r:=u and a;
   application:=r and t~'(تمت|حصلت|تحققت|واقعه|الواقعه|ورد|وقع|occurred|facts|born alive)' and links;
   outcome:=t~'(تحقق|ثبت|استحق|met|satisfied|vest)' and t~'(شرط|حق|condition|right)'
      and not t~'(لم يتحقق|لا يثبت|was not met|not satisfied)';
   if r then pts:=pts+1;met:=array_append(met,'relevant_legal_rule');else missed:=array_append(missed,'relevant_legal_rule');end if;
   if application and issue then pts:=pts+1;met:=array_append(met,'connect_facts_to_rule');else missed:=array_append(missed,'connect_facts_to_rule');end if;
   if outcome then pts:=pts+1;met:=array_append(met,'direct_legal_conclusion');else missed:=array_append(missed,'direct_legal_conclusion');end if;
 end if;
 if p_item='diagnostic-legal-personality' and not b and length(regexp_replace(t,'[^ ]','','g'))<7 then
  return jsonb_build_object('status','needs_human_review','provisional_percent',null,
   'reason','insufficient_diagnostic_evidence','method','internal_qatar_rights_rules_v1');
 end if;
 pct:=round(100.0*pts/maximum)::integer;
 return jsonb_build_object('status','preliminary_internal','provisional_percent',pct,
  'grade_type','provisional_rule_coverage_not_final_legal_grade',
  'confidence',case when pts>=maximum-1 and b then 'medium' else 'low' end,
  'criteria_met',to_jsonb(met),'criteria_missing',to_jsonb(missed),
  'needs_human_review',true,'method','internal_qatar_rights_rules_v1',
  'source_scope',jsonb_build_array('qa-civil-2004-art39','qa-civil-2004-art40'),
  'warning_ar','النسبة تقييم آلي مبدئي لعناصر القاعدة والعلاقات القانونية، وليست درجة جامعية نهائية.',
  'warning_en','The percentage is a provisional internal legal-element assessment, not a final university grade.');
end $$;
revoke all on function public.lex_internal_personality_grade(text,text) from public,anon,authenticated;

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
 'review_status',r.review_status,'submitted_at',r.submitted_at,'evaluation',r.evaluation)),'[]'::jsonb)
 into v_saved
 from public.student_level_responses r
 where r.user_id=v_uid and r.course_id=p_course and r.level_number=1;
 return jsonb_build_object('allowed',true,'level',1,'plan_mode',v_mode,
  'reason_ar',v_plan->>'reason_ar','reason_en',v_plan->>'reason_en',
  'tasks',coalesce(v_tasks,'[]'::jsonb),'saved',v_saved,
  'status',case when jsonb_array_length(v_saved)=3
   then 'practice_completed_pending_review' else 'in_progress' end,
  'review_status','provisional_internal_grading');
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
   (user_id,course_id,level_number,item_id,answer_text,evaluation)
 values (v_uid,p_course,1,p_item_id,trim(p_answer),public.lex_internal_personality_grade(p_item_id,p_answer))
 on conflict (user_id,course_id,level_number,item_id) do nothing;
 -- Idempotent: the original answer remains authoritative after retry/double click.
 return public.lex_level_one_open(p_course);
end $$;


-- The optional free-recall response in the official diagnostic also gets an internal
-- provisional percentage when there is enough legally interpretable evidence.
-- Separate it from objective MCQs; never recast an unmeasured skill as a certified zero.
create or replace function public.lex_diagnostic_internal_assess(p_course text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid; d public.student_diagnostic_runs%rowtype;
  v_grade jsonb; v_old jsonb;
begin
 v_uid:=public.lex_require_student(p_course);
 select * into d from public.student_diagnostic_runs
  where user_id=v_uid and course_id=p_course for update;
 if not found or d.status<>'completed' then
  raise exception 'diagnostic_not_completed' using errcode='42501';
 end if;
 if length(trim(coalesce(d.free_text,'')))=0 then return public.lex_diagnostic_status(p_course);end if;
 if d.result #> '{measurements,recall,internal_grade}' is not null then
   return public.lex_diagnostic_status(p_course);
 end if;
 v_grade:=public.lex_internal_personality_grade('diagnostic-legal-personality',d.free_text);
 v_old:=coalesce(d.result #> '{measurements,recall}','{}'::jsonb);
 update public.student_diagnostic_runs
 set result=jsonb_set(d.result,'{measurements,recall}',v_old||
   jsonb_build_object('internal_grade',v_grade)),
   updated_at=now()
 where user_id=v_uid and course_id=p_course;
 return public.lex_diagnostic_status(p_course);
end $$;
revoke all on function public.lex_diagnostic_internal_assess(text) from public,anon;
grant execute on function public.lex_diagnostic_internal_assess(text) to authenticated;
commit;
