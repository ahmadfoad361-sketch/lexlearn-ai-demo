/* LexLearn continuous skill policy v1.
 * Research-informed design hypothesis, NOT validated psychometric scoring.
 * This module NEVER re-labels multiple-choice recognition as free recall.
 * Its suggested practice allocation is NOT academic mastery or a grade.
 */
(function(root,factory){
  var api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.LEX_SKILL_POLICY=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
 function measured(m){
   if(!m||typeof m!=="object"||m.measured===false||typeof m.value!=="number"||!Number.isFinite(m.value)||m.value<0||m.value>100)return null;
   var n=Math.max(0,Number(m.evidence!=null?m.evidence:m.item_count)||0);
   var method=String(m.method||"");
   // Recognition is observable but NOT independent retrieval from memory.
   if(method==="recognition"||method==="objective_mcq_recognition"||method==="rule_recognition")return null;
   if(m.status==="not_measured"||m.status==="pending_human_review"||m.status==="needs_human_review")return null;
   var reliability=Number(m.reliability);
   if(!Number.isFinite(reliability))reliability=Math.min(1,Math.sqrt(n/12));
   return {value:m.value,evidence:n,reliability:clamp(reliability,0,1),method:method,provisional:!!m.provisional||m.status==="preliminary_internal"||method==="lexical_rubric_coverage_v1"};
 }
 function policy(input){
   input=input||{};
   var recall=measured(input.recall),understanding=measured(input.understanding);
   var rec=recall&&recall.value,und=understanding&&understanding.value;
   var displayed={
     recall:rec===null?null:rec,
     understanding:und===null?null:und
   };
   if(!recall||!understanding)return {
     version:"skill-policy-v1",mode:"measurement_needed",target:null,bridgeFrom:null,
     gap:null,confidence:"insufficient",allocation:{recall:50,understanding:50},
     indicators:displayed, provisional:true, mastery:false,
     reason:"Separate reliable recall and understanding evidence is needed; recognition cannot stand in for recall."
   };
   var gap=rec-und,abs=Math.abs(gap);
   var minimumEvidence=Math.min(recall.evidence,understanding.evidence);
   var uncertainty=Math.max(5,Math.round(32/Math.sqrt(Math.max(1,recall.evidence))+32/Math.sqrt(Math.max(1,understanding.evidence))));
   var reliable=Math.min(recall.reliability,understanding.reliability);
   var provisional=recall.provisional||understanding.provisional;
   var confidence=minimumEvidence<3||reliable<0.4?"low":provisional?"provisional":minimumEvidence<8?"moderate":"higher";
   var mode,target=null,bridgeFrom=null;
   if(rec<40&&und<40){mode="foundations";}
   else if(rec>=85&&und>=85){mode="consolidation";}
   else if(abs<=uncertainty||confidence==="low"){mode="balanced";}
   else if(provisional){
     // Large, repeatedly observed *provisional* difference may guide low-stakes practice only.
     // Never present this as verified mastery or an immutable learner classification.
     if(minimumEvidence>=6&&abs>uncertainty+25){
       target=gap>0?"understanding":"recall";bridgeFrom=gap>0?"recall":"understanding";
       mode="provisional_bridge";
     }else mode="balanced";
   }else{
     target=gap>0?"understanding":"recall";
     bridgeFrom=gap>0?"recall":"understanding";
     mode="bridge";
   }
   // Continuous rather than a binary threshold: alloc 50..85%, dampened by uncertainty.
   // The coefficients are provisional product parameters awaiting empirical calibration.
   var signal=Math.max(0,abs-uncertainty)/100;
   var strength=clamp(signal*reliable,0,1);
   var targetShare=Math.round(50+35*(1-Math.exp(-2.5*strength)));
   if(mode==="provisional_bridge")targetShare=Math.min(60,targetShare);
   var recallShare=(mode==="bridge"||mode==="provisional_bridge")?(target==="recall"?targetShare:100-targetShare):50;
   return {
     version:"skill-policy-v1",mode:mode,target:target,bridgeFrom:bridgeFrom,
     gap:Math.round(gap*100)/100, uncertaintyPoints:uncertainty,confidence:confidence,
     allocation:{recall:recallShare,understanding:100-recallShare},
     indicators:displayed,provisional:provisional,mastery:false,
     reason:mode==="foundations"?"Both indicators suggest foundational support."
       :mode==="consolidation"?"Both indicators are strong; extend to application and delayed practice."
       :mode==="balanced"?"Skill gap is small, uncertain or provisional; do not assign a fixed learner type."
       :"Use a relatively stronger observed skill to scaffold the weaker skill; re-evaluate after each check."
   };
 }
 function exercise(plan,dimension,language){
   var en=language==="en",mode=plan&&plan.mode;
   if(mode==="foundations")return en?
     "Start with a worked example. Identify the rule, explain its meaning, and then answer independently.":
     "ابدأ بمثال محلول: حدد القاعدة واشرح معناها، ثم حاول الإجابة بنفسك.";
   if(mode==="measurement_needed")return en?
     "Work on recall and understanding together; a separate unaided-recall assessment is still needed.":
     "تدرّب على الاسترجاع والفهم معًا؛ ما زلنا بحاجة إلى قياس مستقل للاسترجاع من الذاكرة.";
   if(mode==="consolidation")return en?
     "Apply the rule to a new factual variation, then retrieve its conditions after a delay.":
     "طبّق القاعدة على واقعة جديدة، ثم استرجع شروطها بعد فترة دون مساعدة.";
   if((mode==="bridge"||mode==="provisional_bridge")&&plan.bridgeFrom==="recall")return en?
     "Begin with the legal rule you can retrieve, explain WHY each condition matters, then change one fact and reassess the outcome.":
     "ابدأ بالقاعدة التي تتذكرها، واشرح لماذا يؤثر كل شرط، ثم غيّر واقعة واحدة وأعد تحديد النتيجة.";
   if((mode==="bridge"||mode==="provisional_bridge")&&plan.bridgeFrom==="understanding")return en?
     "Begin with the meaning you understand, derive short retrieval cues, hide the rule, and reconstruct it unaided.":
     "ابدأ بالمعنى الذي تفهمه، واستخرج مفاتيح تذكّر قصيرة، ثم أخفِ القاعدة وأعد بناءها من الذاكرة.";
   return en?
     "Explain the rule in your own words and then retrieve its conditions without looking. Compare the two skills again.":
     "اشرح القاعدة بأسلوبك، ثم استرجع شروطها دون النظر إلى النص، وأعد مقارنة المهارتين.";
 }
 function completion(submissions){
   // Finishing tasks is an activity milestone, never proof of academic mastery.
   return {tasksCompleted:!!(submissions&&submissions.allSaved),masteryConfirmed:false,
     status:"practice_completed_not_mastery",independentAssessmentRequired:true};
 }
 return {measured:measured,policy:policy,exercise:exercise,completion:completion};
});
