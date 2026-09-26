(function(){
"use strict";
var APP=document.getElementById("adminApp");
var PROFILE_KEY="lexlearn_v9_profile",COURSE_KEY="lexlearn_course_v1_qa_sources";
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
function read(k,fallback){try{return JSON.parse(localStorage.getItem(k))||fallback;}catch(e){return fallback;}}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function currentStudent(){
  var p=read(PROFILE_KEY,{results:{}}),r=p.results&&p.results["qa-sources"],c=read(COURSE_KEY,null);
  if(!r)return null;
  return {id:"current",name:"الطالب الحالي — هذا الجهاز",group:"Pilot / Sources",metrics:r.metrics||{},session:c&&c.session?c.session:1,completed:c&&c.completed?c.completed.length:0,
    risk:riskFrom(r.metrics||{}),profile:r.profileType||"balanced",errors:c&&c.errors?c.errors:[],source:"بيانات التجربة المحلية الحالية"};
}
function riskFrom(m){var vals=[m.recall,m.understanding,m.application,m.retention,m.exam].filter(function(v){return v!=null;});var min=vals.length?Math.min.apply(null,vals):50;if(min<40)return "high";if(min<65)return "mid";return "low";}
var sample=[
  {id:"s1",name:"طالب 01",group:"Pilot A",metrics:{recall:88,understanding:54,application:42,retention:61,exam:48},session:8,completed:7,risk:"high",profile:"recall-led",errors:[{label:"ينقل النص دون تفسير العلاقة بين عناصره",count:3},{label:"يضع القاعدة دون تطبيقها على الواقعة",count:2}],source:"بيانات تجريبية توضيحية"},
  {id:"s2",name:"طالب 02",group:"Pilot A",metrics:{recall:52,understanding:86,application:74,retention:44,exam:70},session:11,completed:10,risk:"mid",profile:"understanding-led",errors:[{label:"يفهم المعنى لكن يتأخر في استرجاع المصطلح القانوني",count:4}],source:"بيانات تجريبية توضيحية"},
  {id:"s3",name:"طالب 03",group:"Pilot A",metrics:{recall:76,understanding:79,application:82,retention:73,exam:68},session:16,completed:15,risk:"low",profile:"balanced",errors:[{label:"هيكل الإجابة يحتاج خاتمة أوضح",count:1}],source:"بيانات تجريبية توضيحية"},
  {id:"s4",name:"طالب 04",group:"Pilot B",metrics:{recall:63,understanding:65,application:39,retention:58,exam:41},session:5,completed:4,risk:"high",profile:"balanced",errors:[{label:"لا يلتقط الواقعة الحاسمة",count:3},{label:"يخلط بين مصدر الالتزام والقاعدة المطبقة",count:2}],source:"بيانات تجريبية توضيحية"}
];
var cur=currentStudent();if(cur)sample.unshift(cur);
var selected=sample[0].id;
function metricLabel(k){return {recall:"استرجاع",understanding:"فهم",application:"تطبيق",retention:"احتفاظ",exam:"إجابة امتحانية"}[k];}
function explainMetric(k,v){
  var status=v==null?"لم يُقَس":v>=80?"قوي":v>=60?"جيد":v>=40?"يحتاج متابعة":"أولوية تدخل";
  var meaning={
    recall:"قدرة الطالب على استدعاء العناصر والمصطلحات من غير فتح النص.",
    understanding:"قدرة الطالب على تفسير لماذا تعمل القاعدة وما علاقة عناصرها ببعض.",
    application:"قدرة الطالب على نقل القاعدة إلى واقعة جديدة وتحديد العنصر الحاسم.",
    retention:"قدرة الطالب على الاحتفاظ بالمعلومة بعد فاصل زمني.",
    exam:"قدرة الطالب على بناء إجابة: مسألة ثم قاعدة ثم تطبيق ثم نتيجة."
  }[k];
  return status+" — "+meaning;
}
function profileText(s){
  if(s.profile==="recall-led")return "نمط حفظي: الاسترجاع أعلى من الفهم/التطبيق. التدخل المقترح هو تفسير ما يحفظه، Change One Fact، وكتابة تطبيقات قصيرة.";
  if(s.profile==="understanding-led")return "نمط فهمي: المعنى أقوى من الاستدعاء. التدخل المقترح هو مفاتيح ذاكرة قصيرة، استرجاع متباعد، وإعادة بناء الصياغة القانونية من الهيكل.";
  return "نمط متوازن نسبيًا. الأولوية تحددها أقل مهارة في المؤشرات الحالية وتُعاد معايرتها بعد كل تقييم تقدم.";
}
function weakest(s){var a=Object.keys(s.metrics).filter(function(k){return s.metrics[k]!=null;}).map(function(k){return [k,s.metrics[k]];}).sort(function(a,b){return a[1]-b[1];});return a.length?a[0]:["application",0];}
function recommended(s){var w=weakest(s)[0];return {recall:"زِد الاسترجاع من غير نص والمراجعة المتباعدة.",understanding:"استخدم تفسير القاعدة بكلمات الطالب وأسئلة «لماذا؟».",application:"زد Case Detective وChange One Fact والمسائل القصيرة.",retention:"قصّر المراجعات ووزعها على أيام مع اختبار مؤجل.",exam:"زد تمارين Issue Spotting وبناء الإجابة تحت وقت."}[w];}
function metricCard(k,v){var x=v==null?0:v;return '<div class="metric"><span>'+metricLabel(k)+'</span><b>'+(v==null?"—":v+"%")+'</b><div class="bar"><i style="width:'+clamp(x,0,100)+'%"></i></div></div>';}
function riskLabel(r){return r==="high"?"متابعة عاجلة":r==="mid"?"متابعة":"مستقر";}
function render(){
  var s=sample.find(function(x){return x.id===selected;})||sample[0],wk=Math.min(6,Math.max(1,Math.ceil(s.session/5)));
  var need=sample.filter(function(x){return x.risk==="high";}).length;
  var avg=Math.round(sample.reduce(function(a,x){return a+(x.metrics.application||0);},0)/sample.length);
  APP.innerHTML='<header class="top"><div class="topin"><div class="brand"><div class="mark">Lx</div><div><b>LexLearn Admin</b><small>متابعة التعلم والتدخل المبكر</small></div></div><a class="back" href="index.html">العودة للموقع</a></div></header>'+
  '<main class="wrap"><section class="hero"><div><span class="demoTag">لوحة مشرف تجريبية</span><h1>متابعة الطلاب — مصادر الالتزام</h1><p>الطالب يرى نتيجة مبسطة. هنا يرى المشرف الأرقام، سبب التصنيف، الأخطاء المتكررة، تقدّم الـ30 جلسة، والتدخل المقترح.</p></div><div><b style="font-size:38px">'+sample.length+'</b><small style="display:block;color:#cbd4e0">طلاب ظاهرون في الديمو</small></div></section>'+
  '<section class="cohortKpis"><div class="kpi"><span>طلاب يحتاجون متابعة عاجلة</span><b>'+need+'</b></div><div class="kpi"><span>متوسط مؤشر التطبيق</span><b>'+avg+'%</b></div><div class="kpi"><span>مدة البرنامج</span><b>6 أسابيع</b></div><div class="kpi"><span>عدد الجلسات</span><b>30</b></div></section>'+
  '<section class="layout"><aside class="panel"><h3>طلاب المجموعة</h3><p>اختر طالبًا لفتح التفسير التفصيلي.</p><div class="studentList">'+sample.map(function(x){return '<button class="studentBtn '+(x.id===selected?"active":"")+'" data-student="'+x.id+'"><div><b>'+esc(x.name)+'</b><small>جلسة '+x.session+' / 30 • '+esc(x.group)+'</small></div><span class="risk '+x.risk+'">'+riskLabel(x.risk)+'</span></button>';}).join("")+'</div></aside>'+
  '<div><section class="detailGrid"><div class="panel"><h2>'+esc(s.name)+'</h2><p>'+esc(s.source)+'</p><div class="metricGrid">'+["recall","understanding","application","retention","exam"].map(function(k){return metricCard(k,s.metrics[k]);}).join("")+'</div><div class="explain">'+["recall","understanding","application","retention","exam"].map(function(k){return '<div class="explainItem"><b>'+metricLabel(k)+'</b><span>'+esc(explainMetric(k,s.metrics[k]))+'</span></div>';}).join("")+'</div></div>'+
  '<div class="panel progressCard"><h3>التفسير الإداري</h3><p>'+esc(profileText(s))+'</p><div class="recommend"><b>التدخل التالي:</b><br>'+esc(recommended(s))+'</div><div><span style="font-size:10px;color:var(--muted)">تقدّم البرنامج</span><div class="progressLine"><i style="width:'+Math.round(s.completed/30*100)+'%"></i></div><small style="display:block;margin-top:6px;color:var(--muted)">'+s.completed+' جلسة مكتملة من 30</small></div><div class="weeks">'+[1,2,3,4,5,6].map(function(n){return '<div class="week '+(n<wk?"done":n===wk?"current":"")+'"><b>'+n+'</b><small>الأسبوع</small></div>';}).join("")+'</div></div></section>'+
  '<section class="panel evidence"><h3>الأدلة التي بنينا عليها القرار</h3><div class="tableWrap"><table><thead><tr><th>المؤشر</th><th>ماذا قسنا؟</th><th>النتيجة</th><th>ماذا تعني للمشرف؟</th></tr></thead><tbody>'+
  '<tr><td>الاسترجاع</td><td>اختيار بعد اختفاء النص + استرجاع حر</td><td><span class="pill">'+(s.metrics.recall==null?"—":s.metrics.recall+"%")+'</span></td><td>'+esc(explainMetric("recall",s.metrics.recall))+'</td></tr>'+
  '<tr><td>الفهم</td><td>تفسير العلاقة بين عناصر القاعدة</td><td><span class="pill">'+(s.metrics.understanding==null?"—":s.metrics.understanding+"%")+'</span></td><td>'+esc(explainMetric("understanding",s.metrics.understanding))+'</td></tr>'+
  '<tr><td>التطبيق</td><td>Change One Fact / واقعة جديدة</td><td><span class="pill">'+(s.metrics.application==null?"—":s.metrics.application+"%")+'</span></td><td>'+esc(explainMetric("application",s.metrics.application))+'</td></tr>'+
  '<tr><td>الاحتفاظ</td><td>استدعاء مؤجل بعد مشتت/فاصل</td><td><span class="pill">'+(s.metrics.retention==null?"—":s.metrics.retention+"%")+'</span></td><td>'+esc(explainMetric("retention",s.metrics.retention))+'</td></tr>'+
  '<tr><td>الإجابة</td><td>هيكل الإجابة القانونية والتطبيق</td><td><span class="pill">'+(s.metrics.exam==null?"—":s.metrics.exam+"%")+'</span></td><td>'+esc(explainMetric("exam",s.metrics.exam))+'</td></tr>'+
  '</tbody></table></div><h3 style="margin-top:18px">الأخطاء المتكررة</h3>'+(s.errors&&s.errors.length?s.errors.map(function(e){return '<div class="explainItem"><b>'+esc(e.label)+'</b><span>تكرر '+e.count+' مرة — يستخدم المحرك هذا السجل لزيادة وزن التدريب المرتبط به.</span></div>';}).join(""):'<div class="note">لا توجد أخطاء متكررة مسجلة لهذا الطالب حتى الآن.</div>')+
  '<div class="note">هذه لوحة Prototype: البيانات متعددة الطلاب الظاهرة هنا تجريبية توضيحية. بيانات الطالب الحالي — إن وجدت على هذا الجهاز — تُقرأ من نفس Local Storage الخاص بالتجربة. الربط الحقيقي بين حسابات الطلاب وحساب المشرف يحتاج Backend وتسجيل دخول وصلاحيات.</div></section></div></section></main>';
  document.querySelectorAll("[data-student]").forEach(function(b){b.onclick=function(){selected=b.dataset.student;render();};});
}
render();
})();