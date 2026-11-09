(function(root){
"use strict";
var list=root.document.getElementById("lexGlossaryStudentList"),report=root.document.getElementById("lexGlossaryStudentReport");
if(!list||!report)return;
var roster=[],chosen=null,search=root.document.getElementById("lexGlossaryStudentSearch"),loading=false;
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function value(v){return v===null||v===undefined||v===""?"—":String(v);}
function when(date){if(!date)return "—";var time=Date.parse(date);return Number.isFinite(time)?new Date(time).toLocaleDateString("ar-EG"):"—";}
function plainError(){return "تعذّر تحميل البيانات الآن. تحقق من صلاحيات المشرف واتصال قاعدة البيانات.";}
function info(k,v){return "<div class='lexAdminGlossaryDatum'><small>"+esc(k)+"</small><b>"+esc(value(v))+"</b></div>";}
function interpretation(row){
 var k=row.staff_inference||"insufficient_evidence",labels={
  insufficient_evidence:"لا توجد أدلة مراجعة بعد",
  partial_evidence:"أدلة جزئية — لا استنتاج قاطع",
  recall_review_needed:"إشارة مراجعة في التذكر (إقرار ذاتي)",
  understanding_review_needed:"إشارة مراجعة في الفهم (سؤال موضوعي)",
  both_review_needed:"إشارتان لمراجعة التذكر والفهم",
  no_current_difficulty_signal:"لم تظهر صعوبة في آخر مراجعة"
 };
 return labels[k]||labels.insufficient_evidence;
}
function evidence(row){
 var e=row.evidence||{},r=e.recall||null,u=e.understanding||null;
 return "<div class='lexAdminGlossaryEvidence'>"+
 "<p><b>استرجاع المعنى:</b> "+(r?(r.outcome==="recalled"?"أقرّ الطالب بأنه تذكّر المعنى":"أقرّ الطالب بأنه احتاج إلى المراجعة")+" • "+esc(when(r.created_at)):"لم تتم مراجعة الاسترجاع")+"</p>"+
 "<p><b>سؤال الفهم:</b> "+(u?(u.outcome==="correct"?"إجابة صحيحة":"إجابة غير صحيحة")+" • "+esc(when(u.created_at)):"لم يُختبر الفهم بعد")+"</p>"+
 "<p class='lexAdminInference'><b>مؤشر خاص بالمشرف:</b> "+esc(interpretation(row))+"</p></div>";
}
function renderRoster(){
 var q=String(search.value||"").toLowerCase().trim();
 var people=roster.filter(function(s){return !q||[s.name,s.username,s.cohort,s.university,s.faculty].join(" ").toLowerCase().includes(q);});
 list.innerHTML="<p class='lexAdminGlossaryCount'>"+people.length+" طالب</p>"+(people.length?people.slice(0,300).map(function(s){
  return "<button type='button' data-student='"+esc(s.id)+"' class='lexAdminGlossaryStudent "+(chosen===s.id?"selected":"")+"'><b>"+esc(s.name||s.username)+"</b><small>@"+esc(s.username)+" · "+esc(s.cohort||"طالب حر")+"</small></button>";
 }).join(""):"<p>لا يوجد طلاب مطابقون للبحث.</p>")+(people.length>300?"<p>اعرض النتائج الأخرى باستخدام البحث.</p>":"");
 list.querySelectorAll("[data-student]").forEach(function(b){b.onclick=function(){loadReport(b.dataset.student);};});
}
function showStudent(data){
 var s=data.student||{},rows=data.entries||[];
 report.innerHTML="<div class='lexAdminGlossaryReportTitle'><div><span class='lexGlossaryAdminEyebrow'>Student Dictionary</span><h2>"+esc(s.display_name||s.username||"طالب")+"</h2><p>القاموس الشخصي الذي أنشأه الطالب بنفسه</p></div><strong>"+rows.length+" مصطلح</strong></div>"+
 "<div class='lexAdminGlossaryInfo'>"+
 info("اسم الدخول",s.username)+info("رقم الطالب في الجامعة",s.student_registration_number)+info("المجموعة",s.cohort_name||"طالب حر")+info("الجامعة",s.university)+
 info("الكلية",s.faculty)+info("الفرقة",s.year_label)+info("الشعبة",s.academic_section)+info("الدولة",s.country_code)+info("الحالة",s.account_status)+"</div>"+
 (rows.length?"<div class='lexAdminGlossaryTerms'>"+rows.map(function(e){
  return "<article class='lexAdminGlossaryTerm'><div class='lexAdminGlossaryTermHead'><h3>"+esc(e.term_ar)+"</h3><small>المادة "+esc(e.article_number||"—")+" · حُفظ "+esc(when(e.added_at))+"</small></div>"+
  (e.definition_ar?"<p>"+esc(e.definition_ar)+"</p>":"<p>المصطلح محفوظ من الطالب وينتظر التعريف.</p>")+
  (e.personal_note?"<div class='lexAdminGlossaryMoment'><b>الموقف الذي ذكره الطالب:</b> "+esc(e.personal_note)+"</div>":"")+
  evidence(e)+"</article>";
 }).join("")+"</div>":"<p class='lexAdminGlossaryEmpty'>الطالب لم يضف أي مصطلح بعد. لم نضع قاموسًا جاهزًا له.</p>")+
 "<p class='lexAdminGlossaryFoot'>مؤشرات المراجعة ليست درجات رسمية. حفظ كلمة أو اختيارها لا يُعد دليلًا على ضعف الطالب. بيانات التذكر هنا تقرير ذاتي، والفهم يعتمد على سؤال موضوعي.</p>"+
 (data.truncation&&(data.truncation.terms||data.truncation.reviews)?"<p role='alert'>التقرير كبير وتوجد سجلات لم تُعرض، راجع الإدارة الفنية.</p>":"");
}
async function loadReport(id){
 if(loading||!roster.some(function(s){return s.id===id;}))return;
 chosen=id;renderRoster();loading=true;report.innerHTML="<p role='status'>جارٍ تحميل القاموس الفردي…</p>";
 try{
  var c=root.LEX_CLOUD.db(),result=await c.functions.invoke("lexlearn-admin-glossary",{body:{action:"student",student_id:id}});
  if(result.error||!result.data?.ok||result.data.student?.id!==id)throw Error("report_rejected");
  showStudent(result.data);
 }catch(_){report.innerHTML="<p role='alert'>"+plainError()+"</p><button id='lexGlossaryRetry'>إعادة المحاولة</button>";report.querySelector("#lexGlossaryRetry").onclick=function(){chosen=null;loading=false;loadReport(id);};}
 finally{loading=false;}
}
async function boot(){
 try{
  var c=root.LEX_CLOUD;
  if(!c||!c.isConfigured||!c.isConfigured())throw Error("cloud_unavailable");
  var current=await c.profile();
  if(!current||!["admin","owner"].includes(current.role)||current.active===false)throw Error("staff_only");
  roster=await c.listStudents();
  search.addEventListener("input",renderRoster);
  renderRoster();
  var requested=new URLSearchParams(location.search).get("student");
  if(requested&&roster.some(function(s){return s.id===requested;}))loadReport(requested);
 }catch(_){
  list.innerHTML="<p role='alert'>هذه الصفحة مخصصة للمشرف المخوّل فقط. <a href='admin-login.html'>تسجيل الدخول</a></p>";
  report.innerHTML="<p>"+plainError()+"</p>";
 }
}
boot();
})(typeof window!=="undefined"?window:globalThis);
