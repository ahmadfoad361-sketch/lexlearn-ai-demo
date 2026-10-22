-- At-most-once billable AI assessment per completed diagnostic attempt.
-- Reservation happens before any provider request; retries never re-bill.
create unique index if not exists ux_lex_diagnostic_ai_once
on public.ai_grading_runs (user_id,course_id,item_id,prompt_version)
where prompt_version='lexlearn-diagnostic-ai-v1';
