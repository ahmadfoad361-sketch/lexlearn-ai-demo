(function(){
"use strict";
var ar=document.documentElement.lang==="ar",lang=ar?"ar":"en",Q=window.LEX_QUALITY,APP=document.getElementById("showcaseApp"),ss=null;
try{ss=JSON.parse(localStorage.getItem("lexlearn_student_session")||"null");}catch(e){}
var profileKey="lexlearn_v9_profile"+(ss&&ss.studentId?"_"+ss.studentId:""),questions=[],answers=[],step=0,timer=null,free="",started=0;
function tr(a,b){return ar?a:b;}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function chrome(s){APP.innerHTML='<div class="demoShell"><header class="demoTop"><div class="demoTopIn"><div class="demoBrand"><div class="demoLogo"><img src="assets/lexlearn-logo.svg" alt="LexLearn"></div><div><b>Lex<span class="brandLearn">Learn</span></b><small>'+tr('نفهم طريقة تفكيرك، ونبني طريقك.','We understand your mind and build your path.')+'</small></div></div><div class="demoMeta"><a class="demoGhost" href="'+(ar?'showcase-en.html':'showcase.html')+'?country=qa&subject=rights">'+tr('English','العربية')+'</a><a class="demoGhost" href="'+(ar?'index.html':'index-en.html')+'">'+tr('الرئيسية','Home')+'</a></div></div></header><main class="demoWrap">'+s+'</main><footer class="demoFooter">LexLearn</footer></div>';}
function stage(n,s){chrome('<section class="demoStage"><div class="progress"><i style="width:'+n+'%"></i></div><div class="stageCard">'+s+'</div></section>');}
function makeQuestions(){
 var t=Q.topic(1);
 questions=[
 {type:'recall',q:tr('متى تبدأ شخصية الإنسان وفق النص؟','When does human legal personality begin?'),opts:ar?['بتمام ولادته حيًا','ببدء الحمل المستكن','باكتمال أهلية الأداء']:['Upon being born alive','Upon conception in the womb','Upon full capacity to act'],a:0},
 {type:'recall',q:tr('ما القيد المتعلق بحقوق الحمل المذكورة؟','What condition attaches to the stated prenatal rights?'),opts:ar?['تمام الولادة حيًا','وجود قبول سابق','تمام سن التمييز']:['Live birth is completed','Prior acceptance exists','Discernment age is reached'],a:0},
 {type:'understanding',q:t.q_en,opts:t.opts_en,a:0},
 {type:'application',q:t.scenario_en,opts:t.applied_en,a:0},
 {type:'application',q:tr('لم تتم الولادة حية رغم نشوء سبب الحق دون حاجة لقبول. ما أثر ذلك على الحقوق المقصودة؟','The child was not born alive, although the right’s cause required no acceptance. What follows for the stated rights?'),opts:ar?['لا يتحقق شرط ثبوت الحقوق المقصودة','تثبت الحقوق لأن سببها سبق الولادة','تثبت الحقوق إذا كان محلها مالًا']:['The condition for those rights is not met','The rights vest because their cause preceded birth','The rights vest if their object is property'],a:0},
 {type:'legal_precision',q:tr('أي صياغة تحفظ جميع قيود المادة 40؟','Which wording preserves all Article 40 qualifications?'),opts:ar?['حقوق لا يحتاج سببها لقبول بشرط الولادة حية','حقوق يحتاج سببها لقبول بشرط الولادة حية','حقوق لا يحتاج سببها لقبول دون شرط الولادة']:['Rights not requiring acceptance, conditional on live birth','Rights requiring acceptance, conditional on live birth','Rights not requiring acceptance, regardless of live birth'],a:0}
 ];
 if(ar){questions[2].q=t.q_ar;questions[2].opts=t.opts_ar;questions[3].q=t.scenario_ar;questions[3].opts=t.applied_ar;}
}
function hero(){chrome('<section class="demoStage demoIntro"><div class="stageCard centered"><span class="demoEyebrow">'+tr('تقييم أولي · نحو 3 دقائق','Initial diagnostic · about 3 minutes')+'</span><h2>'+tr('ابدأ من قوتك','Start from your strength')+'</h2><p>'+tr('اقرأ القاعدة، ثم أجب عن 6 أسئلة ومهمة حفظ قصيرة. النتيجة مؤشر لهذه المحاولة، وليست وصفًا ثابتًا لطريقة تفكيرك. قد تُرسل الإجابة دون اسم إلى سجل مشرف الديمو.','Read the rule, then answer six questions and one short recall task. The result describes this attempt, not a permanent learning type. Your answer may be saved without a name to a separate demo supervisor queue.')+'</p><button class="btn primary" id="startDemo">'+tr('ابدأ','Start')+'</button></div></section>');document.getElementById('startDemo').onclick=read;}
function read(){
 answers=[];step=0;makeQuestions();started=Date.now();
 var rule=tr('تبدأ شخصية الإنسان بتمام ولادته حيًا، وتنتهي بموته. والحمل المستكن أهل لثبوت الحقوق التي لا يحتاج سببها إلى قبول، وذلك بشرط تمام ولادته حيًا.','A human being acquires legal personality upon being born alive, and it ends at death. An unborn child may acquire rights whose cause does not require acceptance, provided that the child is born alive.');
 stage(5,'<span class="demoEyebrow">'+tr('اقرأ قبل اختبار الذاكرة','Read before the recall task')+'</span><h2>'+tr('الشخصية القانونية · المادتان 39–40','Legal personality · Articles 39–40')+'</h2><div class="legalPaper"><small>'+tr('القانون المدني القطري · مقتطف تعليمي','Qatar Civil Code · educational English rendering')+'</small><div class="txt">'+rule+'</div></div><p>'+tr('خذ وقتك. النص يختفي عندما تختار «انتهيت»؛ سرعة القراءة لا تحدد قدرتك القانونية.','Take your time. The text disappears when you select Done; reading speed does not determine legal ability.')+'</p><button class="btn primary" id="finishRead">'+tr('انتهيت','Done')+'</button>');document.getElementById('finishRead').onclick=quiz;
}
function quiz(){
 var t=questions[step],ord=Q.shuffleOptions(t);
 stage(Math.round((step+1)/7*90),'<span class="demoEyebrow">'+tr('السؤال ','Question ')+(step+1)+tr(' من 7',' of 7')+'</span><h2>'+esc(t.q)+'</h2><div class="choices">'+ord.map(function(x){return '<button class="choice" data-o="'+x.orig+'">'+esc(x.text)+'</button>';}).join('')+'</div>');
 document.querySelectorAll('[data-o]').forEach(function(b){b.onclick=function(){answers.push({type:t.type,correct:Number(b.dataset.o)===t.a,selected:Number(b.dataset.o),latency:Date.now()-started});step++;started=Date.now();if(step<questions.length)quiz();else recall();};});
}
function recall(){stage(90,'<span class="demoEyebrow">'+tr('السؤال 7 من 7','Question 7 of 7')+'</span><h2>'+tr('أعد بناء القاعدة من ذاكرتك','Reconstruct the rule from memory')+'</h2><p>'+tr('اكتب بداية الشخصية ونهايتها، ثم نوع حقوق الحمل وشرط ثبوتها. لا يلزم مثال أو واقعة.','State when personality begins and ends, then identify the prenatal rights and their condition. No example or fact pattern is required.')+'</p><textarea class="freeInput" id="freeText" placeholder="'+tr('اكتب ما تتذكره...','Write what you remember...')+'"></textarea><button class="btn primary" id="seeResult">'+tr('عرض النتيجة','Show result')+'</button><div id="recallNote"></div>');document.getElementById('seeResult').onclick=function(){free=document.getElementById('freeText').value.trim();if(!free){document.getElementById('recallNote').textContent=tr('اكتب ما تتذكره أو «لا أتذكر».','Write what you remember or “I do not remember”.');return;}result();};}
function pct(type){var a=answers.filter(function(x){return x.type===type;});return a.length?Math.round(a.filter(function(x){return x.correct;}).length/a.length*100):null;}
function metric(k,v){return '<div class="metric"><span>'+Q.labels[lang][k]+'</span><b>'+(v==null?tr('لم يُقَس','Not assessed'):v+'%')+'</b></div>';}
var lastDemo=null;
function analysisPage(){
 stage(97,'<div class="analysisScreen" role="status" aria-live="polite"><div class="analysisLogoWrap"><img src="assets/lexlearn-logo.svg" alt="LexLearn"></div><span class="demoEyebrow">'+tr('تحليل إجاباتك','Analysing your answers')+'</span><h2>'+tr('جاري تحليل النتيجة بالذكاء الاصطناعي','Analysing your result with AI')+'</h2><p>'+tr('نفحص المعنى القانوني في إجابتك، ثم نجهز تقرير المهارات والمتابعة.','Checking the legal meaning of your answer and preparing your skills report.')+'</p><div class="analysisProgress"><i></i></div><small>'+tr('إذا تعذر التصحيح، ستظهر حالة انتظار المراجعة دون تخمين درجة.','If grading is unavailable, review will be pending; no score will be guessed.')+'</small></div>');
}
async function sendDemo(){
 if(!window.LEX_CLOUD||!LEX_CLOUD.isConfigured())throw new Error("cloud_unavailable");
 var db=LEX_CLOUD.db(),u=await db.auth.getUser();
 if(u.error||!u.data.user){
  var guest=await db.auth.signInAnonymously();
  if(guest.error||!guest.data.user)throw new Error("guest_auth_disabled");
 }
 var r=await db.functions.invoke("showcase-grade",{body:{topic:1,language:lang,answer:free,choices:answers.map(function(a){return{type:a.type,correct:a.correct};})}});
 if(r.error||!r.data||r.data.received!==true||!r.data.submission_id)throw new Error("send_not_confirmed");
 return r.data;
}
function metricV2(k,v,pending){
 var name=Q.labels[lang][k],shown=v==null?(k==="recall"&&pending?tr('التصحيح معلّق','Grading pending'):tr('لم يُختبر مستقلًا','Not independently assessed')):v+'%';
 var note=v!=null?(k==="recall"?tr('نتيجة إجابة حرة أولية','Preliminary free-answer score'):tr('مؤشر من الاختيارات','Choice-question indicator')):k==="recall"?tr('أُجريت مهمة الحفظ بالفعل','Recall task was attempted'):'';
 return '<div class="metric"><span>'+esc(name)+'</span><b class="'+(v==null?'metricPending':'')+'">'+esc(shown)+'</b><small>'+esc(note)+'</small></div>';
}
function demoAdvice(s){
 if(s.pendingRecall)return tr('إجابة الحفظ قُدمت، لكن تقييم معناها معلق. نبدأ تدريبًا استكشافيًا دون اعتبار الحفظ قوة أو ضعفًا.','Recall was attempted but not yet graded. Begin exploratory training without assuming strong or weak recall.');
 if(s.weak==="recall")return tr('نحوّل الفهم إلى مفاتيح للحفظ، ثم نعيد بناء القاعدة القانونية من الذاكرة.','Turn understanding into memory cues and reconstruct the legal rule.');
 if(s.weak==="understanding")return tr('نستخدم عناصر القاعدة المسترجعة لنشرح وظيفة كل عنصر.','Use recalled legal elements to explain the role of each.');
 if(s.weak==="application")return tr('نغيّر عنصرًا في واقعة قصيرة ونفحص أثر ذلك على النتيجة.','Change one fact and test its effect on the legal conclusion.');
 return tr('التجربة قصيرة؛ نحتاج أدلة إضافية قبل تحديد مهارة أضعف بثقة.','This short demo needs more evidence before identifying a weakest skill.');
}
function resultScreen(){
 var s=lastDemo.summary,r=lastDemo.receipt,grade=lastDemo.grade;
 stage(100,'<span class="demoEyebrow">'+tr('نتيجة تجريبية أولية','Preliminary demo result')+'</span><h2>'+tr('أداؤك في هذه المحاولة','Your performance in this attempt')+'</h2><p>'+tr('لم يُختبر لا يعني صفرًا. والتصحيح المعلّق لا يعني أن الطالب حاول الحفظ وفشل.','Not assessed does not mean zero; pending grading does not mean a recall attempt failed.')+'</p><div class="metrics">'+Object.keys(Q.labels[lang]).map(function(k){return metricV2(k,s.metrics[k],s.pendingRecall);}).join('')+'</div><div class="planCard"><h3>'+tr('لماذا هذا التدريب؟','Why this training?')+'</h3><p>'+esc(demoAdvice(s))+'</p><small>'+tr('هذه معاينة تعليمية مستقلة عن سجلات الطلاب ومراحلهم الفعلية.','This preview is separate from real student records and progression.')+'</small></div><p class="demoStatus">'+(s.pendingRecall?tr('تم تقديم إجابة الحفظ، والتصحيح الدلالي لم يعتمد بعد.','Free recall was submitted; semantic grading remains pending.'):tr('تم تصحيح معنى إجابة الحفظ بصورة أولية.','Free recall received preliminary semantic grading.'))+'</p><details><summary>'+tr('دليل فحص الحفظ','Recall evidence')+'</summary>'+Q.feedback(grade,lang,esc)+'</details><p class="deliveryState" role="status">'+(r.received?tr('تم حفظ نتيجة الديمو في سجل المشرف المنفصل عن الطلاب الحقيقيين.','Demo result saved to the separate supervisor queue.'):tr('لم يتأكد إرسال النتيجة للمشرف؛ لن تظهر رسالة نجاح غير حقيقية.','Supervisor delivery is not confirmed; no false success message will be shown.'))+'</p><div class="demoActions"><button class="btn primary" id="previewDemo">'+tr('معاينة التدريب التكيفي','Preview adaptive training')+'</button><button class="btn secondary" id="closeDemo">'+tr('إغلاق النتيجة','Close result')+'</button><button class="btn secondary" id="homeDemo">'+tr('العودة للصفحة الرئيسية','Return home')+'</button><button class="btn secondary" id="retryDemo">'+tr('إعادة الاختبار','Try again')+'</button></div>');
 document.getElementById("previewDemo").onclick=previewTraining;
 document.getElementById("closeDemo").onclick=receiptScreen;
 document.getElementById("homeDemo").onclick=receiptScreen;
 document.getElementById("retryDemo").onclick=hero;
}
function previewTraining(){
 var w=lastDemo.summary.weak;
 var prompt=w==="recall"?tr('اكتب ثلاثة مفاتيح تساعدك على تذكّر عناصر المادة 39 و40، ثم اشرح وظيفة كل مفتاح.','Write three cues for Articles 39–40 and explain each one.'):w==="understanding"?tr('اشرح لماذا يختلف بدء الشخصية عن حقوق الحمل المشروطة بالولادة حية.','Explain the difference between legal personality and conditional prenatal rights.'):tr('لو لم تتم الولادة حية، هل يتحقق شرط ثبوت حقوق الحمل المذكورة؟ بيّن السبب.','If live birth did not occur, would the stated prenatal-rights condition be met? Explain.');
 stage(100,'<span class="demoEyebrow">'+tr('تدريب توضيحي مستقل','Independent training illustration')+'</span><h2>'+tr('استخدم ما تعرفه لتطوير ما تحتاجه','Use what you know to develop what you need')+'</h2><p>'+prompt+'</p><textarea class="freeInput" id="previewAnswer" placeholder="'+tr('حاول الإجابة هنا...','Try your answer here...')+'"></textarea><div class="demoActions"><button class="btn primary" id="previewExplain">'+tr('اعرض الفكرة القانونية','Show the legal concept')+'</button><button class="btn secondary" id="previewReturn">'+tr('العودة للنتيجة','Back to results')+'</button></div><div id="previewExplanation" class="demoStatus" role="status"></div>');
 document.getElementById("previewReturn").onclick=resultScreen;
 document.getElementById("previewExplain").onclick=function(){document.getElementById("previewExplanation").textContent=tr('تبدأ الشخصية بالولادة حية وتنتهي بالموت، أما حقوق الحمل التي لا يحتاج سببها إلى قبول فتتوقف على شرط الولادة حية. هذه معاينة تدريب وليست تصحيحًا لإجابتك.','Personality begins with live birth and ends at death; the stated prenatal rights depend on live birth. This is a training preview, not grading of your answer.');};
}
function receiptScreen(){
 var sent=lastDemo.receipt.received;
 stage(100,'<div class="receiptScreen"><div class="receiptLogoWrap"><img src="assets/lexlearn-logo.svg" alt="LexLearn"></div><h2>'+(sent?tr('تم إرسال النتيجة للمشرف للمتابعة ولإعداد البرنامج التكيفي الخاص بكم','Your result has been sent to the supervisor for follow-up and an adaptive learning plan'):tr('انتهى الديمو، ولكن لم يتأكد إرسال النتيجة','Demo complete, but delivery was not confirmed'))+'</h2><p>'+(sent?tr('هذه نتيجة تجريبية منفصلة عن سجلات الطلاب، ويمكن للمشرف مراجعة إجابتك والتصحيح الآلي.','This demo result is separate from real student records; the supervisor can review your answer and its grading.'):tr('لم نؤكد وصول النتيجة للمشرف. يمكنك إعادة التجربة أو العودة إلى الموقع.','The result was not confirmed as received. You can retry or return to the website.'))+'</p><div class="demoActions centeredActions"><a class="btn primary" href="'+(ar?'index.html':'index-en.html')+'">'+tr('الصفحة الرئيسية','Home page')+'</a><button class="btn secondary" id="receiptAgain">'+tr('تجربة جديدة','New demo')+'</button></div></div>');
 document.getElementById("receiptAgain").onclick=hero;
}
async function result(){
 analysisPage();
 var receipt;
 try{receipt=await sendDemo();}catch(e){receipt={received:false,error:String(e&&e.message||'not_sent')};}
 var grade=Q.grade(free,Q.makeEssay(Q.topic(1),lang,'recall'),lang);
 if(receipt.received&&receipt.grade_status==='graded'&&typeof receipt.recall_score==='number'){
  grade.pending=false;grade.needsHumanReview=false;grade.provisional=true;grade.gradingMethod='grounded_semantic';
  grade.overall=receipt.recall_score;grade.axes.recall=receipt.recall_score;
  grade.style=tr('تقييم معنى أولي بحسب المصادر القانونية المعتمدة.','Preliminary semantic evaluation using approved legal sources.');
  grade.note=receipt.feedback||'';
  grade.checks=(receipt.details&&receipt.details.achieved||[]).map(function(x){return{label:x.id,matched:true,evidence:x.evidence};});
  grade.studyChecks=[];grade.conflicts=receipt.details&&receipt.details.contradictions||[];
 }else{
  grade.pending=true;grade.gradingMethod='pending_semantic_review';grade.axes.recall=null;
  grade.note=receipt.received?tr('حُفظت الإجابة للمشرف في انتظار التصحيح.','Answer saved for supervisor review.'):tr('لم يتأكد حفظ الإجابة للمشرف.','Supervisor delivery was not confirmed.');
 }
 lastDemo={receipt:receipt,grade:grade,summary:Q.diagnosticSummary(answers,grade)};
 resultScreen();
}
hero();
})();
