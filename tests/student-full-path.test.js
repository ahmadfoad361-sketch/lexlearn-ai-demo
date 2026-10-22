const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const source=fs.readFileSync("assets/student-path.js","utf8");
const ctx={document:{getElementById:()=>null},URLSearchParams,location:{search:"?lang=ar"},window:null};
ctx.window=ctx;vm.runInNewContext(source,ctx);
assert.equal(ctx.LEX_STUDENT_PATH.noHtmlScore(0),"0%");
assert.equal(ctx.LEX_STUDENT_PATH.noHtmlScore(65.5),"66%");
assert.equal(ctx.LEX_STUDENT_PATH.noHtmlScore(null),"غير قابل للتقدير");
assert.equal(ctx.LEX_STUDENT_PATH.noHtmlScore(101),"100%");
assert.equal(ctx.LEX_STUDENT_PATH.previousAnswerTitle(
  {item_id:"rights-v1-s1-understanding",dimension:"understanding"},
  {dimension:"understanding",title_ar:"بداية الشخصية",title_en:"Beginning of legal personality"}),
  "إجابتك السابقة — الفهم · بداية الشخصية");
const fakeTitle=ctx.LEX_STUDENT_PATH.previousAnswerTitle(
  {item_id:"rights-v1-s1-understanding",dimension:"understanding"},null);
assert.ok(!fakeTitle.includes("rights-v1"),"missing exercise title must not leak internal question identifier");
const nav=fs.readFileSync("assets/lexlearn-navigation.js","utf8");
assert.ok(nav.includes("isStudentPath")&&nav.includes("main > header"),"student back button must be inline, not float over lessons");
for(const required of ["trainingOverview","trainingOpen","trainingSubmit","answer_readback_failed"]){
 if(required==="student_id")continue;
 assert.ok(source.includes(required),required);
}
const cloud=fs.readFileSync("assets/cloud-data.js","utf8");
for(const fn of ["lex_training_overview","lex_training_session_open","lex_training_submit"]){
 assert.ok(cloud.includes(fn),"missing mapped server call "+fn);
}
assert.ok(!source.includes("localStorage.setItem"),"browser scores must never authorize progress");
assert.ok(!source.includes("demo_submissions"),"demo must not affect student");
const migration=fs.readFileSync("supabase/migrations/20261019_005_full_adaptive_internal_pilot.sql","utf8");
assert.ok(migration.includes("public.lex_training_rubric_coverage"));
assert.ok(migration.includes("academic_certified',false"));
assert.ok(migration.includes("founder_pilot_approved"));
assert.ok(migration.includes("tasks_json"),"task selection needs to be frozen per session");
assert.ok(migration.includes("p_session%5=0"),"six review checkpoints missing");
const build=fs.readFileSync("scripts/build-public.js","utf8");
assert.ok(build.includes('"student-path.html"')&&build.includes('"student-path.js"'));
const policy=require("../assets/skill-policy.js");
ctx.LEX_SKILL_POLICY=policy;
const simulated=[
 {dimension:"recall",evaluation:{status:"preliminary_internal",provisional_percent:91}},
 {dimension:"understanding",evaluation:{status:"preliminary_internal",provisional_percent:45}}
];
const early=ctx.LEX_STUDENT_PATH.provisionalSkillPlan(simulated);
assert.equal(early.mode,"balanced","one indicator each cannot force a learner classification");
assert.equal(early.mastery,false);
const preview=ctx.LEX_STUDENT_PATH.adaptiveGuidance({skill_policy:early},simulated,{dimension:"recall"});
assert.ok(preview.includes("طريقة التدريب المقترحة"));
assert.ok(preview.includes("تصنيفًا ثابتًا"));

console.log("Full-session client boundaries and provisional grades: PASS");
require("./student-progress-ui.test.js");
