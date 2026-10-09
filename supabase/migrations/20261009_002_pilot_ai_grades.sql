-- Semantic feedback is written by the server, not by the learner's browser.
create table public.pilot_ai_grades (
  attempt_id uuid primary key references public.attempts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('scored','review_required')),
  score numeric check (score between 0 and 1),
  passed boolean,
  feedback text not null,
  model_confidence numeric check (model_confidence between 0 and 1),
  criteria jsonb not null default '{}'::jsonb,
  source_ids text[] not null,
  model text not null,
  created_at timestamptz not null default now(),
  constraint pilot_ai_grade_consistency check (
    (status='scored' and score is not null and passed is not null) or
    (status='review_required' and score is null and passed is null)
  )
);
create index pilot_ai_grades_user_created_idx on public.pilot_ai_grades(user_id,created_at desc);
alter table public.pilot_ai_grades enable row level security;
revoke all on public.pilot_ai_grades from anon, authenticated;
grant select on public.pilot_ai_grades to authenticated;
create policy pilot_ai_grade_read on public.pilot_ai_grades for select to authenticated
  using (private.is_staff() or (user_id=auth.uid() and exists (
    select 1 from public.attempts a where a.id=attempt_id and a.user_id=auth.uid()
  )));
