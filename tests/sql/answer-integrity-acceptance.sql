-- Isolated PostgreSQL end-to-end verification; student A's 30-session fixture already finished.
\set ON_ERROR_STOP on
do $intake$
declare answer text; expected text; got text;
begin
 for answer,expected in select * from (values
  ('لا أعلم','explicit_unknown'),
  ('لا أتذكر الإجابة','explicit_unknown'),
  ('مش عارف','explicit_unknown'),
  ('I do not know','explicit_unknown'),
  ('qwertyuiopasdfghjkl','obvious_noise'),
  ('سسسسسسسسسسسس','obvious_noise'),
  ('12345678','obvious_noise'),
  ('لا أعرف النص حرفيًا لكن للشركة ذمة مستقلة','assessable'),
  ('الشركة لها ذمة مالية مستقلة','assessable'),
  ('الشركة ليس لها ذمة مالية مستقلة','assessable')
 ) x(a,kind)
 loop
  got:=public.lex_training_answer_class(answer);
  if got<>expected then raise exception 'answer_intent(%): got %, wanted %',answer,got,expected;end if;
 end loop;
end $intake$;
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
do $secure$
declare d jsonb; lesson jsonb; hint jsonb; score jsonb; itemid text; answercount int;
begin
 d:=public.lex_diagnostic_begin('qa-qu-lawc101-rights');
 d:=public.lex_diagnostic_complete('qa-qu-lawc101-rights','[
  {"question_id":"q39r","selected":0},{"question_id":"q49r","selected":1},
  {"question_id":"q62r","selected":2},{"question_id":"q39u","selected":1},
  {"question_id":"q50u","selected":1},{"question_id":"q63a","selected":2}
 ]'::jsonb,'تبدأ الشخصية بالولادة الحية');
 lesson:=public.lex_training_session_open('qa-qu-lawc101-rights',1);
 if lesson->>'allowed'<>'true' then raise exception 'test student could not open session';end if;
 itemid:=lesson->'tasks'->0->>'id';
 hint:=public.lex_training_submit('qa-qu-lawc101-rights',1,itemid,'لا أعلم');
 if hint->>'status'<>'hint_required' or length(coalesce(hint->>'hint_ar',''))<10 then
  raise exception 'unknown did not produce hint: %',hint;end if;
 if exists(select 1 from public.student_training_answers where item_id=itemid) then
  raise exception 'unknown was falsely stored as completed answer';end if;
 score:=public.lex_training_submit('qa-qu-lawc101-rights',1,itemid,'qwertyuiopasdfghjkl');
 if jsonb_array_length(score->'saved')<>1 then raise exception 'gibberish should count as one completed zero task';end if;
 if not exists(select 1 from public.student_training_answers where item_id=itemid
    and evaluation->>'status'='nonanswer_zero'
    and (evaluation->>'provisional_percent')::int=0) then
  raise exception 'no persisted zero for nonsense';end if;
 if score->>'completed'='true' then raise exception 'cannot complete session after one answer';end if;
end $secure$;
reset role;
select 'PASS: hint no-save; nonsense task zero; no cross-student bypass; correct text remains assessable' as result;
