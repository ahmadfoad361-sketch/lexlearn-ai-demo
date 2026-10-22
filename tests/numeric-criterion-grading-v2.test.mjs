import assert from "node:assert/strict";
import {compactGradeRequest,criterionGradeResult,inspectCompactGradeResponse} from "../supabase/functions/_shared/semantic-grading.mjs";
const rubric={criteria:[
 {id:"birth",weight:2,label:"الولادة الحية تبدأ الشخصية",evaluation_scope:"rule_content",description:"Live birth begins legal personality"},
 {id:"death",weight:2,label:"الموت ينهي الشخصية",evaluation_scope:"rule_content",description:"Death ends personality"},
 {id:"prenatal",weight:2,label:"حقوق الحمل مشروطة بالولادة الحية",evaluation_scope:"rule_content",description:"Conditional rights not requiring acceptance"},
 {id:"cues",weight:1,label:"ثلاث مفاتيح حفظ مختلفة",evaluation_scope:"memory_cues",description:"Three distinct cues"},
 {id:"links",weight:1,label:"تفسير كل مفتاح",evaluation_scope:"memory_cues",description:"Each cue meaning"}
]};
const answer="تبدأ الشخصية القانونية عند الولادة حيا وتنتهي عند الموت. للحمل المستكن حقوق لا تحتاج إلى قبول بشرط الولادة حيا. مفاتيح: ميلاد = البداية، موت = النهاية، حمل = حقوق بشرط الولادة حيا.";
const evidence={
 birth:"تبدأ الشخصية القانونية عند الولادة حيا",
 death:"تنتهي عند الموت",
 prenatal:"للحمل المستكن حقوق لا تحتاج إلى قبول بشرط الولادة حيا",
 cues:"مفاتيح: ميلاد = البداية، موت = النهاية، حمل = حقوق بشرط الولادة حيا",
 links:"ميلاد = البداية، موت = النهاية، حمل = حقوق بشرط الولادة حيا"
};
const base={criteria:rubric.criteria.map(x=>({id:x.id,met:true,evidence:evidence[x.id]})),
 model_confidence:.9,needs_human_review:false,contradictions:[],
 feedback_ar:"إجابة أولية صحيحة، وليست إثبات إتقان",feedback_en:"Preliminary rubric grading only"};
function grade(value,ans=answer){return criterionGradeResult(value,rubric,ans,"recall")}
const all=grade(base);
assert.equal(all.ok,true);assert.equal(all.score,100);
assert.equal(all.earned_weight,8);assert.equal(all.total_weight,8);
assert.equal(all.breakdown.rule_content.percent,100);
assert.equal(all.breakdown.memory_cues.percent,100);
assert.equal(all.needs_human_review,true);
assert.equal(all.can_advance,false);
assert.equal(all.mastery_confirmed,false);
const lawOnly={...base,criteria:base.criteria.map(x=>["cues","links"].includes(x.id)?{id:x.id,met:false,evidence:""}:x)};
const law=grade(lawOnly);
assert.equal(law.ok,true);assert.equal(law.score,75);
assert.equal(law.breakdown.rule_content.percent,100);
assert.equal(law.breakdown.memory_cues.percent,0);
assert.ok(law.criteria_missing.includes("cues"));
const incorrect={...base,criteria:base.criteria.map(x=>({id:x.id,met:false,evidence:""})),
 contradictions:["Start and end of personality reversed"],needs_human_review:true,model_confidence:.61};
const wrong=grade(incorrect,"تبدأ الشخصية بالموت وتنتهي بالولادة");
assert.equal(wrong.ok,true);
assert.equal(wrong.score,0);
assert.ok(wrong.review_reasons.includes("contradictions"));
assert.ok(wrong.review_reasons.includes("low_model_confidence"));
const oneMet={...base,criteria:base.criteria.map(x=>x.id==="birth"?x:{id:x.id,met:false,evidence:""})};
assert.equal(grade(oneMet).score,25);
for(const invalid of [
 {...base,criteria:base.criteria.slice(1)},
 {...base,criteria:base.criteria.map(x=>({...x,met:"yes"}))},
 {...base,criteria:base.criteria.map((x,i)=>i===0?{...x,evidence:"not present"}:x)},
 {...base,criteria:base.criteria.map((x,i)=>i===0?{...x,met:false,evidence:"fake"}:x)},
 {...base,criteria:base.criteria.map((x,i)=>i===0?{...x,id:"death"}:x)},
 {...base,criteria:base.criteria.map((x,i)=>i===0?{...x,met:true,evidence:""}:x)}
]){
 const g=grade(invalid);assert.equal(g.ok,false);assert.equal(g.score,null);
}
const request=compactGradeRequest({answer,item:{prompt_ar:"اكتب القاعدة",dimension:"recall",rubric_json:rubric},sources:[{id:"qa39",excerpt:"تبدأ شخصية الإنسان بتمام ولادته حيًا وتنتهي بموته."}],language:"ar"});
assert.equal(request.store,false);
assert.equal(request.text.format.strict,true);
assert.equal(request.text.format.name,"lexlearn_criteria_v2");
assert.ok(!("score" in request.text.format.schema.properties));
assert.equal(request.max_output_tokens,1700);
assert.ok(!("user_id" in JSON.parse(request.input[1].content)));
const wrapped={status:"completed",output:[{content:[{type:"output_text",text:JSON.stringify(base)}]}]};
assert.equal(inspectCompactGradeResponse(wrapped).reason,null);
assert.equal(grade(inspectCompactGradeResponse(wrapped).proposal).score,100);
assert.equal(inspectCompactGradeResponse({status:"incomplete"}).reason,"provider_output_incomplete");
assert.equal(inspectCompactGradeResponse({status:"completed",output_text:"oops"}).reason,"provider_output_not_json");
assert.equal(inspectCompactGradeResponse({status:"completed",output_text:JSON.stringify({...base,criteria:"bad"})}).reason,"invalid_grade_schema_criteria");
console.log("Numeric per-criterion grading: PASS (100 / 75 / 25 / 0, independent skill sections, no arbitrary score, provider errors fail closed)");
