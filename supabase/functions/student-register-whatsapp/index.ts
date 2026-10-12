import {adminClient,corsHeaders,json} from "../_shared/auth.ts";

// Public WhatsApp-only registration. Accounts are always inactive until manual
// supervisor verification; this endpoint cannot assign elevated roles or courses.
function normalizePhone(value:unknown){
  let s=String(value||"").trim().replace(/[\s().-]/g,"");
  if(s.startsWith("00"))s="+"+s.slice(2);
  return /^\+[1-9][0-9]{7,14}$/.test(s)?s:null;
}
function safeString(value:unknown,n:number){return String(value||"").trim().slice(0,n);}
async function rateKey(req:Request){
  const raw=req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||
    (req.headers.get("x-forwarded-for")||"").split(",")[0].trim()||"anonymous";
  const windowStart=new Date();
  windowStart.setUTCMinutes(0,0,0);
  const salt=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  const bytes=new TextEncoder().encode(salt+"|"+raw+"|"+windowStart.toISOString());
  const hash=await crypto.subtle.digest("SHA-256",bytes);
  return {ip_bucket_hash:Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,"0")).join(""),window_start:windowStart.toISOString()};
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 try{
  const data=await req.json();
  const name=safeString(data.name,160),password=String(data.password||""),
    phone=normalizePhone(data.whatsapp_e164),email=safeString(data.email,254).toLowerCase(),
    country=safeString(data.country_code,8),university=safeString(data.university,160),
    year=safeString(data.year_label,80);
  if(!name||!university||!year||!phone||password.length<10||password.length>72||
     !["qa","eg","sa","ae","other"].includes(country)||email)
    return json({error:"invalid_registration_details"},400);
  if(data.accepted_privacy!==true)return json({error:"consent_required"},400);
  const admin=adminClient();
  const key=await rateKey(req);
  const used=await admin.rpc("consume_student_signup_slot",{p_hash:key.ip_bucket_hash,p_window:key.window_start});
  if(used.error)return json({error:"registration_temporarily_unavailable"},503);
  if(used.data!==true)return json({error:"too_many_registrations"},429);
  const meta={
    display_name:name,university,year_label:year,country_code:country,
    whatsapp_e164:phone,registration_channel:"whatsapp_only",
    privacy_notice_version:"2026-10-12-v3"
  };
  const creation=await admin.auth.admin.createUser({
    phone:phone,password:password,phone_confirm:false,
    user_metadata:meta
  });
  if(creation.error){
    // Do not disclose whether a WhatsApp number belongs to another account.
    return json({error:"registration_not_completed"},409);
  }
  const userId=creation.data.user?.id;
  if(!userId)return json({error:"registration_not_completed"},503);
  const p=await admin.from("profiles").select("id,role,active,account_status,whatsapp_e164").eq("id",userId).single();
  if(p.error||p.data.whatsapp_e164!==phone||p.data.active!==false||p.data.role!=="student"||p.data.account_status!=="pending"){
    await admin.auth.admin.deleteUser(userId);
    return json({error:"registration_not_completed"},503);
  }
  return json({ok:true,pending:true,requires_manual_whatsapp_verification:true});
 }catch(_){
  return json({error:"registration_not_completed"},503);
 }
});