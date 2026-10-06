import { corsHeaders,json,requireUser } from "../_shared/auth.ts";

function outputText(data:any){
  if(typeof data?.output_text==="string")return data.output_text;
  for(const item of data?.output||[])for(const part of item?.content||[])if(part?.type==="output_text"&&part?.text)return part.text;
  return "";
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  const started=Date.now();
  try{
    const {user,admin}=await requireUser(req);
    const b=await req.json();
    const itemId=String(b.item_id||""),answer=String(b.answer||"").trim(),courseId=String(b.course_id||"");
    if(!itemId||!answer||!courseId)return json({error:"missing_fields"},400);
    if(answer.length>12000)return json({error:"answer_too_long"},413);
    if(profile.role==="student"){
      const er=await admin.from("enrollments").select("status").eq("user_id",user.id).eq("course_id",courseId).maybeSingle();
      if(er.error||!er.data||er.data.status!=="active")return json({error:"course_access_denied"},403);
    }
    const since=new Date(Date.now()-60*60*1000).toISOString();
    const usage=await admin.from("ai_grading_runs").select("id",{count:"exact",head:true}).eq("user_id",user.id).gte("created_at",since);
    if((usage.count||0)>=40)return json({error:"grading_rate_limit"},429);
    const itemR=await admin.from("content_items").select("id,course_id,prompt_ar,rubric_json,source_ids,status,dimension").eq("id",itemId).eq("course_id",courseId).single();
    if(itemR.error||!itemR.data||itemR.data.status!=="approved")return json({needs_human_review:true,score:null,reason:"item_not_approved"},422);
    const item=itemR.data;
    const srcR=item.source_ids?.length?await admin.from("content_sources").select("id,title,authority,excerpt,status,effective_date").in("id",item.source_ids):{data:[]};
    const sources=(srcR.data||[]).filter((x:any)=>x.status==="approved"&&x.excerpt);
    if(item.source_ids?.length&&sources.length!==item.source_ids.length)return json({needs_human_review:true,score:null,reason:"approved_sources_missing"},422);

    const key=Deno.env.get("OPENAI_API_KEY");
    if(!key)return json({needs_human_review:true,score:null,reason:"semantic_grading_not_configured"},503);
    const model=Deno.env.get("OPENAI_MODEL");
    if(!model)return json({needs_human_review:true,score:null,reason:"semantic_model_not_configured"},503);
    const schema={
      type:"object",additionalProperties:false,
      properties:{
        score:{type:["number","null"],minimum:0,maximum:1},
        achieved_criteria:{type:"array",items:{type:"object",additionalProperties:false,properties:{id:{type:"string"},label:{type:"string"},evidence:{type:"string"}},required:["id","label","evidence"]}},
        missing_criteria:{type:"array",items:{type:"string"}},
        contradictions:{type:"array",items:{type:"string"}},
        feedback_ar:{type:"string"},
        model_confidence:{type:"number",minimum:0,maximum:1},
        needs_human_review:{type:"boolean"}
      },
      required:["score","achieved_criteria","missing_criteria","contradictions","feedback_ar","model_confidence","needs_human_review"]
    };
    const grounded={question:item.prompt_ar,rubric:item.rubric_json||{},sources:sources.map((s:any)=>({id:s.id,title:s.title,authority:s.authority,excerpt:s.excerpt,effective_date:s.effective_date})),student_answer:answer};
    const ai=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
      body:JSON.stringify({
        model,
        instructions:"أنت مصحح تدريب قانوني في LexLearn. قيّم فقط بالـrubric والمصادر المعتمدة المرسلة. لا تستخدم معرفة قانونية خارجها ولا تضف مادة أو حكمًا غير موجود. اقبل الصياغات القانونية المكافئة. ميّز بين النقص والتناقض. إذا كانت المصادر غير كافية أو الإجابة ملتبسة بدرجة لا تسمح بتقييم موثوق فضع needs_human_review=true وscore=null. اكتب feedback_ar مختصرًا وتعليميًا، وليس درجة جامعية رسمية.",
        input:JSON.stringify(grounded),
        text:{format:{type:"json_schema",name:"lexlearn_grounded_grade",strict:true,schema}}
      })
    });
    if(!ai.ok)return json({needs_human_review:true,score:null,reason:"ai_provider_error",status:ai.status},502);
    const raw=await ai.json(),txt=outputText(raw);
    let result:any;try{result=JSON.parse(txt);}catch{return json({needs_human_review:true,score:null,reason:"invalid_ai_json"},502);}
    if(Number(result.model_confidence||0)<0.68){result.needs_human_review=true;result.score=null;}
    await admin.from("ai_grading_runs").insert({user_id:user.id,course_id:courseId,item_id:itemId,model,prompt_version:"grounded-v1",source_ids:item.source_ids||[],result,model_confidence:result.model_confidence,needs_human_review:!!result.needs_human_review,latency_ms:Date.now()-started});
    return json({...result,grading_method:"grounded_semantic",source_ids:item.source_ids||[],latency_ms:Date.now()-started});
  }catch(e){
    const m=e instanceof Error?e.message:String(e);
    return json({error:m,needs_human_review:true,score:null},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500);
  }
});
