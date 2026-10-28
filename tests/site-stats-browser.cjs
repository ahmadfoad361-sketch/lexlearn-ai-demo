const {chromium}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs');
const BASE=(process.env.BASE_URL||'http://127.0.0.1:18765/').replace(/\/?$/,'/');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const fixture={ok:true,started_at:'2026-10-28T00:00:00Z',since:'2026-10-28T00:00:00Z',until:'2026-10-28T12:00:00Z',views:12,visitors:4,visits:6,returning_visitors:2,registered_students:9,active_students:8,registered_instructors:1,new_students:1,active_accounts:3,account_total:1,daily:[{day:'2026-10-28',views:12,visits:6,visitors:4}],pages:[{page:'index.html',views:12,visitors:4}],accounts:[{id:'fixture',display_name:'حساب اختبار',username:'sample',role:'student',active:true,visits:2,last_seen:'2026-10-28T12:00:00Z',login_available:true,last_sign_in_at:'2026-10-27T10:00:00Z'}]};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{for(const width of [390,1440])for(const theme of ['light','dark']){
  const ctx=await browser.newContext({viewport:{width,height:1000}});
  await ctx.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));
  await ctx.route('**/*.supabase.co/**',r=>r.abort());
  await ctx.route('**/assets/cloud-data.js*',r=>r.fulfill({contentType:'application/javascript',body:'window.LEX_CLOUD={profile:async()=>({role:"owner",active:true}),db:()=>({functions:{invoke:async()=>window.__failStats?{error:Error("offline")}:{data:'+JSON.stringify(fixture)+'}}})};'}));
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(BASE+'admin-analytics.html',{waitUntil:'networkidle'});await p.locator('.analyticsKpis').waitFor();
  if(await p.locator('html').getAttribute('data-learner-theme')!==theme)await p.locator('#learnerThemeToggle').click();
  assert.equal(await p.locator('.analyticsKpis .metric').count(),8);assert.ok(await p.getByText('حساب اختبار',{exact:true}).isVisible());
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow');
  await p.locator('#statsPeriod').selectOption('30');await p.locator('.analyticsKpis').waitFor();
  assert.ok(await p.locator('#statsNext').isDisabled());
  fs.mkdirSync('supervisor-browser-evidence',{recursive:true});await p.screenshot({path:'supervisor-browser-evidence/stats-fixture-'+theme+'-'+width+'.png',fullPage:true});
  await p.evaluate(()=>window.__failStats=true);await p.locator('#statsRefresh').click();await p.getByText(/تعذر تحميل الإحصاءات/).waitFor();assert.equal(await p.locator('.analyticsKpis').count(),0,'error never rendered as zero visits');
  await p.evaluate(()=>window.LEX_CLOUD.profile=async()=>({role:'student',active:true}));await p.locator('#statsRefresh').click();await p.getByText('هذه الإحصاءات متاحة للمشرف المفوّض ومالك المنصة فقط.').waitFor();
  assert.deepEqual(errors,[]);await ctx.close();
 }}finally{await browser.close();}
 console.log('PASS stats dark/light mobile/desktop, ranges, last login, service error and student access gate (fixture data only)');
})().catch(e=>{console.error(e);process.exitCode=1;});
