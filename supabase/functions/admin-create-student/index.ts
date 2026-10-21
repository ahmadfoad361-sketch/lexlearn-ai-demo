import { corsHeaders,json,requireStaff } from "../_shared/auth.ts";
import {facultyCohort} from "../_shared/faculty.ts";

function temporaryPassword(){
  const bytes=crypto.getRandomValues(new Uint8Array(12));
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out="Lx!";
  for(const b of bytes)out+=alphabet[b%alphabet.length];
  return out+"9";
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  try{
    const {user,admin,profile}=await requireStaff(req);
    const body=await req.json();
    const username=String(body.username||"").trim().toLowerCase();
    const password=String(body.password||temporaryPassword());
    const displayName=String(body.name||body.display_name||"").trim();
    if(!/^[a-z0-9._-]{3,32}$/.test(username))return json({error:"invalid_username"},400);
    if(password.length<10)return json({error:"password_too_short"},400);
    if(!displayName)return json({error:"display_name_required"},400);

    const registrationTrack=body.registration_track==="academic"?"academic":"conference";
    let university=String(body.university||"").trim().slice(0,160),
        faculty=String(body.faculty||"").trim().slice(0,160),
        universityEmail=String(body.institutional_email||"").trim().toLowerCase().slice(0,254),
        studentNumber=String(body.student_registration_number||"").trim().slice(0,64);
    let cohortId=body.cohort_id||null;
    if(profile.role==="instructor"){
      const own=await admin.from("profiles").select("cohort_id,university,faculty").eq("id",user.id).single();
      if(own.error||!own.data?.cohort_id||!own.data.university||!own.data.faculty)
        return json({error:"instructor_faculty_scope_missing"},403);
      if((university&&university!==own.data.university)||(faculty&&faculty!==own.data.faculty))
        return json({error:"instructor_faculty_mismatch"},403);
      university=own.data.university;faculty=own.data.faculty;
    }
    if(registrationTrack==="academic"){
      if(!university||!faculty||!/^\S+@\S+\.\S+$/.test(universityEmail))
        return json({error:"academic_details_required"},400);
      const pol=await admin.from("academic_registration_policies")
        .select("require_student_number,allowed_email_domains").eq("university",university).eq("faculty",faculty).maybeSingle();
      if(pol.error)throw pol.error;
      if(pol.data?.require_student_number&&!studentNumber)return json({error:"student_number_required_by_faculty"},400);
      const approved=Array.isArray(pol.data?.allowed_email_domains)?pol.data.allowed_email_domains:[];
      const domain=universityEmail.split("@").pop()||"";
      if(approved.length&&!approved.some((d:string)=>{const name=d.toLowerCase().trim().replace(/^@/,"");return name&&(domain===name||domain.endsWith("."+name));}))
        return json({error:"university_email_domain_not_allowed"},400);
      const assigned=await facultyCohort(admin,university,faculty);
      if(cohortId&&cohortId!==assigned)return json({error:"faculty_cohort_mismatch"},403);
      cohortId=assigned;
    }else if(profile.role==="instructor"){
      return json({error:"instructor_requires_academic_registration"},403);
    }
    if(profile.role==="instructor"){
      const scope=await admin.from("profiles").select("cohort_id").eq("id",user.id).single();
      if(scope.error||!scope.data.cohort_id||scope.data.cohort_id!==cohortId)
        return json({error:"instructor_cohort_required"},403);
    }
    if(!cohortId&&registrationTrack!=="academic"&&body.cohort){
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
      user_metadata:{role:"student",username,display_name:displayName,must_change_password:true,university:university||null,year_label:body.year||body.year_label||"السنة الأولى",country_code:body.country_code||"qa"}
    });
    if(created.error)return json({error:"create_user_failed",detail:created.error.message},409);
    const uid=created.data.user.id;
    const upd=await admin.from("profiles").update({
      active:registrationTrack!=="academic",account_status:registrationTrack==="academic"?"pending":"active",
      cohort_id:cohortId,university:university||null,faculty:registrationTrack==="academic"?faculty:null,
      institutional_email:registrationTrack==="academic"?universityEmail:null,
      student_registration_number:registrationTrack==="academic"?studentNumber||null:null,
      registration_track:registrationTrack,year_label:body.year||body.year_label||"السنة الأولى",country_code:body.country_code||"qa"
    }).eq("id",uid);
    if(upd.error)throw upd.error;
    const courseId=String(body.course_id||"qa-qu-lawc101-rights");
    const enroll=await admin.from("enrollments").upsert({user_id:uid,course_id:courseId,status:"active"},{onConflict:"user_id,course_id"});
    if(enroll.error){await admin.auth.admin.deleteUser(uid);throw enroll.error;}
    await admin.from("admin_audit").insert({actor_user_id:user.id,target_user_id:uid,action:"CREATE_STUDENT",details:{username,course_id:courseId,cohort_id:cohortId,registration_track:registrationTrack}});
    return json({ok:true,user_id:uid,username,temporary_password:password,course_id:courseId,pending_verification:registrationTrack==="academic"});
  }catch(e){
    const m=e instanceof Error?e.message:String(e);
    return json({error:m},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500);
  }
});
