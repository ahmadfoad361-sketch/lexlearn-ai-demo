create or replace function private.force_new_profile_student()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  new.role := 'student';
  return new;
end $$;

drop trigger if exists trg_force_new_profile_student on public.profiles;
create trigger trg_force_new_profile_student
before insert on public.profiles
for each row execute function private.force_new_profile_student();

revoke all on function private.force_new_profile_student() from public, anon, authenticated;
