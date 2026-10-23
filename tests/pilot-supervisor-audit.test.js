const fs=require('node:fs'),assert=require('node:assert/strict');
const admin=fs.readFileSync('assets/admin-cloud.js','utf8');
const grader=fs.readFileSync('supabase/functions/pilot-grade/index.ts','utf8');
const pilot=fs.readFileSync('assets/pilot-learning.js','utf8');
assert.ok(admin.includes('LEX_CLOUD.listContentItems("qa-qu-lawc101-rights")'),'Supervisor must fetch the actual six Qatar pilot questions');
assert.ok(admin.includes('LEX_CLOUD.listContentItems("qa-qu-lawc213")'),'Legacy content remains visible');
assert.match(admin,/rights-v1-s\(\?:1\|22\)/,'Only s1/s22 pilot approval should be included');
assert.ok(admin.includes('id="pilotLiveCheck"'),'Supervisor needs manual live model testing');
assert.ok(admin.includes('preview:true'),'Live evaluation must not save synthetic student attempts');
assert.ok(admin.includes('expected:false')&&admin.includes('expected:true'),'Include both incorrect and correct answers');
assert.ok(admin.includes('pilotSourceLinks(g.source_ids)'),'Grade cites the article source');
assert.ok(admin.includes('pilotSourceLinks(x.source_ids)'),'Content view cites the article source');
assert.ok(pilot.includes('release={1:false,22:false}'),'No unreviewed pilot topic may open to students');
assert.ok(grader.includes('review_required'),'If scoring fails the supervisor must decide');
assert.ok(grader.includes('score:null,passed:null'),'Unverified output must not be counted as success');
assert.ok(!grader.includes('api.openai.com'),'No paid model usage in academic pilot');
assert.ok(grader.includes('x.status!=="approved"'),'Only fully approved educational content may be used');
const cloud=fs.readFileSync('assets/cloud-data.js','utf8');
for(const field of ['faculty','academic_section','student_registration_number','institutional_group_email']){
 assert.ok(cloud.includes(field),'Staff view must load '+field+' from scoped learner profiles');
}
assert.ok(admin.includes('رقم القيد الجامعي'),'Supervisor must show student enrollment number only in the protected dashboard');
assert.ok(admin.includes('بريد المجموعة'),'Supervisor must show optional cohort contact');
assert.ok(admin.includes('student_registration_number_optional'),'CSV export must include optional research identifier');
console.log('Pilot supervisor and grading audit guards: PASS (static, not a live AI accuracy measurement)');
