(function(){
"use strict";

var APP=document.getElementById("studentApp");
var SESSION_KEY="lexlearn_student_session";
var STUDENTS_KEY="lexlearn_students_v2";
var COUNTRIES={qa:"Qatar",eg:"Egypt",sa:"Saudi Arabia",ae:"UAE",other:"Other country"};
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
      name:"Demo Student 01",
      username:"student01",
      password:"Learn2027!",
      cohort:"Pilot A",
      university:"Qatar University",
      year:"First Year",
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
  location.replace("student-login-en.html");
  return;
}

var student=students.find(function(x){return x.id===session.studentId;});
if(!student){
  if(session.cloud){
    student={id:session.studentId,name:session.name||session.username,username:session.username,cohort:"",university:"Qatar University",year:"First Year",subject:"rights",country:session.country||"qa",active:true,cloud:true,createdAt:Date.now()};
    students.unshift(student);write(STUDENTS_KEY,students);
  }else{
    session={studentId:seeded.demo.id,name:seeded.demo.name,username:seeded.demo.username,at:Date.now()};
    write(SESSION_KEY,session);
    student=seeded.demo;
  }
}

var country=student.country||session.country||null;
var COUNTRY_SETUP_KEY="lexlearn_country_setup_v2_rights_"+student.id;
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
  "Legal personality and domicile",
  "Kinship and legal capacity",
  "Legal persons",
  "Property as the object of rights",
  "Exercise and abuse of rights",
  "Integration of the Theory of Rights"
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
  if(!result)return ["locked",n===1?"Available after the diagnostic":"Locked until the previous stage is passed","lock"];
  if(r&&r.status==="repair")return ["need","Needs reinforcement","repeat"];
  if(r)return ["done",r.status==="mastered"?"Mastered":"Completed","check"];
  if(course.adminOverrideWeeks[n])return ["current","Opened by supervisor","play"];
  if(n===1||passedWeek(n-1))return ["current","Available now","play"];
  return ["locked","Locked until the previous stage is passed","lock"];
}
function adaptiveValue(key){
  var model=course&&course.adaptiveModel,axis=model&&model.axes&&model.axes[key];
  if(axis&&axis.evidence>0)return axis.value;
  return result&&result.metrics?result.metrics[key]:null;
}
function status(value){
  if(value==null)return "Not measured";
  if(value>=80)return "Strong";
  if(value>=60)return "Good";
  if(value>=40)return "Needs focus";
  return "Training priority";
}
function profileTitle(){
  var model=course&&course.adaptiveModel;
  if(model&&model.bridge&&model.bridge.label)return model.bridge.label;
  if(!result)return "Start with the diagnostic";
  if(result.profileType==="recall-led")return "Recall is stronger than understanding — we will turn what you remember into usable understanding";
  if(result.profileType==="understanding-led")return "Understanding is stronger than recall — we will turn meaning into faster retrieval";
  return "Balanced performance — we will focus on the weakest skill now";
}
function studentInsight(){
  var items=[
    {key:"recall",label:"Recall",icon:"🧠",value:adaptiveValue("recall")},
    {key:"understanding",label:"Understanding",icon:"💡",value:adaptiveValue("understanding")},
    {key:"application",label:"Application",icon:"⚖️",value:adaptiveValue("application")}
  ].filter(function(x){return x.value!=null;});
  if(!items.length)return {best:null,focus:null,tip:"Start the short diagnostic and we will build your training."};
  var sorted=items.slice().sort(function(a,b){return a.value-b.value;});
  var focus=sorted[0],best=sorted[sorted.length-1];
  var tips={
    recall:"Retrieve the rule from memory before reopening the text.",
    understanding:"Ask yourself: why does this rule work this way?",
    application:"Apply the rule to a short fact pattern and identify the decisive fact first."
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
  if(a.status==="program-complete")return "Program completed LexLearn";
  if(a.status==="mastered")return "Stage mastered";
  if(a.status==="completed_with_support")return "Progress after support";
  return "Stage completed";
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
      "<span class='eyebrow'>"+(force?"First sign-in":"Account security")+"</span>"+
      "<h1>"+(force?"Choose a new password":"Change password")+"</h1>"+
      "<p>"+(force?"Change the temporary password before starting training.":"Enter your current password, then choose a new one.")+"</p>"+
      (force?"":"<input id='oldPass' type='password' placeholder='Current password'>")+
      "<input id='newPass' type='password' placeholder='New password — at least 10 characters'>"+
      "<input id='newPass2' type='password' placeholder='Re-enter the new password'>"+
      "<div id='passError'></div>"+
      "<button class='btn primary' id='savePass'>Save password</button>"+
      (force?"":"<button class='btn secondary' id='cancelPass'>Cancel</button>")+
    "</section></main>";
  document.getElementById("savePass").onclick=async function(){
    var a=document.getElementById("newPass").value;
    var b=document.getElementById("newPass2").value;
    var e=document.getElementById("passError");
    if(a.length<10||a!==b){e.textContent="Use at least 10 characters and make sure both entries match.";return;}
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
      }catch(err){e.textContent="Could not change the password. Check the current password and try again.";return;}
    }
    if(!force){
      var oldLocal=document.getElementById("oldPass").value;
      if(oldLocal!==student.password){e.textContent="The current password is incorrect.";return;}
    }
    saveStudentPatch({password:a,mustChangePassword:false});
    render();
  };
  var c=document.getElementById("cancelPass");if(c)c.onclick=render;
}
function countryGateView(){
  APP.innerHTML=
    "<main class='countryGate'><section class='countryGateCard'>"+
      "<div class='countryBrand'><div class='mark'><img src='assets/lexlearn-logo.svg' alt='LexLearn'></div><div><span class='eyebrow'>Start here</span><h1>Choose your jurisdiction</h1><p>We will tailor the legal content and training to the selected jurisdiction.</p></div></div>"+
      "<div class='countryCards' role='list' aria-label='Jurisdiction selection'>"+
        "<button class='countryCard live selected' type='button' data-country-choice='qa'><span class='countryFlag'>🇶🇦</span><b>Qatar</b><small>Available now</small><em>Start</em></button>"+
        "<button class='countryCard muted' type='button' disabled aria-disabled='true'><span class='countryFlag'>🇪🇬</span><b>Egypt</b><small>Coming soon</small><em>In preparation</em></button>"+
        "<button class='countryCard muted' type='button' disabled aria-disabled='true'><span class='countryFlag'>🇸🇦</span><b>Saudi Arabia</b><small>Coming soon</small><em>In preparation</em></button>"+
        "<button class='countryCard muted' type='button' disabled aria-disabled='true'><span class='countryFlag'>🇦🇪</span><b>UAE</b><small>Coming soon</small><em>In preparation</em></button>"+
      "</div>"+
      "<div class='countryMessage'><span>"+icon("compass")+"</span><p><b>Qatar first</b><br>The LexLearn current LexLearn version is configured for Qatar. Other jurisdictions will be released progressively.</p></div>"+
      "<div id='passError'></div>"+
      "<button class='btn primary countryStart' id='saveCountry'>Start the Qatar program</button>"+
    "</section></main>";
  document.getElementById("saveCountry").onclick=async function(){
    var code="qa";
    var err=document.getElementById("passError");
    if(session.cloud&&window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()){
      try{await LEX_CLOUD.updateOwnProfile({country_code:code});}catch(e){err.textContent="Could not save the jurisdiction. Please try again.";return;}
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
    "<span class='eyebrow'>Privacy and learning data</span>"+
    "<h1>Before you begin</h1>"+
    "<p>LexLearn uses LexLearn your answers, results, response time, and confidence level to personalize training and measure progress. These indicators are for learning and training and are not an official university grade.</p>"+
    "<p><a href='privacy.html' target='_blank'>Privacy Policy</a> • <a href='terms.html' target='_blank'>Terms of Use</a></p>"+
    "<div id='consentError'></div>"+
    "<button class='btn primary' id='acceptConsent'>I agree and continue</button>"+
  "</section></main>";
  document.getElementById("acceptConsent").onclick=async function(){
    var e=document.getElementById("consentError");
    try{await LEX_CLOUD.recordConsent(CONSENT_VERSION,"learning_data",true);consentOk=true;render();}
    catch(err){e.textContent="Could not save your consent. Please try again.";e.style.color="var(--red)";}
  };
}
function render(){
  if(!countrySetupDone||!student.country){
    countryGateView();
    return;
  }
  if(student.mustChangePassword){
    changePasswordView(true);
    return;
  }
  if(session.cloud&&!consentOk){consentGateView();return;}
  country=student.country;
  var w=currentWeek();
  var demoPrefix=session.cloud?"":"demo=1&";
  var weeks=weekTitles.map(function(title,i){
    var n=i+1;
    var st=weekStatus(n);
    var open=st[0]==="current"||st[0]==="need";
    var tag=open?"a":"div";
    var href=open?" href='program-en.html?"+demoPrefix+"country="+country+"&subject=rights&start=1'":"";
    return "<"+tag+href+" class='week "+st[0]+"'>"+
      "<span class='weekIcon'>"+icon(st[2])+"</span>"+
      "<b>Week "+n+"</b>"+
      "<small>"+esc(title)+"</small>"+
      "<em>"+st[1]+"</em>"+
    "</"+tag+">";
  }).join("");

  var actionPrimary=course.completedProgram
    ? "<a class='actionCard primary completeAction' href='program-en.html?"+demoPrefix+"country="+country+"&subject=rights&start=1'><span class='actionIcon'>🏆</span><span class='actionCopy'><b>View your final achievement</b><small>You have completed the full program — open the final achievement screen.</small></span></a>"
    : !result
      ? "<a class='actionCard primary' href='showcase-en.html?country="+country+"&subject=rights'><span class='actionIcon'>"+icon("test")+"</span><span class='actionCopy'><b>Start the diagnostic</b><small>Opens the diagnostic directly.</small></span></a>"
      : "<a class='actionCard primary' href='program-en.html?"+demoPrefix+"country="+country+"&subject=rights&start=1'><span class='actionIcon'>"+icon("play")+"</span><span class='actionCopy'><b>Continue today's session</b><small>Opens the active training session directly.</small></span></a>";

  var insight=studentInsight();
  var learningProfile=result
    ? "<section class='simpleProfile'>"+
        "<div class='simpleIntro'><div><span class='eyebrow'>Your current level</span><h3>"+esc(profileTitle())+"</h3></div></div>"+
        "<div class='simpleSkillGrid'>"+
          simpleSkillCard({key:"recall",label:"Recall",icon:"brain"})+
          simpleSkillCard({key:"understanding",label:"Understanding",icon:"bulb"})+
          simpleSkillCard({key:"application",label:"Application",icon:"scale"})+
        "</div>"+
        "<div class='studentTipGrid'>"+
          "<div class='tipCard good'><span>"+icon("chart")+"</span><div><small>Strongest area</small><b>"+esc(insight.best?insight.best.label:"—")+"</b></div></div>"+
          "<div class='tipCard focus'><span>"+icon("target")+"</span><div><small>Focus now on</small><b>"+esc(insight.focus?insight.focus.label:"—")+"</b></div></div>"+
          "<div class='tipCard today'><span>"+icon("book")+"</span><div><small>Today's tip</small><b>"+esc(insight.tip)+"</b></div></div>"+
        "</div>"+
      "</section>"
    : "<div class='empty studentEmpty'>Start the short diagnostic. Then you will see three simple indicators: recall, understanding, and application.</div>";

  var achievements=course.achievements.length
    ? course.achievements.map(function(a){
        var sub=a.status==="program-complete"?"6 stages • 30 sessions • completed":("Week "+a.week+" • "+(a.status==="mastered"?"with mastery":"Completed"));
        return "<div class='badge "+(a.status==="program-complete"?"finalBadge":"")+"'><span class='badgeIcon'>"+icon("trophy")+"</span><div><b>"+achievementName(a)+"</b><small>"+sub+"</small></div></div>";
      }).join("")
    : "<div class='empty'>First Badge Appears after completing the first weekly assessment.</div>";

  APP.innerHTML=
    "<header class='top'><div class='topin'>"+
      "<div class='brand'><div class='mark'><img src='assets/lexlearn-logo.svg' alt='LexLearn'></div><div><b>LexLearn</b><small>Student Portal</small></div></div>"+
      "<div class='topactions'><span class='topbtn countryTop staticCountry'>🇶🇦 Qatar</span><button class='topbtn' id='changePass'>Change password</button><a class='topbtn' href='index-en.html'>Website</a><button class='topbtn' id='logout'>Sign out</button></div>"+
    "</div></header>"+
    "<main class='wrap'>"+
      "<section class='hero "+(course.completedProgram?"heroComplete":"")+"'>"+
        "<div class='heroMain'><span class='eyebrow'>"+esc(student.cohort||"Training Program")+"</span><h1>"+(course.completedProgram?"Congratulations "+esc(student.name)+"!":"Welcome "+esc(student.name))+"</h1><p>"+countryLabel(country)+" • Theory of Rights • 6 weeks • 30 practical sessions</p>"+
        "<div class='heroMeta'><span>"+(course.completedProgram?"6 / 6 Stages completed":"Week "+w+" of 6")+"</span><span>"+(course.completedProgram?"30 / 30 Session":"Session "+(course.session||1)+" of 30")+"</span><span>"+(course.completedProgram?"Training completed":course.completed.length+" Session completed")+"</span></div></div>"+
        "<div class='heroSide studentHeroSide'><div class='heroVisual'>"+icon(course.completedProgram?"trophy":"compass")+"</div><h3>"+(course.completedProgram?"Well done! You completed the program":"Ready for the next session?")+"</h3><p>"+(course.completedProgram?"You can view your final achievement at any time.":(result?"One short session whose content changes with your performance.":"Start the short diagnostic so we can determine the best starting point."))+"</p></div>"+
      "</section>"+
      "<section class='actionGrid singleAction'>"+actionPrimary+"</section>"+
      "<div class='sectionHead'><div><h2>Your program</h2><p>Each stage unlocks after you complete the previous one.</p></div><span class='progressTag'>"+course.completed.length+" / 30</span></div>"+
      "<section class='weekGrid'>"+weeks+"</section>"+
      "<div class='sectionHead'><div><h2>Your level at a glance</h2><p>3 Simple indicators show where you currently stand.</p></div></div>"+
      learningProfile+
      "<div class='sectionHead'><div><h2>Your achievements</h2><p>Each completed stage adds a new achievement.</p></div></div>"+
      "<section class='achievementStrip'>"+achievements+"</section>"+
    "</main>";

  var cp=document.getElementById("changePass");
  if(cp)cp.onclick=function(){changePasswordView(false);};
  var logout=document.getElementById("logout");
  if(logout)logout.onclick=function(){
    localStorage.removeItem(SESSION_KEY);
    location.href="student-login-en.html";
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