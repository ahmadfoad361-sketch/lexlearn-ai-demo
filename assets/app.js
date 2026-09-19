(function(){
"use strict";

var C = window.LEX_CONTENT;
var APP = document.getElementById("app");
var LEGACY_STORAGE = "lexlearn_v4_grouped";
var AUTH_KEY = "lexlearn_auth_v1";
var STUDENT_PREFIX = "lexlearn_student_v6_";
var SESSION = {answers:{},pending:null,confidence:null,activity:null,activityAnswer:null,activityFeedback:null,transition:null};
var ADMIN = {selectedStudentId:null};

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
  return {groupIndex:0,groupResults:[],mastery:{},route:null,xp:0,streak:0,lastActive:null,reviews:[],activityHistory:[],completed:false};
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
  return state.courses[state.courseId];
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
    EXAM:{title:"مسار الإجابة الامتحانية",why:"المعرفة موجودة لكن بناء الإجابة يحتاج تنظيمًا أو تغطية أفضل للعناصر.",steps:["خطة إجابة","Rubric واضح","إجابة قصيرة بزمن اختياري","تحسين العنصر المفقود"]},
    ADVANCED:{title:"مسار التميز",why:"الأبعاد الأساسية قوية؛ نرفع مستوى التحدي ونركز على المسائل المركبة.",steps:["قضايا أكثر تركيبًا","مقارنات دقيقة","أسئلة امتحانية مركبة","تحديات سريعة"]},
    BALANCED:{title:"مسار متوازن",why:"لا توجد فجوة واحدة مهيمنة؛ سنوزع التدريب بين الدقة والتطبيق والامتحان.",steps:["مراجعة ذكية","تطبيق واقعي","دقة المصطلح","إجابة امتحانية"]}
  };
  return map[(cs()&&cs().route)||"BALANCED"];
}


function growthGoals(){
  var s=cs();if(!s)return[];
  var defs={
    recall:{icon:"🧠",title:"ثبّت الأساس",why:"نقوّي استدعاء المفهوم بدون الاعتماد على رؤية الإجابة.",next:"استرجاع قصير ثم مثال مباشر"},
    understanding:{icon:"💡",title:"افهم العلاقة بين المفاهيم",why:"نربط القاعدة بمكانها داخل الخريطة القانونية بدل الحفظ المنفصل.",next:"شرح دقيقتين + مقارنة"},
    legal_precision:{icon:"🔍",title:"ارفع الدقة القانونية",why:"نستهدف الخلط بين المصطلحات والبدائل القانونية المتقاربة.",next:"تمييز زوج مفاهيم + سؤال دقيق"},
    transfer:{icon:"🕵️",title:"اكتشف القاعدة من الوقائع",why:"ننقل المعرفة من السؤال المباشر إلى واقعة جديدة لا تذكر اسم الباب.",next:"قضية قصيرة + غيّر واقعة واحدة"},
    exam_execution:{icon:"✍️",title:"ابنِ إجابة امتحانية",why:"نحوّل المعرفة إلى إجابة منظمة تغطي العناصر المطلوبة.",next:"خطة إجابة + Rubric + تحسين"}
  };
  var dims=Object.keys(defs).map(function(d){return {d:d,v:s.mastery[d]?s.mastery[d].value:-1};})
    .filter(function(x){return x.v>=0;}).sort(function(a,b){return a.v-b.v;});
  var goals=dims.slice(0,3).map(function(x){var z=defs[x.d];return {dimension:x.d,icon:z.icon,title:z.title,why:z.why,next:z.next,score:Math.round(x.v)};});
  if(goals.length<3){
    ["understanding","legal_precision","transfer"].forEach(function(d){if(goals.length<3&&!goals.some(function(g){return g.dimension===d;})){var z=defs[d];goals.push({dimension:d,icon:z.icon,title:z.title,why:z.why,next:z.next,score:null});}});
  }
  return goals;
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
  var c=course(),s=cs();if(!c||!c.microLessons||!c.microLessons.length)return null;
  var goals=growthGoals();
  for(var i=0;i<goals.length;i++){
    var hit=c.microLessons.find(function(l){return l.dimension===goals[i].dimension;});
    if(hit)return hit;
  }
  return c.microLessons[(s.activityHistory.length||0)%c.microLessons.length];
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
    nav='<button class="iconbtn" data-admin-home="1">👥 لوحة الإدارة</button><span class="pill">مدير المنصة</span><button class="iconbtn" id="logoutBtn">خروج</button>';
  }else if(a&&a.role==="student"){
    if(s&&s.completed){
      nav='<button class="iconbtn" data-nav="today">🎯 مسار اليوم</button><button class="iconbtn" data-nav="activities">🧩 التدريبات</button><button class="iconbtn" data-nav="reviews">🔄 المراجعات</button><button class="iconbtn" data-nav="dashboard">📈 تقدمي</button><button class="iconbtn" data-nav="course">📚 المقررات</button>';
    }
    nav+='<span class="pill">'+esc(a.name)+'</span>'+(s&&s.completed?'<span class="pill gold">⭐ '+s.xp+' XP</span><span class="pill">🔥 '+s.streak+'</span>':'')+'<button class="iconbtn" id="logoutBtn">خروج</button>';
  }
  return '<header class="topbar"><div class="topin"><div class="brand"><div class="logo">Lx</div><div class="brandtext"><b>LexLearn AI</b><small>تعلم قانوني ذكي • مسار يتكيف معك</small></div></div><div class="topactions">'+nav+'</div></div></header>';
}

