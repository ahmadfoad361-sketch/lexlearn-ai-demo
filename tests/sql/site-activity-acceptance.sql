begin;
do $$begin
 if has_function_privilege('anon','public.lex_site_activity_report(integer,integer)','EXECUTE') or
 has_function_privilege('authenticated','public.lex_record_site_activity(uuid,uuid,uuid,uuid,text,text)','EXECUTE') or
 has_table_privilege('authenticated','private.site_activity','SELECT') then raise exception 'activity permission leak';end if;
end $$;
set local role service_role;
select public.lex_record_site_activity('a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','index.html',repeat('a',64));
-- Network retry of the same page event must not inflate totals.
select public.lex_record_site_activity('a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','index.html',repeat('a',64));
select public.lex_record_site_activity('a0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','student.html',repeat('a',64));
select public.lex_record_site_activity('a0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000003',null,'index.html',repeat('a',64));
do $$declare r jsonb;begin
 r:=public.lex_site_activity_report(7,0);
 if (r->>'views')::int<>3 or (r->>'visitors')::int<>2 or (r->>'visits')::int<>3 or (r->>'returning_visitors')::int<>1 or (r->>'active_accounts')::int<>1 then raise exception 'wrong statistics: %',r;end if;
 if (select (x->>'visits')::int from jsonb_array_elements(r->'accounts') x where x->>'id'='10000000-0000-4000-8000-000000000001')<>2 then raise exception 'account frequency incorrect';end if;
 if jsonb_array_length(public.lex_site_activity_report(7,100)->'accounts')<>0 then raise exception 'pagination broken';end if;
 begin perform public.lex_site_activity_report(365,0);raise exception 'invalid period accepted';exception when raise_exception then if sqlerrm<>'invalid_period' then raise;end if;end;
end $$;
-- Reject oversized browser bursts, keep rate limits bounded and time-scoped.
do $$declare ok boolean;begin
 for i in 1..30 loop select public.lex_record_site_activity(gen_random_uuid(),'b0000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000003',null,'index.html',repeat('b',64)) into ok;end loop;
 if public.lex_record_site_activity(gen_random_uuid(),'b0000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000003',null,'index.html',repeat('b',64)) then raise exception 'rate limit bypass';end if;
end $$;
rollback;
\echo 'PASS activity deduplication, returning visitors, account frequency, permissions, limits and pagination'
