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

-- Security hardening: a faculty instructor may not update roles or other users' profiles
-- by calling the PostgREST Data API directly. All student management goes through
-- scoped, staff-authenticated Edge Functions using the privileged server key.
create or replace function private.is_platform_admin()
 returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from public.profiles p where p.id=(select auth.uid())
   and p.active=true and p.role in ('owner','admin'));
$$;
revoke all on function private.is_platform_admin() from public,anon;
grant execute on function private.is_platform_admin() to authenticated;
drop policy if exists "profiles staff update" on public.profiles;
create policy "profiles platform admin update" on public.profiles for update
 to authenticated using(private.is_platform_admin())
 with check(private.is_platform_admin());
drop policy if exists "cohorts staff write" on public.cohorts;
create policy "cohorts platform admin write" on public.cohorts for all
 to authenticated using(private.is_platform_admin())
 with check(private.is_platform_admin());
