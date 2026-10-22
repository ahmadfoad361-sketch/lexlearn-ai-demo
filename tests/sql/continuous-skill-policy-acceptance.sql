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
