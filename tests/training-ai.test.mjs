import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {stripTypeScriptTypes} from "node:module";
import {interpret,summarize,VERSION,SCHEMA} from "../supabase/functions/lexlearn-training-ai-grade/assessment.mjs";
import {legalSources} from "../supabase/functions/_shared/qatar-civil-provisions.mjs";
const rubric={criteria:[{id:"birth",weight:2},{id:"death",weight:1}]};
const answer="Live birth begins personality; death ends it.";
const valid={criteria:[{id:"birth",met:true,credit:1,evidence:"Live birth begins personality",explanation_ar:"ذكرت البداية بالولادة الحية.",explanation_en:"You stated the live-birth condition."},{id:"death",met:false,credit:0,evidence:"",explanation_ar:"لم تشرح النهاية.",explanation_en:"The end is not explained."}],confidence:.9,review_required:false,feedback_ar:"اذكر نهاية الشخصية بالوفاة.",feedback_en:"Include death as the end of personality."};
assert.equal(interpret(valid,rubric,answer).provisional_percent,67);
const partial={...valid,criteria:[{...valid.criteria[0],met:false,credit:.5},valid.criteria[1]]};
assert.equal(interpret(partial,rubric,answer).provisional_percent,33,'a correct component earns partial credit, not zero');
assert.equal(interpret(partial,rubric,answer).verdict,'partially_correct');
assert.equal(interpret({...valid,criteria:[{...valid.criteria[0],evidence:'"Live birth begins personality"'},valid.criteria[1]]},rubric,answer).provisional_percent,67,'wrapping quotation marks do not reject real evidence');
assert.throws(()=>interpret({...partial,criteria:[{...partial.criteria[0],evidence:'invented'},partial.criteria[1]]},rubric,answer),/invalid_evidence/);
assert.throws(()=>interpret({...partial,criteria:[{...partial.criteria[0],met:true},partial.criteria[1]]},rubric,answer),/invalid_criteria/);
assert.equal(summarize([{dimension:'understanding',evaluation:{status:'preliminary_ai',rubric_version:'lexlearn-training-ai-v2',provisional_percent:0}}],{}).skills.understanding,null,'old binary zeros must not drive adaptation');
assert.throws(()=>interpret({...valid,criteria:[{...valid.criteria[0],evidence:"invented"},valid.criteria[1]]},rubric,answer),/invalid_evidence/);
assert.throws(()=>interpret({...valid,criteria:[valid.criteria[0],valid.criteria[0]]},rubric,answer),/invalid_criteria/);
assert.throws(()=>interpret({...valid,confidence:.7},rubric,answer),/human_review/);
assert.throws(()=>interpret({...valid,review_required:true},rubric,answer),/human_review/);
const diagnostic={metrics:{understanding:80},measurements:{recall:{ai_grade:{status:"preliminary_ai",provisional_percent:40}}}};
assert.equal(summarize([],diagnostic).priority,"recall");
assert.equal(summarize([{dimension:"recall",evaluation:{status:"preliminary_internal",provisional_percent:100}}],diagnostic).skills.recall,40);
assert.equal(summarize([{dimension:"recall",evaluation:{status:"preliminary_ai",rubric_version:VERSION,provisional_percent:95}}],diagnostic).priority,"understanding");
assert.equal(summarize([{dimension:"recall",evaluation:{status:"preliminary_ai",provisional_percent:95}}],diagnostic).skills.recall,40,"unversioned historical scores must not supersede a verified diagnostic result");
assert.deepEqual(summarize([],{}).skills,{recall:null,understanding:null});
// Exercise the actual deployed handler with fake database/provider boundaries.
let handler,providerCalls=0;
const source=stripTypeScriptTypes(fs.readFileSync("supabase/functions/lexlearn-training-ai-grade/index.ts","utf8").replace(/^import .*;\r?\n/gm,""));
function environment({consent=true,providerFailure=false}={}){
 const options=arguments[0]||{};let localCalls=0;
 let evaluation=options.initialEvaluation||{status:"preliminary_internal",provisional_percent:50};
 let auditCount=0;
 const admin={from(table){
  let operation="select",payload,filters=[];
  const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},gte(){return q;},order(){return q;},limit(){return q;},in(){return q;},
   update(v){operation="update";payload=v;return q;},insert(v){operation="insert";payload=v;return q;},single(){return Promise.resolve(result());},maybeSingle(){return Promise.resolve(result());},then(ok,bad){return Promise.resolve(result()).then(ok,bad);}};
  function result(){
   if(table==="enrollments")return {data:{status:"active"}};
   if(table==="consent_records")return {data:{accepted:consent,notice_version:"lexlearn-ai-grading-v1"}};
   if(table==="content_items"){
    const item={status:options.itemStatus||"approved",metadata:options.itemMetadata||{},prompt_ar:"The rule",rubric_json:{...rubric,human_review_required_before_activation:true},source_ids:["qa-civil-2004-art39"]};
    const filter=filters.find(([k])=>k==='status');return {data:filter&&filter[1]!==item.status?null:item};
   }
   if(table==="content_sources")return {data:[{id:"qa-civil-2004-art39",status:"approved",excerpt:"The approved source."}]};
   if(table==="ai_grading_runs"){
    if(operation==="insert"){auditCount++;return {data:{id:"audit"}};}
    return {data:null,count:filters.some(([k])=>k==="item_id")?(options.attempts||0):0};
   }
   if(table==="student_training_answers"){
    if(operation==="update"){
     const expected=filters.find(([k])=>k==="evaluation");
     if(expected&&expected[1]!==JSON.stringify(evaluation))return {data:null};
     evaluation=payload.evaluation;return {data:{item_id:"rights-v1-s1-recall"}};
    }
    return {data:{answer_text:answer,evaluation}};
   }
   if(table==="lex_reference_links")return {data:[]};
   throw Error(table);
  }return q;
 }};
 const context={Deno:{env:{get:()=>"fake-secret"},serve:f=>{handler=f;}},corsHeaders:{},json:(body,status=200)=>new Response(JSON.stringify(body),{status}),
  requireTrainingAccess:async()=>{},requireUser:async()=>({user:{id:"student"},profile:{role:"student"},admin}),VERSION,SCHEMA,interpret,summarize,Response,AbortSignal,console,legalSources,
  fetch:async(_url,request)=>{providerCalls++;localCalls++;const body=JSON.parse(request.body);assert.ok(body.input[1].content.includes("full_text_ar"));assert.ok(!body.input[1].content.includes("human_review_required_before_activation"),"activation metadata cannot override the released practice assessment");if(localCalls===2){assert.equal(body.model,"gpt-5.4");assert.equal(body.reasoning.effort,"medium");}return providerFailure||(options.verifierFailure&&localCalls===2)||(options.modelDenied&&localCalls===2)?new Response("unavailable",{status:options.modelDenied?403:503}):new Response(JSON.stringify({status:"completed",output_text:JSON.stringify(localCalls===2&&options.verifierResult?options.verifierResult:valid)}));}};
 vm.runInNewContext(source,context);
 return {call:()=>handler(new Request("https://test.invalid",{method:"POST",body:JSON.stringify({session:1,item_id:"rights-v1-s1-recall",answer:"caller cannot override saved answer"})})),grade:()=>evaluation,audits:()=>auditCount};
}
const denied=environment({consent:false});assert.equal((await denied.call()).status,403);assert.equal(providerCalls,0);
const ok=environment();assert.equal((await ok.call()).status,200);assert.equal(ok.grade().provisional_percent,67);assert.equal(ok.audits(),1);
await ok.call();assert.equal(providerCalls,2,"cached attempts never charge twice");
const simultaneous=environment();await Promise.all([simultaneous.call(),simultaneous.call()]);assert.equal(simultaneous.audits(),1,"reservation must be atomic");
const failed=environment({providerFailure:true});await failed.call();assert.equal(failed.grade().provisional_percent,null);assert.equal(failed.grade().status,"ai_review_required");
assert.equal(failed.grade().reason,'provider_http_503');
await failed.call();assert.equal(failed.audits(),2,'failed provider calls may be retried, not cached forever');
const oldZero=environment({initialEvaluation:{status:'preliminary_ai',rubric_version:'lexlearn-training-ai-v2',provisional_percent:0}});await oldZero.call();assert.equal(oldZero.grade().rubric_version,VERSION);assert.equal(oldZero.grade().provisional_percent,67);

