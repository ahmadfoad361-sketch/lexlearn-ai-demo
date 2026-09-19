# LexLearn AI v6.5 — Programmer Review Source Pack

> Snapshot prepared for code review. This project is currently a static single-page application (SPA) published on GitHub Pages. Most "pages" are rendered as application screens by `assets/app.js`; they are not separate HTML files.

## Live site
https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/

## Repository
https://github.com/ahmadfoad361-sketch/lexlearn-ai-demo

## Current screen map
1. إعداد المدير لأول مرة
2. تسجيل الدخول
3. لوحة الإدارة
4. تفاصيل الطالب
5. اختيار الدولة
6. اختيار المقرر
7. مقدمة التشخيص
8. مجموعات التشخيص
9. شاشة الانتقال بين المراحل
10. تحليل النتيجة
11. خطة التدريب الموجهة
12. التدريب الموجه
13. اختبار المسار
14. المراجعات
15. لوحة التقدم

## Runtime architecture
- `index.html`: single entry point.
- `assets/app.js`: navigation, local authentication prototype, admin/student UI, diagnostics, adaptive skill paths, scoring, reviews, progress dashboard.
- `assets/content.js`: pilot course content for LAWC 101 and LAWC 213, diagnostic groups, micro-lessons, training activities.
- `assets/styles.css`: complete responsive UI and animation styles.
- `assets/visual-study.svg`: visual asset.
- `.github/workflows/pages.yml`: GitHub Pages deployment workflow.

## Important review note
The current account system is a LOCAL PROTOTYPE using browser localStorage. It is not production-grade multi-device authentication. Real student deployment requires server-side authentication, database persistence, row/role permissions, secure password handling, audit logging, and synchronized student records. See AUTH_BACKEND_ARCHITECTURE.md.

## Source files


---

# FILE: index.html

```html
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#7b1734">
  <title>LexLearn AI — Adaptive Legal Learning</title>
  <meta name="description" content="LexLearn AI: adaptive legal learning for law students with grouped diagnostics, personalized growth plans, micro-learning, smart review, and instructor analytics.">
  <link rel="stylesheet" href="assets/styles.css?v=6.5">
</head>
<body>
  <div id="app" class="shell"></div>
  <noscript>يحتاج LexLearn إلى JavaScript لتشغيل المسار التكيفي.</noscript>
  <script src="assets/content.js?v=6.5"></script>
  <script src="assets/app.js?v=6.5"></script>
</body>
</html>
```

---

# FILE: assets/app.js

```javascript
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
  html+='</main><div class="footer">LexLearn AI • تعلم قانوني تكيفي • النسخة التجريبية v6.5</div><div id="toast" class="toast"></div>';
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
```

---

# FILE: assets/content.js

