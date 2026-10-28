import {adminClient,corsHeaders,json} from "../_shared/auth.ts";

// Conference registration: no contact verification. All accounts are students.
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
  const name=clean(body.name,160),password=String(body.password||""),
   whatsapp=phoneNumber(body.whatsapp_e164),email=clean(body.email,254).toLowerCase(),
   country=clean(body.country_code,8),university=clean(body.university,160),year=clean(body.year_label,80),
   faculty=clean(body.faculty,160),academicSection=clean(body.academic_section,100),
   studentNumber=clean(body.student_registration_number,80),
   groupEmail=clean(body.institutional_group_email,254).toLowerCase();
  if(!name||!university||!faculty||!year||whatsapp===undefined||password.length<10||password.length>72||
     !["qa","eg","sa","ae","other"].includes(country)||
     (email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))||
     (groupEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(groupEmail)))
   return json({error:"invalid_registration_details"},400);
  if(body.accepted_privacy!==true)return json({error:"consent_required"},400);
  if(body.accepted_terms_version!=="2026-10-23-v6")return json({error:"registration_terms_required"},400);
  const admin=adminClient();
  const rate=await admin.rpc("consume_student_signup_slot",await rateKey(req));
  if(rate.error)return json({error:"registration_temporarily_unavailable"},503);
  if(rate.data!==true)return json({error:"too_many_registrations"},429);
  const username="lex"+crypto.randomUUID().replace(/-/g,"").slice(0,12);
  const internalEmail=username+"@students.lexlearn.local";
  const created=await admin.auth.admin.createUser({
   email:internalEmail,password,email_confirm:true,
   user_metadata:{
    username,display_name:name,university,faculty,academic_section:academicSection||null,
    student_registration_number:studentNumber||null,institutional_group_email:groupEmail||null,
    year_label:year,country_code:country,
    whatsapp_e164:whatsapp,contact_email:email||null,
    registration_channel:"conference_self",
    privacy_notice_version:"2026-10-23-v6",
    must_change_password:false
   }
  });
  if(created.error||!created.data.user)return json({error:"registration_not_completed"},409);
  const uid=created.data.user.id;
  try{
   const p=await admin.from("profiles").select("id,role,active,account_status,username").eq("id",uid).single();
   if(p.error||p.data?.role!=="student"||p.data?.active!==false||p.data?.account_status!=="pending"||
       p.data?.username!==username)throw new Error("profile_creation_inconsistent");
   const extra=await admin.from("profiles").update({
    faculty,academic_section:academicSection||null,
    student_registration_number:studentNumber||null,
    institutional_group_email:groupEmail||null
   }).eq("id",uid).eq("role","student").select("id").single();
   if(extra.error||!extra.data)throw new Error("pilot_student_metadata_not_saved");
   // The registration form already required affirmative acceptance of privacy/terms.
   // Persist that learning-data choice at creation to avoid a second consent prompt
   // immediately after signing in. The same disclosed registration acceptance covers AI.
   const learningConsent=await admin.from("consent_records").insert({
     user_id:uid,notice_version:"2026-10-06-v1",consent_type:"learning_data",accepted:true
   });
   if(learningConsent.error)throw new Error("registration_learning_consent_failed");
   // One explicit registration acceptance covers the disclosed learning and AI terms.
   // Older forms without the current terms version are rejected above.
   {
    const aiConsent=await admin.from("consent_records").insert({
     user_id:uid,notice_version:"lexlearn-ai-grading-v1",
     consent_type:"external_ai_grading",accepted:true
    });
    if(aiConsent.error)throw new Error("registration_ai_consent_failed");
   }
   if(body.invitation_token){
    const token=String(body.invitation_token);
    if(!/^[a-f0-9]{64}$/.test(token))throw Error("invitation_invalid");
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,"0")).join("");
    const claimed=await admin.rpc("lex_claim_trial_invitation",{p_hash:hash,p_user:uid});
    if(claimed.error)throw Error("invitation_invalid");
   }
  }catch(e){
   await admin.auth.admin.deleteUser(uid);
   if(e instanceof Error&&e.message==="invitation_invalid")return json({error:"invitation_invalid"},409);
   return json({error:"registration_not_completed"},503);
  }
  const cardProfile=await admin.from("profiles").select("lexlearn_number").eq("id",uid).single();
  return json({ok:true,lexlearn_number:cardProfile.data?.lexlearn_number,username,can_sign_in:false,confirmation_required:false,account_status:"pending"});
 }catch(_){return json({error:"registration_not_completed"},503);}
});

