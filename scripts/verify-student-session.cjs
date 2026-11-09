/* Execute the actual Auth and page code against controlled server responses. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function storage(seed={}){const m=new Map(Object.entries(seed));return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}
const profile={id:'verified-user',role:'student',active:true,account_status:'active',display_name:'Verified Student',username:'verified',country_code:'qa'};
async function run({en=false,marker,session=true,error,access,consent=true,role,active=true}={}){
 let reads=0,rpcs=0,signedOut=0,listener;
 const localStorage=storage({'lexlearn_country_setup_v2_rights_verified-user':'true',...(marker?{lexlearn_student_session:JSON.stringify(marker)}:{})});
 const p={...profile,role:role||'student',active};
 const client={auth:{signInWithPassword:async()=>({data:{session:session?{access_token:'test-only'}:null,user:{id:p.id}}}),getSession:async()=>({data:{session:session?{access_token:'test-only'}:null},error}),getUser:async()=>({data:{user:{id:p.id}}}),signOut:async opts=>{assert.equal(opts.scope,'local');signedOut++;},onAuthStateChange:fn=>{listener=fn;}},from:()=>({select:()=>({eq:()=>({single:async()=>{reads++;return {data:p};}})})})};
 const elements=new Map(),element=()=>({innerHTML:'',textContent:'',style:{},addEventListener(){},querySelectorAll:()=>[]});
 const document={getElementById:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);},querySelectorAll:()=>[],documentElement:{lang:en?'en':'ar'}};
 const location={search:'',replace(url){this.redirect=url;},reload(){}};
 const context={document,location,localStorage,sessionStorage:storage(),URLSearchParams,console,LEX_CONFIG:{supabaseUrl:'https://test.supabase.co',supabaseAnonKey:'test'},supabase:{createClient:()=>client},addEventListener(){}};
 context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync('assets/cloud-data.js','utf8'),context);
 const cloud=context.LEX_CLOUD;cloud.getConsent=async()=>consent;
 cloud.studentLifecycleRpc=async(action)=>{rpcs++;if(access)throw Error(access);return action==='status'?{status:'not_started'}:{allowed:false};};
 vm.runInContext(fs.readFileSync('assets/student'+(en?'-en':'')+'.js','utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));
 return {html:elements.get('studentApp').innerHTML,location,localStorage,reads,rpcs,signedOut,cloud,signOutEvent:()=>listener('SIGNED_OUT')};
}
(async()=>{
 for(const en of [false,true]){
  const login=en?'student-login-en.html':'student-login.html';
  let r=await run({en,session:false,marker:{cloud:true,studentId:'cached-user',name:'Cached'}});
  assert.equal(r.location.redirect,login+'?reason=session');assert.equal(r.reads,0);assert.equal(r.rpcs,0);assert.equal(r.localStorage.getItem('lexlearn_student_session'),null);assert.equal(r.signedOut,1);
  r=await run({en});assert.ok(!r.location.redirect);assert.match(r.html,/Verified Student/);assert.equal(r.rpcs,2);assert.equal(JSON.parse(r.localStorage.getItem('lexlearn_student_session')).studentId,profile.id);
  r=await run({en,marker:{cloud:true,studentId:'other-user',name:'Wrong Student'}});assert.match(r.html,/Verified Student/);assert.doesNotMatch(r.html,/Wrong Student/);
  r=await run({en,error:{code:'refresh_token_not_found',status:400}});assert.equal(r.location.redirect,login+'?reason=session');assert.equal(r.rpcs,0);
  r=await run({en,error:{name:'AuthRetryableFetchError',status:0,message:'Failed to fetch'}});assert.ok(!r.location.redirect);assert.equal(r.signedOut,0);assert.match(r.html,en?/Try again/:/إعادة المحاولة/);
  for(const role of ['admin','owner']){r=await run({en,role});assert.equal(r.rpcs,0);assert.equal(r.location.redirect,login+'?reason=session');}
  r=await run({en,active:false});assert.equal(r.rpcs,0);assert.equal(r.location.redirect,login+'?reason=session');
  r=await run({en,access:'student_approval_required'});assert.ok(!r.location.redirect);assert.equal(r.signedOut,0);assert.match(r.html,en?/Training access/:/التدريب غير متاح/);
  r=await run({en,access:'not_enrolled'});assert.match(r.html,en?/not enrolled/:/غير مسجّل/);assert.equal(r.signedOut,0);
  r=await run({en,access:'not_authenticated'});assert.equal(r.location.redirect,login+'?reason=session');
  r=await run({en,consent:false});assert.equal(r.rpcs,0);assert.ok(r.html);assert.equal(r.signedOut,0);
  r=await run({en});r.signOutEvent();assert.equal(r.location.redirect,login+'?reason=session');assert.equal(r.localStorage.getItem('lexlearn_student_session'),null);
 }
 let r=await run();const login=await r.cloud.signInStudent('verified','test-only');assert.equal(login.profile.id,profile.id);
 r.localStorage.setItem('sb-test-auth-token','test-token');r.cloud.setRememberMe(true);assert.equal(r.localStorage.getItem('sb-test-auth-token'),'test-token');
 r.cloud.setRememberMe(false);assert.equal(r.localStorage.getItem('sb-test-auth-token'),null);r.cloud.setRememberMe(true);assert.equal(r.localStorage.getItem('sb-test-auth-token'),'test-token');
 r=await run({role:'admin'});await assert.rejects(()=>r.cloud.signInStudent('admin','test-only'),/student_account_not_active/);
 r=await run({session:false});await assert.rejects(()=>r.cloud.signInStudent('verified','test-only'),/student_session_missing/);

 const glossaryContext={document:{documentElement:{lang:'ar'}}};
 glossaryContext.LEX_GLOSSARY_ACCESS={check:async()=>true,notice:()=>"unlocked",canShowTerms:()=>true};
 vm.createContext(glossaryContext);
 vm.runInContext(fs.readFileSync('assets/personal-glossary.js','utf8'),glossaryContext);
 const dictionary=glossaryContext.LEX_GLOSSARY;
 assert.equal(dictionary.terms.length,16);
 const legalText='قرابة الحواشي هي الصلة بين من يجمعهم أصل مشترك دون أن يكون أحدهم فرعاً للآخر.';
 const rendered=dictionary.linkText(46,legalText);
 assert.match(rendered,/data-lex-term='collateral-kinship'/);
 assert.match(rendered,/قرابة الحواشي/);
 assert.doesNotMatch(dictionary.linkText(45,legalText),/data-lex-term/);
 assert.match(dictionary.linkText(46,'<script>قرابة الحواشي</script>'),/&lt;script&gt;/);
 assert.match(dictionary.appendLink(),/student-glossary.html\?lang=ar/);
 assert.equal(dictionary.apply['collateral-kinship'].a.length,3);
 assert.equal(Object.prototype.hasOwnProperty.call(dictionary.apply['collateral-kinship'],'correct'),false);
 const dictionaryCode=fs.readFileSync('assets/personal-glossary.js','utf8');
 assert.match(dictionaryCode,/lexlearn-glossary-review/);
 assert.match(dictionaryCode,/if\(!allowAi\)throw Error\("ai_consent_needed"\)/);
 assert.match(dictionaryCode,/accept_ai_processing:true/);
 assert.doesNotMatch(dictionaryCode,/OPENAI_API_KEY/);
 const adminGlossary=fs.readFileSync('assets/admin-glossaries.js','utf8');
 assert.match(adminGlossary,/staff_inference/);
 assert.match(adminGlossary,/admin|owner/);
 assert.match(adminGlossary,/lexlearn-admin-glossary/);
 assert.doesNotMatch(dictionaryCode,/staff_inference|lexlearn-admin-glossary|status\(e\)/);
 assert.match(dictionaryCode,/personal_note/);
 assert.match(dictionaryCode,/قاموسك فارغ/);
 assert.doesNotMatch(dictionaryCode,/صعوبة التذكر والفهم|التذكر يحتاج مراجعة|الفهم يحتاج مراجعة/);

 // A student's saved dictionary displays its own definition and example,
 // without importing curated terms automatically or interpreting them as weakness.
 const stubHost={innerHTML:"",querySelector:()=>null};
 const savedExample="<script>bad()</script> مثال قانوني توضيحي";
 const stubEntry={id:"example-test-id",term_key:"chosen-domicile",term_ar:"الموطن المختار",
   course_id:"qa-qu-lawc101-rights",definition_ar:"مكان يختاره الشخص كتابةً لعمل قانوني معين",
   definition_en:"Chosen domicile for a legal transaction",example_ar:savedExample,
   example_en:"A written address selected for contract notices",personal_note:"لاحظت المصطلح في واقعة تدريبية",
   article_number:44,definition_status:"curated",added_at:"2026-11-09T10:00:00Z",
   next_review_at:"2026-11-09T10:00:00Z"};
 glossaryContext.document.getElementById=id=>id==="personalGlossaryApp"?stubHost:null;
 glossaryContext.LEX_CLOUD={
   requireStudent:async()=>({id:"example-test-student"}),
   db:()=>({from:table=>({
     select(){return this},eq(){return this},order(){return this},
     limit(){return Promise.resolve({data:table==="lex_student_glossary"?[stubEntry]:[],error:null})}
   })})
 };
 await dictionary.mountPage();
 assert.match(stubHost.innerHTML,/مثال للتوضيح/);
 assert.match(stubHost.innerHTML,/&lt;script&gt;bad\(\)&lt;\/script&gt;/);
 assert.doesNotMatch(stubHost.innerHTML,/<script>bad/);
 assert.match(stubHost.innerHTML,/لاحظت المصطلح في واقعة تدريبية/);
 assert.match(stubHost.innerHTML,/الموطن المختار/);
 assert.match(dictionaryCode,/example_ar:r\.data\.example_ar/);
 assert.match(dictionaryCode,/example_en:r\.data\.example_en/);
 assert.match(dictionaryCode,/exampleText\.textContent=shownExample/);
 assert.match(dictionaryCode,/lexQuizExample/);
 assert.match(dictionaryCode,/example_ar:value\.example_ar/);


 // The authority is the server's session row, not local state, cached scores or tabs.
 const accessSource=fs.readFileSync('assets/glossary-access.js','utf8');
 const accessContext={document:{documentElement:{lang:'ar'}},URLSearchParams};
 accessContext.window=accessContext;vm.createContext(accessContext);vm.runInContext(accessSource,accessContext);
 const access=accessContext.LEX_GLOSSARY_ACCESS;
 let openState=true,fail=false,calls=0;
 const authCloud={
   requireStudent:async()=>({id:'test_student'}),
   db:()=>({rpc:async(name,args)=>{
     assert.equal(name,'lex_glossary_access_allowed');
     assert.equal(args.p_course_id,'qa-qu-lawc101-rights');calls++;
     return fail?{data:null,error:{message:'outage'}}:{data:openState,error:null};
   }})
 };
 assert.equal(await access.check(authCloud),true);
 assert.match(access.linkHtml(true,'ar'),/student-glossary\.html/);
 assert.equal(access.canShowTerms(),true);
 openState=false;
 assert.equal(await access.check(authCloud),false);
 assert.doesNotMatch(access.linkHtml(false,'ar'),/href=/);
 assert.match(access.notice('ar'),/بعد انتهاء الجلسة/);
 assert.equal(access.canShowTerms(),false);
 fail=true;
 await assert.rejects(()=>access.check(authCloud),/glossary_access_unavailable/);
 assert.equal(access.canShowTerms(),false,'failed auth checks must always close glossary');
 assert.ok(calls>=3);
 
 // Direct URLs must never query glossary rows when a session is still active.
 const lockedHost={innerHTML:'',querySelector(){return null}};
 const deniedContext={document:{documentElement:{lang:'ar'},getElementById:id=>id==='personalGlossaryApp'?lockedHost:null}};
 let protectedReads=0;
 deniedContext.LEX_GLOSSARY_ACCESS={check:async()=>false,notice:()=>access.notice('ar'),canShowTerms:()=>false};
 deniedContext.LEX_CLOUD={requireStudent:async()=>({id:'test_student'}),db:()=>({from(){protectedReads++;throw Error('glossary query must not execute');}})};
 deniedContext.window=deniedContext;vm.createContext(deniedContext);
 vm.runInContext(fs.readFileSync('assets/personal-glossary.js','utf8'),deniedContext);
 const deniedDom=deniedContext.document.getElementById('personalGlossaryApp');
 await deniedContext.LEX_GLOSSARY.mountPage();
 assert.match(deniedDom.innerHTML,/بعد انتهاء الجلسة/);
 assert.equal(protectedReads,0);
 assert.doesNotMatch(deniedContext.LEX_GLOSSARY.linkText(46,'قرابة الحواشي'),/data-lex-term/);
 
 const trainingContext={document:{getElementById:()=>null},location:{search:'?lang=ar'},URLSearchParams};
 trainingContext.window=trainingContext;vm.createContext(trainingContext);
 vm.runInContext(fs.readFileSync('assets/student-path.js','utf8'),trainingContext);
 const rows=[
  {session_number:1,dimension:'recall',evaluation:{status:'preliminary_ai',rubric_version:'lexlearn-training-ai-v4',provisional_percent:40}},
  {session_number:2,dimension:'recall',evaluation:{status:'preliminary_ai',rubric_version:'lexlearn-training-ai-v4',provisional_percent:100}},
  {session_number:1,dimension:'understanding',evaluation:{status:'preliminary_ai',rubric_version:'lexlearn-training-ai-v4',provisional_percent:60}},
  {session_number:2,dimension:'understanding',evaluation:{status:'preliminary_ai',rubric_version:'lexlearn-training-ai-v4',provisional_percent:80}}
 ];
 const aggregate=trainingContext.LEX_STUDENT_PATH.progressHtml(rows,2,true);
 assert.match(aggregate,/إجمالي تقدمك حتى الآن/);
 assert.match(aggregate,/70%/);
 assert.doesNotMatch(aggregate,/سجل نتائج الجلسات|Session evidence history|جلسة 1:|جلسة 2:/);
 assert.doesNotMatch(fs.readFileSync('assets/student-path.js','utf8'),/سجل نتائج الجلسات|Session evidence history/);
 const adminSource=fs.readFileSync('assets/admin-progress.js','utf8');
 assert.match(adminSource,/gradedStageHistoryHtml/,'detailed per-session evidence stays in authorized admin report');
 assert.match(adminSource,/owner","admin/);
 for(const page of ['student.html','student-en.html','student-path.html','student-glossary.html']){
  const html=fs.readFileSync(page,'utf8');
  assert.match(html,/assets\/glossary-access\.js/);
  assert.match(html,/assets\/glossary-access\.css/);
 }
 console.log('PASS: server-verified session gating, direct glossary denial, fail-closed lookup, aggregate-only student reporting and staff history.');

 console.log('PASS: student glossary has no difficulty labels or ready-made entries; staff report is separate.');
 console.log('PASS: glossary matching, original legal text, HTML escaping, active course routing, consent boundary, and sample legal quiz.');
 console.log('PASS: Arabic and English session recovery, missing/expired Auth, stale identity, network errors, role/activation, admission, enrollment, consent, and cross-tab sign-out.');
})().catch(e=>{console.error(e);process.exitCode=1;});
