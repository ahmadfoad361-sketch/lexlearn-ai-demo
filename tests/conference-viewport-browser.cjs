/* Browser regression: conference page must occupy normal mobile/tablet viewport,
 * including 960px Android tablet screenshots. The page must not appear as a
 * tiny right-hand strip with most of the viewport blank. */
const {chromium}=require("playwright-core");
const fs=require("node:fs"),assert=require("node:assert/strict");
const BASE=(process.env.BASE_URL||"http://127.0.0.1:18765/").replace(/\/?$/,"/");
const chrome=[process.env.CHROME_BIN,"/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium"].find(x=>x&&fs.existsSync(x));
(async()=>{
 assert.ok(chrome,"Chromium is required for a real responsive layout check");
 const b=await chromium.launch({headless:true,executablePath:chrome,args:["--no-sandbox","--disable-dev-shm-usage"]});
 try{
 for(const width of [320,390,768,960,1440])for(const lang of ["ar","en"])for(const theme of ["light","dark"]){
   const c=await b.newContext({viewport:{width,height:1080},isMobile:true,hasTouch:true,deviceScaleFactor:1});
   await c.addInitScript((theme)=>{if(!sessionStorage.getItem('theme-test-seeded')){localStorage.setItem('lexlearn_conference_theme',theme);sessionStorage.setItem('theme-test-seeded','yes');}sessionStorage.setItem('lexlearn_conference_intro_v3','seen');},theme);
   const p=await c.newPage();
   await p.goto(BASE+"conference.html?lang="+lang,{waitUntil:"domcontentloaded",timeout:30000});
   await p.waitForFunction((l)=>document.documentElement.lang===l,lang);
   const v=await p.evaluate(()=>{
     const rect=(sel)=>{const e=document.querySelector(sel);const r=e&&e.getBoundingClientRect();return r?{x:r.x,right:r.right,width:r.width}:null};
     return {
       viewport:window.innerWidth,client:document.documentElement.clientWidth,
       scroll:document.documentElement.scrollWidth,scale:window.visualViewport&&window.visualViewport.scale,
       main:rect("#main"),first:rect(".first.frame"),top:rect(".topbar.frame"),paths:rect(".paths"),
       direction:document.documentElement.dir,
       bodyWidth:document.body.getBoundingClientRect().width
     };
   });
   const first=v.first, ratio=first&&first.width/v.viewport||0;
   if(!first||ratio<.75||Math.abs(first.x)>Math.max(24,v.viewport*.15)||Math.abs(first.x-(v.viewport-first.right))>Math.max(10,v.viewport*.03)||v.scroll>v.viewport*1.06){
     await p.screenshot({path:"/tmp/lexlearn-conference-"+lang+"-"+width+".png",fullPage:false}).catch(()=>{});
     throw new Error("Conference squashed or horizontally overflowing: "+JSON.stringify({width,lang,...v,ratio}));
   }
   assert.ok(v.top.width>=v.viewport*.75,"Centered header should use at least 75% of the tablet viewport");
   console.log("CONFERENCE_VIEWPORT_OK "+JSON.stringify({width,lang,ratio,scroll:v.scroll,client:v.client,scale:v.scale}));
   assert.equal(await p.locator('html').getAttribute('data-theme'),theme);
   const themeButton=p.locator('#conferenceThemeToggle');
   await themeButton.focus();
   await p.keyboard.press('Enter');
   assert.equal(await p.locator('html').getAttribute('data-theme'),theme==='dark'?'light':'dark','keyboard toggle');
   await p.reload({waitUntil:'domcontentloaded'});
   assert.equal(await p.locator('html').getAttribute('data-theme'),theme==='dark'?'light':'dark','saved preference restores before render');
   await themeButton.focus();
   await p.keyboard.press('Enter');
   assert.equal(await p.locator('html').getAttribute('data-theme'),theme);
   if(theme==='dark'){
     const failures=await p.evaluate(()=>{
       document.querySelectorAll('details').forEach(d=>d.open=true);
       document.querySelectorAll('#leadForm [hidden]').forEach(e=>e.hidden=false);
       const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
       const luminance=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
       function background(e){if(!e)return [255,255,255];const c=rgb(getComputedStyle(e).backgroundColor),a=c[3]===undefined?1:c[3];if(a===1)return c;const b=background(e.parentElement);return c.slice(0,3).map((v,i)=>v*a+b[i]*(1-a));}
       const selectors=['body','#firstTitle','.heroSub','.eyebrow','.identity b','.identity b span','.theme-toggle','.lang-switch button','.exhibit-chapters a','.exhibit-chapters a span:first-child','.photo-details>summary','.lead','.solutionPanel h3','.solutionPanel p','.solutionPanel>span','.skills h3','.skills p','.skills article>span','.slideBody small','.slideBody h3','.slideBody p','.deckArrow','.pilotSteps strong','.pilotStepNum','.pilotExchange h3','.pilotExchange p','.pilotOffer','.roadmap h3','.roadmap p','.roadmap bdi','.roadmapStatus','.roadmapDemoLink','.visionInvestorQuote .visual-quote','.visionInvestorQuote .quote-attribution','.businessModel h3','.businessCards h4','.businessCards p','.evidenceNote','.leadForm h3','.leadFields label','.leadFields input','.leadFields select','.leadConsent','.leadConsentGroup>a','.leadPrivacy','.leadStatus','.contactButtons .button','.founder strong','.founder span','.founderEmail','.foot a','.foot small'];
       const bad=[];
       selectors.forEach(sel=>document.querySelectorAll(sel).forEach(e=>{
         if(!e.getClientRects().length)return;
         const style=getComputedStyle(e),fg=rgb(style.color),bg=background(e),a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
         if(ratio<4.5)bad.push({sel,text:e.textContent.slice(0,45),ratio:ratio.toFixed(2),fg:style.color,bg});
       }));
       return bad;
     });
     assert.deepEqual(failures,[],'dark flat-surface text contrast: '+JSON.stringify({width,lang,failures}));
   }
   console.log('CONFERENCE_THEME_OK '+JSON.stringify({width,lang,theme}));
   await c.close();
 }
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
