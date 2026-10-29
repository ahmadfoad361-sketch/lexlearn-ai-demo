\set ON_ERROR_STOP on
begin;
do $$declare t uuid; r jsonb; owner_id uuid='90000000-0000-4000-8000-000000000001'; a uuid='10000000-0000-4000-8000-000000000001'; b uuid='10000000-0000-4000-8000-000000000002'; c uuid='10000000-0000-4000-8000-000000000003'; course text='qa-qu-lawc101-rights'; saved integer;
begin
 r=public.lex_admin_trials(owner_id,'list');if jsonb_array_length(r->'students')<4 then raise exception 'staff list incomplete';end if;
 if not private.student_can_train(a,course) then raise exception 'existing staff approval lost'; end if;
 if private.student_can_train(b,course) then raise exception 'self-registration grandfathered'; end if;
 if not exists(select 1 from public.profiles where id=b and account_status='pending' and not active) then raise exception 'pending status missing'; end if;
 select count(*) into saved from public.student_training_answers;
 begin perform public.lex_admin_trials(b,'list');raise exception 'student can administer';exception when insufficient_privilege then null;end;
 r=public.lex_admin_trials(owner_id,'save',jsonb_build_object('name','Trial CI','university','University','faculty','Law','subject','Rights','course_id',course,'professor_id','30000000-0000-4000-8000-000000000001','capacity',1,'starts_at',now()-interval '1 day','ends_at',now()+interval '1 day'));
 t=(r->>'trial_id')::uuid;
 r=public.lex_admin_trials(owner_id,'list');if jsonb_array_length(r->'trials')<>1 then raise exception 'group list incomplete';end if;
 r=public.lex_admin_trials(owner_id,'get',jsonb_build_object('trial_id',t));if r->>'name'<>'Trial CI' then raise exception 'group defaults read failed';end if;
 perform public.lex_admin_trials(owner_id,'assign',jsonb_build_object('trial_id',t,'user_ids',jsonb_build_array(b,c)));
 begin perform public.lex_admin_trials(owner_id,'approve',jsonb_build_object('trial_id',t,'user_ids',jsonb_build_array(b,c)));raise exception 'capacity bypass';exception when raise_exception then if sqlerrm<>'trial_capacity_reached' then raise;end if;end;
 if exists(select 1 from private.student_admissions where trial_id=t and status='approved') then raise exception 'bulk partial activation';end if;
 perform public.lex_admin_trials(owner_id,'approve',jsonb_build_object('trial_id',t,'user_ids',jsonb_build_array(b,b)));
 if not private.student_can_train(b,course) then raise exception 'approval failed';end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 if public.lex_require_student(course)<>b then raise exception 'approved RPC blocked';end if;
 if private.student_can_train(b,'another-course') then raise exception 'cross-course bypass';end if;
 perform public.lex_admin_trials(owner_id,'pause',jsonb_build_object('trial_id',t,'user_ids',jsonb_build_array(b)));
 if private.student_can_train(b,course) then raise exception 'pause bypass';end if;
 begin perform public.lex_diagnostic_begin(course);raise exception 'paused diagnostic bypass';exception when insufficient_privilege then null;end;
 begin perform public.lex_training_session_open(course,1);raise exception 'paused training bypass';exception when insufficient_privilege then null;end;
 begin perform public.lex_admin_trials(owner_id,'approve',jsonb_build_object('trial_id',t,'user_ids',jsonb_build_array(c)));raise exception 'paused seat reused';exception when raise_exception then if sqlerrm<>'trial_capacity_reached' then raise;end if;end;
 perform public.lex_admin_trials(owner_id,'approve',jsonb_build_object('trial_id',t,'user_ids',jsonb_build_array(b)));
 update private.university_trials set starts_at=now()+interval '1 hour' where id=t;
 if private.student_can_train(b,course) then raise exception 'early start bypass';end if;
 update private.university_trials set starts_at=now()-interval '2 days',ends_at=now()-interval '1 day' where id=t;
 if private.student_can_train(b,course) then raise exception 'expiry bypass';end if;
 update private.university_trials set ends_at=now()+interval '1 day',active=false where id=t;
 if private.student_can_train(b,course) then raise exception 'trial pause bypass';end if;
 update private.university_trials set active=true where id=t;
 if not private.student_can_train(b,course) then raise exception 'resume failed';end if;
 perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
 if not private.instructor_can_view(b,course) or private.instructor_can_view(c,course) or private.instructor_can_view(b,'other') then raise exception 'trial instructor scope broken';end if;
 if not exists(select 1 from jsonb_array_elements(public.lex_instructor_roster()->'students') s where s->>'id'=b::text) then raise exception 'trial instructor roster missing';end if;
 -- Private single-use invitation never approves the recipient.
 delete from private.student_admissions where user_id=c;
 perform public.lex_admin_trials(owner_id,'invite',jsonb_build_object('trial_id',t,'token_hash',repeat('a',64)));
 perform public.lex_claim_trial_invitation(repeat('a',64),c);
 if private.student_can_train(c,course) then raise exception 'invitation auto-approval';end if;
 begin perform public.lex_claim_trial_invitation(repeat('a',64),c);raise exception 'replayed invitation';exception when raise_exception then if sqlerrm<>'invitation_invalid' then raise;end if;end;
 if (select count(*) from public.student_training_answers)<>saved then raise exception 'learning results changed';end if;
 if has_function_privilege('authenticated','public.lex_admin_trials(uuid,text,jsonb)','EXECUTE') or has_function_privilege('anon','public.lex_claim_trial_invitation(text,uuid)','EXECUTE') then raise exception 'privileged RPC exposed';end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
