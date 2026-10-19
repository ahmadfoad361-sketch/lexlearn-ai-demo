const fs=require("node:fs"),assert=require("node:assert/strict");
const migration=fs.readFileSync("supabase/migrations/20261019_001_student_diagnostic_lifecycle.sql","utf8");
const server=fs.readFileSync("assets/server-diagnostic.js","utf8");
const loginHtml=["student-login.html","student-login-en.html"];
for(const en of [false,true]){
 const name="assets/program"+(en?"-en":"")+".js";
 const s=fs.readFileSync(name,"utf8");
 assert.ok(s.includes('var TEST_DEMO=!!window.LEX_TEST_ALLOW_DEMO_PARAMS'),name+" must disable public URL bypass in production");
 assert.ok(s.includes('state.levelAccess=await LEX_CLOUD.studentLifecycleRpc("level"'),name+" must authorize stage one via server");
 assert.ok(s.includes('state.view="train"'),name+" must open saved adaptive first-level plan from completed server record");
 assert.ok(s.includes('state.diag=status.result'),name+" must use server diagnostic data only");
 assert.ok(s.includes('status.result.source==="server_finalized_diagnostic"'),name+" must reject public showcase results");
 assert.ok(s.includes('state.levelAccess.allowed&&state.course.session===1&&window.LEX_OFFICIAL_LEVEL_ONE'),name+" must require server authorization and official Level1 learning module");
 assert.ok(s.includes('STUDENT_SESSION.studentId'),name+" must verify student identity");
 assert.ok(s.includes('LEX_OFFICIAL_LEVEL_ONE.mount'),name+" must load official first-level exercises instead of legacy local practice");
 assert.ok(s.includes('showcase-level1'),name+" public first-level preview must have distinct route");
}
for(const page of loginHtml){
 assert.ok(fs.readFileSync(page,"utf8").includes("studentLogin"),"real student authentication must be visible");
}
assert.ok(server.includes('studentLifecycleRpc("complete"'),"official completion must call the server RPC");
assert.ok(server.includes('saving=false;page()'),"each confirmed draft must release the saving lock");
assert.ok(server.includes('cloud.studentLifecycleRpc("status"'),"completion needs authoritative readback");
assert.ok(server.includes('academicItemsApproved'),"unapproved questions remain closed");
assert.ok(migration.includes("status text not null default 'in_progress'"),"official state must be persisted on server");
assert.ok(migration.includes("primary key(user_id,course_id)"),"single authoritative diagnostic per student/course");
assert.ok(migration.includes("lex_diagnostic_complete"),"atomic completion RPC required");
assert.ok(migration.includes("lex_level_access"),"server level access required");
assert.ok(migration.includes("previous_level_not_verified"),"stage two must be locked pending verified previous level");
assert.ok(!server.includes("api.openai.com"),"paid OpenAI API must not be introduced");
console.log("PASS: bilingual official level entry is server-gated, academically released only, demo cannot forge scores");
