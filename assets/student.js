(function(){
"use strict";
var APP=document.getElementById("studentApp"),SESSION_KEY="lexlearn_student_session",STUDENTS_KEY="lexlearn_students_v2";
function read(k,f){try{return JSON.parse(localStorage.getItem(k))||f;}catch(e){return f;}}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
function ico(name){var p={lock:'<rect x="18" y="29" width="28" height="23" rx="5"/><path d="M24 29v-7a8 8 0 0 1 16 0v7"/>',check:'<circle cx="32" cy="32" r="23"/><path d="m21 32 7 7 15-16"/>',play:'<path d="m24 17 24 15-24 15z"/>',test:'<path d="M18 10h28v44H18z"/><path d="M25 23h14M25 31h14M25 39h8"/><path d="m40 43 4 4 8-10"/>',brain:'<path d="M25 13c-7 0-10 5-9 10-5 2-6 10-1 13-3 6 3 13 9 11 2 5 10 5 12 0 6 2 12-5 9-11 5-3 4-11-1 1-5-2-10-9-10"/><path d="M32 14v34"/>',bulb:'<path d="M32 10a15 15 0 0 0-9 27c3 2 4 5 4 8h10c0-3 1-6 4-8a15 15 0 0 0-9-27z"/><path d="M27 50h10M29 55h6"/>',scale:'<path d="M32 11v39M20 17h24M12 26l8-9 8 9M36 26l8-9 8 9M10 26h20c0 7-4 11-10 11S10 33 10 26zM34 26h20c0 7-4 11-10 11s-10-4-10-11zM22 53h20"/>',repeat:'<path d="M16 21a20 20 0 0 1 32 2l4 5M52 17v11H41M48 43a20 20 0 0 1-32-2l-4-5M12 47V36h11"/>',pen:'<path d="M14 49l4-14 24-24 11 11-24 24zM18 35l11 11M13 52h38"/>',trophy:'<path d="M22 13h20v12c0 9-5 15-10 15s-10-6-10-15z"/><path d="M22 18h-8v5c0 6 4 10 10 10M42 18h8v5c0 6-4 10-10 10M32 40v9M23 52h18"/>};return '<svg class="icon" viewBox="0 0 64 64">'+(p[name]||p.play)+'</svg>';}
var session=read(SESSION_KEY,null);if(!session){location.href="student-login.html";return;}
var students=read(STUDENTS_KEY,[]),student=students.find(function(x){return x.id===session.studentId;});if(!student){localStorage.removeItem(SESSION_KEY);location.href="student-login.html";return;}
var profile=read("lexlearn_v9_profile_"+student.id,{results:{}}),res=profile.results&&profile.results["qa-sources"];
var course=read("lexlearn_course_v1_qa_sources_"+student.id,{session:1,completed:[],weekResults:{},achievements:[],repairRequired:false});
course.weekResults=course.weekResults||{};course.achievements=course.achievements||[];course.completed=course.completed||[];
var currentWeek=Math.min(6,Math.max(1,Math.ceil((course.session||1)/5)));
var weekTitles=["أساس القاعدة القانونية","مصادر الالتزام","التطبيق على الوقائع","الذاكرة القانونية الدقيقة","الإجابة الامتحانية","التثبيت والمحاكاة"];
function weekStatus(n){
  var r=course.weekResults[n];if(r&&r.status==="repair")return ["need","يحتاج تثبيت","repeat"];
  if(r)return ["done",r.status==="mastered"?"مكتمل بإتقان":"مكتمل","check"];
  if(n===currentWeek)return ["current","متاح الآن","play"];
  if(course.adminOverrideWeeks&&course.adminOverrideWeeks[n])return ["current","مفتوح بواسطة المشرف","play"];
  return ["locked","مغلق حتى إكمال السابق","lock"];
}
function status(v){if(v==null)return "لم يُقَس";if(v>=80)return "قوي";if(v>=60)return "جيد";if(v>=40)return "يحتاج تركيز";return "أولوية تدريب";}
function profileTitle(){if(!res)return "ابدأ بالتقييم التشخيصي";if(res.profileType==="recall-led")return "ذاكرتك أقوى من الفهم — هنحوّل الحفظ إلى استخدام";if(res.profileType==="understanding-led")return "فهمك أقوى من الاسترجاع — هنحوّل المعنى إلى ذاكرة سريعة";return "أداء متوازن — هنركز على أقل مهارة حاليًا";}
function skill(name,key,iconName){var v=res&&res.metrics?res.metrics[key]:null,w=v==null?6:Math.max(6,v);return '<div class="skill"><div class="skillHead"><span class="skillIcon">'+ico(iconName)+'</span><div><b>'+name+'</b><small>'+status(v)+(v==null?"":" • "+v+"%")+'</small></div></div><div class="bar"><i style="width:'+w+'%"></i></div></div>';}
function achievementName(a){var names={mastered:"إتقان المرحلة",completed:"إنهاء المرحلة",completed_with_support:"تقدم بعد الدعم"};return names[a.status]||"إنجاز المرحلة";}
function changePasswordView(){
  APP.innerHTML='<main class="passwordGate"><section><div class="mark">Lx</div><span class="eyebrow">أول تسجيل دخول</span><h1>اختر كلمة مرور جديدة</h1><p>الحساب أُنشئ بكلمة مرور مؤقتة. غيّرها قبل بدء التدريب.</p><input id="newPass" type="password" placeholder="8 أحرف على الأقل"><input id="newPass2" type="password" placeholder="أعد كتابة كلمة المرور"><div id="passError"></div><button class="btn primary" id="savePass">حفظ وفتح حسابي</button></section></main>';
  document.getElementById("savePass").onclick=function(){var a=document.getElementById("newPass").value,b=document.getElementById("newPass2").value,e=document.getElementById("passError");if(a.length<8||a!==b){e.textContent="اكتب كلمة مرور من 8 أحرف على الأقل وتأكد من التطابق.";return;}var arr=students;var x=arr.find(function(z){return z.id===student.id;});x.password=a;x.mustChangePassword=false;localStorage.setItem(STUDENTS_KEY,JSON.stringify(arr));student=x;render();};
}
function render(){
  if(student.mustChangePassword){changePasswordView();return;}
  APP.innerHTML='<header class="top"><div class="topin"><div class="brand"><div class="mark">Lx</div><div><b>LexLearn</b><small>حساب الطالب</small></div></div><div class="topactions"><a class="topbtn" href="index.html">الموقع</a><button class="topbtn" id="logout">خروج</button></div></div></header>'+
  '<main class="wrap"><section class="hero"><div class="heroMain"><span class="eyebrow">'+esc(student.cohort||"برنامج التدريب")+'</span><h1>أهلًا '+esc(student.name)+'</h1><p>برنامج مصادر الالتزام • 6 أسابيع • 30 جلسة عملية</p><div class="heroMeta"><span>الأسبوع '+currentWeek+' من 6</span><span>الجلسة '+(course.session||1)+' من 30</span><span>'+course.completed.length+' جلسة مكتملة</span></div></div><div class="heroSide"><h3>'+profileTitle()+'</h3><p>'+(res?"الجلسة التالية ستستخدم نتيجتك الحالية والأخطاء المسجلة لتحديد نوع التدريب.":"التقييم الأول هو الذي يبني أول مسار تدريبي لك.")+'</p></div></section>'+
  '<section class="actionGrid">'+
    (!res?'<a class="actionCard primary" href="index.html?country=qa&subject=sources&autodiag=1"><span class="actionIcon">'+ico("test")+'</span><span class="actionCopy"><b>ابدأ التقييم التشخيصي</b><small>اختبار قصير يبني ملف التعلم الأول.</small></span></a>':'<a class="actionCard primary" href="program.html?country=qa&subject=sources"><span class="actionIcon">'+ico("play")+'</span><span class="actionCopy"><b>أكمل جلسة اليوم</b><small>حوالي 15–20 دقيقة من التدريب الفعلي.</small></span></a>')+
    '<a class="actionCard" href="index.html?country=qa&subject=sources"><span class="actionIcon">'+ico("test")+'</span><span class="actionCopy"><b>أعد التقييم عند الحاجة</b><small>النتيجة الجديدة تعيد معايرة المسار.</small></span></a>'+
  '</section>'+
  '<div class="sectionHead"><div><h2>مسار الأسابيع</h2><p>كل مرحلة تفتح بعد إكمال السابقة أو بقرار دعم من المشرف.</p></div><span class="progressTag">'+course.completed.length+' / 30</span></div>'+
  '<section class="weekGrid">'+weekTitles.map(function(t,i){var n=i+1,st=weekStatus(n);return '<div class="week '+st[0]+'"><span class="weekIcon">'+ico(st[2])+'</span><b>الأسبوع '+n+'</b><small>'+esc(t)+'</small><em>'+st[1]+'</em></div>';}).join("")+'</section>'+
  '<div class="sectionHead"><div><h2>ملف تعلمك</h2><p>عرض مبسط لك — التفاصيل الرقمية الكاملة تظهر للمشرف.</p></div></div>'+
  (res?'<section class="resultCard"><div class="resultIntro"><div><h3>'+profileTitle()+'</h3><p>المؤشرات التالية تساعدك تعرف إيه اللي محتاج تدريب الآن، وليست درجة جامعية.</p></div><span class="profilePill">'+(res.profileType==="recall-led"?"نمط حفظي":res.profileType==="understanding-led"?"نمط فهمي":"متوازن")+'</span></div><div class="skillGrid">'+skill("الذاكرة القانونية","recall","brain")+skill("الفهم","understanding","bulb")+skill("التطبيق","application","scale")+skill("ثبات المعلومة","retention","repeat")+skill("الإجابة الامتحانية","exam","pen")+'</div></section>':'<div class="empty">بعد أول تقييم سيظهر هنا Infographic واضح لنقاط القوة والأولوية التدريبية.</div>')+
  '<div class="sectionHead"><div><h2>الإنجازات</h2><p>إنجازات أكاديمية مرتبطة بإتمام المراحل والمهارات.</p></div></div>'+
  '<section class="achievementStrip">'+(course.achievements.length?course.achievements.map(function(a){return '<div class="badge"><span class="badgeIcon">'+ico("trophy")+'</span><div><b>'+achievementName(a)+'</b><small>الأسبوع '+a.week+' • '+(a.status==="mastered"?"بإتقان":"مكتمل")+'</small></div></div>';}).join(""):'<div class="empty">أول Badge يظهر بعد إنهاء تقييم الأسبوع الأول.</div>')+'</section></main>';
  document.getElementById("logout").onclick=function(){localStorage.removeItem(SESSION_KEY);location.href="student-login.html";};
}
render();
})();