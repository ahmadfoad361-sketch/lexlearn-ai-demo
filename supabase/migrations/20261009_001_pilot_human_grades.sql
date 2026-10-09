-- Instructor decisions are separate from student-writable course snapshots.
create table if not exists public.pilot_human_grades (
  attempt_id uuid primary key references public.attempts(id) on delete cascade,
  reviewer_id uuid not null default auth.uid() references public.profiles(id),
  passed boolean not null,
  feedback text not null check (length(btrim(feedback)) between 12 and 2000),
  criteria jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz not null default now()
);
create index if not exists pilot_human_grades_reviewer_idx on public.pilot_human_grades(reviewer_id, reviewed_at desc);
alter table public.pilot_human_grades enable row level security;
revoke all on public.pilot_human_grades from anon, authenticated;
grant select, insert on public.pilot_human_grades to authenticated;
create policy pilot_grade_read on public.pilot_human_grades for select to authenticated
  using (private.is_staff() or exists (
    select 1 from public.attempts a where a.id=attempt_id and a.user_id=auth.uid()
  ));
create policy pilot_grade_staff_insert on public.pilot_human_grades for insert to authenticated
  with check (private.is_staff() and reviewer_id=auth.uid() and exists (
    select 1 from public.attempts a where a.id=attempt_id
      and a.course_id='qa-qu-lawc101-rights'
      and a.grading_method='pilot_human_pending'
      and a.score is null
  ));
