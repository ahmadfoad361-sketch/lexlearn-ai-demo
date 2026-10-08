const assert=require('assert');
const Q=require('../assets/learning-quality');
const answerAr='الولادة حية: تحدد بداية الشخصية القانونية. الموت: يحدد نهاية الشخصية. الحمل المستكن: تثبت له الحقوق التي لا يحتاج سببها إلى قبول بشرط تمام ولادته حيًا.';
const answerEn='Live birth begins legal personality. Death ends personality. An unborn child may acquire rights not requiring acceptance, provided that live birth occurs.';
for(const [lang,answer] of [['ar',answerAr],['en',answerEn]]){
 const g=Q.grade(answer,Q.makeEssay(Q.topic(1),lang,'recall'),lang);
 assert.equal(g.coverageScore,100,'a complete short recall answer meets its own rubric');
 assert.equal(g.overall,null);for(const dim of ['understanding','application','legal_precision','exam'])assert.equal(g.axes[dim],null,'untested skill remains unscored');
 assert.ok(!g.note.includes('decisive facts'));
 assert.ok(g.checks.every(c=>c.matched&&c.evidence));
 const unknown=Q.grade(answer,{},lang);assert.equal(unknown.overall,null);assert.ok(unknown.needsHumanReview);
}
const incomplete=Q.grade('الولادة حية تبدأ الشخصية القانونية.',Q.makeEssay(Q.topic(1),'ar','recall'),'ar');
assert.ok(incomplete.coverageScore<100);assert.ok(incomplete.checks.filter(c=>!c.matched).length===2);
const contradictory=Q.grade('الشخصية تبدأ بالموت. الحمل كامل أهلية الأداء.',Q.makeEssay(Q.topic(1),'ar','recall'),'ar');assert.equal(contradictory.coverageScore,0);
assert.equal(Q.grade('ولادة حية. موت. حمل قبول شرط',Q.makeEssay(Q.topic(1),'ar','recall'),'ar').coverageScore,0,'keyword fragments alone are insufficient');
for(let n=1;n<=30;n++){
 const ar=Q.queue(n,'ar','recall'),en=Q.queue(n,'en','recall');
 assert.equal(ar.length,en.length);
 assert.deepEqual(ar.map(t=>t.topicSession),en.map(t=>t.topicSession));
 assert.deepEqual(ar.map(t=>t.dimension),en.map(t=>t.dimension));
 for(const lang of ['ar','en']){
  const t=Q.topic(n),q=Q.queue(n,lang,'understanding');
  assert.ok(q.every(x=>x.title&&x.q));
  for(const choice of q.filter(x=>x.mode==='mcq')){
   assert.equal(new Set(choice.opts).size,3);
   assert.ok(choice.opts.every(x=>x.length>8));
   assert.equal(Q.shuffleOptions(choice).find(x=>x.orig===choice.a).text,choice.opts[choice.a]);
  }
  const essay=q.find(x=>x.dimension==='recall');assert.ok(!essay.q.includes('الموطن')||n!==1);
  assert.ok(essay.qualityRubric.criteria.length===3);
 }
}
assert.ok(Q.queue(1,'ar','recall')[0].dimension!==Q.queue(1,'ar','understanding')[0].dimension,'training order changes with weakness');
for(let w=1;w<=6;w++){
 const a=Q.assessment(w,'ar'),e=Q.assessment(w,'en');assert.equal(a.length,9);assert.equal(e.length,9);
 assert.deepEqual(a.map(x=>x.dimension),e.map(x=>x.dimension));
}
// A student must never lose marks for reproducing the very reference we teach.
for(const t of Object.values(Q.topics))for(const lang of ['ar','en']){
 const task=Q.makeEssay(t,lang,'recall'),reference=t['rule_'+lang];
 const g=Q.grade(reference,task,lang);
 assert.equal(g.coverageScore,100,`reference consistency: session ${t.session}, ${lang}`);
 assert.equal(g.referenceRule,reference);
 assert.ok(g.needsHumanReview,'lexical coverage never certifies substantive correctness');
 assert.ok(g.checks.every(c=>reference.includes(c.evidence)),'evidence preserves the student\'s original words');
}
for(const [lang,headings,answer] of [
 ['ar','المسألة القاعدة التطبيق النتيجة','المسألة: ثبوت الحق للحمل المستكن.\nالقاعدة: حق دون قبول بشرط الولادة حيا.\nالتطبيق: ولد الحمل حيا في الواقعة.\nالنتيجة: تحقق شرط ثبوت الحق.'],
 ['en','Issue Rule Application Conclusion','Issue: whether the prenatal right vests.\nRule: rights without acceptance depend on live birth.\nApplication: the child was born alive on these facts.\nConclusion: the vesting condition is met.']
]){
 const task=Q.examTask(1,lang);
 assert.equal(Q.grade(headings,task,lang).coverageScore,0,'a list of headings is not an exam answer');
 assert.equal(Q.grade(answer,task,lang).coverageScore,100,'separate populated sections meet the structural rubric');
 const empty=lang==='ar'?'المسألة: لا أعرف الإجابة.\nالقاعدة: لا أعرف الإجابة.\nالتطبيق: لا أعرف الإجابة.\nالنتيجة: لا أعرف الإجابة.':'Issue: I do not know.\nRule: I do not know.\nApplication: I do not know.\nConclusion: I do not know.';
 assert.equal(Q.grade(empty,task,lang).coverageScore,0,'repeating refusals does not populate a section');
 assert.ok(Q.grade(answer+'\n'+(lang==='ar'?'القاعدة: نص آخر عن الحقوق.':'Rule: another provision about rights.'),task,lang).coverageScore<100,'ambiguous duplicate headings need review');
}
for(const [lang,claim] of [['ar','من الخطأ أن الشخصية تبدأ بالموت.'],['en','It is incorrect that personality begins at death.']]){
 assert.equal(Q.grade(claim,Q.makeEssay(Q.topic(1),lang,'recall'),lang).conflicts.length,0,'a rejected false proposition is not a student contradiction');
}
assert.ok(Q.grade('الولادة حية لا تبدأ الشخصية القانونية. الموت لا ينهي الشخصية.',Q.makeEssay(Q.topic(1),'ar','recall'),'ar').coverageScore<100,'negating required legal relations cannot receive full credit');
assert.ok(Q.grade('Live birth does not begin legal personality. Death does not end personality.',Q.makeEssay(Q.topic(1),'en','recall'),'en').coverageScore<100);
console.log('learning-quality tests: PASS (30 bilingual session boundaries, fair rubric, missing evidence, contradiction, adaptive order)');

