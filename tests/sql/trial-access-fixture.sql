-- Isolated CI only.
alter table public.profiles add column if not exists lexlearn_number bigint;
alter table public.courses add column if not exists title_ar text default 'نظرية الحق';
alter table public.attempts add column if not exists user_id uuid;
alter table public.attempts add column if not exists course_id text;
alter table public.attempts enable row level security;
create policy "fixture own insert" on public.attempts for insert to authenticated with check(user_id=auth.uid());
grant insert on public.attempts to authenticated;
create table if not exists public.learner_snapshots(id uuid,user_id uuid,course_id text,state jsonb);
alter table public.learner_snapshots enable row level security;
create table public.admin_audit(id bigint generated always as identity primary key,actor_user_id uuid,target_user_id uuid,action text,details jsonb,created_at timestamptz default now());
update public.profiles set account_status=case when active then 'active' else 'paused' end;
-- Only student A was explicitly approved. Existing results must survive the migration.
insert into public.admin_audit(actor_user_id,target_user_id,action,details) values('90000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','CREATE_STUDENT','{}');
