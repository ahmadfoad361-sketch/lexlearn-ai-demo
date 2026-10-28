const {chromium}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs');
const BASE=(process.env.BASE_URL||'http://127.0.0.1:18765/').replace(/\/?$/,'/');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900}});await ctx.route('**/*.supabase.co/**',r=>r.abort());
  const p=await ctx.newPage();
  for(const page of ['index.html','index-en.html','conference.html','student-login.html','student-login-en.html','student-register.html','admin-login.html','admin-analytics.html','instructor-login.html']){
   await p.goto(BASE+page,{waitUntil:'networkidle'});
   const brand=p.locator('.v9-brand .lexWordmark,.en-brand .lexWordmark,.identity .lexWordmark,.brandTop .lexWordmark,.brand .lexWordmark').first();
   await brand.waitFor();
   for(let pass=0;pass<2;pass++){
    assert.equal(await brand.locator('.lexWordmarkLex').evaluate(el=>getComputedStyle(el).color),'rgb(20, 43, 95)',page);
    assert.equal(await brand.locator('.lexWordmarkLearn').evaluate(el=>getComputedStyle(el).color),'rgb(143, 29, 63)',page);
    assert.equal(await brand.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(249, 244, 239)',page);
    assert.equal(await brand.textContent(),'LexLearn');
    assert.equal(await brand.locator('.lexWordmark').count(),0,'observer must not nest wordmarks');
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),page+' no page overflow');
    const toggle=p.locator('#learnerThemeToggle,#conferenceThemeToggle');if(pass===0&&await toggle.count())await toggle.click();
   }
   if(page==='index.html'){
    fs.mkdirSync('supervisor-browser-evidence',{recursive:true});
    await p.screenshot({path:'supervisor-browser-evidence/wordmark-home-'+width+'.png',fullPage:true});
   }
  }
  await ctx.close();
 }}finally{await browser.close();}
 console.log('PASS navy/burgundy wordmark on nine public/staff pages in both themes at 390/1440px; readable backing and no overflow');
})().catch(e=>{console.error(e);process.exitCode=1;});
