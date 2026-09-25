(function(){
"use strict";
var APP=document.getElementById("pilotApp");
var DEMO=new URLSearchParams(location.search).get("demo")==="1";
var RESEARCHER=new URLSearchParams(location.search).get("researcher")==="1";
var KEY="lexlearn_pilot0_qa_sources_v1";
var now=function(){return Date.now();};
var items=[
{id:"R1",d:"recall",s:"المادة 64 — القانون المدني القطري رقم 22 لسنة 2004",q:"ما العنصر الذي يرتبط به انعقاد العقد وفق النص؟",o:["الإيجاب والقبول","وقوع ضرر","الإثراء بلا سبب"],a:0},
{id:"R2",d:"recall",s:"المادة 64",q:"ما الذي ذكره النص إلى جانب ارتباط الإيجاب بالقبول؟",o:["أن يكون المحل والسبب معتبرين قانونًا","أن يكون الطرفان تاجرين","أن يمر عام كامل"],a:0},
{id:"R3",d:"recall",s:"مصادر الالتزام",q:"أي مما يلي يعد مصدرًا غير عقدي للالتزام؟",o:["الفعل الضار","القبول","شرط في العقد"],a:0},
{id:"R4",d:"recall",s:"مصادر الالتزام",q:"أي عبارة ترتبط بفكرة الإثراء بلا سبب؟",o:["انتقال منفعة دون سند يبررها","تطابق إرادتين","تنفيذ الالتزام عينًا فقط"],a:0},
{id:"R5",d:"recall",s:"مصادر الالتزام",q:"أي مصدر قد ينشئ الالتزام مباشرة دون اتفاق سابق بين شخصين؟",o:["القانون","الإيجاب وحده دائمًا","المفاوضات فقط"],a:0},

{id:"U1",d:"understanding",s:"المادة 64",q:"هل يكفي تطابق الإرادتين دائمًا حتى لو كان محل العقد غير معتبر قانونًا؟",o:["لا","نعم دائمًا","فقط إذا كان العقد شفهيًا"],a:0},
{id:"U2",d:"understanding",s:"المادة 64",q:"لماذا يشير النص إلى الأوضاع الخاصة لبعض العقود؟",o:["لأن بعض العقود قد يتطلب القانون شكلًا أو إجراءً خاصًا لانعقادها","لأن كل العقود تحتاج توثيقًا","لأن الإيجاب لا قيمة له"],a:0},
{id:"U3",d:"understanding",s:"مصادر الالتزام",q:"ما الفرق الأقرب بين العقد والفعل الضار كمصدرين للالتزام؟",o:["العقد يقوم على توافق إرادات، والفعل الضار قد يرتب التزامًا بالتعويض دون اتفاق","لا يوجد فرق","الفعل الضار لا يرتب التزامًا"],a:0},
{id:"U4",d:"understanding",s:"مصادر الالتزام",q:"أي تفسير أدق لفكرة القانون كمصدر للالتزام؟",o:["قد يقرر القانون التزامًا مباشرة متى تحققت شروطه","لا ينشئ القانون التزامات إلا إذا اتفق الأطراف","القانون مجرد مصدر معلومات"],a:0},
{id:"U5",d:"understanding",s:"مصادر الالتزام",q:"لماذا لا يكفي حفظ اسم المصدر القانوني وحده في المسألة؟",o:["لأن المطلوب ربط عناصر المصدر بوقائع المسألة","لأن أسماء المصادر غير مهمة","لأن كل المسائل لها نتيجة واحدة"],a:0},

{id:"A1",d:"application",s:"تطبيق — العقد",q:"اتفق الطرفان على الثمن والمبيع، لكن محل التعامل محظور قانونًا. أي عنصر يجب فحصه أولًا؟",o:["مشروعية المحل","مكان الاجتماع","عمر الورقة المكتوب عليها"],a:0},
{id:"A2",d:"application",s:"تطبيق — العقد",q:"صدر إيجاب ببيع شيء بثمن محدد، ورد الطرف الآخر بالموافقة على الشراء بشرط ثمن مختلف. ما القضية الأساسية؟",o:["هل تحقق تطابق الإرادتين على العناصر الجوهرية؟","هل يوجد إثراء بلا سبب؟","هل وقع فعل ضار؟"],a:0},
{id:"A3",d:"application",s:"تطبيق — الفعل الضار",q:"أتلف شخص مال غيره دون وجود عقد بينهما. أي مصدر للالتزام يبدو أقرب للفحص؟",o:["الفعل الضار","العقد","الإرادة المنفردة فقط"],a:0},
{id:"A4",d:"application",s:"تطبيق — الإثراء",q:"حصل شخص على منفعة مالية من مال شخص آخر دون سند ظاهر، ولم تكن الواقعة عقدًا ولا فعلًا ضارًا بحسب المعطيات. ما الفكرة التي تستحق الفحص؟",o:["الإثراء بلا سبب","تطابق الإيجاب والقبول","التقادم فقط"],a:0},
{id:"A5",d:"application",s:"تطبيق — القانون",q:"إذا رتب نص قانوني التزامًا بمجرد تحقق حالة محددة دون اتفاق الأطراف، فما المصدر الأقرب؟",o:["القانون","العقد","الفعل الضار بالضرورة"],a:0}
];
var delayed=[
{id:"D1",d:"retention",q:"من غير مراجعة: ما العنصران المرتبطان بانعقاد العقد في النص الذي رأيته؟",o:["الإيجاب والقبول","الضرر والتعويض","الإثراء والافتقار"],a:0},
{id:"D2",d:"retention",q:"من غير مراجعة: أي عنصر إضافي كان لازمًا في النص إلى جانب توافق الإرادتين؟",o:["اعتبار المحل والسبب قانونًا","وجود شاهدين دائمًا","مرور مدة"],a:0},
{id:"D3",d:"retention",q:"من غير مراجعة: أي مصدر غير تعاقدي ظهر في الأسئلة؟",o:["الفعل الضار","القبول","الثمن"],a:0},
{id:"D4",d:"retention",q:"من غير مراجعة: أي مصدر قد ينشئ التزامًا مباشرة؟",o:["القانون","المفاوضات","الإيجاب وحده في كل الأحوال"],a:0},
{id:"D5",d:"retention",q:"من غير مراجعة: ما الفكرة الأقرب لانتقال منفعة دون سند يبررها؟",o:["الإثراء بلا سبب","العقد","الشرط الجزائي"],a:0},
{id:"D6",d:"retention",q:"من غير مراجعة: إذا اختلف القبول عن الإيجاب في عنصر جوهري، ما أول شيء نفحصه؟",o:["مدى تطابق الإرادتين","الإثراء بلا سبب","الفعل الضار"],a:0}
];
function emptyData(){return {participant:"",startedAt:null,finishedAt:null,dueAt:null,responses:[],constructed:"",delayed:[],delayedFinishedAt:null};}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||emptyData();}catch(e){return emptyData();}}
var data=load(),state={view:"intro",i:0,phase:"baseline",startedItemAt:null};
function save(){localStorage.setItem(KEY,JSON.stringify(data));}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
function shuffleItem(item){
  var pairs=item.o.map(function(x,i){return {t:x,correct:i===item.a};});
  for(var i=pairs.length-1;i>0;i--){var j=Math.floor((i+1)*0.61803398875)% (i+1);var tmp=pairs[i];pairs[i]=pairs[j];pairs[j]=tmp;}
  return {id:item.id,d:item.d,s:item.s,q:item.q,pairs:pairs};
}
function shell(inner){
  APP.innerHTML='<div class="shell"><header class="top"><div class="topin"><div class="brand"><div class="mark">Lx</div><div><b>LexLearn</b><small>Pilot 0 • مصادر الالتزام • قطر</small></div></div><div class="toplinks"><a href="conference.html">صفحة العرض</a><a href="program.html?demo=1">تصور التدريب</a></div></div></header><main class="wrap">'+inner+'</main></div>';
}
function render(){
  if(RESEARCHER)return researcher();
  if(state.view==="intro")return intro();
  if(state.view==="question")return question();
  if(state.view==="constructed")return constructed();
  if(state.view==="result")return result();
  if(state.view==="delayed")return delayedQuestion();
  if(state.view==="delayedResult")return delayedResult();
}
function intro(){
  var due=data.dueAt&&now()>=data.dueAt&&!data.delayedFinishedAt;
  shell('<section class="hero"><span class="kicker">Exploratory Pilot 0</span><h1>اختبار فرضية التشخيص قبل بناء الكورس الكامل</h1><p>هذه النسخة تركز على مادة واحدة ونظام قانوني واحد. الهدف ليس إصدار درجة نهائية، بل معرفة هل تظهر أنماط أداء مختلفة بين الاسترجاع والفهم والتطبيق لدى طلاب متقاربين في الدرجة العامة.</p><div class="heroGrid"><div><b>10–15</b><span>طالبًا في المرحلة الاستكشافية</span></div><div><b>15</b><span>مهمة اختيارية أساسية</span></div><div><b>1</b><span>إجابة قانونية قصيرة</span></div><div><b>24–48h</b><span>مراجعة احتفاظ منفصلة</span></div></div></section>'+
  '<section class="card split"><div><h2>ابدأ الجلسة الأولى</h2><p>لا تظهر إجابات صحيحة أثناء التقييم. تُحفظ الاستجابات الخام ووقت الإجابة للاستخدام البحثي، ولا تُعرض النتيجة كنسبة سيكومترية.</p><div class="formGrid"><div class="field"><label>رمز المشارك</label><input id="pid" value="'+esc(data.participant||"")+'" placeholder="مثال: P-001"></div><div class="field"><label>المادة</label><input value="مصادر الالتزام — قطر" disabled></div></div><div class="actions"><button class="btn primary" id="start">ابدأ التقييم</button>'+(due?'<button class="btn secondary" id="startDelayed">ابدأ المراجعة المؤجلة</button>':'')+'</div><div class="notice">هذه نسخة Pilot استكشافية وليست أداة لاتخاذ قرار أكاديمي عن الطالب. الأسئلة نفسها تحتاج مراجعة قانونية نهائية قبل جمع بيانات فعلية.</div></div>'+
  '<div><h3>ما الذي تغيّر؟</h3><p>لا نسب مئوية للطالب، لا Taxonomy نهائية للأخطاء، ولا اعتبار رأي أستاذ واحد Ground Truth. بعد أول عينة تُبنى تصنيفات الأخطاء من البيانات، وتُراجع الإجابة الكتابية بـRubric موحد بواسطة مصححين على الأقل.</p></div></section>');
  document.getElementById("start").onclick=function(){data.participant=document.getElementById("pid").value.trim()||("P-"+String(now()).slice(-6));data.startedAt=now();data.responses=[];data.constructed="";save();state.i=0;state.phase="baseline";state.view="question";render();};
  var sd=document.getElementById("startDelayed");if(sd)sd.onclick=function(){state.i=0;state.phase="delayed";state.view="delayed";render();};
}
function question(){
  var item=items[state.i],x=shuffleItem(item);state.startedItemAt=now();
  shell('<section class="card"><div class="progress"><i style="width:'+Math.round((state.i/items.length)*100)+'%"></i></div><div class="qmeta"><span>المهمة '+(state.i+1)+' من '+items.length+'</span><span>لا توجد تغذية راجعة أثناء التقييم</span></div><div class="source">'+esc(x.s)+'</div><h2 class="question">'+esc(x.q)+'</h2><div class="options">'+x.pairs.map(function(p,i){return '<button class="option" data-i="'+i+'">'+esc(p.t)+'</button>';}).join("")+'</div></section>');
  document.querySelectorAll("[data-i]").forEach(function(b){b.onclick=function(){
    var p=x.pairs[Number(b.dataset.i)];
    data.responses.push({itemId:x.id,dimension:x.d,selected:p.t,correct:p.correct,latencyMs:now()-state.startedItemAt,ts:now()});
    save();state.i++;if(state.i>=items.length){state.view="constructed";}render();
  };});
}
function constructed(){
  shell('<section class="card"><div class="qmeta"><span>إجابة قصيرة</span><span>تُراجع بشريًا لاحقًا</span></div><h2 class="question">في واقعة تعاقدية، كيف ترتب إجابتك عند بحث ما إذا كان العقد قد انعقد صحيحًا؟</h2><p>اكتب إجابة قصيرة من 4–7 أسطر. لا توجد إجابة نموذجية ظاهرة الآن.</p><textarea id="constructed" class="textarea" placeholder="اكتب إجابتك...">'+esc(data.constructed||"")+'</textarea><div class="actions"><button class="btn primary" id="finish">إنهاء الجلسة الأولى</button></div></section>');
  document.getElementById("finish").onclick=function(){data.constructed=document.getElementById("constructed").value.trim();data.finishedAt=now();data.dueAt=DEMO?now():now()+24*60*60*1000;save();state.view="result";render();};
}
function dimSummary(dim,label){
  var rs=data.responses.filter(function(r){return r.dimension===dim;});
  var ok=rs.filter(function(r){return r.correct;}).length;
  var phrase=ok>=4?"ظهرت إجابات صحيحة في أغلب المهام":ok>=2?"ظهرت نتائج متباينة بين المهام":"ظهرت أخطاء متكررة في هذه المجموعة";
  return '<div class="result"><span>'+label+'</span><b>'+phrase+'</b><small>وصف استكشافي من عدد محدود من المهام — ليس درجة معيارية</small></div>';
}
function result(){
  shell('<section class="card"><span class="kicker">انتهت الجلسة الأولى</span><h2>ملخص وصفي فقط</h2><p>لا نعرض نسبة أو حكمًا نهائيًا. الغرض من Pilot 0 هو مقارنة أنماط الاستجابة بين المشاركين ثم فحص ما إذا كانت الفروق قابلة للتفسير تربويًا.</p><div class="resultGrid">'+dimSummary("recall","الاسترجاع")+dimSummary("understanding","الفهم")+dimSummary("application","التطبيق")+'</div><div class="notice">المراجعة المؤجلة تُجرى بعد 24–48 ساعة دون إعادة قراءة المحتوى. تصنيف أنواع الأخطاء سيُبنى بعد جمع أول عينة، وليس قبلها.</div><div class="actions"><button class="btn secondary" id="home">العودة</button>'+(DEMO?'<button class="btn primary" id="demoDelayed">جرّب الجزء المؤجل الآن</button>':'')+'</div></section>');
  document.getElementById("home").onclick=function(){state.view="intro";render();};
  var dd=document.getElementById("demoDelayed");if(dd)dd.onclick=function(){state.i=0;state.view="delayed";render();};
}
function delayedQuestion(){
  var item=delayed[state.i],x=shuffleItem(item);state.startedItemAt=now();
  shell('<section class="card"><div class="progress"><i style="width:'+Math.round((state.i/delayed.length)*100)+'%"></i></div><div class="qmeta"><span>المراجعة المؤجلة '+(state.i+1)+' من '+delayed.length+'</span><span>بدون إعادة قراءة</span></div><h2 class="question">'+esc(x.q)+'</h2><div class="options">'+x.pairs.map(function(p,i){return '<button class="option" data-di="'+i+'">'+esc(p.t)+'</button>';}).join("")+'</div></section>');
  document.querySelectorAll("[data-di]").forEach(function(b){b.onclick=function(){var p=x.pairs[Number(b.dataset.di)];data.delayed.push({itemId:x.id,selected:p.t,correct:p.correct,latencyMs:now()-state.startedItemAt,ts:now()});save();state.i++;if(state.i>=delayed.length){data.delayedFinishedAt=now();save();state.view="delayedResult";}render();};});
}
function delayedResult(){
  shell('<section class="card"><span class="kicker">اكتملت المراجعة المؤجلة</span><h2>تم حفظ الاستجابات</h2><p>لا تظهر نسبة احتفاظ نهائية للطالب في Pilot 0. سيُحلل الباحث الاستجابات الخام مع نتائج الجلسة الأولى.</p><div class="actions"><button class="btn primary" id="home">إنهاء</button></div></section>');
  document.getElementById("home").onclick=function(){state.view="intro";render();};
}
function rubric(){
  return '<div class="rubric"><div><b>القاعدة</b><small>هل حدد القاعدة القانونية ذات الصلة؟</small></div><div><b>العناصر</b><small>هل ذكر العناصر الجوهرية؟</small></div><div><b>الربط</b><small>هل ربط كل عنصر بالوقائع؟</small></div><div><b>الاستبعاد</b><small>هل استبعد البديل غير المناسب بتعليل؟</small></div><div><b>النتيجة</b><small>هل وصل إلى نتيجة معللة؟</small></div></div>';
}
function researcher(){
  var payload=JSON.stringify(data,null,2);
  shell('<section class="hero"><span class="kicker">Researcher View</span><h1>Pilot 0 — لوحة الباحث</h1><p>هذه اللوحة تعرض البيانات الخام فقط. لا تحولها إلى درجات معيارية أو تصنيفات ثابتة قبل تحليل العينة ومراجعة صلاحية الأداة.</p></section>'+
  '<section class="card"><h2>Rubric موحد للإجابة الكتابية</h2><p>يُستخدم بواسطة مصححين مستقلين على الأقل، ثم يُفحص مدى اتفاقهما قبل اعتبار التقييم البشري مرجعًا للمقارنة.</p>'+rubric()+'</section>'+
  '<section class="card"><h2>البيانات الخام للمشارك الحالي</h2><div class="raw">'+esc(payload)+'</div><div class="actions"><button class="btn primary" id="download">تنزيل JSON</button><button class="btn secondary" id="reset">مسح بيانات الجهاز التجريبية</button></div></section>'+
  '<section class="card"><h3>قاعدة العمل بعد أول 10–15 مشاركًا</h3><p>تُراجع الإجابات الخاطئة كما حدثت فعليًا، ثم تُبنى Taxonomy لأنواع الأخطاء من البيانات. لا تُفرض الفئات الحالية على المشاركين مسبقًا.</p></section>');
  document.getElementById("download").onclick=function(){var blob=new Blob([payload],{type:"application/json"}),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=(data.participant||"pilot0")+".json";a.click();setTimeout(function(){URL.revokeObjectURL(u);},500);};
  document.getElementById("reset").onclick=function(){if(confirm("مسح بيانات Pilot 0 من هذا الجهاز؟")){localStorage.removeItem(KEY);location.reload();}};
}
render();
})();