-- PROPOSAL ONLY: additive continuity correction for founder-internal student practice.
-- Do not apply to live Supabase without staged auth/RLS + academic / pilot review.
-- The only score source here is low-confidence textual rubric coverage, NOT a university mark.
begin;
create or replace function public.lex_skill_policy(p_recall numeric,p_understanding numeric,p_rn integer,p_un integer)
returns jsonb language plpgsql immutable set search_path='' as $$
declare gap numeric; ag numeric; uncertainty numeric; reliability numeric; share integer;
 v_mode text:='balanced'; target text:=null; source text:=null;
begin
 if p_recall is null or p_understanding is null or p_rn<1 or p_un<1 then
  return jsonb_build_object('version','skill-policy-v1','mode','measurement_needed',
   'target',null,'bridgeFrom',null,'gap',null,'confidence','insufficient',
   'indicators',jsonb_build_object('recall',p_recall,'understanding',p_understanding),
   'allocation',jsonb_build_object('recall',50,'understanding',50),
   'provisional',true,'mastery',false);
 end if;
 if p_recall<0 or p_recall>100 or p_understanding<0 or p_understanding>100 then
  raise exception 'out_of_range_skill_indicator';
 end if;
 gap:=p_recall-p_understanding;ag:=abs(gap);
 uncertainty:=greatest(5,round(32/sqrt(greatest(1,p_rn)::numeric)+32/sqrt(greatest(1,p_un)::numeric)));
 reliability:=least(1,sqrt(least(p_rn,p_un)::numeric/12));
 if p_recall<40 and p_understanding<40 then v_mode:='foundations';
 elsif p_recall>=85 and p_understanding>=85 then v_mode:='consolidation';
 elsif least(p_rn,p_un)>=6 and ag>uncertainty+25 then
  v_mode:='provisional_bridge';
  target:=case when gap>0 then 'understanding' else 'recall' end;
  source:=case when gap>0 then 'recall' else 'understanding' end;
 end if;
 share:=least(60,round(50+35*(1-exp(-2.5*greatest(0,ag-uncertainty)/100*reliability))));
 return jsonb_build_object('version','skill-policy-v1','mode',v_mode,'target',target,
  'bridgeFrom',source,'gap',round(gap,2),'uncertaintyPoints',uncertainty,
  'confidence','provisional','provisional',true,'mastery',false,
  'indicators',jsonb_build_object('recall',p_recall,'understanding',p_understanding),
  'allocation',jsonb_build_object('recall',case when v_mode<>'provisional_bridge' then 50 when target='recall' then share else 100-share end,
          'understanding',case when v_mode<>'provisional_bridge' then 50 when target='understanding' then share else 100-share end));
end $$;
revoke all on function public.lex_skill_policy(numeric,numeric,integer,integer) from public,anon;
grant execute on function public.lex_skill_policy(numeric,numeric,integer,integer) to authenticated;

create or replace function public.lex_skill_instruction(p_policy jsonb,p_initial_mode text,p_dimension text,p_lang text)
returns text language plpgsql immutable set search_path='' as $$
declare mode text:=coalesce(p_policy->>'mode','measurement_needed');
  strong text:=p_policy->>'bridgeFrom';
begin
 if mode='foundations' then
  return case when p_lang='en' then
   'Start with a worked example; identify the rule, explain its meaning, then solve a new case unaided.'
   else 'ابدأ بمثال محلول، وحدد القاعدة ومعناها، ثم طبّق على واقعة جديدة دون مساعدة.' end;
 elsif mode='consolidation' then
  return case when p_lang='en' then
   'Apply the rule to a new fact pattern, then retrieve its conditions after a delay.'
   else 'طبّق القاعدة على واقعة جديدة، ثم استرجع شروطها بعد فترة.' end;
 elsif mode='provisional_bridge' and strong='recall' then
  return case when p_lang='en' then
   'Start with a rule you can recall; explain why each condition matters, then change one fact.'
   else 'ابدأ بالقاعدة التي تتذكرها؛ علّل أثر كل شرط، ثم غيّر واقعة واحدة.' end;
 elsif mode='provisional_bridge' and strong='understanding' then
  return case when p_lang='en' then
   'Start from the meaning; build retrieval cues, hide the rule, and reconstruct it unaided.'
   else 'ابدأ بالمعنى الذي تفهمه، واصنع مفاتيح تذكّر، ثم أعد بناء القاعدة دون النظر إليها.' end;
 elsif mode='measurement_needed' and p_initial_mode='recall-led' then
  return case when p_lang='en' then
   'Rule recognition was stronger than explanation. Start from the recognized rule and explain why; unaided recall remains unmeasured.'
   else 'ظهر التعرّف على القاعدة أقوى من تفسيرها؛ اشرح الأسباب انطلاقًا من القاعدة، مع بقاء الحفظ الحر غير مقاس.' end;
 elsif mode='measurement_needed' and p_initial_mode='understanding-led' then
  return case when p_lang='en' then
   'Objective explanation was stronger. Use brief meaning-linked memory cues, then retrieve unaided; this does not establish a recall percentage.'
   else 'ظهر التفسير أقوى من التعرّف؛ استخدم مفاتيح مرتبطة بالمعنى ثم استرجع القاعدة دون مساعدة، دون افتراض نسبة حفظ.' end;
 else
  return case when p_lang='en' then
   'Explain the rule in your own words, retrieve it unaided, and revisit both skills after practice.'
   else 'اشرح القاعدة بأسلوبك، ثم استرجعها دون مساعدة، وأعد قياس المهارتين بعد التدريب.' end;
 end if;
