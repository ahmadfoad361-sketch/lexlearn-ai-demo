(function(){
"use strict";
var D=window.LEX_V9_CONTENT;
var APP=document.getElementById("lawApp");
var KEY="lexlearn_v9_profile";
var STOP=["في","من","على","إلى","الى","عن","أن","ان","ما","هو","هي","أو","او","مع","إذا","اذا","كان","كانت","هذا","هذه","الذي","التي","ثم","كل","وفق","وفقا","طبقًا","طبقا"];
var state={
  view:"country",countryId:null,subjectId:null,
  diagnostic:null, timer:null, timerStartedAt:null,
  distractorAnswers:[], profile:loadProfile()
};
function loadProfile(){try{return JSON.parse(localStorage.getItem(KEY))||{results:{},retention:{}};}catch(e){return {results:{},retention:{}};}}
function saveProfile(){localStorage.setItem(KEY,JSON.stringify(state.profile));}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c];});}
function norm(v){return String(v||"").toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[ًٌٍَُِّْـ]/g,"").replace(/[^\u0600-\u06FFa-z0-9 ]/gi," ").replace(/\s+/g," ").trim();}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function qualitativeIndicator(v){
  if(v==null)return "لم يُقَس بعد";
  if(v>=80)return "ظهرت إجابات صحيحة في أغلب المهام";
  if(v>=45)return "ظهرت نتائج متباينة";
  return "ظهرت صعوبة متكررة";
}
function country(){return D.countries.find(function(c){return c.id===state.countryId;})||null;}
function subject(){var c=country();return c?(c.subjects||[]).find(function(s){return s.id===state.subjectId;})||null:null;}
function resultKey(){return state.countryId+"-"+state.subjectId;}
function currentResult(){return state.profile.results[resultKey()]||null;}
function icon(name){
  var paths={
    rights:'<circle cx="32" cy="32" r="25"/><path d="M32 14v34M20 22h24M16 22l-7 13h14L16 22Zm32 0-7 13h14L48 22ZM20 49h24"/>',
    sources:'<path d="M15 12h25l9 9v31H15z"/><path d="M40 12v10h9M22 30h20M22 37h20M22 44h14"/>',
    effects:'<circle cx="22" cy="32" r="10"/><circle cx="44" cy="32" r="10"/><path d="M32 32h2M12 48h40M32 14v9"/>',
    test:'<path d="M18 10h28v44H18z"/><path d="M25 23h14M25 31h14M25 39h8"/><path d="m40 43 4 4 8-10"/>',
    plan:'<circle cx="19" cy="18" r="5"/><circle cx="45" cy="18" r="5"/><circle cx="32" cy="47" r="5"/><path d="M24 20l16 0M22 23l8 19M42 23l-8 19"/>',
    learn:'<path d="M10 18c8-5 15-5 22 0v32c-7-5-14-5-22 0zM54 18c-8-5-15-5-22 0v32c7-5 14-5 22 0z"/>',
    train:'<path d="M12 47h40M18 41l8-9 8 5 12-15"/><circle cx="46" cy="22" r="4"/>',
    exam:'<path d="M15 12h34v40H15z"/><path d="M23 22h18M23 30h18M23 38h10"/><path d="M42 41l4 4 7-9"/>',
    archive:'<path d="M11 17h42v35H11zM8 11h48v8H8z"/><path d="M25 28h14"/>',
    home:'<path d="M11 31 32 13l21 18v22H39V39H25v14H11z"/>'
  };
  return '<svg viewBox="0 0 64 64" aria-hidden="true">'+(paths[name]||paths.home)+'</svg>';
}
function clearTimer(){if(state.timer){clearInterval(state.timer);state.timer=null;}}
function chrome(inner){
  var res=currentResult();
  var metrics=res?res.metrics:{recall:null,understanding:null,application:null,retention:null,exam:null};
  var labels=[["recall","استرجاع"],["understanding","فهم"],["application","تطبيق"],["retention","احتفاظ"],["exam","صياغة"]];
  APP.innerHTML='<div class="v9-shell"><header class="v9-top"><div class="v9-topin">'+
    '<div class="v9-brand"><div class="v9-mark">Lx</div><div><b>LexLearn</b><small>دراسة القانون بطريقة تناسب أداءك</small></div></div>'+
    '<div class="v9-topactions">'+
      (state.countryId?'<button class="v9-topbtn" id="changeCountry">🌍 <span>'+esc(country().short)+'</span></button>':'')+
      (state.subjectId?'<button class="v9-topbtn" id="changeSubject">§ <span>'+esc(subject().title)+'</span></button>':'')+
      ''+
    '</div></div></header>'+
    '<main class="v9-app">'+
    ((state.countryId&&state.subjectId)?'<div class="stat-strip">'+labels.map(function(x){var v=metrics[x[0]];return '<div class="stat-pill"><b>'+x[1]+'</b><span>'+qualitativeIndicator(v)+'</span></div>';}).join("")+'</div>':'')+
    inner+'</main><footer class="footer">LexLearn • Prototype بحثي وتدريبي • النتائج الحالية استكشافية وليست درجات معيارية</footer></div>';
  bindChrome();
}
function bindChrome(){
  var a=document.getElementById("changeCountry");if(a)a.onclick=function(){clearTimer();state.view="country";state.countryId=null;state.subjectId=null;render();};
  var b=document.getElementById("changeSubject");if(b)b.onclick=function(){clearTimer();state.view="subjects";state.subjectId=null;render();};

}
function render(){clearTimer();
  if(state.view==="country")return renderCountry();
  if(state.view==="subjects")return renderSubjects();
  if(state.view==="hub")return renderHub();
  if(state.view==="diagnostic")return renderDiagnostic();
  if(state.view==="results")return renderResults();
  if(state.view==="plan")return renderPlan();
  if(state.view==="learn")return renderLearn();
  if(state.view==="train")return renderTrain();
  if(state.view==="exam")return renderExam();
  if(state.view==="archive")return renderArchive();
}
function renderCountry(){
  var html='<section class="entry-screen">'+
    '<div class="entry-intro"><div class="entry-seal">Lx</div><span class="section-overline">LEXLEARN</span>'+
    '<h1>اختر النظام القانوني</h1>'+
    '<p>ابدأ من الدولة التي تدرس قانونها. المحتوى والأسئلة والنتائج منفصلة تمامًا بين مصر وقطر.</p></div>'+
    '<div class="entry-options">'+D.countries.map(function(c,i){return '<button class="entry-option" data-country="'+c.id+'">'+
      '<span class="entry-flag">'+c.flag+'</span>'+
      '<span class="entry-copy"><b>'+esc(c.name)+'</b><small>'+esc(c.subtitle)+'</small></span>'+
      '<span class="entry-arrow">←</span>'+
    '</button>';}).join("")+'</div>'+
    '<div class="entry-note">اختيار واحد فقط الآن — وبعده تظهر المواد المتاحة.</div>'+
    '</section>';
  chrome(html);
  document.querySelectorAll("[data-country]").forEach(function(btn){btn.onclick=function(){state.countryId=btn.dataset.country;state.view="subjects";render();};});
}
function renderSubjects(){
  var c=country();
  var html='<section class="subject-hero"><div><span class="section-overline">'+c.flag+' '+esc(c.name)+'</span><h1>اختر المادة التي تريد أن تبدأ بها.</h1><p>'+esc(c.sourceNote)+'</p></div><button class="btn soft-outline" id="backCountry">تغيير الدولة</button></section>'+
  '<div class="subject-gallery">'+c.subjects.map(function(s,i){return '<button class="subject-card" data-subject="'+s.id+'"><span class="subject-number">0'+(i+1)+'</span><span class="subject-medallion">'+icon(s.icon)+'</span><span class="subject-copy"><b>'+esc(s.title)+'</b><small>'+esc(s.subtitle)+'</small></span><span class="subject-open">ابدأ ←</span></button>';}).join("")+'</div>';
  chrome(html);
  document.getElementById("backCountry").onclick=function(){state.view="country";state.countryId=null;render();};
  document.querySelectorAll("[data-subject]").forEach(function(btn){btn.onclick=function(){state.subjectId=btn.dataset.subject;state.view="hub";render();};});
}
function dueRetention(){
  var q=state.profile.retention[resultKey()];return q&&q.dueAt&&Date.now()>=q.dueAt&&!q.completed?q:null;
}
function renderHub(){
  var s=subject(),res=currentResult(),due=dueRetention(),trainingReady=s.id==="sources";
  var html='<section class="workspace-head"><div><span class="section-overline">'+esc(country().name)+' / '+esc(s.title)+'</span><h1>'+esc(s.title)+'</h1><p>'+esc(s.subtitle)+'</p></div></section>'+
  (due?'<div class="premium-alert"><div><b>مراجعة تثبيت مستحقة</b><span>يمكنك إكمالها ضمن التقييم أو البرنامج.</span></div><button class="btn premium-primary" id="retentionNow">ابدأ المراجعة</button></div>':'')+
  '<section class="path-choice-grid">'+
    '<button class="path-choice-card" id="assessmentOnly"><span class="path-choice-index">01</span><span class="path-choice-icon">'+icon("test")+'</span><span class="path-choice-copy"><b>قيّم مستواي</b><small>تقييم مستقل للمادة. تحصل على النتيجة ويمكنك التوقف هنا.</small></span><span class="path-choice-arrow">←</span></button>'+
    (trainingReady?
      '<button class="path-choice-card training" id="trainingProgram"><span class="path-choice-index">02</span><span class="path-choice-icon">'+icon("plan")+'</span><span class="path-choice-copy"><b>برنامج التدريب</b><small>'+(res?'تصور برنامج تدريبي لاحق مبني على نتيجتك الحالية — Prototype غير مُعتمد بعد.':'نموذج للمرحلة التالية بعد التحقق من صلاحية التشخيص في Pilot 0.')+'</small></span><span class="path-choice-arrow">←</span></button>':
      '<div class="path-choice-card disabled"><span class="path-choice-index">02</span><span class="path-choice-icon">'+icon("plan")+'</span><span class="path-choice-copy"><b>برنامج التدريب</b><small>المحرك التجريبي الكامل متاح حاليًا في مادة مصادر الالتزام.</small></span></div>')+
  '</section>'+
  (res?'<div class="path-result-note"><b>لديك تقييم سابق لهذه المادة.</b><span>يمكنك إعادة التقييم، أو استخدام النتيجة الحالية لبدء التدريب.</span></div>':'');
  chrome(html);
  document.getElementById("assessmentOnly").onclick=startDiagnostic;
  var tr=document.getElementById("trainingProgram");
  if(tr)tr.onclick=function(){
    if(res){window.location.href="program.html?country="+encodeURIComponent(state.countryId)+"&subject="+encodeURIComponent(state.subjectId);}
    else{startDiagnostic();}
  };
  var rt=document.getElementById("retentionNow");if(rt)rt.onclick=startRetention;
}
function words(text){return norm(text).split(" ").filter(Boolean).length;}
function readingSeconds(text){return clamp(Math.round((words(text)/145)*60*1.35),18,75);}
function startDiagnostic(){
  var a=subject().diagnostic.anchor;
  state.diagnostic={stage:"anchorRead",memoryIndex:0,delayedIndex:0,recallMCQ:null,recallFree:"",understanding:null,application:null,memoryReadTimes:[],delayedCorrect:0,distractorIndex:0,startedAt:Date.now(),anchorReadSeconds:null,retentionMode:false};
  state.view="diagnostic";render();
}
function startRetention(){
  state.diagnostic={stage:"delayedRecall",memoryIndex:0,delayedIndex:0,recallMCQ:null,recallFree:"",understanding:null,application:null,memoryReadTimes:[],delayedCorrect:0,distractorIndex:0,startedAt:Date.now(),anchorReadSeconds:null,retentionMode:true};
  state.view="diagnostic";render();
}
function diagnosticProgress(d){
  var order={anchorRead:8,recallMCQ:16,recallFree:24,understand:34,apply:44,memoryRead:55,distractor:68,delayedRecall:82,finish:100};
  if(d.stage==="memoryRead")return 45+Math.round((d.memoryIndex/5)*18);
  if(d.stage==="distractor")return 64+Math.round((d.distractorIndex/3)*10);
  if(d.stage==="delayedRecall")return 75+Math.round((d.delayedIndex/5)*22);
  return order[d.stage]||5;
}
function renderDiagnostic(){
  var d=state.diagnostic;if(!d){state.view="hub";return render();}
  var pct=diagnosticProgress(d);
  var html='<div class="stage"><div class="stage-head"><div class="meta">'+esc(country().name)+' • '+esc(subject().title)+(d.retentionMode?' • مراجعة تثبيت':' • التشخيص الكامل')+'</div><button class="btn ghost" id="quitTest">خروج</button></div>'+
    '<div class="stage-progress"><i style="width:'+pct+'%"></i></div><div id="stageBody"></div></div>';
  chrome(html);
  document.getElementById("quitTest").onclick=function(){clearTimer();state.view="hub";render();};
  renderDiagnosticStage();
}
function setStageBody(x){document.getElementById("stageBody").innerHTML=x;}
function renderDiagnosticStage(){
  var d=state.diagnostic,a=subject().diagnostic.anchor;
  if(d.stage==="anchorRead")return renderReading(a.text,a.title,a.sourceLabel,function(sec){d.anchorReadSeconds=sec;d.stage="recallMCQ";renderDiagnostic();});
  if(d.stage==="recallMCQ")return renderQuestion("من غير ما ترجع للنص",a.recallQuestion,a.recallOptions,function(score){d.recallMCQ=score;d.stage="recallFree";renderDiagnostic();});
  if(d.stage==="recallFree")return renderFreeRecall();
  if(d.stage==="understand")return renderQuestion("هل فهمت الفكرة؟",a.understandQuestion,a.understandOptions,function(score){d.understanding=score;d.stage="apply";renderDiagnostic();});
  if(d.stage==="apply")return renderQuestion("غيّر الواقعة",a.applyQuestion,a.applyOptions,function(score){d.application=score;d.stage="memoryRead";d.memoryIndex=0;renderDiagnostic();});
  if(d.stage==="memoryRead")return renderMemoryRead();
  if(d.stage==="distractor")return renderDistractor();
  if(d.stage==="delayedRecall")return renderDelayedRecall();
}
function renderReading(text,title,source,done){
  var seconds=readingSeconds(text),left=seconds,start=Date.now();
  setStageBody('<section class="focus-panel" style="margin-top:18px"><span class="eyebrow">اقرأ للفهم — مش مطلوب تحفظ حرفيًا</span><h2>'+esc(title)+'</h2>'+
  '<div class="reading-box"><div class="source">'+esc(source||"نص تدريبي")+'</div><div class="legal-text">'+esc(text)+'</div></div>'+
  '<div class="timer-row"><div><button class="btn primary" id="doneReading">انتهيت من القراءة</button><p style="font-size:12px;color:var(--muted)">الوقت محسوب من طول النص بمعامل أولي قابل للمعايرة، وليس معيارًا نفسيًا ثابتًا.</p></div><div class="timer-ring" id="timerRing"><b id="timerNum">'+seconds+'</b></div></div></section>');
  function tick(){
    left=Math.max(0,seconds-Math.floor((Date.now()-start)/1000));
    var num=document.getElementById("timerNum"),ring=document.getElementById("timerRing");
    if(num)num.textContent=left;
    if(ring)ring.style.setProperty("--angle",((seconds-left)/seconds*360)+"deg");
    if(left<=0){clearTimer();done(seconds);}
  }
  state.timer=setInterval(tick,250);tick();
  document.getElementById("doneReading").onclick=function(){var used=Math.max(1,Math.round((Date.now()-start)/1000));clearTimer();done(used);};
}
function renderQuestion(kicker,q,opts,done){
  setStageBody('<section class="focus-panel" style="margin-top:18px"><span class="eyebrow">'+esc(kicker)+'</span><h2>'+esc(q)+'</h2><div class="choices">'+opts.map(function(o,i){return '<button class="choice" data-q="'+i+'">'+esc(o.t)+'</button>';}).join("")+'</div><div id="qFeed"></div></section>');
  document.querySelectorAll("[data-q]").forEach(function(b){b.onclick=function(){var i=Number(b.dataset.q);document.querySelectorAll("[data-q]").forEach(function(x){x.disabled=true;x.classList.remove("selected");});b.classList.add(opts[i].s?"good":"bad");document.getElementById("qFeed").innerHTML='<div class="memory-strip"><span class="memory-chip">'+(opts[i].s?"سجلنا الإجابة ونكمل.":"مش هنحكم من سؤال واحد — نكمل عشان نشوف النمط.")+'</span></div><button class="btn primary" id="qNext">التالي</button>';document.getElementById("qNext").onclick=function(){done(opts[i].s?100:0);};};});
}
function keyTermsFromCorrect(){
  var a=subject().diagnostic.anchor,o=a.recallOptions.find(function(x){return x.s;});
  var list=norm(o?o.t:a.text).split(" ").filter(function(w){return w.length>3&&STOP.indexOf(w)<0;});
  return Array.from(new Set(list)).slice(0,8);
}
function renderFreeRecall(){
  var d=state.diagnostic;
  setStageBody('<section class="focus-panel" style="margin-top:18px"><span class="eyebrow">استرجاع حر</span><h2>اكتب أي عبارة أو كلمتين قانونيتين تتذكرهما من النص.</h2><p>مش مطلوب صياغة نموذجية. الهدف نشوف إيه اللي فضل حاضر بعد اختفاء النص.</p><textarea id="freeRecall" style="width:100%;min-height:130px;border:1px solid var(--line);border-radius:16px;padding:14px;font:inherit"></textarea><div class="timer-row"><button class="btn primary" id="freeNext">سجل وكمل</button><button class="btn ghost" id="dontRemember">مش فاكر</button></div></section>');
  document.getElementById("freeNext").onclick=function(){d.recallFree=document.getElementById("freeRecall").value.trim();d.stage="understand";renderDiagnostic();};
  document.getElementById("dontRemember").onclick=function(){d.recallFree="";d.stage="understand";renderDiagnostic();};
}
function renderMemoryRead(){
  var d=state.diagnostic,set=subject().diagnostic.memorySet;
  if(d.memoryIndex>=set.length){d.stage="distractor";d.distractorIndex=0;return renderDiagnostic();}
  var item=set[d.memoryIndex];
  renderReading(item.text,(d.memoryIndex+1)+" / "+set.length+" — "+item.label,item.source||"مادة/تعريف تدريبي",function(sec){d.memoryReadTimes.push(sec);d.memoryIndex++;renderDiagnostic();});
}
var distractors=[
  {q:"أكمل النمط: ◆ ● ◆ ● ؟",opts:["◆","●","■"],answer:0},
  {q:"اختر المجموعة المطابقة تمامًا: △ ○ □",opts:["△ ○ □","△ □ ○","○ △ □"],answer:0},
  {q:"أي رمز مختلف عن الباقي؟",opts:["◇","◇","◆"],answer:2}
];
function renderDistractor(){
  var d=state.diagnostic;
  if(d.distractorIndex>=distractors.length){d.stage="delayedRecall";d.delayedIndex=0;return renderDiagnostic();}
  var x=distractors[d.distractorIndex];
  setStageBody('<section class="focus-panel" style="margin-top:18px"><span class="eyebrow">مهمة فاصلة — لا تدخل في تقييم الذكاء</span><h2>'+esc(x.q)+'</h2><p>الغرض فقط إنك ما تفضلش تكرر النصوص القانونية في ذهنك باستمرار.</p><div class="choices">'+x.opts.map(function(o,i){return '<button class="choice" data-d="'+i+'" style="text-align:center;font-size:24px">'+esc(o)+'</button>';}).join("")+'</div></section>');
  document.querySelectorAll("[data-d]").forEach(function(b){b.onclick=function(){state.distractorAnswers.push(Number(b.dataset.d)===x.answer);d.distractorIndex++;renderDiagnostic();};});
}
function delayedOptions(index){
  var set=subject().diagnostic.memorySet,correct=set[index].key;
  return [correct,set[(index+1)%set.length].key,set[(index+2)%set.length].key].map(function(t,i){return {t:t,s:i===0?1:0};});
}
function renderDelayedRecall(){
  var d=state.diagnostic,set=subject().diagnostic.memorySet;
  if(d.delayedIndex>=set.length)return finishDiagnostic();
  var item=set[d.delayedIndex];
  var q='أي عبارة مفتاحية كانت مرتبطة بـ «'+item.label+'»؟';
  renderQuestion(d.retentionMode?"مراجعة بعد فترة — من غير إعادة قراءة":"رجعنا للنصوص بعد المهمة الفاصلة",q,delayedOptions(d.delayedIndex),function(score){if(score)d.delayedCorrect++;d.delayedIndex++;renderDiagnostic();});
}
function freeRecallScore(text){
  if(!text)return 0;var n=norm(text),terms=keyTermsFromCorrect(),hits=terms.filter(function(t){return n.indexOf(t)>=0;}).length;
  if(hits>=3)return 100;if(hits===2)return 75;if(hits===1)return 45;return text.length>18?25:0;
}
function finishDiagnostic(){
  var d=state.diagnostic,key=resultKey();
  if(d.retentionMode){
    var old=state.profile.results[key];if(old){old.metrics.retention=Math.round(d.delayedCorrect/5*100);old.lastRetentionAt=Date.now();}
    if(state.profile.retention[key])state.profile.retention[key].completed=true;
    saveProfile();state.view="results";return render();
  }
  var recall=Math.round(((d.recallMCQ||0)+freeRecallScore(d.recallFree))/2);
  var retention=Math.round(d.delayedCorrect/5*100);
  var metrics={recall:recall,understanding:d.understanding||0,application:d.application||0,retention:retention,exam:null};
  var res={countryId:state.countryId,subjectId:state.subjectId,metrics:metrics,anchorReadSeconds:d.anchorReadSeconds,memoryReadTimes:d.memoryReadTimes,createdAt:Date.now(),profileType:profileType(metrics)};
  state.profile.results[key]=res;
  state.profile.retention[key]={dueAt:Date.now()+24*60*60*1000,completed:false};
  saveProfile();state.view="results";render();
}
function profileType(m){
  if(m.understanding>=m.recall+15)return "understanding-led";
  if(m.recall>=m.understanding+15)return "recall-led";
  return "balanced";
}
function profileSentence(res){
  var m=res.metrics;
  if(res.profileType==="understanding-led")return "فهمك أسرع من استرجاعك اللفظي. هنستخدم الخريطة المنطقية للنص، ثم نثبت الكلمات القانونية الأساسية باسترجاع متباعد.";
  if(res.profileType==="recall-led")return "استرجاعك اللفظي أقوى من الفهم التطبيقي. هنستخدم النص الذي تتذكره كبداية، ثم نفككه ونغيّر الوقائع حتى يتحول الحفظ إلى فهم قابل للاستخدام.";
  if(m.retention+20<m.recall)return "أداؤك الفوري أفضل من الاحتفاظ بعد فترة. الأولوية ليست إعادة القراءة، بل مراجعات قصيرة متباعدة واختبارات استرجاع.";
  return "أداؤك متقارب بين الاسترجاع والفهم. سنركز على نقل المعرفة إلى الوقائع ثم تحويلها إلى إجابة امتحانية منظمة.";
}
function renderResults(){
  var res=currentResult();if(!res){state.view="hub";return render();}
  var m=res.metrics;
  var html='<div class="section-title"><div><h1>صورتك المبدئية</h1><p>دي ملاحظات وصفية استكشافية من عدد محدود من المهام. لا تُعد درجات معيارية أو قياسًا سيكومتريًا معتمدًا.</p></div><button class="btn ghost" id="backHub">رجوع</button></div>'+
  '<div class="summary-rail">'+metric("الاسترجاع",m.recall)+metric("الفهم",m.understanding)+metric("التطبيق",m.application)+metric("الاحتفاظ",m.retention)+metric("الصياغة",m.exam)+'</div>'+
  '<section class="profile-story"><h2>إزاي نستفيد من اللي عندك؟</h2><p>'+profileSentence(res)+'</p><div class="plan-flow">'+planSteps(res).map(function(x,i){return '<div class="plan-step"><b>'+(i+1)+'. '+x[0]+'</b><span>'+x[1]+'</span></div>';}).join("")+'</div></section>'+
  '<div class="timer-row"><div><button class="btn primary" id="openPlan">افتح خطة المذاكرة</button> <button class="btn secondary" id="openExam">جرّب الإجابة الامتحانية</button></div><span class="memory-chip">مراجعة مؤجلة مقترحة بعد 24–48 ساعة</span></div>';
  chrome(html);
  document.getElementById("backHub").onclick=function(){state.view="hub";render();};
  document.getElementById("openPlan").onclick=function(){state.view="plan";render();};
  document.getElementById("openExam").onclick=function(){state.view="exam";render();};
}
function metric(name,v){return '<div class="metric"><span>'+name+'</span><b>'+qualitativeIndicator(v)+'</b><small>وصف استكشافي — ليس نسبة معيارية</small></div>';}
function planSteps(res){
  var m=res.metrics,out=[];
  if(res.profileType==="understanding-led"){out.push(["ابدأ بالخريطة","حوّل كل موضوع إلى: قاعدة → شروط → أثر → استثناء."]);out.push(["ثبّت الألفاظ","اختبر نفسك في الكلمات القانونية بدل إعادة قراءة الصفحة."]);}
  else if(res.profileType==="recall-led"){out.push(["استخدم النص كبداية","استرجع المادة أو التعريف ثم اشرحها بكلماتك."]);out.push(["غيّر واقعة واحدة","اختبر هل الحكم يتغير لما تتغير واقعة حاسمة."]);}
  else{out.push(["استرجاع سريع","اقرأ ثم أغلق النص واكتب فكرته الأساسية."]);out.push(["تطبيق مباشر","بعد كل قاعدة حل واقعة قصيرة."]);}
  if(m.retention<65)out.push(["راجع على مسافات","مراجعة قصيرة بعد يوم، ثم بعد عدة أيام، بدل جلسة طويلة واحدة."]);else out.push(["حافظ على التثبيت","مراجعات أقصر لأن الاحتفاظ الحالي جيد نسبيًا."]);
  if(m.application<70)out.push(["زد الوقائع","الأولوية لأسئلة التطبيق وChange One Fact."]);else out.push(["حوّلها لإجابة","ابدأ تدريب البناء الامتحاني والخلاصة."]);
  return out.slice(0,4);
}
function renderPlan(){
  var res=currentResult();
  if(!res)return noResultView("خطتي");
  var steps=planSteps(res);
  chrome('<div class="section-title"><div><h1>خطة المذاكرة</h1><p>'+profileSentence(res)+'</p></div><button class="btn ghost" id="backHub">رجوع</button></div><section class="focus-panel"><div class="plan-flow">'+steps.map(function(x,i){return '<div class="plan-step" style="background:'+(i%2?"#f7edd8":"#f1e7eb")+';border-color:var(--line);color:var(--ink)"><b style="color:var(--navy)">'+(i+1)+'. '+x[0]+'</b><span style="color:var(--muted)">'+x[1]+'</span></div>';}).join("")+'</div><div class="archive-note">الخطة تتغير لما تعمل مراجعة التثبيت بعد 24 ساعة أو تعيد الاختبار في موضوع آخر.</div></section>');
  document.getElementById("backHub").onclick=function(){state.view="hub";render();};
}
function noResultView(title){
  chrome('<div class="section-title"><div><h1>'+title+'</h1><p>المسار ده يحتاج نتيجة تشخيص أولًا.</p></div></div><div class="empty-note">ابدأ «اختباري» أولًا عشان نبني المسار على أدائك الفعلي.<br><button class="btn primary" id="nrTest" style="margin-top:12px">ابدأ الاختبار</button></div>');
  document.getElementById("nrTest").onclick=startDiagnostic;
}
function renderLearn(){
  var set=subject().diagnostic.memorySet;
  chrome('<div class="section-title"><div><h1>أتعلم</h1><p>النصوص هنا لا تُعرض كصفحة للحفظ. كل وحدة صغيرة تنتهي بسؤال استرجاع أو شرح بكلماتك.</p></div><button class="btn ghost" id="backHub">رجوع</button></div><section class="focus-panel">'+set.map(function(x,i){return '<div class="exam-question"><small>'+esc(x.source||"تعريف تدريبي")+'</small><h3 style="color:var(--navy)">'+(i+1)+'. '+esc(x.label)+'</h3><p>'+esc(x.text)+'</p><span class="memory-chip">الكلمة المفتاحية: '+esc(x.key)+'</span></div>';}).join("")+'</section>');
  document.getElementById("backHub").onclick=function(){state.view="hub";render();};
}
function renderTrain(){
  var a=subject().diagnostic.anchor;
  chrome('<div class="section-title"><div><h1>أتدرب</h1><p>التطبيق يبدأ بتغيير واقعة واحدة بدل إعادة سؤال الحفظ بصياغة أخرى.</p></div><button class="btn ghost" id="backHub">رجوع</button></div><section class="focus-panel"><span class="eyebrow">Change One Fact</span><h2>'+esc(a.applyQuestion)+'</h2><div class="choices">'+a.applyOptions.map(function(o,i){return '<button class="choice" data-train="'+i+'">'+esc(o.t)+'</button>';}).join("")+'</div><div id="trainFeed"></div></section>');
  document.getElementById("backHub").onclick=function(){state.view="hub";render();};
  document.querySelectorAll("[data-train]").forEach(function(b){b.onclick=function(){var o=a.applyOptions[Number(b.dataset.train)];document.querySelectorAll("[data-train]").forEach(function(x){x.disabled=true;});b.classList.add(o.s?"good":"bad");document.getElementById("trainFeed").innerHTML='<div class="archive-note">'+(o.s?"التكييف أقرب للصواب. الآن اشرح لنفسك: ما الواقعة التي غيرت المسار؟":"ارجع للواقعة الحاسمة في السؤال، مش للكلمات العامة.")+'</div>';};});
}
function renderExam(){
  var e=subject().exam,res=currentResult();
  var q=e.questions[0];
  chrome('<div class="section-title"><div><h1>إجابة امتحانية</h1><p>ابدأ بالخلاصة التي لا يجوز أن تسقط من الإجابة، ثم وسّع كل عنصر حسب السؤال.</p></div><button class="btn ghost" id="backHub">رجوع</button></div>'+
  '<div class="exam-layout"><section class="focus-panel"><span class="eyebrow">هيكل الخلاصة</span><div class="answer-spine">'+e.summary.map(function(x,i){return '<div class="spine-item"><span class="spine-num">'+(i+1)+'</span><b>'+esc(x)+'</b></div>';}).join("")+'</div></section>'+
  '<section class="focus-panel"><span class="eyebrow">'+esc(q.type)+'</span><h2>'+esc(q.q)+'</h2><textarea id="examAnswer" style="width:100%;min-height:220px;border:1px solid var(--line);border-radius:16px;padding:15px;font:inherit" placeholder="اكتب إجابتك في شكل: قاعدة → عناصر → تطبيق/مثال → نتيجة"></textarea><div class="timer-row"><button class="btn primary" id="examCheck">حلّل البناء</button><span class="memory-chip">'+(res?profileSentence(res):"اعمل التشخيص أولًا للحصول على توجيه شخصي")+'</span></div><div id="examFeedback"></div></section></div>');
  document.getElementById("backHub").onclick=function(){state.view="hub";render();};
  document.getElementById("examCheck").onclick=function(){var txt=document.getElementById("examAnswer").value.trim();var score=examHeuristic(txt);document.getElementById("examFeedback").innerHTML='<div class="archive-note"><b>تقدير بنائي تدريبي: '+score+'%</b><br>'+examFeedback(score)+'</div>';var r=currentResult();if(r){r.metrics.exam=score;saveProfile();}};
}
function examHeuristic(t){var n=norm(t);if(!n)return 0;var len=n.split(" ").length,score=0;if(len>=35)score+=25;if(len>=70)score+=15;["قاعد","شرط","اثر","استثناء","نتيج","مثال","تطبيق"].forEach(function(k){if(n.indexOf(k)>=0)score+=10;});return clamp(score,0,100);}
function examFeedback(s){if(s>=75)return "البناء واضح نسبيًا. راجع الآن الدقة القانونية والمصطلحات الخاصة بالسؤال.";if(s>=45)return "الإجابة بدأت تتكون، لكن حاول فصل القاعدة عن العناصر ثم اختم بنتيجة واضحة.";return "ابدأ بالخلاصة الخماسية على اليسار بدل كتابة فقرة طويلة من الذاكرة.";}
function renderArchive(){
  var qs=subject().exam.questions.filter(function(q){return q.type.indexOf("رسمي")>=0;});
  chrome('<div class="section-title"><div><h1>الامتحانات والمصادر</h1><p>هذه الصفحة لا تعرض التجاري أو مواد خارج نطاقنا الحالي. فقط نظرية الحق، مصادر الالتزام، وأحكام الالتزام.</p></div><button class="btn ghost" id="backHub">رجوع</button></div><section class="focus-panel">'+
  (qs.length?qs.map(function(q){return '<div class="exam-question"><span class="eyebrow">'+esc(q.type)+'</span><h3 style="margin-top:12px;color:var(--navy)">'+esc(q.q)+'</h3>'+(q.sourceUrl?'<a class="source-link" href="'+esc(q.sourceUrl)+'" target="_blank" rel="noopener">فتح المصدر ↗</a>':'')+'</div>';}).join(""):'<div class="empty-note">لا يوجد في المصادر الموثقة الحالية امتحان سابق منشور لهذه المادة بدرجة ثقة كافية. لذلك لن نملأ القسم بأسئلة منسوبة للجامعة بلا مصدر.</div>')+
  '<div class="archive-note">أي سؤال رسمي مرتبط بمحور المقرر سيُوسم بوضوح إذا لم يكن امتحانًا فعليًا للمادة.</div></section>');
  document.getElementById("backHub").onclick=function(){state.view="hub";render();};
}
state.view="country";
render();
})();