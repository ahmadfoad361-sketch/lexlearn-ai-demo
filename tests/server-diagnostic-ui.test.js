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
  assert.match(env.main.html,lang==="ar"?/مفاتيح للذاكرة/:/Memory cues/,"training plan must use localized task names");
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
 // An explicit, unchecked-by-default consent activates a server-only AI grade.
 {
  const uid="ai-opt-in",env=make(uid,"ar",data),events=[];
  env.cloud.recordConsent=async(version,type,accepted)=>{events.push(["consent",version,type,accepted]);return {accepted:true};};
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
  assert.ok(env.nodes.aiConsent,"AI must be opt-in, not hidden inside general learning consent");
  assert.ok(!env.nodes.aiConsent.checked,"AI consent must start unchecked");
  env.nodes.ungradedText.value="تبدأ الشخصية القانونية بالولادة الحية وتنتهي بالوفاة";
  env.nodes.aiConsent.checked=true;
  await env.nodes.serverNext.onclick();
  assert.deepEqual(events,[
   ["consent","lexlearn-ai-grading-v1","external_ai_grading",true],["grade"]]);
  assert.match(env.main.html,/80%/,"preliminary AI recall is shown from saved server result");
  assert.match(env.main.html,/تقدير أولي/);
 }
 // Previously completed students can opt in later without restarting or overwriting the diagnostic.
 {
  const uid="older-learner",events=[];
  data[uid]={status:"completed",attempt_id:"saved-once",
   result:{source:"server_finalized_diagnostic",student_id:uid,measurements:{recall:{
    internal_grade:{status:"preliminary_internal",provisional_percent:100}}}},
   training_plan:{mode:"balanced",firstTasks:["supported_rule"]}};
  const env=make(uid,"ar",data);
  env.cloud.recordConsent=async(version,type,accepted)=>{events.push("consent");return {accepted};};
  env.cloud.gradeDiagnosticAi=async()=>{
   events.push("grade");
   data[uid].result.measurements.recall.ai_grade={status:"preliminary_ai",provisional_percent:40};
   return {status:"completed"};
  };
  await env.win.LEX_SERVER_DIAGNOSTIC.mount();
  assert.match(env.main.html,/لم يُعتمد قياس كافٍ بعد/,"unverified legacy scores must not appear as memorization percentages");
  assert.ok(env.nodes.retroAiGrade,"a completed learner can request AI grading after the fact");
  await env.nodes.retroAiGrade.onclick();
  assert.deepEqual(events,[],"no AI call without explicit opt-in");
  assert.match(env.nodes.retroAiMessage.textContent,/الموافقة/);
  env.nodes.retroAiConsent.checked=true;
  await env.nodes.retroAiGrade.onclick();
  assert.deepEqual(events,["consent","grade"]);
  assert.match(env.main.html,/40%/,"readback displays the confirmed AI score");
  assert.equal(env.nodes.retroAiGrade,undefined,"no second grading button after score is saved");
  assert.equal(data[uid].attempt_id,"saved-once");
 }
 // Saved consent is re-used. No second checkbox requirement or second consent record.
 {
  const uid="consented-learner",events=[];
  data[uid]={status:"completed",attempt_id:"consent-existing",result:{
   source:"server_finalized_diagnostic",student_id:uid,
   measurements:{recall:{internal_grade:{status:"preliminary_internal",provisional_percent:100,criteria_met:["live_birth"]}}},
   answers:[{question_id:"q63a",selected:-1}]
  },training_plan:{mode:"foundation",firstTasks:["memory_cues"]}};
  const env=make(uid,"ar",data);
  env.cloud.getConsent=async()=>({accepted:true});
  env.cloud.recordConsent=async()=>{events.push("duplicate consent");throw Error("duplicate");};
  env.cloud.gradeDiagnosticAi=async()=>{
   events.push("grade");
   data[uid].result.measurements.recall.ai_grade={status:"preliminary_ai",provisional_percent:40};
   return {status:"completed"};
  };
  await env.win.LEX_SERVER_DIAGNOSTIC.mount();
  assert.equal(env.nodes.retroAiConsentLabel.style.display,"none","previous AI consent must not be shown again");
  assert.match(env.main.html,/اختار لا أدري/,"application was skipped, not graded zero");
  assert.match(env.main.html,/ألغينا اعتماد نسبة 100%/,"old one-criterion grading is disclaimed");
  await env.nodes.retroAiGrade.onclick();
  assert.deepEqual(events,["grade"],"a saved consent causes no additional consent request");
  assert.match(env.main.html,/40%/,"confirmed AI grading appears");
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
 assert.match(fail.nodes.serverError.textContent,/network_lost/);
 // Content not approved -> no questions shown, no bypass.
 const denied=make("unreviewed","ar",data,{unapproved:true});
 await denied.win.LEX_SERVER_DIAGNOSTIC.mount();
 assert.equal(denied.nodes.beginDiagnostic,undefined,"unapproved questions never render a start button");
 assert.match(denied.main.html,/تنتظر مراجعة/);
 assert.ok(!denied.nodes.serverNext);
 console.log("Server-connected diagnostic UI mock PASS: AR/EN start/draft/readback, return, partial resume, failure, approval guard");
})().catch(e=>{console.error(e);process.exitCode=1;});
