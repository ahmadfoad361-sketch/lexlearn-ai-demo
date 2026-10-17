const assert=require('node:assert/strict'),R=require('../assets/showcase-recall');
(async()=>{
const {createHandler}=await import('../supabase/functions/showcase-grade/handler.mjs');
let rows=new Map(),calls=0,failed=false,quota=false,sourceFail=false;
const db={auth:{getUser:async()=>({data:{user:{id:'test-user'}}})},from:()=>({select:()=>({in:async()=>sourceFail?{error:true}:{data:[{status:'approved',excerpt:'39'},{status:'approved',excerpt:'40'}]}})}),rpc:async(name,p)=>{calls++;assert.equal(name,'save_demo_submission');if(failed)return{error:true};if(rows.has(p.p_request_id))return{data:rows.get(p.p_request_id)};if(quota)return{data:{error:'daily_demo_limit'}};const r=p.p_record;const receipt={received:true,submission_id:'fixture-id',grade_status:r.grade_status,recall_score:r.recall_score,details:r.grade_evidence,feedback:r.grade_feedback,choice_indicators:r.choice_indicators};rows.set(p.p_request_id,receipt);return{data:receipt};}};
let providerCalls=0;const oldFetch=global.fetch;global.fetch=async()=>{providerCalls++;throw new Error('insufficient_quota');};
const handler=createHandler({createClient:()=>db,env:(name)=>name.startsWith('OPENAI_')?undefined:'test',assess:R.assess});
const payload={topic:1,language:'ar',request_id:'00000000-0000-4000-8000-000000000001',answer:'تبدأ الشخصية القانونية بالولادة حية، وتنتهي بالموت، وللجنين حقوق لا تحتاج قبولًا، بشرط ولادته حيا.',choices:['recall','recall','understanding','understanding','understanding','understanding'].map(type=>({type,selected:0}))};
const send=()=>handler(new Request('https://example.com',{method:'POST',headers:{authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify(payload)}));
let response=await send(),r=await response.json();assert.equal(r.recall_score,100);assert(r.submission_id);assert.equal(providerCalls,0,'An exhausted paid provider must never be invoked');
await send();assert.equal(rows.size,1,'retry one record');
payload.request_id='00000000-0000-4000-8000-000000000002';failed=true;response=await send();assert.equal(response.status,503);assert.equal(rows.size,1);failed=false;response=await send();r=await response.json();assert(r.received);assert.equal(rows.size,2);
payload.request_id='00000000-0000-4000-8000-000000000003';quota=true;assert.equal((await send()).status,429);quota=false;
sourceFail=true;r=await(await send()).json();assert(r.received);assert.equal(r.recall_score,null);assert.equal(r.details.reason,'legal_sources_not_ready');
const crashing=createHandler({createClient:()=>db,env:()=> 'test',assess:()=>{throw new Error('engine crash')}});sourceFail=false;payload.request_id='00000000-0000-4000-8000-000000000004';r=await(await crashing(new Request('https://example.com',{method:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify(payload)}))).json();assert(r.received);assert.equal(r.recall_score,null);assert.equal(r.details.reason,'local_engine_error');
const aiHandler=createHandler({createClient:()=>db,env:(name)=>name.startsWith('OPENAI_')?undefined:'test',assess:R.assess,
 semanticGrade:async()=>({status:'scored',grade:{
  grade_status:'ai_assessed',recall_score:100,
  feedback:'Model mock found all approved legal elements in the answer.',
  details:{engine:'grounded-semantic-v1',provider:'openai',provisional:true,points:7,max_points:7,
   source_ids:['qa-civil-2004-art39','qa-civil-2004-art40'],criteria:[]}
 }})});
payload.request_id='00000000-0000-4000-8000-000000000005';
const aiReceipt=await(await aiHandler(new Request('https://example.com',{method:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify(payload)}))).json();
assert.equal(aiReceipt.grade_status,'ai_assessed','Automated AI-grade provenance must persist for supervisor access');
assert.equal(aiReceipt.recall_score,100,'Semantic model score must be visible in student receipt');
assert.equal(aiReceipt.details.provider,'openai');
assert.equal((await handler(new Request('https://example.com',{method:'POST'}))).status,401);
global.fetch=oldFetch;console.log('Delivery: provider exhaustion isolation, retry, quota, source failure, engine failure, auth PASS');
})().catch(e=>{console.error(e);process.exit(1)});
