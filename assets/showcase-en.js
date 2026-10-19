(function(){
"use strict";
var ar=document.documentElement.lang==="ar",lang=ar?"ar":"en",Q=window.LEX_QUALITY,APP=document.getElementById("showcaseApp"),questions=[],answers=[],step=0,timer=null,free="",started=0;
var requestId=null,busy=false,draftKey='lexlearn-demo-v3-'+lang;
function persist(){try{sessionStorage.setItem(draftKey,JSON.stringify({requestId:requestId,answers:answers,free:free,step:step,receipt:lastDemo&&lastDemo.receipt}));}catch(_){}}
function restore(){try{return JSON.parse(sessionStorage.getItem(draftKey)||'null');}catch(_){return null;}}
function tr(a,b){return ar?a:b;}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function chrome(s){APP.innerHTML='<div class="demoShell"><header class="demoTop"><div class="demoTopIn"><div class="demoBrand"><div class="demoLogo"><img src="assets/lexlearn-x-transparent.svg" alt="LexLearn" width="44" height="44"></div><div><b>Lex<span class="brandLearn">Learn</span></b></div></div><nav class="demoMeta" aria-label="'+tr('التنقل','Navigation')+'"><div class="demoLangGroup" role="group" aria-label="Language"><a class="demoLang" href="showcase-en.html?country=qa&amp;subject=rights" lang="en" '+(ar?'':'aria-current="page"')+'>EN</a><span aria-hidden="true">|</span><a class="demoLang" href="showcase.html?country=qa&amp;subject=rights" lang="ar" '+(ar?'aria-current="page"':'')+'>عربي</a></div><a class="demoGhost demoBack" href="conference.html#paths">'+tr('رجوع','Back')+'</a></nav></div></header><main class="demoWrap"><p role="status" style="margin:0 auto 1rem;padding:.65rem 1rem;background:#FFF3E8;color:#712440;border:1px solid #E1C6B7;border-radius:10px;font-weight:700">'+tr('تجربة عرض — النتائج لا تُحفظ في حساب الطالب ولا تُحتسب درجات أكاديمية','Public demo — results do not enter student accounts or count as academic grades')+'</p>'+s+'</main><footer class="demoFooter">LexLearn</footer></div>';}
function stage(n,s){var phase=n<=5?1:(n<100?2:3);chrome('<section class="demoStage"><p class="stageProgressText">'+tr('الخطوة ','Step ')+'<bdi dir="ltr">'+phase+'/3</bdi></p><div class="progress"><i style="width:'+n+'%"></i></div><div class="stageCard">'+s+'</div></section>');}
function makeQuestions(){
 var t=Q.topic(1);
 questions=[
 {type:'recall',q:tr('متى تبدأ شخصية الإنسان وفق النص؟','When does human legal personality begin?'),opts:ar?['بتمام ولادته حيًا','ببدء الحمل المستكن','باكتمال أهلية الأداء']:['Upon being born alive','Upon conception in the womb','Upon full capacity to act'],a:0},
 {type:'recall',q:tr('ما الشرط اللازم لثبوت حقوق الجنين المذكورة في النص؟','What condition must be met for the prenatal rights in the text?'),opts:ar?['تمام الولادة حيًا','وجود قبول سابق','تمام سن التمييز']:['Live birth is completed','Prior acceptance exists','Discernment age is reached'],a:0},
 {type:'understanding',q:t.q_en,opts:t.opts_en,a:0},
 {type:'understanding',q:t.scenario_en,opts:t.applied_en,a:0},
 {type:'understanding',q:tr('نشأ للجنين حق لا يحتاج سببه إلى قبول، لكنه لم يولد حيًا. ماذا يحدث للحقوق المذكورة في النص؟','The child was not born alive, although the right’s cause required no acceptance. What follows for the stated rights?'),opts:ar?['لا يتحقق شرط ثبوت الحقوق المقصودة','تثبت الحقوق لأن سببها سبق الولادة','تثبت الحقوق إذا كان محلها مالًا']:['The condition for those rights is not met','The rights vest because their cause preceded birth','The rights vest if their object is property'],a:0},
 {type:'understanding',q:tr('لماذا لا يعني ثبوت بعض الحقوق للحمل أن الشخصية القانونية بدأت قبل الولادة؟','Why do certain prenatal rights not mean that legal personality begins before birth?'),opts:ar?['لأنها حقوق محددة مشروطة بالولادة حية، بينما تبدأ الشخصية القانونية بالولادة','لأن جميع الحقوق تثبت للحمل دون أي شروط','لأن الشخصية تبدأ بمجرد الحمل دون انتظار الولادة']:['Because specific prenatal rights depend on live birth, while personality begins at birth','Because all prenatal rights vest without conditions','Because legal personality begins at conception without live birth'],a:0}
 ];
 if(ar){questions[2].q='ما الفرق بين بداية الشخصية القانونية وحقوق الجنين قبل الولادة؟';questions[2].opts=t.opts_ar;questions[3].q='نشأ للجنين حق لا يحتاج سببه إلى قبول، ثم وُلد حيًا. ما أثر الولادة على هذا الحق؟';questions[3].opts=t.applied_ar;}
}
function hero(){chrome('<section class="demoStage demoIntro"><div class="stageCard centered"><p class="stageProgressText">'+tr('الخطوة ','Step ')+'<bdi dir="ltr">1/3</bdi></p><span class="demoEyebrow">'+tr('تجربة قصيرة · نحو 3–5 دقائق','Short demo · about 3–5 minutes')+'</span><h2>'+tr('ابدأ من قوتك','Start from your strength')+'</h2><p class="demoIntroLead">'+tr('اقرأ قاعدة قصيرة، ثم أجب عن 6 أسئلة واكتب ما تتذكره. بعدها جرّب 4 أنشطة تدريبية تناسب نتيجة محاولتك.','Read a short rule, answer six questions, and write what you remember. Then try four practice activities selected for your attempt.')+'</p><button class="btn primary demoStart" id="startDemo">'+tr('ابدأ','Start')+'</button><p class="demoPrivacy">'+tr('لا تحتاج إلى كتابة اسمك لتجربة الديمو.','You do not need to enter your name to try the demo.')+'</p><p class="demoPrivacy demoAiDisclosure">'+tr('التقدير الآلي مبدئي ويعتمد على قواعد محدودة. تُحفظ إجابتك عند نجاح الإرسال لمراجعة المشرف؛ الديمو لا يمنح درجة جامعية.','Feedback uses limited rule-based checks. After confirmed submission, your answer is saved for instructor review. This demo does not award university marks or provide full AI semantic grading.')+'</p><small class="demoExtraTask">'+tr('تتبع الأسئلة مهمة استرجاع قصيرة ضمن التجربة.','A short recall task follows the six questions.')+'</small></div></section>');document.getElementById('startDemo').onclick=read;}
function read(){
 answers=[];step=0;free="";lastDemo=null;requestId=crypto.randomUUID();makeQuestions();started=Date.now();persist();
 var rule=tr('تبدأ شخصية الإنسان بتمام ولادته حيًا، وتنتهي بموته. والحمل المستكن أهل لثبوت الحقوق التي لا يحتاج سببها إلى قبول، وذلك بشرط تمام ولادته حيًا.','A human being acquires legal personality upon being born alive, and it ends at death. An unborn child may acquire rights whose cause does not require acceptance, provided that the child is born alive.');
 stage(5,'<span class="demoEyebrow">'+tr('اقرأ قبل اختبار الذاكرة','Read before the recall task')+'</span><h2>'+tr('الشخصية القانونية · المادتان 39–40','Legal personality · Articles 39–40')+'</h2><div class="legalPaper"><small>'+tr('القانون المدني القطري · مقتطف تعليمي','Qatar Civil Code · educational English rendering')+'</small><div class="txt">'+rule+'</div></div><p>'+tr('خذ وقتك في القراءة. «الحمل المستكن» يعني الجنين قبل الولادة. عندما تكون مستعدًا اضغط «انتهيت»؛ سنخفي النص لتجربة ما تتذكره.','Take your time. “Prenatal” refers to the period before birth. Select Done when ready; the text will be hidden for the recall task.')+'</p><button class="btn primary" id="finishRead">'+tr('انتهيت','Done')+'</button>');document.getElementById('finishRead').onclick=quiz;
}
function quiz(){
 var t=questions[step],ord=Q.shuffleOptions(t);
 stage(Math.round((step+1)/7*90),'<span class="demoEyebrow">'+tr('السؤال ','Question ')+(step+1)+tr(' من 7',' of 7')+'</span><h2>'+esc(t.q)+'</h2><div class="choices">'+ord.map(function(x){return '<button class="choice" data-o="'+x.orig+'">'+esc(x.text)+'</button>';}).join('')+'</div>');
 document.querySelectorAll('[data-o]').forEach(function(b){b.onclick=function(){answers.push({type:t.type,correct:Number(b.dataset.o)===t.a,selected:Number(b.dataset.o),latency:Date.now()-started});step++;persist();started=Date.now();if(step<questions.length)quiz();else recall();};});
}
function recall(){stage(90,'<span class="demoEyebrow">'+tr('السؤال 7 من 7','Question 7 of 7')+'</span><h2>'+tr('اكتب ما تتذكره بطريقتك','Write what you remember in your own words')+'</h2><p>'+tr('اكتب إجابة قصيرة توضح: متى تبدأ الشخصية القانونية؟ ومتى تنتهي؟ وما حقوق الجنين المذكورة وشرط ثبوتها؟ لا يلزم نقل النص حرفيًا أو إضافة مثال.','Write a short answer: when does legal personality begin and end, and which prenatal rights and condition does the text mention? Exact wording and an example are not required.')+'</p><textarea class="freeInput" id="freeText" maxlength="1800" aria-label="'+tr('إجابة الحفظ','Recall answer')+'" placeholder="'+tr('اكتب ما تتذكره...','Write what you remember...')+'"></textarea><button class="btn primary" id="seeResult">'+tr('عرض النتيجة','Show result')+'</button><div id="recallNote"></div>');document.getElementById('freeText').value=free;document.getElementById('freeText').oninput=function(){free=this.value;persist();};document.getElementById('seeResult').onclick=function(){free=document.getElementById('freeText').value.trim();if(!free){document.getElementById('recallNote').textContent=tr('اكتب ما تتذكره أو «لا أتذكر».','Write what you remember or “I do not remember”.');return;}persist();result();};}
function pct(type){var a=answers.filter(function(x){return x.type===type;});return a.length?Math.round(a.filter(function(x){return x.correct;}).length/a.length*100):null;}
function metric(k,v){return '<div class="metric"><span>'+Q.labels[lang][k]+'</span><b>'+(v==null?tr('لم يُقَس','Not assessed'):v+'%')+'</b></div>';}
var lastDemo=null;
function analysisPage(){
 stage(97,'<div class="analysisScreen" role="status" aria-live="polite" aria-busy="true"><div class="analysisLogoWrap"><img src="assets/lexlearn-logo.svg" width="120" height="120" alt="LexLearn"></div><p class="analysisTagline">'+tr('نفهم طريقة تفكيرك، ونبني طريقك.','We understand how you think and build your learning path.')+'</p><h2>'+tr('جارٍ التحميل وتحليل إجابتك…','Loading and analysing your answer…')+'</h2><p>'+tr('نراجع عناصر إجابتك ونجهّز مؤشرات الحفظ والفهم.','Reviewing your answer and preparing recall and understanding indicators.')+'</p><div class="analysisProgress" aria-hidden="true"><i></i></div></div>');
}

async function sendDemo(){
 if(!window.LEX_CLOUD||!LEX_CLOUD.isConfigured())throw new Error('cloud_unavailable');
 var db=LEX_CLOUD.db(),session=await db.auth.getSession();
 if(session.error)throw new Error('authentication_required');
 if(!session.data.session){
  var guest=await db.auth.signInAnonymously();
  if(guest.error||!guest.data.user)throw new Error(guest.error&&guest.error.code==='anonymous_provider_disabled'?'guest_auth_disabled':guest.error&&guest.error.status===429?'auth_rate_limit':'guest_auth_unavailable');
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
 var labels={guest_auth_disabled:tr('الإرسال للمشرف غير متاح الآن. يمكنك الاطلاع على التقدير المبدئي والمحاولة لاحقًا.','Saving for the supervisor is unavailable. You can view the provisional estimate and retry later.'),auth_rate_limit:tr('بلغت خدمة الدخول حد الطلبات المؤقت. انتظر قليلًا ثم أعد الإرسال؛ إجابتك باقية.','The sign-in service is temporarily rate-limited. Wait and retry; your answer is retained.'),daily_demo_limit:tr('بلغت التجربة الحد اليومي. أُبقيت إجابتك هنا؛ أعد إرسالها بعد تجدد الحصة عند 00:00 UTC.','The daily demo limit was reached. Your answer is retained; retry after the quota resets at 00:00 UTC.'),authentication_required:tr('تعذر التحقق من جلسة الدخول. إجابتك محفوظة في هذا التبويب؛ سجّل الدخول ثم أعد الإرسال.','Your session could not be verified. Your answer remains in this tab; sign in and retry.'),guest_auth_unavailable:tr('تعذر بدء جلسة الزائر. تحقق من الاتصال وأعد الإرسال.','Guest sign-in failed. Check your connection and retry.'),invalid_demo_payload:tr('بيانات الاختبار غير مكتملة؛ راجع إجاباتك.','The submitted test data is incomplete; review your answers.'),request_conflict:tr('معرّف هذه المحاولة مرتبط بإجابة أخرى؛ ابدأ محاولة جديدة مع الاحتفاظ بنسخة من إجابتك.','This attempt ID belongs to different content; keep a copy and start a new attempt.'),demo_result_save_failed:tr('تعذر تسجيل المحاولة في قاعدة البيانات؛ إجابتك باقية هنا ويمكن إعادة إرسالها.','The database could not save the attempt. Your answer remains here for retry.')};
 return labels[code]||tr('لم يصل تأكيد من الخادم. تحقق من الاتصال ثم اضغط إعادة الإرسال؛ لن تتكرر المحاولة.','No server confirmation was received. Check your connection and retry; the same attempt will not be duplicated.');
}
function completedGuidedPractice(){
 // This is a same-tab navigation hint only, never an academic release or score.
 try{
  var data=JSON.parse(sessionStorage.getItem("lexlearn-showcase-first-session-v1")||"null");
  return !!(data&&data.completed===true&&data.lang===lang&&Number.isFinite(data.at));
 }catch(_){return false;}
}
function resultScreen(){
 var r=lastDemo.receipt,g=lastDemo.grade,d=g.details||{},unconfirmed=d.provider==='none',recall=g.recall_score,understanding=lastDemo.summary.metrics.understanding;
 var guidedComplete=completedGuidedPractice();
 var stateLabels={
  no_legal_content:tr("لم يتضح المقصود بعد","No recognizable legal answer"),
  incomplete_proposition:tr("تحتاج الإجابة إلى توضيح","Answer needs clarification"),
  conflicting_propositions:tr("توجد عبارتان تحتاجان توضيحًا","Conflicting answer"),
  ambiguous_assertion:tr("وضّح المقصود في هذه العبارة","Uncertain wording"),
  unrecognized_wording:tr("التقييم الآلي غير مكتمل","Automated grading incomplete"),
  ai_uncertain:tr("التقييم الآلي غير حاسم","Automated grading inconclusive"),
  local_engine_error:tr("تعذر التقييم المحلي","Local assessment unavailable"),
  legal_sources_not_ready:tr("مصادر القانون قيد التحقق","Legal sources not verified")
 };
 var recallState=stateLabels[d.reason]||tr("لم تُحدَّد درجة آليًا","No automated grade yet");
 function axisCard(key,title,value,hint){return '<section class="skillCard skill-'+key+'" aria-label="'+title+'"><h3>'+title+'</h3><strong class="skillValue">'+(value==null?(key==='recall'?recallState:tr('لم يُقَس','Not measured')):value+'%')+'</strong>'+(value==null?'':'<div class="skillTrack" role="progressbar" aria-label="'+title+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+value+'"><i style="width:'+value+'%"></i></div>')+'<p>'+esc(hint)+'</p></section>';}
 var rows=(d.criteria||[]).map(function(c){var status={supported:tr('مثبت','Supported'),unrecognized:tr('أضف هذا العنصر أو وضّحه','Not established: add or clarify this element'),contradicted:tr('راجع هذه النقطة في ضوء القاعدة','Contrary claim: review the rule'),conflicting:tr('عبارتان متعارضتان: تحتاج مراجعة','Conflicting claims: review needed')};return '<li class="criterion '+c.status+'"><div><b>'+esc(c.label)+'</b><span>'+c.points+' / '+c.max_points+'</span></div><small>'+status[c.status]+'</small>'+c.evidence.concat(c.contrary).map(function(e){return '<blockquote>'+esc(e)+'</blockquote>';}).join('')+'</li>';}).join('');
 stage(100,'<span class="demoEyebrow">'+tr('نتيجة هذه المحاولة','Results for this attempt')+'</span><h2>'+tr('مؤشرات الحفظ والفهم في هذه المحاولة','Recall & understanding: provisional indicators')+'</h2><p>'+tr('هذه نتيجة محاولتك الحالية، وليست حكمًا على مستواك العام. نعرض الفهم من أسئلته، والاسترجاع من إجابتك المكتوبة عندما يكتمل تقييمها.','This result describes this attempt, not your overall ability. Understanding comes from its own questions; recall comes from your written answer when its assessment is complete.')+'</p>'+'<div class="resultInfographic">'+axisCard('recall',tr('الحفظ — عناصر الإجابة المتحققة','Recall — verified answer elements'),recall,(recall==null?(tr('لم تُحتسب درجة للإجابة الحرة؛ تعذّر التحقق الآلي من معناها.','The free-response grade is not calculated because automated verification was inconclusive.')):tr('المحرك الداخلي: '+(d.coverage_points==null?d.points:d.coverage_points)+' من 7 نقاط لعناصر الإجابة.'+(d.needs_review?' الصياغة تحتاج إلى توضيح؛ هذه نسبة العناصر المتحققة فقط.':''),'Internal engine: '+(d.coverage_points==null?d.points:d.coverage_points)+' of 7 points for answer elements.'+(d.needs_review?' Clarify your wording; this percentage reflects verified elements only.':''))))+axisCard('understanding',tr('الفهم','Understanding'),understanding,tr('مؤشر من أربعة أسئلة فهم، وليس حكمًا نهائيًا على الإتقان.','Indicator from four understanding questions, not a final mastery assessment.'))+'</div><div class="resultExplanation"><h3>'+tr('كيف نقرأ النتيجة؟','How to read this result')+'</h3><p>'+esc(g.feedback)+'</p><small>'+(unconfirmed?tr('النسبة تعكس العناصر التي تعرّف عليها الفحص المحلي، ولا تمثّل تصحيحًا دلاليًا نهائيًا.','The percentage reflects elements recognized by limited local rules, not a final semantic assessment.'):(d.provider==='openai'?tr('تقييم دلالي آلي مبدئي وفق مصادر قانونية معتمدة. يمكن للمشرف الاطلاع على الإجابة وتقييمها عند الحاجة.','Provisional AI semantic grading against approved legal sources; the supervisor can access and review the assessment.'):tr('تقييم آلي أولي بقواعد محدودة؛ لا يوجد تصحيح دلالي مؤكد لهذه المحاولة.','Preliminary rule-based check; semantic AI grading was not confirmed for this attempt.')))+'</small></div><p>'+tr('التعرّف على القاعدة من بدائل: ','Rule recognition from answer options: ')+pct('recall')+'% — '+tr('هذا مؤشر للتعرّف، ولا يحل محل نسبة الحفظ من إجابتك المكتوبة.','This is a recognition indicator, separate from recall measured by your written answer.')+'</p><h3>'+tr('ما ظهر في إجابتك وما يمكنك تحسينه','What your answer shows and what to improve')+'</h3>'+('<ul class="criteriaList">'+rows+'</ul>')+'<details><summary>'+tr('إجابتك الأصلية','Your original answer')+'</summary><p class="originalAnswer">'+esc(free)+'</p></details>'+(r.received&&r.submission_id?'<div class="deliveryState" role="status">'+tr('تم تأكيد حفظ المحاولة. رقمها: ','Saving confirmed. Attempt ID: ')+'<code>'+esc(r.submission_id)+'</code></div>':'')+(guidedComplete?'<p class="demoPrivacy" role="status">'+tr('أنهيت الأربع مهام التدريبية. الخطوة التالية: معاينة المستوى الأول، دون احتساب درجة أكاديمية.','You completed the four practice activities. Next: preview level one (no academic grade).')+'</p>':'')+'<div class="demoActions">'+'<button type="button" class="btn secondary" id="editFreeAnswer">'+tr('راجع أو عدّل الإجابة الحرة','Review or edit your written answer')+'</button>'+(guidedComplete?
  '<a class="btn primary" id="firstStageFromResults" href="'+(ar?'program.html':'program-en.html')+'?demo=1&start=1&preview=stage1&country=qa&subject=rights">'+tr('ابدأ المستوى الأول — معاينة','Begin level one — preview')+'</a>'+
  '<button type="button" class="btn secondary" id="previewDemo">'+tr('إعادة الأربع مهام','Repeat four activities')+'</button>':
  '<button class="btn primary" id="previewDemo">'+tr('جرّب التدريب المخصص · 4 مهام','Try targeted practice · 4 steps')+'</button>')+'<button class="btn secondary" id="closeDemo">'+tr('إنهاء التجربة','Finish')+'</button><button class="btn secondary" id="retryDemo">'+tr('اختبار جديد','New test')+'</button></div>');
 var editButton=document.getElementById('editFreeAnswer');
 if(editButton)editButton.onclick=editFreeAnswer;
 document.getElementById('previewDemo').onclick=previewTraining;
 document.getElementById('closeDemo').onclick=receiptScreen;
 document.getElementById('retryDemo').onclick=read;
}
function editFreeAnswer(){
 // Do not rewrite the prior saved submission. A changed answer is a new attempt
 // with the same diagnostic choices; unchanged text can retry a failed receipt.
 var original=free;
 stage(100,'<span class="demoEyebrow">'+tr('مراجعة الإجابة الحرة','Review your written answer')+'</span>'+
  '<h2>'+tr('راجع إجابتك وأكمل ما تحتاجه','Review and build on your answer')+'</h2>'+
  '<p>'+tr('اذكر بداية الشخصية القانونية ونهايتها، وحقوق الحمل المتعلقة بعدم اشتراط القبول، وشرط الولادة حية. لا يلزم حفظ النص حرفيًا. قد يعجز الفحص المحدود عن فهم إجابة صحيحة، ولا يعني ذلك أنها خاطئة.',
   'Explain when legal personality begins and ends, which prenatal rights require no acceptance, and the live-birth condition. Exact wording is not necessary. A valid answer may still go unrecognized by the limited checker.')+'</p>'+
  '<textarea class="freeInput" id="revisedFreeAnswer" maxlength="1800" aria-label="'+tr('تعديل الإجابة القانونية','Edit legal answer')+'"></textarea>'+
  '<p class="demoPrivacy">'+tr('إعادة فحص الإجابة نفسها أو تعديلها تُنشئ محاولة جديدة مع بقاء المحاولات السابقة لدى المشرف.',
   'Rechecking the same answer or editing it creates a separate attempt and does not overwrite any earlier supervisor record.')+'</p>'+
  '<div id="revisedFreeError" role="alert"></div>'+
  '<div class="demoActions"><button type="button" class="btn primary" id="submitRevisedFree">'+tr('احفظ الإجابة وأعد فحصها','Save and recheck my answer')+'</button>'+
  '<button type="button" class="btn secondary" id="cancelRevisedFree">'+tr('العودة للنتيجة','Back to results')+'</button></div>');
 var field=document.getElementById('revisedFreeAnswer');field.value=original;
 document.getElementById('cancelRevisedFree').onclick=resultScreen;
 document.getElementById('submitRevisedFree').onclick=function(){
  var revised=field.value.trim(),note=document.getElementById('revisedFreeError');
  if(!revised){note.textContent=tr('اكتب إجابتك أولًا.','Write your answer first.');field.focus();return;}
  // Allow rechecking exactly the same legal answer after a published rubric-engine
  // correction. A fresh request_id creates a new, auditable attempt under the
  // existing daily limit, while leaving the original grader result unchanged.
  if(busy)return;
  // Every recheck gets its own immutable evidence and an idempotent retry ID.
  requestId=crypto.randomUUID();free=revised;lastDemo=null;persist();result();
 };
}
function previewTraining(){
  if(!window.LEX_SHOWCASE_CYCLE||!window.LEX_SHOWCASE_CYCLE.run){
    stage(100,'<h2>'+tr('تعذر تحميل خطوات التدريب','Practice steps could not load')+'</h2><p>'+tr('ارجع للنتيجة وحاول تحديث الصفحة.','Return to the result and refresh the page.')+'</p><button class="btn secondary" id="returnFromCycle">'+tr('العودة للنتيجة','Back to results')+'</button>');
    document.getElementById('returnFromCycle').onclick=resultScreen;
    return;
  }
  window.LEX_SHOWCASE_CYCLE.run({lang:lang,weak:lastDemo.summary.weak,stage:stage,goBack:resultScreen});
}
function receiptScreen(){
 var r=lastDemo.receipt;
 stage(100,'<div class="receiptScreen"><div class="receiptLogoWrap"><img src="assets/lexlearn-logo.svg" alt="LexLearn"></div><h2>'+(r.received?tr('اكتملت التجربة التفاعلية وحُفظت المحاولة','Interactive experience complete — attempt saved'):tr('اكتملت التجربة التفاعلية','Interactive experience complete'))+'</h2><p>'+(r.received?tr('حُفظت إجابتك والتقييم الآلي المتاح، ويمكن للمشرف الاطلاع عليهما ومراجعتهما.','Your answer and available automated assessment were saved for supervisor access and review.'):tr('يمكنك العودة إلى نتيجتك ومراجعة إجابتك.','You can return to your result and review your answer.'))+'</p>'+(r.received?'<code>'+esc(r.submission_id)+'</code>':'')+'<div class="demoActions"><button class="btn primary" id="receiptReturn">'+tr('العودة للنتيجة','Back to results')+'</button><a class="btn secondary" href="'+(ar?'index.html':'index-en.html')+'">'+tr('الرئيسية','Home')+'</a></div></div>');
 document.getElementById('receiptReturn').onclick=resultScreen;
}
async function result(){
 if(busy)return;busy=true;persist();analysisPage();
 var local=window.LEX_RECALL.assessPractice(free,lang),receipt;
 var analysisVisible=new Promise(function(resolve){setTimeout(resolve,1400);});
 var deadline;try{receipt=await Promise.race([sendDemo(),new Promise(function(_,reject){deadline=setTimeout(function(){reject(new Error('send_not_confirmed'));},18000);})]);}catch(e){receipt={received:false,error:String(e&&e.message||'send_not_confirmed')};}
 clearTimeout(deadline);await analysisVisible;var g=local;
 var understanding=receipt.received?receipt.choice_indicators.understanding:pct('understanding');
 lastDemo={receipt:receipt,grade:g,summary:{metrics:{recall:g.recall_score,understanding:understanding},weak:window.LEX_SHOWCASE_CYCLE.recommend(g.recall_score,understanding)}};
 busy=false;persist();resultScreen();
}
hero();
var saved=restore();
if(saved&&saved.requestId&&Array.isArray(saved.answers)){
 var resume=document.createElement('button');resume.className='btn secondary';resume.textContent=tr('استكمال المحاولة المحفوظة في هذا التبويب','Resume the attempt saved in this tab');
 resume.onclick=function(){requestId=saved.requestId;answers=saved.answers;free=saved.free||'';step=saved.step||0;makeQuestions();if(saved.receipt&&saved.receipt.received){var r=saved.receipt;var grade=window.LEX_RECALL.assessPractice(free,lang);lastDemo={receipt:r,grade:grade,summary:{metrics:{recall:grade.recall_score,understanding:r.choice_indicators.understanding},weak:window.LEX_SHOWCASE_CYCLE.recommend(grade.recall_score,r.choice_indicators.understanding)}};resultScreen();}else if(step>=6)recall();else if(step>0)quiz();else read();};
 document.getElementById('startDemo').parentNode.appendChild(resume);
}
})();
