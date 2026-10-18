/* Browser smoke for meeting preview. This does not certify real student/Supabase scoring. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright-core");
const BASE=(process.env.BASE_URL||"http://127.0.0.1:18765").replace(/\/?$/,"/");
const EXEC=[process.env.CHROME_BIN,"/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium","/opt/google/chrome/chrome"].find(p=>p&&fs.existsSync(p));
(async()=>{
 assert.ok(EXEC,"A real Chromium/Chrome browser executable is required");
 const browser=await chromium.launch({headless:true,executablePath:EXEC,args:["--no-sandbox","--disable-dev-shm-usage"]});
 const reports=[];
 try{
  for(const lang of ["ar","en"]){
   const english=lang==="en",pname="program"+(english?"-en":"")+".html",sname="showcase"+(english?"-en":"")+".html";
   for(const mobile of [false,true]){
    const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,locale:english?"en-US":"ar-QA"});
    const page=await context.newPage();const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    const url=BASE+pname+"?country=qa&subject=rights";
    await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
    await page.locator("#publicDemoEntry").waitFor({timeout:20000});
    assert.equal(await page.locator("#publicDemoEntry").count(),1);
    assert.equal(await page.locator("#publicFirstStage").count(),1);
    assert.equal(await page.locator("#realStudentLogin").count(),1);
    assert.match(await page.locator("body").innerText(),english?/not a student account/i:/ليست حساب الطالب/);
    const route=new URL(await page.locator("#publicFirstStage").getAttribute("href"),url);
    assert.equal(route.pathname.endsWith(pname),true,"preview should use the matching language");
    assert.equal(route.searchParams.get("demo"),"1");
    assert.equal(route.searchParams.get("start"),"1");
    assert.equal(route.searchParams.get("preview"),"stage1");
    await page.locator("#publicFirstStage").click();
    await page.waitForURL(/preview=stage1/,{timeout:20000});
    await page.locator(".taskCard").first().waitFor({timeout:20000});
    const first=await page.locator(".taskCard").first().innerText();
    assert.ok(first.trim().length>35,"first-level preview must render a real task");
    assert.match(await page.locator("body").innerText(),english?/First-session preview only/:/معاينة الجلسة الأولى فقط/,"preview must be accurately labelled");
    assert.ok(!(await page.locator("body").innerText()).includes(english?"Complete the diagnostic first":"ابدأ بتقييم قصير"));
    assert.ok(!errors.some(e=>/SyntaxError|ReferenceError|TypeError|is not a function/.test(e)), "No core JS page failures: "+errors.join("|"));
    await page.goto(url,{waitUntil:"domcontentloaded"});
    await page.locator("#publicDemoEntry").click();
    await page.waitForURL("**/"+sname+"?**",{timeout:20000});
    assert.equal(new URL(page.url()).pathname.endsWith(sname),true);
    reports.push({lang,viewport:mobile?"mobile":"desktop",entry:"OK",level1:"OK",demo:"OK",errors:errors.length});
    await context.close();
   }
  }
  console.log("Public preview browser smoke PASS: "+JSON.stringify(reports));
 }finally{await browser.close();}
})().catch(e=>{console.error("Public preview browser smoke FAILED:",e);process.exitCode=1;});
