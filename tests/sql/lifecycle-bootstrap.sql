-- Local PostgreSQL fixture only. Never run against LexLearn production.
create extension if not exists pgcrypto;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
create table public.profiles(id uuid primary key,role text not null,active boolean not null default true,
 cohort_id uuid, display_name text);
grant select on public.profiles to authenticated;
create table public.courses(id text primary key);
create table public.enrollments(user_id uuid references public.profiles(id),course_id text references public.courses(id),status text,
 primary key(user_id,course_id));
create table public.consent_records(user_id uuid references public.profiles(id),
 notice_version text,consent_type text,accepted boolean);
create table public.content_items(id text primary key,course_id text references public.courses(id),
 unit_id text,concept_id text,dimension text,item_type text,
 metadata jsonb not null default '{}'::jsonb, status text not null default 'legal_review',
 reviewed_at timestamptz, legal_reviewer uuid references public.profiles(id),learning_reviewer uuid references public.profiles(id),
 prompt_ar text not null default '', rubric_json jsonb, options_json jsonb, answer_key_json jsonb,
 source_ids text[] not null default '{}');
create table public.attempts(id uuid primary key default gen_random_uuid());
-- Fixture metadata visibility; diagnostic rows have independent RLS rules.
grant select on public.profiles to authenticated;
create or replace function public.is_active_user() returns boolean language sql stable security definer as $body$
 select exists(select 1 from public.profiles where id=auth.uid() and active);
$body$;
create schema if not exists private;
create or replace function private.is_active_user() returns boolean
 language sql stable security definer set search_path='' as $body$
 select public.is_active_user();
$body$;
grant usage on schema private to authenticated;
grant execute on function private.is_active_user() to authenticated;
insert into public.courses values ('qa-qu-lawc101-rights');
insert into public.profiles(id,role,active,cohort_id,display_name) values
 ('10000000-0000-4000-8000-000000000001','student',true,'a0000000-0000-4000-8000-000000000001','Student A'),
 ('10000000-0000-4000-8000-000000000002','student',true,'b0000000-0000-4000-8000-000000000001','Student B'),
 ('10000000-0000-4000-8000-000000000003','student',true,'a0000000-0000-4000-8000-000000000001','Student C'),
 ('10000000-0000-4000-8000-000000000004','student',true,'a0000000-0000-4000-8000-000000000001','Student D'),
 ('20000000-0000-4000-8000-000000000001','content_reviewer',true,null,'Legal reviewer'),
 ('20000000-0000-4000-8000-000000000002','content_reviewer',true,null,'Pedagogical reviewer'),
 ('30000000-0000-4000-8000-000000000001','instructor',true,'a0000000-0000-4000-8000-000000000001','Instructor cohort A'),
 ('30000000-0000-4000-8000-000000000002','instructor',true,'b0000000-0000-4000-8000-000000000001','Instructor cohort B');
insert into public.enrollments values
 ('10000000-0000-4000-8000-000000000001','qa-qu-lawc101-rights','active'),
 ('10000000-0000-4000-8000-000000000002','qa-qu-lawc101-rights','active'),
 ('10000000-0000-4000-8000-000000000003','qa-qu-lawc101-rights','active'),
 ('10000000-0000-4000-8000-000000000004','qa-qu-lawc101-rights','active');
insert into public.consent_records
 select id,'2026-10-06-v1','learning_data',true from public.profiles where role='student';
insert into public.content_items(id,course_id,metadata,status,reviewed_at,legal_reviewer,learning_reviewer,prompt_ar,rubric_json,options_json,answer_key_json,source_ids)
select 'test-'||x.id,'qa-qu-lawc101-rights',
 jsonb_build_object('official_diagnostic_v2_id',x.id,'legal_approval',true,'learning_approval',true),
 'approved',now(),'20000000-0000-4000-8000-000000000001'::uuid,'20000000-0000-4000-8000-000000000002'::uuid,
 'Fixture question '||x.id,'{"prompt_en":"Fixture"}'::jsonb,
 '{"ar":["a","b","c"],"en":["a","b","c"]}'::jsonb,
 jsonb_build_object('correct_index',x.k),
 array['qa-civil-2004-art39']::text[]
from (values ('q39r',0),('q49r',1),('q62r',2),('q39u',1),('q50u',1),('q63a',2)) as x(id,k);
