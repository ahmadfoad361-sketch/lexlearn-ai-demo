import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto} from 'node:crypto';
const source=stripTypeScriptTypes(fs.readFileSync('supabase/functions/admin-manage-instructors/index.ts','utf8').replace(/^import .*;\r?\n/gm,''));
const uid='11111111-1111-4111-8111-111111111111';
const input={action:'create',name:'أستاذ تجريبي',email:' Teacher.Name+law@GMAIL.COM ',course_id:'law',subject_name:'نظرية الحق',country_code:'qa',university:'جامعة لوسيل',faculty:'الحقوق',year_label:'السنة الأولى',instructor_id:uid};
async function run(body,options={}){
 let handler;const writes=[],authCalls=[];
 const admin={auth:{admin:{
  createUser:async value=>{authCalls.push(value);return options.duplicate?{error:{code:'email_exists'}}:{data:{user:{id:uid}}};},
  updateUserById:async(id,value)=>{authCalls.push(value);return options.duplicate?{error:{code:'email_exists'}}:{};},
  deleteUser:async()=>{writes.push({table:'auth',op:'delete'});}
 }},from(table){let mutation=false;const q={
  select(){return q;},eq(){return q;},neq(){return q;},
  update(value){mutation=true;writes.push({table,op:'update',value});return q;},
  insert(value){mutation=true;writes.push({table,op:'insert',value});return q;},
  limit:async()=>({data:[]}),
  single:async()=>({data:mutation?{id:uid,instructor_id:uid}:table==='courses'?{id:'law',status:options.draft?'draft':'approved',metadata:options.reference?{reference_track_only:true}:{}}:table==='profiles'?{id:uid,role:'instructor',display_name:'Old',contact_email:'old@university.edu'}:{instructor_id:uid,official_email:'old@university.edu'}}),
  then(resolve){resolve(options.assignmentFailure&&table==='instructor_assignments'?{error:Error('failed')}:{data:{}});}
 };return q;}};
 vm.runInNewContext(source,{Error,Deno:{serve:f=>handler=f},crypto:webcrypto,corsHeaders:{},json:(b,s=200)=>new Response(JSON.stringify(b),{status:s}),requireUser:async()=>{if(options.unauthorized)throw Error('UNAUTHORIZED');return{user:{id:'owner'},profile:{role:options.role||'owner'},admin};}});
 const response=await handler(new Request('https://test.invalid',{method:'POST',body:JSON.stringify(body)}));return{status:response.status,body:await response.json(),writes,authCalls};
}
for(const action of ['create','update']){
 for(const email of [' Teacher.Name+law@GMAIL.COM ','teacher@outlook.com','teacher@yahoo.com','teacher@university.edu']){
  const result=await run({...input,action,email});assert.equal(result.status,200,email+' '+action);
  assert.equal(result.authCalls[0].email,email.trim().toLowerCase());
  assert.ok(result.writes.some(x=>x.table==='instructor_profiles'&&x.value.official_email===email.trim().toLowerCase()));
 }
 for(const email of ['broken','one@@gmail.com','one @gmail.com','x'.repeat(250)+'@gmail.com']){
  const result=await run({...input,action,email});assert.equal(result.status,400);assert.equal(result.body.error,'invalid_email');assert.equal(result.authCalls.length,0);
 }
 const duplicate=await run({...input,action},{duplicate:true});assert.equal(duplicate.body.error,'email_already_registered');assert.equal(duplicate.writes.length,0);
 const phone=await run({...input,action,whatsapp:'01000000000'});assert.equal(phone.body.error,'invalid_whatsapp');
 for(const role of ['student','instructor']){const forbidden=await run({...input,action},{role});assert.equal(forbidden.status,403);assert.equal(forbidden.authCalls.length,0);}
}
assert.equal((await run(input,{unauthorized:true})).status,401);
const failed=await run(input,{assignmentFailure:true});assert.equal(failed.body.error,'instructor_assignment_failed');assert.ok(failed.writes.some(x=>x.table==='auth'&&x.op==='delete'));
// Exercise the actual browser error decoder without a backend or any real account.
let ui=fs.readFileSync('assets/admin-instructors.js','utf8');ui=ui.slice(ui.indexOf('async function readableError'),ui.indexOf('function scopeFields'));
const context={};vm.runInNewContext(ui,context);
const duplicateMessage=await context.readableError({context:{json:async()=>({error:'email_already_registered'})}});
assert.match(duplicateMessage,/مسجل لحساب آخر/);
assert.match(await context.readableError({message:'invalid_whatsapp'}),/واتساب/);
assert.doesNotMatch(await context.readableError({message:'network failed'}),/راجع البريد/);
console.log('PASS instructor Gmail/personal/university email create + update, precise errors, duplicate protection, roles and rollback');

for(const options of [{draft:true},{reference:true}]){const r=await run(input,options);assert.equal(r.body.error,'course_not_available');assert.equal(r.authCalls.length,0);}
for(const action of ['assignment','update-assignment']){
 for(const options of [{draft:true},{reference:true}])assert.equal((await run({...input,action},options)).body.error,'course_not_available');
 for(const role of ['student','instructor'])assert.equal((await run({...input,action},{role})).status,403);
}
const updatedScope=await run({...input,action:'update-assignment',assignment_id:uid});
assert.equal(updatedScope.status,200);assert.ok(updatedScope.writes.some(x=>x.table==='admin_audit'&&x.value.action==='UPDATE_INSTRUCTOR_ASSIGNMENT'));
console.log('PASS draft/reference courses rejected before provisioning and assignment edits audited');
