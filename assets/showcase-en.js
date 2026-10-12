(function(){
"use strict";
var ar=document.documentElement.lang==="ar",lang=ar?"ar":"en",Q=window.LEX_QUALITY,APP=document.getElementById("showcaseApp"),questions=[],answers=[],step=0,timer=null,free="",started=0;
var requestId=null,busy=false,draftKey='lexlearn-demo-v3-'+lang;
function persist(){try{sessionStorage.setItem(draftKey,JSON.stringify({requestId:requestId,answers:answers,free:free,step:step,receipt:lastDemo&&lastDemo.receipt}));}catch(_){}}
function restore(){try{return JSON.parse(sessionStorage.getItem(draftKey)||'null');}catch(_){return null;}}
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
 {type:'understanding',q:t.scenario_en,opts:t.applied_en,a:0},
 {type:'understanding',q:tr('لم تتم الولادة حية رغم نشوء سبب الحق دون حاجة لقبول. ما أثر ذلك على الحقوق المقصودة؟','The child was not born alive, although the right’s cause required no acceptance. What follows for the stated rights?'),opts:ar?['لا يتحقق شرط ثبوت الحقوق المقصودة','تثبت الحقوق لأن سببها سبق الولادة','تثبت الحقوق إذا كان محلها مالًا']:['The condition for those rights is not met','The rights vest because their cause preceded birth','The rights vest if their object is property'],a:0},
 {type:'understanding',q:tr('أي صياغة تحفظ جميع قيود المادة 40؟','Which wording preserves all Article 40 qualifications?'),opts:ar?['حقوق لا يحتاج سببها لقبول بشرط الولادة حية','حقوق يحتاج سببها لقبول بشرط الولادة حية','حقوق لا يحتاج سببها لقبول دون شرط الولادة']:['Rights not requiring acceptance, conditional on live birth','Rights requiring acceptance, conditional on live birth','Rights not requiring acceptance, regardless of live birth'],a:0}
 ];
 if(ar){questions[2].q=t.q_ar;questions[2].opts=t.opts_ar;questions[3].q=t.scenario_ar;questions[3].opts=t.applied_ar;}
}
function hero(){chrome('<section class="demoStage demoIntro"><div class="stageCard centered"><span class="demoEyebrow">'+tr('تقييم أولي · نحو 3 دقائق','Initial diagnostic · about 3 minutes')+'</span><h2>'+tr('ابدأ من قوتك','Start from your strength')+'</h2><p>'+tr('اقرأ القاعدة، ثم أجب عن 6 أسئلة ومهمة حفظ قصيرة. النتيجة مؤشر لهذه المحاولة، وليست وصفًا ثابتًا لطريقة تفكيرك. قد تُرسل الإجابة دون اسم إلى سجل مشرف الديمو.','Read the rule, then answer six questions and one short recall task. The result describes this attempt, not a permanent learning type. Your answer may be saved without a name to a separate demo supervisor queue.')+'</p><button class="btn primary" id="startDemo">'+tr('ابدأ','Start')+'</button></div></section>');document.getElementById('startDemo').onclick=read;}
function read(){
 answers=[];step=0;free="";lastDemo=null;requestId=crypto.randomUUID();makeQuestions();started=Date.now();persist();
 var rule=tr('تبدأ شخصية الإنسان بتمام ولادته حيًا، وتنتهي بموته. والحمل المستكن أهل لثبوت الحقوق التي لا يحتاج سببها إلى قبول، وذلك بشرط تمام ولادته حيًا.','A human being acquires legal personality upon being born alive, and it ends at death. An unborn child may acquire rights whose cause does not require acceptance, provided that the child is born alive.');
 stage(5,'<span class="demoEyebrow">'+tr('اقرأ قبل اختبار الذاكرة','Read before the recall task')+'</span><h2>'+tr('الشخصية القانونية · المادتان 39–40','Legal personality · Articles 39–40')+'</h2><div class="legalPaper"><small>'+tr('القانون المدني القطري · مقتطف تعليمي','Qatar Civil Code · educational English rendering')+'</small><div class="txt">'+rule+'</div></div><p>'+tr('خذ وقتك. النص يختفي عندما تختار «انتهيت»؛ سرعة القراءة لا تحدد قدرتك القانونية.','Take your time. The text disappears when you select Done; reading speed does not determine legal ability.')+'</p><button class="btn primary" id="finishRead">'+tr('انتهيت','Done')+'</button>');document.getElementById('finishRead').onclick=quiz;
}
function quiz(){
 var t=questions[step],ord=Q.shuffleOptions(t);
 stage(Math.round((step+1)/7*90),'<span class="demoEyebrow">'+tr('السؤال ','Question ')+(step+1)+tr(' من 7',' of 7')+'</span><h2>'+esc(t.q)+'</h2><div class="choices">'+ord.map(function(x){return '<button class="choice" data-o="'+x.orig+'">'+esc(x.text)+'</button>';}).join('')+'</div>');
 document.querySelectorAll('[data-o]').forEach(function(b){b.onclick=function(){answers.push({type:t.type,correct:Number(b.dataset.o)===t.a,selected:Number(b.dataset.o),latency:Date.now()-started});step++;persist();started=Date.now();if(step<questions.length)quiz();else recall();};});
}
function recall(){stage(90,'<span class="demoEyebrow">'+tr('السؤال 7 من 7','Question 7 of 7')+'</span><h2>'+tr('أعد بناء القاعدة من ذاكرتك','Reconstruct the rule from memory')+'</h2><p>'+tr('اكتب بداية الشخصية ونهايتها، ثم نوع حقوق الحمل وشرط ثبوتها. لا يلزم مثال أو واقعة.','State when personality begins and ends, then identify the prenatal rights and their condition. No example or fact pattern is required.')+'</p><textarea class="freeInput" id="freeText" maxlength="1800" aria-label="'+tr('إجابة الحفظ','Recall answer')+'" placeholder="'+tr('اكتب ما تتذكره...','Write what you remember...')+'"></textarea><button class="btn primary" id="seeResult">'+tr('عرض النتيجة','Show result')+'</button><div id="recallNote"></div>');document.getElementById('freeText').value=free;document.getElementById('freeText').oninput=function(){free=this.value;persist();};document.getElementById('seeResult').onclick=function(){free=document.getElementById('freeText').value.trim();if(!free){document.getElementById('recallNote').textContent=tr('اكتب ما تتذكره أو «لا أتذكر».','Write what you remember or “I do not remember”.');return;}persist();result();};}
function pct(type){var a=answers.filter(function(x){return x.type===type;});return a.length?Math.round(a.filter(function(x){return x.correct;}).length/a.length*100):null;}
function metric(k,v){return '<div class="metric"><span>'+Q.labels[lang][k]+'</span><b>'+(v==null?tr('لم يُقَس','Not assessed'):v+'%')+'</b></div>';}
var lastDemo=null;
function analysisPage(){
 stage(97,'<div class="analysisScreen" role="status"><div class="analysisLogoWrap"><img src="assets/lexlearn-logo.svg" alt="LexLearn"></div><h2>'+tr('فحص عناصر الإجابة وحفظ المحاولة','Checking answer elements and saving your attempt')+'</h2><p>'+tr('تقييم محلي مبدئي بقواعد محدودة، ثم إرسال الإجابة للمشرف.','A preliminary check using limited local rules, followed by delivery for supervisor review.')+'</p></div>');
}
async function sendDemo(){
 if(!window.LEX_CLOUD||!LEX_CLOUD.isConfigured())throw new Error('cloud_unavailable');
 var db=LEX_CLOUD.db(),session=await db.auth.getSession();
 if(session.error)throw new Error('authentication_required');
 if(!session.data.session){
  var guest=await db.auth.signInAnonymously();
  if(guest.error||!guest.data.user)throw new Error('guest_auth_unavailable');
 }
 var r=await db.functions.invoke('showcase-grade',{body:{request_id:requestId,topic:1,language:lang,answer:free,choices:answers.map(function(a){return{type:a.type,selected:a.selected};})}});
 if(r.error||!r.data||r.data.received!==true||!r.data.submission_id){
  var info=r.data&&r.data.error||'';
  if(r.error&&r.error.context&&typeof r.error.context.json==='function'){try{var errBody=await r.error.context.json();info=errBody&&errBody.error||info;}catch(_){}}
  throw new Error(info||'send_not_confirmed');
 }
 return r.data;
}
function errorLabel(code){
 var labels={daily_demo_limit:tr('بلغت التجربة الحد اليومي. أُبقيت إجابتك هنا؛ أعد إرسالها بعد تجدد الحصة عند 00:00 UTC.','The daily demo limit was reached. Your answer is retained; retry after the quota resets at 00:00 UTC.'),authentication_required:tr('تعذر التحقق من جلسة الدخول. إجابتك محفوظة في هذا التبويب؛ سجّل الدخول ثم أعد الإرسال.','Your session could not be verified. Your answer remains in this tab; sign in and retry.'),guest_auth_unavailable:tr('تعذر بدء جلسة الزائر. تحقق من الاتصال وأعد الإرسال.','Guest sign-in failed. Check your connection and retry.'),invalid_demo_payload:tr('بيانات الاختبار غير مكتملة؛ راجع إجاباتك.','The submitted test data is incomplete; review your answers.'),request_conflict:tr('معرّف هذه المحاولة مرتبط بإجابة أخرى؛ ابدأ محاولة جديدة مع الاحتفاظ بنسخة من إجابتك.','This attempt ID belongs to different content; keep a copy and start a new attempt.'),demo_result_save_failed:tr('تعذر تسجيل المحاولة في قاعدة البيانات؛ إجابتك باقية هنا ويمكن إعادة إرسالها.','The database could not save the attempt. Your answer remains here for retry.')};
 return labels[code]||tr('لم يصل تأكيد من الخادم. تحقق من الاتصال ثم اضغط إعادة الإرسال؛ لن تتكرر المحاولة.','No server confirmation was received. Check your connection and retry; the same attempt will not be duplicated.');
}
function resultScreen(){
 var r=lastDemo.receipt,g=lastDemo.grade,d=g.details||{},recall=g.recall_score,understanding=lastDemo.summary.metrics.understanding;
 function axisCard(key,title,value,hint){return '<section class="skillCard skill-'+key+'" aria-label="'+title+'"><h3>'+title+'</h3><strong class="skillValue">'+(value==null?tr('لا درجة موثوقة بعد','Not yet scorable'):value+'%')+'</strong>'+(value==null?'':'<div class="skillTrack" role="progressbar" aria-label="'+title+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+value+'"><i style="width:'+value+'%"></i></div>')+'<p>'+esc(hint)+'</p></section>';}
 var rows=(d.criteria||[]).map(function(c){var status={supported:tr('مثبت','Supported'),unrecognized:tr('لم يُثبت: أضف أو وضّح هذا العنصر','Not established: add or clarify this element'),contradicted:tr('حكم مخالف: راجع القاعدة','Contrary claim: review the rule'),conflicting:tr('عبارتان متعارضتان: تحتاج مراجعة','Conflicting claims: review needed')};return '<li class="criterion '+c.status+'"><div><b>'+esc(c.label)+'</b><span>'+c.points+' / '+c.max_points+'</span></div><small>'+status[c.status]+'</small>'+c.evidence.concat(c.contrary).map(function(e){return '<blockquote>'+esc(e)+'</blockquote>';}).join('')+'</li>';}).join('');
 stage(100,'<span class="demoEyebrow">'+tr('نتيجة هذه المحاولة','Results for this attempt')+'</span><h2>'+tr('نتيجتك: الحفظ والفهم','Your result: recall & understanding')+'</h2><p>'+tr('مهارتان فقط. الفهم من أسئلته المستقلة؛ لا يُستنتج من إعادة صياغة الإجابة الحرة.','Two skills only. Understanding comes from its own questions, not from paraphrasing the free response.')+'</p><div class="resultInfographic">'+axisCard('recall',tr('الحفظ','Recall'),recall,tr('الإجابة الحرة: نقاط العناصر المثبتة '+(d.points==null?'—':d.points)+' من 7.','Free response: '+(d.points==null?'—':d.points)+' evidenced points out of 7.'))+axisCard('understanding',tr('الفهم','Understanding'),understanding,tr('مؤشر من أربعة أسئلة فهم، وليس حكمًا نهائيًا على الإتقان.','Indicator from four understanding questions, not a final mastery assessment.'))+'</div><div class="resultExplanation"><h3>'+tr('كيف نقرأ النتيجة؟','How to read this result')+'</h3><p>'+esc(g.feedback)+'</p><small>'+tr('تصحيح محلي بقواعد محدودة، وليس تصحيحًا دلاليًا كاملًا. الدرجة مبدئية ويستطيع المشرف تأكيدها أو تعديلها.','Limited local rules, not full semantic grading. This provisional score can be confirmed or corrected by the supervisor.')+'</small></div><p>'+tr('أسئلة الحفظ المرتبطة: ','Related recall questions: ')+pct('recall')+'% — '+tr('مؤشر منفصل لا يستبدل تقييم الإجابة الحرة.','a separate indicator that does not replace the free-response assessment.')+'</p><h3>'+tr('الأدلة والعناصر التي تحتاج استكمالًا','Evidence and elements to complete')+'</h3><ul class="criteriaList">'+rows+'</ul><details><summary>'+tr('إجابتك الأصلية','Your original answer')+'</summary><p class="originalAnswer">'+esc(free)+'</p></details><div class="deliveryState" role="status">'+(r.received&&r.submission_id?tr('تم تأكيد حفظ المحاولة. رقمها: ','Saving confirmed. Attempt ID: ')+'<code>'+esc(r.submission_id)+'</code>':esc(errorLabel(r.error)))+'</div><div class="demoActions">'+(!r.received?'<button class="btn primary" id="retrySave">'+tr('إعادة إرسال نفس المحاولة','Retry saving this attempt')+'</button>':'')+'<button class="btn secondary" id="previewDemo">'+tr('تدريب مقترح','Suggested practice')+'</button><button class="btn secondary" id="closeDemo">'+tr('إنهاء التجربة','Finish')+'</button><button class="btn secondary" id="retryDemo">'+tr('اختبار جديد','New test')+'</button></div>');
 document.getElementById('previewDemo').onclick=previewTraining;
 document.getElementById('closeDemo').onclick=receiptScreen;
 document.getElementById('retryDemo').onclick=read;
 if(document.getElementById('retrySave'))document.getElementById('retrySave').onclick=result;
}
function previewTraining(){
 var w=lastDemo.summary.weak;
 var prompt=w==="recall"?tr('اكتب ثلاثة مفاتيح تساعدك على تذكّر عناصر المادة 39 و40، ثم اشرح وظيفة كل مفتاح.','Write three cues for Articles 39–40 and explain each one.'):w==="understanding"?tr('اشرح لماذا يختلف بدء الشخصية عن حقوق الحمل المشروطة بالولادة حية.','Explain the difference between legal personality and conditional prenatal rights.'):tr('لو لم تتم الولادة حية، هل يتحقق شرط ثبوت حقوق الحمل المذكورة؟ بيّن السبب.','If live birth did not occur, would the stated prenatal-rights condition be met? Explain.');
 stage(100,'<span class="demoEyebrow">'+tr('تدريب توضيحي مستقل','Independent training illustration')+'</span><h2>'+tr('استخدم ما تعرفه لتطوير ما تحتاجه','Use what you know to develop what you need')+'</h2><p>'+prompt+'</p><textarea class="freeInput" id="previewAnswer" placeholder="'+tr('حاول الإجابة هنا...','Try your answer here...')+'"></textarea><div class="demoActions"><button class="btn primary" id="previewExplain">'+tr('اعرض الفكرة القانونية','Show the legal concept')+'</button><button class="btn secondary" id="previewReturn">'+tr('العودة للنتيجة','Back to results')+'</button></div><div id="previewExplanation" class="demoStatus" role="status"></div>');
 document.getElementById("previewReturn").onclick=resultScreen;
 document.getElementById("previewExplain").onclick=function(){document.getElementById("previewExplanation").textContent=tr('تبدأ الشخصية بالولادة حية وتنتهي بالموت، أما حقوق الحمل التي لا يحتاج سببها إلى قبول فتتوقف على شرط الولادة حية. هذه معاينة تدريب وليست تصحيحًا لإجابتك.','Personality begins with live birth and ends at death; the stated prenatal rights depend on live birth. This is a training preview, not grading of your answer.');};
}
function receiptScreen(){
 var r=lastDemo.receipt;
 stage(100,'<div class="receiptScreen"><div class="receiptLogoWrap"><img src="assets/lexlearn-logo.svg" alt="LexLearn"></div><h2>'+(r.received?tr('انتهى الديمو وتم حفظ المحاولة','Demo complete — attempt saved'):tr('انتهى الاختبار ولم يتأكد الحفظ','Test complete — saving not confirmed'))+'</h2><p>'+(r.received?tr('إجابتك ونتيجتها المبدئية متاحتان لمراجعة المشرف.','Your answer and provisional assessment are available for supervisor review.'):esc(errorLabel(r.error)))+'</p>'+(r.received?'<code>'+esc(r.submission_id)+'</code>':'')+'<div class="demoActions"><button class="btn primary" id="receiptReturn">'+tr('العودة للنتيجة','Back to results')+'</button><a class="btn secondary" href="'+(ar?'index.html':'index-en.html')+'">'+tr('الرئيسية','Home')+'</a></div></div>');
 document.getElementById('receiptReturn').onclick=resultScreen;
}
async function result(){
 if(busy)return;busy=true;persist();analysisPage();
 var local=window.LEX_RECALL.assess(free,lang),receipt;
 var deadline;try{receipt=await Promise.race([sendDemo(),new Promise(function(_,reject){deadline=setTimeout(function(){reject(new Error('send_not_confirmed'));},18000);})]);}catch(e){receipt={received:false,error:String(e&&e.message||'send_not_confirmed')};}
 clearTimeout(deadline);var g=receipt.received?receipt:local;
 var understanding=receipt.received?receipt.choice_indicators.understanding:pct('understanding');
 lastDemo={receipt:receipt,grade:g,summary:{metrics:{recall:g.recall_score,understanding:understanding},weak:g.recall_score===null?null:g.recall_score<understanding?'recall':g.recall_score>understanding?'understanding':null}};
 busy=false;persist();resultScreen();
}
hero();
var saved=restore();
if(saved&&saved.requestId&&Array.isArray(saved.answers)){
 var resume=document.createElement('button');resume.className='btn secondary';resume.textContent=tr('استكمال المحاولة المحفوظة في هذا التبويب','Resume the attempt saved in this tab');
 resume.onclick=function(){requestId=saved.requestId;answers=saved.answers;free=saved.free||'';step=saved.step||0;makeQuestions();if(saved.receipt&&saved.receipt.received){var r=saved.receipt;lastDemo={receipt:r,grade:r,summary:{metrics:{recall:r.recall_score,understanding:r.choice_indicators.understanding},weak:null}};resultScreen();}else if(step>=6)recall();else if(step>0)quiz();else read();};
 document.getElementById('startDemo').parentNode.appendChild(resume);
}
})();
