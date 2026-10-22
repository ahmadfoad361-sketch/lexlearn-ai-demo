const assert=require("node:assert/strict");
const P=require("../assets/skill-policy.js");
const sample=(value,evidence=20,extra={})=>({value,evidence,method:"independent_recall_or_explanation",measured:true,status:"reviewed",...extra});
const adapt=(r,u,extra={})=>P.policy({recall:r,understanding:u,...extra});
{
 const x=adapt(null,sample(75));
 assert.equal(x.mode,"measurement_needed");
 assert.equal(x.indicators.recall,null);
 assert.equal(x.mastery,false);
 assert.equal(P.policy({recall:{value:99,evidence:20,measured:true,method:"objective_mcq_recognition"},understanding:sample(40)}).mode,"measurement_needed");
}
{
 const x=adapt(sample(92),sample(32));
 assert.equal(x.mode,"bridge");assert.equal(x.bridgeFrom,"recall");assert.equal(x.target,"understanding");
 assert.ok(x.allocation.understanding>50&&x.allocation.understanding<=85);
 assert.match(P.exercise(x,"understanding","ar"),/تتذكرها/);
 const y=adapt(sample(30),sample(92));
 assert.equal(y.mode,"bridge");assert.equal(y.bridgeFrom,"understanding");assert.equal(y.target,"recall");
 assert.ok(y.allocation.recall>50&&y.allocation.recall<=85);
 assert.match(P.exercise(y,"recall","en"),/retrieval cues/);
}
{
 const a=adapt(sample(61),sample(59)),b=adapt(sample(61),sample(58)),c=adapt(sample(91),sample(15));
 assert.equal(a.mode,"balanced");assert.equal(b.mode,"balanced");
 assert.equal(a.allocation.recall,50);
 assert.ok(c.allocation.understanding>a.allocation.understanding);
}
{
 const low=adapt(sample(25),sample(28)),high=adapt(sample(90),sample(96));
 assert.equal(low.mode,"foundations");assert.equal(high.mode,"consolidation");
 assert.match(P.exercise(low,"recall","ar"),/مثال محلول/);
 assert.match(P.exercise(high,"understanding","en"),/new factual variation/);
}
{
 const provisional=adapt(sample(89,15,{method:"lexical_rubric_coverage_v1",status:"preliminary_internal"}),sample(30));
 assert.equal(provisional.mode,"provisional_bridge","many repeated low-confidence indicators can guide cautious practice only");
 assert.equal(provisional.confidence,"provisional");
 assert.ok(provisional.allocation.understanding<=60);
 assert.equal(provisional.mastery,false);
}
{
 const few=adapt(sample(95,1),sample(5,1));
 assert.equal(few.mode,"balanced","very few observations must not assign a stable learning type");
 assert.ok(few.uncertaintyPoints>20);
 const done=P.completion({allSaved:true});
 assert.equal(done.tasksCompleted,true);assert.equal(done.masteryConfirmed,false);
}
console.log("continuous-skill-policy tests: PASS");
