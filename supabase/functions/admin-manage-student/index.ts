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
    const {user,admin}=await requireStaff(req);
    const b=await req.json(),target=String(b.user_id||"");
    if(!target)return json({error:"user_id_required"},400);
    const action=String(b.action||"");
    if(action==="reset_password"){
      const p=String(b.password||temporaryPassword());
      if(p.length<10)return json({error:"password_too_short"},400);
      const r=await admin.auth.admin.updateUserById(target,{password:p,user_metadata:{must_change_password:true}});
      if(r.error)throw r.error;
      await admin.from("profiles").update({must_change_password:true}).eq("id",target);\n      b.generated_password=p;
    }else if(action==="toggle_active"){
      const active=!!b.active;
      const r=await admin.from("profiles").update({active}).eq("id",target);if(r.error)throw r.error;
      await admin.auth.admin.updateUserById(target,{ban_duration:active?"none":"876000h"});
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
