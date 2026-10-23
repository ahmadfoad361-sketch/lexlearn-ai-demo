-- Pilot P0: lexical rubric scores are unvalidated and must not determine learning priority.
-- Existing frozen task selections are preserved; only future task ordering changes.
create or replace function public.lex_training_session_open(p_course text,p_session integer)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid; overview jsonb; v_next integer; v_mode text; v_weak text;
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
 select training_plan->>'mode' into v_mode
 from public.student_diagnostic_runs where user_id=uid and course_id=p_course;
 -- Lexical rubric coverage cannot establish the student's weakest skill.
 -- Rotate through all three learning dimensions until reviewed measures exist.
 v_weak:=case mod(p_session-1,3)
  when 0 then 'recall' when 1 then 'understanding' else 'exam_execution' end;
 v_dims:=case v_weak
   when 'recall' then array['recall','understanding','exam_execution']
   when 'understanding' then array['understanding','exam_execution','recall']
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
   'sources',to_jsonb(v_row.source_ids)));
 end loop;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('item_id',item_id,'dimension',dimension,
   'answer_text',answer_text,'evaluation',evaluation,'submitted_at',submitted_at)
   order by submitted_at),'[]'::jsonb) into v_saved
 from public.student_training_answers where user_id=uid and course_id=p_course and session_number=p_session;
 return jsonb_build_object('allowed',true,'session',p_session,'checkpoint',p_session%5=0,
   'tasks',v_tasks,'saved',v_saved,'completed',jsonb_array_length(v_saved)=v_count,
   'weakest',v_weak,'skill_priority_status','unverified_balanced_rotation','initial_plan',v_mode,'is_current',p_session=v_next,
   'next_session',v_next,'score_notice','provisional_rule_coverage_not_model_semantic_accuracy',
   'academic_certified',false);
end $$;
revoke all on function public.lex_training_session_open(text,integer) from public,anon;
grant execute on function public.lex_training_session_open(text,integer) to authenticated;
