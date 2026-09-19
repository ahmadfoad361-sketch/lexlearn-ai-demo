(function(){
"use strict";

var C = window.LEX_CONTENT;
var APP = document.getElementById("app");
var LEGACY_STORAGE = "lexlearn_v4_grouped";
var AUTH_KEY = "lexlearn_auth_v1";
var STUDENT_PREFIX = "lexlearn_student_v6_";
var SESSION = {answers:{},pending:null,confidence:null,activity:null,activityAnswer:null,activityFeedback:null,transition:null};
var ADMIN = {selectedStudentId:null,lastCreated:null};

var DIM_LABELS = {
  recall:"الاسترجاع",
  understanding:"الفهم",
  legal_precision:"الدقة القانونية",
  transfer:"التطبيق",
  exam_execution:"الاختبار الامتحاني"
};

function hashPass(v){
  var h=2166136261,s=String(v||"");
  for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(16);
}
function uid(prefix){return (prefix||"u")+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);}
function loadAuth(){
  try{
    var a=JSON.parse(localStorage.getItem(AUTH_KEY));
    if(a&&Array.isArray(a.accounts))return a;
  }catch(e){}
  return {schema:1,accounts:[],currentId:null};
}
var auth=loadAuth();
function saveAuth(){localStorage.setItem(AUTH_KEY,JSON.stringify(auth));}
function activeAccount(){return auth.accounts.find(function(x){return x.id===auth.currentId;})||null;}
function accountById(id){return auth.accounts.find(function(x){return x.id===id;})||null;}
function hasAdmin(){return auth.accounts.some(function(x){return x.role==="admin";});}
function studentStateKey(id){return STUDENT_PREFIX+id;}
function freshCourseState(){
  return {groupIndex:0,groupResults:[],mastery:{},route:null,xp:0,streak:0,lastActive:null,reviews:[],activityHistory:[],skillPaths:{},completed:false};
}
function freshState(){
  return {schema:6,country:null,courseId:null,screen:"country",courses:{},createdAt:new Date().toISOString()};
}
function readStudentState(id){
  try{
    var s=JSON.parse(localStorage.getItem(studentStateKey(id)));
    if(s&&s.courses)return s;
  }catch(e){}
  return freshState();
}
function load(){
  var a=activeAccount();
  if(a&&a.role==="student")return readStudentState(a.id);
  return freshState();
}
var state=load();

function save(){
  var a=activeAccount();
  if(a&&a.role==="student")localStorage.setItem(studentStateKey(a.id),JSON.stringify(state));
}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c];});}
function norm(v){return String(v||"").toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[ًٌٍَُِّْـ]/g,"").replace(/[^\u0600-\u06FFa-z0-9 ]/gi," ").replace(/\s+/g," ").trim();}
function course(){return C.courses.find(function(x){return x.id===state.courseId;})||null;}
function cs(){
  if(!state.courseId)return null;
  if(!state.courses[state.courseId])state.courses[state.courseId]=freshCourseState();
  var s=state.courses[state.courseId];
  if(!s.skillPaths)s.skillPaths={};
  if(!s.reviews)s.reviews=[];
  if(!s.activityHistory)s.activityHistory=[];
  return s;
}
function go(screen){
  state.screen=screen;save();
  SESSION={answers:{},pending:null,confidence:null,activity:null,activityAnswer:null,activityFeedback:null};
  render();window.scrollTo({top:0,behavior:"smooth"});
}
function toast(msg){
  var t=document.getElementById("toast");if(!t)return;
  t.textContent=msg;t.classList.add("show");setTimeout(function(){t.classList.remove("show");},2100);
}
function scoreKeywords(text,words,needed){
  var n=norm(text),hits=0;
  (words||[]).forEach(function(w){if(n.indexOf(norm(w))>=0)hits++;});
  return Math.min(1,hits/(needed||1));
}
function phraseSimilarity(text,phrase){
  var t=norm(text),p=norm(phrase);
  if(!p)return false;
  if(t.indexOf(p)>=0)return true;
  var pt=p.split(" ").filter(Boolean),tt=t.split(" ").filter(Boolean);
  if(pt.length<2)return tt.indexOf(p)>=0;
  var found=0;pt.forEach(function(w){if(tt.indexOf(w)>=0)found++;});
  return found/pt.length>=0.72;
}
function criterionResult(text,r){
  if(r.concepts){
    var matched=0,total=r.concepts.length;
    r.concepts.forEach(function(group){
      var alts=Array.isArray(group)?group:[group];
      if(alts.some(function(a){return phraseSimilarity(text,a);})){matched++;}
    });
    var need=r.min||1;
    return {ok:matched>=need,matched:matched,total:total,need:need};
  }
  var score=scoreKeywords(text,r.keywords||[],1);
  return {ok:score>0,matched:score>0?1:0,total:1,need:1};
}
function evaluateWritten(item,answer){
  if(answer==="__DONT_KNOW__")return {score:0,criteria:[]};
  var rs=(item.rubric||[]).map(function(r){var cr=criterionResult(answer,r);return {label:r.label,ok:cr.ok,matched:cr.matched,total:cr.total,need:cr.need};});
  var hit=rs.filter(function(x){return x.ok;}).length;
  return {score:rs.length?hit/rs.length:0,criteria:rs};
}
function evalItem(item,answer){
  if(item.type==="mcq"){
    var o=(item.options||[]).find(function(x){return x.id===answer;});
    return o?o.score:0;
  }
  if(item.type==="build_answer")return evaluateWritten(item,answer).score;
  return 0;
}
function pct(v){return Math.round(v||0)+"%";}
function confidenceLabel(v){return v===1?"غير متأكد":v===2?"إلى حد ما":"واثق";}
function dimensionLabel(d){return DIM_LABELS[d]||d;}

function touchStreak(){
  var s=cs();if(!s)return;
  var today=new Date().toISOString().slice(0,10);
  if(s.lastActive===today)return;
  if(s.lastActive){
    var d=Math.round((new Date(today+"T00:00:00")-new Date(s.lastActive+"T00:00:00"))/86400000);
    s.streak=d===1?s.streak+1:1;
  }else s.streak=1;
  s.lastActive=today;
}
function addXP(n){var s=cs();touchStreak();s.xp+=n;save();}
function scheduleReview(item,score){
  var s=cs();if(score>=.85)return;
  var existing=s.reviews.find(function(r){return r.itemId===item.id;});
  var days=score<.5?1:3;
  var due=new Date();due.setDate(due.getDate()+days);
  if(existing){existing.due=due.toISOString();existing.score=score;}
  else s.reviews.push({id:"rev-"+Date.now()+"-"+item.id,itemId:item.id,topic:item.prompt.slice(0,70),due:due.toISOString(),score:score});
}
function computeMastery(){
  var s=cs();var sums={},counts={};
  s.groupResults.forEach(function(g){
    (g.items||[]).forEach(function(x){
      var item=findItem(x.itemId);if(!item)return;
      var d=item.dimension;
      var weight=1+(Math.max(1,item.difficulty||1)-1)*.08;
      sums[d]=(sums[d]||0)+(x.score*100*weight);
      counts[d]=(counts[d]||0)+weight;
    });
  });
  s.mastery={};
  Object.keys(sums).forEach(function(d){s.mastery[d]={value:Math.min(100,sums[d]/counts[d]),evidence:Math.round(counts[d])};});
  s.route=deriveRoute(s.mastery);
  save();
}
function deriveRoute(m){
  function v(d){return m[d]?m[d].value:null;}
  var r=v("recall"),u=v("understanding"),p=v("legal_precision"),t=v("transfer"),e=v("exam_execution");
  if((r!=null&&r<55)||(u!=null&&u<55))return"FOUNDATION";
  if(p!=null&&p<60)return"PRECISION";
  if(t!=null&&t<65)return"APPLICATION";
  if(e!=null&&e<65)return"EXAM";
  if([r,u,p,t,e].every(function(x){return x!=null&&x>=78;}))return"ADVANCED";
  return"BALANCED";
}
function routeInfo(){
  var map={
    FOUNDATION:{title:"مسار تأسيسي",why:"الأولوية لتثبيت المفاهيم الأساسية قبل زيادة التعقيد.",steps:["مراجعة الأخطاء الأساسية","العنصر الناقص","قضايا قصيرة مباشرة","إعادة قياس مختصر"]},
    PRECISION:{title:"مسار الدقة القانونية",why:"الفكرة العامة موجودة، لكن المصطلح أو التمييز يحتاج تثبيتًا.",steps:["مقارنات قانونية قصيرة","العنصر الناقص","تمييز مفاهيم متقاربة","إجابة امتحانية قصيرة"]},
    APPLICATION:{title:"مسار التطبيق",why:"المعرفة النظرية أفضل من اكتشاف الموضوع داخل الوقائع.",steps:["محقق القضية","غيّر واقعة واحدة","اختيار القاعدة من واقعة","تطبيق امتحاني"]},
    EXAM:{title:"مسار الإجابة الامتحانية",why:"المعرفة موجودة لكن بناء الإجابة يحتاج تنظيمًا أو تغطية أفضل للعناصر.",steps:["خطة إجابة","معايير تصحيح واضحة","إجابة قصيرة بزمن اختياري","تحسين العنصر المفقود"]},
    ADVANCED:{title:"مسار التميز",why:"الأبعاد الأساسية قوية؛ نرفع مستوى التحدي ونركز على المسائل المركبة.",steps:["قضايا أكثر تركيبًا","مقارنات دقيقة","أسئلة امتحانية مركبة","تحديات سريعة"]},
    BALANCED:{title:"مسار متوازن",why:"لا توجد فجوة واحدة مهيمنة؛ سنوزع التدريب بين الدقة والتطبيق والامتحان.",steps:["مراجعة ذكية","تطبيق واقعي","دقة المصطلح","إجابة امتحانية"]}
  };
  return map[(cs()&&cs().route)||"BALANCED"];
}


