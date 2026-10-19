-- Owner-authorized internal LexLearn pilot, NOT independent academic accreditation.
-- Reviewed against Qatar Al Meezan Law 22/2004 Articles 39/40/49/50/62/63.
-- Distinct independent legal and educational reviewer slots are intentionally unfilled.
begin;
alter table public.student_level_releases add column if not exists founder_pilot_approved boolean not null default false;
alter table public.student_level_releases drop constraint if exists student_level_releases_check;
alter table public.student_level_releases add constraint student_level_releases_check
 check (not published or (approved_by is not null and reviewed_at is not null
  and (academic_approved or (founder_pilot_approved and level_number=1 and course_id='qa-qu-lawc101-rights'))));
insert into public.content_items
 (id,course_id,unit_id,concept_id,dimension,difficulty,item_type,prompt_ar,options_json,answer_key_json,rubric_json,source_ids,exam_frequency_tag,exam_importance_weight,status,version,metadata)
 values
('lexdiag-v2-q39r','qa-qu-lawc101-rights','week-1','topic-1','observation',2,'mcq','متى تبدأ الشخصية القانونية للإنسان كأصل وفق المادة 39؟','{"ar":["بتمام ولادته حيًا","عند إتمام السابعة","عند تمام 18 سنة"],"en":["Upon live birth","At age seven","At age eighteen"]}'::jsonb,'{"correct_index":0}'::jsonb,'{"prompt_en":"When does legal personality begin as a general rule under Article 39?","rubric_version":"lexdiagnostic-objective-v2"}'::jsonb,ARRAY['qa-civil-2004-art39']::text[],'unknown',0.5,'approved',2,'{"official_diagnostic_v2_id":"q39r","owner_pilot_approved":true,"pilot_review_mode":"founder_authorized_ai_assisted_20261019","legal_approval":false,"learning_approval":false,"approval_scope":"LexLearn internal pilot; no independent university review","source_check":"https://www.almeezan.qa/LawView.aspx?LawID=2559&language=ar"}'::jsonb),
('lexdiag-v2-q49r','qa-qu-lawc101-rights','week-1','topic-1','observation',2,'mcq','ما سن الرشد كأصل وفق المادة 49؟','{"ar":["21 سنة","18 سنة كاملة","7 سنوات"],"en":["Twenty-one","Eighteen full years","Seven"]}'::jsonb,'{"correct_index":1}'::jsonb,'{"prompt_en":"What is the general age of majority under Article 49?","rubric_version":"lexdiagnostic-objective-v2"}'::jsonb,ARRAY['qa-civil-2004-art49']::text[],'unknown',0.5,'approved',2,'{"official_diagnostic_v2_id":"q49r","owner_pilot_approved":true,"pilot_review_mode":"founder_authorized_ai_assisted_20261019","legal_approval":false,"learning_approval":false,"approval_scope":"LexLearn internal pilot; no independent university review","source_check":"https://www.almeezan.qa/LawView.aspx?LawID=2559&language=ar"}'::jsonb),
('lexdiag-v2-q62r','qa-qu-lawc101-rights','week-1','topic-1','observation',2,'mcq','أي عبارة أقرب إلى قاعدة المادة 62؟','{"ar":["كل ضرر يوجب التعويض","كل استعمال للحق ممنوع","الاستعمال المشروع لا يرتب المسؤولية لمجرد الضرر"],"en":["Every harm requires compensation","Every exercise of a right is forbidden","Lawful exercise does not create liability merely because harm occurs"]}'::jsonb,'{"correct_index":2}'::jsonb,'{"prompt_en":"Which statement best reflects Article 62?","rubric_version":"lexdiagnostic-objective-v2"}'::jsonb,ARRAY['qa-civil-2004-art62']::text[],'unknown',0.5,'approved',2,'{"official_diagnostic_v2_id":"q62r","owner_pilot_approved":true,"pilot_review_mode":"founder_authorized_ai_assisted_20261019","legal_approval":false,"learning_approval":false,"approval_scope":"LexLearn internal pilot; no independent university review","source_check":"https://www.almeezan.qa/LawView.aspx?LawID=2559&language=ar"}'::jsonb),
('lexdiag-v2-q39u','qa-qu-lawc101-rights','week-1','topic-1','understanding',2,'mcq','وُلد طفل حيًا ثم توفي بعد ساعات. ما التفسير الأدق؟','{"ar":["لم تثبت له شخصية قانونية","ثبتت له الشخصية عند الولادة وانتهت بالوفاة","تبدأ الشخصية عند الرشد"],"en":["No legal personality arose","Personality began at live birth and ended at death","Personality begins at majority"]}'::jsonb,'{"correct_index":1}'::jsonb,'{"prompt_en":"A child was born alive and died hours later. Which explanation is most accurate?","rubric_version":"lexdiagnostic-objective-v2"}'::jsonb,ARRAY['qa-civil-2004-art39']::text[],'unknown',0.5,'approved',2,'{"official_diagnostic_v2_id":"q39u","owner_pilot_approved":true,"pilot_review_mode":"founder_authorized_ai_assisted_20261019","legal_approval":false,"learning_approval":false,"approval_scope":"LexLearn internal pilot; no independent university review","source_check":"https://www.almeezan.qa/LawView.aspx?LawID=2559&language=ar"}'::jsonb),
('lexdiag-v2-q50u','qa-qu-lawc101-rights','week-1','topic-1','understanding',2,'mcq','طفل عمره ست سنوات يملك مالًا ويحاول إبرام تصرف قانوني بنفسه. أي تفسير قانوني أدق؟','{"ar":["له أهلية الأداء الكاملة لأنه يملك مالًا","لا يكون أهلًا لأداء التصرفات القانونية لكونه عديم التمييز، وإن أمكن أن تثبت له حقوق","لا تثبت له شخصية قانونية حتى يبلغ السابعة"],"en":["Owning property gives him full capacity to act","He lacks capacity to enter legal acts because he is below the age of discernment, though rights may vest in him","He has no legal personality until age seven"]}'::jsonb,'{"correct_index":1}'::jsonb,'{"prompt_en":"A six-year-old owns property and attempts to enter a legal transaction alone. Which explanation is legally sound?","rubric_version":"lexdiagnostic-objective-v2"}'::jsonb,ARRAY['qa-civil-2004-art39','qa-civil-2004-art50']::text[],'unknown',0.5,'approved',2,'{"official_diagnostic_v2_id":"q50u","owner_pilot_approved":true,"pilot_review_mode":"founder_authorized_ai_assisted_20261019","legal_approval":false,"learning_approval":false,"approval_scope":"LexLearn internal pilot; no independent university review","source_check":"https://www.almeezan.qa/LawView.aspx?LawID=2559&language=ar"}'::jsonb),
('lexdiag-v2-q63a','qa-qu-lawc101-rights','week-1','topic-1','application',2,'mcq','يستعمل شخص حقًا بهدف الإضرار بالغير وحده. ما التكييف الأقرب؟','{"ar":["يكون مشروعًا دائمًا","يكفي وجود الحق لاستبعاد التعسف","يكون استعمالًا غير مشروع للحق لانفراد قصد الإضرار"],"en":["Always lawful","Having a right always excludes abuse","It is an unlawful exercise of the right because causing harm was the sole aim"]}'::jsonb,'{"correct_index":2}'::jsonb,'{"prompt_en":"Someone exercises a right solely to harm another. What is the closest legal classification?","rubric_version":"lexdiagnostic-objective-v2"}'::jsonb,ARRAY['qa-civil-2004-art63']::text[],'unknown',0.5,'approved',2,'{"official_diagnostic_v2_id":"q63a","owner_pilot_approved":true,"pilot_review_mode":"founder_authorized_ai_assisted_20261019","legal_approval":false,"learning_approval":false,"approval_scope":"LexLearn internal pilot; no independent university review","source_check":"https://www.almeezan.qa/LawView.aspx?LawID=2559&language=ar"}'::jsonb)
on conflict (id) do nothing;
update public.content_items set
 status='approved',
 metadata=metadata||'{"owner_pilot_approved":true,"pilot_review_mode":"founder_authorized_ai_assisted_20261019","legal_approval":false,"learning_approval":false,"approval_scope":"LexLearn internal pilot only; no independent university endorsement"}'::jsonb,
 updated_at=now()