end $$;
revoke all on function public.lex_skill_instruction(jsonb,text,text,text) from public,anon;
grant execute on function public.lex_skill_instruction(jsonb,text,text,text) to authenticated;

-- Official diagnostic: low-low objective evidence opens foundational activity, NOT a false recall %.
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
   if recog<40 and und<40 then v_type:='foundations';
    elsif recog-und>=25 then v_type:='recall-led';
   elsif und-recog>=25 then v_type:='understanding-led';
   else v_type:='balanced';end if;
 end if;
 v_plan:=case v_type
  when 'foundations' then jsonb_build_object('mode','foundation','weakest','foundation',
      'firstTasks',jsonb_build_array('worked_example','supported_decision','unaided_check'),
      'reason_ar','أظهرت الأسئلة الموضوعية حاجة إلى تأسيس التعرف على القاعدة والفهم معًا؛ لا نستنتج نسبة حفظ حر.',
      'reason_en','Both objective rule recognition and explanation need foundational practice; free recall has not been inferred.')
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

-- Official training: include per-task guided practice and recalculated provisional policy.
create or replace function public.lex_training_session_open(p_course text,p_session integer)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid; overview jsonb; v_next integer; v_mode text; v_weak text;
 v_policy jsonb; v_r numeric; v_u numeric; v_nr integer; v_nu integer;
 v_dims text[]; v_dim text; v_session integer; v_id text; v_i integer; v_count integer;
 v_row public.content_items%rowtype; v_tasks jsonb:='[]'::jsonb; v_saved jsonb:='[]'::jsonb; v_fixed jsonb;
 v_avg numeric; v_grade numeric; v_n integer;
