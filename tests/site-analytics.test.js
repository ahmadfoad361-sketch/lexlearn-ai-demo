const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const source=fs.readFileSync('assets/site-analytics.js','utf8');
(async()=>{
const entries=new Map(),requests=[];let now=Date.now();
async function visit(options={}){
 const w={LEX_CONFIG:{supabaseUrl:'https://test.invalid',supabaseAnonKey:'public-key'},crypto:webcrypto,addEventListener(){}};
 if(options.session)w.LEX_CLOUD={isConfigured:()=>true,db:()=>({auth:{getSession:async()=>({data:{session:{access_token:'verified-by-server'}}})}})};
 const ctx={window:w,LEX_CLOUD:w.LEX_CLOUD,navigator:{doNotTrack:options.dnt?'1':'0',webdriver:!!options.bot,globalPrivacyControl:!!options.gpc},crypto:webcrypto,document:{visibilityState:'visible',removeEventListener(){}},location:{pathname:'/lexlearn-ai-demo/index.html',search:'?email=do-not-record'},Date:{now:()=>now},localStorage:{getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v)},fetch:async(u,r)=>requests.push({url:u,...r})};
 vm.runInNewContext(source,ctx);await new Promise(r=>setImmediate(r));return ctx;
}
await visit();assert.equal(requests.length,1);const first=JSON.parse(requests[0].body);assert.equal(first.page,'index.html');assert.deepEqual(Object.keys(first).sort(),['event_id','page','session_id','visitor_id']);assert.equal(requests[0].referrerPolicy,'no-referrer');
now+=10000;const ctx=await visit({session:true});const second=JSON.parse(requests[1].body);assert.equal(second.session_id,first.session_id);assert.equal(second.visitor_id,first.visitor_id);assert.notEqual(second.event_id,first.event_id);assert.equal(requests[1].headers.Authorization,'Bearer verified-by-server');
vm.runInNewContext(source,ctx);assert.equal(requests.length,2,'duplicate script must not duplicate events');
now+=31*60000;await visit();const third=JSON.parse(requests[2].body);assert.notEqual(third.session_id,second.session_id);assert.equal(third.visitor_id,first.visitor_id);
for(const option of [{dnt:true},{gpc:true},{bot:true}])await visit(option);assert.equal(requests.length,3);
assert.doesNotMatch(requests.map(x=>x.body).join(''),/do-not-record/);
console.log('PASS analytics one event/page, visitor persistence, session renewal, opt-outs, no URL/contact data');
})().catch(e=>{console.error(e);process.exit(1);});
