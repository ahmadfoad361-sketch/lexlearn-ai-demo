const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const js=["assets/instructor-login.js","assets/instructor-dashboard.js","assets/admin-instructors.js","assets/admin-progress.js"];
for(const file of js){
 const source=fs.readFileSync(file,"utf8");
 new vm.Script(source,{filename:file});
 assert.ok(source.includes("LEX_CLOUD")||source.includes("db.rpc")||source.includes("C.rpc"));
}
const migration=fs.readFileSync("supabase/migrations/20261025_001_instructor_scoped_progress.sql","utf8");
const edge=fs.readFileSync("supabase/functions/admin-manage-instructors/index.ts","utf8");
const admin=fs.readFileSync("assets/admin-cloud.js","utf8");
const shared=fs.readFileSync("supabase/functions/_shared/auth.ts","utf8");
const pages=fs.readFileSync("scripts/build-public.js","utf8");
assert.match(migration,/create table if not exists public.instructor_assignments/);
assert.match(migration,/private\.instructor_can_view\(p_student,p_course\)/);
assert.match(migration,/student\.country_code=a\.country_code/);
for(const field of ["university","faculty","year_label","course_id"])
 assert.ok(migration.includes(field),"missing assignment gate "+field);
assert.match(migration,/drop policy if exists "diagnostic instructor cohort read"/);
assert.match(migration,/create policy "profiles platform admin update"/);
assert.match(migration,/revoke all on function public\.lex_staff_skill_progress/);
assert.match(migration,/status','provisional_training_coverage'/);
assert.match(migration,/ta\.session_number<= \(done_count\/5\)\*5/);
assert.match(edge,/if\(!\["owner","admin"\]\.includes\(profile\.role\)\)/);
assert.match(edge,/temporary_password:temp/);
assert.match(edge,/user_metadata:\{display_name:name,must_change_password:true\}/);
assert.match(shared,/!\["owner","admin"\]\.includes\(profile\.role\)/);
assert.doesNotMatch(admin,/\["owner","admin","instructor"\]\.indexOf\(me\.role\)/);
assert.match(admin,/admin-instructors\.html/);
assert.match(admin,/admin-progress\.html/);
for(const p of ["instructor.html","instructor-login.html","admin-instructors.html","admin-progress.html"])assert.ok(pages.includes(p),"publish "+p);
assert.match(fs.readFileSync("assets/instructor-dashboard.js","utf8"),/state\.roster\.assignments/);
assert.match(fs.readFileSync("assets/instructor-dashboard.js","utf8"),/students\.length<5/);
console.log("PASS: instructor scoped-account UI, no admin account escalation, five-session longitudinal series and restricted release files");
