import { corsHeaders,json,requireStaff } from "../_shared/auth.ts";

function temporaryPassword(){
  const bytes=crypto.getRandomValues(new Uint8Array(12));
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out="Lx!";
  for(const b of bytes)out+=alphabet[b%alphabet.length];
  return out+"9";
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(req.method!=="POST")return json({error:"method_not_allowed"},405);
  try{
    const {user,admin,profile}=await requireStaff(req);
    const body=await req.json();
    if(body.accepted_registration_terms!==true||body.accepted_terms_version!=="2026-10-23-v6")return json({error:"registration_terms_required"},400);
    if(body.trial_id){
      const group=await admin.rpc("lex_admin_trials",{p_actor:user.id,p_action:"get",p_data:{trial_id:body.trial_id}});
      if(group.error||!group.data)return json({error:"trial_not_found"},409);
      if(!group.data.active||Date.parse(group.data.ends_at)<=Date.now())return json({error:"trial_unavailable"},409);
      Object.assign(body,{university:group.data.university,faculty:group.data.faculty,year:group.data.year_label,country_code:group.data.country_code});
    }
    const username=String(body.username||"").trim().toLowerCase();
    const password=String(body.password||temporaryPassword());
    const displayName=String(body.name||body.display_name||"").trim();
    const pilotFields={faculty:String(body.faculty||"").trim(),academic_section:String(body.academic_section||"").trim()||null,
      student_registration_number:String(body.student_registration_number||"").trim()||null,
      institutional_group_email:String(body.institutional_group_email||"").trim().toLowerCase()||null};
    if(!pilotFields.faculty||pilotFields.faculty.length>160||!String(body.university||"").trim()||
       (pilotFields.academic_section?.length||0)>100||(pilotFields.student_registration_number?.length||0)>80||
       (pilotFields.institutional_group_email&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pilotFields.institutional_group_email)||pilotFields.institutional_group_email.length>254)))
      return json({error:"invalid_pilot_profile_fields"},400);
    if(!["qa","eg","sa","ae","other"].includes(body.country_code||"qa"))return json({error:"invalid_country"},400);
    if(!/^[a-z0-9._-]{3,32}$/.test(username))return json({error:"invalid_username"},400);
    if(password.length<10||password.length>72)return json({error:"invalid_password_length"},400);
    if(!displayName)return json({error:"display_name_required"},400);

    let cohortId=body.cohort_id||null;
    if(profile.role==="instructor"){
      const scope=await admin.from("profiles").select("cohort_id").eq("id",user.id).single();
      if(scope.error||!scope.data.cohort_id||scope.data.cohort_id!==cohortId)
        return json({error:"instructor_cohort_required"},403);
    }
    if(!cohortId&&body.cohort){
      const name=String(body.cohort).trim();
      const found=await admin.from("cohorts").select("id").eq("name",name).maybeSingle();
      if(found.data)cohortId=found.data.id;
      else{
        const created=await admin.from("cohorts").insert({name,institution:body.university||null,academic_year:body.academic_year||null}).select("id").single();
        if(created.error)throw created.error;cohortId=created.data.id;
      }
    }
    const domain=Deno.env.get("STUDENT_EMAIL_DOMAIN")||"students.lexlearn.local";
    const email=username+"@"+domain;
    const created=await admin.auth.admin.createUser({
      email,password,email_confirm:true,
      user_metadata:{role:"student",username,display_name:displayName,must_change_password:true,university:body.university||null,year_label:body.year||body.year_label||"السنة الأولى",country_code:body.country_code||"qa"}
    });
    if(created.error)return json({error:"create_user_failed",detail:created.error.message},409);
    const uid=created.data.user.id;
    // The same reviewed Qatar pilot is used by self-registration, irrespective of residence.
    const courseId="qa-qu-lawc101-rights";
    try{
      const upd=await admin.from("profiles").update({...pilotFields,active:false,account_status:"pending",cohort_id:cohortId,university:body.university||null,year_label:body.year||body.year_label||"السنة الأولى",country_code:body.country_code||"qa"}).eq("id",uid).eq("role","student").select("id").single();
      if(upd.error||!upd.data)throw Error("profile_save_failed");
      const consent=await admin.from("consent_records").insert([
        {user_id:uid,notice_version:"2026-10-06-v1",consent_type:"learning_data",accepted:true},
        {user_id:uid,notice_version:"lexlearn-ai-grading-v1",consent_type:"external_ai_grading",accepted:true}
      ]);
      if(consent.error)throw consent.error;
      if(body.trial_id){
        const linked=await admin.rpc("lex_admin_trials",{p_actor:user.id,p_action:"assign",p_data:{trial_id:body.trial_id,user_ids:[uid]}});
        if(linked.error)throw linked.error;
      }
      const audit=await admin.from("admin_audit").insert({actor_user_id:user.id,target_user_id:uid,action:"CREATE_STUDENT",details:{username,course_id:courseId,cohort_id:cohortId}});
      if(audit.error)throw audit.error;
    }catch(e){await admin.auth.admin.deleteUser(uid);throw e;}
    // Staff explicitly attests that the student accepted the complete registration terms.
  const cardProfile=await admin.from("profiles").select("lexlearn_number").eq("id",uid).single();
    return json({ok:true,lexlearn_number:cardProfile.data?.lexlearn_number,user_id:uid,username,temporary_password:password,course_id:courseId,account_status:"pending"});
  }catch(e){
    const m=e instanceof Error?e.message:String(e);
    return json({error:m},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500);
  }
});


