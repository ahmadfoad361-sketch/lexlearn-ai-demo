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
  try{
    const {user,admin,profile}=await requireStaff(req);
    const b=await req.json(),target=String(b.user_id||"");
    if(!target)return json({error:"user_id_required"},400);
    const action=String(b.action||"");
    const {data:student,error:studentError}=await admin.from("profiles").select("id,role,username,active,account_status,display_name,country_code,whatsapp_e164,whatsapp_verified_at").eq("id",target).maybeSingle();
    if(studentError||!student||student.role!=="student")return json({error:"student_account_required"},404);
    if(target===user.id)return json({error:"self_action_denied"},403);
    // Instructor access is restricted to an explicitly assigned cohort.
    if(profile.role==="instructor"){
      const [staffScope,studentScope]=await Promise.all([
        admin.from("profiles").select("cohort_id").eq("id",user.id).single(),
        admin.from("profiles").select("cohort_id").eq("id",target).single()
      ]);
      if(staffScope.error||studentScope.error||!staffScope.data.cohort_id||
         staffScope.data.cohort_id!==studentScope.data.cohort_id)
        return json({error:"student_outside_instructor_scope"},403);
    }

    if(action==="reset_password"){
      const p=String(b.password||temporaryPassword());
      if(p.length<10)return json({error:"password_too_short"},400);
      const r=await admin.auth.admin.updateUserById(target,{password:p,user_metadata:{must_change_password:true}});
      if(r.error)throw r.error;
      const changed=await admin.from("profiles").update({must_change_password:true}).eq("id",target);
      if(changed.error)throw changed.error;
      b.generated_password=p;
    }else if(action==="set_status"||action==="toggle_active"){
      const status=action==="toggle_active"?(b.active?"active":"disabled"):String(b.status||"");
      if(!["active","paused","disabled"].includes(status))return json({error:"invalid_account_status"},400);
      if(status==="active"){
        // Approval is now transactional and capacity-checked in university trial management.
        return json({error:"use_university_trials",url:"admin-trials.html"},409);
      }else{
        const authChange=await admin.auth.admin.updateUserById(target,{ban_duration:"876000h"});
        if(authChange.error)throw authChange.error;
        const upd=await admin.from("profiles").update({active:false,account_status:status}).eq("id",target);
        if(upd.error){await admin.auth.admin.updateUserById(target,{ban_duration:"none"});throw upd.error;}
      }
      b.details={from:student.account_status||(student.active?"active":"disabled"),to:status,reason:String(b.reason||"").slice(0,500),whatsapp_verified_manually:b.whatsapp_verified_manually===true};
    }else if(action==="delete_student"){
      // Irreversible: removing auth.users cascades to profiles, attempts and learning records.
      // Only owner/admin may execute, never an instructor.
      if(!["owner","admin"].includes(profile.role))return json({error:"delete_requires_admin"},403);
      if(String(b.confirm_username||"").trim().toLowerCase()!==String(student.username||"").toLowerCase())return json({error:"username_confirmation_required"},400);
      if(b.acknowledge_data_loss!==true)return json({error:"data_loss_acknowledgement_required"},400);
      const recorded=await admin.from("admin_audit").insert({actor_user_id:user.id,target_user_id:target,action:"DELETE_STUDENT_REQUESTED",details:{username:student.username,display_name:student.display_name,reason:String(b.reason||"").slice(0,500),irreversible:true}});
      if(recorded.error)throw recorded.error;
      const deletion=await admin.auth.admin.deleteUser(target);
      if(deletion.error)throw deletion.error;
      await admin.from("admin_audit").insert({actor_user_id:user.id,target_user_id:null,action:"DELETE_STUDENT_COMPLETED",details:{former_user_id:target,username:student.username}});
      return json({ok:true,deleted:true});
    }else if(action==="update_profile"){
      // Owner-admin corrections are needed to link pre-existing student profiles
      // to an exact instructor university + faculty + academic year assignment.
      // Never infer a university from a country or guess missing faculty values.
      if(!["owner","admin"].includes(profile.role))return json({error:"profile_changes_require_admin"},403);
      const patch=b.patch&&typeof b.patch==="object"&&!Array.isArray(b.patch)?b.patch:{};
      const allowed:Record<string,string|null>={};
      const limits:Record<string,number>={
        display_name:160,university:160,faculty:160,academic_section:100,
        year_label:80,student_registration_number:80,institutional_group_email:254
      };
      for(const [key,max] of Object.entries(limits)){
        if(!(key in patch))continue;
        const v=String(patch[key]??"").trim();
        if(v.length>max||(["display_name","university","faculty","year_label"].includes(key)&&v.length<2))
          return json({error:"invalid_academic_profile_field",field:key},400);
        allowed[key]=v||null;
      }
      if("country_code" in patch){
        if(!["qa","eg","sa","ae","other"].includes(patch.country_code))
          return json({error:"invalid_country"},400);
        allowed.country_code=patch.country_code;
      }
      if(allowed.institutional_group_email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(allowed.institutional_group_email))
        return json({error:"invalid_institutional_group_email"},400);
      if(!Object.keys(allowed).length)return json({error:"no_allowed_fields"},400);
      const save=await admin.from("profiles").update(allowed).eq("id",target).eq("role","student").select("id").single();
      if(save.error||!save.data)throw Error("student_academic_profile_not_saved");
      b.details={academic_profile_fields_updated:Object.keys(allowed),scope_matching_may_change:true};
    }else if(action==="save_snapshot"){
      if(!b.course_id||!b.snapshot_type)return json({error:"snapshot_fields_required"},400);
      const r=await admin.from("learner_snapshots").upsert({user_id:target,course_id:b.course_id,snapshot_type:b.snapshot_type,state:b.state||{},version:Number(b.version)||1,updated_at:new Date().toISOString()},{onConflict:"user_id,course_id,snapshot_type"});
      if(r.error)throw r.error;
    }else return json({error:"unknown_action"},400);
    await admin.from("admin_audit").insert({actor_user_id:user.id,target_user_id:target,action:action.toUpperCase(),details:b.details||{}});
    return json({ok:true,temporary_password:b.generated_password||null});
  }catch(e){
    const m=e instanceof Error?e.message:String(e);
    return json({error:m},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500);
  }
});
