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
  var symbols={lock:"▣",check:"✓",play:"▶",test:"◎",brain:"◉",bulb:"◇",scale:"§",repeat:"↻",pen:"✎",trophy:"◆",compass:"⌖",target:"◎",book:"▤",chart:"▥"};
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
      subject:"rights",
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
var CONSENT_VERSION="2026-10-06-v1",consentOk=true;

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
  if(session.cloud){
    student={id:session.studentId,name:session.name||session.username,username:session.username,cohort:"",university:"Qatar University",year:"السنة الأولى",subject:"rights",country:session.country||"qa",active:true,cloud:true,createdAt:Date.now()};
    students.unshift(student);write(STUDENTS_KEY,students);
  }else{
    session={studentId:seeded.demo.id,name:seeded.demo.name,username:seeded.demo.username,at:Date.now()};
    write(SESSION_KEY,session);
    student=seeded.demo;
  }
}

var country=student.country||session.country||null;
var COUNTRY_SETUP_KEY="lexlearn_country_setup_v1_"+student.id;
var countrySetupDone=read(COUNTRY_SETUP_KEY,false)===true;
var PROFILE_KEY="lexlearn_v9_profile_"+student.id;
var COURSE_KEY=country?"lexlearn_course_v2_"+country+"_"+(country==="qa"?"rights":"sources")+"_"+student.id:null;
var profile=read(PROFILE_KEY,{results:{}});
var profileCourseKey=country+"-"+(country==="qa"?"rights":"sources");
var result=country&&profile.results&&profile.results[profileCourseKey]?profile.results[profileCourseKey]:null;
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
  "الشخصية القانونية والموطن",
  "القرابة والأهلية",
  "الشخص المعنوي",
  "الأشياء والأموال كمحل للحق",
  "استعمال الحق والتعسف فيه",
  "التكامل في نظرية الحق"
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
function adaptiveValue(key){
  var model=course&&course.adaptiveModel,axis=model&&model.axes&&model.axes[key];
  if(axis&&axis.evidence>0)return axis.value;
  return result&&result.metrics?result.metrics[key]:null;
}
function status(value){
  if(value==null)return "لم يُقَس";
  if(value>=80)return "قوي";
  if(value>=60)return "جيد";
  if(value>=40)return "يحتاج تركيز";
  return "أولوية تدريب";
}
function profileTitle(){
  var model=course&&course.adaptiveModel;
  if(model&&model.bridge&&model.bridge.label)return model.bridge.label;
  if(!result)return "ابدأ بالتقييم التشخيصي";
  if(result.profileType==="recall-led")return "ذاكرتك أقوى من الفهم — هنحوّل الحفظ إلى استخدام";
  if(result.profileType==="understanding-led")return "فهمك أقوى من الاسترجاع — هنحوّل المعنى إلى ذاكرة سريعة";
  return "أداء متوازن — هنركز على أقل مهارة حاليًا";
}
function studentInsight(){
  var items=[
    {key:"recall",label:"الاسترجاع",icon:"🧠",value:adaptiveValue("recall")},
    {key:"understanding",label:"الفهم",icon:"💡",value:adaptiveValue("understanding")},
    {key:"application",label:"التطبيق",icon:"⚖️",value:adaptiveValue("application")}
  ].filter(function(x){return x.value!=null;});
  if(!items.length)return {best:null,focus:null,tip:"ابدأ التقييم القصير وسنبني لك تدريبك."};
  var sorted=items.slice().sort(function(a,b){return a.value-b.value;});
  var focus=sorted[0],best=sorted[sorted.length-1];
  var tips={
    recall:"استرجع الفكرة من ذاكرتك قبل أن ترجع للنص.",
    understanding:"اسأل نفسك: لماذا هذه القاعدة تعمل بهذه الطريقة؟",
    application:"جرّب القاعدة على واقعة قصيرة وحدد العنصر الحاسم أولًا."
  };
  return {best:best,focus:focus,tip:tips[focus.key]};
}
function simpleSkillCard(item){
  var value=adaptiveValue(item.key),level=status(value),pct=value==null?0:Math.round(value);
  return "<div class='simpleSkill "+item.key+"'>"+
    "<div class='simpleIcon'>"+icon(item.icon)+"</div>"+
    "<b>"+item.label+"</b>"+
    "<strong>"+(value==null?"—":pct+"%")+"</strong>"+
    "<span>"+level+"</span>"+
    "<div class='miniBar'><i style='width:"+(value==null?5:Math.max(5,Math.min(100,value)))+"%'></i></div>"+
  "</div>";
}
function skillCard(title,key,ic){
  var value=adaptiveValue(key);
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
      "<div class='mark'><img src='assets/lexlearn-logo.svg' alt='LexLearn'></div>"+
      "<span class='eyebrow'>"+(force?"أول تسجيل دخول":"أمان الحساب")+"</span>"+
      "<h1>"+(force?"اختر كلمة مرور جديدة":"تغيير كلمة المرور")+"</h1>"+
      "<p>"+(force?"غيّر كلمة المرور المؤقتة قبل بدء التدريب.":"اكتب كلمة المرور الحالية ثم اختر كلمة مرور جديدة.")+"</p>"+
      (force?"":"<input id='oldPass' type='password' placeholder='كلمة المرور الحالية'>")+
      "<input id='newPass' type='password' placeholder='كلمة المرور الجديدة — 10 أحرف على الأقل'>"+
      "<input id='newPass2' type='password' placeholder='أعد كتابة كلمة المرور الجديدة'>"+
      "<div id='passError'></div>"+
      "<button class='btn primary' id='savePass'>حفظ كلمة المرور</button>"+
      (force?"":"<button class='btn secondary' id='cancelPass'>إلغاء</button>")+
    "</section></main>";
  document.getElementById("savePass").onclick=async function(){
    var a=document.getElementById("newPass").value;
    var b=document.getElementById("newPass2").value;
    var e=document.getElementById("passError");
    if(a.length<10||a!==b){e.textContent="اكتب كلمة مرور من 10 أحرف على الأقل وتأكد من التطابق.";return;}
    if(session.cloud&&window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()){
      try{
        if(!force){
          var old=document.getElementById("oldPass").value;
          await LEX_CLOUD.signInStudent(student.username,old);
        }
        await LEX_CLOUD.setOwnPassword(a);
        student.mustChangePassword=false;
        saveStudentPatch({mustChangePassword:false});
        render();return;
      }catch(err){e.textContent="تعذر تغيير كلمة المرور. تأكد من كلمة المرور الحالية وحاول مرة أخرى.";return;}
    }
    if(!force){
      var oldLocal=document.getElementById("oldPass").value;
      if(oldLocal!==student.password){e.textContent="كلمة المرور الحالية غير صحيحة.";return;}
    }
    saveStudentPatch({password:a,mustChangePassword:false});
    render();
  };
  var c=document.getElementById("cancelPass");if(c)c.onclick=render;
}
function countryGateView(){
  APP.innerHTML=
    "<main class='countryGate'><section class='countryGateCard'>"+
      "<div class='countryBrand'><div class='mark'><img src='assets/lexlearn-logo.svg' alt='LexLearn'></div><div><span class='eyebrow'>ابدأ من هنا</span><h1>اختر دولتك</h1><p>سنضبط المحتوى القانوني والتدريب على المسار المناسب.</p></div></div>"+
      "<div class='countryCards' role='list' aria-label='اختيار الدولة'>"+
        "<button class='countryCard live selected' type='button' data-country-choice='qa'><span class='countryFlag'>🇶🇦</span><b>قطر</b><small>المسار المتاح الآن</small><em>ابدأ</em></button>"+
        "<button class='countryCard muted' type='button' disabled aria-disabled='true'><span class='countryFlag'>🇪🇬</span><b>مصر</b><small>قريبًا</small><em>قيد التجهيز</em></button>"+
        "<button class='countryCard muted' type='button' disabled aria-disabled='true'><span class='countryFlag'>🇸🇦</span><b>السعودية</b><small>قريبًا</small><em>قيد التجهيز</em></button>"+
        "<button class='countryCard muted' type='button' disabled aria-disabled='true'><span class='countryFlag'>🇦🇪</span><b>الإمارات</b><small>قريبًا</small><em>قيد التجهيز</em></button>"+
      "</div>"+
      "<div class='countryMessage'><span>"+icon("compass")+"</span><p><b>قطر أولًا</b><br>نسخة LexLearn الحالية مهيأة لمسار قطر، وباقي الدول ستُفتح تباعًا.</p></div>"+
      "<div id='passError'></div>"+
      "<button class='btn primary countryStart' id='saveCountry'>ابدأ مسار قطر</button>"+
    "</section></main>";
  document.getElementById("saveCountry").onclick=async function(){
    var code="qa";
    var err=document.getElementById("passError");
    if(session.cloud&&window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()){
      try{await LEX_CLOUD.updateOwnProfile({country_code:code});}catch(e){err.textContent="تعذر حفظ الدولة الآن. حاول مرة أخرى.";return;}
    }
    saveStudentPatch({country:code});
    write(COUNTRY_SETUP_KEY,true);
    countrySetupDone=true;
    location.reload();
  };
}
function consentGateView(){
  APP.innerHTML="<main class='passwordGate'><section>"+
    "<div class='mark'><img src='assets/lexlearn-logo.svg' alt='LexLearn'></div>"+
    "<span class='eyebrow'>الخصوصية واستخدام بيانات التعلم</span>"+
    "<h1>قبل بدء المسار</h1>"+
    "<p>يستخدم LexLearn إجاباتك ونتائجك ووقت الاستجابة ومستوى الثقة لبناء تدريب شخصي وقياس التقدم. هذه المؤشرات للتعلم والتدريب وليست درجة جامعية رسمية.</p>"+
    "<p><a href='privacy.html' target='_blank'>سياسة الخصوصية</a> • <a href='terms.html' target='_blank'>شروط الاستخدام</a></p>"+
    "<div id='consentError'></div>"+
    "<button class='btn primary' id='acceptConsent'>أوافق وأبدأ</button>"+
  "</section></main>";
  document.getElementById("acceptConsent").onclick=async function(){
    var e=document.getElementById("consentError");
    try{await LEX_CLOUD.recordConsent(CONSENT_VERSION,"learning_data",true);consentOk=true;render();}
    catch(err){e.textContent="تعذر حفظ الموافقة الآن. حاول مرة أخرى.";e.style.color="var(--red)";}
  };
}
function render(){
  if(session.cloud&&!consentOk){consentGateView();return;}
  if(student.mustChangePassword){
    changePasswordView(true);
    return;
  }
  if(!countrySetupDone){
    countryGateView();
    return;
  }
  if(!student.country){
    countryGateView();
    return;
  }
  country=student.country;
  var w=currentWeek();
  var demoPrefix=session.cloud?"":"demo=1&";
  var weeks=weekTitles.map(function(title,i){
    var n=i+1;
    var st=weekStatus(n);
    var open=st[0]==="current"||st[0]==="need";
    var tag=open?"a":"div";
    var href=open?" href='program.html?"+demoPrefix+"country="+country+"&subject=rights&start=1'":"";
    return "<"+tag+href+" class='week "+st[0]+"'>"+
      "<span class='weekIcon'>"+icon(st[2])+"</span>"+
      "<b>الأسبوع "+n+"</b>"+
      "<small>"+esc(title)+"</small>"+
      "<em>"+st[1]+"</em>"+
    "</"+tag+">";
  }).join("");

  var actionPrimary=course.completedProgram
    ? "<a class='actionCard primary completeAction' href='program.html?"+demoPrefix+"country="+country+"&subject=rights&start=1'><span class='actionIcon'>🏆</span><span class='actionCopy'><b>عرض إنجازك النهائي</b><small>لقد أنهيت البرنامج بالكامل — افتح شاشة الفوز والإنهاء.</small></span></a>"
    : !result
      ? "<a class='actionCard primary' href='showcase.html?country="+country+"&subject=rights'><span class='actionIcon'>"+icon("test")+"</span><span class='actionCopy'><b>ابدأ التقييم التشخيصي</b><small>يفتح الاختبار مباشرة بدل الرجوع للصفحة الرئيسية.</small></span></a>"
      : "<a class='actionCard primary' href='program.html?"+demoPrefix+"country="+country+"&subject=rights&start=1'><span class='actionIcon'>"+icon("play")+"</span><span class='actionCopy'><b>أكمل جلسة اليوم</b><small>يفتح التدريب الفعلي مباشرة.</small></span></a>";

  var insight=studentInsight();
  var learningProfile=result
    ? "<section class='simpleProfile'>"+
        "<div class='simpleIntro'><div><span class='eyebrow'>مستواك الآن</span><h3>"+esc(profileTitle())+"</h3></div></div>"+
        "<div class='simpleSkillGrid'>"+
          simpleSkillCard({key:"recall",label:"الاسترجاع",icon:"brain"})+
          simpleSkillCard({key:"understanding",label:"الفهم",icon:"bulb"})+
          simpleSkillCard({key:"application",label:"التطبيق",icon:"scale"})+
        "</div>"+
        "<div class='studentTipGrid'>"+
          "<div class='tipCard good'><span>"+icon("chart")+"</span><div><small>أقوى نقطة</small><b>"+esc(insight.best?insight.best.label:"—")+"</b></div></div>"+
          "<div class='tipCard focus'><span>"+icon("target")+"</span><div><small>ركز الآن على</small><b>"+esc(insight.focus?insight.focus.label:"—")+"</b></div></div>"+
          "<div class='tipCard today'><span>"+icon("book")+"</span><div><small>نصيحة اليوم</small><b>"+esc(insight.tip)+"</b></div></div>"+
        "</div>"+
      "</section>"
    : "<div class='empty studentEmpty'>ابدأ التقييم القصير، وبعده سترى 3 مؤشرات بسيطة: الاسترجاع، الفهم، والتطبيق.</div>";

  var achievements=course.achievements.length
    ? course.achievements.map(function(a){
        var sub=a.status==="program-complete"?"6 مراحل • 30 جلسة • مكتمل":("الأسبوع "+a.week+" • "+(a.status==="mastered"?"بإتقان":"مكتمل"));
        return "<div class='badge "+(a.status==="program-complete"?"finalBadge":"")+"'><span class='badgeIcon'>"+icon("trophy")+"</span><div><b>"+achievementName(a)+"</b><small>"+sub+"</small></div></div>";
      }).join("")
    : "<div class='empty'>أول Badge يظهر بعد إنهاء تقييم الأسبوع الأول.</div>";

  APP.innerHTML=
    "<header class='top'><div class='topin'>"+
      "<div class='brand'><div class='mark'><img src='assets/lexlearn-logo.svg' alt='LexLearn'></div><div><b>LexLearn</b><small>حساب الطالب</small></div></div>"+
      "<div class='topactions'><select class='topbtn countryTop' id='countrySwitch'>"+countryOptions(country)+"</select><button class='topbtn' id='changePass'>تغيير كلمة المرور</button><a class='topbtn' href='index.html'>الموقع</a><button class='topbtn' id='logout'>خروج</button></div>"+
    "</div></header>"+
    "<main class='wrap'>"+
      "<section class='hero "+(course.completedProgram?"heroComplete":"")+"'>"+
        "<div class='heroMain'><span class='eyebrow'>"+esc(student.cohort||"برنامج التدريب")+"</span><h1>"+(course.completedProgram?"مبروك "+esc(student.name)+"!":"أهلًا "+esc(student.name))+"</h1><p>"+countryLabel(country)+" • برنامج مصادر الالتزام • 6 أسابيع • 30 جلسة عملية</p>"+
        "<div class='heroMeta'><span>"+(course.completedProgram?"6 / 6 مراحل مكتملة":"الأسبوع "+w+" من 6")+"</span><span>"+(course.completedProgram?"30 / 30 جلسة":"الجلسة "+(course.session||1)+" من 30")+"</span><span>"+(course.completedProgram?"تم إنهاء التدريب":course.completed.length+" جلسة مكتملة")+"</span></div></div>"+
        "<div class='heroSide studentHeroSide'><div class='heroVisual'>"+icon(course.completedProgram?"trophy":"compass")+"</div><h3>"+(course.completedProgram?"أحسنت! أنهيت البرنامج":"جاهز للجلسة التالية؟")+"</h3><p>"+(course.completedProgram?"يمكنك عرض إنجازك النهائي في أي وقت.":(result?"جلسة واحدة قصيرة، ومحتواها يتغير حسب مستواك.":"ابدأ التقييم القصير لنحدد أفضل بداية لك."))+"</p></div>"+
      "</section>"+
      "<section class='actionGrid singleAction'>"+actionPrimary+"</section>"+
      "<div class='sectionHead'><div><h2>رحلتك</h2><p>كلما أنهيت مرحلة، تفتح التالية تلقائيًا.</p></div><span class='progressTag'>"+course.completed.length+" / 30</span></div>"+
      "<section class='weekGrid'>"+weeks+"</section>"+
      "<div class='sectionHead'><div><h2>مستواك ببساطة</h2><p>3 مؤشرات فقط تساعدك تعرف أين أنت الآن.</p></div></div>"+
      learningProfile+
      "<div class='sectionHead'><div><h2>إنجازاتك</h2><p>كل مرحلة تنهيها تضيف إنجازًا جديدًا.</p></div></div>"+
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

async function boot(){
  if(session.cloud&&window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()){
    try{
      var cloudProfile=await LEX_CLOUD.profile();
      var consent=await LEX_CLOUD.getConsent(CONSENT_VERSION,"learning_data");
      consentOk=!!consent;
      if(cloudProfile){
        student.name=cloudProfile.display_name||student.name;
        student.username=cloudProfile.username||student.username;
        student.university=cloudProfile.university||student.university;
        student.year=cloudProfile.year_label||student.year;
        student.country=cloudProfile.country_code||student.country||"qa";
        student.mustChangePassword=!!cloudProfile.must_change_password;
        saveStudentPatch({name:student.name,username:student.username,university:student.university,year:student.year,country:student.country,mustChangePassword:student.mustChangePassword});
      }
      country=student.country||session.country||"qa";
      PROFILE_KEY="lexlearn_v9_profile_"+student.id;
      COURSE_KEY="lexlearn_course_v2_"+country+"_"+(country==="qa"?"rights":"sources")+"_"+student.id;
      var ps=await LEX_CLOUD.loadSnapshot({courseId:country+"-"+(country==="qa"?"rights":"sources"),snapshotType:"profile"});
      if(ps&&ps.state){
        profile=ps.state;write(PROFILE_KEY,profile);result=profile.results&&profile.results[country+"-"+(country==="qa"?"rights":"sources")]||null;
      }else if(profile&&profile.results&&profile.results[country+"-"+(country==="qa"?"rights":"sources")]){
        // Recover a diagnostic that was completed in this browser before central sync was enabled.
        await LEX_CLOUD.saveSnapshot({courseId:country+"-"+(country==="qa"?"rights":"sources"),snapshotType:"profile",state:profile});
        result=profile.results[country+"-"+(country==="qa"?"rights":"sources")]||null;
      }
      var cs=await LEX_CLOUD.loadSnapshot({courseId:country+"-"+(country==="qa"?"rights":"sources"),snapshotType:"course"});
      if(cs&&cs.state){
        course=cs.state;write(COURSE_KEY,course);
      }else if(course&&((course.completed&&course.completed.length)||(course.evidence&&course.evidence.length)||Number(course.session)>1)){
        // Recover real training progress already completed by this signed-in student in this browser.
        await LEX_CLOUD.saveSnapshot({courseId:country+"-"+(country==="qa"?"rights":"sources"),snapshotType:"course",state:course});
      }
    }catch(e){}
  }
  render();
}
boot();
window.addEventListener("pageshow",function(e){
  if(e.persisted){location.reload();}
});
})();