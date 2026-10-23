import assert from "node:assert/strict";
import {CRITERIA,interpret,RUBRIC_VERSION} from "../supabase/functions/lexlearn-diagnostic-ai-grade/assessment.mjs";
const answer="تبدأ الشخصية القانونية للإنسان بتمام ولادته حياً.";
const valid=(overrides={})=>({
 criteria:CRITERIA.map((c,i)=>({id:c.id,met:i===0,evidence:i===0?"تبدأ الشخصية القانونية للإنسان بتمام ولادته حياً":""})),
 confidence:0.93,review_required:false,contradictions:[],feedback_ar:"ذكرت بداية الشخصية فقط",feedback_en:"Only live birth stated",...overrides
});
const partial=interpret(valid(),answer);
assert.equal(partial.ok,true);
assert.equal(partial.grade.provisional_percent,40,"one out of three weighted legal rules must be 40%, never 100%");
assert.equal(partial.grade.status,"preliminary_ai");
assert.equal(partial.grade.needs_human_review,false);
assert.equal(partial.grade.mastery_confirmed,false);
assert.equal(partial.grade.rubric_version,RUBRIC_VERSION);
assert.deepEqual(partial.grade.criteria_met,["live_birth"]);
const fullAnswer="تبدأ شخصية الإنسان بتمام ولادته حياً وتنتهي بوفاته. الحمل المستكن له حقوق مشروطة بتمام ولادته حياً ولا تحتاج إلى قبول.";
const full=interpret(valid({criteria:[
 {id:"live_birth",met:true,evidence:"تبدأ شخصية الإنسان بتمام ولادته حياً"},
 {id:"death_end",met:true,evidence:"تنتهي بوفاته"},
 {id:"prenatal_conditional",met:true,evidence:"الحمل المستكن له حقوق مشروطة بتمام ولادته حياً ولا تحتاج إلى قبول"}
],confidence:0.95,review_required:false}),fullAnswer);
assert.equal(full.ok,true);
assert.equal(full.grade.provisional_percent,100);
assert.equal(full.grade.needs_human_review,false);
const contradiction=interpret(valid({contradictions:["يقرر أن الولادة تنهي الشخصية"]}),answer);
assert.equal(contradiction.ok,false);
assert.equal(contradiction.reason,"unverifiable_contradiction");
const invented=interpret(valid({criteria:[
 {id:"live_birth",met:true,evidence:"شخصية الإنسان تبدأ عند بلوغه 18 سنة"},
 {id:"death_end",met:false,evidence:""},
 {id:"prenatal_conditional",met:false,evidence:""}
]}),answer);
assert.equal(invented.ok,false);
assert.equal(invented.reason,"unverifiable_evidence");
assert.equal(interpret(valid({criteria:CRITERIA.map(c=>({id:c.id,met:false,evidence:""}))}),answer).grade.provisional_percent,0);
console.log("PASS: partial 40, complete 100, conflicts withheld, evidence verified, missing 0, uncertainty withheld, instructor oversight only");

assert.equal(interpret(valid({confidence:.6}),answer).ok,false,"uncertain automated verification must not produce a percentage");

