const {chromium}=require("playwright-core");
const fs=require("fs");
const assert=require("node:assert/strict");
const BASE=(process.env.BASE_URL||"http://127.0.0.1:18765/").replace(/\/?$/,"/");
const CHROME=[process.env.CHROME_BIN,"/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium"].find(p=>p&&fs.existsSync(p));
(async()=>{
 assert.ok(CHROME,"Chrome/Chromium is required: never claim browser E2E without a browser");
 const browser=await chromium.launch({headless:true,executablePath:CHROME,args:["--no-sandbox","--disable-dev-shm-usage"]});
 const results=[];
 try{
  for(const en of [false,true]){
   for(const mobile of [false,true]){
    const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,...(process.env.LEX_VIDEO_DIR?{recordVideo:{dir:process.env.LEX_VIDEO_DIR}}:{})});
    const p=await ctx.newPage(),errors=[];
    p.on("pageerror",e=>errors.push(e.message));
    const program="program"+(en?"-en":"")+".html",showcase="showcase"+(en?"-en":"")+".html",level="showcase-level1"+(en?"-en":"")+".html";
    await p.goto(BASE+program+"?demo=1&start=1&preview=stage1",{waitUntil:"domcontentloaded"});
    await p.locator(".courseWrap").waitFor();
    assert.match(await p.locator("body").innerText(),en?/Student account only/:/هذا مسار الطالب المسجل/,"public program may not masquerade as student");
    assert.equal(await p.locator(".taskCard").count(),0,"public query parameters must never unlock student level");
    assert.ok(await p.locator("#lexBuild").textContent(),"exact build id must remain available for diagnostics");
    if(process.env.EXPECTED_BUILD_SHA){
      assert.ok((await p.locator("#lexBuild").textContent()).includes(process.env.EXPECTED_BUILD_SHA.slice(0,12)),
      "Published build mismatch; GitHub Pages may still be serving an older commit");
    }
    await p.goto(BASE+showcase,{waitUntil:"domcontentloaded"});
    assert.match(await p.locator("body").innerText(),en?/Public demo.*student accounts/:/تجربة عرض.*حساب الطالب/);
    assert.equal(await p.locator("#lexBuild").count(),1,"all screens must contain exact build");
    await p.goto(BASE+level,{waitUntil:"domcontentloaded"});
    await p.locator(".taskCard").first().waitFor({timeout:20000});
    assert.match(await p.locator("body").innerText(),en?/First-session preview only/:/معاينة الجلسة الأولى فقط/);
    assert.ok((await p.locator(".taskCard").first().innerText()).trim().length>25,"public first-level sample must render");
    assert.equal(await p.locator("#programLogout").count(),0,"showcase must never inherit a signed-in student");
    assert.ok(!errors.some(x=>/ReferenceError|TypeError|SyntaxError|is not a function/.test(x)),errors.join("|"));
    results.push({language:en?"en":"ar",viewport:mobile?"mobile":"desktop",publicProgram:"login_required",showcase:"OK",levelOneDemo:"OK",jsErrors:errors.length});
    await ctx.close();
   }
  }
 }finally{await browser.close();}
 console.log("Public program/demo separation real-Chrome tests PASS "+JSON.stringify(results));
})().catch(e=>{console.error(e);process.exitCode=1;});
