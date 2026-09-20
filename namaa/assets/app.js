
(function(){
"use strict";

var root=document.getElementById("namaaApp");
var state={
  view:"landing",
  step:0,
  startedAt:null,
  itemStartedAt:null,
  childName:"مريم",
  responses:[],
  signals:[],
  replays:0,
  hints:0,
  lastPositions:[],
  contentStatus:"استكشافي"
};

var CONFIG={
  rapidMs:700,
  slowMs:18000,
  repeatedPositionCount:3,
  evidenceLabels:{low:"منخفضة",medium:"متوسطة",high:"عالية"},
  confidenceLabels:{low:"منخفضة",medium:"متوسطة",high:"مرتفعة"}
};

var activities=[
  {
    id:"T1",kind:"familiar",skill:"التعارف مع الجهاز",
    kicker:"قبل ما نبدأ",title:"جرّب اللمس",help:"اضغط على الشمس الصغيرة.",
    visual:"sunTap"
  },
  {
    id:"T2",kind:"familiar",skill:"التعارف مع الجهاز",
    kicker:"تجربة الصوت",title:"اسمع ثم اختر",help:"اضغط زر الصوت، ثم اختر صورة السمكة.",
    audio:"سمكة",choices:[
      {label:"🐟",aria:"سمكة",correct:true},
      {label:"🍎",aria:"تفاحة"},
      {label:"🚗",aria:"سيارة"}
    ]
  },
  {
    id:"B2-A",kind:"diagnostic",skill:"ربط الحرف بالصوت",hypothesis:"H2",
    kicker:"بيت الأصوات",title:"أي حرف سمعته؟",help:"اسمع الصوت ثم اختر الحرف.",
    audio:"مَ",shape:"سماعي ← بصري",guess:"3 اختيارات (33%)",
    choices:[
      {label:"م",correct:true},{label:"ب"},{label:"س"}
    ],
    intervention:"هنربط الصوت بصورة مألوفة: مَ مثل بداية «موز». وبعدها نجرب بين اختيارين فقط."
  },
  {
    id:"B2-B",kind:"diagnostic",skill:"ربط الحرف بالصوت",hypothesis:"H2",
    kicker:"بيت الأصوات",title:"أي صورة تبدأ بصوت «ب»؟",help:"شاهد الحرف، ثم اختر الصورة.",
    promptLetter:"ب",shape:"بصري ← صورة",guess:"3 اختيارات (33%)",
    choices:[
      {label:"🦆",aria:"بطة",correct:true},{label:"🐟",aria:"سمكة"},{label:"🍌",aria:"موز"}
    ],
    intervention:"نثبت الصوت بكلمة مرتكزة وصورة واحدة، ثم نعيد الاختيار بين صورتين."
  },
  {
    id:"A3",kind:"diagnostic",skill:"الدمج الشفهي",hypothesis:"H6",
    kicker:"جسر المقاطع",title:"اجمع الجزأين",help:"اسمع «سَ» ثم «مَ»، وبعدها اختر الصوت الذي يجمعهما.",
    audioSequence:["سَ","مَ"],shape:"سماعي ← سماعي",guess:"3 اختيارات (33%)",
    choices:[
      {label:"🔊 1",audioChoice:"سَمَ",correct:true},
      {label:"🔊 2",audioChoice:"مَسَ"},
      {label:"🔊 3",audioChoice:"بَسَ"}
    ],
    intervention:"نرجع للدمج الشفهي ببطء: سَ … مَ … ثم نقرب الصوتين تدريجيًا."
  },
  {
    id:"C2",kind:"diagnostic",skill:"الحرف مع الحركة",hypothesis:"H5",
    kicker:"الحرف والحركة",title:"كيف نقرأ هذا المقطع؟",help:"شاهد المقطع ثم اختر صوته.",
    promptLetter:"بُ",shape:"بصري ← سماعي",guess:"3 اختيارات (33%)",
    choices:[
      {label:"🔊 1",audioChoice:"بُ",correct:true},
      {label:"🔊 2",audioChoice:"بَ"},
      {label:"🔊 3",audioChoice:"بِ"}
    ],
    intervention:"نثبت الحرف ونغيّر الحركة فقط: بَ / بِ / بُ، ثم نرجع للمقطع."
  },
  {
    id:"B3",kind:"diagnostic",skill:"تمييز الحروف المتشابهة",hypothesis:"H3",
    kicker:"عينك الشاطرة",title:"اسمع واختر بدقة",help:"اسمع «بَ» ثم اختر الحرف الصحيح بين حروف متشابهة.",
    audio:"بَ",shape:"سماعي ← بصري متشابه",guess:"3 اختيارات (33%)",
    choices:[
      {label:"ب",correct:true},{label:"ت"},{label:"ث"}
    ],
    intervention:"نقارن شكل الحروف بهدوء ونركز على عدد النقاط ومكانها، من غير تغيير ترتيب تدريس المنهج."
  },
  {
    id:"D1",kind:"diagnostic",skill:"فك مقطع مفتوح جديد",hypothesis:"H7",
    kicker:"مقطع جديد",title:"جرّب هذا المقطع",help:"هذا تركيب جديد من حرف وحركة مألوفين في الـDemo. اختر صوته.",
    promptLetter:"سِ",shape:"بصري ← سماعي",guess:"3 اختيارات (33%)",
    choices:[
      {label:"🔊 1",audioChoice:"سِ",correct:true},
      {label:"🔊 2",audioChoice:"سَ"},
      {label:"🔊 3",audioChoice:"مِ"}
    ],
    intervention:"نرجع أولًا لمقطع مألوف بنفس الحرف، ثم نغيّر الحركة ونحاول من جديد."
  }
];

function esc(s){
  return String(s==null?"":s).replace(/[&<>"']/g,function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}

function speak(text){
  if(!("speechSynthesis" in window)){
    announce("الصوت غير متاح في هذا المتصفح.");
    return;
  }
  window.speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text);
  u.lang="ar";
  u.rate=.75;
  window.speechSynthesis.speak(u);
}

function announce(msg){
  var el=document.getElementById("live");
  if(el)el.textContent=msg;
}

function render(){
  if(state.view==="landing") renderLanding();
  else if(state.view==="activity") renderActivity();
  else if(state.view==="finish") renderFinish();
  else if(state.view==="teacher") renderTeacher();
  bindGlobal();
}

function chrome(inner,mode){
  root.innerHTML='<div class="namaa-app"><div class="shell">'+
    '<header class="topbar"><div class="brand"><div class="brand-mark">ن</div><div><b>نماء</b><small>خطوة صغيرة كل يوم</small></div></div>'+
    '<div class="top-actions">'+
      (mode==="teacher"?'<button class="soft-btn" id="childView">عودة لتجربة الطفل</button>':'<button class="teacher-btn" id="teacherView">وضع المعلم</button>')+
    '</div></header>'+inner+
    '<footer class="footer">نموذج تربوي تفاعلي • الصف الأول • القراءة العربية المبكرة<br>المحتوى الحالي استكشافي للعرض، ولا يمثل ترتيب الحروف أو الأسابيع المعتمد في المنهج القطري.</footer>'+
    '<div id="live" aria-live="polite" class="hidden"></div></div></div>';
}

function renderLanding(){
  var html=
  '<section class="hero">'+
    '<div class="hero-copy">'+
      '<span class="eyebrow">🌱 تجربة تأسيسية للصف الأول</span>'+
      '<h1>كل حرف…<br><span>خطوة في الحكاية.</span></h1>'+
      '<p>نماء يساعد الطفل يتدرّب على مهارة واحدة في كل مرة، ويغيّر النشاط عندما يحتاج لطريقة أوضح. لا درجات أمام الطفل، ولا مقارنة، ولا ضغط.</p>'+
      '<div class="hero-actions"><button class="primary-btn" id="startJourney">ابدأ رحلة اليوم</button><button class="secondary-btn" id="openTeacher">شاهد ما يراه المعلم</button></div>'+
      '<div class="hero-note">النسخة الحالية Prototype تربوي. الحروف والأنشطة المستخدمة أمثلة استكشافية إلى أن يُربط المحتوى بالتسلسل الفعلي للمقرر القطري.</div>'+
    '</div>'+
    '<div class="paper-scene" aria-label="رسم توضيحي لطفل يقرأ في طريق إلى بيت الكلمات">'+
      '<div class="scene-sun"></div><div class="scene-cloud">☁</div><div class="scene-hill"></div><div class="scene-path"></div>'+
      '<div class="scene-house"></div><div class="scene-child"><div class="head"></div><div class="body"></div><div class="book"></div></div>'+
      '<div class="scene-label">بيت الكلمات • رحلة قصيرة وهادئة</div>'+
    '</div>'+
  '</section>'+
  '<section class="section"><div class="section-title"><div><h2>رحلة الطفل اليوم</h2><p>أربع محطات فقط. التحليل يجري في الخلفية، والطفل يرى تجربة بسيطة ومفهومة.</p></div></div>'+
    '<div class="journey">'+
      '<div class="journey-stop"><div class="stop-number">1</div><h3>نتعرف على الجهاز</h3><p>نتأكد أن اللمس والصوت والتعليمات مفهومة قبل أن نحسب أي إجابة كدليل تربوي.</p></div>'+
      '<div class="journey-stop"><div class="stop-number">2</div><h3>نسمع ونلاحظ</h3><p>مهام قصيرة بأشكال مختلفة: صوت إلى حرف، وحرف إلى صورة، وتمييز بصري.</p></div>'+
      '<div class="journey-stop"><div class="stop-number">3</div><h3>نجرب بطريقة أخرى</h3><p>لو احتاج الطفل دعمًا، يتغير شكل النشاط بدل تكرار الفشل بالطريقة نفسها.</p></div>'+
      '<div class="journey-stop"><div class="stop-number">4</div><h3>ننهي على نجاح</h3><p>لا Leaderboard ولا Streaks. التقدم مرتبط بالمهارة نفسها، وليس بجمع النقاط.</p></div>'+
    '</div></section>';
  chrome(html,"child");
  document.getElementById("startJourney").onclick=startJourney;
  document.getElementById("openTeacher").onclick=function(){state.view="teacher";render();};
}

function startJourney(){
  state.view="activity";state.step=0;state.startedAt=Date.now();state.responses=[];state.signals=[];state.replays=0;state.hints=0;state.lastPositions=[];
  render();
}

function current(){return activities[state.step];}

function renderActivity(){
  var a=current(), pct=Math.round((state.step/activities.length)*100);
  var visual="";
  if(a.visual==="sunTap"){
    visual='<button class="audio-btn" id="sunTap" aria-label="اضغط الشمس" style="background:var(--sun)">☀️</button>';
  }else{
    if(a.promptLetter) visual+='<div style="text-align:center;font-size:74px;font-weight:900;margin:8px 0 16px">'+esc(a.promptLetter)+'</div>';
    if(a.audio) visual+='<button class="audio-btn" id="mainAudio" aria-label="تشغيل الصوت">🔊</button>';
    if(a.audioSequence) visual+='<button class="audio-btn" id="mainAudio" aria-label="تشغيل الجزأين">🔊</button>';
    if(a.choices){
      visual+='<div class="choice-grid">'+a.choices.map(function(ch,i){
        return '<button class="choice" data-choice="'+i+'" aria-label="'+esc(ch.aria||ch.audioChoice||ch.label)+'"><span>'+esc(ch.label)+'</span>'+(ch.aria?'<small>'+esc(ch.aria)+'</small>':'')+'</button>';
      }).join("")+'</div>';
    }
  }
  var html='<main class="child-screen"><section class="screen-card">'+
    '<div class="progress-row"><div class="progress-track"><span style="width:'+pct+'%"></span></div><div class="progress-text">'+(state.step+1)+' من '+activities.length+'</div></div>'+
    '<div class="activity-kicker">'+esc(a.kicker)+'</div><h1 class="activity-title">'+esc(a.title)+'</h1><div class="activity-help">'+esc(a.help)+'</div>'+
    visual+
    '<div id="feedbackArea"></div>'+
    '<div class="action-row"><button class="hint-btn" id="hintBtn">أحتاج مساعدة</button><div></div></div>'+
  '</section></main>';
  chrome(html,"child");
  state.itemStartedAt=Date.now();
  bindActivity(a);
}

function bindActivity(a){
  if(a.id==="T1"){
    var s=document.getElementById("sunTap");
    s.onclick=function(){record(a,true,0,{familiar:true});advance("جميل! اللمس يعمل تمامًا.");};
    return;
  }
  var main=document.getElementById("mainAudio");
  if(main)main.onclick=function(){
    state.replays++;
    if(a.audioSequence){
      speak(a.audioSequence.join(" ... "));
    }else speak(a.audio);
  };
  document.querySelectorAll("[data-choice]").forEach(function(btn){
    btn.addEventListener("click",function(){
      var idx=Number(btn.getAttribute("data-choice"));
      var ch=a.choices[idx];
      if(ch.audioChoice)speak(ch.audioChoice);
      answerChoice(a,idx,ch);
    });
  });
  var hint=document.getElementById("hintBtn");
  if(hint)hint.onclick=function(){state.hints++;showHint(a);};
}

function answerChoice(a,idx,ch){
  var elapsed=Date.now()-state.itemStartedAt;
  var buttons=Array.from(document.querySelectorAll("[data-choice]"));
  if(elapsed<CONFIG.rapidMs) state.signals.push({code:"F1",item:a.id,label:"استجابة شديدة السرعة"});
  if(elapsed>CONFIG.slowMs) state.signals.push({code:"F2",item:a.id,label:"استجابة بطيئة جدًا"});
  state.lastPositions.push(idx);
  if(state.lastPositions.length>CONFIG.repeatedPositionCount)state.lastPositions.shift();
  if(state.lastPositions.length===CONFIG.repeatedPositionCount && state.lastPositions.every(function(x){return x===idx;})){
    state.signals.push({code:"F3",item:a.id,label:"اختيار متكرر للموقع نفسه"});
  }
  buttons.forEach(function(b){b.disabled=true;});
  if(ch.correct){buttons[idx].classList.add("correct");record(a,true,idx,{});advance("ممتاز! ركزت كويس في الصوت.");}
  else{
    buttons[idx].classList.add("wrong");record(a,false,idx,{});
    showIntervention(a);
  }
}

function record(a,correct,idx,extra){
  state.responses.push({
    id:a.id,skill:a.skill,hypothesis:a.hypothesis||null,kind:a.kind,correct:!!correct,
    choiceIndex:idx,elapsedMs:Date.now()-state.itemStartedAt,shape:a.shape||null,guess:a.guess||null,
    replays:state.replays,hints:state.hints,at:new Date().toISOString(),extra:extra||{}
  });
  state.replays=0;state.hints=0;
}

function advance(msg){
  var area=document.getElementById("feedbackArea");
  if(!area){nextStep();return;}
  area.innerHTML='<div class="feedback good"><b>'+esc(msg)+'</b><br>نكمل خطوة صغيرة كمان؟</div><div class="action-row"><span></span><button class="next-btn" id="nextStep">التالي</button></div>';
  var hint=document.getElementById("hintBtn");if(hint)hint.disabled=true;
  document.getElementById("nextStep").onclick=nextStep;
}

function showIntervention(a){
  var area=document.getElementById("feedbackArea");
  area.innerHTML='<div class="feedback try"><b>نجربها بطريقة أوضح 🌿</b><br>'+esc(a.intervention||"نأخذ مثالًا أبسط ثم نحاول مرة ثانية.")+'</div>'+
    '<div class="mini-stickers"><span class="sticker">بدون خصم نقاط</span><span class="sticker">بدون كلمة «غلط»</span><span class="sticker">النشاط التالي أبسط</span></div>'+
    '<div class="action-row"><span></span><button class="next-btn" id="retryStep">نجرب بطريقة أبسط</button></div>';
  var hint=document.getElementById("hintBtn");if(hint)hint.disabled=true;
  document.getElementById("retryStep").onclick=function(){renderRetry(a);};
}

function retrySpec(a){
  if(a.id==="B2-A")return {title:"اسمع مرة ثانية واختر بين حرفين",audio:"مَ",choices:[{label:"م",correct:true},{label:"س"}]};
  if(a.id==="B2-B")return {title:"أي صورة تبدأ بصوت «ب»؟",prompt:"ب",choices:[{label:"🦆",aria:"بطة",correct:true},{label:"🐟",aria:"سمكة"}]};
  if(a.id==="A3")return {title:"نقرب الصوتين أكثر",audioSequence:["سَ","مَ"],choices:[{label:"🔊 1",audioChoice:"سَمَ",correct:true},{label:"🔊 2",audioChoice:"مَسَ"}]};
  if(a.id==="C2")return {title:"نثبت الحرف ونغيّر الحركة فقط",prompt:"بُ",choices:[{label:"🔊 1",audioChoice:"بُ",correct:true},{label:"🔊 2",audioChoice:"بِ"}]};
  if(a.id==="B3")return {title:"ركز في النقط",audio:"بَ",choices:[{label:"ب",correct:true},{label:"ت"}]};
  if(a.id==="D1")return {title:"نجرب مع اختيارين",prompt:"سِ",choices:[{label:"🔊 1",audioChoice:"سِ",correct:true},{label:"🔊 2",audioChoice:"سَ"}]};
  return {title:"نجرب مثالًا أبسط",choices:[{label:"الأول",correct:true},{label:"الثاني"}]};
}

function renderRetry(a){
  var r=retrySpec(a), area=document.getElementById("feedbackArea");
  var choices='<div class="choice-grid" style="grid-template-columns:repeat(2,1fr);margin-top:14px">'+r.choices.map(function(ch,i){
    return '<button class="choice retry-choice" data-retry="'+i+'" aria-label="'+esc(ch.aria||ch.audioChoice||ch.label)+'"><span>'+esc(ch.label)+'</span>'+(ch.aria?'<small>'+esc(ch.aria)+'</small>':'')+'</button>';
  }).join("")+'</div>';
  area.innerHTML='<div class="feedback try"><b>'+esc(r.title)+'</b>'+(r.prompt?'<div style="font-size:48px;font-weight:900;text-align:center;margin-top:10px">'+esc(r.prompt)+'</div>':'')+
    '<div class="action-row" style="justify-content:center">'+((r.audio||r.audioSequence)?'<button class="hint-btn" id="retryAudio">🔊 اسمع</button>':'')+'</div>'+choices+'</div>';
  var aud=document.getElementById("retryAudio");
  if(aud)aud.onclick=function(){if(r.audioSequence)speak(r.audioSequence.join(" ... "));else speak(r.audio);};
  document.querySelectorAll("[data-retry]").forEach(function(btn){
    btn.onclick=function(){
      var idx=Number(btn.getAttribute("data-retry")),ch=r.choices[idx];
      if(ch.audioChoice)speak(ch.audioChoice);
      document.querySelectorAll("[data-retry]").forEach(function(b){b.disabled=true;});
      if(ch.correct)btn.classList.add("correct");else btn.classList.add("wrong");
      state.responses.push({id:a.id+"-retry",skill:a.skill,hypothesis:a.hypothesis||null,kind:"intervention",correct:!!ch.correct,choiceIndex:idx,shape:"تدخل مبسط",guess:"خياران (50%)",elapsedMs:null,replays:0,hints:1,at:new Date().toISOString()});
      area.insertAdjacentHTML("beforeend",'<div class="feedback good"><b>'+(ch.correct?"أحسنت، كده أوضح 🌱":"تمام، هنسيبها دلوقتي ونرجع لها بطريقة مختلفة لاحقًا.")+'</b></div><div class="action-row"><span></span><button class="next-btn" id="afterRetry">نكمل</button></div>');
      document.getElementById("afterRetry").onclick=nextStep;
    };
  });
}

function showHint(a){
  var area=document.getElementById("feedbackArea");
  area.innerHTML='<div class="feedback try"><b>مساعدة صغيرة:</b> خذ وقتك، واسمع مرة ثانية أو ركّز في شكل الحرف. طلب المساعدة لا يقلل تقدمك.</div>';
  state.signals.push({code:"F7",item:a.id,label:"احتاج تلميحًا أو إعادة توجيه"});
}

function nextStep(){
  state.step++;
  if(state.step>=activities.length){state.view="finish";render();}
  else render();
}

function renderFinish(){
  var correct=state.responses.filter(function(r){return r.kind==="diagnostic"&&r.correct;}).length;
  var total=state.responses.filter(function(r){return r.kind==="diagnostic";}).length;
  var html='<main class="child-screen"><section class="screen-card"><div class="finish-scene">'+
    '<div class="big">🌱</div><h2>رحلة جميلة يا '+esc(state.childName)+'!</h2>'+
    '<p>اليوم سمعت أصواتًا، ولاحظت حروفًا، وجربت مقاطع جديدة. مش مهم كام إجابة كانت صح؛ المهم إننا عرفنا إيه النشاط اللي نجربه بعد كده.</p>'+
    '<div class="garden"><span class="flower">🌼</span><span class="flower">🌿</span><span class="flower">🌷</span><span class="flower">🌱</span></div>'+
    '<div class="hero-actions" style="justify-content:center"><button class="primary-btn" id="restart">ابدأ من جديد</button><button class="secondary-btn" id="seeTeacher">شاهد تقرير المعلم</button></div>'+
    '</div></section></main>';
  chrome(html,"child");
  document.getElementById("restart").onclick=startJourney;
  document.getElementById("seeTeacher").onclick=function(){state.view="teacher";render();};
}

function acceptedResponses(){return state.responses.filter(function(r){return r.kind==="diagnostic";});}

function interactionQuality(){
  var unique={};state.signals.forEach(function(s){unique[s.code+":"+s.item]=s;});
  var arr=Object.keys(unique).map(function(k){return unique[k];});
  if(arr.length>=3)return {level:"low",label:"تحتاج تحققًا",items:arr};
  if(arr.length>=1)return {level:"mid",label:"مقبولة مع ملاحظة",items:arr};
  return {level:"good",label:"جيدة",items:[]};
}

function skillSummary(){
  var r=acceptedResponses();
  var defs=[
    {key:"B2",name:"ربط الحرف بالصوت",ids:["B2-A","B2-B"],hyp:"H2"},
    {key:"A3",name:"الدمج الشفهي",ids:["A3"],hyp:"H6"},
    {key:"C2",name:"الحرف مع الحركة",ids:["C2"],hyp:"H5"},
    {key:"B3",name:"تمييز الحروف المتشابهة",ids:["B3"],hyp:"H3"},
    {key:"D1",name:"فك مقطع مفتوح جديد",ids:["D1"],hyp:"H7"}
  ];
  return defs.map(function(d){
    var rows=r.filter(function(x){return d.ids.indexOf(x.id)>=0;});
    var right=rows.filter(function(x){return x.correct;}).length;
    var evidence=rows.length>=2?"medium":"low";
    var status="لم يُقَس بعد";
    if(rows.length){
      if(right===rows.length)status="في تقدم";
      else status="فرضية أولية";
    }
    return {name:d.name,hyp:d.hyp,count:rows.length,right:right,evidence:evidence,confidence:"low",status:status};
  });
}

function renderTeacher(){
  var quality=interactionQuality(), skills=skillSummary(), r=acceptedResponses();
  var wrong=r.filter(function(x){return !x.correct;});
  var html='<main class="teacher-screen">'+
    '<div class="teacher-head"><div><span class="demo-tag">بيانات Demo • جلسة واحدة فقط</span><h1>لوحة المعلم</h1><p>اللوحة لا تشخّص الطفل ولا تعرض نسبًا توحي بدقة غير موجودة. أقصى ثقة هنا «منخفضة» لأن العرض الحالي جلسة واحدة ولم يحدث تحقق عبر يوم ثانٍ.</p></div>'+
    '<button class="secondary-btn" id="newSession">تشغيل جلسة الطفل</button></div>'+
    '<div class="teacher-grid">'+
      '<section class="panel"><h2>'+esc(state.childName)+' • الصف الأول</h2>'+
        '<div class="teacher-notice"><b>حالة المحتوى:</b> استكشافي للعرض. لم نربط هذه الحروف بأسبوع أو وحدة من المقرر القطري، ولذلك لا يُسجل الفشل كفجوة مقررة.</div>'+
        '<div class="skill-table"><div class="skill-row head"><span>المهارة</span><span>الحالة</span><span>جودة الدليل</span><span>الثقة</span></div>'+
        skills.map(function(s){
          var cls=s.status==="في تقدم"?"good":s.status==="فرضية أولية"?"mid":"low";
          return '<div class="skill-row"><b>'+esc(s.name)+'</b><span class="state '+cls+'">'+esc(s.status)+'</span><span>'+esc(CONFIG.evidenceLabels[s.evidence])+'</span><span>'+esc(CONFIG.confidenceLabels[s.confidence])+'</span></div>';
        }).join("")+'</div>'+
        '<div class="curriculum-box"><b>قاعدة المقرر داخل المحرك</b>المهارة التي لم يؤكد المعلم أنها «دُرست» تبقى استكشافية: نجاحها يثبت معرفة سابقة، وفشلها لا يتحول إلى فجوة.</div>'+
      '</section>'+
      '<aside class="panel"><h3>جودة التفاعل</h3><span class="state '+quality.level+'">'+esc(quality.label)+'</span>'+
        '<p style="color:var(--muted);line-height:1.7">يتم فحص سرعة الاستجابة، طلب المساعدة، الاختيار المتكرر للموقع، ومشكلات الجهاز قبل تفسير الإجابة تربويًا.</p>'+
        '<div class="signal-list">'+(quality.items.length?quality.items.map(function(s){return '<span class="signal">'+esc(s.code)+' • '+esc(s.label)+'</span>';}).join(""):'<span class="signal">لا توجد إشارات مقلقة في هذه الجلسة</span>')+'</div>'+
        '<h3 style="margin-top:22px">تنبيه المعلم</h3><div class="teacher-notice"><b>لا شيء تلقائيًا.</b><br>جلسة واحدة لا تكفي لرفع «يحتاج تدخلًا». أي نمط هنا يظل فرضية أولية فقط.</div>'+
      '</aside>'+
      '<section class="panel"><h3>سجل الأدلة</h3><div class="evidence-list">'+
        (r.length?r.map(function(x){
          return '<div class="evidence-item"><b>'+esc(x.id)+' • '+esc(x.skill)+'</b><small>'+(x.correct?"استجابة صحيحة":"استجابة تحتاج تحققًا")+' • '+esc(x.shape||"—")+' • '+Math.round(x.elapsedMs/100)/10+' ث</small></div>';
        }).join(""):'<div class="teacher-notice">لم تبدأ جلسة الطفل بعد.</div>')+
        '</div></section>'+
      '<aside class="panel"><h3>المعاملات القابلة للمعايرة</h3><div class="params">'+
        '<div class="param"><span>الثقة</span><b>3 مستويات فقط</b></div>'+
        '<div class="param"><span>جودة الدليل</span><b>منخفضة / متوسطة / عالية</b></div>'+
        '<div class="param"><span>الإتقان</span><b>غير محسوم في الـDemo</b></div>'+
        '<div class="param"><span>المراجعة المؤجلة</span><b>تُفعل بعد اعتماد المعايير</b></div>'+
        '</div><div class="teacher-notice"><b>مهم:</b> الأرقام والحدود ليست قواعد علمية ثابتة؛ تُضبط بعد النموذج الورقي والمقارنة بالتقييم البشري.</div></aside>'+
    '</div>'+
  '</main>';
  chrome(html,"teacher");
  document.getElementById("newSession").onclick=startJourney;
}

function bindGlobal(){
  var t=document.getElementById("teacherView");
  if(t)t.onclick=function(){state.view="teacher";render();};
  var c=document.getElementById("childView");
  if(c)c.onclick=function(){state.view="landing";render();};
}

render();
})();