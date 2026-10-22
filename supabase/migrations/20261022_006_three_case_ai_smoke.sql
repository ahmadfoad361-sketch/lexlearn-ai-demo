-- Isolated, three-call maximum AI grading smoke test. No student inputs or student records.
-- This is not a university validation or a student grade.
create table if not exists public.lex_ai_grading_smoke (
  case_id text primary key check (case_id in ('full_ar','reversed_ar','paraphrase_en')),
  state text not null default 'reserved' check (state in ('reserved','completed','provider_error','review_required')),
  model text not null default 'gpt-5.4-mini',
  observed_score integer check (observed_score between 0 and 100),
  expected_min integer check (expected_min between 0 and 100),
  expected_max integer check (expected_max between 0 and 100),
  agreement boolean,
  reason text,
  prompt_tokens integer,
  completion_tokens integer,
  estimated_cost_usd numeric(10,6),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.lex_ai_grading_smoke enable row level security;
revoke all on public.lex_ai_grading_smoke from public,anon,authenticated;
grant select,insert,update on public.lex_ai_grading_smoke to service_role;
comment on table public.lex_ai_grading_smoke is 'Exactly three synthetic grading smoke-test cases, reserved atomically by primary key. No real students, raw answers, or provider keys stored.';
