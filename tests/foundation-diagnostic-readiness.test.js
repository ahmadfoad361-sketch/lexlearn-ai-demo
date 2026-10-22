const assert=require("node:assert/strict");
const D=require("../assets/official-diagnostic.js");
const P=require("../assets/student-practice.js");
const Q=D.QUESTIONS;
function rows(recog,understanding,application=0){
 let rc=0,uc=0,ac=0;
 return Q.map(q=>{
  let goal=q.dimension==="recognition"?recog:q.dimension==="understanding"?understanding:application;
  let pos=q.dimension==="recognition"?rc++:q.dimension==="understanding"?uc++:ac++;
  let selected=pos<goal?q.a:(q.a+1)%q.arOptions.length;
  return {id:q.id,dimension:q.dimension,selected,correct:selected===q.a};
 });
}
function check(title,a,b,expected){
 const input=rows(a,b),v=D.build("ci-student",input,"","ci-attempt","2026-10-22T00:00:00Z");
 const rehearsal=P.plans(input);
 assert.equal(v.profileType,expected,title+" official profile");
 assert.equal(rehearsal.mode,expected==="insufficient_evidence"?"foundation":expected,title+" rehearsal mode");
 assert.equal(v.trainingPlan.mode,expected==="insufficient_evidence"?"foundation":expected,title+" official plan");
 assert.equal(v.measurements.recall.value,null,title+" never call recognition free recall");
 assert.ok(Array.isArray(v.trainingPlan.firstTasks)&&v.trainingPlan.firstTasks.length===3);
}
check("0/0 should be foundational",0,0,"foundation");
check("3/3 and 2/2 can be balanced strong",3,2,"balanced");
check("recognition strong, understanding weak",3,0,"recall-led");
check("understanding strong, recognition weak",0,2,"understanding-led");
let uncertain=rows(1,1);uncertain[2].selected=-1;uncertain[2].correct=false;
const soft=D.build("ci-student",uncertain,"","ci-attempt","2026-10-22T00:00:00Z");
assert.equal(soft.profileType,"balanced");
const unknown=rows(0,0).map(x=>({...x,selected:-1,correct:false}));
const missing=D.build("ci-student",unknown,"","ci-attempt","2026-10-22T00:00:00Z");
assert.equal(missing.profileType,"insufficient_evidence");
assert.equal(missing.trainingPlan.mode,"foundation");
assert.equal(P.plans(unknown).mode,"foundation");
assert.equal(missing.measurements.recognition.value,null);
console.log("Diagnostic readiness: PASS low-both→foundation, strong-both→balanced, distinct measured evidence, missing ≠ zero");