begin
 uid:=public.lex_require_student(p_course);
 if p_course<>'qa-qu-lawc101-rights' or p_session is null or p_session<1 or p_session>30 then
  raise exception 'invalid_course_or_session' using errcode='22023';end if;
 overview:=public.lex_training_overview(p_course);
 if overview->>'allowed'<>'true' then
   return jsonb_build_object('allowed',false,'reason','diagnostic_not_completed','tasks','[]'::jsonb,'saved','[]'::jsonb);end if;
 v_next:=(overview->>'unlocked')::integer;
 if p_session>v_next then
   return jsonb_build_object('allowed',false,'reason','previous_session_not_completed','next_session',v_next,'tasks','[]'::jsonb,'saved','[]'::jsonb);
 end if;
 if not exists(select 1 from public.student_level_releases where course_id=p_course
   and level_number=p_session and published and (academic_approved or founder_pilot_approved)) then
   return jsonb_build_object('allowed',false,'reason','content_not_released','tasks','[]'::jsonb,'saved','[]'::jsonb);
 end if;
 select training_plan->>'mode',nullif(result#>>'{measurements,recall,internal_grade,provisional_percent}','')::numeric
   into v_mode,v_grade
 from public.student_diagnostic_runs where user_id=uid and course_id=p_course;
 -- Calculate a continuously graded, explicitly PROVISIONAL practice policy from recent data.
 select avg((evaluation->>'provisional_percent')::numeric) filter(where dimension='recall'),
        avg((evaluation->>'provisional_percent')::numeric) filter(where dimension='understanding'),
        count(*) filter(where dimension='recall'),
        count(*) filter(where dimension='understanding')
 into v_r,v_u,v_nr,v_nu
 from (select dimension,evaluation from public.student_training_answers
       where user_id=uid and course_id=p_course and evaluation->>'status'='preliminary_internal'
         and evaluation->>'provisional_percent' is not null
       order by submitted_at desc limit 24) evidence;
 v_policy:=public.lex_skill_policy(v_r,v_u,coalesce(v_nr,0),coalesce(v_nu,0));
 -- Individualise priority using the most recently recorded provisional skill scores.
 select dimension,avg((evaluation->>'provisional_percent')::numeric),count(*) into v_weak,v_avg,v_n
 from (select dimension,evaluation from public.student_training_answers where user_id=uid and course_id=p_course
       and evaluation->>'status'='preliminary_internal' and evaluation->>'provisional_percent' is not null
       order by submitted_at desc limit 15) recent
 group by dimension order by avg((evaluation->>'provisional_percent')::numeric) asc,count(*) desc limit 1;
 if v_weak is null then
   v_weak:=case when v_grade is not null and v_grade<50 then 'recall'
                 when v_mode='recall-led' then 'understanding'
                 when v_mode='understanding-led' then 'recall'
                 when v_mode='balanced' then 'exam_execution'
                 else 'understanding' end;
 end if;
 -- Use the cautious bridge only after sufficient repeated observations.
 if v_policy->>'mode'='provisional_bridge' then v_weak:=v_policy->>'target';end if;
 if v_policy->>'mode'='foundations' then v_weak:='foundation';end if;
 v_dims:=case v_weak
   when 'recall' then array['recall','understanding','exam_execution']
   when 'understanding' then array['understanding','exam_execution','recall']
   when 'foundation' then array['understanding','recall','exam_execution']
   else array['exam_execution','understanding','recall'] end;
 v_count:=case when p_session%5=0 then 4 else 3 end;
 -- Once the first answer is submitted, freeze the selected tasks for this student.
 -- Never allow subsequent adaptive updates to change required task identities midway.
 select tasks_json into v_fixed from public.student_training_sessions
 where user_id=uid and course_id=p_course and session_number=p_session;
 if jsonb_typeof(v_fixed)='array' and jsonb_array_length(v_fixed)=v_count then
  v_tasks:=v_fixed;
 else
 for v_i in 1..v_count loop
  if p_session%5=0 then
   -- Six review checkpoints (5/10/.../30) each revisit the four preceding topics.
   v_session:=p_session-5+v_i;
   v_dim:=v_dims[((v_i-1)%3)+1];
  else
   v_session:=p_session;v_dim:=v_dims[v_i];
  end if;
  v_id:='rights-v1-s'||v_session||'-'||case when v_dim='exam_execution' then 'exam' else v_dim end;
  select * into v_row from public.content_items where id=v_id and course_id=p_course
    and item_type='essay' and metadata->>'owner_pilot_approved'='true'
    and cardinality(source_ids)>0 and length(prompt_ar)>20
    and length(rubric_json->>'prompt_en')>20;
  if not found then return jsonb_build_object('allowed',false,'reason','incomplete_reviewed_bank',
   'session',p_session,'missing',v_id,'tasks','[]'::jsonb,'saved','[]'::jsonb);end if;
  v_tasks:=v_tasks||jsonb_build_array(jsonb_build_object('id',v_id,'dimension',v_dim,
   'session_topic',v_session,'prompt_ar',v_row.prompt_ar,'prompt_en',v_row.rubric_json->>'prompt_en',
   'title_ar',v_row.rubric_json->>'topic_title_ar','title_en',v_row.rubric_json->>'topic_title_en',
   'instruction_ar',public.lex_skill_instruction(v_policy,v_mode,v_dim,'ar'),
   'instruction_en',public.lex_skill_instruction(v_policy,v_mode,v_dim,'en'),
   'sources',to_jsonb(v_row.source_ids)));
 end loop;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('item_id',item_id,'dimension',dimension,
   'answer_text',answer_text,'evaluation',evaluation,'submitted_at',submitted_at)
   order by submitted_at),'[]'::jsonb) into v_saved
 from public.student_training_answers where user_id=uid and course_id=p_course and session_number=p_session;
 return jsonb_build_object('allowed',true,'session',p_session,'checkpoint',p_session%5=0,
   'tasks',v_tasks,'saved',v_saved,'completed',jsonb_array_length(v_saved)=v_count,
   'weakest',v_weak,'initial_plan',v_mode,'skill_policy',v_policy,'is_current',p_session=v_next,
   'next_session',v_next,'score_notice','provisional_rule_coverage_not_model_semantic_accuracy',
   'academic_certified',false);
end $$;


commit;
