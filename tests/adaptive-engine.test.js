const assert = require("assert");
const E = require("../assets/adaptive-engine.js");

function near(a,b,eps=1e-9){ assert.ok(Math.abs(a-b)<=eps, `${a} != ${b}`); }

(function retentionFlow(){
  const t0 = Date.UTC(2026,8,19,12,0,0);
  let p = E.ensurePath({stage:"assessment"});
  let r = E.applyRetentionResult(p,0.9,t0);
  assert.equal(r.status,"first_pass");
  assert.equal(p.stage,"retention_check_pending");
  assert.equal(p.retentionStatus,"pending");
  assert.ok(p.firstPassAt);
  assert.ok(p.retentionDueAt);

  r = E.applyRetentionResult(p,0.95,t0 + 2*60*60*1000);
  assert.equal(r.status,"too_early");
  assert.equal(p.stage,"retention_check_pending");

  r = E.applyRetentionResult(p,0.95,t0 + 24*60*60*1000);
  assert.equal(r.status,"confirmed");
  assert.equal(p.stage,"completed");
  assert.equal(p.retentionStatus,"confirmed");
  assert.ok(p.confirmedAt);
})();

(function retentionFailure(){
  const t0 = Date.UTC(2026,8,19,12,0,0);
  let p = E.ensurePath({stage:"assessment"});
  E.applyRetentionResult(p,0.9,t0);
  const r = E.applyRetentionResult(p,0.4,t0 + 25*60*60*1000);
  assert.equal(r.status,"retention_failed");
  assert.equal(p.stage,"practice");
  assert.equal(p.retentionStatus,"failed");
  assert.equal(p.firstPassAt,null);
  assert.equal(p.retentionFailures,1);
})();

(function reviewScheduling(){
  const item={id:"x",prompt:"p",dimension:"recall"};
  const base=Date.UTC(2026,8,19,12,0,0);
  const high=E.buildReview(item,0.2,"high_confidence_misconception",3,base,1);
  const gap=E.buildReview(item,0.2,"knowledge_gap",1,base,1);
  assert.equal((new Date(high.due)-base)/(60*60*1000),6);
  assert.equal((new Date(gap.due)-base)/(60*60*1000),24);
})();

(function errorClassification(){
  assert.equal(E.classifyError({dimension:"recall"},0.2,3),"high_confidence_misconception");
  assert.equal(E.classifyError({dimension:"legal_precision"},0.6,2),"concept_confusion");
  assert.equal(E.classifyError({dimension:"transfer"},0.6,2),"application_difficulty");
})();

(function calibration(){
  const over=E.calibration([{confidence:3,avg:.2},{confidence:3,avg:.3},{confidence:3,avg:.4}],8);
  assert.equal(over.status,"overconfidence");
  const under=E.calibration([{confidence:1,avg:.9},{confidence:1,avg:.8}],8);
  assert.equal(under.status,"underconfidence");
  const ok=E.calibration([{confidence:2,avg:.65},{confidence:2,avg:.6}],8);
  assert.equal(ok.status,"accurate");
})();

(function mastery(){
  const items={
    a:{id:"a",dimension:"recall",difficulty:1,unitId:"u1",conceptId:"c1"},
    b:{id:"b",dimension:"transfer",difficulty:2,unitId:"u2",conceptId:"c2"}
  };
  const groups=[{items:[{itemId:"a",score:1},{itemId:"b",score:.5}]}];
  const obs=[{score:.75,unitId:"u1",conceptId:"obs1"}];
  const m=E.computeMastery(groups,id=>items[id],obs);
  near(m.mastery.recall.value,100);
  near(m.mastery.observation.value,75);
  assert.ok(m.unitMastery.u1);
  assert.ok(m.unitMastery.u2);
  assert.ok(m.conceptMastery.c1);
})();

(function priority(){
  const dangerous=E.priorityScore({mastery:55,examImportanceWeight:1,errorType:"high_confidence_misconception",repeatErrors:3,retentionStatus:"failed"});
  const simple=E.priorityScore({mastery:45,examImportanceWeight:0,errorType:"knowledge_gap",repeatErrors:0,retentionStatus:"not_started"});
  assert.ok(dangerous.score>simple.score);
  assert.ok(dangerous.reasons.includes("high_confidence_misconception"));
  assert.ok(dangerous.reasons.includes("retention_failure"));
})();

(function variants(){
  const original={id:"a",type:"mcq",dimension:"transfer",unitId:"u1",conceptId:"c1",variantGroupId:"v1"};
  const exact={id:"b",type:"mcq",dimension:"transfer",unitId:"u1",conceptId:"c1",variantGroupId:"v1"};
  const looser={id:"c",type:"mcq",dimension:"transfer",unitId:"u1",conceptId:"c2",variantGroupId:"v2"};
  assert.equal(E.selectVariant(original,[original,looser,exact]).id,"b");
  assert.equal(E.selectVariant(original,[original,looser]).id,"c");
})();

(function grading(){
  const rubric=[
    {label:"العقد",concepts:[["العقد","عقد"]],min:1},
    {label:"الضرر",concepts:[["الضرر","ضرر"]],min:1}
  ];
  const g=E.gradeAnswer("يوجد عقد وضرر",rubric,{});
  assert.equal(g.gradingMethod,"keyword_fallback");
  assert.equal(g.score,1);
  assert.deepEqual(g.missingConcepts,[]);
})();

(function migration(){
  const s=E.migrateCourseState({groupResults:[]});
  assert.ok(Array.isArray(s.reviews));
  assert.ok(Array.isArray(s.observationResults));
  assert.deepEqual(s.unitMastery,{});
  assert.deepEqual(s.conceptMastery,{});
})();

(function advancedEvidenceModel(){
  const now=Date.UTC(2026,9,6,8,0,0);
  const events=[
    {dimension:"recall",score:.95,difficulty:2,ts:now-2*86400000},
    {dimension:"recall",score:.90,difficulty:2,ts:now-1*86400000},
    {dimension:"application",score:.45,difficulty:2,ts:now-2*86400000},
    {dimension:"application",score:.55,difficulty:3,ts:now-1*86400000},
    {dimension:"legal_precision",score:.60,difficulty:2,ts:now-1*86400000}
  ];
  const m=E.learnerModel({events},now);
  assert.equal(m.strongest,"recall");
  assert.equal(m.weakest,"application");
  assert.equal(m.bridge.mode,"change_one_fact");
  assert.ok(m.axes.application.uncertainty>0);
})();

(function reviewIntervalAndTaskChoice(){
  assert.ok(E.adaptiveReviewInterval({score:.3,confidence:3,repeatErrors:2})<=6);
  const model={weakest:"application",axes:{application:{value:52,uncertainty:15,trend:0}}};
  const pick=E.recommendNextTask(model,[
    {id:"a",dimension:"recall",difficulty:2,status:"approved",sourceIds:["s"]},
    {id:"b",dimension:"transfer",difficulty:1,status:"approved",sourceIds:["s"],variantGroupId:"v"}
  ],[]);
  assert.equal(pick.item.id,"b");
})();

(function semanticMergeSafety(){
  const g=E.mergeSemanticGrade({score:.9,matchedConcepts:["a"]},{score:.2,model_confidence:.9,feedback_ar:"x"});
  assert.equal(g.needsHumanReview,true);
  assert.equal(g.score,null);
  const ok=E.mergeSemanticGrade({score:.8},{score:.82,model_confidence:.91,feedback_ar:"ok"});
  assert.equal(ok.needsHumanReview,false);
  assert.equal(ok.gradingMethod,"grounded_semantic");
})();

console.log("adaptive-engine tests: PASS");
