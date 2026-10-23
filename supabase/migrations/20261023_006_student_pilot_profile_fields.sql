-- Student fields agreed for a documented operational/scientific pilot.
-- Existing accounts remain valid. Registration identifiers are optional and
-- never accepted as identity proof or used for authorization.
alter table public.profiles
 add column if not exists faculty text,
 add column if not exists academic_section text,
 add column if not exists student_registration_number text,
 add column if not exists institutional_group_email text;

comment on column public.profiles.faculty is 'Self-reported faculty/college; not verified by a university.';
comment on column public.profiles.academic_section is 'Optional department or class section; self-reported.';
comment on column public.profiles.student_registration_number is 'Optional institutional enrollment/card number; never a national identity number.';
comment on column public.profiles.institutional_group_email is 'Optional institution/cohort group email; unverified.';

-- The existing profile SELECT RLS scopes the fields to the learner and authorized
-- staff. All inserts/updates during registration remain server-side service-role only.
