-- Durable AI grading queue, STAGING-FIRST. Disabled on installation.
-- No real student accounts or answers are created by this migration.
create table if not exists public.lex_ai_queue_settings (
 id boolean primary key default true check (id = true),
 enabled boolean not null default false,
 max_active integer not null default 4 check (max_active between 1 and 32),
 max_pending integer not null default 3000 check (max_pending between 100 and 100000),
 max_daily_starts integer not null default 1200 check (max_daily_starts between 1 and 100000),
 max_attempts integer not null default 3 check (max_attempts between 1 and 10),
 updated_at timestamptz not null default now()
);
insert into public.lex_ai_queue_settings(id,enabled) values (true,false) on conflict (id) do nothing;

create table if not exists public.lex_ai_queue_jobs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 course_id text not null,
 kind text not null check (kind in ('diagnostic','training')),
 item_id text not null,
 session_number integer,
 source_key text not null,
 state text not null default 'queued' check (state in ('queued','processing','completed','review_required')),
 attempts integer not null default 0 check (attempts >= 0),
 lease_token uuid,
 leased_until timestamptz,
 available_at timestamptz not null default now(),
 first_started_at timestamptz,
 last_started_at timestamptz,
 completed_at timestamptz,
 result jsonb not null default '{}'::jsonb,
 reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,kind,course_id,item_id,source_key),
 check ((kind='diagnostic' and session_number is null) or
        (kind='training' and session_number between 1 and 30))
);
create table if not exists public.lex_ai_queue_attempts (
 id bigint generated always as identity primary key,
 job_id uuid not null references public.lex_ai_queue_jobs(id) on delete cascade,
 started_at timestamptz not null default now()
);
create index if not exists lex_ai_attempts_daily_idx
 on public.lex_ai_queue_attempts (started_at desc);
alter table public.lex_ai_queue_attempts enable row level security;
revoke all on public.lex_ai_queue_attempts from public,anon,authenticated;
grant all on public.lex_ai_queue_attempts to service_role;
grant usage,select on sequence public.lex_ai_queue_attempts_id_seq to service_role;

create index if not exists lex_ai_jobs_claim_idx
 on public.lex_ai_queue_jobs (state,available_at,created_at);
create index if not exists lex_ai_jobs_user_idx
 on public.lex_ai_queue_jobs (user_id,created_at desc);
create index if not exists lex_ai_jobs_lease_idx
 on public.lex_ai_queue_jobs (leased_until)
 where state='processing';

alter table public.lex_ai_queue_settings enable row level security;
alter table public.lex_ai_queue_jobs enable row level security;
revoke all on public.lex_ai_queue_settings from public,anon,authenticated;
revoke all on public.lex_ai_queue_jobs from public,anon,authenticated;
grant select on public.lex_ai_queue_jobs to authenticated;
grant all on public.lex_ai_queue_settings to service_role;
grant all on public.lex_ai_queue_jobs to service_role;
drop policy if exists lex_ai_jobs_own_read on public.lex_ai_queue_jobs;
create policy lex_ai_jobs_own_read on public.lex_ai_queue_jobs
 for select to authenticated using (user_id=(select auth.uid()));

-- Service-role only, but still SECURITY INVOKER. Admission is serialized to
-- enforce the pending-queue limit and derives hashes from immutable saved work.
create or replace function public.lex_ai_queue_admit(
 p_user uuid,p_kind text,p_course text,p_session integer default null,p_item text default null)
returns public.lex_ai_queue_jobs
language plpgsql security invoker set search_path=pg_catalog,public
as $$
declare cfg public.lex_ai_queue_settings%rowtype;
        src text; item text; old public.lex_ai_queue_jobs%rowtype;
        answer text; current_eval jsonb;
