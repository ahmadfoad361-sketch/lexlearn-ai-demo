(function(){
"use strict";
var APP=document.getElementById("programApp");
var qs=new URLSearchParams(location.search);
var DEMO=qs.get("demo")==="1";
var COUNTRY=qs.get("country")||"qa";
var SUBJECT=qs.get("subject")||"sources";
var PROFILE_KEY="lexlearn_v9_profile";
var COURSE_KEY="lexlearn_course_v1_"+COUNTRY+"_"+SUBJECT;
var TEXT64="ينعقد العقد بمجرد ارتباط الإيجاب بالقبول، إذا كان محله وسببه معتبرين قانونًا، وذلك دون إخلال بما يتطلبه القانون من أوضاع خاصة لانعقاد بعض العقود.";
var curriculum=[
  {week:1,title:"الأساس القانوني",sessions:[
    ["بداية المقرر","العقد: القاعدة والعناصر","core"],["العقد","تمييز الإيجاب والقبول","core"],["العقد","المحل والسبب","core"],["العقد","الأوضاع الخاصة","adaptive"],["تقييم التقدم 1","بنك مستقل","assessment"]
  ]},
  {week:2,title:"تمييز المصادر",sessions:[
    ["مراجعة متباعدة","العقد بعد تأخير","review"],["مصادر الالتزام","العقد أم مصدر آخر؟","core"],["تمييز المصادر","Change One Fact","adaptive"],["تطبيق","Case Detective","adaptive"],["تقييم التقدم 2","بنك مستقل","assessment"]
  ]},
  {week:3,title:"التطبيق",sessions:[
    ["وقائع","اكتشاف القاعدة","core"],["وقائع","العنصر الحاسم","adaptive"],["وقائع","تغيير عنصر واحد","adaptive"],["مراجعة قديمة","Retrieval Mix","review"],["تقييم التقدم 3","بنك مستقل","assessment"]
  ]},
  {week:4,title:"المسائل المختلطة",sessions:[
    ["مسألة مركبة","مصدر + عناصر","core"],["مسألة مركبة","استبعاد البدائل","adaptive"],["مسألة مركبة","تعليل النتيجة","adaptive"],["مراجعة متباعدة","مهارات سابقة","review"],["تقييم التقدم 4","بنك مستقل","assessment"]
  ]},
  {week:5,title:"الأداء الامتحاني",sessions:[
    ["إجابة قصيرة","قاعدة → تطبيق","core"],["إجابة منظمة","شروط → أثر","core"],["سؤال مختلط","اختيار الهيكل","adaptive"],["Mock قصير","إجابة كاملة","adaptive"],["التقييم النهائي","بنك مستقل","assessment"]
  ]}
];
var skills=[
  {id:"contract",name:"انعقاد العقد",state:"stable"},
  {id:"sources",name:"تمييز مصادر الالتزام",state:"learning"},
  {id:"spot",name:"التقاط العنصر الحاسم",state:"learning"},
  {id:"apply",name:"التطبيق على الوقائع",state:"learning"},
  {id:"exam",name:"بناء الإجابة القانونية",state:"new"}
];
var training=[
  {kind:"review",title:"مراجعة بدون إعادة قراءة",q:"أي عنصر كان لازمًا إلى جانب الإيجاب والقبول في المادة 64؟",opts:["المحل والسبب المعتبران قانونًا","وقوع ضرر","مرور سنة"],a:0,skill:"contract",why:"العنصر المقصود هو المحل والسبب المعتبران قانونًا."},
  {kind:"adaptive",title:"Change One Fact",q:"اتفق الطرفان على كل العناصر، لكن محل العقد غير جائز قانونًا. ما أثر تغيير هذه الواقعة؟",opts:["لا يكفي الاتفاق وحده","ينعقد العقد دائمًا","يصبح المصدر فعلًا ضارًا"],a:0,skill:"apply",why:"تغير المحل القانوني يغيّر نتيجة تحليل الانعقاد."},
  {kind:"adaptive",title:"Case Detective",q:"أي واقعة هي الأهم في تحديد ما إذا كان الاتفاق انعقد كعقد صحيح؟",opts:["لون الورق المستخدم","مشروعية المحل وتطابق الإرادتين","مكان جلوس الطرفين"],a:1,skill:"spot",why:"الواقعة القانونية الحاسمة مرتبطة بالعناصر التي يتطلبها الانعقاد."},
  {kind:"core",title:"تثبيت قصير",q:"أي عبارة أدق؟",opts:["كل المصادر إرادية","القانون قد ينشئ الالتزام مباشرة","الفعل الضار عقد"],a:1,skill:"sources",why:"القانون قد يكون مصدرًا مباشرًا للالتزام."}
];
var assessmentBank=[
  {q:"عرض شخص بيع شيء وقبل الآخر، لكن القانون يمنع التعامل في هذا الشيء. ما المشكلة الأساسية؟",opts:["المحل","الإيجاب","مرور الزمن"],a:0,skill:"apply"},
  {q:"أي موقف يختبر وجود تطابق إرادتين أكثر من غيره؟",opts:["طرفان اتفقا على العناصر الجوهرية","شخص أتلف مال غيره","شخص أثرى بلا سبب"],a:0,skill:"sources"},
  {q:"أي وصف أقرب للقانون كمصدر للالتزام؟",opts:["لا ينشئ التزامًا إلا بعقد","قد ينشئ الالتزام مباشرة","هو دائمًا فعل ضار"],a:1,skill:"sources"},
  {q:"في سؤال امتحاني عن انعقاد العقد، ما الهيكل الأنسب؟",opts:["النتيجة فقط","القاعدة ثم الشروط ثم التطبيق ثم النتيجة","سرد الوقائع فقط"],a:1,skill:"exam"}
];

function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
function loadProfile(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY))||{results:{}};}catch(e){return {results:{}};}}
function diagnostic(){
  if(DEMO)return {metrics:{recall:82,understanding:88,application:58,retention:64,exam:55}};
  var p=loadProfile(),k=COUNTRY+"-"+SUBJECT;return p.results&&p.results[k]?p.results[k]:null;
}
function defaultCourse(){return {session:DEMO?7:1,started:true,completed:[],errors:DEMO?[{skill:"apply",label:"يخلط بين وجود الاتفاق وصحة المحل",count:2},{skill:"spot",label:"لا يلتقط الواقعة الحاسمة بسرعة",count:1}]:[],history:[],lastAssessment:null};}
function loadCourse(){try{return JSON.parse(localStorage.getItem(COURSE_KEY))||defaultCourse();}catch(e){return defaultCourse();}}
var state={view:"home",task:0,answers:[],assessmentAnswers:[],course:loadCourse(),diag:diagnostic()};
function save(){if(!DEMO)localStorage.setItem(COURSE_KEY,JSON.stringify(state.course));}
function sessionMeta(n){var idx=Math.max(1,Math.min(25,n))-1;var w=Math.floor(idx/5),d=idx%5;var x=curriculum[w].sessions[d];return {week:w+1,day:d+1,title:x[0],detail:x[1],kind:x[2],weekTitle:curriculum[w].title};}
function chrome(inner){
  APP.innerHTML='<div class="courseShell"><header class="courseTop"><div class="courseTopIn">'+
    '<div class="brand"><div class="mark">Lx</div><div><b>LexLearn</b><small>برنامج مصادر الالتزام</small></div></div>'+
    '<div class="topActions"><a class="topBtn" href="showcase.html">الديمو التشخيصي</a><a class="topBtn" href="index.html">الرئيسية</a></div>'+
  '</div></header><main class="courseWrap">'+inner+'</main></div>';
}
function render(){
  if(state.view==="home")return home();
  if(state.view==="train")return train();
  if(state.view==="sessionResult")return sessionResult();
  if(state.view==="assessment")return assessment();
  if(state.view==="assessmentResult")return assessmentResult();
}
function home(){
  var m=sessionMeta(state.course.session),d=state.diag;
  if(!d&&!DEMO){
    chrome('<section class="hero"><div class="heroMain"><span class="kicker">برنامج التدريب</span><h1>مصادر الالتزام</h1><p>البرنامج يحتاج تقييم بداية حتى يبني أول جلسة على أدائك الحقيقي.</p><div class="choiceRow"><a class="primary" style="text-decoration:none" href="index.html">ابدأ تقييم البداية</a></div></div><div class="heroSide"><h3>التقييم مستقل</h3><p>يمكنك إجراء التقييم فقط والخروج، أو العودة بعده وبدء البرنامج.</p></div></section>');
    return;
  }
  var metrics=d?d.metrics:{recall:0,understanding:0,application:0,retention:0,exam:0};
  chrome(
    '<section class="hero"><div class="heroMain"><span class="kicker">'+(DEMO?'وضع العرض • بيانات تجريبية':'برنامجك الحالي')+'</span>'+
    '<h1>جلسة اليوم '+state.course.session+' من 25</h1><p>'+esc(m.title)+' • '+esc(m.detail)+'</p>'+
    '<div class="heroMeta"><span>≈ 20 دقيقة</span><span>الأسبوع '+m.week+' من 5</span><span>'+kindLabel(m.kind)+'</span></div>'+
    '<div class="choiceRow"><button class="primary" id="startSession">'+(m.kind==="assessment"?"ابدأ تقييم التقدم":"ابدأ جلسة اليوم")+'</button></div></div>'+
    '<div class="heroSide"><h3>أولوية اليوم</h3><p>'+priorityText(metrics)+'</p><div class="notice">التقييمات الأسبوعية منفصلة عن التدريب ولا تستخدم نفس أسئلة الجلسات.</div></div></section>'+
    weekBar(m.week)+
    '<section class="grid"><div class="card">'+sessionCard(m)+'</div><div class="card">'+skillsCard()+'</div></section>'+
    '<section class="grid" style="margin-top:18px"><div class="card">'+errorCard()+'</div><div class="card">'+assessmentCard(metrics)+'</div></section>'
  );
  document.getElementById("startSession").onclick=function(){state.answers=[];state.assessmentAnswers=[];state.task=0;state.view=m.kind==="assessment"?"assessment":"train";render();};
}
function kindLabel(k){return k==="assessment"?"تقييم مستقل":k==="review"?"مراجعة متباعدة":k==="adaptive"?"تدريب متكيف":"تدريب أساسي";}
function priorityText(m){
  var list=[["الاسترجاع",m.recall||0],["الفهم",m.understanding||0],["التطبيق",m.application||0],["الاحتفاظ",m.retention||0],["الصياغة",m.exam||0]].sort(function(a,b){return a[1]-b[1];});
  return "الأولوية الحالية: "+list[0][0]+". الجلسات القادمة ستزيد تدريب هذا الجانب بدون إعادة ما أتقنته بالكامل.";
}
function weekBar(current){
  return '<div class="weekBar">'+curriculum.map(function(w){var cls=w.week<current?"done":w.week===current?"current":"";return '<div class="week '+cls+'"><b>الأسبوع '+w.week+'</b><small>'+esc(w.title)+'</small></div>';}).join("")+'</div>';
}
function sessionCard(m){
  var items=m.kind==="assessment"?
    [["بنك أسئلة مستقل","assess"],["لا توجد تغذية راجعة أثناء التقييم","assess"],["النتيجة تظهر بعد النهاية","assess"]]:
    [["استرجاع قديم مستحق","review"],["هدف المقرر اليوم","core"],["تدريب على نقطة الضعف","adapt"],["فحص خفيف للنهاية","core"]];
  return '<div class="sessionHead"><div><h2>'+esc(m.title)+'</h2><p>'+esc(m.detail)+'</p></div><div class="sessionNum">'+String(state.course.session).padStart(2,"0")+'</div></div>'+
    '<div class="sessionPlan">'+items.map(function(x,i){return '<div class="planItem"><span class="dot">'+(i+1)+'</span><div><b>'+esc(x[0])+'</b></div><span class="badge '+x[1]+'">'+badgeLabel(x[1])+'</span></div>';}).join("")+'</div>';
}
function badgeLabel(x){return x==="review"?"مراجعة":x==="adapt"?"متكيف":x==="assess"?"تقييم":"أساسي";}
function skillsCard(){
  return '<h3>حالة المهارات</h3><p>الحالة تتغير من أكثر من محاولة، وليس من سؤال واحد.</p><div class="skillList">'+skills.map(function(s){return '<div class="skill"><div><b>'+esc(s.name)+'</b><small>'+stateArabic(s.state)+'</small></div><span class="state '+s.state+'">'+stateArabic(s.state)+'</span></div>';}).join("")+'</div>';
}
function stateArabic(s){return s==="stable"?"مستقرة":s==="retained"?"مثبتة":s==="learning"?"قيد التدريب":"جديدة";}
function errorCard(){
  var es=state.course.errors||[];
  return '<h3>ذاكرة الأخطاء</h3><p>تُستخدم لتكوين أسئلة لاحقة مختلفة، لا لإعادة السؤال نفسه.</p>'+(es.length?es.map(function(e){return '<div class="errorItem"><b>'+esc(e.label)+'</b><span>تكرر '+e.count+' مرة</span></div>';}).join(""):'<div class="notice">لا توجد أخطاء متكررة مسجلة بعد.</div>');
}
function assessmentCard(m){
  return '<h3>التقييم المستقل</h3><p>كل خامس جلسة، ثم تقييم نهائي في الجلسة 25.</p><div class="resultGrid">'+metric("استرجاع",m.recall)+metric("فهم",m.understanding)+metric("تطبيق",m.application)+'</div>';
}
function metric(n,v){return '<div class="metric"><span>'+n+'</span><b>'+(v==null?"—":Math.round(v)+"%")+'</b></div>';}

