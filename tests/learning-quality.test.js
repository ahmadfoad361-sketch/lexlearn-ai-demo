const assert=require('assert');
const Q=require('../assets/learning-quality');
const answerAr='الولادة حية: تحدد بداية الشخصية القانونية. الموت: يحدد نهاية الشخصية. الحمل المستكن: تثبت له الحقوق التي لا يحتاج سببها إلى قبول بشرط تمام ولادته حيًا.';
const answerEn='Live birth begins legal personality. Death ends personality. An unborn child may acquire rights not requiring acceptance, provided that live birth occurs.';
for(const [lang,answer] of [['ar',answerAr],['en',answerEn]]){
 const g=Q.grade(answer,Q.makeEssay(Q.topic(1),lang,'recall'),lang);
 assert.equal(g.overall,100,'a complete short recall answer meets its own rubric');
 for(const dim of ['understanding','application','legal_precision','exam'])assert.equal(g.axes[dim],null,'untested skill remains unscored');
 assert.ok(!g.note.includes('decisive facts'));
 assert.ok(g.checks.every(c=>c.matched&&c.evidence));
 const unknown=Q.grade(answer,{},lang);assert.equal(unknown.overall,null);assert.ok(unknown.needsHumanReview);
}
const incomplete=Q.grade('الولادة حية تبدأ الشخصية القانونية.',Q.makeEssay(Q.topic(1),'ar','recall'),'ar');
assert.ok(incomplete.overall<100);assert.ok(incomplete.checks.filter(c=>!c.matched).length===2);
const contradictory=Q.grade('الشخصية تبدأ بالموت. الحمل كامل أهلية الأداء.',Q.makeEssay(Q.topic(1),'ar','recall'),'ar');assert.equal(contradictory.overall,0);
assert.equal(Q.grade('ولادة حية. موت. حمل قبول شرط',Q.makeEssay(Q.topic(1),'ar','recall'),'ar').overall,0,'keyword fragments alone are insufficient');
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
console.log('learning-quality tests: PASS (30 bilingual session boundaries, fair rubric, missing evidence, contradiction, adaptive order)');
