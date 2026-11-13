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
// Production student accounts must be real authenticated users. No local demo identities.
var students=read(STUDENTS_KEY,[]);
var params=new URLSearchParams(location.search);
var session=read(SESSION_KEY,null);
var CONSENT_VERSION="2026-10-06-v1",consentOk=true;
var glossaryAllowed=false;

if(params.get("demo")==="1"){
  location.replace("showcase-en.html");return;
}

// Initialize placeholders only; boot replaces them with the verified Auth identity.
session=session&&session.cloud?session:{cloud:true};

var student=students.find(function(x){return x.id===session.studentId;});
if(!student){
 student={id:session.studentId,name:session.name||session.username,username:session.username,
   cohort:"",university:"",year:"",subject:"rights",country:session.country||"qa",
   active:true,cloud:true,createdAt:Date.now()};
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
  if(session.cloud){
    if(!result||!student.trainingUnlocked)return ["locked","Diagnostic required","lock"];
    var current=Math.ceil(student.trainingUnlocked/5);
    if(n<current)return ["done","Practice completed","check"];
    if(n===current)return ["current","Available in adaptive path","play"];
    return ["locked","Complete preceding sessions","lock"];
  }
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
function profileTitle(){return "Build your skills, one step at a time";}
function studentInsight(){return {best:null,focus:null,tip:"Keep practising both skills. We will review the indicators as more evidence is saved."};}
function diagnosticSkillPercent(key){
 if(!result||!result.measurements)return null;
 function valid(x){return typeof x==="number"&&Number.isFinite(x)&&x>=0&&x<=100?Math.round(x):null;}
 if(key==="understanding")return valid(result.metrics&&result.metrics.understanding);
 if(key!=="recall")return null;
 var rec=result.measurements.recall||{},ai=rec.ai_grade||{},fix=rec.corrected_internal_grade||{},internal=rec.internal_grade||{};
 if(ai.status==="preliminary_ai"&&valid(ai.provisional_percent)!==null)return valid(ai.provisional_percent);
 if(fix.status==="preliminary_internal"&&valid(fix.provisional_percent)!==null)return valid(fix.provisional_percent);
 var criteria=(Array.isArray(internal.criteria_met)?internal.criteria_met:[]).concat(Array.isArray(internal.criteria_missing)?internal.criteria_missing:[]);
 if(internal.status==="preliminary_internal"&&["live_birth","death_end","prenatal_conditional_rights"].every(function(x){return criteria.includes(x);}))
  return valid(internal.provisional_percent);
 return null;
}
function simpleSkillCard(item){
 var value=diagnosticSkillPercent(item.key),known=value!==null;
 var valueText=known?value+"%":"Not measured yet";
 var recall=item.key==="recall";
 var cue=recall?"Remember the rule":"Explain the meaning";
 var practice=recall?"Recall the rule before opening the text.":"Explain why the rule applies, using your own example.";
 return "<article class='simpleSkill "+item.key+(known?"":" unmeasured")+"'>"+
 "<div class='skillCardHeading'><span class='skillSymbol' aria-hidden='true'>"+icon(item.icon)+"</span><div><b>"+esc(item.label)+"</b><span class='skillCue'>"+cue+"</span></div><span class='skillEstimate'>Preliminary estimate</span></div>"+
 "<div class='skillMeter' role='img' aria-label='"+esc(item.label+": "+valueText+" · Preliminary estimate")+"'>"+
 "<svg viewBox='0 0 120 120' aria-hidden='true' focusable='false'><circle class='skillRingTrack' cx='60' cy='60' r='51'/><circle class='skillRingValue' cx='60' cy='60' r='51' pathLength='100' stroke-dasharray='100' stroke-dashoffset='"+(known?100-value:100)+"'/></svg>"+
 "<div class='skillMeterValue' aria-hidden='true'><strong dir='ltr'>"+(known?value+"<small>%</small>":"—")+"</strong><span>"+(known?"Your starting point":"Not measured yet")+"</span></div></div>"+
 "<p class='skillPractice'>"+practice+"</p></article>";
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
  // Existing registration records the agreement once; no new consent button inside the course.
  APP.innerHTML="<main class='passwordGate'><section><div class='mark'><img src='assets/lexlearn-logo.svg' alt='LexLearn'></div>"+
    "<h1>Registration agreement could not be verified</h1>"+
    "<p>Your account does not have a valid stored learning-data agreement. No learning data will be processed until your supervisor checks the original registration record. You will not be asked to accept new terms during training.</p>"+
    "<p><a href='privacy-en.html'>Privacy policy</a> • <a href='terms-en.html'>Terms</a></p></section></main>";
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
  var demoPrefix="";
  var weeks=weekTitles.map(function(title,i){
    var n=i+1;
    var st=weekStatus(n);
    var open=st[0]==="current"||st[0]==="need";
    var tag=open?"a":"div";
    var href=open?" href='student-path.html?lang=en&session="+Math.max(1,(n-1)*5+1)+"'":"";
    return "<"+tag+href+" class='week "+st[0]+"'>"+
      "<span class='weekIcon'>"+icon(st[2])+"</span>"+
      "<b>Week "+n+"</b>"+
      "<small>"+esc(title)+"</small>"+
      "<em>"+st[1]+"</em>"+
    "</"+tag+">";
  }).join("");

  var actionPrimary=course.completedProgram
    ? "<a class='actionCard primary completeAction' href='student-path.html?lang=en'><span class='actionIcon'>🏆</span><span class='actionCopy'><b>View your final achievement</b><small>You have completed the full program — open the final achievement screen.</small></span></a>"
    : !result
      ? "<a class='actionCard primary' href='"+"diagnostic.html?lang=en" + "'><span class='actionIcon'>"+icon("test")+"</span><span class='actionCopy'><b>Start the diagnostic</b><small>Opens the diagnostic directly.</small></span></a>"
      : "<a class='actionCard primary' href='student-path.html?lang=en'><span class='actionIcon'>"+icon("play")+"</span><span class='actionCopy'><b>Continue today's session</b><small>Opens the active training session directly.</small></span></a>";

  var insight=studentInsight();
  var learningProfile=result
    ? "<section class='simpleProfile' aria-labelledby='skillProfileTitle'>"+
        "<div class='simpleIntro'><div><span class='eyebrow'>YOUR LEARNING SNAPSHOT</span><h3 id='skillProfileTitle'>Build your skills, one step at a time</h3><p class='skillProfileLead'>A starting point for your practice. We review these indicators as new evidence is saved.</p></div><span class='skillJourneyMark' aria-hidden='true'>✦</span></div>"+
        "<div class='simpleSkillGrid'>"+
          simpleSkillCard({key:"recall",label:"Recall",icon:"brain"})+
          simpleSkillCard({key:"understanding",label:"Understanding",icon:"bulb"})+
        "</div>"+
        "<div class='skillNextStep'><span class='skillNextIcon' aria-hidden='true'>↗</span><div><b>Keep the momentum</b><p>Practise recalling a rule, then explain it in your own words.</p></div><a class='btn primary' href='student-path.html?lang=en'>Continue training <span aria-hidden='true'>→</span></a></div>"+
        "<p class='skillEstimateNote'>Preliminary estimates from your assessment. They are not a passing grade or a final measure of mastery.</p>"+
      "</section>"
    : "<div class='empty studentEmpty'>Start the short diagnostic to see your initial recall and understanding estimates.</div>";

  var achievements=course.achievements.length
    ? course.achievements.map(function(a){
        var sub=a.status==="program-complete"?"6 stages • 30 sessions • completed":("Week "+a.week+" • "+(a.status==="mastered"?"with mastery":"Completed"));
        return "<div class='badge "+(a.status==="program-complete"?"finalBadge":"")+"'><span class='badgeIcon'>"+icon("trophy")+"</span><div><b>"+achievementName(a)+"</b><small>"+sub+"</small></div></div>";
      }).join("")
    : "<div class='empty'>Your first achievement appears after completing the first weekly assessment.</div>";

  APP.innerHTML=
    "<header class='top'><div class='topin'>"+
      "<div class='brand'><div class='mark'><img src='assets/lexlearn-logo.svg' alt='LexLearn'></div><div><b>LexLearn</b><small>Student Portal • We understand your mind and build your path.</small></div></div>"+
      "<div class='topactions'><span class='topbtn countryTop staticCountry'>🇶🇦 Qatar</span><a class='topbtn' href='student.html'>العربية</a><button class='topbtn' id='changePass'>Change password</button><span class='topbtn' aria-disabled='true' title='Public demo is unavailable in student accounts' style='opacity:.42;cursor:not-allowed;filter:grayscale(1);pointer-events:none' tabindex='-1'>◈ Public demo · Visitors only</span><a class='topbtn' href='index-en.html'>Website</a><button class='topbtn' id='logout'>Sign out</button></div>"+
    "</div></header>"+
    "<main class='wrap'>"+
      "<section class='learnerWelcome'><div><h2>Your next step</h2><p>Your saved progress is ready. Continue at your own pace.</p></div>"+actionPrimary+"</section>"+
      "<section class='hero "+(course.completedProgram?"heroComplete":"")+"'>"+
        "<div class='heroMain'><span class='eyebrow'>"+esc(student.cohort||"Training Program")+"</span><h1>"+(course.completedProgram?"Congratulations "+esc(student.name)+"!":"Welcome "+esc(student.name))+"</h1><p>"+countryLabel(country)+" • Theory of Rights • 6 weeks • 30 practical sessions</p>"+
        "<div class='heroMeta'><span>"+(course.completedProgram?"6 / 6 Stages completed":"Week "+w+" of 6")+"</span><span>"+(course.completedProgram?"30 / 30 Sessions":"Session "+(course.session||1)+" of 30")+"</span><span>"+(course.completedProgram?"Training completed":course.completed.length+" sessions completed")+"</span></div></div>"+
        "<div class='heroSide studentHeroSide'><div class='heroVisual'>"+icon(course.completedProgram?"trophy":"compass")+"</div><h3>"+(course.completedProgram?"Well done! You completed the program":"Ready for the next session?")+"</h3><p>"+(course.completedProgram?"You can view your final achievement at any time.":(result?"One short session whose content changes with your performance.":"Start the short diagnostic so we can determine the best starting point."))+"</p></div>"+
      "</section>"+
      
      (result?"<p style='margin-top:1rem'><a class='topbtn' href='student-path.html?lang=en'>Open all 30 adaptive sessions</a> · <a class='topbtn' href='diagnostic.html?lang=en'>View saved diagnostic results and skill scores</a></p>":"")+
      "<div class='sectionHead'><div><h2>Your program</h2><p>Each stage unlocks after you complete the previous one.</p></div><span class='progressTag'>"+course.completed.length+" / 30</span></div>"+
      "<section class='weekGrid'>"+weeks+"</section>"+
      "<div class='sectionHead'><div><h2>Your level at a glance</h2><p>3 Simple indicators show where you currently stand.</p></div></div>"+
      learningProfile+
      "<section class='learnerWelcome'><div><h2>📖 My legal dictionary</h2><p>Choose and save terms that catch your attention, then revisit your personal dictionary.</p></div>"+(glossaryAllowed?"<a class='actionCard primary' data-lex-glossary-link='1' href='student-glossary.html?lang=en'>Open dictionary</a>":"<span class='lexGlossaryLocked' aria-disabled='true' role='status'>🔒 Your legal dictionary becomes available when this session is completed.</span>")+"</section>"+
      "<div class='sectionHead'><div><h2>Your achievements</h2><p>Each completed stage adds a new achievement.</p></div></div>"+
      "<section class='achievementStrip'>"+achievements+"</section>"+
    "</main>";

  var cp=document.getElementById("changePass");
  if(cp)cp.onclick=function(){changePasswordView(false);};
  var logout=document.getElementById("logout");
  if(logout)logout.onclick=async function(){
    if(session.cloud&&window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured())await LEX_CLOUD.signOut().catch(function(){});
    localStorage.removeItem(SESSION_KEY);
    location.replace("student-login-en.html");
  };
}

async function boot(){
  if(session.cloud&&(!window.LEX_CLOUD||!LEX_CLOUD.isConfigured||!LEX_CLOUD.isConfigured())){APP.textContent="Cloud authentication is currently unavailable; progress was not verified.";return;}
  if(session.cloud&&window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()){
    try{
      var cloudProfile=await LEX_CLOUD.requireStudent();
      // Never compare Auth to a stale locally cached account or reuse another student's state.
      student={id:cloudProfile.id,cloud:true,active:true};
      session={studentId:cloudProfile.id,name:cloudProfile.display_name,username:cloudProfile.username,country:cloudProfile.country_code,cloud:true,at:Date.now()};
      write(SESSION_KEY,session);
      COUNTRY_SETUP_KEY="lexlearn_country_setup_v2_rights_"+student.id;
      countrySetupDone=read(COUNTRY_SETUP_KEY,false)===true;
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
      // Authoritative state comes ONLY from the server lifecycle RPC.
      if(!consentOk){consentGateView();return;}
      var status=await LEX_CLOUD.studentLifecycleRpc("status",{courseId:"qa-qu-lawc101-rights"});
      result=status.status==="completed"&&status.result&&status.result.source==="server_finalized_diagnostic"&&status.result.student_id===student.id?status.result:null;
      if(result)result.trainingPlan=status.training_plan;
      course={session:1,completed:[],weekResults:{},achievements:[],adminOverrideWeeks:{},completedProgram:false,repairRequired:false};
      var level=await LEX_CLOUD.studentLifecycleRpc("level",{courseId:"qa-qu-lawc101-rights",level:1});
      student.academicLevelOneAllowed=false;
      student.levelOneSavedCount=0;
      if(result&&level.allowed){
        var officialLevel=await LEX_CLOUD.studentLifecycleRpc("firstLevel",{courseId:"qa-qu-lawc101-rights"});
        student.academicLevelOneAllowed=!!(officialLevel&&officialLevel.allowed&&officialLevel.tasks&&officialLevel.tasks.length===3);
        if(student.academicLevelOneAllowed&&officialLevel.saved)student.levelOneSavedCount=officialLevel.saved.length;
      }
      student.diagnosticStatus=status.status;
       student.trainingUnlocked=0;
       student.trainingCompleted=0;
       if(result){
         var training=await LEX_CLOUD.studentLifecycleRpc("trainingOverview",{courseId:"qa-qu-lawc101-rights"});
         if(training&&training.allowed){
           student.trainingUnlocked=training.unlocked;
           student.trainingCompleted=training.completed_count;
           course.session=Math.max(1,training.unlocked);
           course.completed=Array.from({length:training.completed_count},function(_,i){return i+1;});
           course.completedProgram=!!training.program_completed;
         }
       }

    }catch(e){
      var reason=String(e&&e.message||"");
      if(LEX_CLOUD.sessionFailure(e)||reason==='student_account_not_active'){
        await LEX_CLOUD.clearStudentSession().catch(function(){});
        location.replace('student-login-en.html?reason=session');return;
      }

      APP.innerHTML=/not_enrolled|enrollment|course_not_assigned/i.test(reason)
        ?"<section role='alert' class='empty studentEmpty'><h2>Your account is active but not enrolled in Theory of Rights</h2><p>Ask the LexLearn supervisor to add you to the testing cohort. Signing in again will not fix course enrollment.</p><a href='student-login-en.html'>Back to sign in</a></section>"
        : /learning_data_consent_required|consent_required/i.test(reason)
        ?"<section role='alert' class='empty studentEmpty'><h2>Learning-data privacy consent is required</h2><p>Review and accept the necessary consent inside your account before starting the assessment.</p><a href='privacy-en.html'>Privacy policy</a></section>"
        : /student_approval_required/i.test(reason)
        ?"<section role='alert' class='empty studentEmpty'><h2>Your account is active. Training access is not available yet.</h2><p>Ask the LexLearn supervisor to check your course admission and university trial dates. Signing in again will not change training permissions.</p><a href='student-profile.html?lang=en'>My profile</a></section>"
        :"<section role='alert' class='empty studentEmpty'><h2>Unable to load your account</h2><p>Check your connection and try again. Your saved progress has not changed.</p><button class='btn primary' onclick='location.reload()'>Try again</button><a href='student-login-en.html'>Sign in</a></section>";
      return;
    }
  }
  if(session.cloud&&!result){course={session:1,completed:[],weekResults:{},achievements:[],adminOverrideWeeks:{},repairRequired:false,completedProgram:false};}
  glossaryAllowed=false;
  try{if(window.LEX_GLOSSARY_ACCESS)glossaryAllowed=await LEX_GLOSSARY_ACCESS.check(LEX_CLOUD);}catch(_){glossaryAllowed=false;}
  if(window.LEX_GLOSSARY_ACCESS)LEX_GLOSSARY_ACCESS.installLinkGuard(LEX_CLOUD);
  render();
}
if(window.LEX_CLOUD&&LEX_CLOUD.db())LEX_CLOUD.db().auth.onAuthStateChange(function(event){
  if(event==='SIGNED_OUT'){localStorage.removeItem(SESSION_KEY);location.replace('student-login-en.html?reason=session');}
});
boot();
window.addEventListener("pageshow",function(e){
  if(e.persisted){location.reload();}
});
})();
