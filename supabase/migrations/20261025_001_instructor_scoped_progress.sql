-- University instructor pilot: independent, assignment-scoped access.
-- Never equate word-matching scores with validated educational improvement.
create table if not exists public.instructor_profiles(
 instructor_id uuid primary key references public.profiles(id) on delete cascade,
 official_email text not null,
 academic_title text not null default 'دكتور',
 specialization text,
 office_hours text,
 bio text,
 whatsapp_e164 text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint instructor_official_email check(length(official_email)<=254 and official_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 constraint instructor_whatsapp_check check(whatsapp_e164 is null or whatsapp_e164 ~ '^\+[1-9][0-9]{7,14}$')
);
create table if not exists public.instructor_assignments(
 id uuid primary key default gen_random_uuid(),
 instructor_id uuid not null references public.instructor_profiles(instructor_id) on delete cascade,
 course_id text not null references public.courses(id),
 subject_name text not null,
 country_code text not null,
 university text not null,
 faculty text not null,
 year_label text not null,
 active boolean not null default true,
 created_by uuid references public.profiles(id),
 created_at timestamptz not null default now(),
 unique(instructor_id,course_id,country_code,university,faculty,year_label),
 constraint valid_assignment check(length(trim(subject_name)) between 2 and 160 and
  length(trim(university)) between 2 and 160 and length(trim(faculty)) between 2 and 160
  and length(trim(year_label)) between 2 and 80 and country_code in ('qa','eg','sa','ae','other'))
);
create index if not exists instructor_assignments_scope on public.instructor_assignments(instructor_id,course_id,active);
create index if not exists instructor_student_lookup on public.profiles(role,university,faculty,year_label,country_code);
alter table public.instructor_profiles enable row level security;
alter table public.instructor_assignments enable row level security;
revoke all on public.instructor_profiles,public.instructor_assignments from anon,authenticated;
grant select on public.instructor_profiles,public.instructor_assignments to authenticated;
create policy "instructor profile self or platform admin" on public.instructor_profiles
 for select to authenticated using(instructor_id=auth.uid() or private.is_platform_admin());
create policy "instructor assignment self or platform admin" on public.instructor_assignments
 for select to authenticated using(instructor_id=auth.uid() or private.is_platform_admin());

-- Instructors do not inherit all-students access by sharing a cohort ID.
create or replace function private.can_access_student(p_student uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p
  where p.id=auth.uid() and p.active and p.role in ('owner','admin'))
 and exists(select 1 from public.profiles s where s.id=p_student and s.role='student');
$$;
revoke all on function private.can_access_student(uuid) from public,anon;

-- Legacy "is_staff" historically included instructors and thereby granted cross-course
-- content/library access. From now on it is administrator-only.
create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid()
  and p.active and p.role in ('owner','admin'));
$$;
revoke all on function private.is_staff() from public,anon;

-- Legacy subject-independent instructor reads must not expose another cohort's
-- essay attempts or public demo submissions.
drop policy if exists "level responses scoped instructor read" on public.student_level_responses;
create policy "level responses platform admin read" on public.student_level_responses
 for select to authenticated using(private.is_platform_admin());
drop policy if exists "demo_submissions_supervisors_read" on public.demo_submissions;
create policy "demo_submissions_platform_admin_read" on public.demo_submissions
 for select to authenticated using(private.is_platform_admin());
drop policy if exists "demo_submissions_supervisors_update" on public.demo_submissions;
create policy "demo_submissions_platform_admin_update" on public.demo_submissions
 for update to authenticated using(private.is_platform_admin())
 with check(private.is_platform_admin() and reviewed_by=auth.uid());

-- Existing staff write policies must not allow an instructor to edit all users, courses or curriculum.
drop policy if exists "profiles staff update" on public.profiles;
create policy "profiles platform admin update" on public.profiles for update to authenticated
 using(private.is_platform_admin()) with check(private.is_platform_admin());
drop policy if exists "cohorts staff write" on public.cohorts;
create policy "cohorts platform admin write" on public.cohorts for all to authenticated
 using(private.is_platform_admin()) with check(private.is_platform_admin());
drop policy if exists "courses staff write" on public.courses;
create policy "courses platform admin write" on public.courses for all to authenticated
 using(private.is_platform_admin()) with check(private.is_platform_admin());
drop policy if exists "curriculum staff write" on public.curriculum_mappings;
create policy "curriculum platform admin write" on public.curriculum_mappings for all to authenticated
 using(private.is_platform_admin()) with check(private.is_platform_admin());
drop policy if exists "diagnostic instructor cohort read" on public.student_diagnostic_runs;

