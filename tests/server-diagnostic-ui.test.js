const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const source=fs.readFileSync("assets/server-diagnostic.js","utf8");
const QUESTIONS=require("../assets/official-diagnostic.js").QUESTIONS;
function make(uid,lang,data,opts={}){
 const nodes={},redirects=[];let chosen=null,requestCount=0;
 const main={html:"",querySelector:q=>q==="input[name=selected]:checked"&&chosen!==null?{value:String(chosen)}:null};
 Object.defineProperty(main,"innerHTML",{get(){return this.html},set(v){
  this.html=v;for(const k of Object.keys(nodes))delete nodes[k];
  for(const m of v.matchAll(/id='([^']+)'/g))nodes[m[1]]={value:"",textContent:"",disabled:false,onclick:null,style:{}};
 }});
 const header={appendChild(){this.length=(this.length||0)+1;},length:0};
 const document={getElementById:id=>id==="officialDiagnostic"?main:nodes[id],querySelector:s=>s==="header"?header:null,
  createElement:()=>({textContent:"",onclick:null,setAttribute(){},type:"button"})};
 const calls=[],cloud={
  profile:async()=>({display_name:"QA Learner "+uid,username:uid}),
  signOut:async()=>({}),
  studentLifecycleRpc:async(action,props)=>{
   calls.push(action);requestCount++;
   if(opts.failDraft&&action==="draft")throw new Error("network_lost");
   const st=data[uid]||{status:"not_started",draft:[]};
   if(action==="status")return st;
   if(action==="begin"){if(opts.unapproved)throw new Error("diagnostic_academic_approval_pending");data[uid]={status:"in_progress",draft:[],attempt_id:uid+"-attempt"};return data[uid];}
   if(action==="draft"){if(st.status!=="in_progress")throw Error("invalid_phase");st.draft=props.answers;return st;}
   if(action==="reviewDiagnostic"){
    assert.equal(st.status,"completed","only completed official diagnostic may be reviewed");
    st.result.measurements={recall:{internal_grade:{status:"preliminary_internal",provisional_percent:75,method:"internal_qatar_rights_rules_v1",criteria_met:["live_birth"],criteria_missing:["prenatal_conditional_rights"]}}};
    return st;
   }
   if(action==="complete"){
    assert.equal(props.answers.length,6);
    st.status="completed";st.draft=[];st.result={source:"server_finalized_diagnostic",student_id:uid};
    st.training_plan={mode:opts.mode||"foundation",firstTasks:["memory_cues","reconstruct","delayed_retrieval"]};return st;
   }
   throw Error("unknown action");
  }
 };
 const D={identity:async()=>uid,academicItemsApproved:async()=>!opts.unapproved,QUESTIONS};
 const win={document,location:{search:"?lang="+lang,replace:url=>redirects.push(url)},
  URLSearchParams,LEX_CLOUD:cloud,LEX_OFFICIAL_DIAGNOSTIC:D,console,Promise};
 win.window=win;
 const context=vm.createContext(win);vm.runInContext(source,context);
 return {win,main,nodes,calls,redirects,choose:n=>{chosen=n},cloud,header,opts};
}
(async()=>{
 const data={};
 for(const lang of ["ar","en"]){
  const uid="new-"+lang,env=make(uid,lang,data);
  await env.win.LEX_SERVER_DIAGNOSTIC.mount();
  assert.ok(env.nodes.beginDiagnostic,"new student must see explicit official start");
  await env.nodes.beginDiagnostic.onclick();
  for(const q of QUESTIONS){assert.ok(env.nodes.serverNext,"each question must have a save action");env.choose(q.a);await env.nodes.serverNext.onclick();}
  assert.ok(env.nodes.ungradedText,"six objective questions lead to optional free recall");
  assert.match(env.main.html,lang==="ar"?/متى تبدأ الشخصية القانونية/:/when does a human being/,
    "free recall must explain the exact task without supplying its answer");
  env.nodes.ungradedText.value="needs human review";
  await env.nodes.serverNext.onclick();
  assert.equal(env.redirects.length,0,"show verified result before any training navigation");
  assert.ok(!/memory_cues|live_birth|prenatal_conditional_rights/.test(env.main.html),"internal plan and criterion keys must never render to a learner");
  assert.equal((env.main.html.match(/class='diagScoreCard'/g)||[]).length,2,'two scores only');
  assert.match(env.main.html,/diagnosticReport/,"student sees persisted result report");
  assert.match(env.main.html,/student-path\.html/,"result opens the server-side adaptive learning journey");
  assert.equal(env.calls.filter(c=>c==="draft").length,6);
  assert.deepEqual(env.calls.slice(-3),["complete","reviewDiagnostic","status"]);
  const returning=make(uid,lang,data);
  await returning.win.LEX_SERVER_DIAGNOSTIC.mount();
  assert.equal(returning.redirects.length,0,"returning student sees the report, not a redirect loop");
  assert.match(returning.main.html,/diagnosticReport/,"returning student can read the saved report again");
  assert.ok(!returning.nodes.beginDiagnostic);
 }
 // A previously saved OPTIONAL signup consent permits one server-only AI grade.
 {
  const uid="ai-opt-in",env=make(uid,"ar",data),events=[];
  env.cloud.getConsent=async()=>({accepted:true});
  env.cloud.recordConsent=async()=>{throw Error("no_repeated_consent");};
  env.cloud.gradeDiagnosticAi=async()=>{
   events.push(["grade"]);
   data[uid].result.measurements={recall:{ai_grade:{
    status:"preliminary_ai",provisional_percent:80,feedback_ar:"تقدير أولي",
    feedback_en:"Preliminary",needs_human_review:true
   }}};
   return {status:"completed"};
  };
  await env.win.LEX_SERVER_DIAGNOSTIC.mount();
  await env.nodes.beginDiagnostic.onclick();
  for(const q of QUESTIONS){env.choose(q.a);await env.nodes.serverNext.onclick();}
  assert.ok(!env.nodes.aiConsent,"diagnostic must not ask for external AI permission again");
  env.nodes.ungradedText.value="تبدأ الشخصية القانونية بالولادة الحية وتنتهي بالوفاة";
  await env.nodes.serverNext.onclick();
  assert.deepEqual(events,[["grade"]]);
  assert.match(env.main.html,/80%/,"persisted AI estimate shown");
  assert.match(env.main.html,/تقديرات مبدئية للتدريب/);
 }
 // Completed result shows exactly two skill indicators, no old inflated recall.
 {
  const uid="legacy",env=make(uid,"ar",data);
  data[uid]={status:"completed",attempt_id:"saved-once",result:{
   source:"server_finalized_diagnostic",student_id:uid,metrics:{understanding:50},
   measurements:{recall:{internal_grade:{status:"preliminary_internal",provisional_percent:100,criteria_met:["live_birth"]},
    corrected_internal_grade:{status:"preliminary_internal",provisional_percent:40}}}
  },training_plan:{mode:"balanced"}};
  await env.win.LEX_SERVER_DIAGNOSTIC.mount();
  assert.equal((env.main.html.match(/class='diagScoreCard'/g)||[]).length,2);
  assert.match(env.main.html,/تقدير الحفظ/);assert.match(env.main.html,/تقدير الفهم/);
  assert.match(env.main.html,/40%/);assert.match(env.main.html,/50%/);
  assert.doesNotMatch(env.main.html,/100%/);
  assert.ok(!env.nodes.retroAiGrade);
  assert.match(env.main.html,/student-path.html/);
 }
 // A three-element weighted rubric can give a provisional score.
 {
  const uid="weighted",env=make(uid,"ar",data);
  data[uid]={status:"completed",result:{source:"server_finalized_diagnostic",student_id:uid,
   metrics:{understanding:100},measurements:{recall:{internal_grade:{
    status:"preliminary_internal",provisional_percent:40,
    criteria_met:["live_birth"],criteria_missing:["death_end","prenatal_conditional_rights"]}}}},
    training_plan:{mode:"balanced"}};
  await env.win.LEX_SERVER_DIAGNOSTIC.mount();
  assert.equal((env.main.html.match(/class='diagScoreCard'/g)||[]).length,2);
  assert.match(env.main.html,/40%/);assert.match(env.main.html,/100%/);
 }
 // An old one-element grade, or missing objective answers, never generate made-up scores.
 {
  const uid="no-evidence",env=make(uid,"ar",data);
  data[uid]={status:"completed",result:{source:"server_finalized_diagnostic",student_id:uid,
   metrics:{understanding:null},measurements:{recall:{internal_grade:{
    status:"preliminary_internal",provisional_percent:100,criteria_met:["live_birth"]}}}},
    training_plan:{mode:"balanced"}};
  await env.win.LEX_SERVER_DIAGNOSTIC.mount();
  assert.doesNotMatch(env.main.html,/100%/);
  assert.equal((env.main.html.match(/class='diagScoreCard'/g)||[]).length,2);
  assert.match(env.main.html,/لم يتوفر تقدير بعد/);
 }
 // Partial draft is truly server-originating, and is resumed in another language.
 const part={partial:{status:"in_progress",attempt_id:"partial-attempt",draft:[{question_id:"q39r",selected:0}]}};
 const resumed=make("partial","en",part);
 await resumed.win.LEX_SERVER_DIAGNOSTIC.mount();
 assert.match(resumed.main.html,/2 \/ 7/,"resume begins at second question");
 resumed.choose(1);await resumed.nodes.serverNext.onclick();
 assert.equal(part.partial.draft.length,2);
 // Network failed: do not advance or claim saved.
 const fail=make("failed","ar",data,{failDraft:true});
 await fail.win.LEX_SERVER_DIAGNOSTIC.mount();
 await fail.nodes.beginDiagnostic.onclick();
 fail.choose(0);await fail.nodes.serverNext.onclick();
 assert.equal(data.failed.draft.length,0);
 assert.equal(fail.redirects.length,0);
 assert.match(fail.nodes.serverError.textContent,/إجابتك ما زالت موجودة/);
 assert.doesNotMatch(fail.nodes.serverError.textContent,/network_lost/);
 // Content not approved -> no questions shown, no bypass.
 const denied=make("unreviewed","ar",data,{unapproved:true});
 await denied.win.LEX_SERVER_DIAGNOSTIC.mount();
 assert.equal(denied.nodes.beginDiagnostic,undefined,"unapproved questions never render a start button");
 assert.match(denied.main.html,/تعذّر فتح الاختبار/);
 assert.doesNotMatch(denied.main.html,/اعتمادًا قانونيًا وأكاديميًا/);
 assert.ok(!denied.nodes.serverNext);
 console.log("Server-connected diagnostic UI mock PASS: AR/EN start/draft/readback, return, partial resume, failure, approval guard");
})().catch(e=>{console.error(e);process.exitCode=1;});
