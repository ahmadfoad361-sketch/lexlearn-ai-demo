import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto} from 'node:crypto';
const code=stripTypeScriptTypes(fs.readFileSync('supabase/functions/admin-create-student/index.ts','utf8').replace(/^import .*;\r?\n/gm,''));
const input={accepted_registration_terms:true,accepted_terms_version:'2026-10-23-v6',username:'pilot-test',name:'Pilot learner',university:'Qatar University',faculty:'Law',academic_section:'Civil',student_registration_number:'REG-001',institutional_group_email:'CLASS@UNIVERSITY.EDU',country_code:'eg'};
async function run(body,failConsent=false){
 let handler,profile,deleted=false,consentWritten=false;
 const admin={rpc:async(name,args)=>({data:args.p_action==='get'?{university:'Group University',faculty:'Group Law',year_label:'الفرقة الثالثة',country_code:'ae',active:true,ends_at:'2030-01-01'}:{ok:true}}),auth:{admin:{createUser:async()=>({data:{user:{id:'test-id'}}}),deleteUser:async()=>{deleted=true;}}},from(table){
  const q={update(value){profile=value;return q;},eq(){return q;},select(){return q;},single:async()=>({data:{id:'test-id'}}),
   upsert:async value=>{assert.equal(value.course_id,'qa-qu-lawc101-rights');return {data:{}};},insert:async()=>{if(table==='consent_records'){consentWritten=true;if(failConsent)return {error:Error('fail')};}return {};}};return q;
 }};
 vm.runInNewContext(code,{Deno:{serve:f=>handler=f,env:{get:()=>''}},crypto:webcrypto,corsHeaders:{},json:(b,s=200)=>new Response(JSON.stringify(b),{status:s}),requireStaff:async()=>({user:{id:'staff'},profile:{role:'admin'},admin})});
 const response=await handler(new Request('https://test.invalid',{method:'POST',body:JSON.stringify(body)}));return {response,profile,deleted,consentWritten};
}
const good=await run(input);assert.equal(good.response.status,200);assert.equal(good.profile.faculty,'Law');assert.equal(good.profile.academic_section,'Civil');assert.equal(good.profile.student_registration_number,'REG-001');assert.equal(good.profile.institutional_group_email,'class@university.edu');assert.equal(good.profile.active,false);assert.equal(good.profile.account_status,"pending");assert.equal(good.consentWritten,true,'save the acceptance explicitly attested during staff signup');
assert.equal((await run({...input,accepted_registration_terms:false})).response.status,400);
assert.equal((await run({...input,accepted_terms_version:'old-version'})).response.status,400);
assert.equal((await run({...input,faculty:''})).response.status,400);
assert.equal((await run({...input,institutional_group_email:'bad-address'})).response.status,400);
assert.equal((await run({...input,academic_section:'x'.repeat(101)})).response.status,400);
const grouped=await run({...input,trial_id:'group',university:'forged school',faculty:'forged faculty',year:'wrong',country_code:'eg'});assert.equal(grouped.response.status,200);assert.equal(grouped.profile.university,'Group University');assert.equal(grouped.profile.faculty,'Group Law');assert.equal(grouped.profile.year_label,'الفرقة الثالثة');assert.equal(grouped.profile.country_code,'ae');
const failed=await run(input,true);assert.equal(failed.response.status,500);assert.equal(failed.deleted,true,'roll back a partially created account');
console.log('Staff signup: required fields, optional identifiers, email validation, Qatar pilot enrollment and failure rollback: PASS');


