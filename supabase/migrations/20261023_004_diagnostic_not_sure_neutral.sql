-- New diagnostic records do not treat one missing application answer as a weak skill.
-- Historical student result remains unchanged; future study instrument must be reviewed.
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
     and i.metadata->>'legal_approval'='true' and i.metadata->>'learning_approval'='true';
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
  when 'balanced' then jsonb_build_object('mode',v_type,'weakest','foundation',
     'firstTasks',jsonb_build_array('supported_rule','one_fact','retrieval_check'),
     'reason_ar','الأدلة الموضوعية غير كافية لترتيب قدراتك؛ سنوزع التدريب بالتوازن ونكرر القياس.',
     'reason_en','There is not yet sufficient evidence to rank skills; practise them evenly and reassess.')
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
   'measurement_quality','exploratory_small_sample_not_skill_ranking',
   'application_observation',case when application_n=0 then 'unmeasured_not_sure_or_skipped' else 'one_question_only' end,
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
revoke all on function public.lex_diagnostic_complete(text,jsonb,text) from public,anon;
grant execute on function public.lex_diagnostic_complete(text,jsonb,text) to authenticated;
