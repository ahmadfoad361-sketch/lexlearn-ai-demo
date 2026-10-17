import assert from "node:assert/strict";
import {gradeWithAI,validateSemantic,RUBRIC} from "../supabase/functions/showcase-grade/semantic.mjs";

const answer="تولد الشخصية عندما يرى الطفل النور حيًا، وتنقضي إذا مات. الحقوق التي تثبت للجنين بدون موافقة مشروطة بخروجه حيًا.";
const sources=[{id:"qa-civil-2004-art39",status:"approved",excerpt:"تبدأ شخصية الإنسان بتمام ولادته حيا وتنتهي بموته."},{id:"qa-civil-2004-art40",status:"approved",excerpt:"حقوق الحمل التي لا يحتاج سببها إلى قبول تثبت بشرط الولادة حية."}];
const criteria=[
 {id:"birth_alive",status:"supported",evidence:"تولد الشخصية عندما يرى الطفل النور حيًا",contrary:""},
 {id:"death",status:"supported",evidence:"تنقضي إذا مات",contrary:""},
 {id:"prenatal_rights",status:"supported",evidence:"الحقوق التي تثبت للجنين بدون موافقة",contrary:""},
 {id:"live_birth_condition",status:"supported",evidence:"مشروطة بخروجه حيًا",contrary:""}
];
const result={criteria,confidence:.94,needs_review:false,feedback:"الإجابة تثبت عناصر القاعدة القانونية الأربعة بالمعنى، مع مراعاة شرط الولادة حية."};
assert.equal(RUBRIC.length,4);
const graded=validateSemantic(result,answer,"ar",sources);
assert.equal(graded.recall_score,100,"Correct colloquial paraphrases should be eligible for full credit after semantic evaluation");
assert.equal(graded.details.points,7);
assert.equal(graded.grade_status,"ai_assessed");
assert.equal(graded.details.provider,"openai");
assert.equal(validateSemantic({...result,criteria:criteria.map((c,i)=>i===0?{...c,evidence:"نص مختلق لا يظهر في إجابة الطالب"}:c)},answer,"ar",sources),null,
 "Invented model evidence must be rejected");
assert.equal(validateSemantic({...result,criteria:criteria.slice(0,3)},answer,"ar",sources),null,"All rubric criteria required");
assert.equal(validateSemantic({...result,criteria:[...criteria.slice(0,3),criteria[2]]},answer,"ar",sources),null,"Duplicate criteria rejected");
let uncertain=validateSemantic({...result,confidence:.52,needs_review:true},answer,"ar",sources);
assert.equal(uncertain.recall_score,null,"Low confidence must NOT assign zero");
assert.equal(uncertain.details.points,null,"Null score must NOT display a false 0/7");
const incomplete=validateSemantic({
 ...result,criteria:criteria.map((x,i)=>i<2?x:{id:x.id,status:"unrecognized",evidence:"",contrary:""})
},answer,"ar",sources);
assert.equal(incomplete.recall_score,43,"Partial meaning should preserve evidenced-weight scoring");
let requests=0;
const mock=async (url,options)=>{
 requests++;assert.equal(url,"https://api.openai.com/v1/responses");
 const body=JSON.parse(options.body);
 assert.equal(body.store,false,"Do not use provider response storage for visitor answers");
 assert(body.input.includes("qa-civil-2004-art39"));
 assert(!body.input.includes("student_name"));
 return {ok:true,json:async()=>({output:[{content:[{type:"output_text",text:JSON.stringify(result)}]}]})};
};
const response=await gradeWithAI({answer,lang:"ar",sources,key:"server-only-test-key",model:"test-model",fetchImpl:mock});
assert.equal(response.status,"scored");
assert.equal(response.grade.recall_score,100);
assert.equal(requests,1);
const noKey=await gradeWithAI({answer,lang:"ar",sources,key:"",model:"",fetchImpl:mock});
assert.equal(noKey.status,"unavailable");assert.equal(requests,1,"Absent keys must not call provider");
const deniedSources=await gradeWithAI({answer,lang:"ar",sources:[{...sources[0],status:"draft"},sources[1]],key:"k",model:"m",fetchImpl:mock});
assert.equal(deniedSources.status,"unavailable");assert.equal(requests,1,"Unapproved legal sources must not be sent");
const invalidProvider=await gradeWithAI({answer,lang:"ar",sources,key:"k",model:"m",fetchImpl:async()=>({ok:true,json:async()=>({output_text:JSON.stringify({...result,criteria:criteria.map((c,i)=>i===0?{...c,evidence:"made up evidence"}:c)})})})});
assert.equal(invalidProvider.status,"unavailable","Invalid provider output must not become a score");
console.log("Grounded semantic showcase grading tests: PASS");