where course_id='qa-qu-lawc101-rights' and unit_id='week-1' and concept_id='topic-1'
 and id in ('rights-v1-s1-recall','rights-v1-s1-understanding','rights-v1-s1-exam')
 and status='legal_review' and legal_reviewer is null and learning_reviewer is null;
do $pilot$
declare v_owner uuid; v_q integer; v_l integer;
begin
 select id into strict v_owner from public.profiles where role='owner' and active=true;
 select count(*) into v_q from public.content_items
 where course_id='qa-qu-lawc101-rights'
 and metadata->>'official_diagnostic_v2_id' in ('q39r','q49r','q62r','q39u','q50u','q63a')
 and status='approved' and metadata->>'pilot_review_mode'='founder_authorized_ai_assisted_20261019';
 select count(*) into v_l from public.content_items
 where course_id='qa-qu-lawc101-rights'
 and id in ('rights-v1-s1-recall','rights-v1-s1-understanding','rights-v1-s1-exam')
 and status='approved' and metadata->>'pilot_review_mode'='founder_authorized_ai_assisted_20261019';
 if v_q<>6 or v_l<>3 then raise exception 'pilot review set incomplete: %, %',v_q,v_l;end if;
 insert into public.student_level_releases(course_id,level_number,academic_approved,founder_pilot_approved,published,approved_by,reviewed_at)
 values('qa-qu-lawc101-rights',1,false,true,true,v_owner,now())
 on conflict(course_id,level_number) do update
 set founder_pilot_approved=true,published=true,approved_by=excluded.approved_by,reviewed_at=excluded.reviewed_at;
