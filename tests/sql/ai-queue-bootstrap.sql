-- Isolated CI-only minimal tables, no production credentials or data.
create role authenticated nologin;
create role anon nologin;
create role service_role nologin bypassrls;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create table public.profiles (
 id uuid primary key,
 role text not null default 'student',
 active boolean not null default true,
 account_status text not null default 'active'
);
create table public.enrollments (
 user_id uuid not null references public.profiles(id),
 course_id text not null,
 status text not null default 'active',
 primary key(user_id,course_id)
);
create table public.consent_records (
 user_id uuid not null,consent_type text not null,accepted boolean not null,
 notice_version text not null,created_at timestamptz default now()
);
create table public.student_diagnostic_runs (
 user_id uuid not null,course_id text not null,status text not null,
 attempt_id uuid not null,free_text text,result jsonb,
 updated_at timestamptz default now(),
 primary key(user_id,course_id)
);
create table public.student_training_answers (
 user_id uuid not null,course_id text not null,
 session_number int not null,item_id text not null,answer_text text not null,
 evaluation jsonb not null default '{}',
 primary key(user_id,course_id,session_number,item_id)
);
create table public.ai_grading_runs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid,course_id text,item_id text,model text,
 prompt_version text,source_ids text[] not null default '{}',
 needs_human_review boolean not null default false,
 result jsonb not null default '{}',
 model_confidence numeric,latency_ms integer,
 created_at timestamptz default now()
);
grant select,insert,update,delete on all tables in schema public to service_role;
grant usage on schema public to authenticated,service_role;
