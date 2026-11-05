'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('assets/lexlearn-observability.js','utf8');
async function run(options={}){
 const calls=[],listeners={},scripts=[];
 const win={
   location:{pathname:options.path||'/diagnostic.html',search:'?token=PRIVATE'},
   navigator:{doNotTrack:options.dnt?'1':'0'},
   doNotTrack:'0',
   LEX_OBSERVABILITY_CONFIG:options.config||{},
   sessionStorage:{getItem:()=>null,setItem:()=>{}},
   crypto:{randomUUID:()=> '00000000-0000-4000-8000-000000000001'},
   fetch:(url,init)=>{calls.push({url,init});return Promise.resolve({ok:true})},
   addEventListener:(name,fn)=>{listeners[name]=fn},
   Sentry:{init:(cfg)=>{win.sentryCfg=cfg},captureMessage:(x)=>{win.sentryMessage=x}}
 };
 const doc={
   createElement:()=>({}),
   head:{appendChild:s=>{scripts.push(s)}},
   documentElement:{appendChild:s=>{scripts.push(s)}}
 };
 vm.runInNewContext(code,{window:win,document:doc,URL});
 await Promise.resolve();
 return {win,calls,listeners,scripts};
}
(async()=>{
 let a=await run();
 assert.equal(a.calls.length,0,'unconfigured monitoring should send nothing');
 assert.equal(a.scripts.length,0,'unconfigured Sentry should not load');
 const config={posthogKey:'phc_synthetic_test',posthogHost:'https://eu.i.posthog.com'};
 a=await run({config});
 assert.equal(a.calls.length,1,'one anonymous page event');
 const body=JSON.parse(a.calls[0].init.body);
 assert.equal(body.event,'lex_page_opened');
 assert.equal(body.properties.surface,'diagnostic');
 assert.equal(body.properties.$process_person_profile,false);
 assert.equal(JSON.stringify(body).includes('PRIVATE'),false,'query strings must never be sent');
 assert.equal(a.win.LEX_OBSERVABILITY.track('unknown_event'),false);
 assert.equal(a.calls.length,1,'non-whitelisted events rejected');
 a=await run({config,dnt:true});
 assert.equal(a.calls.length,0,'privacy opt-out honored');
 a=await run({config,path:'/admin.html'});
 assert.equal(a.calls.length,0,'no tracked student/admin pages outside whitelist');
 a=await run({config:{sentryDsn:'https://abc@o123.ingest.sentry.io/1234'}});
 assert.equal(a.scripts.length,1,'Sentry script loads when configured');
 a.scripts[0].onload();
 assert.equal(a.win.sentryCfg.sendDefaultPii,false);
 assert.equal(a.win.sentryCfg.defaultIntegrations,false);
 const sanitized=a.win.sentryCfg.beforeSend({
   event_id:'test',timestamp:1,message:'Sensitive legal student answer',
   user:{email:'student@example.test'},request:{url:'https://example.test?token=PRIVATE'},
   breadcrumbs:[{message:'secret'}]
 });
 assert.equal(JSON.stringify(sanitized).includes('Sensitive'),false);
 assert.equal(JSON.stringify(sanitized).includes('student@example.test'),false);
 assert.equal(JSON.stringify(sanitized).includes('PRIVATE'),false);
 a.listeners.error({message:'secret'});
 assert.equal(a.win.sentryMessage,'lex_frontend_error');
 console.log('PASS: LexLearn monitoring privacy, opt-in, error-only Sentry checks');
})().catch(e=>{console.error(e);process.exitCode=1});
