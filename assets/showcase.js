(function(){
"use strict";
var APP=document.getElementById("showcaseApp");
var state={view:"hero",step:0,timer:null,answers:[],free:"",neutralDone:false};
var text64="ينعقد العقد بمجرد ارتباط الإيجاب بالقبول، إذا كان محله وسببه معتبرين قانونًا، وذلك دون إخلال بما يتطلبه القانون من أوضاع خاصة لانعقاد بعض العقود.";
var questions=[
  {type:"recall",label:"1 / 5",q:"ما أول عنصر ذكره النص لانعقاد العقد؟",opts:["وقوع ضرر","ارتباط الإيجاب بالقبول","تحقق إثراء بلا سبب"],a:1},
  {type:"recall",label:"2 / 5",q:"إلى جانب الإيجاب والقبول، ماذا اشترط النص؟",opts:["وجود شاهدين دائمًا","مرور مدة زمنية","أن يكون المحل والسبب معتبرين قانونًا"],a:2},
  {type:"understanding",label:"3 / 5",q:"هل كل عقد ينعقد بمجرد الإيجاب والقبول مهما كان نوعه؟",opts:["لا، فقد يتطلب القانون أوضاعًا خاصة لبعض العقود","نعم، بلا استثناء","فقط إذا كان أحد الطرفين تاجرًا"],a:0},
  {type:"application",label:"4 / 5",q:"اتفق شخصان على بيع شيء لا يجيز القانون التعامل فيه. هل يكفي تطابق الإرادتين؟",opts:["نعم، لأن الإرادتين تطابقتا","لا، لأن اعتبار المحل قانونًا ما زال لازمًا","نعم إذا كان الثمن معلومًا"],a:1},
  {type:"application",label:"5 / 5",q:"اتفق الطرفان، لكن القانون يشترط شكلًا خاصًا لهذا النوع من العقود ولم يلتزما به. أي إجابة أدق؟",opts:["العقد صحيح دائمًا بمجرد الاتفاق","يكفي أن يكون السبب مشروعًا فقط","يجب مراعاة الشكل الخاص الذي يتطلبه القانون"],a:2}
];
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
function clearTimer(){if(state.timer){clearInterval(state.timer);state.timer=null;}}
function chrome(inner){
  APP.innerHTML='<div class="demoShell"><header class="demoTop"><div class="demoTopIn">'+
  '<div class="demoBrand"><div class="demoLogo">Lx</div><div><b>LexLearn</b><small>Interactive Demo</small></div></div>'+
  '<div class="demoMeta"><span class="demoPill">قطر • مصادر الالتزام</span><a class="demoGhost" href="index.html">المنتج الكامل ↗</a></div>'+
  '</div></header><main class="demoWrap">'+inner+'</main><footer class="demoFooter">LexLearn • Interactive prototype</footer></div>';
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
  chrome('<section class="demoStage" style="margin-top:8vh"><div class="stageCard" style="text-align:center">'+
    '<span class="demoEyebrow" style="color:#7a5d2d;background:#fff7e8;border-color:#e3d2ae">ديمو سريع • 3 دقائق</span>'+
    '<h2 style="margin-top:18px">جرّب الاختبار بنفسك</h2>'+
    '<p style="max-width:580px;margin:0 auto">هتشوف نصًا قانونيًا لفترة قصيرة. بعدها هيختفي وتبدأ الأسئلة.</p>'+
    '<div class="demoActions" style="justify-content:center"><button class="btn primary" id="startDemo">ابدأ</button></div>'+
  '</div></section>');
  document.getElementById("startDemo").onclick=function(){state.view="read";state.step=0;state.answers=[];state.free="";render();};
}
function stage(progress,content){chrome('<section class="demoStage"><div class="progress"><i style="width:'+progress+'%"></i></div>'+content+'</section>');}
function read(){
  var total=22,left=total,start=Date.now();
  stage(12,'<div class="stageCard">'+
    '<span class="demoEyebrow" style="color:#7a5d2d;background:#fff7e8;border-color:#e3d2ae">اقرأ النص</span>'+
    '<h2>المادة 64 — انعقاد العقد</h2>'+
    '<div class="legalPaper"><small>القانون المدني القطري رقم 22 لسنة 2004 — المادة 64</small><div class="txt">'+esc(text64)+'</div></div>'+
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
  var q=questions[state.step],progress=26+state.step*10;
  stage(progress,'<div class="stageCard"><span class="demoEyebrow" style="color:#7a5d2d;background:#fff7e8;border-color:#e3d2ae">'+q.label+'</span>'+
    '<h2>'+esc(q.q)+'</h2>'+
    '<div class="choices">'+q.opts.map(function(x,i){return '<button class="choice" data-o="'+i+'">'+esc(x)+'</button>';}).join("")+'</div>'+
  '</div>');
  document.querySelectorAll("[data-o]").forEach(function(b){b.onclick=function(){
    state.answers.push({type:q.type,correct:Number(b.dataset.o)===q.a});
    if(state.step<questions.length-1){state.step++;render();}else{state.view="neutral";render();}
  };});
}
function neutral(){
  stage(78,'<div class="stageCard"><span class="demoEyebrow" style="color:#7a5d2d;background:#fff7e8;border-color:#e3d2ae">سؤال سريع</span>'+
    '<h2>أكمل النمط: ◆ ● ◆ ● ؟</h2>'+
    '<div class="choices"><button class="choice" data-n="0">■</button><button class="choice" data-n="1">◆</button><button class="choice" data-n="2">●</button></div>'+
  '</div>');
  document.querySelectorAll("[data-n]").forEach(function(b){b.onclick=function(){state.neutralDone=true;state.view="free";render();};});
}
function free(){
  stage(88,'<div class="stageCard"><span class="demoEyebrow" style="color:#7a5d2d;background:#fff7e8;border-color:#e3d2ae">آخر سؤال</span>'+
    '<h2>اكتب أهم كلمتين أو ثلاث كلمات تتذكرها من النص.</h2>'+
    '<textarea class="freeInput" id="freeText" placeholder="اكتب ما تتذكره..."></textarea>'+
    '<div class="demoActions"><button class="btn primary" id="seeResult">النتيجة</button></div>'+
  '</div>');
  document.getElementById("seeResult").onclick=function(){state.free=document.getElementById("freeText").value.trim();state.view="result";render();};
}
function pct(type){
  var a=state.answers.filter(function(x){return x.type===type;});
  if(!a.length)return 0;
  return Math.round(a.filter(function(x){return x.correct;}).length/a.length*100);
}
function freeScore(){
  var n=(state.free||"").replace(/[أإآ]/g,"ا").replace(/[ًٌٍَُِّْـ]/g,"");
  var keys=["ايجاب","قبول","محل","سبب","اوضاع","خاصه","العقد"];
  var hits=keys.filter(function(k){return n.indexOf(k)>=0;}).length;
  return Math.min(100,hits*25);
}
function result(){
  var recall=Math.round((pct("recall")+freeScore())/2);
  var understanding=pct("understanding");
  var application=pct("application");
  var vals={recall:recall,understanding:understanding,application:application};
  var arr=[["الاسترجاع",recall,"recall"],["الفهم",understanding,"understanding"],["التطبيق",application,"application"]];
  var weakest=arr.slice().sort(function(a,b){return a[1]-b[1];})[0];
  var rec=weakest[2]==="application"?"وقائع قصيرة وتغيير عنصر واحد":weakest[2]==="understanding"?"تفكيك القاعدة إلى عناصر ومعنى": "استرجاع قصير بدون إعادة قراءة";
  stage(96,'<div class="stageCard">'+
    '<span class="demoEyebrow" style="color:#7a5d2d;background:#fff7e8;border-color:#e3d2ae">نتيجتك في الديمو</span>'+
    '<h2>أداءك في هذه المحاولة</h2>'+
    '<div class="metrics">'+
      metric("الاسترجاع",recall)+metric("الفهم",understanding)+metric("التطبيق",application)+
      '<div class="metric"><span>الاحتفاظ بعد فترة</span><b>—</b><small>يُقاس لاحقًا</small></div>'+
    '</div>'+
    '<div class="planCard" style="margin-top:16px"><h3>الخطوة التالية</h3><p>'+esc(rec)+'</p></div>'+
    '<div class="demoActions"><button class="btn primary" id="toExam">جرّب سؤال الامتحان</button><button class="btn secondary" id="again">أعد الديمو</button></div>'+
  '</div>');
  document.getElementById("toExam").onclick=function(){state.view="exam";render();};
  document.getElementById("again").onclick=function(){state.view="hero";render();};
}
function metric(name,v){return '<div class="metric"><span>'+name+'</span><b>'+v+'%</b></div>';}
function exam(){
  stage(100,'<div class="stageCard"><span class="demoEyebrow" style="color:#7a5d2d;background:#fff7e8;border-color:#e3d2ae">سؤال امتحاني</span>'+
    '<h2>اشرح متى ينعقد العقد وفقًا للمادة 64.</h2>'+
    '<textarea class="freeInput" id="examText" placeholder="اكتب إجابتك هنا..."></textarea>'+
    '<div class="demoActions"><button class="btn primary" id="showStructure">اعرض الهيكل</button></div>'+
    '<div id="examStructure"></div>'+
  '</div>');
  document.getElementById("showStructure").onclick=function(){
    document.getElementById("examStructure").innerHTML='<div class="feedback"><b>الهيكل:</b> القاعدة → الإيجاب والقبول → المحل والسبب → الشكل الخاص إن اشترطه القانون → النتيجة.</div>';
  };
}
render();
})();