// Pure assessment rubric shared by Deno's authenticated edge grader and Node tests.
// Only an evidence-backed, weighted criterion-coverage estimate; NOT validated memory mastery.
export const CRITERIA=[
 {id:"live_birth",weight:2,label:"الشخصية القانونية تبدأ بالولادة الحية",description:"Recognize legal personality begins on completed live birth, rather than conception or majority."},
 {id:"death_end",weight:1,label:"الشخصية القانونية تنتهي بالوفاة",description:"State that legal personality ends upon death, not live birth."},
 {id:"prenatal_conditional",weight:2,label:"حقوق الحمل المستكن مشروطة",description:"State unborn child's rights requiring no acceptance may vest conditional upon subsequent live birth; both conditions required."}
];
export const RUBRIC_VERSION="lexlearn-diagnostic-ai-v3";
const normalize=s=>s.normalize("NFC").replace(/\s+/g," ").trim();
const pct=x=>Math.round(Math.max(0,Math.min(100,x)));
export function interpret(raw,answer){
 if(!raw||!Array.isArray(raw.criteria)||raw.criteria.length!==CRITERIA.length||
    typeof raw.confidence!=="number"||raw.confidence<0||raw.confidence>1||
    typeof raw.review_required!=="boolean"||!Array.isArray(raw.contradictions)||
    !raw.contradictions.every(x=>typeof x==="string"&&x.length<=250)||
    typeof raw.feedback_ar!=="string"||raw.feedback_ar.length>800||
    typeof raw.feedback_en!=="string"||raw.feedback_en.length>800)
    return {ok:false,reason:"invalid_grade_schema"};
 const ids=new Set(CRITERIA.map(c=>c.id)),seen=new Set(),earned=[];
 const normalized=normalize(answer);
 for(const c of raw.criteria){
  if(!c||!ids.has(c.id)||seen.has(c.id)||typeof c.met!=="boolean"||
     typeof c.evidence!=="string"||c.evidence.length>350)
   return {ok:false,reason:"invalid_grade_criteria"};
  seen.add(c.id);
  const evidence=normalize(c.evidence);
  if(c.met){
   // Reject made-up citations. The evidence must be quoted from the student's answer.
   if(!evidence||!normalized.includes(evidence))
    return {ok:false,reason:"unverifiable_evidence"};
   earned.push(c.id);
  }else if(evidence)return {ok:false,reason:"unearned_evidence"};
 }
 // A legal contradiction or refusal is fundamentally different from an incomplete answer.
 // Wrong propositions receive no credit; only unverified evidence or unresolved uncertainty blocks a score.
 if(raw.contradictions.some(q=>!normalized.includes(normalize(q))))return {ok:false,reason:"unverifiable_contradiction"};
 if(raw.review_required||raw.confidence<.8)return {ok:false,reason:"automatic_verification_unconfirmed"};
 const score=pct(100*CRITERIA.filter(c=>earned.includes(c.id)).reduce((n,c)=>n+c.weight,0)/
  CRITERIA.reduce((n,c)=>n+c.weight,0));
 const reasons=[...(raw.review_required?["model_flagged"]:[]),
  ...(raw.confidence<0.80?["low_confidence"]:[])];
 return {ok:true,grade:{
  status:"preliminary_ai",provisional_percent:score,
  grading_method:"openai_criterion_weighted_preliminary_v2",
  criteria_met:earned,criteria_missing:CRITERIA.map(c=>c.id).filter(id=>!earned.includes(id)),
  confidence:raw.confidence,needs_human_review:false,oversight_only:true,verification:{status:"completed",source_basis:"full_statutory_text"},
  review_reasons:reasons,
  feedback_ar:raw.feedback_ar,feedback_en:raw.feedback_en,
  rubric_version:RUBRIC_VERSION,
  source_ids:["qa-civil-2004-art39","qa-civil-2004-art40"],
  mastery_confirmed:false,score_type:"provisional_legal_criterion_coverage_not_memory_mastery"
 }};
}