function ownerSetupScreen(){
  return '<section class="authshell"><div class="authvisual"><img src="assets/visual-study.svg" alt="تعلم قانوني ذكي"><div><span class="eyebrow">LexLearn AI</span><h1>ابدأ بمنصة لها عقل تعليمي… ولوحة تحكم حقيقية في الطريق</h1><p>أنشئ حساب مدير النسخة التجريبية على هذا الجهاز، ثم أنشئ حسابات الطلاب بنفسك.</p></div></div><div class="panel authcard"><div class="kicker">إعداد أول مرة</div><h2>إنشاء حساب مدير المنصة</h2><p class="small">هذه النسخة تستخدم تخزينًا محليًا للعرض والتجربة فقط. قبل الـPilot الحقيقي سننقل الحسابات إلى Backend آمن.</p><label class="fieldlabel">الاسم</label><input id="ownerName" type="text" placeholder="مثال: مدير LexLearn"><label class="fieldlabel">اسم المستخدم</label><input id="ownerUser" type="text" placeholder="admin"><label class="fieldlabel">كلمة المرور</label><input id="ownerPass" type="password" placeholder="اختر كلمة مرور للتجربة"><button class="btn primary fullbtn" id="createOwner">إنشاء لوحة التحكم</button></div></section>';
}
function loginScreen(){
  return '<section class="authshell"><div class="authvisual"><img src="assets/visual-study.svg" alt="طلاب قانون يتعلمون"><div><span class="eyebrow">تعلم أقل مللًا • فهم أعمق</span><h1>كل طالب له مسار… وكل تقدم له دليل.</h1><p>جلسات قصيرة، حالات قانونية، مراجعة ذكية، ولوحة تقدم شخصية.</p><div class="visualchips"><span>🧠 فهم</span><span>⚖️ تطبيق</span><span>🕵️ قضايا</span><span>✍️ امتحان</span></div></div></div><div class="panel authcard"><div class="kicker">تسجيل الدخول</div><h2>أهلًا بك</h2><label class="fieldlabel">اسم المستخدم</label><input id="loginUser" type="text" autocomplete="username" placeholder="اسم المستخدم"><label class="fieldlabel">كلمة المرور</label><input id="loginPass" type="password" autocomplete="current-password" placeholder="••••••••"><button class="btn primary fullbtn" id="loginBtn">دخول</button><div class="sourcebox">حساب الطالب يرى بياناته فقط داخل الواجهة. العزل الأمني الحقيقي بين الحسابات يتطلب Backend وقواعد صلاحيات قبل الاستخدام الفعلي مع الطلاب.</div></div></section>';
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
  return '<section class="panel screen adminShell"><div class="screenhead"><div><button class="btn ghost" data-admin-home="1">← كل الطلاب</button><div class="kicker" style="margin-top:12px">ملف الطالب</div><h2>'+esc(acc.name)+'</h2><p class="small">@'+esc(acc.username)+' • الحساب منشأ بواسطة مدير المنصة</p></div><button class="btn outline" data-export-student="'+acc.id+'">تصدير بيانات الطالب JSON</button></div><div class="statgrid"><div class="stat"><strong>'+(sum.avg==null?"—":sum.avg+"%")+'</strong><small>متوسط الأبعاد المقاسة</small></div><div class="stat"><strong>'+sum.completed+'</strong><small>مقررات مكتملة التشخيص</small></div><div class="stat"><strong>'+sum.groups+'</strong><small>مجموعات تشخيص</small></div><div class="stat"><strong>'+sum.activities+'</strong><small>تدريبات مكتملة</small></div></div><div class="adminReset"><label class="fieldlabel">إعادة تعيين كلمة المرور</label><div class="inlineform"><input id="resetStudentPass" type="password" placeholder="كلمة مرور جديدة"><button class="btn secondary" data-reset-pass="'+acc.id+'">تحديث</button></div></div>'+courseBlocks+'</section>';
}
function adminScreen(){
  if(ADMIN.selectedStudentId){var a=accountById(ADMIN.selectedStudentId);if(a)return adminStudentDetail(a);ADMIN.selectedStudentId=null;}
  var list=students(),summaries=list.map(function(a){return {a:a,s:studentSummary(a)};});
  var avgs=summaries.filter(function(x){return x.s.avg!=null;}).map(function(x){return x.s.avg;});
  var overall=avgs.length?Math.round(avgs.reduce(function(a,b){return a+b;},0)/avgs.length):null;
  return '<section class="screen adminShell"><div class="adminHero"><div><div class="kicker">لوحة تحكم المدير</div><h1>طلابك أمامك… من الصورة العامة إلى كل إجابة.</h1><p>أنشئ الحسابات، راقب التطور، وافتح تفاصيل أي طالب حتى مستوى السؤال والإجابة والثقة.</p></div><img src="assets/visual-study.svg" alt=""></div><div class="statgrid adminstats"><div class="stat"><strong>'+list.length+'</strong><small>طلاب</small></div><div class="stat"><strong>'+(overall==null?"—":overall+"%")+'</strong><small>متوسط الأداء المقاس</small></div><div class="stat"><strong>'+summaries.filter(function(x){return x.s.needs;}).length+'</strong><small>يحتاجون متابعة</small></div><div class="stat"><strong>'+summaries.reduce(function(n,x){return n+x.s.groups;},0)+'</strong><small>مجموعات مكتملة</small></div></div><div class="adminGrid"><div class="panel"><div class="screenhead"><div><div class="kicker">الحسابات</div><h2>الطلاب</h2></div></div>'+(list.length?'<div class="studentCards">'+summaries.map(function(x){return '<button class="studentCard" data-student-detail="'+x.a.id+'"><span class="avatar">'+esc((x.a.name||"ط").slice(0,1))+'</span><span class="studentMain"><b>'+esc(x.a.name)+'</b><small>@'+esc(x.a.username)+' • '+(x.s.avg==null?"لم يبدأ":x.s.avg+"% متوسط")+'</small></span><span class="statusdot '+(x.s.needs?"warn":"good")+'"></span></button>';}).join("")+'</div>':'<div class="empty">لسه ما فيش طلاب. أنشئ أول حساب من النموذج المجاور.</div>')+'</div><div class="panel"><div class="kicker">حساب جديد</div><h2>أضف طالبًا</h2><label class="fieldlabel">اسم الطالب</label><input id="studentName" type="text" placeholder="الاسم"><label class="fieldlabel">اسم المستخدم</label><input id="studentUser" type="text" placeholder="username"><label class="fieldlabel">كلمة المرور</label><input id="studentPass" type="password" placeholder="كلمة مرور مؤقتة"><div class="fieldlabel">المقررات المتاحة</div><div class="checkgrid">'+C.courses.map(function(cc){return '<label class="checkcard"><input type="checkbox" data-course-assign="'+cc.id+'" checked> <span><b>'+esc(cc.code)+'</b><small>'+esc(cc.title_ar)+'</small></span></label>';}).join("")+'</div><button class="btn primary fullbtn" id="createStudent">إنشاء حساب الطالب</button><div class="notice"><b>نسخة تجريبية:</b> كلمات المرور هنا محفوظة محليًا بصورة غير مناسبة للإطلاق الحقيقي. قبل الـPilot سنستخدم Auth آمن وقاعدة بيانات وصلاحيات Server-side.</div></div></div></section>';
}

