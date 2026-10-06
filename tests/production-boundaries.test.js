const fs=require("fs");
const assert=require("assert");

function read(p){return fs.readFileSync(p,"utf8");}
function count(s,needle){return s.split(needle).length-1;}

const activeJs=[
  "assets/adaptive-engine.js","assets/v9-law-content.js","assets/v9-law.js",
  "assets/showcase.js","assets/program.js","assets/cloud-data.js",
  "assets/student-login.js","assets/admin-login-v2.js","assets/student.js",
  "assets/admin-entry.js","assets/admin-cloud.js"
];
for(const p of activeJs)assert.ok(fs.existsSync(p),p+" must exist");

const cfg=read("assets/lexlearn-config.js");
assert.ok(!/service[_-]?role/i.test(cfg),"service-role secrets must never be in frontend config");
assert.ok(!/OPENAI_API_KEY/.test(cfg),"OpenAI secret must never be in frontend config");

for(const p of ["index.html","showcase.html","program.html","student-login.html","admin-login.html","student.html","admin.html"]){
  const s=read(p);
  assert.ok(count(s,"@supabase/supabase-js@2")<=1,p+" must load Supabase client at most once");
  assert.ok(!s.includes("assets/cloud-config.js"),p+" must not load obsolete cloud config");
  assert.ok(!s.includes("assets/cloud.js"),p+" must not load obsolete cloud client");
}
assert.ok(read("admin.html").includes("assets/admin-entry.js"),"admin must use production-aware entry");
assert.ok(read("admin-login.html").includes("assets/admin-login-v2.js"),"admin login must use safe central client");

const program=read("assets/program.js");
for(const needle of ["COURSE_DB_ID","qatarAssessmentBanks","assessmentBankForWeek","recordAssessmentEvidence","taskItemId","recomputeAdaptiveModel","legal_precision"]){
  assert.ok(program.includes(needle),"program missing "+needle);
}
assert.ok(program.includes("LEX_CLOUD.gradeAnswer"),"free-response grading must support grounded semantic endpoint");
assert.ok(program.includes("state.course.evidence.push"),"training must write item-level evidence");

const migration1=read("supabase/migrations/20261006_001_production_core.sql");
const migration2=read("supabase/migrations/20261006_002_hardening_and_qatar_curriculum.sql");
for(const needle of ["enable row level security","learner_snapshots","attempts","learning_plans","consent_records","admin_audit"]){
  assert.ok(migration1.toLowerCase().includes(needle.toLowerCase()),"core migration missing "+needle);
}
assert.ok(migration2.includes("is_active_user"),"hardening migration must block deactivated-session writes");
assert.ok(migration2.includes("curriculum_mappings"),"Qatar curriculum evidence table required");
assert.ok(migration2.includes("'legal_review'"),"seeded legal questions must not auto-approve themselves");

const grader=read("supabase/functions/grade-answer/index.ts");
for(const needle of ["enrollments","grading_rate_limit","item_not_approved","approved_sources_missing","needs_human_review","OPENAI_MODEL"]){
  assert.ok(grader.includes(needle),"grader safety missing "+needle);
}
assert.ok(!grader.includes('||"gpt-'),"grader must not silently choose an unverified model");

const manage=read("supabase/functions/admin-manage-student/index.ts");
assert.ok(manage.includes("temporaryPassword"),"password reset must generate credentials server-side");
assert.ok(manage.includes("admin_audit"),"admin actions must be audited");

const privacy=read("privacy.html"),terms=read("terms.html");
assert.ok(privacy.includes("2026-10-06-v1")&&terms.includes("2026-10-06-v1"),"legal notices must be versioned");

console.log("production-boundaries tests: PASS");
