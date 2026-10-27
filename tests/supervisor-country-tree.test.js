const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync('assets/admin-cloud.js','utf8');
const from=s.indexOf('function studentTree(list){'),to=s.indexOf('function academicEditor(s){',from);
assert.ok(from>=0&&to>from,'country/faculty/year tree must be available');
new vm.Script(s,{filename:'assets/admin-cloud.js'});
const academic=require("../assets/academic-display.js");
const ctx={
 academic,displayYear:academic.year,universityLabel:academic.university,countryFlagSvg:c=>'<img class="countryFlagSvg" src="assets/flags/'+c+'.svg">',
 state:{selected:'student-eg-law1',q:'',treeOpen:{},instructors:[{
  instructor_id:'prof-one',academic_title:'دكتور',profiles:{display_name:'أمل السعيد',active:true}
 }],instructorAssignments:[{
  instructor_id:'prof-one',active:true,country_code:'eg',university:'Tanta University',
  faculty:'Faculty of Law',year_label:'السنة الأولى',subject_name:'القانون المدني',course_id:'civil'
 }],enrollments:[
  {user_id:'student-eg-law1',course_id:'civil'},
  {user_id:'student-eg-law2',course_id:'unrelated'},
  {user_id:'student-eg-year2',course_id:'civil'}
 ]},
 esc:v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
 countryName:c=>({eg:'مصر',qa:'قطر',other:'أخرى'})[c]||c,
 view:s=>({completed:4}),risk:()=> 'none',rlabel:()=> 'حساب فعال'
};
const func=new vm.Script('('+s.slice(from,to).trim()+')').runInNewContext(ctx);
const student=(id,country,university,faculty,year,name)=>({id,country,university,faculty,year,name,username:id,active:true});
const entries=[
 student('student-eg-law1','eg','Tanta University','Faculty of Law','السنة الأولى','محمود'),
 student('student-eg-law2','eg','Tanta University','Faculty of Law','السنة الأولى','هبة'),
 student('student-eg-year2','eg','Tanta University','Faculty of Law','السنة الثانية','مصطفى'),
 student('student-qa-law1','qa','Qatar University','Faculty of Law','السنة الأولى','<script>alert(1)</script>'),
 student('student-incomplete','eg','','','السنة الأولى','مجهول الكلية')
];
const html=func(entries);
assert.match(html,/class="studentTreeNode level-country country-qa"/);
assert.match(html,/مصر/);assert.match(html,/قطر/);
assert.match(html,/Tanta University/);assert.match(html,/Faculty of Law/);
assert.match(html,/الفرقة الثانية/);
assert.doesNotMatch(html,/السنة الثانية/);
assert.match(html,/دكتور أمل السعيد/);
assert.match(html,/القانون المدني/);
assert.match(html,/admin-instructors\.html\?edit=prof-one/);
assert.ok(html.indexOf('دكتور أمل السعيد')<html.indexOf('data-student="student-eg-law1"'),
 'lecturer must precede their enrolled student');
assert.ok(html.indexOf('طلاب بدون تكليف مادة مطابق')<html.indexOf('data-student="student-eg-law2"'),
 'student without corresponding lecturer course remains visible, not misassigned');
