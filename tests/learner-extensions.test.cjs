const test=require('node:test');
const assert=require('node:assert/strict');
const addon=require('../assets/learner-extensions.js');
const fingerprint=require('../assets/admin-cognitive-fingerprint.js');
const session=(n,dimension='recall')=>({session_number:n,completed_at:'2026-11-09T10:00:00Z',tasks_json:[{id:'item-'+n,dimension,prompt_ar:'تدريب معتمد',sources:['qa-civil-2004-art39']}]});
test('only sessions 2, 4 and 6 open profession challenges',()=>{
  for(let n=1;n<=30;n++)assert.equal(addon.isMilestone(n),[2,4,6].includes(n));
});
test('reviews appear on even completed milestones and never inside active questions',()=>{
  assert.equal(addon.eligibleReview(1),false);
  assert.equal(addon.eligibleReview(2),true);
  assert.equal(addon.eligibleReview(30),true);
  assert.equal(addon.eligibleReview(31),false);
});
test('review reuses previous saved approved tasks, with lag',()=>{
  assert.equal(addon.reviewSource([session(1)],2).session,1);
  assert.equal(addon.reviewSource([session(1),session(2),session(3)],4).session,1);
  assert.equal(addon.reviewSource([session(1),session(2),session(3),session(4),session(5)],6).session,3);
  assert.equal(addon.reviewSource([],4),null);
});
test('role changes the applied task without changing the source session',()=>{
  const tasks=[{id:'understanding',dimension:'understanding',prompt_ar:'سؤال فهم'},{id:'case',dimension:'exam_execution',prompt_ar:'مسألة'}];
  assert.equal(addon.roleTask(tasks,'judge').id,'case');
  assert.equal(addon.roleTask(tasks,'lawyer').id,'case');
  assert.equal(addon.roleTask(tasks,'professor').id,'understanding');
});
test('fingerprint needs verified rubric criterion coverage',()=>{
  const base={label_ar:'شرط قانوني',dimension:'recall',evidence_count:2,rolling_percent:50,measurement:'provisional_criterion_coverage',next_step:'reconstruct_from_memory'};
  assert.equal(fingerprint.model({concepts:[base]}).length,1);
  assert.equal(fingerprint.model({concepts:[{...base,measurement:'unknown'}]}).length,0);
  assert.equal(fingerprint.model({concepts:[{...base,evidence_count:1}]} )[0].confidence,'single_observation');
});
test('fingerprint escapes untrusted labels',()=>{
  const html=fingerprint.render({concepts:[{label_ar:'<img onerror=alert(1)>',dimension:'recall',evidence_count:2,rolling_percent:50,measurement:'provisional_criterion_coverage'}]});
  assert.equal(html.includes('<img'),false);
  assert.ok(html.includes('&lt;img'));
});


