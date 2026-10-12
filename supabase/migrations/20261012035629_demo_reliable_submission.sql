-- Keep all historic submissions and review decisions; extend only demo-specific data.
alter table public.demo_submissions drop constraint if exists demo_submissions_grade_status_check;
alter table public.demo_submissions add constraint demo_submissions_grade_status_check
 check (grade_status in ('graded','pending_review','rule_assessed','insufficient_evidence'));
alter table public.demo_submissions add column if not exists client_request_id text;
alter table public.demo_submissions add column if not exists request_hash text;
create unique index if not exists demo_submissions_request_unique
 on public.demo_submissions(visitor_user_id,client_request_id);

-- One transaction owns deduplication, quota and insertion. A failed insert rolls back quota.
-- Only the authenticated edge backend may execute this RPC. Existing staff RLS stays intact.
create or replace function public.save_demo_submission(p_user uuid,p_request_id text,p_hash text,p_record jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.demo_submissions%rowtype;
declare d text := to_char(now() at time zone 'UTC','YYYY-MM-DD');
declare n integer; declare g integer; declare reused boolean:=false;
begin
 if p_user is null or p_request_id is null or length(p_request_id)>80 or p_hash !~ '^[a-f0-9]{64}$' then
  raise exception 'Invalid submission identity';
 end if;
 perform pg_advisory_xact_lock(hashtext('lexlearn-public-demo-daily'));
 select * into r from public.demo_submissions where visitor_user_id=p_user and client_request_id=p_request_id;
 if found then
  if r.request_hash<>p_hash then return jsonb_build_object('error','request_conflict'); end if;
  reused:=true;
 else
  select coalesce(max(requests),0) into g from public.demo_request_limits where bucket='global:'||d;
  select coalesce(max(requests),0) into n from public.demo_request_limits where bucket='user:'||p_user::text||':'||d;
  -- Preserve the existing live limits: 12/user/day, 100/global/day, UTC reset.
  if g>=100 or n>=12 then return jsonb_build_object('error','daily_demo_limit','limit_scope',case when g>=100 then 'global' else 'user' end); end if;
  insert into public.demo_submissions(visitor_user_id,client_request_id,request_hash,language,topic_id,answer_text,choices,choice_indicators,grade_status,recall_score,grade_feedback,grade_evidence,proposed_training,diagnostic_version)
  values(p_user,p_request_id,p_hash,p_record->>'language',1,p_record->>'answer_text',p_record->'choices',p_record->'choice_indicators',p_record->>'grade_status',(p_record->>'recall_score')::integer,p_record->>'grade_feedback',p_record->'grade_evidence','exploratory','showcase-v3') returning * into r;
  insert into public.demo_request_limits(bucket,requests) values ('global:'||d,1),('user:'||p_user::text||':'||d,1)
  on conflict(bucket) do update set requests=public.demo_request_limits.requests+1,updated_at=now();
 end if;
 return jsonb_build_object('received',true,'submission_id',r.id,'reused',reused,'grade_status',r.grade_status,'recall_score',r.recall_score,'feedback',r.grade_feedback,'details',r.grade_evidence,'choice_indicators',r.choice_indicators,'proposed_training',r.proposed_training);
end;
$$;
revoke all on function public.save_demo_submission(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.save_demo_submission(uuid,text,text,jsonb) to service_role;
