-- Explicit staff approval, bounded university trials, and one-use private invitations.
-- No passwords, invitation tokens, or learning results are stored here.
begin;
create table private.university_trials (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 160),
 university text not null, faculty text not null, subject text not null,
 year_label text not null default 'الفرقة الأولى', country_code text not null default 'qa' check(country_code in ('qa','eg','sa','ae','other')),
 course_id text not null references public.courses(id), professor_id uuid references public.profiles(id),
 capacity integer not null check(capacity between 1 and 10000),
 starts_at timestamptz not null, ends_at timestamptz not null check(ends_at>starts_at),
 active boolean not null default true, created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now()
);
create table private.student_admissions (
 user_id uuid not null references public.profiles(id) on delete cascade,
 course_id text not null references public.courses(id), trial_id uuid references private.university_trials(id),
 status text not null default 'pending' check(status in ('pending','approved','paused')),
 approved_by uuid references public.profiles(id), approved_at timestamptz,
 primary key(user_id,course_id),
 check(status='pending' or approved_by is not null)
);
create index student_admissions_trial_idx on private.student_admissions(trial_id,status);
create table private.trial_invitations (
 token_hash text primary key check(token_hash ~ '^[a-f0-9]{64}$'),
 trial_id uuid not null references private.university_trials(id),
 expires_at timestamptz not null, created_by uuid not null references public.profiles(id),
 used_by uuid references public.profiles(id) on delete set null, used_at timestamptz,
 created_at timestamptz not null default now()
);
alter table private.university_trials enable row level security;
alter table private.student_admissions enable row level security;
alter table private.trial_invitations enable row level security;
revoke all on private.university_trials,private.student_admissions,private.trial_invitations from public,anon,authenticated;

-- Preserve only existing, auditable staff approvals. Self-registration was formerly automatic.
insert into private.student_admissions(user_id,course_id,status,approved_by,approved_at)
select distinct on (p.id,e.course_id) p.id,e.course_id,'approved',a.actor_user_id,a.created_at
from public.profiles p join public.enrollments e on e.user_id=p.id and e.status='active'
join public.admin_audit a on a.target_user_id=p.id
join public.profiles actor on actor.id=a.actor_user_id and actor.role in ('owner','admin')
where p.role='student' and p.active and (a.action='CREATE_STUDENT' or
 (a.action in ('SET_STATUS','TOGGLE_ACTIVE') and a.details->>'to'='active'))
order by p.id,e.course_id,a.created_at desc;
update public.profiles p set active=false,account_status='pending'
where p.role='student' and p.active and not exists(select 1 from private.student_admissions a where a.user_id=p.id and a.status='approved');

create or replace function private.student_can_train(p_user uuid,p_course text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p join private.student_admissions a on a.user_id=p.id
 left join private.university_trials t on t.id=a.trial_id
 join public.enrollments e on e.user_id=p.id and e.course_id=a.course_id and e.status='active'
 where p.id=p_user and p.role='student' and p.active and p.account_status='active'
 and a.course_id=p_course and a.status='approved'
 and (a.trial_id is null or (t.active and now()>=t.starts_at and now()<t.ends_at)));
$$;
revoke all on function private.student_can_train(uuid,text) from public,anon;
grant execute on function private.student_can_train(uuid,text) to authenticated,service_role;
create or replace function public.lex_require_student(p_course text) returns uuid
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'not_authenticated' using errcode='42501'; end if;
 if not private.student_can_train(auth.uid(),p_course) then raise exception 'student_approval_required' using errcode='42501'; end if;
 return auth.uid();