do $$begin
 begin insert into public.attempts(user_id,course_id) values(auth.uid(),'qa-qu-lawc101-rights');raise exception 'direct REST insert bypass';exception when insufficient_privilege then null;end;
 begin perform public.lex_training_submit('qa-qu-lawc101-rights',1,'rights-v1-s1-recall','test');raise exception 'pending submit bypass';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
\echo 'Trial access: atomic capacity, pending, pause/resume, dates, legacy approvals, instructor scope, invitations, RPC and REST denial PASS'

begin;
do $$declare owner_id uuid='90000000-0000-4000-8000-000000000001';b uuid='10000000-0000-4000-8000-000000000002';c uuid='10000000-0000-4000-8000-000000000003';d uuid='10000000-0000-4000-8000-000000000004';a_group uuid;b_group uuid;settings jsonb;before_name text;records integer;begin
 settings=jsonb_build_object('name','Group A','university','جامعة الاختبار','faculty','كلية القانون','subject','نظرية الحق','year_label','الفرقة الثانية','country_code','eg','course_id','qa-qu-lawc101-rights','capacity',1,'starts_at',now()-interval '1 day','ends_at',now()+interval '2 days');
 a_group=(public.lex_admin_trials(owner_id,'save',settings)->>'trial_id')::uuid;
 b_group=(public.lex_admin_trials(owner_id,'save',settings||'{"name":"Group B"}'::jsonb)->>'trial_id')::uuid;
 select count(*) into records from public.student_training_answers;
 perform public.lex_admin_trials(owner_id,'assign',jsonb_build_object('trial_id',a_group,'user_ids',jsonb_build_array(b)));
 if not exists(select 1 from public.profiles where id=b and year_label='الفرقة الثانية' and university='جامعة الاختبار' and country_code='eg') then raise exception 'group defaults not applied';end if;
 perform public.lex_admin_trials(owner_id,'approve',jsonb_build_object('trial_id',a_group,'user_ids',jsonb_build_array(b)));
 perform public.lex_admin_trials(owner_id,'assign',jsonb_build_object('trial_id',b_group,'user_ids',jsonb_build_array(c)));
 perform public.lex_admin_trials(owner_id,'approve',jsonb_build_object('trial_id',b_group,'user_ids',jsonb_build_array(c)));
 select display_name into before_name from public.profiles where id=b;
 begin perform public.lex_admin_trials(owner_id,'move',jsonb_build_object('user_id',b,'trial_id',b_group,'patch',jsonb_build_object('display_name','Must rollback')));raise exception 'full destination accepted';exception when raise_exception then if sqlerrm<>'trial_capacity_reached' then raise;end if;end;
 if not exists(select 1 from private.student_admissions where user_id=b and trial_id=a_group) or (select display_name from public.profiles where id=b)<>before_name then raise exception 'failed move changed membership or name';end if;
 perform public.lex_admin_trials(owner_id,'move',jsonb_build_object('user_id',b,'trial_id',null,'patch',jsonb_build_object('display_name','Edited student','role','owner','active',false)));
 if not private.student_can_train(b,'qa-qu-lawc101-rights') or (select role from public.profiles where id=b)<>'student' then raise exception 'individual transfer changed approval/role';end if;
 if exists(select 1 from private.student_admissions where user_id=b and trial_id is not null) then raise exception 'individual not detached';end if;
 perform public.lex_admin_trials(owner_id,'move',jsonb_build_object('user_id',b,'trial_id',a_group));
 if not private.student_can_train(b,'qa-qu-lawc101-rights') then raise exception 'individual to group lost approval';end if;
 perform public.lex_admin_trials(owner_id,'pause',jsonb_build_object('trial_id',a_group,'user_ids',jsonb_build_array(b)));
 perform public.lex_admin_trials(owner_id,'move',jsonb_build_object('user_id',b,'trial_id',null));
 if private.student_can_train(b,'qa-qu-lawc101-rights') then raise exception 'paused transfer reactivated';end if;
 perform public.lex_admin_trials(owner_id,'approve_individual',jsonb_build_object('user_id',b));
 if not private.student_can_train(b,'qa-qu-lawc101-rights') then raise exception 'individual approval failed';end if;
 perform public.lex_admin_trials(owner_id,'move',jsonb_build_object('user_id',d,'trial_id',a_group));
 if private.student_can_train(d,'qa-qu-lawc101-rights') then raise exception 'pending transfer autoactivated';end if;
 perform public.lex_admin_trials(owner_id,'move',jsonb_build_object('user_id',d,'trial_id',null));
 if private.student_can_train(d,'qa-qu-lawc101-rights') then raise exception 'pending individual autoactivated';end if;
 if (select count(*) from public.student_training_answers)<>records then raise exception 'transfers changed results';end if;
end $$;
rollback;
\echo 'Group defaults, atomic edits and full-capacity rollback, individual/group transfers preserving approval, role, results PASS'

begin;
insert into public.courses(id) values('another-approved-course');
insert into public.enrollments(user_id,course_id,status) values('10000000-0000-4000-8000-000000000002','another-approved-course','active');
insert into private.student_admissions(user_id,course_id,status,approved_by) values('10000000-0000-4000-8000-000000000002','another-approved-course','approved','90000000-0000-4000-8000-000000000001');
update public.profiles set active=true,account_status='active' where id='10000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$begin
 if not (public.lex_student_access(null)->>'allowed')::boolean then raise exception 'other approved course cannot sign in';end if;
 if (public.lex_student_access('qa-qu-lawc101-rights')->>'allowed')::boolean then raise exception 'other course approval leaked to full rights training';end if;
end $$;
rollback;
\echo 'Staff list/get execution and approved-course login without cross-course training access PASS'
