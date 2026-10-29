-- Recovery only: restore original production RPC recorded on 29 Oct 2026 before the hint/zero policy.
CREATE OR REPLACE FUNCTION public.lex_training_submit(p_course text, p_session integer, p_item_id text, p_answer text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid; stage jsonb; v_id text; v_dim text; v_evaluation jsonb;
begin
 uid:=public.lex_require_student(p_course);
 if p_answer is null or length(trim(p_answer))<8 or length(p_answer)>4000 then
  raise exception 'invalid_training_answer' using errcode='22023';end if;
 stage:=public.lex_training_session_open(p_course,p_session);
 if stage->>'allowed'<>'true' then raise exception 'training_session_locked' using errcode='42501';end if;
 select t->>'id',t->>'dimension' into v_id,v_dim from jsonb_array_elements(stage->'tasks') t
 where t->>'id'=p_item_id limit 1;
 if v_id is null then raise exception 'item_not_authorized_for_session' using errcode='42501';end if;
 insert into public.student_training_sessions(user_id,course_id,session_number,tasks_json)
 values(uid,p_course,p_session,stage->'tasks') on conflict do nothing;
 v_evaluation:=public.lex_training_rubric_coverage(p_item_id,trim(p_answer));
 insert into public.student_training_answers
 (user_id,course_id,session_number,item_id,dimension,answer_text,evaluation)
 values(uid,p_course,p_session,p_item_id,v_dim,trim(p_answer),v_evaluation)
 on conflict(user_id,course_id,session_number,item_id) do nothing;
 if (select count(*) from public.student_training_answers
     where user_id=uid and course_id=p_course and session_number=p_session)=jsonb_array_length(stage->'tasks') then
  update public.student_training_sessions set completed_at=coalesce(completed_at,now())
  where user_id=uid and course_id=p_course and session_number=p_session;
 end if;
 return public.lex_training_session_open(p_course,p_session);
end $function$
;
drop function if exists public.lex_training_answer_class(text);
