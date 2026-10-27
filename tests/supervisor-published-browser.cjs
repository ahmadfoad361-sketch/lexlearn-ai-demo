/* Real deployed HTML/CSS/JS; synthetic, read-only account data. No production login or writes. */
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const BASE=(process.env.BASE_URL||'http://127.0.0.1:18765/').replace(/\/?$/,'/');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const students=[
 {id:'s1',username:'sample1',name:'طالب اختبار ١',country:'qa',university:'Lusail University',faculty:'law',year:'السنة الأولى',active:true},
 {id:'s2',username:'sample2',name:'طالب اختبار ٢',country:'qa',university:'جامعة لوسيل',faculty:'القانون',year:'الفرقة الأولى',active:true},
 {id:'s3',username:'sample3',name:'طالب دون مادة',country:'qa',university:'لوسيل',faculty:'كلية القانون',year:'أولى',active:true},
 {id:'s4',username:'sample4',name:'طالب كلية أخرى',country:'qa',university:'Qatar University',faculty:'كلية الحقوق',year:'السنة الثانية',active:true}
];
const teachers=[{instructor_id:'p1',academic_title:'دكتور',profiles:{display_name:'أستاذ اختبار أول',active:true}},
 {instructor_id:'p2',academic_title:'دكتور',profiles:{display_name:'أستاذ اختبار ثان',active:true}}];
