// Scores are calculated from the approved rubric, never from a model-supplied total.
export const VERSION = "lexlearn-training-ai-v2";
export const SCHEMA = {type:"object",additionalProperties:false,properties:{
 criteria:{type:"array",items:{type:"object",additionalProperties:false,properties:{id:{type:"string"},met:{type:"boolean"},evidence:{type:"string"}},required:["id","met","evidence"]}},
 confidence:{type:"number"},review_required:{type:"boolean"},
 feedback_ar:{type:"string"},feedback_en:{type:"string"}
},required:["criteria","confidence","review_required","feedback_ar","feedback_en"]};
export function interpret(result, rubric, answer) {
 const criteria=rubric?.criteria;
 if(!Array.isArray(criteria)||!criteria.length)throw Error("invalid_rubric");
 const ids=criteria.map(c=>c.id);
 if(new Set(ids).size!==ids.length||ids.some(id=>typeof id!=="string"||!id))throw Error("invalid_rubric");
 if(!result||result.review_required!==false||!Number.isFinite(result.confidence)||result.confidence<.8||result.confidence>1)throw Error("human_review_required");
 if(!Array.isArray(result.criteria)||result.criteria.length!==ids.length||new Set(result.criteria.map(c=>c.id)).size!==ids.length)throw Error("invalid_criteria");
 if(result.criteria.some(c=>!ids.includes(c.id)||typeof c.met!=="boolean"||typeof c.evidence!=="string"||(c.met&&(!c.evidence.trim()||!answer.includes(c.evidence)))))throw Error("invalid_evidence");
 if([result.feedback_ar,result.feedback_en].some(s=>typeof s!=="string"||!s.trim()||s.length>2400))throw Error("invalid_feedback");
 const weights=criteria.map(c=>c.weight??1);
 if(weights.some(w=>typeof w!=="number"||!Number.isFinite(w)||w<=0))throw Error("invalid_weights");
 const met=result.criteria.filter(c=>c.met).map(c=>c.id);
 const total=weights.reduce((a,b)=>a+b,0),earned=criteria.reduce((sum,c,i)=>sum+(met.includes(c.id)?weights[i]:0),0);
 return {status:"preliminary_ai",grading_method:"openai_rubric",provisional_percent:Math.round(100*earned/total),
  confidence:result.confidence,criteria_met:met,criteria_missing:ids.filter(id=>!met.includes(id)),
  criteria:result.criteria,feedback_ar:result.feedback_ar,feedback_en:result.feedback_en,
  rubric_version:VERSION,academic_certified:false};
}
export function summarize(rows, diagnostic) {
 const skills={recall:null,understanding:null};
 for(const dimension of Object.keys(skills)){
  const values=rows.filter(r=>r.dimension===dimension&&r.evaluation?.status==="preliminary_ai")
   .slice(0,3).map(r=>r.evaluation.provisional_percent).filter(v=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100);
  if(values.length)skills[dimension]=Math.round(values.reduce((a,b)=>a+b,0)/values.length);
 }
 const recall=diagnostic?.measurements?.recall?.ai_grade;
 if(skills.recall===null&&recall?.status==="preliminary_ai"&&typeof recall.provisional_percent==="number"&&recall.provisional_percent>=0&&recall.provisional_percent<=100)skills.recall=recall.provisional_percent;
 const understanding=diagnostic?.metrics?.understanding;
 if(skills.understanding===null&&typeof understanding==="number"&&Number.isFinite(understanding)&&understanding>=0&&understanding<=100)skills.understanding=understanding;
 const measured=Object.keys(skills).filter(d=>skills[d]!==null);
 const priority=measured.length===2?(skills.recall<=skills.understanding?"recall":"understanding"):
  measured.length===1?(measured[0]==="recall"?"understanding":"recall"):"foundation";
 return {skills,priority,status:measured.length?"preliminary_evidence":"insufficient_evidence"};
}


