(function(){
"use strict";
var APP=document.getElementById("adminApp");
var SKEY="lexlearn_admin_session";
var ss=null;try{ss=JSON.parse(localStorage.getItem(SKEY)||"null");}catch(e){}
if(!ss||!ss.cloud||!window.LEX_CLOUD||!LEX_CLOUD.isConfigured()){location.replace("admin-login.html");return;}
var state={tab:"dashboard",students:[],cohorts:[],audit:[],content:[],snapshots:[],attempts:[],selected:null,q:"",busy:false,error:"",creds:null};

function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c];});}
function ico(n){var p={chart:'<path d="M12 50h40M17 43V29M28 43V19M39 43V34M50 43V13"/>',users:'<circle cx="23" cy="22" r="8"/><circle cx="44" cy="25" r="6"/><path d="M9 50c2-10 8-15 14-15s12 5 14 15M38 39c7 0 12 4 14 11"/>',group:'<circle cx="22" cy="23" r="7"/><circle cx="42" cy="23" r="7"/><path d="M8 49c2-10 7-15 14-15s12 5 14 15M28 49c2-10 7-15 14-15s12 5 14 15"/>',audit:'<path d="M17 10h30v44H17z"/><path d="M24 21h16M24 29h16M24 37h11"/>',plus:'<path d="M32 13v38M13 32h38"/>',key:'<path d="M10 35a12 12 0 1 0 18-10l22-11 5 5-4 7-7-1-2 7-7-1-6 4"/>'};return '<svg class="uiIcon" viewBox="0 0 64 64">'+(p[n]||p.chart)+'</svg>';}
function label(k){return({recall:"الحفظ",understanding:"الفهم",application:"التطبيق على الوقائع",legal_precision:"الدقة القانونية",retention:"ثبات المعلومة",exam:"الأداء الامتحاني"})[k]||k;}
function countryName(c){return c==="eg"?"مصر":"قطر";}
function courseKey(s){var country=s.country||"qa";return country+"-"+(country==="qa"?"rights":"sources");}
function profileSnap(id,country){country=country||"qa";var key=country+"-"+(country==="qa"?"rights":"sources");return state.snapshots.find(function(x){return x.user_id===id&&x.course_id===key&&x.snapshot_type==="profile";});}
function courseSnap(id,country){country=country||"qa";var key=country+"-"+(country==="qa"?"rights":"sources");return state.snapshots.find(function(x){return x.user_id===id&&x.course_id===key&&x.snapshot_type==="course";});}
function view(s){
 var ps=profileSnap(s.id,s.country),cs=courseSnap(s.id,s.country),profile=ps&&ps.state||{results:{}},course=cs&&cs.state||{};
 var res=profile.results&&profile.results[courseKey(s)]||{},base=res.metrics||{};
 var model=course.adaptiveModel||res.adaptiveModel||{},m={};
 ["recall","understanding","application","legal_precision","retention","exam"].forEach(function(k){
   var axis=model.axes&&model.axes[k];
   m[k]=(axis&&axis.evidence>0&&axis.value!=null)?axis.value:(base[k]==null?null:base[k]);
 });
 return {s:s,m:m,model:model,course:course,completed:(course.completed||[]).length,session:Number(course.session)||1,errors:course.errors||[],profileUpdated:ps&&ps.updated_at||null,courseUpdated:cs&&cs.updated_at||null};
}
function risk(v){
 var vals=["recall","understanding","application","legal_precision","retention","exam"].map(function(k){return v.m[k];}).filter(function(x){return x!=null;});
 if(!vals.length)return "none";
 var min=Math.min.apply(null,vals);
 var highConfidenceWrong=(state.attempts||[]).some(function(a){return a.user_id===v.s.id&&a.confidence===3&&a.score!=null&&Number(a.score)<.55;});
 return min<45||highConfidenceWrong?"high":min<65?"mid":"low";
}
function rlabel(r){return r==="high"?"عاجل":r==="mid"?"متابعة":r==="low"?"مستقر":"لم يبدأ";}
function metric(k,v,meta){
 var t=v==null?"—":Math.round(v)+"%";
 var note=meta&&meta.status?meta.status:(v==null?"لم يُقَس":v>=80?"قوي":v>=60?"نامٍ":"أولوية");
 return '<div class="metric"><span>'+label(k)+'</span><b>'+t+'</b><small>'+esc(note)+'</small><div class="bar"><i style="width:'+(v==null?3:Math.max(3,Math.min(100,v)))+'%"></i></div></div>';
}
function modelText(v){
 if(v.model&&v.model.bridge&&v.model.bridge.label)return v.model.bridge.label;
 var entries=["recall","understanding","application","legal_precision","retention","exam"].filter(function(k){return v.m[k]!=null;}).sort(function(a,b){return v.m[a]-v.m[b];});
 return entries.length?"الأولوية الحالية: "+label(entries[0]):"يحتاج تقييمًا تشخيصيًا أولًا.";
}
function adminAdvice(v){
 var keys=["recall","understanding","application","legal_precision","retention","exam"];
 var livePlan=v.course&&v.course.teachingPlan||null;
 var essay=v.course&&v.course.lastEssayProfile||null;
 var measured=keys.filter(function(k){return v.m[k]!=null;}).sort(function(a,b){return v.m[a]-v.m[b];});
 if(!measured.length)return {
   summary:"لا توجد نتائج حقيقية لهذا الطالب حتى الآن. اطلب منه إكمال التقييم التشخيصي من حسابه المسجل.",
   advice:"لا تتخذ قرار تدريب قبل ظهور بيانات الطالب المركزية.",
   watch:"بعد التقييم، راقب أول جلستين للتأكد من أن البرنامج يتغير وفق الأداء."
 };
 var weak=measured[0],strong=measured[measured.length-1],gap=Math.round((v.m[strong]||0)-(v.m[weak]||0));
 var errs=(v.errors||[]).slice().sort(function(a,b){return (b.count||0)-(a.count||0);}),topErr=errs[0];
 var attempts=(state.attempts||[]).filter(function(a){return a.user_id===v.s.id;}),highConf=attempts.filter(function(a){return Number(a.confidence)===3&&a.score!=null&&Number(a.score)<.55;}).length;
 var summary="أقوى جانب حاليًا: "+label(strong)+" ("+Math.round(v.m[strong])+"%). أولوية التحسين: "+label(weak)+" ("+Math.round(v.m[weak])+"%).";
 if(gap>=20)summary+=" الفجوة بينهما واضحة ("+gap+" نقطة)، لذلك لا يُفضّل إعطاء تدريب عام موحد.";
 if(topErr)summary+=" أكثر خطأ متكرر: «"+topErr.label+"»"+(topErr.count?" ("+topErr.count+" مرات).":".");
 if(highConf)summary+=" توجد "+highConf+" محاولة خاطئة بثقة مرتفعة؛ راجع الفهم قبل زيادة الصعوبة.";
 var adviceMap={
   recall:"اختبر الحفظ من غير فتح النص، ثم استخدم مراجعة متباعدة بدل إعادة الشرح الكامل.",
   understanding:"اطلب من الطالب تفسير «لماذا» تعمل القاعدة وربط كل عنصر بأثره القانوني قبل الانتقال للحفظ.",
   application:"قلّل الشرح النظري وزِد مسائل اكتشف الواقعة الحاسمة وغيّر واقعة واحدة؛ يحدد الطالب أولًا الواقعة الحاسمة ثم يطبق القاعدة.",
   legal_precision:"استخدم اكتشف العنصر الناقص والمقارنات بين صيغ متقاربة، واطلب تحديد اللفظ الذي يغيّر التكييف أو النتيجة.",
   retention:"حوّل ما يفهمه الطالب إلى مفاتيح ذاكرة قصيرة، ثم اختبره بعد فاصل زمني بدل المراجعة الفورية.",
   exam:"درّبه على قالب ثابت: المسألة → القاعدة → العناصر → التطبيق → النتيجة، مع إجابات قصيرة تحت وقت."
 };
 var watch="راقب "+label(weak)+" في الجلستين القادمتين";
 if(topErr)watch+="، وهل يقل تكرار خطأ «"+topErr.label+"»";
 watch+=". إذا لم يظهر تحسن، استخدم «جلسة تثبيت» قبل فتح مستوى أصعب.";
 var systemAdvice=livePlan&&livePlan.method?livePlan.method:(adviceMap[weak]||modelText(v));
 if(essay&&essay.note)summary+=" آخر فحص مقالي أولي (راجع الإجابة قبل اعتماد النتيجة): "+essay.note;
 if(livePlan&&livePlan.tasks&&livePlan.tasks.length)watch+=" المهام التي سيطبقها النظام تلقائيًا: "+livePlan.tasks.join("، ")+".";
 if(essay&&essay.checks)systemAdvice+=" العناصر التي تحتاج مراجعة: "+essay.checks.filter(function(c){return !c.matched;}).map(function(c){return c.label;}).join("، ")+". النتائج اللفظية مؤشرات أولية وليست تصحيحًا دلاليًا معتمدًا.";
 return {summary:summary,advice:systemAdvice,watch:watch,plan:livePlan,essay:essay};
}
function shell(body){
 APP.innerHTML='<header class="top"><div class="topin"><div class="brand"><div class="mark"><img src="assets/lexlearn-logo.svg" alt="LexLearn"></div><div><b>LexLearn Admin</b><small>قاعدة بيانات مركزية</small></div></div>'+
 '<nav class="nav"><button data-tab="dashboard" class="'+(state.tab==="dashboard"?"active":"")+'">'+ico("chart")+'<span>الرئيسية</span></button><button data-tab="students" class="'+(state.tab==="students"?"active":"")+'">'+ico("users")+'<span>الطلاب</span></button><button data-tab="cohorts" class="'+(state.tab==="cohorts"?"active":"")+'">'+ico("group")+'<span>المجموعات</span></button><button data-tab="content" class="'+(state.tab==="content"?"active":"")+'">'+ico("audit")+'<span>المحتوى</span></button><button data-tab="audit" class="'+(state.tab==="audit"?"active":"")+'">'+ico("audit")+'<span>السجل</span></button></nav>'+
 '<div class="topActions"><span class="topLink">● مركزي</span><a class="topLink" href="index.html">الموقع</a><button class="topLink" id="logout">خروج</button></div></div></header><main class="wrap">'+body+'</main>'+modal();
 document.querySelectorAll("[data-tab]").forEach(function(b){b.onclick=function(){state.tab=b.dataset.tab;render();};});
 var lo=document.getElementById("logout");if(lo)lo.onclick=async function(){await LEX_CLOUD.signOut();localStorage.removeItem(SKEY);location.replace("admin-login.html");};
 bind();
}
function kpis(){
 var a=state.students.filter(function(s){return s.active!==false;}).map(view);
 return '<section class="kpis"><div><span>الطلاب النشطون</span><b>'+a.length+'</b></div><div><span>بدأوا القياس</span><b>'+a.filter(function(v){return Object.keys(v.m).some(function(k){return v.m[k]!=null;});}).length+'</b></div><div><span>متابعة عاجلة</span><b>'+a.filter(function(v){return risk(v)==="high";}).length+'</b></div><div><span>أكملوا البرنامج</span><b>'+a.filter(function(v){return v.course.completedProgram;}).length+'</b></div></section>';
}
function studentList(){
 var q=state.q.trim().toLowerCase();
 return state.students.filter(function(s){return !q||String(s.name+" "+s.username+" "+s.cohort).toLowerCase().indexOf(q)>=0;});
}
function detail(v){
 var s=v.s,r=risk(v),axes=v.model.axes||{},advice=adminAdvice(v),lastUpdate=v.courseUpdated||v.profileUpdated;
 return '<section class="panel studentHero"><div><span class="overline">'+esc(s.cohort||"بدون مجموعة")+'</span><h2>'+esc(s.name||s.username)+'</h2><p>@'+esc(s.username)+' • '+countryName(s.country)+' • '+esc(s.university||"—")+' • '+esc(s.year||"—")+'</p></div><span class="risk big '+r+'">'+rlabel(r)+'</span></section>'+
 '<section class="panel metricsPanel"><div class="panelHead"><div><h3>الملف التكيفي</h3><p>'+esc(modelText(v))+'</p></div><span class="realTag">Central DB</span></div><div class="metricGrid">'+
 ["recall","understanding","application","legal_precision","retention","exam"].map(function(k){return metric(k,v.m[k],axes[k]);}).join("")+'</div>'+(lastUpdate?'<p style="margin:14px 0 0;color:#6f7782;font-size:13px">آخر بيانات مستلمة: '+new Date(lastUpdate).toLocaleString("ar-EG")+'</p>':'')+'</section>'+
 '<section class="panel"><div class="panelHead"><div><h3>ملاحظات ونصائح للمشرف</h3><p>قراءة تلقائية مبنية على تجربة الطالب الفعلية، وليست درجة جامعية.</p></div><span class="realTag">Supervisor Note</span></div>'+
 '<div class="recommend"><b>ملحوظة على الأداء</b><span>'+esc(advice.summary)+'</span></div>'+
 '<div class="recommend" style="margin-top:10px"><b>النصيحة للمشرف</b><span>'+esc(advice.advice)+'</span></div>'+
 '<div class="recommend" style="margin-top:10px"><b>ما الذي نراقبه بعد ذلك؟</b><span>'+esc(advice.watch)+'</span></div>'+
 (advice.plan?'<div class="recommend appliedPlan" style="margin-top:10px"><b>ما يطبقه LexLearn فعليًا في الجلسات التالية</b><span>'+esc(advice.plan.method)+'<br><small>'+esc((advice.plan.tasks||[]).join(" • "))+'</small></span></div>':'')+
 (advice.essay?'<div class="recommend" style="margin-top:10px"><b>تحليل آخر إجابة مقالية</b><span>'+esc(advice.essay.style||"—")+' — '+esc(advice.essay.note||"")+'</span></div>':'')+
 (advice.essay&&advice.essay.answer?'<details class="recommend"><summary>إجابة الطالب وأدلة المعيار</summary><p style="white-space:pre-wrap">'+esc(advice.essay.answer)+'</p><ul>'+(advice.essay.checks||[]).map(function(c){return '<li>'+esc(c.label)+' — '+(c.matched?'ظهر مؤشر: '+esc(c.evidence):'يحتاج مراجعة')+'</li>';}).join('')+'</ul><small>فحص أولي؛ اعتماد صحة الإجابة للمشرف.</small></details>':'')+
 '</section>'+
 '<section class="twoCols"><div class="panel"><h3>التقدم</h3><div class="progressWrap"><div class="progressLine"><i style="width:'+Math.round(v.completed/30*100)+'%"></i></div><b>'+v.completed+'/30</b></div><p>الجلسة الحالية: '+v.session+' • '+(v.course.completedProgram?"البرنامج مكتمل":"البرنامج مستمر")+'</p><div class="recommend"><b>التدخل المقترح</b><span>'+esc(modelText(v))+'</span></div></div>'+
 '<div class="panel"><h3>إجراءات الإدارة</h3><div class="adminActions"><button data-reset="'+s.id+'">'+ico("key")+' كلمة مرور مؤقتة</button><button data-toggle="'+s.id+'" data-active="'+(s.active!==false)+'">'+ico("users")+' '+(s.active===false?"تفعيل":"تعطيل")+'</button><button data-unlock="'+s.id+'">فتح الأسبوع التالي</button><button data-repair="'+s.id+'">جلسة تثبيت</button></div></div></section>'+
 '<section class="panel evidence"><h3>لماذا اتخذ النظام هذا القرار؟</h3><div class="evidenceGrid">'+["recall","understanding","application","legal_precision","retention","exam"].map(function(k){var a=axes[k];return '<div><b>'+label(k)+'</b><span>'+(a?("تقدير "+a.value+"% • عدم يقين ±"+a.uncertainty+" • اتجاه "+(a.trend>0?"+":"")+a.trend):"لا توجد أدلة كافية بعد")+'</span></div>';}).join("")+'</div></section>';
}
function dashboard(){
 var list=studentList(),selected=state.students.find(function(s){return s.id===state.selected;})||list[0],v=selected?view(selected):null;if(selected)state.selected=selected.id;
 return '<section class="hero"><div><span class="demoTag">Production Supervisor View</span><h1>تحليل مركزي قابل للتفسير</h1><p>كل طالب وحسابه وتقدمه وأدلته محفوظة مركزيًا، مع فصل الصلاحيات عن المتصفح.</p></div><button class="btn light" id="refresh">تحديث البيانات</button></section>'+kpis()+
 '<section class="dashboardGrid"><aside class="panel studentAside"><div class="panelHead"><div><h3>الطلاب</h3><p>'+list.length+' حساب</p></div><button class="iconBtn" id="quickAdd">'+ico("plus")+'</button></div><input class="search" id="search" value="'+esc(state.q)+'" placeholder="اسم أو مستخدم..."><div class="studentList">'+list.map(function(s){var vv=view(s),rr=risk(vv);return '<button class="studentBtn '+(s.id===state.selected?"active":"")+'" data-student="'+s.id+'"><div><b>'+esc(s.name||s.username)+'</b><small>@'+esc(s.username)+' • '+vv.completed+'/30</small></div><span class="risk '+rr+'">'+rlabel(rr)+'</span></button>';}).join("")+'</div></aside><div>'+(v?detail(v):'<div class="panel empty">لا يوجد طلاب بعد.</div>')+'</div></section>';
}
function studentsTab(){
 var a=studentList();
 return '<section class="pageTitle"><div><span class="overline">Central Accounts</span><h1>الطلاب</h1><p>الحسابات هنا ليست مرتبطة بجهاز المدير؛ هي مركزية لكل الأجهزة.</p></div><div class="pageActions"><button class="btn primary" id="add">'+ico("plus")+' إضافة طالب</button><button class="btn secondary" id="export">تصدير CSV</button></div></section><section class="panel"><input class="search" id="ssearch" value="'+esc(state.q)+'" placeholder="بحث..."><div class="studentTable"><div class="tr head"><span>الطالب</span><span>المجموعة</span><span>التقدم</span><span>الأولوية</span><span>الحالة</span></div>'+a.map(function(s){var v=view(s),r=risk(v);return '<button class="tr" data-open="'+s.id+'"><span><b>'+esc(s.name||s.username)+'</b><small>@'+esc(s.username)+'</small></span><span>'+esc(s.cohort||"—")+'</span><span>'+v.completed+'/30</span><span>'+esc(v.model.weakest?label(v.model.weakest):"—")+'</span><span class="risk '+(s.active===false?"none":r)+'">'+(s.active===false?"غير نشط":rlabel(r))+'</span></button>';}).join("")+'</div></section>';
}
function cohortsTab(){
 return '<section class="pageTitle"><div><span class="overline">Cohorts</span><h1>المجموعات</h1><p>مجموعات الـPilot والمؤسسات.</p></div><button class="btn primary" id="newCohort">'+ico("plus")+' مجموعة جديدة</button></section><section class="cohortGrid">'+state.cohorts.map(function(c){return '<div class="panel cohortCard"><span class="cohortIcon">'+ico("group")+'</span><h3>'+esc(c.name)+'</h3><p>'+state.students.filter(function(s){return s.cohort===c.name;}).length+' طالب</p><div class="cohortMeta"><span>'+esc(c.institution||"—")+'</span><span>'+esc(c.academic_year||"—")+'</span></div></div>';}).join("")+'</section>';
}
function contentStatusLabel(s){return ({draft:"مسودة",legal_review:"مراجعة قانونية",learning_review:"مراجعة تعليمية",approved:"معتمد",retired:"متقاعد"})[s]||s;}
function contentTab(){
 var items=state.content||[],pending=items.filter(function(x){return x.status!=="approved"&&x.status!=="retired";});
 return '<section class="pageTitle"><div><span class="overline">Content Governance</span><h1>اعتماد المحتوى القانوني</h1><p>لا يستخدم التصحيح الدلالي سؤالًا قبل إكمال المراجعة القانونية ثم التعليمية.</p></div><span class="risk '+(pending.length?"mid":"low")+'">'+pending.length+' قيد المراجعة</span></section>'+
 '<section class="panel"><div class="studentTable"><div class="tr head"><span>السؤال</span><span>البعد</span><span>المصادر</span><span>الحالة</span><span>الإجراء</span></div>'+
 items.map(function(x){var next=x.status==="draft"?"إرسال للمراجعة القانونية":x.status==="legal_review"?"اعتماد قانوني":x.status==="learning_review"?"اعتماد تعليمي ونشر":x.status==="approved"?"معتمد":"—";return '<div class="tr"><span><b>'+esc(x.prompt_ar)+'</b><small>'+esc(x.id)+'</small></span><span>'+esc(label(x.dimension))+' • مستوى '+x.difficulty+'</span><span>'+esc((x.source_ids||[]).join("، ")||"—")+'</span><span class="risk '+(x.status==="approved"?"low":"mid")+'">'+contentStatusLabel(x.status)+'</span><span>'+(x.status!=="approved"&&x.status!=="retired"?'<button class="btn secondary" data-review="'+x.id+'">'+next+'</button>':'✓')+'</span></div>';}).join("")+
 '</div><div class="warn" style="margin-top:14px">المراجعة القانونية تؤكد صحة القاعدة والمصدر. المراجعة التعليمية تؤكد وضوح السؤال وقياسه للمهارة المقصودة. لا ندمج المرحلتين تلقائيًا.</div></section>';
}
function auditTab(){
 return '<section class="pageTitle"><div><span class="overline">Audit Log</span><h1>السجل المركزي</h1><p>أثر تدقيقي لتدخلات الإدارة.</p></div></section><section class="panel"><div class="auditList">'+(state.audit.length?state.audit.map(function(x){return '<div class="auditRow"><span class="auditIcon">'+ico("audit")+'</span><div><b>'+esc(x.action)+'</b><small>'+esc(JSON.stringify(x.details||{}))+'</small></div><time>'+new Date(x.created_at).toLocaleString("ar-EG")+'</time></div>';}).join(""):'<div class="empty">لا توجد إجراءات بعد.</div>')+'</div></section>';
}
function modal(){
 if(!state.modal)return "";
 if(state.modal==="add")return '<div class="modalBack"><div class="modal"><button class="close" data-close>×</button><span class="overline">حساب مركزي</span><h2>إضافة طالب</h2><form id="addForm" class="formGrid"><label>الاسم<input id="n" required></label><label>اسم المستخدم<input id="usr" pattern="[A-Za-z0-9._-]{3,32}" required></label><label>الجامعة<input id="uni" value="Qatar University"></label><label>السنة<select id="yr"><option>السنة الأولى</option><option>السنة الثانية</option></select></label><label>الدولة<select id="country"><option value="qa">قطر</option><option value="eg">مصر</option></select></label><label>المجموعة<select id="coh"><option value="">بدون مجموعة</option>'+state.cohorts.map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+'</option>';}).join("")+'</select></label><div class="modalActions"><button class="btn primary" type="submit">إنشاء الحساب</button></div></form></div></div>';
 if(state.modal==="creds")return '<div class="modalBack"><div class="modal"><button class="close" data-close>×</button><span class="overline">بيانات مؤقتة</span><h2>سلمها للطالب مرة واحدة</h2><div class="credentials"><span>اسم المستخدم</span><b>'+esc(state.creds.username)+'</b><span>كلمة المرور المؤقتة</span><b>'+esc(state.creds.password)+'</b></div><button class="btn primary" id="copyCreds">نسخ البيانات</button><div class="warn">سيُطلب من الطالب تغيير كلمة المرور. لا نخزن كلمة المرور في لوحة الإدارة.</div></div></div>';
 return "";
}
async function load(){
 state.busy=true;renderLoading();
 try{
  var c=LEX_CLOUD.db(),results=await Promise.all([
    LEX_CLOUD.listStudents(),LEX_CLOUD.listCohorts(),LEX_CLOUD.listAudit(),LEX_CLOUD.listContentItems("qa-qu-lawc213"),
    c.from("learner_snapshots").select("user_id,course_id,snapshot_type,state,updated_at"),
    c.from("attempts").select("user_id,course_id,dimension,score,confidence,error_type,created_at").order("created_at",{ascending:false}).limit(1000)
  ]);
  state.students=results[0];state.cohorts=results[1];state.audit=results[2];state.content=results[3];state.snapshots=results[4].data||[];state.attempts=results[5].data||[];
  if(!state.selected&&state.students[0])state.selected=state.students[0].id;
 }catch(e){state.error=e&&e.message||String(e);}
 state.busy=false;render();
}
function renderLoading(){APP.innerHTML='<main class="wrap"><section class="panel"><h2>تحميل البيانات المركزية…</h2><p>يتم التحقق من الحسابات والتقدم والسجل.</p></section></main>';}
function render(){if(state.error){APP.innerHTML='<main class="wrap"><section class="panel"><h2>تعذر تحميل لوحة الإدارة</h2><p>'+esc(state.error)+'</p><button class="btn primary" id="retry">إعادة المحاولة</button></section></main>';var r=document.getElementById("retry");if(r)r.onclick=load;return;}shell(state.tab==="dashboard"?dashboard():state.tab==="students"?studentsTab():state.tab==="cohorts"?cohortsTab():state.tab==="content"?contentTab():auditTab());}
function bind(){
 document.querySelectorAll("[data-student]").forEach(function(b){b.onclick=function(){state.selected=b.dataset.student;render();};});
 document.querySelectorAll("[data-open]").forEach(function(b){b.onclick=function(){state.selected=b.dataset.open;state.tab="dashboard";render();};});
 var q=document.getElementById("search")||document.getElementById("ssearch");if(q)q.oninput=function(){state.q=q.value;render();};
 var add=document.getElementById("add")||document.getElementById("quickAdd");if(add)add.onclick=function(){state.modal="add";render();};
 document.querySelectorAll("[data-close]").forEach(function(b){b.onclick=function(){state.modal=null;render();};});
 var ref=document.getElementById("refresh");if(ref)ref.onclick=load;
 var f=document.getElementById("addForm");if(f)f.onsubmit=async function(e){e.preventDefault();var nameEl=document.getElementById("n"),userEl=document.getElementById("usr"),uniEl=document.getElementById("uni"),yearEl=document.getElementById("yr"),countryEl=document.getElementById("country"),cohortEl=document.getElementById("coh");try{var countryCode=countryEl.value;var x=await LEX_CLOUD.createStudent({name:nameEl.value.trim(),username:userEl.value.trim(),university:uniEl.value.trim(),year:yearEl.value,country_code:countryCode,cohort_id:cohortEl.value||null,course_id:countryCode==="qa"?"qa-qu-lawc213":"eg-civil-sources"});state.creds={username:x.username,password:x.temporary_password};await load();state.modal="creds";render();}catch(er){alert("تعذر إنشاء الحساب: "+(er.message||er));}};
 var cc=document.getElementById("copyCreds");if(cc)cc.onclick=function(){var t="Username: "+state.creds.username+"\nTemporary password: "+state.creds.password;navigator.clipboard&&navigator.clipboard.writeText(t);cc.textContent="تم النسخ";};
 var nc=document.getElementById("newCohort");if(nc)nc.onclick=async function(){var name=prompt("اسم المجموعة");if(!name)return;try{await LEX_CLOUD.createCohort({name:name,institution:"Qatar University"});await load();}catch(e){alert("تعذر إنشاء المجموعة");}};
 document.querySelectorAll("[data-reset]").forEach(function(b){b.onclick=async function(){var s=state.students.find(function(x){return x.id===b.dataset.reset;});try{var r=await LEX_CLOUD.manageStudent({action:"reset_password",user_id:s.id});state.creds={username:s.username,password:r.temporary_password};state.modal="creds";render();}catch(e){alert("تعذر إعادة كلمة المرور");}};});
 document.querySelectorAll("[data-toggle]").forEach(function(b){b.onclick=async function(){try{await LEX_CLOUD.manageStudent({action:"toggle_active",user_id:b.dataset.toggle,active:b.dataset.active!=="true"});await load();}catch(e){alert("تعذر تغيير الحالة");}};});
 document.querySelectorAll("[data-unlock]").forEach(function(b){b.onclick=function(){snapshotAction(b.dataset.unlock,"unlock");};});
 document.querySelectorAll("[data-repair]").forEach(function(b){b.onclick=function(){snapshotAction(b.dataset.repair,"repair");};});
 document.querySelectorAll("[data-review]").forEach(function(b){b.onclick=async function(){
   var item=state.content.find(function(x){return x.id===b.dataset.review;});if(!item)return;
   var prompt=item.status==="legal_review"?"أؤكد أن القاعدة القانونية والمصادر صحيحة لهذا السؤال؟":item.status==="learning_review"?"أؤكد أن السؤال يقيس المهارة المقصودة بوضوح وأنه جاهز للنشر؟":"إرسال السؤال للمرحلة التالية؟";
   if(!confirm(prompt))return;
   try{await LEX_CLOUD.reviewContent({action:"advance",item_id:item.id,review_type:item.status==="learning_review"?"learning":"legal"});await load();state.tab="content";render();}catch(e){alert("تعذر تحديث حالة المحتوى: "+(e.message||e));}
   };});
 var ex=document.getElementById("export");if(ex)ex.onclick=exportCsv;
}
async function snapshotAction(id,mode){
 var s=state.students.find(function(x){return x.id===id;}),snap=courseSnap(id,s.country),course=JSON.parse(JSON.stringify(snap&&snap.state||{session:1,completed:[],weekResults:{},adminOverrideWeeks:{},errors:[]}));
 course.weekResults=course.weekResults||{};course.adminOverrideWeeks=course.adminOverrideWeeks||{};
 var w=Math.min(6,Math.max(1,Math.ceil((course.session||1)/5)));
 if(mode==="unlock")course.adminOverrideWeeks[Math.min(6,w+1)]=true;
 else{course.repairRequired=true;course.repairWeek=w;course.weekResults[w]=course.weekResults[w]||{week:w,score:0};course.weekResults[w].status="repair";}
 try{await LEX_CLOUD.manageStudent({action:"save_snapshot",user_id:id,course_id:courseKey(s),snapshot_type:"course",state:course,details:{mode:mode}});await load();}catch(e){alert("تعذر حفظ التدخل");}
}
function exportCsv(){
 var rows=[["name","username","cohort","university","year","country","active"]].concat(state.students.map(function(s){return[s.name,s.username,s.cohort,s.university,s.year,s.country,s.active!==false];}));
 var csv=rows.map(function(row){return row.map(function(v){return '"'+String(v==null?"":v).replace(/"/g,'""')+'"';}).join(",");}).join("\n");
 var blob=new Blob(["\ufeff"+csv],{type:"text/csv"}),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="lexlearn-central-students.csv";a.click();URL.revokeObjectURL(u);
}
load();
})();