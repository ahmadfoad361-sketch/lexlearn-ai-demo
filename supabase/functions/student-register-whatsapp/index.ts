import {adminClient,corsHeaders,json} from "../_shared/auth.ts";

// Conference: immediate access. Academic research: university email is recorded as UNVERIFIED; staff approval required.
// Email and WhatsApp are OPTIONAL and are never linked to Supabase Auth as
// verified identities. Students authenticate with a generated username.
function clean(value:unknown,max:number){return String(value??"").trim().slice(0,max);}
function phoneNumber(value:unknown){
 const raw=clean(value,25).replace(/[\s().-]/g,"");
 const normalized=raw.startsWith("00")?"+"+raw.slice(2):raw;
 return normalized===""?null:(/^\+[1-9][0-9]{7,14}$/.test(normalized)?normalized:undefined);
}
async function rateKey(req:Request){
 const raw=req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||
  (req.headers.get("x-forwarded-for")||"").split(",")[0].trim()||"anonymous";
 const windowStart=new Date();windowStart.setUTCMinutes(0,0,0);
 const salt=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(salt+"|"+raw+"|"+windowStart.toISOString()));
 return {p_hash:Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join(""),p_window:windowStart.toISOString()};
}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 try{
  const body=await req.json();
  if(clean(body.website,120))return json({error:"registration_not_completed"},400);
  const registrationTrack=body.registration_track==="academic"?"academic":"conference";
  const academic=registrationTrack==="academic";
  const institutionalEmail=clean(body.institutional_email,254).toLowerCase(),faculty=clean(body.faculty,160),
   studentNumber=clean(body.student_registration_number,64);
  const name=clean(body.name,160),password=String(body.password||""),
   whatsapp=phoneNumber(body.whatsapp_e164),email=clean(body.email,254).toLowerCase(),
   country=clean(body.country_code,8),university=clean(body.university,160),year=clean(body.year_label,80);
  if(!name||!university||!year||whatsapp===undefined||password.length<10||password.length>72||
     !["qa","eg","sa","ae","other"].includes(country)||
     (email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))||
     (academic&&(!faculty||!institutionalEmail||!/^\S+@\S+\.\S+$/.test(institutionalEmail)||body.accepted_research!==true)))
   return json({error:"invalid_registration_details"},400);
  if(body.accepted_privacy!==true)return json({error:"consent_required"},400);
  const admin=adminClient();
  if(academic){
    const policy=await admin.from("academic_registration_policies")
      .select("require_student_number,allowed_email_domains").eq("university",university).eq("faculty",faculty).maybeSingle();
    if(policy.error)return json({error:"academic_policy_unavailable"},503);
    if(policy.data?.require_student_number&&!studentNumber)return json({error:"student_number_required_by_faculty"},400);
    const domains=Array.isArray(policy.data?.allowed_email_domains)?policy.data.allowed_email_domains:[];
    const emailDomain=institutionalEmail.split("@").pop()||"";
    if(domains.length&&!domains.some((domain:string)=>{
      const allowed=domain.toLowerCase().trim().replace(/^@/,"");
      return allowed&&(emailDomain===allowed||emailDomain.endsWith("."+allowed));
    }))return json({error:"university_email_domain_not_allowed"},400);
  }
  const rate=await admin.rpc("consume_student_signup_slot",await rateKey(req));
  if(rate.error)return json({error:"registration_temporarily_unavailable"},503);
  if(rate.data!==true)return json({error:"too_many_registrations"},429);
  const username="lex"+crypto.randomUUID().replace(/-/g,"").slice(0,12);
  const internalEmail=username+"@students.lexlearn.local";
  const created=await admin.auth.admin.createUser({
   email:internalEmail,password,email_confirm:true,
   user_metadata:{
    username,display_name:name,university,year_label:year,country_code:country,
    whatsapp_e164:whatsapp,contact_email:email||null,
    registration_channel:academic?"academic_pilot_self":"conference_self",
    faculty:academic?faculty:null,institutional_email:academic?institutionalEmail:null,
    privacy_notice_version:"2026-10-12-v4",
    must_change_password:false
   }
  });
  if(created.error||!created.data.user)return json({error:"registration_not_completed"},409);
  const uid=created.data.user.id;
  try{
   const p=await admin.from("profiles").select("id,role,active,account_status,username").eq("id",uid).single();
   if(p.error||p.data?.role!=="student"||p.data?.active!==false||p.data?.account_status!=="pending"||
       p.data?.username!==username)throw new Error("profile_creation_inconsistent");
   if(academic){
    const details=await admin.from("profiles").update({
      registration_track:"academic",faculty,institutional_email:institutionalEmail,
      student_registration_number:studentNumber||null
    }).eq("id",uid);
    if(details.error)throw details.error;
    const consent=await admin.from("consent_records").insert({
      user_id:uid,notice_version:"2026-10-21-academic-v1",consent_type:"research_participation",accepted:true
    });
    if(consent.error)throw consent.error;
   }
   if(country==="qa"){
    const enrolled=await admin.from("enrollments").upsert({
     user_id:uid,course_id:"qa-qu-lawc101-rights",status:"active"
    },{onConflict:"user_id,course_id"});
    if(enrolled.error)throw enrolled.error;
   }
   if(academic)return json({ok:true,username,can_sign_in:false,confirmation_required:true,verification:"pending_manual"});
   const activated=await admin.from("profiles").update({active:true,account_status:"active"})
     .eq("id",uid).eq("role","student").eq("account_status","pending").select("id").single();
   if(activated.error||!activated.data)throw new Error("student_activation_failed");
  }catch(_){
   await admin.auth.admin.deleteUser(uid);
   return json({error:"registration_not_completed"},503);
  }
  return json({ok:true,username,can_sign_in:true,confirmation_required:false});
 }catch(_){return json({error:"registration_not_completed"},503);}
});