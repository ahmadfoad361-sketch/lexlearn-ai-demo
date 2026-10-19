-- 30-session founder-authorized INTERNAL practice curriculum.
-- Quality is PROVISIONAL: lexical rubric coverage is not semantic LLM evaluation or a university mark.
-- 24 sourced legal topics + checkpoints at 5,10,15,20,25,30. No independent reviewer identities are forged.
begin;

alter table public.student_level_releases drop constraint if exists student_level_releases_check;
alter table public.student_level_releases add constraint student_level_releases_check
 check(not published or (approved_by is not null and reviewed_at is not null and
 (academic_approved or (founder_pilot_approved and course_id='qa-qu-lawc101-rights' and level_number between 1 and 30))));

-- Do not mark unreviewed lessons as independently academic-approved.
update public.content_items
set metadata=metadata || '{"owner_pilot_approved":true,"pilot_review_mode":"founder_authorized_ai_assisted_20261019","pilot_scope":"non_certified_educational_practice","learning_approval":false,"legal_approval":false}'::jsonb,
 updated_at=now()
where course_id='qa-qu-lawc101-rights' and item_type='essay' and status='legal_review'
 and legal_reviewer is null and learning_reviewer is null
 and length(prompt_ar)>20 and length(rubric_json->>'prompt_en')>20
 and length(rubric_json->>'reference_rule_ar')>15 and cardinality(source_ids)>0;

do $release$
declare v_owner uuid; v_all integer; v_missing integer;
begin
 select id into strict v_owner from public.profiles where role='owner' and active;
 select count(*) into v_all from public.content_items
  where course_id='qa-qu-lawc101-rights' and item_type='essay'
  and id ~ '^rights-v1-s(1|2|3|4|6|7|8|9|11|12|13|14|16|17|18|19|21|22|23|24|26|27|28|29)-(recall|understanding|exam)$'
  and metadata->>'owner_pilot_approved'='true'
  and metadata->>'pilot_scope'='non_certified_educational_practice'
  and cardinality(source_ids)>0;
 if v_all<>69 then
   -- Level 1 has legacy founder status, so there are 69 additional reviewed-structure items.
   raise exception 'extra exercise bank must contain 69 reviewed-structure lessons; got %',v_all;
 end if;
 select count(*) into v_missing from generate_series(1,30) g(n)
 where g.n%5<>0 and (
  select count(*) from public.content_items i where i.course_id='qa-qu-lawc101-rights'
  and i.id in ('rights-v1-s'||g.n||'-recall','rights-v1-s'||g.n||'-understanding','rights-v1-s'||g.n||'-exam')
  and i.metadata->>'owner_pilot_approved'='true'
  and cardinality(i.source_ids)>0
 )<>3;
 if v_missing<>0 then raise exception 'missing topic banks: %',v_missing;end if;
 insert into public.student_level_releases
  (course_id,level_number,academic_approved,founder_pilot_approved,published,approved_by,reviewed_at)
 select 'qa-qu-lawc101-rights',g.n,false,true,true,v_owner,now()
 from generate_series(2,30) g(n)
 on conflict(course_id,level_number) do update set
  founder_pilot_approved=true,published=true,
  approved_by=coalesce(public.student_level_releases.approved_by,excluded.approved_by),
  reviewed_at=coalesce(public.student_level_releases.reviewed_at,excluded.reviewed_at);
end $release$;

create table if not exists public.student_training_sessions(
 user_id uuid not null references public.profiles(id) on delete cascade,
 course_id text not null references public.courses(id) on delete cascade,
 session_number integer not null check(session_number between 1 and 30),
 started_at timestamptz not null default now(),
 completed_at timestamptz,
 tasks_json jsonb not null default '[]'::jsonb,
 primary key(user_id,course_id,session_number)
);
create table if not exists public.student_training_answers(
 user_id uuid not null references public.profiles(id) on delete cascade,
 course_id text not null references public.courses(id) on delete cascade,
 session_number integer not null check(session_number between 1 and 30),
 item_id text not null references public.content_items(id),
 dimension text not null check(dimension in ('recall','understanding','exam_execution')),
 answer_text text not null check(length(answer_text) between 8 and 4000),
 evaluation jsonb not null,
 submitted_at timestamptz not null default now(),
 primary key(user_id,course_id,session_number,item_id),
 foreign key(user_id,course_id,session_number)
 references public.student_training_sessions(user_id,course_id,session_number)
);
create index if not exists student_training_answer_history
 on public.student_training_answers(user_id,course_id,submitted_at desc);
