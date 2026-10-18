import { corsHeaders,json,requireUser } from "../_shared/auth.ts";

function outputText(data:any){
  if(typeof data?.output_text==="string")return data.output_text;
  for(const item of data?.output||[])for(const part of item?.content||[])if(part?.type==="output_text"&&part?.text)return part.text;
  return "";
}

// Provider JSON is untrusted until rubric IDs, quoted evidence and score agree.
function validateGrade(result:any,rubric:any,answer:any){
  const criteria=rubric?.criteria;
  if(!Array.isArray(criteria)||!criteria.length)return "invalid_rubric";
  const ids=criteria.map((c:any)=>c.id);
  if(ids.some((id:any)=>typeof id!=="string"||!id)||new Set(ids).size!==ids.length)return "invalid_rubric";
  if(!result||typeof result!=="object"||typeof result.needs_human_review!=="boolean"||typeof result.feedback_ar!=="string"||!Array.isArray(result.achieved_criteria)||!Array.isArray(result.missing_criteria)||!Array.isArray(result.contradictions)||result.contradictions.some((x:any)=>typeof x!=="string"||!x.trim()))return "invalid_grade_schema";
  if(typeof result.model_confidence!=="number"||!Number.isFinite(result.model_confidence)||result.model_confidence<.8||result.model_confidence>1||result.needs_human_review)return "human_review_required";
  if(typeof result.score!=="number"||!Number.isFinite(result.score)||result.score<0||result.score>1)return "invalid_score";
  const achieved=result.achieved_criteria,missing=result.missing_criteria;
  const normalized=String(answer).replace(/\s+/g," ").trim();
  if(achieved.some((c:any)=>!c||!ids.includes(c.id)||typeof c.label!=="string"||typeof c.evidence!=="string"||!c.evidence.trim()||!normalized.includes(c.evidence.replace(/\s+/g," ").trim()))||missing.some((id:any)=>typeof id!=="string"||!ids.includes(id)))return "invalid_criterion_evidence";
  const covered=achieved.map((c:any)=>c.id).concat(missing);
  if(covered.length!==ids.length||new Set(covered).size!==ids.length)return "incomplete_criterion_review";
  const weights=criteria.map((c:any)=>c.weight==null?1:c.weight);
  if(weights.some((w:any)=>typeof w!=="number"||!Number.isFinite(w)||w<=0))return "invalid_rubric";
  const total=weights.reduce((s:any,w:any)=>s+w,0);
  const expected=result.contradictions.length?0:criteria.reduce((s:any,c:any,i:any)=>s+(achieved.some((a:any)=>a.id===c.id)?weights[i]:0),0)/total;
  if(Math.abs(result.score-expected)>.011)return "score_evidence_mismatch";
  return null;
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  const started=Date.now();
  try{
    const {user,profile,admin}=await requireUser(req);
    const b=await req.json();
    let itemId=String(b.item_id||"");const taskKey=String(b.task_key||"");const answer=String(b.answer||"").trim(),courseId=String(b.course_id||"");
    if((!itemId&&!taskKey)||!answer||!courseId)return json({error:"missing_fields"},400);
    if(answer.length>12000)return json({error:"answer_too_long"},413);
    if(profile.role==="student"){
      const er=await admin.from("enrollments").select("status").eq("user_id",user.id).eq("course_id",courseId).maybeSingle();
      if(er.error||!er.data||er.data.status!=="active")return json({error:"course_access_denied"},403);
    }
    const since=new Date(Date.now()-60*60*1000).toISOString();
    const usage=await admin.from("ai_grading_runs").select("id",{count:"exact",head:true}).eq("user_id",user.id).gte("created_at",since);
    if((usage.count||0)>=40)return json({error:"grading_rate_limit"},429);
    if(taskKey&&!/^rights-v1-s(?:[1-9]|[12][0-9])-(?:recall|understanding|exam)$/.test(taskKey))return json({error:"invalid_task_key",score:null,needs_human_review:true},400);
    let itemQuery=admin.from("content_items").select("id,course_id,prompt_ar,rubric_json,source_ids,status,dimension").eq("course_id",courseId).eq("status","approved");
    itemQuery=taskKey?itemQuery.contains("rubric_json",{lex_task_key:taskKey}):itemQuery.eq("id",itemId);
    const itemR=await itemQuery.single();
    if(itemR.error||!itemR.data||itemR.data.status!=="approved")return json({needs_human_review:true,score:null,reason:"item_not_approved"},422);
    const item=itemR.data;itemId=item.id;
    const srcR=item.source_ids?.length?await admin.from("content_sources").select("id,title,authority,excerpt,status,effective_date").in("id",item.source_ids):{data:[]};
    const sources=(srcR.data||[]).filter((x:any)=>x.status==="approved"&&x.excerpt);
    if(!item.source_ids?.length||sources.length!==item.source_ids.length)return json({needs_human_review:true,score:null,reason:"approved_sources_missing"},422);

    // No paid inference is permitted in LexLearn's current operation mode.
    // Only approved content reaches this point, but a reliable free-form legal
    // grade cannot be inferred without a validated evaluator. Return no score.
    return json({needs_human_review:true,score:null,reason:"no_paid_semantic_model",
      grading_method:"human_review_pending",source_ids:item.source_ids||[],
      feedback_ar:b.language==="en"
        ?"This legal answer needs an authorized academic review; no automatic grade was awarded."
        :"الإجابة القانونية تحتاج مراجعة أكاديمية؛ لم يتم منح درجة آلية.",
      latency_ms:Date.now()-started});
  }catch(e){
    const m=e instanceof Error?e.message:String(e);
    return json({error:m,needs_human_review:true,score:null},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500);
  }
});
