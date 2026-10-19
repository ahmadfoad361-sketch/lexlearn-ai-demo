const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const source=fs.readFileSync("assets/official-level-one.js","utf8");
const IDS=["rights-v1-s1-understanding","rights-v1-s1-exam","rights-v1-s1-recall"];
function run(uid,lang,storage,opts={}){
 let nodes={};
 const host={html:"",querySelector:function(q){return nodes[q.slice(1)]||null;}};
 Object.defineProperty(host,"innerHTML",{get(){return this.html;},set(v){
  this.html=v;nodes={};
  for(const m of v.matchAll(/id='([^']+)'/g))nodes[m[1]]={value:"",textContent:"",disabled:false,onclick:null};
 }});
 const calls=[];
 const cloud={studentLifecycleRpc:async(action,p)=>{
  calls.push({action,p});
  if(opts.error&&action==="firstLevel")throw Error("network_failure");
  const state=storage[uid]||(storage[uid]={saved:[],allowed:true});
  const tasks=(opts.noContent?[]:(lang==="en"?IDS:IDS)).map((id,i)=>({id,
    dimension:id.endsWith("recall")?"recall":id.endsWith("exam")?"exam_execution":"understanding",
    title_ar:"مهمة قانونية "+i,title_en:"Legal question "+i,
    prompt_ar:"اشرح هذه الحالة وفق القانون القطري، مع بيان القاعدة والتطبيق والنتيجة.",
    prompt_en:"Explain this Qatari law question, applying its conditions and giving a conclusion."}));
  if(action==="submitLevelOne"){
   if(!state.saved.some(x=>x.item_id===p.itemId))state.saved.push({item_id:p.itemId,answer_text:p.answer,review_status:"pending_human_review"});
  }
  return {allowed:!opts.locked,reason:opts.locked?"academic_content_not_released":undefined,level:1,
   plan_mode:"recall-led",reason_ar:"الفهم يحتاج تدريبًا",reason_en:"Understanding practice first",
   status:state.saved.length===3?"practice_completed_pending_review":"in_progress",
   tasks:tasks,saved:state.saved.map(x=>({...x}))};
 }};
 const win={LEX_OFFICIAL_LEVEL_ONE:null};win.window=win;const ctx=vm.createContext(win);
 vm.runInContext(source,ctx);
 return {host,cloud,nodes:()=>nodes,calls,open:()=>win.LEX_OFFICIAL_LEVEL_ONE.mount(host,{lang,cloud,courseId:"qa-qu-lawc101-rights"})};
}
(async()=>{
 const storage={};
 for(const lang of ["ar","en"]){
  const env=run("student-"+lang,lang,storage);
  await env.open();
  assert.ok(env.host.html.includes("officialEssayAnswer"),lang+" first essay must render");
  assert.ok(env.host.html.includes("1 / 3"),lang+" first task should be stage one");
  assert.ok(!env.host.html.includes("100%"),"ungraded tasks must not fake score");
  env.nodes().officialEssayAnswer.value="Four elements of the relevant legal rule.";
  await env.nodes().officialSaveAnswer.onclick();
  assert.ok(env.host.html.includes("2 / 3"),"second task after durable save");
  assert.equal(storage["student-"+lang].saved.length,1);
  // Reload/another language: current task must come from authoritative remote state.
  const fresh=run("student-"+lang,lang==="en"?"ar":"en",storage);
  await fresh.open();
  assert.ok(fresh.host.html.includes("2 / 3"),"re-login must resume without repeating saved answer");
  for(let j=2;j<=3;j++){
   fresh.nodes().officialEssayAnswer.value="Legal elements, issue, rule, application and conclusion.";
   await fresh.nodes().officialSaveAnswer.onclick();
  }
  assert.match(fresh.host.html,lang==="ar"?/pending review/:/بانتظار مراجعتها/,"practice completion must remain pending human review");
  assert.equal(storage["student-"+lang].saved.length,3);
  assert.equal(fresh.calls.filter(x=>x.action==="submitLevelOne").length,2);
 }
 const locked=run("locked","ar",storage,{locked:true});
 await locked.open();
 assert.ok(locked.host.html.includes("بانتظار الاعتماد"),"do not show unapproved material");
 assert.ok(!locked.host.html.includes("officialSaveAnswer"));
 const missing=run("missing","en",storage,{noContent:true});
 await missing.open();
 assert.ok(missing.host.html.includes("incomplete"),"incomplete syllabus must not produce a fake lesson");
 const bad=run("offline","ar",storage,{error:true});
 await bad.open();
 assert.ok(bad.host.html.includes("network_failure"),"network errors must be visible; no phantom progress");
 console.log("PASS: official first-level AR/EN UI — adaptive practice, write/readback, resume across languages, pending review, fail-closed");
})().catch(e=>{console.error(e);process.exitCode=1;});
