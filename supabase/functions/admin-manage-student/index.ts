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
    const {data:student,error:studentError}=await admin.from("profiles").select("id,role,username,active,account_status,display_name,country_code").eq("id",target).maybeSingle();
    if(studentError||!student||student.role!=="student")return json({error:"student_account_required"},404);
    if(target===user.id)return json({error:"self_action_denied"},403);
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
        if(student.account_status==="pending"){
          const authUser=await admin.auth.admin.getUserById(target);
          if(authUser.error||!authUser.data.user)return json({error:"student_auth_account_unavailable"},409);
          if(!authUser.data.user.email_confirmed_at)return json({error:"verify_student_email_first"},409);
          // Assign the Qatar pilot without requiring an instructor or cohort.
          if(student.country_code==="qa"){
            const enroll=await admin.from("enrollments").upsert(
              {user_id:target,course_id:"qa-qu-lawc101-rights",status:"active"},
              {onConflict:"user_id,course_id"});
            if(enroll.error)throw enroll.error;
          }
        }
        const authChange=await admin.auth.admin.updateUserById(target,{ban_duration:"none"});
        if(authChange.error)throw authChange.error;
        const upd=await admin.from("profiles").update({active:true,account_status:"active"}).eq("id",target);
        if(upd.error){await admin.auth.admin.updateUserById(target,{ban_duration:"876000h"});throw upd.error;}
      }else{
        const authChange=await admin.auth.admin.updateUserById(target,{ban_duration:"876000h"});
        if(authChange.error)throw authChange.error;
        const upd=await admin.from("profiles").update({active:false,account_status:status}).eq("id",target);
        if(upd.error){await admin.auth.admin.updateUserById(target,{ban_duration:"none"});throw upd.error;}
      }
      b.details={from:student.account_status||(student.active?"active":"disabled"),to:status,reason:String(b.reason||"").slice(0,500)};
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
      const allowed:any={};
      for(const k of ["display_name","university","year_label","cohort_id","locale"])if(k in b.patch)allowed[k]=b.patch[k];
      const r=await admin.from("profiles").update(allowed).eq("id",target);if(r.error)throw r.error;
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