end $pilot$;
create or replace function public.lex_diagnostic_bank_ready(p_course text)
returns boolean language sql stable security definer set search_path='' as $$
select p_course='qa-qu-lawc101-rights' and count(*)=6
 and count(distinct i.metadata->>'official_diagnostic_v2_id')=6
 and coalesce(bool_and(i.status='approved'
  and (i.answer_key_json->>'correct_index') ~ '^[012]$'
  and jsonb_typeof(i.options_json->'ar')='array'
  and jsonb_typeof(i.options_json->'en')='array'
  and jsonb_array_length(i.options_json->'ar')=3
  and jsonb_array_length(i.options_json->'en')=3
  and length(i.prompt_ar)>20 and length(i.rubric_json->>'prompt_en')>20
  and cardinality(i.source_ids)>0
  and ((i.reviewed_at is not null and i.legal_reviewer is not null and i.learning_reviewer is not null
    and i.legal_reviewer<>i.learning_reviewer
    and i.metadata->>'legal_approval'='true' and i.metadata->>'learning_approval'='true')
    or (i.metadata->>'owner_pilot_approved'='true'
      and i.metadata->>'pilot_review_mode'='founder_authorized_ai_assisted_20261019'
      and i.metadata->>'legal_approval'='false' and i.metadata->>'learning_approval'='false'))),false)
from public.content_items i
where i.course_id=p_course
 and i.metadata->>'official_diagnostic_v2_id' in ('q39r','q49r','q62r','q39u','q50u','q63a');
