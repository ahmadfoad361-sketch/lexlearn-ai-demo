const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('../assets/showcase-recall.js');
for(const name of ['showcase.html','showcase-en.html'])assert.ok(fs.readFileSync(name,'utf8').includes('rel="preload" as="image" href="assets/analysis-faces.svg"'),'load portraits before analysis so cold-cache results cannot skip the illustration');
async function run(lang,answer,expected,serverNull=false){
 const nodes=new Map(),store=new Map();let release;
 const app={_html:'',set innerHTML(v){this._html=v;nodes.clear();for(const m of v.matchAll(/id="([^"]+)"/g))nodes.set(m[1],{value:'',textContent:'',onclick:null});},get innerHTML(){return this._html;}};
 const document={documentElement:{lang},getElementById:id=>id==='showcaseApp'?app:nodes.get(id),querySelectorAll:()=>[],createElement:()=>({})};
 const cloud={isConfigured:()=>true,db:()=>({auth:{getSession:async()=>({data:{session:serverNull?{}:null}}),signInAnonymously:async()=>({error:{code:'anonymous_provider_disabled'},data:{user:null}})},functions:{invoke:async()=>({data:{received:true,submission_id:'server-fixture',recall_score:null,choice_indicators:{understanding:100},details:{criteria:[],reason:'ai_uncertain'},feedback:'Awaiting review'}})}})};
 const context={document,window:{LEX_QUALITY:{},LEX_RECALL:R,LEX_CLOUD:cloud,LEX_SHOWCASE_CYCLE:{recommend:(r,u)=>r===null?'balanced':r<u?'recall':'balanced'}},LEX_CLOUD:cloud,sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},crypto:{randomUUID:()=> '00000000-0000-4000-8000-000000000001'},Date,console,
  setTimeout:(fn,ms)=>{if(ms===1400)release=fn;return ms;},clearTimeout:()=>{}};
 const src=fs.readFileSync('assets/showcase'+(lang==='en'?'-en':'')+'.js','utf8').replace(/\}\)\(\);\s*$/,`window.__run=function(a){free=a;requestId='00000000-0000-4000-8000-000000000001';answers=['recall','recall','understanding','understanding','understanding','understanding'].map(type=>({type,selected:0,correct:true}));return result();};window.__state=function(){return lastDemo;};})();`);
 vm.runInNewContext(src,context);
 const pending=context.window.__run(answer);
 assert.match(app.innerHTML,/analysis-faces\.svg/,'faces must appear before results');
 assert.match(app.innerHTML,/aria-busy="true"/);
 await new Promise(setImmediate);
 assert.match(app.innerHTML,/analysisFaces/,'even immediate auth errors must not skip the visible analysis state');
 release();await pending;
 const state=context.window.__state();
 assert.equal(state.grade.recall_score,expected);
 assert.equal(state.summary.metrics.recall,expected,'local demo estimate must survive delivery failure');
 assert.equal(state.receipt.received,serverNull);
 if(!serverNull){assert.match(app.innerHTML,/demoDeliveryWarning/);assert.match(app.innerHTML,/local and provisional|محلي ومبدئي/);assert.ok(nodes.has('retrySave'));}
 const recallCard=app.innerHTML.match(/<section class="skillCard skill-recall"[\s\S]*?<\/section>/)[0];
 if(expected===null)assert.ok(!recallCard.includes('aria-valuenow='),'unknown meaning must not become a fabricated zero');
 else assert.ok(recallCard.includes('aria-valuenow="'+expected+'"'),'display real rule-coverage score');
 assert.ok(!('submission_id' in state.receipt)||serverNull,'an offline result is never a receipt');
}
(async()=>{
 const ar='تبدأ الشخصية القانونية بالولادة حية، وتنتهي بالموت، وللجنين حقوق لا تحتاج قبولًا، بشرط ولادته حيا.';
 const en='Legal personality begins at live birth and ends at death. An unborn child has rights that require no acceptance, provided that the child is born alive.';
 for(const [lang,text] of [['ar',ar],['en',en]]){
  await run(lang,text,100);await run(lang,lang==='ar'?'لا أتذكر':'I do not remember',null);await run(lang,text,null,true);
 }
 await run('ar','الشخصية القانونية تثبت بولادة الجنين حيا',29);
 console.log('Demo loading, local provisional score, save failures and authoritative server abstention: PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
