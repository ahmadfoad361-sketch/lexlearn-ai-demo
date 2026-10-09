// Executes the real Edge Function handler with isolated provider/auth/database doubles.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('supabase/functions/grade-answer/index.ts','utf8').replace(/^import .*;\n/,'').replace(/:any\b/g,'').replace(/let result:any/g,'let result');
async function run(options={}){
 let handler,sent,saved;const approved={id:'test-item',course_id:'course',prompt_ar:'State the legal outcome.',rubric_json:{lex_task_key:'rights-v1-s1-exam',criteria:[{id:'c1',weight:1}]},source_ids:['source'],status:'approved',dimension:'exam'};
 const admin={from(table){let b={select(){return b;},eq(){return b;},gte(){return b;},contains(){return b;},in(){return b;},single:async()=>({data:options.item===false?null:approved}),insert:async value=>{saved=value;return {error:null};},then(resolve){resolve(table==='content_sources'?{data:options.sources===false?[]:[{id:'source',status:'approved',excerpt:'Personality begins at live birth, not death.'}]}:{count:0});}};return b;}};
 const context={Response,Date,JSON,Number,String,Error,console,corsHeaders:{},json:(body,status=200)=>({body,status}),requireUser:async()=>({user:{id:'synthetic-user'},profile:{role:'owner'},admin}),Deno:{env:{get:name=>options.key===false?undefined:name==='OPENAI_MODEL'?'test-model':'test-key'},serve:h=>handler=h},fetch:async(url,init)=>{sent=JSON.parse(init.body);return {ok:options.provider!==false,status:502,json:async()=>({output_text:options.invalid?'invalid':JSON.stringify(options.result||{score:0,model_confidence:.9,needs_human_review:false,contradictions:['Wrong legal conclusion'],achieved_criteria:[],missing_criteria:['c1'],feedback_ar:'Wrong outcome'})})};}};
 vm.runInNewContext(source,context);const result=await handler({method:'POST',json:async()=>({task_key:'rights-v1-s1-exam',course_id:'course',answer:'Issue: a claim. Rule: personality begins at death. Application: death occurs. Conclusion: personality begins.',language:'en'})});return {result,sent,saved};
}
(async()=>{
 assert.equal((await run({item:false})).result.status,422);
 assert.equal((await run({sources:false})).result.status,422);
 assert.equal((await run({key:false})).result.status,503);
 assert.equal((await run({provider:false})).result.status,502);
 assert.equal((await run({invalid:true})).result.status,502);
 for(const result of [{score:.95,model_confidence:.5,needs_human_review:false},{score:.95,model_confidence:.9,needs_human_review:true},{score:'1',model_confidence:.9,needs_human_review:false}]){
  const r=await run({result});assert.equal(r.result.body.score,null);assert.equal(r.result.body.needs_human_review,true);
 }
 const valid={score:1,model_confidence:.9,needs_human_review:false,contradictions:[],achieved_criteria:[{id:'c1',label:'criterion',evidence:'Issue: a claim.'}],missing_criteria:[],feedback_ar:'reviewed'};
 assert.equal((await run({result:valid})).result.body.score,1);
 for(const result of [
 {...valid,achieved_criteria:[{id:'invented',label:'criterion',evidence:'Issue: a claim.'}]},
 {...valid,achieved_criteria:[{id:'c1',label:'criterion',evidence:'Invented quotation'}]},
 {...valid,missing_criteria:['c1']},
 {...valid,score:.5},
 {...valid,needs_human_review:undefined},
 {...valid,contradictions:'not an array'},
 {...valid,achieved_criteria:[],missing_criteria:[]}
 ]){const out=await run({result});assert.equal(out.result.body.score,null);assert.equal(out.result.body.needs_human_review,true);}
 const r=await run();assert.equal(r.result.body.score,0);assert.equal(r.saved.result.score,0);assert.equal(r.sent.store,false);assert.equal(r.sent.input.includes('English'),true);
 console.log('semantic service handler: PASS (isolated doubles; not a live provider accuracy test)');
})().catch(e=>{console.error(e);process.exit(1);});
