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
// No paid inference calls even when obsolete API secrets exist in deployment.
const noCost=createHandler({createClient:()=>db,env:(name)=>
 name==='OPENAI_API_KEY'?'accidental-secret':name==='OPENAI_MODEL'?'model':'test',assess:R.assess});
payload.request_id='00000000-0000-4000-8000-000000000005';
const localReceipt=await(await noCost(new Request('https://example.com',{method:'POST',
 headers:{authorization:'Bearer test'},body:JSON.stringify(payload)}))).json();
assert.equal(localReceipt.grade_status,'rule_assessed');
assert.equal(localReceipt.details.provider,'none');
assert.equal(localReceipt.details.provider_status,'disabled_no_paid_calls');
assert.equal(providerCalls,0,'No external paid model calls, regardless of configuration');
// A verified custom domain must pass preflight; a random origin must not.
// This is not an authentication bypass: all accepted POSTs still require JWTs.
const prodOrigin='https://lexlearn.example';
const production=createHandler({createClient:()=>db,
 env:(name)=>name==='LEX_ALLOWED_ORIGINS'?prodOrigin+',http://insecure.example,*':name.startsWith('OPENAI_')?undefined:'test',
 assess:R.assess});
const options=(origin)=>new Request('https://example.com',{method:'OPTIONS',headers:{origin,'Access-Control-Request-Method':'POST'}});
let preflight=await production(options(prodOrigin));
assert.equal(preflight.status,200,'approved HTTPS custom domain should pass OPTIONS');
assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),prodOrigin);
assert.equal(preflight.headers.get('Vary'),'Origin');
assert.equal((await production(options('https://evil.example'))).status,403,'unknown origin denied on preflight');
assert.equal((await production(options('http://insecure.example'))).status,403,'HTTP origins are never whitelisted');
assert.equal((await production(new Request('https://example.com',{method:'POST',
 headers:{origin:'https://evil.example',authorization:'Bearer test'}}))).status,403,
 'unknown browser origin denied before any data handling');
assert.equal((await production(new Request('https://example.com',{method:'POST',
 headers:{origin:prodOrigin}}))).status,401,'CORS permission must not replace JWT auth');
preflight=await handler(options('https://ahmadfoad361-sketch.github.io'));
assert.equal(preflight.status,200,'existing GitHub Pages preview still works');
assert.equal((await handler(new Request('https://example.com',{method:'POST'}))).status,401);
payload.request_id='00000000-0000-4000-8000-000000000006';
payload.answer='الشخصية القانونية تثبت بولادة الجنين حيا';
response=await send();r=await response.json();
assert.equal(response.status,200);
assert.equal(r.grade_status,'rule_assessed','Legally valid shortened phrasing must produce evidenced partial recall grade');
assert.equal(r.recall_score,29,'Live birth of fetus is a legal-personality start, not prenatal rights');
assert.equal(r.details.criteria[0].id,'birth_alive');
assert.equal(r.details.criteria[0].points,2);
assert.equal(providerCalls,0,'No paid model API calls for restored score');
global.fetch=oldFetch;console.log('Delivery: no paid inference, secure CORS, retry, quota, source and engine failure PASS');
})().catch(e=>{console.error(e);process.exit(1)});