```javascript

window.LEX_CONTENT = {
  version: "5.0-content-quality",
  productScope: {
    audience: "law_students_only",
    activeJurisdictions: ["QA"],
    waitlistJurisdictions: ["EG"],
    pilotCourses: ["QA-QU-LAWC101","QA-QU-LAWC213"]
  },
  qualityModel: {
    diagnosticProgression: ["easy","medium","difficult","transfer","exam"],
    contentStatus: "pilot_seed_review_required",
    gradingMode: "concept_rubric_v2",
    productionTarget: "grounded_ai_rubric_v1",
    note: "الأسئلة الحالية نموذج تشغيلي مبني على وصف المقررات الرسمي. لا تُعد بنك أسئلة جامعيًا معتمدًا قبل مراجعة متخصص."
  },
  jurisdictions: [
    {id:"QA", name_ar:"قطر", flag:"🇶🇦", enabled:true},
    {id:"EG", name_ar:"مصر", flag:"🇪🇬", enabled:false, note:"قريبًا — بعد مراجعة واعتماد المحتوى المصري."}
  ],
  sources: {
    QU_COURSES_AR: {
      label:"جامعة قطر — وصف مقررات كلية القانون",
      url:"https://www.qu.edu.qa/ar/Colleges/law/departments/private-law/Pages/course-description.aspx",
      status:"official"
    },
    QU_COURSES_DETAIL: {
      label:"جامعة قطر — الوصف التفصيلي للمقررات",
      url:"https://www.qu.edu.qa/ar/colleges/law/programs/programs/corse",
      status:"official"
    },
    QU_CATALOG_2526: {
      label:"جامعة قطر — دليل الطالب الجامعي 2025/2026",
      url:"https://qttsc.qu.edu.qa/en-us/students/documents/undergraduate-student-catalog-2025-2026-en.pdf",
      status:"official"
    }
  },
  courses: [
    {
      id:"QA-QU-LAWC101",
      jurisdiction:"QA",
      university:"جامعة قطر",
      code:"LAWC 101",
      title_ar:"مدخل إلى القانون",
      language:"ar",
      prerequisite:null,
      sourceIds:["QU_COURSES_AR","QU_COURSES_DETAIL"],
      description:"مقرر تأسيسي يدور حول نظرية القانون ونظرية الحق.",
      units:[
        {title:"نظرية القانون",topics:["القاعدة القانونية وخصائصها","تقسيمات القانون","مصادر القانون القطري","التشريع ونفاذه","العرف والعادة الاتفاقية","تطبيق القانون زمانًا ومكانًا","تفسير القانون","إلغاء القانون"]},
        {title:"نظرية الحق",topics:["مفهوم الحق وتقسيماته","مصادر الحق","أشخاص الحق","محل الحق","استعمال الحق وحدوده والتعسف فيه"]}
      ],
      groups:[
        {
          id:"101-easy",level:"easy",title:"المجموعة 1 — البداية",subtitle:"Easy",purpose:"أسئلة تأسيسية للتأكد من الخريطة العامة للمقرر قبل زيادة التشابه بين البدائل.",items:[
            {id:"101-e1",dimension:"recall",difficulty:1,type:"mcq",prompt:"أي مجموعة هي الأقرب لمصادر القانون القطري كما يذكرها وصف المقرر؟",options:[
              {id:"a",text:"التشريع، الشريعة الإسلامية، العرف، والعدالة.",score:1},
              {id:"b",text:"الدستور، القانون، اللائحة، والتصرف القانوني.",score:0},
              {id:"c",text:"التشريع، القضاء، الفقه، والمعاهدات فقط.",score:0}
            ],explanation:"وصف المقرر يذكر التشريع والشريعة الإسلامية والعرف والعدالة ضمن مصادر القانون القطري."},
            {id:"101-e2",dimension:"recall",difficulty:1,type:"mcq",prompt:"أي ترتيب يطابق المستويات التي يذكرها الوصف التفصيلي عند دراسة التشريع؟",options:[
              {id:"a",text:"الدستور ثم القانون ثم اللائحة.",score:1},
              {id:"b",text:"اللائحة ثم القانون ثم الدستور.",score:0},
              {id:"c",text:"العرف ثم القانون ثم القضاء.",score:0}
            ],explanation:"الوصف التفصيلي يذكر دراسة التشريع بدءًا بالدستور فالقانون فاللائحة."},
            {id:"101-e3",dimension:"recall",difficulty:1,type:"mcq",prompt:"أي مجموعة تقع كلها داخل محور نظرية الحق؟",options:[
              {id:"a",text:"أشخاص الحق، محل الحق، وحدود استعمال الحق.",score:1},
              {id:"b",text:"مصادر القانون، تفسير القانون، وإلغاء القانون.",score:0},
              {id:"c",text:"الدستور، القانون، واللائحة.",score:0}
            ],explanation:"نظرية الحق في وصف المقرر تشمل الأشخاص والمحل واستعمال الحق، بينما البدائل الأخرى من نظرية القانون."}
          ]
        },
        {
          id:"101-medium",level:"medium",title:"المجموعة 2 — التمييز",subtitle:"Medium",purpose:"كل البدائل قانونية، والمطلوب تمييز المفاهيم القريبة لا اكتشاف الإجابة من شكلها.",items:[
            {id:"101-m1",dimension:"understanding",difficulty:2,type:"mcq",prompt:"أي عبارة تفرّق بصورة أدق بين «مصدر القانون» و«مصدر الحق»؟",options:[
              {id:"a",text:"مصدر القانون يفسر من أين تستمد القاعدة القانونية وجودها، ومصدر الحق يبحث الواقعة أو التصرف الذي ينشأ عنه الحق.",score:1},
              {id:"b",text:"مصدر القانون هو صاحب الحق، ومصدر الحق هو محل الحق.",score:0},
              {id:"c",text:"مصدر القانون ومصدر الحق تعبيران عن المعنى نفسه متى تعلق الأمر بعلاقة مدنية.",score:0}
            ],explanation:"المقرر يدرس مصادر القانون ضمن نظرية القانون، ومصادر الحق ضمن نظرية الحق."},
            {id:"101-m2",dimension:"understanding",difficulty:2,type:"mcq",prompt:"قال شخص: «لا ينبغي أن يسري عليّ التشريع لأنني لم أكن أعلم بصدوره». أي موضوع هو الأقرب؟",options:[
              {id:"a",text:"مبدأ عدم جواز الاعتذار بجهل القانون.",score:1},
              {id:"b",text:"الإلغاء الضمني للتشريع.",score:0},
              {id:"c",text:"تطبيق القانون من حيث المكان.",score:0}
            ],explanation:"المقرر يدرس نفاذ التشريع ومبدأ عدم جواز الاعتذار بجهل القانون."},
            {id:"101-m3",dimension:"legal_precision",difficulty:2,type:"mcq",prompt:"أي زوج يعبّر بدقة عن مصادر الحق كما يذكرها الوصف التفصيلي للمقرر؟",options:[
              {id:"a",text:"التصرف القانوني والواقعة القانونية.",score:1},
              {id:"b",text:"التشريع والعرف.",score:0},
              {id:"c",text:"الشخص الطبيعي والشخص المعنوي.",score:0}
            ],explanation:"التشريع والعرف من موضوع مصادر القانون، والشخص الطبيعي والمعنوي من أشخاص الحق؛ أما مصادر الحق فيذكر الوصف أنها التصرف القانوني والواقعة القانونية."}
          ]
        },
        {
          id:"101-difficult",level:"difficult",title:"المجموعة 3 — الدقة العالية",subtitle:"Difficult",purpose:"بدائل متقاربة وصياغات تحتاج قراءة قانونية دقيقة قبل الانتقال للوقائع.",items:[
            {id:"101-d1",dimension:"legal_precision",difficulty:3,type:"mcq",prompt:"في عبارة «الشركة تملك عقارًا»، أي توصيف أدق داخل نظرية الحق؟",options:[
              {id:"a",text:"الشركة من أشخاص الحق، والعقار يمكن أن يكون محلًا للحق.",score:1},
              {id:"b",text:"الشركة محل الحق، والعقار مصدر للحق.",score:0},
              {id:"c",text:"الشركة مصدر للقانون، والعقار من أشخاص الحق.",score:0}
            ],explanation:"المقرر يميز بين أشخاص الحق ومحله."},
            {id:"101-d2",dimension:"understanding",difficulty:3,type:"mcq",prompt:"سلوك متكرر في التعامل، لكن السؤال هو: هل ارتقى إلى عرف قانوني أم بقي عادة اتفاقية؟ ما الذي يجب فحصه أولًا؟",options:[
              {id:"a",text:"أركان العرف والتمييز بينه وبين العادة الاتفاقية.",score:1},
              {id:"b",text:"مراتب التشريع فقط.",score:0},
              {id:"c",text:"محل الحق وأشخاصه.",score:0}
            ],explanation:"الوصف التفصيلي يذكر أركان العرف والفرق بينه وبين العادة الاتفاقية."},
            {id:"101-d3",dimension:"legal_precision",difficulty:3,type:"mcq",prompt:"إذا صدر تنظيم لاحق، وأصبح السؤال هل أنهى العمل بتنظيم سابق أم لا، فأي موضوع من المقرر هو الأكثر مباشرة؟",options:[
              {id:"a",text:"إلغاء القانون.",score:1},
              {id:"b",text:"تفسير القانون.",score:0},
              {id:"c",text:"أشخاص الحق.",score:0}
            ],explanation:"المشكلة المطروحة هنا تتعلق باستمرار أو انتهاء العمل بالتنظيم السابق."}
          ]
        },
        {
          id:"101-transfer",level:"transfer",title:"المجموعة 4 — التطبيق",subtitle:"Transfer",purpose:"لا نذكر اسم الباب في السؤال؛ المطلوب اكتشافه من الوقائع.",items:[
            {id:"101-t1",dimension:"transfer",difficulty:3,type:"mcq",prompt:"صدر تشريع جديد، ونشأ النزاع حول تطبيقه على واقعة حدثت قبل بدء نفاذه. أين تبدأ التحليل؟",options:[
              {id:"a",text:"تطبيق القانون من حيث الزمان.",score:1},
              {id:"b",text:"تفسير القانون من حيث معنى ألفاظه.",score:0},
              {id:"c",text:"مصادر الحق.",score:0}
            ],explanation:"جوهر الواقعة هو العلاقة الزمنية بين الواقعة ونفاذ التشريع."},
            {id:"101-t2",dimension:"transfer",difficulty:3,type:"mcq",prompt:"الجميع متفق على نفاذ النص وعلى الوقائع، لكن الخلاف كله حول معنى لفظ ورد في النص. ما المشكلة الأساسية؟",options:[
              {id:"a",text:"تفسير القانون.",score:1},
              {id:"b",text:"إلغاء القانون.",score:0},
              {id:"c",text:"تطبيق القانون من حيث المكان.",score:0}
            ],explanation:"عندما يدور الخلاف حول معنى النص، يكون التفسير هو الموضوع الأقرب."},
            {id:"101-t3",dimension:"transfer",difficulty:3,type:"mcq",prompt:"شخص يملك حقًا ثابتًا، لكن النزاع يدور حول طريقة استعماله والحدود التي يجب ألا يتجاوزها. أي موضوع هو الأقرب؟",options:[
              {id:"a",text:"استعمال الحق وحدوده والتعسف فيه.",score:1},
              {id:"b",text:"مصادر الحق فقط.",score:0},
              {id:"c",text:"محل الحق فقط.",score:0}
            ],explanation:"وجود الحق لا يغني عن بحث حدود استعماله."}
          ]
        },
        {
          id:"101-exam",level:"exam",title:"المجموعة 5 — الاختبار الامتحاني المصغّر",subtitle:"Exam",purpose:"إجابتان قصيرتان فقط. التصحيح مفاهيمي: يقبل صياغات متعددة إذا حققت الفكرة القانونية المطلوبة.",items:[
            {id:"101-x1",dimension:"exam_execution",difficulty:3,type:"build_answer",prompt:"في 4–5 سطور، فرّق بين «مصادر القانون» و«مصادر الحق»، واذكر مثالًا واحدًا لكل منهما.",rubric:[
              {label:"إظهار فكرة مصدر القانون",concepts:[["مصدر القانون","مصادر القانون"],["التشريع","النص التشريعي"],["العرف"],["الشريعة الإسلامية","الشريعة"],["العدالة"]],min:1},
              {label:"إظهار فكرة مصدر الحق",concepts:[["مصدر الحق","مصادر الحق"],["التصرف القانوني","التصرف"],["الواقعة القانونية","الواقعة"]],min:1},
              {label:"بيان الفرق بين المفهومين",concepts:[["من أين تستمد القاعدة","مصدر القاعدة","وجود القاعدة"],["ينشأ الحق","نشوء الحق","إنشاء الحق"],["بينما","أما","يختلف","الفرق"]],min:2},
              {label:"مثال قانوني مناسب",concepts:[["مثال"],["العقد","عقد"],["تشريع"],["واقعة"]],min:1}
            ],explanation:"الإجابة الجيدة تبيّن الفرق لا أن تسرد قائمتين فقط."},
            {id:"101-x2",dimension:"exam_execution",difficulty:3,type:"build_answer",prompt:"اكتب فقرة قصيرة تفرّق بين «أشخاص الحق» و«محل الحق» مع مثال.",rubric:[
              {label:"تحديد أشخاص الحق",concepts:[["أشخاص الحق","صاحب الحق"],["شخص طبيعي","الشخص الطبيعي"],["شخص معنوي","الشخص المعنوي"]],min:1},
              {label:"تحديد محل الحق",concepts:[["محل الحق"],["مال","أموال"],["شيء يرد عليه الحق","يرد عليه الحق"]],min:1},
              {label:"إظهار المقارنة",concepts:[["بينما","أما","الفرق","يختلف"],["صاحب","محل"]],min:1},
              {label:"مثال يربط الشخص بالمحل",concepts:[["مثال"],["شركة","شخص"],["عقار","سيارة","مال"]],min:1}
            ],explanation:"نبحث عن تحديد صاحب الحق ومحل الحق ثم بيان الفرق بمثال."}
          ]
        }
      ],
      microLessons:[
        {id:"101-l1",icon:"🧭",title:"خريطة المفهوم قبل الحفظ",dimension:"understanding",minutes:3,topic:"مصادر القانون ومصادر الحق",explain:"ابدأ بالسؤال: هل أبحث عن مصدر القاعدة القانونية نفسها أم عن الواقعة أو التصرف الذي أنشأ حقًا لشخص؟ هذا الفصل بين المستويين يمنع خلطًا شائعًا في مدخل القانون.",example:"إذا كان السؤال عن التشريع أو العرف فأنت داخل خريطة مصادر القانون. وإذا كان عن عقد أو واقعة قانونية أنشأت حقًا، فأنت داخل خريطة مصادر الحق.",challenge:"سمِّ في ذهنك مثالًا واحدًا لمصدر قانون ومثالًا واحدًا لمصدر حق."},
        {id:"101-l2",icon:"🔍",title:"افصل الشخص عن محل الحق",dimension:"legal_precision",minutes:3,topic:"أشخاص الحق ومحل الحق",explain:"في كل واقعة اسأل سؤالين منفصلين: مَن صاحب الحق؟ وعلى ماذا يرد الحق؟ مجرد فصل السؤالين يرفع دقة التكييف بسرعة.",example:"الشركة يمكن أن تكون شخصًا معنويًا صاحب حق، بينما العقار قد يكون محل ذلك الحق.",challenge:"في جملة «يملك أحمد سيارة»، حدّد الشخص ومحل الحق."},
        {id:"101-l3",icon:"⏳",title:"غيّر الزمن تتغيّر المسألة",dimension:"transfer",minutes:4,topic:"تطبيق القانون وتفسيره",explain:"إذا كان النزاع عن توقيت الواقعة بالنسبة إلى نفاذ النص، فالمشكلة زمنية. أما إذا اتفق الجميع على النفاذ واختلفوا على معنى اللفظ، فالمشكلة تفسيرية.",example:"واقعة حدثت قبل نفاذ تشريع جديد ≠ خلاف حول معنى كلمة داخل تشريع نافذ.",challenge:"غيّر واقعة واحدة في المثال بحيث تتحول المشكلة من زمنية إلى تفسيرية."}
      ],
      activities:[
        {id:"101-a1",kind:"MISSING_ELEMENT",targetDimensions:["recall","legal_precision"],title:"العنصر الناقص",icon:"🧩",prompt:"يدرس العرف بأركانه المادي و____.",answer:"المعنوي",accepted:["المعنوي","معنوي"],topic:"العرف"},
        {id:"101-a2",kind:"CHANGE_ONE_FACT",targetDimensions:["transfer","understanding"],title:"غيّر واقعة واحدة",icon:"🔁",prompt:"كان الخلاف على معنى النص، ثم تغيّر وأصبح على تاريخ سريانه. أي موضوع أصبح الأهم؟",options:[{text:"تطبيق القانون من حيث الزمان",score:1},{text:"تفسير القانون",score:0},{text:"أشخاص الحق",score:0}],topic:"تطبيق القانون"},
        {id:"101-a3",kind:"CASE_DETECTIVE",targetDimensions:["transfer","legal_precision"],title:"محقق القضية",icon:"🕵️",prompt:"النزاع عن كيان يريد اكتساب حق قانوني. أي باب تبحث أولًا؟",options:[{text:"أشخاص الحق",score:1},{text:"محل الحق",score:0},{text:"إلغاء القانون",score:0}],topic:"أشخاص الحق"}
      ]
    },

    {
      id:"QA-QU-LAWC213",
      jurisdiction:"QA",
      university:"جامعة قطر",
      code:"LAWC 213",
      title_ar:"مصادر الالتزام",
      language:"ar",
      prerequisite:"LAWC 101",
      sourceIds:["QU_COURSES_AR","QU_CATALOG_2526"],
      description:"مصادر الالتزام في القانون المدني القطري: العقد، الإرادة المنفردة، الفعل الضار، الإثراء بلا سبب، والقانون.",
      units:[
        {title:"المصادر الإرادية",topics:["العقد","الرضا والمحل والسبب","عيوب الإرادة","آثار العقد والمسؤولية العقدية","الإرادة المنفردة والوعد بجائزة"]},
        {title:"المصادر غير الإرادية",topics:["الفعل الضار والمسؤولية التقصيرية","المسؤولية عن فعل الغير والأشياء","الإثراء بلا سبب","الفضالة","رد غير المستحق","القانون كمصدر مباشر"]}
      ],
      groups:[
        {
          id:"213-easy",level:"easy",title:"المجموعة 1 — البداية",subtitle:"Easy",purpose:"خريطة عامة لمصادر الالتزام قبل الانتقال إلى الفروق الدقيقة.",items:[
            {id:"213-e1",dimension:"recall",difficulty:1,type:"mcq",prompt:"أي مجموعة تجمع مصادر الالتزام التي يذكرها وصف المقرر؟",options:[
              {id:"a",text:"العقد، الإرادة المنفردة، الفعل الضار، الإثراء بلا سبب، والقانون.",score:1},
              {id:"b",text:"العقد، الوكالة، الكفالة، الرهن، والحوالة.",score:0},
              {id:"c",text:"التشريع، العرف، الشريعة الإسلامية، العدالة، والقضاء.",score:0}
            ],explanation:"المقرر يدرس العقد والإرادة المنفردة والفعل الضار والإثراء بلا سبب والقانون كمصادر للالتزام."},
            {id:"213-e2",dimension:"recall",difficulty:1,type:"mcq",prompt:"أي مثال يورده وصف المقرر كتطبيق للإرادة المنفردة؟",options:[
              {id:"a",text:"الوعد بجائزة الموجه للجمهور.",score:1},
              {id:"b",text:"المسؤولية عن فعل الغير.",score:0},
              {id:"c",text:"رد غير المستحق.",score:0}
            ],explanation:"الوعد بجائزة يرد كتطبيق للإرادة المنفردة."},
            {id:"213-e3",dimension:"recall",difficulty:1,type:"mcq",prompt:"أي مصدر من الآتي يندرج ضمن المصادر غير الإرادية في وصف المقرر؟",options:[
              {id:"a",text:"الفعل الضار.",score:1},
              {id:"b",text:"العقد.",score:0},
              {id:"c",text:"الإرادة المنفردة.",score:0}
            ],explanation:"الوصف يقسم بين مصادر إرادية كالعقد والإرادة المنفردة، ومصادر غير إرادية منها الفعل الضار."}
          ]
        },
        {
          id:"213-medium",level:"medium",title:"المجموعة 2 — التمييز",subtitle:"Medium",purpose:"تمييز أجزاء العقد والمصادر المختلفة للالتزام من بدائل قانونية قريبة.",items:[
            {id:"213-m1",dimension:"understanding",difficulty:2,type:"mcq",prompt:"أي مجموعة يذكرها دليل الجامعة ضمن العناصر الأساسية لتكوين العقد؟",options:[
              {id:"a",text:"الرضا، المحل، والسبب.",score:1},
              {id:"b",text:"الخطأ، الضرر، والسببية.",score:0},
              {id:"c",text:"الإثراء، الافتقار، وانعدام السبب.",score:0}
            ],explanation:"دليل الجامعة يذكر تكوين العقد من حيث الرضا والمحل والسبب."},
            {id:"213-m2",dimension:"understanding",difficulty:2,type:"mcq",prompt:"أي موضوع يرتبط مباشرة بدراسة الرضا في العقد كما يذكر دليل المقرر؟",options:[
              {id:"a",text:"طرق التعبير عن الإرادة وعيوبها.",score:1},
              {id:"b",text:"المسؤولية عن فعل الغير.",score:0},
              {id:"c",text:"رد غير المستحق.",score:0}
            ],explanation:"الوصف الموسع يربط الرضا بالتعبير عن الإرادة وعيوبها وأثرها."},
            {id:"213-m3",dimension:"legal_precision",difficulty:2,type:"mcq",prompt:"أي عبارة تميز «المسؤولية العقدية» عن «المسؤولية التقصيرية» على مستوى مصدر الالتزام؟",options:[
              {id:"a",text:"الأولى ترتبط بإخلال في إطار علاقة عقدية، والثانية تبحث الفعل الضار خارج هذا الإطار.",score:1},
              {id:"b",text:"كلتاهما تطبيقان للإرادة المنفردة.",score:0},
              {id:"c",text:"كلتاهما صورتان للإثراء بلا سبب.",score:0}
            ],explanation:"المقرر يدرس المسؤولية العقدية ضمن آثار العقد، والفعل الضار كمصدر مستقل للالتزام."}
          ]
        },
        {
          id:"213-difficult",level:"difficult",title:"المجموعة 3 — الدقة العالية",subtitle:"Difficult",purpose:"أسئلة أقرب لبعضها قانونيًا، وتحتاج تحديد المصدر أو التطبيق الأدق.",items:[
            {id:"213-d1",dimension:"legal_precision",difficulty:3,type:"mcq",prompt:"دفع شخص مبلغًا لا يجب عليه دفعه، ثم طلب استرداده. أي تطبيق يذكره وصف المقرر ضمن الإثراء بلا سبب؟",options:[
              {id:"a",text:"رد غير المستحق.",score:1},
              {id:"b",text:"الوعد بجائزة.",score:0},
              {id:"c",text:"المسؤولية العقدية.",score:0}
            ],explanation:"وصف المقرر يذكر رد غير المستحق كتطبيق ضمن الفعل النافع/الإثراء بلا سبب."},
            {id:"213-d2",dimension:"understanding",difficulty:3,type:"mcq",prompt:"قام شخص من تلقاء نفسه بعمل نافع لمصلحة غيره دون تكليف سابق. أي تطبيق يرد في وصف المقرر بصورة أقرب؟",options:[
              {id:"a",text:"الفضالة.",score:1},
              {id:"b",text:"الإرادة المنفردة بالوعد بجائزة.",score:0},
              {id:"c",text:"المسؤولية عن فعل الغير.",score:0}
            ],explanation:"الفضالة من التطبيقات التي يذكرها وصف المقرر في سياق الفعل النافع/الإثراء بلا سبب."},
            {id:"213-d3",dimension:"legal_precision",difficulty:3,type:"mcq",prompt:"أي اختيار يضع «القانون» في موقعه الصحيح داخل خريطة مصادر الالتزام في وصف المقرر؟",options:[
              {id:"a",text:"مصدر مباشر لبعض الالتزامات، إلى جانب المصادر الإرادية وغير الإرادية.",score:1},
              {id:"b",text:"صورة من صور الإرادة المنفردة.",score:0},
              {id:"c",text:"تطبيق من تطبيقات الإثراء بلا سبب.",score:0}
            ],explanation:"الوصف يذكر القانون كمصدر مباشر لبعض الالتزامات."}
          ]
        },
        {
          id:"213-transfer",level:"transfer",title:"المجموعة 4 — التطبيق",subtitle:"Transfer",purpose:"اكتشاف مصدر الالتزام من واقعة جديدة دون أن يذكر اسم المصدر في السؤال.",items:[
            {id:"213-t1",dimension:"transfer",difficulty:3,type:"mcq",prompt:"أعلن شخص للجمهور مكافأة لمن يعثر على شيء مفقود ويعيده. أي مصدر هو الأقرب؟",options:[
              {id:"a",text:"الإرادة المنفردة.",score:1},
              {id:"b",text:"الفعل الضار.",score:0},
              {id:"c",text:"الإثراء بلا سبب.",score:0}
            ],explanation:"الوعد بجائزة يرد في وصف المقرر كتطبيق للإرادة المنفردة."},
            {id:"213-t2",dimension:"transfer",difficulty:3,type:"mcq",prompt:"أتلف شخص مال غيره بفعل ضار، ولا توجد بينهما علاقة عقدية تحكم الواقعة. أي باب هو الأقرب؟",options:[
              {id:"a",text:"المسؤولية التقصيرية عن الفعل الضار.",score:1},
              {id:"b",text:"المسؤولية العقدية.",score:0},
              {id:"c",text:"الإرادة المنفردة.",score:0}
            ],explanation:"الفعل الضار يدرس كمصدر غير إرادي للالتزام."},
            {id:"213-t3",dimension:"transfer",difficulty:3,type:"mcq",prompt:"تحققت منفعة مالية لشخص على حساب آخر دون أن تكون المسألة عقدًا أو فعلًا ضارًا. أي موضوع يحتاج للفحص أولًا؟",options:[
              {id:"a",text:"الإثراء بلا سبب.",score:1},
              {id:"b",text:"عيوب الإرادة.",score:0},
              {id:"c",text:"المسؤولية العقدية.",score:0}
            ],explanation:"الإثراء بلا سبب من المصادر غير الإرادية التي يتناولها المقرر."}
          ]
        },
        {
          id:"213-exam",level:"exam",title:"المجموعة 5 — الاختبار الامتحاني المصغّر",subtitle:"Exam",purpose:"إجابتان قصيرتان. التصحيح مفاهيمي ويقبل الصياغات البديلة ما دامت تحقق الفكرة.",items:[
            {id:"213-x1",dimension:"exam_execution",difficulty:3,type:"build_answer",prompt:"في 5–6 سطور، قسّم مصادر الالتزام التي يدرسها المقرر إلى إرادية وغير إرادية، واذكر موقع القانون مع مثال واحد.",rubric:[
              {label:"المصادر الإرادية",concepts:[["العقد","عقد"],["الإرادة المنفردة","ارادة منفردة"]],min:2},
              {label:"المصادر غير الإرادية",concepts:[["الفعل الضار","المسؤولية التقصيرية"],["الإثراء بلا سبب","الاثراء بلا سبب"]],min:2},
              {label:"القانون كمصدر مباشر",concepts:[["القانون كمصدر مباشر","القانون مصدر مباشر","القانون"],["بعض الالتزامات","التزامات"]],min:1},
              {label:"مثال مناسب",concepts:[["وعد بجائزة","جائزة"],["إتلاف","اتلاف","فعل ضار"],["رد غير المستحق"],["الفضالة"],["مثال"]],min:1}
            ],explanation:"نبحث عن التقسيم الصحيح وموقع القانون ومثال، لا عن صياغة محفوظة."},
            {id:"213-x2",dimension:"exam_execution",difficulty:3,type:"build_answer",prompt:"قارن بإيجاز بين المسؤولية العقدية والمسؤولية التقصيرية من حيث السياق الذي تنشأ فيه كل منهما داخل موضوعات المقرر.",rubric:[
              {label:"العلاقة العقدية",concepts:[["عقد","علاقة عقدية"],["إخلال بالعقد","اخلال بالعقد","عدم تنفيذ العقد"]],min:1},
              {label:"الفعل الضار",concepts:[["فعل ضار","عمل غير مشروع"],["مسؤولية تقصيرية","تقصيرية"],["ضرر"]],min:1},
              {label:"إظهار الفرق",concepts:[["بينما","أما","الفرق","يختلف"],["داخل علاقة عقدية","خارج العلاقة العقدية"]],min:1},
              {label:"تنظيم الإجابة",concepts:[["أولاً","اولا","أولا"],["ثانيًا","ثانيا","ثانياً"],["من ناحية","في المقابل"]],min:1}
            ],explanation:"التقييم التدريبي يبحث عن السياق والتمييز والتنظيم."}
          ]
        }
      ],
      microLessons:[
        {id:"213-l1",icon:"🗺️",title:"ابنِ خريطة مصادر الالتزام",dimension:"understanding",minutes:3,topic:"خريطة المصادر",explain:"قبل حل أي واقعة، حدّد أولًا من أين نشأ الالتزام: اتفاق؟ إرادة منفردة؟ فعل ضار؟ إثراء بلا سبب؟ أم أن القانون أنشأ الالتزام مباشرة؟",example:"وجود اتفاق سابق يوجهك إلى العقد، بينما وعد موجّه للجمهور قد يقود إلى الإرادة المنفردة.",challenge:"خذ أي التزام تعرفه وحدد مصدره قبل أن تبحث عن حكمه."},
        {id:"213-l2",icon:"⚖️",title:"العقد أم الفعل الضار؟",dimension:"legal_precision",minutes:3,topic:"المسؤولية العقدية والتقصيرية",explain:"ابدأ بالسؤال: هل توجد علاقة عقدية سابقة تحكم السلوك محل النزاع؟ وجودها أو غيابها يغيّر باب التحليل قبل الدخول في التفاصيل.",example:"إخلال بالتزام متفق عليه داخل عقد يختلف في سياقه عن إتلاف مال شخص لا تربطك به علاقة عقدية.",challenge:"غيّر واقعة واحدة تجعل المثال ينتقل من المسؤولية العقدية إلى التقصيرية."},
        {id:"213-l3",icon:"🕵️",title:"اكتشف المصدر من الواقعة",dimension:"transfer",minutes:4,topic:"التطبيق على الوقائع",explain:"في السؤال التطبيقي لا تنتظر أن يذكر لك اسم المصدر. التقط الواقعة الحاسمة: إعلان مكافأة، إضرار بغير عقد، منفعة بلا سند، أو تدخل نافع دون تكليف.",example:"دفع مبلغ غير مستحق يوجهك إلى رد غير المستحق، بينما القيام بعمل نافع لشخص دون تكليف يفتح باب الفضالة.",challenge:"ما الكلمة أو الواقعة الحاسمة التي غيّرت التكييف في كل مثال؟"}
      ],
      activities:[
        {id:"213-a1",kind:"MISSING_ELEMENT",targetDimensions:["recall","legal_precision"],title:"العنصر الناقص",icon:"🧩",prompt:"من تطبيقات الإرادة المنفردة في وصف المقرر: الوعد ب____.",answer:"جائزة",accepted:["جائزة","الجائزة"],topic:"الإرادة المنفردة"},
        {id:"213-a2",kind:"CHANGE_ONE_FACT",targetDimensions:["transfer","understanding"],title:"غيّر واقعة واحدة",icon:"🔁",prompt:"لو اختفت العلاقة العقدية وبقي فعل ضار تسبب في ضرر، أي مسار يصبح أقرب؟",options:[{text:"المسؤولية التقصيرية",score:1},{text:"المسؤولية العقدية",score:0},{text:"الإرادة المنفردة",score:0}],topic:"الفعل الضار"},
        {id:"213-a3",kind:"CASE_DETECTIVE",targetDimensions:["transfer","legal_precision"],title:"محقق القضية",icon:"🕵️",prompt:"منفعة تحققت لشخص على حساب آخر دون عقد. أي موضوع تبدأ بفحصه؟",options:[{text:"الإثراء بلا سبب",score:1},{text:"عيوب الإرادة",score:0},{text:"المسؤولية العقدية",score:0}],topic:"الإثراء بلا سبب"}
      ]
    }
  ]
};

```

