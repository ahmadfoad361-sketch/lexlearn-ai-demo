-- Preserve login for every approved course; keep course-specific training gates strict.
-- Fix the staff list alias so PL/pgSQL's trial row variable cannot shadow it.
begin;
create or replace function public.lex_student_access(p_course text) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('allowed',private.student_can_train(p.id,coalesce(p_course,a.course_id)),
 'status',case when not p.active then p.account_status when a.status is null then 'pending'
 when a.status<>'approved' then a.status when t.id is not null and not t.active then 'paused'
 when now()<t.starts_at then 'not_started' when now()>=t.ends_at then 'expired' else 'approved' end,
 'trial',t.name,'starts_at',t.starts_at,'ends_at',t.ends_at)
 from public.profiles p left join private.student_admissions a on a.user_id=p.id and (a.course_id=p_course or p_course is null)
 left join private.university_trials t on t.id=a.trial_id where p.id=auth.uid() and p.role='student'
 order by private.student_can_train(p.id,coalesce(p_course,a.course_id)) desc,a.approved_at desc nulls last limit 1;
$$;
revoke all on function public.lex_student_access(text) from public,anon;
grant execute on function public.lex_student_access(text) to authenticated;
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
   select tr.*,p.display_name as professor_name,
   (select count(*) from private.student_admissions a where a.trial_id=tr.id and a.status in ('approved','paused')) as reserved,
   (select count(*) from private.student_admissions a where a.trial_id=tr.id and a.status='pending') as pending
   from private.university_trials tr left join public.profiles p on p.id=tr.professor_id) x),'[]'),
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
commit;
