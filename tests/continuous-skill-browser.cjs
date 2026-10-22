/* Read-only browser verification, mocked CLOUD service. No production writes. */
const {chromium}=require("playwright-core");
const fs=require("node:fs"),assert=require("node:assert/strict");
const base="http://127.0.0.1:18765/";
const chrome=[process.env.CHROME_BIN,"/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium"].find(p=>p&&fs.existsSync(p));
const cases=[
 {name:"recall-led",r:94,u:20,n:12,ar:"ابدأ بالقاعدة التي تتذكرها",en:"Begin with the legal rule you can retrieve"},
 {name:"understanding-led",r:21,u:94,n:12,ar:"ابدأ بالمعنى الذي تفهمه",en:"Begin with the meaning you understand"},
 {name:"close-gap",r:66,u:64,n:12,ar:"اشرح القاعدة بأسلوبك",en:"Explain the rule in your own words"},
 {name:"double-low",r:25,u:24,n:12,ar:"ابدأ بمثال محلول",en:"Start with a worked example"},
 {name:"few-evidence",r:95,u:20,n:1,ar:"اشرح القاعدة بأسلوبك",en:"Explain the rule in your own words"}
];
(async()=>{
 assert.ok(chrome,"Chromium required");
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:["--no-sandbox","--disable-dev-shm-usage"]});
 const checks=[];
 try{
 for(const s of cases)for(const lang of ["ar","en"]){
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  const page=await ctx.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  const rows=[];
  for(let i=0;i<s.n;i++)for(const [dimension,score] of [["recall",s.r],["understanding",s.u]]){
   rows.push({session_number:1,item_id:dimension+"-"+i,dimension,
    evaluation:{status:"preliminary_internal",provisional_percent:score}});
  }
  const fakeCloud="(function(){const rows="+JSON.stringify(rows)+";"+
   "const query={select(){return this;},eq(){return this;},gte(){return this;},lte(){return this;},order(){return this;},limit:async()=>({data:rows,error:null})};"+
   "window.LEX_CLOUD={db:()=>({from:()=>query}),studentLifecycleRpc:async(action)=>{"+
   "if(action==='trainingOverview')return {allowed:true,unlocked:2,completed_count:1};"+
   "if(action==='trainingOpen')return {allowed:true,session:2,saved:[],completed:false,weakest:'recall',initial_plan:'balanced',tasks:[{id:'task-2',dimension:'understanding',title_ar:'فهم القاعدة',title_en:'Understand the rule',prompt_ar:'اشرح القاعدة القانونية وسببها.',prompt_en:'Explain the legal rule and why it applies.'}]};"+
   "throw Error('Unexpected fixture RPC '+action);}};})();";
  await page.route("**/assets/cloud-data.js**",r=>r.fulfill({status:200,contentType:"application/javascript",body:fakeCloud}));
  await page.route("**/assets/official-diagnostic.js**",r=>r.fulfill({status:200,contentType:"application/javascript",
   body:"window.LEX_OFFICIAL_DIAGNOSTIC={identity:async()=> 'fixture-student'};"}));
  await page.goto(base+"student-path.html?lang="+lang+"&session=2",{waitUntil:"domcontentloaded",timeout:30000});
  const stage=page.locator(".stage");
  await stage.waitFor({timeout:15000});
  const visible=await stage.innerText();
  assert.ok(visible.includes(s[lang]),s.name+" "+lang+": wrong/absent personal guidance: "+visible);
  assert.ok(visible.includes(lang==="ar"?"توجيه تدريبي قابل للتعديل":"provisional practice guidance"));
  assert.ok(!visible.includes("اكتملت تدريبات الجلسة"));
  assert.equal(errors.length,0,s.name+" "+lang+" errors "+errors.join("; "));
  checks.push({name:s.name,lang,passed:true});
  await ctx.close();
 }
 }finally{await browser.close();}
 console.log("Real Chrome skill-guidance checks with MOCKED server (10 views): PASS "+JSON.stringify(checks));
})().catch(e=>{console.error(e);process.exitCode=1;});
