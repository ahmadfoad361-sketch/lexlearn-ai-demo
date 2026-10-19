-- LexLearn Issue #36 - proposed migration (NOT applied to production).
-- Server-authoritative diagnostic state, immutable completion and level release.
-- Deploy to isolated staging, run API+RLS tests with two actual JWT principals,
-- then request a separate production RLS/migration review.
begin;

create table if not exists public.student_diagnostic_runs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  status text not null default 'in_progress' check(status in ('in_progress','completed')),
  attempt_id uuid not null default gen_random_uuid(),
  version integer not null default 2,
  draft jsonb not null default '[]'::jsonb,
  answers jsonb,
  free_text text,
  result jsonb,
  training_plan jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id,course_id),
  constraint diagnostic_completed_consistent check (
    (status='in_progress' and completed_at is null and result is null and training_plan is null) or
    (status='completed' and completed_at is not null and result is not null and training_plan is not null)
  )
);
create index if not exists idx_student_diagnostic_course_status on public.student_diagnostic_runs(course_id,status);
alter table public.student_diagnostic_runs enable row level security;
revoke all on public.student_diagnostic_runs from public,anon,authenticated;
grant select on public.student_diagnostic_runs to authenticated;
drop policy if exists "diagnostic student read only" on public.student_diagnostic_runs;
create policy "diagnostic student read only" on public.student_diagnostic_runs
  for select to authenticated using (
    user_id=auth.uid() and private.is_active_user()
  );
drop policy if exists "diagnostic instructor cohort read" on public.student_diagnostic_runs;
create policy "diagnostic instructor cohort read" on public.student_diagnostic_runs
  for select to authenticated using (
    exists (
      select 1 from public.profiles staff
      join public.profiles learner on staff.cohort_id=learner.cohort_id
      where staff.id=auth.uid() and learner.id=user_id
        and staff.active and staff.role in ('owner','admin','instructor')
        and staff.cohort_id is not null
    )
  );
-- No authenticated INSERT/UPDATE/DELETE policies on authoritative records.
-- Owner-writable legacy snapshots are untrusted/cache only, never unlock levels.

create table if not exists public.student_level_releases (
  course_id text not null references public.courses(id) on delete cascade,
  level_number integer not null check(level_number between 1 and 30),
  academic_approved boolean not null default false,
  published boolean not null default false,
  approved_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  primary key(course_id,level_number),
  check (not published or (academic_approved and approved_by is not null and reviewed_at is not null))
);
alter table public.student_level_releases enable row level security;
revoke all on public.student_level_releases from public,anon,authenticated;
-- Publication must be a separate approved release action, never set in assessment RPC.

create table if not exists public.student_level_completions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  level_number integer not null check(level_number between 1 and 30),
  authorized_attempt uuid not null references public.attempts(id),
  verified_by uuid references public.profiles(id),
  completed_at timestamptz not null default now(),
  primary key(user_id,course_id,level_number)
);
alter table public.student_level_completions enable row level security;
revoke all on public.student_level_completions from public,anon,authenticated;
-- No client write. A later reviewed grading service may populate verified level completions.

create or replace function public.lex_require_student(p_course text)
returns uuid language plpgsql security definer
set search_path='' as $$
declare v_uid uuid:=auth.uid();
begin
 if v_uid is null then raise exception 'not_authenticated' using errcode='28000';end if;
 if not exists(select 1 from public.profiles p where p.id=v_uid and p.role='student' and p.active) then
   raise exception 'student_account_not_active' using errcode='42501';
 end if;
 if not exists(select 1 from public.enrollments e where e.user_id=v_uid and e.course_id=p_course and e.status='active') then
   raise exception 'not_enrolled_in_this_course' using errcode='42501';
 end if;
 return v_uid;
end $$;
revoke all on function public.lex_require_student(text) from public,anon;
grant execute on function public.lex_require_student(text) to authenticated;

create or replace function public.lex_diagnostic_status(p_course text)
returns jsonb language plpgsql stable security definer
set search_path='' as $$
declare v_uid uuid; d public.student_diagnostic_runs%rowtype;
begin
 v_uid:=public.lex_require_student(p_course);
 select * into d from public.student_diagnostic_runs
 where user_id=v_uid and course_id=p_course;
 if not found then
   return jsonb_build_object('status','not_started','course_id',p_course,'draft','[]'::jsonb,'level',0);
 end if;
 return jsonb_build_object('status',d.status,'course_id',p_course,'attempt_id',d.attempt_id,
   'draft',case when d.status='in_progress' then d.draft else '[]'::jsonb end,
   'result',d.result,'training_plan',d.training_plan,
   'completed_at',d.completed_at,'level',case when d.status='completed' then 1 else 0 end);