const assignments=teachers.map((t,i)=>({instructor_id:t.instructor_id,course_id:'course'+i,subject_name:i?'القانون الدستوري':'القانون المدني',country_code:'qa',university:i?'لوسيل':'Lusail University',faculty:i?'law':'كلية القانون',year_label:i?'الفرقة الأولى':'السنة الأولى',active:true}));
const enrollments=[{user_id:'s1',course_id:'course0'},{user_id:'s1',course_id:'course1'},{user_id:'s2',course_id:'course0'}];
function fakeCloud({students,teachers,assignments,enrollments,role='owner',active=true}){
 localStorage.setItem('lexlearn_admin_session',JSON.stringify({cloud:true}));
 const query=table=>{const q={select(){return q},eq(){return q},order(){return q},limit(){return q},then(resolve,reject){return Promise.resolve({data:table==='enrollments'?enrollments:table==='courses'?[{id:'course0',title_ar:'القانون المدني'}]:[]}).then(resolve,reject)}};return q;};
 window.__instructorCreates=[];
 const db={from:query,auth:{getUser:async()=>({data:{user:{id:'fixture'}}})},functions:{invoke:async(name,options)=>{
  if(name==='admin-manage-instructors'&&options?.body?.action==='create'){
   window.__instructorCreates.push(options.body);
   if(window.__instructorCreates.length===1)return {error:{context:{json:async()=>({error:'email_already_registered'})}}};
   return {data:{ok:true,email:options.body.email,temporary_password:'FIXTURE-ONLY-NOT-A-REAL-PASSWORD'}};
  }
  return {data:name==='admin-manage-instructors'?{ok:true,instructors:teachers,assignments}:{ok:true,records:{}}};
 }}};
 window.__academicSaves=[];
 window.LEX_CLOUD={isConfigured:()=>true,db:()=>db,profile:async()=>({id:'fixture',role,active}),listStudents:async()=>students,
 listCohorts:async()=>[],listAudit:async()=>[],listContentItems:async()=>[],manageStudent:async data=>window.__academicSaves.push(data)};
}
async function installFixture(ctx,data){
 await ctx.route('**/assets/cloud-data.js*',route=>route.fulfill({contentType:'application/javascript',body:'('+fakeCloud.toString()+')('+JSON.stringify(data)+');'}));
 await ctx.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await ctx.route('**/*.supabase.co/**',route=>route.abort());
}
(async()=>{
 assert.ok(chrome,'Chrome is required');
 const manifest=await (await fetch(BASE+'build-manifest.json?check='+Date.now())).json();
 if(process.env.EXPECTED_BUILD_SHA)assert.equal(manifest.commit,process.env.EXPECTED_BUILD_SHA);
 for(const asset of ['assets/admin-cloud.js','assets/admin-entry.js','assets/admin-appearance.js','assets/admin-instructors.js','assets/admin-experience.css','assets/academic-display.js','assets/lexlearn-navigation.js',...['qa','eg','sa','ae'].map(c=>'assets/flags/'+c+'.svg')]){
  const response=await fetch(BASE+asset+'?v='+manifest.build);assert.equal(response.status,200,asset);
  const bytes=Buffer.from(await response.arrayBuffer());
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),manifest.assets[asset],asset+' matches released artifact');
  assert.ok(bytes.equals(fs.readFileSync(asset)),asset+' matches exact checkout source');
 }
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const theme of ['light','dark'])for(const mobile of [false,true]){
   const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000}});
   await installFixture(ctx,{students,teachers,assignments,enrollments});
   const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(BASE+'admin.html',{waitUntil:'networkidle'});
   await p.locator('.studentHierarchy').waitFor();
   // Theme is a visual setting; fixture data never touches production services.
   await p.evaluate(theme=>{localStorage.setItem('lexlearn_learner_theme',theme);document.documentElement.setAttribute('data-learner-theme',theme);},theme);
   assert.equal(await p.locator('.level-country').count(),4);
   for(const country of ['qa','eg','sa','ae']){
    const node=p.locator('.country-'+country);
    assert.equal(await node.locator(':scope > summary .treeCount').textContent(),country==='qa'?'4':'0');
    assert.ok(await node.locator('.countryFlag img').evaluate(img=>img.complete&&img.naturalWidth>0),'local flag '+country);
   }
   assert.equal(await p.locator('.level-faculty').count(),2,'Lusail law aliases share one college');
   const year=p.locator('.level-year').filter({hasText:'أستاذ اختبار أول'});
   assert.equal(await year.locator(':scope > summary .treeCount').textContent(),'3','no duplicate count across two courses');
   assert.equal(await year.locator('.treeProfessor').count(),2);
   assert.equal(await year.locator('.treeUnassigned [data-student="s3"]').count(),1);
   assert.equal(await year.locator('[data-student="s1"]').count(),2);
   const summary=year.locator(':scope > summary');
   const color=()=>summary.evaluate(el=>getComputedStyle(el).backgroundColor);
   await summary.evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
   assert.equal(await color(),theme==='light'?'rgb(219, 233, 238)':'rgb(52, 75, 96)');
   const tileColor=await year.locator('.studentBtn').first().evaluate(el=>getComputedStyle(el).backgroundColor);
   assert.notEqual(tileColor,await color(),'student cards retain their own background');
   await summary.click();assert.equal(await year.getAttribute('open'),null);
   await summary.evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
   assert.notEqual(await color(),theme==='light'?'rgb(219, 233, 238)':'rgb(52, 75, 96)');
   await summary.click();
   assert.equal(await p.locator('.studentHero').getByText(/الفرقة الأولى/).count(),1);
   assert.equal(await p.locator('[data-record-section="notes"]').getAttribute('open'),null);
   await p.locator('[data-record-section="notes"] > summary').click();
   assert.ok(await p.locator('[data-record-section="notes"] .recommend').first().isVisible());
   const reading=await p.evaluate(()=>{
    function style(selector){const el=document.querySelector(selector),s=getComputedStyle(el);let node=el,bg=s.backgroundColor;while(node.parentElement&&bg==='rgba(0, 0, 0, 0)'){node=node.parentElement;bg=getComputedStyle(node).backgroundColor;}return {size:parseFloat(s.fontSize),color:s.color,bg};}
    return {body:style('body'),title:style('.treeTitle'),secondary:style('.treeProfessorHeader small'),link:style('.treeEditTeacher'),active:style('.nav button.active')};
   });
   assert.equal(reading.body.size,18);assert.ok(reading.title.size>=18);assert.ok(reading.secondary.size>=16);
   function luminance(rgb){return rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);}
   for(const [key,value] of Object.entries(reading)){const a=luminance(value.color),b=luminance(value.bg);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,key+' contrast');}
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'normal reading: no horizontal overflow');
   assert.equal(await p.locator('[name="year_label"]').inputValue(),'الفرقة الأولى');
   await p.locator('#studentAcademicForm button[type="submit"]').click();
   await p.waitForFunction(()=>window.__academicSaves.length===1);
   await p.locator('.studentHierarchy').waitFor();
   assert.notEqual(await p.locator('[data-record-section="notes"]').getAttribute('open'),null,'section state survives save');
   const saves=await p.evaluate(()=>window.__academicSaves);
   assert.equal(saves[0].patch.year_label,'السنة الأولى');assert.equal(saves[0].patch.university,'Lusail University');
   assert.equal(saves[0].patch.faculty,'law');
   const entry=await p.locator('script[src*="admin-entry.js"]').getAttribute('src');
   const cloud=await p.locator('script[src*="admin-cloud.js"]').getAttribute('src');
   assert.equal(new URL(entry,BASE).searchParams.get('v'),manifest.build);
   assert.equal(new URL(cloud,BASE).searchParams.get('v'),manifest.build);
   const css=await p.locator('link[href*="admin-experience.css"]').getAttribute('href');
   assert.equal(new URL(css,BASE).searchParams.get('v'),manifest.build);
   assert.equal(await p.locator('.lexlearnBrandHome').getAttribute('href'),'index.html');
   await p.locator('[data-record-section="notes"] > summary').click();
   await p.evaluate(()=>window.scrollTo(0,0));
   if(process.env.LEX_VIDEO_DIR){fs.mkdirSync(process.env.LEX_VIDEO_DIR,{recursive:true});await p.screenshot({path:process.env.LEX_VIDEO_DIR+'/supervisor-fixture-'+theme+'-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});}
   await p.getByLabel('تكبير الخط أكثر').check();
   assert.equal(await p.locator('body').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),20);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'large reading: no horizontal overflow');
   await p.reload({waitUntil:'networkidle'});await p.locator('.studentHierarchy').waitFor();
   assert.ok(await p.getByLabel('تكبير الخط أكثر').isChecked(),'reading preference survives reload');
   await p.locator('.treeEditTeacher').first().click();
   await p.locator('.facultyEditForm').waitFor();
   assert.ok((await p.url()).includes('admin-instructors.html?edit=p1'));
   assert.equal(await p.locator('select[name="year_label"]').first().locator('option').first().textContent(),'الفرقة الأولى');
   assert.equal(await p.locator('html').getAttribute('data-learner-theme'),theme);
   assert.ok(await p.getByLabel('تكبير الخط أكثر').isChecked());
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'teacher management no overflow');
   const form=p.locator('#createInstructor');
   await form.locator('[name="name"]').fill('أستاذ اختبار للبريد');
   await form.locator('[name="email"]').fill('teacher.name+law@gmail.com');
   await form.locator('[name="subject_name"]').fill('القانون المدني');
   await form.locator('[name="university"]').fill('جامعة لوسيل');
   await form.locator('[name="faculty"]').fill('كلية القانون');
   await form.locator('[type="submit"]').click();
   await p.waitForFunction(()=>document.getElementById('createStatus').textContent.includes('مسجل لحساب آخر'));
   assert.equal(await form.locator('[type="submit"]').isDisabled(),false);
   await form.locator('[type="submit"]').click();
   await p.getByText('بيانات الدخول الأولية — تظهر مرة واحدة').waitFor();
   assert.equal(await p.evaluate(()=>window.__instructorCreates.length),2,'Gmail reaches server; successful retry');
   if(process.env.LEX_VIDEO_DIR){await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:process.env.LEX_VIDEO_DIR+'/instructors-fixture-'+theme+'-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});}
   assert.deepEqual(errors,[]);await ctx.close();
  }
  for(const role of ['student','owner','visitor']){
   const ctx=await browser.newContext();
   await installFixture(ctx,{students:[],teachers:[],assignments:[],enrollments:[],role});
   const p=await ctx.newPage();await p.goto(BASE+'index.html',{waitUntil:'networkidle'});
   const links=p.locator('a[data-lex-demo-locked="1"]');
   if(role==='student')assert.ok(await links.count()>0,'verified student has dimmed demo');
   else assert.equal(await links.count(),0,'visitors and staff keep demo access');
   await ctx.close();
  }
 }finally{await browser.close();}
 console.log('PASS live artifact hashes, supervisor UI light/dark + mobile/desktop, safe alias edits, teacher links and student-only demo dimming (synthetic accounts; no live user data written)');
})().catch(e=>{console.error(e);process.exitCode=1});
