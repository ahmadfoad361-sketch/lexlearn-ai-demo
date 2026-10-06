import { context, cors, json, randomPassword, requireStaff } from "../_shared/auth.ts";
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  try{
    const {user,adminClient,profile}=await context(req);requireStaff(profile);
    const body=await req.json();
    const username=String(body.username||"").trim().toLowerCase();
    if(!/^[a-z0-9._-]{3,32}$/.test(username)) return json({error:"invalid_username"},400);
    const password=String(body.password||"")||randomPassword();
    if(password.length<10) return json({error:"password_too_short"},400);
    const domain=Deno.env.get("STUDENT_EMAIL_DOMAIN")||"students.lexlearn.local";
    const email=username+"@"+domain;
    const {data:created,error:ce}=await adminClient.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{username}});
    if(ce||!created.user) throw ce||new Error("auth_user_create_failed");
    const uid=created.user.id;
    const row={id:uid,role:"student",username,display_name:String(body.name||username).trim(),active:true,must_change_password:true,university:body.university||null,year_label:body.year||null,cohort_id:body.cohort_id||null,country_code:body.country_code||"qa"};
    const {error:pe}=await adminClient.from("profiles").insert(row);
    if(pe){await adminClient.auth.admin.deleteUser(uid);throw pe;}
    if(body.course_id){
      const {error:ee}=await adminClient.from("enrollments").insert({user_id:uid,course_id:body.course_id,status:"active"});
      if(ee) throw ee;
    }
    await adminClient.from("admin_audit").insert({actor_user_id:user.id,target_user_id:uid,action:"CREATE_STUDENT",details:{username,course_id:body.course_id||null}});
    return json({user_id:uid,username,temporary_password:password});
  }catch(e){return json({error:e instanceof Error?e.message:String(e)},400);}
});