test('completed profession milestone displays three role choices and saves typed professor response',async()=>{
  const before={location:global.location,LEX_CLOUD:global.LEX_CLOUD,LEX_LEGAL_STUDY:global.LEX_LEGAL_STUDY};
  const writes=[];
  const tasks=[
    {id:'case2',dimension:'exam_execution',prompt_ar:'مسألة قانونية تدريبية',sources:['qa-civil-2004-art39']},
    {id:'understanding2',dimension:'understanding',prompt_ar:'شرح القاعدة',sources:['qa-civil-2004-art39']}
  ];
  const node={
    isConnected:true,innerHTML:'',area:{value:''},save:{disabled:false},status:{textContent:''},
    buttons:[],
    querySelectorAll(){return this.buttons=[...['judge','lawyer','professor'].map(role=>({dataset:{lexRole:role},onclick:null}))];},
    querySelector(selector){return selector==='#lexCareerAnswer'?this.area:selector==='#lexCareerSave'?this.save:selector==='#lexCareerStatus'?this.status:null;}
  };
  const from=table=>({
    select(){return this},eq(){return this},
    maybeSingle(){return Promise.resolve({data:{session_number:2,completed_at:'2026-11-09T10:00:00Z',tasks_json:tasks},error:null})},
    order(){return Promise.resolve({data:[],error:null})},
    insert(row){writes.push({...row});return Promise.resolve({error:null})}
  });
  try{
    global.location={search:'?lang=ar&milestone=2'};
    global.LEX_LEGAL_STUDY={context:()=>'<p>القانون المدني القطري رقم 22 لسنة 2004، المادة 39</p>'};
    global.LEX_CLOUD={requireStudent:async()=>({id:'student-synthetic'}),db:()=>({from})};
    await addon.mountCareer(node);
    assert.match(node.innerHTML,/اختار مهنتك القادمة/);
    assert.match(node.innerHTML,/قاضي/);
    assert.match(node.innerHTML,/محامي/);
    assert.match(node.innerHTML,/أستاذ جامعي/);
    node.buttons.find(b=>b.dataset.lexRole==='professor').onclick();
    assert.match(node.innerHTML,/شرح القاعدة/);
    node.area.value='أشرح القاعدة القانونية بأسلوبي وأقدم مثالاً تطبيقياً يوضح شرطها ونتيجتها القانونية';
    await node.save.onclick();
    assert.equal(writes.length,1);
    assert.equal(writes[0].role_choice,'professor');
    assert.equal(writes[0].milestone_session,2);
    assert.equal(writes[0].source_item_id,'understanding2');
    assert.equal(writes[0].input_mode,'typed');
    assert.match(node.innerHTML,/حفظنا محاولتك|حفظنا محاولتك التدريبية/);
  }finally{for(const k of Object.keys(before)){if(before[k]===undefined)delete global[k];else global[k]=before[k];}}
});
test('unfinished profession challenge cannot be entered through direct URL',async()=>{
 const before={location:global.location,LEX_CLOUD:global.LEX_CLOUD};
 const node={isConnected:true,innerHTML:''};
 let writes=0;
 try{
  global.location={search:'?lang=ar&milestone=4'};
  global.LEX_CLOUD={
   requireStudent:async()=>({id:'synthetic'}),
   db:()=>({from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{session_number:2,completed_at:'2026-11-09T10:00:00Z',tasks_json:[{id:'case2',dimension:'exam_execution',prompt_ar:'مسألة'}]},error:null}),
    insert(){writes++;return Promise.resolve({error:null})}})})
  };
  await addon.mountCareer(node);
  assert.match(node.innerHTML,/يفتح بعد إكمال الجلسة رقم 4/);
  assert.equal(writes,0);
 }finally{for(const k of Object.keys(before)){if(before[k]===undefined)delete global[k];else global[k]=before[k];}}
});
test('review module saves a non-credit answer from a previous completed session',async()=>{
 const before={LEX_LEGAL_STUDY:global.LEX_LEGAL_STUDY};
 const writes=[];
 const node={isConnected:true,innerHTML:'',area:{value:''},button:{disabled:false},status:{textContent:''},
  querySelector(selector){return selector==='#lexRecallAnswer'?this.area:selector==='#lexRecallSave'?this.button:selector==='#lexRecallStatus'?this.status:null;}};
 const from=table=>({
  select(){return this},eq(){return this},lt(){return this},not(){return this},order(){return this},
  limit(){return table==='lex_retrieval_checks'?Promise.resolve({data:[],error:null}):
    Promise.resolve({data:[{session_number:1,completed_at:'2026-11-09T10:00:00Z',tasks_json:[{id:'recall1',dimension:'recall',prompt_ar:'استرجع القاعدة دون نص',sources:['qa-civil-2004-art39']}]}],error:null})},
  insert(row){writes.push({...row});return Promise.resolve({error:null})}
 });
 try{
  global.LEX_LEGAL_STUDY={context:()=>'<p>القانون المدني القطري رقم 22 لسنة 2004</p>'};
  await addon.mountReview(node,{cloud:{db:()=>({from})},uid:'synthetic',session:2,lang:'ar'});
  assert.match(node.innerHTML,/استرجع القاعدة دون نص/);
  node.area.value='أسترجع القاعدة القانونية من الدرس السابق وأربط شروطها بأمثلة تطبيقية.';
  await node.button.onclick();
  assert.equal(writes.length,1);
  assert.equal(writes[0].source_session,1);
  assert.equal(writes[0].after_session,2);
  assert.equal(writes[0].source_item_id,'recall1');
  assert.match(node.innerHTML,/خطوة جديدة في رحلتك/);
 }finally{if(before.LEX_LEGAL_STUDY===undefined)delete global.LEX_LEGAL_STUDY;else global.LEX_LEGAL_STUDY=before.LEX_LEGAL_STUDY;}
});
test('production feature flag defaults off and never injects extras into active exercise',()=>{
 const fs=require('node:fs');
 const config=fs.readFileSync('assets/lexlearn-config.js','utf8');
 const path=fs.readFileSync('assets/student-path.js','utf8');
 const profile=fs.readFileSync('assets/student.js','utf8');
 assert.match(config,/learningExtensionsV1:false/);
 assert.match(path,/if\(completed\)\{/);
 assert.ok(path.indexOf('if(completed){')<path.indexOf("main+=\"<div id='lexReviewSlot'"));
 assert.match(path,/root\.LEX_CONFIG\?\.learningExtensionsV1===true/);
 assert.match(profile,/window\.LEX_CONFIG\?\.learningExtensionsV1===true/);
});
