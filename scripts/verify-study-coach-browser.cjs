"use strict";
const assert=require("node:assert/strict"),{chromium}=require("playwright");
const BASE=process.env.COACH_QA_URL||"http://127.0.0.1:8766";
async function main(){
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const conf of [
   {lang:"ar",ua:"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Mobile",width:390},
   {lang:"en",ua:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130",width:1180}
  ]){
   const ctx=await browser.newContext({viewport:{width:conf.width,height:850},userAgent:conf.ua});
   await ctx.route("**/*",route=>{
    const u=new URL(route.request().url());
    if(u.origin!==new URL(BASE).origin)return route.abort("blockedbyclient");
    if(u.pathname==="/coach-qa.html")
     return route.fulfill({status:200,contentType:"text/html",
      body:'<!doctype html><html lang="'+conf.lang+'"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/study-coach.css"></head><body><h1>Synthetic coach QA</h1><script src="/assets/study-coach.js"></script></body></html>'});
    return route.continue();
   });
   const p=await ctx.newPage(),errors=[];p.on("pageerror",e=>errors.push(String(e)));
   await p.goto(BASE+"/coach-qa.html?coach_preview=1",{waitUntil:"load"});
   const evidence=await p.evaluate(()=>{
    const c=window.LEX_STUDY_COACH;
    c.init({learnerId:"synthetic",language:document.documentElement.lang});
    c.recordCompleted("synthetic",2);c.recordCompleted("synthetic",2);
    const k=Object.keys(localStorage).find(k=>k.startsWith("lexlearn:study-coach-preview:v1:")&&!k.endsWith(":lease"));
    if(!k)return {error:"no_state"};
    const s=JSON.parse(localStorage.getItem(k));s.activeSeconds=1900;localStorage.setItem(k,JSON.stringify(s));
    window.__continued=false;
    return {sessions:c.getDebugSummary().sessions,offered:c.offerAtBoundary({learnerId:"synthetic",go(){window.__continued=true}}),mobile:c.isMobileDevice()};
   });
   assert.equal(evidence.error,undefined);assert.equal(evidence.sessions,1);
   assert.equal(evidence.offered,true);assert.equal(evidence.mobile,conf.lang==="ar");
   assert.equal(await p.locator("#llCoachOverlay").isVisible(),true);
   await p.locator('[data-action="continue"]').click();
   assert.equal(await p.evaluate(()=>window.__continued),true);
   assert.equal(await p.locator("#llCoachOverlay").isVisible(),false);
   assert.deepEqual(errors,[]);
   await ctx.close();
  }
  const ctx=await browser.newContext();
  await ctx.route("**/*",route=>{
   const u=new URL(route.request().url());
   if(u.origin!==new URL(BASE).origin)return route.abort("blockedbyclient");
   if(u.pathname==="/coach-qa.html")return route.fulfill({status:200,contentType:"text/html",body:'<html><body><script src="/assets/study-coach.js"></script></body></html>'});
   return route.continue();
  });
  const p=await ctx.newPage();await p.goto(BASE+"/coach-qa.html",{waitUntil:"load"});
  assert.equal(await p.evaluate(()=>window.LEX_STUDY_COACH.enabled),false);
  await ctx.close();
  console.log("PASS: isolated AR mobile/EN desktop break dialog, continue-without-lock, one-time completion, default off, no external network.");
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
