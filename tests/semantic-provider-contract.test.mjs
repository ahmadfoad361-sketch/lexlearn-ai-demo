import assert from "node:assert/strict";
import {MODEL,RESPONSE_SCHEMA,flagEnabled,apiRequest,validateProposal,extractResult,inspectProviderResponse,reviewRubric} from "../supabase/functions/_shared/semantic-grading.mjs";
const item={
 id:"rights-v1-s1-recall",prompt_ar:"اشرح بدء وانتهاء الشخصية القانونية",
 dimension:"recall",
 rubric_json:{prompt_en:"Explain legal personality",criteria:[
  {id:"birth",label:"Legal personality begins at live birth",weight:2},
  {id:"death",label:"It ends at death",weight:1}
 ]}
};
const sources=[{id:"approved-source",excerpt:"Birth while alive starts legal personality, and death ends it.",status:"approved"}];
const answer="تبدأ الشخصية القانونية بالولادة حيا وتنتهي بالوفاة.";
assert.equal(MODEL,"gpt-5.4-mini");
for(const e of [
 {},
 {LEX_AI_GRADING_ENABLED:"true"},
 {LEX_AI_GRADING_ENABLED:"true",LEX_AI_SPEND_APPROVED:"true",OPENAI_GRADING_API_KEY:"fake-test-key"},
 {LEX_AI_GRADING_ENABLED:"true",LEX_AI_SPEND_APPROVED:"false",LEX_AI_GRADING_MODEL:MODEL,OPENAI_GRADING_API_KEY:"fake-test-key"},
 {LEX_AI_GRADING_ENABLED:"true",LEX_AI_SPEND_APPROVED:"true",LEX_AI_GRADING_MODEL:"wrong",OPENAI_GRADING_API_KEY:"fake-test-key"}
])assert.equal(flagEnabled(e),false,"No provider call without all four server approvals");
assert.equal(flagEnabled({LEX_AI_GRADING_ENABLED:"true",LEX_AI_SPEND_APPROVED:"true",LEX_AI_GRADING_MODEL:MODEL,OPENAI_GRADING_API_KEY:"fake-test-key"}),true);
assert.deepEqual(reviewRubric(item.rubric_json).map(x=>x.id),["birth","death"]);
assert.equal(reviewRubric({criteria:[{id:"x",label:"One criterion",weight:1},{id:"x",label:"Other criterion",weight:1}]}),null);
assert.equal(reviewRubric({criteria:[{id:"x",label:"One criterion",weight:-1}]}),null);
const p=apiRequest({answer,item,sources,language:"ar"});
assert.equal(p.model,MODEL);assert.equal(p.store,false);assert.equal(p.max_output_tokens,1400);
assert.equal(p.text.format.type,"json_schema");assert.equal(p.text.format.strict,true);
assert.equal(p.text.format.schema.additionalProperties,false);
const disclosed=JSON.parse(p.input[1].content);
assert.equal(disclosed.learner_answer,answer);assert.ok(!("user_id" in disclosed)&&!("student_name" in disclosed));
assert.throws(()=>apiRequest({answer,item:{...item,rubric_json:{}},sources,language:"ar"}));
assert.throws(()=>apiRequest({answer,item,sources:[{id:"x",excerpt:""}],language:"ar"}));
const full={
 score:1,model_confidence:.96,needs_human_review:false,
 achieved_criteria:[
  {id:"birth",label:"Birth relation",evidence:"تبدأ الشخصية القانونية بالولادة حيا"},
  {id:"death",label:"Death relation",evidence:"تنتهي بالوفاة"}
 ],missing_criteria:[],contradictions:[],
 feedback_ar:"تغطية أولية للعلاقات",feedback_en:"Preliminary relationship evidence"
};
const valid=validateProposal(full,item.rubric_json,answer);
assert.equal(valid.ok,true);
assert.equal(valid.score,100);assert.equal(valid.needs_human_review,true);
assert.equal(valid.mastery_confirmed,false);
assert.equal(valid.status,"preliminary_ai");
for(const altered of [
 {...full,achieved_criteria:[{...full.achieved_criteria[0],evidence:"تعليل مختلق"},full.achieved_criteria[1]]},
 {...full,achieved_criteria:[full.achieved_criteria[0],full.achieved_criteria[0]],missing_criteria:["death"]},
 {...full,score:.2},
 {...full,model_confidence:.45},
 {...full,needs_human_review:true},
 {...full,contradictions:["contradicts statute"]},
 {...full,missing_criteria:["bogus"]},
 {...full,achieved_criteria:[]}
]){
 assert.equal(validateProposal(altered,item.rubric_json,answer).ok,false);
}
const partial={...full,score:2/3,achieved_criteria:[full.achieved_criteria[0]],missing_criteria:["death"]};
assert.equal(validateProposal(partial,item.rubric_json,answer).score,67);
const wrapped={output:[{content:[{type:"output_text",text:JSON.stringify(full)}]}],status:"completed"};
assert.deepEqual(extractResult(wrapped),full);
assert.equal(extractResult({status:"incomplete",output_text:JSON.stringify(full)}),null);
assert.equal(extractResult({output_text:"not json"}),null);
// The first paid full_ar attempt returned invalid_grade_schema but did not
// retain the provider's raw response. These checks ensure future errors are
// distinguishable without logging private answers, provider text or API keys.
assert.equal(inspectProviderResponse({status:"incomplete",incomplete_details:{reason:"max_output_tokens"}}).reason,"provider_output_incomplete");
assert.equal(inspectProviderResponse({status:"completed",output:[]}).reason,"provider_output_missing");
assert.equal(inspectProviderResponse({status:"completed",output_text:"not valid json"}).reason,"provider_output_not_json");
assert.equal(inspectProviderResponse({status:"completed",output_text:JSON.stringify({...full,score:2})}).reason,"invalid_grade_schema_score");
assert.equal(inspectProviderResponse({status:"completed",output_text:JSON.stringify({...full,model_confidence:null})}).reason,"invalid_grade_schema_confidence");
assert.equal(inspectProviderResponse({status:"completed",output_text:JSON.stringify({...full,achieved_criteria:"not_array"})}).reason,"invalid_grade_schema_criteria");
assert.equal(inspectProviderResponse({status:"completed",output_text:JSON.stringify({...full,feedback_ar:42})}).reason,"invalid_grade_schema_feedback");
assert.equal(inspectProviderResponse({status:"completed",output:[{content:[{type:"refusal",refusal:"no"}]}]}).reason,"provider_refused");
assert.equal(inspectProviderResponse(wrapped).reason,null);
assert.deepEqual(inspectProviderResponse(wrapped).proposal,full);
// No real OpenAI client, keys, accounts, API calls or charges are used by this suite.
console.log("Semantic provider dry-run contract: PASS (approval gates, evidence, weighted scores, trust boundaries and bilingual prompts)");