assert.match(html,/student-incomplete/,'incomplete academic profile must not disappear');
assert.match(html,/غير محدد — استكمل البيانات/);
assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);
assert.match(html,/&lt;script&gt;/,'student display name must be escaped');
assert.equal((html.match(/data-student=/g)||[]).length,5);
assert.match(html,/details class="studentTreeNode/);
ctx.state.treeOpen['country|eg']=false;
const collapse=func(entries);assert.ok(collapse.includes('data-tree="country|eg"')&&!collapse.includes('data-tree="country|eg" open'));
ctx.state.q='محمود';
assert.ok(func([entries[0]]).includes('data-tree="country|eg" open'),'search must expand result groups');
const adminPage=fs.readFileSync('assets/admin-instructors.js','utf8'),edge=fs.readFileSync('supabase/functions/admin-manage-instructors/index.ts','utf8');
new vm.Script(adminPage,{filename:'assets/admin-instructors.js'});
assert.match(adminPage,/data-update-teacher/);
assert.match(adminPage,/new URLSearchParams\(location\.search\)\.get\("edit"\)/);
assert.match(adminPage,/action:"update"/);
assert.match(edge,/if\(action==="update"\)/);
assert.match(edge,/if\(!\["owner","admin"\]\.includes\(profile\.role\)\)/);
assert.match(edge,/admin\.auth\.admin\.updateUserById/);
assert.doesNotMatch(edge,/\.update\(\{role:"instructor"/,'editing must not increase roles');
const htmlAdmin=fs.readFileSync('admin.html','utf8');
const adminStyles = [...htmlAdmin.matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/g)]
 .map(match=>match[1]).filter(href=>/^assets\/admin-experience\.css\?v=[A-Za-z0-9._-]+$/.test(href));
assert.equal(adminStyles.length,1,'admin page must load one versioned experience stylesheet');
assert.ok(fs.existsSync(adminStyles[0].split('?')[0]),'referenced admin stylesheet must exist');
console.log('PASS country/faculty/year/lecturer tree, course enrollment filtering, orphans and secure professor edit');

// Aliases must merge only the known institution; several courses never inflate counts.
const aliases=[
 student('l1','qa','جامعة لوسيل','كلية القانون','السنة الأولى','أحمد'),
 student('l2','qa','Lusail University','law','الفرقة الأولى','منى'),
 student('l3','qa','لوسيل','كلية القانون','اولى','سلمى')
];
ctx.state.q='';ctx.state.instructorAssignments=[
 {instructor_id:'prof-one',active:true,country_code:'qa',university:'Lusail University',faculty:'كلية القانون',year_label:'السنة الأولى',subject_name:'مدني',course_id:'civil'},
 {instructor_id:'prof-one',active:true,country_code:'qa',university:'لوسيل',faculty:'كلية القانون',year_label:'الفرقة الأولى',subject_name:'دستوري',course_id:'constitutional'}
];
ctx.state.enrollments=[{user_id:'l1',course_id:'civil'},{user_id:'l1',course_id:'constitutional'},{user_id:'l2',course_id:'civil'}];
// Enrollment lookup is constructed per invocation.
const merged=func(aliases.concat(aliases[0]));
assert.equal((merged.match(/level-faculty/g)||[]).length,1);
assert.equal((merged.match(/level-year/g)||[]).length,1);
assert.equal((merged.match(/class="treeCount">3</g)||[]).length,3,'unique country, faculty and year counts');
assert.equal((merged.match(/class="treeProfessor"/g)||[]).length,2);
assert.equal((merged.match(/data-student="l1"/g)||[]).length,2,'one student can appear beneath both subjects');
assert.match(merged,/طلاب بدون تكليف مادة مطابق/);assert.match(merged,/data-student="l3"/);
const empty=func([]);
for(const code of ['qa','eg','sa','ae'])assert.ok(empty.includes('country-'+code)&&empty.includes('assets/flags/'+code+'.svg'));
assert.equal((empty.match(/class="treeCount">0</g)||[]).length,4);
assert.notEqual(academic.universityKey('Lusail International University'),academic.universityKey('لوسيل'),'no substring-based merging of unrelated schools');
for(const old of ['السنة الأولى','الفرقة الاولى','أولى','1','١'])assert.equal(academic.year(old),'الفرقة الأولى');
assert.deepEqual(academic.preserveStored({university:'جامعة لوسيل',year_label:'الفرقة الأولى'},{university:'Lusail University',year:'السنة الأولى'}),{university:'Lusail University',year_label:'السنة الأولى'});
console.log('PASS four empty countries, Lusail aliases, unique counts and unchanged stored academic keys');

assert.equal(academic.preserveStored({faculty:''},{faculty:null}).faculty,'','incomplete profile remains editable');
