-- Read-only acceptance assertions for proposed continuous policy, executed on ISOLATED CI PostgreSQL.
do $checks$
declare p jsonb; baseline jsonb;
begin
 p:=public.lex_skill_policy(null,80,0,12);
 if p->>'mode'<>'measurement_needed' or p#>>'{indicators,recall}' is not null
 then raise exception 'missing recall must not be fabricated: %',p; end if;
 p:=public.lex_skill_policy(60,58,20,20);
 if p->>'mode'<>'balanced' or (p#>>'{allocation,recall}')::int<>50
 then raise exception 'tiny percentage gap must remain balanced: %',p;end if;
 p:=public.lex_skill_policy(25,30,20,20);
 if p->>'mode'<>'foundations' then raise exception 'double-low foundations: %',p;end if;
 p:=public.lex_skill_policy(91,90,20,20);
 if p->>'mode'<>'consolidation' then raise exception 'double-high consolidation: %',p;end if;
 p:=public.lex_skill_policy(92,20,12,12);
 if p->>'mode'<>'provisional_bridge' or p->>'target'<>'understanding'
 or (p#>>'{allocation,understanding}')::int<=50 or (p#>>'{allocation,understanding}')::int>60
 then raise exception 'cautious recall -> understanding bridge: %',p;end if;
 p:=public.lex_skill_policy(22,90,12,12);
 if p->>'mode'<>'provisional_bridge' or p->>'target'<>'recall'
 or (p#>>'{allocation,recall}')::int<=50 or (p#>>'{allocation,recall}')::int>60
 then raise exception 'cautious understanding -> recall bridge: %',p;end if;
 p:=public.lex_skill_policy(94,10,2,2);
 if p->>'mode'<>'balanced' then raise exception 'low evidence cannot force a bridge: %',p;end if;
 if position('القاعدة' in public.lex_skill_instruction(p,'recall-led','understanding','ar'))=0
 then raise exception 'initial recognition guidance missing';end if;
 if position('retrieval cues' in public.lex_skill_instruction(
    public.lex_skill_policy(22,90,12,12),'balanced','recall','en'))=0
 then raise exception 'understanding-led reconstruction guidance missing';end if;
 if (public.lex_skill_policy(92,20,12,12)->>'mastery')::boolean
 then raise exception 'provisional training is not mastery';end if;
 raise notice 'continuous skill policy: PASS (missing, close, low/low, high/high, bidirectional, uncertainty)';
end $checks$;

-- Real authenticated function integration on the isolated CI fixture:
-- student B has no diagnostic at this point; completing all objective answers
-- incorrectly must request foundations, not a fake free recall grade.
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
do $student_b$
declare d jsonb; sess jsonb; task jsonb;
begin
 d:=public.lex_diagnostic_begin('qa-qu-lawc101-rights');
 if d->>'status'<>'in_progress' then raise exception 'student B diagnostic did not start';end if;
 d:=public.lex_diagnostic_complete('qa-qu-lawc101-rights','[
  {"question_id":"q39r","selected":1},{"question_id":"q49r","selected":0},
  {"question_id":"q62r","selected":1},{"question_id":"q39u","selected":0},
  {"question_id":"q50u","selected":0},{"question_id":"q63a","selected":0}
 ]'::jsonb,'');
 if d#>>'{training_plan,mode}'<>'foundation'
 then raise exception 'student B double-low diagnostic not foundational: %',d;end if;
 if d#>>'{result,measurements,recall,value}' is not null
 then raise exception 'recognition misreported as free recall';end if;
 sess:=public.lex_training_session_open('qa-qu-lawc101-rights',1);
 if sess->>'allowed'<>'true' then raise exception 'student B foundational lesson did not open: %',sess;end if;
 if sess#>>'{skill_policy,mode}'<>'measurement_needed'
 then raise exception 'student B low-confidence measurement path not explicit';end if;
 for task in select value from jsonb_array_elements(sess->'tasks') loop
  if length(coalesce(task->>'instruction_ar',''))<20 or length(coalesce(task->>'instruction_en',''))<20
  then raise exception 'server did not provide bilingual differentiated learning instruction: %',task;end if;
 end loop;
end $student_b$;
reset role;
