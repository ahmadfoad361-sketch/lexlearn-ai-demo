-- Emergency repair for learner/supervisor login after professor-access hardening.
-- Existing profiles/enrollments SELECT RLS invokes this private helper for every
-- authenticated user, even when the current row is their own.
-- Removing EXECUTE from authenticated caused permission denied and blank dashboards.
-- This grants invocation of a boolean helper only; RLS and scope still decide visibility.
revoke all on function private.can_access_student(uuid) from public, anon;
grant execute on function private.can_access_student(uuid) to authenticated;

do $verify_rls_helper$
begin
 if not has_function_privilege('authenticated','private.can_access_student(uuid)','EXECUTE')
 or has_function_privilege('anon','private.can_access_student(uuid)','EXECUTE') then
  raise exception 'Private RLS helper execution privileges are not scoped correctly';
 end if;
end
$verify_rls_helper$;
