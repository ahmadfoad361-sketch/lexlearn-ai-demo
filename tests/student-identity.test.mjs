import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {stripTypeScriptTypes} from 'node:module';
import qr from '../assets/qrcode-generator.js';
const source=stripTypeScriptTypes(fs.readFileSync('supabase/functions/student-profile/index.ts','utf8').replace(/^import .*;\r?\n/gm,''));
async function call(body,role='student'){
 let handler,patch=null,scope=null;const own={id:'own',role,display_name:'طالب تجريبي',lexlearn_number:23};
 const admin={from(table){assert.equal(table,'profiles');const q={update(v){patch=v;return q},eq(k,v){scope=[k,v];return q},select(){return q},single(){return Promise.resolve({data:{...own,...patch},error:null})}};return q}};
 vm.runInNewContext(source,{Deno:{serve:f=>handler=f},corsHeaders:{},respond:(v,status=200)=>new Response(JSON.stringify(v),{status}),requireUser:async()=>{if(role==='anon')throw Error('UNAUTHORIZED');return {user:{id:'own'},profile:own,admin}},Response,Error,atob});
 const response=await handler(new Request('https://example.test',{method:'POST',body:JSON.stringify(body)}));return {status:response.status,data:await response.json(),patch,scope,cache:response.headers.get('Cache-Control')};
}
let r=await call({action:'get',user_id:'someone-else'});assert.equal(r.status,200);assert.deepEqual(r.scope,['id','own']);assert.equal(r.cache,'no-store, private');
r=await call({action:'update',display_name:'اسم جديد',user_id:'other',role:'owner',lexlearn_number:1});assert.equal(r.status,200);assert.deepEqual(Object.keys(r.patch),['display_name']);assert.equal(r.data.profile.lexlearn_number,23);
for(const avatar_data_url of ['https://example.test/photo.jpg','data:image/svg+xml;base64,PHN2Zz4=', 'data:image/jpeg;base64,YmFk', 'x'.repeat(200001)])assert.equal((await call({action:'update',avatar_data_url})).status,400);
assert.equal((await call({action:'update',avatar_data_url:null})).status,200);assert.equal((await call({action:'get'},'anon')).status,401);assert.equal((await call({action:'get'},'owner')).status,403);
const win={qrcode:qr},doc={documentElement:{lang:'ar'}};vm.runInNewContext(fs.readFileSync('assets/student-identity.js','utf8'),{window:win,document:doc});const api=win.LEX_IDENTITY;
const p={lexlearn_number:23,display_name:'محمد أحمد',university:'جامعة طنطا',faculty:'الحقوق',year_label:'السنة الأولى',country_code:'eg',whatsapp_e164:'PRIVATE_PHONE',password:'PRIVATE_PASSWORD',evaluation:{score:33}};
assert.equal(api.number(p),'LL-000023');assert.equal(api.number({...p,display_name:'تعديل الاسم'}),'LL-000023');const payload=api.payload(p);assert(!payload.includes('PRIVATE_'));assert(!payload.includes('score'));const card=api.card(p);assert(card.includes('<svg'));assert(card.includes('محمد أحمد'));assert(!api.card({...p,display_name:'<script>bad()</script>'}).includes('<script>'));assert(!api.avatar({...p,avatar_data_url:'javascript:bad()'}).includes('javascript:'));
qr.stringToBytes=qr.stringToBytesFuncs['UTF-8'];const code=qr(0,'M');code.addData(payload,'Byte');code.make();if(process.env.LEX_IDENTITY_QA){fs.writeFileSync('.qa-card-qr.gif',Buffer.from(code.createDataURL(8,32).split(',')[1],'base64'));fs.writeFileSync('.qa-qr-payload.txt',payload);}
for(const page of ['student.html','student-en.html','student-path.html','student-practice.html','diagnostic.html'])assert(fs.readFileSync(page,'utf8').includes('student-identity.js'));
assert(!fs.readFileSync('conference.html','utf8').includes('student-identity'));console.log('Student identity: own-user scope, fixed number, field allowlist, photo validation, escaped card and private QR payload PASS');