function countryScreen(){
  return '<section class="panel screen onboarding">'+journey("country")+'<div class="screenhead"><div><div class="kicker">البداية</div><h2>اختر النظام القانوني</h2><p class="small">النسخة التجريبية الحالية مفعّلة لقطر.</p></div></div><div class="grid2"><div class="option clickable" data-country="QA"><span class="countryflag">🇶🇦</span><b>قطر</b><small>جامعة قطر — مقرران متاحان للتجربة.</small></div><div class="option disabled"><span class="countryflag">🇪🇬</span><b>مصر</b><small>قريبًا بعد مراجعة المحتوى المصري.</small></div></div></section>';
}
function courseScreen(){
  var allowed=assignedCourseIds();
  var courses=C.courses.filter(function(x){return x.jurisdiction==="QA"&&allowed.indexOf(x.id)>=0;});
  return '<section class="panel screen onboarding">'+journey("course")+'<div class="screenhead"><div><div class="kicker">اختيار المقرر</div><h2>ادخل المقرر الذي تريد العمل عليه</h2><p class="small">كل مقرر له تشخيصه وأسئلته ونتيجته ومساره المستقل.</p></div><span class="stepbadge">🇶🇦 جامعة قطر</span></div><div class="grid2">'+courses.map(function(c){
    var saved=state.courses[c.id];
    var progress=saved&&saved.completed?'تم التشخيص • '+(saved.groupResults.length)+' مجموعات':'5 مستويات: Easy → Medium → Difficult → Transfer → Exam';
    return '<div class="coursecard clickable" data-course="'+c.id+'"><div class="coursecode">'+esc(c.code)+'</div><h3>'+esc(c.title_ar)+'</h3><p>'+esc(c.description)+'</p>'+(c.prerequisite?'<div class="small"><b>متطلب سابق بحسب دليل الجامعة:</b> '+esc(c.prerequisite)+'</div>':'')+'<div class="courseprogress">'+progress+'</div><button class="btn primary">'+(saved&&saved.completed?'ادخل المقرر':'ابدأ المقرر')+'</button></div>';
  }).join("")+'</div><div class="sourcebox">المقرران ووصفهما مستندان إلى صفحات جامعة قطر الرسمية ودليل الطالب الجامعي 2025/2026.</div></section>';
}
function diagnosticIntro(){
  var c=course();
  var total=c.groups.reduce(function(s,g){return s+g.items.length;},0);
  return '<section class="panel screen">'+journey("diagnostic")+'<div class="screenhead"><div><div class="kicker">'+esc(c.code)+'</div><h2>تشخيص البداية — 5 مستويات واضحة</h2></div><span class="stepbadge">'+total+' سؤالًا في مجموعات</span></div><div class="info"><b>Easy → Medium → Difficult → Transfer → Exam</b><br>الأسئلة مجمعة، ونطلب ثقة واحدة فقط بعد كل مجموعة. الكتابة الحرة موجودة في مجموعة الامتحان فقط.</div><div class="grid2">'+c.groups.map(function(g,i){return '<div class="option"><div class="questionMeta"><span class="tag maroon">'+esc(g.subtitle)+'</span></div><b>'+(i+1)+'. '+esc(g.title.replace(/^المجموعة \d+ — /,""))+'</b><small>'+esc(g.purpose)+'</small></div>';}).join("")+'</div><div class="notice"><b>جودة المحتوى:</b> كل المشتتات قانونية، والتدرج أصبح جزءًا صريحًا من بنية المقرر. أسئلة الـPilot ما زالت تحتاج اعتمادًا متخصصًا قبل الإطلاق العام.</div><div class="actions"><button class="btn primary" id="startDiagnostic">ابدأ المجموعة الأولى</button><button class="btn ghost" data-nav="course">رجوع للمقررات</button></div></section>';
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
    }).join("")+(avg<.55?'<div class="notice"><b>قرار تكيفي:</b> لن نعتبر هذه المجموعة مستقرة. أخطاؤها أضيفت للمراجعة، وسيعطيك مسار التعلم أنشطة أبسط قبل رفع التحدي.</div>':avg>=.8?'<div class="goodbox"><b>قرار تكيفي:</b> المجموعة مستقرة بما يكفي للانتقال إلى مستوى أكثر تطبيقًا.</div>':'<div class="info"><b>قرار تكيفي:</b> ننتقل، مع إبقاء الموضوعات الجزئية في المراجعة.</div>')+'<div class="actions"><button class="btn primary" id="nextGroup">'+(s.groupIndex===total-1?"اعرض النتيجة الشاملة":"المجموعة التالية")+'</button></div></div></section>';
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
  var msg=t.score>=.8?"قوي جدًا. هنرفع عمق التحدي شوية.":t.score>=.55?"كويس. نكمّل مع تركيز أكبر على الدقة.":"تمام، عرفنا مكان الفجوة. هنثبتها بدل ما نكرر نفس السؤال.";
  return '<section class="transitionScreen screen"><div class="transitionVisual"><img src="assets/visual-gavel.svg" alt="مطرقة قانونية"><div class="impactRing"></div></div><div class="kicker">مرحلة اكتملت ✓</div><h1>'+Math.round(t.score*100)+'%</h1><p>'+esc(msg)+'</p><div class="nextStage"><span>التالي</span><b>'+esc(t.next.subtitle)+' • '+esc(t.next.title.replace(/^المجموعة \d+ — /,""))+'</b></div><button class="btn primary" id="continueTransition">ادخل المرحلة التالية</button></section>';
}
function finishDiagnostic(){
  var s=cs();s.completed=true;computeMastery();state.screen="results";save();render();window.scrollTo({top:0,behavior:"smooth"});
}

