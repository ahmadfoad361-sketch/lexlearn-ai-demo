// Safety assertion: research pilot augments only the entitled learner's existing sessions.
const fs=require("node:fs"),assert=require("node:assert/strict");
const page=fs.readFileSync("student-path.html","utf8");
const existing=fs.readFileSync("assets/student-path.js","utf8");
const entry=fs.readFileSync("assets/student-research-entry.js","utf8");
const player=fs.readFileSync("assets/student-research-pilot.js","utf8");
const admin=fs.readFileSync("admin-research.html","utf8");
const build=fs.readFileSync("scripts/build-public.js","utf8");
assert.match(page,/id="studentTrainingApp"/);
assert.match(page,/id="researchPilotWorkspace" hidden/);
assert.match(page,/id="researchPilotApp"/);
assert.match(page,/assets\/student-research-pilot\.js/);
assert.match(page,/assets\/student-research-entry\.js/);
assert.match(existing,/trainingSubmit/);assert.match(existing,/trainingOverview/);
assert.match(entry,/r\.data\.eligible!==true\|\|r\.data\.non_credit!==true/);
assert.match(entry,/function showOriginal/);assert.match(entry,/function showResearch/);
assert.match(entry,/original\.hidden=true;workspace\.hidden=false/);
assert.match(entry,/if\(r\.error\|\|!r\.data/);
assert.match(player,/LEX_RESEARCH_PILOT=\{mount:boot\}/);
assert.match(player,/researchPilotWorkspace/);
assert.match(player,/action:"consent"/);
assert(!/\.from\("(student_training_answers|student_diagnostic_runs|learning_plans|student_training_sessions)"\)/.test(player));
assert.match(admin,/id="saraPause"/);
for(const name of ["student-research-pilot.html","student-research-pilot.js","student-research-entry.js","admin-research-pilot.js"])
 assert(build.includes(name), "Missing safe public allowlist entry for "+name);
console.log("PASS single-student only pilot entry, opt-in, untouched official session path, safe public asset allowlist");
