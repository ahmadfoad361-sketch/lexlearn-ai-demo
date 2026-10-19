-- Local PostgreSQL-only acceptance checks. DO NOT RUN AGAINST PRODUCTION.
\set ON_ERROR_STOP on
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
do $$
declare d jsonb; a jsonb;
begin
 d:=public.lex_diagnostic_status('qa-qu-lawc101-rights');
 if d->>'status'<>'not_started' then raise exception 'A was not_started'; end if;
 if (public.lex_level_access('qa-qu-lawc101-rights',2))->>'allowed'<>'false' then raise exception 'premature level2';end if;
 d:=public.lex_diagnostic_begin('qa-qu-lawc101-rights');
 if d->>'status'<>'in_progress' then raise exception 'begin failed';end if;
 a:='[{"question_id":"q39r","selected":0}]'::jsonb;
 d:=public.lex_diagnostic_draft('qa-qu-lawc101-rights',a);
 if jsonb_array_length(d->'draft')<>1 then raise exception 'draft missing';end if;
 d:=public.lex_diagnostic_draft('qa-qu-lawc101-rights',a);
 if jsonb_array_length(d->'draft')<>1 then raise exception 'duplicate after refresh';end if;
 d:=public.lex_diagnostic_complete('qa-qu-lawc101-rights',
 '[{"question_id":"q39r","selected":0},{"question_id":"q49r","selected":1},
 {"question_id":"q62r","selected":2},{"question_id":"q39u","selected":0},
 {"question_id":"q50u","selected":0},{"question_id":"q63a","selected":2}]'::jsonb,'free review pending');
 if d->>'status'<>'completed' or d->'result'->>'profileType'<>'recall-led' then raise exception 'recognition profile incorrect';end if;
 if d->'result'->'metrics'->>'recall' is not null then raise exception 'false free recall';end if;
 a:=public.lex_diagnostic_complete('qa-qu-lawc101-rights','[]'::jsonb,'forged overwrite');
 if a->>'attempt_id'<>d->>'attempt_id' then raise exception 'double submit changed attempt';end if;
 if (public.lex_level_access('qa-qu-lawc101-rights',1))->>'allowed'<>'false' then raise exception 'unreleased level one';end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
do $$
declare d jsonb;
begin
 if (select count(*) from public.student_diagnostic_runs)<>0 then raise exception 'cross-student read';end if;
 d:=public.lex_diagnostic_begin('qa-qu-lawc101-rights');
 d:=public.lex_diagnostic_complete('qa-qu-lawc101-rights',
 '[{"question_id":"q39r","selected":1},{"question_id":"q49r","selected":0},
 {"question_id":"q62r","selected":0},{"question_id":"q39u","selected":1},
 {"question_id":"q50u","selected":1},{"question_id":"q63a","selected":2}]'::jsonb,'');
 if d->'result'->>'profileType'<>'understanding-led' then raise exception 'understanding profile incorrect';end if;
 if (select count(*) from public.student_diagnostic_runs)<>1 then raise exception 'RLS not isolated';end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',false);
do $$
declare d jsonb;
begin
 d:=public.lex_diagnostic_begin('qa-qu-lawc101-rights');
 d:=public.lex_diagnostic_complete('qa-qu-lawc101-rights',
 '[{"question_id":"q39r","selected":-1},{"question_id":"q49r","selected":-1},
 {"question_id":"q62r","selected":-1},{"question_id":"q39u","selected":-1},
 {"question_id":"q50u","selected":-1},{"question_id":"q63a","selected":-1}]'::jsonb,'');
 if d->'result'->>'profileType'<>'insufficient_evidence' then raise exception 'missing-evidence plan incorrect';end if;
 if d->'result'->'metrics'->>'recognition' is not null then raise exception 'unknown scored as zero';end if;
 begin
  update public.student_diagnostic_runs set status='in_progress';
  raise exception 'BUG: direct client state mutation accepted';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
insert into public.student_level_releases(course_id,level_number,academic_approved,published,approved_by,reviewed_at)
values('qa-qu-lawc101-rights',1,true,true,'20000000-0000-4000-8000-000000000001',now()),
 ('qa-qu-lawc101-rights',2,true,true,'20000000-0000-4000-8000-000000000001',now());
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
do $$
begin
 if (public.lex_level_access('qa-qu-lawc101-rights',1))->>'allowed'<>'true' then raise exception 'approved first level denied';end if;
 if (public.lex_level_access('qa-qu-lawc101-rights',2))->>'allowed'<>'false' then raise exception 'second level bypass';end if;
end $$;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',false);
do $$ begin
 if (select count(*) from public.student_diagnostic_runs)<>2 then raise exception 'cohort A leak';end if;
end $$;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',false);
do $$ begin
 if (select count(*) from public.student_diagnostic_runs)<>1 then raise exception 'cohort B leak';end if;
end $$;
reset role;
\echo 'PASS: three profiles, server save, idempotency, RLS and level gates'
