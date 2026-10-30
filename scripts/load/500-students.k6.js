// k6 --env STAGING_URL=... --env STAGING_ANON_KEY=... --env TEST_USERS_FILE=./staging-users.json
//    --env MODE=read|admission --vus 500 --duration 3m scripts/load/500-students.k6.js
// Safety: NEVER runs against known production project or Github Pages.
import http from "k6/http";
import {check,sleep,fail} from "k6";
import {Rate,Trend} from "k6/metrics";
import exec from "k6/execution";
const base=String(__ENV.STAGING_URL||"").replace(/\/$/,"");
const key=String(__ENV.STAGING_ANON_KEY||"");
if(!base.startsWith("https://")&&!base.startsWith("http://127.0.0.1:"))fail("STAGING_URL required");
if(!key)fail("STAGING_ANON_KEY required");
if(/emxiuwcuxyljfynnzpnh|github\.io|lexlearn\.com|elfekylawfirm/i.test(base))
  fail("REFUSING to stress LexLearn production or a public website.");
const users=JSON.parse(open(__ENV.TEST_USERS_FILE||"./staging-users.json"));
if(!Array.isArray(users)||users.length<500||users.some(u=>!u.email||!u.password))
  fail("Provide 500 isolated staging credentials; do not upload real student passwords.");
const mode=__ENV.MODE||"read";
if(!["read","admission"].includes(mode))fail("MODE must be read or admission");
const course="qa-qu-lawc101-rights";
const failure=new Rate("lex_operation_failure");
const authTime=new Trend("lex_auth_latency",true);
const coreTime=new Trend("lex_core_latency",true);
const queueTime=new Trend("lex_queue_admission_latency",true);
const loadStages=[{duration:"1m",target:500},{duration:"2m",target:500},{duration:"30s",target:0}];
export const options={
 scenarios:{student_flow:{executor:"ramping-vus",startVUs:0,stages:loadStages,gracefulRampDown:"20s"}},
 thresholds:{
  lex_operation_failure:["rate<0.01"],
  lex_core_latency:["p(95)<3000"],
  lex_queue_admission_latency:["p(95)<3000"]
 }
};
let session=null;
function post(path,body,token){
 const headers={"apikey":key,"Content-Type":"application/json"};
 if(token)headers.Authorization="Bearer "+token;
 return http.post(base+path,JSON.stringify(body),{headers,timeout:"20s"});
}
function record(response,label){
 const passed=response.status>=200&&response.status<300;
 failure.add(!passed,{label});
 check(response,{[label+" success"]:r=>r.status>=200&&r.status<300});
 return passed;
}
export default function(){
 const index=(exec.vu.idInTest-1)%500;
 if(!session){
  const start=Date.now();
  const u=users[index];
  const r=post("/auth/v1/token?grant_type=password",{email:u.email,password:u.password});
  authTime.add(Date.now()-start);
  if(!record(r,"login")){sleep(2);return;}
  const payload=r.json();session=payload.access_token;
  if(!session){failure.add(true,{label:"missing_token"});return;}
 }
 const started=Date.now();
 const diag=post("/rest/v1/rpc/lex_diagnostic_status",{p_course:course},session);
 const progress=post("/rest/v1/rpc/lex_training_overview",{p_course:course},session);
 coreTime.add(Date.now()-started);
 record(diag,"diagnostic_read");record(progress,"progress_read");
 const listed=http.get(base+"/rest/v1/lex_ai_queue_jobs?select=id,state&limit=3",{
   headers:{apikey:key,Authorization:"Bearer "+session},timeout:"20s"
 });
 record(listed,"queue_own_read");
 if(mode==="admission"){
  // One attempt to queue a previously saved training answer for this student.
  // Seeded staging credentials must each have one valid saved, authorized answer.
  if(!globalThis.__lexEnqueued){
   const u=users[index],sessionNumber=Number(u.session||1);
   const item=u.item_id||"rights-v1-s1-recall";
   const start=Date.now();
   const queued=post("/functions/v1/lexlearn-ai-enqueue",{
     kind:"training",session:sessionNumber,item_id:item
   },session);
   queueTime.add(Date.now()-start);
   record(queued,"queue_admission");
   globalThis.__lexEnqueued=true;
  }
 }
 sleep(1+Math.random()*2);
}
// This script does NOT issue real LLM requests, only admission/reads in staging.
// Process the queue with a staged worker independently to measure wait-time p95 and costs.
