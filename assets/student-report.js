(function(root){
"use strict";
function escapeHTML(x){return String(x==null?"":x).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function label(k){return {recall:"الحفظ",understanding:"الفهم",application:"التطبيق",legal_precision:"الدقة القانونية",retention:"الاحتفاظ بالمعلومة",exam:"الأداء الامتحاني"}[k]||k||"—";}
function fmtDate(s){if(!s)return "—";var d=new Date(s);return Number.isNaN(d.getTime())?String(s):d.toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short"});}
function str(v){return v==null||v===""?"—":typeof v==="object"?JSON.stringify(v,null,2):String(v);}
function score(v){if(v==null)return "غير محدد";var n=Number(v);return Number.isFinite(n)?(n<=1?Math.round(n*100):Math.round(n))+"%":str(v);}
function buildText(d){
 var p=d.student,r=d.records||{},A=Array.isArray(r.attempts)?r.attempts:[],human=new Map((r.pilot_human_grades||[]).map(function(x){return[x.attempt_id,x];})),ai=new Map((r.pilot_ai_grades||[]).map(function(x){return[x.attempt_id,x];})),questions=new Map((r.questions||[]).map(function(x){return[x.id,x];}));
 var lines=["LexLearn | ملف الطالب التعليمي","تاريخ إصدار التقرير: "+fmtDate(d.generated_at),"التقرير للاستخدام الإداري والتوثيق؛ النتائج الآلية لا تمثل اعتمادًا جامعيًا.","","=== البيانات الأساسية ===",
 "الاسم: "+str(p.display_name),"اسم المستخدم: "+str(p.username),"رقم الحساب: "+str(p.id),"الدولة: "+str(p.country_code),"الجامعة: "+str(p.university),"السنة الدراسية: "+str(p.year_label),"الكلية: "+str(p.faculty),"البريد الجامعي: "+str(p.institutional_email),"التحقق من البريد الجامعي: "+(p.institutional_email_verified_at?"مراجعة يدوية في "+fmtDate(p.institutional_email_verified_at):"لم يتحقق"),"رقم القيد الجامعي: "+str(p.student_registration_number),"حالة الحساب: "+str(p.account_status),"تاريخ التسجيل: "+fmtDate(p.created_at),
 "","=== المقررات ==="];
 (r.enrollments||[]).forEach(function(x){lines.push(str(x.course_id)+" | "+str(x.status)+" | "+fmtDate(x.assigned_at));});
 if(!(r.enrollments||[]).length)lines.push("لا توجد مقررات مسجلة");
 lines.push("","=== اختبارات الطالب وإجاباته (عدد "+A.length+") ===");
 A.slice().sort(function(a,b){return new Date(a.created_at)-new Date(b.created_at);}).forEach(function(x,i){
  var q=questions.get(x.item_id)||{},h=human.get(x.id),g=ai.get(x.id);
  lines.push("","المحاولة رقم "+(i+1),"التاريخ: "+fmtDate(x.created_at),"المقرر: "+str(x.course_id),"رقم السؤال: "+str(x.item_id),"السؤال: "+str(q.prompt_ar),"المهارة: "+label(x.dimension),
   "الإجابة المكتوبة: "+str(x.answer_text),"الاختيار المسجل: "+str(x.selected_option),"الدرجة الأولية: "+score(x.score),"طريقة التصحيح: "+str(x.grading_method),"درجة الثقة: "+str(x.confidence),"نوع الخطأ: "+str(x.error_type));
  if(x.ai_grade)lines.push("تفاصيل التقييم الآلي: "+str(x.ai_grade));
  if(g)lines.push("التقييم الآلي الإضافي: "+str({status:g.status,score:g.score,passed:g.passed,feedback:g.feedback,criteria:g.criteria,source_ids:g.source_ids}));
  if(h)lines.push("تقييم المشرف: "+str({passed:h.passed,feedback:h.feedback,criteria:h.criteria,reviewed_at:h.reviewed_at}));
 });
 function records(title,key){var rows=r[key]||[];lines.push("","=== "+title+" (عدد "+rows.length+") ===");if(!rows.length)lines.push("لا توجد بيانات");rows.forEach(function(x,i){lines.push("السجل "+(i+1)+": "+JSON.stringify(x,null,2));});}
 records("ملخصات التقدم ومراحل التدريب","learner_snapshots");
 records("خطط التدريب الفردية","learning_plans");
 records("أدلة التقييم والمهارات","mastery_evidence");
 records("مواعيد المراجعة","reviews");
 records("سجلات التصحيح الآلي","ai_grading_runs");
 records("التشخيص الرسمي الكامل والإجابات والخطة الأولية","student_diagnostic_runs");
 records("الجلسات الثلاثون وتواريخ إكمالها وأسئلتها المختارة","student_training_sessions");
 records("كل إجابات الجلسات الثلاثين وتصحيحها الفعلي","student_training_answers");
 records("إجابات مسار المستويات الأخرى","student_level_responses");
 records("الموافقات المسجلة","consent_records");
 records("تدخلات المشرف في حساب الطالب","admin_audit");
 if(d.truncated&&d.truncated.length)lines.push("","تنبيه: يوجد اقتطاع بيانات بسبب حد التصدير في: "+d.truncated.join("، "));
 return lines.join("\n");
}
function section(title,body,klass){return '<section class="section '+(klass||"")+'"><h2>'+escapeHTML(title)+'</h2>'+body+'</section>';}
function render(d,raw){
 var p=d.student,records=d.records||{},arr=records.attempts||[],human=new Map((records.pilot_human_grades||[]).map(function(x){return[x.attempt_id,x];})),ai=new Map((records.pilot_ai_grades||[]).map(function(x){return[x.attempt_id,x];})),questions=new Map((records.questions||[]).map(function(x){return[x.id,x];}));
 var fields=[["الاسم",p.display_name],["اسم المستخدم",p.username],["الجامعة",p.university],["السنة الدراسية",p.year_label],["الدولة",p.country_code],["الكلية",p.faculty],["البريد الجامعي",p.institutional_email],["حالة التحقق",p.institutional_email_verified_at?"مراجعة يدوية":"لم يتحقق"],["رقم القيد",p.student_registration_number],["الحالة",p.account_status],["تاريخ التسجيل",fmtDate(p.created_at)],["معرف الطالب",p.id]];
 var html='<div class="fieldgrid">'+fields.map(function(a){return '<div><small>'+escapeHTML(a[0])+'</small><b>'+escapeHTML(str(a[1]))+'</b></div>';}).join("")+'</div>';
 var enroll=(records.enrollments||[]).map(function(x){return '<div class="entry"><b>'+escapeHTML(str(x.course_id))+'</b><p>الحالة: '+escapeHTML(str(x.status))+' • '+escapeHTML(fmtDate(x.assigned_at))+'</p></div>';}).join("")||'<p>لا توجد مقررات مسجلة.</p>';
 var tests=arr.slice().sort(function(a,b){return new Date(a.created_at)-new Date(b.created_at);}).map(function(a,i){
  var q=questions.get(a.item_id)||{},h=human.get(a.id),g=ai.get(a.id);
  return '<article class="entry attempt"><h3>المحاولة '+(i+1)+' <span>'+escapeHTML(fmtDate(a.created_at))+'</span></h3><p><b>المقرر:</b> '+escapeHTML(str(a.course_id))+' • <b>المهارة:</b> '+escapeHTML(label(a.dimension))+'</p><p><b>السؤال:</b> '+escapeHTML(str(q.prompt_ar||a.item_id))+'</p><div class="answer"><b>الإجابة المكتوبة</b><pre>'+escapeHTML(str(a.answer_text))+'</pre><p>الاختيار المسجل: '+escapeHTML(str(a.selected_option))+'</p></div><p><b>الدرجة الأولية:</b> '+escapeHTML(score(a.score))+' • <b>طريقة التصحيح:</b> '+escapeHTML(str(a.grading_method))+'</p>'+
  (a.ai_grade?'<div class="details"><b>تفاصيل التصحيح:</b><pre>'+escapeHTML(str(a.ai_grade))+'</pre></div>':'')+
  (g?'<div class="details"><b>التصحيح الآلي الإضافي:</b><pre>'+escapeHTML(str({score:g.score,status:g.status,feedback:g.feedback,criteria:g.criteria}))+'</pre></div>':'')+
  (h?'<div class="details"><b>مراجعة المشرف:</b><pre>'+escapeHTML(str({passed:h.passed,feedback:h.feedback,criteria:h.criteria,reviewed_at:h.reviewed_at}))+'</pre></div>':'')+'</article>';
 }).join("")||'<p>لا توجد محاولات محفوظة.</p>';
 function other(title,key){return section(title,(records[key]||[]).map(function(x,i){return '<article class="entry"><b>السجل '+(i+1)+'</b><pre>'+escapeHTML(JSON.stringify(x,null,2))+'</pre></article>';}).join("")||'<p>لا توجد بيانات.</p>',"data");}
 var imageUrl=new URL("assets/lexlearn-logo.svg",root.location.href).href;
 var style='@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#162b48;background:#f4f6fa;direction:rtl;line-height:1.8;margin:0}header{background:#142B5F;color:white;padding:24px 5%;display:flex;align-items:center;gap:20px}header img{width:65px;background:white;border-radius:10px;padding:7px}header h1{margin:0;font-size:25px}header small{color:#dce5f6}.toolbar{padding:14px 5%;display:flex;gap:9px;flex-wrap:wrap;background:#fff;border-bottom:1px solid #dae0e7}.toolbar button{border:0;border-radius:9px;background:#142B5F;color:#fff;padding:10px 18px;cursor:pointer;font:inherit}.toolbar .accent{background:#8F1D3F}.wrap{max-width:980px;margin:auto;padding:28px 20px}.section{background:white;border:1px solid #d9e0ea;border-radius:14px;padding:20px;margin:16px 0;break-inside:avoid-page}.section h2{margin:0 0 16px;color:#8F1D3F;font-size:20px;border-bottom:2px solid #f1e0e7;padding-bottom:9px}.section.training h2{color:#142B5F;border-color:#e4e9f5}.fieldgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.fieldgrid div{background:#f8f5f7;padding:8px 12px;border-radius:8px}.fieldgrid small{display:block;color:#606775}.fieldgrid b{overflow-wrap:anywhere}.entry{margin:12px 0;padding:12px 15px;background:#f8fafc;border:1px solid #e4e8ef;border-radius:8px;break-inside:avoid-page}.entry h3{font-size:16px;margin:0;color:#142B5F}.entry h3 span{font-size:12px;font-weight:normal;color:#667}.answer{background:#fff;border-right:4px solid #8F1D3F;padding:10px;margin:8px 0}.answer pre,.details pre,.data pre{white-space:pre-wrap;overflow-wrap:anywhere;font-family:inherit;font-size:13px}.answer p{margin:5px 0}.footnote{color:#657080;font-size:12px}.copyArea{display:none;width:100%;min-height:250px}body.showText .copyArea{display:block}.warn{background:#fff3dc;border-radius:9px;padding:12px}@media print{body{background:white}header{color:#142B5F;background:white;border-bottom:3px solid #8F1D3F;padding:0 0 10px}header small{color:#142B5F}.toolbar,.copyArea{display:none!important}.wrap{padding:0}.section{box-shadow:none;border:0;padding:7px 0;margin:11px 0;break-inside:auto}.entry{break-inside:avoid-page}.section h2{font-size:17px}.fieldgrid{grid-template-columns:repeat(2,1fr)}}';
 return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>LexLearn — تقرير الطالب '+escapeHTML(p.username)+'</title><style>'+style+'</style></head><body>'+
 '<header><img src="'+escapeHTML(imageUrl)+'" alt="LexLearn"><div><h1>تقرير الطالب التعليمي — LexLearn</h1><small>تقرير قابل للطباعة والتوثيق | '+escapeHTML(fmtDate(d.generated_at))+'</small></div></header>'+
 '<div class="toolbar"><button id="printPdf">طباعة / حفظ PDF</button><button class="accent" id="copyText">نسخ التقرير كنص</button><button id="saveText">حفظ ملف نصي</button><button id="toggleText">إظهار النص</button></div>'+
 '<main class="wrap"><p class="footnote">تقرير إداري مستخرج من السجلات التعليمية المتاحة للمشرف. المؤشرات الآلية أولية وليست درجات جامعية معتمدة.</p>'+
 (d.truncated&&d.truncated.length?'<p class="warn">تنبيه: تم تجاوز حد تصدير بعض الجداول. يلزم استكمال الأرشفة قبل حذف الطالب.</p>':'')+
 section("01 — بيانات الطالب",html)+
 section("ملخص النشاط التعليمي",
   '<div class="fieldgrid"><div><small>إجمالي المحاولات</small><b>'+arr.length+'</b></div>'+
   '<div><small>محاولات بتقدير مسجل</small><b>'+arr.filter(function(a){return a.score!=null;}).length+'</b></div>'+
   '<div><small>مراجعات المشرف</small><b>'+(records.pilot_human_grades||[]).length+'</b></div>'+
   '<div><small>تاريخ آخر محاولة</small><b>'+escapeHTML(fmtDate(arr.length?arr.slice().sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at);})[0].created_at:null))+'</b></div></div>'+
   '<p class="footnote">ملخص وصفي للسجلات المتاحة، لا يثبت تحسنًا أكاديميًا ولا يعادل اعتماد الدرجة.</p>',
   "training")+
 section("المقررات المسجلة",enroll)+
 section("02 — الاختبارات والإجابات ("+arr.length+")",tests,"training")+
 other("ملخصات التقدم والتدريب","learner_snapshots")+
 other("خطط التدريب الشخصية","learning_plans")+
 other("أدلة التقييم","mastery_evidence")+
 other("المراجعات المجدولة","reviews")+
 other("سجل عمليات التصحيح الآلي","ai_grading_runs")+
 section("03 — التشخيص الرسمي: الإجابات والنتيجة", (records.student_diagnostic_runs||[]).map(function(x,i){
  return '<article class="entry"><h3>اختبار تشخيصي '+(i+1)+'</h3><p>الحالة: '+escapeHTML(str(x.status))+' • تاريخ الانتهاء: '+escapeHTML(fmtDate(x.completed_at))+'</p>'+
   '<p><b>الإجابات الموضوعية:</b></p><pre>'+escapeHTML(JSON.stringify(x.answers||{},null,2))+'</pre>'+
   '<p><b>الإجابة الحرة:</b></p><pre>'+escapeHTML(str(x.free_text))+'</pre>'+
   '<p><b>التقييم:</b></p><pre>'+escapeHTML(JSON.stringify(x.result||{},null,2))+'</pre>'+
   '<p><b>خطة التعلم:</b></p><pre>'+escapeHTML(JSON.stringify(x.training_plan||{},null,2))+'</pre></article>';
 }).join("")||'<p>لا يوجد تشخيص رسمي محفوظ.</p>',"training")+
 section("04 — جلسات التدريب الثلاثون", (records.student_training_sessions||[]).map(function(x){
  return '<article class="entry"><h3>الجلسة '+escapeHTML(str(x.session_number))+'</h3><p>البداية: '+escapeHTML(fmtDate(x.started_at))+' • النهاية: '+escapeHTML(fmtDate(x.completed_at))+'</p><pre>'+escapeHTML(JSON.stringify(x.tasks_json||[],null,2))+'</pre></article>';
 }).join("")||'<p>لم تُفتح جلسات مسجلة.</p>',"training")+
 section("05 — جميع إجابات المسار الرسمي", (records.student_training_answers||[]).map(function(x,i){
  return '<article class="entry"><h3>إجابة '+(i+1)+' — الجلسة '+escapeHTML(str(x.session_number))+'</h3><p>المهارة: '+escapeHTML(label(x.dimension))+' • السؤال: '+escapeHTML(str(x.item_id))+' • '+escapeHTML(fmtDate(x.submitted_at))+'</p><div class="answer"><pre>'+escapeHTML(str(x.answer_text))+'</pre></div><p>تفاصيل التقييم:</p><pre>'+escapeHTML(JSON.stringify(x.evaluation||{},null,2))+'</pre></article>';
 }).join("")||'<p>لا توجد إجابات للجلسات.</p>',"training")+
 other("إجابات مسار المستويات الأخرى","student_level_responses")+
 other("الموافقات البحثية","consent_records")+
 other("تدخلات الإدارة في حساب الطالب","admin_audit")+
 '<p class="footnote">رقم الحساب: '+escapeHTML(p.id)+' | تاريخ الاستخراج: '+escapeHTML(d.generated_at)+'</p><textarea class="copyArea" id="fullReportText" readonly>'+escapeHTML(raw)+'</textarea></main></body></html>';
}
async function open(userId){
 var w=root.open("","_blank");
 if(!w){alert("اسمح بالنوافذ المنبثقة لإنشاء تقرير الطالب PDF.");return;}
 w.document.write('<html lang="ar" dir="rtl"><meta charset="utf-8"><title>تقرير LexLearn</title><body style="font-family:Tahoma"><h3>جارٍ إعداد ملف الطالب...</h3></body></html>');
 try{
  var db=root.LEX_CLOUD.db(),res=await db.functions.invoke("admin-export-student",{body:{user_id:userId}});
  if(res.error||!res.data||res.data.ok!==true)throw new Error(res.data&&res.data.error||res.error&&res.error.message||"تعذر استخراج التقرير");
  var d=res.data,raw=buildText(d),html=render(d,raw);w.document.open();w.document.write(html);w.document.close();
  w.document.getElementById("printPdf").onclick=function(){w.focus();w.print();};
  w.document.getElementById("copyText").onclick=async function(){
   try{await w.navigator.clipboard.writeText(raw);this.textContent="تم النسخ";}catch(e){w.document.body.classList.add("showText");var box=w.document.getElementById("fullReportText");box.focus();box.select();this.textContent="انسخ النص المحدد";}
  };
  w.document.getElementById("toggleText").onclick=function(){w.document.body.classList.toggle("showText");};
  w.document.getElementById("saveText").onclick=function(){
   var blob=new Blob(["\ufeff"+raw],{type:"text/plain;charset=utf-8"}),link=w.document.createElement("a"),url=URL.createObjectURL(blob);
   link.href=url;link.download="LexLearn-"+(d.student.username||"student")+"-report.txt";w.document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);
  };
 }catch(e){w.document.body.textContent="تعذر إنشاء تقرير الطالب: "+(e&&e.message||e);}
}
root.LEX_STUDENT_REPORT={open:open};
})(window);