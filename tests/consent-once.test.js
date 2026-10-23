const assert=require("node:assert/strict");
const fs=require("node:fs");
const signup=fs.readFileSync("supabase/functions/student-register-whatsapp/index.ts","utf8");
const cloud=fs.readFileSync("assets/cloud-data.js","utf8");
const student=fs.readFileSync("assets/student.js","utf8");
const diagnostic=fs.readFileSync("assets/server-diagnostic.js","utf8");
assert.match(signup,/accepted_privacy!==true/);
assert.match(signup,/from\("consent_records"\)\.insert/);
assert.match(signup,/consent_type:"learning_data"/);
assert.match(signup,/notice_version:"2026-10-06-v1"/);
assert.match(student,/CONSENT_VERSION="2026-10-06-v1"/);
assert.match(cloud,/getConsent\(noticeVersion,consentType\)/);
assert.match(diagnostic,/getConsent\("lexlearn-ai-grading-v1","external_ai_grading"\)/);
assert.match(diagnostic,/var acceptedAi=false;/,"initial diagnostic reads saved AI permission");
assert.match(diagnostic,/&&acceptedAi;/);
assert.doesNotMatch(diagnostic,/id=\'aiConsent\'/);
assert.match(signup,/body.accepted_terms_version!=="2026-10-23-v6"/);
for(const page of ["student-register.html","student-register-en.html"]){const html=fs.readFileSync(page,"utf8");assert.doesNotMatch(html,/id="externalAiConsent"/);assert.equal((html.match(/type="checkbox"/g)||[]).length,1);assert.match(html,/OpenAI/);}
assert.doesNotMatch(fs.readFileSync("assets/student-path.js","utf8"),/enableTrainingAi/);
assert.match(signup,/consent_type:"external_ai_grading"/);
console.log("One disclosed registration acceptance covers learning and AI; training never asks again PASS");