alter table public.student_training_sessions enable row level security;
alter table public.student_training_answers enable row level security;
revoke all on public.student_training_sessions,public.student_training_answers from anon,authenticated;
grant select on public.student_training_sessions,public.student_training_answers to authenticated;
drop policy if exists "own training session read" on public.student_training_sessions;
create policy "own training session read" on public.student_training_sessions
 for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "own training answer read" on public.student_training_answers;
create policy "own training answer read" on public.student_training_answers
 for select to authenticated using (user_id=(select auth.uid()));

create or replace function public.lex_training_rubric_coverage(p_item_id text,p_answer text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare x public.content_items%rowtype;
 raw text:=trim(coalesce(p_answer,''));
 reference text; norm_answer text; norm_rule text; tok text;
 words text[]:=array[]::text[]; met text[]:=array[]::text[];
 n integer:=0; hits integer:=0; pct integer; structure_score integer:=0;
begin
 select * into x from public.content_items where id=p_item_id
 and course_id='qa-qu-lawc101-rights' and item_type='essay'
 and metadata->>'owner_pilot_approved'='true';
 if not found then raise exception 'lesson_not_available' using errcode='42501';end if;
 if length(raw)<8 or length(raw)>4000 then raise exception 'invalid_free_answer' using errcode='22023';end if;
 reference:=coalesce(x.rubric_json->>'reference_rule_ar','');
 if length(reference)<15 then return jsonb_build_object('status','needs_human_review','provisional_percent',null,'reason','missing_rubric');end if;
 norm_rule:=translate(lower(reference),'أإآىةؤئ','ااايهوي');
 norm_answer:=translate(lower(raw),'أإآىةؤئ','ااايهوي');
 norm_rule:=regexp_replace(norm_rule,'[ًٌٍَُِّْـ]','','g');
 norm_answer:=regexp_replace(norm_answer,'[ًٌٍَُِّْـ]','','g');
 foreach tok in array regexp_split_to_array(regexp_replace(norm_rule,'[^a-z0-9ء-ي]+',' ','g'),'\s+') loop
   if length(tok)<4 or tok=any(array['الذي','التي','القانون','بعضها','therefore','legal','their','where','بينما'])
    or tok=any(words) then continue;end if;
   words:=array_append(words,tok);n:=n+1;
   if position(tok in norm_answer)>0 or (length(tok)>=6 and position(substr(tok,1,length(tok)-2) in norm_answer)>0) then
    hits:=hits+1;met:=array_append(met,tok);
   end if;
 end loop;
 if n=0 then return jsonb_build_object('status','needs_human_review','provisional_percent',null,'reason','reference_not_scannable');end if;
 pct:=round(100.0*hits/n)::integer;
 if x.dimension='exam_execution' then
   if norm_answer ~ '(المسال|المسأله|issue)' then structure_score:=structure_score+5;end if;
   if norm_answer ~ '(القاعد|rule)' then structure_score:=structure_score+5;end if;
   if norm_answer ~ '(التطبيق|application)' then structure_score:=structure_score+5;end if;
   if norm_answer ~ '(النتيج|conclusion)' then structure_score:=structure_score+5;end if;
   pct:=round(pct*0.8+structure_score)::integer;
 end if;
 return jsonb_build_object(
  'status','preliminary_internal','provisional_percent',greatest(0,least(100,pct)),
  'method','lexical_rubric_coverage_v1','grade_type','provisional_textual_coverage_not_semantic_accuracy',
  'confidence','low','needs_human_review',true,
  'criteria_met',to_jsonb(met),
  'feedback_ar',case when pct<55 then 'راجع عناصر القاعدة وقارن إجابتك بالنص المرجعي؛ النسبة أولية ولا تثبت صحة التكييف القانوني.'
                     else 'توجد عناصر مرتبطة بالقاعدة في إجابتك؛ راجع دقة العلاقات والاستثناءات مع المشرف.' end,
  'feedback_en',case when pct<55 then 'Review the legal elements: this provisional score does not establish legal correctness.'
                     else 'Some reference elements are present; verify the legal reasoning and qualifications with an instructor.' end);
end $$;
revoke all on function public.lex_training_rubric_coverage(text,text) from public,anon,authenticated;

create or replace function public.lex_training_overview(p_course text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid; v_next integer:=1; v_diag text; v_completed jsonb;
begin
 uid:=public.lex_require_student(p_course);
 if p_course<>'qa-qu-lawc101-rights' then raise exception 'invalid_course' using errcode='42501';end if;
 select status into v_diag from public.student_diagnostic_runs where user_id=uid and course_id=p_course;
 if coalesce(v_diag,'not_started')<>'completed' then
  return jsonb_build_object('allowed',false,'reason','diagnostic_not_completed','unlocked',0,'completed_count',0);
 end if;
 while v_next<=30 and exists(select 1 from public.student_training_sessions t
  where t.user_id=uid and t.course_id=p_course and t.session_number=v_next and t.completed_at is not null) loop
  v_next:=v_next+1;
 end loop;
 select coalesce(jsonb_agg(session_number order by session_number),'[]'::jsonb) into v_completed
 from public.student_training_sessions where user_id=uid and course_id=p_course and completed_at is not null;
 return jsonb_build_object('allowed',true,'unlocked',least(30,v_next),'completed_count',v_next-1,
  'completed',v_completed,'program_completed',v_next=31,'total_sessions',30,
  'approval_scope','founder_internal_pilot_not_university_certified');
end $$;

create or replace function public.lex_training_session_open(p_course text,p_session integer)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid; overview jsonb; v_next integer; v_mode text; v_weak text;
 v_dims text[]; v_dim text; v_session integer; v_id text; v_i integer; v_count integer;
 v_row public.content_items%rowtype; v_tasks jsonb:='[]'::jsonb; v_saved jsonb:='[]'::jsonb; v_fixed jsonb;
 v_avg numeric; v_grade numeric; v_n integer;
begin
 uid:=public.lex_require_student(p_course);
 if p_course<>'qa-qu-lawc101-rights' or p_session is null or p_session<1 or p_session>30 then
  raise exception 'invalid_course_or_session' using errcode='22023';end if;
 overview:=public.lex_training_overview(p_course);
 if overview->>'allowed'<>'true' then
   return jsonb_build_object('allowed',false,'reason','diagnostic_not_completed','tasks','[]'::jsonb,'saved','[]'::jsonb);end if;
 v_next:=(overview->>'unlocked')::integer;
 if p_session>v_next then
   return jsonb_build_object('allowed',false,'reason','previous_session_not_completed','next_session',v_next,'tasks','[]'::jsonb,'saved','[]'::jsonb);
 end if;
 if not exists(select 1 from public.student_level_releases where course_id=p_course
   and level_number=p_session and published and (academic_approved or founder_pilot_approved)) then
   return jsonb_build_object('allowed',false,'reason','content_not_released','tasks','[]'::jsonb,'saved','[]'::jsonb);
 end if;
 select training_plan->>'mode',nullif(result#>>'{measurements,recall,internal_grade,provisional_percent}','')::numeric
   into v_mode,v_grade
 from public.student_diagnostic_runs where user_id=uid and course_id=p_course;
 -- Individualise priority using the most recently recorded provisional skill scores.
 select dimension,avg((evaluation->>'provisional_percent')::numeric),count(*) into v_weak,v_avg,v_n
 from (select dimension,evaluation from public.student_training_answers where user_id=uid and course_id=p_course
       and evaluation->>'status'='preliminary_internal' and evaluation->>'provisional_percent' is not null
       order by submitted_at desc limit 15) recent
 group by dimension order by avg((evaluation->>'provisional_percent')::numeric) asc,count(*) desc limit 1;
 if v_weak is null then
   v_weak:=case when v_grade is not null and v_grade<50 then 'recall'
                 when v_mode='recall-led' then 'understanding'
                 when v_mode='understanding-led' then 'recall'
                 when v_mode='balanced' then 'exam_execution'
                 else 'understanding' end;
 end if;
 v_dims:=case v_weak
   when 'recall' then array['recall','understanding','exam_execution']
   when 'understanding' then array['understanding','exam_execution','recall']
   else array['exam_execution','understanding','recall'] end;
 v_count:=case when p_session%5=0 then 4 else 3 end;
 -- Once the first answer is submitted, freeze the selected tasks for this student.
 -- Never allow subsequent adaptive updates to change required task identities midway.
 select tasks_json into v_fixed from public.student_training_sessions
 where user_id=uid and course_id=p_course and session_number=p_session;
 if jsonb_typeof(v_fixed)='array' and jsonb_array_length(v_fixed)=v_count then
  v_tasks:=v_fixed;
 else
 for v_i in 1..v_count loop
  if p_session%5=0 then
   -- Six review checkpoints (5/10/.../30) each revisit the four preceding topics.
   v_session:=p_session-5+v_i;
   v_dim:=v_dims[((v_i-1)%3)+1];
  else
   v_session:=p_session;v_dim:=v_dims[v_i];
  end if;
  v_id:='rights-v1-s'||v_session||'-'||case when v_dim='exam_execution' then 'exam' else v_dim end;
  select * into v_row from public.content_items where id=v_id and course_id=p_course
    and item_type='essay' and metadata->>'owner_pilot_approved'='true'
    and cardinality(source_ids)>0 and length(prompt_ar)>20
    and length(rubric_json->>'prompt_en')>20;
  if not found then return jsonb_build_object('allowed',false,'reason','incomplete_reviewed_bank',
   'session',p_session,'missing',v_id,'tasks','[]'::jsonb,'saved','[]'::jsonb);end if;
  v_tasks:=v_tasks||jsonb_build_array(jsonb_build_object('id',v_id,'dimension',v_dim,
   'session_topic',v_session,'prompt_ar',v_row.prompt_ar,'prompt_en',v_row.rubric_json->>'prompt_en',
   'title_ar',v_row.rubric_json->>'topic_title_ar','title_en',v_row.rubric_json->>'topic_title_en',
   'sources',to_jsonb(v_row.source_ids)));
 end loop;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('item_id',item_id,'dimension',dimension,
   'answer_text',answer_text,'evaluation',evaluation,'submitted_at',submitted_at)
   order by submitted_at),'[]'::jsonb) into v_saved
 from public.student_training_answers where user_id=uid and course_id=p_course and session_number=p_session;
 return jsonb_build_object('allowed',true,'session',p_session,'checkpoint',p_session%5=0,
   'tasks',v_tasks,'saved',v_saved,'completed',jsonb_array_length(v_saved)=v_count,
   'weakest',v_weak,'initial_plan',v_mode,'is_current',p_session=v_next,
   'next_session',v_next,'score_notice','provisional_rule_coverage_not_model_semantic_accuracy',
   'academic_certified',false);
end $$;

create or replace function public.lex_training_submit(p_course text,p_session integer,p_item_id text,p_answer text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid; stage jsonb; v_id text; v_dim text; v_evaluation jsonb;
begin
 uid:=public.lex_require_student(p_course);
 if p_answer is null or length(trim(p_answer))<8 or length(p_answer)>4000 then
  raise exception 'invalid_training_answer' using errcode='22023';end if;
 stage:=public.lex_training_session_open(p_course,p_session);
 if stage->>'allowed'<>'true' then raise exception 'training_session_locked' using errcode='42501';end if;
 select t->>'id',t->>'dimension' into v_id,v_dim from jsonb_array_elements(stage->'tasks') t
 where t->>'id'=p_item_id limit 1;
 if v_id is null then raise exception 'item_not_authorized_for_session' using errcode='42501';end if;
 insert into public.student_training_sessions(user_id,course_id,session_number,tasks_json)
 values(uid,p_course,p_session,stage->'tasks') on conflict do nothing;
 v_evaluation:=public.lex_training_rubric_coverage(p_item_id,trim(p_answer));
 insert into public.student_training_answers
 (user_id,course_id,session_number,item_id,dimension,answer_text,evaluation)
 values(uid,p_course,p_session,p_item_id,v_dim,trim(p_answer),v_evaluation)
 on conflict(user_id,course_id,session_number,item_id) do nothing;
 if (select count(*) from public.student_training_answers
     where user_id=uid and course_id=p_course and session_number=p_session)=jsonb_array_length(stage->'tasks') then
  update public.student_training_sessions set completed_at=coalesce(completed_at,now())
  where user_id=uid and course_id=p_course and session_number=p_session;
 end if;
 return public.lex_training_session_open(p_course,p_session);
end $$;

do $permissions$
declare f regprocedure;
begin
 foreach f in array array[
  'public.lex_training_overview(text)'::regprocedure,
  'public.lex_training_session_open(text,integer)'::regprocedure,
  'public.lex_training_submit(text,integer,text,text)'::regprocedure
 ] loop
  execute format('revoke all on function %s from public,anon',f);
  execute format('grant execute on function %s to authenticated',f);
 end loop;
end $permissions$;
do $verify$
begin
 if (select count(*) from public.student_level_releases where course_id='qa-qu-lawc101-rights' and founder_pilot_approved and published)<>30
 then raise exception 'not all 30 stages released for founder internal pilot';end if;
 if (select count(*) from public.content_items where course_id='qa-qu-lawc101-rights' and item_type='essay' and metadata->>'owner_pilot_approved'='true')<>72
 then raise exception 'full 24-topic bank incomplete';end if;
end $verify$;
commit;
