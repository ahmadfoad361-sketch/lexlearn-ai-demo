-- Add non-destructive academic defaults for cohort-first staff/student enrollment.
-- Existing learner profiles, assignments and authentication remain unchanged.
alter table public.cohorts
 add column if not exists faculty text,
 add column if not exists country_code text default 'qa',
 add column if not exists course_id text default 'qa-qu-lawc101-rights',
 add column if not exists subject_name text default 'نظرية الحق';

-- Existing groups can inherit missing display values from their member profiles in the UI.
-- No existing student assignments or records are changed by this migration.
