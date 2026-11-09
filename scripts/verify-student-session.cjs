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
 console.log('PASS: student glossary has no difficulty labels or ready-made entries; staff report is separate.');
 console.log('PASS: glossary matching, original legal text, HTML escaping, active course routing, consent boundary, and sample legal quiz.');
 console.log('PASS: Arabic and English session recovery, missing/expired Auth, stale identity, network errors, role/activation, admission, enrollment, consent, and cross-tab sign-out.');
})().catch(e=>{console.error(e);process.exitCode=1;});