function levelLabel(level){
  var map={easy:"سهل",medium:"متوسط",difficult:"متقدم",transfer:"تطبيق",exam:"اختبار"};
  return map[level]||level||"";
}
function goalDefinition(d){
  var defs={
    recall:{icon:"🧠",title:"تثبيت الاسترجاع",why:"تحتاج إلى استدعاء المفهوم القانوني بدقة من دون الاعتماد على ظهور الإجابة أمامك.",next:"شرح موجز ثم تدريب استرجاع"},
    understanding:{icon:"💡",title:"تعميق الفهم",why:"تحتاج إلى ربط القاعدة بمكانها داخل البناء القانوني وفهم علاقتها بالمفاهيم القريبة.",next:"مثال محلول ثم مقارنة"},
    legal_precision:{icon:"🔍",title:"رفع الدقة القانونية",why:"تحتاج إلى مزيد من الدقة في التمييز بين المصطلحات والبدائل القانونية المتقاربة.",next:"تمييز مفاهيم ثم سؤال دقيق"},
    transfer:{icon:"🕵️",title:"تقوية التطبيق على الوقائع",why:"تحتاج إلى نقل المعرفة من السؤال المباشر إلى واقعة جديدة لا تذكر اسم الباب القانوني صراحة.",next:"واقعة قصيرة ثم تغيير عنصر حاسم"},
    exam_execution:{icon:"✍️",title:"بناء الإجابة الامتحانية",why:"تحتاج إلى تنظيم المعرفة في إجابة تغطي العناصر القانونية المطلوبة بوضوح.",next:"خطة إجابة ثم اختبار قصير"}
  };
  return defs[d]||{icon:"🎯",title:dimensionLabel(d),why:"تدريب موجه وفق أدائك.",next:"تدريب قصير"};
}
function pathState(d){
  var s=cs();if(!s)return null;
  if(!s.skillPaths[d])s.skillPaths[d]={stage:"learn",practiceAttempts:0,testAttempts:0,completedAt:null,lastScore:null};
  return s.skillPaths[d];
}
function isPathCompleted(d){
  var p=pathState(d);return !!(p&&p.stage==="completed");
}
function weaknessThreshold(d){
  return d==="exam_execution"?72:75;
}
function activeWeaknesses(){
  var s=cs();if(!s)return[];
  var dims=["recall","understanding","legal_precision","transfer","exam_execution"];
  return dims.map(function(d){return {d:d,v:s.mastery[d]?s.mastery[d].value:null};})
    .filter(function(x){return x.v!=null&&x.v<weaknessThreshold(x.d)&&!isPathCompleted(x.d);})
    .sort(function(a,b){return a.v-b.v;});
}
function primaryWeakness(){
  var w=activeWeaknesses();return w.length?w[0]:null;
}
function recommendedActivities(d){
  var c=course();if(!c)return[];
  return (c.activities||[]).filter(function(a){
    return Array.isArray(a.targetDimensions)&&a.targetDimensions.indexOf(d)>=0;
  });
}
function skillCheckItem(d){
  var c=course(),items=[];
  (c.groups||[]).forEach(function(g){(g.items||[]).forEach(function(it){if(it.dimension===d)items.push(it);});});
  if(!items.length)return null;
  return items[Math.min(items.length-1,Math.max(0,(pathState(d).testAttempts||0)%items.length))];
}
function skillPathLabel(stage){
  return stage==="learn"?"التعلم":stage==="practice"?"التدريب":stage==="assessment"?"اختبار المسار":"مكتمل";
}
function skillPathProgress(d){
  var p=pathState(d);
  return ["learn","practice","assessment","completed"].map(function(st,i){
    var order={learn:0,practice:1,assessment:2,completed:3};
    var cur=order[p.stage],idx=order[st];
    return {stage:st,label:skillPathLabel(st),done:idx<cur||p.stage==="completed",active:idx===cur&&p.stage!=="completed"};
  });
}
function advancePathAfterPractice(d,score){
  var p=pathState(d);if(!p||p.stage==="completed")return;
  p.practiceAttempts=(p.practiceAttempts||0)+1;p.lastScore=score;
  if(score>=.7)p.stage="assessment";
  else p.stage="practice";
  save();
}
function finishSkillCheck(d,score){
  var p=pathState(d);if(!p)return;
  p.testAttempts=(p.testAttempts||0)+1;p.lastScore=score;
  if(score>=.8){
    p.stage="completed";p.completedAt=new Date().toISOString();
  }else{
    p.stage="practice";
  }
  save();
}
function markLearningDone(d){
  var p=pathState(d);if(p&&p.stage==="learn"){p.stage="practice";save();}
}
function completedPathCount(){
  var s=cs();if(!s)return 0;
  return Object.keys(s.skillPaths||{}).filter(function(d){return s.skillPaths[d]&&s.skillPaths[d].stage==="completed";}).length;
}

function growthGoals(){
  var weaknesses=activeWeaknesses();
  return weaknesses.slice(0,3).map(function(x){
    var z=goalDefinition(x.d);
    return {dimension:x.d,icon:z.icon,title:z.title,why:z.why,next:z.next,score:Math.round(x.v),stage:pathState(x.d).stage};
  });
}
function errorMemory(limit){
  var s=cs();if(!s)return[];
  var out=[];
  s.groupResults.forEach(function(g){
    (g.items||[]).forEach(function(x){
      if(x.score>=.999)return;
      var it=findItem(x.itemId);if(!it)return;
      var type="فجوة معرفية";
      if(g.confidence===3&&x.score<.5)type="تصور خاطئ بثقة عالية";
      else if(it.dimension==="transfer")type="صعوبة في التطبيق على الوقائع";
      else if(it.dimension==="legal_precision")type="خلط بين مفاهيم متقاربة";
      else if(it.dimension==="exam_execution")type="نقص في بناء الإجابة";
      else if(it.dimension==="understanding")type="فهم غير مكتمل";
      out.push({item:it,score:x.score,type:type,at:g.at,confidence:g.confidence});
    });
  });
  return out.reverse().slice(0,limit||6);
}
function chosenMicroLesson(){
  var c=course(),w=primaryWeakness();
  if(!c||!w||!c.microLessons||!c.microLessons.length)return null;
  return c.microLessons.find(function(l){return l.dimension===w.d;})||c.microLessons[0];
}
function dimensionInfo(d){
  var map={
    recall:{icon:"🧠",desc:"قدرتك على استدعاء المفهوم أو القاعدة القانونية من الذاكرة دون الاعتماد على ظهور الإجابة أمامك."},
    understanding:{icon:"💡",desc:"قدرتك على فهم معنى القاعدة وعلاقتها بالمفاهيم القانونية القريبة، لا مجرد حفظها."},
    legal_precision:{icon:"🔍",desc:"قدرتك على التمييز بين المصطلحات والبدائل القانونية المتشابهة واختيار الوصف الأدق."},
    transfer:{icon:"🕵️",desc:"قدرتك على اكتشاف المسألة القانونية وتطبيق ما تعلمته على واقعة جديدة."},
    exam_execution:{icon:"✍️",desc:"قدرتك على تنظيم الإجابة القانونية وتغطية عناصرها الأساسية بصورة واضحة ومتماسكة."}
  };
  return map[d]||{icon:"🎯",desc:"بُعد تدريبي من أبعاد الأداء القانوني."};
}
function masteryStatus(d,m){
  if(!m)return {label:"لم يُقاس",className:"neutral",note:"لا توجد إجابات كافية للحكم على هذا البُعد."};
  var v=m.value;
  if(v>=80)return {label:"قوي",className:"strong",note:"لا يحتاج إلى تدريب علاجي نشط حاليًا."};
  if(v>=65)return {label:"مستقر جزئيًا",className:"steady",note:"الأداء مقبول، وقد يعود هذا البُعد للمراجعة إذا ظهرت أخطاء لاحقة."};
  return {label:"يحتاج إلى تطوير",className:"needs",note:"يُعطى أولوية في خطة التدريب إذا كان من أضعف الأبعاد الحالية."};
}
function nextActionForDimension(d){
  if(isPathCompleted(d))return "اكتمل المسار بعد اجتياز اختباره، ولذلك لا يظهر ضمن التدريبات النشطة.";
  var w=primaryWeakness();
  if(w&&w.d===d){
    var p=pathState(d);
    if(p.stage==="learn")return "هذا هو المسار الحالي: تعلم موجّه أولًا.";
    if(p.stage==="practice")return "هذا هو المسار الحالي: تدريب موجّه على نقطة الضعف.";
    if(p.stage==="assessment")return "هذا هو المسار الحالي: اختبار قصير لتحديد ما إذا كان يمكن إغلاقه.";
  }
  var m=cs().mastery[d];
  if(m&&m.value<weaknessThreshold(d))return "فجوة مثبتة، لكنها تأتي بعد المسار الحالي في ترتيب الأولويات.";
  return "لا يوجد إجراء علاجي مطلوب الآن؛ يظل البُعد تحت المتابعة.";
}

function masteryLadder(){
  var s=cs();
  var avg=0,n=0;Object.keys(s.mastery||{}).forEach(function(k){avg+=s.mastery[k].value;n++;});avg=n?avg/n:0;
  return [
    {icon:"📚",title:"أعرفه",done:avg>=35},
    {icon:"🔍",title:"أميّزه",done:(s.mastery.legal_precision&&s.mastery.legal_precision.value>=55)||avg>=50},
    {icon:"💬",title:"أشرحه",done:(s.mastery.understanding&&s.mastery.understanding.value>=65)||avg>=60},
    {icon:"🕵️",title:"أكتشفه في واقعة",done:s.mastery.transfer&&s.mastery.transfer.value>=60},
    {icon:"⚖️",title:"أطبقه",done:s.mastery.transfer&&s.mastery.transfer.value>=72},
    {icon:"✍️",title:"أكتبه امتحانيًا",done:s.mastery.exam_execution&&s.mastery.exam_execution.value>=70}
  ];
}
function assignedCourseIds(){
  var a=activeAccount();return a&&a.role==="student"&&Array.isArray(a.courseIds)&&a.courseIds.length?a.courseIds:C.courses.map(function(x){return x.id;});
}
function answerDisplay(item,answer){
  if(answer==="__DONT_KNOW__")return"لا أعرف";
  if(item&&item.type==="mcq"){var o=(item.options||[]).find(function(z){return z.id===answer;});return o?o.text:String(answer||"");}
  return String(answer||"");
}

function findItem(id){
  for(var i=0;i<C.courses.length;i++){
    for(var g=0;g<C.courses[i].groups.length;g++){
      var it=C.courses[i].groups[g].items.find(function(x){return x.id===id;});
      if(it)return it;
    }
  }
  return null;
}

function journey(stage){
  var labels=[["country","الدولة"],["course","المقرر"],["diagnostic","التشخيص"],["results","النتيجة"],["training","التدريب"]];
  var idx={country:0,course:1,diagnostic:2,results:3,training:4,today:4,activities:4,reviews:4,dashboard:4};
  var cur=idx[stage]||0;
  return '<div class="journey">'+labels.map(function(x,i){
    return '<div class="journeystep '+(i<cur?"done":i===cur?"active":"")+'"><span>'+(i+1)+'</span><b>'+x[1]+'</b></div>';
  }).join("")+'</div>';
}
function header(){
  var a=activeAccount(),s=a&&a.role==="student"?cs():null,nav="";
  if(a&&a.role==="admin"){
    nav='<button class="iconbtn" data-admin-home="1">👥 لوحة الإدارة</button><span class="pill">مدير المنصة</span><button class="iconbtn" id="logoutBtn">تسجيل الخروج</button>';
  }else if(a&&a.role==="student"){
    if(s&&s.completed){
      nav='<button class="iconbtn" data-nav="today">🎯 خطة التدريب</button><button class="iconbtn" data-nav="dashboard">📈 التقدم</button><button class="iconbtn" data-nav="course">📚 المقررات</button>';
    }
    nav+='<span class="pill">'+esc(a.name)+'</span>'+(s&&s.completed?'<span class="pill gold">⭐ '+s.xp+' نقطة</span><span class="pill">🔥 '+s.streak+'</span>':'')+'<button class="iconbtn" id="logoutBtn">تسجيل الخروج</button>';
  }
  return '<header class="topbar"><div class="topin"><div class="brand"><div class="logo">Lx</div><div class="brandtext"><b>LexLearn AI</b><small>تعلم قانوني ذكي • مسار يتكيف معك</small></div></div><div class="topactions">'+nav+'</div></div></header>';
}

