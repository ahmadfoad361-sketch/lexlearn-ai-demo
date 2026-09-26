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
var taskBank={
  review:{kind:"review",title:"مراجعة بدون إعادة قراءة",q:"أي عنصر كان لازمًا إلى جانب الإيجاب والقبول في المادة 64؟",opts:["المحل والسبب المعتبران قانونًا","وقوع ضرر","مرور سنة"],a:0,skill:"contract",why:"العنصر المقصود هو المحل والسبب المعتبران قانونًا."},
  core:{kind:"core",title:"تمييز المصادر",q:"أي عبارة أدق؟",opts:["كل المصادر إرادية","القانون قد ينشئ الالتزام مباشرة","الفعل الضار عقد"],a:1,skill:"sources",why:"القانون قد يكون مصدرًا مباشرًا للالتزام."},
  apply:{kind:"adaptive",title:"Change One Fact",q:"اتفق الطرفان على كل العناصر، لكن محل العقد غير جائز قانونًا. ما أثر تغيير هذه الواقعة؟",opts:["لا يكفي الاتفاق وحده","ينعقد العقد دائمًا","يصبح المصدر فعلًا ضارًا"],a:0,skill:"apply",why:"تغير المحل القانوني يغيّر نتيجة تحليل الانعقاد."},
  spot:{kind:"adaptive",title:"Case Detective",q:"أي واقعة هي الأهم في تحديد ما إذا كان الاتفاق انعقد كعقد صحيح؟",opts:["لون الورق المستخدم","مشروعية المحل وتطابق الإرادتين","مكان جلوس الطرفين"],a:1,skill:"spot",why:"الواقعة القانونية الحاسمة مرتبطة بالعناصر التي يتطلبها الانعقاد."},
  exam:{kind:"adaptive",title:"بناء الإجابة",q:"أي ترتيب أقرب لإجابة قانونية جيدة عن انعقاد العقد؟",opts:["النتيجة فقط","القاعدة ثم الشروط ثم التطبيق ثم النتيجة","سرد الوقائع بلا قاعدة"],a:1,skill:"exam",why:"الإجابة القانونية تحتاج قاعدة وشروطًا وتطبيقًا ثم نتيجة، لا مجرد النتيجة."},
  understanding:{kind:"adaptive",title:"فهم عناصر القاعدة",q:"لماذا لا يكفي مجرد الإيجاب والقبول دائمًا؟",opts:["لأن النص يربط الانعقاد أيضًا باعتبار المحل والسبب وبالأوضاع الخاصة عند اللزوم","لأن كل عقد يحتاج شاهدين","لأن العقد لا ينعقد إلا بعد سنة"],a:0,skill:"contract",why:"الفهم هنا يقوم على ربط الإيجاب والقبول بباقي شروط النص."},
  recall:{kind:"adaptive",title:"استرجاع العناصر",q:"أي مجموعة تجمع أهم عناصر المادة 64؟",opts:["الإيجاب والقبول + المحل والسبب + الأوضاع الخاصة عند اللزوم","الضرر + الخطأ + السببية","الإثراء + الافتقار فقط"],a:0,skill:"contract",why:"هذه هي العناصر التي وردت في نص المادة 64."},
  retention:{kind:"adaptive",title:"استرجاع مؤجل",q:"من غير الرجوع للنص: ما الاستثناء الذي تحفظه المادة 64 لبعض العقود؟",opts:["مراعاة الأوضاع الخاصة التي يتطلبها القانون","وجوب وجود ضرر","وجوب مرور مدة"],a:0,skill:"contract",why:"النص أبقى على الأوضاع الخاصة التي يتطلبها القانون لبعض العقود.",memory:"اربط الاستثناء بوظيفته: بعض العقود لا يكفي فيها التراضي وحده لأن القانون يفرض شكلًا خاصًا."},
  explainRule:{kind:"adaptive",mode:"free",showText:true,title:"من الحفظ إلى الفهم",q:"اشرح في سطرين: لماذا لا يكفي وجود الإيجاب والقبول وحدهما دائمًا لانعقاد العقد؟",skill:"contract",model:"لأن التراضي عنصر أساسي، لكن صحة الانعقاد ترتبط أيضًا بمشروعية المحل والسبب، وقد يتطلب القانون أوضاعًا خاصة لبعض العقود.",why:"المطلوب هنا ليس ترديد النص؛ المطلوب بيان وظيفة كل عنصر وعلاقته بالنتيجة.",memory:"احفظ المعنى أولًا: تراضٍ + عناصر صحيحة + شكل خاص عند اللزوم."},
  whyContrast:{kind:"adaptive",title:"فهم لا ترديد",q:"اتفق طرفان في حالتين متشابهتين، لكن المحل في الحالة الثانية غير جائز قانونًا. لماذا تختلف النتيجة؟",opts:["لأن صحة المحل جزء من بناء القاعدة وليس تفصيلًا ثانويًا","لأن عدد الأطراف تغيّر","لأن كل اتفاق صحيح بمجرد القبول"],a:0,skill:"apply",why:"الفهم يظهر عندما تعرف أي عنصر يغيّر الحكم ولماذا.",memory:"اربط كل كلمة محفوظة بأثر: إذا اختل المحل تغيّرت نتيجة الانعقاد."},
  memoryAnchor:{kind:"adaptive",title:"من الفهم إلى التثبيت",q:"أي مفتاح ذاكرة يحفظ بنية القاعدة دون فصلها عن معناها؟",opts:["إيجاب/قبول ← محل/سبب ← أوضاع خاصة عند اللزوم","ضرر ← خطأ ← سببية","زمن ← مكان ← شاهد"],a:0,skill:"contract",why:"نحن لا نحفظ فقرة صماء؛ نحفظ هيكلًا ذا معنى يمكن إعادة بناء القاعدة منه.",memory:"مفتاح الذاكرة: تراضٍ → صحة العناصر → شكل خاص عند اللزوم."},
  reconstruct:{kind:"adaptive",mode:"free",title:"استرجاع مع معنى",q:"من ذاكرتك، اكتب 3 مفاتيح فقط تعيد بها بناء قاعدة انعقاد العقد، ثم اكتب بجانب كل مفتاح وظيفته.",skill:"contract",model:"1) الإيجاب والقبول: وجود التراضي. 2) المحل والسبب المعتبران قانونًا: سلامة عناصر العقد. 3) الأوضاع الخاصة عند اللزوم: احترام الشكل الذي يفرضه القانون لبعض العقود.",why:"هذا التدريب يربط الذاكرة بالسبب القانوني، فلا يبقى الحفظ منفصلًا عن الفهم.",memory:"إذا نسيت العبارة الطويلة، استرجع الهيكل ثم أعد بناء الصياغة."}
};
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
var state={view:"home",task:0,answers:[],assessmentAnswers:[],queue:[],course:loadCourse(),diag:diagnostic()};
function save(){if(!DEMO)localStorage.setItem(COURSE_KEY,JSON.stringify(state.course));}
function sessionMeta(n){var idx=Math.max(1,Math.min(25,n))-1;var w=Math.floor(idx/5),d=idx%5;var x=curriculum[w].sessions[d];return {week:w+1,day:d+1,title:x[0],detail:x[1],kind:x[2],weekTitle:curriculum[w].title};}
function weakestDimension(){
  var m=(state.diag&&state.diag.metrics)||{};
  var list=[["recall",m.recall==null?100:m.recall],["understanding",m.understanding==null?100:m.understanding],["application",m.application==null?100:m.application],["retention",m.retention==null?100:m.retention],["exam",m.exam==null?100:m.exam]];
  return list.sort(function(a,b){return a[1]-b[1];})[0][0];
}
function strongestErrorSkill(){
  var es=(state.course.errors||[]).slice().sort(function(a,b){return b.count-a.count;});
  return es.length?es[0].skill:null;
}
function learningBridge(){
  var m=(state.diag&&state.diag.metrics)||{};
  var recall=m.recall==null?50:m.recall,understanding=m.understanding==null?50:m.understanding;
  var gap=recall-understanding;
  if(gap>=12)return {type:"memorizer",title:"من الحفظ إلى الفهم",lead:"ذاكرتك أقوى من تفسيرك للقاعدة. لن نطلب منك حفظًا أكثر؛ سنحوّل ما تحفظه إلى أسباب وعلاقات وتطبيق.",primary:taskBank.explainRule,secondary:taskBank.whyContrast};
  if(gap<=-12)return {type:"understander",title:"من الفهم إلى التثبيت",lead:"فهمك أقوى من سرعة الاسترجاع. سنحوّل المعنى الذي تفهمه إلى مفاتيح ذاكرة قصيرة ثم نسترجعها على فترات.",primary:taskBank.memoryAnchor,secondary:taskBank.reconstruct};
  return {type:"balanced",title:"ربط الفهم بالذاكرة",lead:"سنحافظ على التوازن: استرجاع قصير للقاعدة ثم تفسير أو تطبيق حتى لا يتحول الحفظ إلى ترديد ولا الفهم إلى معرفة يصعب استدعاؤها.",primary:taskBank.memoryAnchor,secondary:taskBank.whyContrast};
}
function buildTrainingQueue(){
  var dim=weakestDimension(),err=strongestErrorSkill(),bridge=learningBridge();
  var adaptive=dim==="application"?taskBank.apply:dim==="understanding"?taskBank.understanding:dim==="recall"?taskBank.recall:dim==="retention"?taskBank.retention:taskBank.exam;
  var errorTask=err==="spot"?taskBank.spot:err==="apply"?taskBank.apply:err==="exam"?taskBank.exam:null;
  var q=[taskBank.review,bridge.primary,taskBank.core,adaptive,bridge.secondary];
  if(errorTask&&q.indexOf(errorTask)===-1)q.push(errorTask);
  return q;
}
function chrome(inner){
  APP.innerHTML='<div class="courseShell"><header class="courseTop"><div class="courseTopIn">'+
    '<div class="brand"><div class="mark">Lx</div><div><b>LexLearn</b><small>برنامج التدريب</small></div></div>'+
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
    '<section class="hero"><div class="heroMain"><span class="kicker">'+(DEMO?'برنامجك':'برنامجك')+'</span>'+
    '<h1>جلسة اليوم '+state.course.session+' من 25</h1><p>'+esc(m.title)+' • '+esc(m.detail)+'</p>'+
    '<div class="heroMeta"><span>≈ 20 دقيقة</span><span>الأسبوع '+m.week+' من 5</span><span>'+kindLabel(m.kind)+'</span></div>'+
    '<div class="choiceRow"><button class="primary" id="startSession">'+(m.kind==="assessment"?"ابدأ تقييم التقدم":"ابدأ جلسة اليوم")+'</button></div></div>'+
    '<div class="heroSide"><h3>أولوية اليوم</h3><p>'+priorityText(metrics)+'</p><div class="notice">ابدأ بالأولوية الحالية، ثم تابع جلسات التدريب بالتدرج.</div></div></section>'+
    bridgeCard(metrics)+
    weekBar(m.week)+
    '<section class="grid"><div class="card">'+sessionCard(m)+'</div><div class="card">'+skillsCard()+'</div></section>'+
    '<section class="grid" style="margin-top:18px"><div class="card">'+errorCard()+'</div><div class="card">'+assessmentCard(metrics)+'</div></section>'
  );
  document.getElementById("startSession").onclick=function(){state.answers=[];state.assessmentAnswers=[];state.task=0;state.queue=buildTrainingQueue();state.view=m.kind==="assessment"?"assessment":"train";render();};
}
function kindLabel(k){return k==="assessment"?"تقييم مستقل":k==="review"?"مراجعة متباعدة":k==="adaptive"?"تدريب متكيف":"تدريب أساسي";}
function priorityText(m){
  var list=[["الاسترجاع",m.recall||0],["الفهم",m.understanding||0],["التطبيق",m.application||0],["الاحتفاظ",m.retention||0],["الصياغة",m.exam||0]].sort(function(a,b){return a[1]-b[1];});
  return "الأولوية الحالية: "+list[0][0]+". الجلسات القادمة ستزيد تدريب هذا الجانب بدون إعادة ما أتقنته بالكامل.";
}
function bridgeCard(m){
  var b=learningBridge();
  return '<section class="bridgePanel"><div class="bridgeHead"><div><span class="kicker">جسر التعلم</span><h2>'+esc(b.title)+'</h2><p>'+esc(b.lead)+'</p></div><div class="bridgeScore"><span>الاسترجاع</span><b>'+Math.round(m.recall||0)+'</b><span>الفهم</span><b>'+Math.round(m.understanding||0)+'</b></div></div><div class="bridgeSteps"><div><b>1</b><span>استرجع</span><small>من الذاكرة قبل فتح النص</small></div><div><b>2</b><span>فسّر</span><small>قل لماذا تعمل القاعدة هكذا</small></div><div><b>3</b><span>طبّق</span><small>غيّر واقعة واحدة واختبر النتيجة</small></div><div><b>4</b><span>ثبّت</span><small>مفتاح ذاكرة مرتبط بالمعنى</small></div></div></section>';
}
function weekBar(current){
  return '<div class="weekBar">'+curriculum.map(function(w){var cls=w.week<current?"done":w.week===current?"current":"";return '<div class="week '+cls+'"><b>الأسبوع '+w.week+'</b><small>'+esc(w.title)+'</small></div>';}).join("")+'</div>';
}
function sessionCard(m){
  var bridge=learningBridge();
  var items=m.kind==="assessment"?
    [["بنك أسئلة مستقل","assess"],["لا توجد تغذية راجعة أثناء التقييم","assess"],["النتيجة تظهر بعد النهاية","assess"]]:
    [["استرجاع من الذاكرة","review"],[bridge.title,"adapt"],["هدف المقرر اليوم","core"],["تدريب على نقطة الضعف","adapt"],["فحص خفيف للنهاية","core"]];
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
  return '<h3>سجل ملاحظات الأداء</h3><p>تظهر هنا الأخطاء التي تكررت في محاولاتك السابقة.</p>'+(es.length?es.map(function(e){return '<div class="errorItem"><b>'+esc(e.label)+'</b><span>تكرر '+e.count+' مرة</span></div>';}).join(""):'<div class="notice">لا توجد أخطاء متكررة مسجلة بعد.</div>');
}
function assessmentCard(m){
  return '<h3>التقييم المستقل</h3><p>كل خامس جلسة، ثم تقييم نهائي في الجلسة 25.</p><div class="resultGrid">'+metric("استرجاع",m.recall)+metric("فهم",m.understanding)+metric("تطبيق",m.application)+'</div>';
}
function qualitative(v){if(v==null)return "لم يُقَس";if(v>=80)return "إجابات صحيحة في أغلب المهام";if(v>=45)return "نتائج متباينة";return "صعوبة متكررة";}
function metric(n,v){return '<div class="metric"><span>'+n+'</span><b>'+qualitative(v)+'</b><small>من محاولاتك الحالية</small></div>';}

