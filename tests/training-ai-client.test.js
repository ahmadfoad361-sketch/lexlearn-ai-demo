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
async function recover(lang){
 const nodes={},calls=[],saved=[{item_id:'rights-v1-s1-understanding',dimension:'understanding',answer_text:'Saved conditional legal reasoning',evaluation:{status:'preliminary_ai',rubric_version:'lexlearn-training-ai-v2',provisional_percent:0}}];
 const host={querySelector:s=>nodes[s.slice(1)]||null};
 Object.defineProperty(host,'innerHTML',{get(){return this.html;},set(v){this.html=v;for(const k of Object.keys(nodes))delete nodes[k];for(const m of v.matchAll(/id='([^']+)'/g))nodes[m[1]]={value:'',disabled:false,textContent:'',onclick:null};}});
 let fail=true;
 const cloud={getConsent:async()=>true,trainingAiSummary:async()=>({priority:'foundation'}),
  gradeTrainingAi:async()=>{calls.push('grade');if(fail)throw Error('temporary outage');saved[0].evaluation={status:'preliminary_ai',rubric_version:'lexlearn-training-ai-v3',provisional_percent:14,verdict:'partially_correct',feedback_ar:'جزء صحيح وشرط ناقص.',feedback_en:'A correct component with a missing condition.',criteria:[{credit:.5,label_ar:'شرط الولادة',label_en:'Live birth condition',evidence:'<script>evidence</script>',explanation_ar:'ربطت الحق بالولادة؛ اشرح باقي الشروط.',explanation_en:'You connected the right to birth; explain the remaining conditions.'}]};return {status:'preliminary_ai'};},
  studentLifecycleRpc:async(action)=>{calls.push(action);return action==='trainingOverview'?{allowed:true,unlocked:2,completed_count:1}:{allowed:true,completed:true,tasks:[{id:saved[0].item_id,dimension:'understanding'}],saved};}};
 const window={document:{getElementById:()=>host},URLSearchParams,location:{search:'?session=1&lang='+lang},LEX_CLOUD:cloud,LEX_OFFICIAL_DIAGNOSTIC:{identity:async()=> 'learner'},console};window.window=window;
 vm.runInNewContext(fs.readFileSync('assets/student-path.js','utf8'),window);await window.LEX_STUDENT_PATH.mount();
 assert.ok(calls.includes('grade'),'automatically re-assess previously saved binary grades');
 assert.ok(!host.html.includes('0%'),'outdated binary zero is not shown as current understanding');
 assert.ok(nodes.retryGrade0,'saved work has a retry action');
 fail=false;await nodes.retryGrade0.onclick();
 assert.ok(host.html.includes('14%'));assert.ok(host.html.includes(lang==='ar'?'صحيحة جزئيًا':'Partly correct answer'));
 assert.ok(host.html.includes(lang==='ar'?'شرط الولادة':'Live birth condition'));
 assert.ok(host.html.includes('&lt;script&gt;'));assert.ok(!host.html.includes('<script>'));
 assert.equal(nodes.retryGrade0,undefined,'confirmed assessment does not offer a needless paid retry');
 assert.ok(!calls.includes('trainingSubmit'),'reassessment never resubmits or changes the answer');
}
(async()=>{for(const lang of ['ar','en']){await run({lang});await run({lang,fail:true});await run({lang,consent:false});await recover(lang);}console.log('Bilingual training: save before AI, registration acceptance, priority changes, provider failure and escaped feedback: PASS');})().catch(e=>{console.error(e);process.exitCode=1;});



