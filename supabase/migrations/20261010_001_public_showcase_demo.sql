-- Independent public LexLearn showcase: no student attempts or mastery data is written.
create table if not exists public.demo_submissions (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 visitor_user_id uuid,
 language text not null check(language in ('ar','en')),
 topic_id integer not null default 1 check(topic_id=1),
 answer_text text not null check(char_length(answer_text) between 1 and 1800),
 choices jsonb not null default '[]'::jsonb,
 choice_indicators jsonb not null default '{}'::jsonb,
 grade_status text not null default 'pending_review' check(grade_status in ('graded','pending_review')),
 recall_score integer check(recall_score between 0 and 100),
 grade_feedback text,
 grade_evidence jsonb not null default '{}'::jsonb,
 proposed_training text not null default 'exploratory',
 diagnostic_version text not null default 'showcase-v2',
 review_status text not null default 'unreviewed' check(review_status in ('unreviewed','confirmed','corrected')),
 supervisor_score integer check(supervisor_score between 0 and 100),
 review_note text,
 reviewed_by uuid,
 reviewed_at timestamptz
);
create index if not exists demo_submissions_created_desc_idx on public.demo_submissions(created_at desc);
alter table public.demo_submissions enable row level security;
revoke all on public.demo_submissions from anon,authenticated;
grant select on public.demo_submissions to authenticated;
grant update (review_status,supervisor_score,review_note,reviewed_by,reviewed_at) on public.demo_submissions to authenticated;
drop policy if exists "demo_submissions_supervisors_read" on public.demo_submissions;
create policy "demo_submissions_supervisors_read" on public.demo_submissions for select to authenticated
 using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role in ('owner','admin','instructor')));
drop policy if exists "demo_submissions_supervisors_update" on public.demo_submissions;
create policy "demo_submissions_supervisors_update" on public.demo_submissions for update to authenticated
 using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role in ('owner','admin','instructor')))
 with check(reviewed_by=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role in ('owner','admin','instructor')));
create table if not exists public.demo_request_limits (
 bucket text primary key,
 requests integer not null default 0,
 updated_at timestamptz not null default now()
);
alter table public.demo_request_limits enable row level security;
revoke all on public.demo_request_limits from anon,authenticated;
create or replace function public.claim_demo_quota(p_user uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare d text := to_char(now() at time zone 'UTC','YYYY-MM-DD');
declare n integer; declare g integer;
begin
 perform pg_advisory_xact_lock(hashtext('lexlearn-public-demo-daily'));
 insert into public.demo_request_limits(bucket,requests) values ('global:'||d,0) on conflict(bucket) do nothing;
 insert into public.demo_request_limits(bucket,requests) values ('user:'||p_user::text||':'||d,0) on conflict(bucket) do nothing;
 select requests into g from public.demo_request_limits where bucket='global:'||d;
 select requests into n from public.demo_request_limits where bucket='user:'||p_user::text||':'||d;
 if g>=100 or n>=3 then return false; end if;
 update public.demo_request_limits set requests=requests+1,updated_at=now()
 where bucket in ('global:'||d,'user:'||p_user::text||':'||d);
 return true;
end; $$;
revoke all on function public.claim_demo_quota(uuid) from public,anon,authenticated;
grant execute on function public.claim_demo_quota(uuid) to service_role;
-- Supabase Dashboard action needed: Authentication > Sign In / Providers > Anonymous Sign-ins.
-- Leave JWT verification on for showcase-grade and do not grant anonymous direct SQL writes.
