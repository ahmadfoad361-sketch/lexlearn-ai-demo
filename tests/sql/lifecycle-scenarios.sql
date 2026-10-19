-- Real PostgreSQL transactional/RLS tests on synthetic data only.
\set ON_ERROR_STOP on
-- Fixture initially disables one item and must reject the begin RPC without a record.
update public.content_items set status='legal_review' where id='test-q39r';
set role authenticated;
set request.jwt.claim.sub='10000000-0000-4000-8000-000000000001';
do $$
declare x jsonb;
begin
 x:=public.lex_diagnostic_status('qa-qu-lawc101-rights');
 if x->>'status'<>'not_started' then raise exception 'new student should be not_started';end if;
 begin
  x:=public.lex_diagnostic_begin('qa-qu-lawc101-rights');
  raise exception 'unapproved bank must fail closed';
 exception when insufficient_privilege then
  if sqlerrm not like '%diagnostic_academic_approval_pending%' then raise;end if;
 end;
end $$;
reset role;
update public.content_items set status='approved' where id='test-q39r';
set role authenticated;
set request.jwt.claim.sub='10000000-0000-4000-8000-000000000001';
do $$
declare v jsonb; a jsonb; attempt text; count_visible int;
begin
 v:=public.lex_diagnostic_begin('qa-qu-lawc101-rights');
 if v->>'status'<>'in_progress' then raise exception 'begin must enter in_progress';end if;
 attempt:=v->>'attempt_id';
 a:='[{"question_id":"q39r","selected":0},{"question_id":"q49r","selected":1},{"question_id":"q62r","selected":2}]'::jsonb;
 v:=public.lex_diagnostic_draft('qa-qu-lawc101-rights',a);
 if v->>'status'<>'in_progress' or jsonb_array_length(v->'draft')<>3 then raise exception 'partial draft must be saved';end if;
 v:=public.lex_diagnostic_status('qa-qu-lawc101-rights');
 if jsonb_array_length(v->'draft')<>3 then raise exception 'resuming loses partial progress';end if;
 a:='[{"question_id":"q39r","selected":0,"correct":false,"score":1000},{"question_id":"q49r","selected":1},{"question_id":"q62r","selected":2},{"question_id":"q39u","selected":0},{"question_id":"q50u","selected":0},{"question_id":"q63a","selected":1}]'::jsonb;
 v:=public.lex_diagnostic_complete('qa-qu-lawc101-rights',a,'birth, personality');
 if v->>'status'<>'completed' then raise exception 'completion missing';end if;
 if (v->'result'->>'source')<>'server_finalized_diagnostic'
    or (v->'result'->'metrics'->>'recognition')::int<>100
    or (v->'result'->'metrics'->>'understanding')::int<>0
    or (v->'result'->'metrics'->>'recall') is not null
    or v->'training_plan'->>'mode'<>'recall-led'
 then raise exception 'server must calculate objective scores; free recall remains unmeasured: %',v;end if;
 if v->>'attempt_id'<>attempt then raise exception 'attempt ID changed during completion';end if;
 v:=public.lex_diagnostic_complete('qa-qu-lawc101-rights','[]'::jsonb,'ignored second submission');
 if v->>'attempt_id'<>attempt then raise exception 'repeat should be idempotent';end if;
 v:=public.lex_diagnostic_draft('qa-qu-lawc101-rights','[]'::jsonb);
 if v->>'status'<>'completed' then raise exception 'draft must never override completed';end if;
 select count(*) into count_visible from public.student_diagnostic_runs;
 if count_visible<>1 then raise exception 'cross-user rows exposed';end if;
 begin
  update public.student_diagnostic_runs set status='in_progress';
  raise exception 'client must not update signed result';
 exception when insufficient_privilege then null;
 end;
 v:=public.lex_level_access('qa-qu-lawc101-rights',1);
 if v->>'allowed'<>'false' or v->>'reason'<>'academic_content_not_released' then raise exception 'unapproved level 1 must stay shut';end if;
end $$;
-- Different student: separate result and plan.
set request.jwt.claim.sub='10000000-0000-4000-8000-000000000002';
do $$
declare v jsonb;a jsonb; rows integer;
begin
 v:=public.lex_diagnostic_begin('qa-qu-lawc101-rights');
 a:='[{"question_id":"q39r","selected":1},{"question_id":"q49r","selected":2},{"question_id":"q62r","selected":0},{"question_id":"q39u","selected":1},{"question_id":"q50u","selected":1},{"question_id":"q63a","selected":2}]'::jsonb;
 v:=public.lex_diagnostic_complete('qa-qu-lawc101-rights',a,'');
 if v->'training_plan'->>'mode'<>'understanding-led' then raise exception 'understanding-led learner missing';end if;
 select count(*) into rows from public.student_diagnostic_runs;
 if rows<>1 then raise exception 'student B can read another student row';end if;
end $$;
set request.jwt.claim.sub='10000000-0000-4000-8000-000000000003';
do $$
declare v jsonb;a jsonb;
begin
 v:=public.lex_diagnostic_begin('qa-qu-lawc101-rights');
 a:='[{"question_id":"q39r","selected":-1},{"question_id":"q49r","selected":-1},{"question_id":"q62r","selected":-1},{"question_id":"q39u","selected":-1},{"question_id":"q50u","selected":-1},{"question_id":"q63a","selected":-1}]'::jsonb;
 v:=public.lex_diagnostic_complete('qa-qu-lawc101-rights',a,'');
 if v->'training_plan'->>'mode'<>'foundation'
   or v->'result'->'metrics'->>'understanding' is not null
   or v->'result'->'metrics'->>'recognition' is not null then
   raise exception 'insufficient evidence is not an objective 0';end if;
end $$;
reset role;
-- Academic release is created by a fixture superuser, never by the student.
insert into public.student_level_releases(course_id,level_number,academic_approved,published,approved_by,reviewed_at)
values ('qa-qu-lawc101-rights',1,true,true,'20000000-0000-4000-8000-000000000001',now()),
 ('qa-qu-lawc101-rights',2,true,true,'20000000-0000-4000-8000-000000000001',now());
set role authenticated;
set request.jwt.claim.sub='10000000-0000-4000-8000-000000000001';
do $$
declare v jsonb;
begin
 v:=public.lex_level_access('qa-qu-lawc101-rights',1);
 if v->>'allowed'<>'true' then raise exception 'authorized level 1 not unlocked';end if;
 v:=public.lex_level_access('qa-qu-lawc101-rights',2);
 if v->>'allowed'<>'false' or v->>'reason'<>'previous_level_not_verified' then
  raise exception 'opening Level 2 directly must fail';end if;
 begin
  insert into public.student_level_completions(user_id,course_id,level_number,authorized_attempt)
  values('10000000-0000-4000-8000-000000000001','qa-qu-lawc101-rights',1,gen_random_uuid());
  raise exception 'student must not award own level completion';
 exception when insufficient_privilege then null;
 end;
end $$;
-- Instructor cohort: teacher A may see A and C, not B.
set request.jwt.claim.sub='30000000-0000-4000-8000-000000000001';
do $$ declare n int;begin
 select count(*) into n from public.student_diagnostic_runs;
 if n<>2 then raise exception 'staff read should be cohort-scoped: %',n;end if;
end $$;
reset role;
select 'server lifecycle + RLS + 3 learners + persistence + level gating: PASS' as result;
