-- University professors only receive percentages, completed sessions, and
-- periodic progress. Source questions, essays, marked criteria and student
-- corrections remain restricted to platform administration.
-- Existing academic scoping checks are preserved without broadening access.
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
 -- Instructors get ONLY teaching summary fields. Admins retain detailed
 -- academic evidence for internal evaluation; professor output contains no
 -- prompts, answers, individual criteria or correction evidence.
 if not private.is_platform_admin() then
   return jsonb_build_object(
     'student', output->'student',
     'diagnostic', jsonb_build_object(
       'recall',output#>'{diagnostic,recall}',
       'understanding',output#>'{diagnostic,understanding}'
     ),
     'completed_sessions', output->'completed_sessions',
     'period_size',output->'period_size',
     'checkpoints',output->'checkpoints',
     'measurement_note',output->'measurement_note'
   );
 end if;
 return output;
end $$;
revoke all on function public.lex_staff_skill_progress(uuid,text) from public,anon;
grant execute on function public.lex_staff_skill_progress(uuid,text) to authenticated;
