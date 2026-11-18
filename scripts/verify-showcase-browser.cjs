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
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:["--no-sandbox"]});
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
   assert.equal(back,lang==="ar"?"index.html":"index-en.html",lang+" visitor Back must route to home");
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
    window.__showcaseQaCalls=[];
    window.LEX_CLOUD={
     isConfigured:()=>true,
     db:()=>({
      auth:{getSession:async()=>({error:null,data:{session:{user:{id:"browser-fake-user"}}}})},
      functions:{invoke:async(_name,request)=>{
       window.__showcaseQaCalls.push(request.body.request_id);
       if(window.__showcaseQaCalls.length===1)return {error:{message:"simulated network loss"},data:null};
       return {error:null,data:{received:true,submission_id:"synthetic-no-data-written",choice_indicators:{understanding:10}}};
      }}
     })
    };
   });
   await page.locator("#seeResult").click();
   await page.locator(".demoDiagnosticReview").waitFor({timeout:20000});
   assert.equal(await page.locator("#retryDelivery").count(),1,"unconfirmed saving must have an explicit retry");
   assert.ok((await page.locator(".deliveryState").innerText()).includes(lang==="ar"?"لم يصل تأكيد حفظ المحاولة":"Saving has not been confirmed"));
   assert.ok(!(await page.locator(".deliveryState").innerText()).includes("synthetic-no-data-written"));
   await page.locator("#retryDelivery").click();
   await page.locator(".deliveryState code").waitFor({timeout:20000});
   const requestKeys=await page.evaluate(()=>window.__showcaseQaCalls);
   assert.equal(requestKeys.length,2,"retry is explicit, not automatic");
   assert.equal(requestKeys[0],requestKeys[1],"network retry keeps the same request ID");
   assert.equal(await page.locator("#retryDelivery").count(),0,"confirmed save removes retry notice");
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
  await verifyMenusAndGlossary(browser);
  await verifySelectedArchive(browser);
 }finally{await browser.close();}
}
async function verifyMenusAndGlossary(browser){
 // Entirely synthetic local fixture, with every external request blocked.
 const context=await browser.newContext({viewport:{width:420,height:820}});
 await context.route("**/*",function(route){
  const u=new URL(route.request().url());
  if(u.pathname==="/__lexlearn-ui-fixture"&&u.origin===new URL(BASE).origin)
    return route.fulfill({contentType:"text/html",body:"<!doctype html><html lang='ar'><body></body></html>"});
  return route.abort("blockedbyclient");
 });
 try{
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto(BASE+"/__lexlearn-ui-fixture");
  await page.setContent("<details class='adminNavGroup' id='navOne'><summary>Students</summary>Students</details>"+
   "<details class='adminNavGroup' id='navTwo'><summary>Reports</summary>Reports</details>"+
   "<button id='outside'>Outside</button>");
  await page.addScriptTag({path:"assets/admin-appearance.js"});
  await page.locator("#navOne>summary").click();
  await page.waitForFunction(()=>document.getElementById("navOne").open);
  await page.locator("#navTwo>summary").click();
  await page.waitForFunction(()=>!document.getElementById("navOne").open&&document.getElementById("navTwo").open);
  await page.locator("#outside").click();
  await page.waitForFunction(()=>!document.getElementById("navOne").open&&!document.getElementById("navTwo").open);

  const p=await context.newPage();
  p.on("pageerror",e=>errors.push(e.message));
  await p.goto(BASE+"/__lexlearn-ui-fixture");
  await p.setContent("<div id='article'></div>");
  await p.evaluate(()=>{
   window.__lexQaRows=[];
   window.LEX_GLOSSARY_ACCESS={canShowTerms:()=>true};
   window.LEX_CLOUD={
    requireStudent:async()=>({id:"synthetic-student"}),
    db:()=>({from:function(table){
     const q={filters:{},select(){return this;},eq(k,v){this.filters[k]=v;return this;},
      maybeSingle:async()=>{
       if(table==="lex_glossary_definitions")return {data:{term_ar:"الموطن",definition_ar:"محل الإقامة المعتاد",definition_en:"Usual home",source_article:43,source_status:"curated",example_ar:"يقيم الشخص في موطنه."},error:null};
       return {data:window.__lexQaRows.find(r=>r.term_key===q.filters.term_key)||null,error:null};
      },
      limit:async()=>({data:window.__lexQaRows.map(r=>({term_ar:r.term_ar})),error:null}),
      insert:async(row)=>{window.__lexQaRows.push(row);return {data:null,error:null};},
      update:()=>q};
     return q;
    }})
   };
  });
  await p.addScriptTag({path:"assets/personal-glossary.js"});
  await p.evaluate(()=>{
   const host=document.getElementById("article");
   host.innerHTML="<section data-article='43'><blockquote>"+
     LEX_GLOSSARY.linkText(43,"الموطن هو محل الإقامة المعتاد.")+"</blockquote></section>";
   LEX_GLOSSARY.bindArticle(host);
  });
  assert.equal(await p.evaluate(()=>LEX_GLOSSARY.termKey(" المَوطن ")),"legal-domicile");
  const term=p.locator(".lexGlossaryTerm");
  await term.click();await p.waitForFunction(()=>document.getElementById("lexGlossarySave")&&!document.getElementById("lexGlossarySave").disabled);
  await p.locator("#lexGlossarySave").click();
  await p.waitForFunction(()=>!document.getElementById("lexGlossaryDialog").open);
  assert.equal(await p.evaluate(()=>window.__lexQaRows.length),1,"first glossary insert");
  assert.match(await p.locator("#lexGlossarySaveNotice").innerText(),/تمت إضافة/);
  // Simulate an existing manual-key entry for the same visible term.
  await p.evaluate(()=>{window.__lexQaRows[0].term_key="manual-الموطن";});
  await term.click();await p.waitForFunction(()=>document.getElementById("lexGlossarySave")&&!document.getElementById("lexGlossarySave").disabled);
  await p.locator("#lexGlossarySave").click();
  await p.waitForFunction(()=>!document.getElementById("lexGlossaryDialog").open);
  assert.equal(await p.evaluate(()=>window.__lexQaRows.length),1,"no duplicate across manual and curated keys");
  assert.match(await p.locator("#lexGlossarySaveNotice").innerText(),/موجود بالفعل/);
  assert.deepEqual(errors,[],"no synthetic dropdown or glossary browser errors");
  console.log("PASS supervisor dropdown dismiss, glossary closes on success, duplicate term suppressed (synthetic)");
 }finally{await context.close();}
}

