/* Supervisor-only site metrics and per-account attendance. Never expose raw answers. */
(function(){
"use strict";
var report=document.getElementById("statsReport"),status=document.getElementById("statsStatus"),
    period=document.getElementById("statsPeriod"),refresh=document.getElementById("statsRefresh"),page=0;
var esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
var number=v=>Number(v||0).toLocaleString("ar-EG");
var date=v=>v?new Date(v).toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Cairo"}):"—";
var duration=v=>{
 var n=Math.max(0,Math.floor(Number(v)||0));
 if(n===0)return "غير كافية للقياس";
 var h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;
 return [h?h+" س":null,m?m+" د":null,!h&&!m?s+" ث":null].filter(Boolean).join(" ");
};
var pages={"index.html":"الرئيسية — عربي","index-en.html":"الرئيسية — إنجليزي",
 "conference.html":"صفحة المؤتمر","student.html":"حساب الطالب","student-en.html":"حساب الطالب — إنجليزي",
 "student-path.html":"مسار التدريب","student-practice.html":"التدريب","diagnostic.html":"التقييم التشخيصي",
 "showcase.html":"التجربة العامة","showcase-en.html":"التجربة — إنجليزي",
 "student-register.html":"تسجيل الطالب","student-login.html":"دخول الطالب","instructor.html":"لوحة الأستاذ الجامعي"};
function metric(label,value,note){return '<div class="metric"><span>'+label+'</span><strong>'+number(value)+'</strong><small>'+note+'</small></div>';}
function sessionRows(items){
 return items.map(x=>'<tr><td>'+esc(date(x.started_at))+'</td><td>'+esc(date(x.last_activity_at))+'</td>'+
 '<td>'+esc(duration(x.active_seconds))+'</td><td>'+number(x.page_count)+'</td></tr>').join("");
}
async function showSessions(id,label,sessionPage){
 var slot=document.getElementById("accountSessions");if(!slot)return;
 slot.innerHTML='<section class="panel"><h2>سجل نشاط '+esc(label)+'</h2><p>جارٍ جلب جلسات الاستخدام…</p></section>';
 try{
  var r=await LEX_CLOUD.db().functions.invoke("admin-site-stats",{body:{days:Number(period.value),account_id:id,session_page:sessionPage}});
  if(r.error||!r.data?.ok||!Array.isArray(r.data.sessions))throw Error("unavailable");
  var data=r.data;
  slot.innerHTML='<section class="panel analyticsSessionDetails"><div class="toolbar"><div><h2>سجل الاستخدام — '+esc(label)+'</h2>'+
   '<p class="hint">إجمالي '+number(data.total_sessions)+' فترة نشاط مسجلة، ومدة استخدام تقديرية '+esc(duration(data.total_seconds))+' خلال المدة المختارة.</p></div>'+
   '<button type="button" class="secondary" id="sessionsClose">إغلاق</button></div>'+
   '<p class="hint">بداية الجلسة تعني أول نشاط رصده النظام، وليس بالضرورة لحظة إدخال كلمة المرور. المدة محسوبة من نبضات النشاط المتقاربة؛ الخمول والصفحات المخفية لا تُحتسب. التوقيت: القاهرة.</p>'+
   (data.sessions.length?'<div class="tableScroll"><table class="dataTable analyticsTable"><thead><tr><th>بداية الجلسة (اليوم والساعة)</th><th>آخر نشاط</th><th>المدة التقريبية</th><th>عدد الصفحات</th></tr></thead><tbody>'+sessionRows(data.sessions)+'</tbody></table></div>':'<p>لا توجد جلسات استخدام مسجلة لهذا الحساب خلال الفترة المختارة.</p>')+
   '<div class="analyticsPagination"><button type="button" class="secondary" id="sessionsPrev" '+(sessionPage===0?'disabled':'')+'>السابق</button>'+
   '<span>صفحة '+number(sessionPage+1)+'</span>'+
   '<button type="button" class="secondary" id="sessionsNext" '+((sessionPage+1)*20>=data.total_sessions?'disabled':'')+'>التالي</button></div></section>';
  document.getElementById("sessionsClose").onclick=()=>{slot.innerHTML="";};
  document.getElementById("sessionsPrev").onclick=()=>showSessions(id,label,sessionPage-1);
  document.getElementById("sessionsNext").onclick=()=>showSessions(id,label,sessionPage+1);
  slot.scrollIntoView({block:"nearest",behavior:"smooth"});
 }catch(_){
  slot.innerHTML='<section class="panel"><p>تعذر عرض سجل الجلسات؛ لم نعرض بيانات غير مؤكدة.</p><button class="secondary" id="sessionsClose">إغلاق</button></section>';
  document.getElementById("sessionsClose").onclick=()=>{slot.innerHTML="";};
 }
}
function render(d){
 var daily=Array.isArray(d.daily)?d.daily:[],accounts=Array.isArray(d.accounts)?d.accounts:[],popular=Array.isArray(d.pages)?d.pages:[];
 var max=Math.max(1,...daily.map(x=>Number(x.visits)));
 report.innerHTML='<section class="panel analyticsNotice"><p>بدأ تسجيل الزيارات في <b>'+esc(date(d.started_at))+'</b>. الفترة المعروضة تبدأ من '+esc(date(d.since))+'. جميع المواعيد بتوقيت القاهرة.</p>'+
 '<p class="hint">المدة المعروضة تقديرية من تتابع نبضات النشاط؛ لا يمكن احتساب مدة دقيقة من سجل دخول واحد أو من زيارات سابقة لتفعيل القياس. يتوقف التتبع عند إخفاء الصفحة أو تجاوز خمس دقائق دون تفاعل. يحترم إعدادات عدم التتبع.</p></section>'+
 '<section class="analyticsKpis" aria-label="مؤشرات الزيارات">'+metric('الزوار الفريدون',d.visitors,'متصفحات خلال الفترة')+
 metric('الزيارات',d.visits,'جلسات تصفح خلال الفترة')+metric('مشاهدات الصفحات',d.views,'لا تشمل نبضات النشاط')+
 metric('الزوار العائدون',d.returning_visitors,'أكثر من زيارة في الفترة')+
 metric('الطلاب المشتركون',d.registered_students,'حسابات مسجلة؛ '+number(d.active_students)+' مفعّل')+
 metric('الأساتذة المسجلون',d.registered_instructors,'كل حسابات الأساتذة')+
 metric('طلاب جدد',d.new_students,'حسابات أنشئت خلال الفترة')+
 metric('حسابات استخدمت الموقع',d.active_accounts,'نشاط مسجل أثناء الدخول')+'</section>'+
 '<p class="hint">الزوار الفريدون تقدير بحسب المتصفح، ومشاهدات الصفحات تُحصي فتح الصفحات ولا تشمل نبضات قياس الوقت. الاشتراك هنا هو التسجيل لا الدفع.</p>'+
 '<section class="panel"><h2>النشاط يومًا بيوم</h2><div class="analyticsTrend">'+daily.map(x=>'<div class="analyticsDay"><time>'+esc(x.day)+'</time><div class="bar" aria-hidden="true"><span style="width:'+Math.round(Number(x.visits)/max*100)+'%"></span></div><b>'+number(x.visits)+' زيارة</b></div>').join("")+'</div></section>'+
 '<section class="panel"><h2>أكثر الصفحات نشاطًا</h2>'+(popular.length?'<div class="tableScroll"><table class="dataTable analyticsTable"><thead><tr><th>الصفحة</th><th>قياسات النشاط</th><th>المتصفحات</th></tr></thead><tbody>'+popular.map(x=>'<tr><td>'+esc(pages[x.page]||x.page)+'</td><td>'+number(x.views)+'</td><td>'+number(x.visitors)+'</td></tr>').join("")+'</tbody></table></div>':'<p>لا يوجد نشاط مسجل خلال الفترة.</p>')+'</section>'+
 '<section class="panel"><h2>سجل حضور الطلاب والأساتذة</h2>'+
 '<p class="hint">المعلومات التالية للمشرف المفوّض فقط. «آخر دخول» من خدمة الحسابات؛ أما توقيت النشاط والمدة فمن عداد الاستخدام، وقد لا يشمل كل الزيارات.</p>'+
 '<div class="tableScroll"><table class="dataTable analyticsTable"><caption>'+number(d.account_total)+' حساب طالب أو أستاذ — ٢٥ حسابًا لكل صفحة</caption>'+
 '<thead><tr><th>الحساب</th><th>الحالة</th><th>آخر تسجيل دخول</th><th>أيام النشاط</th><th>جلسات الفترة</th><th>مدة الاستخدام</th><th>آخر نشاط</th><th>تفاصيل</th></tr></thead><tbody>'+
 accounts.map(x=>'<tr><td class="analyticsAccountName"><b>'+esc(x.display_name||x.username||"بدون اسم")+'</b><br><small>'+esc(x.role==="instructor"?"أستاذ جامعي":"طالب")+(x.username?' • '+esc(x.username):'')+'</small></td>'+
 '<td>'+(x.active?'مفعّل':x.account_status==='pending'?'بانتظار الاعتماد':'غير مفعّل')+'</td>'+
 '<td>'+esc(x.login_available?(x.last_sign_in_at?date(x.last_sign_in_at):'لم يسجّل الدخول بعد'):'تعذر جلب آخر دخول')+'</td>'+
 '<td>'+number(x.active_days)+'</td><td>'+number(x.visits)+'</td><td>'+esc(duration(x.active_seconds))+'</td><td>'+esc(date(x.last_seen))+'</td>'+
 '<td><button class="secondary" type="button" data-account-session="'+esc(x.id)+'">الأيام والساعات</button></td></tr>').join("")+
 '</tbody></table></div><div class="analyticsPagination"><button id="statsPrev" class="secondary" '+(page===0?'disabled':'')+'>السابق</button>'+
 '<span>صفحة '+number(page+1)+'</span><button id="statsNext" class="secondary" '+((page+1)*25>=d.account_total?'disabled':'')+'>التالي</button></div></section><div id="accountSessions" aria-live="polite"></div>';
 document.getElementById("statsPrev").onclick=()=>{page--;load();};
 document.getElementById("statsNext").onclick=()=>{page++;load();};
 document.querySelectorAll("[data-account-session]").forEach(b=>{
  b.onclick=()=>{var account=accounts.find(x=>x.id===b.dataset.accountSession);if(account)showSessions(account.id,account.display_name||account.username||"الحساب",0);};
 });
}
async function load(){
 refresh.disabled=true;period.disabled=true;report.innerHTML="";status.textContent="جارٍ تحميل الإحصاءات…";
 try{
  var me=await LEX_CLOUD.profile();
  if(!me||!["owner","admin"].includes(me.role)||me.active!==true)throw Error("FORBIDDEN");
  var r=await LEX_CLOUD.db().functions.invoke("admin-site-stats",{body:{days:Number(period.value),page:page}});
  if(r.error||!r.data?.ok)throw r.error||Error(r.data?.error||"unavailable");
  render(r.data);status.textContent="آخر تحديث: "+date(r.data.until);
 }catch(e){
  status.textContent=e.message==="FORBIDDEN"?"هذه الإحصاءات متاحة للمشرف المفوّض ومالك المنصة فقط.":"تعذر تحميل الإحصاءات. لا توجد أرقام مؤكدة لعرضها الآن؛ حاول التحديث.";
  report.innerHTML='<section class="panel"><a href="admin-login.html">تسجيل دخول المشرف</a></section>';
 }finally{refresh.disabled=false;period.disabled=false;}
}
period.onchange=()=>{page=0;load();};refresh.onclick=load;load();
})();
