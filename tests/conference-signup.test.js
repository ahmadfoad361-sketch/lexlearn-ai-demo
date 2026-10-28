const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const client=fs.readFileSync("assets/student-register.js","utf8");
const server=fs.readFileSync("supabase/functions/student-register-whatsapp/index.ts","utf8");
const ar=fs.readFileSync("student-register.html","utf8");
const en=fs.readFileSync("student-register-en.html","utf8");
assert.match(server,/email:internalEmail,password,email_confirm:true/,"conference auth must use internal confirmed login identity");
assert.doesNotMatch(server,/active:true,account_status:"active"/,"public signup must never autoactivate");
assert.match(server,/account_status:"pending"/);
assert.match(server,/role!=="student"/,"only students can be created");
assert.doesNotMatch(server,/!name\|\|!university\|\|!year\|\|!phone/,"contact must not be mandatory");
for(const html of [ar,en]){
 assert.match(html,/id="conferenceAccount"/);
 assert.match(html,/id="createdUsername"/);
 assert.match(html,/id="createdStudentName"/);
 assert.ok(html.indexOf("</form>")>=0&&html.indexOf("</form>")<html.indexOf('id="conferenceAccount"'),
 "Username confirmation must be outside the form (form is hidden after registration)");
 assert.ok(html.indexOf("</form>")<html.indexOf('id="status"'),
 "Status message must remain visible after form is hidden");
 assert.doesNotMatch(html,/id="whatsapp"[^>]*\srequired\b/);
 assert.doesNotMatch(html,/id="email"[^>]*\srequired\b/);
 assert.match(html,/id="faculty"[^>]*required/);
 assert.match(html,/id="academicSection"/);
 assert.match(html,/id="studentNumber"/);
 assert.match(html,/id="groupEmail"/);
}
async function runSignup({email="",phone="",lang="ar",accepted=true}={}){
 let signupArgs=null,signedIn=null,submit=null,reset=false;
 const storage=new Map();
 const elements={
  downloadInitialCard:{},registerForm:{hidden:false,addEventListener:(ev,fn)=>{if(ev==="submit")submit=fn;},reset:()=>{reset=true;}},
  status:{textContent:"",className:""},registerBtn:{disabled:false},
  conferenceAccount:{hidden:true},createdUsername:{textContent:""},createdStudentName:{textContent:""},
  copyUsername:{textContent:"",addEventListener:()=>{}},startTraining:{href:"#",textContent:""},
  fullName:{value:"Test Learner"},email:{value:email},whatsapp:{value:phone},
  password:{value:"ConferenceTest!123"},university:{value:"Qatar University"},
  faculty:{value:"College of Law"},academicSection:{value:"Civil Law"},studentNumber:{value:"REG-001"},groupEmail:{value:"class@university.edu"},
  year:{value:"Year 1"},country:{value:"qa"},consent:{checked:accepted},unusedLegacyField:{checked:false}
 };
 const cloud={
  isConfigured:()=>true,
  db:()=>({functions:{invoke:async(name,args)=>{
   signupArgs={name,...args.body};
   return {data:{ok:true,username:"lexabc123def456",can_sign_in:true}};
  }}}),
  signInStudent:async(username,password)=>{
   signedIn={username,password};
   return {profile:{id:"test-id",username,display_name:"Test Learner",country_code:"qa"}};
  }
 };
 const document={documentElement:{lang},getElementById:id=>elements[id]};
 const localStorage={setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null};
 const context={document,URLSearchParams,location:{hash:""},window:{LEX_CLOUD:cloud,addEventListener(){}},LEX_CLOUD:cloud,localStorage,navigator:{clipboard:{writeText:async()=>{}}},console};
 vm.runInNewContext(client,context);
 await submit({preventDefault(){}});
 return {signupArgs,signedIn,reset,storage,elements};
}
(async()=>{
 const rejected=await runSignup({accepted:false});assert.equal(rejected.signupArgs,null,"unchecked registration terms must not create an account");
 const empty=await runSignup();
 assert.equal(empty.signupArgs.whatsapp_e164,null);
 assert.equal(empty.signupArgs.email,null);
 assert.equal(empty.signupArgs.faculty,"College of Law");
 assert.equal(empty.signupArgs.accepted_terms_version,"2026-10-23-v6","single registration acceptance names the disclosed terms version");
 assert.equal(empty.signupArgs.academic_section,"Civil Law");
 assert.equal(empty.signupArgs.student_registration_number,"REG-001");
 assert.equal(empty.signupArgs.institutional_group_email,"class@university.edu");
 assert.equal(empty.elements.conferenceAccount.hidden,false);
 assert.equal(empty.elements.registerForm.hidden,true);
 assert.equal(empty.elements.createdUsername.textContent,"lexabc123def456");
 assert.equal(empty.elements.createdStudentName.textContent,"Test Learner");
 assert.equal(empty.elements.startTraining.href,"student-login.html");
 assert.equal(empty.signedIn,null,"pending accounts do not sign in automatically");
 assert.equal(empty.reset,true);
 assert.equal(empty.storage.get("lexlearn_last_student_username"),"lexabc123def456");
 assert.ok(!empty.storage.get("lexlearn_student_session"));
 assert.ok(!Array.from(empty.storage.values()).some(v=>v==="ConferenceTest!123"),"password must not be saved");
 const contact=await runSignup({email:"learner@example.com",phone:"+974 5555 1234",lang:"en"});
 assert.equal(contact.signupArgs.email,"learner@example.com");
 assert.equal(contact.signupArgs.whatsapp_e164,"+97455551234");
 assert.equal(contact.elements.startTraining.href,"student-login-en.html");
 console.log("conference registration optional-contact and pending-approval smoke tests: PASS");
})().catch(err=>{console.error(err);process.exitCode=1;});

