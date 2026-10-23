const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const study=require('../assets/legal-study.js');
const questions=require('../assets/official-diagnostic.js').QUESTIONS;
assert.equal(Object.keys(study.text).length,25);
for(const lang of ['ar','en']){
 const html=study.render(['qa-civil-2004-art40','qa-civil-2004-art39','qa-civil-2004-art40'],lang);
 assert.equal((html.match(/<figure /g)||[]).length,2,'deduplicate related articles');
 assert.ok(html.indexOf("data-article='39'")<html.indexOf("data-article='40'"));
 for(const block of html.matchAll(/<figure[^>]*>(.*?)<\/figure>/gs))assert.ok(block[1].indexOf('</blockquote>')<block[1].indexOf('<figcaption>'),'the article number follows its own text');
 assert.ok(html.includes('تسري في شأن المفقود'),'show the complete article, not the short grading excerpt');
 assert.ok(html.includes("lang='ar' dir='rtl'"),'original Arabic remains Arabic in English UI');
}
assert.equal(study.render(['bad-source','qa-civil-2004-art999'],'ar'),'');
function host(){
 const nodes={},el={querySelector:s=>nodes[s.slice(1)]||null};
 Object.defineProperty(el,'innerHTML',{get(){return this.html||'';},set(v){this.html=v;for(const k of Object.keys(nodes))delete nodes[k];for(const m of v.matchAll(/id='([^']+)'/g))nodes[m[1]]={value:'',onclick:null,disabled:false,textContent:''};}});
 return {el,nodes};
}
async function diagnostic(lang,resume=false){
 const {el,nodes}=host(),calls=[];
 const draft=resume?[{question_id:'q39r',selected:0}]:[];
 const cloud={profile:async()=>({display_name:'Test learner'}),studentLifecycleRpc:async action=>{calls.push(action);return {status:'in_progress',draft};}};
 const win={LEX_LEGAL_STUDY:study,LEX_CLOUD:cloud,LEX_OFFICIAL_DIAGNOSTIC:{identity:async()=> 'student',academicItemsApproved:async()=>true,QUESTIONS:questions},URLSearchParams,location:{search:'?lang='+lang},console,
  document:{getElementById:id=>id==='officialDiagnostic'?el:nodes[id],querySelector:()=>null}};win.window=win;
 vm.runInNewContext(fs.readFileSync('assets/server-diagnostic.js','utf8'),win);await win.LEX_SERVER_DIAGNOSTIC.mount();
 if(resume){assert.equal(nodes.beginLegalQuestions,undefined);assert.ok(nodes.serverNext);return;}
 assert.ok(nodes.beginLegalQuestions);assert.equal(nodes.serverNext,undefined);
 assert.equal((el.html.match(/<figure /g)||[]).length,6);
 await nodes.beginLegalQuestions.onclick();
 assert.ok(nodes.serverNext);assert.equal(nodes.beginLegalQuestions,undefined);assert.ok(!el.html.includes('legalStudyArticle'));
 assert.deepEqual(calls,['status'],'reading is not submitted as an assessment answer');
}
async function training(session,lang,resume=false){
 const {el,nodes}=host(),calls=[],article=39+(session-1)%25;
 const tasks=['recall','understanding','exam_execution'].map(d=>({id:d,dimension:d,sources:['qa-civil-2004-art'+article],prompt_ar:'اشرح القاعدة القانونية.',prompt_en:'Explain the legal rule.'}));
 const saved=resume?[{item_id:'recall',dimension:'recall',evaluation:{},answer_text:'Saved answer'}]:[];
 const cloud={studentLifecycleRpc:async(action,args)=>{calls.push(action);return action==='trainingOverview'?{allowed:true,unlocked:session,completed_count:session-1}:{allowed:true,tasks,saved,completed:false};}};
 const win={document:{getElementById:()=>el},LEX_LEGAL_STUDY:study,LEX_CLOUD:cloud,LEX_OFFICIAL_DIAGNOSTIC:{identity:async()=> 'student'},URLSearchParams,location:{search:'?lang='+lang+'&session='+session},console};win.window=win;
 vm.runInNewContext(fs.readFileSync('assets/student-path.js','utf8'),win);await win.LEX_STUDENT_PATH.mount();
 if(resume){assert.equal(nodes.beginLegalQuestions,undefined);assert.ok(nodes.adaptiveSubmit);return;}
 assert.ok(nodes.beginLegalQuestions);assert.equal(nodes.adaptiveSubmit,undefined);assert.equal((el.html.match(/<figure /g)||[]).length,1);
 assert.ok(el.html.includes("data-article='"+article+"'"));await nodes.beginLegalQuestions.onclick();
 assert.ok(nodes.adaptiveSubmit);assert.ok(!el.html.includes('legalStudyArticle'));assert.ok(!calls.includes('trainingSubmit'));
}
(async()=>{
 for(const lang of ['ar','en']){await diagnostic(lang);await diagnostic(lang,true);for(let s=1;s<=30;s++)await training(s,lang);await training(5,lang,true);}
 for(const p of ['diagnostic.html','student-path.html']){const page=fs.readFileSync(p,'utf8');assert.ok(page.includes('assets/legal-study.js'));assert.ok(page.includes('assets/legal-study.css'));}
 const build=fs.readFileSync('scripts/build-public.js','utf8');assert.ok(build.includes('"legal-study.js"')&&build.includes('"legal-study.css"'));
 console.log('Legal reading before questions: AR/EN, 25 full provisions, article numbers after text, diagnostic, all 30 sessions, hidden text and partial resume PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});

