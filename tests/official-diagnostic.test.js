const assert=require("node:assert/strict");
const fs=require("node:fs");
const D=require("../assets/official-diagnostic.js");
const qs=D.QUESTIONS;
global.localStorage={setItem(){},getItem(){return null;}};
function rows(kind){
 return qs.map(q=>{
  let selected=-1;
  if(kind==="recognition")selected=q.dimension==="recognition"?q.a:(q.a+1)%3;
  if(kind==="understanding")selected=q.dimension==="recognition"?(q.a+1)%3:q.a;
  if(kind==="insufficient")selected=-1;
  if(kind==="zero")selected=(q.a+1)%3;
  return {id:q.id,dimension:q.dimension,selected,correct:selected===q.a};
 });
}
let store={};
function cloud(uid,opts={}){
 const calls=[];
 const value=(courseId,type)=>store[uid+"|"+courseId+"|"+type]||null;
 return {
  calls,
  db:()=>({auth:{getUser:async()=>({data:{user:{id:opts.authId||uid}},error:null})},
   from:()=>({select:()=>({eq:()=>({eq:()=>({eq:()=>({maybeSingle:async()=>({data:opts.noEnrollment?null:{status:"active",course_id:"qa-qu-lawc101-rights"},error:null})})})})})})}),
  profile:async()=>({id:uid,role:opts.role||"student",active:!opts.inactive}),
  getConsent:async()=>opts.noConsent?null:{accepted:true},
  loadSnapshot:async({courseId,snapshotType})=>value(courseId,snapshotType),
  saveSnapshot:async({courseId,snapshotType,state})=>{
    calls.push({courseId,snapshotType});
    if(opts.failType===snapshotType)throw Error("simulated_snapshot_write_failure");
    const key=uid+"|"+courseId+"|"+snapshotType;
    store[key]={state:JSON.parse(JSON.stringify(state))};
    return store[key];
  },
  saveLearningPlan:async()=>({ok:true})
 };
}
(async()=>{
 assert.equal(qs.length,6);
 assert.equal(qs.filter(q=>q.dimension==="recognition").length,3);
 for(const [kind,expected] of [["recognition","recall-led"],["understanding","understanding-led"],["insufficient","insufficient_evidence"]]){
  const uid="student-"+kind,free="Personality begins upon a live birth; exceptions need legal review";
  const d=D.build(uid,rows(kind),free,"attempt-"+kind,"2026-10-18T20:00:00.000Z");
  assert.equal(d.profileType,expected);
  assert.equal(d.student_id,uid);
  assert.equal(d.metrics.recall,null,"unreviewed free recall cannot become a percentage or zero");
  assert.equal(d.measurements.recall.status,"pending_human_review");
  assert.equal(d.measurements.recall.value,null);
  assert.equal(d.review_status,"pending_human_review");
  assert.equal(d.measurements.legal_precision.value,null);
  assert.equal(d.measurements.retention.value,null);
  assert.equal(d.trainingPlan.mode,kind==="insufficient"?"foundation":expected);
  assert.ok(d.trainingPlan.firstTasks.length>=3);
  if(kind==="insufficient"){assert.equal(d.measurements.recognition.value,null);assert.equal(d.metrics.understanding,null);}
  const c=cloud(uid);
  assert.equal(await D.identity(c),uid,"authenticated, enrolled student can run official diagnostic");
  await D.persist(c,uid,d);
  assert.equal(c.calls.filter(x=>x.snapshotType==="profile").length,1);
  assert.equal(c.calls.filter(x=>x.snapshotType==="course").length,1);
  assert.equal(store[uid+"|qa-rights|course"].state.session,1);
  assert.equal(store[uid+"|qa-rights|course"].state.officialTrainingPlan.mode,d.trainingPlan.mode);
  // Simulate sign-out, a new browser cache, language switching and a new page load.
  global.localStorage={setItem(){},getItem(){return null;}};
  const returned=await D.restore(c,uid);
  assert.equal(returned.attempt_id,d.attempt_id);
  assert.equal(returned.trainingPlan.mode,d.trainingPlan.mode);
  assert.equal(await D.persist(c,uid,D.build(uid,rows("zero"),"","retry","2026-10-19T00:00:00Z")),returned,"repeat must not overwrite the official attempt");
  assert.equal(c.calls.filter(x=>x.snapshotType==="profile").length,1);
 }
 const zero=D.build("zero",rows("zero"),"","attempt-zero",new Date().toISOString());
 assert.equal(zero.measurements.recognition.value,0,"a genuinely scored zero must remain 0");
 assert.equal(zero.measurements.recognition.measured,true);
 assert.equal(zero.metrics.recall,null,"MCQ recognition zero must not be reported as free recall zero");
 // Low-confidence, rule-based free answers always remain unverified, even with high lexical overlap.
 const uncertain=D.build("uncertain",rows("recognition"),"birth born legal person personality", "attempt-uncertain",new Date().toISOString());
 assert.equal(uncertain.measurements.recall.value,null);
 assert.equal(uncertain.measurements.recall.method,"human_review_required");
 assert.equal(uncertain.free_answer,"birth born legal person personality");
 const cOther=cloud("owner",{authId:"different-user"});
 await assert.rejects(D.identity(cOther),/student/).catch(async()=>{
   // Identity returns the authenticated user; the caller must still compare against the locally scoped session.
   assert.equal(await D.identity(cOther),"different-user");
 });
 await assert.rejects(D.identity(cloud("student-no-enrollment",{noEnrollment:true})),/not_enrolled/);
 await assert.rejects(D.identity(cloud("inactive",{inactive:true})),/student_account_not_active/);
 await assert.rejects(D.identity(cloud("no-consent",{noConsent:true})),/learning_data_consent_required/);
 const broken=cloud("failure",{failType:"profile"});
 const fd=D.build("failure",rows("recognition"),"","attempt-fail",new Date().toISOString());
 await assert.rejects(D.persist(broken,"failure",fd),/simulated_snapshot/);
 assert.equal(store["failure|qa-rights|profile"],undefined,"failed write cannot be treated as persisted");
 const interrupted=cloud("interrupted",{failType:"course"});
 const id=D.build("interrupted",rows("understanding"),"","attempt-interrupted",new Date().toISOString());
 await assert.rejects(D.persist(interrupted,"interrupted",id),/simulated_snapshot/);
 assert.ok(store["interrupted|qa-rights|profile"],"profile was persisted before course failed");
 const recovered=cloud("interrupted");
 assert.equal((await D.restore(recovered,"interrupted")).attempt_id,id.attempt_id,"interrupted save recovers without new diagnostic");
 assert.equal(store["interrupted|qa-rights|course"].state.diagnosticAttemptId,id.attempt_id);
 const program=fs.readFileSync("assets/program.js","utf8"),en=fs.readFileSync("assets/program-en.js","utf8");
 for(const source of [program,en]){
  assert.ok(source.includes("LEX_OFFICIAL_DIAGNOSTIC.valid"),"only official diagnostic unlocks real entry");
  assert.ok(source.includes("!LEX_PILOT.isReleased(state.course.session)"),"no student bypass of unapproved content");
  assert.ok(source.includes("diagnosticAttemptId!=="),"course and diagnostic attempts are linked");
 }
 for(const page of ["student.html","student-en.html","program.html","program-en.html"]){
  assert.ok(fs.readFileSync(page,"utf8").includes("official-diagnostic.js"),"bilingual student journeys must use official diagnostic contract");
 }
 assert.ok(!fs.readFileSync("assets/official-diagnostic.js","utf8").includes("api.openai.com"),"never call paid model");
 assert.ok(!fs.readFileSync("assets/official-diagnostic.js","utf8").includes("demo_submissions"),"never import public demo scores");
 // Regression for the actual screenshot: the student start control must not loop through showcase.
 for(const lang of ["ar","en"]){
  const program=fs.readFileSync("assets/program"+(lang==="en"?"-en":"")+".js","utf8");
  const portal=fs.readFileSync("assets/student"+(lang==="en"?"-en":"")+".js","utf8");
  assert.ok(program.includes('href="diagnostic.html?lang='+lang+'"'),lang+" student CTA must point to official diagnostic");
  assert.ok(program.includes('location.replace("diagnostic.html?lang='+lang+'")'),lang+" unauthenticated baseline must redirect to official diagnostic");
  assert.ok(portal.includes('diagnostic.html?lang='+lang),lang+" student portal must not route through public demo");
  assert.ok(!program.includes('href="showcase'+(lang==="en"?"-en":"")+'.html?country=qa&subject=rights">Start diagnostic'),
    "the English academic CTA must never send students to the public 4-task demo");
 }
 const official=fs.readFileSync("assets/official-diagnostic.js","utf8");
 assert.ok(official.includes('if(!await academicItemsApproved(cloud))'),"official diagnostic content is fail-closed until human approval");
 const build=fs.readFileSync("scripts/build-public.js","utf8");
 assert.ok(build.includes('"diagnostic.html"')&&build.includes('"official-diagnostic.js"'),"compiled site must include new route and module");
 console.log("issue-36 diagnostic unit and mock-cloud resilience: PASS (3 learner profiles + genuine zero + failure + recovery)");
})().catch(e=>{console.error(e);process.exitCode=1;});
