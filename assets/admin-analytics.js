(function(){
"use strict";
var report=document.getElementById("statsReport"),status=document.getElementById("statsStatus"),period=document.getElementById("statsPeriod"),refresh=document.getElementById("statsRefresh"),page=0;
var esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
var number=v=>Number(v||0).toLocaleString("ar");
var date=v=>v?new Date(v).toLocaleString("ar",{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}):"—";
var pages={"index.html":"الرئيسية — عربي","index-en.html":"الرئيسية — إنجليزي","conference.html":"صفحة المؤتمر","student.html":"حساب الطالب","student-en.html":"حساب الطالب — إنجليزي","student-path.html":"مسار التدريب","student-practice.html":"التدريب","diagnostic.html":"التقييم التشخيصي","showcase.html":"التجربة العامة","showcase-en.html":"التجربة — إنجليزي","student-register.html":"تسجيل الطالب","student-login.html":"دخول الطالب"};
function metric(label,value,note){return '<div class="metric"><span>'+label+'</span><strong>'+number(value)+'</strong><small>'+note+'</small></div>';}
function render(d){
 var max=Math.max(1,...d.daily.map(x=>Number(x.visits)));
 report.innerHTML='<section class="panel analyticsNotice"><p>بدأ قياس الزيارات في <b>'+esc(date(d.started_at))+'</b>. الفترة المعروضة تبدأ من '+esc(date(d.since))+'. الأوقات بتوقيت UTC.</p><p class="hint">الزائر الفريد هو متصفح تقريبي؛ قد يُحسب الشخص أكثر من مرة عند تغيير الجهاز أو مسح التخزين. تبدأ زيارة جديدة بعد انقطاع بين الصفحات يتجاوز ٣٠ دقيقة. لا تشمل الأرقام المتصفحات التي تمنع القياس أو الزيارات السابقة لتفعيله.</p></section>'+
 '<section class="analyticsKpis" aria-label="مؤشرات الزيارات">'+metric('الزوار الفريدون',d.visitors,'متصفحات خلال الفترة')+metric('الزيارات',d.visits,'جلسات تصفح خلال الفترة')+metric('مشاهدات الصفحات',d.views,'يشمل إعادة فتح الصفحة')+metric('الزوار العائدون',d.returning_visitors,'أكثر من زيارة في الفترة')+metric('الطلاب المشتركون',d.registered_students,'كل الحسابات المسجلة؛ '+number(d.active_students)+' مفعّل')+metric('الأساتذة المسجلون',d.registered_instructors,'كل حسابات الأساتذة')+metric('طلاب جدد',d.new_students,'حسابات أنشئت خلال الفترة')+metric('حسابات استخدمت الموقع',d.active_accounts,'زيارات مسجلة أثناء الدخول')+'</section>'+
 '<p class="hint">المشتركون هنا هم أصحاب الحسابات المسجلة، ولا تعني الأرقام اشتراكات مدفوعة. لا تقيس الزيارة إكمال التدريب أو جودة التعلم.</p>'+
 '<section class="panel"><h2>الزيارات يومًا بيوم</h2><div class="analyticsTrend">'+d.daily.map(x=>'<div class="analyticsDay"><time>'+esc(x.day)+'</time><div class="bar" aria-hidden="true"><span style="width:'+Math.round(Number(x.visits)/max*100)+'%"></span></div><b>'+number(x.visits)+' زيارة</b></div>').join('')+'</div></section>'+
 '<section class="panel"><h2>أكثر الصفحات زيارة</h2>'+(d.pages.length?'<div class="tableScroll"><table class="dataTable analyticsTable"><thead><tr><th>الصفحة</th><th>المشاهدات</th><th>الزوار الفريدون</th></tr></thead><tbody>'+d.pages.map(x=>'<tr><td>'+esc(pages[x.page]||x.page)+'</td><td>'+number(x.views)+'</td><td>'+number(x.visitors)+'</td></tr>').join('')+'</tbody></table></div>':'<p>لا توجد زيارات مسجلة في هذه الفترة بعد.</p>')+'</section>'+
 '<section class="panel"><h2>دخول الحسابات وتكرار الزيارة</h2><p class="hint">«آخر تسجيل دخول» من خدمة الحسابات وقد يسبق تفعيل العداد. «الزيارات» و«آخر نشاط» من القياس الجديد خلال الفترة المختارة. الصفر لا يعني أن صاحب الحساب لم يدخل سابقًا.</p><div class="tableScroll"><table class="dataTable analyticsTable"><caption>'+number(d.account_total)+' حساب طالب أو دكتور — ٢٥ حسابًا كحد أقصى لكل صفحة</caption><thead><tr><th>الحساب</th><th>الحالة</th><th>آخر تسجيل دخول</th><th>زيارات الفترة</th><th>آخر نشاط مسجل</th></tr></thead><tbody>'+d.accounts.map(x=>'<tr><td class="analyticsAccountName"><b>'+esc(x.display_name||x.username||'بدون اسم')+'</b><br><small>'+esc(x.role==='instructor'?'دكتور':'طالب')+(x.username?' • '+esc(x.username):'')+'</small></td><td>'+(x.active?'مفعّل':x.account_status==='pending'?'بانتظار الاعتماد':'غير مفعّل')+'</td><td>'+esc(x.login_available?(x.last_sign_in_at?date(x.last_sign_in_at):'لم يسجّل الدخول بعد'):'تعذر جلب آخر دخول')+'</td><td>'+number(x.visits)+'</td><td>'+esc(date(x.last_seen))+'</td></tr>').join('')+'</tbody></table></div><div class="analyticsPagination"><button id="statsPrev" class="secondary" '+(page===0?'disabled':'')+'>السابق</button><span>صفحة '+number(page+1)+'</span><button id="statsNext" class="secondary" '+((page+1)*25>=d.account_total?'disabled':'')+'>التالي</button></div></section>';
 document.getElementById("statsPrev").onclick=()=>{page--;load();};document.getElementById("statsNext").onclick=()=>{page++;load();};
}
async function load(){
 refresh.disabled=true;period.disabled=true;report.innerHTML='';status.textContent='جارٍ تحميل الإحصاءات…';
 try{
  var me=await LEX_CLOUD.profile();
  if(!me||!['owner','admin'].includes(me.role)||me.active!==true)throw Error('FORBIDDEN');
  var r=await LEX_CLOUD.db().functions.invoke('admin-site-stats',{body:{days:Number(period.value),page:page}});
  if(r.error||!r.data?.ok)throw r.error||Error(r.data?.error||'unavailable');
  render(r.data);status.textContent='آخر تحديث: '+date(r.data.until);
 }catch(e){
  status.textContent=e.message==='FORBIDDEN'?'هذه الإحصاءات متاحة للمشرف المفوّض ومالك المنصة فقط.':'تعذر تحميل الإحصاءات. لا توجد أرقام مؤكدة لعرضها الآن؛ حاول التحديث.';
  report.innerHTML='<section class="panel"><a href="admin-login.html">تسجيل دخول المشرف</a></section>';
 }finally{refresh.disabled=false;period.disabled=false;}
}
period.onchange=()=>{page=0;load();};refresh.onclick=load;load();
})();
