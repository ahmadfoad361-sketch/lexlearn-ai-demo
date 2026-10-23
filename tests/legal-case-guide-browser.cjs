const {chromium}=require("playwright-core");
const fs=require("node:fs"),assert=require("node:assert/strict"),path=require("node:path");
const CHROME=[process.env.CHROME_BIN,"/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium"].find(p=>p&&fs.existsSync(p));
const PROMPT_AR="الواقعة: وجد سبب حق للحمل لا يحتاج إلى قبول، ثم تمت ولادته حيًا. ما أثر الولادة على الحق المقصود؟\nالمسألة: اكتب السؤال القانوني المطلوب حسمه في الواقعة، بجملة واحدة.\nالقاعدة: اذكر القاعدة أو الشرط القانوني الذي ستعتمد عليه.\nالتطبيق: اربط الوقائع بالقاعدة.\nالنتيجة: أجب بوضوح.";
const PROMPT_EN="Facts: A prenatal right requiring no acceptance arises, and the child is later born alive. What is the legal effect?\nIssue: state the legal question.\nRule: identify the relevant condition.\nApplication: connect the case facts to that condition.\nConclusion: answer the question with a brief reason.";
(async()=>{
 assert.ok(CHROME,"A real Chrome browser is required");
 const browser=await chromium.launch({headless:true,executablePath:CHROME,args:["--no-sandbox","--disable-dev-shm-usage"]});
 try{
  for(const language of ["ar","en"])for(const mobile of [false,true]){
   const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900}});
   const page=await ctx.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.goto((process.env.BASE_URL||"http://127.0.0.1:18765/")+".nojekyll",{waitUntil:"domcontentloaded"});
   await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main><div id="studentTrainingApp"></div></main></body></html>');
   await page.addStyleTag({path:path.resolve("assets/legal-case-guide.css")});
   await page.addScriptTag({path:path.resolve("assets/legal-case-guide.js")});
   await page.evaluate(({language,promptAr,promptEn})=>{
    document.documentElement.lang=language;document.documentElement.dir=language==="en"?"ltr":"rtl";
    const session={id:"rights-v1-s1-exam",dimension:"exam_execution",title_ar:"بداية الشخصية القانونية",title_en:"Beginning of legal personality",prompt_ar:promptAr,prompt_en:promptEn};
    window.__received=null;window.__saved=[];
    window.LEX_OFFICIAL_DIAGNOSTIC={identity:async()=> "browser-fixture"};
    window.LEX_CLOUD={
     db:()=>({from:()=>({select:()=>({eq:()=>({eq:()=>({gte:()=>({lte:()=>({order:()=>({limit:async()=>({data:[],error:null})})})})})})})})}),
     studentLifecycleRpc:async(action,args)=>{
      if(action==="trainingOverview")return {allowed:true,unlocked:1,completed_count:0};
      if(action==="trainingOpen")return {allowed:true,session:1,completed:window.__saved.length>0,tasks:[session],saved:window.__saved,weakest:"exam_execution"};
      if(action==="trainingSubmit"){
       window.__received=args.answer;
       window.__saved=[{item_id:session.id,dimension:"exam_execution",answer_text:args.answer,evaluation:{status:"preliminary_internal",provisional_percent:40}}];
       return {allowed:true,saved:window.__saved};
      }
      throw Error("Unexpected "+action);
     }
    };
    window.history.replaceState(null,"","?lang="+language+"&session=1");
   },{language,promptAr:PROMPT_AR,promptEn:PROMPT_EN});
   await page.addScriptTag({path:path.resolve("assets/student-path.js")});
   await page.evaluate(()=>LEX_STUDENT_PATH.mount());
   await page.locator(".caseMainQuestion h3").waitFor();
   assert.equal((await page.locator(".caseMainQuestion h3").textContent()).trim(),language==="ar"?"ما أثر الولادة على الحق المقصود؟":"What is the legal effect?");
   assert.equal(await page.locator("#legalCasePart").count(),1);
   assert.equal(await page.locator(".caseAnswerStep h3").textContent(),language==="ar"?"المسألة":"Issue");
   assert.ok((await page.locator("body").innerText()).length>200);
   const phrases=language==="ar"?
     ["ما حكم الحق عند ولادة الحمل حيًا؟","يثبت الحق المشروط بالولادة الحية.","ولد الطفل حيًا، فتحقق الشرط.","ثبت الحق لتحقق الولادة الحية."]:
     ["Does the right vest after live birth?","The right requires a live birth.","The child was born alive, satisfying the condition.","The right vests because the condition is met."];
   for(let i=0;i<4;i++){
    await page.locator("#legalCasePart").fill(phrases[i]);
    await page.locator("#caseNext").click();
   }
   await page.locator("#caseBack").click();
   assert.equal(await page.locator("#legalCasePart").inputValue(),phrases[3],"Back must preserve the answer");
   await page.locator("#caseNext").click();
   await page.locator("#caseSubmit").click();
   await page.waitForFunction(()=>window.__received!==null);
   const received=await page.evaluate(()=>window.__received);
   const labels=language==="ar"?["المسألة:","القاعدة:","التطبيق:","النتيجة:"]:["Issue:","Rule:","Application:","Conclusion:"];
   for(const x of labels)assert.ok(received.includes(x),"missing graded answer section "+x);
   assert.ok(received.length<4000);
   assert.equal(await page.locator("#adaptiveEssay").count(),0,"guided exam should not display the confusing raw 4-section textarea");
   assert.ok(errors.length===0,errors.join(" | "));
   const sw=await page.evaluate(()=>document.documentElement.scrollWidth);
   assert.ok(sw<= (mobile?390:1280)+2,"The legal case guide must not cause horizontal overflow");
   await ctx.close();
  }
 }finally{await browser.close();}
 console.log("PASS: Arabic/English desktop/mobile legal-case guide with preserved back navigation and server-graded four-part answer");
})().catch(e=>{console.error(e);process.exitCode=1;});
