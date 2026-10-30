"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const reportSource=fs.readFileSync("assets/student-report.js","utf8");
const recordsSource=fs.readFileSync("assets/student-records.js","utf8");
const serverSource=fs.readFileSync("supabase/functions/admin-export-student/index.ts","utf8");
const adminSource=fs.readFileSync("assets/admin-cloud.js","utf8");
assert.match(serverSource,/!\["owner","admin"\]\.includes\(profile\.role\)/,"professors cannot export private submissions");
assert.match(serverSource,/error:"export_incomplete"/,"truncated data cannot be silently delivered");
assert.match(adminSource,/data-report-archive/,"archive download is available in supervisor UI");
const downloads=[];
const window={
  LEX_ACADEMIC:{university:v=>v||"",year:v=>v||""},
  location:{href:"https://example.test/admin.html"},
  setTimeout:()=>0,
  document:{
    body:{appendChild:()=>{}},
    createElement:()=>({click(){downloads.push(this.download)},remove(){}})
  },
  LEX_CLOUD:{db(){return {functions:{async invoke(){return {data:window.__exportResponse}}}}}}
};
class TestURL extends URL{}
TestURL.createObjectURL=()=> "blob:test";
TestURL.revokeObjectURL=()=>{};
const context={window,globalThis:window,URL:TestURL,Blob,console};
vm.runInNewContext(recordsSource,context,{filename:"student-records.js"});
vm.runInNewContext(reportSource,context,{filename:"student-report.js"});
const report=window.LEX_STUDENT_REPORT;
assert.equal(typeof report.downloadArchive,"function");
function fixture(userIndex){
  const id="00000000-0000-4000-8000-"+String(userIndex).padStart(12,"0");
  const date="2026-10-30T00:00:00Z";
  const student={id,username:"student"+userIndex,display_name:"طالب اختبار "+userIndex,
    university:"جامعة اختبار",year_label:"الفرقة الأولى",country_code:"eg",account_status:"active",created_at:date};
  const sessions=[],answers=[];
  for(let s=1;s<=30;s++){
    const tasks=[];
    for(let a=1;a<=3;a++){
      const item="session-"+s+"-answer-"+a;
      tasks.push({id:item,dimension:"recall",prompt_ar:"السؤال "+s+"-"+a});
      answers.push({user_id:id,course_id:"qa-qu-lawc101-rights",session_number:s,item_id:item,
        dimension:"recall",answer_text:"جواب خاص بالطالب "+userIndex+" للجلسة "+s+" السؤال "+a,
        submitted_at:date,evaluation:{status:"preliminary_ai",provisional_percent:75,rubric_version:"lexlearn-training-ai-v4"}});
    }
    sessions.push({user_id:id,course_id:"qa-qu-lawc101-rights",session_number:s,
      tasks_json:tasks,started_at:date,completed_at:date});
  }
  return {ok:true,student,generated_at:date,export_counts:{student_training_sessions:30,student_training_answers:90},
    truncated:[],records:{student_training_sessions:sessions,student_training_answers:answers,
      student_diagnostic_runs:[],attempts:[],enrollments:[],questions:[]}};
}
const sample=fixture(1),rendered=report.render(sample,report.buildText(sample));
assert.match(rendered,/الجلسة 30/);
assert.match(rendered,/السؤال 30-3/);
assert.match(rendered,/تحميل الأرشيف الكامل JSON/);
assert.match(report.buildText(sample),/جواب خاص بالطالب 1 للجلسة 30 السؤال 3/);
for(let i=1;i<=500;i++){
  const d=fixture(i);
  const raw=report.buildText(d);
  assert.ok(raw.includes("جواب خاص بالطالب "+i+" للجلسة 30 السؤال 3"));
  assert.ok(!raw.includes("جواب خاص بالطالب "+(i+501)+" للجلسة "));
}
async function main(){
 window.__exportResponse=sample;
 await report.downloadArchive(sample.student.id);
 assert.deepEqual(downloads,["LexLearn-student1-complete-archive.json"]);
 window.__exportResponse={ok:false,error:"export_incomplete",tables:["student_training_answers"]};
 await assert.rejects(report.fetch(sample.student.id),/ناقص|حد التصدير/);
 window.__exportResponse={...sample,truncated:["student_training_answers"]};
 await assert.rejects(report.fetch(sample.student.id),/غير مكتمل/);
 console.log("500 simulated student report archives: PASS (local render only, not live load)");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
