import {corsHeaders,json,requireUser} from "../_shared/auth.ts";
// Staff-only user provisioning; instructor accounts are never self-registered.
const clean=(v:unknown,max=160)=>String(v??"").trim().slice(0,max);
function password(){
 const bytes=crypto.getRandomValues(new Uint8Array(16));
 const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
 return "Lx!"+Array.from(bytes,b=>chars[b%chars.length]).join("")+"9";
}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 try{
  const {user,profile,admin}=await requireUser(req);
  if(!["owner","admin"].includes(profile.role))return json({error:"FORBIDDEN"},403);
  const b=await req.json(),action=clean(b.action,30);
  if(action==="list"){
   const [staff,scopes]=await Promise.all([
    admin.from("instructor_profiles").select("instructor_id,official_email,academic_title,specialization,office_hours,bio,whatsapp_e164,profiles!inner(id,display_name,active)").order("created_at",{ascending:false}),
    admin.from("instructor_assignments").select("id,instructor_id,course_id,subject_name,country_code,university,faculty,year_label,active,created_at").order("created_at",{ascending:false})
   ]);
   if(staff.error||scopes.error)throw staff.error||scopes.error;
   return json({ok:true,instructors:staff.data||[],assignments:scopes.data||[]});
  }
  if(action==="create"){
   const name=clean(b.name),email=String(b.email??"").trim().toLowerCase(),
    academicTitle=clean(b.academic_title,90)||"دكتور",specialization=clean(b.specialization),
    whatsapp=clean(b.whatsapp,24)||null;
   if(name.length<5)return json({error:"invalid_instructor_name"},400);
   if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:"invalid_email"},400);
   if(whatsapp&&!/^\+[1-9][0-9]{7,14}$/.test(whatsapp))return json({error:"invalid_whatsapp"},400);
   const scope={
    course_id:clean(b.course_id),subject_name:clean(b.subject_name),
    country_code:clean(b.country_code,8),university:clean(b.university),
    faculty:clean(b.faculty),year_label:clean(b.year_label,80)
   };
   if(!scope.course_id||!scope.subject_name||!scope.university||!scope.faculty||!scope.year_label||
      !["qa","eg","sa","ae","other"].includes(scope.country_code))
    return json({error:"missing_course_scope"},400);
   const course=await admin.from("courses").select("id,status,metadata").eq("id",scope.course_id).single();
   if(course.error||course.data?.status!=="approved"||course.data?.metadata?.reference_track_only)return json({error:"course_not_available"},400);
   const temp=password();
   // Start with the safe default. The admin-only server then assigns instructor role.
   const created=await admin.auth.admin.createUser({email,password:temp,email_confirm:true,
    user_metadata:{display_name:name,must_change_password:true}});
   if(created.error)return json({error:["email_exists","user_already_exists"].includes(created.error.code||"")?"email_already_registered":"account_creation_failed"},409);
   const uid=created.data.user.id;
   try{
    const a=await admin.from("profiles").update({display_name:name,role:"instructor",active:true,
      must_change_password:true,account_status:"active",contact_email:email}).eq("id",uid).select("id").single();
    if(a.error||!a.data)throw Error("instructor_profile_activation_failed");
    const p=await admin.from("instructor_profiles").insert({instructor_id:uid,official_email:email,
      academic_title:academicTitle,specialization,whatsapp_e164:whatsapp}).select("instructor_id").single();
    if(p.error||!p.data)throw Error("instructor_academic_profile_failed");
    const c=await admin.from("instructor_assignments").insert({...scope,instructor_id:uid,created_by:user.id,active:true});
    if(c.error)throw Error("instructor_assignment_failed");
    await admin.from("admin_audit").insert({actor_user_id:user.id,target_user_id:uid,
      action:"CREATE_INSTRUCTOR",details:{course_id:scope.course_id,university:scope.university,faculty:scope.faculty,year:scope.year_label}});
   }catch(e){await admin.auth.admin.deleteUser(uid);throw e;}
   return json({ok:true,instructor_id:uid,email,temporary_password:temp});
  }
  if(action==="update"){
   const uid=clean(b.instructor_id,64),name=clean(b.name,160),
    email=String(b.email??"").trim().toLowerCase(),title=clean(b.academic_title,90)||"دكتور",
    specialization=clean(b.specialization,160)||null,
    officeHours=clean(b.office_hours,160)||null,bio=clean(b.bio,600)||null,
    whatsapp=clean(b.whatsapp,24)||null;
   if(!/^[0-9a-f-]{36}$/i.test(uid))return json({error:"invalid_instructor"},400);
   if(name.length<3)return json({error:"invalid_instructor_name"},400);
   if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:"invalid_email"},400);
   if(whatsapp&&!/^\+[1-9][0-9]{7,14}$/.test(whatsapp))return json({error:"invalid_whatsapp"},400);
   const [registered,academic]=await Promise.all([
    admin.from("profiles").select("id,role,display_name,contact_email").eq("id",uid).single(),
    admin.from("instructor_profiles").select("instructor_id,official_email,academic_title,specialization,office_hours,bio,whatsapp_e164").eq("instructor_id",uid).single()
   ]);
   if(registered.error||academic.error||registered.data?.role!=="instructor"||!academic.data)
    return json({error:"not_instructor"},404);
   const old=academic.data,oldName=registered.data.display_name,oldContact=registered.data.contact_email;
   const emailChanged=email!==old.official_email;
   if(emailChanged){
    const existing=await admin.from("instructor_profiles").select("instructor_id").eq("official_email",email).neq("instructor_id",uid).limit(1);
    if(existing.error)return json({error:"email_lookup_failed"},500);
    if(existing.data?.length)return json({error:"email_already_registered"},409);
    const changed=await admin.auth.admin.updateUserById(uid,{email,email_confirm:true});
    if(changed.error)return json({error:["email_exists","user_already_exists"].includes(changed.error.code||"")?"email_already_registered":"email_update_failed"},409);
   }
   try{
    const a=await admin.from("profiles").update({display_name:name,contact_email:email}).eq("id",uid).eq("role","instructor").select("id").single();
    if(a.error||!a.data)throw Error("instructor_identity_update_failed");
    const info=await admin.from("instructor_profiles").update({
     official_email:email,academic_title:title,specialization,
     office_hours:officeHours,bio,whatsapp_e164:whatsapp,updated_at:new Date().toISOString()
    }).eq("instructor_id",uid).select("instructor_id").single();
    if(info.error||!info.data)throw Error("instructor_academic_update_failed");
   }catch(_){
    // Roll back a partially changed email/name where possible.
    await admin.from("profiles").update({display_name:oldName,contact_email:oldContact}).eq("id",uid).eq("role","instructor");
    if(emailChanged)await admin.auth.admin.updateUserById(uid,{email:old.official_email,email_confirm:true});
    return json({error:"instructor_update_not_confirmed"},500);
   }
   await admin.from("admin_audit").insert({actor_user_id:user.id,target_user_id:uid,
    action:"UPDATE_INSTRUCTOR",details:{profile_fields:["display_name","official_email","academic_title","specialization","office_hours","bio","whatsapp_e164"],email_changed:emailChanged}});
   return json({ok:true,instructor_id:uid});
  }
  if(action==="assignment"||action==="update-assignment"){
   const uid=clean(b.instructor_id,64);
   if(!/^[0-9a-f-]{36}$/i.test(uid))return json({error:"invalid_instructor"},400);
   const staff=await admin.from("profiles").select("role,active").eq("id",uid).single();
   if(staff.error||staff.data?.role!=="instructor")return json({error:"not_instructor"},400);
   const assignment={instructor_id:uid,course_id:clean(b.course_id),
    subject_name:clean(b.subject_name),country_code:clean(b.country_code,8),
    university:clean(b.university),faculty:clean(b.faculty),year_label:clean(b.year_label,80),created_by:user.id,active:true};
   if(!assignment.course_id||!assignment.subject_name||!assignment.university||!assignment.faculty||!assignment.year_label||
    !["qa","eg","sa","ae","other"].includes(assignment.country_code))return json({error:"invalid_scope"},400);
   const course=await admin.from("courses").select("id,status,metadata").eq("id",assignment.course_id).single();
   if(course.error||course.data?.status!=="approved"||course.data?.metadata?.reference_track_only)return json({error:"course_not_available"},400);
   if(action==="update-assignment"){
    const id=clean(b.assignment_id,64);
    const old=await admin.from("instructor_assignments").select("*").eq("id",id).eq("instructor_id",uid).single();
    if(old.error||!old.data)return json({error:"assignment_not_found"},404);
    const {created_by:_,active:__,...scope}=assignment;
    const updated=await admin.from("instructor_assignments").update(scope).eq("id",id).eq("instructor_id",uid).select("id").single();
    if(updated.error)return json({error:updated.error.code==="23505"?"assignment_conflict":"assignment_update_failed"},409);
    if(!updated.data)return json({error:"assignment_not_found"},404);
    await admin.from("admin_audit").insert({actor_user_id:user.id,target_user_id:uid,action:"UPDATE_INSTRUCTOR_ASSIGNMENT",details:{assignment_id:id,before:old.data,after:scope}});
    return json({ok:true});
   }
   const r=await admin.from("instructor_assignments").upsert(assignment,{onConflict:"instructor_id,course_id,country_code,university,faculty,year_label"});
   if(r.error)throw r.error;
   return json({ok:true});
  }
  if(action==="set-active"||action==="scope-active"){
   const uid=clean(b.instructor_id,64);
   if(!/^[0-9a-f-]{36}$/i.test(uid))return json({error:"invalid_instructor"},400);
   const check=await admin.from("profiles").select("role").eq("id",uid).single();
   if(check.data?.role!=="instructor")return json({error:"not_instructor"},403);
   const active=b.active===true;
   if(action==="set-active"){
    const x=await admin.from("profiles").update({active,account_status:active?"active":"disabled"}).eq("id",uid).eq("role","instructor");
    if(x.error)throw x.error;
   }else{
    const x=await admin.from("instructor_assignments").update({active}).eq("instructor_id",uid).eq("id",clean(b.assignment_id,64));
    if(x.error)throw x.error;
   }
   return json({ok:true});
  }
  return json({error:"unsupported_action"},400);
 }catch(e){
  const code=e instanceof Error?e.message:"unknown_error";
  return json({error:code},code==="UNAUTHORIZED"?401:code==="FORBIDDEN"?403:500);
 }
});
