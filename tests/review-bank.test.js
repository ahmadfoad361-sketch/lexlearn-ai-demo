const assert=require('assert'),fs=require('fs');
const bank=JSON.parse(fs.readFileSync('validation/content-review-bank.json','utf8'));
const benchmark=JSON.parse(fs.readFileSync('validation/semantic-benchmark.json','utf8'));
const ids=new Set(bank.items.map(i=>i.id));
assert.equal(bank.items.length,72);assert.equal(ids.size,72);
for(const item of bank.items){
  assert.equal(item.status,'legal_review');
  assert.equal(item.metadata.legal_approval,false);assert.equal(item.metadata.learning_approval,false);
  assert(item.prompt_ar&&item.rubric_json.prompt_en);
  assert.equal(item.rubric_json.lex_task_key,item.id);
  assert(/^rights-v1-s(?:[1-9]|[12][0-9])-(recall|understanding|exam)$/.test(item.id));
  assert(item.source_ids.length>0);
  assert(item.source_ids.every(id=>/^qa-civil-2004-art(?:39|4[0-9]|5[0-9]|6[0-3])$/.test(id)));
  const criteria=item.rubric_json.criteria;
  assert.equal(new Set(criteria.map(c=>c.id)).size,criteria.length);
  assert(criteria.every(c=>c.id&&c.label&&Number.isFinite(c.weight)&&c.weight>0));
  assert.equal(item.rubric_json.course_scope.country,'qa');
  if(item.dimension==='recall'){
    assert.equal(criteria.length,5);
    assert.equal(criteria.filter(c=>c.evaluation_scope==='memory_cues').length,2);
    assert(item.prompt_ar.includes('ثلاثة مفاتيح'));
  }
  if(item.dimension==='understanding'){
    assert.equal(criteria.length,4);
    assert.equal(item.rubric_json.comparison_ar.length,2);
    assert.equal(item.rubric_json.comparison_en.length,2);
  }
}
for(const dim of ['recall','understanding','exam']){
 assert.deepEqual(bank.items.find(i=>i.id==='rights-v1-s27-'+dim).source_ids,['qa-civil-2004-art57','qa-civil-2004-art58']);
 assert.deepEqual(bank.items.find(i=>i.id==='rights-v1-s28-'+dim).source_ids,['qa-civil-2004-art63']);
}
const Q=require('../assets/learning-quality');
for(const t of Object.values(Q.topics))for(const lang of ['ar','en']){
 const ref=Q.articleRef(t.ref,lang),task=Q.makeEssay(t,lang,'recall');
 assert(task.q.includes(ref));
 if(/^\d+$/.test(t.ref))assert(ref.startsWith(lang==='ar'?'المادة ':'Article '));
 if(lang==='en')assert(!ref.includes('،'));
 assert.equal(Q.grade(t['rule_'+lang],task,lang).studyChecks.length,2);
}
for(const n of [9,11,14,18])assert(!Q.topic(n).applied_ar[0].startsWith('أ'));
assert(Q.topic(18).scenario_ar.includes('يملك أيضًا'));
assert(fs.readFileSync('assets/program.js','utf8').includes('var COUNTRY="qa",SUBJECT="rights"'));
assert.equal(benchmark.live_model_tested,false);
assert.equal(benchmark.cases.length,36);
for(const c of benchmark.cases){
  assert(ids.has(c.task_key));assert.equal(c.review_status,'pending_human_review');
  assert(c.proposed_min_score>=0&&c.proposed_max_score<=1&&c.proposed_min_score<=c.proposed_max_score);
}
const child=require('child_process');
const preflight=child.spawnSync(process.execPath,['scripts/validate-live-grading.js'],{encoding:'utf8'});
assert.equal(preflight.status,0);assert(JSON.parse(preflight.stdout).unreviewed_cases===36);
const blocked=child.spawnSync(process.execPath,['scripts/validate-live-grading.js','--live'],{encoding:'utf8',env:{...process.env,LEX_VALIDATION_TOKEN:''}});
assert.equal(blocked.status,1);
console.log('Review bank and live evaluation preflight: PASS (human approval remains pending)');
