-- Correct ONLY prior diagnostic attempts where v1 provider output required human
-- review and the one-criterion internal model had misleadingly shown 100%.
-- Preserve that original legacy grade verbatim for scientific audit.
-- The recalculation is an INTERNAL provisional rule-coverage score, not an OpenAI score.
update public.student_diagnostic_runs d
set result=jsonb_set(
 d.result,
 '{measurements,recall,corrected_internal_grade}',
 public.lex_internal_personality_grade('diagnostic-legal-personality',d.free_text)
   || jsonb_build_object('rubric_version','20261022_002_three_element_internal',
                        'grade_origin','server_rubric_not_openai'),
 true),
 updated_at=now()
where d.status='completed'
 and coalesce(length(trim(d.free_text)),0)>=10
 and d.result #>> '{measurements,recall,internal_grade,provisional_percent}'='100'
 and not (coalesce(d.result->'measurements'->'recall','{}'::jsonb) ? 'corrected_internal_grade')
 and exists (
  select 1 from public.ai_grading_runs a
  where a.user_id=d.user_id and a.course_id=d.course_id
    and a.item_id='diagnostic-legal-personality:'||d.attempt_id::text
    and a.prompt_version='lexlearn-diagnostic-ai-v1'
    and a.result->>'reason'='academic_review_required'
 )
 and public.lex_internal_personality_grade('diagnostic-legal-personality',d.free_text)->>'status'='preliminary_internal';
