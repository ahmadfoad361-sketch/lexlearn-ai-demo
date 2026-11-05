"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const text=fs.readFileSync("assets/student-path.js","utf8");
const start=text.indexOf("function learningOverview(adaptation){");
const end=text.indexOf("\nfunction previousAnswerTitle(",start);
assert.ok(start>0&&end>start,"panel function exists");
const source=text.slice(start,end);
const context={
  lang:()=>"ar",
  t:(ar)=>ar,
  esc:(s)=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),
  weakName:(x)=>x==="recall"?"الحفظ":"الفهم",
  noHtmlScore:(n)=>typeof n==="number"?n+"%":"غير محدد",
};
vm.createContext(context);
vm.runInContext(source,context);
assert.equal(context.learningOverview(null),"");
assert.equal(context.learningOverview({learning:{status:"insufficient_evidence"}}),"");
const page=context.learningOverview({
 learning:{status:"provisional_learning_map",concepts:[
  {label_ar:"<script>alert(1)</script>",dimension:"understanding",rolling_percent:50,evidence_count:2,next_step:"contrast_one_condition"}
 ]},
 trends:{recall:[{session:1,percent:70}],understanding:[{session:1,percent:55}]}
});
assert.ok(page.includes("&lt;script&gt;"),"untrusted label is escaped");
assert.ok(!page.includes("<script>"),"HTML injection prevented");
assert.ok(page.includes("progress max='100' value='50'"));
assert.ok(page.includes("جلسة 1: 70%"));
assert.ok(page.includes("أجوبة")===false);
console.log("Learning intelligence panel: PASS");


const adminSource=fs.readFileSync("assets/admin-progress.js","utf8");
const adminStart=adminSource.indexOf("function badges(stats){"),adminEnd=adminSource.indexOf("\nfunction shell(){",adminStart);
assert.ok(adminStart>0&&adminEnd>adminStart);
const e=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const box={
 esc:e,num:x=>typeof x==="number"&&Number.isFinite(x)?x:null,score:x=>typeof x==="number"&&Number.isFinite(x)?Math.round(x)+"%":"لم يُقَس",
 tdate:x=>x||"—",dim:x=>({recall:"الحفظ",understanding:"الفهم",exam_execution:"الامتحان"})[x]||x||"—",
 message:()=> "تدريب مناسب",signal:()=> "مؤشر تدريب أولي"
};
vm.createContext(box);
vm.runInContext(adminSource.slice(adminStart,adminEnd),box);
const studentView=box.renderStudent({student:{name:"<img src=x onerror=alert(1)>",university:"جامعة اختبار"},
 diagnostic:{},completed_sessions:1,submitted_answers:1,ai_graded_answers:1,ungraded_answers:0,
 current_task_coverage:{recall:60,understanding:35},
 skill_trends:{recall:[{session:1,percent:60}],understanding:[]},
 learning:{concepts:[{label_ar:"مفهوم <b>خطر</b>",dimension:"recall",rolling_percent:60,evidence_count:1}]},
 answers:[{session:1,dimension:"recall",question_ar:"<script>bad</script>",answer_text:"<img src=x>",
  evaluation:{status:"preliminary_ai",rubric_version:"lexlearn-training-ai-v4",provisional_percent:60,
   criteria:[{label_ar:"عنصر",credit:.5,evidence:"إجابة"}]}}]
});
assert.ok(studentView.includes("&lt;img"));
assert.ok(studentView.includes("&lt;script&gt;bad&lt;/script&gt;"));
assert.ok(!studentView.includes("<script>"));
assert.ok(studentView.includes("مفهوم &lt;b&gt;خطر&lt;/b&gt;"));
const groupView=box.renderGroup({students_enrolled:2,students_with_training:1,engagement_percent:50,
 completed_sessions:3,answers_submitted:4,ai_graded_answers:2,pending_or_ungraded_answers:2,
 grading_coverage_percent:50,skills:{recall:{students_measured:1,mean_provisional_coverage:60}},
 groups:[],academic_effect:{status:"not_established"}});
assert.ok(groupView.includes("لم يُثبت بعد"));
assert.ok(groupView.includes("50%"));
assert.ok(!groupView.includes("<script>"));
console.log("Admin detailed and aggregate evidence dashboard: PASS");