begin
 perform pg_advisory_xact_lock(9148031);
 select * into cfg from public.lex_ai_queue_settings where id=true;
 if not found or not cfg.enabled then raise exception 'queue_disabled'; end if;
 if p_course<>'qa-qu-lawc101-rights' or p_kind not in ('diagnostic','training') then
   raise exception 'unsupported_course_or_kind';
 end if;
 if not exists (select 1 from public.profiles p join public.enrollments e
    on e.user_id=p.id and e.course_id=p_course and e.status='active'
    where p.id=p_user and p.role='student' and p.active=true and p.account_status='active')
 then raise exception 'student_approval_required'; end if;
 if not exists (select 1 from public.consent_records c where c.user_id=p_user
    and c.consent_type='external_ai_grading' and c.accepted=true
    and c.notice_version='lexlearn-ai-grading-v1')
 then raise exception 'external_ai_consent_required'; end if;
 if p_kind='diagnostic' then
   select d.attempt_id::text,d.free_text
     into src,answer from public.student_diagnostic_runs d
    where d.user_id=p_user and d.course_id=p_course and d.status='completed'
      and d.result->>'source'='server_finalized_diagnostic';
   if src is null then raise exception 'diagnostic_not_complete'; end if;
   if char_length(trim(coalesce(answer,'')))<10 or char_length(answer)>2000
     then raise exception 'recall_answer_insufficient'; end if;
   item='diagnostic-legal-personality:'||src;
 else
   if p_session not between 1 and 30 or
      p_item !~ '^rights-v1-s[0-9]+-(recall|understanding|exam)$'
      then raise exception 'invalid_task'; end if;
   select a.answer_text,a.evaluation into answer,current_eval
     from public.student_training_answers a
    where a.user_id=p_user and a.course_id=p_course and
          a.session_number=p_session and a.item_id=p_item;
   if answer is null then raise exception 'saved_answer_required'; end if;
   if current_eval->>'status'='nonanswer_zero'
      then raise exception 'nonanswer_already_scored'; end if;
   if current_eval->>'status'='preliminary_ai' and
      current_eval->>'rubric_version'='lexlearn-training-ai-v4'
      then raise exception 'already_graded'; end if;
   src=encode(sha256(convert_to(answer,'UTF8')),'hex');
   item=p_item;
 end if;
 if (select count(*) from public.lex_ai_queue_jobs where user_id=p_user
     and created_at>now()-interval '1 hour')>=20
 then raise exception 'student_queue_hourly_limit'; end if;
 select * into old from public.lex_ai_queue_jobs
   where user_id=p_user and kind=p_kind and course_id=p_course
         and item_id=item and source_key=src;
 if found then return old; end if;
 if (select count(*) from public.lex_ai_queue_jobs
     where state in ('queued','processing'))>=cfg.max_pending
 then raise exception 'grading_queue_full'; end if;
 insert into public.lex_ai_queue_jobs
   (user_id,course_id,kind,item_id,session_number,source_key)
 values(p_user,p_course,p_kind,item,p_session,src)
 returning * into old;
 return old;
end $$;

create or replace function public.lex_ai_queue_claim(
 p_limit integer default 3,p_lease_seconds integer default 300)
returns setof public.lex_ai_queue_jobs
language plpgsql security invoker set search_path=pg_catalog,public
as $$
declare cfg public.lex_ai_queue_settings%rowtype; slots integer; started bigint;
begin
 perform pg_advisory_xact_lock(9148031);
 select * into cfg from public.lex_ai_queue_settings where id=true;
 if not found or not cfg.enabled then return; end if;
 -- A crashed worker may never release its final lease. Stop retrying after
 -- the configured number of attempts instead of charging forever.
 update public.lex_ai_queue_jobs
    set state='review_required',reason='lease_exhausted',
        lease_token=null,leased_until=null,completed_at=now(),updated_at=now()
  where state='processing' and leased_until<now() and attempts>=cfg.max_attempts;
 select count(*) into started from public.lex_ai_queue_attempts
  where started_at>=now()-interval '24 hours';
 if started>=cfg.max_daily_starts then return; end if;
 select greatest(0,cfg.max_active-count(*)::integer) into slots
   from public.lex_ai_queue_jobs
  where state='processing' and leased_until>now();
 slots=least(slots,greatest(0,least(p_limit,10)),
             greatest(0,cfg.max_daily_starts-started::integer));
 if slots<=0 then return; end if;
 return query
  with picked as (
   select j.id from public.lex_ai_queue_jobs j
    where (j.state='queued' and j.available_at<=now())
       or (j.state='processing' and j.leased_until<now())
    order by j.available_at,j.created_at
    for update skip locked limit slots
  )
  ,leased as (
  update public.lex_ai_queue_jobs j
   set state='processing', attempts=j.attempts+1,
       lease_token=gen_random_uuid(),leased_until=now()+make_interval(secs=>greatest(60,least(p_lease_seconds,900))),
       first_started_at=coalesce(j.first_started_at,now()),
       last_started_at=now(),updated_at=now()
   from picked where j.id=picked.id
   returning j.*
  ), metered as (
   insert into public.lex_ai_queue_attempts(job_id)
     select id from leased returning job_id
  )
  select leased.* from leased join metered on metered.job_id=leased.id;
end $;