---

# FILE: assets/styles.css

```css

:root{
  --maroon:#7b1734;--maroon-2:#5d1027;--navy:#13233d;--navy-2:#1e3b61;--gold:#c9a35a;
  --cream:#f7f3ec;--paper:#fff;--ink:#17202a;--muted:#667085;--line:#e7dfd5;
  --green:#26735a;--amber:#a96f12;--red:#a93d49;--blue:#2d64a3;--soft:#f6f7f9;
  --shadow:0 14px 44px rgba(19,35,61,.09);--radius:20px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;min-height:100vh;background:linear-gradient(145deg,#fcfbf8,#f1ebe3);color:var(--ink);font-family:"Segoe UI",Tahoma,Arial,sans-serif;line-height:1.65}
button,input,textarea,select{font:inherit}
button{cursor:pointer}
a{color:inherit}
.hidden{display:none!important}
.shell{min-height:100vh}
.topbar{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.topin{max-width:1180px;margin:auto;height:68px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.brand{display:flex;align-items:center;gap:11px}
.logo{width:43px;height:43px;border-radius:14px;background:linear-gradient(135deg,var(--maroon),var(--maroon-2));display:grid;place-items:center;color:#fff;font-weight:950;box-shadow:0 8px 20px rgba(123,23,52,.2)}
.brandtext b{display:block;color:var(--navy);font-size:16px}
.brandtext small{display:block;color:var(--muted);font-size:11px;margin-top:-1px}
.topactions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pill{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:800;color:var(--navy)}
.pill.gold{background:#fff6e4;color:#795514;border-color:#ead3a6}
.pill.good{background:#edf7f2;color:#205f49;border-color:#c8e6d8}
.iconbtn{border:1px solid var(--line);background:#fff;border-radius:11px;padding:8px 10px;color:var(--navy);font-weight:800}
.app{max-width:1180px;margin:auto;padding:26px 18px 70px}
.hero{display:grid;grid-template-columns:1.25fr .75fr;gap:18px;align-items:stretch}
.panel{background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:22px}
.hero-main{padding:30px}
.kicker{font-size:11px;letter-spacing:.7px;text-transform:uppercase;font-weight:950;color:var(--maroon)}
h1,h2,h3{color:var(--navy);margin-top:0}
h1{font-size:38px;line-height:1.16;margin-bottom:12px}
h2{font-size:26px;line-height:1.25;margin-bottom:8px}
h3{font-size:18px;margin-bottom:8px}
.lead{color:#556174;font-size:16px;margin:0}
.hero-side{background:linear-gradient(145deg,var(--navy),var(--navy-2));color:#fff}
.hero-side h3{color:#fff}
.hero-side p,.hero-side small{color:#d8e2ef}
.flowrow{display:grid;grid-template-columns:34px 1fr;gap:10px;padding:9px 0}
.flownum{width:34px;height:34px;border-radius:10px;background:var(--gold);color:#2e2618;display:grid;place-items:center;font-weight:950}
.screen{margin-top:18px}
.screenhead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:10px}
.stepbadge{display:inline-flex;align-items:center;gap:6px;background:#eef1f5;color:var(--navy);border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.option{border:1px solid var(--line);background:#fff;border-radius:16px;padding:18px;transition:.17s;position:relative}
.option.clickable:hover{transform:translateY(-2px);border-color:#cda9b4;box-shadow:0 10px 26px rgba(123,23,52,.08)}
.option.active{border-color:var(--maroon);box-shadow:0 0 0 3px rgba(123,23,52,.08)}
.option.disabled{opacity:.63;background:#fafafa}
.option b{display:block;color:var(--navy);font-size:16px}
.option small{display:block;color:var(--muted);margin-top:4px}
.countryflag{font-size:32px;display:block;margin-bottom:8px}
.actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:15px}
.btn{border:0;border-radius:12px;padding:11px 16px;font-weight:900;transition:.15s}
.btn:hover{transform:translateY(-1px)}
.btn.primary{background:var(--maroon);color:#fff}
.btn.secondary{background:var(--navy);color:#fff}
.btn.gold{background:var(--gold);color:#332a1b}
.btn.ghost{background:#eef1f5;color:var(--navy)}
.btn.outline{background:#fff;color:var(--maroon);border:1px solid #d7aeba}
.btn:disabled{opacity:.48;cursor:not-allowed;transform:none}
.notice{padding:12px 14px;border-radius:13px;background:#fff6e6;border:1px solid #ecd5a9;color:#715116;font-size:12px;margin:12px 0}
.info{padding:12px 14px;border-radius:13px;background:#eef5fb;border:1px solid #c9dceb;color:#244f74;font-size:12px;margin:12px 0}
.goodbox{padding:12px 14px;border-radius:13px;background:#edf7f2;border:1px solid #c9e6d8;color:#205f49;font-size:12px;margin:12px 0}
.badbox{padding:12px 14px;border-radius:13px;background:#fdebed;border:1px solid #f2c8cd;color:#86363d;font-size:12px;margin:12px 0}
.progress{height:10px;background:#eceef1;border-radius:999px;overflow:hidden}
.progress>div{height:100%;background:linear-gradient(90deg,var(--maroon),var(--gold));transition:.35s;width:0}
.progressmeta{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:var(--muted);margin-top:6px}
.questionCard{border:1px solid var(--line);border-radius:18px;background:#fff;padding:20px;margin-top:12px}
.questionMeta{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}
.tag{font-size:10px;font-weight:900;border-radius:999px;padding:5px 8px;background:#f0f2f5;color:var(--navy)}
.tag.maroon{background:#f7eaf0;color:var(--maroon)}
.tag.green{background:#edf7f2;color:var(--green)}
.tag.amber{background:#fff5df;color:var(--amber)}
.stimulus{padding:14px;border-radius:14px;background:#faf6ee;border-inline-start:5px solid var(--gold);margin:12px 0;color:#28313c}
.choice{display:block;border:1px solid #ddd7cf;background:#fff;border-radius:12px;padding:11px 13px;margin:8px 0;cursor:pointer;transition:.12s}
.choice:hover{background:#faf8f4}
.choice.selected{border-color:var(--maroon);background:#fbf1f5}
.choice input{margin-inline-end:8px}
textarea,input[type=text],select{width:100%;border:1px solid #d8d2ca;background:#fff;color:var(--ink);border-radius:12px;padding:11px 12px;outline:none}
textarea{min-height:92px;resize:vertical}
textarea:focus,input[type=text]:focus,select:focus{border-color:var(--maroon);box-shadow:0 0 0 3px rgba(123,23,52,.08)}
.hintbox{padding:12px;border-radius:12px;background:#f5f2fa;color:#55446b;border:1px solid #ded4eb;font-size:12px;margin-top:10px}
.confidence{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:9px}
.conf{border:1px solid var(--line);border-radius:11px;padding:9px;text-align:center;font-size:12px;background:#fff}
.conf.active{border-color:#8db1d2;background:#eef5fb;color:#174d7d;font-weight:900}
.feedback{margin-top:14px;padding:15px;border-radius:14px;border:1px solid var(--line);background:#fafafa}
.feedback h3{margin-bottom:5px}
.feedback.good{background:#edf7f2;border-color:#c9e6d8}
.feedback.warn{background:#fff5df;border-color:#ecd7a8}
.feedback.bad{background:#fdebed;border-color:#f1c7cc}
.metricGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.metric{border:1px solid var(--line);background:#fff;border-radius:14px;padding:13px}
.metricHead{display:flex;justify-content:space-between;gap:10px;color:var(--navy);font-size:12px;font-weight:850}
.metric .bar{height:8px;background:#eceef1;border-radius:99px;overflow:hidden;margin-top:8px}
.metric .bar span{display:block;height:100%;background:linear-gradient(90deg,var(--maroon),var(--gold));width:0;transition:.45s}
.reliability{font-size:10px;color:var(--muted);margin-top:6px}
.dashboard{display:grid;grid-template-columns:1.2fr .8fr;gap:16px}
.pathcard{background:linear-gradient(145deg,var(--navy),var(--navy-2));color:#fff;border-radius:18px;padding:20px}
.pathcard h2,.pathcard h3{color:#fff}
.pathcard p{color:#dce5f0}
.pathstep{border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.06);border-radius:12px;padding:11px;margin-top:8px;font-size:12px}
.navtabs{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}
.tabbtn{border:1px solid var(--line);background:#fff;color:var(--navy);border-radius:999px;padding:8px 12px;font-weight:850;font-size:12px}
.tabbtn.active{background:var(--navy);color:#fff;border-color:var(--navy)}
.statgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.stat{border:1px solid var(--line);background:#fff;border-radius:14px;padding:13px}
.stat strong{display:block;color:var(--navy);font-size:22px}
.stat small{color:var(--muted)}
.activityCard{border:1px solid var(--line);background:#fff;border-radius:16px;padding:16px}
.activityIcon{font-size:28px}
.activityCard h3{margin:5px 0}
.activityCard p{font-size:12px;color:var(--muted);min-height:42px}
.locked{opacity:.55}
.challenge{padding:16px;border-radius:14px;background:#f8f2e8;border-inline-start:5px solid var(--maroon)}
.badges{display:flex;gap:8px;flex-wrap:wrap}
.badgeitem{padding:8px 10px;border-radius:11px;background:#f5f1e8;border:1px solid #e6d9bd;font-size:11px;font-weight:800;color:#72541c}
.timeline{border-inline-start:2px solid #d8dce2;padding-inline-start:14px}
.timelineItem{position:relative;margin:12px 0}
.timelineItem:before{content:"";position:absolute;inset-inline-start:-20px;top:7px;width:10px;height:10px;border-radius:50%;background:var(--maroon);border:2px solid #fff;box-shadow:0 0 0 2px #d8dce2}
.small{font-size:11px;color:var(--muted)}
.sourcebox{font-size:11px;color:var(--muted);border-top:1px dashed var(--line);margin-top:16px;padding-top:12px}
.empty{padding:24px;text-align:center;border:1px dashed #d8d2ca;border-radius:14px;color:var(--muted)}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);background:var(--navy);color:#fff;padding:11px 15px;border-radius:12px;box-shadow:var(--shadow);opacity:0;pointer-events:none;transition:.2s;z-index:80;font-size:12px}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.modal{position:fixed;inset:0;background:rgba(10,18,31,.46);display:grid;place-items:center;padding:18px;z-index:70}
.modalbox{max-width:580px;width:100%;background:#fff;border-radius:20px;border:1px solid var(--line);box-shadow:0 30px 90px rgba(0,0,0,.2);padding:22px}
.footer{max-width:1180px;margin:0 auto 30px;padding:0 18px;color:var(--muted);font-size:11px;text-align:center}
.adminTable{width:100%;border-collapse:collapse;font-size:11px}
.adminTable th,.adminTable td{border-bottom:1px solid var(--line);padding:9px;text-align:right;vertical-align:top}
.adminTable th{color:var(--navy);background:#fafafa}
code.inline{background:#f2f3f5;border-radius:6px;padding:2px 5px;font-size:11px}
@media(max-width:900px){
  .hero,.dashboard,.grid4{grid-template-columns:1fr}
  .grid3{grid-template-columns:1fr 1fr}
  .statgrid{grid-template-columns:1fr 1fr}
  h1{font-size:31px}
}
@media(max-width:620px){
  .app{padding:18px 12px 60px}
  .topin{padding:0 12px}.brandtext small{display:none}
  .grid2,.grid3,.metricGrid{grid-template-columns:1fr}
  .confidence{grid-template-columns:1fr 1fr}
  .statgrid{grid-template-columns:1fr 1fr}
  .hero-main{padding:22px}
  h1{font-size:27px}
  h2{font-size:22px}
}

.diagsteps{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:14px 0 18px}
.diagstep{border:1px solid var(--line);background:#fff;border-radius:13px;padding:10px;text-align:center;min-height:76px}
.diagstep span{display:grid;place-items:center;width:25px;height:25px;margin:0 auto 5px;border-radius:8px;background:#eef1f5;color:var(--navy);font-weight:950;font-size:11px}
.diagstep b{display:block;color:var(--navy);font-size:12px}
.diagstep small{display:block;color:var(--muted);font-size:10px;margin-top:3px}
.diagstep.active{border-color:var(--maroon);box-shadow:0 0 0 3px rgba(123,23,52,.08);background:#fffafd}
.diagstep.active span{background:var(--maroon);color:#fff}
.diagstep.done{background:#f0f8f4;border-color:#c9e6d8}
.diagstep.done span{background:var(--green);color:#fff}
.examcallout{border:1px solid #d8c08a;background:linear-gradient(135deg,#fff8e9,#fffdf8);border-radius:16px;padding:15px;margin:12px 0}
.examcallout b{color:#6f4c0c;font-size:15px}
.examcallout p{margin:4px 0 0;color:#705d37;font-size:12px}
.rubricbox{border-top:1px dashed #d7dce3;margin-top:12px;padding-top:10px}
.rubricrow{display:flex;align-items:center;gap:8px;padding:6px 8px;margin-top:5px;border-radius:9px;font-size:12px}
.rubricrow.hit{background:#edf7f2;color:#205f49}
.rubricrow.miss{background:#f7f7f8;color:#6b7280}
.rubricrow span{font-weight:950}
.scoreline{margin-top:11px;padding:9px 11px;background:#fff;border-radius:10px;border:1px solid var(--line);font-size:12px}
.metricnote{font-size:10px;color:#7b5d1e;margin-top:7px;padding-top:6px;border-top:1px dashed #eadbbd}
@media(max-width:820px){.diagsteps{grid-template-columns:1fr 1fr 1fr}.diagstep:nth-child(4),.diagstep:nth-child(5){grid-column:auto}}
@media(max-width:520px){.diagsteps{grid-template-columns:1fr 1fr}.diagstep{min-height:70px}.diagstep:last-child{grid-column:1/-1}}

.onboarding{max-width:920px;margin:24px auto 0}
.journey{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:18px;padding-bottom:16px;border-bottom:1px solid var(--line)}
.journeystep{display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 5px;border-radius:10px;color:#8a9099;font-size:10px}
.journeystep span{display:grid;place-items:center;width:22px;height:22px;border-radius:7px;background:#eef1f5;color:#697386;font-weight:900}
.journeystep b{font-size:11px}
.journeystep.active{background:#fff5f8;color:var(--maroon);font-weight:900}
.journeystep.active span{background:var(--maroon);color:#fff}
.journeystep.done{color:var(--green)}
.journeystep.done span{background:var(--green);color:#fff}
.examdetail{margin-top:18px;border-top:1px solid var(--line);padding-top:14px}
.evidencecard{display:grid;grid-template-columns:1fr auto;gap:4px 12px;border:1px solid var(--line);border-radius:12px;padding:11px 12px;margin-top:8px;background:#fff}
.evidencecard b{color:var(--navy);font-size:12px}
.evidencecard span{font-weight:950;color:var(--maroon)}
.evidencecard small{grid-column:1/-1;color:var(--muted);font-size:10px}
@media(max-width:650px){
  .journey{grid-template-columns:repeat(5,minmax(0,1fr));gap:3px}
  .journeystep{display:block;text-align:center;padding:5px 2px}
  .journeystep span{margin:0 auto 3px}
  .journeystep b{font-size:9px}
}

.coursecard{border:1px solid var(--line);background:#fff;border-radius:18px;padding:20px;box-shadow:0 8px 24px rgba(19,35,61,.05);transition:.16s}
.coursecard.clickable:hover{transform:translateY(-2px);border-color:#cda9b4;box-shadow:0 12px 30px rgba(123,23,52,.08)}
.coursecode{display:inline-block;background:#f4e9ee;color:var(--maroon);font-weight:950;border-radius:999px;padding:5px 9px;font-size:11px;margin-bottom:8px}
.coursecard h3{margin:3px 0 7px}
.coursecard p{color:var(--muted);font-size:12px;min-height:46px}
.courseprogress{margin:12px 0;padding:8px 10px;border-radius:10px;background:#f6f7f9;color:var(--navy);font-size:11px;font-weight:800}
.groupProgress{height:9px;background:#eceef1;border-radius:999px;overflow:hidden;margin:12px 0 16px}
.groupProgress span{display:block;height:100%;background:linear-gradient(90deg,var(--maroon),var(--gold))}
.batch{display:grid;gap:14px}
.batchq{display:grid;grid-template-columns:42px 1fr;gap:12px;border:1px solid var(--line);border-radius:16px;padding:16px;background:#fff}
.qnumber{width:36px;height:36px;border-radius:11px;background:#f2e8ec;color:var(--maroon);display:grid;place-items:center;font-weight:950}
.qbody h3{font-size:16px;line-height:1.55;margin:6px 0 10px}
.compactchoices{display:grid;gap:7px}
.compactchoices .choice{margin:0}
.dontknow{display:inline-flex;align-items:center;gap:7px;margin-top:8px;font-size:11px;color:var(--muted);cursor:pointer}
.confidenceBox{margin-top:16px;padding:15px;border:1px solid #d5dfeb;background:#f4f8fc;border-radius:14px}
.confidenceBox h3{margin:0 0 3px;font-size:15px}
.groupScore{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.groupScore strong{font-size:30px;color:var(--navy)}
.groupScore span{font-size:12px;color:var(--muted)}
.answerreview{border-top:1px solid rgba(0,0,0,.07);padding-top:11px;margin-top:11px}
.answerhead{display:flex;justify-content:space-between;gap:10px}
.answerhead span{font-weight:950;color:var(--maroon)}
.answerreview p{font-size:12px;margin:5px 0;color:#586273}
@media(max-width:620px){
  .batchq{grid-template-columns:1fr}
  .qnumber{width:30px;height:30px}
  .coursecard p{min-height:0}
}


/* v6 — lively learning experience + role dashboards */
input[type=password]{width:100%;border:1px solid #d8d2ca;background:#fff;color:var(--ink);border-radius:12px;padding:11px 12px;outline:none}
input[type=password]:focus{border-color:var(--maroon);box-shadow:0 0 0 3px rgba(123,23,52,.08)}
.fieldlabel{display:block;font-size:11px;font-weight:900;color:var(--navy);margin:11px 0 5px}
.fullbtn{width:100%;margin-top:15px}
.authshell{min-height:calc(100vh - 150px);display:grid;grid-template-columns:1.15fr .85fr;gap:18px;align-items:stretch;margin-top:22px}
.authvisual{position:relative;overflow:hidden;border-radius:28px;min-height:520px;background:linear-gradient(135deg,var(--navy),var(--maroon));box-shadow:var(--shadow);color:#fff}
.authvisual>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.64;transform:scale(1.02);animation:slowFloat 9s ease-in-out infinite alternate}
.authvisual:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,18,34,.08),rgba(8,18,34,.75))}
.authvisual>div{position:absolute;z-index:2;inset:auto 34px 34px 34px}
.authvisual h1{color:#fff;max-width:680px;font-size:42px}
.authvisual p{max-width:620px;color:#eef2f7}
.eyebrow{display:inline-flex;padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18);font-size:11px;font-weight:900;margin-bottom:10px}
.visualchips{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.visualchips span{padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.11);font-size:11px;font-weight:800}
.authcard{align-self:center;padding:28px}
.adminShell{max-width:1180px;margin:18px auto 0}
.adminHero,.resultHero,.dailyHero{display:grid;grid-template-columns:1.15fr .85fr;align-items:center;gap:20px;border-radius:24px;overflow:hidden;padding:24px;background:linear-gradient(135deg,#fff,#f7efe9);border:1px solid var(--line);box-shadow:var(--shadow);margin-bottom:16px}
.adminHero img,.resultHero img,.dailyHero img{width:100%;height:220px;object-fit:cover;border-radius:18px;box-shadow:0 14px 32px rgba(19,35,61,.12)}
.adminHero h1,.resultHero h1,.dailyHero h1{font-size:32px;margin-bottom:8px}
.adminHero p,.resultHero p,.dailyHero p{color:var(--muted)}
.adminstats{margin:14px 0}
.adminGrid{display:grid;grid-template-columns:1.3fr .7fr;gap:16px}
.studentCards{display:grid;gap:9px}
.studentCard{width:100%;display:grid;grid-template-columns:44px 1fr 14px;align-items:center;gap:11px;text-align:right;border:1px solid var(--line);background:#fff;border-radius:14px;padding:11px;transition:.16s}
.studentCard:hover{transform:translateY(-1px);border-color:#cda9b4;box-shadow:0 8px 18px rgba(123,23,52,.07)}
.avatar{width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,var(--maroon),var(--gold));color:#fff;display:grid;place-items:center;font-weight:950;font-size:18px}
.studentMain b,.studentMain small{display:block}.studentMain small{color:var(--muted);font-size:10px}
.statusdot{width:10px;height:10px;border-radius:50%}.statusdot.good{background:var(--green)}.statusdot.warn{background:var(--amber)}
.checkgrid{display:grid;gap:7px}
.checkcard{display:flex;gap:9px;align-items:flex-start;border:1px solid var(--line);border-radius:12px;padding:9px;cursor:pointer}
.checkcard b,.checkcard small{display:block}.checkcard small{font-size:10px;color:var(--muted)}
.adminCourse{margin-top:18px;padding-top:16px;border-top:1px solid var(--line)}
.sectiontitle{margin-top:18px}
.attemptList{display:grid;gap:8px}
.attemptRow{display:grid;grid-template-columns:1fr auto;gap:10px;border:1px solid var(--line);background:#fff;border-radius:13px;padding:11px}
.attemptRow b{display:block;font-size:12px;color:var(--navy)}.attemptRow small{display:block;color:var(--muted);font-size:10px}.attemptRow p{font-size:11px;margin:5px 0;color:#586273}.attemptRow>strong{color:var(--maroon);font-size:17px}
.adminReset{margin-top:16px;max-width:520px}.inlineform{display:grid;grid-template-columns:1fr auto;gap:8px}
.goalGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}
.goalCard{position:relative;border:1px solid var(--line);border-radius:16px;padding:16px;background:linear-gradient(180deg,#fff,#fbfaf8);min-height:190px}
.goalNum{position:absolute;top:12px;inset-inline-end:12px;width:26px;height:26px;border-radius:9px;background:#f1e7eb;color:var(--maroon);display:grid;place-items:center;font-weight:950}
.goalIcon{font-size:30px}.goalCard h3{margin:4px 0}.goalCard p{font-size:12px;color:var(--muted)}.goalCard small{display:block;color:#72541c;background:#fff6e4;border-radius:9px;padding:8px}.miniScore{display:inline-block;font-size:10px;font-weight:900;color:var(--maroon);background:#f8eaf0;border-radius:999px;padding:4px 7px}
.errorMemory{margin-top:18px;padding:16px;border-radius:16px;background:#f8f7fb;border:1px solid #dedbea}
.errorMemory>h3{margin-bottom:2px}.errorChip{display:grid;grid-template-columns:210px 1fr;gap:10px;border-top:1px dashed #d7d5e0;padding:9px 0;font-size:11px}.errorChip b{color:var(--maroon)}.errorChip span{color:#56606d}
.todayLayout{display:grid;grid-template-columns:1fr 300px;gap:16px;margin-top:16px}
.microLesson{border-radius:20px;padding:20px;background:linear-gradient(145deg,#13233d,#1e3b61);color:#fff;box-shadow:var(--shadow)}
.microLesson h2{color:#fff;margin-bottom:8px}.microLesson p{color:#dce5f0}
.microTop{display:flex;gap:12px;align-items:center}.microIcon{width:54px;height:54px;border-radius:16px;background:rgba(255,255,255,.1);display:grid;place-items:center;font-size:28px}
.workedExample,.microChallenge{display:grid;gap:4px;border-radius:13px;padding:11px;margin-top:10px;font-size:12px}.workedExample{background:rgba(255,255,255,.08)}.microChallenge{background:rgba(201,163,90,.18);border:1px solid rgba(201,163,90,.3)}
.workedExample span,.microChallenge span{color:#eef2f7}
.sessionSteps{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.sessionSteps span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:7px 10px;font-size:11px;font-weight:850}
.coachRail{align-self:start;position:sticky;top:88px}.coachGoal{display:grid;grid-template-columns:34px 1fr;gap:8px;padding:10px 0;border-bottom:1px dashed var(--line)}.coachGoal>span{font-size:24px}.coachGoal b,.coachGoal small{display:block}.coachGoal small{font-size:10px;color:var(--muted)}.coachBreak{height:14px}.coachError{padding:9px;border-radius:11px;background:#fff5f1;margin-top:7px}.coachError b,.coachError small{display:block}.coachError b{font-size:11px;color:var(--maroon)}.coachError small{font-size:10px;color:var(--muted)}
.masteryLadder{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;position:relative}.ladderStep{border:1px solid var(--line);background:#f7f7f8;border-radius:14px;padding:12px;text-align:center;opacity:.66}.ladderStep.done{background:#edf7f2;border-color:#c9e6d8;opacity:1}.ladderStep span{display:block;font-size:24px}.ladderStep b{display:block;font-size:11px}.ladderStep small{display:block;font-size:9px;color:var(--muted);margin-top:3px}
.transitionScreen{max-width:650px;margin:50px auto;text-align:center;background:#fff;border:1px solid var(--line);border-radius:28px;box-shadow:var(--shadow);padding:34px;overflow:hidden}
.transitionVisual{position:relative;width:220px;height:165px;margin:0 auto}.transitionVisual img{width:100%;height:100%;object-fit:contain;transform-origin:55% 68%;animation:gavelHit 1.15s cubic-bezier(.2,.8,.3,1) both}.impactRing{position:absolute;left:50%;bottom:22px;width:26px;height:10px;border:3px solid var(--gold);border-radius:50%;transform:translateX(-50%);animation:impact .8s .55s ease-out both}
.transitionScreen h1{font-size:52px;margin:0;color:var(--maroon)}.transitionScreen p{color:var(--muted)}.nextStage{display:flex;justify-content:center;gap:8px;align-items:center;margin:16px 0}.nextStage span{font-size:10px;text-transform:uppercase;color:var(--muted)}.nextStage b{color:var(--navy)}
@keyframes gavelHit{0%{transform:rotate(-20deg) translateY(-14px)}55%{transform:rotate(3deg) translateY(5px)}70%{transform:rotate(-3deg)}100%{transform:rotate(0)}}
@keyframes impact{0%{opacity:0;transform:translateX(-50%) scale(.3)}40%{opacity:.9}100%{opacity:0;transform:translateX(-50%) scale(4.2)}}
@keyframes slowFloat{from{transform:scale(1.02) translateY(0)}to{transform:scale(1.06) translateY(-8px)}}
@media(max-width:900px){.authshell,.adminGrid,.todayLayout,.adminHero,.resultHero,.dailyHero{grid-template-columns:1fr}.authvisual{min-height:390px}.goalGrid{grid-template-columns:1fr 1fr}.masteryLadder{grid-template-columns:repeat(3,1fr)}.coachRail{position:static}}
@media(max-width:620px){.authvisual{min-height:340px}.authvisual>div{inset:auto 20px 20px}.authvisual h1{font-size:29px}.goalGrid{grid-template-columns:1fr}.errorChip{grid-template-columns:1fr}.masteryLadder{grid-template-columns:1fr 1fr}.adminHero img,.resultHero img,.dailyHero img{height:170px}.adminHero h1,.resultHero h1,.dailyHero h1{font-size:25px}.inlineform{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation:none!important;transition:none!important}}


/* v6.1 — premium auth + admin redesign */
.authExperience{position:relative;min-height:calc(100vh - 115px);display:grid;grid-template-columns:minmax(0,1.18fr) minmax(360px,.82fr);gap:0;border-radius:30px;overflow:hidden;background:#0f1e34;box-shadow:0 28px 90px rgba(19,35,61,.22);margin-top:18px}
.authBackdrop{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.orb{position:absolute;border-radius:50%;filter:blur(12px);opacity:.32}.orb1{width:460px;height:460px;background:#7b1734;right:-130px;top:-170px}.orb2{width:360px;height:360px;background:#c9a35a;left:18%;bottom:-210px;opacity:.18}
.legalMark{position:absolute;left:44%;top:5%;font-size:220px;line-height:1;color:#fff;opacity:.025;transform:rotate(-7deg)}
.authHeroPanel,.authFormPanel{position:relative;z-index:2}
.authHeroPanel{padding:34px 36px 28px;color:#fff;display:flex;flex-direction:column;min-height:650px}
.brandLockup{display:flex;align-items:center;gap:12px}.brandLockup.mini{margin-bottom:24px}
.brandSeal{width:50px;height:50px;border-radius:16px;background:linear-gradient(145deg,#8a1d40,#5d1027);display:grid;place-items:center;font-weight:950;color:#fff;border:1px solid rgba(255,255,255,.14);box-shadow:0 14px 30px rgba(0,0,0,.16)}
.brandLockup span{display:block;font-weight:950;font-size:17px}.brandLockup small{display:block;color:#b9c7da;font-size:10px;margin-top:-2px}
.heroCopy{margin-top:52px;max-width:760px}.heroCopy h1{color:#fff;font-size:45px;line-height:1.12;letter-spacing:-.5px;margin-bottom:16px}.heroCopy h1 em{font-style:normal;color:#e3c985}.heroCopy p{font-size:15px;color:#d7e0ec;max-width:680px}
.heroFeatureRow{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.heroFeatureRow span{padding:9px 12px;border-radius:999px;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.11);font-size:11px;font-weight:850}
.visualFrame{position:relative;margin-top:auto;height:255px;border-radius:22px;overflow:hidden;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.04);box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
.visualFrame img{width:100%;height:100%;object-fit:cover;opacity:.85;transform:scale(1.03)}
.visualFrame:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(10,18,31,.46))}
.floatingCard{position:absolute;z-index:2;padding:8px 11px;border-radius:11px;background:rgba(255,255,255,.92);color:#13233d;font-size:10px;font-weight:900;box-shadow:0 10px 28px rgba(0,0,0,.18);animation:cardFloat 4s ease-in-out infinite alternate}.fc1{top:24px;right:20px}.fc2{top:92px;left:22px;animation-delay:.6s}.fc3{bottom:22px;right:30%;animation-delay:1.1s}
.authFormPanel{background:linear-gradient(180deg,#fff,#fbfaf7);padding:54px 44px;display:flex;flex-direction:column;justify-content:center;box-shadow:-18px 0 42px rgba(4,12,24,.13)}
.authStep{width:42px;height:42px;border-radius:14px;background:#f4e8ec;color:#7b1734;display:grid;place-items:center;font-weight:950;margin-bottom:20px}
.authFormPanel h2{font-size:31px;margin-bottom:6px}.authLead{color:var(--muted);font-size:12px;margin:0 0 18px;max-width:420px}
.authFormPanel input{height:47px;background:#fff;border-color:#ddd6ce}.bigbtn{min-height:48px;font-size:13px}
.authError{margin:10px 0;padding:11px 12px;border-radius:11px;background:#fdebed;border:1px solid #efc4ca;color:#8b3440;font-size:11px;font-weight:800}
.securityNote{display:grid;grid-template-columns:28px 1fr;gap:9px;margin-top:18px;padding:12px;border-radius:13px;background:#f7f4ef;border:1px solid #ebe2d5}.securityNote span{font-size:18px}.securityNote p{margin:0;font-size:10px;color:#6d655c}.securityNote b{color:#4d4439}
.loginMode .authHeroPanel{background:linear-gradient(155deg,rgba(19,35,61,.52),rgba(93,16,39,.18))}
.loginVisual{height:280px}
.adminWorkspace{display:grid;grid-template-columns:235px minmax(0,1fr);gap:0;background:#f5f3ef;border:1px solid var(--line);border-radius:28px;overflow:hidden;box-shadow:var(--shadow);margin-top:18px;min-height:760px}
.adminSidebar{background:linear-gradient(180deg,#13233d,#0d1a2e);color:#fff;padding:24px 16px;display:flex;flex-direction:column}
.adminSidebar nav{display:grid;gap:7px}.sideNav{border:0;background:transparent;color:#c9d4e3;text-align:right;padding:11px 12px;border-radius:11px;font-weight:800;font-size:11px}.sideNav:hover,.sideNav.active{background:rgba(255,255,255,.085);color:#fff}.sideNav span{float:left;background:#7b1734;color:#fff;border-radius:999px;padding:1px 7px;font-size:9px}
.sideQuote{margin-top:auto;padding:14px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);font-size:11px;color:#d9e1eb;line-height:1.8}
.adminMain{padding:26px 28px 32px;min-width:0}
.adminTop{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}.adminTop h1{font-size:31px;margin-bottom:4px}.adminTop p{color:var(--muted);font-size:12px;margin:0}
.kpiGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:15px}.kpiCard{background:#fff;border:1px solid var(--line);border-radius:16px;padding:15px;display:flex;gap:11px;align-items:center;box-shadow:0 7px 18px rgba(19,35,61,.04)}.kpiCard.attention{background:#fff9ed;border-color:#ead4a7}.kpiIcon{width:40px;height:40px;border-radius:12px;background:#f2eef1;display:grid;place-items:center;font-size:19px}.kpiCard strong{display:block;font-size:23px;color:var(--navy)}.kpiCard small{display:block;color:var(--muted);font-size:9px}
.adminColumns{display:grid;grid-template-columns:1.18fr .82fr;gap:15px}.studentPanel,.createStudentPanel{min-height:420px}
.studentCard.pro{grid-template-columns:46px 1fr 24px}.miniBar{display:block;margin-top:7px;height:5px;border-radius:999px;background:#ececef;overflow:hidden}.miniBar i{display:block;height:100%;background:linear-gradient(90deg,var(--maroon),var(--gold));border-radius:999px}.cardArrow{font-size:17px;color:#9ca3ad}
.richEmpty span{display:block;font-size:30px}.richEmpty b,.richEmpty small{display:block}.richEmpty small{font-size:10px}
.adminLower{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:15px}.recentList{display:grid;gap:9px}.recentItem{display:grid;grid-template-columns:36px 1fr;gap:8px;align-items:center;border-bottom:1px dashed var(--line);padding-bottom:8px}.smallava{width:34px;height:34px;font-size:13px}.recentItem b,.recentItem small{display:block}.recentItem small{font-size:9px;color:var(--muted)}
.insightPanel{background:linear-gradient(145deg,#fff,#fbf5f7)}.insightRow{display:grid;grid-template-columns:28px 1fr;gap:8px;padding:9px 0;border-bottom:1px dashed var(--line)}.insightRow b,.insightRow small{display:block}.insightRow small{font-size:9px;color:var(--muted)}
.createdAccount{margin-bottom:15px;padding:15px;border-radius:17px;background:linear-gradient(135deg,#edf7f2,#f9fcfa);border:1px solid #c8e4d6;box-shadow:0 8px 20px rgba(38,115,90,.06)}.createdAccount>div:first-child{display:flex;gap:10px;align-items:center}.createdIcon{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#26735a;color:#fff;font-weight:950}.createdAccount b,.createdAccount small{display:block}.createdAccount small{font-size:10px;color:#557067}
.credentialGrid{display:grid!important;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.credentialGrid span{display:block;padding:10px;border:1px dashed #bad5c8;background:#fff;border-radius:10px}.credentialGrid small,.credentialGrid b{display:block}
.prototypeBanner{display:flex;gap:10px;align-items:center;margin-top:15px;padding:11px 13px;border-radius:12px;background:#fff3df;border:1px solid #ecd5aa;font-size:10px;color:#76551d}.prototypeBanner b{white-space:nowrap}
@keyframes cardFloat{from{transform:translateY(0)}to{transform:translateY(-8px)}}
@media(max-width:1050px){.authExperience{grid-template-columns:1fr}.authHeroPanel{min-height:540px}.authFormPanel{box-shadow:none}.adminWorkspace{grid-template-columns:1fr}.adminSidebar{display:none}.kpiGrid{grid-template-columns:1fr 1fr}.adminColumns,.adminLower{grid-template-columns:1fr}}
@media(max-width:680px){.authHeroPanel{padding:24px 20px;min-height:500px}.heroCopy{margin-top:34px}.heroCopy h1{font-size:32px}.authFormPanel{padding:30px 20px}.visualFrame{height:220px}.kpiGrid{grid-template-columns:1fr 1fr}.adminMain{padding:18px 12px}.adminTop{display:block}.adminTop .btn{margin-top:10px}.credentialGrid{grid-template-columns:1fr!important}.prototypeBanner{display:block}.prototypeBanner b{display:block;margin-bottom:4px}}


/* v6.2 — cinematic access screen */
@media(min-width:1051px){
  .authExperience{display:block;min-height:690px;background:
    linear-gradient(90deg,rgba(9,18,32,.88) 0%,rgba(9,18,32,.58) 43%,rgba(93,16,39,.22) 100%),
    url("visual-study.svg") center/cover no-repeat}
  .authExperience .authBackdrop{z-index:0}
  .authHeroPanel{min-height:690px;padding:38px 500px 34px 42px;background:transparent!important}
  .authHeroPanel .heroCopy{margin-top:86px;max-width:650px}
  .authHeroPanel .heroCopy h1{font-size:50px;text-shadow:0 4px 24px rgba(0,0,0,.25)}
  .authHeroPanel .heroCopy p{font-size:16px;max-width:590px}
  .authHeroPanel .visualFrame{position:absolute;right:34px;bottom:34px;width:420px;height:190px;margin:0;background:rgba(255,255,255,.05);backdrop-filter:blur(7px);border-color:rgba(255,255,255,.15)}
  .authHeroPanel .visualFrame img{opacity:.48}
  .authFormPanel{position:absolute;z-index:4;left:38px;top:50%;transform:translateY(-50%);width:405px;max-height:610px;overflow:auto;border-radius:26px;background:rgba(255,255,255,.95);backdrop-filter:blur(18px);box-shadow:0 28px 90px rgba(5,12,25,.34);padding:34px 32px;border:1px solid rgba(255,255,255,.62)}
  .authFormPanel:before{content:"";position:absolute;inset:0 0 auto 0;height:5px;border-radius:26px 26px 0 0;background:linear-gradient(90deg,var(--maroon),var(--gold))}
  .loginMode .authHeroPanel{padding-right:500px}
  .loginMode .authHeroPanel .visualFrame{width:390px;height:180px}
}


/* v6.3 — focused student plan */
.studentSimple{max-width:1040px;margin:18px auto 0}
.simplifiedHero{grid-template-columns:1.35fr .65fr}
.focusPlan{display:grid;gap:10px;margin-top:12px}
.focusPlanRow{display:grid;grid-template-columns:48px 1fr auto;gap:12px;align-items:center;border:1px solid var(--line);border-radius:15px;padding:13px;background:#fff}
.focusPlanRow.primary{border-color:#cda9b4;background:#fff8fb;box-shadow:0 7px 18px rgba(123,23,52,.05)}
.focusPlanRow .goalIcon{font-size:26px}.focusPlanRow b{display:block;color:var(--navy);font-size:13px}.focusPlanRow p{margin:3px 0;color:var(--muted);font-size:11px}.focusPlanRow small{font-size:10px;color:#72541c}
.studentPlanHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin:16px 0 12px;padding:0 3px}
.studentPlanHeader h1{font-size:32px;margin:4px 0 5px}.studentPlanHeader p{margin:0;color:var(--muted);font-size:12px}
.focusedPath{background:linear-gradient(145deg,#13233d,#1b3559);color:#fff;border-radius:20px;padding:19px;box-shadow:var(--shadow);margin-bottom:14px}
.focusedPathHead{display:grid;grid-template-columns:56px 1fr;gap:12px;align-items:start}
.focusBigIcon{width:52px;height:52px;border-radius:15px;display:grid;place-items:center;background:rgba(255,255,255,.10);font-size:28px}
.focusedPath h2{color:#fff;margin:2px 0 4px}.focusedPath p{margin:0;color:#dce5f0;font-size:12px;max-width:720px}
.pathStages{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:16px}
.pathStage{display:flex;align-items:center;gap:7px;padding:9px;border-radius:11px;background:rgba(255,255,255,.06);color:#bfcadb;font-size:10px;font-weight:800}
.pathStage span{width:23px;height:23px;border-radius:8px;display:grid;place-items:center;background:rgba(255,255,255,.10);font-weight:950}
.pathStage.active{background:rgba(201,163,90,.20);color:#fff;border:1px solid rgba(201,163,90,.28)}
.pathStage.active span{background:var(--gold);color:#2e2618}.pathStage.done{color:#cce7db}.pathStage.done span{background:var(--green);color:#fff}
.focusWork{padding:20px}.phaseLabel{display:inline-flex;padding:6px 9px;border-radius:999px;background:#f4e9ee;color:var(--maroon);font-size:10px;font-weight:950;margin-bottom:10px}
.simpleLesson{box-shadow:none;border-radius:16px;background:linear-gradient(145deg,#172a47,#213e66)}
.focusedChallenges{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin-top:12px}
.focusedChallenges .activityCard{min-height:210px;display:flex;flex-direction:column}.focusedChallenges .activityCard .btn{margin-top:auto}
.activityCard.recommended{border-color:#ddc7ce;box-shadow:0 9px 24px rgba(123,23,52,.05)}
.assessmentReady{text-align:center;padding:30px}.assessmentIcon{font-size:48px;margin:4px 0}.assessmentReady h2{font-size:25px}.assessmentReady p{max-width:620px;margin:0 auto 16px;color:var(--muted)}
.laterPriorities{margin-top:14px}.laterPriorities p{margin-top:0}.laterChip{display:inline-flex;margin:5px 5px 0 0;padding:7px 10px;border-radius:999px;background:#f3f4f6;color:#687181;font-size:10px;font-weight:850}
.allClear{text-align:center;padding:42px 28px;max-width:760px;margin:30px auto}.allClearIcon{width:70px;height:70px;border-radius:50%;background:#edf7f2;color:var(--green);display:grid;place-items:center;margin:0 auto 14px;font-size:35px;font-weight:950}.allClear p{color:var(--muted);max-width:650px;margin:0 auto}
.pathPassed{display:grid;gap:4px;margin-top:12px;padding:13px;border-radius:13px;background:#edf7f2;border:1px solid #c8e4d6;color:#205f49}.pathPassed b{font-size:14px}.pathPassed span{font-size:11px}
.completedPathList{display:grid;gap:8px}.completedPathRow{display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:9px;padding:10px 11px;border:1px solid #c8e4d6;background:#f5fbf8;border-radius:12px}.completedPathRow>span{font-size:22px}.completedPathRow b,.completedPathRow small{display:block}.completedPathRow small{font-size:9px;color:#607168}.completedPathRow strong{color:var(--green);font-size:18px}
.compactStats{margin-top:12px}
@media(max-width:760px){
  .simplifiedHero{grid-template-columns:1fr}.simplifiedHero img{display:none}
  .studentPlanHeader{display:block}.studentPlanHeader .stepbadge{margin-top:8px}
  .pathStages{grid-template-columns:1fr 1fr}.focusedChallenges{grid-template-columns:1fr}
  .focusPlanRow{grid-template-columns:42px 1fr}.focusPlanRow .miniScore{grid-column:2}
}


/* v6.5 — clearer progress explanations + no gavel */
.stageCompleteMark{width:92px;height:92px;border-radius:50%;margin:2px auto 14px;display:grid;place-items:center;background:linear-gradient(145deg,#edf7f2,#dff1e8);border:1px solid #b9dccb;box-shadow:0 14px 32px rgba(38,115,90,.12);animation:stagePop .48s ease-out both}
.stageCompleteMark span{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:#26735a;color:#fff;font-size:30px;font-weight:950;box-shadow:0 8px 20px rgba(38,115,90,.18)}
.transitionVisual,.impactRing{display:none!important}
@keyframes stagePop{0%{transform:scale(.72);opacity:0}70%{transform:scale(1.06);opacity:1}100%{transform:scale(1);opacity:1}}

.progressDashboard{max-width:1120px}
.progressIntro{padding:22px}
.progressIntro h1{font-size:28px;margin:4px 0 6px}
.progressIntro .screenhead p{max-width:740px;color:var(--muted);margin:0}
.howToRead{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:15px 0}
.howToRead>div{display:grid;grid-template-columns:30px 1fr;gap:8px;align-items:start;padding:11px;border-radius:13px;background:#f7f7f8;border:1px solid #e6e4e1}
.howToRead b{width:27px;height:27px;border-radius:9px;display:grid;place-items:center;background:#f1e6eb;color:var(--maroon);font-size:11px}
.howToRead span{font-size:10px;line-height:1.65;color:#657080}.howToRead strong{display:block;color:var(--navy);font-size:11px;margin-bottom:2px}

.currentProgressPlan{display:grid;grid-template-columns:58px 1fr auto;gap:13px;align-items:center;margin-top:16px;padding:18px 20px;border-radius:18px;background:linear-gradient(135deg,#13233d,#1f3d64);color:#fff;box-shadow:var(--shadow)}
.currentProgressPlan.complete{background:linear-gradient(135deg,#205f49,#2e8065)}
.currentProgressPlan h2{color:#fff;margin:3px 0 4px}.currentProgressPlan p{margin:0;color:#dce5f0;font-size:11px;max-width:680px}
.currentProgressIcon{width:54px;height:54px;border-radius:15px;display:grid;place-items:center;background:rgba(255,255,255,.1);font-size:28px}
.stagePill{display:inline-flex;margin-top:8px;padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.11);font-size:10px;font-weight:850;color:#f1f4f8}

.progressExplainGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
.progressExplainCard{border:1px solid var(--line);border-radius:16px;padding:15px;background:#fff;box-shadow:0 6px 18px rgba(19,35,61,.035)}
.progressExplainCard.needs{border-color:#e6c5ca;background:#fffafb}.progressExplainCard.strong{border-color:#c6e3d5;background:#fbfefc}.progressExplainCard.steady{border-color:#e5d8b6;background:#fffdf8}
.progressExplainHead{display:grid;grid-template-columns:42px 1fr auto;gap:9px;align-items:center}.progressExplainIcon{width:40px;height:40px;border-radius:12px;background:#f1eef2;display:grid;place-items:center;font-size:21px}
.progressExplainHead h3{margin:0 0 3px;font-size:14px}.progressExplainHead>strong{font-size:22px;color:var(--navy)}
.statusBadge{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:9px;font-weight:900}.statusBadge.needs{background:#fdebed;color:#923847}.statusBadge.steady{background:#fff2cf;color:#7d6022}.statusBadge.strong{background:#e8f5ee;color:#24684f}.statusBadge.neutral{background:#edf0f3;color:#606b78}
.progressExplainCard>p{font-size:11px;color:var(--muted);line-height:1.75;min-height:44px;margin:11px 0}
.progressEvidence{display:grid;grid-template-columns:auto 1fr;gap:8px;margin-top:8px;font-size:9px;color:#69727e}.progressEvidence span:first-child{white-space:nowrap}.progressEvidence b{color:var(--navy)}
.progressNext{margin-top:11px;padding:10px;border-radius:11px;background:#f7f7f8;display:grid;gap:3px}.progressNext b{font-size:10px;color:var(--navy)}.progressNext span{font-size:10px;color:#68717d;line-height:1.6}

@media(max-width:880px){
  .howToRead{grid-template-columns:1fr 1fr}
  .progressExplainGrid{grid-template-columns:1fr}
  .currentProgressPlan{grid-template-columns:52px 1fr}.currentProgressPlan .btn{grid-column:1/-1}
}
@media(max-width:560px){
  .howToRead{grid-template-columns:1fr}
  .progressExplainHead{grid-template-columns:38px 1fr auto}
  .progressEvidence{grid-template-columns:1fr}
}

```