end $$;
revoke all on function public.lex_require_student(text) from public,anon;
grant execute on function public.lex_require_student(text) to authenticated;
create or replace function public.lex_student_access_for(p_user uuid,p_course text) returns boolean
language sql stable security definer set search_path='' as $$ select private.student_can_train(p_user,p_course); $$;
revoke all on function public.lex_student_access_for(uuid,text) from public,anon,authenticated;
grant execute on function public.lex_student_access_for(uuid,text) to service_role;
create or replace function public.lex_student_access(p_course text) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('allowed',private.student_can_train(auth.uid(),p_course),
 'status',case when not p.active then p.account_status when a.status is null then 'pending'
 when a.status<>'approved' then a.status when t.id is not null and not t.active then 'paused'
 when now()<t.starts_at then 'not_started' when now()>=t.ends_at then 'expired' else 'approved' end,
 'trial',t.name,'starts_at',t.starts_at,'ends_at',t.ends_at)
 from public.profiles p left join private.student_admissions a on a.user_id=p.id and a.course_id=p_course
 left join private.university_trials t on t.id=a.trial_id where p.id=auth.uid() and p.role='student';
$$;
revoke all on function public.lex_student_access(text) from public,anon;
grant execute on function public.lex_student_access(text) to authenticated;

-- Existing policies remain in force. These restrictive policies also stop direct REST writes.
do $$ declare t text; begin
 foreach t in array array['attempts','learner_snapshots','student_diagnostic_runs','student_training_sessions','student_training_answers'] loop
  execute format('create policy "approved student writes" on public.%I as restrictive for insert to authenticated with check (private.student_can_train(auth.uid(),course_id))',t);
  execute format('create policy "approved student updates" on public.%I as restrictive for update to authenticated using (private.student_can_train(auth.uid(),course_id)) with check (private.student_can_train(auth.uid(),course_id))',t);
 end loop;
end $$;

