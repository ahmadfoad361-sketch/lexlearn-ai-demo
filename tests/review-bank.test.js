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
}
assert.equal(benchmark.live_model_tested,false);
assert.equal(benchmark.cases.length,32);
for(const c of benchmark.cases){
  assert(ids.has(c.task_key));assert.equal(c.review_status,'pending_human_review');
  assert(c.proposed_min_score>=0&&c.proposed_max_score<=1&&c.proposed_min_score<=c.proposed_max_score);
}
const child=require('child_process');
const preflight=child.spawnSync(process.execPath,['scripts/validate-live-grading.js'],{encoding:'utf8'});
assert.equal(preflight.status,0);assert(JSON.parse(preflight.stdout).unreviewed_cases===32);
const blocked=child.spawnSync(process.execPath,['scripts/validate-live-grading.js','--live'],{encoding:'utf8',env:{...process.env,LEX_VALIDATION_TOKEN:''}});
assert.equal(blocked.status,1);
console.log('Review bank and live evaluation preflight: PASS (human approval remains pending)');
