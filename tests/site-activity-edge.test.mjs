import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {stripTypeScriptTypes} from 'node:module';import {webcrypto} from 'node:crypto';
const activity=stripTypeScriptTypes(fs.readFileSync('supabase/functions/site-activity/index.ts','utf8').replace(/^import .*;\r?\n/gm,''));
const stats=stripTypeScriptTypes(fs.readFileSync('supabase/functions/admin-site-stats/index.ts','utf8').replace(/^import .*;\r?\n/gm,''));
const event={event_id:webcrypto.randomUUID(),visitor_id:webcrypto.randomUUID(),session_id:webcrypto.randomUUID(),page:'index.html'};
async function run(source,{body=event,origin='https://ahmadfoad361-sketch.github.io',token='',invalidToken=false,staff=true,authFailure=false}={}){
 let handler;const calls=[];
 const admin={from:()=>({select(){return this},eq(){return this},single:async()=>({data:{id:'verified-user',active:true,role:'student'}})}),auth:{getUser:async()=>invalidToken?{error:true}:{data:{user:{id:'verified-user'}}},admin:{getUserById:async()=>authFailure?{error:true}:{data:{user:{last_sign_in_at:'2026-10-27T00:00:00Z'}}}}},rpc:async(name,args)=>{calls.push({name,args});return {data:name==='lex_record_site_activity'?true:{accounts:[{id:'account'}]}}}};
 vm.runInNewContext(source,{Deno:{serve:f=>handler=f,env:{get:()=> 'server-only-test-secret'}},Error,Response,TextEncoder,crypto:webcrypto,adminClient:()=>admin,corsHeaders:{},json:(b,s=200)=>new Response(JSON.stringify(b),{status:s}),requireStaff:async()=>{if(!staff)throw Error('FORBIDDEN');return{admin};}});
 const r=await handler(new Request('https://test.invalid',{method:'POST',headers:{origin,Authorization:token,'x-forwarded-for':'192.0.2.1'},body:JSON.stringify(body)}));return{status:r.status,data:await r.json(),calls};
}
let r=await run(activity,{body:{...event,user_id:'forged-user'}});assert.equal(r.status,200);assert.equal(r.calls[0].args.p_user,null);assert.match(r.calls[0].args.p_network,/^[a-f0-9]{64}$/);assert.doesNotMatch(JSON.stringify(r.calls),/192\.0\.2/);
r=await run(activity,{token:'Bearer valid'});assert.equal(r.calls[0].args.p_user,'verified-user');
for(const options of [{origin:'https://evil.invalid'},{body:{...event,page:'index.html?email=secret'}},{body:{...event,event_id:'broken'}},{body:{...event,page:'admin.html'}},{token:'Bearer invalid',invalidToken:true}]){r=await run(activity,options);assert.ok(r.status>=400);assert.equal(r.calls.length,0);}
r=await run(stats,{body:{days:7},staff:false});assert.equal(r.status,403);assert.equal(r.calls.length,0);
r=await run(stats,{body:{days:365}});assert.equal(r.status,400);assert.equal(r.calls.length,0);
r=await run(stats,{body:{days:7,page:0}});assert.equal(r.data.accounts[0].login_available,true);assert.equal(r.data.accounts[0].last_sign_in_at,'2026-10-27T00:00:00Z');
r=await run(stats,{body:{days:7},authFailure:true});assert.equal(r.data.accounts[0].login_available,false);
console.log('PASS edge auth, staff gate, spoofed account ignored, page validation, network privacy and unavailable-login distinction');