-- Only the worker holding the current lease can atomically save a grade.
-- No stale response may overwrite a student's later work.
create or replace function public.lex_ai_queue_finish(
 p_id uuid,p_lease uuid,p_grade jsonb default null,
 p_failure text default null,p_retryable boolean default false,
 p_model text default 'gpt-5.4',p_elapsed_ms integer default null,
 p_source_ids text[] default '{}'::text[])
returns boolean
language plpgsql security invoker set search_path=pg_catalog,public
as $$
declare job public.lex_ai_queue_jobs%rowtype;
        cfg public.lex_ai_queue_settings%rowtype;
        saved integer:=0;
        final_state text; fail_reason text;
begin
 select * into job from public.lex_ai_queue_jobs where id=p_id for update;
 if not found or job.state<>'processing' or job.lease_token is distinct from p_lease
    or job.leased_until<=now() then return false; end if;
 select * into cfg from public.lex_ai_queue_settings where id=true;
 if p_failure is not null then
   fail_reason=left(p_failure,90);
   if p_retryable and job.attempts<cfg.max_attempts then
     update public.lex_ai_queue_jobs set state='queued', lease_token=null,
       leased_until=null,available_at=now()+make_interval(secs=>least(900,30*power(2,job.attempts-1)::integer)),
       reason=fail_reason,updated_at=now() where id=p_id;
   else
     update public.lex_ai_queue_jobs set state='review_required',lease_token=null,
       leased_until=null,reason=fail_reason,completed_at=now(),updated_at=now() where id=p_id;
   end if;
   return true;
 end if;
 if p_grade is null or p_grade->>'status'<>'preliminary_ai' or
    jsonb_typeof(p_grade->'provisional_percent')<>'number'
 then raise exception 'unverified_grade'; end if;
 if job.kind='training' then
   update public.student_training_answers a set evaluation=p_grade
    where a.user_id=job.user_id and a.course_id=job.course_id
      and a.session_number=job.session_number and a.item_id=job.item_id
      and encode(sha256(convert_to(a.answer_text,'UTF8')),'hex')=job.source_key
      and a.evaluation->>'status'<>'nonanswer_zero';
 else
   update public.student_diagnostic_runs d
     set result=jsonb_set(
       d.result,'{measurements}',
       coalesce(d.result->'measurements','{}'::jsonb) ||
       jsonb_build_object('recall',
         coalesce(d.result#>'{measurements,recall}','{}'::jsonb) ||
         jsonb_build_object('ai_grade',p_grade)),true),
       updated_at=now()
    where d.user_id=job.user_id and d.course_id=job.course_id
      and d.attempt_id::text=job.source_key and d.status='completed'
      and d.result->>'source'='server_finalized_diagnostic';
 end if;
 get diagnostics saved=row_count;
 if saved<>1 then
   update public.lex_ai_queue_jobs set state='review_required',
      reason='source_changed_or_missing',lease_token=null,leased_until=null,
      completed_at=now(),updated_at=now() where id=p_id;
   return true;
 end if;
 insert into public.ai_grading_runs
   (user_id,course_id,item_id,model,prompt_version,source_ids,
    needs_human_review,result,model_confidence,latency_ms)
 values(job.user_id,job.course_id,job.item_id,p_model,
   case when job.kind='diagnostic' then 'lexlearn-diagnostic-ai-v3'
        else 'lexlearn-training-ai-v4' end,
   p_source_ids,false,jsonb_build_object('status','completed','grade',p_grade,
      'queue_job_id',job.id),nullif(p_grade->>'confidence','')::numeric,p_elapsed_ms);
 update public.lex_ai_queue_jobs
   set state='completed',result=jsonb_build_object('status','completed',
     'provisional_percent',p_grade->'provisional_percent'),
       reason=null,lease_token=null,leased_until=null,
       completed_at=now(),updated_at=now() where id=p_id;
 return true;
end $$;

-- Default EXECUTE granted to PUBLIC must be explicitly revoked.
revoke all on function public.lex_ai_queue_admit(uuid,text,text,integer,text) from public,anon,authenticated;
revoke all on function public.lex_ai_queue_claim(integer,integer) from public,anon,authenticated;
revoke all on function public.lex_ai_queue_finish(uuid,uuid,jsonb,text,boolean,text,integer,text[]) from public,anon,authenticated;
grant execute on function public.lex_ai_queue_admit(uuid,text,text,integer,text) to service_role;
grant execute on function public.lex_ai_queue_claim(integer,integer) to service_role;
grant execute on function public.lex_ai_queue_finish(uuid,uuid,jsonb,text,boolean,text,integer,text[]) to service_role;
