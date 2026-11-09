const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/student-path.js','utf8');
const ctx={document:{getElementById:()=>({})},location:{search:'?lang=ar'},URLSearchParams,console,module:{exports:{}}};
ctx.window=ctx;vm.runInNewContext(source,ctx,{filename:'assets/student-path.js'});
const api=ctx.LEX_STUDENT_PATH;
const held=['ai_review_required','review_required','human_review_required','needs_review'];
for(const status of held){
  const v={evaluation:{status,reason:'worker_outcome_unknown'}};
  assert.equal(api.heldGrade(v),true,status);
  assert.equal(api.needsAssessment(v),false,'must not rebill held '+status);
  assert.match(api.feedback(v),/إجابتك محفوظة/);
  assert.doesNotMatch(api.feedback(v),/0%/);
}
for(const reason of ['provider_rate_limited','provider_quota_exhausted']){
  const html=api.feedback({evaluation:{status:'ai_review_required',reason}});
  assert.match(html,/حدود الخدمة أو رصيدها/);
}
assert.equal(api.needsAssessment({evaluation:{status:'ai_queued',queue_job_id:'job'}}),false);
assert.equal(api.needsAssessment({evaluation:{status:'preliminary_ai',rubric_version:'lexlearn-training-ai-v4',provisional_percent:85}}),false);
assert.equal(api.needsAssessment({evaluation:{status:'nonanswer_zero',provisional_percent:0}}),false);
assert.equal(api.needsAssessment({evaluation:{status:'preliminary_internal'}}),true);
assert.equal(api.needsAssessment({evaluation:null}),true);
const records=fs.readFileSync('assets/student-records.js','utf8');
const rctx={module:{exports:{}}};rctx.window=rctx;
vm.runInNewContext(records,rctx,{filename:'assets/student-records.js'});
const h=rctx.LEX_STUDENT_RECORDS.html({
 questions:[],student_diagnostic_runs:[],student_training_sessions:[{session_number:1,course_id:'qa-qu-lawc101-rights',tasks_json:[{id:'a',dimension:'understanding',prompt_ar:'explain'}]}],
 student_training_answers:[{session_number:1,course_id:'qa-qu-lawc101-rights',item_id:'a',answer_text:'test',evaluation:{status:'ai_review_required',reason:'provider_quota_exhausted'}}],
 legal_sources:[]
});
assert.match(h,/التصحيح غير مكتمل/);
assert.match(h,/لم تُحتسب صفرًا/);
console.log('PASS: held AI results cannot trigger duplicate paid grading, scores remain unset, and records explain provider limits.');
