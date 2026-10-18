const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const script=fs.readFileSync("assets/official-diagnostic.js","utf8");
const reference=require("../assets/official-diagnostic.js");
const questions=reference.QUESTIONS;
const src={q39r:["qa-civil-2004-art39"],q49r:["qa-civil-2004-art49"],q62r:["qa-civil-2004-art62"],q39u:["qa-civil-2004-art39"],q50u:["qa-civil-2004-art39","qa-civil-2004-art50"],q63a:["qa-civil-2004-art63"]};
function makeEnvironment(uid,lang,remote,flags={}){
 const nodes={},cache=new Map(),drafts=new Map(),redirects=[];
 let selected=null;
 const rootEl={html:"",querySelector(selector){if(selector==="input[name=answer]:checked")return selected==null?null:{value:String(selected)};return null;}};
 Object.defineProperty(rootEl,"innerHTML",{set(html){
   this.html=html;
   for(const k of Object.keys(nodes))delete nodes[k];
   for(const m of html.matchAll(/id='([^']+)'/g))nodes[m[1]]={value:"",disabled:false,textContent:"",onclick:null,oninput:null};
 },get(){return this.html;}});
 const document={
  getElementById(id){return id==="officialDiagnostic"?rootEl:(nodes[id]||null);}
 };
 const reviewed=questions.map(q=>({
   status:"approved",reviewed_at:"2026-10-18T22:00:00Z",
   legal_reviewer:"reviewer-A",learning_reviewer:"reviewer-B",
   metadata:{official_diagnostic_v2_id:q.id,legal_approval:true,learning_approval:true},
   prompt_ar:q.ar,rubric_json:{prompt_en:q.en},options_json:{ar:q.arOptions,en:q.enOptions},
   answer_key_json:{correct_index:q.a},source_ids:src[q.id]
 }));
 function query(table){
  const row={select(){return row;},eq(){return row;},maybeSingle:async()=>({data:{course_id:"qa-qu-lawc101-rights",status:"active"},error:null}),
   then(ok,bad){return Promise.resolve({data:flags.unapproved?reviewed.slice(1):reviewed,error:null}).then(ok,bad);}};
  return row;
 }
 const cloud={
  db:()=>({auth:{getUser:async()=>({data:{user:{id:uid}},error:null})},from:query}),
  profile:async()=>({id:uid,role:"student",active:true}),
  getConsent:async()=>flags.noConsent?null:{accepted:true},
  loadSnapshot:async({courseId,snapshotType})=>remote.get(uid+"|"+courseId+"|"+snapshotType)||null,
  saveSnapshot:async({courseId,snapshotType,state})=>{
   if(flags.failStorage)throw new Error("simulated_network_failure");
   const key=uid+"|"+courseId+"|"+snapshotType;
   remote.set(key,{state:JSON.parse(JSON.stringify(state))});
   return remote.get(key);
  },
  saveLearningPlan:async()=>({ok:true})
 };
 const window={document,location:{search:"?lang="+lang,replace:(url)=>redirects.push(url)},URLSearchParams,
  localStorage:{getItem:key=>cache.get(key)||null,setItem:(k,v)=>cache.set(k,v)},
  sessionStorage:{getItem:k=>drafts.get(k)||null,setItem:(k,v)=>drafts.set(k,v),removeItem:k=>drafts.delete(k)},
  crypto:{randomUUID:()=>uid+"-fixture-attempt"},LEX_CLOUD:cloud,console,Date,JSON,Promise};
 window.window=window;
 const ctx=vm.createContext(window);vm.runInContext(script,ctx);
 return {window,rootEl,nodes,redirects,setChoice(v){selected=v;},cloud,cache,drafts};
}
(async()=>{
 const remote=new Map();
 for(const [kind,lang] of [["recall-led","ar"],["understanding-led","en"],["insufficient_evidence","ar"]]){
  const uid="e2e-"+kind,env=makeEnvironment(uid,lang,remote);
  await env.window.LEX_OFFICIAL_DIAGNOSTIC.mount();
  assert.ok(env.nodes.diagNext,"the official form should show its first question");
  for(const q of questions){
   let answer=-1;
   if(kind==="recall-led")answer=q.dimension==="recognition"?q.a:(q.a+1)%3;
   if(kind==="understanding-led")answer=q.dimension==="recognition"?(q.a+1)%3:q.a;
   env.setChoice(answer);
   await env.nodes.diagNext.onclick();
  }
  assert.ok(env.nodes.freeRecall,"six questions lead to the non-graded free-response page");
  env.nodes.freeRecall.value="This is free recall; it needs a human legal review";
  await env.nodes.diagNext.onclick();
  assert.equal(env.redirects[0],"program"+(lang==="en"?"-en":"")+".html?country=qa&subject=rights&start=1");
  const saved=remote.get(uid+"|qa-rights|profile").state.results["qa-rights"];
  assert.equal(saved.profileType,kind);
  assert.equal(saved.metrics.recall,null);
  assert.equal(saved.review_status,"pending_human_review");
  assert.equal(remote.get(uid+"|qa-rights|course").state.session,1);
  // Fresh browser/cache, equivalent to re-login; result must remain in cloud, without a new test.
  const again=makeEnvironment(uid,lang==="ar"?"en":"ar",remote);
  await again.window.LEX_OFFICIAL_DIAGNOSTIC.mount();
  assert.equal(again.redirects.length,1,"completed diagnostic auto-resumes and never repeats");
  assert.equal(again.nodes.diagNext,undefined,"no test appears upon re-login");
  assert.equal(remote.get(uid+"|qa-rights|profile").state.results["qa-rights"].attempt_id,uid+"-fixture-attempt");
 }
 const locked=makeEnvironment("locked","ar",remote,{unapproved:true});
 await locked.window.LEX_OFFICIAL_DIAGNOSTIC.mount();
 assert.ok(locked.rootEl.html.includes("تنتظر الاعتماد"),"unapproved questions are not visible");
 assert.equal(locked.nodes.diagNext,undefined);
 const denied=makeEnvironment("without-consent","en",remote,{noConsent:true});
 await denied.window.LEX_OFFICIAL_DIAGNOSTIC.mount();
 assert.ok(denied.rootEl.html.includes("learning_data_consent_required"));
 const failure=makeEnvironment("storage-fail","en",remote,{failStorage:true});
 await failure.window.LEX_OFFICIAL_DIAGNOSTIC.mount();
 for(const q of questions){failure.setChoice(q.a);await failure.nodes.diagNext.onclick();}
 await failure.nodes.diagNext.onclick();
 assert.equal(failure.redirects.length,0,"central-write errors must never auto-open a level");
 assert.ok(failure.rootEl.html.includes("Save diagnostic"));
 assert.ok(failure.nodes.diagError.textContent.includes("simulated_network_failure"));
 console.log("issue-36 simulated DOM flow: PASS (6 questions → one saved result → adaptive session-1 link; 3 students, two languages, re-login, academic gate, network-failure gate)");
})().catch(e=>{console.error(e);process.exitCode=1;});
