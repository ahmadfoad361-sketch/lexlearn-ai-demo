-- Verify the 30-stage curriculum using an actual PostgreSQL transaction and RLS.
\set ON_ERROR_STOP on
do $scope$
begin
 if (select count(*) from public.student_level_releases where published and founder_pilot_approved)<>30 then
  raise exception 'missing release rows';end if;
 if exists(select 1 from public.student_level_releases where academic_approved) then
  raise exception 'internal release falsified independent academic approval';end if;
 if (select count(*) from public.content_items where item_type='essay' and metadata->>'owner_pilot_approved'='true')<>72 then
  raise exception 'bank has missing exercises';end if;
end $scope$;
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
do $start$
declare d jsonb;
begin
 d:=public.lex_diagnostic_begin('qa-qu-lawc101-rights');
 if d->>'status'<>'in_progress' then raise exception 'diagnostic inaccessible';end if;
 d:=public.lex_diagnostic_complete('qa-qu-lawc101-rights','[
  {"question_id":"q39r","selected":0},{"question_id":"q49r","selected":1},
  {"question_id":"q62r","selected":2},{"question_id":"q39u","selected":1},
  {"question_id":"q50u","selected":1},{"question_id":"q63a","selected":2}
 ]'::jsonb,'تبدأ الشخصية القانونية عند الولادة حيا وتنتهي بالموت');
 if d->>'status'<>'completed' then raise exception 'diagnostic write failed';end if;
 d:=public.lex_diagnostic_internal_assess('qa-qu-lawc101-rights');
 if d->'result'->'measurements'->'recall'->'internal_grade' is null then
  raise exception 'diagnostic provisional grade missing';end if;
 if (public.lex_training_session_open('qa-qu-lawc101-rights',2))->>'allowed'<>'false' then
  raise exception 'student can skip session 1';end if;
end $start$;
do $full$
declare n int; j int; o jsonb; v jsonb; item jsonb; finished jsonb; recap jsonb;
begin
 for n in 1..30 loop
  o:=public.lex_training_session_open('qa-qu-lawc101-rights',n);
  if o->>'allowed'<>'true' then raise exception 'session % inaccessible %',n,o;end if;
  if jsonb_array_length(o->'tasks')<>case when n%5=0 then 4 else 3 end then
   raise exception 'session % task count incorrect',n;end if;
  j:=0;
  for item in select value from jsonb_array_elements(o->'tasks') loop
    j:=j+1;
    v:=public.lex_training_submit('qa-qu-lawc101-rights',n,item->>'id',
      'تبدأ الشخصية القانونية بالولادة حيا وتنتهي بالموت وفق ما ورد في السؤال والقاعدة القانونية');
    if jsonb_array_length(v->'saved')<>j then raise exception 'saved task count wrong in session %',n;end if;
    if not exists(select 1 from public.student_training_answers where session_number=n
       and item_id=item->>'id' and (evaluation->>'provisional_percent')::int between 0 and 100)
    then raise exception 'provisional grading unavailable';end if;
  end loop;
  if v->>'completed'<>'true' then raise exception 'session % never completes',n;end if;
  recap:=public.lex_training_overview('qa-qu-lawc101-rights');
  if (recap->>'completed_count')::int<>n then raise exception 'session % not reflected in overview',n;end if;
 end loop;
 if (recap->>'program_completed')<>'true' then raise exception '30 sessions not recorded';end if;
 if (select count(*) from public.student_training_answers)<>96 then raise exception 'expected 96 signed-in practice responses';end if;
 if (select count(*) from public.student_training_sessions where completed_at is not null)<>30 then raise exception 'missing completed practice sessions';end if;
end $full$;
-- Repeat after completion must not erase or bypass server records.
do $again$
declare v jsonb;
begin
 v:=public.lex_training_session_open('qa-qu-lawc101-rights',1);
 if (v->>'completed')<>'true' then raise exception 'relogin loses completed lesson';end if;
 begin
  perform public.lex_training_submit('qa-qu-lawc101-rights',1,'fake-item','fake answer longer than eight chars');
  raise exception 'Unauthorized task was accepted';
 exception when insufficient_privilege then null;end;
end $again$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
do $isolation$
declare v jsonb;
begin
 v:=public.lex_training_overview('qa-qu-lawc101-rights');
 if (v->>'completed_count')::int<>0 then raise exception 'student B inherited A progress';end if;
 v:=public.lex_training_session_open('qa-qu-lawc101-rights',2);
 if v->>'allowed'<>'false' then raise exception 'student B can skip stage 1';end if;
 if (select count(*) from public.student_training_answers)<>0 then raise exception 'student B read private A answers';end if;
 begin
  insert into public.student_training_sessions(user_id,course_id,session_number)
   values('10000000-0000-4000-8000-000000000002','qa-qu-lawc101-rights',30);
  raise exception 'Direct academic bypass INSERT was allowed';
 exception when insufficient_privilege then null;end;
end $isolation$;
reset role;
select 'Thirty sessions, six checkpoints, personalized server progression, grading provenance and RLS passed' as result;