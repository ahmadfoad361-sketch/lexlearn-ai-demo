-- Add non-destructive academic defaults for cohort-first staff/student enrollment.
-- Existing learner profiles, assignments and authentication remain unchanged.
alter table public.cohorts
 add column if not exists faculty text,
 add column if not exists country_code text default 'qa',
 add column if not exists course_id text default 'qa-qu-lawc101-rights',
 add column if not exists subject_name text default 'نظرية الحق';

-- Only fill previously missing defaults from enrolled students. Do not rewrite
-- a cohort's explicitly entered institution or any student's academic record.
update public.cohorts as c
set faculty=coalesce(nullif(c.faculty,''),nullif(p.faculty,'')),
    academic_year=coalesce(nullif(c.academic_year,''),nullif(p.year_label,'')),
    country_code=coalesce(nullif(p.country_code,''),c.country_code,'qa')
from lateral (
  select p.faculty,p.year_label,p.country_code
  from public.profiles p where p.cohort_id=c.id and p.role='student'
  order by p.created_at asc limit 1
) as p
where (c.faculty is null or c.academic_year is null);
