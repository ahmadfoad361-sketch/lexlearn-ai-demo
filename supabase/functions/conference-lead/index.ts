import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const previewOrigin = "https://ahmadfoad361-sketch.github.io";
// Set LEX_ALLOWED_ORIGINS to exact comma-separated HTTPS origins after buying the domain.
// Turnstile must separately allow each hostname in its Cloudflare widget settings.
function allowedOrigins() {
  const added=(Deno.env.get("LEX_ALLOWED_ORIGINS")||"").split(",").map(v=>v.trim())
    .filter(v=>/^https:\/\/[a-z0-9.-]+(?::\d{2,5})?$/i.test(v));
  return new Set([previewOrigin,...added]);
}
const policyVersion = "2026-10-17";
const encoder = new TextEncoder();

function respond(req:Request, payload:Record<string,unknown>, status=200) {
  const origin=req.headers.get("origin");
  const headers:Record<string,string>={
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store", "Vary":"Origin",
    "X-Content-Type-Options":"nosniff"
  };
  if(origin&&allowedOrigins().has(origin))headers["Access-Control-Allow-Origin"]=origin;
  return new Response(JSON.stringify(payload),{status,headers});
}
function config() {
  const siteKey=Deno.env.get("TURNSTILE_SITE_KEY")||"";
  const secret=Deno.env.get("TURNSTILE_SECRET_KEY")||"";
  let serverKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!serverKey){try{serverKey=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default||"";}catch(_){}}
  // Without a configured notification recipient, the owner has no staff inbox for
  // these private records. Fail closed instead of silently accepting unseen leads.
  // Never expose notification email addresses or API keys to the browser.
  const notifyReady=Boolean(Deno.env.get("RESEND_API_KEY")&&
    Deno.env.get("LEAD_NOTIFY_TO")&&Deno.env.get("LEAD_NOTIFY_FROM"));
  return {enabled:Boolean(siteKey&&secret&&serverKey&&notifyReady),
    siteKey:siteKey&&secret?siteKey:"",policyVersion};
}
function clean(v:unknown,max:number) {
  if(typeof v!=="string"||v.length>max+50)return "";
  return v.replace(/[\u0000-\u001f\u007f]/g," ").trim();
}
function canonicalContact(v:string) {
  if(v.includes("@"))return v.toLowerCase();
  const noPunctuation=v.replace(/[\s().\-]/g,"");
  return noPunctuation.startsWith("00")?"+"+noPunctuation.slice(2):noPunctuation;
}
function validContact(v:string){
  return v.includes("@") ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)&&v.length<=120
    : /^\+?[0-9]{7,15}$/.test(v.replace(/[\s().\-]/g,""));
}
function hex(bytes:ArrayBuffer){return Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,"0")).join("");}
async function keyedDigest(scope:string,value:string) {
  const key=Deno.env.get("LEAD_HMAC_SECRET")||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(key.length<30)throw new Error("hmac_secret_missing");
  const imported=await crypto.subtle.importKey("raw",encoder.encode(key),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return hex(await crypto.subtle.sign("HMAC",imported,encoder.encode(scope+"|"+value)));
}
function adminClient(){
  let key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!key){try{key=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default||"";}catch(_){}}
  if(!key)throw new Error("backend_not_configured");
  return createClient(Deno.env.get("SUPABASE_URL")||"",key,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function turnstileCheck(token:string,ip:string,hostname:string){
  const secret=Deno.env.get("TURNSTILE_SECRET_KEY")||"";
  if(!secret||token.length<5||token.length>2048)return false;
  const body=new URLSearchParams({secret,response:token});
  if(ip!=="unknown")body.set("remoteip",ip);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6000);
  try {
    const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
      method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body,signal:controller.signal
    });
    if(!response.ok)return false;
    const check=await response.json();
    return check.success===true&&check.hostname===hostname;
  }catch(_){return false;}finally{clearTimeout(timer);}
}
async function deliverNotification(db:ReturnType<typeof adminClient>,id:string,data:{name:string,role:string,organization:string,contact:string}){
  const token=Deno.env.get("RESEND_API_KEY")||"";
  const recipient=Deno.env.get("LEAD_NOTIFY_TO")||"";
  const sender=Deno.env.get("LEAD_NOTIFY_FROM")||"";
  // Defensive safeguard if notifications are revoked between readiness and delivery.
  if(!token||!recipient||!sender){
    await db.from("conference_leads").update({notification_status:"failed",
      notification_retry_after:new Date(Date.now()+15*60*1000).toISOString()}).eq("id",id);
    return;
  }
  // A failed email must never undo a saved inquiry.
  const {error:claimError}=await db.from("conference_leads").update({notification_status:"sending",notification_attempts:1}).eq("id",id);
  if(claimError)return;
  let sent=false;
  try{
    const response=await fetch("https://api.resend.com/emails",{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token,
        "Idempotency-Key":"lexlearn-conference-"+id},
      signal:AbortSignal.timeout(6000),
      body:JSON.stringify({from:sender,to:[recipient],subject:"LexLearn — New conference inquiry",
        text:["New conference inquiry","Name: "+data.name,"Role: "+data.role,
        "Organization: "+(data.organization||"—"),"Contact: "+data.contact,"Received via the LexLearn conference page."].join("\n")})
    });
    sent=response.ok;
  }catch(_){}
  await db.from("conference_leads").update({
    notification_status:sent?"sent":"failed",
    notification_sent_at:sent?new Date().toISOString():null,
    notification_retry_after:sent?null:new Date(Date.now()+15*60*1000).toISOString()
  }).eq("id",id);
}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(!origin||!allowedOrigins().has(origin))return respond(req,{error:"forbidden_origin"},403);
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
    "Access-Control-Allow-Origin":origin,
    "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":"content-type",
    "Access-Control-Max-Age":"600","Vary":"Origin"
  }});
  if(req.method==="GET")return respond(req,config());
  if(req.method!=="POST")return respond(req,{error:"method_not_allowed"},405);
  const setup=config();
  if(!setup.enabled)return respond(req,{error:"not_configured"},503);
  if(!req.headers.get("content-type")?.toLowerCase().startsWith("application/json"))return respond(req,{error:"invalid_content_type"},415);
  const size=Number(req.headers.get("content-length")||0);
  if(size>6000)return respond(req,{error:"invalid_request"},413);
  let input:Record<string,unknown>;
  try{const raw=await req.text();if(raw.length>6000)throw new Error("too_large");input=JSON.parse(raw);}catch(_){return respond(req,{error:"invalid_request"},400);}
  if(typeof input!=="object"||input===null||Array.isArray(input))return respond(req,{error:"invalid_request"},400);
  if(clean(input.website,100)!=="")return respond(req,{error:"invalid_request"},400);
  const name=clean(input.name,100),organization=clean(input.organization,130),
    role=clean(input.role,30),contact=clean(input.contact,120),captcha=clean(input.turnstileToken,2048);
  if(name.length<2||name.length>100||(organization&&organization.length<2)||organization.length>130||
    !["student","investor","university"].includes(role)||!validContact(contact)||
    input.consent!==true||input.privacyNoticeVersion!==policyVersion)
    return respond(req,{error:"invalid_fields"},400);
  const ip=(req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||(req.headers.get("x-forwarded-for")||"").split(",")[0]||"unknown").trim().slice(0,100);
  if(!await turnstileCheck(captcha,ip,new URL(origin).hostname))return respond(req,{error:"security_check_failed"},403);
  try {
    const db=adminClient();
    const ipHash=await keyedDigest("ip-v1",ip);
    const contactKey=canonicalContact(contact);
    const today=new Date().toISOString().slice(0,10);
    const dedupeKey=await keyedDigest("lead-dedupe-v1",today+"|"+role+"|"+contactKey);
    const {data:allowed,error:rateError}=await db.rpc("reserve_conference_lead_attempt",{p_fingerprint:ipHash});
    if(rateError)return respond(req,{error:"temporarily_unavailable"},503);
    if(!allowed)return respond(req,{error:"slow_down"},429);
    const {data:record,error:insertError}=await db.from("conference_leads").insert({
      visitor_name:name,organization:organization||null,faculty:null,audience:role,
      contact,interest:null,consent:true,source:"web_summit_qatar_2027",
      ip_fingerprint:ipHash,dedupe_key:dedupeKey,privacy_notice_version:policyVersion,
      consent_at:new Date().toISOString(),notification_status:"pending",lead_status:"new"
    }).select("id").single();
    if(insertError?.code==="23505")return respond(req,{ok:true});
    if(insertError||!record?.id){console.error("conference lead storage failed",insertError?.code||"missing_id");return respond(req,{error:"temporarily_unavailable"},503);}
    await deliverNotification(db,record.id,{name,role,organization,contact});
    return respond(req,{ok:true});
  }catch(e){console.error("conference lead intake unavailable",e instanceof Error?e.message:"unknown");return respond(req,{error:"temporarily_unavailable"},503);}
});
