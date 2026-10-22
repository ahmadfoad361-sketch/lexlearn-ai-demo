const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm");
(async()=>{
 const shared=await import("../supabase/functions/_shared/semantic-grading.mjs");
 let src=fs.readFileSync("supabase/functions/lexlearn-grading-smoke/index.ts","utf8");
 src=src.replace(/^import .*;\s*$/gm,"")
  .replace("(data:unknown,status=200)","(data,status=200)")
  .replace("async function authorized(req:Request)","async function authorized(req)")
  .replace("Deno.serve(async(req:Request)=>","Deno.serve(async(req)=>")
  .replace("let admin:any;","let admin;")
  .replace("let request:any;","let request;")
  .replace("id as keyof typeof CASES","id")
  .replace("let state=\"provider_error\",score:number|null=null,agreement:boolean|null=null,reason=", "let state=\"provider_error\",score=null,agreement=null,reason=")
  .replace("let inTokens:number|null=null,outTokens:number|null=null,cost:number|null=null;","let inTokens=null,outTokens=null,cost=null;")
  .replace("let resp:Response;","let resp;");
 if(src.includes("import {")||src.includes("let admin:any"))throw Error("Fixture source changed");
 const reserved=new Set(),updates=new Map();
 let handler,paidCalls=0;
 const admin={from(table){
  assert.equal(table,"lex_ai_grading_smoke");
  return {
   insert(row){return {select(){return {single:async()=>{
    if(reserved.has(row.case_id))return {error:{code:"23505"},data:null};
    reserved.add(row.case_id);return {error:null,data:{case_id:row.case_id}};
   }}}}},
   update(data){return {eq:async(key,id)=>{assert.equal(key,"case_id");updates.set(id,data);return {error:null}}}},
   select(){return {order:async()=>({data:[...updates].map(([case_id,x])=>({case_id,...x})),error:null})}}
  };
 }};
 const env={SUPABASE_SERVICE_ROLE_KEY:"SERVICE_FAKE",OPENAI_GRADING_API_KEY:"SK_FAKE"};
 const mock={
  ...shared,Date,JSON,Math,Number,String,Error,Object,Promise,Array,Boolean,
  AbortController,setTimeout,clearTimeout,console,Response,
  corsHeaders:{},json:(body,status=200)=>({body,status}),
  requireStaff:async(req)=>{if(req.headers.get("Authorization")!=="Bearer OWNER_VALID")throw Error("UNAUTHORIZED");return {profile:{role:"owner"},admin}},adminClient:()=>admin,
  Deno:{env:{get:(k)=>env[k]},serve:(x)=>{handler=x}},
  fetch:async(url,init)=>{
   assert.equal(url,"https://api.openai.com/v1/responses");
   assert.match(init.headers.Authorization,/Bearer SK_FAKE/);
   paidCalls++;
   const req=JSON.parse(init.body),data=JSON.parse(req.input[1].content);
   assert.ok(data.approved_excerpts.length===2);
   assert.ok(!("student_name" in data)&&!("student_id" in data));
   assert.equal(req.store,false);
   const full=data.learner_answer.includes("مفاتيح الحفظ الثلاثة");
   let reply={score:full?1:0,model_confidence:.92,needs_human_review:!full,
    achieved_criteria:[],missing_criteria:[],contradictions:full?[]:["Reversed rule"],
    feedback_ar:"اختبار فقط",feedback_en:"Synthetic test only"};
   if(full){
    const snippets=[
      "تبدأ الشخصية القانونية للإنسان بتمام ولادته حيًّا",
      "وتنتهي بموته",
      "ويثبت للحمل المستكن ما لا يحتاج من الحقوق إلى قبول بشرط أن يولد حيًّا",
      "مفاتيح الحفظ الثلاثة: الميلاد = بداية الشخصية بتمام الولادة حية؛ الوفاة = نهاية الشخصية بالموت؛ الحمل = حقوق لا يحتاج سببها إلى قبول وتظل مشروطة بالولادة حية",
      "الميلاد = بداية الشخصية بتمام الولادة حية؛ الوفاة = نهاية الشخصية بالموت؛ الحمل = حقوق لا يحتاج سببها إلى قبول وتظل مشروطة بالولادة حية"
    ];
    reply.achieved_criteria=req.input?data.criteria.map((c,i)=>({id:c.id,label:c.label,evidence:snippets[i]})):[];
   }else reply.missing_criteria=data.criteria.map(c=>c.id);
   return {ok:true,status:200,json:async()=>({status:"completed",output_text:JSON.stringify(reply),
    usage:{input_tokens:2200,output_tokens:400}})};
  }
 };
 vm.runInNewContext(src,mock,{filename:"smoke-index.ts"});
 const call=async(method,case_id,token="SERVICE_FAKE")=>
  handler({method,headers:new Headers({Authorization:"Bearer "+token}),json:async()=>({case_id})});
 const noAuth=await call("POST","full_ar","bad");
 assert.equal(noAuth.status,403);assert.equal(paidCalls,0);
 const invalid=await call("POST","not_a_case");
 assert.equal(invalid.status,400);assert.equal(paidCalls,0);
 const first=await call("POST","full_ar");
 assert.equal(first.body.provisional_score,100);
 assert.equal(first.body.agrees_with_gold,true);
 assert.equal(first.body.student_records_modified,false);
 assert.ok(first.body.usage.estimated_usd>0&&first.body.usage.estimated_usd<.01);
 assert.equal(paidCalls,1);
 const again=await call("POST","full_ar");
 assert.equal(again.status,409);assert.equal(paidCalls,1);
 const wrong=await call("POST","reversed_ar");
 assert.equal(wrong.body.provisional_score,null);assert.equal(wrong.body.agrees_with_gold,true);
 assert.equal(paidCalls,2);
 const badAgain=await call("POST","reversed_ar");
 assert.equal(badAgain.status,409);assert.equal(paidCalls,2);
 const status=await call("GET","");
 assert.equal(status.body.provider_used,false);assert.equal(status.body.results.length,2);
 assert.equal(paidCalls,2);
 assert.match(src,/grading\.reason==="human_review_required"/,"Human-review abstention must be explicit");
 assert.ok(!src.includes("(score===null||score<=t.expected_max)"),"Invalid provider response must never be accepted as a passing negative test");
 console.log("Three-case smoke mock: PASS (owner/service authentication, fixed answers, one-time slots, reject retries, no student calls)");
})().catch(x=>{console.error(x);process.exitCode=1});
