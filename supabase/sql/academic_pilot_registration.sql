-- Rollout SQL for the academic-research registration feature.
-- Apply through a reviewed Supabase migration BEFORE deploying its Edge Functions and frontend.
-- Existing conference registrations remain conference records.
alter table public.profiles
  add column if not exists registration_track text not null default 'conference',
  add column if not exists faculty text,
  add column if not exists institutional_email text,
  add column if not exists student_registration_number text,
  add column if not exists institutional_email_verified_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='profiles_registration_track_check') then
    alter table public.profiles add constraint profiles_registration_track_check
      check (registration_track in ('conference','academic'));
  end if;
end $$;
create unique index if not exists profiles_academic_email_unique
  on public.profiles (lower(institutional_email))
  where registration_track='academic' and institutional_email is not null;
-- Institutions may require a student number, and may choose authorized email domains.
-- Only privileged server code can read/edit policies; the public cannot self-approve.
create table if not exists public.academic_registration_policies(
  university text not null,
  faculty text not null,
  require_student_number boolean not null default false,
  allowed_email_domains text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (university,faculty)
);
alter table public.academic_registration_policies enable row level security;
revoke all on table public.academic_registration_policies from anon, authenticated;
-- University administrators can configure policy after confirming the agreement.
-- Example (DO NOT run without institution authorization):
-- insert into public.academic_registration_policies
--   (university,faculty,require_student_number,allowed_email_domains)
-- values ('University Name','Faculty of Law',true,ARRAY['university.edu'])
-- on conflict (university,faculty) do update set
-- require_student_number=excluded.require_student_number,
-- allowed_email_domains=excluded.allowed_email_domains,updated_at=now();