---

# FILE: assets/visual-study.svg

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" role="img" aria-labelledby="t d">
<title id="t">طلاب قانون يتعلمون في بيئة رقمية</title><desc id="d">رسم توضيحي تجريدي بألوان LexLearn لطلاب وكتب ومنصة تعلم قانوني.</desc>
<defs>
  <linearGradient id="bg" x1="0" x2="1"><stop stop-color="#13233d"/><stop offset="1" stop-color="#7b1734"/></linearGradient>
  <linearGradient id="glass" x1="0" x2="1"><stop stop-color="#ffffff" stop-opacity=".26"/><stop offset="1" stop-color="#ffffff" stop-opacity=".08"/></linearGradient>
</defs>
<rect width="900" height="500" rx="34" fill="url(#bg)"/>
<circle cx="760" cy="90" r="120" fill="#c9a35a" opacity=".18"/>
<circle cx="110" cy="420" r="150" fill="#ffffff" opacity=".05"/>
<path d="M0 390h900v110H0z" fill="#101d31" opacity=".7"/>
<g opacity=".9" fill="#e8edf5">
  <rect x="620" y="95" width="24" height="170" rx="4"/><rect x="650" y="70" width="35" height="195" rx="4"/>
  <rect x="692" y="120" width="28" height="145" rx="4"/><rect x="730" y="52" width="42" height="213" rx="4"/>
  <rect x="779" y="105" width="26" height="160" rx="4"/><rect x="813" y="82" width="35" height="183" rx="4"/>