function resultsScreen(){
  var s=cs(),c=course(),ri=routeInfo(),goals=growthGoals(),errors=errorMemory(3);
  var dims=["recall","understanding","legal_precision","transfer","exam_execution"];
  var metrics=dims.map(function(d){
    var m=s.mastery[d];return '<div class="metric"><div class="metricHead"><span>'+dimensionLabel(d)+'</span><span>'+(m?pct(m.value):"لم يُقاس")+'</span></div>'+(m?'<div class="bar"><span style="width:'+m.value+'%"></span></div><div class="reliability">'+m.evidence+' دليل</div>':'<div class="reliability">لا توجد إجابة كافية لهذا البُعد.</div>')+'</div>';
  }).join("");
  var exam=s.groupResults.find(function(g){return g.groupId===c.groups[c.groups.length-1].id;});
  var examDetail=exam?'<div class="examdetail"><h3>من أين جاءت درجة الاختبار الامتحاني؟</h3><p class="small">كل سؤال ظاهر هنا بنتيجته؛ لا توجد درجة غامضة.</p>'+exam.items.map(function(x,i){var it=findItem(x.itemId);return '<div class="evidencecard"><b>سؤال '+(i+1)+': '+esc(it.prompt)+'</b><span>'+Math.round(x.score*100)+'%</span></div>';}).join("")+'</div>':'';
  var goalCards='<div class="goalGrid">'+goals.map(function(g,i){return '<div class="goalCard"><div class="goalNum">'+(i+1)+'</div><div class="goalIcon">'+g.icon+'</div><h3>'+esc(g.title)+'</h3>'+(g.score!=null?'<span class="miniScore">'+g.score+'%</span>':'')+'<p>'+esc(g.why)+'</p><small>الخطوة التالية: '+esc(g.next)+'</small></div>';}).join("")+'</div>';
  var err='<div class="errorMemory"><h3>🧠 ذاكرة الأخطاء الذكية</h3><p class="small">مش هنكرر الغلط؛ هنفهم نوعه ونرجع له بصيغة مختلفة.</p>'+(errors.length?errors.map(function(e){return '<div class="errorChip"><b>'+esc(e.type)+'</b><span>'+esc(e.item.prompt.slice(0,90))+(e.item.prompt.length>90?"…":"")+'</span></div>';}).join(""):'<div class="goodbox">لا توجد أخطاء بارزة في التشخيص الحالي.</div>')+'</div>';
  return '<section class="screen"><div class="resultHero"><div><div class="kicker">تحليل أدائك</div><h1>مش “درجة” وبس… دي خريطة تطويرك.</h1><p>حددنا أين أنت قوي، وأين يحتاج العقل القانوني إلى تدريب مختلف.</p></div><img src="assets/visual-study.svg" alt=""></div><div class="dashboard"><div class="panel">'+journey("results")+'<h2>'+esc(c.code)+' — '+esc(c.title_ar)+'</h2><div class="notice">كل نسبة لها أدلة فعلية. «لم يُقاس» لا تتحول إلى 0%. والتصحيح المقالي الحالي مفاهيمي، وليس درجة جامعية رسمية.</div><div class="metricGrid">'+metrics+'<div class="metric"><div class="metricHead"><span>الاحتفاظ المؤجل</span><span>لم يُقاس بعد</span></div><div class="reliability">سيُقاس من مراجعة حقيقية لاحقة.</div></div></div>'+examDetail+'</div><div class="pathcard"><div class="kicker" style="color:#e8c986">المسار الحالي</div><h2>'+esc(ri.title)+'</h2><p>'+esc(ri.why)+'</p>'+ri.steps.map(function(x,i){return '<div class="pathstep"><b>'+(i+1)+'.</b> '+esc(x)+'</div>';}).join("")+'</div></div><div class="panel growthPlan"><div class="screenhead"><div><div class="kicker">خطة تطويرك</div><h2>3 أهداف فقط الآن</h2><p class="small">عشان ما نغرقكش. عندما تتحسن، تتغير الأهداف تلقائيًا.</p></div><span class="stepbadge">🎯 شخصية حسب أدائك</span></div>'+goalCards+err+'<div class="actions"><button class="btn primary" id="enterTraining">ابدأ جلسة اليوم</button></div></div></section>';
}
function stats(){
  var s=cs();return '<div class="statgrid"><div class="stat"><strong>'+s.xp+'</strong><small>XP</small></div><div class="stat"><strong>'+s.streak+'</strong><small>أيام متتالية</small></div><div class="stat"><strong>'+s.groupResults.length+'</strong><small>مجموعات تشخيص</small></div><div class="stat"><strong>'+s.activityHistory.length+'</strong><small>تدريبات مكتملة</small></div></div>';
}
function todayScreen(){
  var s=cs(),c=course(),ri=routeInfo(),due=dueReviews(),lesson=chosenMicroLesson(),goals=growthGoals(),errors=errorMemory(2);
  var lessonHtml=lesson?'<div class="microLesson"><div class="microTop"><span class="microIcon">'+lesson.icon+'</span><div><div class="kicker">فكرة اليوم • '+lesson.minutes+' دقائق</div><h2>'+esc(lesson.title)+'</h2></div></div><p>'+esc(lesson.explain)+'</p><div class="workedExample"><b>مثال سريع</b><span>'+esc(lesson.example)+'</span></div><div class="microChallenge"><b>جرّب بعقلك</b><span>'+esc(lesson.challenge)+'</span></div></div>':'';
  return '<section class="screen">'+journey("training")+'<div class="dailyHero"><div><span class="eyebrow">جلسة اليوم • حوالي 7 دقائق</span><h1>مش هنذاكر كل حاجة. هنضرب في المكان الصح.</h1><p>'+esc(ri.why)+'</p><div class="sessionSteps"><span>1️⃣ افهم</span><span>2️⃣ ميّز</span><span>3️⃣ طبّق</span><span>4️⃣ ثبّت</span></div></div><img src="assets/visual-study.svg" alt=""></div>'+stats()+'<div class="todayLayout"><div>'+lessonHtml+'<div class="panel" style="margin-top:14px"><div class="screenhead"><div><div class="kicker">تدريب متنوع</div><h2>اختر تحديًا قصيرًا</h2></div><span class="stepbadge">'+due.length+' مراجعات مستحقة</span></div><div class="grid3">'+c.activities.map(activityCard).join("")+'<div class="activityCard"><div class="activityIcon">✍️</div><h3>تحدي امتحاني</h3><p>إجابة قصيرة تُصحح وفق عناصر مفاهيمية.</p><button class="btn primary" data-examactivity="1">ابدأ</button></div></div></div></div><aside class="panel coachRail"><div class="kicker">🎯 تركيزك الحالي</div>'+goals.map(function(g){return '<div class="coachGoal"><span>'+g.icon+'</span><div><b>'+esc(g.title)+'</b><small>'+esc(g.next)+'</small></div></div>';}).join("")+'<div class="coachBreak"></div><div class="kicker">🧠 أخطاء سنعالجها</div>'+(errors.length?errors.map(function(e){return '<div class="coachError"><b>'+esc(e.type)+'</b><small>'+esc(e.item.prompt.slice(0,65))+'…</small></div>';}).join(""):'<div class="goodbox">بداية قوية — سنرفع مستوى التحدي.</div>')+'</aside></div></section>';
}
function activityCard(a){
  return '<div class="activityCard"><div class="activityIcon">'+a.icon+'</div><h3>'+esc(a.title)+'</h3><p>'+esc(a.prompt)+'</p><button class="btn secondary" data-activity="'+a.id+'">ابدأ</button></div>';
}
function activitiesScreen(){
  var c=course(),s=cs();
  var hist=s.activityHistory.slice().reverse().slice(0,8);
  return '<section class="panel screen">'+journey("training")+'<div class="screenhead"><div><div class="kicker">التدريبات</div><h2>تدريب قصير ومتنوع</h2></div><span class="stepbadge">النقاط لا تساوي الإتقان</span></div><div class="grid2">'+c.activities.map(activityCard).join("")+'<div class="activityCard"><div class="activityIcon">✍️</div><h3>تحدي امتحاني</h3><p>إجابة واحدة قصيرة مع Rubric واضح.</p><button class="btn primary" data-examactivity="1">ابدأ</button></div></div>'+(hist.length?'<h3 style="margin-top:20px">آخر التدريبات</h3><div class="timeline">'+hist.map(function(h){return '<div class="timelineItem"><b>'+esc(h.title)+' • '+Math.round(h.score*100)+'%</b><div class="small">'+new Date(h.at).toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short"})+'</div></div>';}).join("")+'</div>':'')+'</section>';
}
function findActivity(id){return (course().activities||[]).find(function(a){return a.id===id;});}
function startActivity(id,exam){
  if(exam){
    var eg=course().groups[course().groups.length-1];
    SESSION.activity={id:"exam-practice",title:"تحدي امتحاني",icon:"✍️",examItem:eg.items[Math.floor(Math.random()*eg.items.length)]};
  }else SESSION.activity=findActivity(id);
  SESSION.activityAnswer=null;SESSION.activityFeedback=null;state.screen="activity_play";save();render();
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
    h+='<div class="feedback '+(f.score>=.8?"good":f.score>=.5?"warn":"bad")+'"><h3>'+Math.round(f.score*100)+'%</h3>'+f.detail+'</div><div class="actions"><button class="btn primary" data-nav="today">ارجع لمسار اليوم</button></div>';
  }else h+='<div class="actions"><button class="btn primary" id="submitActivity">اعتمد التدريب</button><button class="btn ghost" data-nav="activities">خروج</button></div>';
  h+='</div></section>';return h;
}
function submitActivity(){
  var a=SESSION.activity,score=0,detail="";
  if(a.examItem){
    var ans=SESSION.activityAnswer||"";if(norm(ans).length<3){toast("اكتب إجابة قصيرة أولًا.");return;}
    var wr=evaluateWritten(a.examItem,ans);score=wr.score;
    detail='<div class="rubricbox"><div class="small" style="margin-bottom:6px">التقييم هنا مفاهيمي، فيقبل أكثر من صياغة للفكرة نفسها.</div>'+wr.criteria.map(function(r){return '<div class="rubricrow '+(r.ok?"hit":"miss")+'"><span>'+(r.ok?"✓":"○")+'</span><b>'+esc(r.label)+'</b><small>'+r.matched+'/'+r.need+' مفهوم مطلوب</small></div>';}).join("")+'</div>';
  }else if(a.options){
    if(SESSION.activityAnswer==null){toast("اختر إجابة أولًا.");return;}
    score=a.options[SESSION.activityAnswer].score;
    detail='<p>'+(score?"اختيار صحيح.":"راجع الفرق بين البدائل القانونية.")+'</p>';
  }else{
    var ans2=norm(SESSION.activityAnswer);if(!ans2){toast("اكتب الإجابة أولًا.");return;}
    score=(a.accepted||[]).some(function(x){return ans2.indexOf(norm(x))>=0;})?1:0;
    detail='<p>الإجابة المرجعية: <b>'+esc(a.answer)+'</b></p>';
  }
  SESSION.activityFeedback={score:score,detail:detail};
  var s=cs();s.activityHistory.push({title:a.title,score:score,at:new Date().toISOString()});addXP(8+(score>=.8?4:0));save();render();
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
  var s=cs(),c=course(),ri=routeInfo(),ladder=masteryLadder(),errors=errorMemory(6);
  var dims=["recall","understanding","legal_precision","transfer","exam_execution"];
  return '<section class="screen"><div class="panel">'+journey("training")+'<div class="screenhead"><div><div class="kicker">لوحة تقدمي</div><h2>'+esc(c.code)+' — '+esc(c.title_ar)+'</h2></div><span class="stepbadge">'+esc(ri.title)+'</span></div>'+stats()+'<div class="metricGrid" style="margin-top:15px">'+dims.map(function(d){var m=s.mastery[d];return '<div class="metric"><div class="metricHead"><span>'+dimensionLabel(d)+'</span><span>'+(m?pct(m.value):"لم يُقاس")+'</span></div>'+(m?'<div class="bar"><span style="width:'+m.value+'%"></span></div><div class="reliability">'+m.evidence+' دليل</div>':'')+'</div>';}).join("")+'<div class="metric"><div class="metricHead"><span>الاحتفاظ المؤجل</span><span>لم يُقاس بعد</span></div><div class="reliability">يحتاج مراجعة فعلية لاحقة.</div></div></div></div><div class="panel" style="margin-top:16px"><div class="kicker">سُلَّم العمق القانوني</div><h2>فين وصلت؟</h2><div class="masteryLadder">'+ladder.map(function(x,i){return '<div class="ladderStep '+(x.done?"done":"")+'"><span>'+x.icon+'</span><b>'+esc(x.title)+'</b><small>'+(x.done?"تم إثباته مبدئيًا":"المرحلة التالية")+'</small></div>';}).join("")+'</div></div><div class="panel" style="margin-top:16px"><div class="kicker">ذاكرة الأخطاء</div><h2>النظام فاكر نمط الغلط… مش بس الإجابة</h2>'+(errors.length?'<div class="attemptList">'+errors.map(function(e){return '<div class="attemptRow"><div><b>'+esc(e.type)+'</b><small>'+dimensionLabel(e.item.dimension)+'</small><p>'+esc(e.item.prompt)+'</p></div><strong>'+Math.round(e.score*100)+'%</strong></div>';}).join("")+'</div>':'<div class="goodbox">لا توجد أخطاء مسجلة حاليًا.</div>')+'<div class="notice"><b>مهم:</b> هذه مؤشرات تدريبية وليست درجات جامعية رسمية.</div></div></section>';
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
  html+='</main><div class="footer">LexLearn AI • Adaptive Legal Learning • v6 Prototype</div>';
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
    if(name.length<2||username.length<3||pass.length<6){toast("اكتب اسمًا واسم مستخدم 3 أحرف على الأقل وكلمة مرور 6 أحرف على الأقل.");return;}
    var a={id:uid("admin"),role:"admin",name:name,username:username,passwordHash:hashPass(pass),createdAt:new Date().toISOString()};
    auth.accounts.push(a);auth.currentId=a.id;saveAuth();render();
  };
  var li=document.getElementById("loginBtn");if(li)li.onclick=function(){
    var username=(document.getElementById("loginUser").value||"").trim().toLowerCase();
    var pass=document.getElementById("loginPass").value||"";
    var a=auth.accounts.find(function(x){return x.username.toLowerCase()===username&&x.passwordHash===hashPass(pass);});
    if(!a){toast("اسم المستخدم أو كلمة المرور غير صحيحين.");return;}
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
    auth.accounts.push(a);saveAuth();localStorage.setItem(studentStateKey(a.id),JSON.stringify(freshState()));toast("تم إنشاء حساب "+name);render();
  };
  document.querySelectorAll("[data-student-detail]").forEach(function(el){el.onclick=function(){ADMIN.selectedStudentId=el.getAttribute("data-student-detail");render();window.scrollTo({top:0,behavior:"smooth"});};});
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

  document.querySelectorAll("[data-activity]").forEach(function(el){el.onclick=function(){startActivity(el.getAttribute("data-activity"),false);};});
  document.querySelectorAll("[data-examactivity]").forEach(function(el){el.onclick=function(){startActivity(null,true);};});
  document.querySelectorAll("[data-actopt]").forEach(function(el){el.onchange=function(){SESSION.activityAnswer=Number(el.getAttribute("data-actopt"));render();};});
  var at=document.getElementById("activityText");if(at)at.oninput=function(){SESSION.activityAnswer=at.value;};
  var sa=document.getElementById("submitActivity");if(sa)sa.onclick=submitActivity;
  document.querySelectorAll("[data-review]").forEach(function(el){el.onclick=function(){startReview(el.getAttribute("data-review"));};});
}
render();
})();