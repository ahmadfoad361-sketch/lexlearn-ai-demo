import {corsHeaders,json,requireUser,requireTrainingAccess} from "../_shared/auth.ts";

// Authenticated admission/status only. Never accepts student IDs or answer bodies.
Deno.serve(async (req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 try{
  const {user,profile,admin}=await requireUser(req);
  if(profile.role!=="student")return json({error:"student_required"},403);
  const body=await req.json();
  const COURSE="qa-qu-lawc101-rights";
  await requireTrainingAccess(admin,user.id,COURSE);
  if(body.action==="status"){
   if(typeof body.job_id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.job_id))return json({error:"invalid_job"},400);
   const {data,error}=await admin.from("lex_ai_queue_jobs")
     .select("id,user_id,state,attempts,created_at,completed_at,reason")
     .eq("id",body.job_id).eq("user_id",user.id).maybeSingle();
   if(error)return json({error:"queue_unavailable"},503);
   if(!data)return json({error:"not_found"},404);
   return json({job_id:data.id,status:data.state,attempts:data.attempts,reason:data.reason||null,
     created_at:data.created_at,completed_at:data.completed_at});
  }
  const kind=String(body.kind||"");
  if(!["training","diagnostic"].includes(kind))return json({error:"invalid_kind"},400);
  const session=kind==="training"?Number(body.session):null;
  const item=kind==="training"?String(body.item_id||""):null;
  if(kind==="training"&&(!Number.isInteger(session)||session<1||session>30||
    !/^rights-v1-s\d+-(recall|understanding|exam)$/.test(item||"")))return json({error:"invalid_task"},400);
  const {data,error}=await admin.rpc("lex_ai_queue_admit",{
    p_user:user.id,p_kind:kind,p_course:COURSE,p_session:session,p_item:item
  });
  if(error){
   const m=String(error.message||"");
   if(/queue_disabled/i.test(m))return json({error:"queue_disabled"},503);
   if(/grading_queue_full/i.test(m))return json({error:"queue_capacity_reached",saved_answer:true},429);
   if(/approval_required|consent_required/i.test(m))return json({error:"approval_or_consent_required"},403);
   if(/already_graded|nonanswer_already_scored/i.test(m))return json({status:"already_handled",saved_answer:true});
   if(/invalid_task|unsupported_course_or_kind/i.test(m))return json({error:"invalid_task"},400);
   if(/saved_answer_required|diagnostic_not_complete|recall_answer_insufficient/i.test(m))
      return json({error:"saved_answer_required_or_insufficient"},409);
   return json({error:"queue_unavailable",saved_answer:true},503);
  }
  if(!data||data.user_id!==user.id)return json({error:"enqueue_not_confirmed"},503);
  return json({status:data.state,job_id:data.id,saved_answer:true,queued_at:data.created_at},202);
 }catch(error){
  const m=error instanceof Error?error.message:"";
  return json({error:m==="UNAUTHORIZED"?"unauthorized":m==="FORBIDDEN"?"student_approval_required":"queue_unavailable"},
    m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:503);
 }
});
