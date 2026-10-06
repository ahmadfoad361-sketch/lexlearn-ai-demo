import { corsHeaders,json,requireStaff } from "../_shared/auth.ts";

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  try{
    const {user,admin}=await requireStaff(req);
    const body=await req.json();
    const username=String(body.username||"").trim().toLowerCase();
    const password=String(body.password||"");
    const displayName=String(body.name||body.display_name||"").trim();
    if(!/^[a-z0-9._-]{3,32}$/.test(username))return json({error:"invalid_username"},400);
    if(password.length<10)return json({error:"password_too_short"},400);
    if(!displayName)return json({error:"display_name_required"},400);

    let cohortId=body.cohort_id||null;
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
      user_metadata:{role:"student",username,display_name:displayName,must_change_password:true,university:body.university||null,year_label:body.year||body.year_label||"السنة الأولى"}
    });
    if(created.error)return json({error:"create_user_failed",detail:created.error.message},409);
    const uid=created.data.user.id;
    const upd=await admin.from("profiles").update({cohort_id:cohortId,university:body.university||null,year_label:body.year||body.year_label||"السنة الأولى"}).eq("id",uid);
    if(upd.error)throw upd.error;
    const courseId=String(body.course_id||"qa-qu-lawc213");
    await admin.from("enrollments").upsert({user_id:uid,course_id:courseId,status:"active"},{onConflict:"user_id,course_id"});
    await admin.from("admin_audit").insert({actor_user_id:user.id,target_user_id:uid,action:"CREATE_STUDENT",details:{username,course_id:courseId,cohort_id:cohortId}});
    return json({ok:true,user_id:uid,username,temporary_password:password,course_id:courseId});
  }catch(e){
    const m=e instanceof Error?e.message:String(e);
    return json({error:m},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500);
  }
});
