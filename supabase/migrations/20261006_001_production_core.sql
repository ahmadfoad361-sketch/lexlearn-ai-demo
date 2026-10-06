-- LexLearn production core — centralized auth, data, analytics and RLS
create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  institution text,
  academic_year text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('owner','admin','instructor','content_reviewer','student')),
  username citext unique,
  display_name text not null default '',
  active boolean not null default true,
  must_change_password boolean not null default false,
  university text,
  year_label text,
  cohort_id uuid references public.cohorts(id) on delete set null,
  locale text not null default 'ar',
  country_code text not null default 'qa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id text primary key,
  country_code text not null,
  institution_key text not null,
  course_code text not null,
  title_ar text not null,
  title_en text,
  academic_year text,
  version integer not null default 1,
  status text not null default 'draft' check (status in ('draft','review','approved','retired')),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','completed','removed')),
  assigned_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.content_sources (
  id text primary key,
  country_code text not null,
  title text not null,
  authority text,
  source_url text,
  source_type text not null default 'official',
  effective_date date,
  status text not null default 'approved' check (status in ('draft','review','approved','retired')),
  excerpt text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  unit_id text,
  concept_id text,
  variant_group_id text,
  dimension text not null check (dimension in ('recall','understanding','legal_precision','application','transfer','exam_execution','retention','observation')),
  difficulty smallint not null default 2 check (difficulty between 1 and 5),
  item_type text not null default 'mcq',
  prompt_ar text not null,
  options_json jsonb,
  answer_key_json jsonb,
  rubric_json jsonb,
  source_ids text[] not null default '{}',
  exam_frequency_tag text not null default 'unknown' check (exam_frequency_tag in ('unknown','rare','medium','frequent')),
  exam_importance_weight numeric(4,3) not null default 0 check (exam_importance_weight between 0 and 1),
  status text not null default 'draft' check (status in ('draft','legal_review','learning_review','approved','retired')),
  version integer not null default 1,
  legal_reviewer uuid references public.profiles(id),
  learning_reviewer uuid references public.profiles(id),
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  item_id text references public.content_items(id) on delete set null,
  dimension text,
  answer_text text,
  selected_option text,
  score numeric(5,4) check (score is null or (score between 0 and 1)),
  confidence smallint check (confidence is null or confidence between 1 and 3),
  latency_ms integer,
  hint_count integer not null default 0,
  difficulty smallint,
  grading_method text,
  error_type text,
  ai_grade jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.mastery_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  dimension text not null,
  concept_id text,
  unit_id text,
  evidence_value numeric(5,4) not null check (evidence_value between 0 and 1),
  evidence_weight numeric(6,3) not null default 1,
  source_attempt_id uuid references public.attempts(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.learner_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null,
  snapshot_type text not null check (snapshot_type in ('profile','course','plan','ui')),
  state jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  unique (user_id, course_id, snapshot_type)
);

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
  unique(user_id, course_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  item_id text references public.content_items(id) on delete cascade,
  due_at timestamptz not null,
  interval_hours integer,
  status text not null default 'due' check (status in ('due','completed','cancelled')),
  reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.activity_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
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

create table if not exists public.ai_grading_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null,
  item_id text,
  model text,
  prompt_version text,
  source_ids text[] not null default '{}',
  result jsonb not null default '{}'::jsonb,
  model_confidence numeric(5,4),
  needs_human_review boolean not null default false,
  latency_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_attempts_user_course_created on public.attempts(user_id,course_id,created_at desc);
create index if not exists idx_mastery_user_course_dimension on public.mastery_evidence(user_id,course_id,dimension,created_at desc);
create index if not exists idx_reviews_due on public.reviews(user_id,status,due_at);
create index if not exists idx_activity_user_created on public.activity_events(user_id,created_at desc);
create index if not exists idx_content_course_status on public.content_items(course_id,status,dimension);
create index if not exists idx_profiles_cohort on public.profiles(cohort_id,active);

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.active and p.role in ('owner','admin','instructor'));
$$;

create or replace function public.is_content_reviewer()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.active and p.role in ('owner','admin','content_reviewer'));
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists trg_courses_updated on public.courses;
create trigger trg_courses_updated before update on public.courses for each row execute function public.touch_updated_at();
drop trigger if exists trg_content_updated on public.content_items;
create trigger trg_content_updated before update on public.content_items for each row execute function public.touch_updated_at();
drop trigger if exists trg_snapshots_updated on public.learner_snapshots;
create trigger trg_snapshots_updated before update on public.learner_snapshots for each row execute function public.touch_updated_at();
drop trigger if exists trg_plans_updated on public.learning_plans;
create trigger trg_plans_updated before update on public.learning_plans for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,role,username,display_name,active,must_change_password,university,year_label,country_code)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'role','student'),
    nullif(new.raw_user_meta_data->>'username',''),
    coalesce(new.raw_user_meta_data->>'display_name',''),
    true,
    coalesce((new.raw_user_meta_data->>'must_change_password')::boolean,false),
    new.raw_user_meta_data->>'university',
    new.raw_user_meta_data->>'year_label',
    coalesce(nullif(new.raw_user_meta_data->>'country_code',''),'qa')
  )
  on conflict(id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.cohorts enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.content_sources enable row level security;
alter table public.content_items enable row level security;
alter table public.attempts enable row level security;
alter table public.mastery_evidence enable row level security;
alter table public.learner_snapshots enable row level security;
alter table public.learning_plans enable row level security;
alter table public.reviews enable row level security;
alter table public.activity_events enable row level security;
alter table public.consent_records enable row level security;
alter table public.ai_grading_runs enable row level security;
alter table public.admin_audit enable row level security;

drop policy if exists "profiles self or staff read" on public.profiles;
create policy "profiles self or staff read" on public.profiles for select to authenticated using (id=auth.uid() or public.is_staff());
drop policy if exists "profiles staff update" on public.profiles;
create policy "profiles staff update" on public.profiles for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "cohorts authenticated read" on public.cohorts;
create policy "cohorts authenticated read" on public.cohorts for select to authenticated using (true);
drop policy if exists "cohorts staff write" on public.cohorts;
create policy "cohorts staff write" on public.cohorts for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "approved courses read" on public.courses;
create policy "approved courses read" on public.courses for select to authenticated using (status='approved' or public.is_staff() or public.is_content_reviewer());
drop policy if exists "courses staff write" on public.courses;
create policy "courses staff write" on public.courses for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "enrollments own or staff" on public.enrollments;
create policy "enrollments own or staff" on public.enrollments for select to authenticated using (user_id=auth.uid() or public.is_staff());
drop policy if exists "enrollments staff write" on public.enrollments;
create policy "enrollments staff write" on public.enrollments for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "approved sources read" on public.content_sources;
create policy "approved sources read" on public.content_sources for select to authenticated using (status='approved' or public.is_content_reviewer() or public.is_staff());
drop policy if exists "sources reviewer write" on public.content_sources;
create policy "sources reviewer write" on public.content_sources for all to authenticated using (public.is_content_reviewer()) with check (public.is_content_reviewer());

drop policy if exists "approved items read" on public.content_items;
create policy "approved items read" on public.content_items for select to authenticated using (status='approved' or public.is_content_reviewer() or public.is_staff());
drop policy if exists "items reviewer write" on public.content_items;
create policy "items reviewer write" on public.content_items for all to authenticated using (public.is_content_reviewer()) with check (public.is_content_reviewer());

drop policy if exists "attempts own insert" on public.attempts;
create policy "attempts own insert" on public.attempts for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "attempts own or staff read" on public.attempts;
create policy "attempts own or staff read" on public.attempts for select to authenticated using (user_id=auth.uid() or public.is_staff());

drop policy if exists "mastery own insert" on public.mastery_evidence;
create policy "mastery own insert" on public.mastery_evidence for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "mastery own or staff read" on public.mastery_evidence;
create policy "mastery own or staff read" on public.mastery_evidence for select to authenticated using (user_id=auth.uid() or public.is_staff());

drop policy if exists "snapshots own or staff read" on public.learner_snapshots;
create policy "snapshots own or staff read" on public.learner_snapshots for select to authenticated using (user_id=auth.uid() or public.is_staff());
drop policy if exists "snapshots own write" on public.learner_snapshots;
create policy "snapshots own write" on public.learner_snapshots for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "snapshots own update" on public.learner_snapshots;
create policy "snapshots own update" on public.learner_snapshots for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "snapshots staff update" on public.learner_snapshots;
create policy "snapshots staff update" on public.learner_snapshots for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "plans own or staff read" on public.learning_plans;
create policy "plans own or staff read" on public.learning_plans for select to authenticated using (user_id=auth.uid() or public.is_staff());
drop policy if exists "plans own write" on public.learning_plans;
create policy "plans own write" on public.learning_plans for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "reviews own or staff read" on public.reviews;
create policy "reviews own or staff read" on public.reviews for select to authenticated using (user_id=auth.uid() or public.is_staff());
drop policy if exists "reviews own write" on public.reviews;
create policy "reviews own write" on public.reviews for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "events own insert" on public.activity_events;
create policy "events own insert" on public.activity_events for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "events own or staff read" on public.activity_events;
create policy "events own or staff read" on public.activity_events for select to authenticated using (user_id=auth.uid() or public.is_staff());

drop policy if exists "consent own" on public.consent_records;
create policy "consent own" on public.consent_records for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "ai runs own or staff read" on public.ai_grading_runs;
create policy "ai runs own or staff read" on public.ai_grading_runs for select to authenticated using (user_id=auth.uid() or public.is_staff());
drop policy if exists "ai runs own insert" on public.ai_grading_runs;
create policy "ai runs own insert" on public.ai_grading_runs for insert to authenticated with check (user_id=auth.uid());

drop policy if exists "audit staff read" on public.admin_audit;
create policy "audit staff read" on public.admin_audit for select to authenticated using (public.is_staff());

insert into public.courses(id,country_code,institution_key,course_code,title_ar,title_en,academic_year,status,metadata)
values
('qa-qu-lawc213','qa','qatar-university','LAWC 213','مصادر الالتزام','Sources of Obligations','2025-2026','approved','{"year":"first","semester":"spring","credits":3,"prerequisite":"LAWC 101"}'::jsonb),
('qa-lu-lawc104','qa','lusail-university','LAWC 104','مصادر الالتزام','Sources of Obligation','2025-2026','approved','{"year":"first","semester":"spring","credits":3,"prerequisite":"LAWC 101"}'::jsonb)
on conflict(id) do update set metadata=excluded.metadata, status=excluded.status, updated_at=now();
