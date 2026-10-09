const fs=require('fs'),vm=require('vm'),assert=require('assert');
function environment(file,lang,seed,confirmed=true){
 const storage=new Map();
 if(seed)storage.set('lexlearn_v9_profile',JSON.stringify({results:{'qa-rights':{metrics:{recall:50,understanding:90,application:70,legal_precision:60,exam:null}}}}));
 let nodes=[];
 function Element(attrs={}){this.attrs=attrs;this.dataset={};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;this.classList={add(){}};this.value='';}
 Object.defineProperty(Element.prototype,'innerHTML',{set(html){this.html=html;if(this.attrs.id==='programApp')nodes=[this];const re=/<[a-z][^>]*>/gi;for(const tag of html.match(re)||[]){const attrs={};for(const m of tag.matchAll(/([a-z-]+)="([^"]*)"/gi))attrs[m[1]]=m[2];nodes.push(new Element(attrs));}},get(){return this.html||'';}});
 const app=new Element({id:'programApp'});nodes=[app];
 function query(selector){const data=selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);if(data)return nodes.filter(n=>n.attrs[data[1]]!==undefined&&(data[2]===undefined||n.attrs[data[1]]===data[2]));if(selector[0]==='.')return nodes.filter(n=>(n.attrs.class||'').split(' ').includes(selector.slice(1)));if(selector[0]==='#')return nodes.filter(n=>n.attrs.id===selector.slice(1));return [];}
 const document={documentElement:{lang},createElement(){return new Element();},getElementById(id){return nodes.slice().reverse().find(n=>n.attrs.id===id)||null;},querySelectorAll:query,querySelector(s){return query(s)[0]||null;}};
 Element.prototype.querySelectorAll=query;
 Element.prototype.querySelector=function(s){return query(s)[0]||null;};
 Element.prototype.appendChild=function(el){nodes.push(el);};
 const c={document,location:{search:'?demo=1&country=qa&subject=rights',replace(){}},URLSearchParams,Date,Math,JSON,Promise,console,setTimeout,clearTimeout,localStorage:{getItem(k){return storage.get(k)||null;},setItem(k,v){storage.set(k,v);}},scrollTo(){}};c.window=c;c.globalThis=c;vm.createContext(c);
 for(const name of ['assets/adaptive-engine.js','assets/learning-quality.js','assets/pilot-learning.js'])vm.runInContext(fs.readFileSync(name,'utf8'),c);
 // A confirmed-review fixture tests the gates, not model accuracy.
 if(confirmed)c.LEX_QUALITY.gradeAsync=async function(answer,task,language){const p=c.LEX_QUALITY.grade(answer,task,language);p.pending=false;p.overall=/لا أتذكر|cannot remember/.test(answer)?0:100;p.axes[task.dimension]=p.overall;p.needsHumanReview=false;p.gradingMethod='grounded_semantic';return p;};
 let src=fs.readFileSync(file,'utf8');
 src=src.replace(/boot\(\);\s*\}\)\(\);\s*$/,'window.__test={state:state,home:home,render:render,buildQueue:'+(lang==='ar'?'buildTrainingQueue':'buildQueue')+',assessmentQueue:'+(lang==='ar'?'assessmentBankForWeek':'assessmentQueue')+'};})();');
 vm.runInContext(src,c);return {c,storage,document,get nodes(){return nodes;}};
}
(async()=>{
 for(const lang of ['ar','en']){
  const env=environment('assets/program'+(lang==='en'?'-en':'')+'.js',lang,true),{c,document:d}=env,t=c.__test;
  for(let n=1;n<=30;n++){
   assert.equal(t.state.course.session,n);
   t.home();const start=d.getElementById('startSession');assert.ok(start);start.onclick();
   let turns=0;
   while(['train','assessment','repairAssessment'].includes(t.state.view)){
    assert.ok(++turns<40,'flow must progress');
    const assessmentEssay=lang==='ar'?d.getElementById('assessmentEssay'):null;
    if(assessmentEssay){assessmentEssay.value='المسألة: تحديد الموضوع القانوني. القاعدة: النص الذي ينظم الحكم. التطبيق: بما أن الواقعة تحقق الشرط. النتيجة: الأثر القانوني الذي يترتب.';await d.getElementById('submitAssessmentEssay').onclick();continue;}
    const textarea=d.getElementById(lang==='ar'?'freeAnswer':'essayAnswer');
    if(textarea){const task=t.state.queue[t.state.task];const topic=c.LEX_QUALITY.topic(n);textarea.value=topic['rule_'+lang]+' '+(lang==='ar'?'المسألة: تحديد المركز القانوني. القاعدة: النص القانوني المعتمد. التطبيق: بما أن الواقعة تحقق الشرط. النتيجة: يثبت الأثر القانوني.':'Issue: identify the legal position. Rule: the governing legal provision. Application: on these facts the condition applies. Conclusion: the legal effect follows.');await d.getElementById(lang==='ar'?'checkFree':'submitEssay').onclick();d.getElementById(lang==='ar'?'nextFree':'nextEssay').onclick();continue;}
    const select=d.querySelector(lang==='ar'?'[data-assess-orig="0"]':'[data-o="0"]')||d.querySelector('[data-orig="0"]');assert.ok(select,'a valid answer control exists');select.onclick();
    const conf=d.querySelector('[data-conf="3"]');if(conf){conf.onclick();continue;}
    const next=d.getElementById(lang==='ar'?'nextTask':'nextChoice');assert.ok(next);next.onclick();
   }
   if(n%5===0)assert.ok(t.state.course.weekResults[n/5].score>=80);
  }
  // A failed week assessment must not open the next week.
  const fail=environment('assets/program'+(lang==='en'?'-en':'')+'.js',lang,true);
  const ft=fail.c.__test,fd=fail.document;ft.state.course.session=5;ft.home();fd.getElementById('startSession').onclick();
  while(ft.state.view==='assessment'){
    const essay=fd.getElementById(lang==='ar'?'assessmentEssay':'essayAnswer');if(essay){essay.value='لا أتذكر القاعدة القانونية أو الحكم في الواقعة ولا يمكنني بناء الإجابة. I cannot remember the rule or the legal result and cannot structure this answer.';await fd.getElementById(lang==='ar'?'submitAssessmentEssay':'submitEssay').onclick();if(lang==='en')fd.getElementById('nextEssay').onclick();continue;}
    fd.querySelector(lang==='ar'?'[data-assess-orig="1"]':'[data-o="1"]').onclick();
    const conf=fd.querySelector('[data-conf="3"]');if(conf)conf.onclick();else fd.getElementById('nextChoice').onclick();
  }
  assert.equal(ft.state.course.weekResults[1].status,'repair');assert.equal(ft.state.course.session,5);ft.home();assert.equal(fd.querySelector('[data-week="2"]'),null);
  assert.ok(t.state.course.completedProgram);assert.equal(t.state.course.completed.length,30);
  assert.equal(t.state.view,'completion');
  console.log(lang+': 30 sessions and six gates with confirmed-review fixture PASS');
  // No provider: even eight correct choices plus a polished wrong essay cannot unlock a week.
  const pending=environment('assets/program'+(lang==='en'?'-en':'')+'.js',lang,true,false),pt=pending.c.__test,pd=pending.document;pt.state.course.session=5;pt.home();pd.getElementById('startSession').onclick();
  while(pt.state.view==='assessment'){
   const essay=pd.getElementById(lang==='ar'?'assessmentEssay':'essayAnswer');
   if(essay){essay.value='المسألة: الشخصية القانونية لكل طفل. القاعدة: الشخصية تبدأ بالموت. التطبيق: كل طفل يملك الأهلية الكاملة. النتيجة: الطفل كامل أهلية الأداء. Issue: personality begins at death. Rule: all children have full capacity. Application: every child has full capacity. Conclusion: full capacity follows.';await pd.getElementById(lang==='ar'?'submitAssessmentEssay':'submitEssay').onclick();if(lang==='en')pd.getElementById('nextEssay').onclick();continue;}
   pd.querySelector(lang==='ar'?'[data-assess-orig="0"]':'[data-o="0"]').onclick();const conf=pd.querySelector('[data-conf="3"]');if(conf)conf.onclick();else pd.getElementById('nextChoice').onclick();
  }
  assert.equal(pt.state.course.weekResults[1].status,'pending_review');assert.equal(pt.state.course.weekResults[1].score,null);assert.equal(pt.state.course.session,5);assert.ok(!pt.state.course.completedProgram);assert.ok(!pt.state.course.evidence.some(e=>e.dimension==='exam'));pt.home();assert.equal(pd.querySelector('[data-week="2"]'),null);
 // New entrants cannot start training before diagnosis.
  const blank=environment('assets/program'+(lang==='en'?'-en':'')+'.js',lang,false);blank.c.__test.home();assert.equal(blank.document.getElementById('startSession'),null);
  const gated=environment('assets/program'+(lang==='en'?'-en':'')+'.js',lang,true);gated.c.__test.state.course.session=4;gated.c.__test.home();assert.ok(!gated.document.querySelector('[data-week="2"]'));
 }
})().catch(e=>{console.error(e);process.exit(1);});