{
 const chunk=text.slice(text.indexOf("function stageSkillSnapshot("),text.indexOf("\nfunction feedback(item)",text.indexOf("function stageSkillSnapshot(")));
 assert.ok(chunk.includes("function stageSkillScorecard"),"scorecard is attached after each stage");
 const sc={t:a=>a,weakName:x=>x==="recall"?"الحفظ":"الفهم",esc:x=>String(x),noHtmlScore:x=>Math.round(x)+"%",
  confirmedGrade:e=>e?.status==="preliminary_ai"&&e?.rubric_version==="lexlearn-training-ai-v4"&&Number.isFinite(e.provisional_percent),
  deterministicZero:e=>e?.status==="nonanswer_zero"&&e?.provisional_percent===0};
 vm.createContext(sc);vm.runInContext(chunk,sc);
 const row=(session_number,dimension,score,status="preliminary_ai")=>({session_number,dimension,submitted_at:"2026-11-02",evaluation:{status,rubric_version:"lexlearn-training-ai-v4",provisional_percent:score}});
 const rows=[row(1,"recall",90),row(1,"understanding",70),row(2,"recall",60),row(3,"recall",30),
  row(4,"recall",80),row(4,"understanding",99,"ai_review_required"),row(5,"understanding",50)];
 let stage=sc.stageSkillSnapshot(rows,2);
 assert.equal(stage.recall.percent,75);
 assert.equal(stage.understanding.percent,70);
 assert.equal(stage.understanding.fresh,false);
 stage=sc.stageSkillSnapshot(rows,4);
 assert.equal(stage.recall.percent,57);
 assert.equal(stage.understanding.percent,70);
 assert.ok(!stage.understanding.fresh);
 stage=sc.stageSkillSnapshot(rows,5);
 assert.equal(stage.understanding.percent,60);
 const empty=sc.stageSkillSnapshot([row(1,"recall",90)],1);
 assert.equal(empty.understanding.percent,null);
 const html=sc.stageSkillScorecard([row(1,"recall",90)],1);
 assert.ok(html.includes("90%")&&html.includes("لم يُقَس بعد"));
 console.log("Continuous post-assessment skill percentages: PASS");
}
{
 const first=fs.readFileSync("assets/official-level-one.js","utf8");
 const chunk=first.slice(first.indexOf("function levelSkillScorecard("),first.indexOf("\nfunction adaptiveHint("));
 assert.ok(chunk.includes("function levelSkillScorecard"));
 const sc={phrase:(_,a)=>a,confirmedAi:x=>x?.evaluation?.status==="preliminary_ai"&&x.evaluation.rubric_version==="lexlearn-training-ai-v4"};
 vm.createContext(sc);vm.runInContext(chunk,sc);
 const saved=[{dimension:"recall",evaluation:{status:"preliminary_ai",rubric_version:"lexlearn-training-ai-v4",provisional_percent:78}}];
 const html=sc.levelSkillScorecard(saved,"ar",{metrics:{understanding:65}});
 assert.ok(html.includes("78%")&&html.includes("65%"));
 assert.ok(html.includes("آخر قياس من التشخيص"));
 assert.ok(sc.levelSkillScorecard(saved,"ar",null).includes("لم يُقَس بعد"));
 console.log("First-level stage scoreboard with diagnostic fallback: PASS");
}
{
 const adminSource=fs.readFileSync("assets/admin-progress.js","utf8");
 const chunk=adminSource.slice(adminSource.indexOf("function gradedStageHistory("),adminSource.indexOf("\nfunction timeline("));
 assert.ok(chunk.includes("function gradedStageHistoryHtml"));
 const sc={num:v=>Number.isFinite(v)?v:null,score:v=>v===null?"لم يُقَس":v+"%",esc:x=>String(x),dim:x=>x};
 vm.createContext(sc);vm.runInContext(chunk,sc);
 const a=score=>({status:"preliminary_ai",rubric_version:"lexlearn-training-ai-v4",provisional_percent:score});
 const history=sc.gradedStageHistory({answers:[
  {session:2,item_id:"x",dimension:"understanding",submitted_at:"2026-11-01",evaluation:a(40)},
  {session:1,item_id:"r",dimension:"recall",submitted_at:"2026-10-31",evaluation:a(80)},
  {session:2,item_id:"pending",dimension:"recall",submitted_at:"2026-11-01",evaluation:{status:"ai_pending"}},
 ]});
 assert.equal(history.length,2);
 assert.equal(history[0].recall,80);
 assert.equal(history[0].understanding,null);
 assert.equal(history[1].recall,80);
 assert.equal(history[1].understanding,40);
 assert.ok(sc.gradedStageHistoryHtml({answers:[]}).includes("لم يكتمل"));
 console.log("Administrator stage-by-stage skill history: PASS");
}


