/* Administrator-only evidence dashboard. No fabricated improvement claims. */
(function(){
"use strict";
const app=document.getElementById("adminProgressApp"),db=LEX_CLOUD.db();
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=x=>typeof x==="number"&&Number.isFinite(x)?x:null;
const score=x=>num(x)===null?"لم يُقَس":Math.round(x)+"%";
const tdate=x=>x?new Date(x).toLocaleString("ar-EG"):"—";
const dim=x=>({recall:"الحفظ",understanding:"الفهم",exam_execution:"التطبيق وبناء الإجابة"})[x]||x||"—";
const message=x=>({rebuild_memory_cues:"إعادة بناء مفاتيح التذكر دون الرجوع إلى النص",
 contrast_one_condition:"المقارنة بين مسألتين تختلفان في شرط واحد",
 practice_exam_structure:"إعادة تنظيم المسألة والقاعدة والتطبيق والنتيجة",
 reconstruct_from_memory:"استرجاع عناصر القاعدة من الذاكرة",
 explain_then_vary_case:"شرح سبب القاعدة ثم تغيير واقعة تطبيقية"})[x]||"تدريب قانوني متدرج";
const signal=x=>({demonstrated_in_task:"متحقق في المهمة",partially_demonstrated:"متحقق جزئيًا",
 possible_incorrect_claim:"احتمال خطأ يحتاج مراجعة بشرية",not_demonstrated:"عنصر لم يظهر في الإجابة"})[x]||"لم يُقَس";
let students=[],enrollments=[],selected=null,selectedCourse="",report=null,group=null,studentError="",groupError="",tab="student",loading=false;
function badges(stats){
 return '<div class="grid three"><div class="metric"><span>الحفظ الحالي</span><strong>'+score(stats.current_task_coverage?.recall)+'</strong><small>تغطية عناصر معايير التدريب</small></div>'+
 '<div class="metric"><span>الفهم الحالي</span><strong>'+score(stats.current_task_coverage?.understanding)+'</strong><small>ليست درجة جامعية</small></div>'+
 '<div class="metric"><span>الجلسات المكتملة</span><strong>'+Math.max(0,Number(stats.completed_sessions)||0)+'/30</strong><small>تقدم فعلي محفوظ</small></div></div>';
}
function conceptMap(learning){
 const entries=Array.isArray(learning?.concepts)?learning.concepts:[];
 if(!entries.length)return '<p class="notice">لا توجد بعد أدلة تصحيح معتمدة تكفي لإنشاء خريطة للمفاهيم.</p>';
 return '<div class="impactConcepts">'+entries.map(c=>{
  const p=num(c.rolling_percent),value=p===null?0:Math.max(0,Math.min(100,p));
  return '<article class="impactConcept"><div><b>'+esc(c.label_ar||c.label_en||"عنصر قانوني")+'</b> · '+esc(dim(c.dimension))+'</div>'+
   '<div class="impactMeter"><progress max="100" value="'+value+'"></progress><strong>'+score(p)+'</strong></div>'+
   '<small>عدد مرات التقييم: '+Math.max(0,Number(c.evidence_count)||0)+' · '+esc(signal(c.signal))+'</small>'+
   '<p>التدريب المقترح: '+esc(message(c.next_step))+'</p></article>';
 }).join("")+'</div>';
}

function gradedStageHistory(report){
 const ordered=(Array.isArray(report?.answers)?report.answers:[]).filter(a=>{
  const e=a.evaluation||{};
  return (e.status==="preliminary_ai"&&e.rubric_version==="lexlearn-training-ai-v4"&&
   num(e.provisional_percent)!==null&&e.provisional_percent>=0&&e.provisional_percent<=100)||
   (e.status==="nonanswer_zero"&&e.provisional_percent===0);
 }).sort((a,b)=>Number(a.session||0)-Number(b.session||0)||
  String(a.submitted_at||"").localeCompare(String(b.submitted_at||""))||
  String(a.item_id||"").localeCompare(String(b.item_id||"")));
 const state={recall:[],understanding:[]},history=[];
 ordered.forEach(a=>{
  const dimKey=a.dimension;if(!Object.hasOwn(state,dimKey))return;
  state[dimKey].push(a.evaluation.provisional_percent);
  if(state[dimKey].length>3)state[dimKey].shift();
  const avg=k=>state[k].length?Math.round(state[k].reduce((s,n)=>s+n,0)/state[k].length):null;
  history.push({session:Number(a.session)||0,item_id:String(a.item_id||""),updated:dimKey,
   recall:avg("recall"),understanding:avg("understanding")});
 });
 return history;
}
function gradedStageHistoryHtml(report){
 const h=gradedStageHistory(report);
 if(!h.length)return '<p class="notice">لم يكتمل بعد تصحيح إجابة قابلة للقياس.</p>';
 return '<div class="tableScroll"><table class="dataTable"><thead><tr><th>مرحلة التصحيح</th><th>الحفظ</th><th>الفهم</th><th>المهارة المصححة</th></tr></thead><tbody>'+
 h.map((v,i)=>'<tr><td>الجلسة '+v.session+' · التصحيح '+(i+1)+'</td><td><strong>'+score(v.recall)+'</strong></td>'+
  '<td><strong>'+score(v.understanding)+'</strong></td><td>'+esc(dim(v.updated))+'</td></tr>').join("")+
 '</tbody></table></div>'+
 '<p class="notice">يُعاد بناء ترتيب المراحل من إجابات الطالب المحفوظة. النسب متوسط آخر ثلاث إجابات مصححة لكل مهارة حتى تلك المرحلة؛ وقد يختلف توقيت التصحيح عن تاريخ إرسال الإجابة. «لم يُقَس» تعني غياب دليل، وليس صفرًا.</p>';
}

function timeline(trends){
 const body=["recall","understanding"].map(k=>{
  const points=Array.isArray(trends?.[k])?trends[k]:[];
  return '<tr><th>'+esc(dim(k))+'</th><td>'+(points.length?points.map(p=>
   '<span class="tag">جلسة '+Number(p.session)+' : '+score(p.percent)+'</span>').join(" "):"لا توجد بيانات موثوقة")+'</td></tr>';
 }).join("");
 return '<div class="tableScroll"><table class="dataTable"><thead><tr><th>المهارة</th><th>المؤشرات بحسب الجلسة</th></tr></thead><tbody>'+body+'</tbody></table></div>'+
 '<p class="notice">الدرجات بين جلسات مختلفة ليست مقاييس متكافئة بالضرورة، ولذلك لا تثبت وحدها حدوث تحسن.</p>';
}
function evidenceRows(rows){
 if(!Array.isArray(rows)||!rows.length)return '<p class="notice">لا توجد إجابات تدريبية محفوظة حتى الآن.</p>';
 return rows.map(a=>{
  const ev=a.evaluation||{},graded=ev.status==="preliminary_ai"&&ev.rubric_version==="lexlearn-training-ai-v4";
  const fields=graded&&Array.isArray(ev.criteria)?ev.criteria.map(c=>
   '<li><b>'+esc(c.label_ar||c.label_en||c.id||"عنصر")+'</b> — '+(num(c.credit)===null?"غير مقاس":Math.round(c.credit*100)+"%")+
   (c.evidence?'<blockquote>'+esc(c.evidence)+'</blockquote>':"")+
   '<p>'+esc(c.explanation_ar||c.explanation_en||"")+'</p></li>').join(""):"";
  return '<details class="impactEvidence"><summary>الجلسة '+Math.max(0,Number(a.session)||0)+' · '+esc(dim(a.dimension))+
   ' · '+(graded?score(ev.provisional_percent):"التصحيح غير مكتمل")+'</summary>'+
   '<p><b>السؤال:</b> '+esc(a.question_ar||a.item_id)+'</p>'+
   '<p><b>مراجع السؤال:</b> '+esc((a.legal_source_ids||[]).join("، ")||"غير محددة")+'</p>'+
   '<p><b>الإجابة المحفوظة:</b></p><pre class="originalAnswer">'+esc(a.answer_text||"")+'</pre>'+
   '<p><b>حالة التصحيح:</b> '+esc(ev.status||"غير محددة")+' · '+esc(ev.rubric_version||"بدون إصدار")+'</p>'+
   (graded?'<p>'+esc(ev.feedback_ar||ev.feedback_en||"")+'</p><ul>'+fields+'</ul>':
    '<p class="notice">هذه الإجابة لا تدخل في المتوسط حتى يكتمل تقييمها بالمعيار المعتمد.</p>')+
   '</details>';
 }).join("");
}
function renderStudent(r){
 if(!r)return '<section class="panel"><p>اختر طالبًا لاستعراض ملفه.</p></section>';
 const d=r.diagnostic||{},l=r.learning||{};
 return '<section class="panel"><span class="eyebrow">الملف التعليمي المحفوظ</span><h2>'+esc(r.student?.name||"الطالب")+'</h2>'+
 '<p>'+esc(r.student?.university||"")+' · '+esc(r.student?.faculty||"")+' · '+esc(r.student?.year||"")+'</p>'+
 badges(r)+
 '<h3>خط الأساس عند التشخيص</h3><p>الحفظ: <b>'+score(d.recall)+'</b> · الفهم: <b>'+score(d.understanding)+'</b> · التاريخ: '+esc(tdate(d.completed_at))+'</p>'+
 '<h3>حالة أعمال الطالب</h3><div class="grid three"><div class="metric"><span>إجابات محفوظة</span><strong>'+Number(r.submitted_answers||0)+'</strong></div>'+
 '<div class="metric"><span>تصحيح آلي بمعيار حالي</span><strong>'+Number(r.ai_graded_answers||0)+'</strong></div>'+
 '<div class="metric"><span>إجابات تنتظر تقييمًا</span><strong>'+Number(r.ungraded_answers||0)+'</strong></div></div>'+
 '<h3>تحليل عناصر الإجابات</h3>'+(window.LEX_COGNITIVE_FINGERPRINT?window.LEX_COGNITIVE_FINGERPRINT.render(l):'')+conceptMap(l)+
 '<h3>تاريخ التقييم في الجلسات</h3>'+timeline(r.skill_trends)+
 '<h3>نسب الحفظ والفهم بعد كل عملية تصحيح</h3>'+gradedStageHistoryHtml(r)+
 '<h3>سجل الإجابات والتصحيح والمعايير</h3>'+
 '<p>تظهر الإجابات والتعليلات كاملة للمشرف المفوض فقط، ولا تُعرض ضمن اللوحة الجماعية.</p>'+
 evidenceRows(r.answers)+
 '<p class="notice">لم يثبت أثر تعليمي نهائي لهذا الطالب بعد. التحقق يحتاج اختبارًا قبليًا وبعديًا متكافئًا ومراجعة بشرية للمقارنة.</p></section>';
}
function stat(title,value,note){
 return '<div class="metric"><span>'+esc(title)+'</span><strong>'+esc(value==null?"غير متاح":String(value))+'</strong><small>'+esc(note||"")+'</small></div>';
}
function renderGroup(impact){
 if(!impact)return '<section class="panel">اضغط «تحديث مؤشرات المجموعة» لتحميل التقرير.</section>';
 const s=impact.skills||{},groups=impact.groups||[];
 return '<section class="panel"><span class="eyebrow">لوحة تحليل نتائج المشروع</span><h2>أثر LexLearn على مستوى جميع طلاب المقرر</h2>'+
 '<p>تُحسب المؤشرات من حسابات الطلاب النشطة، ومن الإجابات والجلسات المحفوظة فعليًا. لا تُنسب أي نتيجة افتراضية إلى الطلاب.</p>'+
 '<div class="grid three">'+
 stat("الطلاب المسجلون",impact.students_enrolled,"تسجيل نشط في المقرر")+
 stat("بدأوا التدريب",impact.students_with_training,"نسبة المشاركة: "+score(impact.engagement_percent))+
 stat("الجلسات المكتملة",impact.completed_sessions,"إجمالي الجلسات")+
 stat("الإجابات المحفوظة",impact.answers_submitted,"جميع مهام التدريب")+
 stat("إجابات صُححت بالمعيار الحالي",impact.ai_graded_answers,"نسبة التصحيح: "+score(impact.grading_coverage_percent))+
 stat("إجابات بانتظار تصحيح",impact.pending_or_ungraded_answers,"لا تحتسب صفرًا")+'</div>'+
 '<h3>متوسط تغطية معايير كل مهارة</h3>'+
 '<div class="grid three">'+["recall","understanding","exam_execution"].map(k=>stat(dim(k),score(s[k]?.mean_provisional_coverage),
  "عدد الطلاب المقاسين: "+Math.max(0,Number(s[k]?.students_measured)||0))).join("")+'</div>'+
 '<h3>المؤشرات حسب الجامعة والكلية والفرقة</h3>'+
 (groups.length?'<div class="tableScroll"><table class="dataTable"><thead><tr><th>الجامعة / الكلية</th><th>الفرقة</th><th>المسجلون</th><th>بدأوا</th><th>جلسات</th><th>اكتمال التصحيح</th></tr></thead><tbody>'+
 groups.map(g=>'<tr><td>'+esc(g.university||"")+' · '+esc(g.faculty||"")+'</td><td>'+esc(g.year||"")+'</td><td>'+Math.max(0,Number(g.total_students)||0)+
 '</td><td>'+Math.max(0,Number(g.students_with_training)||0)+'</td><td>'+Math.max(0,Number(g.completed_sessions)||0)+'</td><td>'+score(g.grading_coverage_percent)+'</td></tr>').join("")+'</tbody></table></div>':
 '<p class="notice">لا توجد بيانات مجموعات بعد.</p>')+
 '<h3>هل ثبت أن LexLearn رفع مستوى الطلاب؟</h3><p><b>لم يُثبت بعد.</b> المؤشرات أعلاه تثبت حجم الاستخدام وتغطية التصحيح، لا مقدار التحسن المعرفي. يلزم تطبيق اختبارين متكافئين تحت إشراف أكاديمي وقياس الفرق بينهما.</p>'+
 '<p class="notice">متوسط كل مهارة محسوب فقط على الطلاب الذين لديهم قياسات صالحة؛ يختلف عددهم من مهارة لأخرى. هذه البيانات ليست درجات جامعية معتمدة.</p></section>';
}
function shell(){
 app.innerHTML='<section class="panel"><h1>لوحة القياس والتحليل — LexLearn</h1>'+
 '<p>سجل الطالب التفصيلي ولوحة مؤشرات المشروع الإجمالية. الوصول مخصص لمشرف المنصة.</p>'+
 '<div class="impactTabs"><button type="button" class="'+(tab==="student"?"active":"")+'" id="showStudentTab">ملف الطالب</button>'+
 '<button type="button" class="'+(tab==="cohort"?"active":"")+'" id="showGroupTab">المؤشرات الإجمالية</button></div></section>'+
 (tab==="student"?
 '<section class="panel impactFilters"><label>الطالب<select id="selectedStudent">'+students.map(s=>'<option value="'+esc(s.id)+'"'+(s.id===selected?" selected":"")+'>'+esc(s.name||s.username||s.id)+'</option>').join("")+'</select></label>'+
 '<button type="button" id="reloadStudent" class="primary">تحديث ملف الطالب</button></section>'+
 '<div id="impactResult">'+(studentError?'<section class="panel danger">'+esc(studentError)+'</section>':report?renderStudent(report):'<section class="panel">اختر الطالب لتحميل بياناته.</section>')+'</div>':
 '<section class="panel"><button type="button" class="primary" id="reloadGroup">تحديث مؤشرات المجموعة</button></section>'+
 '<div id="impactResult">'+(groupError?'<section class="panel danger">'+esc(groupError)+'</section>':renderGroup(group))+'</div>');
 document.getElementById("showStudentTab").onclick=()=>{tab="student";shell();if(selected&&!report)loadStudent(selected);};
 document.getElementById("showGroupTab").onclick=()=>{tab="cohort";shell();if(!group)loadGroup();};
 if(tab==="student"){
  document.getElementById("selectedStudent").onchange=e=>{selected=e.target.value;report=null;studentError="";shell();loadStudent(selected);};
  document.getElementById("reloadStudent").onclick=()=>loadStudent(document.getElementById("selectedStudent").value);
 }else document.getElementById("reloadGroup").onclick=loadGroup;
}
async function call(body){
 const res=await db.functions.invoke("lexlearn-admin-learning-impact",{body});
 if(res.error||!res.data?.ok){
  let failure=res.data;
  try{if(res.error?.context?.json)failure=await res.error.context.json();}catch(_){}
  const error=Error(failure?.error||"report_unavailable");
  error.status=res.error?.context?.status;
  error.network=res.error?.name==="FunctionsFetchError";
  throw error;
 }
 return res.data;
}
function reportFailure(error,kind){
 if(error.status===401||error.message==="UNAUTHORIZED")return "انتهت جلسة الدخول أو تعذر التحقق منها. سجّل دخول المشرف مجددًا ثم افتح التقرير.";
 if(error.status===403||error.message==="FORBIDDEN")return "هذا التقرير متاح لمشرف المنصة المفوض فقط.";
 if(error.message==="student_not_in_active_course")return "الطالب غير مسجل حاليًا بحساب وتسجيل نشطين في هذا المقرر.";
 if(error.message==="cohort_exceeds_500_student_report_limit")return "عدد الطلاب يتجاوز سعة التقرير الحالي. يلزم تقسيم التقرير قبل حساب المؤشرات.";
 if(error.network)return "تعذر الاتصال بخدمة التقارير. تحقق من الإنترنت ثم أعد المحاولة.";
 return "تعذر تحميل "+(kind==="cohort"?"مؤشرات المجموعة":"سجل الطالب")+" بسبب خطأ في خدمة التقارير. أعد المحاولة، وإذا استمرت المشكلة تواصل مع الدعم.";
}
async function loadStudent(uid){
 if(loading)return;
 selected=uid;report=null;studentError="";loading=true;
 document.getElementById("impactResult").innerHTML='<section class="panel">جارٍ استرجاع سجل الطالب المصرّح به…</section>';
 try{
  if(!students.some(s=>s.id===uid))throw Error("غير مسموح بعرض هذا الطالب.");
  const res=await call({action:"student",student_id:uid});
  if(selected===uid){report=res.report;shell();}
 }catch(e){studentError=reportFailure(e,"student");shell();}
 finally{loading=false;}
}
async function loadGroup(){
 if(loading)return;
 group=null;groupError="";loading=true;
 document.getElementById("impactResult").innerHTML='<section class="panel">جارٍ تجميع نتائج طلاب المقرر من قاعدة البيانات…</section>';
 try{const res=await call({action:"cohort"});group=res.impact;shell();}
 catch(e){groupError=reportFailure(e,"cohort");shell();}
 finally{loading=false;}
}
async function boot(){
 const p=await LEX_CLOUD.profile();
 if(!p||!["owner","admin"].includes(p.role)||p.active!==true)throw Error("FORBIDDEN");
 const roster=await LEX_CLOUD.listStudents();
 students=roster;
 const requested=new URLSearchParams(location.search).get("student_id");
 selected=students.some(s=>s.id===requested)?requested:(students[0]?.id||null);
 tab=new URLSearchParams(location.search).get("view")==="cohort"?"cohort":"student";
 shell();
 if(tab==="cohort")await loadGroup();else if(selected)await loadStudent(selected);
}
boot().catch(()=>{app.innerHTML='<section class="panel danger"><h2>الدخول غير مصرح به</h2><p>هذه التقارير تظهر فقط للمشرف المفوض.</p><a href="admin-login.html">تسجيل دخول المشرف</a></section>';});
})();
