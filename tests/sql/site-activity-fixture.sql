-- Disposable CI database only.
do $$begin create role service_role nologin bypassrls;exception when duplicate_object then null;end $$;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
grant select on public.profiles to service_role;