end $$;

create or replace function public.lex_diagnostic_bank_ready(p_course text)
returns boolean language sql stable security definer set search_path='' as $$
 select count(distinct i.metadata->>'official_diagnostic_v2_id')=6
   and coalesce(bool_and(i.status='approved'
    and i.reviewed_at is not null and i.legal_reviewer is not null and i.learning_reviewer is not null
    and i.legal_reviewer<>i.learning_reviewer
    and i.metadata->>'legal_approval'='true' and i.metadata->>'learning_approval'='true'
    and i.answer_key_json ? 'correct_index'
    and jsonb_typeof(i.options_json->'ar')='array'
    and jsonb_typeof(i.options_json->'en')='array'
    and cardinality(i.source_ids)>0),false)
 from public.content_items i
 where i.course_id=p_course and i.metadata->>'official_diagnostic_v2_id'
 in ('q39r','q49r','q62r','q39u','q50u','q63a');
$$;

create or replace function public.lex_diagnostic_begin(p_course text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid;
begin
 v_uid:=public.lex_require_student(p_course);
 if not exists(select 1 from public.consent_records c
   where c.user_id=v_uid and c.notice_version='2026-10-06-v1'
   and c.consent_type='learning_data' and c.accepted=true) then
   raise exception 'learning_data_consent_required' using errcode='42501';
 end if;
 -- A completed diagnostic may always be resumed, even when content later retires.
 if exists(select 1 from public.student_diagnostic_runs d
   where d.user_id=v_uid and d.course_id=p_course and d.status='completed') then
   return public.lex_diagnostic_status(p_course);
 end if;
 if not public.lex_diagnostic_bank_ready(p_course) then
   raise exception 'diagnostic_academic_approval_pending' using errcode='42501';
 end if;
 insert into public.student_diagnostic_runs(user_id,course_id,status,version)
 values(v_uid,p_course,'in_progress',2)
 on conflict(user_id,course_id) do nothing;
 return public.lex_diagnostic_status(p_course);
end $$;

create or replace function public.lex_diagnostic_draft(p_course text,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid; d public.student_diagnostic_runs%rowtype;
  v_answer jsonb; v_id text; v_pick integer; seen text[]:=array[]::text[];
  allowed text[]:=array['q39r','q49r','q62r','q39u','q50u','q63a'];
begin
 v_uid:=public.lex_require_student(p_course);
 if jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)>6 then
  raise exception 'invalid_answers' using errcode='22023';end if;
 for v_answer in select value from jsonb_array_elements(p_answers) loop
  v_id:=v_answer->>'question_id';
  if v_id is null or not (v_id=any(allowed)) or v_id=any(seen) then
    raise exception 'duplicate_or_unknown_question' using errcode='22023';end if;
  if jsonb_typeof(v_answer->'selected')<>'number'
     or (v_answer->>'selected') !~ '^(-1|0|1|2)$' then
    raise exception 'invalid_selection' using errcode='22023';end if;
  v_pick:=(v_answer->>'selected')::integer;
  seen:=array_append(seen,v_id);
 end loop;
 select * into d from public.student_diagnostic_runs
 where user_id=v_uid and course_id=p_course for update;
 if not found then raise exception 'diagnostic_not_started' using errcode='42501';end if;
 if d.status='completed' then return public.lex_diagnostic_status(p_course);end if;
 if not public.lex_diagnostic_bank_ready(p_course) then
   raise exception 'diagnostic_academic_approval_pending' using errcode='42501';end if;
 update public.student_diagnostic_runs
 set draft=p_answers,updated_at=now()
 where user_id=v_uid and course_id=p_course;
 return public.lex_diagnostic_status(p_course);
end $$;

create or replace function public.lex_diagnostic_complete(p_course text,p_answers jsonb,p_free_text text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid; d public.student_diagnostic_runs%rowtype;
  v_ids text[]:=array['q39r','q49r','q62r','q39u','q50u','q63a'];
  v_id text; v_pick integer; v_item public.content_items%rowtype; v_answer jsonb; v_rows jsonb:='[]'::jsonb;
  recog_n integer:=0; recog_ok integer:=0; understanding_n integer:=0; understanding_ok integer:=0;
  application_n integer:=0; application_ok integer:=0;
  recog numeric; und numeric; app numeric; v_type text; v_plan jsonb; v_metrics jsonb; v_result jsonb;
  v_attempt uuid; v_completed_at timestamptz:=now();
begin
 v_uid:=public.lex_require_student(p_course);
 select * into d from public.student_diagnostic_runs where user_id=v_uid and course_id=p_course for update;
 if not found then raise exception 'diagnostic_not_started' using errcode='42501';end if;
 if d.status='completed' then return public.lex_diagnostic_status(p_course);end if;
 if not public.lex_diagnostic_bank_ready(p_course) then
   raise exception 'diagnostic_academic_approval_pending' using errcode='42501';end if;
 if jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)<>6 or length(coalesce(p_free_text,''))>2000 then
   raise exception 'invalid_diagnostic_submission' using errcode='22023';end if;
 foreach v_id in array v_ids loop
   if (select count(*) from jsonb_array_elements(p_answers) a where a->>'question_id'=v_id)<>1 then
     raise exception 'missing_or_duplicate_question' using errcode='22023';end if;
   select * into v_item from public.content_items i where i.course_id=p_course
     and i.metadata->>'official_diagnostic_v2_id'=v_id and i.status='approved'
     and i.metadata->>'legal_approval'='true' and i.metadata->>'learning_approval'='true';
   if not found then raise exception 'question_not_approved' using errcode='42501';end if;
   select value into v_answer from jsonb_array_elements(p_answers) where value->>'question_id'=v_id;
   if jsonb_typeof(v_answer->'selected')<>'number' or (v_answer->>'selected') !~ '^(-1|0|1|2)$' then
      raise exception 'invalid_selection' using errcode='22023';end if;
   v_pick:=(v_answer->>'selected')::integer;
   v_rows:=v_rows||jsonb_build_array(jsonb_build_object(
      'question_id',v_id,'selected',v_pick,'measured',v_pick>=0,
      'correct',case when v_pick>=0 then v_pick=(v_item.answer_key_json->>'correct_index')::int else null end));
   if v_pick>=0 then
     if v_id=any(array['q39r','q49r','q62r']) then
       recog_n:=recog_n+1;if v_pick=(v_item.answer_key_json->>'correct_index')::int then recog_ok:=recog_ok+1;end if;
     elsif v_id=any(array['q39u','q50u']) then
       understanding_n:=understanding_n+1;if v_pick=(v_item.answer_key_json->>'correct_index')::int then understanding_ok:=understanding_ok+1;end if;
     else application_n:=application_n+1;
       if v_pick=(v_item.answer_key_json->>'correct_index')::int then application_ok:=application_ok+1;end if;
     end if;
   end if;
 end loop;
 recog:=case when recog_n>0 then round(100.0*recog_ok/recog_n) else null end;
 und:=case when understanding_n>0 then round(100.0*understanding_ok/understanding_n) else null end;
 app:=case when application_n>0 then round(100.0*application_ok/application_n) else null end;
 v_type:='insufficient_evidence';
 if recog_n>=2 and understanding_n>=2 then
   if recog-und>=25 then v_type:='recall-led';
   elsif und-recog>=25 then v_type:='understanding-led';
   else v_type:='balanced';end if;
 end if;
 v_plan:=case v_type
  when 'recall-led' then jsonb_build_object('mode',v_type,'weakest','understanding',
     'firstTasks',jsonb_build_array('explain_rule','change_one_fact','supported_retrieval'),
     'reason_ar','التعرف الموضوعي أقوى من التفسير؛ نبدأ بشرح القاعدة وتغيير الواقعة. الحفظ الحر غير مقاس.',
     'reason_en','Rule recognition exceeded explanatory understanding. Unaided recall is not measured.')
  when 'understanding-led' then jsonb_build_object('mode',v_type,'weakest','recall',
     'firstTasks',jsonb_build_array('memory_cues','reconstruct','delayed_retrieval'),
     'reason_ar','الفهم الموضوعي أقوى من التعرف؛ نبدأ بمفاتيح الاسترجاع مع بقاء الحفظ الحر غير محسوم.',
     'reason_en','Objective understanding exceeded recognition; free recall remains ungraded.')
  when 'balanced' then jsonb_build_object('mode',v_type,'weakest','application',
     'firstTasks',jsonb_build_array('supported_rule','one_fact','retrieval_check'),
     'reason_ar','الأدلة الموضوعية متقاربة؛ نبدأ بخطة متوازنة ونعيد القياس.',
     'reason_en','The available objective indicators are similar; start balanced practice.')
  else jsonb_build_object('mode','foundation','weakest','foundation',
     'firstTasks',jsonb_build_array('worked_example','supported_decision','unaided_check'),
     'reason_ar','لا توجد أدلة كافية للحكم؛ نبدأ بتأسيس دون افتراض درجة صفر.',
     'reason_en','Insufficient comparable evidence; begin with a supported foundation.')
 end;
 v_metrics:=jsonb_build_object('recall',null,'recognition',recog,'understanding',und,
 'application',app,'legal_precision',null,'exam',null,'retention',null);
 v_result:=jsonb_build_object('version',2,'source','server_finalized_diagnostic',
   'student_id',v_uid,'course_id',p_course,'attempt_id',d.attempt_id,
   'completed_at',v_completed_at,'rubric_version','lexdiagnostic-objective-v2',
   'metrics',v_metrics,'profileType',v_type,
   'measurements',jsonb_build_object(
     'recall',jsonb_build_object('value',null,'status',case when length(trim(coalesce(p_free_text,'')))>0 then 'pending_human_review' else 'not_measured' end,'method','human_review_required'),
     'recognition',jsonb_build_object('value',recog,'item_count',recog_n,'status',case when recog is null then 'not_measured' else 'provisional_objective' end),
     'understanding',jsonb_build_object('value',und,'item_count',understanding_n,'status',case when und is null then 'not_measured' else 'provisional_objective' end),
     'application',jsonb_build_object('value',app,'item_count',application_n,'status',case when app is null then 'not_measured' else 'provisional_objective' end)),
   'answers',v_rows,'review_status',case when length(trim(coalesce(p_free_text,'')))>0 then 'pending_human_review' else 'not_requested' end,
   'trainingPlan',v_plan);
 update public.student_diagnostic_runs
 set status='completed',draft='[]'::jsonb,answers=v_rows,free_text=coalesce(p_free_text,''),
     result=v_result,training_plan=v_plan,completed_at=v_completed_at,updated_at=now()
 where user_id=v_uid and course_id=p_course;
 return public.lex_diagnostic_status(p_course);
end $$;

create or replace function public.lex_level_access(p_course text,p_level integer)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_uid uuid; v_status text; v_open boolean; v_prev boolean;
begin
 v_uid:=public.lex_require_student(p_course);
 if p_level is null or p_level<1 or p_level>30 then
   raise exception 'invalid_level' using errcode='22023';end if;
 select d.status into v_status from public.student_diagnostic_runs d where d.user_id=v_uid and d.course_id=p_course;
 if coalesce(v_status,'not_started')<>'completed' then
   return jsonb_build_object('allowed',false,'reason','diagnostic_not_completed','level',p_level);end if;
 select coalesce(r.academic_approved and r.published,false) into v_open
 from public.student_level_releases r where r.course_id=p_course and r.level_number=p_level;
 if not coalesce(v_open,false) then
   return jsonb_build_object('allowed',false,'reason','academic_content_not_released','level',p_level);end if;
 if p_level>1 then
   select exists(select 1 from public.student_level_completions x
     where x.user_id=v_uid and x.course_id=p_course and x.level_number=p_level-1
     and x.verified_by is not null) into v_prev;
   if not v_prev then
     return jsonb_build_object('allowed',false,'reason','previous_level_not_verified','level',p_level);end if;
 end if;
 return jsonb_build_object('allowed',true,'reason','authorized','level',p_level);
end $$;

-- Authenticated may invoke RPCs; anon cannot. DB tables are read-only or inaccessible.
do $do$ declare f regprocedure; begin
 foreach f in array array[
  'public.lex_diagnostic_status(text)'::regprocedure,
  'public.lex_diagnostic_bank_ready(text)'::regprocedure,
  'public.lex_diagnostic_begin(text)'::regprocedure,
  'public.lex_diagnostic_draft(text,jsonb)'::regprocedure,
  'public.lex_diagnostic_complete(text,jsonb,text)'::regprocedure,
  'public.lex_level_access(text,integer)'::regprocedure
 ] loop
   execute format('revoke all on function %s from public, anon', f);
   execute format('grant execute on function %s to authenticated', f);
 end loop;
end $do$;
commit;
