const assert=require("node:assert/strict"),fs=require("node:fs"),s=require("../assets/student-practice.js");
const Q=require("../assets/official-diagnostic.js").QUESTIONS;
function arr(kind){return Q.map(q=>({id:q.id,dimension:q.dimension,selected:kind==="missing"?-1:kind==="recall-led"?(q.dimension==="recognition"?q.a:(q.a+1)%3):kind==="understanding-led"?(q.dimension==="recognition"?(q.a+1)%3:q.a):q.a,correct:kind==="missing"?false:kind==="recall-led"?q.dimension==="recognition":kind==="understanding-led"?q.dimension!=="recognition":true}));}
assert.equal(s.plans(arr("recall-led")).mode,"recall-led");
assert.equal(s.plans(arr("understanding-led")).mode,"understanding-led");
assert.equal(s.plans(arr("all")).mode,"balanced");
assert.equal(s.plans(arr("missing")).recognition,null);
assert.equal(s.plans(arr("missing")).mode,"foundation");
for(const mode of ["recall-led","understanding-led","all","missing"]){const p=s.plans(arr(mode));assert.equal(new Set(p.order).size,3);}
assert.equal(s.hint(""),null);
assert.equal(typeof s.hint("تبدأ الشخصية القانونية عند الولادة حيا").covered,"number");
const src=fs.readFileSync("assets/student-practice.js","utf8");
for(const forbidden of ["saveSnapshot(","lex_diagnostic_complete","saveLearningPlan(","student_level_releases","student_level_completions"]){assert.ok(!src.includes(forbidden),"non-credit preview must not mutate official "+forbidden);}
const page=fs.readFileSync("student-practice.html","utf8");assert.ok(page.includes("assets/student-practice.js"));
const server=fs.readFileSync("assets/server-diagnostic.js","utf8");assert.ok(!server.includes("question_not_approved"),"raw server approval codes must not be rendered to students");
assert.ok(!server.includes("اعتمادًا قانونيًا وأكاديميًا مستقلًا"),"founder pilot must not imply unavailable university clearance");
console.log("Non-credit authenticated practice: PASS");