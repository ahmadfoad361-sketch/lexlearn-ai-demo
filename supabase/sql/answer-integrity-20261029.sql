-- Candidate production patch, safe to run after isolated DB integration tests.
-- Supabase LexLearn: task-level 0 for clear nonsense, hint for explicit unknown.
-- Answer intake classification: no semantic grading using word matching.
-- Most unusual text deliberately passes to semantic evaluation instead of being rejected.
create or replace function public.lex_training_answer_class(p_answer text)
returns text
language plpgsql immutable security invoker
set search_path=''
as $body$
declare
 v text; letters text; tokens text[];
begin
 v:=lower(trim(coalesce(p_answer,'')));
 v:=translate(v,'أإآىة','ااايه');
 v:=trim(regexp_replace(regexp_replace(v,'[،؛؟.,!?:;()\[\]{}"''-]',' ','g'),'\s+',' ','g'));
 if length(v)=0 then return 'empty';end if;
 if v ~ '^(انا |اني )?(لا (اعلم|اعرف|اتذكر|اذكر|ادري)|مش (عارف|عارفه|فاكر|فاكره|متذكر|متذكره)|ما (اعرف|ادري|اذكر|اتذكر|افتكر)|معرفش|ماعرفش|مشعارف|نسيت|ناسي|ما عندي فكره|معنديش فكره)( (الاجابه|الجواب|السؤال|المعلومه|القاعده|هذه القاعده|هذا السؤال|خالص|تماما|دلوقتي|الان|صراحه|اصلا|اي حاجه|شيء|حاجه))*$'
   or v ~ '^(i )?(don.t know|do not know|dont know|can.t remember|cannot remember|don.t remember|do not remember|have no idea|am not sure|forgot|forget|idk|no idea|not sure)( (the answer|the rule|anything|at all|sorry))*$'
 then return 'explicit_unknown';end if;
 letters:=regexp_replace(v,'[^a-zء-ي]','','g');
 if length(letters)=0 then return 'obvious_noise';end if;
 if length(letters)>=5 and replace(letters,left(letters,1),'')='' then return 'obvious_noise';end if;
 if v ~ '^(qwerty(uiop)?|asdf(ghjkl)?|zxcv(bnm)?)+$' then return 'obvious_noise';end if;
 tokens:=regexp_split_to_array(v,'\s+');
 if cardinality(tokens)>=3 and length(tokens[1])<=5 and
     (select count(distinct x) from unnest(tokens) as x)=1
 then return 'obvious_noise';end if;
 return 'assessable';
end $body$;
revoke all on function public.lex_training_answer_class(text) from public;
grant execute on function public.lex_training_answer_class(text) to authenticated;

CREATE OR REPLACE FUNCTION public.lex_training_submit(p_course text, p_session integer, p_item_id text, p_answer text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid; stage jsonb; v_id text; v_dim text; v_evaluation jsonb;
 v_kind text; v_hint_ar text; v_hint_en text;
begin
 uid:=public.lex_require_student(p_course);
 if p_answer is null or length(trim(p_answer))=0 or length(p_answer)>4000 then
  raise exception 'invalid_training_answer' using errcode='22023';end if;
 stage:=public.lex_training_session_open(p_course,p_session);
 if stage->>'allowed'<>'true' then raise exception 'training_session_locked' using errcode='42501';end if;
 select t->>'id',t->>'dimension' into v_id,v_dim from jsonb_array_elements(stage->'tasks') t
 where t->>'id'=p_item_id limit 1;
 if v_id is null then raise exception 'item_not_authorized_for_session' using errcode='42501';end if;
 v_kind:=public.lex_training_answer_class(p_answer);
 -- Admission of not knowing is an opportunity to teach; never store it as a final answer.
 if v_kind='explicit_unknown' then
  select coalesce(rubric_json->'criteria'->0->>'label','عنصر واحد من القاعدة'),
         coalesce(rubric_json->'criteria'->0->>'label_en','one element of the rule')
  into v_hint_ar,v_hint_en from public.content_items where id=p_item_id and course_id=p_course;
  return jsonb_build_object('allowed',true,'status','hint_required',
    'hint_ar','تلميح: فكّر في '||v_hint_ar||'. حاول شرح الفكرة بأسلوبك ثم أرسل إجابة جديدة.',
    'hint_en','Hint: consider '||v_hint_en||'. Explain it in your own words, then try again.',
    'saved',stage->'saved','academic_certified',false);
 end if;
 insert into public.student_training_sessions(user_id,course_id,session_number,tasks_json)
 values(uid,p_course,p_session,stage->'tasks') on conflict do nothing;
 if v_kind='obvious_noise' then
  -- Zero is an observed task attempt, not a calibrated overall skill score.
  v_evaluation:=jsonb_build_object(
    'status','nonanswer_zero','provisional_percent',0,
    'rubric_version','lexlearn-answer-integrity-v1',
    'grading_method','deterministic_nonanswer','academic_certified',false,
    'needs_human_review',false,
    'feedback_ar','الإجابة لا تتضمن معنى قابلًا للتصحيح، ولذلك درجة هذا السؤال 0٪. اقرأ القاعدة ثم تدرب عليها من جديد.',
    'feedback_en','This answer has no assessable meaning, so this task earns 0%. Review the rule and try again in a later practice.');
 elsif length(trim(p_answer))<8 then
  -- Short potentially meaningful legal answer: retain for semantic assessment, never guess.
  v_evaluation:=jsonb_build_object('status','pending_semantic_assessment','provisional_percent',null,'academic_certified',false);
 else
  v_evaluation:=public.lex_training_rubric_coverage(p_item_id,trim(p_answer));
 end if;
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
end $function$;