async function verifySelectedArchive(browser){
 // No network or real users; every account and action is synthetic in this browser.
 const context=await browser.newContext({viewport:{width:420,height:820}});
 await context.route("**/*",function(route){
  const u=new URL(route.request().url());
  if(u.origin===new URL(BASE).origin&&u.pathname==="/__archive_qa")
   return route.fulfill({contentType:"text/html",body:"<!doctype html><html lang='ar'><body></body></html>"});
  return route.abort("blockedbyclient");
 });
 try{
  const p=await context.newPage(),errors=[];
  p.on("pageerror",e=>errors.push(e.message));
  p.on("dialog",dialog=>dialog.accept(dialog.type()==="prompt"?"انتهاء المقرر التجريبي":undefined));
  await p.goto(BASE+"/__archive_qa");
  await p.setContent("<select id='archiveCohort'></select><button id='archiveGroup'></button>"+
    "<button id='archiveSelected'></button><button id='archiveChooseAll'></button>"+
    "<button id='archiveClearSelection'></button><span id='archiveCount'></span>"+
    "<table><tbody id='activeArchiveRows'></tbody></table>"+
    "<table><tbody id='archivedRows'></tbody></table>");
  await p.evaluate(()=>{
   window.__archiveRows=[
    {id:"a1",name:"طالب اختبار 1",username:"test1",cohortId:"c1",accountStatus:"active"},
    {id:"a2",name:"طالب اختبار 2",username:"test2",cohortId:"c1",accountStatus:"active"},
    {id:"a3",name:"طالب اختبار 3",username:"test3",cohortId:"c1",accountStatus:"active"},
    {id:"b1",name:"طالب اختبار 4",username:"test4",cohortId:"c2",accountStatus:"active"}
   ];window.__archiveCalls=[];
   window.LEX_CLOUD={
    isConfigured:()=>true,
    profile:async()=>({active:true,role:"admin"}),
    listStudents:async()=>window.__archiveRows.map(s=>({...s})),
    listCohorts:async()=>[{id:"c1",name:"المجموعة الأولى"},{id:"c2",name:"المجموعة الثانية"}],
    manageStudent:async request=>{
     window.__archiveCalls.push(request);
     const row=window.__archiveRows.find(s=>s.id===request.user_id);
     if(!row||request.action!=="archive_student")throw Error("Unexpected request");
     row.accountStatus="archived";
     return {ok:true,history_preserved:true};
    }
   };
  });
  await p.addScriptTag({path:"assets/admin-archive.js"});
  await p.waitForFunction(()=>document.querySelector("#archiveCohort option[value='c2']"));
  await p.selectOption("#archiveCohort","c1");
  assert.equal(await p.locator(".archiveStudentCheck").count(),3,"only selected group roster visible");
  await p.locator(".archiveStudentCheck").nth(0).check();
  await p.locator(".archiveStudentCheck").nth(2).check();
  assert.equal(await p.locator("#archiveSelected").isEnabled(),true);
  assert.match(await p.locator("#archiveCount").innerText(),/2 محدد/);
  await p.locator("#archiveSelected").click();
  await p.waitForFunction(()=>window.__archiveCalls.length===2);
  await p.waitForFunction(()=>document.querySelectorAll(".archiveStudentCheck").length===1);
  let evidence=await p.evaluate(()=>({targets:window.__archiveCalls.map(x=>x.user_id),
     states:window.__archiveRows.map(s=>({id:s.id,status:s.accountStatus}))}));
  assert.deepEqual(evidence.targets,["a1","a3"],"only checked student accounts were archived");
  assert.equal(evidence.states.find(s=>s.id==="a2").status,"active");
  assert.equal(evidence.states.find(s=>s.id==="b1").status,"active");
  assert.equal(await p.locator("#archiveSelected").isDisabled(),true,"selection cleared after success");

  await p.locator("#archiveChooseAll").click();
  assert.match(await p.locator("#archiveCount").innerText(),/1 محدد/);
  await p.selectOption("#archiveCohort","c2");
  assert.equal(await p.locator("#archiveSelected").isDisabled(),true,"changing cohort clears old selection");
  await p.locator("#archiveChooseAll").click();
  await p.locator("#archiveClearSelection").click();
  assert.equal(await p.locator("#archiveSelected").isDisabled(),true,"clear-selection works");
  assert.deepEqual(errors,[],"synthetic archive caused no browser errors");
  console.log("PASS selected archival: group scope, multi-select, counts, no cross-group action, no deletion");
 }finally{await context.close();}
}
main().catch(e=>{console.error(e.stack||e);process.exit(1);});
