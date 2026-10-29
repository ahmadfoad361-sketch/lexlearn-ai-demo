const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const read=p=>fs.readFileSync(p,"utf8");
const admin=read("assets/admin-cloud.js"),css=read("assets/admin-experience.css");
const instructors=read("assets/admin-instructors.js"),login=read("assets/instructor-login.js"),loginHtml=read("instructor-login.html");
for(const p of ["assets/admin-cloud.js","assets/admin-instructors.js","assets/instructor-login.js"]){
 assert.doesNotThrow(()=>new vm.Script(read(p),{filename:p}),p+" must parse");
}
for(const heading of ["الرئيسية","الطلاب والمجموعات","الأساتذة والجامعات","التعلم والتقارير","إدارة المنصة"]){
 assert.ok(admin.includes(heading),"missing navigation heading "+heading);
}
for(const route of ['admin-instructors.html','admin-progress.html','admin-analytics.html','references.html','pilot-review.html','demo-supervisor.html','index.html']){
 assert.ok(admin.includes(route),"existing navigation route lost "+route);
}
for(const tab of ["dashboard","students","cohorts","grading","content","audit"])
 assert.ok(admin.includes('data-tab="'+tab+'"'),"legacy functional tab lost "+tab);
assert.ok(admin.includes('id="logout"'));
assert.ok(admin.includes('id="openAnalytics"'));
assert.match(css,/adminNavGroup/);
assert.match(css,/@media\(max-width:460px\)/);
assert.match(read("admin.html"),/admin-entry\.js\?v=20261029\.nav2/);
assert.match(read("admin.html"),/admin-experience\.css\?v=20261029\.nav2/);
assert.match(instructors,/id="copyTeacherPassword"/);
assert.match(instructors,/navigator\.clipboard\.writeText\(state\.credential\.temporary_password\)/);
assert.match(loginHtml,/id="showInstructorPassword"/);
assert.match(login,/pwField\.type=reveal\.checked\?"text":"password"/);
assert.match(loginHtml,/instructor-login\.js\?v=20261029\.loginhelp2/);
console.log("PASS: five grouped supervisor sections, unchanged routes and permissions, isolated password copy and reveal");
