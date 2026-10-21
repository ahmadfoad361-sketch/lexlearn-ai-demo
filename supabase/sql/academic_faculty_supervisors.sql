-- Academic faculty-to-cohort security boundary (run after academic_pilot_registration.sql).
-- Does not grant clients write access; app creates and resolves relationships server-side.
alter table public.profiles add column if not exists academic_title text;
create table if not exists public.academic_faculty_cohorts(
  university text not null,
  faculty text not null,
  cohort_id uuid not null unique references public.cohorts(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key(university,faculty)
);
alter table public.academic_faculty_cohorts enable row level security;
revoke all on public.academic_faculty_cohorts from anon,authenticated;
create index if not exists academic_faculty_cohorts_cohort_idx on public.academic_faculty_cohorts(cohort_id);
-- Existing private.can_access_student() authorizes instructor access only when cohort_id matches.
-- By assigning the exact faculty cohort_id to both instructor and student on the server,
-- RLS protects profiles, student attempts and learner snapshots without browser filters.
-- All newly assigned faculty students must have the correct cohort_id.
