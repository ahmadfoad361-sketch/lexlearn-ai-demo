const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
async function run({consent=true,fail=false,lang='ar'}={}){
 const nodes={},saved=[],calls=[];let priority='recall';
 const host={querySelector:s=>nodes[s.slice(1)]||null};
 Object.defineProperty(host,'innerHTML',{get(){return this.html;},set(v){this.html=v;for(const k of Object.keys(nodes))delete nodes[k];for(const m of v.matchAll(/id='([^']+)'/g))nodes[m[1]]={value:'',disabled:false,textContent:'',onclick:null};}});
 const tasks=['understanding','recall','exam_execution'].map(d=>({id:d,dimension:d,prompt_ar:'اكتب القاعدة بأسلوبك',prompt_en:'Explain the legal rule in your own words.'}));
 const cloud={getConsent:async()=>consent,recordConsent:async()=>{calls.push('consent');consent=true;},
  trainingAiSummary:async()=>({priority,skills:{recall:priority==='recall'?40:90,understanding:70}}),
  gradeTrainingAi:async(session,id)=>{calls.push('grade');if(fail)throw Error('provider offline');saved.find(x=>x.item_id===id).evaluation={status:'preliminary_ai',provisional_percent:90,feedback_ar:'استكمل الشرط <script>alert(1)</script>',feedback_en:'Explain the missing condition <script>alert(1)</script>'};priority='understanding';return {status:'preliminary_ai'};},
  studentLifecycleRpc:async(action,p)=>{
   calls.push(action);
   if(action==='trainingOverview')return {allowed:true,unlocked:1,completed_count:0};
   if(action==='trainingSubmit'){saved.push({item_id:p.itemId,dimension:p.itemId,answer_text:p.answer,evaluation:{status:'preliminary_internal',provisional_percent:50}});return {allowed:true,saved};}
   return {allowed:true,tasks,saved,completed:false};
  }};
 const window={document:{getElementById:()=>host},URLSearchParams,location:{search:'?lang='+lang},LEX_CLOUD:cloud,LEX_OFFICIAL_DIAGNOSTIC:{identity:async()=> 'learner'},console};window.window=window;
 vm.runInNewContext(fs.readFileSync('assets/student-path.js','utf8'),window);await window.LEX_STUDENT_PATH.mount();
 assert.equal(nodes.enableTrainingAi,undefined,'no second consent prompt in training');
 nodes.adaptiveEssay.value='Meaningful legal answer';await nodes.adaptiveSubmit.onclick();
 if(!consent){assert.ok(!calls.includes('grade'),'legacy missing permission is not silently invented');assert.ok(!calls.includes('consent'));return;}
 assert.ok(calls.indexOf('grade')>calls.indexOf('trainingSubmit'),'persist the answer before paid inference');
 assert.equal(saved[0].item_id,'recall','server evidence takes priority over the original balanced task order');
 if(fail){assert.ok(host.html.includes(lang==='ar'?'لم يتأكد':'not confirmed'));assert.ok(!host.html.includes('50%'));}
 else{
  assert.ok(host.html.includes('90%'));assert.ok(!host.html.includes('<script>'));assert.ok(host.html.includes('&lt;script&gt;'));
  assert.ok(host.html.includes(lang==='ar'?'الأولوية الآن للفهم':'Understanding priority'));
 }
}
(async()=>{for(const lang of ['ar','en']){await run({lang});await run({lang,fail:true});await run({lang,consent:false});}console.log('Bilingual training: save before AI, registration acceptance, priority changes, provider failure and escaped feedback: PASS');})().catch(e=>{console.error(e);process.exitCode=1;});


