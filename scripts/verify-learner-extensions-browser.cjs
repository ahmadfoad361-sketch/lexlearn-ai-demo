#!/usr/bin/env node
"use strict";
/* Synthetic Chromium QA of learner add-ons. External network blocked.
 * No login, grading, real student record, database write, or provider API request.
 */
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const BASE=process.env.SHOWCASE_QA_URL||"http://127.0.0.1:8765";
const CLOUD_STUB=`
window.__LEX_QA_WRITES=[];
window.__LEX_QA_COMPLETED=2;
window.LEX_CLOUD={
 requireStudent:async()=>({id:"browser-synthetic-user"}),
 db:()=>({
  from:(table)=>({
   select(){return this},
   eq(){return this},
   lt(){return this},
   not(){return this},
   order(){return table==="lex_career_trials"?Promise.resolve({data:[],error:null}):this},
   maybeSingle(){
    return Promise.resolve({error:null,data:window.__LEX_QA_COMPLETED===2?{
     session_number:2,completed_at:"2026-11-09T10:00:00Z",
     tasks_json:[
      {id:"case-test-2",dimension:"exam_execution",title_ar:"الواقعة",prompt_ar:"شخص أقام دعوى تتعلق بشخصية مولود حي. حدد القاعدة والنتيجة.",prompt_en:"A claim concerns the legal personality of a child born alive. Explain the rule and outcome.",sources:["qa-civil-2004-art39"]},
      {id:"concept-test-2",dimension:"understanding",title_ar:"شرح القاعدة",prompt_ar:"اشرح متى تبدأ الشخصية القانونية وفق المادة 39.",prompt_en:"Explain when legal personality begins under Article 39.",sources:["qa-civil-2004-art39"]}
     ]
    }:null});
   },
   limit(){
    return Promise.resolve({error:null,data:table==="lex_retrieval_checks"?[]:[
     {session_number:1,completed_at:"2026-11-09T09:00:00Z",tasks_json:[
      {id:"past-recall",dimension:"recall",prompt_ar:"متى تبدأ شخصية الإنسان قانونيًا؟",prompt_en:"When does legal personality begin?",sources:["qa-civil-2004-art39"]}
     ]}
    ]});
   },
   insert:async(row)=>{window.__LEX_QA_WRITES.push({table,row});return {error:null}}
  })
 })
};
`;
async function run(){
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const lang of ["ar","en"]){
   const context=await browser.newContext({viewport:{width:390,height:844},locale:lang==="ar"?"ar-EG":"en-US"});
   await context.addInitScript(()=>{window.LEX_CONFIG={learningExtensionsV1:true};});
   await context.route("**/*",async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==new URL(BASE).origin)return route.abort("blockedbyclient");
    if(url.pathname==="/assets/cloud-data.js")return route.fulfill({status:200,contentType:"text/javascript",body:CLOUD_STUB});
    return route.continue();
   });
   const page=await context.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(String(e.message||e)));
   await page.goto(BASE+"/student-future.html?lang="+lang+"&milestone=2",{waitUntil:"domcontentloaded"});
   const professor=page.locator('[data-lex-role="professor"]');
   await professor.waitFor({timeout:15000});
   assert.equal(await page.locator('[data-lex-role]').count(),3,"exactly three profession roles");
   assert.equal(await page.locator("html").getAttribute("dir"),lang==="ar"?"rtl":"ltr","language direction");
   assert.equal(await page.locator("#lexCareerAnswer").inputValue(),"","answer starts blank");
   await professor.click();
   await page.locator("#lexCareerAnswer").fill(lang==="ar"
    ?"تبدأ الشخصية القانونية بتمام الولادة حيا وفق المادة 39 وأشرح الفرق بمثال قانوني يوضح الأثر."
    :"Legal personality begins on live birth under Article 39, and I explain the effect through a legal example.");
   await page.locator("#lexCareerSave").click();
   await page.getByRole("heading",{name:lang==="ar"?/أول خطوة في مهنتك/:/Your professional journey begins/}).waitFor();
   let writes=await page.evaluate(()=>window.__LEX_QA_WRITES);
   assert.equal(writes.length,1,"one mock save");
   assert.equal(writes[0].table,"lex_career_trials");
   assert.equal(writes[0].row.role_choice,"professor");
   assert.equal(writes[0].row.grading_status,undefined,"client must not forge an AI grade");
   assert.equal(writes[0].row.source_item_id,"concept-test-2");
   assert.equal(writes[0].row.input_mode,"typed");
   assert.equal(await page.locator("body").evaluate(e=>e.scrollWidth<=innerWidth+1),true,"mobile page has no horizontal overflow");
   
   // Direct URL access before completing milestone 4 stays locked.
   await page.goto(BASE+"/student-future.html?lang="+lang+"&milestone=4",{waitUntil:"domcontentloaded"});
   await page.getByText(lang==="ar"?/يفتح بعد إكمال الجلسة رقم 4/:/Unlocks after completing session 4/).waitFor();
   assert.equal(await page.locator("#lexCareerAnswer").count(),0);
   
   // Run the optional spaced-retrieval UI after a completed even-numbered session.
   await page.goto(BASE+"/student-future.html?lang="+lang+"&milestone=2",{waitUntil:"domcontentloaded"});
   await page.locator("#lexCareerAnswer").waitFor();
   await page.evaluate(async lang=>{
    const slot=document.createElement("section");slot.id="syntheticReview";document.querySelector("main").appendChild(slot);
    await window.LEX_LEARNER_EXTENSIONS.mountReview(slot,{
     cloud:window.LEX_CLOUD,uid:"browser-synthetic-user",session:2,lang
    });
   },lang);
   await page.locator("#lexRecallAnswer").waitFor();
   assert.equal(await page.locator("#lexRecallAnswer").inputValue(),"");
   await page.locator("#lexRecallAnswer").fill(lang==="ar"
    ?"تبدأ شخصية الإنسان قانونيا بتمام ولادته حيا وفق المادة التاسعة والثلاثين."
    :"Legal personality begins at live birth under Article 39 of the Qatari Civil Code.");
   await page.locator("#lexRecallSave").click();
   await page.locator("#syntheticReview .lexExtensionCard").getByRole("heading").waitFor();
   writes=await page.evaluate(()=>window.__LEX_QA_WRITES);
   assert.equal(writes.length,1);
   assert.equal(writes[0].table,"lex_retrieval_checks");
   assert.equal(writes[0].row.source_session,1);
   assert.equal(writes[0].row.after_session,2);
   if(errors.length)throw Error(lang+" browser exceptions: "+errors.join(" | "));
   console.log("PASS "+lang+": mobile 390px, 3 professions, saving mock response, locked milestone, optional retrieval, network blocked");
   await context.close();
  }
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
