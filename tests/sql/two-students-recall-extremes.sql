-- Two synthetic authenticated students; isolated GitHub Actions PostgreSQL only.
-- The answers intentionally mention similar legal keywords but assert opposite rules.
\set ON_ERROR_STOP on
set role authenticated;
do $two$
declare u text; label text; ans text; picks jsonb; d jsonb; stage jsonb; saved jsonb;
  diagnostic jsonb; student_recall jsonb; grade jsonb; exam_score text;
begin
 for u,label,ans,picks in
  select * from (values
  ('10000000-0000-4000-8000-000000000003'::text,'full_correct',
   'تبدأ الشخصية القانونية بالولادة حيا وتنتهي بالوفاة حسب القانون. للحمل المستكن حقوق بشرط تمام ولادته حيا إذا كان سببها لا يحتاج إلى قبول. مفاتيح الحفظ: الولادة الحية بداية الشخصية، الوفاة نهايتها، والحمل حقوق مشروطة بالولادة حيا.'::text,
   '[{"question_id":"q39r","selected":0},{"question_id":"q49r","selected":1},{"question_id":"q62r","selected":2},{"question_id":"q39u","selected":1},{"question_id":"q50u","selected":1},{"question_id":"q63a","selected":2}]'::jsonb),
  ('10000000-0000-4000-8000-000000000004'::text,'completely_wrong',
   'الشخصية القانونية لا تبدأ بالولادة حيا ولا تنتهي بالوفاة حسب القانون؛ بل تبدأ فقط عند سن الحادية والعشرين، وتستمر بعد موت الإنسان. ولا توجد أي حقوق للحمل المستكن ولو ولد حيا.'::text,
   '[{"question_id":"q39r","selected":1},{"question_id":"q49r","selected":0},{"question_id":"q62r","selected":1},{"question_id":"q39u","selected":0},{"question_id":"q50u","selected":0},{"question_id":"q63a","selected":0}]'::jsonb)
  ) s(uid,scenario,answer,answers)
 loop
  perform set_config('request.jwt.claim.sub',u,false);
  d:=public.lex_diagnostic_begin('qa-qu-lawc101-rights');
  if d->>'status'<>'in_progress' then raise exception 'student fixture not new %',label;end if;
  d:=public.lex_diagnostic_complete('qa-qu-lawc101-rights',picks,ans);
  if d->>'status'<>'completed' then raise exception 'diagnostic not finalized %',label;end if;
  d:=public.lex_diagnostic_internal_assess('qa-qu-lawc101-rights');
  diagnostic:=d#>'{result,measurements,recall,internal_grade}';
  stage:=public.lex_training_session_open('qa-qu-lawc101-rights',1);
  if stage->>'allowed'<>'true' then raise exception 'first lesson not allowed % %',label,stage;end if;
  if not exists(select 1 from jsonb_array_elements(stage->'tasks') as a(value) where a.value->>'id'='rights-v1-s1-recall')
   then raise exception 'recall task unavailable for %',label;end if;
  stage:=public.lex_training_submit('qa-qu-lawc101-rights',1,'rights-v1-s1-recall',ans);
  select j.value->'evaluation' into grade from jsonb_array_elements(stage->'saved') as j(value) where j.value->>'item_id'='rights-v1-s1-recall';
  if grade is null then raise exception 'practice response not saved %',label;end if;
  if label='full_correct' then
   if diagnostic->>'status'<>'preliminary_internal' or (diagnostic->>'provisional_percent')::integer<>100
      or grade->>'status'<>'preliminary_internal' or (grade->>'provisional_percent')::integer<>100 then
     raise exception 'Full correct recall was not awarded high preliminary coverage: diag %, practice %',diagnostic,grade;
   end if;
  else
   if diagnostic->>'status'<>'needs_human_review' or diagnostic->>'provisional_percent' is not null
    or grade->>'status'<>'needs_human_review' or grade->>'provisional_percent' is not null then
     raise exception 'False legal statement must never receive a confident memory percentage: diag %, practice %',diagnostic,grade;
   end if;
  end if;
  raise notice 'RECALL_TWO_STUDENTS %',jsonb_build_object(
    'scenario',label,'diagnostic_status',d->>'status',
    'recognition',d#>'{result,metrics,recognition}','understanding',d#>'{result,metrics,understanding}',
    'free_recall_internal_grade',diagnostic,
    'practice_recall_grade',grade,
    'saved_responses',jsonb_array_length(stage->'saved'),
    'training_policy',stage->'skill_policy');
 end loop;
end $two$;
reset role;
\echo 'RECALL_TWO_STUDENTS complete: both real server flows ran on two synthetic isolated PostgreSQL accounts.'
