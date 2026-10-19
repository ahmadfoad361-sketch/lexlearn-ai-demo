/* Real Chrome full learner journey against EPHEMERAL local GoTrue and PostgREST.
 * No production login, no production content approval, no remote network endpoints.
 */
const {chromium}=require("playwright-core");
const fs=require("node:fs");
const assert=require("node:assert/strict");
const path=require("node:path");
const env={};
for(const line of fs.readFileSync(process.argv[2]||"/tmp/lexlearn-local.env","utf8").split(/\r?\n/)){
 const m=line.match(/^([A-Z_]+)=(.*)$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,"");
}
const api=env.API_URL||env.SUPABASE_URL||"http://127.0.0.1:54321";
const anon=env.ANON_KEY||env.SUPABASE_ANON_KEY;
assert.match(api,/^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/);
assert.ok(anon);
const configFile=path.resolve("dist-site/assets/lexlearn-config.js");
assert.ok(fs.existsSync(configFile),"The app must be built first");
fs.writeFileSync(configFile,"window.LEX_CONFIG="+JSON.stringify({
 mode:"local-staging-only",supabaseUrl:api,supabaseAnonKey:anon,aiEnabled:false,
 defaultCourseId:"qa-qu-lawc101-rights",studentEmailDomain:"students.lexlearn.local"
})+";\n");
const chrome=[process.env.CHROME_BIN,"/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium"].find(x=>x&&fs.existsSync(x));
assert.ok(chrome,"A genuine Chrome executable is required");
const base="http://127.0.0.1:18765/";
(async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
 const dir="ci-artifacts/local-staging-browser";fs.mkdirSync(dir,{recursive:true});
 let context=null,page=null,step="initialize Chrome recording";
 const requests=[],jsErrors=[];
 const milestone=label=>{step=label;console.log("CHROME-STEP:",label);};
 try{
  context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,recordVideo:{dir}});
  page=await context.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(20000);
  page.on("response",r=>{
   const m=r.url().match(/\/rest\/v1\/rpc\/([a-z_]+)/);
   if(m)requests.push({rpc:m[1],status:r.status()});
  });
  page.on("pageerror",e=>jsErrors.push(e.message));
  milestone("load student login");
  await page.goto(base+"student-login.html?country=qa",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.LEX_CLOUD&&LEX_CLOUD.isConfigured(),{timeout:25000});
  milestone("enter temporary learner credentials");
  await page.locator("#studentUser").fill("student-d@lexlearn-ci.invalid");
  await page.locator("#studentPassword").fill("EphemeralLocal!2026");
  await page.locator("#studentLogin button[type=submit]").click();
  milestone("wait for authenticated student portal");
  await page.waitForURL(/\/student\.html/,{timeout:16000});
  milestone("start official student diagnostic");
  await page.locator('a[href*="diagnostic.html"]').first().click();
  await page.waitForURL(/\/diagnostic\.html/,{timeout:16000});
  milestone("check academic bank and begin assessment");
  await page.locator("#beginDiagnostic").waitFor({timeout:16000});
  await page.locator("#beginDiagnostic").click();
  const selections=[0,1,2,0,0,2];
  for(let i=0;i<6;i++){
   milestone("answer diagnostic question "+(i+1));
   await page.waitForFunction(index=>{
    const q=window.LEX_OFFICIAL_DIAGNOSTIC.QUESTIONS[index];
    return !!q&&document.querySelector("#officialDiagnostic")?.textContent?.includes(q.ar)
       &&document.querySelectorAll('input[name="selected"]').length>=3;
   },i,{timeout:14000});
   await page.locator('input[name="selected"][value="'+selections[i]+'"]').check();
   await page.locator("#serverNext").click();
  }
  milestone("submit diagnostic free answer");
  await page.locator("#ungradedText").waitFor({timeout:16000});
  await page.locator("#ungradedText").fill("تبدأ الشخصية القانونية بتمام الولادة حية وتنتهي بالوفاة.");
  await page.locator("#serverNext").click();
  milestone("redirect to server-adapted Level 1");
  await page.waitForURL(/\/program\.html/,{timeout:20000});
  await page.locator("#officialEssayAnswer").waitFor({timeout:16000});
  assert.match(await page.locator("body").innerText(),/المستوى الأول/);
  const before=await page.locator("body").innerText();
  assert.ok(before.includes("تم حفظ 0 / 3"));
  await page.locator("#officialEssayAnswer").fill("الشخصية القانونية تبدأ بتمام الولادة حية وتنتهي بالوفاة، وللحمل حقوق مشروطة بالولادة الحية ولا يحتاج سببها إلى قبول.");
  milestone("save first essay and its internal score");
  await page.locator("#officialSaveAnswer").click();
  await page.waitForFunction(()=>document.body.innerText.includes("تم حفظ 1 / 3"),{timeout:18000});
  assert.match(await page.locator("body").innerText(),/تقييم المحرك الداخلي المبدئي/);
  milestone("reload to verify server persistence");
  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#officialEssayAnswer").waitFor({timeout:16000});
  assert.match(await page.locator("body").innerText(),/تم حفظ 1 \/ 3/);
  assert.match(await page.locator("body").innerText(),/تقييم المحرك الداخلي المبدئي/);
  const body=await page.locator("body").innerText();
  assert.ok(!body.includes("ابدأ بتقييم قصير"),"diagnostic loop must not return");
  const essential=["lex_diagnostic_begin","lex_diagnostic_draft","lex_diagnostic_complete","lex_level_one_open","lex_level_one_submit"];
  for(const rpc of essential){
   assert.ok(requests.some(r=>r.rpc===rpc&&r.status>=200&&r.status<300),"Missing successful API call "+rpc+" "+JSON.stringify(requests));
  }
  milestone("return to student portal, never repeat completed diagnostic");
  await page.goto(base+"student.html",{waitUntil:"domcontentloaded"});
  await page.locator('a[href*="program.html"]').first().waitFor({timeout:14000});
  const portalText=await page.locator("body").innerText();
  assert.ok(!portalText.includes("ابدأ التقييم القصير، وبعده"),"returning student must not be treated as unassessed");
  milestone("returning student directly visits diagnostic URL; should redirect to saved plan");
  await page.goto(base+"diagnostic.html?lang=ar",{waitUntil:"domcontentloaded"});
  await page.waitForURL(/\/program\.html/,{timeout:16000});
  await page.locator("#officialEssayAnswer").waitFor({timeout:16000});
  assert.match(await page.locator("body").innerText(),/تم حفظ 1 \/ 3/);
  milestone("switch to English Level1 with identical saved progress");
  await page.goto(base+"program-en.html?country=qa&subject=rights",{waitUntil:"domcontentloaded"});
  await page.locator("#officialEssayAnswer").waitFor({timeout:16000});
  assert.match(await page.locator("body").innerText(),/Saved 1 \/ 3/);
  assert.match(await page.locator("body").innerText(),/Preliminary internal assessment/);
  const stageSnapshot=await page.locator("body").innerText();
  assert.ok(stageSnapshot.includes("Student:"),"English official student identity must be visible");
  milestone("signed-in student sees public demo greyed and cannot enter from home");
  await page.goto(base+"index-en.html",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>{
    const a=document.querySelector('a[href*="showcase-en.html"]');
    return a&&a.getAttribute("aria-disabled")==="true";
  },{timeout:15000});
  const lockedLink=page.locator('a[href*="showcase-en.html"]').first();
  assert.match(await lockedLink.innerText(),/Visitors only/);
  assert.equal(await lockedLink.getAttribute("tabindex"),"-1");
  milestone("direct demo URL redirects verified student back to their portal");
  await page.goto(base+"showcase-en.html?country=qa&subject=rights",{waitUntil:"domcontentloaded"});
  await page.waitForURL(/\/student-en\.html/,{timeout:15000});
  await page.goto(base+"program-en.html?country=qa&subject=rights",{waitUntil:"domcontentloaded"});
  await page.locator("#officialEssayAnswer").waitFor({timeout:15000});
  milestone("sign out and deny unauthenticated direct official level access");
  await page.locator("#programLogout").click();
  await page.waitForURL(/student-login-en\.html/,{timeout:16000});
  await page.goto(base+"program-en.html?country=qa&subject=rights&start=1",{waitUntil:"domcontentloaded"});
  await page.locator('a[href="student-login-en.html"]').waitFor({timeout:16000});
  assert.equal(await page.locator("#officialEssayAnswer").count(),0,"URL flag must never unlock official level");
  milestone("visitor public demo stays separate from student data");
  const anonContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  try{
   const visitor=await anonContext.newPage();
   await visitor.goto(base+"showcase.html?country=qa&subject=rights",{waitUntil:"domcontentloaded"});
   await visitor.waitForFunction(()=>document.body.innerText.includes("تجربة عرض"),{timeout:16000});
   assert.match(await visitor.locator("body").innerText(),/النتائج لا تُحفظ في حساب الطالب/);
   await visitor.goto(base+"program.html?demo=1&start=1&preview=stage1",{waitUntil:"domcontentloaded"});
   await visitor.locator('a[href="student-login.html"]').waitFor({timeout:16000});
   assert.equal(await visitor.locator("#officialEssayAnswer").count(),0,"public preview params cannot access student's course");
  }finally{await anonContext.close();}
  assert.equal(jsErrors.length,0,"No browser runtime errors: "+jsErrors.join(" | "));
  await page.goto(base+"student-login-en.html",{waitUntil:"domcontentloaded"});
  await page.screenshot({path:dir+"/after-logout.png",fullPage:true});
  fs.writeFileSync(dir+"/network-proof.json",JSON.stringify({case:"LOCAL STAGING ONLY",commit:process.env.GITHUB_SHA?.slice(0,12),requests},null,2));
  console.log("PASS Chrome real-local authenticated LexLearn: new+returning student, six saved questions, adaptive Level1 preliminary grade, reload, bilingual return, logout, public demo isolation, URL access denial. Network evidence stored.");
 }catch(e){
  console.error("Chrome stopped at step:",step,"page:",page? page.url():"browser_not_initialized");
  if(page)try{await page.screenshot({path:dir+"/failure.png",fullPage:true,timeout:4000});}catch(_){}
  try{fs.writeFileSync(dir+"/failure-summary.json",JSON.stringify({step,url:page?page.url():null,runtimeErrors:jsErrors,requests,visibleText:page?(await page.locator("body").innerText({timeout:3000})).slice(0,1800):""},null,2));}catch(_){}
  throw e;
 }finally{
  if(context)await context.close();await browser.close();
 }
})().catch(e=>{console.error("STAGING BROWSER FAIL",e);process.exitCode=1;});