$$;
create or replace function public.lex_diagnostic_complete(p_course text,p_answers jsonb,p_free_text text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid; d public.student_diagnostic_runs%rowtype;
  v_ids text[]:=array['q39r','q49r','q62r','q39u','q50u','q63a'];
  v_id text; v_pick integer; v_item public.content_items%rowtype; v_answer jsonb; v_rows jsonb:='[]'::jsonb;
  recog_n integer:=0; recog_ok integer:=0; understanding_n integer:=0; understanding_ok integer:=0;
  application_n integer:=0; application_ok integer:=0;
  recog numeric; und numeric; app numeric; v_type text; v_plan jsonb; v_metrics jsonb; v_result jsonb;
  v_attempt uuid; v_completed_at timestamptz:=now();
begin
 v_uid:=public.lex_require_student(p_course);
 select * into d from public.student_diagnostic_runs where user_id=v_uid and course_id=p_course for update;
 if not found then raise exception 'diagnostic_not_started' using errcode='42501';end if;
 if d.status='completed' then return public.lex_diagnostic_status(p_course);end if;
 if not public.lex_diagnostic_bank_ready(p_course) then
   raise exception 'diagnostic_academic_approval_pending' using errcode='42501';end if;
 if jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)<>6 or length(coalesce(p_free_text,''))>2000 then
   raise exception 'invalid_diagnostic_submission' using errcode='22023';end if;
 foreach v_id in array v_ids loop
   if (select count(*) from jsonb_array_elements(p_answers) a where a->>'question_id'=v_id)<>1 then
     raise exception 'missing_or_duplicate_question' using errcode='22023';end if;
   select * into v_item from public.content_items i where i.course_id=p_course
     and i.metadata->>'official_diagnostic_v2_id'=v_id and i.status='approved'
     and ((i.metadata->>'legal_approval'='true' and i.metadata->>'learning_approval'='true'
           and i.legal_reviewer is not null and i.learning_reviewer is not null
           and i.legal_reviewer<>i.learning_reviewer)
          or (p_course='qa-qu-lawc101-rights' and i.metadata->>'owner_pilot_approved'='true'
              and i.metadata->>'pilot_review_mode'='founder_authorized_ai_assisted_20261019'));
   if not found then raise exception 'question_not_approved' using errcode='42501';end if;
   select value into v_answer from jsonb_array_elements(p_answers) where value->>'question_id'=v_id;
   if jsonb_typeof(v_answer->'selected')<>'number' or (v_answer->>'selected') !~ '^(-1|0|1|2)$' then
      raise exception 'invalid_selection' using errcode='22023';end if;
   v_pick:=(v_answer->>'selected')::integer;
   v_rows:=v_rows||jsonb_build_array(jsonb_build_object(
      'question_id',v_id,'selected',v_pick,'measured',v_pick>=0,
      'correct',case when v_pick>=0 then v_pick=(v_item.answer_key_json->>'correct_index')::int else null end));
   if v_pick>=0 then
     if v_id=any(array['q39r','q49r','q62r']) then
       recog_n:=recog_n+1;if v_pick=(v_item.answer_key_json->>'correct_index')::int then recog_ok:=recog_ok+1;end if;
     elsif v_id=any(array['q39u','q50u']) then
       understanding_n:=understanding_n+1;if v_pick=(v_item.answer_key_json->>'correct_index')::int then understanding_ok:=understanding_ok+1;end if;
     else application_n:=application_n+1;
       if v_pick=(v_item.answer_key_json->>'correct_index')::int then application_ok:=application_ok+1;end if;
     end if;
   end if;
 end loop;
 recog:=case when recog_n>0 then round(100.0*recog_ok/recog_n) else null end;
 und:=case when understanding_n>0 then round(100.0*understanding_ok/understanding_n) else null end;
 app:=case when application_n>0 then round(100.0*application_ok/application_n) else null end;
 v_type:='insufficient_evidence';
 if recog_n>=2 and understanding_n>=2 then
   if recog-und>=25 then v_type:='recall-led';
   elsif und-recog>=25 then v_type:='understanding-led';
   else v_type:='balanced';end if;
 end if;
 v_plan:=case v_type
  when 'recall-led' then jsonb_build_object('mode',v_type,'weakest','understanding',
     'firstTasks',jsonb_build_array('explain_rule','change_one_fact','supported_retrieval'),
     'reason_ar','التعرف الموضوعي أقوى من التفسير؛ نبدأ بشرح القاعدة وتغيير الواقعة. الحفظ الحر غير مقاس.',
     'reason_en','Rule recognition exceeded explanatory understanding. Unaided recall is not measured.')
  when 'understanding-led' then jsonb_build_object('mode',v_type,'weakest','recall',
     'firstTasks',jsonb_build_array('memory_cues','reconstruct','delayed_retrieval'),
     'reason_ar','الفهم الموضوعي أقوى من التعرف؛ نبدأ بمفاتيح الاسترجاع مع بقاء الحفظ الحر غير محسوم.',
     'reason_en','Objective understanding exceeded recognition; free recall remains ungraded.')
  when 'balanced' then jsonb_build_object('mode',v_type,'weakest','application',
     'firstTasks',jsonb_build_array('supported_rule','one_fact','retrieval_check'),
     'reason_ar','الأدلة الموضوعية متقاربة؛ نبدأ بخطة متوازنة ونعيد القياس.',
     'reason_en','The available objective indicators are similar; start balanced practice.')
  else jsonb_build_object('mode','foundation','weakest','foundation',
     'firstTasks',jsonb_build_array('worked_example','supported_decision','unaided_check'),
     'reason_ar','لا توجد أدلة كافية للحكم؛ نبدأ بتأسيس دون افتراض درجة صفر.',
     'reason_en','Insufficient comparable evidence; begin with a supported foundation.')
 end;
 v_metrics:=jsonb_build_object('recall',null,'recognition',recog,'understanding',und,
 'application',app,'legal_precision',null,'exam',null,'retention',null);
 v_result:=jsonb_build_object('version',2,'source','server_finalized_diagnostic',
   'student_id',v_uid,'course_id',p_course,'attempt_id',d.attempt_id,
   'completed_at',v_completed_at,'rubric_version','lexdiagnostic-objective-v2',
   'metrics',v_metrics,'profileType',v_type,
   'measurements',jsonb_build_object(
     'recall',jsonb_build_object('value',null,'status',case when length(trim(coalesce(p_free_text,'')))>0 then 'pending_human_review' else 'not_measured' end,'method','human_review_required'),
     'recognition',jsonb_build_object('value',recog,'item_count',recog_n,'status',case when recog is null then 'not_measured' else 'provisional_objective' end),
     'understanding',jsonb_build_object('value',und,'item_count',understanding_n,'status',case when und is null then 'not_measured' else 'provisional_objective' end),
     'application',jsonb_build_object('value',app,'item_count',application_n,'status',case when app is null then 'not_measured' else 'provisional_objective' end)),
   'answers',v_rows,'review_status',case when length(trim(coalesce(p_free_text,'')))>0 then 'pending_human_review' else 'not_requested' end,
   'trainingPlan',v_plan);
 update public.student_diagnostic_runs
 set status='completed',draft='[]'::jsonb,answers=v_rows,free_text=coalesce(p_free_text,''),
     result=v_result,training_plan=v_plan,completed_at=v_completed_at,updated_at=now()
 where user_id=v_uid and course_id=p_course;
 return public.lex_diagnostic_status(p_course);