{
 const admin=fs.readFileSync("assets/admin-cloud.js","utf8");
 const cloud=fs.readFileSync("assets/cloud-data.js","utf8");
 assert.ok(admin.includes("تفعيل حساب الطالب"),"a legacy pending account can be activated");
 assert.ok(!admin.includes("اكتب رقم الواتساب كاملًا بعد التحقق"),"optional WhatsApp is not an identity approval requirement");
 assert.ok(!admin.includes("طلبات تسجيل بانتظار الاعتماد"),"new registrations should not enter a mandatory approval queue");
 assert.ok(cloud.includes("registration_consent_required"),"HTTP rejection must give a useful reason");
 assert.ok(cloud.includes("error.context.json"),"function error body is surfaced instead of a generic non-2xx");
 console.log("Supervisor activation screen and error feedback: PASS");
}


{
 // Regression: an async queue must never look like a missing grade, and a genuine
 // 0% assessment must remain distinct from "not assessed yet".
 const ctx={document:{getElementById:()=>null},location:{search:"?lang=ar"},URLSearchParams};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync("assets/student-path.js","utf8"),ctx);
 const source=fs.readFileSync("assets/student-path.js","utf8");
 const guards=source.slice(source.indexOf("function confirmedGrade("),source.indexOf("function stageSkillSnapshot("));
 const g={};vm.createContext(g);vm.runInContext(guards,g);
 const graded=percent=>({status:"preliminary_ai",rubric_version:"lexlearn-training-ai-v4",provisional_percent:percent});
 assert.ok(g.pendingGrade({evaluation:{status:"ai_queued",queue_job_id:"synthetic-job"}}));
 assert.ok(g.pendingGrade({evaluation:{status:"ai_pending"}}));
 assert.ok(g.pendingGrade({evaluation:{status:"ai_verification_pending"}}));
 assert.ok(!g.needsAssessment({evaluation:{status:"ai_queued",queue_job_id:"synthetic-job"}}),"queued work should never trigger a second paid grade");
 assert.ok(g.confirmedGrade(graded(0)),"0% is a valid final score");
 assert.ok(!g.pendingGrade({evaluation:graded(0)}));
 const pending=[
  {session_number:6,dimension:"recall",item_id:"r",evaluation:graded(0)},
  {session_number:6,dimension:"understanding",item_id:"u",evaluation:{status:"ai_queued",queue_job_id:"synthetic-job"}},
  {session_number:6,dimension:"exam_execution",item_id:"e",evaluation:graded(17)}
 ];
 const html=ctx.LEX_STUDENT_PATH.progressHtml(pending,6,false);
 assert.ok(html.includes("0%")&&html.includes("17%"));
 assert.ok(html.includes("جارٍ التصحيح"),"pending skills must show an in-progress label");
 const verified=pending.map(x=>x.dimension==="understanding"?{...x,evaluation:graded(0)}:x);
 const final=ctx.LEX_STUDENT_PATH.progressHtml(verified,6,false);
 assert.ok(!final.includes("جارٍ التصحيح"));
 assert.ok(!final.includes("التصحيح غير مكتمل"));
 const watcher=source.slice(source.indexOf("if(stopQueueWatch)stopQueueWatch();"),source.indexOf("if(!studyRead",source.indexOf("if(stopQueueWatch)stopQueueWatch();")));
 assert.ok(watcher.includes('studentLifecycleRpc("trainingOpen"'),"background watcher reads saved results");
 assert.ok(!watcher.includes("gradeTrainingAi(")&&!watcher.includes('studentLifecycleRpc("trainingSubmit"'),"background watcher must not incur paid grading or overwrite answers");
 assert.ok(source.includes('id=\'refreshGradesNow\''),"read-only manual refresh is available");
 console.log("Pending grading, true zero percent, read-only automatic refresh: PASS");
}
