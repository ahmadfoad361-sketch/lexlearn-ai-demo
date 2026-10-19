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
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,recordVideo:{dir}});
 const page=await context.newPage(),requests=[],jsErrors=[];
 page.on("response",r=>{
  const m=r.url().match(/\/rest\/v1\/rpc\/([a-z_]+)/);
  if(m)requests.push({rpc:m[1],status:r.status()});
 });
 page.on("pageerror",e=>jsErrors.push(e.message));
 try{
  await page.goto(base+"student-login.html?country=qa",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.LEX_CLOUD&&LEX_CLOUD.isConfigured(),{timeout:25000});
  await page.locator("#studentUser").fill("student-d");
  await page.locator("#studentPassword").fill("EphemeralLocal!2026");
  await page.locator("#studentLogin button[type=submit]").click();
  await page.waitForURL(/\/student\.html/,{timeout:30000});
  await page.locator('a[href*="diagnostic.html"]').first().click();
  await page.waitForURL(/\/diagnostic\.html/,{timeout:30000});
  await page.locator("#beginDiagnostic").waitFor({timeout:30000});
  await page.locator("#beginDiagnostic").click();
  const selections=[0,1,2,0,0,2];
  for(let i=0;i<6;i++){
   await page.waitForFunction(index=>{
    const q=window.LEX_OFFICIAL_DIAGNOSTIC.QUESTIONS[index];
    return !!q&&document.querySelector("#officialDiagnostic")?.textContent?.includes(q.ar)
       &&document.querySelectorAll('input[name="selected"]').length>=3;
   },i,{timeout:30000});
   await page.locator('input[name="selected"][value="'+selections[i]+'"]').check();
   await page.locator("#serverNext").click();
  }
  await page.locator("#ungradedText").waitFor({timeout:30000});
  await page.locator("#ungradedText").fill("تبدأ الشخصية القانونية بتمام الولادة حية وتنتهي بالوفاة.");
  await page.locator("#serverNext").click();
  await page.waitForURL(/\/program\.html/,{timeout:40000});
  await page.locator("#officialEssayAnswer").waitFor({timeout:40000});
  assert.match(await page.locator("body").innerText(),/المستوى الأول/);
  const before=await page.locator("body").innerText();
  assert.ok(before.includes("تم حفظ 0 / 3"));
  await page.locator("#officialEssayAnswer").fill("الشخصية القانونية تبدأ بتمام الولادة حية وتنتهي بالوفاة، وللحمل حقوق مشروطة بالولادة الحية ولا يحتاج سببها إلى قبول.");
  await page.locator("#officialSaveAnswer").click();
  await page.waitForFunction(()=>document.body.innerText.includes("تم حفظ 1 / 3"),{timeout:35000});
  assert.match(await page.locator("body").innerText(),/تقييم المحرك الداخلي المبدئي/);
  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#officialEssayAnswer").waitFor({timeout:40000});
  assert.match(await page.locator("body").innerText(),/تم حفظ 1 \/ 3/);
  assert.match(await page.locator("body").innerText(),/تقييم المحرك الداخلي المبدئي/);
  const body=await page.locator("body").innerText();
  assert.ok(!body.includes("ابدأ بتقييم قصير"),"diagnostic loop must not return");
  const essential=["lex_diagnostic_begin","lex_diagnostic_draft","lex_diagnostic_complete","lex_level_one_open","lex_level_one_submit"];
  for(const rpc of essential){
   assert.ok(requests.some(r=>r.rpc===rpc&&r.status>=200&&r.status<300),"Missing successful API call "+rpc+" "+JSON.stringify(requests));
  }
  assert.equal(jsErrors.length,0,"No browser runtime errors: "+jsErrors.join(" | "));
  await page.screenshot({path:dir+"/stage-1-after-reload.png",fullPage:true});
  fs.writeFileSync(dir+"/network-proof.json",JSON.stringify({case:"LOCAL STAGING ONLY",commit:process.env.GITHUB_SHA?.slice(0,12),requests},null,2));
  console.log("PASS Chrome real-local authenticated LexLearn: login -> six questions -> server 2xx -> adapted Level1 -> preliminary grade -> reload, no loop. Network evidence stored.");
 }finally{
  await context.close();await browser.close();
 }
})().catch(e=>{console.error("STAGING BROWSER FAIL",e);process.exitCode=1;});
