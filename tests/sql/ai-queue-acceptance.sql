-- End-to-end real PostgreSQL load/isolation checks, 500 distinct synthetic students.
do $$begin
 if has_function_privilege('authenticated',
   'public.lex_ai_queue_admit(uuid,text,text,integer,text)','execute') then
  raise exception 'authenticated must not call privileged queue RPC';
 end if;
 if (select enabled from public.lex_ai_queue_settings) then
  raise exception 'queue must be disabled by default';
 end if;
end $$;
set role service_role;
insert into public.profiles(id)
 select ('00000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid
 from generate_series(1,500) i;
insert into public.enrollments(user_id,course_id)
 select id,'qa-qu-lawc101-rights' from public.profiles;
insert into public.consent_records(user_id,consent_type,accepted,notice_version)
 select id,'external_ai_grading',true,'lexlearn-ai-grading-v1' from public.profiles;
insert into public.student_diagnostic_runs
 (user_id,course_id,status,attempt_id,free_text,result)
 select id,'qa-qu-lawc101-rights','completed',gen_random_uuid(),
   'تبدأ الشخصية بالولادة الحية وتنتهي بالوفاة',
   '{"source":"server_finalized_diagnostic","measurements":{"recall":{}}}'::jsonb
 from public.profiles;
update public.lex_ai_queue_settings set enabled=true, max_active=4,max_pending=1000,max_daily_starts=2000;
select count(*) from (
 select public.lex_ai_queue_admit(p.id,'diagnostic','qa-qu-lawc101-rights',null,null)
 from public.profiles p
) admitted;
do $$
declare n int;
begin
 select count(*) into n from public.lex_ai_queue_jobs;
 if n<>500 then raise exception 'expected 500 queue rows, got %',n; end if;
 perform public.lex_ai_queue_admit(
  '00000000-0000-4000-8000-000000000001'::uuid,'diagnostic',
  'qa-qu-lawc101-rights',null,null);
 select count(*) into n from public.lex_ai_queue_jobs;
 if n<>500 then raise exception 'duplicate admission created more jobs'; end if;
end $$;
-- 3 active claims, and at most one additional claim when max_active=4.
create temp table claimed as select * from public.lex_ai_queue_claim(3,300);
do $$begin
 if (select count(*) from claimed)<>3 then raise exception 'expected three leases'; end if;
 if (select count(*) from public.lex_ai_queue_attempts)<>3 then
   raise exception 'every claim must be metered'; end if;
end $$;
create temp table next_claim as select * from public.lex_ai_queue_claim(3,300);
do $$begin
 if (select count(*) from next_claim)<>1 then raise exception 'global concurrency not enforced'; end if;
 if (select count(*) from public.lex_ai_queue_attempts)<>4 then
   raise exception 'four calls must be counted'; end if;
end $$;
do $$
declare j claimed%rowtype; ok boolean;
begin
 select * into j from claimed limit 1;
 ok=public.lex_ai_queue_finish(j.id,gen_random_uuid(),
   '{"status":"preliminary_ai","provisional_percent":80,"confidence":0.9}'::jsonb);
 if ok then raise exception 'stale token must fail'; end if;
 ok=public.lex_ai_queue_finish(j.id,j.lease_token,
   '{"status":"preliminary_ai","provisional_percent":80,"confidence":0.9}'::jsonb,
   null,false,'gpt-5.4',101,array['qa-civil-2004-art39','qa-civil-2004-art40']);
 if not ok then raise exception 'valid lease must finish'; end if;
 ok=public.lex_ai_queue_finish(j.id,j.lease_token,
   '{"status":"preliminary_ai","provisional_percent":80}'::jsonb);
 if ok then raise exception 'duplicate finish must fail'; end if;
 if not exists(select 1 from public.student_diagnostic_runs d
   where d.user_id=j.user_id and
    d.result#>>'{measurements,recall,ai_grade,provisional_percent}'='80')
 then raise exception 'graded diagnostic not persisted'; end if;
 if (select count(*) from public.ai_grading_runs)<>1
 then raise exception 'audit not written exactly once'; end if;
end $$;
-- Finishing a job cannot silently overwrite unrelated student data.
do $$begin
 if (select count(*) from public.student_diagnostic_runs
   where result#>>'{measurements,recall,ai_grade,provisional_percent}'='80')<>1
 then raise exception 'cross-student grade leakage'; end if;
 if (select count(*) from public.lex_ai_queue_jobs where state='queued')<>496
 then raise exception 'remaining jobs were lost'; end if;
end $$;
reset role;
-- No student can retrieve a worker lease token even for their own job.
do $$begin
 if has_column_privilege('authenticated','public.lex_ai_queue_jobs','lease_token','select') then
   raise exception 'student has permission to read sensitive queue lease token';
 end if;
 if has_column_privilege('authenticated','public.lex_ai_queue_jobs','result','select') then
   raise exception 'student must not download raw worker result';
 end if;
end $$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
do $$
declare n int;
begin
 select count(*) into n from public.lex_ai_queue_jobs;
 if n<>1 then raise exception 'RLS scope violation: expected 1 own job, got %',n; end if;
end $$;
reset role;
select 'PASS 500 queued students / 4 leased / 1 audited / no data crossover / RLS' as result;
