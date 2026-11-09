#!/usr/bin/env node
"use strict";
/* Purely local, network-blocked mobile Chromium validation of LexLearn research
 * appearance. It uses synthetic markup, never logs in or touches student data. */
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const BASE=process.env.SHOWCASE_QA_URL||"http://127.0.0.1:8765";
const CLOUD_MOCK=`
window.LEX_CLOUD={
 isConfigured:()=>true,
 db:()=>({
  auth:{getUser:async()=>({data:{user:{id:"theme-fixture-only"}},error:null})},
  functions:{invoke:async()=>({data:{eligible:false,non_credit:false},error:null})}
 })
};
`;
async function metrics(page){
 return page.evaluate(()=>{
  const root=document.documentElement;
  const sample=sel=>{
   const e=document.querySelector(sel);
   if(!e)throw Error("Fixture missing: "+sel);
   const s=getComputedStyle(e);
   return {background:s.backgroundColor,color:s.color,border:s.borderColor};
  };
  return {
   theme:root.getAttribute("data-learner-theme"),
   body:sample("body"),
   panel:sample(document.querySelector("#researchPilotWorkspace")?"#researchPilotWorkspace":"body.lexResearchStandalone main"),
   card:sample(document.querySelector("#researchPilotWorkspace")?"#researchPilotWorkspace .card":"body.lexResearchStandalone .card"),
   intro:sample(document.querySelector("#researchPilotWorkspace")?"#researchPilotWorkspace .intro":"body.lexResearchStandalone .intro"),
   choice:sample(document.querySelector("#researchPilotWorkspace")?"#researchPilotWorkspace .choice":"body.lexResearchStandalone .choice"),
   feedback:sample(document.querySelector("#researchPilotWorkspace")?"#researchPilotWorkspace .feedback":"body.lexResearchStandalone .feedback"),
   input:sample(document.querySelector("#researchPilotWorkspace")?"#researchPilotWorkspace textarea":"body.lexResearchStandalone textarea"),
   toggle:sample("#learnerThemeToggle")
  };
 });
}
async function main(){
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const kind of ["standalone","embedded"]){
   const context=await browser.newContext({viewport:{width:390,height:844},locale:"ar-EG",colorScheme:"light"});
   await context.route("**/*",async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==new URL(BASE).origin)return route.abort("blockedbyclient");
    if(url.pathname==="/assets/cloud-data.js")return route.fulfill({status:200,contentType:"text/javascript",body:CLOUD_MOCK});
    if(kind==="embedded"&&url.pathname==="/assets/student-path.js")
      return route.fulfill({status:200,contentType:"text/javascript",body:"window.LEX_STUDENT_PATH={mount:function(){}};"});
    if(kind==="embedded"&&url.pathname==="/assets/student-identity.js")
      return route.fulfill({status:200,contentType:"text/javascript",body:""});
    return route.continue();
   });
   const page=await context.newPage();
   const path=kind==="standalone"?"/student-research-pilot.html":"/student-path.html";
   await page.goto(BASE+path,{waitUntil:"domcontentloaded"});
   await page.locator("#learnerThemeToggle").waitFor();
   await page.evaluate(()=>{localStorage.setItem("lexlearn_learner_theme","light");});
   await page.reload({waitUntil:"domcontentloaded"});
   await page.locator("#learnerThemeToggle").waitFor();
   if(kind==="embedded"){
    await page.evaluate(()=>{
     const section=document.getElementById("researchPilotWorkspace");
     section.hidden=false;
     section.querySelector("#researchPilotApp").innerHTML=
      '<article class="card"><div class="intro">معلومة قانونية</div>'+
      '<label class="choice"><input type="radio" checked>اختيار تجريبي</label>'+
      '<textarea placeholder="اكتب فكرتك"></textarea>'+
      '<div class="feedback">ملاحظة تدريبية</div></article>';
    });
   }else{
    await page.evaluate(()=>{
     document.getElementById("researchPilotApp").innerHTML=
      '<article class="card"><label class="choice"><input type="radio" checked>اختيار تجريبي</label>'+
      '<textarea placeholder="اكتب فكرتك"></textarea>'+
      '<div class="feedback">ملاحظة تدريبية</div></article>';
    });
   }
   const light=await metrics(page);
   assert.equal(light.theme,"light");
   await page.locator("#learnerThemeToggle").click();
   const dark=await metrics(page);
   assert.equal(dark.theme,"dark");
   for(const part of ["panel","card","intro","choice","feedback","input","toggle"]){
    assert.notEqual(light[part].background,dark[part].background,kind+" "+part+" must adapt background");
    assert.notEqual(light[part].color,dark[part].color,kind+" "+part+" must adapt ink contrast");
   }
   assert.equal(await page.evaluate(()=>localStorage.getItem("lexlearn_learner_theme")),"dark","theme saved in existing learner key");
   await page.reload({waitUntil:"domcontentloaded"});
   await page.locator("#learnerThemeToggle").waitFor();
   assert.equal(await page.locator("html").getAttribute("data-learner-theme"),"dark","theme persists on reload");
   await page.locator("#learnerThemeToggle").click();
   assert.equal(await page.locator("html").getAttribute("data-learner-theme"),"light","light mode restored");
   await context.close();
   console.log("PASS: "+kind+" research pilot light/dark computed styles, saved preference, mobile layout, network blocked.");
  }
 }finally{await browser.close();}
}
main().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