end $$;
create or replace function public.lex_level_access(p_course text,p_level integer)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_uid uuid; v_status text; v_open boolean; v_prev boolean;
begin
 v_uid:=public.lex_require_student(p_course);
 if p_level is null or p_level<1 or p_level>30 then
   raise exception 'invalid_level' using errcode='22023';end if;
 select d.status into v_status from public.student_diagnostic_runs d where d.user_id=v_uid and d.course_id=p_course;
 if coalesce(v_status,'not_started')<>'completed' then
   return jsonb_build_object('allowed',false,'reason','diagnostic_not_completed','level',p_level);end if;
 select coalesce(r.published and (r.academic_approved or (p_level=1 and p_course='qa-qu-lawc101-rights' and r.founder_pilot_approved)),false) into v_open
 from public.student_level_releases r where r.course_id=p_course and r.level_number=p_level;
 if not coalesce(v_open,false) then
   return jsonb_build_object('allowed',false,'reason','academic_content_not_released','level',p_level);end if;
 if p_level>1 then
   select exists(select 1 from public.student_level_completions x
     where x.user_id=v_uid and x.course_id=p_course and x.level_number=p_level-1
     and x.verified_by is not null) into v_prev;
   if not v_prev then
     return jsonb_build_object('allowed',false,'reason','previous_level_not_verified','level',p_level);end if;
 end if;
 return jsonb_build_object('allowed',true,'reason','authorized','level',p_level);
end $$;
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
  and ((i.reviewed_at is not null and i.legal_reviewer is not null and i.learning_reviewer is not null
        and i.legal_reviewer<>i.learning_reviewer
        and i.metadata->>'legal_approval'='true' and i.metadata->>'learning_approval'='true')
       or (p_course='qa-qu-lawc101-rights' and i.metadata->>'owner_pilot_approved'='true'
           and i.metadata->>'pilot_review_mode'='founder_authorized_ai_assisted_20261019'))
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
do $verify$
begin
 if not public.lex_diagnostic_bank_ready('qa-qu-lawc101-rights') then
  raise exception 'pilot diagnostic bank failed final validation';end if;
 if not exists(select 1 from public.student_level_releases where course_id='qa-qu-lawc101-rights'
 and level_number=1 and founder_pilot_approved and published and not academic_approved) then
  raise exception 'founder-only release not present';end if;
 if exists(select 1 from public.content_items
 where course_id='qa-qu-lawc101-rights'
 and metadata->>'pilot_review_mode'='founder_authorized_ai_assisted_20261019'
 and (legal_reviewer is not null or learning_reviewer is not null or
      metadata->>'legal_approval'='true' or metadata->>'learning_approval'='true')) then
  raise exception 'pilot cannot impersonate dual reviewers';end if;
end $verify$;
commit;