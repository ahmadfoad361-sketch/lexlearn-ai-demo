const test=require('node:test');
const assert=require('node:assert/strict');
const addon=require('../assets/learner-extensions.js');
const fingerprint=require('../assets/admin-cognitive-fingerprint.js');
const session=(n,dimension='recall')=>({session_number:n,completed_at:'2026-11-09T10:00:00Z',tasks_json:[{id:'item-'+n,dimension,prompt_ar:'تدريب معتمد',sources:['qa-civil-2004-art39']}]});
test('only sessions 2, 4 and 6 open profession challenges',()=>{
  for(let n=1;n<=30;n++)assert.equal(addon.isMilestone(n),[2,4,6].includes(n));
});
test('reviews appear on even completed milestones and never inside active questions',()=>{
  assert.equal(addon.eligibleReview(1),false);
  assert.equal(addon.eligibleReview(2),true);
  assert.equal(addon.eligibleReview(30),true);
  assert.equal(addon.eligibleReview(31),false);
});
test('review reuses previous saved approved tasks, with lag',()=>{
  assert.equal(addon.reviewSource([session(1)],2).session,1);
  assert.equal(addon.reviewSource([session(1),session(2),session(3)],4).session,1);
  assert.equal(addon.reviewSource([session(1),session(2),session(3),session(4),session(5)],6).session,3);
  assert.equal(addon.reviewSource([],4),null);
});
test('role changes the applied task without changing the source session',()=>{
  const tasks=[{id:'understanding',dimension:'understanding',prompt_ar:'سؤال فهم'},{id:'case',dimension:'exam_execution',prompt_ar:'مسألة'}];
  assert.equal(addon.roleTask(tasks,'judge').id,'case');
  assert.equal(addon.roleTask(tasks,'lawyer').id,'case');
  assert.equal(addon.roleTask(tasks,'professor').id,'understanding');
});
test('fingerprint needs verified rubric criterion coverage',()=>{
  const base={label_ar:'شرط قانوني',dimension:'recall',evidence_count:2,rolling_percent:50,measurement:'provisional_criterion_coverage',next_step:'reconstruct_from_memory'};
  assert.equal(fingerprint.model({concepts:[base]}).length,1);
  assert.equal(fingerprint.model({concepts:[{...base,measurement:'unknown'}]}).length,0);
  assert.equal(fingerprint.model({concepts:[{...base,evidence_count:1}]} )[0].confidence,'single_observation');
});
test('fingerprint escapes untrusted labels',()=>{
  const html=fingerprint.render({concepts:[{label_ar:'<img onerror=alert(1)>',dimension:'recall',evidence_count:2,rolling_percent:50,measurement:'provisional_criterion_coverage'}]});
  assert.equal(html.includes('<img'),false);
  assert.ok(html.includes('&lt;img'));
});
