import { corsHeaders,json,requireUser } from "../_shared/auth.ts";

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  try{
    const {user,admin}=await requireUser(req);
    const b=await req.json(),password=String(b.password||"");
    if(password.length<10)return json({error:"password_too_short"},400);
    const changed=await admin.auth.admin.updateUserById(user.id,{password,user_metadata:{must_change_password:false}});
    if(changed.error)throw changed.error;
    const p=await admin.from("profiles").update({must_change_password:false}).eq("id",user.id);
    if(p.error)throw p.error;
    await admin.from("activity_events").insert({user_id:user.id,event_type:"CHANGE_PASSWORD",event_data:{self_service:true}});
    return json({ok:true});
  }catch(e){
    const m=e instanceof Error?e.message:String(e);
    return json({error:m},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500);
  }
});
