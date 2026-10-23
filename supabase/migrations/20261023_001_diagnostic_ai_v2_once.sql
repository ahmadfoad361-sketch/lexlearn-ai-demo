-- A paid diagnostic must remain billable at most once per immutable student attempt
-- across both grading rubric versions. No deletion or mutation of historical v1 entries.
create unique index if not exists ux_lex_diagnostic_ai_v2_once
on public.ai_grading_runs (user_id,course_id,item_id,prompt_version)
where prompt_version='lexlearn-diagnostic-ai-v2';
