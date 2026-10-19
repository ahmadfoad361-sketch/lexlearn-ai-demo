/* Actual Chromium DOM test with intercepted test-only RPC. NOT hosted Supabase E2E. */
const {chromium}=require("playwright-core");
const fs=require("node:fs"),assert=require("node:assert/strict");
const base="http://127.0.0.1:18765/";
const chrome=[process.env.CHROME_BIN,"/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium"].find(x=>x&&fs.existsSync(x));
const UID="10000000-0000-4000-8000-000000000001";
function fakeCloud(root){
 const uid="10000000-0000-4000-8000-000000000001";
 const mode=root.localStorage.getItem("fake_adaptive_mode")||"recall-led";
 const byMode={"recall-led":["understanding","exam_execution","recall"],
    "understanding-led":["recall","understanding","exam_execution"],
    foundation:["understanding","recall","exam_execution"]};
 const dims=byMode[mode]||byMode.foundation;
 const items={understanding:"rights-v1-s1-understanding",recall:"rights-v1-s1-recall",exam_execution:"rights-v1-s1-exam"};
 function saved(){try{return JSON.parse(root.localStorage.getItem("fixture_responses")||"[]");}catch(_){return [];}}
 function view(){
  const s=saved();
  return {allowed:true,level:1,plan_mode:mode,
   reason_ar:"ترتيب المهام متكيف مع التشخيص المحفوظ.",reason_en:"The order follows the saved diagnostic.",
   status:s.length===3?"practice_completed_pending_review":"in_progress",
   tasks:dims.map((d,i)=>({id:items[d],dimension:d,title_ar:"سؤال قانوني "+d,title_en:"Legal question "+d,
     prompt_ar:"اذكر القاعدة القانونية وفسرها وطبقها على الواقعة للوصول إلى نتيجة واضحة.",
     prompt_en:"State and explain the legal rule and apply it to the facts to reach a conclusion."})),
   saved:s,review_status:"not_auto_graded"};
 }
 root.LEX_CLOUD={
  isConfigured:()=>true,profile:async()=>({id:uid,role:"student",active:true,display_name:"Verified Fixture Student"}),
  getConsent:async()=>true,
  db:()=>({auth:{getUser:async()=>({data:{user:{id:uid}},error:null})},
    from:()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{course_id:"qa-qu-lawc101-rights",status:"active"},error:null})};return q;}}),
  studentLifecycleRpc:async(action,p)=>{
    if(action==="status")return {status:"completed",
       result:{source:"server_finalized_diagnostic",student_id:uid,profileType:mode,
         metrics:{recall:null,recognition:mode==="recall-led"?100:0,understanding:mode==="understanding-led"?100:0,application:null}},
       attempt_id:"10000000-0000-4000-8000-000000000099",
       training_plan:{mode:mode,weakest:mode==="recall-led"?"understanding":"recall",
         firstTasks:dims,reason_ar:"تكيّف مع التشخيص",reason_en:"Adapts to diagnostic"}};
    if(action==="level")return {allowed:true,level:1};
    if(action==="firstLevel")return view();
    if(action==="submitLevelOne"){
      const s=saved();
      if(!s.some(x=>x.item_id===p.itemId)){
        s.push({item_id:p.itemId,answer_text:p.answer,review_status:"pending_human_review"});
        root.localStorage.setItem("fixture_responses",JSON.stringify(s));
      }
      return view();
    }
    throw Error("Unexpected fixture action: "+action);
  },
  signOut:async()=>true
 };
}
(async()=>{
 assert.ok(chrome,"Chromium is required");
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:["--no-sandbox","--disable-dev-shm-usage"]});
 const checks=[];
 try{
  for(const lang of ["ar","en"])for(const mode of ["recall-led","understanding-led","foundation"]){
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.addInitScript(({uid,mode})=>{
      window.localStorage.setItem("lexlearn_student_session",JSON.stringify({cloud:true,studentId:uid}));
      window.localStorage.setItem("fake_adaptive_mode",mode);
   },{uid:UID,mode});
   await page.route("**/assets/cloud-data.js**",r=>r.fulfill({status:200,contentType:"application/javascript",body:"("+fakeCloud.toString()+")(window);"}));
   const name="program"+(lang==="en"?"-en":"")+".html";
   await page.goto(base+name+"?country=qa&subject=rights",{waitUntil:"domcontentloaded",timeout:35000});
   const answer=page.locator("#officialEssayAnswer");
   await answer.waitFor({timeout:18000});
   const first=await page.locator("#officialLevelMount h2").last().innerText();
   const expected=mode==="understanding-led"?"recall":"understanding";
   assert.ok(first.includes(expected),"Unexpected tailored first task: "+first);
   await answer.fill("The law sets clear conditions and I apply them to the facts.");
   await page.locator("#officialSaveAnswer").click();
   await page.getByText("2 / 3").last().waitFor({timeout:16000});
   await page.reload({waitUntil:"domcontentloaded"});
   await answer.waitFor({timeout:18000});
   assert.ok((await page.locator("#officialLevelMount").innerText()).includes("2 / 3"),"Refresh must resume at task two");
   for(let task=2;task<=3;task++){
     await answer.fill("State the legal issue, rule, application and final legal conclusion.");
     await page.locator("#officialSaveAnswer").click();
     if(task===2)await page.getByText("3 / 3").last().waitFor({timeout:16000});
   }
   await page.getByText(lang==="ar"?"اكتملت التمارين الثلاثة":"All three tasks submitted").waitFor({timeout:16000});
   assert.equal(errors.length,0,errors.join("; "));
   checks.push({lang,mode,completedThree:true,reloaded:true});
   await context.close();
  }
  console.log("PASS: staged Chrome first-level interaction (RPC intercepted, not real server): "+JSON.stringify(checks));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
