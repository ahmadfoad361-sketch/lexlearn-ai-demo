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
 message:()=> "تدريب مناسب"
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
