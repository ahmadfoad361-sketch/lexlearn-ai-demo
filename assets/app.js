(function(){
"use strict";

var C = window.LEX_CONTENT;
var APP = document.getElementById("app");
var STORAGE = "lexlearn_v4_grouped";
var SESSION = {answers:{},pending:null,confidence:null,activity:null,activityAnswer:null,activityFeedback:null};

var DIM_LABELS = {
  recall:"الاسترجاع",
  understanding:"الفهم",
  legal_precision:"الدقة القانونية",
  transfer:"التطبيق",
  exam_execution:"الاختبار الامتحاني"
};

function freshCourseState(){
  return {groupIndex:0,groupResults:[],mastery:{},route:null,xp:0,streak:0,lastActive:null,reviews:[],activityHistory:[],completed:false};
}
function freshState(){
  return {schema:4,country:null,courseId:null,screen:"country",courses:{},createdAt:new Date().toISOString()};
}
function load(){
  try{
    var s=JSON.parse(localStorage.getItem(STORAGE));
    if(!s || s.schema!==4)return freshState();
    return s;
  }catch(e){return freshState();}
}
var state=load();

function save(){localStorage.setItem(STORAGE,JSON.stringify(state));}
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
  var s=cs();var nav="";
  if(s&&s.completed){
    nav='<button class="iconbtn" data-nav="today">مسار اليوم</button><button class="iconbtn" data-nav="activities">التدريبات</button><button class="iconbtn" data-nav="reviews">المراجعات</button><button class="iconbtn" data-nav="dashboard">لوحة التقدم</button><button class="iconbtn" data-nav="course">تغيير المقرر</button>';
  }
  return '<header class="topbar"><div class="topin"><div class="brand"><div class="logo">Lx</div><div class="brandtext"><b>LexLearn AI</b><small>طلاب القانون • تعلم تكيفي</small></div></div><div class="topactions">'+nav+(s&&s.completed?'<span class="pill gold">⭐ '+s.xp+' XP</span><span class="pill">🔥 '+s.streak+'</span>':'')+'</div></div></header>';
}

function countryScreen(){
  return '<section class="panel screen onboarding">'+journey("country")+'<div class="screenhead"><div><div class="kicker">البداية</div><h2>اختر النظام القانوني</h2><p class="small">النسخة التجريبية الحالية مفعّلة لقطر.</p></div></div><div class="grid2"><div class="option clickable" data-country="QA"><span class="countryflag">🇶🇦</span><b>قطر</b><small>جامعة قطر — مقرران متاحان للتجربة.</small></div><div class="option disabled"><span class="countryflag">🇪🇬</span><b>مصر</b><small>قريبًا بعد مراجعة المحتوى المصري.</small></div></div></section>';
}
function courseScreen(){
  var courses=C.courses.filter(function(x){return x.jurisdiction==="QA";});
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
  SESSION={answers:{},pending:null,confidence:null,activity:null,activityAnswer:null,activityFeedback:null};
  if(s.groupIndex>=course().groups.length){finishDiagnostic();return;}
  save();render();
}
function finishDiagnostic(){
  var s=cs();s.completed=true;computeMastery();state.screen="results";save();render();window.scrollTo({top:0,behavior:"smooth"});
}

function resultsScreen(){
  var s=cs(),c=course(),ri=routeInfo();
  var dims=["recall","understanding","legal_precision","transfer","exam_execution"];
  var metrics=dims.map(function(d){
    var m=s.mastery[d];return '<div class="metric"><div class="metricHead"><span>'+dimensionLabel(d)+'</span><span>'+(m?pct(m.value):"لم يُقاس")+'</span></div>'+(m?'<div class="bar"><span style="width:'+m.value+'%"></span></div><div class="reliability">'+m.evidence+' دليل</div>':'<div class="reliability">لا توجد إجابة كافية لهذا البُعد.</div>')+'</div>';
  }).join("");
  var exam=s.groupResults.find(function(g){return g.groupId===c.groups[c.groups.length-1].id;});
  var examDetail=exam?'<div class="examdetail"><h3>من أين جاءت درجة الاختبار الامتحاني؟</h3><p class="small">كل سؤال ظاهر هنا بنتيجته، لذلك لا توجد درجة صفر غامضة.</p>'+exam.items.map(function(x,i){var it=findItem(x.itemId);return '<div class="evidencecard"><b>سؤال '+(i+1)+': '+esc(it.prompt)+'</b><span>'+Math.round(x.score*100)+'%</span></div>';}).join("")+'</div>':'';
  return '<section class="dashboard screen"><div class="panel">'+journey("results")+'<div class="kicker">النتيجة الشاملة</div><h2>'+esc(c.code)+' — '+esc(c.title_ar)+'</h2><div class="notice">كل نسبة هنا لها أسئلة فعلية ظهرت لك. «لم يُقاس» لا تتحول إلى 0%. الإجابات المقالية تُصحح حاليًا بمحرك مفاهيمي يقبل بدائل لغوية متعددة، وليس بمجرد مطابقة كلمة واحدة.</div><div class="metricGrid">'+metrics+'<div class="metric"><div class="metricHead"><span>الاحتفاظ المؤجل</span><span>لم يُقاس بعد</span></div><div class="reliability">يظهر بعد مراجعة لاحقة، وليس في جلسة البداية.</div></div></div>'+examDetail+'</div><div class="pathcard"><div class="kicker" style="color:#e8c986">المسار الناتج</div><h2>'+esc(ri.title)+'</h2><p>'+esc(ri.why)+'</p>'+ri.steps.map(function(x,i){return '<div class="pathstep"><b>'+(i+1)+'.</b> '+esc(x)+'</div>';}).join("")+'<div class="actions"><button class="btn gold" id="enterTraining">ابدأ التدريب</button></div></div></section>';
}

function stats(){
  var s=cs();return '<div class="statgrid"><div class="stat"><strong>'+s.xp+'</strong><small>XP</small></div><div class="stat"><strong>'+s.streak+'</strong><small>أيام متتالية</small></div><div class="stat"><strong>'+s.groupResults.length+'</strong><small>مجموعات تشخيص</small></div><div class="stat"><strong>'+s.activityHistory.length+'</strong><small>تدريبات مكتملة</small></div></div>';
}
function todayScreen(){
  var s=cs(),c=course(),ri=routeInfo(),due=dueReviews();
  return '<section class="panel screen">'+journey("training")+'<div class="screenhead"><div><div class="kicker">مسار اليوم</div><h2>'+esc(c.title_ar)+'</h2><p class="small">'+esc(ri.why)+'</p></div><span class="stepbadge">'+due.length+' مراجعات مستحقة</span></div>'+stats()+'<div class="grid3" style="margin-top:15px">'+c.activities.map(activityCard).join("")+'<div class="activityCard"><div class="activityIcon">✍️</div><h3>تحدي امتحاني</h3><p>سؤال كتابي واحد من الاختبار المصغّر للتدريب على التنظيم.</p><button class="btn primary" data-examactivity="1">ابدأ</button></div></div></section>';
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
  var s=cs(),c=course(),ri=routeInfo();
  var dims=["recall","understanding","legal_precision","transfer","exam_execution"];
  return '<section class="panel screen">'+journey("training")+'<div class="screenhead"><div><div class="kicker">لوحة التقدم</div><h2>'+esc(c.code)+' — '+esc(c.title_ar)+'</h2></div><span class="stepbadge">'+esc(ri.title)+'</span></div>'+stats()+'<div class="metricGrid" style="margin-top:15px">'+dims.map(function(d){var m=s.mastery[d];return '<div class="metric"><div class="metricHead"><span>'+dimensionLabel(d)+'</span><span>'+(m?pct(m.value):"لم يُقاس")+'</span></div>'+(m?'<div class="bar"><span style="width:'+m.value+'%"></span></div><div class="reliability">'+m.evidence+' دليل</div>':'')+'</div>';}).join("")+'<div class="metric"><div class="metricHead"><span>الاحتفاظ المؤجل</span><span>لم يُقاس بعد</span></div><div class="reliability">يتحدث بعد مراجعة فعلية لاحقة.</div></div></div><div class="notice" style="margin-top:16px"><b>مهم:</b> النسب تدريبية داخل النموذج الحالي وليست درجات جامعية رسمية.</div></section>';
}

function render(){
  var html=header()+'<main class="app">';
  if(state.screen==="country")html+=countryScreen();
  else if(state.screen==="course")html+=courseScreen();
  else if(state.screen==="diagnostic_intro")html+=diagnosticIntro();
  else if(state.screen==="diagnostic_group")html+=groupScreen();
  else if(state.screen==="results")html+=resultsScreen();
  else if(state.screen==="today")html+=todayScreen();
  else if(state.screen==="activities")html+=activitiesScreen();
  else if(state.screen==="activity_play")html+=activityPlay();
  else if(state.screen==="reviews")html+=reviewsScreen();
  else if(state.screen==="dashboard")html+=dashboardScreen();
  else html+=countryScreen();
  html+='</main><div class="footer">LexLearn AI • Student Edition • Prototype with local scoring</div>';
  APP.innerHTML=html;bind();
}
function bind(){
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