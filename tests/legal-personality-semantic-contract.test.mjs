// First legal-personality rubric: distinct law content vs student-selected memory cues.
import assert from "node:assert/strict";
import {apiRequest,validateProposal} from "../supabase/functions/_shared/semantic-grading.mjs";
const item={prompt_ar:"من ذاكرتك: اكتب قاعدة بداية الشخصية ثم اختر ثلاث مفاتيح واشرحها.",dimension:"recall",
  rubric_json:{instructions:"Do not infer understanding from keywords or memory cues from a copied statute.",criteria:[
   {id:"c1",weight:2,label:"ولادة حية تبدأ الشخصية",label_en:"Live birth begins personality",description:"Correct law proposition only",evaluation_scope:"rule_content"},
   {id:"c2",weight:2,label:"الموت ينهي الشخصية",label_en:"Death ends personality",description:"Correct death ending",evaluation_scope:"rule_content"},
   {id:"c3",weight:2,label:"حقوق الحمل مشروطة بالولادة حيا",label_en:"Conditional prenatal rights",description:"rights not needing acceptance and conditional live birth",evaluation_scope:"rule_content"},
   {id:"c4",weight:1,label:"ثلاث مفاتيح تذكر مختلفة",label_en:"Three distinct cues",description:"Do NOT credit repeated cues",evaluation_scope:"memory_cues"},
   {id:"c5",weight:1,label:"ربط كل مفتاح بمعناه",label_en:"Explain each cue",description:"Do NOT credit unlinked keyword lists",evaluation_scope:"memory_cues"}
  ]}};
const sources=[
 {id:"qa-civil-2004-art39",excerpt:"تبدأ شخصية الإنسان بتمام ولادته حياً، وتنتهي بموته."},
 {id:"qa-civil-2004-art40",excerpt:"الحمل المستكن أهل لثبوت الحقوق التي لا يحتاج سببها إلى قبول، وذلك بشرط تمام ولادته حياً."}
];
const full="الشخصية القانونية تبدأ بتمام الولادة حيا وتنتهي بالموت، وللحمل المستكن حقوق لا تحتاج أسبابها إلى قبول بشرط ولادته حيا. مفاتيحي: الميلاد يعني بداية الشخصية؛ الوفاة تعني نهايتها؛ الحمل يعني حقوقا مشروطة بولادته حيا.";
const payload=JSON.parse(apiRequest({answer:full,item,sources,language:"ar"}).input[1].content);
assert.equal(payload.criteria.length,5);assert.equal(payload.criteria[4].description,item.rubric_json.criteria[4].description);
assert.equal(payload.criteria[3].evaluation_scope,"memory_cues");
assert.equal(payload.criteria[0].label_en,"Live birth begins personality");
assert.equal(payload.rubric_instructions,item.rubric_json.instructions);
assert.equal(payload.approved_excerpts.length,2);
assert.ok(!("student_name" in payload)&&!("student_id" in payload));
assert.ok(!("OPENAI_GRADING_API_KEY" in payload));
const parts={
 c1:"الشخصية القانونية تبدأ بتمام الولادة حيا",
 c2:"تنتهي بالموت",c3:"وللحمل المستكن حقوق لا تحتاج أسبابها إلى قبول بشرط ولادته حيا",
 c4:"مفاتيحي: الميلاد يعني بداية الشخصية؛ الوفاة تعني نهايتها؛ الحمل يعني حقوقا مشروطة بولادته حيا",
 c5:"الميلاد يعني بداية الشخصية؛ الوفاة تعني نهايتها؛ الحمل يعني حقوقا مشروطة بولادته حيا"
};
function proposed(achieved,answer=full){
 const ids=item.rubric_json.criteria.filter(x=>achieved.includes(x.id)),weights=item.rubric_json.criteria;
 const got=weights.filter(x=>achieved.includes(x.id)).reduce((s,x)=>s+x.weight,0);
 return {score:got/8,model_confidence:.97,needs_human_review:false,
 achieved_criteria:ids.map(x=>({id:x.id,label:x.label,evidence:parts[x.id]})),
 missing_criteria:weights.filter(x=>!achieved.includes(x.id)).map(x=>x.id),contradictions:[],
 feedback_ar:"مراجعة أولية",feedback_en:"Preliminary assessment"};
}
const all=validateProposal(proposed(["c1","c2","c3","c4","c5"]),item.rubric_json,full);
assert.equal(all.ok,true);assert.equal(all.score,100);assert.equal(all.mastery_confirmed,false);
const copiedLaw=proposed(["c1","c2","c3"]);const lawOnly="الشخصية القانونية تبدأ بتمام الولادة حيا وتنتهي بالموت، وللحمل المستكن حقوق لا تحتاج أسبابها إلى قبول بشرط ولادته حيا.";
assert.equal(validateProposal(copiedLaw,item.rubric_json,lawOnly).score,75);
const fakeMemoryCues={...proposed(["c1","c2","c3","c4"]),achieved_criteria:proposed(["c1","c2","c3","c4"]).achieved_criteria.map(x=>x.id==="c4"?{...x,evidence:"ثلاث مفاتيح لا تظهر في الإجابة"}:x)};
assert.equal(validateProposal(fakeMemoryCues,item.rubric_json,full).ok,false);
const fabricatedScore={...proposed(["c1","c2","c3"]),score:1};
assert.equal(validateProposal(fabricatedScore,item.rubric_json,full).ok,false);
assert.equal(validateProposal({...proposed(["c1","c2","c3"]),contradictions:["Reversal of start and death"]},item.rubric_json,full).ok,false);
assert.equal(validateProposal({...proposed(["c1","c2","c3"]),model_confidence:.1},item.rubric_json,full).ok,false);
console.log("Legal-personality grading pilot: PASS (official sources, five distinct criteria, 75% copied-law cap, cited evidence, no academic mastery)");
