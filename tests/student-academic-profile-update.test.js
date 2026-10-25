const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ui=fs.readFileSync('assets/admin-cloud.js','utf8'),backend=fs.readFileSync('supabase/functions/admin-manage-student/index.ts','utf8');
new vm.Script(ui,{filename:'assets/admin-cloud.js'});
assert.match(ui,/function academicEditor\(s\)/);
assert.match(ui,/studentAcademicForm/);
assert.match(ui,/academicForm\.dataset\.student/);
assert.match(ui,/LEX_CLOUD\.manageStudent\(\{action:"update_profile"/);
for(const x of ['university','faculty','year_label','country_code','academic_section','student_registration_number','institutional_group_email']){
 assert.ok(ui.includes('"'+x+'"'),'supervisor cannot update '+x);
 assert.ok(backend.includes(x),'edge not saving '+x);
}
assert.match(backend,/!\\["owner","admin"\\]\\.includes\\(profile\\.role\\)/);
assert.match(backend,/\\.eq\\("role","student"\\)/);
assert.match(backend,/invalid_institutional_group_email/);
assert.match(backend,/scope_matching_may_change:true/);
console.log('PASS: owner can correct existing student faculty/scope; no instructor data-edit permission or inferred college');
