'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const js=fs.readFileSync('assets/study-coach.js','utf8');
const html=fs.readFileSync('student-path.html','utf8');
const path=fs.readFileSync('assets/student-path.js','utf8');
const build=fs.readFileSync('scripts/build-public.js','utf8');
function boot(query,ua){
 const values=new Map();
 const localStorage={getItem:(k)=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:(k)=>values.delete(k)};
 const root={
  location:{search:query},navigator:{userAgent:ua,platform:'',maxTouchPoints:0},
  localStorage,addEventListener(){},setInterval(){return 1;},clearInterval(){},
  document:{hidden:false,hasFocus:()=>true,addEventListener(){}}
 };
 const ctx={window:root,URLSearchParams,Math,Date,Intl,JSON,Promise,Number,String,Array};
 vm.runInNewContext(js,ctx);
 return {api:root.LEX_STUDY_COACH,root};
}
const inactive=boot('?coach_preview=0','Mozilla/5.0 (Macintosh; Intel Mac OS X)');
assert.equal(inactive.api.enabled,false,'explicit opt-out must disable coach');
inactive.api.init({learnerId:'synthetic',language:'ar'});
inactive.api.recordCompleted('synthetic',2);
assert.equal(inactive.api.getDebugSummary(),null);
const preview=boot('','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)');
assert.equal(preview.api.enabled,true,'ordinary student sessions enable local reminders');
assert.equal(preview.api.isMobileDevice(),true,'mobile sound gate should recognize phones');
preview.api.init({learnerId:'synthetic-student',language:'ar'});
preview.api.recordCompleted('wrong-student',2);
assert.equal(preview.api.getDebugSummary().sessions,0);
preview.api.recordCompleted('synthetic-student',2);
preview.api.recordCompleted('synthetic-student',2);
assert.equal(preview.api.getDebugSummary().sessions,1,'duplicate completion must not count twice');
assert.equal(preview.api.offerAtBoundary({learnerId:'wrong-student',go(){}}),false,'coach cannot intercept another learner');
assert.equal(preview.api.offerAtBoundary({learnerId:'synthetic-student',go(){}}),false,'no blocking before threshold');
const laptop=boot('?coach_preview=1','Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
assert.equal(laptop.api.isMobileDevice(),false,'laptop must never play mobile-only reminder');
assert.ok(html.includes('assets/study-coach.js')&&html.includes('assets/study-coach.css'));
assert.ok(path.includes('root.LEX_STUDY_COACH.offerAtBoundary'));
assert.ok(path.includes('root.LEX_STUDY_COACH.recordCompleted'));
assert.ok(build.includes('study-coach/hero.jpg'),'real licensed image must ship');
assert.ok(!js.includes('.functions.invoke(')&&!js.includes('supabase.from('),'coach should not trigger API/AI spending');
console.log('PASS: coach enabled and explicit opt-out respected, own learner counting, no duplicate sessions, no forced navigation, mobile-only sound, UI assets and no API cost.');

// Synthetic event aggregation: no network, credentials or real students.
const activity=require('../assets/study-activity.js');
const vid='00000000-0000-4000-8000-000000000001',pid='00000000-0000-4000-8000-000000000002',bid='00000000-0000-4000-8000-000000000003';
function event(i,type,minute,details={}){return {course_id:'qa-qu-lawc101-rights',event_type:type,created_at:new Date(Date.UTC(2026,0,1,0,minute)).toISOString(),event_data:{v:1,visit_id:vid,event_id:'00000000-0000-4000-8000-'+String(i+100).padStart(12,'0'),...details}};}
const events=[event(1,'STUDY_VISIT_START',0),event(2,'STUDY_HEARTBEAT',1,{active_seconds:60}),event(3,'STUDY_BREAK_SHOWN',2,{prompt_id:pid}),event(4,'STUDY_BREAK_STARTED',2,{prompt_id:pid,break_id:bid}),event(5,'STUDY_BREAK_COMPLETED',12,{prompt_id:pid,break_id:bid}),event(6,'STUDY_VISIT_END',13)];
const v=activity.summarize([...events,events[2],events[1]])[0];
assert.equal(v.activeSeconds,60);assert.equal(v.shown,1);assert.equal(v.started,1);assert.equal(v.completed,1);assert.equal(v.pageClosed,true);
assert.equal(activity.summarize([]).length,0);assert.equal(activity.summarize([event(7,'STUDY_BREAK_COMPLETED',10,{break_id:bid})])[0].completed,0);
console.log('PASS: study activity deduplicates events and counts completed breaks without adding break time.');
