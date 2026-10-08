const assert=require('assert');
const Q=require('../assets/learning-quality.js');
const answers=['recall','recall','understanding','application','application','legal_precision'].map(type=>({type,correct:true}));
for(const lang of ['ar','en']){
 const wrong=lang==='ar'?'الشخصية القانونية تبدأ بالموت، وحقوق الحمل ثابتة بلا شرط.':'Legal personality begins at death. Prenatal rights vest unconditionally.';
 const grade=Q.grade(wrong,Q.makeEssay(Q.topic(1),lang,'recall'),lang);
 const result=Q.diagnosticSummary(answers,grade);
 assert.equal(result.metrics.recall,null,'Correct choices must not certify wrong or unreviewed free recall');
 assert.equal(result.metrics.legal_precision,null,'One choice must not certify legal writing precision');
 assert.equal(result.choiceIndicators.recall,100);
 assert.equal(result.weak,null,'Equal scores must not create an arbitrary weakness');
 assert.equal(result.profileType,'insufficient_evidence');
 assert.equal(result.pendingRecall,true);
}
const confirmed={pending:false,gradingMethod:'grounded_semantic',axes:{recall:40}};
assert.equal(Q.diagnosticSummary(answers,confirmed).metrics.recall,40);
assert.equal(Q.diagnosticSummary(answers,{...confirmed,pending:true}).metrics.recall,null);
assert.equal(Q.diagnosticSummary(answers,{...confirmed,gradingMethod:'keyword_fallback'}).metrics.recall,null);
console.log('diagnostic evidence: PASS (no false recall mastery, no arbitrary tie weakness)');
