'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const item={id:'synthetic-exam',dimension:'exam_execution',sources:['qa-civil-2004-art49'],title_ar:'واقعة تدريب اصطناعية',title_en:'Synthetic practice facts',prompt_ar:'الواقعة: عمره عشرون عامًا.\nالسؤال: بيّن أثر السن.',prompt_en:'Facts: The person is twenty.\nQuestion: Explain the significance of age.',rule_ar:'هذه قاعدة اصطناعية لاختبار الواجهة.',rule_en:'This is a synthetic rule for interface QA.',outcome_ar:'هذه نتيجة اصطناعية لاختبار الحفظ.',outcome_en:'This is a synthetic outcome for saving QA.',confirmed_history:[]};
const variants=[{...item,id:'synthetic-recall',dimension:'recall'},{...item,id:'synthetic-understanding',dimension:'understanding',comparison_ar:['عبارة أولى','عبارة ثانية'],comparison_en:['First statement','Second statement'],inaccurate_ar:['عبارة ثانية']},item];
const setup=`window.LEX_CONFIG={learningRoundsV1:true};window.__mode={};window.__events=[];window.__practice={};window.__attempts=0;window.__rpc=0;window.__items=${JSON.stringify(variants)};
window.__cloud={db:()=>({rpc:async()=>{window.__rpc++;return {data:{allowed:true,items:window.__items}};},from:table=>({insert:row=>({select:()=>({maybeSingle:async()=>{
if(table==='lex_learning_events'){if(window.__mode.eventFail)return {error:{code:'offline'}};if(window.__mode.holdHelp&&row.event_type==='support_opened')await new Promise(resolve=>{window.__releaseHelp=()=>{window.__releaseHelp=null;resolve();};});window.__events.push(row);return {data:{id:row.id}};}
if(table!=='lex_learning_practice')throw Error('Unexpected official write');window.__attempts++;if(window.__mode.holdSave)await new Promise(resolve=>{window.__releaseSave=()=>{window.__releaseSave=null;resolve();};});if(window.__practice[row.id])return {error:{code:'23505'}};window.__practice[row.id]=row;if(window.__mode.lostAck){window.__mode.lostAck=false;return {error:{code:'network'}};}return {data:{id:row.id,measurement_kind:'practice'}};}})}),select:()=>{const q={eq:()=>q,maybeSingle:async()=>{const r=Object.values(window.__practice)[0];return {data:r?{id:r.id,measurement_kind:'practice'}:null};}};return q;}})})};
window.__opts={cloud:window.__cloud,uid:'synthetic-only',session:1,lang:document.documentElement.lang,data:{allowed:true,completed:false,tasks:[{},{},{}],saved:[{}]},hasDraft:()=>!!document.querySelector('#officialDraft').value};`;
async function main(){
 const server=http.createServer((req,res)=>{
  const p=path.resolve(ROOT,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!p.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end();}
  try{const data=fs.readFileSync(p);res.setHeader('content-type',p.endsWith('.css')?'text/css':p.endsWith('.js')?'text/javascript':'text/html');res.end(data);}catch(_){res.writeHead(404);res.end();}
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']});
  for(const lang of ['ar','en'])for(const dark of [false,true]){
   const ctx=await browser.newContext({viewport:{width:lang==='ar'?390:1180,height:850},reducedMotion:'reduce'}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
   await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());if(u.origin!==base)return route.abort('blockedbyclient');
    if(u.pathname==='/rounds-qa.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="'+lang+'" dir="'+(lang==='ar'?'rtl':'ltr')+'"'+(dark?' data-learner-theme="dark"':' data-learner-theme="light"')+'><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/learner-experience.css"><link rel="stylesheet" href="/assets/study-coach.css"><link rel="stylesheet" href="/assets/legal-study.css"><link rel="stylesheet" href="/assets/learning-rounds.css"><link rel="stylesheet" href="/assets/comparison-cards.css"><link rel="stylesheet" href="/assets/legal-case-guide.css"><link rel="stylesheet" href="/assets/question-clarity.css"></head><body style="margin:0;padding:12px;box-sizing:border-box;font:16px/1.6 system-ui"><main id="studentTrainingApp"><textarea id="officialDraft"></textarea><div id="round"></div><div id="practice"></div></main><script>'+setup+'</script><script src="/assets/legal-study.js"></script><script src="/assets/legal-case-guide.js"></script><script src="/assets/study-coach.js"></script><script src="/assets/session-moments.js"></script><script src="/assets/learning-rounds.js"></script><script src="/assets/beginner-prompts.js"></script><script src="/assets/question-style.js"></script><script src="/assets/comparison-cards.js"></script></body></html>'});return route.continue();
   });
   await p.goto(base+'/rounds-qa.html');
   // Use the existing official renderers with synthetic prompts; no academic writes.
   await p.evaluate(()=>{
    const en=document.documentElement.lang==='en',lang=en?'en':'ar';
    const host=document.createElement('section');host.id='layoutFixture';host.className='stage stage--recall';document.querySelector('#studentTrainingApp').appendChild(host);
    const prompt=en?'Recall a synthetic rule.\n1. Write its elements.\n2. Give memory cues.\n3. Explain each cue.':'استدع قاعدة افتراضية.\n1. اكتب عناصرها.\n2. اذكر مفاتيح الحفظ.\n3. اشرح كل مفتاح.';
    host.innerHTML=LEX_QUESTION_STYLE.answerFields('adaptiveEssay',lang,4000,prompt);
   });
   assert.equal(await p.locator('#layoutFixture textarea').count(),3);
   assert.equal(await p.locator('#layoutFixture .lexAnswerPart').first().evaluate(e=>getComputedStyle(e).borderTopWidth),'0px');
   for(const [n,id] of ['adaptiveEssay','adaptiveEssayPart2','adaptiveEssayPart3'].entries())await p.locator('#'+id).fill('synthetic '+(n+1));
   assert.equal(await p.evaluate(()=>LEX_QUESTION_STYLE.collectAnswers(document.querySelector('#layoutFixture'),'adaptiveEssay',document.documentElement.lang,4000).text),'1. synthetic 1\n\n2. synthetic 2\n\n3. synthetic 3');
   await p.evaluate(()=>{
    const en=document.documentElement.lang==='en',host=document.querySelector('#layoutFixture');
    host.className='stage stage--understanding';
    const prompt=en?'Compare synthetic statements.\nReview each statement on its own:\nStatement one.\nStatement two.':'قارن عبارتين افتراضيتين.\nقيّم كل عبارة على حدة:\nالعبارة الأولى.\nالعبارة الثانية.';
    host.innerHTML=LEX_QUESTION_STYLE.render(prompt,document.documentElement.lang)+'<textarea id="adaptiveEssay"></textarea>';
    LEX_COMPARISON_CARDS.mount(host,document.documentElement.lang);
   });
   assert.equal(await p.locator('#layoutFixture .lexComparisonDeck .comparisonStatement').count(),2);
   assert.equal(await p.locator('#layoutFixture .lexComparisonDeck').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),lang==='ar'?1:2);
   await p.locator('#layoutFixture [data-lex-card-index="1"]').focus();
   await p.keyboard.press('Enter');
   await p.locator('#layoutFixture [data-lex-sort-target="accurate"]').focus();
   await p.keyboard.press('Enter');
   assert.equal(await p.locator('#layoutFixture [data-lex-card-index="1"]').getAttribute('data-lex-choice'),'accurate');
   await p.evaluate(()=>{
    const en=document.documentElement.lang==='en',host=document.querySelector('#layoutFixture');host.className='stage stage--exam_execution';
    const prompt=en?'Facts: Synthetic facts. What is the question?\nIssue: State the issue.\nRule: State the rule.\nApplication: Apply it.\nConclusion: Conclude.':'الواقعة: واقعة افتراضية. ما السؤال؟\nالمسألة: اكتب المسألة.\nالقاعدة: اكتب القاعدة.\nالتطبيق: طبقها.\nالنتيجة: اذكر النتيجة.';
    LEX_LEGAL_CASE_GUIDE.mount(host,{prompt,language:document.documentElement.lang,onSubmit:()=>{}});
   });
   assert.equal(await p.locator('#layoutFixture .caseFacts').count(),1);
   assert.equal(await p.locator('#layoutFixture .legalCaseGuide').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),lang==='ar'?1:2);
   await p.locator('#legalCasePart').fill('synthetic issue');await p.locator('#caseNext').click();await p.locator('#caseBack').click();
   assert.equal(await p.locator('#legalCasePart').inputValue(),'synthetic issue');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   await p.evaluate(()=>document.querySelector('#layoutFixture').remove());

   await p.evaluate(()=>{LEX_STUDY_COACH.init({learnerId:__opts.uid,language:__opts.lang});LEX_LEARNING_ROUNDS.mountRound(document.querySelector('#round'),__opts);LEX_LEARNING_ROUNDS.mountPractice(document.querySelector('#practice'),__opts);});
   assert.equal(await p.locator('#practice details').count(),0);assert.equal(await p.evaluate(()=>__rpc),0);
   await p.locator('#officialDraft').fill('unsaved synthetic answer');await p.locator('[data-round-pause]').click();assert.equal(await p.locator('.roundPause').isVisible(),false);assert.ok((await p.locator('.roundStatus').innerText()).length>0);
   await p.locator('[data-round-break]').click();assert.equal(await p.locator('#llCoachOverlay').isVisible(),true);await p.locator('[data-action=continue]').click();assert.equal(await p.locator('#officialDraft').inputValue(),'unsaved synthetic answer');
   assert.equal(await p.evaluate(()=>LEX_STUDY_COACH.offerAtBoundary({learnerId:__opts.uid})),false);
   await p.locator('#officialDraft').fill('');await p.locator('[data-round-pause]').click();assert.equal(await p.locator('.roundPause').isVisible(),true);
   await p.evaluate(()=>{__opts.data.completed=true;__items.push({...__items[0],id:'synthetic-fourth',title_ar:'الموضوع الرابع',title_en:'Fourth review topic'});LEX_LEARNING_ROUNDS.mountPractice(document.querySelector('#practice'),__opts);});
   assert.equal(await p.evaluate(()=>__rpc),0);await p.locator('#practice>details>summary').click();await p.waitForSelector('[data-round-kind]');assert.equal(await p.evaluate(()=>__rpc),1);
   assert.equal(await p.locator('[data-round-kind]').count(),6);assert.ok((await p.locator('[data-round-kind="5"]').innerText()).includes(lang==='ar'?'الموضوع الرابع':'Fourth review topic'));
   await p.locator('[data-round-kind="5"]').click();assert.equal(await p.locator('.roundPracticeBody h3').innerText(),lang==='ar'?'الموضوع الرابع':'Fourth review topic');
   await p.locator('[data-round-kind="4"]').click();assert.equal(await p.locator('[data-round-role]').count(),4);await p.locator('[data-round-role=professor]').click();assert.ok((await p.locator('.roundTaskPrompt').innerText()).includes(lang==='ar'?'أستاذ':'professor'));
   await p.evaluate(()=>__mode.eventFail=true);await p.locator('[data-round-help]').click();assert.equal(await p.locator('.roundModel').count(),0);
   await p.evaluate(()=>{__mode.eventFail=false;__mode.holdHelp=true;});await p.locator('[data-round-help]').click();await p.waitForFunction(()=>typeof __releaseHelp==='function');
   await p.locator('#roundPracticeAnswer').fill('draft typed while help is pending');
   await p.evaluate(()=>{__mode.holdHelp=false;__releaseHelp();});await p.waitForSelector('.roundModel');
   assert.equal(await p.locator('#roundPracticeAnswer').inputValue(),'draft typed while help is pending','late help must preserve new typing');
   await p.locator('#roundPracticeAnswer').fill('');await p.evaluate(()=>__mode.holdHelp=true);await p.locator('[data-round-help]').click();await p.waitForFunction(()=>typeof __releaseHelp==='function');
   assert.equal(await p.locator('[data-round-kind="0"]').isEnabled(),false,'task must stay fixed during help');assert.equal(await p.locator('[data-round-role=judge]').isEnabled(),false,'role must stay fixed during help');
   await p.evaluate(()=>{document.querySelector('[data-round-kind="0"]').click();__mode.holdHelp=false;__releaseHelp();});await p.waitForFunction(()=>!document.querySelector('[data-round-help]').disabled);
   assert.equal(await p.locator('[data-round-role=professor]').getAttribute('aria-pressed'),'true');assert.equal(await p.evaluate(()=>__events.filter(x=>x.event_type==='support_opened').at(-1).item_id),'synthetic-exam');
   await p.locator('#roundPracticeAnswer').fill('synthetic assisted draft');await p.locator('[data-round-kind="0"]').click();assert.equal(await p.locator('#roundPracticeAnswer').inputValue(),'synthetic assisted draft');
   await p.evaluate(()=>{__mode.lostAck=true;__mode.holdSave=true;});await p.locator('[data-round-save]').click();await p.waitForFunction(()=>typeof __releaseSave==='function');
   assert.equal(await p.locator('#roundPracticeAnswer').isEnabled(),false,'the saved answer must stay fixed during saving');assert.equal(await p.locator('[data-round-kind="0"]').isEnabled(),false);assert.equal(await p.locator('[data-round-role=judge]').isEnabled(),false);
   await p.evaluate(()=>{__mode.holdSave=false;__releaseSave();});await p.waitForFunction(()=>!document.querySelector('[data-round-save]').disabled);
   assert.equal(await p.locator('#roundPracticeAnswer').inputValue(),'synthetic assisted draft');assert.equal(await p.locator('#roundPracticeAnswer').isEnabled(),true);await p.locator('[data-round-save]').click();
   await p.waitForFunction(()=>document.querySelector('#practice b')&&document.querySelector('#practice b').textContent.length>0);
   assert.equal(await p.evaluate(()=>Object.keys(__practice).length),1);assert.equal(await p.evaluate(()=>Object.values(__practice)[0].assisted),true);assert.equal(await p.evaluate(()=>Object.values(__practice)[0].support_level),'example');
   await p.locator('#officialDraft').focus();assert.equal(await p.evaluate(()=>LEX_SESSION_MOMENTS.show(1,__opts.lang,'synthetic:'+__opts.lang+':'+document.documentElement.dataset.learnerTheme)),true);assert.equal(await p.locator('#officialDraft').evaluate(e=>e===document.activeElement),true);assert.equal(await p.locator('.sessionMomentNotice button').count(),0);
   assert.equal(await p.evaluate(()=>LEX_SESSION_MOMENTS.show(1,__opts.lang,'synthetic:'+__opts.lang+':'+document.documentElement.dataset.learnerTheme)),false);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.deepEqual(errors,[]);
   await ctx.close();
  }
  console.log('PASS: AR/EN light/dark; every review topic accessible; saved-only rounds; draft safety during delayed help; task and role fixed during requests; frozen save snapshot; explicit breaks; optional careers; cumulative assistance; lost-ack idempotency; quiet focus-safe notice; no overflow or external network.');
 }finally{server.closeAllConnections();server.close();if(browser)await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
