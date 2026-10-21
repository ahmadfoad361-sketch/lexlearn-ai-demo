const assert=require('assert');
const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('assets/student-report.js','utf8');
new vm.Script(source,{filename:'student-report.js'});
let html='',created;
const elements={};
const popup={
 focus(){},print(){},
 navigator:{clipboard:{writeText:async()=>{}}},
 document:{
  write(s){html+=s;},open(){html='';},close(){},
  getElementById(id){return elements[id]||(elements[id]={onclick:null});},
  body:{classList:{toggle(){},add(){}},appendChild(){}}
 }
};
const student={
 username:'pilot001',display_name:'Pilot Student',id:'test-id',
 faculty:'Faculty of Law',institutional_email:'student@university.edu',
 student_registration_number:null,institutional_email_verified_at:null
};
const records={
 enrollments:[],attempts:[],learner_snapshots:[],learning_plans:[],mastery_evidence:[],reviews:[],
 pilot_human_grades:[],pilot_ai_grades:[],ai_grading_runs:[],
 student_diagnostic_runs:[{status:'completed',answers:{q1:'A'},free_text:'تشخيصي: إجابة الطالب',result:{understanding:70},training_plan:{mode:'understanding-led'}}],
 student_training_sessions:[{session_number:1,tasks_json:[{id:'rights-v1-s1-recall',prompt_ar:'سؤال أصلي'}]}],
 student_training_answers:[{session_number:1,dimension:'recall',item_id:'rights-v1-s1-recall',answer_text:'الجواب المحفوظ للطالب',evaluation:{score:60}}],
 student_level_responses:[],consent_records:[{consent_type:'research_participation',accepted:true}],
 admin_audit:[{action:'ACADEMIC_MANUAL_REVIEW',details:{reason:'confirmed'}}]
};
const win={
 location:{href:'https://example.org/admin.html'},
 open(){return popup;},URL,Blob,
 LEX_CLOUD:{db(){return {functions:{invoke:async()=>({data:{ok:true,student,records,generated_at:'2026-10-21T12:00:00Z',truncated:[]}})}}}}
};
win.window=win;
vm.runInNewContext(source,{window:win,URL,Blob,Date,Map,JSON,Array,Math,console});
(async()=>{
 await win.LEX_STUDENT_REPORT.open('test-id');
 for(const v of ['تشخيصي: إجابة الطالب','الجواب المحفوظ للطالب','research_participation','ACADEMIC_MANUAL_REVIEW','student@university.edu']){
  assert.ok(html.includes(v),'complete report must include '+v);
 }
 assert.equal(typeof elements.printPdf.onclick,'function','PDF print/export must remain available');
 console.log('Student research report preserves official diagnostic, stages, feedback and supervisor audit');
})().catch(e=>{console.error(e);process.exitCode=1;});
