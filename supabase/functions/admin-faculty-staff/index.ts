import {corsHeaders,json,requireStaff} from "../_shared/auth.ts";
import {facultyCohort} from "../_shared/faculty.ts";
function str(value:unknown,max=160){return String(value??"").trim().slice(0,max);}
function password(){const bytes=crypto.getRandomValues(new Uint8Array(14)),abc="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";return "Lx!"+Array.from(bytes,x=>abc[x%abc.length]).join("")+"8";}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 try{
  const {admin,user,profile}=await requireStaff(req);
  // Creation and staff listing are restricted to platform owner/admin; never available to an instructor or the public.
  if(!["owner","admin"].includes(profile.role))return json({error:"admin_only"},403);
  const b=await req.json(),action=str(b.action,32);
  if(action==="list"){
    const r=await admin.from("profiles").select("id,display_name,username,university,faculty,academic_title,cohort_id,active,account_status,created_at")
      .eq("role","instructor").order("created_at",{ascending:false});
    if(r.error)throw r.error;
    return json({ok:true,staff:r.data||[]});
  }
  if(action==="create"){
    const name=str(b.name),title=str(b.academic_title,120),email=str(b.email,254).toLowerCase(),
      university=str(b.university),faculty=str(b.faculty);
    if(!name||!university||!faculty||!/^\S+@\S+\.\S+$/.test(email))
      return json({error:"invalid_instructor_profile"},400);
    const cohortId=await facultyCohort(admin,university,faculty);
    const username="prof"+crypto.randomUUID().replace(/-/g,"").slice(0,12),temporaryPassword=password();
    const created=await admin.auth.admin.createUser({email,password:temporaryPassword,email_confirm:true,
      user_metadata:{username,display_name:name,must_change_password:true,registration_channel:"admin_academic_instructor"}});
    if(created.error||!created.data.user)return json({error:"create_instructor_auth_failed",detail:created.error?.message},409);
    const uid=created.data.user.id;
    const updated=await admin.from("profiles").update({
      role:"instructor",active:true,account_status:"active",must_change_password:true,
      display_name:name,username,cohort_id:cohortId,university,faculty,academic_title:title||null
    }).eq("id",uid).eq("role","student").select("id").single();
    if(updated.error||!updated.data){
      await admin.auth.admin.deleteUser(uid);
      throw updated.error||new Error("create_instructor_profile_failed");
    }
    const audit=await admin.from("admin_audit").insert({actor_user_id:user.id,target_user_id:uid,
      action:"CREATE_FACULTY_INSTRUCTOR",details:{university,faculty,cohort_id:cohortId}});
    if(audit.error)throw audit.error;
    return json({ok:true,user_id:uid,email,username,temporary_password:temporaryPassword});
  }
  if(action==="set_status"){
    const id=str(b.user_id,36),status=str(b.status,16);
    if(!/^[a-f0-9-]{36}$/i.test(id)||!["active","disabled"].includes(status))return json({error:"invalid_change"},400);
    const current=await admin.from("profiles").select("id,role").eq("id",id).single();
    if(current.error||current.data?.role!=="instructor")return json({error:"instructor_not_found"},404);
    const ban=await admin.auth.admin.updateUserById(id,{ban_duration:status==="active"?"none":"876000h"});
    if(ban.error)throw ban.error;
    const change=await admin.from("profiles").update({active:status==="active",account_status:status}).eq("id",id);
    if(change.error)throw change.error;
    const audit=await admin.from("admin_audit").insert({actor_user_id:user.id,target_user_id:id,
      action:status==="active"?"ACTIVATE_INSTRUCTOR":"DISABLE_INSTRUCTOR",
      details:{reason:str(b.reason,500)}});
    if(audit.error)throw audit.error;
    return json({ok:true});
  }
  return json({error:"unknown_action"},400);
 }catch(e){
  const m=e instanceof Error?e.message:String(e);
  return json({error:m},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500);
 }
});