(async()=>{
 for(const lang of ['ar','en']){
  const task=Q.examTask(1,lang),wrong=lang==='ar'?'المسألة: بداية الشخصية القانونية.\nالقاعدة: الشخصية تبدأ بالموت.\nالتطبيق: الموت يثبت بداية الشخصية.\nالنتيجة: كل طفل كامل أهلية الأداء.':'Issue: beginning of legal personality.\nRule: personality starts at death.\nApplication: death establishes legal personality.\nConclusion: every child has full capacity.';
  const pending=Q.grade(wrong,task,lang);assert.equal(pending.overall,null);assert.ok(pending.pending);assert.ok(Object.values(pending.axes).every(x=>x===null));
  for(const response of [null,{score:.95,model_confidence:.9,needs_human_review:true},{score:.95,model_confidence:.5,needs_human_review:false},{score:'1',model_confidence:.9,needs_human_review:false},{score:.95,model_confidence:.9,grading_method:'local'}]){
   const p=await Q.gradeAsync(wrong,task,lang,{gradeAnswer:async()=>response},'course');assert.equal(p.overall,null);assert.ok(p.pending);
  }
  const confirmed={score:.95,model_confidence:.9,needs_human_review:false,grading_method:'grounded_semantic',achieved_criteria:[],contradictions:[]};
  const right=await Q.gradeAsync('valid paraphrase',task,lang,{gradeAnswer:async payload=>{assert.equal(payload.task_key,'rights-v1-s1-exam');assert.equal(payload.language,lang);return confirmed;}},'course');assert.equal(right.overall,95);assert.equal(right.pending,false);
  const rejected=await Q.gradeAsync(wrong,task,lang,{gradeAnswer:async()=>({...confirmed,contradictions:['Wrong legal conclusion']})},'course');assert.equal(rejected.overall,0);assert.equal(rejected.pending,false);
  const outage=await Q.gradeAsync(wrong,task,lang,{gradeAnswer:async()=>{throw Error('offline');}},'course');assert.equal(outage.overall,null);
 }
 const low={seed:12,metrics:{application:30},evidence:[],attempt:0},high={seed:13,metrics:{application:95},evidence:[],attempt:0};
 const a=Q.queue(8,'ar','application',null,low),b=Q.queue(8,'ar','application',null,high);assert.equal(a.length,6);assert.ok(a.some(x=>x.difficulty===1));assert.ok(b.every(x=>x.difficulty===4));assert.notDeepEqual(a.map(x=>x.q),b.map(x=>x.q));
 const retry=Q.queue(8,'ar','application',null,{...low,attempt:1});assert.notDeepEqual(a.filter(x=>x.mode==='mcq').map(x=>x.q),retry.filter(x=>x.mode==='mcq').map(x=>x.q));
 const error=Q.queue(18,'ar','application',null,{...low,evidence:[{dimension:'application',score:0,topicSession:2}]});assert.equal(error[2].topicSession,2);
 const bilingual=Q.queue(8,'en','application',null,high);assert.deepEqual(b.map(x=>x.variantId),bilingual.map(x=>x.variantId));
 console.log('semantic boundary and personalization: PASS (provider contract mocked; no claim of live model accuracy)');
})().catch(e=>{console.error(e);process.exit(1);});
