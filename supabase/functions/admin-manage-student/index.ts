import { context, cors, json, randomPassword, requireStaff } from "../_shared/auth.ts";
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  try{
    const {user,adminClient,profile}=await context(req);requireStaff(profile);
    const b=await req.json(),target=String(b.user_id||"");
    if(!target) return json({error:"user_id_required"},400);
    let result:any={ok:true};
    if(b.action==="reset_password"){
      const password=randomPassword();
      const {error}=await adminClient.auth.admin.updateUserById(target,{password});
      if(error) throw error;
      await adminClient.from("profiles").update({must_change_password:true,updated_at:new Date().toISOString()}).eq("id",target);
      result.temporary_password=password;
    }else if(b.action==="toggle_active"){
      const active=!!b.active;
      const {error}=await adminClient.from("profiles").update({active,updated_at:new Date().toISOString()}).eq("id",target);
      if(error) throw error;
    }else if(b.action==="save_snapshot"){
      const row={user_id:target,course_id:String(b.course_id||""),snapshot_type:String(b.snapshot_type||""),state:b.state||{},version:1,updated_at:new Date().toISOString()};
      if(!row.course_id||!["profile","course"].includes(row.snapshot_type)) return json({error:"invalid_snapshot"},400);
      const {error}=await adminClient.from("learner_snapshots").upsert(row,{onConflict:"user_id,course_id,snapshot_type"});
      if(error) throw error;
    }else return json({error:"unsupported_action"},400);
    await adminClient.from("admin_audit").insert({actor_user_id:user.id,target_user_id:target,action:String(b.action).toUpperCase(),details:b.details||{}});
    return json(result);
  }catch(e){return json({error:e instanceof Error?e.message:String(e)},400);}
});