console.log("Training AI rubric evidence, consent, persistence, duplicate/concurrent requests, provider failures and adaptive priorities: PASS");



const verifierFailed=environment({verifierFailure:true});await verifierFailed.call();assert.equal(verifierFailed.grade().provisional_percent,null,'never publish a draft when final AI verification fails');
const corrected=environment({verifierResult:partial});await corrected.call();assert.equal(corrected.grade().provisional_percent,33,'final verification replaces a mistaken draft');assert.equal(corrected.grade().needs_human_review,false);
const limited=environment({attempts:3});assert.equal((await limited.call()).status,429);

const originalText=(await import("../assets/legal-study.js")).default.text;
for(let n=39;n<=63;n++)assert.equal(legalSources([{id:"qa-civil-2004-art"+n}])[0].full_text_ar,originalText[n],"grading uses every complete provision shown to the learner");

const restricted=environment({modelDenied:true});await restricted.call();assert.equal(restricted.grade().verification.verifier_model,"gpt-5.4-mini","an unavailable stronger model must not disable verified automatic grading");assert.equal(restricted.grade().provisional_percent,67);


// Regression: later sessions are already released by the founder for internal practice.
const pilotMetadata={owner_pilot_approved:true,pilot_scope:'non_certified_educational_practice',pilot_review_mode:'founder_authorized_ai_assisted_20261019'};
const pilot=environment({itemStatus:'legal_review',itemMetadata:pilotMetadata});
assert.equal((await pilot.call()).status,200);assert.equal(pilot.grade().status,'preliminary_ai');
assert.equal(pilot.grade().practice_authorization,'founder_authorized_internal_pilot');
for(const options of [
 {itemStatus:'legal_review'},
 {itemStatus:'draft',itemMetadata:pilotMetadata},
 {itemStatus:'legal_review',itemMetadata:{...pilotMetadata,owner_pilot_approved:false}},
 {itemStatus:'legal_review',itemMetadata:{...pilotMetadata,owner_pilot_approved:'true'}},
 {itemStatus:'legal_review',itemMetadata:{...pilotMetadata,pilot_scope:'another_scope'}}
]){const rejected=environment(options),before=providerCalls;assert.equal((await rejected.call()).status,422);assert.equal(providerCalls,before,'unreleased work never reaches the paid provider');}
