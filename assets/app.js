
(function(){
"use strict";

var C = window.LEX_CONTENT;
var APP = document.getElementById("app");
var STORAGE = "lexlearn_student_v2_state";
var SESSION = {pending:null, selected:null, reason:"", confidence:null, hintLevel:0, loadHidden:false, feedback:null, activity:null, activityItem:null};

var DIM_LABELS = {
  recall:"الاسترجاع",
  retention:"الاحتفاظ المؤجل",
  understanding:"الفهم",
  legal_precision:"الدقة القانونية",
  transfer:"النقل والتطبيق",
  legal_reasoning:"الاستدلال القانوني",
  exam_execution:"الاختبار الامتحاني المصغّر"
};
var DIFF_FACTOR={1:.80,2:.90,3:1,4:1.10,5:1.20};
var HINT_FACTOR={0:1,1:.85,2:.65,3:.45};

function freshState(){
  return {
    schema:3,
    userId:"local-"+Math.random().toString(36).slice(2,10),
    country:null,courseId:null,screen:"country",
    diagnostic:{started:false,completed:false,used:[],attempts:[],targetDifficulty:{recall:1,understanding:1,legal_precision:1,transfer:1,exam_execution:1}},
    mastery:{},
    flags:[],
    route:null,
    xp:0,streak:0,lastActive:null,
    badges:[],
    reviews:[],
    activityHistory:[],
    waitlistEgypt:false,
    createdAt:new Date().toISOString()
  };
}
function load(){
  try{
    var s=JSON.parse(localStorage.getItem(STORAGE));
    if(!s || s.schema!==3) return freshState();
    return s;
  }catch(e){return freshState();}
}
var state=load();

function save(){localStorage.setItem(STORAGE,JSON.stringify(state));}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c];});}
function norm(v){return String(v||"").toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[ًٌٍَُِّْـ]/g,"").replace(/[^\u0600-\u06FFa-z0-9 ]/gi," ").replace(/\s+/g," ").trim();}
function toast(msg){
  var t=document.getElementById("toast"); if(!t)return;
  t.textContent=msg;t.classList.add("show");setTimeout(function(){t.classList.remove("show");},2200);
}
function course(){return C.courses.find(function(x){return x.id===state.courseId;})||C.courses[0];}
function pct(v){return Math.round(v||0)+"%";}
function relLabel(r){return r==="HIGH"?"أدلة كافية مبدئيًا":r==="MEDIUM"?"أدلة متوسطة":"دليل أولي";}
function dimLabel(d){return DIM_LABELS[d]||d;}\nfunction actionLabel(a){var m={ADVANCE:"ارفع الصعوبة",HOLD:"ثبّت المستوى",HOLD_TARGETED_FOLLOWUP:"سؤال متابعة بنفس المستوى",MISCONCEPTION_REPAIR:"صحّح الفكرة أولًا",STEP_BACK_REMEDIATE:"ارجع خطوة وعالج النقص",REMEDIATE:"علاج قصير قبل الاستمرار"};return m[a]||a;}
function dateKey(d){return d.toISOString().slice(0,10);}
function touchStreak(){
  var today=dateKey(new Date());
  if(state.lastActive===today)return;
  if(state.lastActive){
    var prev=new Date(state.lastActive+"T00:00:00");
    var diff=Math.round((new Date(today+"T00:00:00")-prev)/86400000);
    state.streak=diff===1?state.streak+1:1;
  }else state.streak=1;
  state.lastActive=today;save();
}
function go(screen){state.screen=screen;save();SESSION={pending:null,selected:null,reason:"",confidence:null,hintLevel:0,loadHidden:false,feedback:null,activity:null,activityItem:null};render();window.scrollTo({top:0,behavior:"smooth"});}
function reliability(dim){
  var a=state.diagnostic.attempts.filter(function(x){return x.dimension===dim && x.valid!==false;});
  var ids={}; a.forEach(function(x){ids[x.item_id]=1;});
  var n=a.length, unique=Object.keys(ids).length;
  if(n>=3 && unique>=3)return"HIGH";
  if(n>=2 && unique>=2)return"MEDIUM";
  return"LOW";
}
function updateMastery(dim){
  var a=state.diagnostic.attempts.filter(function(x){return x.dimension===dim && x.valid!==false;}).slice(-8);
  if(!a.length){delete state.mastery[dim];return;}
  var num=0,den=0;
  a.forEach(function(x,i){var w=i+1;num+=x.evidence_value*w;den+=w;});
  state.mastery[dim]={value:Math.max(0,Math.min(100,num/den)),count:a.length,reliability:reliability(dim),updatedAt:new Date().toISOString()};
}
function allMastery(){["recall","understanding","legal_precision","transfer","exam_execution"].forEach(updateMastery);}
function band(dim){
  var m=state.mastery[dim]; if(!m || m.reliability==="LOW")return"UNKNOWN";
  if(m.value>=75)return"STRONG";
  if(m.value<55)return"WEAK";
  return"DEVELOPING";
}
function scoreKeywords(text,words,needed){
  var n=norm(text),hits=0;
  words.forEach(function(w){if(n.indexOf(norm(w))>=0)hits++;});
  return Math.min(1,hits/(needed||2));
}
function itemById(id){return C.diagnosticItems.find(function(x){return x.id===id;});}
function currentQuestion(){
  if(!state.diagnostic.currentId)return null;
  return itemById(state.diagnostic.currentId);
}
function blueprint(dim){return (C.diagnosticBlueprint||[]).find(function(x){return x.dimension===dim;});}
function dimAttempts(dim){return state.diagnostic.attempts.filter(function(a){return a.dimension===dim && a.valid!==false;});}
function dimensionNeedsMore(bp){
  var arr=dimAttempts(bp.dimension);
  if(arr.length<bp.min)return true;
  if(arr.length>=bp.max)return false;
  if(arr.length===bp.min){
    var vals=arr.slice(-2).map(function(a){return a.raw_score;});
    return vals.length===2 && Math.abs(vals[0]-vals[1])>=0.35;
  }
  return false;
}
function chooseDimension(){
  var plan=C.diagnosticBlueprint||[];
  for(var i=0;i<plan.length;i++) if(dimensionNeedsMore(plan[i])) return plan[i].dimension;
  return null;
}
function chooseNextItem(){
  var used=state.diagnostic.used;
  var dim=chooseDimension();
  if(!dim)return null;
  var target=state.diagnostic.targetDifficulty[dim]||1;
  var pool=C.diagnosticItems.filter(function(i){return i.dimension===dim && used.indexOf(i.id)<0;});
  if(!pool.length)return null;
  pool.sort(function(a,b){
    var da=Math.abs(a.difficulty-target),db=Math.abs(b.difficulty-target);
    if(da!==db)return da-db;
    return a.difficulty-b.difficulty;
  });
  return pool[0];
}
function phaseTracker(activeDim){
  var plan=C.diagnosticBlueprint||[];
  return '<div class="diagsteps">'+plan.map(function(bp,i){
    var n=dimAttempts(bp.dimension).length;
    var needs=dimensionNeedsMore(bp);
    var done=!needs && n>=bp.min;
    var cls=bp.dimension===activeDim?'active':(done?'done':'');
    var status=n===0?'لم يبدأ':(done?(n>bp.min?'اكتمل + تأكيد':'اكتمل'):(n>=bp.min?'سؤال تأكيد':n+' من '+bp.min));
    return '<div class="diagstep '+cls+'"><span>'+(i+1)+'</span><b>'+esc(bp.short)+'</b><small>'+status+'</small></div>';
  }).join("")+'</div>';
}
function rubricFeedback(item,response){
  if(item.type!=="build_answer" || !item.rubric)return"";
  var rows=item.rubric.map(function(r){
    var ok=scoreKeywords(response.text||"",r.keywords||[],1)>0;
    return '<div class="rubricrow '+(ok?'hit':'miss')+'"><span>'+(ok?'✓':'○')+'</span><b>'+esc(r.label)+'</b></div>';
  }).join("");
  return '<div class="rubricbox"><b>عناصر التصحيح التدريبية:</b>'+rows+'</div>';
}
function ensureCurrentItem(){
  if(state.diagnostic.currentId)return;
  var n=chooseNextItem();
  if(!n){finishDiagnostic();return;}
  state.diagnostic.currentId=n.id;
  if(state.diagnostic.used.indexOf(n.id)<0)state.diagnostic.used.push(n.id);
  save();
}
function priorSame(item){
  var arr=state.diagnostic.attempts.filter(function(a){return a.dimension===item.dimension && a.difficulty===item.difficulty;});
  return arr.length?arr[arr.length-1]:null;
}
function nextAction(item,raw,conf,hint){
  if(raw>=.85 && hint===0)return"ADVANCE";
  if(raw>=.60)return"HOLD_TARGETED_FOLLOWUP";
  if(raw<.55 && conf===4)return"MISCONCEPTION_REPAIR";
  if(raw<.55)return"STEP_BACK_REMEDIATE";
  return"REMEDIATE";
}
function applyDifficulty(item,action){
  var d=state.diagnostic.targetDifficulty[item.dimension]||item.difficulty;
  if(action==="ADVANCE")d=Math.min(5,d+1);
  if(action==="STEP_BACK_REMEDIATE")d=Math.max(1,d-1);
  state.diagnostic.targetDifficulty[item.dimension]=d;
}
function evaluateItem(item,response){
  if(item.type==="mcq" || item.type==="load_recall"){
    var o=item.options.find(function(x){return x.id===response.choice;});return o?o.score:0;
  }
  if(item.type==="mcq_reason"){
    var op=item.options.find(function(x){return x.id===response.choice;});
    var choice=op?op.score:0;
    var rs=scoreKeywords(response.reason,item.keywords||[],2);
    return Math.min(1,choice*.72+rs*.28);
  }
  if(item.type==="missing_element"){
    var n=norm(response.text),ok=(item.accepted||[]).some(function(x){return n.indexOf(norm(x))>=0;});
    return ok?1:0;
  }
  if(item.type==="build_answer"){
    var hits=0;(item.rubric||[]).forEach(function(r){if(scoreKeywords(response.text,r.keywords||[],1)>0)hits++;});
    return item.rubric.length?hits/item.rubric.length:0;
  }
  return 0;
}
function finalizeAttempt(){
  var item=currentQuestion(); if(!item || !SESSION.pending || !SESSION.confidence)return;
  var raw=SESSION.pending.raw;
  var action=nextAction(item,raw,SESSION.confidence,SESSION.hintLevel);
  var ev=Math.max(0,Math.min(100,100*raw*(DIFF_FACTOR[item.difficulty]||1)*(HINT_FACTOR[SESSION.hintLevel]||1)));
  var a={
    attempt_id:"att-"+Date.now()+"-"+Math.random().toString(36).slice(2,6),
    user_id:state.userId,item_id:item.id,topic_id:item.topic,dimension:item.dimension,difficulty:item.difficulty,
    raw_score:raw,hint_level:SESSION.hintLevel,confidence_pre_feedback:SESSION.confidence,
    latency_ms:SESSION.pending.latency_ms,timed_context:false,first_attempt:true,response_payload:SESSION.pending.response,
    evaluator:"local-rubric-demo",ai_confidence:1,evidence_value:ev,action:action,valid:true,created_at:new Date().toISOString()
  };
  state.diagnostic.attempts.push(a);
  if(raw<.55 && SESSION.confidence===4 && state.flags.indexOf("ثقة مرتفعة مع إجابة غير دقيقة")<0)state.flags.push("ثقة مرتفعة مع إجابة غير دقيقة");
  if(item.type==="load_recall" && raw<.55){
    var normal=state.diagnostic.attempts.filter(function(x){return x.dimension==="recall" && x.item_id!==item.id && itemById(x.item_id) && itemById(x.item_id).type!=="load_recall";});
    var avg=normal.length?normal.reduce(function(s,x){return s+x.evidence_value;},0)/normal.length:0;
    if(avg>=70 && state.flags.indexOf("الأداء يتأثر بزيادة الحمل")<0)state.flags.push("الأداء يتأثر بزيادة الحمل");
  }
  applyDifficulty(item,action);allMastery();scheduleReview(item.topic,item.id,raw);
  SESSION.feedback={item:item,attempt:a};
  save();renderDiagnostic();
}
function scheduleReview(topic,itemId,raw){
  var existing=state.reviews.find(function(r){return r.topic===topic;});
  var q=raw>=.9?5:raw>=.75?4:raw>=.55?3:raw>=.35?2:1;
  if(!existing)existing={id:"rev-"+Math.random().toString(36).slice(2,8),topic:topic,itemId:itemId,repetitions:0,interval:0,ef:2.5,due:new Date().toISOString(),history:[]};
  if(q<3){existing.repetitions=0;existing.interval=1;}
  else{
    if(existing.repetitions===0)existing.interval=1;
    else if(existing.repetitions===1)existing.interval=6;
    else existing.interval=Math.max(1,Math.round(existing.interval*existing.ef));
    existing.repetitions++;
    existing.ef=Math.max(1.3,existing.ef+(0.1-(5-q)*(0.08+(5-q)*0.02)));
  }
  var due=new Date();due.setDate(due.getDate()+existing.interval);existing.due=due.toISOString();existing.itemId=itemId;
  existing.history.push({at:new Date().toISOString(),quality:q});
  if(!state.reviews.some(function(r){return r.id===existing.id;}))state.reviews.push(existing);
}
function finishDiagnostic(){
  allMastery();
  state.diagnostic.completed=true;state.diagnostic.currentId=null;
  state.route=deriveRoute();state.screen="mastery";save();render();
}
function deriveRoute(){
  var r=state.mastery.recall?state.mastery.recall.value:50;
  var u=state.mastery.understanding?state.mastery.understanding.value:50;
  var t=state.mastery.transfer?state.mastery.transfer.value:50;
  var weak=[r,u,t].filter(function(v){return v<55;}).length;
  if(weak>=2)return"FOUNDATION";
  if(r<55 && u>=60)return"RETENTION_RECALL";
  if(r>=75 && u>=75 && t>=75)return"ADVANCED_EXAM";
  return"UNDERSTANDING_TRANSFER";
}
function routeInfo(){
  var r=state.route||deriveRoute();
  var map={
    FOUNDATION:{title:"المسار التأسيسي",why:"هناك فجوات ممتدة في أكثر من بُعد، لذلك نقلل الحمل ونبني المفاهيم بدقة قبل زيادة التعقيد.",steps:["العنصر الناقص لتثبيت المصطلحات","شرح مصغر بعد الخطأ","قضية قصيرة جدًا بلا تشتيت","إعادة قياس بعد عدة محاولات"]},
    RETENTION_RECALL:{title:"مسار تثبيت الاسترجاع",why:"الفهم أفضل نسبيًا من استدعاء التفاصيل، لذلك نستخدم مراجعات مجدولة واسترجاعًا قصيرًا متكررًا.",steps:["العنصر الناقص","مراجعات SM-2","استرجاع بلا تلميح","إعادة اختبار بعد 24 ساعة+"]},
    UNDERSTANDING_TRANSFER:{title:"مسار الفهم والتطبيق",why:"الأولوية الحالية هي نقل المعرفة من التعريف إلى واقعة جديدة مع الحفاظ على قدر مناسب من الاسترجاع.",steps:["غيّر واقعة واحدة","محقق القضية","سبب قصير للاختيار","ابنِ إجابة الامتحان"]},
    ADVANCED_EXAM:{title:"مسار التميز الامتحاني",why:"الإتقان الأساسي قوي، فنرفع التعقيد ونركز على بناء الإجابة واكتشاف المسألة بسرعة ودقة.",steps:["قضايا مركبة","Build the Answer","تحديات بزمن اختياري","مراجعة نقاط فقد الدرجات"]}
  };
  return map[r];
}
function rawBand(v){return v>=75?"قوي":v<55?"يحتاج دعمًا":"في طور التطور";}
function addXP(n,label){
  touchStreak();state.xp+=n;
  if(state.xp>=50 && state.badges.indexOf("بداية قوية")<0)state.badges.push("بداية قوية");
  if(state.streak>=3 && state.badges.indexOf("3 أيام متتالية")<0)state.badges.push("3 أيام متتالية");
  save();toast("+"+n+" XP"+(label?" • "+label:""));
}
function header(){
  var nav="";
  if(state.diagnostic.completed){
    nav='<button class="iconbtn" data-nav="today">اليوم</button><button class="iconbtn" data-nav="activities">الأنشطة</button><button class="iconbtn" data-nav="reviews">المراجعات</button><button class="iconbtn" data-nav="dashboard">لوحتي</button>';
  }
  return '<header class="topbar"><div class="topin"><div class="brand"><div class="logo">Lx</div><div class="brandtext"><b>LexLearn AI</b><small>Adaptive Legal Learning • Student Edition</small></div></div><div class="topactions">'+nav+(state.diagnostic.completed?'<span class="pill gold">⭐ '+state.xp+' XP</span><span class="pill">🔥 '+state.streak+'</span>':'')+'<button class="iconbtn" id="aboutBtn">عن النسخة</button></div></div></header>';
}
function hero(){
  return '<section class="hero"><div class="panel hero-main"><div class="kicker">Student Edition • P0</div><h1>مش موقع أسئلة. ده مسار بيتغيّر مع إجابتك.</h1><p class="lead">كل سؤال ينتظر إجابتك، يحولها إلى دليل على مستوى الإتقان، ثم يختار النشاط التالي. التقييم موضوعي ومتعدد الأبعاد؛ لا يوجد تصنيف ثابت «حافظ/فاهم».</p></div><div class="panel hero-side"><h3>الحلقة الأساسية</h3><div class="flowrow"><div class="flownum">1</div><div><b>Item</b><small>سؤال واحد فقط.</small></div></div><div class="flowrow"><div class="flownum">2</div><div><b>Attempt</b><small>ننتظر الإجابة والثقة.</small></div></div><div class="flowrow"><div class="flownum">3</div><div><b>Evidence</b><small>نراعي الصعوبة والتلميح.</small></div></div><div class="flowrow"><div class="flownum">4</div><div><b>Next Action</b><small>أصعب، تثبيت، علاج أو توقف.</small></div></div></div></section>';
}
function journey(stage){
  var steps=[["country","الدولة"],["context","المقرر"],["diagnostic","التشخيص"],["mastery","النتيجة"],["today","مسار اليوم"]];
  var order={country:0,context:1,diagnostic:2,mastery:3,today:4,activities:4,reviews:4,dashboard:4};
  var cur=order[stage]||0;
  return '<div class="journey">'+steps.map(function(s,i){return '<div class="journeystep '+(i<cur?'done':i===cur?'active':'')+'"><span>'+(i+1)+'</span><b>'+s[1]+'</b></div>';}).join("")+'</div>';
}
function countryScreen(){
  return '<section class="panel screen onboarding">'+journey("country")+'<div class="screenhead"><div><div class="kicker">LexLearn AI — طلاب القانون</div><h2>اختر النظام القانوني</h2><p class="small">الخطوة الأولى فقط: اختر الدولة. بعد ذلك نعرض المقرر والتشخيص.</p></div><span class="stepbadge">بداية واضحة</span></div><div class="grid2"><div class="option clickable" data-country="QA"><span class="countryflag">🇶🇦</span><b>قطر</b><small>النسخة التجريبية: جامعة قطر — LAWC 101 مدخل إلى القانون</small></div><div class="option clickable disabled" data-country="EG"><span class="countryflag">🇪🇬</span><b>مصر</b><small>قريبًا — سيُفعّل بعد اعتماد المحتوى المصري.</small></div></div></section>';
}
function contextScreen(){
  var c=course();
  return '<section class="panel screen onboarding">'+journey("context")+'<div class="screenhead"><div><div class="kicker">المقرر</div><h2>'+esc(c.code)+' — '+esc(c.title_ar)+'</h2><p class="small">'+esc(c.university)+' • المحتوى بالعربية</p></div><span class="stepbadge">🇶🇦 قطر</span></div><div class="grid2"><div class="option active"><b>نظرية القانون</b><small>القاعدة القانونية، المصادر، التشريع، العرف، التطبيق، التفسير والإلغاء.</small></div><div class="option active"><b>نظرية الحق</b><small>مفهوم الحق، مصادره، أشخاصه، محله، واستعمال الحق وحدوده.</small></div></div><div class="notice"><b>النسخة الحالية للتجربة:</b> الأسئلة مبنية على موضوعات المقرر المنشورة رسميًا، وصياغتها التدريبية تحتاج مراجعة واعتمادًا قبل الإطلاق العام.</div><div class="actions"><button class="btn primary" id="startCourse">ادخل تشخيص البداية</button><button class="btn ghost" id="backCountry">رجوع</button></div><div class="sourcebox">مرجع بنية المقرر: <a href="'+esc(c.officialSource)+'" target="_blank" rel="noopener">وصف جامعة قطر للمقرر</a>.</div></section>';
}
function diagnosticIntro(){
  var cards=(C.diagnosticBlueprint||[]).map(function(bp,i){return '<div class="option"><b>'+(i+1)+'. '+esc(bp.label)+'</b><small>'+esc(bp.description)+'</small></div>';}).join("");
  return '<section class="panel screen">'+journey("diagnostic")+'<div class="screenhead"><div><div class="kicker">تشخيص البداية</div><h2>خمس مجموعات قياس واضحة — سؤال واحد في كل مرة</h2></div><span class="stepbadge">10–15 سؤالًا حسب الحاجة</span></div><p>الترتيب التالي <b>لتنظيم القياس فقط</b>، وليس سلمًا يجب أن تتعلم به. كل بُعد يُقاس مستقلًا، وكل إجابة تحدد صعوبة السؤال التالي داخل نفس المجموعة. إذا كانت النتيجتان متعارضتين يظهر سؤال ثالث للتأكيد.</p><div class="grid3">'+cards+'</div><div class="info"><b>الجزء الخامس ظاهر بوضوح كاختبار امتحاني مصغّر.</b> لن تظهر له نسبة قبل أن تجيب على أسئلته. وبعد كل إجابة نطلب درجة ثقتك قبل عرض التصحيح.</div><div class="notice">الاحتفاظ المؤجل ليس جزءًا من هذه الجلسة؛ لا يُقاس إلا عند مراجعة لاحقة بعد مرور وقت فعلي.</div><div class="actions"><button class="btn primary" id="beginDiagnostic">ابدأ التشخيص</button><button class="btn ghost" id="backContext">رجوع</button></div></section>';
}
function renderQuestionBody(item){
  var html='<div class="questionMeta"><span class="tag maroon">'+esc(dimLabel(item.dimension))+'</span><span class="tag">صعوبة '+item.difficulty+'/5</span><span class="tag">'+esc(item.topic)+'</span></div>';
  if(item.type==="load_recall" && !SESSION.loadHidden){
    html+='<div class="stimulus"><b>بطاقات القراءة:</b><div style="margin-top:8px">'+item.cards.map(function(x){return'<div class="choice">'+esc(x)+'</div>';}).join("")+'</div></div><button class="btn secondary" id="hideLoad">أخفي البطاقات وابدأ الإجابة</button>';
    return html;
  }
  html+='<h3>'+esc(item.prompt)+'</h3>';
  if(item.options){
    html+='<div id="choices">'+item.options.map(function(o){return'<label class="choice '+(SESSION.selected===o.id?"selected":"")+'" data-choice="'+o.id+'"><input type="radio" name="q" '+(SESSION.selected===o.id?"checked":"")+'/> '+esc(o.text)+'</label>';}).join("")+'</div>';
  }
  if(item.type==="mcq_reason"){
    html+='<div style="margin-top:12px"><label><b>'+esc(item.reasonPrompt||"اكتب سببًا قصيرًا")+'</b></label><textarea id="reasonInput" placeholder="سطر أو سطران يكفيان...">'+esc(SESSION.reason)+'</textarea></div>';
  }
  if(item.type==="missing_element"){
    html+='<input type="text" id="textInput" placeholder="اكتب العنصر الناقص..." value="'+esc(SESSION.reason)+'"/>';
  }
  if(item.type==="build_answer"){
    html+='<textarea id="textInput" placeholder="اكتب إجابة قصيرة ومنظمة...">'+esc(SESSION.reason)+'</textarea>';
  }
  if(SESSION.hintLevel>0)html+='<div class="hintbox"><b>تلميح '+SESSION.hintLevel+':</b> '+(SESSION.hintLevel===1?"حدد أولًا عنوان الموضوع الذي تختبره الكلمات الأساسية في السؤال.":"استبعد الاختيارات التي لا تنتمي أصلًا إلى وحدة السؤال، ثم اربط الوقائع بالمفهوم الأقرب.")+'</div>';
  return html;
}
function diagnosticScreen(){
  ensureCurrentItem();var item=currentQuestion();if(!item)return"";
  var n=state.diagnostic.attempts.length;
  var bp=blueprint(item.dimension)||{label:dimLabel(item.dimension),description:""};
  var isExam=item.dimension==="exam_execution";
  var html='<section class="panel screen"><div class="screenhead"><div><div class="kicker">تشخيص البداية</div><h2>'+esc(bp.label)+'</h2><p class="small">'+esc(bp.description)+'</p></div><span class="stepbadge">السؤال '+(dimAttempts(item.dimension).length+1)+' في هذه المجموعة</span></div>'+phaseTracker(item.dimension);
  if(isExam)html+='<div class="examcallout"><b>📝 الاختبار الامتحاني المصغّر</b><p>أنت الآن في الجزء الذي يقيس بناء الإجابة. النسبة التي ستظهر لاحقًا لهذا البُعد تأتي من هذه الأسئلة تحديدًا، وليست درجة جامعية رسمية.</p></div>';
  html+='<div class="questionCard" id="questionCard">';
  if(SESSION.pending && !SESSION.feedback){
    html+=renderQuestionBody(item);
    html+='<div class="info"><b>تم تثبيت إجابتك.</b> قبل التصحيح: ما مدى ثقتك فيها؟</div><div class="confidence">'+[["1","مش متأكد"],["2","متردد"],["3","شبه متأكد"],["4","متأكد جدًا"]].map(function(x){return'<button type="button" class="conf '+(SESSION.confidence===Number(x[0])?"active":"")+'" data-conf="'+x[0]+'">'+x[1]+'</button>';}).join("")+'</div><div class="actions"><button class="btn primary" id="revealFeedback" '+(!SESSION.confidence?"disabled":"")+'>اعرض التصحيح</button></div>';
  }else if(SESSION.feedback){
    var a=SESSION.feedback.attempt;var cls=a.raw_score>=.85?"good":a.raw_score>=.55?"warn":"bad";
    html+=renderQuestionBody(item);
    html+='<div class="feedback '+cls+'"><h3>'+(a.raw_score>=.85?"إجابة قوية":a.raw_score>=.55?"إجابة جزئية":"الإجابة تحتاج مراجعة")+'</h3><p>'+esc(item.explanation||"")+'</p>'+rubricFeedback(item,a.response_payload||{})+'<div class="scoreline"><b>نتيجة هذا السؤال التدريبية: '+Math.round(a.raw_score*100)+'%</b><span> • الدليل المعدّل: '+Math.round(a.evidence_value)+'</span></div><div class="small">الخطوة التالية: '+esc(actionLabel(a.action))+' • الثقة قبل التصحيح: '+a.confidence_pre_feedback+'/4</div></div><div class="actions"><button class="btn primary" id="nextDiagnostic">'+(chooseDimension()===null?"اعرض النتيجة الكاملة":"السؤال التالي")+'</button></div>';
  }else{
    html+=renderQuestionBody(item);
    html+='<div class="actions"><button class="btn primary" id="submitAnswer">ثبّت إجابتي</button><button class="btn ghost" id="hintBtn">تلميح</button>'+(item.type==="build_answer"?'<button class="btn outline" id="dontKnowBtn">لا أعرف — سجّلها كما هي</button>':'')+'</div>';
  }
  html+='</div><div class="small" style="margin-top:10px">لا ننتقل للسؤال التالي قبل تقييم هذه المحاولة. الصعود في الصعوبة يتم فقط بعد أداء قوي دون تلميح.</div></section>';
  return html;
}
function masteryScreen(){
  allMastery();var info=routeInfo();
  var dims=["recall","understanding","legal_precision","transfer","exam_execution"];
  var metrics=dims.map(function(d){
    var m=state.mastery[d]; if(!m)return '<div class="metric"><div class="metricHead"><span>'+dimLabel(d)+'</span><span>لم يُقاس</span></div><div class="reliability">لن نعرض 0% لبُعد لم يُختبر.</div></div>';
    var v=m.value;var extra=d==="exam_execution"?'<div class="metricnote">مصدر النسبة: الاختبار الامتحاني المصغّر • '+m.count+' سؤال</div>':'';
    return '<div class="metric"><div class="metricHead"><span>'+dimLabel(d)+'</span><span>'+pct(v)+'</span></div><div class="bar"><span style="width:'+v+'%"></span></div><div class="reliability">'+rawBand(v)+' • '+relLabel(m.reliability)+' • '+m.count+' دليل</div>'+extra+'</div>';
  }).join("");
  var examAtt=state.diagnostic.attempts.filter(function(a){return a.dimension==="exam_execution";});
  var examDetails=examAtt.length?'<div class="examdetail"><h3>تفاصيل الاختبار الامتحاني المصغّر</h3><p class="small">هذه هي الأسئلة التي أنتجت نسبة «الاختبار الامتحاني المصغّر» أعلاه.</p>'+examAtt.map(function(a,i){var it=itemById(a.item_id);return '<div class="evidencecard"><b>السؤال '+(i+1)+': '+esc(it?it.topic:"")+'</b><span>'+Math.round(a.raw_score*100)+'%</span><small>'+esc(it?it.prompt:"")+'</small></div>';}).join("")+'</div>':'';
  return '<section class="dashboard screen"><div class="panel">'+journey("mastery")+'<div class="kicker">نتيجة تشخيص البداية</div><h2>خريطة الإتقان الأولية</h2><div class="notice">هذه ليست «شخصية» ثابتة. كل نسبة مرتبطة بأسئلة ظهرت لك فعلًا. إذا كانت نتيجة الاختبار المصغّر 0%، ستجد أدناه السؤال أو الأسئلة التي جاءت منها هذه النتيجة.</div><div class="metricGrid">'+metrics+'<div class="metric"><div class="metricHead"><span>الاحتفاظ المؤجل</span><span>لم يُقاس بعد</span></div><div class="reliability">يُقاس في مراجعة لاحقة بعد مرور وقت فعلي، وليس في جلسة البداية.</div></div></div>'+examDetails+'</div><div class="pathcard"><div class="kicker" style="color:#e8c986">مسارك المقترح</div><h2>'+esc(info.title)+'</h2><p>'+esc(info.why)+'</p>'+info.steps.map(function(s,i){return'<div class="pathstep"><b>'+(i+1)+'.</b> '+esc(s)+'</div>';}).join("")+'<div class="actions"><button class="btn gold" id="enterToday">ابدأ مسار اليوم</button></div></div></section>';
}
function stats(){
  return '<div class="statgrid"><div class="stat"><strong>'+state.xp+'</strong><small>XP</small></div><div class="stat"><strong>'+state.streak+'</strong><small>Streak</small></div><div class="stat"><strong>'+state.diagnostic.attempts.length+'</strong><small>محاولات تشخيصية</small></div><div class="stat"><strong>'+state.activityHistory.length+'</strong><small>أنشطة تدريب</small></div></div>';
}
function todayScreen(){
  var info=routeInfo();var due=dueReviews().length;
  var acts=routeActivities();
  return '<section class="panel screen">'+journey("today")+'<div class="screenhead"><div><div class="kicker">مسار اليوم</div><h2>مسارك اليوم</h2><p class="small">'+esc(info.why)+'</p></div><span class="stepbadge">'+(due?due+" مراجعة مستحقة":"لا توجد مراجعات مستحقة")+'</span></div>'+stats()+'<div class="grid3" style="margin-top:14px">'+acts.map(activityCard).join("")+'<div class="activityCard"><div class="activityIcon">🎯</div><h3>تحدي اليوم</h3><p>سؤال واحد متغير يمنح XP إضافية، من غير Leaderboard عام في النسخة الأولى.</p><button class="btn primary" data-daily="1">ابدأ التحدي</button></div></div><div class="actions"><button class="btn ghost" data-nav="dashboard">اعرض لوحة التقدم</button><button class="btn ghost" data-nav="reviews">المراجعات المجدولة</button></div></section>';
}
function routeActivities(){
  if(state.route==="FOUNDATION")return["MISSING_ELEMENT","CASE_DETECTIVE"];
  if(state.route==="RETENTION_RECALL")return["MISSING_ELEMENT","CHANGE_ONE_FACT"];
  if(state.route==="ADVANCED_EXAM")return["BUILD_THE_ANSWER","CASE_DETECTIVE","CHANGE_ONE_FACT"];
  return["CHANGE_ONE_FACT","CASE_DETECTIVE","BUILD_THE_ANSWER"];
}
function activityCard(id){
  var a=C.activities[id];return'<div class="activityCard"><div class="activityIcon">'+a.icon+'</div><h3>'+esc(a.title)+'</h3><p>'+esc(a.description)+'</p><button class="btn secondary" data-activity="'+id+'">ابدأ</button></div>';
}
function activitiesScreen(){
  var recent=state.activityHistory.slice().reverse().slice(0,6);
  var history=recent.length?'<h3 style="margin-top:20px">آخر التدريبات</h3><div class="timeline">'+recent.map(function(x){var a=C.activities[x.activity];return '<div class="timelineItem"><b>'+esc(a?a.title:x.activity)+' • '+Math.round(x.raw*100)+'%</b><div class="small">'+esc(x.topic)+' • '+new Date(x.at).toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short"})+'</div></div>';}).join("")+'</div>':'<div class="empty" style="margin-top:18px">لم تنفذ تدريبًا بعد. أول نشاط مكتمل سيظهر هنا.</div>';
  return '<section class="panel screen">'+journey("activities")+'<div class="screenhead"><div><div class="kicker">التدريبات</div><h2>الأنشطة الأربعة الأساسية</h2></div><span class="stepbadge">النقاط ≠ الإتقان</span></div><div class="info">النقاط والتحفيز منفصلان عن الإتقان. كسب XP لا يرفع Mastery وحده.</div><div class="grid2">'+Object.keys(C.activities).map(activityCard).join("")+'</div>'+history+'</section>';
}
function startActivity(id,daily){
  var a=C.activities[id];if(!a)return;
  SESSION.activity=id;SESSION.activityItem=a.items[Math.floor(Math.random()*a.items.length)];SESSION.selected=null;SESSION.reason="";SESSION.feedback=null;SESSION.hintLevel=0;SESSION.daily=!!daily;
  state.screen="activity_play";save();render();
}
function evalActivity(item,response){
  if(item.options){var o=item.options.find(function(x){return x.id===response.choice;});return o?o.score:0;}
  if(item.accepted){var n=norm(response.text);return item.accepted.some(function(x){return n.indexOf(norm(x))>=0;})?1:0;}
  if(item.rubric){var h=0;item.rubric.forEach(function(r){if(scoreKeywords(response.text,r.keywords||[],1)>0)h++;});return h/item.rubric.length;}
  return 0;
}
function activityPlay(){
  var a=C.activities[SESSION.activity],it=SESSION.activityItem;
  if(!a||!it){go("activities");return"";}
  var html='<section class="panel screen"><div class="screenhead"><div><div class="kicker">'+(SESSION.daily?"Daily Challenge":"Practice Activity")+'</div><h2>'+a.icon+' '+esc(a.title)+'</h2></div><span class="stepbadge">'+esc(dimLabel(a.dimension))+'</span></div><div class="questionCard">';
  if(it.scenario)html+='<div class="challenge">'+esc(it.scenario)+'</div>';
  html+='<h3>'+esc(it.prompt)+'</h3>';
  if(it.options)html+=it.options.map(function(o){return'<label class="choice '+(SESSION.selected===o.id?"selected":"")+'" data-act-choice="'+o.id+'"><input type="radio" '+(SESSION.selected===o.id?"checked":"")+'/> '+esc(o.text)+'</label>';}).join("");
  else html+='<textarea id="actText" placeholder="اكتب إجابتك...">'+esc(SESSION.reason)+'</textarea>';
  if(SESSION.feedback){
    var cls=SESSION.feedback.raw>=.85?"good":SESSION.feedback.raw>=.55?"warn":"bad";
    var ref=''; if(it.answer)ref='<div class="goodbox"><b>الإجابة المرجعية:</b> '+esc(it.answer)+'</div>'; else if(it.options){var correct=it.options.find(function(o){return o.score===1;}); if(correct)ref='<div class="goodbox"><b>الإجابة الأقرب:</b> '+esc(correct.text)+'</div>';} else if(it.rubric)ref='<div class="info"><b>عناصر الإجابة الجيدة:</b> '+it.rubric.map(function(r){return esc(r.label);}).join(' • ')+'</div>';
    html+='<div class="feedback '+cls+'"><h3>'+ (SESSION.feedback.raw>=.85?"ممتاز":"راجع الفكرة") +'</h3><p>'+esc(it.explanation||"")+'</p>'+ref+'<div class="small">النتيجة التدريبية: '+Math.round(SESSION.feedback.raw*100)+'%</div></div><div class="actions"><button class="btn primary" id="finishActivity">ارجع لمسار اليوم</button></div>';
  }else html+='<div class="actions"><button class="btn primary" id="submitActivity">قيّم التدريب</button><button class="btn ghost" data-nav="activities">خروج</button></div>';
  html+='</div></section>';return html;
}
function dueReviews(){var now=Date.now();return state.reviews.filter(function(r){return new Date(r.due).getTime()<=now;});}
function reviewsScreen(){
  var due=dueReviews();var upcoming=state.reviews.filter(function(r){return new Date(r.due).getTime()>Date.now();}).sort(function(a,b){return new Date(a.due)-new Date(b.due);});
  var html='<section class="panel screen">'+journey("reviews")+'<div class="screenhead"><div><div class="kicker">المراجعة الذكية</div><h2>المراجعات المجدولة</h2></div><span class="stepbadge">'+due.length+' مستحقة</span></div>';
  if(due.length)html+='<div class="grid2">'+due.map(function(r){return'<div class="activityCard"><h3>'+esc(r.topic)+'</h3><p>موعد المراجعة حلّ الآن. الإتقان المؤجل لن يتحدث قبل محاولة فعلية.</p><button class="btn primary" data-review="'+r.id+'">راجع الآن</button></div>';}).join("")+'</div>';
  else html+='<div class="empty">لا توجد مراجعات مستحقة الآن. أول مراجعاتك ستظهر في موعدها بدل اختبار الاحتفاظ فورًا.</div>';
  if(upcoming.length)html+='<h3 style="margin-top:18px">القادم</h3><div class="timeline">'+upcoming.slice(0,6).map(function(r){return'<div class="timelineItem"><b>'+esc(r.topic)+'</b><div class="small">'+new Date(r.due).toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short"})+' • interval '+r.interval+' يوم</div></div>';}).join("")+'</div>';
  html+='</section>';return html;
}
function startReview(id){
  var r=state.reviews.find(function(x){return x.id===id;});if(!r)return;
  var it=itemById(r.itemId) || C.diagnosticItems.find(function(x){return x.topic===r.topic;});
  if(!it){toast("لا يوجد عنصر مراجعة صالح");return;}
  SESSION.activity="REVIEW";SESSION.activityItem=it;SESSION.reviewId=id;SESSION.selected=null;SESSION.reason="";SESSION.feedback=null;state.screen="review_play";save();render();
}
function reviewPlay(){
  var it=SESSION.activityItem;if(!it){go("reviews");return"";}
  var html='<section class="panel screen"><div class="screenhead"><div><div class="kicker">Delayed Retention</div><h2>مراجعة مؤجلة</h2></div><span class="stepbadge">'+esc(it.topic)+'</span></div><div class="questionCard">'+renderGenericItem(it,"rev");
  if(SESSION.feedback){
    html+='<div class="feedback '+(SESSION.feedback.raw>=.75?"good":"warn")+'"><h3>تم تحديث الاحتفاظ المؤجل</h3><p>'+esc(it.explanation||"")+'</p></div><div class="actions"><button class="btn primary" data-nav="reviews">إنهاء</button></div>';
  }else html+='<div class="actions"><button class="btn primary" id="submitReview">اعتمد المراجعة</button></div>';
  html+='</div></section>';return html;
}
function renderGenericItem(it,prefix){
  var h='<h3>'+esc(it.prompt)+'</h3>';
  if(it.type==="load_recall" && it.cards)h+='<div class="stimulus">'+it.cards.map(function(x){return'<div>'+esc(x)+'</div>';}).join("")+'</div>';
  if(it.options)h+=it.options.map(function(o){return'<label class="choice '+(SESSION.selected===o.id?"selected":"")+'" data-'+prefix+'-choice="'+o.id+'"><input type="radio" '+(SESSION.selected===o.id?"checked":"")+'/> '+esc(o.text)+'</label>';}).join("");
  else h+='<textarea id="'+prefix+'Text" placeholder="اكتب إجابتك...">'+esc(SESSION.reason)+'</textarea>';
  if(it.type==="mcq_reason")h+='<textarea id="'+prefix+'Reason" placeholder="اكتب سببًا مختصرًا...">'+esc(SESSION.reason)+'</textarea>';
  return h;
}
function dashboardScreen(){
  allMastery();var dims=["recall","understanding","legal_precision","transfer","exam_execution"];var info=routeInfo();
  var attempts=state.diagnostic.attempts.slice().reverse().slice(0,6);
  return '<section class="panel screen">'+journey("dashboard")+'<div class="screenhead"><div><div class="kicker">لوحة التقدم</div><h2>'+esc(course().code)+' — '+esc(course().title_ar)+'</h2></div><span class="stepbadge">'+esc(info.title)+'</span></div>'+stats()+'<div class="metricGrid" style="margin-top:14px">'+dims.map(function(d){var m=state.mastery[d];var v=m?m.value:0;return'<div class="metric"><div class="metricHead"><span>'+dimLabel(d)+'</span><span>'+(m?pct(v):"—")+'</span></div><div class="bar"><span style="width:'+v+'%"></span></div><div class="reliability">'+(m?relLabel(m.reliability)+" • "+m.count+" دليل":"بانتظار الأدلة")+'</div></div>';}).join("")+'<div class="metric"><div class="metricHead"><span>الاحتفاظ المؤجل</span><span>'+(state.mastery.retention?pct(state.mastery.retention.value):"Pending")+'</span></div><div class="bar"><span style="width:'+(state.mastery.retention?state.mastery.retention.value:0)+'%"></span></div><div class="reliability">يتحدث فقط من المراجعات المؤجلة.</div></div></div><div class="grid2" style="margin-top:16px"><div><h3>ملاحظات التعلّم</h3><div class="badges">'+(state.flags.length?state.flags.map(function(f){return'<span class="badgeitem">'+esc(f)+'</span>';}).join(""):'<span class="small">لا توجد إشارات خاصة حاليًا.</span>')+'</div><h3 style="margin-top:18px">الشارات</h3><div class="badges">'+(state.badges.length?state.badges.map(function(f){return'<span class="badgeitem">🏅 '+esc(f)+'</span>';}).join(""):'<span class="small">ستظهر شارات محدودة مع الاستمرار.</span>')+'</div></div><div><h3>آخر الأدلة</h3><div class="timeline">'+attempts.map(function(a){return'<div class="timelineItem"><b>'+esc(dimLabel(a.dimension))+' • '+Math.round(a.evidence_value)+'</b><div class="small">'+esc(a.topic_id)+' • '+esc(a.action)+'</div></div>';}).join("")+'</div></div></div><div class="notice" style="margin-top:18px"><b>درجة الاختبار المصغّر تدريبية وليست درجة جامعية.</b> وهي مرتبطة بالأسئلة الامتحانية التي ظهرت لك وعناصر التصحيح الموضحة بعد كل إجابة.</div></section>';
}
function aboutScreen(){
  var c=course();
  return '<section class="panel screen"><div class="kicker">About this build</div><h2>ما الذي يعمل الآن؟</h2><div class="grid2"><div><h3>مفعّل</h3><p>طلاب القانون فقط • قطر P0 • LAWC 101 • تشخيص تكيفي متسلسل • Mastery متعدد الأبعاد • 4 أنشطة • XP/Streak • مراجعة SM-2 • Dashboard محلي.</p></div><div><h3>مؤجل</h3><p>الخريجون • مصر كمحتوى منشور • Leaderboard عام • Live Duels • قاعدة امتحانات فعلية • لوحات مؤسسات • Backend AI production.</p></div></div><div class="notice">التقييم الحالي Local Rubric Demo. عند ربط AI production يجب أن يتلقى فقط مصادر معتمدة مرتبطة بالسؤال، ويعيد Training Feedback منظمًا، لا «درجة رسمية».</div><div class="sourcebox"><b>مصدر بنية المقرر:</b> <a href="'+esc(c.officialSource)+'" target="_blank" rel="noopener">'+esc(c.university)+' — وصف '+esc(c.code)+'</a>.<br>'+esc(c.sourceNote)+'</div><div class="actions"><button class="btn outline" id="exportData">تصدير بيانات التعلم JSON</button><button class="btn ghost" id="resetApp">إعادة ضبط التجربة</button></div></section>';
}
function adminScreen(){
  return '<section class="panel screen"><div class="kicker">Local Admin Preview</div><h2>إدارة المحتوى — نموذج محلي</h2><div class="notice">هذه ليست لوحة إدارة إنتاجية ولا تحتوي صلاحيات أو Backend. الهدف فقط توضيح الفصل بين المحتوى المعتمد والمحتوى Draft.</div><table class="adminTable"><thead><tr><th>المقرر</th><th>Diagnostic items</th><th>الأنشطة</th><th>الحالة</th></tr></thead><tbody><tr><td>'+esc(course().code)+'</td><td>'+C.diagnosticItems.length+'</td><td>'+Object.keys(C.activities).length+'</td><td>Seed / Review required</td></tr></tbody></table></section>';
}
function render(){
  var html=header()+'<main class="app">';
  if(state.screen==="country")html+=countryScreen();
  else if(state.screen==="context")html+=contextScreen();
  else if(state.screen==="diagnostic_intro")html+=diagnosticIntro();
  else if(state.screen==="diagnostic")html+=diagnosticScreen();
  else if(state.screen==="mastery")html+=masteryScreen();
  else if(state.screen==="today")html+=todayScreen();
  else if(state.screen==="activities")html+=activitiesScreen();
  else if(state.screen==="activity_play")html+=activityPlay();
  else if(state.screen==="reviews")html+=reviewsScreen();
  else if(state.screen==="review_play")html+=reviewPlay();
  else if(state.screen==="dashboard")html+=dashboardScreen();
  else if(state.screen==="about")html+=aboutScreen();
  else if(state.screen==="admin")html+=adminScreen();
  else html+=countryScreen();
  html+='</main><div class="footer">LexLearn AI • Student Edition • Adaptive legal learning prototype</div>';
  APP.innerHTML=html;
  bind();
}
function bind(){
  document.querySelectorAll("[data-country]").forEach(function(el){el.onclick=function(){
    var id=el.getAttribute("data-country");
    if(id==="EG"){document.getElementById("waitModal").classList.remove("hidden");return;}
    state.country=id;state.courseId="QA-QU-LAWC101";go("context");
  };});
  var sc=document.getElementById("startCourse");if(sc)sc.onclick=function(){go("diagnostic_intro");};
  var bc=document.getElementById("backCountry");if(bc)bc.onclick=function(){go("country");};
  var bctx=document.getElementById("backContext");if(bctx)bctx.onclick=function(){go("context");};
  var bd=document.getElementById("beginDiagnostic");if(bd)bd.onclick=function(){state.diagnostic.started=true;go("diagnostic");};
  var ea=document.getElementById("enterToday");if(ea)ea.onclick=function(){go("today");};
  var ab=document.getElementById("aboutBtn");if(ab)ab.onclick=function(){go("about");};
  document.querySelectorAll("[data-nav]").forEach(function(el){el.onclick=function(){go(el.getAttribute("data-nav"));};});
  document.querySelectorAll("[data-activity]").forEach(function(el){el.onclick=function(){startActivity(el.getAttribute("data-activity"),false);};});
  document.querySelectorAll("[data-daily]").forEach(function(el){el.onclick=function(){var ids=routeActivities();startActivity(ids[Math.floor(Math.random()*ids.length)],true);};});
  document.querySelectorAll("[data-review]").forEach(function(el){el.onclick=function(){startReview(el.getAttribute("data-review"));};});
  if(state.screen==="diagnostic")bindDiagnostic();
  if(state.screen==="activity_play")bindActivity();
  if(state.screen==="review_play")bindReview();
  var ex=document.getElementById("exportData");if(ex)ex.onclick=exportData;
  var rs=document.getElementById("resetApp");if(rs)rs.onclick=function(){if(confirm("سيتم مسح التقدم المحلي لهذه التجربة. هل تريد المتابعة؟")){localStorage.removeItem(STORAGE);state=freshState();go("country");}};
}
function bindDiagnostic(){
  var item=currentQuestion();if(!item)return;
  var h=document.getElementById("hideLoad");if(h)h.onclick=function(){SESSION.loadHidden=true;renderDiagnostic();};
  document.querySelectorAll("[data-choice]").forEach(function(el){el.onclick=function(){SESSION.selected=el.getAttribute("data-choice");renderDiagnostic();};});
  var ri=document.getElementById("reasonInput");if(ri)ri.oninput=function(){SESSION.reason=ri.value;};
  var ti=document.getElementById("textInput");if(ti)ti.oninput=function(){SESSION.reason=ti.value;};
  var hint=document.getElementById("hintBtn");if(hint)hint.onclick=function(){SESSION.hintLevel=Math.min(3,SESSION.hintLevel+1);renderDiagnostic();};
  var dk=document.getElementById("dontKnowBtn");if(dk)dk.onclick=function(){SESSION.reason="لا أعرف";var response={choice:null,reason:SESSION.reason,text:SESSION.reason};SESSION.pending={raw:0,response:response,latency_ms:Math.max(1000,Date.now()-(window.__itemShownAt||Date.now()-5000))};renderDiagnostic();};
  var sub=document.getElementById("submitAnswer");if(sub)sub.onclick=function(){
    var response={choice:SESSION.selected,reason:SESSION.reason,text:SESSION.reason};
    if(item.options && !SESSION.selected){toast("اختر إجابة أولًا");return;}
    if(item.type==="mcq_reason" && norm(SESSION.reason).length<4){toast("اكتب سببًا قصيرًا");return;}
    if((item.type==="missing_element"||item.type==="build_answer") && norm(SESSION.reason).length<2){toast("اكتب إجابتك أولًا");return;}
    SESSION.pending={raw:evaluateItem(item,response),response:response,latency_ms:Math.max(1000,Date.now()-(window.__itemShownAt||Date.now()-5000))};
    renderDiagnostic();
  };
  document.querySelectorAll("[data-conf]").forEach(function(el){el.onclick=function(){SESSION.confidence=Number(el.getAttribute("data-conf"));document.querySelectorAll("[data-conf]").forEach(function(x){x.classList.toggle("active",x===el);});var b=document.getElementById("revealFeedback");if(b)b.disabled=false;};});
  var rf=document.getElementById("revealFeedback");if(rf)rf.onclick=finalizeAttempt;
  var nx=document.getElementById("nextDiagnostic");if(nx)nx.onclick=function(){
    SESSION={pending:null,selected:null,reason:"",confidence:null,hintLevel:0,loadHidden:false,feedback:null,activity:null,activityItem:null};
    state.diagnostic.currentId=null;
    var next=chooseNextItem();
    if(!next){finishDiagnostic();return;}
    state.diagnostic.currentId=next.id;if(state.diagnostic.used.indexOf(next.id)<0)state.diagnostic.used.push(next.id);save();renderDiagnostic();
  };
  window.__itemShownAt=window.__itemShownAt||Date.now();
}
function renderDiagnostic(){APP.querySelector("main.app").outerHTML='<main class="app">'+diagnosticScreen()+'</main>';bind();}
function bindActivity(){
  document.querySelectorAll("[data-act-choice]").forEach(function(el){el.onclick=function(){SESSION.selected=el.getAttribute("data-act-choice");render();};});
  var t=document.getElementById("actText");if(t)t.oninput=function(){SESSION.reason=t.value;};
  var s=document.getElementById("submitActivity");if(s)s.onclick=function(){
    var it=SESSION.activityItem;var resp={choice:SESSION.selected,text:SESSION.reason};
    if(it.options && !SESSION.selected){toast("اختر إجابة");return;}
    if(!it.options && norm(SESSION.reason).length<3){toast("اكتب إجابتك");return;}
    var raw=evalActivity(it,resp);SESSION.feedback={raw:raw};
    state.activityHistory.push({activity:SESSION.activity,item:it.id,topic:it.topic,raw:raw,at:new Date().toISOString(),daily:!!SESSION.daily});
    addXP((SESSION.daily?15:8)+(raw>=.85?5:0),SESSION.daily?"تحدي اليوم":"تدريب");
    scheduleReview(it.topic,C.diagnosticItems.find(function(x){return x.topic===it.topic;})?.id||state.diagnostic.used[0],raw);
    save();render();
  };
  var f=document.getElementById("finishActivity");if(f)f.onclick=function(){go("today");};
}
function bindReview(){
  document.querySelectorAll("[data-rev-choice]").forEach(function(el){el.onclick=function(){SESSION.selected=el.getAttribute("data-rev-choice");render();};});
  var tx=document.getElementById("revText");if(tx)tx.oninput=function(){SESSION.reason=tx.value;};
  var rr=document.getElementById("revReason");if(rr)rr.oninput=function(){SESSION.reason=rr.value;};
  var s=document.getElementById("submitReview");if(s)s.onclick=function(){
    var it=SESSION.activityItem;var resp={choice:SESSION.selected,reason:SESSION.reason,text:SESSION.reason};
    if(it.options && !SESSION.selected){toast("اختر إجابة");return;}
    var raw=evaluateItem(it,resp);
    var ev=Math.round(raw*100);
    var old=state.mastery.retention;
    var count=old?old.count+1:1;
    var val=old?((old.value*(count-1)+ev)/count):ev;
    state.mastery.retention={value:val,count:count,reliability:count>=2?"HIGH":count>=1?"MEDIUM":"LOW",updatedAt:new Date().toISOString()};
    var r=state.reviews.find(function(x){return x.id===SESSION.reviewId;});if(r){r.due=new Date(Date.now()+Math.max(1,r.interval)*86400000).toISOString();}
    SESSION.feedback={raw:raw};addXP(10,"مراجعة مؤجلة");save();render();
  };
}
function exportData(){
  var blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download="lexlearn-learning-data.json";a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);
}
function openWait(){
  state.waitlistEgypt=true;save();document.getElementById("waitModal").classList.add("hidden");toast("تم تسجيل الاهتمام محليًا — بدون إرسال بيانات شخصية.");
}
document.body.insertAdjacentHTML("beforeend",'<div id="waitModal" class="modal hidden"><div class="modalbox"><div class="kicker">Egypt track</div><h2>المحتوى المصري قريبًا</h2><p>المعمار جاهز لمصر، لكننا لن ننشر مسارًا دراسيًا قبل مراجعة المحتوى والمصادر. النسخة P0 مركزة على قطر ومقرر واحد.</p><div class="actions"><button class="btn primary" id="waitLocal">سجل اهتمامي في هذه التجربة</button><button class="btn ghost" id="closeWait">إغلاق</button></div></div></div><div id="toast" class="toast"></div>');
document.getElementById("waitLocal").onclick=openWait;
document.getElementById("closeWait").onclick=function(){document.getElementById("waitModal").classList.add("hidden");};

if(new URLSearchParams(location.search).get("admin")==="1"){state.screen="admin";}
else if(state.diagnostic.completed && ["country","context","diagnostic_intro"].indexOf(state.screen)>=0){state.screen="today";}
render();
})();