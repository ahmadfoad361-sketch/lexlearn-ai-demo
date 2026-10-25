-- Isolated PostgreSQL test only; no student or professor in production.
alter table public.profiles add column if not exists university text;
alter table public.profiles add column if not exists year_label text;
alter table public.profiles add column if not exists country_code text;
alter table public.profiles add column if not exists contact_email text;
alter table public.profiles add column if not exists account_status text;
create table if not exists public.cohorts(id uuid primary key);
create table if not exists public.curriculum_mappings(id uuid primary key);
create table if not exists public.demo_submissions(id uuid primary key,reviewed_by uuid);
create or replace function private.is_platform_admin() returns boolean language sql stable security definer
set search_path='' as $$ select exists(select 1 from public.profiles where id=auth.uid() and active and role in ('owner','admin')); $$;
insert into public.profiles(id,role,active,display_name) values
 ('90000000-0000-4000-8000-000000000001','owner',true,'Pilot Supervisor')
on conflict(id) do nothing;
update public.profiles set university='Qatar University',faculty='Faculty of Law',
 year_label='السنة الأولى',country_code='qa' where id='10000000-0000-4000-8000-000000000001';
update public.profiles set university='Other University',faculty='Faculty of Law',
 year_label='السنة الأولى',country_code='qa' where id='10000000-0000-4000-8000-000000000002';
update public.profiles set university='Qatar University',faculty='Faculty of Law',
 year_label='السنة الثانية',country_code='qa' where id='10000000-0000-4000-8000-000000000003';
update public.profiles set university='Qatar University',faculty='Faculty of Arts',
 year_label='السنة الأولى',country_code='qa' where id='10000000-0000-4000-8000-000000000004';