function ownerSetupScreen(){
  return '<section class="authExperience"><div class="authBackdrop"><div class="orb orb1"></div><div class="orb orb2"></div><div class="legalMark">⚖</div></div><div class="authHeroPanel"><div class="brandLockup"><div class="brandSeal">Lx</div><div><span>LexLearn AI</span><small>تعلم قانوني تكيفي</small></div></div><div class="heroCopy"><span class="eyebrow">منصة قانونية تتعلم من الطالب</span><h1>أنت لا تنشئ حساب إدارة فقط.<br><em>أنت تنشئ مركز متابعة للتعلم القانوني.</em></h1><p>من هنا تُنشئ حسابات الطلاب، وتتابع أداءهم، وتحدد احتياج كل طالب إلى تدريب مناسب.</p><div class="heroFeatureRow"><span>🧠 تحليل أداء</span><span>⚖️ تعلم قانوني تكيفي</span><span>📈 تتبع تطور</span></div></div><div class="visualFrame"><img src="assets/visual-study.svg" alt="بيئة تعلم قانوني ذكية"><div class="floatingCard fc1">🎯 3 أهداف شخصية</div><div class="floatingCard fc2">🔍 تحليل الأخطاء</div><div class="floatingCard fc3">✍️ تدريب امتحاني</div></div></div><div class="authFormPanel"><div class="authStep">01</div><div class="kicker">إعداد المنصة لأول مرة</div><h2>أنشئ حساب المدير</h2><p class="authLead">بيانات المدير تفتح لوحة تحكم منفصلة عن تجربة الطالب.</p><div id="authError" class="authError hidden"></div><label class="fieldlabel">اسم المدير</label><input id="ownerName" type="text" placeholder="مثال: أحمد الفقي"><label class="fieldlabel">اسم المستخدم</label><input id="ownerUser" type="text" placeholder="مثال: admin"><label class="fieldlabel">كلمة المرور</label><input id="ownerPass" type="password" placeholder="6 أحرف على الأقل"><button class="btn primary fullbtn bigbtn" id="createOwner">إنشاء لوحة الإدارة</button><div class="securityNote"><span>🔒</span><p><b>نسخة تجريبية محلية:</b> الحسابات الآن محفوظة على هذا الجهاز فقط. قبل استخدام المنصة مع طلاب حقيقيين سننقل الدخول والبيانات إلى خادم آمن ومتزامن بين الأجهزة.</p></div></div></section>';
}
function loginScreen(){
  return '<section class="authExperience loginMode"><div class="authBackdrop"><div class="orb orb1"></div><div class="orb orb2"></div><div class="legalMark">⚖</div></div><div class="authHeroPanel"><div class="brandLockup"><div class="brandSeal">Lx</div><div><span>LexLearn AI</span><small>تعلم قانوني يتكيف مع أدائك</small></div></div><div class="heroCopy"><span class="eyebrow">مرحبًا بعودتك</span><h1>كل جلسة أقصر.<br><em>لكنها أذكى من سابقتها.</em></h1><p>ادخل إلى مسارك، وراجع نقاط التحسين، وتابع تقدمك الفعلي بدل الاكتفاء بعدد الأسئلة التي أجبت عنها.</p><div class="heroFeatureRow"><span>🧭 مسار شخصي</span><span>🧩 تدريبات قصيرة</span><span>🔥 تقدم مستمر</span></div></div><div class="visualFrame loginVisual"><img src="assets/visual-study.svg" alt="طلاب قانون يتعلمون"><div class="floatingCard fc1">اليوم • 7 دقائق</div><div class="floatingCard fc2">🧠 خطأ متكرر تم اكتشافه</div></div></div><div class="authFormPanel"><div class="authStep">↳</div><div class="kicker">تسجيل الدخول</div><h2>ادخل إلى حسابك</h2><p class="authLead">استخدم اسم المستخدم وكلمة المرور المخصصين لك.</p><div id="authError" class="authError hidden"></div><label class="fieldlabel">اسم المستخدم</label><input id="loginUser" type="text" autocomplete="username" placeholder="اسم المستخدم"><label class="fieldlabel">كلمة المرور</label><input id="loginPass" type="password" autocomplete="current-password" placeholder="••••••••"><button class="btn primary fullbtn bigbtn" id="loginBtn">دخول إلى LexLearn</button><div class="securityNote"><span>ℹ️</span><p>إذا أُنشئ حساب الطالب على جهاز مختلف فلن يظهر في هذه النسخة المحلية. يحتاج الدخول من أجهزة متعددة إلى خادم آمن وقاعدة بيانات سحابية.</p></div></div></section>';
}
function showAuthError(msg){
  var el=document.getElementById("authError");
  if(!el)return;
  el.textContent=msg;el.classList.remove("hidden");
}