-- Scope must match school + faculty + year + explicit course, not an uncontrolled "instructor" role.
create or replace function private.instructor_can_view(p_student uuid,p_course text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.profiles staff
  join public.instructor_assignments a on a.instructor_id=staff.id and a.active=true
  join public.profiles student on student.id=p_student and student.role='student' and student.active=true
  join public.enrollments e on e.user_id=student.id and e.course_id=a.course_id and e.status='active'
  where staff.id=auth.uid() and staff.role='instructor' and staff.active=true
   and a.course_id=p_course
   and lower(trim(a.university))=lower(trim(coalesce(student.university,'')))
   and lower(trim(a.faculty))=lower(trim(coalesce(student.faculty,'')))
   and lower(trim(a.year_label))=lower(trim(coalesce(student.year_label,'')))
   and a.country_code=student.country_code
 );
$$;
revoke all on function private.instructor_can_view(uuid,text) from public,anon;

-- Instructor identity, permitted assignments and *minimal* student roster only.
create or replace function public.lex_instructor_roster()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
 if uid is null or not exists(select 1 from public.profiles p where p.id=uid and p.role='instructor' and p.active)
 then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 select jsonb_build_object(
 'profile',jsonb_build_object('name',p.display_name,'academic_title',ip.academic_title,
  'official_email',ip.official_email,'specialization',ip.specialization,'office_hours',ip.office_hours,
  'bio',ip.bio,'whatsapp',ip.whatsapp_e164),
 'assignments',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'subject',a.subject_name,'university',a.university,
  'faculty',a.faculty,'year',a.year_label,'course_id',a.course_id,'country',a.country_code) order by a.subject_name)
  from public.instructor_assignments a where a.instructor_id=uid and a.active), '[]'::jsonb),
 'students',coalesce((select jsonb_agg(distinct jsonb_build_object('assignment_id',a.id,'id',s.id,'name',s.display_name,'university',s.university,
   'faculty',s.faculty,'year',s.year_label,'course_id',a.course_id,'subject',a.subject_name))
  from public.instructor_assignments a
  join public.profiles s on s.role='student' and s.active
    and lower(trim(s.university))=lower(trim(a.university))
    and lower(trim(coalesce(s.faculty,'')))=lower(trim(a.faculty))
    and lower(trim(coalesce(s.year_label,'')))=lower(trim(a.year_label))
    and s.country_code=a.country_code
  join public.enrollments e on e.user_id=s.id and e.course_id=a.course_id and e.status='active'
  where a.instructor_id=uid and a.active), '[]'::jsonb)
 ) into result from public.profiles p join public.instructor_profiles ip on ip.instructor_id=p.id
 where p.id=uid;
 return coalesce(result,'{}'::jsonb);
end $$;
revoke all on function public.lex_instructor_roster() from public,anon;
grant execute on function public.lex_instructor_roster() to authenticated;