function train(){
  var t=training[state.task%training.length];
  chrome('<section class="stage"><div class="progress"><i style="width:'+((state.task+1)/training.length*100)+'%"></i></div><div class="taskCard">'+
    '<span class="kicker">'+esc(kindLabel(t.kind))+'</span><h2>'+esc(t.title)+'</h2>'+
    (state.task===0?'<div class="legalBox"><small>تذكير بالسياق القانوني — لا يُستخدم في التقييم المستقل</small><div>'+esc(TEXT64)+'</div></div>':'')+
    '<p>'+esc(t.q)+'</p><div class="options">'+t.opts.map(function(o,i){return '<button class="option" data-a="'+i+'">'+esc(o)+'</button>';}).join("")+'</div><div id="feed"></div></div></section>');
  document.querySelectorAll("[data-a]").forEach(function(b){b.onclick=function(){
    var i=Number(b.dataset.a),correct=i===t.a;state.answers.push({skill:t.skill,correct:correct});
    document.querySelectorAll("[data-a]").forEach(function(x){x.disabled=true;});b.classList.add(correct?"good":"bad");
    if(!correct)addError(t.skill,errorLabel(t.skill));
    document.getElementById("feed").innerHTML='<div class="feedback">'+esc(t.why)+'</div><div class="choiceRow"><button class="primary" id="nextTask">'+(state.task<training.length-1?"التالي":"إنهاء الجلسة")+'</button></div>';
    document.getElementById("nextTask").onclick=function(){if(state.task<training.length-1){state.task++;render();}else{finishTraining();}};
  };});
}
function errorLabel(skill){var map={apply:"يحتاج نقل القاعدة إلى الواقعة بدقة",spot:"لا يلتقط العنصر الحاسم",sources:"يخلط بين مصادر الالتزام",contract:"يسقط عنصرًا من شروط الانعقاد",exam:"هيكل الإجابة غير مكتمل"};return map[skill]||"خطأ متكرر"; }
function addError(skill,label){
  var e=state.course.errors.find(function(x){return x.skill===skill;});if(e)e.count++;else state.course.errors.push({skill:skill,label:label,count:1});
}
function finishTraining(){
  state.course.history.push({session:state.course.session,type:"training",answers:state.answers,ts:Date.now()});
  state.course.completed.push(state.course.session);
  state.course.session=Math.min(25,state.course.session+1);save();state.view="sessionResult";render();
}
function sessionResult(){
  var correct=state.answers.filter(function(x){return x.correct;}).length,total=state.answers.length||1,p=Math.round(correct/total*100);
  chrome('<section class="stage"><div class="taskCard"><span class="kicker">جلسة مكتملة</span><h2>خلصت جلسة اليوم</h2>'+
    '<div class="resultGrid">'+metric("أداء الجلسة",p)+metric("أسئلة",total)+metric("جلسة قادمة",state.course.session)+'</div>'+
    '<div class="notice">هذه ليست درجة تقييم رسمي. نتيجة الجلسة تستخدم فقط لاختيار التدريب التالي.</div>'+
    '<div class="choiceRow"><button class="primary" id="backHome">العودة للبرنامج</button></div></div></section>');
  document.getElementById("backHome").onclick=function(){state.view="home";render();};
}
function assessment(){
  var q=assessmentBank[state.task%assessmentBank.length];
  chrome('<section class="stage"><div class="progress"><i style="width:'+((state.task+1)/assessmentBank.length*100)+'%"></i></div><div class="taskCard">'+
    '<span class="kicker">تقييم تقدم مستقل • '+(state.task+1)+' / '+assessmentBank.length+'</span><h2>'+esc(q.q)+'</h2>'+
    '<div class="options">'+q.opts.map(function(o,i){return '<button class="option" data-a="'+i+'">'+esc(o)+'</button>';}).join("")+'</div></div></section>');
  document.querySelectorAll("[data-a]").forEach(function(b){b.onclick=function(){
    state.assessmentAnswers.push({skill:q.skill,correct:Number(b.dataset.a)===q.a});if(state.task<assessmentBank.length-1){state.task++;render();}else finishAssessment();
  };});
}
function finishAssessment(){
  var a=state.assessmentAnswers,c=a.filter(function(x){return x.correct;}).length,p=Math.round(c/(a.length||1)*100);
  state.course.lastAssessment={session:state.course.session,score:p,ts:Date.now()};
  state.course.history.push({session:state.course.session,type:"assessment",score:p,answers:a,ts:Date.now()});
  state.course.completed.push(state.course.session);state.course.session=Math.min(25,state.course.session+1);save();state.view="assessmentResult";render();
}
function assessmentResult(){
  var p=state.course.lastAssessment?state.course.lastAssessment.score:0;
  var decision=p>=85?"ترقية طبيعية مع تقليل التكرار":p>=70?"استمرار مع إبقاء بعض المهارات في المراجعة":"جلسات تثبيت إضافية قبل زيادة الصعوبة";
  chrome('<section class="stage"><div class="taskCard"><span class="kicker">نتيجة التقييم المستقل</span><h2>'+p+'%</h2>'+
    '<p>'+esc(decision)+'</p><div class="notice">القرار هنا خاص بالـPilot. العتبات ستُراجع مع المختص التربوي وبيانات التجربة.</div>'+
    '<div class="choiceRow"><button class="primary" id="backHome">العودة للبرنامج</button></div></div></section>');
  document.getElementById("backHome").onclick=function(){state.view="home";render();};
}
render();
})();