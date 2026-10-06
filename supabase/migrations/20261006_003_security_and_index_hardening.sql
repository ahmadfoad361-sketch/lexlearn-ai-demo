create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.is_staff() set schema private;
alter function public.is_content_reviewer() set schema private;
alter function public.is_active_user() set schema private;
alter function public.handle_new_user() set schema private;

revoke all on function private.is_staff() from public, anon;
revoke all on function private.is_content_reviewer() from public, anon;
revoke all on function private.is_active_user() from public, anon;
revoke all on function private.handle_new_user() from public, anon, authenticated;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.is_content_reviewer() to authenticated;
grant execute on function private.is_active_user() to authenticated;

alter function public.touch_updated_at() set search_path = public;

create index if not exists idx_admin_audit_actor on public.admin_audit(actor_user_id);
create index if not exists idx_admin_audit_target on public.admin_audit(target_user_id);
create index if not exists idx_ai_runs_user on public.ai_grading_runs(user_id,created_at desc);
create index if not exists idx_attempts_course on public.attempts(course_id);
create index if not exists idx_attempts_item on public.attempts(item_id);
create index if not exists idx_consent_user on public.consent_records(user_id,created_at desc);
create index if not exists idx_content_learning_reviewer on public.content_items(learning_reviewer);
create index if not exists idx_content_legal_reviewer on public.content_items(legal_reviewer);
create index if not exists idx_curriculum_course on public.curriculum_mappings(course_id);
create index if not exists idx_enrollments_course on public.enrollments(course_id);
create index if not exists idx_plans_course on public.learning_plans(course_id);
create index if not exists idx_mastery_course on public.mastery_evidence(course_id);
create index if not exists idx_mastery_attempt on public.mastery_evidence(source_attempt_id);
create index if not exists idx_reviews_course on public.reviews(course_id);
create index if not exists idx_reviews_item on public.reviews(item_id);