</g>
<g transform="translate(95 115)">
  <rect x="0" y="210" width="420" height="18" rx="9" fill="#c9a35a" opacity=".85"/>
  <rect x="50" y="0" width="300" height="185" rx="18" fill="url(#glass)" stroke="#fff" stroke-opacity=".22"/>
  <rect x="72" y="24" width="118" height="12" rx="6" fill="#fff" opacity=".8"/>
  <rect x="72" y="50" width="210" height="8" rx="4" fill="#fff" opacity=".32"/>
  <rect x="72" y="68" width="170" height="8" rx="4" fill="#fff" opacity=".22"/>
  <circle cx="275" cy="108" r="42" fill="#c9a35a" opacity=".9"/>
  <path d="M255 110l14 14 29-35" fill="none" stroke="#13233d" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="35" cy="160" r="30" fill="#f2d2b6"/><path d="M4 207c7-36 21-52 31-52s26 16 34 52" fill="#ffffff" opacity=".9"/>
  <circle cx="390" cy="160" r="30" fill="#c68f72"/><path d="M358 207c8-37 22-52 32-52 11 0 26 15 34 52" fill="#ffffff" opacity=".78"/>
</g>
<g transform="translate(570 315)">
  <rect x="0" y="70" width="205" height="28" rx="8" fill="#5d1027"/>
  <rect x="14" y="42" width="190" height="28" rx="8" fill="#c9a35a"/>
  <rect x="4" y="14" width="215" height="28" rx="8" fill="#f4efe7"/>
  <text x="112" y="34" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#13233d">LAW • LEARN • APPLY</text>
