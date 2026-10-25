(function(){
"use strict";
const app=document.getElementById("adminProgressApp"),db=LEX_CLOUD.db();
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const score=x=>x===null||x===undefined||x===""||!Number.isFinite(Number(x))?"لم يُقَس":Math.round(Number(x))+"%";
let students=[],selected=null,report=null,enrollments=[],selectedCourse="";
function show(){
 app.innerHTML='<section class="panel"><span class="eyebrow">التقييم الدوري</span><h1>تدرج الحفظ والفهم لكل طالب</h1><p>تُعرض المؤشرات عند التشخيص، ثم بعد كل خمس جلسات مكتملة. أرقام التمارين من معايير مؤقتة ولا تُستخدم لإثبات تحسّن علمي دون مقاييس متكافئة.</p>'+
 '<label>الطالب<select id="selectedStudent">'+students.map(x=>'<option value="'+esc(x.id)+'" '+(selected===x.id?"selected":"")+'>'+esc(x.name||x.username)+' — '+esc(x.university||"")+' — '+esc(x.year||"")+'</option>').join("")+'</select></label>'+
 '<label>المقرر<select id="selectedCourse">'+enrollments.filter(e=>e.user_id===selected).map(e=>'<option value="'+esc(e.course_id)+'" '+(selectedCourse===e.course_id?"selected":"")+'>'+esc(e.course_id)+'</option>').join("")+'</select></label>'+
 '<button class="primary" id="inspectProgress">عرض تقدم الطالب</button><button class="secondary" id="printProgress">طباعة التقرير</button></section><div id="progressReport">'+(report?renderReport(report):'')+'</div>';
 document.getElementById("inspectProgress").onclick=()=>load(document.getElementById("selectedStudent").value,document.getElementById("selectedCourse").value||null);
 document.getElementById("selectedStudent").onchange=e=>{selected=e.target.value;selectedCourse=enrollments.find(x=>x.user_id===selected)?.course_id||"";report=null;show();};
 document.getElementById("printProgress").onclick=()=>window.print();
}
function renderReport(r){
 const d=r.diagnostic||{},points=r.checkpoints||[];
 const names={recall:"الحفظ / استرجاع القاعدة",understanding:"الفهم"};
 const by=[...new Set(points.map(p=>p.period))].sort((a,b)=>a-b);
 return '<section class="panel"><h2>'+esc(r.student?.name||"")+'</h2><p>'+esc(r.student?.university)+' — '+esc(r.student?.faculty)+' — '+esc(r.student?.year)+'</p>'+
 '<div class="grid three"><div class="metric">الحفظ عند التشخيص<strong>'+score(d.recall)+'</strong><small>خط أساس أولي</small></div><div class="metric">الفهم عند التشخيص<strong>'+score(d.understanding)+'</strong><small>خط أساس أولي</small></div><div class="metric">الجلسات المكتملة<strong>'+Number(r.completed_sessions||0)+'</strong><small>فترة المتابعة = 5 جلسات</small></div></div>'+
 '<h3>سجل الفترات المكتملة</h3>'+
 (points.length?'<div class="tableScroll"><table class="dataTable"><thead><tr><th>الفترة</th><th>المهارة</th><th>المؤشر</th><th>العدد</th><th>نسخة المعيار</th></tr></thead><tbody>'+
 points.map(x=>'<tr><td>الجلسات '+((x.period-1)*5+1)+' إلى '+(x.period*5)+'</td><td>'+esc(names[x.dimension]||x.dimension)+'</td><td><strong>'+score(x.percent)+'</strong><div class="bar"><span style="width:'+Math.min(100,Math.max(0,Number(x.percent)||0))+'%"></span></div></td><td>'+x.samples+'</td><td>'+esc(x.rubric_version||"غير محددة")+'</td></tr>').join("")+'</tbody></table></div>':'<p class="notice">لا تتوافر بعد فترة تدريبية مكتملة بمؤشرات مصححة قابلة للعرض. لن يتم عرض تطور افتراضي.</p>')+
 '<h3>ما يحتاج مراجعة تعليمية</h3><div class="summary">'+suggest(r)+'</div>'+
 '<h3>عناصر قانونية تحتاج تدريبًا متكررًا</h3><p>'+(r.missing_criteria||[]).map(x=>'<span class="tag">'+esc(x.element)+' — '+x.count+'</span>').join(" ")+'</p>'+
 '<p class="notice">هذه مؤشرات تدريبية أولية. لا يمكن المقارنة على أنها زيادة في مستوى الحفظ أو الفهم إلا عند توحيد صعوبة الأسئلة ونسخة معيار التصحيح.</p></section>';
}
function suggest(r){
 const pts=r.checkpoints||[],latest=k=>pts.filter(x=>x.dimension===k).at(-1),a=latest("recall"),b=latest("understanding");
 const notes=[];
 if(a&&Number(a.percent)<65)notes.push("مراجعة القواعد الأساسية واسترجاع عناصرها من الذاكرة بأمثلة جديدة.");
 if(b&&Number(b.percent)<65)notes.push("شرح أسباب الحكم القانوني ومقارنة الحالات المتشابهة والمختلفة.");
 if(!pts.length)notes.push("الانتظار حتى إتمام خمس جلسات وتجميع إجابات أكثر قبل توصيف مواطن الاحتياج.");
 if(!notes.length)notes.push("الاستمرار في تدريبات متنوعة وقياس دوري ومراجعة بشرية للنتائج.");
 return notes.map(x=>'<p>• '+x+'</p>').join("");
}
async function load(uid,courseId){
 selected=uid;selectedCourse=courseId||enrollments.find(x=>x.user_id===uid)?.course_id||"";report=null;show();
 const box=document.getElementById("progressReport");box.innerHTML='<section class="panel">جارٍ تحميل سجل الطالب المصرّح به…</section>';
 try{
  if(!enrollments.some(x=>x.user_id===uid&&x.course_id===selectedCourse))throw Error("not_enrolled");
  const res=await db.rpc("lex_staff_skill_progress",{p_student:uid,p_course:selectedCourse});
  if(res.error)throw res.error;
  report=res.data;box.innerHTML=renderReport(report);
 }catch(_){box.innerHTML='<section class="panel danger">تعذر تحميل قياسات الطالب. تأكد من تسجيله في المادة التجريبية.</section>';}
}
async function boot(){
 const p=await LEX_CLOUD.profile();
 if(!p||!["owner","admin"].includes(p.role)||p.active!==true)throw Error("FORBIDDEN");
 const [roster,linked]=await Promise.all([LEX_CLOUD.listStudents(),db.from("enrollments").select("user_id,course_id").eq("status","active")]);
 if(linked.error)throw linked.error;
 students=roster;enrollments=linked.data||[];
 selected=students.find(s=>enrollments.some(e=>e.user_id===s.id))?.id||null;
 selectedCourse=enrollments.find(e=>e.user_id===selected)?.course_id||"";
 show();if(selected)await load(selected,selectedCourse);
}
boot().catch(()=>app.innerHTML='<section class="panel danger"><h2>الدخول غير مصرح به</h2><p>البيانات التفصيلية تظهر للمشرف المفوض فقط.</p><a href="admin-login.html">تسجيل دخول المشرف</a></section>');
})();