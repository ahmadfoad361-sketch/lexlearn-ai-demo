#!/usr/bin/env node
'use strict';
// Compatibility filename: verifies the shared training that replaces the retired pilot.
// All identities and responses are synthetic. Every network request is intercepted.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),Q=require('../assets/learning-quality.js');
const root=path.resolve(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
const html=read('student-path.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,t=>{const m=t.match(/href="([^"?]+)(?:\?[^"]*)?"/);return m&&m[1].endsWith('.css')?'<style>'+read(m[1])+'</style>':'';});
const cloud=`window.fixture={tasks:[],name:'Fixture learner'};
window.LEX_CLOUD={profile:async()=>({id:'fixture-only',role:'student',active:true,display_name:fixture.name}),getConsent:async(v,k)=>k!=='external_ai_grading',
db:()=>({auth:{getUser:async()=>({data:{user:{id:'fixture-only'}}})},from:table=>{const result={data:table==='enrollments'?{course_id:'qa-qu-lawc101-rights',status:'active'}:[]};const q={select:()=>q,eq:()=>q,gte:()=>q,lte:()=>q,order:()=>q,limit:async()=>result,maybeSingle:async()=>result};return q;}}),
studentLifecycleRpc:async action=>action==='trainingOverview'?{allowed:true,unlocked:30,completed_count:0}:{allowed:true,tasks:fixture.tasks,saved:[],completed:false}};`;
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']});let views=0;
try{for(const lang of ['ar','en'])for(const width of [390,1280])for(const theme of ['light','dark']){
 const context=await browser.newContext({viewport:{width,height:900}});await context.route('**/*',r=>r.request().url().startsWith('https://unified-fixture.invalid/')?r.fulfill({status:200,contentType:'text/html',body:html}):r.abort());
 const page=await context.newPage();await page.goto('https://unified-fixture.invalid/student-path.html?lang='+lang);
 await page.evaluate(({lang,theme})=>{document.documentElement.lang=lang;document.documentElement.dir=lang==='en'?'ltr':'rtl';localStorage.setItem('lexlearn_learner_theme',theme);},{lang,theme});
 await page.addScriptTag({content:cloud});for(const p of ['learner-theme','legal-study','beginner-prompts','question-style','legal-case-guide','official-diagnostic','student-path'])await page.addScriptTag({content:read('assets/'+p+'.js')});
 for(const dim of ['recall','understanding','exam']){
  const a=dim==='exam'?Q.examTask(1,'ar'):Q.makeEssay(Q.topic(1),'ar',dim),e=dim==='exam'?Q.examTask(1,'en'):Q.makeEssay(Q.topic(1),'en',dim);
  const task={id:'rights-v1-s1-'+dim,dimension:dim==='exam'?'exam_execution':dim,prompt_ar:a.originalPrompt,prompt_en:e.originalPrompt,title_ar:a.title,title_en:e.title,sources:['qa-civil-2004-art39','qa-civil-2004-art40']};
  let expected=null;for(const name of ['Sarah fixture','Other learner fixture']){
   await page.evaluate(({task,name})=>{fixture={tasks:[task],name};return LEX_STUDENT_PATH.mount();},{task,name});
   if(await page.locator('#beginLegalQuestions').count())await page.locator('#beginLegalQuestions').click();
   await page.locator('#currentPractice').waitFor();const text=await page.locator('#studentTrainingApp').innerText();assert.ok(!/researchPilotSwitch|researchShowOriginal/.test(await page.content()));
   assert.ok(!(await page.locator('#researchPilotWorkspace').count()));
   const prompt=await page.locator(dim==='exam'?'#legalExamGuide':'.questionSteps, .prompt').last().innerText();if(expected!==null)assert.equal(prompt,expected);expected=prompt;
   assert.ok(text.includes(lang==='ar'?'القانون المدني':'Civil Code'));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'horizontal overflow');
   assert.equal(await page.evaluate(()=>document.documentElement.getAttribute('data-learner-theme')),theme);views++;
  }
 }
 await context.close();
}console.log(JSON.stringify({passed:true,sharedTrainingViews:views,identities:'synthetic Sarah and other learner',languages:['ar','en'],themes:['light','dark'],viewports:[390,1280],realStudentAccess:false,paidRequests:0}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
