-- Restrict instructor access to exact university + faculty + year + course.
insert into public.instructor_profiles(instructor_id,official_email,academic_title)
values ('30000000-0000-4000-8000-000000000001','teacher@university.edu','دكتور');
insert into public.instructor_assignments(instructor_id,course_id,subject_name,country_code,
 university,faculty,year_label,created_by)
values ('30000000-0000-4000-8000-000000000001','qa-qu-lawc101-rights','نظرية الحق','qa',
 'Qatar University','Faculty of Law','السنة الأولى','90000000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',false);
do $$
declare student_one uuid:='10000000-0000-4000-8000-000000000001';
 result jsonb;
begin
 if not private.instructor_can_view(student_one,'qa-qu-lawc101-rights') then raise exception 'assigned student missing'; end if;
 if private.instructor_can_view('10000000-0000-4000-8000-000000000002','qa-qu-lawc101-rights')
 or private.instructor_can_view('10000000-0000-4000-8000-000000000003','qa-qu-lawc101-rights')
 or private.instructor_can_view('10000000-0000-4000-8000-000000000004','qa-qu-lawc101-rights')
 then raise exception 'faculty/year/institution leaked another student';end if;
 if private.can_access_student(student_one) then raise exception 'instructor must not inherit raw profile RLS';end if;
 result=public.lex_instructor_roster();
 if jsonb_array_length(result->'students')<>1 then raise exception 'roster must return only one matching student: %',result->'students';end if;
 if (result->'students'->0->>'name') is null then raise exception 'missing safe learner display name';end if;
 if (result->'students'->0 ? 'whatsapp') or (result->'students'->0 ? 'student_registration_number')
 then raise exception 'private contact/student identifier leaked';end if;
 result=public.lex_staff_skill_progress(student_one,'qa-qu-lawc101-rights');
 if result->>'completed_sessions' is null then raise exception 'student progress unavailable';end if;
 begin
  perform public.lex_staff_skill_progress('10000000-0000-4000-8000-000000000002','qa-qu-lawc101-rights');
  raise exception 'cross-university report not denied';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.lex_staff_skill_progress('10000000-0000-4000-8000-000000000003','qa-qu-lawc101-rights');
  raise exception 'cross-year report not denied';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub','90000000-0000-4000-8000-000000000001',false);
do $$
begin
 if not private.can_access_student('10000000-0000-4000-8000-000000000002') then
 raise exception 'admin must retain institutional oversight';end if;
end $$;
\echo 'PASS: instructor university/faculty/year/course authorization; scoped roster, private contacts, faculty dashboard'
