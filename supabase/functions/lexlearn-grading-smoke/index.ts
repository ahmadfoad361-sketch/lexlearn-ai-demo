import {corsHeaders,json,requireStaff,adminClient} from "../_shared/auth.ts";
import {compactGradeRequest,inspectCompactGradeResponse,criterionGradeResult,MODEL} from "../_shared/semantic-grading.mjs";

// A deliberately SEPARATE, synthetic-only smoke endpoint. This is not used by students.
// Exactly three, one-time, atomic DB slots; a repeat cannot call the provider again.
const COURSE="qa-qu-lawc101-rights";
const ITEM="rights-v1-s1-recall";
const SOURCES=[
 {id:"qa-civil-2004-art39",excerpt:"تبدأ شخصية الإنسان بتمام ولادته حياً، وتنتهي بموته."},
 {id:"qa-civil-2004-art40",excerpt:"الحمل المستكن أهل لثبوت الحقوق التي لا يحتاج سببها إلى قبول، وذلك بشرط تمام ولادته حياً."}
];
const ITEM_RUBRIC={
 id:ITEM,course_id:COURSE,dimension:"recall",
 prompt_ar:"من ذاكرتك اذكر المادتين 39 و40، واختر ثلاث مفاتيح للحفظ واشرح معنى كل مفتاح.",
 rubric_json:{
  prompt_en:"Recall the legal rules in Articles 39 and 40. Give three distinct mnemonic cues and explain each.",
  instructions:"Qatar law only. A correct copied statute without three DISTINCT mnemonic cues and an explanation of EACH cannot receive more than 6/8. A rejected false statement is not an asserted conclusion. Every criterion must have textual evidence.",
  criteria:[
   {id:"c1",label:"الولادة الحية تبدأ الشخصية",label_en:"Legal personality begins on complete live birth",weight:2,description:"Correct legal relationship; not mere presence of birth keyword",evaluation_scope:"rule_content"},
   {id:"c2",label:"الوفاة تنهي الشخصية",label_en:"Personality ends at death",weight:2,description:"Correct relationship; reversed starts and ends are wrong",evaluation_scope:"rule_content"},
   {id:"c3",label:"حقوق الحمل مشروطة بالولادة الحية ولا يحتاج سبب الحق لقبول",label_en:"Rights that do not require acceptance may vest upon live birth",weight:2,description:"Both condition of live birth and right cause not requiring acceptance must be correctly stated",evaluation_scope:"rule_content"},
   {id:"c4",label:"ثلاث مفاتيح للحفظ مختلفة",label_en:"Three distinct personal memory cues",weight:1,description:"Three distinct and useful cues; neither a mere legal paragraph nor duplicated words qualifies",evaluation_scope:"memory_cues"},
   {id:"c5",label:"ربط كل مفتاح بمعناه القانوني",label_en:"Explain how EACH memory cue relates to a legal element",weight:1,description:"Each of three distinct cues needs accurate legal explanation; not a list of unlinked words",evaluation_scope:"memory_cues"}
  ]
 }
};
const CASES={
 // Fresh, one-time replacement for the original incomplete-schema full_ar smoke.
 // Must be initiated by project owner; never retry a spent test slot.
 full_ar_v2:{
  expected_min:85,expected_max:100,lang:"ar",
  answer:"تبدأ الشخصية القانونية للإنسان بتمام ولادته حيًّا، وتنتهي بموته. ويثبت للحمل المستكن ما لا يحتاج من الحقوق إلى قبول بشرط أن يولد حيًّا. مفاتيح الحفظ الثلاثة: الميلاد = بداية الشخصية بتمام الولادة حية؛ الوفاة = نهاية الشخصية بالموت؛ الحمل = حقوق لا يحتاج سببها إلى قبول وتظل مشروطة بالولادة حية."
 },
 full_ar:{
  expected_min:85,expected_max:100,lang:"ar",
  answer:"تبدأ الشخصية القانونية للإنسان بتمام ولادته حيًّا، وتنتهي بموته. ويثبت للحمل المستكن ما لا يحتاج من الحقوق إلى قبول بشرط أن يولد حيًّا. مفاتيح الحفظ الثلاثة: الميلاد = بداية الشخصية بتمام الولادة حية؛ الوفاة = نهاية الشخصية بالموت؛ الحمل = حقوق لا يحتاج سببها إلى قبول وتظل مشروطة بالولادة حية."
 },
 reversed_ar:{
  expected_min:0,expected_max:25,lang:"ar",
  answer:"تبدأ الشخصية القانونية بالوفاة وتنتهي بالولادة الحية، ولا تثبت للحمل المستكن أي حقوق ولو ولد حيا. الكلمات المفتاحية: الولادة، الموت، الحمل."
 },
 paraphrase_en:{
  expected_min:70,expected_max:75,lang:"en",
  answer:"A human acquires legal personality once born alive and ceases to have it when deceased. An unborn child may obtain rights which do not require acceptance only on the condition that the child is eventually born alive."
 }
};
const send=(data:unknown,status=200)=>json(data,status);
async function authorized(req:Request){
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"").trim();
 if(!token)throw new Error("unauthorized");
 // Supabase Dashboard's built-in service-role test token (never ask user to paste it).
 if(token===Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))return adminClient();
 const x=await requireStaff(req);
 if(x.profile.role!=="owner")throw new Error("forbidden");
 return x.admin;
}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:{...corsHeaders,"Access-Control-Allow-Methods":"GET, POST, OPTIONS"}});
 if(req.method!=="POST"&&req.method!=="GET")return send({error:"method_not_allowed"},405);
 let admin:any;
 try{admin=await authorized(req)}catch{return send({error:"owner_or_dashboard_service_role_required"},403)}
 if(req.method==="GET"){
  const q=await admin.from("lex_ai_grading_smoke")
   .select("case_id,state,observed_score,expected_min,expected_max,agreement,reason,prompt_tokens,completion_tokens,estimated_cost_usd,created_at,completed_at")
   .order("case_id");
  if(q.error)return send({error:"smoke_audit_unavailable"},503);
  return send({test_only:true,provider_used:false,results:q.data});
 }
 let request:any;
 try{request=await req.json()}catch{return send({error:"json_body_required"},400)}
 const id=String(request?.case_id||"");
 const t=Object.hasOwn(CASES,id)?CASES[id as keyof typeof CASES]:null;
 if(!t)return send({error:"case_not_allowlisted",allowed_cases:Object.keys(CASES)},400);
 if(!Deno.env.get("OPENAI_GRADING_API_KEY"))return send({error:"grading_key_not_set"},503);
 const reserved=await admin.from("lex_ai_grading_smoke")
  .insert({case_id:id,model:MODEL,state:"reserved",expected_min:t.expected_min,expected_max:t.expected_max})
  .select("case_id").single();
 // The primary-key INSERT must succeed BEFORE any external call; even on failure
 // the case is spent. No automatic retry and no parallel double charging.
 if(reserved.error||!reserved.data)
  return send({error:"case_already_reserved_or_database_unavailable",case_id:id,no_provider_call:true},409);
 const started=Date.now();
 let state="provider_error",score:number|null=null,agreement:boolean|null=null,reason="provider_unavailable";
 let inTokens:number|null=null,outTokens:number|null=null,cost:number|null=null,breakdown:any=null;
 try{
  const payload=compactGradeRequest({answer:t.answer,item:ITEM_RUBRIC,sources:SOURCES,language:t.lang});
  payload.max_output_tokens=2400; // Allow complete structured feedback for every criterion
  // Short criteria-only response with server-owned weighted numeric scoring.
  const ctrl=new AbortController();
  const timeout=setTimeout(()=>ctrl.abort(),18000);
  let resp:Response;
  try{
   resp=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",headers:{"Authorization":"Bearer "+Deno.env.get("OPENAI_GRADING_API_KEY"),"Content-Type":"application/json"},
    body:JSON.stringify(payload),signal:ctrl.signal
   });
  }finally{clearTimeout(timeout)}
  if(!resp.ok)reason="model_http_"+resp.status;
  else{
   const raw=await resp.json();
   inTokens=Number.isFinite(raw.usage?.input_tokens)?raw.usage.input_tokens:null;
   outTokens=Number.isFinite(raw.usage?.output_tokens)?raw.usage.output_tokens:null;
   if(inTokens!==null&&outTokens!==null)cost=Math.round((inTokens*0.75/1000000+outTokens*4.50/1000000)*1000000)/1000000;
   const diagnostic=inspectCompactGradeResponse(raw);
   const grading=diagnostic.proposal?
    criterionGradeResult(diagnostic.proposal,ITEM_RUBRIC.rubric_json,t.answer,ITEM_RUBRIC.dimension):
    {ok:false,reason:diagnostic.reason};
   if(grading.ok){score=grading.score;breakdown=grading.breakdown;state="completed";reason="provisional_numeric_for_review";}
   else{state="review_required";reason=grading.reason||"meaning_review_required";}
   // Invalid provider JSON NEVER counts as a correct negative-law result.
   agreement=grading.ok && score!==null && score>=t.expected_min && score<=t.expected_max;
  }
 }catch{reason="model_timeout_or_transport_error"}
 const done=await admin.from("lex_ai_grading_smoke").update({
  state,observed_score:score,agreement,reason,prompt_tokens:inTokens,completion_tokens:outTokens,
  estimated_cost_usd:cost,completed_at:new Date().toISOString()
 }).eq("case_id",id);
 if(done.error)return send({case_id:id,error:"test_completed_but_audit_update_failed",replay_disabled:true},503);
 return send({case_id:id,state,provisional_score:score,agrees_with_gold:agreement,
  expected_range:[t.expected_min,t.expected_max],reason,
  score_breakdown:breakdown,score_type:"criterion_weighted_preliminary_not_mastery",
  usage:{input_tokens:inTokens,output_tokens:outTokens,estimated_usd:cost},
  duration_ms:Date.now()-started,
  student_records_modified:false,review_required:true},state==="provider_error"?503:200);
});
