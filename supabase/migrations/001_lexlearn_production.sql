-- LexLearn production schema: centralized accounts, learning evidence, governance and audit.
create extension if not exists pgcrypto;

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  institution text,
  academic_year text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','instructor','content_reviewer','student')),
  username text unique,
  display_name text not null,
  active boolean not null default true,
  must_change_password boolean not null default false,
  university text,
  year_label text,
  cohort_id uuid references public.cohorts(id) on delete set null,
  locale text not null default 'ar',
  country_code text check (country_code in ('qa','eg')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id text primary key,
  country_code text not null,
  institution_code text not null,
  course_code text not null,
  title_ar text not null,
  title_en text,
  year_level integer,
  credit_hours numeric,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','completed','withdrawn')),
  assigned_at timestamptz not null default now(),
  unique(user_id,course_id)
);

create table if not exists public.learner_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  snapshot_type text not null check (snapshot_type in ('profile','course')),
  state jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  unique(user_id,course_id,snapshot_type)
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  item_id text,
  dimension text,
  answer_text text,
  selected_option text,
  score numeric check (score is null or (score >= 0 and score <= 1)),
  confidence integer check (confidence is null or confidence between 1 and 3),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  difficulty integer check (difficulty is null or difficulty between 1 and 5),
  grading_method text,
  error_type text,
  created_at timestamptz not null default now()
);
create index if not exists attempts_user_course_created_idx on public.attempts(user_id,course_id,created_at desc);

create table if not exists public.learning_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  weakest_dimension text,
  strongest_dimension text,
  bridge_mode text,
  goals_json jsonb not null default '[]'::jsonb,
  model_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id,course_id)
);

create table if not exists public.content_sources (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  title text not null,
  source_url text,
  source_type text not null default 'official',
  jurisdiction text,
  effective_date date,
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.content_items (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  unit_id text,
  concept_id text,
  dimension text not null,
  difficulty integer not null default 2 check (difficulty between 1 and 5),
  item_type text not null,
  prompt_ar text not null,
  options_json jsonb,
  correct_answer_json jsonb,
  rubric_json jsonb not null default '[]'::jsonb,
  source_ids text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','legal_review','learning_review','approved','retired')),
  version integer not null default 1,
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_items_course_status_idx on public.content_items(course_id,status);

create table if not exists public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  item_id text not null references public.content_items(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  review_type text not null check (review_type in ('legal','learning')),
  decision text not null check (decision in ('approved','changes_requested')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  notice_version text not null,
  consent_type text not null,
  accepted boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id),
  target_user_id uuid references public.profiles(id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.courses(id,country_code,institution_code,course_code,title_ar,title_en,year_level,credit_hours,metadata)
values
('qa-qu-lawc213','qa','QU','LAWC 213','مصادر الالتزام','Sources of Obligations',1,3,'{"official":true}'::jsonb),
('qa-lu-lawc104','qa','LU','LAWC 104','مصادر الالتزام','Sources of Obligations',1,3,'{"official":true}'::jsonb),
('eg-civil-sources','eg','EG','CIVIL-SOURCES','مصادر الالتزام','Sources of Obligations',1,3,'{}'::jsonb)
on conflict(id) do update set title_ar=excluded.title_ar,title_en=excluded.title_en,year_level=excluded.year_level,credit_hours=excluded.credit_hours,metadata=excluded.metadata;

create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner','admin','instructor','content_reviewer')
  );
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

alter table public.cohorts enable row level security;
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.learner_snapshots enable row level security;
alter table public.attempts enable row level security;
alter table public.learning_plans enable row level security;
alter table public.content_sources enable row level security;
alter table public.content_items enable row level security;
alter table public.content_reviews enable row level security;
alter table public.consent_records enable row level security;
alter table public.activity_events enable row level security;
alter table public.admin_audit enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated using (id=auth.uid());
create policy profiles_staff_read on public.profiles for select to authenticated using (public.is_staff());

create policy cohorts_authenticated_read on public.cohorts for select to authenticated using (true);
create policy cohorts_staff_write on public.cohorts for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy courses_authenticated_read on public.courses for select to authenticated using (active=true or public.is_staff());
create policy courses_staff_write on public.courses for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy enrollments_self_read on public.enrollments for select to authenticated using (user_id=auth.uid());
create policy enrollments_staff_all on public.enrollments for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy snapshots_self_all on public.learner_snapshots for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy snapshots_staff_read on public.learner_snapshots for select to authenticated using (public.is_staff());

create policy attempts_self_insert on public.attempts for insert to authenticated with check (user_id=auth.uid());
create policy attempts_self_read on public.attempts for select to authenticated using (user_id=auth.uid());
create policy attempts_staff_read on public.attempts for select to authenticated using (public.is_staff());

create policy plans_self_all on public.learning_plans for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy plans_staff_read on public.learning_plans for select to authenticated using (public.is_staff());

create policy sources_authenticated_read on public.content_sources for select to authenticated using (true);
create policy sources_staff_write on public.content_sources for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy content_approved_read on public.content_items for select to authenticated using (status='approved' or public.is_staff());
create policy content_staff_write on public.content_items for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy reviews_staff_all on public.content_reviews for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy consent_self_all on public.consent_records for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy activity_self_insert on public.activity_events for insert to authenticated with check (user_id=auth.uid());
create policy activity_self_read on public.activity_events for select to authenticated using (user_id=auth.uid());
create policy activity_staff_read on public.activity_events for select to authenticated using (public.is_staff());
create policy audit_staff_read on public.admin_audit for select to authenticated using (public.is_staff());

grant select on public.profiles,public.cohorts,public.courses,public.enrollments,public.learner_snapshots,public.attempts,public.learning_plans,public.content_sources,public.content_items,public.content_reviews,public.consent_records,public.activity_events,public.admin_audit to authenticated;
grant insert,update,delete on public.cohorts,public.courses,public.enrollments,public.content_sources,public.content_items,public.content_reviews to authenticated;
grant insert,update,delete on public.learner_snapshots,public.learning_plans,public.consent_records to authenticated;
grant insert on public.attempts,public.activity_events to authenticated;
