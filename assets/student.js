(function(){
"use strict";

var APP=document.getElementById("studentApp");
var SESSION_KEY="lexlearn_student_session";
var STUDENTS_KEY="lexlearn_students_v2";
var COUNTRIES={qa:"قطر",eg:"مصر",sa:"السعودية",ae:"الإمارات",other:"دولة أخرى"};
function countryLabel(code){return COUNTRIES[code]||COUNTRIES.qa;}
function countryOptions(selected){
  return Object.keys(COUNTRIES).map(function(code){
    return "<option value='"+code+"' "+(code===selected?"selected":"")+">"+COUNTRIES[code]+"</option>";
  }).join("");
}

function read(key,fallback){
  try {
    var value=JSON.parse(localStorage.getItem(key)||"null");
    return value==null?fallback:value;
  } catch(e) {
    return fallback;
  }
}
function write(key,value){localStorage.setItem(key,JSON.stringify(value));}
function esc(value){
  return String(value==null?"":value).replace(/[&<>"']/g,function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}
function icon(name){
  var symbols={lock:"🔒",check:"✓",play:"▶",test:"◎",brain:"◉",bulb:"✦",scale:"⚖",repeat:"↻",pen:"✎",trophy:"◆"};
  return symbols[name]||"•";
}
function ensureDemoStudent(){
  var list=read(STUDENTS_KEY,[]);
  var demo=list.find(function(x){return x.id==="stu-demo-001"||x.username==="student01";});
  if(!demo){
    demo={
      id:"stu-demo-001",
      name:"طالب تجريبي 01",
      username:"student01",
      password:"Learn2027!",
      cohort:"Pilot A",
      university:"Qatar University",
      year:"السنة الأولى",
      subject:"sources",
      country:"qa",
      active:true,
      createdAt:Date.now()
    };
    list.unshift(demo);
    write(STUDENTS_KEY,list);
  }
  return {list:list,demo:demo};
}

var seeded=ensureDemoStudent();
var students=seeded.list;
var params=new URLSearchParams(location.search);
var session=read(SESSION_KEY,null);

if(params.get("demo")==="1"){
  session={studentId:seeded.demo.id,name:seeded.demo.name,username:seeded.demo.username,at:Date.now()};
  write(SESSION_KEY,session);
}

if(!session){
  location.replace("student-login.html");
  return;
}

var student=students.find(function(x){return x.id===session.studentId;});
if(!student){
  session={studentId:seeded.demo.id,name:seeded.demo.name,username:seeded.demo.username,at:Date.now()};
  write(SESSION_KEY,session);
  student=seeded.demo;
}

var country=student.country||session.country||null;
var PROFILE_KEY="lexlearn_v9_profile_"+student.id;
var COURSE_KEY=country?"lexlearn_course_v1_"+country+"_sources_"+student.id:null;
var profile=read(PROFILE_KEY,{results:{}});
var result=country&&profile.results&&profile.results[country+"-sources"]?profile.results[country+"-sources"]:null;
var course=COURSE_KEY?read(COURSE_KEY,{
  session:1,
  completed:[],
  weekResults:{},
  achievements:[],
  repairRequired:false,
  adminOverrideWeeks:{}
}):{
  session:1,completed:[],weekResults:{},achievements:[],repairRequired:false,adminOverrideWeeks:{}
};
course.completed=Array.isArray(course.completed)?course.completed:[];
course.weekResults=course.weekResults||{};
course.achievements=Array.isArray(course.achievements)?course.achievements:[];
course.adminOverrideWeeks=course.adminOverrideWeeks||{};

var weekTitles=[
  "أساس القاعدة القانونية",
  "مصادر الالتزام",
  "التطبيق على الوقائع",
  "الذاكرة القانونية الدقيقة",
  "الإجابة الامتحانية",
  "التثبيت والمحاكاة"
];

function currentWeek(){
  return Math.min(6,Math.max(1,Math.ceil((Number(course.session)||1)/5)));
}
function passedWeek(n){
  var r=course.weekResults[n];
  return !!(r&&(r.status==="mastered"||r.status==="completed"||r.status==="completed_with_support"));
}
function weekStatus(n){
  var r=course.weekResults[n];
  if(r&&r.status==="repair")return ["need","يحتاج تثبيت","repeat"];
  if(r)return ["done",r.status==="mastered"?"مكتمل بإتقان":"مكتمل","check"];
  if(course.adminOverrideWeeks[n])return ["current","مفتوح بواسطة المشرف","play"];
  if(n===1||passedWeek(n-1))return ["current","متاح الآن","play"];
  return ["locked","مغلق حتى اجتياز المرحلة السابقة","lock"];
}
function status(value){
  if(value==null)return "لم يُقَس";
  if(value>=80)return "قوي";
  if(value>=60)return "جيد";
  if(value>=40)return "يحتاج تركيز";
  return "أولوية تدريب";
}
function profileTitle(){
  if(!result)return "ابدأ بالتقييم التشخيصي";
  if(result.profileType==="recall-led")return "ذاكرتك أقوى من الفهم — هنحوّل الحفظ إلى استخدام";
  if(result.profileType==="understanding-led")return "فهمك أقوى من الاسترجاع — هنحوّل المعنى إلى ذاكرة سريعة";
  return "أداء متوازن — هنركز على أقل مهارة حاليًا";
}
function skillCard(title,key,ic){
  var value=result&&result.metrics?result.metrics[key]:null;
  var width=value==null?6:Math.max(6,Math.min(100,value));
  return "<div class='skill'>"+
    "<div class='skillHead'><span class='skillIcon'>"+icon(ic)+"</span><div><b>"+esc(title)+"</b><small>"+status(value)+(value==null?"":" • "+value+"%")+"</small></div></div>"+
    "<div class='bar'><i style='width:"+width+"%'></i></div>"+
  "</div>";
}
function achievementName(a){
  if(a.status==="program-complete")return "إتمام برنامج LexLearn";
  if(a.status==="mastered")return "إتقان المرحلة";
  if(a.status==="completed_with_support")return "تقدم بعد الدعم";
  return "إنهاء المرحلة";
}
function saveStudentPatch(patch){
  var list=read(STUDENTS_KEY,[]);
  var x=list.find(function(z){return z.id===student.id;});
  if(!x)return false;
  Object.keys(patch).forEach(function(k){x[k]=patch[k];});
  write(STUDENTS_KEY,list);
  student=x;
  var ss=read(SESSION_KEY,{});
  ss.studentId=x.id;ss.name=x.name;ss.username=x.username;ss.country=x.country||null;ss.at=Date.now();
  write(SESSION_KEY,ss);
  session=ss;
  return true;
}
function changePasswordView(force){
  APP.innerHTML=
    "<main class='passwordGate'><section>"+
      "<div class='mark'>Lx</div>"+
      "<span class='eyebrow'>"+(force?"أول تسجيل دخول":"أمان الحساب")+"</span>"+
      "<h1>"+(force?"اختر كلمة مرور جديدة":"تغيير كلمة المرور")+"</h1>"+
      "<p>"+(force?"غيّر كلمة المرور المؤقتة قبل بدء التدريب.":"اكتب كلمة المرور الحالية ثم اختر كلمة مرور جديدة.")+"</p>"+
      (force?"":"<input id='oldPass' type='password' placeholder='كلمة المرور الحالية'>")+
      "<input id='newPass' type='password' placeholder='كلمة المرور الجديدة — 8 أحرف على الأقل'>"+
      "<input id='newPass2' type='password' placeholder='أعد كتابة كلمة المرور الجديدة'>"+
      "<div id='passError'></div>"+
      "<button class='btn primary' id='savePass'>حفظ كلمة المرور</button>"+
      (force?"":"<button class='btn secondary' id='cancelPass'>إلغاء</button>")+
    "</section></main>";
  document.getElementById("savePass").onclick=function(){
    var a=document.getElementById("newPass").value;
    var b=document.getElementById("newPass2").value;
    var e=document.getElementById("passError");
    if(!force){
      var old=document.getElementById("oldPass").value;
      if(old!==student.password){e.textContent="كلمة المرور الحالية غير صحيحة.";return;}
    }
    if(a.length<8||a!==b){e.textContent="اكتب كلمة مرور من 8 أحرف على الأقل وتأكد من التطابق.";return;}
    saveStudentPatch({password:a,mustChangePassword:false});
    render();
  };
  var c=document.getElementById("cancelPass");if(c)c.onclick=render;
}
function countryGateView(){
  APP.innerHTML=
    "<main class='passwordGate'><section>"+
      "<div class='mark'>Lx</div><span class='eyebrow'>إعداد التدريب</span>"+
      "<h1>اختر الدولة</h1>"+
      "<p>سيُحفظ تقدمك لكل دولة بصورة مستقلة، ويمكنك تغيير الدولة لاحقًا من حسابك.</p>"+
      "<select id='countryPick' class='countryPick'>"+countryOptions("qa")+"</select>"+
      "<div id='passError'></div>"+
      "<button class='btn primary' id='saveCountry'>حفظ وفتح التدريب</button>"+
    "</section></main>";
  document.getElementById("saveCountry").onclick=function(){
    var code=document.getElementById("countryPick").value;
    saveStudentPatch({country:code});
    location.reload();
  };
}
function render(){
  if(student.mustChangePassword){
    changePasswordView(true);
    return;
  }
  if(!student.country){
    countryGateView();
    return;
  }
  country=student.country;
  var w=currentWeek();
  var weeks=weekTitles.map(function(title,i){
    var n=i+1;
    var st=weekStatus(n);
    var open=st[0]==="current"||st[0]==="need";
    var tag=open?"a":"div";
    var href=open?" href='program.html?demo=1&country="+country+"&start=1'":"";
    return "<"+tag+href+" class='week "+st[0]+"'>"+
      "<span class='weekIcon'>"+icon(st[2])+"</span>"+
      "<b>الأسبوع "+n+"</b>"+
      "<small>"+esc(title)+"</small>"+
      "<em>"+st[1]+"</em>"+
    "</"+tag+">";
  }).join("");

  var actionPrimary=course.completedProgram
    ? "<a class='actionCard primary completeAction' href='program.html?demo=1&country="+country+"&start=1'><span class='actionIcon'>🏆</span><span class='actionCopy'><b>عرض إنجازك النهائي</b><small>لقد أنهيت البرنامج بالكامل — افتح شاشة الفوز والإنهاء.</small></span></a>"
    : !result
      ? "<a class='actionCard primary' href='showcase.html?country="+country+"'><span class='actionIcon'>"+icon("test")+"</span><span class='actionCopy'><b>ابدأ التقييم التشخيصي</b><small>يفتح الاختبار مباشرة بدل الرجوع للصفحة الرئيسية.</small></span></a>"
      : "<a class='actionCard primary' href='program.html?demo=1&country="+country+"&start=1'><span class='actionIcon'>"+icon("play")+"</span><span class='actionCopy'><b>أكمل جلسة اليوم</b><small>يفتح التدريب الفعلي مباشرة.</small></span></a>";

  var learningProfile=result
    ? "<section class='resultCard'>"+
        "<div class='resultIntro'><div><h3>"+esc(profileTitle())+"</h3><p>المؤشرات التالية تساعدك تعرف إيه اللي محتاج تدريب الآن، وليست درجة جامعية.</p></div>"+
        "<span class='profilePill'>"+(result.profileType==="recall-led"?"نمط حفظي":result.profileType==="understanding-led"?"نمط فهمي":"متوازن")+"</span></div>"+
        "<div class='skillGrid'>"+
          skillCard("الذاكرة القانونية","recall","brain")+
          skillCard("الفهم","understanding","bulb")+
          skillCard("التطبيق","application","scale")+
          skillCard("ثبات المعلومة","retention","repeat")+
          skillCard("الإجابة الامتحانية","exam","pen")+
        "</div>"+
      "</section>"
    : "<div class='empty'>بعد أول تقييم سيظهر هنا Infographic واضح لنقاط القوة والأولوية التدريبية.</div>";

  var achievements=course.achievements.length
    ? course.achievements.map(function(a){
        var sub=a.status==="program-complete"?"6 مراحل • 30 جلسة • مكتمل":("الأسبوع "+a.week+" • "+(a.status==="mastered"?"بإتقان":"مكتمل"));
        return "<div class='badge "+(a.status==="program-complete"?"finalBadge":"")+"'><span class='badgeIcon'>"+(a.status==="program-complete"?"🏆":icon("trophy"))+"</span><div><b>"+achievementName(a)+"</b><small>"+sub+"</small></div></div>";
      }).join("")
    : "<div class='empty'>أول Badge يظهر بعد إنهاء تقييم الأسبوع الأول.</div>";

  APP.innerHTML=
    "<header class='top'><div class='topin'>"+
      "<div class='brand'><div class='mark'>Lx</div><div><b>LexLearn</b><small>حساب الطالب</small></div></div>"+
      "<div class='topactions'><select class='topbtn countryTop' id='countrySwitch'>"+countryOptions(country)+"</select><button class='topbtn' id='changePass'>تغيير كلمة المرور</button><a class='topbtn' href='index.html'>الموقع</a><button class='topbtn' id='logout'>خروج</button></div>"+
    "</div></header>"+
    "<main class='wrap'>"+
      "<section class='hero "+(course.completedProgram?"heroComplete":"")+"'>"+
        "<div class='heroMain'><span class='eyebrow'>"+esc(student.cohort||"برنامج التدريب")+"</span><h1>"+(course.completedProgram?"🎉 مبروك "+esc(student.name)+"!":"أهلًا "+esc(student.name))+"</h1><p>"+countryLabel(country)+" • برنامج مصادر الالتزام • 6 أسابيع • 30 جلسة عملية</p>"+
        "<div class='heroMeta'><span>"+(course.completedProgram?"6 / 6 مراحل مكتملة":"الأسبوع "+w+" من 6")+"</span><span>"+(course.completedProgram?"30 / 30 جلسة":"الجلسة "+(course.session||1)+" من 30")+"</span><span>"+(course.completedProgram?"🏆 تم إنهاء التدريب":course.completed.length+" جلسة مكتملة")+"</span></div></div>"+
        "<div class='heroSide'><h3>"+(course.completedProgram?"تم إنهاء البرنامج بنجاح 🏆":esc(profileTitle()))+"</h3><p>"+(course.completedProgram?"أكملت جميع المراحل واجتزت التقييم النهائي. يمكنك فتح شاشة الإنجاز في أي وقت.":(result?"الجلسة التالية ستستخدم نتيجتك الحالية والأخطاء المسجلة لتحديد نوع التدريب.":"التقييم الأول هو الذي يبني أول مسار تدريبي لك."))+"</p></div>"+
      "</section>"+
      "<section class='actionGrid'>"+
        actionPrimary+
        "<a class='actionCard' href='program.html?demo=1&country="+country+"&start=1'><span class='actionIcon'>"+icon("play")+"</span><span class='actionCopy'><b>جرّب المستوى الأول</b><small>ادخل مباشرة إلى أول جلسة تدريب عملية.</small></span></a>"+
      "</section>"+
      "<div class='sectionHead'><div><h2>مسار الأسابيع</h2><p>"+"كل مرحلة تفتح بعد إكمال السابقة أو بقرار دعم من المشرف."+"</p></div><span class='progressTag'>"+course.completed.length+" / 30</span></div>"+
      "<section class='weekGrid'>"+weeks+"</section>"+
      "<div class='sectionHead'><div><h2>ملف تعلمك</h2><p>عرض مبسط لك — التفاصيل الرقمية الكاملة تظهر للمشرف.</p></div></div>"+
      learningProfile+
      "<div class='sectionHead'><div><h2>الإنجازات</h2><p>إنجازات أكاديمية مرتبطة بإتمام المراحل والمهارات.</p></div></div>"+
      "<section class='achievementStrip'>"+achievements+"</section>"+
    "</main>";

  var cs=document.getElementById("countrySwitch");
  if(cs)cs.onchange=function(){saveStudentPatch({country:cs.value});location.reload();};
  var cp=document.getElementById("changePass");
  if(cp)cp.onclick=function(){changePasswordView(false);};
  var logout=document.getElementById("logout");
  if(logout)logout.onclick=function(){
    localStorage.removeItem(SESSION_KEY);
    location.href="student-login.html";
  };
}

render();
window.addEventListener("pageshow",function(e){
  if(e.persisted){location.reload();}
});
})();