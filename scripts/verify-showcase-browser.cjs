#!/usr/bin/env node
"use strict";
/**
 * Real Chromium click-through for the public demo, with ZERO requests allowed to
 * production Supabase or third-party domains. A fake receipt is injected only
 * into the local test browser after answering. No real user data is created.
 */
const assert=require("node:assert/strict");
const {chromium}=require("playwright");

const BASE=process.env.SHOWCASE_QA_URL||"http://127.0.0.1:8765";
const lastPart=path=>path.split("/").pop();
async function main(){
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const lang of ["ar","en"]){
   const context=await browser.newContext({viewport:{width:390,height:844},locale:lang==="ar"?"ar-EG":"en-US"});
   // Never send authentication/answers/diagnostic data outside the local server.
   await context.route("**/*",async route=>{
    const url=new URL(route.request().url());
    if(url.origin===new URL(BASE).origin)return route.continue();
    return route.abort("blockedbyclient");
   });
   const page=await context.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(String(e.message||e)));
   await page.goto(BASE+(lang==="ar"?"/showcase.html":"/showcase-en.html"),{waitUntil:"domcontentloaded"});
   await page.locator("#startDemo").waitFor({timeout:15000});

   // Test corrected Back link on public visitor demo.
   const back=await page.locator(".demoBack").getAttribute("href");
   assert.equal(back,"index.html",lang+" visitor Back must route to home");
   assert.equal(await page.locator("#startDemo").count(),1,"intro start exists");

   await page.locator("#startDemo").click();
   await page.locator("#beginLegalQuestions").click();

   // Six deliberately incorrect diagnostic responses (no inline feedback).
   for(let i=0;i<6;i++){
    await page.locator('[data-o="1"]').first().click();
   }
   await page.locator("#freeText").fill(lang==="ar"
    ?"تبدأ شخصية الإنسان بتمام ولادته حيًا وتنتهي بموته. وتثبت حقوق الحمل المشروطة بولادته حيًا."
    :"Legal personality begins on live birth and ends on death. The stated prenatal rights depend on live birth.");

   // Replace client cloud object only in this isolated browser tab.
   await page.evaluate(()=>{
    window.LEX_CLOUD={
     isConfigured:()=>true,
     db:()=>({
      auth:{getSession:async()=>({error:null,data:{session:{user:{id:"browser-fake-user"}}}})},
      functions:{invoke:async()=>({error:null,data:{
       received:true,submission_id:"synthetic-no-data-written",
       choice_indicators:{understanding:10}
      }})}
     })
    };
   });
   await page.locator("#seeResult").click();
   await page.locator(".demoDiagnosticReview").waitFor({timeout:20000});
   assert.equal(await page.locator(".demoReviewItem").count(),6,"every incorrect question must have review");
   assert.ok((await page.locator(".demoDiagnosticReview").innerText()).includes(lang==="ar"?"المادة 39":"Article 39"));
   assert.equal(await page.locator("#firstStageFromResults").count(),0,
    "a new untrained attempt must not claim to have finished the cycle");
   assert.ok(!(await page.locator("body").innerText()).includes(lang==="ar"?"أنهيت الأربع مهام التدريبية":"You completed the four practice activities"));

   await page.locator("#previewDemo").click();
   await page.locator("#cycleStart").click();
   const startInput=page.locator("#cycleAnswer");
   await startInput.waitFor();
   assert.equal(await startInput.inputValue(),"","retrieval exercise must start empty");
   assert.ok((await page.locator("body").innerText()).includes(lang==="ar"?"اعرض النموذج للمقارنة الذاتية":"Show reference for self-comparison"));
   assert.ok(!(await page.locator("body").innerText()).includes("synthetic-no-data-written"));

   // Four real UI interactions in the adaptively chosen "understanding" plan.
   for(let step=0;step<4;step++){
    if(await page.locator("#cycleAnswer").count()){
     assert.equal(await page.locator("#cycleAnswer").inputValue(),"","every free exercise starts blank");
     await page.locator("#cycleAnswer").fill(lang==="ar"
      ?"الولادة الحية تبدأ الشخصية، لكن أهلية الأداء ترتبط بأحكام مستقلة."
      :"Live birth starts legal personality; capacity to act has separate conditions.");
     await page.locator("#cycleCompare").click();
    }else{
     await page.locator('[data-cycle-choice="1"]').click();
     const feedback=await page.locator("#cycleFeedback").innerText();
     assert.ok(feedback.includes(lang==="ar"?"السبب القانوني":"Legal reason"),
      "wrong choice shows specific legal correction");
     assert.ok(feedback.includes(lang==="ar"?"المادة":"Article"),
      "wrong choice cites relevant legal source");
    }
    await page.locator("#cycleNext").click();
   }
   await page.locator("#cycleFirstStage").waitFor();
   const previewHref=await page.locator("#cycleFirstStage").getAttribute("href");
   assert.equal(previewHref,lang==="ar"?"showcase-level1.html":"showcase-level1-en.html");

   await page.locator("#cycleBack").click();
   assert.equal(await page.locator("#firstStageFromResults").count(),1,
    "after exactly four activities current attempt shows a preview button");
   assert.equal(await page.locator("#firstStageFromResults").getAttribute("href"),previewHref,
    "result and training-summary preview links agree");

   // A new attempt in the same tab must reset the last attempt's marker.
   await page.locator("#retryDemo").click();
   assert.equal(await page.evaluate(()=>sessionStorage.getItem("lexlearn-showcase-first-session-v1")),null,
    "new attempt must clear stored completion");
   await page.locator("#beginLegalQuestions").click();
   for(let i=0;i<6;i++)await page.locator('[data-o="1"]').first().click();
   await page.locator("#freeText").fill(lang==="ar"?"لا أتذكر":"I do not remember");
   await page.locator("#seeResult").click();
   await page.locator(".demoDiagnosticReview").waitFor();
   assert.equal(await page.locator("#firstStageFromResults").count(),0,
    "prior guided completion must not carry over to second attempt");

   // Visiting the proper visitor preview path must not request student login.
   const preview=await context.newPage();
   preview.on("pageerror",e=>errors.push("preview: "+e.message));
   await preview.goto(BASE+"/"+previewHref,{waitUntil:"domcontentloaded"});
   await preview.waitForTimeout(300);
   const previewText=await preview.locator("body").innerText();
   assert.ok(!previewText.includes("سجّل الدخول لبدء التشخيص الحقيقي"),
    "public preview must never point to student sign-in");
   assert.ok(!previewText.includes("Sign in to begin the real diagnostic"));
   assert.ok(await preview.locator("#programApp").count(),"preview app exists");
   if(errors.length)throw new Error(lang+" browser errors: "+errors.join(" | "));
   console.log("PASS "+lang+": mobile diagnostic, 6 explanations, 4 practice steps, new attempt reset, public preview, zero server writes");
   await context.close();
  }
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e.stack||e);process.exit(1);});
