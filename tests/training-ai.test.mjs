import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {stripTypeScriptTypes} from "node:module";
import {interpret,summarize,VERSION,SCHEMA} from "../supabase/functions/lexlearn-training-ai-grade/assessment.mjs";
const rubric={criteria:[{id:"birth",weight:2},{id:"death",weight:1}]};
const answer="Live birth begins personality; death ends it.";
const valid={criteria:[{id:"birth",met:true,evidence:"Live birth begins personality"},{id:"death",met:false,evidence:""}],confidence:.9,review_required:false,feedback_ar:"اذكر نهاية الشخصية بالوفاة.",feedback_en:"Include death as the end of personality."};
assert.equal(interpret(valid,rubric,answer).provisional_percent,67);
assert.throws(()=>interpret({...valid,criteria:[{id:"birth",met:true,evidence:"invented"},{id:"death",met:false,evidence:""}]},rubric,answer),/invalid_evidence/);
assert.throws(()=>interpret({...valid,criteria:[valid.criteria[0],valid.criteria[0]]},rubric,answer),/invalid_criteria/);
assert.throws(()=>interpret({...valid,confidence:.7},rubric,answer),/human_review/);
assert.throws(()=>interpret({...valid,review_required:true},rubric,answer),/human_review/);
const diagnostic={metrics:{understanding:80},measurements:{recall:{ai_grade:{status:"preliminary_ai",provisional_percent:40}}}};
assert.equal(summarize([],diagnostic).priority,"recall");
assert.equal(summarize([{dimension:"recall",evaluation:{status:"preliminary_internal",provisional_percent:100}}],diagnostic).skills.recall,40);
assert.equal(summarize([{dimension:"recall",evaluation:{status:"preliminary_ai",provisional_percent:95}}],diagnostic).priority,"understanding");
assert.deepEqual(summarize([],{}).skills,{recall:null,understanding:null});
// Exercise the actual deployed handler with fake database/provider boundaries.
let handler,providerCalls=0;
const source=stripTypeScriptTypes(fs.readFileSync("supabase/functions/lexlearn-training-ai-grade/index.ts","utf8").replace(/^import .*;\r?\n/gm,""));
function environment({consent=true,providerFailure=false}={}){
 let evaluation={status:"preliminary_internal",provisional_percent:50};
 let auditCount=0;
 const admin={from(table){
  let operation="select",payload,filters=[];
  const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},gte(){return q;},order(){return q;},limit(){return q;},in(){return q;},
   update(v){operation="update";payload=v;return q;},insert(v){operation="insert";payload=v;return q;},single(){return Promise.resolve(result());},maybeSingle(){return Promise.resolve(result());},then(ok,bad){return Promise.resolve(result()).then(ok,bad);}};
  function result(){
   if(table==="enrollments")return {data:{status:"active"}};
   if(table==="consent_records")return {data:{accepted:consent,notice_version:"lexlearn-ai-grading-v1"}};
   if(table==="content_items")return {data:{status:"approved",prompt_ar:"The rule",rubric_json:rubric,source_ids:["source"]}};
   if(table==="content_sources")return {data:[{id:"source",status:"approved",excerpt:"The approved source."}]};
   if(table==="ai_grading_runs"){
    if(operation==="insert"){auditCount++;return {data:{id:"audit"}};}
    return {data:null,count:0};
   }
   if(table==="student_training_answers"){
    if(operation==="update"){
     const expected=filters.find(([k])=>k==="evaluation");
     if(expected&&expected[1]!==JSON.stringify(evaluation))return {data:null};
     evaluation=payload.evaluation;return {data:{item_id:"rights-v1-s1-recall"}};
    }
    return {data:{answer_text:answer,evaluation}};
   }
   throw Error(table);
  }return q;
 }};
 const context={Deno:{env:{get:()=>"fake-secret"},serve:f=>{handler=f;}},corsHeaders:{},json:(body,status=200)=>new Response(JSON.stringify(body),{status}),
  requireUser:async()=>({user:{id:"student"},profile:{role:"student"},admin}),VERSION,SCHEMA,interpret,summarize,Response,AbortSignal,console,
  fetch:async()=>{providerCalls++;return providerFailure?new Response("unavailable",{status:503}):new Response(JSON.stringify({status:"completed",output_text:JSON.stringify(valid)}));}};
 vm.runInNewContext(source,context);
 return {call:()=>handler(new Request("https://test.invalid",{method:"POST",body:JSON.stringify({session:1,item_id:"rights-v1-s1-recall",answer:"caller cannot override saved answer"})})),grade:()=>evaluation,audits:()=>auditCount};
}
const denied=environment({consent:false});assert.equal((await denied.call()).status,403);assert.equal(providerCalls,0);
const ok=environment();assert.equal((await ok.call()).status,200);assert.equal(ok.grade().provisional_percent,67);assert.equal(ok.audits(),1);
await ok.call();assert.equal(providerCalls,1,"cached attempts never charge twice");
const simultaneous=environment();await Promise.all([simultaneous.call(),simultaneous.call()]);assert.equal(simultaneous.audits(),1,"reservation must be atomic");
const failed=environment({providerFailure:true});await failed.call();assert.equal(failed.grade().provisional_percent,null);assert.equal(failed.grade().status,"ai_review_required");
console.log("Training AI rubric evidence, consent, persistence, duplicate/concurrent requests, provider failures and adaptive priorities: PASS");

