alter table public.content_sources add column if not exists excerpt_text text not null default '';
alter table public.content_sources add column if not exists citation_label text;

create index if not exists snapshots_user_course_idx on public.learner_snapshots(user_id,course_id);
create index if not exists plans_user_course_idx on public.learning_plans(user_id,course_id);
create index if not exists audit_created_idx on public.admin_audit(created_at desc);
create index if not exists activity_user_created_idx on public.activity_events(user_id,created_at desc);