create or replace function public.lex_admin_trials(p_actor uuid,p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare t private.university_trials; v_id uuid; v_ids uuid[]; n integer; reserved integer; row_count integer;
 v_status text; v_old_trial uuid; v_course text; v_member private.student_admissions; v_result jsonb; v_actor public.profiles; patch jsonb; k text; lim integer;
begin
 select * into v_actor from public.profiles where id=p_actor and active and role in ('owner','admin');
 if not found then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if p_action='get' then
  select to_jsonb(x) into v_result from private.university_trials x where id=(p_data->>'trial_id')::uuid;
  if v_result is null then raise exception 'trial_not_found';end if;
  return v_result;
 end if;
 if p_action='list' then
  return jsonb_build_object('trials',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
   select t.*,p.display_name as professor_name,
   (select count(*) from private.student_admissions a where a.trial_id=t.id and a.status in ('approved','paused')) as reserved,
   (select count(*) from private.student_admissions a where a.trial_id=t.id and a.status='pending') as pending
   from private.university_trials t left join public.profiles p on p.id=t.professor_id) x),'[]'),
   'students',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
    select p.id,p.display_name,p.username,p.lexlearn_number,p.university,p.faculty,p.year_label,p.country_code,p.academic_section,p.student_registration_number,p.institutional_group_email,p.account_status,p.created_at,a.trial_id,a.status as admission_status
    from public.profiles p left join private.student_admissions a on a.user_id=p.id and a.course_id='qa-qu-lawc101-rights' where p.role='student') x),'[]'),
   'professors',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',display_name)) from public.profiles where role='instructor' and active),'[]'),
   'courses',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',title_ar)) from public.courses where id='qa-qu-lawc101-rights'),'[]'));
 end if;
 if p_action='save' then
  perform pg_advisory_xact_lock(72645133);
  if coalesce(p_data->>'year_label','الفرقة الأولى') not in ('الفرقة الأولى','الفرقة الثانية','الفرقة الثالثة','الفرقة الرابعة') then raise exception 'invalid_year';end if;
  if coalesce(length(btrim(p_data->>'name')),0) not between 1 and 160 or
     coalesce(length(btrim(p_data->>'university')),0) not between 1 and 160 or
     coalesce(length(btrim(p_data->>'faculty')),0) not between 1 and 160 or
     coalesce(length(btrim(p_data->>'subject')),0) not between 1 and 160 then raise exception 'invalid_trial'; end if;
  if p_data->>'course_id'<>'qa-qu-lawc101-rights' or p_data->>'course_id' is null then raise exception 'course_not_released'; end if;
  if nullif(p_data->>'professor_id','') is not null and not exists(select 1 from public.profiles where id=(p_data->>'professor_id')::uuid and role='instructor' and active) then raise exception 'invalid_professor'; end if;
  v_id=nullif(p_data->>'id','')::uuid;
  if v_id is not null then
   select * into t from private.university_trials where id=v_id for update;
   if not found then raise exception 'trial_not_found'; end if;
   select count(*) into reserved from private.student_admissions where trial_id=v_id and status in ('approved','paused');
   if (p_data->>'capacity')::integer<reserved then raise exception 'capacity_below_reserved'; end if;
   update private.university_trials set year_label=coalesce(p_data->>'year_label','الفرقة الأولى'),country_code=coalesce(p_data->>'country_code','qa'),name=btrim(p_data->>'name'),university=btrim(p_data->>'university'),faculty=btrim(p_data->>'faculty'),subject=btrim(p_data->>'subject'),professor_id=nullif(p_data->>'professor_id','')::uuid,capacity=(p_data->>'capacity')::integer,starts_at=(p_data->>'starts_at')::timestamptz,ends_at=(p_data->>'ends_at')::timestamptz,active=coalesce((p_data->>'active')::boolean,true) where id=v_id;
  else
   insert into private.university_trials(name,university,faculty,subject,course_id,professor_id,capacity,starts_at,ends_at,active,created_by,year_label,country_code)
   values(btrim(p_data->>'name'),btrim(p_data->>'university'),btrim(p_data->>'faculty'),btrim(p_data->>'subject'),p_data->>'course_id',nullif(p_data->>'professor_id','')::uuid,(p_data->>'capacity')::integer,(p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,coalesce((p_data->>'active')::boolean,true),p_actor,coalesce(p_data->>'year_label','الفرقة الأولى'),coalesce(p_data->>'country_code','qa')) returning id into v_id;
  end if;
 elsif p_action='move' then
  perform pg_advisory_xact_lock(72645133);
  v_ids=array[(p_data->>'user_id')::uuid];v_course='qa-qu-lawc101-rights';v_id=nullif(p_data->>'trial_id','')::uuid;
  if not exists(select 1 from public.profiles where id=v_ids[1] and role='student') then raise exception 'invalid_students';end if;
  select * into v_member from private.student_admissions where user_id=v_ids[1] and course_id=v_course for update;
  v_old_trial=v_member.trial_id;v_status=coalesce(v_member.status,'pending');
  if v_id is not null then
   select * into t from private.university_trials where id=v_id for update;
   if not found then raise exception 'trial_not_found';end if;
   if not t.active or t.ends_at<=now() then raise exception 'trial_unavailable';end if;
   if v_status in ('approved','paused') and v_old_trial is distinct from v_id then
    select count(*) into reserved from private.student_admissions where trial_id=v_id and status in ('approved','paused');
    if reserved>=t.capacity then raise exception 'trial_capacity_reached';end if;
   end if;
  end if;
  patch=coalesce(p_data->'patch','{}'::jsonb);
  if jsonb_typeof(patch)<>'object' then raise exception 'invalid_profile';end if;
  for k,lim in select * from (values ('display_name',160),('university',160),('faculty',160),('year_label',80),('academic_section',100),('student_registration_number',80)) v(field,max_length) loop
   if patch ? k and (jsonb_typeof(patch->k)<>'string' or length(btrim(patch->>k))>lim or (k in ('display_name','university','faculty','year_label') and length(btrim(patch->>k))<2)) then raise exception 'invalid_profile';end if;
  end loop;
  if patch ? 'country_code' and coalesce(patch->>'country_code','') not in ('qa','eg','sa','ae','other') then raise exception 'invalid_country';end if;
  update public.profiles p set display_name=coalesce(btrim(patch->>'display_name'),p.display_name),university=coalesce(btrim(patch->>'university'),p.university),faculty=coalesce(btrim(patch->>'faculty'),p.faculty),year_label=coalesce(btrim(patch->>'year_label'),p.year_label),country_code=coalesce(patch->>'country_code',p.country_code),academic_section=coalesce(btrim(patch->>'academic_section'),p.academic_section),student_registration_number=coalesce(btrim(patch->>'student_registration_number'),p.student_registration_number) where p.id=v_ids[1];
  insert into private.student_admissions(user_id,course_id,trial_id,status,approved_by,approved_at)
  values(v_ids[1],v_course,v_id,v_status,v_member.approved_by,v_member.approved_at)
  on conflict(user_id,course_id) do update set trial_id=excluded.trial_id;
  if v_id is not null then
   update public.profiles set university=t.university,faculty=t.faculty,year_label=t.year_label,country_code=t.country_code where id=v_ids[1];
  end if;
  v_result=jsonb_build_object('previous_trial_id',v_old_trial,'preserved_status',v_status);
 elsif p_action in ('approve_individual','pause_individual') then
  perform pg_advisory_xact_lock(72645133);v_ids=array[(p_data->>'user_id')::uuid];v_course='qa-qu-lawc101-rights';
  if not exists(select 1 from public.profiles where id=v_ids[1] and role='student') then raise exception 'invalid_students';end if;
  if exists(select 1 from private.student_admissions where user_id=v_ids[1] and course_id=v_course and trial_id is not null) then raise exception 'individual_student_required';end if;
  if p_action='approve_individual' then
   insert into private.student_admissions(user_id,course_id,status,approved_by,approved_at) values(v_ids[1],v_course,'approved',p_actor,now())
   on conflict(user_id,course_id) do update set status='approved',approved_by=p_actor,approved_at=now();
   update public.profiles set active=true,account_status='active' where id=v_ids[1];
   insert into public.enrollments(user_id,course_id,status) values(v_ids[1],v_course,'active') on conflict(user_id,course_id) do update set status='active';
  else
   update public.profiles set active=false,account_status='paused' where id=v_ids[1];
   update private.student_admissions set status='paused' where user_id=v_ids[1] and course_id=v_course and status='approved';
  end if;
 elsif p_action in ('assign','approve','pause','invite') then
  -- Serialize admissions across trials as well as within one trial; bulk requests are atomic.
  perform pg_advisory_xact_lock(72645133);
  v_id=(p_data->>'trial_id')::uuid;
  select * into t from private.university_trials where id=v_id for update;
  if not found then raise exception 'trial_not_found'; end if;
  if p_action='invite' then
   if not t.active or t.ends_at<=now() then raise exception 'trial_unavailable'; end if;
   insert into private.trial_invitations(token_hash,trial_id,expires_at,created_by)
   values(p_data->>'token_hash',t.id,least(now()+interval '7 days',t.ends_at),p_actor);
   v_result=jsonb_build_object('expires_at',least(now()+interval '7 days',t.ends_at));
  else
   select array_agg(distinct value::uuid) into v_ids from jsonb_array_elements_text(p_data->'user_ids');
   if coalesce(cardinality(v_ids),0) not between 1 and 1000 then raise exception 'select_students'; end if;
   select count(*) into n from public.profiles where id=any(v_ids) and role='student';
   if n<>cardinality(v_ids) then raise exception 'invalid_students'; end if;
   if p_action='assign' then
    if exists(select 1 from private.student_admissions where user_id=any(v_ids) and course_id=t.course_id and status<>'pending' and trial_id is not null and trial_id is distinct from t.id) then raise exception 'already_approved_elsewhere'; end if;
    insert into private.student_admissions(user_id,course_id,trial_id) select unnest(v_ids),t.course_id,t.id
    on conflict(user_id,course_id) do update set trial_id=excluded.trial_id,status=case when student_admissions.trial_id is distinct from excluded.trial_id then 'pending' else student_admissions.status end;
    update public.profiles set university=t.university,faculty=t.faculty,year_label=t.year_label,country_code=t.country_code where id=any(v_ids);
    update public.profiles p set active=false,account_status='pending' where p.id=any(v_ids) and exists(select 1 from private.student_admissions a where a.user_id=p.id and a.trial_id=t.id and a.status='pending');
   else
    if exists(select 1 from unnest(v_ids) u where not exists(select 1 from private.student_admissions a where a.user_id=u and a.course_id=t.course_id and a.trial_id=t.id)) then raise exception 'assign_students_first'; end if;
    if p_action='approve' then
     if not t.active or t.ends_at<=now() then raise exception 'trial_unavailable'; end if;
     select count(*) into reserved from private.student_admissions where trial_id=t.id and status in ('approved','paused');
     select count(*) into n from private.student_admissions where trial_id=t.id and user_id=any(v_ids) and status='pending';
     if reserved+n>t.capacity then raise exception 'trial_capacity_reached'; end if;
     update private.student_admissions set status='approved',approved_by=p_actor,approved_at=now() where trial_id=t.id and user_id=any(v_ids);
     update public.profiles set active=true,account_status='active' where id=any(v_ids);
     insert into public.enrollments(user_id,course_id,status) select unnest(v_ids),t.course_id,'active' on conflict(user_id,course_id) do update set status='active';
    else
     update private.student_admissions set status='paused',approved_by=coalesce(approved_by,p_actor) where trial_id=t.id and user_id=any(v_ids) and status<>'pending';
     update public.profiles set active=false,account_status='paused' where id=any(v_ids);
    end if;
   end if;
  end if;
 else raise exception 'invalid_action';
 end if;
 insert into public.admin_audit(actor_user_id,action,details) values(p_actor,'UNIVERSITY_TRIAL_'||upper(p_action),jsonb_build_object('trial_id',v_id,'user_ids',v_ids)||coalesce(v_result,'{}'));
 return jsonb_build_object('ok',true,'trial_id',v_id)||coalesce(v_result,'{}');
end $$;
revoke all on function public.lex_admin_trials(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.lex_admin_trials(uuid,text,jsonb) to service_role;

create or replace function public.lex_claim_trial_invitation(p_hash text,p_user uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare inv private.trial_invitations; t private.university_trials;
begin
 select * into inv from private.trial_invitations where token_hash=p_hash for update;
 if not found or inv.used_at is not null or inv.expires_at<=now() then raise exception 'invitation_invalid'; end if;
 select * into t from private.university_trials where id=inv.trial_id;
 if not t.active or t.ends_at<=now() then raise exception 'trial_unavailable'; end if;
 if not exists(select 1 from public.profiles where id=p_user and role='student' and not active and account_status='pending') then raise exception 'pending_student_required'; end if;
 insert into private.student_admissions(user_id,course_id,trial_id) values(p_user,t.course_id,t.id);
 update public.profiles set university=t.university,faculty=t.faculty,year_label=t.year_label,country_code=t.country_code where id=p_user;
 update private.trial_invitations set used_by=p_user,used_at=now() where token_hash=p_hash;
 return true;
end $$;
revoke all on function public.lex_claim_trial_invitation(text,uuid) from public,anon,authenticated;
grant execute on function public.lex_claim_trial_invitation(text,uuid) to service_role;

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
 ) or exists(select 1 from private.student_admissions a join private.university_trials t on t.id=a.trial_id
 join public.profiles staff on staff.id=t.professor_id and staff.active and staff.role='instructor'
 where staff.id=auth.uid() and a.user_id=p_student and a.course_id=p_course and a.status in ('approved','paused'));

$$;
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
 result=jsonb_set(result,'{assignments}',coalesce(result->'assignments','[]')||coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'subject',t.subject,'university',t.university,'faculty',t.faculty,'year',t.year_label,'course_id',t.course_id,'country',t.country_code)) from private.university_trials t where t.professor_id=uid),'[]'));
 result=jsonb_set(result,'{students}',coalesce(result->'students','[]')||coalesce((select jsonb_agg(jsonb_build_object('assignment_id',t.id,'id',s.id,'name',s.display_name,'university',s.university,'faculty',s.faculty,'year',s.year_label,'course_id',a.course_id,'subject',t.subject)) from private.student_admissions a join private.university_trials t on t.id=a.trial_id join public.profiles s on s.id=a.user_id where t.professor_id=uid and a.status in ('approved','paused')),'[]'));
 return coalesce(result,'{}'::jsonb);
end $$;
commit;
