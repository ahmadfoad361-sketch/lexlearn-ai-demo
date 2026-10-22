// Synthetic Edge Function dry-run (mocked authorization, storage and provider).
// No API key, live auth, paid call or production write.
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
(async()=>{
 const shared=await import("../supabase/functions/_shared/semantic-grading.mjs");
 let src=fs.readFileSync("supabase/functions/grade-answer/index.ts","utf8");
 src=src.replace(/^import .*;\s*$/gm,"");
 src=src.replace("function pending(reason:string,status=200,more:Record<string,unknown>={})","function pending(reason,status=200,more={})")
  .replace("async function counted(admin:any,userId:string)","async function counted(admin,userId)")
  .replace("Deno.serve(async(req:Request)=>","Deno.serve(async(req)=>")
  .replace("let logId:string|null=null,admin:any=null;","let logId=null,admin=null;")
  .replace("let payload:Record<string,unknown>;","let payload;")
  .replace("let response:Response;","let response;")
  .replace(/\(s:any\)=>/g,"(s)=>");
 if(src.includes("import ")||src.includes("reason:string")||src.includes("req:Request"))throw Error("Mock-only TypeScript fixture needs updating");
 const baseRubric={criteria:[{id:"birth",label:"Begins with birth",weight:1}]};
 const baseAnswer="الشخصية القانونية تبدأ بالولادة حية.";
 function fixture(options={}){
  let handler,requested=0,writes=0,providerPayload=null;
  const item={id:"item-one",course_id:"course",prompt_ar:"متى تبدأ الشخصية؟",
   rubric_json:options.rubric||baseRubric,source_ids:["qa39"],status:"approved",dimension:"recall",
   reviewed_at:"2026-10-01",legal_reviewer:"reviewer1",learning_reviewer:"reviewer2",
   metadata:{legal_approval:true,learning_approval:true}};
  if(options.unapproved)item.legal_reviewer=null;
  const records=[];
  function q(table){
   const obj={
    select(){return this;},eq(){return this;},gte(){return this;},in(){return this;},
    contains(){return this;},order(){return this;},limit(){return this;},
    maybeSingle:async()=>table==="enrollments"?{data:{status:"active"}}:
      table==="consent_records"?{data:options.consent===false?null:{accepted:true}}:
      table==="content_items"?{data:item}:{data:null},
    single:async()=>table==="content_items"?{data:item}:{data:{id:"mock-run"}},
    insert:()=>{writes++;return {select(){return {single:async()=>({data:{id:"mock-run"}})}}};},
    update:(v)=>{records.push(v);return {eq:async()=>({data:null,error:null})};},
    then(resolve){resolve(table==="content_sources"?{data:[{id:"qa39",status:"approved",excerpt:"Legal personality starts at live birth."}]}:
      table==="ai_grading_runs"?{count:options.projectLimit?200:0}:{});}
   };
   return obj;
  }
  const envValues={
   LEX_AI_GRADING_ENABLED:options.enabled===false?undefined:"true",
   LEX_AI_SPEND_APPROVED:options.budget===false?undefined:"true",
   LEX_AI_GRADING_MODEL:shared.MODEL,OPENAI_GRADING_API_KEY:"FAKE_TEST_TOKEN"
  };
  const context={
   Date,JSON,Math,Number,String,Error,Object,Promise,Array,Boolean,
   AbortController,setTimeout,clearTimeout,console,Response,
   corsHeaders:{},json:(body,status=200)=>({body,status}),
   requireUser:async()=>({user:{id:"student-1"},profile:{role:"student"},admin:{from:q}}),
   ...shared,
   Deno:{env:{get:(name)=>envValues[name]},serve:(fn)=>{handler=fn;}},
   fetch:async(url,init)=>{
     if(url!=="https://api.openai.com/v1/responses")throw Error("Unexpected provider");
     requested++;providerPayload=JSON.parse(init.body);
     const answer=options.answer||baseAnswer;
     const evidence=answer.slice(0,13); // exact student span
     const response=options.invalid?
      {criteria:[{id:"birth",met:true,evidence:"invented evidence"}],
       model_confidence:.99,needs_human_review:false,contradictions:[],feedback_ar:"ok",feedback_en:"ok"}:
      {criteria:[{id:"birth",met:true,evidence}],
       model_confidence:.92,needs_human_review:false,contradictions:[],
       feedback_ar:"مبدئيا صحيح",feedback_en:"Provisionally correct"};
     return {ok:true,json:async()=>({status:"completed",output_text:JSON.stringify(response),
       usage:{input_tokens:1200,output_tokens:180}})};
   }
  };
  vm.runInNewContext(src,context,{filename:"grade-answer.ts"});
  return {get requested(){return requested},get writes(){return writes},get providerPayload(){return providerPayload},
   async send(){return handler({method:"POST",json:async()=>({item_id:"item-one",answer:options.answer||baseAnswer,
      course_id:"course",language:"ar"})});}
  };
 }
 for(const options of [{enabled:false},{budget:false}]){
   const t=fixture(options),r=await t.send();assert.equal(r.body.score,null);
   assert.equal(r.body.reason,"semantic_provider_not_approved");
   assert.equal(t.requested,0);assert.equal(t.writes,0);
 }
 for(const options of [{consent:false},{unapproved:true},{rubric:{criteria:[]}}]){
   const t=fixture(options),r=await t.send();assert.notEqual(r.body.reason,null);
   assert.equal(t.requested,0,"No paid provider request if consent or rubric is missing");
 }
 const t=fixture(),r=await t.send();
 assert.equal(t.requested,1);assert.equal(t.providerPayload.store,false);
 assert.equal(r.body.score,1);assert.equal(r.body.score_percent,100);assert.equal(r.body.earned_weight,1);assert.equal(r.body.needs_human_review,true);
 assert.equal(r.body.mastery_confirmed,false);assert.equal(t.writes,1);
 const fake=fixture({invalid:true}),invalid=await fake.send();
 assert.equal(invalid.body.score,null);assert.equal(invalid.body.needs_human_review,true);
 assert.equal(fake.requested,1);
 const over=fixture({projectLimit:true}),rejected=await over.send();
 assert.equal(rejected.status,429);assert.equal(over.requested,0);
 console.log("Grade-answer Edge mock integration PASS: disabled, consent, reviewer gates, payload, evidence, volume and review states");
})().catch(e=>{console.error(e);process.exitCode=1;});
