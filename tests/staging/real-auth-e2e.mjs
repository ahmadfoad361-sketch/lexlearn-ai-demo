/* Genuine ephemeral local Supabase GoTrue/PostgREST checks. NO remote project access. */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {execFileSync} from "node:child_process";
const values={};
for(const line of fs.readFileSync(process.argv[2]||"/tmp/lexlearn-local.env","utf8").split(/\r?\n/)){
 const m=line.match(/^([A-Z_]+)=(.*)$/);if(!m)continue;
 values[m[1]]=m[2].replace(/^["']|["']$/g,"");
}
const api=values.API_URL||values.SUPABASE_URL||"http://127.0.0.1:54321";
const anon=values.ANON_KEY||values.SUPABASE_ANON_KEY;
const service=values.SERVICE_ROLE_KEY||values.SUPABASE_SERVICE_ROLE_KEY;
assert.match(api,/^http:\/\/(localhost|127\.0\.0\.1):54321\/?$/,"never access hosted production");
assert.ok(anon&&service,"local CLI credentials unavailable");
const pwd="EphemeralLocal!2026";
const course="qa-qu-lawc101-rights";
const quote=x=>"'"+String(x).replaceAll("'","''")+"'";
const j=x=>quote(JSON.stringify(x))+"::jsonb";
const checked=x=>{assert.match(x,/^[0-9a-f-]{36}$/i);return quote(x)+"::uuid";};
async function http(path,body,token,method="POST",key=anon){
 const response=await fetch(api+path,{method,headers:{"apikey":key,"Authorization":"Bearer "+token,"Content-Type":"application/json",Prefer:"return=representation"},body:method==="GET"?undefined:JSON.stringify(body)});
 const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{data={raw:raw.slice(0,200)}}
 return {status:response.status,data};
}
function yes(x,label){assert.ok(x.status>=200&&x.status<300,label+" HTTP "+x.status+": "+JSON.stringify(x.data).slice(0,420));return x.data;}
function deny(x,label){assert.ok([401,403,404].includes(x.status),label+" wrongly allowed "+x.status);}
function sql(command){
 return execFileSync("psql",["-v","ON_ERROR_STOP=1","-q"],{
  input:command,encoding:"utf8",
  env:{...process.env,PGHOST:"127.0.0.1",PGPORT:"54322",PGUSER:"postgres",PGPASSWORD:"postgres",PGDATABASE:"postgres"}
 });
}
const ctx={};vm.runInNewContext(fs.readFileSync("assets/official-diagnostic.js","utf8"),ctx);
const questions=ctx.LEX_OFFICIAL_DIAGNOSTIC.QUESTIONS;assert.equal(questions.length,6);
const accounts=[];
for(const name of ["student-a","student-b","student-c","student-d","editor-legal","editor-learning"]){
 const email=name+"@lexlearn-ci.invalid";
 const data=yes(await http("/auth/v1/admin/users",{email,password:pwd,email_confirm:true,user_metadata:{username:name,display_name:"LOCAL TEST "+name,role:"student"}},service,"POST",service),"create local user");
 const uid=data.id||data.user?.id;checked(uid);
 accounts.push({name,email,uid});
}
let seed="BEGIN;\n";
seed+="INSERT INTO public.courses(id,country_code,institution_key,course_code,title_ar,status) VALUES("+quote(course)+",'qa','local-test-only','LAWC101','نظرية الحق','review') ON CONFLICT(id) DO NOTHING;\n";
seed+="INSERT INTO public.cohorts(id,name) VALUES ('a0000000-0000-4000-8000-000000000001','local-A'),('a0000000-0000-4000-8000-000000000002','local-B') ON CONFLICT DO NOTHING;\n";
for(let i=0;i<accounts.length;i++){
 const u=accounts[i],role=i===4?"content_reviewer":i===5?"instructor":"student",c=i===3||i===5?"a0000000-0000-4000-8000-000000000002":"a0000000-0000-4000-8000-000000000001";
 seed+="UPDATE public.profiles SET role="+quote(role)+",active=true,cohort_id="+quote(c)+"::uuid WHERE id="+checked(u.uid)+";\n";
 if(i<4){
  seed+="INSERT INTO public.enrollments(user_id,course_id,status) VALUES ("+checked(u.uid)+","+quote(course)+",'active') ON CONFLICT DO NOTHING;\n";
  seed+="INSERT INTO public.consent_records(user_id,notice_version,consent_type,accepted) VALUES("+checked(u.uid)+",'2026-10-06-v1','learning_data',true);\n";
 }
}
for(const n of [39,40,49,50,62,63]){
 seed+="INSERT INTO public.content_sources(id,country_code,title,authority,status,excerpt) VALUES("+quote("qa-civil-2004-art"+n)+",'qa','Synthetic staging source '+n+"','LOCAL ONLY','approved','Synthetic TEST material') ON CONFLICT DO NOTHING;\n";
}
const refs=[39,49,62,39,50,63];
for(let i=0;i<questions.length;i++){
 const q=questions[i],dim=i<3?"recall":i<5?"understanding":"application";
 seed+="INSERT INTO public.content_items(id,course_id,unit_id,concept_id,dimension,item_type,prompt_ar,options_json,answer_key_json,rubric_json,source_ids,status,legal_reviewer,learning_reviewer,reviewed_at,metadata) VALUES("+
 [quote("local-v2-"+q.id),quote(course),"'week-1'","'topic-1'",quote(dim),"'mcq'",quote(q.ar),j({ar:Array.from(q.arOptions),en:Array.from(q.enOptions)}),j({correct_index:q.a}),"'{}'::jsonb","ARRAY["+quote("qa-civil-2004-art"+refs[i])+"]::text[]","'approved'",checked(accounts[4].uid),checked(accounts[5].uid),"now()",j({official_diagnostic_v2_id:q.id,legal_approval:true,learning_approval:true,staging_only:true})].join(",")+
 ");\n";
}
for(const [key,dim] of [["rights-v1-s1-recall","recall"],["rights-v1-s1-understanding","understanding"],["rights-v1-s1-exam","exam_execution"]]){
 seed+="INSERT INTO public.content_items(id,course_id,unit_id,concept_id,dimension,item_type,prompt_ar,rubric_json,source_ids,status,legal_reviewer,learning_reviewer,reviewed_at,metadata) VALUES("+
 [quote(key),quote(course),"'week-1'","'topic-1'",quote(dim),"'essay'",quote("سؤال اصطناعي للتجربة فقط: اشرح متى تبدأ الشخصية القانونية وما شروط حقوق الحمل."),j({prompt_en:"SYNTHETIC test: explain legal personality beginning and conditional prenatal rights."}),"ARRAY['qa-civil-2004-art39','qa-civil-2004-art40']::text[]","'approved'",checked(accounts[4].uid),checked(accounts[5].uid),"now()","'{\"legal_approval\":true,\"learning_approval\":true,\"staging_only\":true}'::jsonb"].join(",")+");\n";
}
seed+="INSERT INTO public.student_level_releases(course_id,level_number,academic_approved,published,approved_by,reviewed_at) VALUES("+quote(course)+",1,true,true,"+checked(accounts[5].uid)+",now());\nCOMMIT;\n";
sql(seed);
const jwt={};
for(const u of accounts.slice(0,4)){
 const data=yes(await http("/auth/v1/token?grant_type=password",{email:u.email,password:pwd},anon),"GoTrue login "+u.name);
 assert.ok(data.access_token);jwt[u.name]=data.access_token;
 assert.equal(yes(await http("/auth/v1/user",null,data.access_token,"GET"),"authenticated user").id,u.uid);
}
const rpc=(who,fn,body)=>http("/rest/v1/rpc/"+fn,body,jwt[who]);
const choose=selection=>questions.map((q,i)=>({question_id:q.id,selected:selection[i]}));
const choices=[
 ["student-a",choose([0,1,2,0,0,2]),"recall-led","rights-v1-s1-understanding"],
 ["student-b",choose([1,0,0,1,1,2]),"understanding-led","rights-v1-s1-recall"],
 ["student-c",choose([-1,-1,-1,-1,-1,-1]),"insufficient_evidence","rights-v1-s1-understanding"]
];
let state=yes(await rpc("student-a","lex_diagnostic_status",{p_course:course}),"new student");assert.equal(state.status,"not_started");
yes(await rpc("student-a","lex_diagnostic_begin",{p_course:course}),"begin");
const part=[{question_id:"q39r",selected:0}];
state=yes(await rpc("student-a","lex_diagnostic_draft",{p_course:course,p_answers:part}),"draft");assert.equal(state.draft.length,1);
state=yes(await rpc("student-a","lex_diagnostic_status",{p_course:course}),"resume");assert.equal(state.draft.length,1);
state=yes(await rpc("student-a","lex_diagnostic_draft",{p_course:course,p_answers:part}),"retry");assert.equal(state.draft.length,1);
for(const [who,answers,profile,firstId] of choices){
 if(who!=="student-a")yes(await rpc(who,"lex_diagnostic_begin",{p_course:course}),"begin "+who);
 const finish=yes(await rpc(who,"lex_diagnostic_complete",{p_course:course,p_answers:answers,p_free_text:"الشخصية القانونية تبدأ بتمام الولادة حية وتنتهي بالموت."}),"complete "+who);
 assert.equal(finish.status,"completed");assert.equal(finish.result.profileType,profile);
 const again=yes(await rpc(who,"lex_diagnostic_complete",{p_course:course,p_answers:[],p_free_text:"bad retry"}),"repeat");
 assert.equal(again.attempt_id,finish.attempt_id);
 const read=yes(await rpc(who,"lex_diagnostic_status",{p_course:course}),"returning student");
 assert.equal(read.status,"completed");
 const allowed=yes(await rpc(who,"lex_level_access",{p_course:course,p_level:1}),"first level gate");
 assert.equal(allowed.allowed,true);
 const stage=yes(await rpc(who,"lex_level_one_open",{p_course:course}),"adapted lesson");
 assert.equal(stage.tasks.length,3);assert.equal(stage.tasks[0].id,firstId);
 const original="الشخصية القانونية تبدأ بالولادة حية وتنتهي بالوفاة، وحقوق الحمل مشروطة بالولادة حية ولا يحتاج سببها إلى قبول.";
 const response=yes(await rpc(who,"lex_level_one_submit",{p_course:course,p_item_id:firstId,p_answer:original}),"essay save");
 assert.equal(response.saved.length,1);assert.ok(response.saved[0].evaluation);
 const restored=yes(await rpc(who,"lex_level_one_open",{p_course:course}),"essay restore");
 assert.equal(restored.saved[0].evaluation?.status,response.saved[0].evaluation?.status);
 const noDup=yes(await rpc(who,"lex_level_one_submit",{p_course:course,p_item_id:firstId,p_answer:"forged second essay"}),"double submit");
 assert.equal(noDup.saved[0].answer_text,original);
 const second=yes(await rpc(who,"lex_level_access",{p_course:course,p_level:2}),"direct Level2");
 assert.equal(second.allowed,false);
}
const untested=yes(await rpc("student-d","lex_level_one_open",{p_course:course}),"no diagnosis");
assert.equal(untested.allowed,false);
for(const who of ["student-b","student-d"]){
 const data=yes(await http("/rest/v1/student_diagnostic_runs?user_id=eq."+accounts[0].uid+"&select=user_id,status",null,jwt[who],"GET"),"cross student RLS");
 assert.equal(data.length,0);
}
deny(await http("/rest/v1/student_level_completions",{user_id:accounts[0].uid,course_id:course,level_number:1},jwt["student-a"]),"forged completion");
deny(await http("/rest/v1/student_diagnostic_runs",{user_id:accounts[0].uid,course_id:course,status:"completed"},jwt["student-b"]),"forged diagnosis");
deny(await http("/rest/v1/rpc/lex_diagnostic_status",{p_course:course},anon),"anonymous RPC");
console.log("PASS local true Supabase: GoTrue JWT login x4, POST /rest/v1/rpc 2xx, three adaptive plans, first-level evaluation, reload/idempotence, RLS cross-account, no Level2.");
