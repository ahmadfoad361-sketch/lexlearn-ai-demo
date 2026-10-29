// This endpoint is strictly no-paid-inference: the local matcher is provisional.
export function createHandler({createClient,env,assess}){
// Explicitly allow the GitHub Pages preview and owner-approved production origins.
// LEX_ALLOWED_ORIGINS is a comma-separated list of HTTPS origins, never a wildcard.
// Origin checks are an extra browser boundary; the user JWT is still mandatory.
const previewOrigin="https://ahmadfoad361-sketch.github.io";
const extraOrigins=String(env("LEX_ALLOWED_ORIGINS")||"").split(",").map(x=>x.trim())
 .filter(x=>/^https:\/\/[a-z0-9.-]+(?::\d{2,5})?$/i.test(x));
const allowedOrigins=new Set([previewOrigin,"https://lexlearnsmart.com","https://www.lexlearnsmart.com",...extraOrigins]);
// Only the server checks and stores free-text responses; a supervisor can review.
// Unclear free text never receives a fabricated zero. No paid inference API calls.
return async req=>{
 const origin=req.headers.get("origin")||"";
 const cors={"Access-Control-Allow-Origin":allowedOrigins.has(origin)?origin:previewOrigin,
  "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};
 const json=(body,status=200)=>new Response(JSON.stringify(body),
  {status,headers:{...cors,"Content-Type":"application/json"}});
 if(origin&&!allowedOrigins.has(origin))return json({error:"origin_denied"},403);
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 try{
  const auth=req.headers.get("authorization")||"";
  const url=env("SUPABASE_URL")||"",key=env("SUPABASE_ANON_KEY")||"",service=env("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!auth.startsWith("Bearer "))return json({error:"authentication_required"},401);
  const client=createClient(url,key,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:session,error:authErr}=await client.auth.getUser();
  if(authErr||!session.user)return json({error:"authentication_required"},401);
  let b;try{b=await req.json();}catch{return json({error:"invalid_demo_payload"},400);}
  const answer=typeof b.answer==='string'?b.answer.trim():"",lang=b.language;
  const kinds=["recall","recall","understanding","understanding","understanding","understanding"];
  if(!answer||answer.length>1800||b.topic!==1||!["ar","en"].includes(lang)||!Array.isArray(b.choices)||b.choices.length!==6||
   b.choices.some((x,i)=>!x||x.type!==kinds[i]||!Number.isInteger(x.selected)||x.selected<0||x.selected>2))return json({error:"invalid_demo_payload"},400);
  // Legacy cached clients get a deterministic content key; current clients send a UUID.
  const canonical=JSON.stringify({language:lang,topic:1,answer,choices:b.choices.map((x)=>({type:x.type,selected:x.selected}))});
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical)))).map(x=>x.toString(16).padStart(2,"0")).join("");
  const requestId=b.request_id||`legacy-${digest}`;
  if(typeof requestId!=="string"||!/^([0-9a-f-]{36}|legacy-[0-9a-f]{64})$/i.test(requestId))return json({error:"invalid_request_id"},400);
  const db=createClient(url,service,{auth:{persistSession:false}});
  const choices=b.choices.map((x)=>({type:x.type,selected:x.selected,correct:x.selected===0}));
  const indicators={recall:null,understanding:null,application:null,legal_precision:null};
  for(const k of ["recall","understanding"]){const xs=choices.filter((x)=>x.type===k);indicators[k]=Math.round(100*xs.filter((x)=>x.correct).length/xs.length);}
  let grade;
  try{grade=assess(answer,lang);}catch{
   grade={grade_status:"pending_review",recall_score:null,feedback:lang==='ar'?"تعذر تشغيل التصحيح المحلي. حُفظت الإجابة لمراجعة المشرف دون منح صفر.":"Local grading failed. Your answer is saved for review without a zero.",details:{reason:"local_engine_error",provider:"none"}};
  }
  // Source availability never discards an answer. A changed/unapproved source suspends only grading.
  const sources=await db.from("content_sources").select("id,excerpt,status").in("id",["qa-civil-2004-art39","qa-civil-2004-art40"]);
  if(sources.error||sources.data?.length!==2||sources.data.some((s)=>s.status!=="approved"||!s.excerpt)){
   grade={grade_status:"pending_review",recall_score:null,feedback:lang==='ar'?"تعذر التحقق من المصادر المعتمدة؛ حُفظت إجابتك دون احتساب صفر.":"Approved sources could not be verified; your answer is saved without a zero.",details:{reason:"legal_sources_not_ready",provider:"none",points:null,max_points:7}};
  }else{
   // This is a limited, deterministic rule check, never a semantic language-model grade.
   // Recognized evidence is provisional; uncertain meaning must remain unscored.
   grade.details={...grade.details,provider:"none",provider_status:"disabled_no_paid_calls"};
  }
  const saved=await db.rpc("save_demo_submission",{p_user:session.user.id,p_request_id:requestId,p_hash:digest,p_record:{language:lang,answer_text:answer,choices,choice_indicators:indicators,grade_status:grade.grade_status,recall_score:grade.recall_score,grade_feedback:grade.feedback,grade_evidence:grade.details}});
  if(saved.error||!saved.data)return json({error:"demo_result_save_failed"},503);
  if(saved.data.error)return json(saved.data,saved.data.error==='daily_demo_limit'?429:409);
  return json(saved.data);
 }catch{return json({error:"unexpected_demo_error"},503);}
};
}