function train(){
  var q=state.queue.length?state.queue:buildTrainingQueue(),t=q[state.task%q.length];
  var input=t.mode==="free"?
    '<textarea class="textarea" id="freeAnswer" placeholder="اكتب إجابتك بطريقتك..."></textarea><div class="choiceRow"><button class="primary" id="checkFree">قارن إجابتي</button></div>':
    '<div class="options">'+t.opts.map(function(o,i){return '<button class="option" data-a="'+i+'">'+esc(o)+'</button>';}).join("")+'</div>';
  chrome('<section class="stage"><div class="progress"><i style="width:'+((state.task+1)/q.length*100)+'%"></i></div><div class="taskCard">'+
    '<span class="kicker">'+esc(kindLabel(t.kind))+' • '+(state.task+1)+' / '+q.length+'</span><h2>'+esc(t.title)+'</h2>'+
    (t.showText?'<div class="legalBox"><small>النص القانوني</small><div>'+esc(TEXT64)+'</div></div>':'')+
    '<p>'+esc(t.q)+'</p>'+input+'<div id="feed"></div></div></section>');
  if(t.mode==="free"){
    document.getElementById("checkFree").onclick=function(){
      var answer=(document.getElementById("freeAnswer").value||"").trim();
      if(!answer){document.getElementById("feed").innerHTML='<div class="notice">اكتب محاولة قصيرة أولًا؛ الهدف أن تُخرج المعنى من ذاكرتك قبل رؤية النموذج.</div>';return;}
      document.getElementById("freeAnswer").disabled=true;document.getElementById("checkFree").disabled=true;
      document.getElementById("feed").innerHTML='<div class="modelAnswer"><b>نموذج للمقارنة</b><p>'+esc(t.model)+'</p></div><div class="feedback">'+esc(t.why)+'</div>'+(t.memory?'<div class="memoryAnchor"><b>مرساة الذاكرة</b><span>'+esc(t.memory)+'</span></div>':'')+'<div class="choiceRow"><button class="primary" id="freeGood">إجابتي قريبة</button><button class="secondary" id="freeRetry">أحتاج تدريبًا أكثر</button></div>';
      document.getElementById("freeGood").onclick=function(){completeTask(t,true,q);};
      document.getElementById("freeRetry").onclick=function(){completeTask(t,false,q);};
    };
  }else{
    document.querySelectorAll("[data-a]").forEach(function(b){b.onclick=function(){
      var i=Number(b.dataset.a),correct=i===t.a;
      document.querySelectorAll("[data-a]").forEach(function(x){x.disabled=true;});b.classList.add(correct?"good":"bad");
      document.getElementById("feed").innerHTML='<div class="feedback">'+esc(t.why)+'</div>'+(t.memory?'<div class="memoryAnchor"><b>مرساة الذاكرة</b><span>'+esc(t.memory)+'</span></div>':'')+'<div class="choiceRow"><button class="primary" id="nextTask">'+(state.task<q.length-1?"التالي":"إنهاء الجلسة")+'</button></div>';
      document.getElementById("nextTask").onclick=function(){completeTask(t,correct,q);};
    };});
  }
}
function completeTask(t,correct,q){
  state.answers.push({skill:t.skill,correct:correct,bridge:learningBridge().type});
  if(!correct)addError(t.skill,errorLabel(t.skill));
  if(state.task<q.length-1){state.task++;render();}else finishTraining();
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
  var correct=state.answers.filter(function(x){return x.correct;}).length,total=state.answers.length||1,p=Math.round(correct/total*100),sessionDesc=correct>=Math.ceil(total*.75)?"أغلب المهام أُنجزت بنجاح":correct>=Math.ceil(total*.4)?"أداء متباين داخل الجلسة":"ظهرت حاجة لمزيد من التثبيت";
  chrome('<section class="stage"><div class="taskCard"><span class="kicker">جلسة مكتملة</span><h2>خلصت جلسة اليوم</h2>'+
    '<div class="resultGrid"><div class="metric"><span>أداء الجلسة</span><b>'+sessionDesc+'</b><small>ملخص الجلسة</small></div><div class="metric"><span>عدد المهام</span><b>'+total+'</b></div><div class="metric"><span>الجلسة القادمة</span><b>'+state.course.session+'</b></div></div>'+
    '<div class="notice">سيُستخدم أداؤك لاختيار التدريب التالي.</div>'+
    '<div class="choiceRow"><button class="primary" id="backHome">العودة للبرنامج</button></div></div></section>');
  document.getElementById("backHome").onclick=function(){state.view="home";render();};
}
function assessment(){
  var q=assessmentBank[state.task%assessmentBank.length];
  chrome('<section class="stage"><div class="progress"><i style="width:'+((state.task+1)/assessmentBank.length*100)+'%"></i></div><div class="taskCard">'+
    '<span class="kicker">تقييم التقدم • '+(state.task+1)+' / '+assessmentBank.length+'</span><h2>'+esc(q.q)+'</h2>'+
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
  var decision="تم حفظ نتيجة تقييم التقدم وتحديث جلساتك التالية.";
  chrome('<section class="stage"><div class="taskCard"><span class="kicker">نتيجة التقييم المستقل</span><h2>'+qualitative(p)+'</h2>'+
    '<p>'+esc(decision)+'</p><div class="notice">تابع البرنامج للانتقال إلى الجلسة التالية.</div>'+
    '<div class="choiceRow"><button class="primary" id="backHome">العودة للبرنامج</button></div></div></section>');
  document.getElementById("backHome").onclick=function(){state.view="home";render();};
}
render();
})();