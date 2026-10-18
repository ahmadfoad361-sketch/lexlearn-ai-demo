// Safe, unauthenticated readiness probe: never submits a real contact request.
// Used by CI as a non-blocking live diagnostic. No secrets or contact data logged.
"use strict";
const endpoint="https://emxiuwcuxyljfynnzpnh.supabase.co/functions/v1/conference-lead";
const origin="https://ahmadfoad361-sketch.github.io";
const abort=()=>AbortSignal.timeout(12000);
const request=async(method,headers={},body)=>fetch(endpoint,{
  method,headers:{"Origin":origin,...headers},body,signal:abort(),redirect:"error"});
try{
 const pre=await request("OPTIONS",{"Access-Control-Request-Method":"POST",
   "Access-Control-Request-Headers":"content-type"});
 if(pre.status!==204||pre.headers.get("access-control-allow-origin")!==origin)
   throw Error("Valid-origin CORS preflight failed: "+pre.status);
 const bad=await fetch(endpoint,{method:"GET",headers:{"Origin":"https://untrusted.example"},
   signal:abort()});
 if(bad.status!==403)throw Error("Unknown origin not denied: "+bad.status);
 const good=await request("GET");
 if(good.status!==200||good.headers.get("access-control-allow-origin")!==origin)
   throw Error("Valid-origin readiness endpoint failed: "+good.status);
 const config=await good.json();
 if(typeof config.enabled!=="boolean"||typeof config.policyVersion!=="string")
   throw Error("Malformed readiness response");
 console.log("Conference intake: origin/CORS/security response PASS");
 console.log("Conference intake operational state:",config.enabled?"enabled":"disabled");
 // This deliberately invalid request must never pass validation or create a lead.
 const post=await request("POST",{"Content-Type":"application/json"},"{}");
 const result=await post.json();
 if(config.enabled){
   if(post.status!==400||result.error!=="invalid_fields")throw Error("Invalid contact request bypassed validation");
   console.log("Conference intake: invalid request rejected; readiness PASS");
 }else{
   if(post.status!==503||result.error!=="not_configured")throw Error("Disabled intake incorrectly accepted a submission");
   console.log("Conference intake: fail-closed confirmed. Configure secure notifications & Turnstile before activation.");
 }
}catch(error){
 console.error("Conference intake live readiness probe failed:",error.message);
 process.exitCode=1;
}
