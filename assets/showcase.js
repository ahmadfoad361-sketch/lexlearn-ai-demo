(function(){
"use strict";
var APP=document.getElementById("showcaseApp");
var state={view:"hero",step:0,timer:null,started:null,free:"",scores:{recall:82,understanding:91,application:54,retention:63,exam:68}};
var text64="ينعقد العقد بمجرد ارتباط الإيجاب بالقبول، إذا كان محله وسببه معتبرين قانونًا، وذلك دون إخلال بما يتطلبه القانون من أوضاع خاصة لانعقاد بعض العقود.";
var questions=[
  {k:"استرجاع مباشر",q:"ما العنصر الذي بدأ به النص لانعقاد العقد؟",opts:["ارتباط الإيجاب بالقبول","وقوع ضرر للغير","تحقق إثراء بلا سبب"],a:0},
  {k:"فهم",q:"هل يكفي مجرد الإيجاب والقبول إذا كان المحل غير معتبر قانونًا؟",opts:["لا، لأن النص يربط الانعقاد أيضًا باعتبار المحل والسبب قانونًا","نعم دائمًا","يكفي مرور الزمن"],a:0},
  {k:"تطبيق",q:"إذا اتفق الطرفان على عنصر أساسي لكن اختلفا على عنصر جوهري آخر، فما أول نقطة قانونية يجب فحصها؟",opts:["هل تحقق تطابق الإرادتين على العناصر الجوهرية","الإثراء بلا سبب","المسؤولية عن الأشياء"],a:0}
];
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
function chrome(inner){
  APP.innerHTML='<div class="demoShell"><header class="demoTop"><div class="demoTopIn">'+
  '<div class="demoBrand"><div class="demoLogo">Lx</div><div><b>LexLearn</b><small>Web Summit Qatar 2027 • Guided Demo</small></div></div>'+
  '<div class="demoMeta"><span class="demoPill">Qatar • Sources of Obligations</span><a class="demoGhost" href="index.html">المنتج الكامل ↗</a><a class="demoGhost" href="conference.html">صفحة المؤتمر ↗</a></div>'+
  '</div></header><main class="demoWrap">'+inner+'</main><footer class="demoFooter">Conference prototype • بيانات الأداء المعروضة في النتيجة تجريبية لأغراض العرض وليست بيانات طالب حقيقي</footer></div>';
}
function render(){
  clearTimer();
  if(state.view==="hero")return hero();
  if(state.view==="read")return read();
  if(state.view==="quiz")return quiz();
  if(state.view==="free")return free();
  if(state.view==="result")return result();
  if(state.view==="exam")return exam();
}
function hero(){
  chrome('<section class="demoHero"><div class="demoHeroCopy"><span class="demoEyebrow">3-minute investor demo</span>'+
  '<h1>من نص قانوني…<br><em>إلى قرار تعليمي.</em></h1>'+
  '<p>هذا العرض لا يشرح كل وظائف LexLearn. هو يثبت الفكرة الأساسية بسرعة: طالب يقرأ نصًا قانونيًا، يختفي النص، نقيس ما استرجعه وفهمه وطبقه، ثم نحول النتيجة إلى طريقة مذاكرة وإجابة امتحانية.</p>'+
  '<div class="demoActions"><button class="btn primary" id="startDemo">ابدأ العرض التفاعلي</button><button class="btn secondary" id="jumpResult">انتقل للنتيجة الجاهزة</button></div>'+
  '<div class="demoDisclaimer"><b>مهم:</b> النتيجة الجاهزة في العرض Seeded Demo Data وليست نتيجة طالب حقيقي، والغرض منها إظهار منطق المنتج أمام المستثمر أو الشريك الأكاديمي خلال دقائق.</div>'+
  '</div><div class="demoHeroVisual"><div class="orbit"><div class="core"><div><b>LexLearn</b><small>Measure → Adapt</small></div></div>'+
  '<div class="node n1"><div><b>استرجاع</b><small>هل تذكّر؟</small></div></div><div class="node n2"><div><b>فهم</b><small>هل فهم؟</small></div></div>'+
  '<div class="node n3"><div><b>تطبيق</b><small>هل نقل القاعدة؟</small></div></div><div class="node n4"><div><b>احتفاظ</b><small>هل ثبتت؟</small></div></div>'+
  '</div></div></section>'+
  '<div class="storyStrip"><div class="storyStep"><span>01</span><b>اقرأ</b><small>نص قانوني حقيقي المصدر.</small></div><div class="storyStep"><span>02</span><b>اختفِ</b><small>النص يغلق قبل الأسئلة.</small></div><div class="storyStep"><span>03</span><b>قِس</b><small>استرجاع + فهم + تطبيق.</small></div><div class="storyStep"><span>04</span><b>كيّف</b><small>المسار يتغير حسب الفجوة.</small></div><div class="storyStep"><span>05</span><b>اكتب</b><small>الخلاصة تتحول لإجابة امتحانية.</small></div></div>');
  document.getElementById("startDemo").onclick=function(){state.view="read";state.step=0;render();};
  document.getElementById("jumpResult").onclick=function(){state.view="result";render();};
}
function stage(progress,content){
  chrome('<section class="demoStage"><div class="progress"><i style="width:'+progress+'%"></i></div>'+content+'</section>');
}
function read(){
  var total=24,left=total,start=Date.now();
  stage(12,'<div class="stageCard"><span class="demoEyebrow" style="color:#7a5d2d;background:#fff7e8;border-color:#e3d2ae">المرحلة 1 • اقرأ للفهم</span>'+
  '<h2>المادة 64 — انعقاد العقد</h2><p>اقرأ النص كما لو كنت طالب سنة أولى. بعد لحظات سيختفي.</p>'+
  '<div class="legalPaper"><small>القانون المدني القطري رقم 22 لسنة 2004 — المادة 64</small><div class="txt">'+esc(text64)+'</div></div>'+
  '<div class="timerRow"><div><button class="btn primary" id="finishRead">انتهيت من القراءة</button><div class="feedback" style="max-width:560px">الوقت هنا للعرض فقط. في المنتج الحقيقي يُعاير بحسب طول النص وسلوك القراءة، وليس معيارًا ثابتًا للحفظ.</div></div><div class="timerCircle" id="ring"><b id="num">'+total+'</b></div></div></div>');
  state.timer=setInterval(function(){
    left=Math.max(0,total-Math.floor((Date.now()-start)/1000));
    var n=document.getElementById("num"),r=document.getElementById("ring");
    if(n)n.textContent=left;if(r)r.style.setProperty("--angle",((total-left)/total*360)+"deg");
    if(left<=0){clearTimer();state.view="quiz";state.step=0;render();}
  },250);
  document.getElementById("finishRead").onclick=function(){clearTimer();state.view="quiz";state.step=0;render();};
}
function quiz(){
  var q=questions[state.step],progress=28+state.step*16;
  stage(progress,'<div class="stageCard"><span class="demoEyebrow" style="color:#7a5d2d;background:#fff7e8;border-color:#e3d2ae">المرحلة 2 • '+esc(q.k)+'</span>'+
  '<h2>'+esc(q.q)+'</h2><p>لاحظ إن السؤال يتغير من استرجاع النص إلى فهمه ثم نقله إلى واقعة.</p><div class="choices">'+q.opts.map(function(x,i){return '<button class="choice" data-o="'+i+'">'+esc(x)+'</button>';}).join("")+'</div><div id="feed"></div></div>');
  document.querySelectorAll("[data-o]").forEach(function(b){b.onclick=function(){
    var i=Number(b.dataset.o);document.querySelectorAll("[data-o]").forEach(function(x){x.disabled=true;});
    b.classList.add(i===q.a?"good":"bad");
    document.getElementById("feed").innerHTML='<div class="feedback">'+(i===q.a?"سجلنا أداء جيدًا في هذه الطبقة.":"دي مش نهاية التشخيص؛ الإجابة الواحدة ما تكفيش للحكم.")+'</div><div class="demoActions"><button class="btn primary" id="nextQ">التالي</button></div>';
    document.getElementById("nextQ").onclick=function(){if(state.step<questions.length-1){state.step++;render();}else{state.view="free";render();}};
  };});
}
function free(){
  stage(76,'<div class="stageCard"><span class="demoEyebrow" style="color:#7a5d2d;background:#fff7e8;border-color:#e3d2ae">المرحلة 3 • استرجاع حر</span>'+
  '<h2>اكتب الجملة أو الكلمات القانونية التي بقيت في ذهنك.</h2><p>الهدف مش الإملاء الحرفي؛ بنشوف إيه العناصر اللي ثبتت من غير ما النص يبقى قدامك.</p>'+
  '<textarea class="freeInput" id="freeText" placeholder="مثال: الإيجاب والقبول، المحل، السبب..."></textarea><div class="demoActions"><button class="btn primary" id="seeResult">اعرض النتيجة</button></div></div>');
  document.getElementById("seeResult").onclick=function(){state.free=document.getElementById("freeText").value.trim();state.view="result";render();};
}
function result(){
  var s=state.scores;
  stage(92,'<div class="stageCard"><span class="demoEyebrow" style="color:#7a5d2d;background:#fff7e8;border-color:#e3d2ae">المرحلة 4 • Seeded Demo Result</span>'+
  '<h2>الطالب لا يحتاج “درجة عامة”. يحتاج نعرف أين تتغير طريقة المذاكرة.</h2><p>الأرقام التالية مثال عرض مُعد مسبقًا لإظهار المنطق، وليست بيانات حقيقية لطالب.</p>'+
  '<div class="resultShell"><div class="metrics">'+metric("الاسترجاع",s.recall,"قوي")+metric("الفهم",s.understanding,"قوي")+metric("التطبيق",s.application,"الأولوية الآن")+metric("الاحتفاظ",s.retention,"يحتاج تثبيت")+'</div>'+
  '<div class="planCard"><span class="demoEyebrow">Adaptive action</span><h3>نستخدم الفهم القوي لعلاج التطبيق.</h3><p>بدل إعادة شرح المادة 64، ننتقل مباشرة إلى وقائع قصيرة يتغير فيها عنصر واحد. وبعد الاجتياز، نعيد اختبار التثبيت لاحقًا قبل إغلاق المهارة.</p>'+
  '<div class="planSteps"><div class="planStep"><span class="planNum">1</span><div><b>Change One Fact</b><small>نغير واقعة واحدة ونطلب إعادة التكييف.</small></div></div>'+
  '<div class="planStep"><span class="planNum">2</span><div><b>Case Detective</b><small>يحدد الواقعة التي غيرت الحكم.</small></div></div>'+
  '<div class="planStep"><span class="planNum">3</span><div><b>Delayed Retrieval</b><small>نرجع للمعلومة بعد فترة بدون إعادة عرض النص.</small></div></div></div></div></div>'+
  '<div class="demoActions"><button class="btn primary" id="toExam">شوف كيف تتحول لإجابة امتحانية</button><a class="btn secondary" href="index.html">افتح المنتج الكامل</a></div>'+
  '<div class="demoDisclaimer">في Pilot حقيقي، هذه المؤشرات تُعاير مقابل تقييم بشري وقياس مستقل، ولا تُستخدم وحدها لاتخاذ قرار أكاديمي عالي المخاطر.</div></div>');
  document.getElementById("toExam").onclick=function(){state.view="exam";render();};
}
function metric(name,v,note){return '<div class="metric"><span>'+name+'</span><b>'+v+'%</b><small>'+note+'</small></div>';}
function exam(){
  stage(100,'<div class="stageCard"><span class="demoEyebrow" style="color:#7a5d2d;background:#fff7e8;border-color:#e3d2ae">المرحلة 5 • Exam Answer Builder</span>'+
  '<h2>المذاكرة تنتهي عند القدرة على بناء إجابة، مش عند مشاهدة المحتوى.</h2>'+
  '<div class="examBuild"><div><h3>الخلاصة التي لا تسقط</h3><div class="examSpine">'+
  item(1,"القاعدة","انعقاد العقد بارتباط الإيجاب بالقبول.")+item(2,"الشروط","محل وسبب معتبران قانونًا.")+item(3,"الاستثناء","مراعاة الأوضاع الخاصة التي يطلبها القانون لبعض العقود.")+item(4,"التطبيق","اربط كل شرط بالوقائع المعطاة.")+item(5,"النتيجة","هل انعقد العقد أم لا؟ ولماذا؟")+
  '</div></div><div class="planCard"><span class="demoEyebrow">Why it matters</span><h3>نفس المحتوى، لكن شكل التدريب يتغير حسب الطالب.</h3><p>الطالب القوي في الاسترجاع لا يحتاج إعادة قراءة. الطالب القوي في الفهم وضعيف في الحفظ يحتاج خريطة منطقية ثم تثبيت الكلمات الأساسية. والطالب الضعيف في التطبيق ينتقل لوقائع، لا لمزيد من التعريفات.</p>'+
  '<div class="demoActions"><a class="btn primary" href="index.html">جرّب المنتج الكامل</a><a class="btn secondary" href="conference.html">صفحة المؤتمر</a></div></div></div>'+
  '<div class="demoDisclaimer"><b>الطلب المقترح للشريك:</b> Pilot صغير في مقرر واحد، مع تقييم قبلي/بعدي، مقارنة بشرية للتشخيص، ومراجعة احتفاظ مؤجل قبل أي توسع.</div></div>');
}
function item(n,a,b){return '<div class="examItem"><span class="examNum">'+n+'</span><div><b>'+a+'</b><div style="color:#6a6f77;font-size:12px;margin-top:2px">'+b+'</div></div></div>';}
function clearTimer(){if(state.timer){clearInterval(state.timer);state.timer=null;}}
render();
})();