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
 for(const width of [390,768,960])for(const lang of ["ar","en"]){
   const c=await b.newContext({viewport:{width,height:1080},isMobile:true,hasTouch:true,deviceScaleFactor:1});
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
   if(!first||ratio<.82||Math.abs(first.x)>Math.max(24,v.viewport*.07)||v.scroll>v.viewport*1.06){
     await p.screenshot({path:"/tmp/lexlearn-conference-"+lang+"-"+width+".png",fullPage:false}).catch(()=>{});
     throw new Error("Conference squashed or horizontally overflowing: "+JSON.stringify({width,lang,...v,ratio}));
   }
   assert.ok(v.top.width>v.viewport*.82,"Header should use the whole mobile width");
   console.log("CONFERENCE_VIEWPORT_OK "+JSON.stringify({width,lang,ratio,scroll:v.scroll,client:v.client,scale:v.scale}));
   await c.close();
 }
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
