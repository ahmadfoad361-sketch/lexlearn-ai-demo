
import {corsHeaders,json,requireUser} from "../_shared/auth.ts";
import {apiRequest,extractResult,validateProposal,reviewRubric,flagEnabled,MODEL,PROMPT_VERSION} from "../_shared/semantic-grading.mjs";

// DRAFT ONLY: two explicit server flags, reviewed content and explicit opt-in.
// Absolutely no API calls when disabled. Never expose credentials to students.
const MAX_PROJECT_REQUESTS=200; // safety volume guard, not a monetary hard cap
const MAX_USER_HOURLY_REQUESTS=12;
const REQUIRED_CONSENT_VERSION="2026-10-22-v1";
const REQUIRED_CONSENT_TYPE="external_ai_grading";

function pending(reason:string,status=200,more:Record<string,unknown>={}){
 return json({score:null,needs_human_review:true,grading_method:"human_review_pending",
  reason,...more},status);
}
function utcMonthStart(){
 const n=new Date();return new Date(Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),1)).toISOString();
}
async function counted(admin:any,userId:string){
 const since=new Date(Date.now()-3600_000).toISOString();
 const [hour,monthly]=await Promise.all([
  admin.from("ai_grading_runs").select("id",{count:"exact",head:true})
   .eq("user_id",userId).gte("created_at",since),
  admin.from("ai_grading_runs").select("id",{count:"exact",head:true})
   .gte("created_at",utcMonthStart())
 ]);
 if(hour.error||monthly.error)throw Error("grading_usage_unavailable");
 return {hour:Number(hour.count)||0,month:Number(monthly.count)||0};
}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return pending("invalid_method",405);
 const started=Date.now();
 const env={
  LEX_AI_GRADING_ENABLED:Deno.env.get("LEX_AI_GRADING_ENABLED"),
  LEX_AI_SPEND_APPROVED:Deno.env.get("LEX_AI_SPEND_APPROVED"),
  LEX_AI_GRADING_MODEL:Deno.env.get("LEX_AI_GRADING_MODEL"),
  OPENAI_GRADING_API_KEY:Deno.env.get("OPENAI_GRADING_API_KEY")
 };
 // Default denial before any other lookup. No billable provider call.
 if(!flagEnabled(env))return pending("semantic_provider_not_approved");
 let logId:string|null=null,admin:any=null;
 try{
  const auth=await requireUser(req);
  admin=auth.admin;
  const b=await req.json();
  const itemId=String(b.item_id||"");
  const taskKey=String(b.task_key||"");
  const answer=String(b.answer||"").trim();
  const courseId=String(b.course_id||"");
  const language=b.language==="en"?"en":"ar";
  if((!itemId&&!taskKey)||!courseId||!answer)return pending("missing_fields",400);
  if(answer.length>4000)return pending("answer_too_long",413);
  // Do not send PII other than the actual student's explicitly consented answer.
  if(auth.profile.role!=="student")return pending("student_only",403);
  const enrolled=await admin.from("enrollments").select("status")
   .eq("user_id",auth.user.id).eq("course_id",courseId).maybeSingle();
  if(enrolled.error||enrolled.data?.status!=="active")return pending("course_access_denied",403);
  const consent=await admin.from("consent_records").select("accepted,created_at")
   .eq("user_id",auth.user.id)
   .eq("notice_version",REQUIRED_CONSENT_VERSION)
   .eq("consent_type",REQUIRED_CONSENT_TYPE)
   .order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(consent.error||consent.data?.accepted!==true)
   return pending("external_processing_consent_required",403);
  if(taskKey&&!/^rights-v1-s(?:[1-9]|[12][0-9])-(?:recall|understanding|exam)$/.test(taskKey))
   return pending("invalid_task_key",400);
  let query=admin.from("content_items")
    .select("id,course_id,prompt_ar,rubric_json,source_ids,status,dimension,metadata,reviewed_at,legal_reviewer,learning_reviewer")
    .eq("course_id",courseId).eq("status","approved");
  query=taskKey?query.contains("rubric_json",{lex_task_key:taskKey}):query.eq("id",itemId);
  const itemResult=await query.maybeSingle();
  const item=itemResult.data;
  if(itemResult.error||!item||!item.reviewed_at||!item.legal_reviewer||!item.learning_reviewer
   ||item.legal_reviewer===item.learning_reviewer
   ||item.metadata?.legal_approval!==true||item.metadata?.learning_approval!==true)
   return pending("independently_reviewed_item_required",422);
  if(!reviewRubric(item.rubric_json))
   return pending("criterion_based_semantic_rubric_required",422);
  if(!Array.isArray(item.source_ids)||!item.source_ids.length||item.source_ids.length>6)
   return pending("approved_sources_missing",422);
  const src=await admin.from("content_sources")
   .select("id,excerpt,status").in("id",item.source_ids);
  if(src.error||!src.data||src.data.length!==item.source_ids.length
   ||src.data.some((s:any)=>s.status!=="approved"||!s.excerpt||s.excerpt.length>1800))
   return pending("approved_sources_missing",422);
  let payload:Record<string,unknown>;
  try{payload=apiRequest({answer,item,sources:src.data,language});}
  catch{return pending("unsafe_or_unsupported_grading_payload",422);}
  const usage=await counted(admin,auth.user.id);
  if(usage.hour>=MAX_USER_HOURLY_REQUESTS||usage.month>=MAX_PROJECT_REQUESTS)
   return pending("grading_request_limit_reached",429);
  // Reserve an audit slot before any external call. No untracked answer sent to provider.
  // Concurrency makes this a volume *safeguard*, not a guaranteed financial hard stop.
  const row=await admin.from("ai_grading_runs").insert({
   user_id:auth.user.id,course_id:courseId,item_id:item.id,model:MODEL,
   prompt_version:PROMPT_VERSION,source_ids:item.source_ids,
   result:{status:"reserved",score:null},
   needs_human_review:true,model_confidence:null,latency_ms:0
  }).select("id").single();
  if(row.error||!row.data)return pending("grading_audit_unavailable",503);
  logId=row.data.id;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),18000);
  let response:Response;
  try{
   response=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",signal:controller.signal,
    headers:{"Authorization":"Bearer "+env.OPENAI_GRADING_API_KEY,"Content-Type":"application/json"},
    body:JSON.stringify(payload)
   });
  }finally{clearTimeout(timeout);}
  if(!response.ok)return pending("semantic_provider_unavailable",503);
  const raw=await response.json();
  const proposed=extractResult(raw);
  const assessed=validateProposal(proposed,item.rubric_json,answer);
  const published=assessed.ok?{...assessed,score:assessed.score/100,source_ids:item.source_ids,
     review_notice:"provisional_only_human_review_required"}:
    {score:null,needs_human_review:true,reason:assessed.reason,
     grading_method:"human_review_pending",source_ids:item.source_ids};
  // Store restricted metadata only: no raw student answer, key, provider prompt or PII in audit result.
  await admin.from("ai_grading_runs").update({
   result:{status:assessed.ok?"preliminary_ai":"needs_human_review",
    score:published.score,reason:assessed.ok?null:assessed.reason,
    usage:{input_tokens:raw.usage?.input_tokens||null,output_tokens:raw.usage?.output_tokens||null}},
   model_confidence:assessed.ok?assessed.confidence:null,
   needs_human_review:true,latency_ms:Date.now()-started
  }).eq("id",logId);
  return json(published);
 }catch(err){
  if(logId&&admin){
   try{await admin.from("ai_grading_runs").update({
    result:{status:"failed_no_score"},needs_human_review:true,
    latency_ms:Date.now()-started
   }).eq("id",logId);}catch{ /* no propagation */ }
  }
  const code=err instanceof Error?err.message:"";
  return pending(code==="UNAUTHORIZED"?"unauthorized":code==="FORBIDDEN"?"forbidden":"semantic_evaluation_unavailable",
   code==="UNAUTHORIZED"?401:code==="FORBIDDEN"?403:503);
 }
});