function students(){
  return auth.accounts.filter(function(x){return x.role==="student";});
}
function studentSummary(acc){
  var st=readStudentState(acc.id),scores=[],completed=0,groups=0,activities=0,last=null,needs=false;
  Object.keys(st.courses||{}).forEach(function(cid){
    var csx=st.courses[cid];if(csx.completed)completed++;groups+=(csx.groupResults||[]).length;activities+=(csx.activityHistory||[]).length;
    Object.keys(csx.mastery||{}).forEach(function(d){scores.push(csx.mastery[d].value);if(csx.mastery[d].value<55)needs=true;});
    (csx.groupResults||[]).forEach(function(g){if(!last||new Date(g.at)>new Date(last))last=g.at;});
  });
  var avg=scores.length?Math.round(scores.reduce(function(a,b){return a+b;},0)/scores.length):null;
  return {state:st,avg:avg,completed:completed,groups:groups,activities:activities,last:last,needs:needs};
}
function adminStudentDetail(acc){
  var sum=studentSummary(acc),st=sum.state;
  var courseBlocks=C.courses.filter(function(c){return (acc.courseIds||[]).indexOf(c.id)>=0;}).map(function(c){
    var sx=st.courses[c.id]||freshCourseState();
    var dims=["recall","understanding","legal_precision","transfer","exam_execution"];
    var attempts=[];
    (sx.groupResults||[]).forEach(function(g){(g.items||[]).forEach(function(x){var it=findItem(x.itemId);attempts.push({g:g,it:it,x:x});});});
    return '<div class="adminCourse"><div class="screenhead"><div><span class="coursecode">'+esc(c.code)+'</span><h3>'+esc(c.title_ar)+'</h3></div><span class="stepbadge">'+(sx.completed?"تم التشخيص":"لم يكتمل التشخيص")+'</span></div><div class="metricGrid">'+dims.map(function(d){var m=sx.mastery[d];return '<div class="metric"><div class="metricHead"><span>'+dimensionLabel(d)+'</span><span>'+(m?Math.round(m.value)+"%":"لم يُقاس")+'</span></div>'+(m?'<div class="bar"><span style="width:'+m.value+'%"></span></div>':'')+'</div>';}).join("")+'</div><h3 class="sectiontitle">المحاولات والأسئلة</h3>'+(attempts.length?'<div class="attemptList">'+attempts.map(function(a){return '<div class="attemptRow"><div><b>'+esc(a.it?a.it.prompt:a.x.itemId)+'</b><small>'+esc(a.g.title)+' • الثقة: '+confidenceLabel(a.g.confidence)+'</small><p>'+esc(answerDisplay(a.it,a.x.answer))+'</p></div><strong>'+Math.round(a.x.score*100)+'%</strong></div>';}).join("")+'</div>':'<div class="empty">لا توجد محاولات بعد.</div>')+'</div>';
  }).join("");
  return '<section class="panel screen adminShell"><div class="screenhead"><div><button class="btn ghost" data-admin-home="1">← كل الطلاب</button><div class="kicker" style="margin-top:12px">ملف الطالب</div><h2>'+esc(acc.name)+'</h2><p class="small">@'+esc(acc.username)+' • الحساب منشأ بواسطة مدير المنصة</p></div><button class="btn outline" data-export-student="'+acc.id+'">تصدير بيانات الطالب</button></div><div class="statgrid"><div class="stat"><strong>'+(sum.avg==null?"—":sum.avg+"%")+'</strong><small>متوسط الأبعاد المقاسة</small></div><div class="stat"><strong>'+sum.completed+'</strong><small>مقررات مكتملة التشخيص</small></div><div class="stat"><strong>'+sum.groups+'</strong><small>مجموعات تشخيص</small></div><div class="stat"><strong>'+sum.activities+'</strong><small>تدريبات مكتملة</small></div></div><div class="adminReset"><label class="fieldlabel">إعادة تعيين كلمة المرور</label><div class="inlineform"><input id="resetStudentPass" type="password" placeholder="كلمة مرور جديدة"><button class="btn secondary" data-reset-pass="'+acc.id+'">تحديث</button></div></div>'+courseBlocks+'</section>';
}
function adminScreen(){
  if(ADMIN.selectedStudentId){var a=accountById(ADMIN.selectedStudentId);if(a)return adminStudentDetail(a);ADMIN.selectedStudentId=null;}
  var list=students(),summaries=list.map(function(a){return {a:a,s:studentSummary(a)};});
  var avgs=summaries.filter(function(x){return x.s.avg!=null;}).map(function(x){return x.s.avg;});
  var overall=avgs.length?Math.round(avgs.reduce(function(a,b){return a+b;},0)/avgs.length):null;
  var attention=summaries.filter(function(x){return x.s.needs;});
  var recent=summaries.filter(function(x){return x.s.last;}).sort(function(a,b){return new Date(b.s.last)-new Date(a.s.last);}).slice(0,5);
  var created=ADMIN.lastCreated?'<div class="createdAccount"><div><span class="createdIcon">✓</span><div><b>تم إنشاء حساب الطالب</b><small>احتفظ ببيانات الدخول أو عاين حساب الطالب مباشرة.</small></div></div><div class="credentialGrid"><span><small>اسم المستخدم</small><b>'+esc(ADMIN.lastCreated.username)+'</b></span><span><small>كلمة المرور</small><b>'+esc(ADMIN.lastCreated.password)+'</b></span></div><div class="actions"><button class="btn secondary" data-preview-student="'+ADMIN.lastCreated.id+'">معاينة حساب الطالب</button><button class="btn ghost" id="dismissCreated">إخفاء</button></div></div>':'';
  return '<section class="adminWorkspace"><aside class="adminSidebar"><div class="brandLockup mini"><div class="brandSeal">Lx</div><div><span>LexLearn AI</span><small>لوحة الإدارة</small></div></div><nav><button class="sideNav active">🏠 نظرة عامة</button><button class="sideNav">👥 الطلاب <span>'+list.length+'</span></button><button class="sideNav">📊 التحليلات</button><button class="sideNav">📚 المحتوى</button></nav><div class="sideQuote">“نراقب الدليل، لا الانطباع.”</div></aside><main class="adminMain"><div class="adminTop"><div><div class="kicker">لوحة المتابعة</div><h1>مرحبًا، '+esc(activeAccount().name)+'</h1><p>من هنا يمكنك معرفة من يتقدم، ومن يحتاج إلى متابعة، وما الذي حدث داخل كل جلسة.</p></div><button class="btn outline" id="jumpCreateStudent">+ طالب جديد</button></div>'+created+'<div class="kpiGrid"><div class="kpiCard"><span class="kpiIcon">👥</span><div><strong>'+list.length+'</strong><small>إجمالي الطلاب</small></div></div><div class="kpiCard"><span class="kpiIcon">📈</span><div><strong>'+(overall==null?"—":overall+"%")+'</strong><small>متوسط الأداء المقاس</small></div></div><div class="kpiCard attention"><span class="kpiIcon">⚠️</span><div><strong>'+attention.length+'</strong><small>يحتاجون متابعة</small></div></div><div class="kpiCard"><span class="kpiIcon">🧩</span><div><strong>'+summaries.reduce(function(n,x){return n+x.s.groups;},0)+'</strong><small>مجموعات تشخيص مكتملة</small></div></div></div><div class="adminColumns"><section class="panel studentPanel"><div class="screenhead"><div><div class="kicker">الطلاب</div><h2>المتابعة الفردية</h2><p class="small">ادخل إلى أي طالب حتى مستوى السؤال والإجابة.</p></div></div>'+(list.length?'<div class="studentCards">'+summaries.map(function(x){var pctv=x.s.avg==null?0:x.s.avg;return '<button class="studentCard pro" data-student-detail="'+x.a.id+'"><span class="avatar">'+esc((x.a.name||"ط").slice(0,1))+'</span><span class="studentMain"><b>'+esc(x.a.name)+'</b><small>@'+esc(x.a.username)+' • '+(x.s.avg==null?"لم يبدأ":x.s.avg+"% متوسط")+'</small><span class="miniBar"><i style="width:'+pctv+'%"></i></span></span><span class="cardArrow">←</span></button>';}).join("")+'</div>':'<div class="empty richEmpty"><span>👋</span><b>ابدأ بأول طالب</b><small>أنشئ له username وpassword وحدد المقرر.</small></div>')+'</section><section class="panel createStudentPanel" id="createStudentPanel"><div class="kicker">إدارة الحسابات</div><h2>إنشاء حساب طالب</h2><p class="small">أنت من يحدد بيانات الدخول والمقررات المتاحة.</p><label class="fieldlabel">اسم الطالب</label><input id="studentName" type="text" placeholder="الاسم الكامل"><label class="fieldlabel">اسم المستخدم</label><input id="studentUser" type="text" placeholder="مثال: mohamed.a"><label class="fieldlabel">كلمة المرور</label><input id="studentPass" type="password" placeholder="كلمة مرور مؤقتة"><div class="fieldlabel">المقررات المتاحة</div><div class="checkgrid">'+C.courses.map(function(cc){return '<label class="checkcard"><input type="checkbox" data-course-assign="'+cc.id+'" checked><span><b>'+esc(cc.code)+'</b><small>'+esc(cc.title_ar)+'</small></span></label>';}).join("")+'</div><button class="btn primary fullbtn bigbtn" id="createStudent">إنشاء الحساب</button></section></div><div class="adminLower"><section class="panel"><div class="kicker">آخر نشاط</div><h2>آخر نشاط للطلاب</h2>'+(recent.length?'<div class="recentList">'+recent.map(function(x){return '<div class="recentItem"><span class="avatar smallava">'+esc((x.a.name||"ط").slice(0,1))+'</span><div><b>'+esc(x.a.name)+'</b><small>'+new Date(x.s.last).toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short"})+'</small></div></div>';}).join("")+'</div>':'<div class="empty">سيظهر النشاط هنا بعد بدء الطلاب.</div>')+'</section><section class="panel insightPanel"><div class="kicker">قراءة سريعة</div><h2>ما الذي يحتاج إلى متابعتك؟</h2>'+(attention.length?attention.slice(0,4).map(function(x){return '<div class="insightRow"><span>⚠️</span><div><b>'+esc(x.a.name)+'</b><small>هناك بُعد واحد على الأقل أقل من 55%.</small></div></div>';}).join(""):'<div class="goodbox">لا توجد إشارات متابعة قوية حاليًا.</div>')+'</section></div><div class="prototypeBanner"><b>النسخة التجريبية v6.4</b><span>حسابات الطلاب الحالية تعمل على هذا الجهاز فقط. ستستخدم النسخة التشغيلية خادمًا آمنًا ومزامنة بين الأجهزة.</span></div></main></section>';
}

function countryScreen(){
  return '<section class="panel screen onboarding">'+journey("country")+'<div class="screenhead"><div><div class="kicker">البداية</div><h2>اختر النظام القانوني</h2><p class="small">النسخة التجريبية الحالية مفعّلة لقطر.</p></div></div><div class="grid2"><div class="option clickable" data-country="QA"><span class="countryflag">🇶🇦</span><b>قطر</b><small>جامعة قطر — مقرران متاحان للتجربة.</small></div><div class="option disabled"><span class="countryflag">🇪🇬</span><b>مصر</b><small>قريبًا بعد مراجعة المحتوى المصري.</small></div></div></section>';
}
function courseScreen(){
  var allowed=assignedCourseIds();
  var courses=C.courses.filter(function(x){return x.jurisdiction==="QA"&&allowed.indexOf(x.id)>=0;});
  return '<section class="panel screen onboarding">'+journey("course")+'<div class="screenhead"><div><div class="kicker">اختيار المقرر</div><h2>اختر المقرر</h2><p class="small">كل مقرر له تشخيصه وأسئلته ونتيجته ومساره المستقل.</p></div><span class="stepbadge">🇶🇦 جامعة قطر</span></div><div class="grid2">'+courses.map(function(c){
    var saved=state.courses[c.id];
    var progress=saved&&saved.completed?'تم التشخيص • '+(saved.groupResults.length)+' مجموعات':'5 مستويات: سهل ← متوسط ← متقدم ← تطبيق ← اختبار';
    return '<div class="coursecard clickable" data-course="'+c.id+'"><div class="coursecode">'+esc(c.code)+'</div><h3>'+esc(c.title_ar)+'</h3><p>'+esc(c.description)+'</p>'+(c.prerequisite?'<div class="small"><b>متطلب سابق بحسب دليل الجامعة:</b> '+esc(c.prerequisite)+'</div>':'')+'<div class="courseprogress">'+progress+'</div><button class="btn primary">'+(saved&&saved.completed?'افتح المقرر':'ابدأ المقرر')+'</button></div>';
  }).join("")+'</div><div class="sourcebox">المقرران ووصفهما مستندان إلى صفحات جامعة قطر الرسمية ودليل الطالب الجامعي 2025/2026.</div></section>';
}
function diagnosticIntro(){
  var c=course();
  var total=c.groups.reduce(function(s,g){return s+g.items.length;},0);
  return '<section class="panel screen">'+journey("diagnostic")+'<div class="screenhead"><div><div class="kicker">'+esc(c.code)+'</div><h2>تشخيص البداية — 5 مستويات واضحة</h2></div><span class="stepbadge">'+total+' سؤالًا في مجموعات</span></div><div class="info"><b>سهل ← متوسط ← متقدم ← تطبيق ← اختبار</b><br>الأسئلة مجمعة، ونطلب ثقة واحدة فقط بعد كل مجموعة. الكتابة الحرة موجودة في مجموعة الامتحان فقط.</div><div class="grid2">'+c.groups.map(function(g,i){return '<div class="option"><div class="questionMeta"><span class="tag maroon">'+esc(levelLabel(g.level))+'</span></div><b>'+(i+1)+'. '+esc(g.title.replace(/^المجموعة \d+ — /,""))+'</b><small>'+esc(g.purpose)+'</small></div>';}).join("")+'</div><div class="notice"><b>جودة المحتوى:</b> كل المشتتات قانونية، والتدرج أصبح جزءًا صريحًا من بنية المقرر. أسئلة التجربة الأولية ما زالت تحتاج إلى اعتماد متخصص قبل الإطلاق العام.</div><div class="actions"><button class="btn primary" id="startDiagnostic">ابدأ التشخيص</button><button class="btn ghost" data-nav="course">رجوع للمقررات</button></div></section>';
}

function currentGroup(){var c=course(),s=cs();return c.groups[s.groupIndex]||null;}
function answerFor(id){return SESSION.answers[id];}
function questionHtml(item,index){
  var h='<div class="batchq"><div class="qnumber">'+(index+1)+'</div><div class="qbody"><div class="questionMeta"><span class="tag maroon">'+dimensionLabel(item.dimension)+'</span><span class="tag">مستوى '+item.difficulty+'</span></div><h3>'+esc(item.prompt)+'</h3>';
  if(item.type==="mcq"){
    h+='<div class="compactchoices">'+item.options.map(function(o){var sel=answerFor(item.id)===o.id;return '<label class="choice '+(sel?"selected":"")+'"><input type="radio" name="'+item.id+'" data-qid="'+item.id+'" value="'+o.id+'" '+(sel?"checked":"")+'/> '+esc(o.text)+'</label>';}).join("")+'</div>';
  }else{
    var a=answerFor(item.id)||"";
    var dk=a==="__DONT_KNOW__";
    h+='<textarea data-textqid="'+item.id+'" placeholder="اكتب إجابة قصيرة ومنظمة..." '+(dk?"disabled":"")+'>'+(dk?"":esc(a))+'</textarea><label class="dontknow"><input type="checkbox" data-dkqid="'+item.id+'" '+(dk?"checked":"")+'/> لا أعرف — سجّلها بدون إجابة</label>';
  }
  h+='</div></div>';return h;
}
function groupScreen(){
  var c=course(),s=cs(),g=currentGroup();
  if(!g){finishDiagnostic();return"";}
  var total=c.groups.length;
  var base='<section class="panel screen">'+journey("diagnostic")+'<div class="screenhead"><div><div class="kicker">'+esc(c.code)+' • المجموعة '+(s.groupIndex+1)+' من '+total+'</div><h2>'+esc(g.title)+'</h2><p class="small">'+esc(g.purpose)+'</p></div><span class="stepbadge">'+g.items.length+' أسئلة معًا</span></div><div class="groupProgress"><span style="width:'+((s.groupIndex)/total*100)+'%"></span></div>';
  if(SESSION.pending && SESSION.confidence==null){
    return base+'<div class="batch">'+g.items.map(questionHtml).join("")+'</div><div class="confidenceBox"><h3>قبل عرض النتيجة: ثقتك في إجابات المجموعة ككل؟</h3><p class="small">مرة واحدة فقط للمجموعة، وليس بعد كل سؤال.</p><div class="confidence">'+[1,2,3].map(function(v){return '<button type="button" class="conf" data-groupconf="'+v+'">'+confidenceLabel(v)+'</button>';}).join("")+'</div></div></section>';
  }
  if(SESSION.pending && SESSION.confidence!=null){
    var avg=SESSION.pending.avg;
    var stateLabel=avg>=.8?"أداء قوي":avg>=.55?"أداء متوسط":"يحتاج تثبيتًا";
    var cls=avg>=.8?"good":avg>=.55?"warn":"bad";
    return base+'<div class="feedback '+cls+'"><div class="groupScore"><strong>'+Math.round(avg*100)+'%</strong><span>'+stateLabel+' • الثقة: '+confidenceLabel(SESSION.confidence)+'</span></div>'+SESSION.pending.items.map(function(x,i){
      var item=g.items.find(function(q){return q.id===x.itemId;});
      var rh='';
      if(item.type==="build_answer"){
        var wr=evaluateWritten(item,x.answer);
        rh='<div class="rubricbox"><div class="small" style="margin-bottom:6px">تصحيح مفاهيمي: نقبل بدائل صياغية متعددة، ولا نعتمد على كلمة واحدة حرفيًا.</div>'+wr.criteria.map(function(r){return '<div class="rubricrow '+(r.ok?"hit":"miss")+'"><span>'+(r.ok?"✓":"○")+'</span><b>'+esc(r.label)+'</b><small>'+r.matched+'/'+r.need+' مفهوم مطلوب</small></div>';}).join("")+'</div>';
      }
      return '<div class="answerreview"><div class="answerhead"><b>سؤال '+(i+1)+'</b><span>'+Math.round(x.score*100)+'%</span></div><p>'+esc(item.explanation)+'</p>'+rh+'</div>';
    }).join("")+(avg<.55?'<div class="notice"><b>قرار تكيفي:</b> لن نعتبر هذه المجموعة مستقرة. أخطاؤها أضيفت للمراجعة، وسيعطيك مسار التعلم أنشطة أبسط قبل رفع التحدي.</div>':avg>=.8?'<div class="goodbox"><b>قرار تكيفي:</b> المجموعة مستقرة بما يكفي للانتقال إلى مستوى أكثر تطبيقًا.</div>':'<div class="info"><b>قرار تكيفي:</b> ننتقل، مع إبقاء الموضوعات الجزئية في المراجعة.</div>')+'<div class="actions"><button class="btn primary" id="nextGroup">'+(s.groupIndex===total-1?"اعرض النتيجة الشاملة":"الانتقال إلى المجموعة التالية")+'</button></div></div></section>';
  }
  return base+'<div class="batch">'+g.items.map(questionHtml).join("")+'</div><div class="actions"><button class="btn primary" id="submitGroup">اعتمد إجابات المجموعة</button><button class="btn ghost" data-nav="course">خروج للمقررات</button></div><div class="small">لن نطلب منك «متأكد/متردد» لكل سؤال. التقييم والثقة على مستوى المجموعة.</div></section>';
}

function submitGroup(){
  var g=currentGroup();var missing=[];
  g.items.forEach(function(item){
    var a=SESSION.answers[item.id];
    if(item.type==="mcq" && !a)missing.push(item.id);
    if(item.type==="build_answer" && (!a || (a!=="__DONT_KNOW__" && norm(a).length<3)))missing.push(item.id);
  });
  if(missing.length){toast("أكمل كل أسئلة المجموعة أو اختر «لا أعرف» في الأسئلة الكتابية.");return;}
  var items=g.items.map(function(item){
    var a=SESSION.answers[item.id];var sc=evalItem(item,a);
    return {itemId:item.id,answer:a,score:sc};
  });
  var avg=items.reduce(function(s,x){return s+x.score;},0)/items.length;
  SESSION.pending={items:items,avg:avg};render();
}
function commitGroup(){
  var s=cs(),g=currentGroup();
  var result={groupId:g.id,title:g.title,confidence:SESSION.confidence,avg:SESSION.pending.avg,items:SESSION.pending.items,at:new Date().toISOString()};
  s.groupResults.push(result);
  result.items.forEach(function(x){var it=findItem(x.itemId);scheduleReview(it,x.score);});
  addXP(10+(result.avg>=.8?5:0));
  s.groupIndex++;
  computeMastery();
  if(s.groupIndex>=course().groups.length){SESSION={answers:{},pending:null,confidence:null,activity:null,activityAnswer:null,activityFeedback:null,transition:null};finishDiagnostic();return;}
  SESSION={answers:{},pending:null,confidence:null,activity:null,activityAnswer:null,activityFeedback:null,transition:{score:result.avg,next:course().groups[s.groupIndex]}};
  state.screen="transition";save();render();window.scrollTo({top:0,behavior:"smooth"});
}
function transitionScreen(){
  var t=SESSION.transition;
  if(!t){state.screen="diagnostic_group";save();return groupScreen();}
  var msg=t.score>=.8?"أداء قوي. سنرفع مستوى التحدي في المرحلة التالية.":t.score>=.55?"أداء جيد. سنواصل مع تركيز أكبر على الدقة.":"تحددت الفجوة بوضوح. سنعالجها بتدريب مناسب بدل تكرار السؤال نفسه.";
  return '<section class="transitionScreen screen"><div class="stageCompleteMark"><span>✓</span></div><div class="kicker">اكتملت المرحلة</div><h1>'+Math.round(t.score*100)+'%</h1><p>'+esc(msg)+'</p><div class="nextStage"><span>المرحلة التالية</span><b>'+esc(levelLabel(t.next.level))+' • '+esc(t.next.title.replace(/^المجموعة \d+ — /,""))+'</b></div><button class="btn primary" id="continueTransition">انتقل إلى المرحلة التالية</button></section>';
}
function finishDiagnostic(){
  var s=cs();s.completed=true;computeMastery();state.screen="results";save();render();window.scrollTo({top:0,behavior:"smooth"});
}

function resultsScreen(){
  var s=cs(),c=course(),ri=routeInfo(),goals=growthGoals(),errors=errorMemory(3);
  var dims=["recall","understanding","legal_precision","transfer","exam_execution"];
  var metrics=dims.map(function(d){
    var m=s.mastery[d];
    return '<div class="metric"><div class="metricHead"><span>'+dimensionLabel(d)+'</span><span>'+(m?pct(m.value):"لم يُقاس")+'</span></div>'+(m?'<div class="bar"><span style="width:'+m.value+'%"></span></div><div class="reliability">'+m.evidence+' دليل</div>':'<div class="reliability">لا توجد أدلة كافية لهذا البُعد.</div>')+'</div>';
  }).join("");
  var exam=s.groupResults.find(function(g){return g.groupId===c.groups[c.groups.length-1].id;});
  var examDetail=exam?'<div class="examdetail"><h3>تفصيل نتيجة الاختبار الامتحاني</h3><p class="small">تظهر نتيجة كل سؤال على حدة ليتضح أساس التقييم.</p>'+exam.items.map(function(x,i){var it=findItem(x.itemId);return '<div class="evidencecard"><b>سؤال '+(i+1)+': '+esc(it.prompt)+'</b><span>'+Math.round(x.score*100)+'%</span></div>';}).join("")+'</div>':'';
  var plan=goals.length?'<div class="focusPlan">'+goals.map(function(g,i){return '<div class="focusPlanRow '+(i===0?"primary":"")+'"><span class="goalIcon">'+g.icon+'</span><div><b>'+(i===0?"الأولوية الحالية: ":"أولوية لاحقة: ")+esc(g.title)+'</b><p>'+esc(g.why)+'</p><small>الخطوة التالية: '+esc(g.next)+'</small></div><span class="miniScore">'+g.score+'%</span></div>';}).join("")+'</div>':'<div class="goodbox"><b>لا توجد فجوة أساسية تستلزم مسارًا علاجيًا حاليًا.</b><br>ستقتصر الخطة على المراجعات المؤجلة والتحديات المتقدمة عند الحاجة.</div>';
  var err='<div class="errorMemory"><h3>🧠 ذاكرة الأخطاء</h3><p class="small">يستخدم النظام نوع الخطأ لتحديد التدريب المناسب، بدل إعادة السؤال نفسه بصورة آلية.</p>'+(errors.length?errors.map(function(e){return '<div class="errorChip"><b>'+esc(e.type)+'</b><span>'+esc(e.item.prompt.slice(0,90))+(e.item.prompt.length>90?"…":"")+'</span></div>';}).join(""):'<div class="goodbox">لا توجد أخطاء بارزة في التشخيص الحالي.</div>')+'</div>';
  return '<section class="screen studentSimple"><div class="resultHero simplifiedHero"><div><div class="kicker">تحليل الأداء</div><h1>نتيجتك تحولت إلى خطة تدريب واضحة.</h1><p>لن تظهر لك تدريبات لا تحتاج إليها. يبدأ النظام بأضعف بُعد، ثم يغلق مساره بعد اجتياز الاختبار وينتقل إلى الأولوية التالية.</p></div><img src="assets/visual-study.svg" alt="تعلم قانوني ذكي"></div><div class="dashboard"><div class="panel">'+journey("results")+'<h2>'+esc(c.code)+' — '+esc(c.title_ar)+'</h2><div class="notice">هذه مؤشرات تدريبية مبنية على إجاباتك، وليست درجات جامعية رسمية. «لم يُقاس» لا يتحول إلى صفر.</div><div class="metricGrid">'+metrics+'<div class="metric"><div class="metricHead"><span>الاحتفاظ المؤجل</span><span>لم يُقاس بعد</span></div><div class="reliability">يُقاس في مراجعة لاحقة بعد مرور وقت مناسب.</div></div></div>'+examDetail+'</div><div class="pathcard"><div class="kicker" style="color:#e8c986">منطق المسار</div><h2>'+esc(ri.title)+'</h2><p>'+esc(ri.why)+'</p><div class="pathstep"><b>1.</b> تعلم موجّه</div><div class="pathstep"><b>2.</b> تدريب على نقطة الضعف</div><div class="pathstep"><b>3.</b> اختبار قصير للمسار</div><div class="pathstep"><b>4.</b> إغلاق المسار عند الاجتياز</div></div></div><div class="panel growthPlan"><div class="screenhead"><div><div class="kicker">خطة التدريب</div><h2>الأولويات التي تحتاجها فقط</h2><p class="small">لن تظهر التحديات غير المرتبطة بفجواتك الحالية.</p></div><span class="stepbadge">🎯 مخصصة حسب أدائك</span></div>'+plan+err+'<div class="actions"><button class="btn primary" id="enterTraining">ابدأ خطة التدريب</button></div></div></section>';
}
function stats(){
  var s=cs();
  return '<div class="statgrid compactStats"><div class="stat"><strong>'+s.xp+'</strong><small>نقاط التقدم</small></div><div class="stat"><strong>'+s.streak+'</strong><small>أيام متتالية</small></div><div class="stat"><strong>'+completedPathCount()+'</strong><small>مسارات أُنجزت</small></div><div class="stat"><strong>'+s.activityHistory.length+'</strong><small>تدريبات مكتملة</small></div></div>';
}
function focusedPathCard(d){
  var def=goalDefinition(d),p=pathState(d),steps=skillPathProgress(d);
  return '<div class="focusedPath"><div class="focusedPathHead"><span class="focusBigIcon">'+def.icon+'</span><div><div class="kicker">المسار الحالي</div><h2>'+esc(def.title)+'</h2><p>'+esc(def.why)+'</p></div></div><div class="pathStages">'+steps.map(function(x,i){return '<div class="pathStage '+(x.done?"done ":"")+(x.active?"active":"")+'"><span>'+(x.done?"✓":i+1)+'</span><b>'+esc(x.label)+'</b></div>';}).join("")+'</div></div>';
}
function todayScreen(){
  var s=cs(),c=course(),due=dueReviews(),w=primaryWeakness();
  if(!w){
    return '<section class="screen studentSimple">'+journey("training")+'<div class="panel allClear"><div class="allClearIcon">✓</div><div class="kicker">اكتملت المسارات المطلوبة حاليًا</div><h1>لا يوجد تدريب علاجي إضافي مطلوب الآن.</h1><p>تم إخفاء التحديات غير الضرورية. ستظهر مراجعات مؤجلة أو مسارات جديدة فقط إذا كشفت الأدلة اللاحقة عن حاجة فعلية إليها.</p>'+stats()+(due.length?'<div class="actions"><button class="btn primary" data-nav="reviews">عرض المراجعات المستحقة ('+due.length+')</button></div>':'')+'</div></section>';
  }
  var d=w.d,p=pathState(d),def=goalDefinition(d),lesson=chosenMicroLesson(),acts=recommendedActivities(d);
  var body="";
  if(p.stage==="learn"){
    body='<div class="panel focusWork"><div class="phaseLabel">المرحلة 1 من 3 • التعلم الموجّه</div>'+(lesson?'<div class="microLesson simpleLesson"><div class="microTop"><span class="microIcon">'+lesson.icon+'</span><div><h2>'+esc(lesson.title)+'</h2><small>'+lesson.minutes+' دقائق تقريبًا</small></div></div><p>'+esc(lesson.explain)+'</p><div class="workedExample"><b>مثال</b><span>'+esc(lesson.example)+'</span></div><div class="microChallenge"><b>فكر في هذا السؤال</b><span>'+esc(lesson.challenge)+'</span></div></div>':'<div class="info">راجع المفهوم الأساسي المرتبط بهذا البُعد قبل الانتقال إلى التدريب.</div>')+'<div class="actions"><button class="btn primary" id="markLearnDone" data-dimension="'+d+'">انتهيت من التعلم — انتقل إلى التدريب</button></div></div>';
  }else if(p.stage==="practice"){
    var cards="";
    if(d==="exam_execution"){
      cards='<div class="activityCard recommended"><div class="activityIcon">✍️</div><h3>تدريب على بناء الإجابة</h3><p>إجابة قانونية قصيرة وفق معايير التصحيح المعتمدة في النموذج.</p><button class="btn primary" data-examactivity="1" data-target-dimension="'+d+'">ابدأ التدريب</button></div>';
    }else{
      cards=acts.map(function(a){return activityCard(a,d);}).join("");
    }
    body='<div class="panel focusWork"><div class="phaseLabel">المرحلة 2 من 3 • التدريب الموجّه</div><h2>تحديات مرتبطة بهذه الفجوة فقط</h2><p class="small">أخفى النظام بقية التحديات لأنها لا تخدم الأولوية الحالية.</p><div class="focusedChallenges">'+cards+'</div><div class="info">بعد أداء جيد في التدريب، سيفتح اختبار المسار تلقائيًا.</div></div>';
  }else if(p.stage==="assessment"){
    body='<div class="panel focusWork assessmentReady"><div class="phaseLabel">المرحلة 3 من 3 • اختبار المسار</div><div class="assessmentIcon">⚖️</div><h2>هل أصبحت هذه المهارة مستقرة؟</h2><p>اختبار قصير مستقل عن التدريب السابق. إذا حققت 80% أو أكثر، يُغلق هذا المسار ولا يظهر مرة أخرى ضمن الأولويات النشطة.</p><button class="btn primary bigbtn" data-skillcheck="'+d+'">ابدأ اختبار المسار</button></div>';
  }
  var later=activeWeaknesses().slice(1,3);
  return '<section class="screen studentSimple">'+journey("training")+'<div class="studentPlanHeader"><div><span class="eyebrow">خطة التدريب الحالية</span><h1>هدف واحد في كل مرة.</h1><p>يركز النظام الآن على '+esc(def.title)+'، ويخفي التدريبات التي لا تحتاج إليها.</p></div><span class="stepbadge">'+due.length+' مراجعات مستحقة</span></div>'+focusedPathCard(d)+body+(later.length?'<div class="panel laterPriorities"><div class="kicker">أولويات لاحقة</div><p class="small">لن تُفتح قبل إنهاء المسار الحالي.</p>'+later.map(function(x){var z=goalDefinition(x.d);return '<span class="laterChip">'+z.icon+' '+esc(z.title)+'</span>';}).join("")+'</div>':'')+'</section>';
}
function activityCard(a,targetDimension){
  return '<div class="activityCard recommended"><div class="activityIcon">'+a.icon+'</div><h3>'+esc(a.title)+'</h3><p>'+esc(a.prompt)+'</p><button class="btn secondary" data-activity="'+a.id+'" data-target-dimension="'+esc(targetDimension||"")+'">ابدأ التدريب</button></div>';
}
function activitiesScreen(){
  var w=primaryWeakness(),s=cs();
  if(!w)return '<section class="panel screen studentSimple"><div class="allClearIcon">✓</div><h2>لا توجد تدريبات موجهة مطلوبة حاليًا.</h2><p>تظهر التدريبات هنا فقط عندما تكون مرتبطة بحاجة تعليمية مثبتة.</p><div class="actions"><button class="btn ghost" data-nav="today">العودة إلى الخطة</button></div></section>';
  var d=w.d,p=pathState(d),acts=recommendedActivities(d),cards="";
  if(p.stage==="assessment")return todayScreen();
  if(p.stage==="learn")return todayScreen();
  if(d==="exam_execution")cards='<div class="activityCard recommended"><div class="activityIcon">✍️</div><h3>تدريب على الإجابة القانونية</h3><p>تدريب كتابي واحد يخدم ضعف بناء الإجابة.</p><button class="btn primary" data-examactivity="1" data-target-dimension="'+d+'">ابدأ التدريب</button></div>';
  else cards=acts.map(function(a){return activityCard(a,d);}).join("");
  var hist=s.activityHistory.filter(function(h){return h.targetDimension===d;}).slice().reverse().slice(0,5);
  return '<section class="panel screen studentSimple">'+journey("training")+'<div class="screenhead"><div><div class="kicker">التدريب الموجّه</div><h2>'+esc(goalDefinition(d).title)+'</h2><p class="small">لا تظهر هنا إلا التحديات المرتبطة بالمسار الحالي.</p></div><button class="btn ghost" data-nav="today">العودة إلى الخطة</button></div><div class="focusedChallenges">'+cards+'</div>'+(hist.length?'<h3 style="margin-top:20px">آخر تدريبات هذا المسار</h3><div class="timeline">'+hist.map(function(h){return '<div class="timelineItem"><b>'+esc(h.title)+' • '+Math.round(h.score*100)+'%</b><div class="small">'+new Date(h.at).toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short"})+'</div></div>';}).join("")+'</div>':'')+'</section>';
}
function findActivity(id){return (course().activities||[]).find(function(a){return a.id===id;});}
function startActivity(id,exam,targetDimension){
  if(exam){
    var eg=course().groups[course().groups.length-1];
    SESSION.activity={id:"exam-practice",title:"تدريب على الإجابة القانونية",icon:"✍️",examItem:eg.items[Math.floor(Math.random()*eg.items.length)],targetDimension:targetDimension||"exam_execution"};
  }else{
    var base=findActivity(id);
    SESSION.activity=base?Object.assign({},base,{targetDimension:targetDimension||((primaryWeakness()||{}).d)}):null;
  }
  SESSION.activityAnswer=null;SESSION.activityFeedback=null;state.screen="activity_play";save();render();
}
function startSkillCheck(d){
  var item=skillCheckItem(d);if(!item)return;
  var p=pathState(d);p.testAttempts=(p.testAttempts||0)+0;
  var a={id:"skillcheck-"+d,title:"اختبار المسار: "+goalDefinition(d).title,icon:"⚖️",isSkillCheck:true,targetDimension:d,prompt:item.prompt,sourceItem:item};
  if(item.type==="build_answer")a.examItem=item;
  else if(item.type==="mcq")a.options=item.options.map(function(o){return {text:o.text,score:o.score};});
  SESSION.activity=a;SESSION.activityAnswer=null;SESSION.activityFeedback=null;state.screen="activity_play";save();render();
}

function activityPlay(){
  var a=SESSION.activity;if(!a){go("activities");return"";}
  var item=a.examItem;
  var h='<section class="panel screen"><div class="screenhead"><div><div class="kicker">تدريب</div><h2>'+esc(a.icon||"🎯")+' '+esc(a.title)+'</h2></div></div><div class="questionCard">';
  if(item){
    h+='<h3>'+esc(item.prompt)+'</h3><textarea id="activityText" placeholder="اكتب إجابة قصيرة...">'+esc(SESSION.activityAnswer||"")+'</textarea>';
  }else if(a.options){
    h+='<h3>'+esc(a.prompt)+'</h3>'+a.options.map(function(o,i){return '<label class="choice '+(SESSION.activityAnswer===i?"selected":"")+'"><input type="radio" name="act" data-actopt="'+i+'" '+(SESSION.activityAnswer===i?"checked":"")+'/> '+esc(o.text)+'</label>';}).join("");
  }else{
    h+='<h3>'+esc(a.prompt)+'</h3><input type="text" id="activityText" value="'+esc(SESSION.activityAnswer||"")+'" placeholder="اكتب الإجابة..."/>';
  }
  if(SESSION.activityFeedback){
    var f=SESSION.activityFeedback;
    h+='<div class="feedback '+(f.score>=.8?"good":f.score>=.5?"warn":"bad")+'"><h3>'+Math.round(f.score*100)+'%</h3>'+f.detail+'</div><div class="actions"><button class="btn primary" data-nav="today">العودة إلى خطة التدريب</button></div>';
  }else h+='<div class="actions"><button class="btn primary" id="submitActivity">إرسال الإجابة</button><button class="btn ghost" data-nav="activities">العودة</button></div>';
  h+='</div></section>';return h;
}
function submitActivity(){
  var a=SESSION.activity,score=0,detail="";
  if(a.examItem){
    var ans=SESSION.activityAnswer||"";if(norm(ans).length<3){toast("اكتب إجابة قصيرة أولًا.");return;}
    var wr=evaluateWritten(a.examItem,ans);score=wr.score;
    detail='<div class="rubricbox"><div class="small" style="margin-bottom:6px">التقييم مفاهيمي ويقبل الصياغات المختلفة التي تحقق المعنى القانوني المطلوب.</div>'+wr.criteria.map(function(r){return '<div class="rubricrow '+(r.ok?"hit":"miss")+'"><span>'+(r.ok?"✓":"○")+'</span><b>'+esc(r.label)+'</b><small>'+r.matched+'/'+r.need+' مفهوم مطلوب</small></div>';}).join("")+'</div>';
  }else if(a.options){
    if(SESSION.activityAnswer==null){toast("اختر إجابة أولًا.");return;}
    score=a.options[SESSION.activityAnswer].score;
    detail='<p>'+(score?"إجابة صحيحة.":"راجع الفروق القانونية بين البدائل ثم أعد التدريب.")+'</p>';
  }else{
    var ans2=norm(SESSION.activityAnswer);if(!ans2){toast("اكتب الإجابة أولًا.");return;}
    score=(a.accepted||[]).some(function(x){return ans2.indexOf(norm(x))>=0;})?1:0;
    detail='<p>الإجابة المرجعية: <b>'+esc(a.answer)+'</b></p>';
  }

  if(a.isSkillCheck){
    finishSkillCheck(a.targetDimension,score);
    if(score>=.8){
      detail+='<div class="pathPassed"><b>تم اجتياز المسار.</b><span>أُغلق هذا المسار ولن يظهر ضمن التدريبات النشطة. ستنتقل الخطة إلى الحاجة التالية، إن وجدت.</span></div>';
    }else{
      detail+='<div class="notice"><b>لم يُغلق المسار بعد.</b> ستعود إلى تدريب موجّه إضافي قبل إعادة الاختبار.</div>';
    }
  }else if(a.targetDimension){
    advancePathAfterPractice(a.targetDimension,score);
  }

  SESSION.activityFeedback={score:score,detail:detail};
  var s=cs();s.activityHistory.push({title:a.title,score:score,targetDimension:a.targetDimension||null,isSkillCheck:!!a.isSkillCheck,at:new Date().toISOString()});
  addXP(8+(score>=.8?4:0));save();render();
}
function dueReviews(){var s=cs(),now=Date.now();return s.reviews.filter(function(r){return new Date(r.due).getTime()<=now;});}
function reviewsScreen(){
  var s=cs(),due=dueReviews(),up=s.reviews.filter(function(r){return new Date(r.due).getTime()>Date.now();}).sort(function(a,b){return new Date(a.due)-new Date(b.due);});
  return '<section class="panel screen">'+journey("training")+'<div class="screenhead"><div><div class="kicker">المراجعات</div><h2>المراجعة المجدولة</h2></div><span class="stepbadge">'+due.length+' مستحقة</span></div>'+(due.length?'<div class="grid2">'+due.map(function(r){var it=findItem(r.itemId);return '<div class="activityCard"><h3>'+esc(it?it.prompt:r.topic)+'</h3><p>هذا السؤال عاد لأن نتيجته السابقة كانت '+Math.round(r.score*100)+'%.</p><button class="btn primary" data-review="'+r.id+'">راجع الآن</button></div>';}).join("")+'</div>':'<div class="empty">لا توجد مراجعات مستحقة الآن.</div>')+(up.length?'<h3 style="margin-top:20px">القادم</h3><div class="timeline">'+up.slice(0,8).map(function(r){return '<div class="timelineItem"><b>'+esc(r.topic)+'</b><div class="small">'+new Date(r.due).toLocaleDateString("ar-EG",{dateStyle:"medium"})+'</div></div>';}).join("")+'</div>':'')+'</section>';
}
function startReview(id){
  var r=cs().reviews.find(function(x){return x.id===id;});if(!r)return;
  var item=findItem(r.itemId);if(!item)return;
  SESSION.activity={id:"review",title:"مراجعة",icon:"🔄",examItem:item.type==="build_answer"?item:null,reviewItem:item,reviewId:id};
  if(item.type==="mcq")SESSION.activity.options=item.options.map(function(o){return{text:o.text,score:o.score};});
  SESSION.activityAnswer=null;SESSION.activityFeedback=null;state.screen="activity_play";save();render();
}
function dashboardScreen(){
  var s=cs(),c=course(),ri=routeInfo(),ladder=masteryLadder(),errors=errorMemory(6),
      completedPaths=Object.keys(s.skillPaths||{}).filter(function(d){return s.skillPaths[d]&&s.skillPaths[d].stage==="completed";}),
      dims=["recall","understanding","legal_precision","transfer","exam_execution"],
      current=primaryWeakness();

  var dimensionCards=dims.map(function(d){
    var m=s.mastery[d],info=dimensionInfo(d),status=masteryStatus(d,m);
    return '<div class="progressExplainCard '+status.className+'"><div class="progressExplainHead"><span class="progressExplainIcon">'+info.icon+'</span><div><h3>'+dimensionLabel(d)+'</h3><span class="statusBadge '+status.className+'">'+status.label+'</span></div><strong>'+(m?pct(m.value):"—")+'</strong></div><p>'+esc(info.desc)+'</p>'+(m?'<div class="bar"><span style="width:'+m.value+'%"></span></div><div class="progressEvidence"><span><b>'+m.evidence+'</b> أدلة من إجاباتك</span><span>'+esc(status.note)+'</span></div>':'<div class="progressEvidence"><span>لم تتوافر أدلة كافية بعد.</span></div>')+'<div class="progressNext"><b>ماذا يعني ذلك الآن؟</b><span>'+esc(nextActionForDimension(d))+'</span></div></div>';
  }).join("");

  var currentPlan=current?'<div class="currentProgressPlan"><div class="currentProgressIcon">'+goalDefinition(current.d).icon+'</div><div><div class="kicker">الأولوية الحالية في التدريب</div><h2>'+esc(goalDefinition(current.d).title)+'</h2><p>'+esc(goalDefinition(current.d).why)+'</p><span class="stagePill">المرحلة الحالية: '+esc(skillPathLabel(pathState(current.d).stage))+'</span></div><button class="btn primary" data-nav="today">متابعة الخطة</button></div>':'<div class="currentProgressPlan complete"><div class="currentProgressIcon">✓</div><div><div class="kicker">الحالة الحالية</div><h2>لا توجد فجوة علاجية نشطة.</h2><p>المسارات المطلوبة وفق الأدلة الحالية مكتملة. ستظهر مراجعات أو مسارات جديدة فقط إذا كشفت النتائج اللاحقة عن حاجة إليها.</p></div></div>';

  var completed=completedPaths.length?'<div class="completedPathList">'+completedPaths.map(function(d){var z=goalDefinition(d),p=pathState(d);return '<div class="completedPathRow"><span>'+z.icon+'</span><div><b>'+esc(z.title)+'</b><small>أُغلق المسار بعد اجتياز اختبار المسار'+(p.completedAt?' • '+new Date(p.completedAt).toLocaleDateString("ar-EG",{dateStyle:"medium"}):'')+'</small></div><strong>✓</strong></div>';}).join("")+'</div>':'<div class="empty">لم يكتمل مسار تدريبي بعد.</div>';

  return '<section class="screen studentSimple progressDashboard">'+
    '<div class="panel progressIntro">'+journey("training")+
      '<div class="screenhead"><div><div class="kicker">لوحة التقدم</div><h1>'+esc(c.code)+' — '+esc(c.title_ar)+'</h1><p>هذه الصفحة تشرح ما يقيسه كل بُعد، وما الذي تعنيه النتيجة، وما الخطوة التي يتخذها النظام بناءً عليها.</p></div><span class="stepbadge">'+esc(ri.title)+'</span></div>'+
      '<div class="howToRead"><div><b>1</b><span><strong>النسبة</strong> تلخص أداءك في الأسئلة التي تقيس هذا البُعد.</span></div><div><b>2</b><span><strong>الأدلة</strong> هي عدد الإجابات التي بُني عليها المؤشر.</span></div><div><b>3</b><span><strong>الحالة</strong> توضح هل يحتاج البُعد إلى تدريب الآن.</span></div><div><b>4</b><span><strong>الخطوة التالية</strong> توضح ما سيفعله النظام بدل ترك النسبة بلا تفسير.</span></div></div>'+
      '<div class="notice"><b>تنبيه:</b> هذه مؤشرات تدريبية وليست درجات جامعية. لا يعني انخفاض بُعد معين ضعف الطالب بصفة عامة؛ بل يحدد المهارة التي تحتاج إلى تدريب في هذا المقرر.</div>'+
    '</div>'+
    currentPlan+
    '<div class="panel" style="margin-top:16px"><div class="screenhead"><div><div class="kicker">أبعاد الأداء</div><h2>ماذا تعني كل نتيجة؟</h2></div></div><div class="progressExplainGrid">'+dimensionCards+
      '<div class="progressExplainCard neutral"><div class="progressExplainHead"><span class="progressExplainIcon">⏳</span><div><h3>الاحتفاظ المؤجل</h3><span class="statusBadge neutral">لم يُقاس بعد</span></div><strong>—</strong></div><p>يقيس ما إذا كانت المعرفة بقيت مستقرة بعد مرور وقت، وليس في الجلسة نفسها.</p><div class="progressNext"><b>متى يظهر؟</b><span>بعد مراجعة لاحقة في موعد مختلف. لذلك لا نحوله إلى صفر ولا ندخله في الحكم الحالي.</span></div></div>'+
    '</div></div>'+
    '<div class="panel" style="margin-top:16px"><div class="kicker">سُلَّم العمق القانوني</div><h2>كيف يتطور الأداء القانوني؟</h2><p class="small">هذا السلم يوضح الانتقال من معرفة المفهوم إلى استخدامه في واقعة وإجابة امتحانية. العلامة الخضراء تعني أن لديك دليلًا مبدئيًا على اجتياز المرحلة، وليست شهادة نهائية بالإتقان.</p><div class="masteryLadder">'+ladder.map(function(x,i){return '<div class="ladderStep '+(x.done?"done":"")+'"><span>'+x.icon+'</span><b>'+esc(x.title)+'</b><small>'+(x.done?"ثبت مبدئيًا من أدائك":"لم يثبت بعد")+'</small></div>';}).join("")+'</div></div>'+
    '<div class="panel" style="margin-top:16px"><div class="kicker">المسارات المكتملة</div><h2>المهارات التي انتهى تدريبها النشط</h2><p class="small">بعد اجتياز اختبار المسار يُغلق المسار ويختفي من التدريبات النشطة، لكنه يبقى هنا كسجل للتقدم.</p>'+completed+'</div>'+
    '<div class="panel" style="margin-top:16px"><div class="kicker">ذاكرة الأخطاء</div><h2>ما الذي يتعلمه النظام من أخطائك؟</h2><p class="small">لا يسجل النظام أن الإجابة كانت خاطئة فقط؛ بل يحاول تحديد نوع الفجوة حتى يختار تدريبًا أنسب.</p>'+(errors.length?'<div class="attemptList">'+errors.map(function(e){return '<div class="attemptRow"><div><b>'+esc(e.type)+'</b><small>'+dimensionLabel(e.item.dimension)+'</small><p>'+esc(e.item.prompt)+'</p></div><strong>'+Math.round(e.score*100)+'%</strong></div>';}).join("")+'</div>':'<div class="goodbox">لا توجد أخطاء مسجلة حاليًا.</div>')+'</div>'+
  '</section>';
}
function render(){
  var html=header()+'<main class="app">';
  if(!hasAdmin())html+=ownerSetupScreen();
  else if(!activeAccount())html+=loginScreen();
  else if(activeAccount().role==="admin")html+=adminScreen();
  else{
    if(state.screen==="country")html+=countryScreen();
    else if(state.screen==="course")html+=courseScreen();
    else if(state.screen==="diagnostic_intro")html+=diagnosticIntro();
    else if(state.screen==="diagnostic_group")html+=groupScreen();
    else if(state.screen==="transition")html+=transitionScreen();
    else if(state.screen==="results")html+=resultsScreen();
    else if(state.screen==="today")html+=todayScreen();
    else if(state.screen==="activities")html+=activitiesScreen();
    else if(state.screen==="activity_play")html+=activityPlay();
    else if(state.screen==="reviews")html+=reviewsScreen();
    else if(state.screen==="dashboard")html+=dashboardScreen();
    else html+=countryScreen();
  }
  html+='</main><div class="footer">LexLearn AI • تعلم قانوني تكيفي • النسخة التجريبية v6.4.3</div><div id="toast" class="toast"></div>';
  APP.innerHTML=html;bind();
}
function exportStudent(id){
  var a=accountById(id);if(!a)return;
  var payload={student:{id:a.id,name:a.name,username:a.username,courseIds:a.courseIds,createdAt:a.createdAt},learning:readStudentState(id),exportedAt:new Date().toISOString()};
  var blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  var url=URL.createObjectURL(blob);
  var link=document.createElement("a");
  link.href=url;
  link.download=("LexLearn-"+(a.username||"student")+".json").replace(/[^a-zA-Z0-9_.-]/g,"_");
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(function(){URL.revokeObjectURL(url);},500);
}

function bind(){
  var co=document.getElementById("createOwner");if(co)co.onclick=function(){
    var name=(document.getElementById("ownerName").value||"").trim();
    var username=(document.getElementById("ownerUser").value||"").trim().toLowerCase();
    var pass=document.getElementById("ownerPass").value||"";
    if(name.length<2||username.length<3||pass.length<6){showAuthError("اكتب اسمًا واسم مستخدم 3 أحرف على الأقل وكلمة مرور 6 أحرف على الأقل.");return;}
    var a={id:uid("admin"),role:"admin",name:name,username:username,passwordHash:hashPass(pass),createdAt:new Date().toISOString()};
    auth.accounts.push(a);auth.currentId=a.id;saveAuth();render();
  };
  var li=document.getElementById("loginBtn");if(li)li.onclick=function(){
    var username=(document.getElementById("loginUser").value||"").trim().toLowerCase();
    var pass=document.getElementById("loginPass").value||"";
    var a=auth.accounts.find(function(x){return x.username.toLowerCase()===username&&x.passwordHash===hashPass(pass);});
    if(!a){showAuthError("بيانات الدخول غير صحيحة، أو الحساب تم إنشاؤه على جهاز آخر. النسخة الحالية لا تزامن الحسابات بين الأجهزة.");return;}
    auth.currentId=a.id;saveAuth();ADMIN.selectedStudentId=null;
    if(a.role==="student"){state=readStudentState(a.id);if(!state.screen)state.screen="country";}else state=freshState();
    render();
  };
  var lo=document.getElementById("logoutBtn");if(lo)lo.onclick=function(){save();auth.currentId=null;saveAuth();state=freshState();ADMIN.selectedStudentId=null;render();};

  var csb=document.getElementById("createStudent");if(csb)csb.onclick=function(){
    var name=(document.getElementById("studentName").value||"").trim();
    var username=(document.getElementById("studentUser").value||"").trim().toLowerCase();
    var pass=document.getElementById("studentPass").value||"";
    var courseIds=Array.from(document.querySelectorAll("[data-course-assign]:checked")).map(function(x){return x.getAttribute("data-course-assign");});
    if(name.length<2||username.length<3||pass.length<6){toast("أكمل الاسم واسم المستخدم وكلمة مرور 6 أحرف على الأقل.");return;}
    if(auth.accounts.some(function(x){return x.username.toLowerCase()===username;})){toast("اسم المستخدم موجود بالفعل.");return;}
    if(!courseIds.length){toast("اختر مقررًا واحدًا على الأقل.");return;}
    var a={id:uid("student"),role:"student",name:name,username:username,passwordHash:hashPass(pass),courseIds:courseIds,createdAt:new Date().toISOString()};
    auth.accounts.push(a);saveAuth();localStorage.setItem(studentStateKey(a.id),JSON.stringify(freshState()));
    ADMIN.lastCreated={id:a.id,username:username,password:pass};render();
  };
  document.querySelectorAll("[data-student-detail]").forEach(function(el){el.onclick=function(){ADMIN.selectedStudentId=el.getAttribute("data-student-detail");render();window.scrollTo({top:0,behavior:"smooth"});};});
  document.querySelectorAll("[data-preview-student]").forEach(function(el){el.onclick=function(){
    var id=el.getAttribute("data-preview-student"),a=accountById(id);if(!a)return;
    auth.currentId=a.id;saveAuth();state=readStudentState(a.id);ADMIN.selectedStudentId=null;render();window.scrollTo({top:0,behavior:"smooth"});
  };});
  var dc=document.getElementById("dismissCreated");if(dc)dc.onclick=function(){ADMIN.lastCreated=null;render();};
  var jcs=document.getElementById("jumpCreateStudent");if(jcs)jcs.onclick=function(){var el=document.getElementById("createStudentPanel");if(el)el.scrollIntoView({behavior:"smooth",block:"start"});};
  document.querySelectorAll("[data-admin-home]").forEach(function(el){el.onclick=function(){ADMIN.selectedStudentId=null;render();window.scrollTo({top:0,behavior:"smooth"});};});
  document.querySelectorAll("[data-export-student]").forEach(function(el){el.onclick=function(){exportStudent(el.getAttribute("data-export-student"));};});
  document.querySelectorAll("[data-reset-pass]").forEach(function(el){el.onclick=function(){
    var id=el.getAttribute("data-reset-pass"),p=document.getElementById("resetStudentPass").value||"";
    if(p.length<6){toast("كلمة المرور الجديدة 6 أحرف على الأقل.");return;}
    var a=accountById(id);if(!a)return;a.passwordHash=hashPass(p);saveAuth();document.getElementById("resetStudentPass").value="";toast("تم تحديث كلمة المرور في النسخة التجريبية.");
  };});

  document.querySelectorAll("[data-country]").forEach(function(el){el.onclick=function(){state.country=el.getAttribute("data-country");go("course");};});
  document.querySelectorAll("[data-course]").forEach(function(el){el.onclick=function(){
    state.courseId=el.getAttribute("data-course");var s=cs();
    if(s.completed)go("today");else go("diagnostic_intro");
  };});
  document.querySelectorAll("[data-nav]").forEach(function(el){el.onclick=function(){go(el.getAttribute("data-nav"));};});
  var sd=document.getElementById("startDiagnostic");if(sd)sd.onclick=function(){var s=cs();s.groupIndex=0;s.groupResults=[];s.mastery={};s.route=null;s.completed=false;save();go("diagnostic_group");};

  document.querySelectorAll("[data-qid]").forEach(function(el){el.onchange=function(){SESSION.answers[el.getAttribute("data-qid")]=el.value;};});
  document.querySelectorAll("[data-textqid]").forEach(function(el){el.oninput=function(){SESSION.answers[el.getAttribute("data-textqid")]=el.value;};});
  document.querySelectorAll("[data-dkqid]").forEach(function(el){el.onchange=function(){
    var id=el.getAttribute("data-dkqid");var ta=document.querySelector('[data-textqid="'+id+'"]');
    if(el.checked){SESSION.answers[id]="__DONT_KNOW__";if(ta){ta.value="";ta.disabled=true;}}
    else{SESSION.answers[id]="";if(ta)ta.disabled=false;}
  };});
  var sg=document.getElementById("submitGroup");if(sg)sg.onclick=submitGroup;
  document.querySelectorAll("[data-groupconf]").forEach(function(el){el.onclick=function(){SESSION.confidence=Number(el.getAttribute("data-groupconf"));render();};});
  var ng=document.getElementById("nextGroup");if(ng)ng.onclick=commitGroup;
  var ct=document.getElementById("continueTransition");if(ct)ct.onclick=function(){go("diagnostic_group");};
  if(state.screen==="transition"&&SESSION.transition){setTimeout(function(){if(state.screen==="transition")go("diagnostic_group");},2200);}
  var et=document.getElementById("enterTraining");if(et)et.onclick=function(){go("today");};

  var ml=document.getElementById("markLearnDone");if(ml)ml.onclick=function(){markLearningDone(ml.getAttribute("data-dimension"));render();window.scrollTo({top:0,behavior:"smooth"});};
  document.querySelectorAll("[data-skillcheck]").forEach(function(el){el.onclick=function(){startSkillCheck(el.getAttribute("data-skillcheck"));};});
  document.querySelectorAll("[data-activity]").forEach(function(el){el.onclick=function(){startActivity(el.getAttribute("data-activity"),false,el.getAttribute("data-target-dimension"));};});
  document.querySelectorAll("[data-examactivity]").forEach(function(el){el.onclick=function(){startActivity(null,true,el.getAttribute("data-target-dimension"));};});
  document.querySelectorAll("[data-actopt]").forEach(function(el){el.onchange=function(){SESSION.activityAnswer=Number(el.getAttribute("data-actopt"));render();};});
  var at=document.getElementById("activityText");if(at)at.oninput=function(){SESSION.activityAnswer=at.value;};
  var sa=document.getElementById("submitActivity");if(sa)sa.onclick=submitActivity;
  document.querySelectorAll("[data-review]").forEach(function(el){el.onclick=function(){startReview(el.getAttribute("data-review"));};});
}
render();
})();