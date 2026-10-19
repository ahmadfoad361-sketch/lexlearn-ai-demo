-- Run only after fixture, lifecycle migrations 001 + 002 and lifecycle-acceptance.sql.
-- Dedicated isolated PostgreSQL test; fixture reviewers and approvals are NOT real.
\set ON_ERROR_STOP on
reset role;
insert into public.content_items(id,course_id,unit_id,concept_id,dimension,item_type,status,
 reviewed_at,legal_reviewer,learning_reviewer,prompt_ar,rubric_json,options_json,answer_key_json,source_ids,metadata)
select x.id,'qa-qu-lawc101-rights','week-1','topic-1',x.dimension,'essay','approved',now(),
 '20000000-0000-4000-8000-000000000001'::uuid,
 '20000000-0000-4000-8000-000000000002'::uuid,
 'Test fixture legal prompt for academic task: '||x.id,
 jsonb_build_object('prompt_en','Test fixture English question for the academic task: '||x.id),
 '{}'::jsonb,'{}'::jsonb,array['qa-civil-2004-art39','qa-civil-2004-art40']::text[],
 '{"legal_approval":true,"learning_approval":true}'::jsonb
from (values ('rights-v1-s1-recall','recall'),
('rights-v1-s1-understanding','understanding'),
('rights-v1-s1-exam','exam_execution')) as x(id,dimension);
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
do $$
declare r jsonb; again jsonb; ids text[];
begin
 r:=public.lex_level_one_open('qa-qu-lawc101-rights');
 if r->>'allowed'<>'true' then raise exception 'A first-level should open on reviewed server release: %',r;end if;
 if r->>'plan_mode'<>'recall-led' then raise exception 'A must use recognition-led plan';end if;
 ids:=array(select jsonb_array_elements(r->'tasks')->>'id');
 if ids<>array['rights-v1-s1-understanding','rights-v1-s1-exam','rights-v1-s1-recall']::text[]
 then raise exception 'A adaptation order wrong: %',ids;end if;
 if r::text like '%correct_index%' or r::text like '%reference_outcome%'
 then raise exception 'Model answers/keys must not be sent to learner';end if;
 r:=public.lex_level_one_submit('qa-qu-lawc101-rights','rights-v1-s1-understanding','Initial first answer.');
 if jsonb_array_length(r->'saved')<>1 then raise exception 'A first answer not persisted';end if;
 again:=public.lex_level_one_submit('qa-qu-lawc101-rights','rights-v1-s1-understanding','Forgery after refresh.');
 if jsonb_array_length(again->'saved')<>1 or again->'saved'->0->>'answer_text'<>'Initial first answer.'
 then raise exception 'Double submit changed the original answer';end if;
 if (public.lex_level_one_open('qa-qu-lawc101-rights'))->'saved'->0->>'answer_text'<>'Initial first answer.'
 then raise exception 'A resume missing saved answer';end if;
 r:=public.lex_level_one_submit('qa-qu-lawc101-rights','rights-v1-s1-exam','Application and structured reasoning.');
 r:=public.lex_level_one_submit('qa-qu-lawc101-rights','rights-v1-s1-recall','Unaided retrieval of statutory rule.');
 if r->>'status'<>'practice_completed_pending_review' or jsonb_array_length(r->'saved')<>3
 then raise exception 'A practice completion missing';end if;
 if r->>'review_status'<>'provisional_internal_grading' or
 (r->'saved'->0->'evaluation'->>'status') is null or
 r->'saved'->0->'evaluation'->>'grade_type'<>'provisional_rule_coverage_not_final_legal_grade'
 then raise exception 'Free answer must retain provisional grade provenance and human review: %',r->'saved'->0->'evaluation';end if;
 if (public.lex_level_access('qa-qu-lawc101-rights',2))->>'allowed'<>'false'
 then raise exception 'Pending first-level essays unlocked level two';end if;
 if (select count(*) from public.student_level_responses)<>3 then raise exception 'A saved count wrong';end if;
 begin
  update public.student_level_responses set answer_text='forged academic grade';
  raise exception 'BUG: client could alter first-level official answer';
 exception when insufficient_privilege then null;end;
 begin
  perform public.lex_level_one_submit('qa-qu-lawc101-rights','test-q39r','invalid diagnostic item');
  raise exception 'BUG: diagnostic question accepted as Level1 item';
 exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
do $$
declare r jsonb; ids text[];
begin
 if (select count(*) from public.student_level_responses)<>0 then raise exception 'Student B read A answers';end if;
 r:=public.lex_level_one_open('qa-qu-lawc101-rights');
 if r->>'plan_mode'<>'understanding-led' then raise exception 'B plan wrong';end if;
 ids:=array(select jsonb_array_elements(r->'tasks')->>'id');
 if ids<>array['rights-v1-s1-recall','rights-v1-s1-understanding','rights-v1-s1-exam']::text[]
 then raise exception 'B order wrong: %',ids;end if;
 r:=public.lex_level_one_submit('qa-qu-lawc101-rights','rights-v1-s1-recall','Second student response persists.');
 if jsonb_array_length(r->'saved')<>1 then raise exception 'B answer not stored';end if;
 if (select count(*) from public.student_level_responses)<>1 then raise exception 'B read A rows';end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',false);
do $$
declare r jsonb; ids text[];
begin
 r:=public.lex_level_one_open('qa-qu-lawc101-rights');
 if r->>'plan_mode'<>'foundation' then raise exception 'C foundation plan missing';end if;
 ids:=array(select jsonb_array_elements(r->'tasks')->>'id');
 if ids[1]<>'rights-v1-s1-understanding' then raise exception 'C must begin with supported understanding';end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',false);
do $$
declare r jsonb;
begin
 r:=public.lex_level_one_open('qa-qu-lawc101-rights');
 if r->>'allowed'<>'false' or r->>'reason'<>'diagnostic_not_completed' then raise exception 'Unassessed D reached lesson';end if;
end $$;
reset role;
-- A missing legal review immediately removes access even with a published level flag.
update public.content_items set status='legal_review',reviewed_at=null where id='rights-v1-s1-understanding';
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
do $$
declare r jsonb;
begin
 r:=public.lex_level_one_open('qa-qu-lawc101-rights');
 if r->>'allowed'<>'false' or r->>'reason'<>'level_one_items_not_approved' then
  raise exception 'Unreviewed content accessed: %',r;
 end if;
end $$;
reset role;
\echo 'PASS: 3 adaptive Level1 pathways, essay persistence/resume, no false grading, cross-user RLS, unreviewed item lock, Level2 lock'
