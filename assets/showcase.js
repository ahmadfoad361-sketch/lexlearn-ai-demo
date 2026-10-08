(function(){
"use strict";
var APP=document.getElementById("showcaseApp");
var qs=new URLSearchParams(location.search),studentSession=null;try{studentSession=JSON.parse(localStorage.getItem("lexlearn_student_session")||"null");}catch(e){}
var COUNTRY=qs.get("country")||(studentSession&&studentSession.country)||"qa";
var SUBJECT=qs.get("subject")||(COUNTRY==="qa"?"rights":"sources");
var COURSE_KEY=COUNTRY+"-"+SUBJECT;
var COUNTRY_LABELS={qa:"قطر",eg:"مصر",sa:"السعودية",ae:"الإمارات",other:"دولة أخرى"};
function countryLabel(){return COUNTRY_LABELS[COUNTRY]||"الدولة المختارة";}
var state={view:"hero",step:0,timer:null,answers:[],free:"",runQuestions:[]};

var text64=COUNTRY==="qa"?"تبدأ شخصية الإنسان بتمام ولادته حيًا، وتنتهي بموته. والحمل المستكن أهل لثبوت الحقوق التي لا يحتاج سببها إلى قبول، وذلك بشرط تمام ولادته حيًا.":"يتم العقد بمجرد أن يتبادل طرفان التعبير عن إرادتين متطابقتين، مع مراعاة ما يقرره القانون من أوضاع خاصة.";

var questions=COUNTRY==="qa"?[
  {type:"recall",q:"متى تبدأ الشخصية القانونية للإنسان وفق النص؟",opts:["بتمام ولادته حيًا","عند سن السابعة","بمجرد الحمل في جميع الحقوق"],a:0},
  {type:"recall",q:"ما الشرط المرتبط بثبوت الحقوق للحمل المستكن في النص؟",opts:["تمام ولادته حيًا","بلوغه 18 سنة","وجود موطن مستقل"],a:0},
  {type:"understanding",q:"هل يعني ثبوت بعض الحقوق للحمل المستكن أنه كامل أهلية الأداء؟",opts:["لا، النص يقرر ثبوت حقوق محددة ولا يجعله كامل أهلية الأداء","نعم في كل التصرفات","نعم إذا كان الحق ماليًا فقط"],a:0},
  {type:"application",q:"وُلد الطفل حيًا بعد أن كان له حق لا يحتاج سببه إلى قبول. ما الفكرة القانونية الأقرب؟",opts:["يمكن أن يثبت له الحق وفق الشرط الوارد بالنص","لا يثبت له أي حق","يصبح شخصًا معنويًا"],a:0},
  {type:"application",q:"إذا لم تتم الولادة حية، ما أثر الشرط المذكور في النص على الحقوق المقصودة؟",opts:["لا يتحقق الشرط الذي علق عليه ثبوتها","تثبت دائمًا بلا شرط","تتحول إلى حقوق شخص معنوي"],a:0}
]:[
  {type:"recall",q:"ما أول عنصر في انعقاد العقد؟",opts:["وقوع ضرر","تطابق الإرادتين","تحقق إثراء"],a:1},
  {type:"understanding",q:"هل تكفي الإرادتان في كل عقد؟",opts:["لا، قد يقرر القانون أوضاعًا خاصة","نعم دائمًا","فقط إذا كان أحدهما تاجرًا"],a:0},
  {type:"application",q:"إذا اشترط القانون شكلًا خاصًا ولم يتحقق، ماذا تفحص؟",opts:["أثر الشكل المطلوب","الضرر فقط","سن الطرفين فقط"],a:0}
];

var arabicNums=["١","٢","٣","٤","٥"];

function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
function clearTimer(){if(state.timer){clearInterval(state.timer);state.timer=null;}}
function shuffle(arr){
  var a=arr.slice();
  for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}
  return a;
}
function prepareQuestions(){
  state.runQuestions=questions.map(function(q){
    var packed=q.opts.map(function(t,i){return {t:t,correct:i===q.a};});
    packed=shuffle(packed);
    return {type:q.type,q:q.q,opts:packed.map(function(x){return x.t;}),a:packed.findIndex(function(x){return x.correct;})};
  });
}
function chrome(inner){
  APP.innerHTML='<div class="demoShell"><header class="demoTop"><div class="demoTopIn">'+
    '<div class="demoBrand"><div class="demoLogo" dir="ltr"><img src="assets/lexlearn-logo.svg" alt="LexLearn"></div><div><b dir="ltr">LexLearn</b><small>تعلم قانوني متكيف</small></div></div>'+
    '<div class="demoMeta"><span class="demoPill">'+countryLabel()+' • '+(COUNTRY==="qa"?"نظرية الحق":"مصادر الالتزام")+'</span><a class="demoGhost" href="showcase-en.html?country=qa&subject=rights">English</a><a class="demoGhost" href="index.html">الرئيسية</a></div>'+
    '</div></header><main class="demoWrap">'+inner+'</main><footer class="demoFooter">LexLearn</footer></div>';
}
function render(){
  clearTimer();
  if(state.view==="hero")return hero();
  if(state.view==="read")return read();
  if(state.view==="quiz")return quiz();
  if(state.view==="neutral")return neutral();
  if(state.view==="free")return free();
  if(state.view==="result")return result();
  if(state.view==="exam")return exam();
}
function hero(){
  chrome('<section class="demoStage demoIntro"><div class="stageCard centered">'+
    '<span class="demoEyebrow">اختبار قصير</span>'+
    '<h2>جرّب بنفسك</h2>'+
    '<p>اقرأ النص القانوني، ثم أجب عن الأسئلة التي تظهر بعد اختفائه.</p>'+
    '<div class="demoActions centeredActions"><button class="btn primary" id="startDemo">ابدأ</button></div>'+
  '</div></section>');
  document.getElementById("startDemo").onclick=function(){
    state.view="read";state.step=0;state.answers=[];state.free="";prepareQuestions();render();
  };
}
function stage(progress,content){chrome('<section class="demoStage"><div class="progress"><i style="width:'+progress+'%"></i></div>'+content+'</section>');}
function read(){
  var total=22,left=total,start=Date.now();
  stage(12,'<div class="stageCard">'+
    '<span class="demoEyebrow">اقرأ النص جيدًا</span>'+
    '<h2>'+(COUNTRY==="qa"?"المادتان ٣٩ و٤٠ — الشخصية القانونية":"قاعدة انعقاد العقد")+'</h2>'+
    '<div class="legalPaper" dir="rtl"><small>'+(COUNTRY==="qa"?"القانون المدني القطري رقم ٢٢ لسنة ٢٠٠٤ — المادتان ٣٩ و٤٠":"نص تدريبي تجريبي")+'</small><div class="txt">'+esc(text64)+'</div></div>'+
    '<div class="timerRow"><button class="btn primary" id="finishRead">انتهيت</button><div class="timerCircle" id="ring"><b id="num">'+total+'</b></div></div>'+
  '</div>');
  state.timer=setInterval(function(){
    left=Math.max(0,total-Math.floor((Date.now()-start)/1000));
    var n=document.getElementById("num"),r=document.getElementById("ring");
    if(n)n.textContent=left;if(r)r.style.setProperty("--angle",((total-left)/total*360)+"deg");
    if(left<=0){clearTimer();state.view="quiz";state.step=0;render();}
  },250);
  document.getElementById("finishRead").onclick=function(){clearTimer();state.view="quiz";state.step=0;render();};
}
function quiz(){
  var q=state.runQuestions[state.step]||questions[state.step],progress=26+state.step*10;
  stage(progress,'<div class="stageCard">'+
    '<span class="demoEyebrow">السؤال '+arabicNums[state.step]+' من ٥</span>'+
    '<h2>'+esc(q.q)+'</h2>'+
    '<div class="choices">'+q.opts.map(function(x,i){return '<button class="choice" data-o="'+i+'">'+esc(x)+'</button>';}).join("")+'</div>'+
  '</div>');
  document.querySelectorAll("[data-o]").forEach(function(b){b.onclick=function(){
    state.answers.push({type:q.type,correct:Number(b.dataset.o)===q.a});
    if(state.step<state.runQuestions.length-1){state.step++;render();}else{state.view="neutral";render();}
  };});
}
function neutral(){
  var opts=shuffle([{t:"■",correct:false},{t:"◆",correct:true},{t:"●",correct:false}]);
  stage(80,'<div class="stageCard"><span class="demoEyebrow">السؤال ٦</span>'+
    '<h2>أكمل النمط: ◆ ● ◆ ● ؟</h2>'+
    '<div class="choices symbolChoices">'+opts.map(function(x,i){return '<button class="choice" data-n="'+i+'">'+x.t+'</button>';}).join("")+'</div>'+
  '</div>');
  document.querySelectorAll("[data-n]").forEach(function(b){b.onclick=function(){state.view="free";render();};});
}
function free(){
  stage(90,'<div class="stageCard"><span class="demoEyebrow">السؤال الأخير</span>'+
    '<h2>اكتب أهم كلمتين أو ثلاث كلمات تتذكرها من النص.</h2>'+
    '<textarea class="freeInput" id="freeText" dir="rtl" placeholder="اكتب ما تتذكره..."></textarea>'+
    '<div class="demoActions"><button class="btn primary" id="seeResult">عرض النتيجة</button></div>'+
  '</div>');
  document.getElementById("seeResult").onclick=function(){state.free=document.getElementById("freeText").value.trim();state.view="result";render();};
}
function pct(type){
  var a=state.answers.filter(function(x){return x.type===type;});
  if(!a.length)return 0;
  return Math.round(a.filter(function(x){return x.correct;}).length/a.length*100);
}
function qualitative(v){if(v>=80)return "قوي";if(v>=45)return "متوسط";return "يحتاج تدريبًا";}
function freeScore(){
  var n=(state.free||"").replace(/[أإآ]/g,"ا").replace(/[ًٌٍَُِّْـ]/g,"");
  var keys=COUNTRY==="qa"?["شخصيه","ولاده","حيا","حمل","مستكن","حقوق"]:["ايجاب","قبول","محل","سبب","العقد"];
  var hits=keys.filter(function(k){return n.indexOf(k)>=0;}).length;
  return Math.min(100,hits*25);
}
function result(){
  var recall=Math.round((pct("recall")+freeScore())/2);
  var understanding=pct("understanding");
  var application=pct("application");
  var arr=[["الاسترجاع",recall,"recall"],["الفهم",understanding,"understanding"],["التطبيق",application,"application"]];
  var weakest=arr.slice().sort(function(a,b){return a[1]-b[1];})[0];
  var rec=weakest[2]==="application"?"ابدأ بوقائع قصيرة يتغير فيها عنصر واحد.":weakest[2]==="understanding"?"ابدأ بتفكيك القاعدة إلى عناصرها ومعناها.":"ابدأ باسترجاع قصير من غير إعادة قراءة النص.";
  var pk=studentSession&&studentSession.studentId?("lexlearn_v9_profile_"+studentSession.studentId):"lexlearn_v9_profile",p={results:{}};
  try{p=JSON.parse(localStorage.getItem(pk)||"{\"results\":{}}")||{results:{}};}catch(e){}
  p.results=p.results||{};
  var gap=recall-understanding,profileType=gap>=12?"recall-led":gap<=-12?"understanding-led":"balanced";
  p.results[COURSE_KEY]={metrics:{recall:recall,understanding:understanding,application:application,legal_precision:null,retention:null,exam:null},profileType:profileType,updatedAt:Date.now()};
  localStorage.setItem(pk,JSON.stringify(p));
  if(studentSession&&studentSession.cloud&&window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()){
    LEX_CLOUD.saveSnapshot({courseId:COURSE_KEY,snapshotType:"profile",state:p}).catch(function(){});
    LEX_CLOUD.logEvent("DIAGNOSTIC_COMPLETED",{course_id:COURSE_KEY,recall:recall,understanding:understanding,application:application,profile_type:profileType}).catch(function(){});
  }
  var trainingQuery=(studentSession&&studentSession.cloud?"":"demo=1&")+"country="+COUNTRY+"&subject="+SUBJECT+"&start=1";
  stage(97,'<div class="stageCard">'+
    '<span class="demoEyebrow">النتيجة</span>'+
    '<h2>نتيجتك في هذه المحاولة</h2>'+
    '<div class="metrics three">'+
      metric("الاسترجاع",recall)+metric("الفهم",understanding)+metric("التطبيق",application)+
    '</div>'+
    '<div class="planCard nextStep"><h3>الخطوة التالية</h3><p>'+esc(rec)+'</p></div>'+
    '<div class="demoActions"><a class="btn primary" style="text-decoration:none" href="program.html?'+trainingQuery+'">ابدأ التدريب المقترح فعليًا</a><button class="btn secondary" id="toExam">سؤال امتحاني</button><button class="btn secondary" id="again">إعادة الاختبار</button></div>'+
  '</div>');
  document.getElementById("toExam").onclick=function(){state.view="exam";render();};
  document.getElementById("again").onclick=function(){state.view="hero";render();};
}
function metric(name,v){return '<div class="metric"><span>'+name+'</span><b>'+qualitative(v)+'</b></div>';}
function exam(){
  stage(100,'<div class="stageCard">'+
    '<span class="demoEyebrow">سؤال امتحاني</span>'+
    '<h2>'+(COUNTRY==="qa"?"اشرح الفرق بين بدء الشخصية القانونية وثبوت بعض الحقوق للحمل المستكن.":"اشرح قاعدة انعقاد العقد.")+'</h2>'+
    '<textarea class="freeInput" id="examText" dir="rtl" placeholder="اكتب إجابتك هنا..."></textarea>'+
    '<div class="demoActions"><button class="btn primary" id="showStructure">راجع عناصر الإجابة</button></div>'+
    '<div id="examStructure"></div>'+
  '</div>');
  document.getElementById("showStructure").onclick=function(){
    document.getElementById("examStructure").innerHTML='<div class="feedback"><b>عناصر الإجابة:</b><br>'+(COUNTRY==="qa"?"بدء الشخصية بالولادة حية ← مركز الحمل المستكن ← نوع الحقوق ← شرط الولادة حية ← النتيجة.":"القاعدة ← الإرادة ← القيود القانونية ← النتيجة.")+'</div>';
  };
}
render();
})();