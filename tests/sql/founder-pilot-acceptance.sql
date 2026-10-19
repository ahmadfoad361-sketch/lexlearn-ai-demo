-- Full real Postgres RPC/RLS acceptance with distinct synthetic learner identity.
\set ON_ERROR_STOP on
do $guard$
begin
 if not public.lex_diagnostic_bank_ready('qa-qu-lawc101-rights') then raise exception 'bank not ready';end if;
 if public.lex_diagnostic_bank_ready('other-course') then raise exception 'pilot leaked to other courses';end if;
 if (select count(*) from public.content_items where metadata->>'pilot_review_mode'='founder_authorized_ai_assisted_20261019')<>9
 then raise exception 'bank scope incorrect';end if;
 if exists(select 1 from public.student_level_releases where academic_approved=true)
 then raise exception 'falsified academic approval';end if;
end $guard$;
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
do $test$
declare d jsonb; l jsonb;
begin
 d:=public.lex_diagnostic_begin('qa-qu-lawc101-rights');
 if d->>'status'<>'in_progress' then raise exception 'student failed to start';end if;
 d:=public.lex_diagnostic_draft('qa-qu-lawc101-rights','[{"question_id":"q39r","selected":0}]'::jsonb);
 if jsonb_array_length(d->'draft')<>1 then raise exception 'draft save failed';end if;
 d:=public.lex_diagnostic_complete('qa-qu-lawc101-rights',
 '[{"question_id":"q39r","selected":0},{"question_id":"q49r","selected":1},{"question_id":"q62r","selected":2},{"question_id":"q39u","selected":1},{"question_id":"q50u","selected":1},{"question_id":"q63a","selected":2}]'::jsonb,
 'تبدأ الشخصية القانونية بتمام الولادة حيا وتنتهي بالموت');
 if d->>'status'<>'completed' or d->'result'->'metrics'->>'recognition'<>'100'
 then raise exception 'server result missing: %',d;end if;
 if (public.lex_level_access('qa-qu-lawc101-rights',1))->>'allowed'<>'true'
 then raise exception 'founder-approved level one not opened';end if;
 l:=public.lex_level_one_open('qa-qu-lawc101-rights');
 if l->>'allowed'<>'true' or jsonb_array_length(l->'tasks')<>3
 then raise exception 'adaptive first level not available: %',l;end if;
 if (public.lex_level_access('qa-qu-lawc101-rights',2))->>'allowed'<>'false'
 then raise exception 'level 2 must remain gated';end if;
 l:=public.lex_level_one_submit('qa-qu-lawc101-rights',l->'tasks'->0->>'id','تبدأ الشخصية القانونية عند الولادة حيا وتنتهي بالموت');
 if jsonb_array_length(l->'saved')<>1 then raise exception 'level-one answer not saved';end if;
end $test$;
reset role;
-- Confirm no privilege granted for direct false awards.
select 'Founder pilot server-verified diagnostic, level one, RLS and no academic approval: PASS' as result;