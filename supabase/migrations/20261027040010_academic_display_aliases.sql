-- Read-time aliases only: no student, teacher, assignment or enrollment row changes.
-- Keep exact country/course/active-role checks and the existing function ACLs.
create or replace function private.academic_text(value text)
returns text language sql immutable security invoker set search_path='' as $$
 select lower(regexp_replace(trim(coalesce(value,'')),'[[:space:]]+',' ','g'));
$$;
create or replace function private.academic_university_key(value text)
returns text language sql immutable security invoker set search_path='' as $$
 select case when private.academic_text(value) in ('جامعة لوسيل','لوسيل','lusail university','lusail')
 then 'lusail university' else private.academic_text(value) end;
$$;
create or replace function private.academic_faculty_key(value text,institution text)
returns text language sql immutable security invoker set search_path='' as $$
 select case when private.academic_university_key(institution)='lusail university'
 and private.academic_text(value) in ('law','faculty of law','college of law','كلية القانون','القانون')
 then 'كلية القانون' else private.academic_text(value) end;
$$;
create or replace function private.academic_year_key(value text)
returns text language plpgsql immutable security invoker set search_path='' as $$
declare raw text:=private.academic_text(value); key text;
begin
 key:=translate(regexp_replace(raw,'[ً-ٰٟ]','','g'),'أإآ','ااا');
 key:=regexp_replace(key,'^(السنة|سنة|الفرقة|فرقة)[[:space:]]*','');
 if key in ('الاولى','الاولي','اولى','اولي','1','١') then return 'الفرقة الأولى'; end if;
 if key in ('الثانية','ثانية','2','٢') then return 'الفرقة الثانية'; end if;
 if key in ('الثالثة','ثالثة','3','٣') then return 'الفرقة الثالثة'; end if;
 if key in ('الرابعة','رابعة','4','٤') then return 'الفرقة الرابعة'; end if;
 return raw;
end $$;
revoke all on function private.academic_text(text),private.academic_university_key(text),
 private.academic_faculty_key(text,text),private.academic_year_key(text) from public,anon;
-- These pure helpers have no data access. Existing scoped SECURITY DEFINER functions call them.

create or replace function private.instructor_can_view(p_student uuid,p_course text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.profiles staff
  join public.instructor_assignments a on a.instructor_id=staff.id and a.active=true
  join public.profiles student on student.id=p_student and student.role='student' and student.active=true
  join public.enrollments e on e.user_id=student.id and e.course_id=a.course_id and e.status='active'
  where staff.id=auth.uid() and staff.role='instructor' and staff.active=true
   and a.course_id=p_course
   and private.academic_university_key(a.university)=private.academic_university_key(student.university)
   and private.academic_faculty_key(a.faculty,a.university)=private.academic_faculty_key(student.faculty,student.university)
   and private.academic_year_key(a.year_label)=private.academic_year_key(student.year_label)
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
    and private.academic_university_key(s.university)=private.academic_university_key(a.university)
    and private.academic_faculty_key(s.faculty,s.university)=private.academic_faculty_key(a.faculty,a.university)
    and private.academic_year_key(s.year_label)=private.academic_year_key(a.year_label)
    and s.country_code=a.country_code
  join public.enrollments e on e.user_id=s.id and e.course_id=a.course_id and e.status='active'
  where a.instructor_id=uid and a.active), '[]'::jsonb)
 ) into result from public.profiles p join public.instructor_profiles ip on ip.instructor_id=p.id
 where p.id=uid;
 return coalesce(result,'{}'::jsonb);
end $$;
revoke all on function public.lex_instructor_roster() from public,anon;
grant execute on function public.lex_instructor_roster() to authenticated;