</g>
<g transform="translate(515 118)" stroke="#c9a35a" stroke-width="7" fill="none" stroke-linecap="round">
  <path d="M40 0v72M2 22h76M18 22L4 52h28zM62 22L48 52h28z"/>
</g>
</svg>
```

---

# FILE: .github/workflows/pages.yml

```yaml
name: Deploy LexLearn AI demo to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Configure Pages
        uses: actions/configure-pages@v5
        with:
          enablement: true
      - name: Upload site
        uses: actions/upload-pages-artifact@v3
        with:
          path: "."
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4

```

---

# Supporting technical/product documents

## FILE: README.md

# LexLearn AI Demo

**LexLearn AI** is a founder-led prototype for adaptive legal education.

This public demo shows one core learning loop:

1. A law student answers a short legal fact pattern.
2. The system evaluates the answer across issue spotting, rule identification, application and conclusion.
3. It identifies the weakest skill.
4. It assigns a different next exercise targeted to that weakness.
5. A lightweight dashboard visualizes the learner profile.

## Current status

- Stage: working front-end prototype / pre-MVP
- Language: Arabic
- Demo module: Civil Law / tort-style legal reasoning
- AI connection: **not connected yet**. The current evaluation engine is a local simulation used to validate UX and product logic before integrating a secure server-side LLM.

## Product direction

The production version is intended to use a secure backend with an LLM-based reasoning engine, institution-approved legal sources, explainable feedback, faculty oversight and privacy controls.

## Founder

**Dr Ahmad Foad El-Feky**  
PhD in Law / Civil Law. Participant in local and international legal events concerning law and artificial intelligence.

## Live demo

https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/


## FILE: AUTH_BACKEND_ARCHITECTURE.md

# LexLearn AI — Production Auth & Student Analytics Architecture

## Goal
The live v6 prototype demonstrates the full product flow locally:
- Admin account
- Admin-created student usernames/passwords
- Per-student dashboard
- Student-only view of that student's learning state
- Admin drill-down to course, diagnostic groups, questions, answers, confidence, scores, reviews, activities
- Student data export
- Personalized learning goals, error memory, micro-learning, spaced-review queue, progress ladder

The prototype uses browser localStorage only. It is NOT sufficient for a real pilot with students.

## Production security boundary
Before real student use, move identity and learning records to a server-side backend. Never store plaintext passwords or authorization rules in the browser.

### Roles
- OWNER / ADMIN: create and deactivate student accounts, assign courses, reset passwords, view/export all learner evidence.
- STUDENT: read/write only own profile, attempts, reviews, activities and assigned courses.
- CONTENT_REVIEWER (future): content workflow only; no student personal data unless explicitly authorized.

## Recommended core tables
### users
- id
- role
- username
- display_name
- status
- created_at
- last_login_at

### enrollments
- user_id
- course_id
- status
- assigned_at

### attempts
- id
- user_id
- course_id
- item_id
- answer
- score
- confidence
- hint_count
- latency_ms
- created_at

### mastery_evidence
- user_id
- course_id
- dimension
- evidence_value
- source_attempt_id
- created_at

### learning_plans
- user_id
- course_id
- route
- goals_json
- updated_at

### reviews
- user_id
- item_id
- due_at
- interval_data
- status

### activity_events
- user_id
- course_id
- activity_type
- result_json
- created_at

### content_items
- item_id
- course_id
- level
- dimension
- version
- review_status
- source_ids

## Authorization rules
- Student queries must always be filtered server-side by authenticated user_id.
- Student cannot supply an arbitrary user_id to read another learner.
- Admin authorization must be verified server-side, never from a hidden button or browser flag.
- Course access comes from enrollments.
- Password reset invalidates prior sessions when appropriate.
- Audit sensitive admin actions.

## Analytics
Admin dashboard should support:
- Overview: active students, completion, average measured mastery, attention flags.
- Drill-down: student -> course -> dimension -> group -> item/attempt.
- Error-type trends: knowledge gap, misconception, legal-precision confusion, transfer/application gap, exam-structure gap.
- Confidence mismatch: high-confidence wrong answers.
- Return/retention: due reviews completed and delayed performance.
- Exports with time range and course filters.

## Privacy / data minimization
- Collect only data required for learning adaptation.
- Avoid permanent psychological/personality labels.
- Keep learner profile topic-specific and evidence-based.
- Separate academic feedback from official university grades.
- Define retention/deletion policy before pilot.
- Log consent/notice version shown to student.

## Product rules already locked
- Grouped diagnostic, one confidence rating per group.
- Easy -> Medium -> Difficult -> Transfer -> Exam.
- Three current learning goals, not an overwhelming task list.
- Micro-learning sessions roughly 5-8 minutes.
- Error memory drives remediation.
- Strong learners skip repetitive easy work and receive harder transfer/exam tasks.
- Delayed retention remains unmeasured until a later review.
- Motion and visuals support transitions but must not distract; respect prefers-reduced-motion.
- Semantic AI grading must be grounded in approved course/source material and return Training Feedback, not an official grade.


## FILE: AI_GRADING_BACKEND.md

# LexLearn AI — Grounded Semantic Grading Backend Contract

## لماذا هذه الطبقة منفصلة؟
GitHub Pages واجهة ثابتة ولا يجوز وضع مفتاح نموذج ذكاء اصطناعي داخل JavaScript في المتصفح. لذلك التصحيح الدلالي الإنتاجي يجب أن يعمل في Backend آمن.

## Endpoint
POST /api/grade

### Request
```json
{
  "course_id": "QA-QU-LAWC213",
  "item_id": "213-x1",
  "answer": "إجابة الطالب",
  "language": "ar"
}
```

لا يرسل المتصفح مفتاح API ولا يقرر بنفسه المصادر القانونية.

## Server-side flow
1. Fetch the item by item_id.
2. Reject it unless content status is approved.
3. Load only the approved rubric and approved source excerpts linked to that item/course.
4. Send to the grading model:
   - question
   - approved rubric
   - approved source excerpts
   - learner answer
5. Instruct the model:
   - do not use outside legal knowledge;
   - do not cite any rule/article absent from supplied sources;
   - distinguish omission from contradiction;
   - accept legally equivalent paraphrases;
   - flag unsupported or conflicting statements.
6. Validate structured JSON output server-side.
7. Save feedback as training evidence, not an official university grade.

## Response
```json
{
  "score": 0.75,
  "achieved_criteria": [
    {"id":"c1","label":"المصادر الإرادية","evidence":"..."}
  ],
  "missing_criteria": [
    {"id":"c4","label":"مثال مناسب"}
  ],
  "contradictions": [],
  "feedback_ar": "...",
  "model_confidence": 0.86,
  "needs_human_review": false,
  "source_ids": ["QU_COURSES_AR","QU_CATALOG_2526"]
}
```

## Mandatory fallback
If the model response is invalid, confidence is low, or evidence conflicts:
```json
{
  "needs_human_review": true,
  "score": null
}
```

## Current prototype behavior
The live GitHub Pages build uses `concept_rubric_v2` locally. It matches required concepts using multiple accepted expressions and partial phrase matching. This is intentionally more flexible than exact keyword matching, but it is not a substitute for the secure grounded AI endpoint above.


## FILE: CONTENT_REVIEW.md

# LexLearn AI — Content Review Gate

هذه الوثيقة تمنع تحويل الـPilot إلى بنك أسئلة غير مُراجع.

## قاعدة النشر
لا يدخل أي سؤال إلى حالة `approved` قبل مرور مراجعتين منفصلتين:

1. **Legal Review** — متخصص في المقرر يراجع صحة المفهوم، مفتاح الإجابة، المشتتات، وعدم وجود تعميم أو استثناء ناقص.
2. **Learning Review** — يراجع مستوى الصعوبة، جودة المشتتات، وضوح الصياغة، وهل السؤال يقيس البُعد المقصود فعلًا.

الحالات:
`draft → legal_review → learning_review → approved → retired`

## بطاقة مراجعة كل سؤال
- Course / Unit / Topic
- Learning objective
- Level: Easy / Medium / Difficult / Transfer / Exam
- Dimension
- Official source IDs
- Question text
- Correct answer / rubric
- Why each distractor is plausible
- Legal reviewer + date
- Educational reviewer + date
- Version / change notes

## قواعد المحتوى
- كل مشتت في أسئلة الاختيار يكون قانونيًا ومعقولًا، لا اختيارًا من مجال بعيد.
- لا يُستخدم رقم مادة أو نص تشريعي إلا من مصدر قانوني رسمي ومعتمد ومؤرخ.
- أسئلة Transfer لا تذكر اسم الباب صراحة في الوقائع.
- أسئلة Exam تستخدم Rubric مفاهيمي؛ الصياغة المختلفة لا تُرفض إذا حققت الفكرة.
- لا تُستخدم أوراق امتحانات فعلية قبل التحقق من مصدرها وحق استخدامها.
- الإحصاءات عن تكرار أسئلة الامتحانات لا تظهر إلا من بيانات موثقة.

## AI grading production gate
الواجهة الحالية تستخدم `concept_rubric_v2` محليًا. قبل Pilot حقيقي للتصحيح المقالى بالذكاء الاصطناعي:
- يكون الاستدعاء من Backend آمن، لا من GitHub Pages مباشرة.
- لا تُرسل للنموذج إلا: السؤال + Rubric المعتمد + المقاطع/المصادر المعتمدة المرتبطة بالسؤال + إجابة الطالب.
- يمنع النموذج من الاستشهاد بمادة أو قاعدة غير موجودة في الحزمة المرسلة.
- يعيد: achieved_criteria, missing_criteria, feedback, confidence.
- إذا لم تكفِ المصادر أو انخفضت الثقة، يعيد `needs_human_review` ولا يخمن.
- الناتج يسمى Training Feedback وليس Official Grade.


## FILE: PRODUCT_EXPERIENCE_V6.md

# LexLearn AI v6 — Locked Student Experience Blueprint

## Product promise
Same destination for every learner; the route changes with evidence.

LexLearn should develop:
1. Legal map / conceptual structure
2. Recall
3. Understanding
4. Legal precision / distinction
5. Issue spotting
6. Transfer and application
7. Legal argument / exam construction
8. Delayed retention and calibrated confidence

## Student journey — locked
Login -> assigned course -> grouped diagnostic -> result evidence -> 3 personal growth goals -> short daily session -> varied practice -> spaced review -> transfer/exam challenge -> re-measure -> plan update.

### Diagnostic
- Five explicit levels: Easy -> Medium -> Difficult -> Transfer -> Exam
- Questions grouped to reduce fatigue
- One confidence rating per group
- MCQ early, short writing at exam stage
- Unmeasured dimensions never display 0%

### Personalized growth
After diagnosis, show only three priorities:
- what to improve
- why it was selected
- next training action

Do not assign a permanent “learning style” personality label.

### Daily session
Target 5–8 minutes:
- Understand
- Distinguish
- Apply
- Stabilize/retrieve

Use one micro-lesson, one worked example, one short challenge, and optional extension.

### Error memory
Store error type, not only right/wrong:
- missing knowledge
- incomplete understanding
- legal-precision confusion
- transfer/application gap
- exam-structure gap
- high-confidence misconception

Future remediation should change the form of the task instead of simply repeating the same question.

### Strong learners
Skip repetitive easy work and move toward:
- boundary cases
- changed facts
- misleading facts
- competing analyses
- critique of an answer
- complex exam construction

### Mastery ladder
Know -> distinguish -> explain -> spot in facts -> apply -> write exam answer.

### Visual / motion language
- Maroon + navy + warm gold + off-white
- Realistic/illustrative legal-learning imagery
- Emojis as lightweight cues, not decoration everywhere
- Short transition scenes between milestones
- Gavel/stamp/file motion only at meaningful moments
- Respect prefers-reduced-motion
- No noisy autoplay sound
- Motion must support learning, never compete with it

## Admin experience — locked
Admin can:
- create student account
- assign one or more courses
- reset password
- view student list and attention flags
- drill down: student -> course -> dimension -> group -> question/answer/confidence/score
- view reviews and activities
- export student data
- later filter by date/course/error type

Student can see only own experience and assigned courses.

## Prototype vs production
### Implemented in v6 static prototype
- local admin setup
- local student accounts
- separate per-student state keys
- admin analytics drill-down
- data export
- personalized goals
- error memory
- micro-learning
- mastery ladder
- animated group transition
- visual learning scenes
- grouped diagnostic and concept-rubric written scoring

### Mandatory before real student pilot
- secure backend authentication
- server-side role/row permissions
- cloud database
- password hashing handled by auth provider
- audit/admin logs
- data minimization, retention and deletion rules
- privacy notice / consent workflow
- true spaced-review scheduler
- reviewed question/content bank
- secure grounded semantic AI grading
- content versioning/effective dates
- pilot analytics and instrumentation
- accessibility and mobile QA
- backup/export/admin recovery process

Do not call the local prototype “secure multi-user authentication.” It demonstrates the workflow only.


## v6.4 focused-path refinement
Student-facing language is formal Modern Standard Arabic. Colloquial wording is not permitted in production UI.

The active training plan now follows a single-focus rule:
1. Select the weakest active skill dimension supported by evidence.
2. Show only the lesson and challenges relevant to that dimension.
3. Hide unrelated challenges while that path is active.
4. Progress through: guided learning -> targeted practice -> path assessment.
5. A path closes when the learner passes its assessment at the current prototype threshold.
6. Once closed, it disappears from active training and the next demonstrated weakness becomes the active path.
7. Completed paths remain visible only in progress/history, not as active tasks.
8. If no active weakness remains, show an all-clear state and only necessary delayed reviews.

The student navigation should remain intentionally small: training plan, progress, courses. Separate challenge/review libraries should not compete with the active plan.


## FILE: sources/LEGAL_HERITAGE_LIBRARY.md

# LexLearn AI — Legal Heritage Source Library

## Status
This file records public/openly accessible legal heritage sources that are approved for retrieval in the LexLearn research workflow. Full books are not republished in this repository.

## 1. عبد الرزاق السنهوري — الوسيط في شرح القانون المدني — الجزء الأول
- Topic: نظرية الالتزام بوجه عام — مصادر الالتزام
- Author: عبد الرزاق السنهوري
- Archive item: https://archive.org/details/9_20250410
- Direct PDF: https://archive.org/download/9_20250410/1-%D9%86%D8%B8%D8%B1%D9%8A%D8%A9-%D8%A7%D9%84%D9%84%D8%AA%D8%B2%D8%A7%D9%85-%D8%A8%D9%88%D8%AC%D9%87-%D8%B9%D8%A7%D9%85-%D9%85%D8%B5%D8%A7%D8%AF%D8%B1-%D8%A7%D9%84%D8%A5%D9%84%D8%AA%D8%B2%D8%A7%D9%85%20%281%29.pdf
- OCR full text: https://archive.org/stream/9_20250410/1-%D9%86%D8%B8%D8%B1%D9%8A%D8%A9-%D8%A7%D9%84%D9%84%D8%AA%D8%B2%D8%A7%D9%85-%D8%A8%D9%88%D8%AC%D9%87-%D8%B9%D8%A7%D9%85-%D9%85%D8%B5%D8%A7%D8%AF%D8%B1-%D8%A7%D9%84%D8%A5%D9%84%D8%AA%D8%B2%D8%A7%D9%85%20%281%29_djvu.txt
- Internet Archive usage label: Attribution-NoDerivs 4.0 International
- LexLearn use: reference/research extraction, attributed; do not republish edited full text.

## 2. عبد الرزاق السنهوري — الوسيط في شرح القانون المدني — الجزء الثاني
- Topic: نظرية الالتزام بوجه عام — الإثبات وآثار الالتزام
- Author: عبد الرزاق السنهوري
- Archive item: https://archive.org/details/9_20250410
- Direct PDF: https://archive.org/download/9_20250410/2-%D9%86%D8%B8%D8%B1%D9%8A%D8%A9-%D8%A7%D9%84%D8%A5%D9%84%D8%AA%D8%B2%D8%A7%D9%85-%D8%A8%D9%88%D8%AC%D9%87-%D8%B9%D8%A7%D9%85-%D8%A7%D9%84%D8%A5%D8%AB%D8%A8%D8%A7%D8%AA-%D8%A2%D8%AB%D8%A7%D8%B1-%D8%A7%D9%84%D8%A5%D9%84%D8%AA%D8%B2%D8%A7%D9%85.pdf
- OCR full text: https://archive.org/stream/9_20250410/2-%D9%86%D8%B8%D8%B1%D9%8A%D8%A9-%D8%A7%D9%84%D8%A5%D9%84%D8%AA%D8%B2%D8%A7%D9%85-%D8%A8%D9%88%D8%AC%D9%87-%D8%B9%D8%A7%D9%85-%D8%A7%D9%84%D8%A5%D8%AB%D8%A8%D8%A7%D8%AA-%D8%A2%D8%AB%D8%A7%D8%B1-%D8%A7%D9%84%D8%A5%D9%84%D8%AA%D8%B2%D8%A7%D9%85_djvu.txt
- Internet Archive usage label: Attribution-NoDerivs 4.0 International
- LexLearn use: reference/research extraction, attributed; do not republish edited full text.

## Candidates requiring rights check before ingestion
These may be publicly viewable/downloadable on third-party sites, but their pages still state copyright is reserved. Do not ingest full text into LexLearn until rights/access are clarified or the user provides a lawfully owned copy.

- يحيى قاسم علي — المدخل لدراسة العلوم القانونية: نظرية القانون ونظرية الحق (1997)
- محمدي فريدة — المدخل للعلوم القانونية: نظرية الحق
- Other contemporary course books found on Noor/Scribd/Telegram

## Retrieval policy
When LexLearn needs source material:
1. Prefer official/public-domain/open-license sources.
2. Keep author/title/source metadata attached to extracted concepts.
3. Do not treat heritage doctrine as current positive law.
4. Compare heritage doctrine against current official legislation before publishing contemporary legal teaching.
5. Do not reproduce substantial passages from a source in student-facing content; generate original educational explanations.

