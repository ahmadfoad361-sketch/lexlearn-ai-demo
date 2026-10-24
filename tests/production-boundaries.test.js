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
for(const needle of ["enrollments","grading_rate_limit","item_not_approved","approved_sources_missing","needs_human_review","no_paid_semantic_model"]){
  assert.ok(grader.includes(needle),"grader safety missing "+needle);
}
assert.ok(!grader.includes('api.openai.com')&&!grader.includes('OPENAI_API_KEY'),"general grader must never issue paid model requests");
const pilotGrade=read("supabase/functions/pilot-grade/index.ts");
const showcaseGrade=read("supabase/functions/showcase-grade/handler.mjs");
for(const [path,source] of [["pilot-grade",pilotGrade],["showcase-grade",showcaseGrade]]){
 assert.ok(!source.includes("api.openai.com")&&!source.includes("OPENAI_API_KEY"),path+" must avoid paid inference");
}
assert.ok(pilotGrade.includes("PILOT_RELEASE_TOPICS")&&pilotGrade.includes('x.status!=="approved"'),"pilot server must enforce release and approved learning content");
assert.ok(read("assets/pilot-learning.js").includes("release={1:false,22:false}"),"unapproved pilot content must be locked on the frontend");

const manage=read("supabase/functions/admin-manage-student/index.ts");
assert.ok(manage.includes("temporaryPassword"),"password reset must generate credentials server-side");
assert.ok(manage.includes("admin_audit"),"admin actions must be audited");

const privacy=read("privacy.html"),terms=read("terms.html");
assert.ok(/2026-10-23-v6/.test(privacy)&&terms.includes("2026-10-23-v6")&&terms.includes("شروط الاستخدام"),"current single-acceptance legal notices and terms must be published");


for(const page of ["program.html","program-en.html","pilot-review.html","pilot-qa.html","admin.html"]){
 assert.ok(read(page).includes("pilot-learning.js?v=20261018.1"),"pilot gate cache bust missing in "+page);
}
for(const page of ["showcase.html","showcase-en.html"]){
 assert.ok(read(page).includes("showcase"+(page.includes("-en")?"-en":"")+".js?v=20261018.7"),"demo disclosure cache bust missing in "+page);
}
assert.ok(read("assets/program.js").includes("var unverified="),"local rubric needs an explicit unverified status");
assert.ok(read("assets/program.js").includes("لا تعتمد هذه النتيجة كدرجة أكاديمية"),"no pseudo academic grade for unverified free text");
assert.ok(read("program.html").includes("program.js?v=20261024.ai-consistency-1"),"refresh browser cache for first-session preview");
assert.ok(read("program-en.html").includes("program-en.js?v=20261024.ai-consistency-1"),"refresh English stage-one entry");
for(const p of ["showcase.html","showcase-en.html"])
 assert.ok(read(p).includes("showcase-learning-cycle.js?v=20261018.3"),"refresh completed-cycle navigation for "+p);
for(const source of [read("assets/program.js"),read("assets/program-en.js")]){
 assert.ok(source.includes('FIRST_STAGE_PREVIEW=DEMO&&AUTO_START'),"stage-one handoff must be restricted to public demo");
 assert.ok(source.includes('state.course=defaultCourse()'),"stage-one public preview must not continue stale local course progress");
 assert.ok(source.includes('state.view="stagePreviewComplete"'),"preview must not unlock later academic sessions");
}
console.log("production-boundaries tests: PASS");

