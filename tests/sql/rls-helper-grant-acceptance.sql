do $test$
declare source_text text;
begin
 if not has_function_privilege('authenticated','private.can_access_student(uuid)','EXECUTE') then
  raise exception 'Student and owner profile reads need authenticated EXECUTE';
 end if;
 if has_function_privilege('anon','private.can_access_student(uuid)','EXECUTE') then
  raise exception 'Anonymous users should not execute student access helper';
 end if;
 select pg_get_functiondef('private.can_access_student(uuid)'::regprocedure) into source_text;
 if position('owner' in source_text)=0 or position('admin' in source_text)=0
  or position('auth.uid()' in source_text)=0 then
  raise exception 'Scoped helper must still check authenticated caller and admin role';
 end if;
 if not exists(select 1 from pg_policies where schemaname='public'
  and tablename='profiles' and policyname='profiles self or scoped staff read'
  and qual like '%id = auth.uid()%' and qual like '%private.can_access_student(id)%') then
  raise exception 'Self-only and admin RLS policy must remain intact';
 end if;
end
$test$;
