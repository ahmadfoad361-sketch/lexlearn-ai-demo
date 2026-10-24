const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/student-path.js','utf8');
function environment(session,lang='ar',failHistory=false,incomplete=false,courseFinished=false){
 const nodes={};let full=!incomplete;const calls=[],filters=[];
 const host={_html:'',querySelector:s=>nodes[s.slice(1)]||null};
 Object.defineProperty(host,'innerHTML',{get(){return this._html;},set(v){this._html=v;for(const k of Object.keys(nodes))delete nodes[k];for(const m of v.matchAll(/id='([^']+)'/g))nodes[m[1]]={value:'',disabled:false,textContent:'',onclick:null};}});
 const dimensions=['recall','understanding','exam_execution'];
 const tasks=dimensions.map((dimension,i)=>({id:'task-'+i,dimension,title_ar:'مهمة قانونية',title_en:'Legal task',prompt_ar:'بيّن القاعدة القانونية وطبقها على الواقعة.',prompt_en:'Explain the rule and apply it to the facts.'}));
 const scores=[80,70,65];
 const saved=()=>tasks.slice(0,full?3:2).map((q,i)=>({item_id:q.id,dimension:q.dimension,answer_text:'إجابة محفوظة',evaluation:{status:'preliminary_internal',provisional_percent:scores[i]}}));
 const start=Math.floor((session-1)/5)*5+1,history=[];
 for(let n=start;n<session;n++)for(const [dimension,score] of [['recall',40],['understanding',60]])history.push({session_number:n,dimension,evaluation:{provisional_percent:score}});
 const query={select:()=>query,eq:(key,value)=>{filters.push([key,value]);return query;},gte:()=>query,lte:()=>query,order:()=>query,limit:async()=>failHistory?{error:{message:'offline'}}:{data:history}};
 const cloud={db:()=>({from:table=>{assert.equal(table,'student_training_answers');return query;}}),studentLifecycleRpc:async(action,props)=>{
  calls.push(action);
  if(action==='trainingOverview')return {allowed:true,unlocked:courseFinished?30:Math.min(30,session+(full?1:0)),completed_count:courseFinished?30:session-(full?0:1),program_completed:courseFinished||session===30&&full};
  if(action==='trainingOpen')return {allowed:true,tasks,saved:saved(),completed:full,weakest:'recall'};
  if(action==='trainingSubmit'){full=true;return {allowed:true,saved:saved()};}
  throw Error(action);
 }};
 const window={document:{getElementById:()=>host},URLSearchParams,location:{search:'?lang='+lang+'&session='+session,href:''},LEX_CLOUD:cloud,LEX_OFFICIAL_DIAGNOSTIC:{identity:async()=> 'student-fixture'},console};window.window=window;
 vm.runInNewContext(source,window);return {window,host,nodes,calls,filters};
}
(async()=>{
 for(const lang of ['ar','en'])for(const session of [5,10,15,20,25,30]){
  const e=environment(session,lang);await e.window.LEX_STUDENT_PATH.mount();
  assert.match(e.host.innerHTML,/progressReport/);
  assert.ok(e.host.innerHTML.includes((lang==='ar'?'إتمام المستوى ':'Level completion ')+session/5),'each of six levels has a clear report');
  assert.ok(!e.host.innerHTML.includes('aria-valuenow='),'unverified percentages must never appear in learner progress bars');
  assert.ok(!e.host.innerHTML.includes('+40')&&!e.host.innerHTML.includes('+10'),'raw cross-task score differences must not be shown to learners');
  assert.ok(e.host.innerHTML.includes(lang==='ar'?'مؤشرات تدريبية أولية':'preliminary practice indicators'),'show transparent non-certified assessment status');
  assert.ok(e.filters.some(([k,v])=>k==='user_id'&&v==='student-fixture'),'read only the authenticated learner history');
  if(session<30){assert.ok(e.nodes.nextSession);e.nodes.nextSession.onclick();assert.equal(e.window.location.href,'student-path.html?lang='+lang+'&session='+(session+1)+'&app=20261024-assessment-release');}
  else assert.equal(e.nodes.nextSession,undefined,'final report has no invalid session 31 link');
 }
 const offline=environment(5,'ar',true);await offline.window.LEX_STUDENT_PATH.mount();
 assert.match(offline.host.innerHTML,/مؤشرات تدريبية أولية/);
 assert.ok(!offline.host.innerHTML.includes('80%'),'unvalidated lexical percentages must never be shown');
 assert.ok(!offline.host.innerHTML.includes('تغيّر المؤشر:'),'do not invent an earlier baseline after query failure');
 const partial=environment(4,'en',false,true);await partial.window.LEX_STUDENT_PATH.mount();
 assert.equal(partial.nodes.nextSession,undefined,'no completion report or next action before server-verified completion');
 partial.nodes.adaptiveEssay.value='A meaningful legal answer.';await partial.nodes.adaptiveSubmit.onclick();
 assert.match(partial.host.innerHTML,/Session summary 4/);
 assert.ok(partial.calls.includes('trainingSubmit')&&partial.calls.filter(x=>x==='trainingOpen').length===2,'read back saved completion before reporting');
 const model=partial.window.LEX_STUDENT_PATH.progressModel([
  {session_number:4,dimension:'recall',evaluation:{status:'preliminary_ai',rubric_version:'lexlearn-training-ai-v4',provisional_percent:0}},
  {session_number:4,dimension:'recall',evaluation:{provisional_percent:null}},
  {session_number:4,dimension:'understanding',evaluation:{provisional_percent:'90'}},
  {session_number:4,dimension:'understanding',evaluation:{provisional_percent:150}},
  {session_number:5,dimension:'understanding',evaluation:{provisional_percent:100}}
 ],4);
 assert.equal(model.skills[0].current.score,0,'a real zero remains a zero');
 assert.equal(model.skills[0].current.assessed,1);
 assert.equal(model.skills[1].current.score,null,'missing, invalid and future scores never become fabricated values');
 assert.equal(model.needsReview.length,2);
 const reentry=environment(5,'ar',false,false,true);await reentry.window.LEX_STUDENT_PATH.mount();
 assert.match(reentry.host.innerHTML,/إتمام المستوى 1/,'report rebuilds from saved records after reopening');
 console.log('Six-level progress reports: bilingual values, same-level comparisons, completion gates, query failures and reload: PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
