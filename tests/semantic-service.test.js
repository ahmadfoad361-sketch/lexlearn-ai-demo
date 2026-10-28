// Executes the real Edge Function handler with isolated provider/auth/database doubles.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('supabase/functions/grade-answer/index.ts','utf8').replace(/\r\n/g,'\n').replace(/^import .*;\n/,'').replace(/:any\b/g,'').replace(/let result:any/g,'let result');
async function run(options={}){
 let handler,sent,saved;const approved={id:'test-item',course_id:'course',prompt_ar:'State the legal outcome.',rubric_json:options.rubric||{lex_task_key:'rights-v1-s1-exam',criteria:[{id:'c1',weight:1}]},source_ids:['source'],status:'approved',dimension:'exam'};
 const admin={from(table){let b={select(){return b;},eq(){return b;},gte(){return b;},contains(){return b;},in(){return b;},single:async()=>({data:options.item===false?null:approved}),insert:async value=>{saved=value;return {error:null};},then(resolve){resolve(table==='content_sources'?{data:options.sources===false?[]:[{id:'source',status:'approved',excerpt:'Personality begins at live birth, not death.'}]}:{count:0});}};return b;}};
 const context={Response,Date,JSON,Number,String,Error,console,corsHeaders:{},json:(body,status=200)=>({body,status}),requireTrainingAccess:async()=>{},requireUser:async()=>({user:{id:'synthetic-user'},profile:{role:'owner'},admin}),Deno:{env:{get:name=>options.key===false?undefined:name==='OPENAI_MODEL'?'test-model':'test-key'},serve:h=>handler=h},fetch:async(url,init)=>{sent=JSON.parse(init.body);return {ok:options.provider!==false,status:502,json:async()=>({output_text:options.invalid?'invalid':JSON.stringify(options.result||{score:0,model_confidence:.9,needs_human_review:false,contradictions:['Wrong legal conclusion'],achieved_criteria:[],missing_criteria:['c1'],feedback_ar:'Wrong outcome'})})};}};
 vm.runInNewContext(source,context);const result=await handler({method:'POST',json:async()=>({task_key:'rights-v1-s1-exam',course_id:'course',answer:options.answer||'Issue: a claim. Rule: personality begins at death. Application: death occurs. Conclusion: personality begins.',language:'en'})});return {result,sent,saved};
}
(async()=>{
 assert.equal((await run({item:false})).result.status,422);
 assert.equal((await run({sources:false})).result.status,422);
 // Any API key or simulated provider response must not cause an external model call.
 for(const options of [{},{key:false},{provider:false},{invalid:true},{result:{score:1,needs_human_review:false}}]){
  const r=await run(options);
  assert.equal(r.result.status,200);
  assert.equal(r.result.body.score,null);
  assert.equal(r.result.body.needs_human_review,true);
  assert.equal(r.result.body.grading_method,'human_review_pending');
  assert.equal(r.result.body.reason,'no_paid_semantic_model');
  assert.equal(r.sent,undefined,'No paid model request permitted');
  assert.equal(r.saved,undefined,'Do not invent a graded result');
 }
 console.log('General grading: approved sources only, no paid model, human review pending PASS');
})().catch(e=>{console.error(e);process.exit(1);});

