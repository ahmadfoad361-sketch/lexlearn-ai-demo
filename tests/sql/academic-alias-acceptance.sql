-- Isolated CI database only; restore the original fixture afterwards.
begin;
update public.profiles set university='Lusail University',faculty='law',year_label='السنة الأولى'
 where id='10000000-0000-4000-8000-000000000001';
update public.instructor_assignments set university='جامعة لوسيل',faculty='كلية القانون',year_label='الفرقة الأولى'
 where instructor_id='30000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
do $$
declare uid uuid:='10000000-0000-4000-8000-000000000001'; result jsonb;
begin
 if not private.instructor_can_view(uid,'qa-qu-lawc101-rights') then raise exception 'Lusail aliases disconnected student'; end if;
 result:=public.lex_instructor_roster();
 if jsonb_array_length(result->'students')<>1 then raise exception 'Alias roster is not scoped';end if;
 if private.instructor_can_view(uid,'wrong-course') then raise exception 'Wrong course leaked';end if;
 if private.academic_university_key('Lusail International University')=private.academic_university_key('لوسيل') then raise exception 'Unrelated university collapsed';end if;
 if private.academic_faculty_key('law','Other University')=private.academic_faculty_key('كلية القانون','Other University') then raise exception 'Unknown college guessed';end if;
end $$;
update public.profiles set year_label='السنة الثانية' where id='10000000-0000-4000-8000-000000000001';
do $$begin
 if private.instructor_can_view('10000000-0000-4000-8000-000000000001','qa-qu-lawc101-rights') then raise exception 'Wrong year leaked';end if;
end $$;
update public.profiles set year_label='السنة الأولى',country_code='eg' where id='10000000-0000-4000-8000-000000000001';
do $$begin
 if private.instructor_can_view('10000000-0000-4000-8000-000000000001','qa-qu-lawc101-rights') then raise exception 'Wrong country leaked';end if;
end $$;
update public.profiles set country_code='qa',faculty='Medicine' where id='10000000-0000-4000-8000-000000000001';
do $$begin
 if private.instructor_can_view('10000000-0000-4000-8000-000000000001','qa-qu-lawc101-rights') then raise exception 'Wrong faculty leaked';end if;
end $$;
update public.profiles set faculty='القانون' where id='10000000-0000-4000-8000-000000000001';
delete from public.enrollments where user_id='10000000-0000-4000-8000-000000000001';
do $$begin
 if private.instructor_can_view('10000000-0000-4000-8000-000000000001','qa-qu-lawc101-rights') then raise exception 'Unenrolled student leaked';end if;
end $$;
select set_config('request.jwt.claim.sub','',true);
do $$begin
 if private.instructor_can_view('10000000-0000-4000-8000-000000000001','qa-qu-lawc101-rights') then raise exception 'Anonymous access leaked';end if;
 begin perform public.lex_instructor_roster();raise exception 'Anonymous roster allowed';exception when insufficient_privilege then null;end;
end $$;
rollback;
\echo 'PASS read-time academic aliases with unchanged country/year/faculty/course/enrollment authorization'
