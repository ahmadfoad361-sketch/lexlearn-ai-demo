/* LexLearn staging-only 500-user grading scenario (k6).
 * NEVER run on production accounts or production Supabase.
 * Requires 500 independent pre-consented synthetic test users with saved answers.
 * Run only after a staging budget and capacity plan are approved.
 * Env: STAGING_FUNCTION_URL, STAGING_PROJECT_REF, TOKEN_FILE, ALLOW_PAID_LOAD_TEST=YES
 */
import http from "k6/http";
import {check} from "k6";
const url=__ENV.STAGING_FUNCTION_URL||"";
const ref=__ENV.STAGING_PROJECT_REF||"";
if(__ENV.ALLOW_PAID_LOAD_TEST!=="YES"||
   !/^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/lexlearn-training-ai-grade$/.test(url)||
   !ref||!url.includes(ref+".supabase.co")||ref==="emxiuwcuxyljfynnzpnh")
 throw Error("A separate approved staging project, explicit paid-test approval and exact URL are required");
const tokens=JSON.parse(open(__ENV.TOKEN_FILE||"/nonexistent-test-tokens.json"));
if(!Array.isArray(tokens)||tokens.length<500||tokens.some(x=>typeof x!=="string"||x.length<30))
 throw Error("Provide 500 different staging access JWTs for 500 synthetic, pre-consented students");
export const options={scenarios:{concurrent_student_grading:{executor:"per-vu-iterations",vus:500,iterations:1,maxDuration:"5m"}},
 thresholds:{http_req_failed:["rate<0.01"]}};
export default function(){
 const token=tokens[__VU-1];
 const response=http.post(url,JSON.stringify({level_one:true,session:1,item_id:"rights-v1-s1-recall"}),{
  headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
  timeout:"150s"});
 check(response,{"request accepted":r=>r.status===200,"grading or safe pending":r=>{
  if(r.status!==200)return false;
  try{return ["preliminary_ai","nonanswer_zero","ai_review_required","ai_pending"].includes(r.json("status"));}catch(_){return false;}
 }});
}