-- Student's longitudinal assessment: one checkpoint per 5 COMPLETE sessions,
-- no treating incomparable rubrics as a proven learning gain.
create or replace function public.lex_staff_skill_progress(p_student uuid,p_course text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); output jsonb; done_count integer; diag jsonb;
begin
 if uid is null or not (
   private.is_platform_admin() or private.instructor_can_view(p_student,p_course)
 ) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if not exists(select 1 from public.enrollments e where e.user_id=p_student and e.course_id=p_course)
 then raise exception 'NOT_FOUND' using errcode='22023';end if;
 select count(*) into done_count from public.student_training_sessions
  where user_id=p_student and course_id=p_course and completed_at is not null;
 select jsonb_build_object(
  'recall',coalesce(d.result#>>'{measurements,recall,ai_grade,provisional_percent}',
                    d.result#>>'{measurements,recall,corrected_internal_grade,provisional_percent}',
                    case when d.result #>> '{measurements,recall,internal_grade,status}'='preliminary_internal'
                         and (d.result #> '{measurements,recall,internal_grade,criteria_met}') is not null
                         and (d.result #> '{measurements,recall,internal_grade,criteria_missing}') is not null
                         and jsonb_array_length(d.result #> '{measurements,recall,internal_grade,criteria_met}')
                             + jsonb_array_length(d.result #> '{measurements,recall,internal_grade,criteria_missing}')=3
                         then d.result #>> '{measurements,recall,internal_grade,provisional_percent}' else null end),
  'understanding',d.result#>>'{metrics,understanding}',
  'date',d.completed_at,'kind','diagnostic_preliminary_different_instrument'
 ) into diag from public.student_diagnostic_runs d where d.user_id=p_student and d.course_id=p_course and d.status='completed';
 select jsonb_build_object(
  'student',(select jsonb_build_object('id',p.id,'name',p.display_name,'university',p.university,
   'faculty',p.faculty,'year',p.year_label) from public.profiles p where p.id=p_student),
  'diagnostic',diag,
  'completed_sessions',done_count,
  'period_size',5,
  'measurement_note','Training percentages are preliminary criterion coverage. Different questions/rubric versions are not directly comparable; changes are not validated learning gains.',
  'checkpoints',coalesce((
   with grades as (
    select ((ta.session_number-1)/5+1)::integer as period,ta.dimension,
     ta.evaluation->>'rubric_version' as rubric_version,
     (ta.evaluation->>'provisional_percent')::numeric as score
    from public.student_training_answers ta
    join public.student_training_sessions ts on ts.user_id=ta.user_id and ts.course_id=ta.course_id
      and ts.session_number=ta.session_number and ts.completed_at is not null
    where ta.user_id=p_student and ta.course_id=p_course
     and ta.dimension in ('recall','understanding')
     and ta.evaluation->>'status' in ('preliminary_ai','preliminary_internal')
     and ta.evaluation->>'provisional_percent' ~ '^[0-9]{1,3}(\.[0-9]+)?$'
     and ta.session_number<= (done_count/5)*5
   ), groups as (
    select period,dimension,rubric_version,count(*) as n,round(avg(score))::integer as value
    from grades where score between 0 and 100 group by period,dimension,rubric_version
   )
   select jsonb_agg(jsonb_build_object('period',period,'dimension',dimension,'rubric_version',rubric_version,
    'samples',n,'percent',value,'status','provisional_training_coverage') order by period,dimension,rubric_version)
   from groups
  ),'[]'::jsonb),
  'missing_criteria',coalesce((
   select jsonb_agg(jsonb_build_object('element',m.element,'count',m.n) order by m.n desc)
   from (
    select coalesce(nullif(c.value->>'label_ar',''),c.value->>'id') as element,count(*) as n
    from public.student_training_answers t
    cross join lateral jsonb_array_elements(
     case when jsonb_typeof(t.evaluation->'criteria')='array' then t.evaluation->'criteria'
      else '[]'::jsonb end
    ) c(value)
    where t.user_id=p_student and t.course_id=p_course
      and t.dimension in ('recall','understanding')
      and (c.value->>'met'='false' or
         ((c.value->>'credit') ~ '^[0-9]+(\.[0-9]+)?$' and (c.value->>'credit')::numeric<1))
      and length(coalesce(c.value->>'label_ar',c.value->>'id',''))>1
    group by 1 order by n desc limit 7
   ) m
  ),'[]'::jsonb)
 ) into output;
 return output;
end $$;
revoke all on function public.lex_staff_skill_progress(uuid,text) from public,anon;
grant execute on function public.lex_staff_skill_progress(uuid,text) to authenticated;

-- Instructor may edit his own descriptive information but cannot alter employment/scope/email/role.
create or replace function public.lex_instructor_update_profile(p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); v_title text; v_wa text;
begin
 if uid is null or not exists(select 1 from public.profiles where id=uid and role='instructor' and active)
 then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if jsonb_typeof(p_data)<>'object' or (select count(*) from jsonb_object_keys(p_data))>5 or
  exists(select 1 from jsonb_object_keys(p_data) k where k not in ('academic_title','specialization','office_hours','bio','whatsapp'))
 then raise exception 'INVALID_FIELDS' using errcode='22023';end if;
 v_title=left(trim(coalesce(p_data->>'academic_title','')),90);
 v_wa=nullif(trim(coalesce(p_data->>'whatsapp','')),'');
 if v_wa is not null and v_wa !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'INVALID_WHATSAPP';end if;
 update public.instructor_profiles set
 academic_title=case when p_data ? 'academic_title' then coalesce(nullif(v_title,''),'دكتور') else academic_title end,
 specialization=case when p_data ? 'specialization' then nullif(left(trim(p_data->>'specialization'),160),'') else specialization end,
 office_hours=case when p_data ? 'office_hours' then nullif(left(trim(p_data->>'office_hours'),160),'') else office_hours end,
 bio=case when p_data ? 'bio' then nullif(left(trim(p_data->>'bio'),600),'') else bio end,
 whatsapp_e164=case when p_data ? 'whatsapp' then v_wa else whatsapp_e164 end,
 updated_at=now()
 where instructor_id=uid;
 return jsonb_build_object('ok',found);
end $$;
revoke all on function public.lex_instructor_update_profile(jsonb) from public,anon;
grant execute on function public.lex_instructor_update_profile(jsonb) to authenticated;
