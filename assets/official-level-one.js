/* LexLearn student account only: server-authorized level-one adaptive practice.
 * The public four-task showcase must never import this module.
 * Free legal answers remain pending human review, never fabricated scores.
 */
(function(root){
"use strict";
var COURSE_ID="qa-qu-lawc101-rights";
function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function phrase(lang,ar,en){return lang==="en"?en:ar;}
function byId(arr,id){return arr.find(function(x){return x.item_id===id;});}
function confirmedAi(entry){var ev=entry&&entry.evaluation||{};return ev.status==="preliminary_ai"&&ev.rubric_version==="lexlearn-training-ai-v4"&&typeof ev.provisional_percent==="number"&&Number.isFinite(ev.provisional_percent);}
function feedbackHtml(entry,lang){
 if(!entry)return "";
 var ar=lang!=="en",ev=entry.evaluation||{},labels={
 live_birth:["الولادة الحية وبداية الشخصية","Live birth and legal personality"],
 death_end:["الوفاة ونهاية الشخصية","Death ends personality"],
 prenatal_conditional_rights:["حقوق الحمل المشروطة","Conditional prenatal rights"],
 memory_cues:["مفاتيح حفظ","Memory cues"],
 cues_with_meaning:["ربط المفاتيح بمعانيها","Meaningful cue connections"],
 explain_live_birth:["تفسير الولادة الحية","Explain live birth"],
 explain_death:["تفسير الوفاة","Explain death"],
 explain_prenatal_condition:["تفسير شرط حقوق الحمل","Explain prenatal conditions"],
 correct_wrong_comparison:["تصحيح المقارنة غير الدقيقة","Correct the inaccurate comparison"],
 relevant_legal_rule:["القاعدة القانونية","The legal rule"],
 connect_facts_to_rule:["التطبيق على الوقائع","Apply the facts"],
 direct_legal_conclusion:["النتيجة القانونية","The legal conclusion"]
 };
 function list(keys){return (Array.isArray(keys)?keys:[]).map(function(k){return "<li>"+esc((labels[k]||[k,k])[ar?0:1])+"</li>";}).join("");}
 if(confirmedAi(entry)){
  var detailed=(Array.isArray(ev.criteria)?ev.criteria:[]).map(function(c){
   var credit=c.credit===1?(ar?"صحيح":"Correct"):c.credit===0.5?(ar?"صحيح جزئيًا":"Partly correct"):(ar?"غير متحقق":"Not met");
   var name=lang==="en"?(c.label_en||c.label_ar||c.id):(c.label_ar||c.label_en||c.id);
   var explanation=lang==="en"?c.explanation_en:c.explanation_ar;
   return "<li><b>"+esc(name)+" — "+esc(credit)+"</b>"+(c.evidence?"<blockquote>"+esc(c.evidence)+"</blockquote>":"")+
    (explanation?"<p>"+esc(explanation)+"</p>":"")+"</li>";
  }).join("");
  return "<section class='legalBox' role='status'><b>"+phrase(lang,"تصحيح دلالي مبدئي: ","Preliminary semantic assessment: ")+
   esc(Math.round(ev.provisional_percent))+"%</b><p style='white-space:pre-wrap'>"+
   esc(ar?ev.feedback_ar:ev.feedback_en)+"</p>"+(detailed?"<ul class='criterionFeedback'>"+detailed+"</ul>":"")+
   "<small>"+phrase(lang,"تقييم تدريبي غير معتمد جامعيًا؛ يحق للمشرف مراجعته.","Non-certified practice feedback, subject to instructor oversight.")+"</small></section>";
 }
 var hasScore=typeof ev.provisional_percent==="number"&&Number.isFinite(ev.provisional_percent);
 var score=hasScore?Math.round(Math.max(0,Math.min(100,ev.provisional_percent)))+"%":(ar?"التقييم الآلي غير مكتمل":"Automatic evaluation incomplete");
 return "<div class='legalBox' role='status'><b>"+(ar?"تقييم المحرك الداخلي المبدئي: ":"Preliminary internal assessment: ")+esc(score)+"</b>"+
  "<p>"+(ar?"النسبة أولية وليست درجة نهائية؛ يفحص المحرك العناصر القانونية والعلاقات ولا يعتمد على طول الإجابة وحده. المشرف يستطيع مراجعتها.":"This provisional percentage checks identifiable legal elements and relationships, not answer length. Supervisors may review it; it is not a final grade.")+"</p>"+
  (list(ev.criteria_met)?"<p>"+(ar?"عناصر متحققة مبدئيًا:":"Elements found:")+"</p><ul>"+list(ev.criteria_met)+"</ul>":"")+
  (list(ev.criteria_missing)?"<p>"+(ar?"عناصر تحتاج استكمالًا:":"Elements needing work:")+"</p><ul>"+list(ev.criteria_missing)+"</ul>":"")+
  (ev.reason?"<p>"+esc(ev.reason)+"</p>":"")+"</div>";
}
function adaptiveHint(lang,mode,dim){
 var hints={
  "recall-led":{recall:["استرجع العناصر دون الرجوع إلى النص.","Recall the elements without looking back."],
    understanding:["ركّز على تفسير لماذا يؤدي الشرط إلى النتيجة القانونية.","Focus on why the condition changes the legal conclusion."],
    exam_execution:["غيّر الواقعة ثم اربطها بالشرط القانوني في أربعة أجزاء.","Apply the decisive legal condition using four answer sections."]},
  "understanding-led":{recall:["ابدأ بمفاتيح ذاكرة قصيرة، ثم أعد بناء القاعدة من ذاكرتك.","Start with memory cues, then reconstruct the legal rule."],
    understanding:["اشرح العناصر بأسلوبك دون مجرد نسخ القاعدة.","Explain the elements in your own words instead of copying."],
    exam_execution:["حوّل فهمك إلى مسألة وقاعدة وتطبيق ونتيجة.","Turn your understanding into Issue, Rule, Application, Conclusion."]},
  "balanced":{recall:["استرجع القاعدة دون نص مساعد.","Retrieve the rule without reference."],
    understanding:["قارن العبارة الدقيقة بغير الدقيقة وفسر السبب.","Compare the accurate and inaccurate statements and explain why."],
    exam_execution:["اختبر انتقال المعرفة إلى واقعة تطبيقية جديدة.","Transfer your knowledge to the case facts."]},
  "foundation":{recall:["احفظ العناصر الأساسية ثم استرجعها دون نص.","Use brief memory cues before unaided retrieval."],
    understanding:["ابدأ بمعنى الولادة الحية والحقوق المشروطة للحمل.","Start with the meaning of live birth and conditional prenatal rights."],
    exam_execution:["استعن بعناوين: المسألة، القاعدة، التطبيق، النتيجة.","Use Issue, Rule, Application, Conclusion headings."]}
 };
 return (hints[mode]||hints.foundation)[dim]?.[lang==="en"?1:0]||"";
}
async function mount(host,opts){
 var cloud=opts&&opts.cloud,lang=opts&&opts.lang==="en"?"en":"ar";
 if(!host||!cloud||typeof cloud.studentLifecycleRpc!=="function"){
  if(host)host.innerHTML="<p role='alert'>"+phrase(lang,"تعذر الاتصال بخدمة المستوى الأول.","First-level service is unavailable.")+"</p>";
  return;
 }
 function t(ar,en){return phrase(lang,ar,en);}
 var data,lastFeedback=null,consented=false,gradingBusy=false,gradingMessage="";
 host.innerHTML="<section class='stage'><div class='taskCard' role='status'>"+t("جارٍ تحميل المستوى الأول المعتمد…","Loading the approved first level…")+"</div></section>";
 try{
  data=await cloud.studentLifecycleRpc("firstLevel",{courseId:COURSE_ID});
  if(cloud.getConsent)try{consented=!!await cloud.getConsent("lexlearn-ai-grading-v1","external_ai_grading");}catch(_){}
  if(!data||typeof data!=="object"||!Array.isArray(data.tasks)||!Array.isArray(data.saved))throw Error("level_one_invalid_server_response");
 }catch(e){
  host.innerHTML="<section class='stage'><div class='taskCard'><h2>"+t("تعذر تحميل المستوى الأول","Unable to load level one")+"</h2><p role='alert'>"+esc(e&&e.message||e)+"</p><a href='"+(lang==="en"?"student-en":"student")+".html'>"+t("حساب الطالب","Student portal")+"</a></div></section>";
  return;
 }
 async function gradeSaved(itemId){
  if(gradingBusy||!consented||!cloud.gradeLevelOneAi)return;
  gradingBusy=true;gradingMessage="";render();
  try{
   var result=await cloud.gradeLevelOneAi(itemId);
   if(!result||!["preliminary_ai","nonanswer_zero"].includes(result.status))gradingMessage=t("الإجابة محفوظة، لكن التقييم الآلي لم يكتمل. يمكن إعادة المحاولة.","Answer saved, but automatic assessment did not finish. You may retry.");
   data=await cloud.studentLifecycleRpc("firstLevel",{courseId:COURSE_ID});
  }catch(e){gradingMessage=t("لم يكتمل التصحيح، لكن الإجابة محفوظة. حاول مرة أخرى لاحقًا.","Assessment could not complete; your answer remains saved. Retry later.");}
  gradingBusy=false;render();
 }
 function wireReviewActions(){
  var grant=host.querySelector("#levelOneConsent");
  if(grant)grant.onclick=async function(){
   grant.disabled=true;
   try{await cloud.recordConsent("lexlearn-ai-grading-v1","external_ai_grading",true);consented=true;gradingMessage="";render();}
   catch(e){gradingMessage=t("تعذر حفظ الموافقة، ولم تُرسل إجابتك إلى خدمة الذكاء الاصطناعي.","Consent was not saved; no answer was sent to the AI service.");render();}
  };
  host.querySelectorAll("[data-level-grade]").forEach(function(btn){
   btn.onclick=function(){gradeSaved(btn.getAttribute("data-level-grade"));};
  });
 }
 function render(){
  if(!data.allowed){
   host.innerHTML="<section class='stage'><div class='taskCard'><h2>"+t("المستوى الأول بانتظار الاعتماد","Level one is awaiting approval")+"</h2><p>"+t("تم حفظ التشخيص والخطة. لا يمكن عرض أسئلة قانونية غير معتمدة.","Your diagnostic and plan are saved. Unapproved academic questions cannot be released.")+"</p><p role='status'>"+esc(data.reason||"academic_release_pending")+"</p><a href='"+(lang==="en"?"student-en":"student")+".html'>"+t("حساب الطالب","Student portal")+"</a></div></section>";
   return;
  }
  if(data.tasks.length!==3||new Set(data.tasks.map(function(x){return x.id;})).size!==3){
   host.innerHTML="<p role='alert'>"+t("المستوى الأول غير مكتمل؛ لن نعرض عناصر ناقصة.","Level-one content is incomplete and cannot be presented.")+"</p>";return;
  }
  var saved=data.saved,completed=data.tasks.filter(function(x){return !!byId(saved,x.id);}).length;
  var next=data.tasks.find(function(x){return !byId(saved,x.id);}),mode=data.plan_mode||"foundation";
  var diagnosticGrade=opts&&opts.diagnostic&&opts.diagnostic.measurements&&opts.diagnostic.measurements.recall&&opts.diagnostic.measurements.recall.internal_grade;
  var diagnosticMetric=diagnosticGrade&&typeof diagnosticGrade.provisional_percent==="number"?
    "<p role='status'>"+t("تقييم الاسترجاع الحر في التشخيص — نسبة آلية مبدئية: ","Diagnostic free recall — preliminary internal score: ")+esc(diagnosticGrade.provisional_percent)+"%</p>":"";
  var reason=(lang==="en"?data.reason_en:data.reason_ar)||"";
  var summary="<section class='stage'><div class='taskCard'><span class='kicker'>"+t("حساب الطالب • المستوى الأول • نظرية الحق","Student account • Level 1 • Theory of Rights")+"</span>"+
   "<h2>"+t("بداية الشخصية القانونية","Beginning of legal personality")+"</h2><p>"+esc(reason)+"</p>"+diagnosticMetric+
   "<p role='status'>"+t("تم حفظ ","Saved ")+completed+" / "+data.tasks.length+t(" مهام على الخادم"," tasks on the server")+"</p>"+
   "<p>"+t("ترتيب المهام متكيف مع التشخيص. التصحيح الداخلي أولي، ويمكن الحصول على تصحيح دلالي تفصيلي بعد موافقتك.","Tasks adapt to the diagnostic. Internal grading is provisional; detailed semantic feedback is available with your consent.")+"</p>"+
   (!consented?"<p>"+t("باختيار الموافقة، يُرسل نص إجابتك إلى مزود ذكاء اصطناعي خارجي بغرض التصحيح التدريبي فقط.","If you consent, your written answer is sent to an external AI provider for practice assessment only.")+"</p><button type='button' id='levelOneConsent'>"+t("أوافق على التصحيح باستخدام الذكاء الاصطناعي","I agree to AI-assisted grading")+"</button>":"")+
   (gradingMessage?"<p role='status'>"+esc(gradingMessage)+"</p>":"")+"</div></section>";
  var previousResults=data.tasks.filter(function(x){return !!byId(saved,x.id);}).map(function(x){
   var entry=byId(saved,x.id),pending=!confirmedAi(entry)&&entry.evaluation?.status!=="nonanswer_zero";
   return "<section class='taskCard' style='margin:1rem 0'><h3>"+esc(lang==="en"?x.title_en:x.title_ar)+"</h3>"+
    feedbackHtml(entry,lang)+(pending&&consented?"<button type='button' data-level-grade='"+esc(x.id)+"' "+(gradingBusy?"disabled":"")+">"+
    t("تصحيح الإجابة بالذكاء الاصطناعي","Assess this answer with AI")+"</button>":"")+"</section>";
  }).join("");
  if(!next){
   host.innerHTML=summary+previousResults+"<section class='stage'><div class='taskCard'><span class='kicker'>"+t("اكتملت التمارين الثلاثة","All three tasks submitted")+"</span><h2>"+t("تم حفظ تدريب المستوى الأول","Level-one practice saved")+"</h2><p>"+t("كل الإجابات محفوظة، وبانتظار مراجعتها. لا يُفتح المستوى الثاني حتى يتحقق اعتماد التقدم من الخادم.","All answers are saved and pending review. Level two stays locked until server-verified completion.")+"</p><a class='secondary' href='"+(lang==="en"?"student-en":"student")+".html'>"+t("العودة إلى حساب الطالب","Back to student account")+"</a></div></section>";
   wireReviewActions();return;
  }
  var n=completed+1,dim=next.dimension;
  var q=lang==="en"?next.prompt_en:next.prompt_ar;
  if(!q||q.length<15){
   host.innerHTML="<p role='alert'>"+t("المهمة غير مترجمة أو غير مكتملة.","The lesson question is not available in this language.")+"</p>";return;
  }
  host.innerHTML=summary+previousResults+"<section class='stage'><div class='taskCard'><span class='kicker'>"+t("المهمة ","Task ")+n+" / 3</span>"+
   "<h2>"+esc(lang==="en"?next.title_en:next.title_ar)+"</h2><p>"+esc(adaptiveHint(lang,mode,dim))+"</p>"+
   "<div class='legalBox' style='white-space:pre-line'>"+esc(q)+"</div>"+
   "<label for='officialEssayAnswer'>"+t("إجابتك القانونية","Your legal answer")+"</label>"+
   "<textarea id='officialEssayAnswer' class='textarea' rows='8' maxlength='12000' placeholder='"+t("اكتب إجابتك بأسلوبك…","Write in your own words…")+"' aria-label='"+t("إجابة قانونية حرة","Free legal answer")+"'></textarea>"+
   "<div class='choiceRow'><button type='button' id='officialSaveAnswer' class='primary'>"+t("حفظ الإجابة والانتقال","Save answer and continue")+"</button></div>"+
   "<p id='officialSaveMessage' role='alert'></p></div></section>";
  wireReviewActions();
  var button=host.querySelector("#officialSaveAnswer");
  button.onclick=async function(){
   var v=host.querySelector("#officialEssayAnswer").value.trim();
   if(v.length<4){host.querySelector("#officialSaveMessage").textContent=t("اكتب إجابة مكونة من أربع حروف على الأقل.","Write at least four characters.");return;}
   button.disabled=true;
   try{
    var reply=await cloud.studentLifecycleRpc("submitLevelOne",{courseId:COURSE_ID,itemId:next.id,answer:v});
    if(!reply||!reply.allowed||!Array.isArray(reply.saved)||!byId(reply.saved,next.id))throw Error("level_one_answer_not_confirmed");
    var readback=await cloud.studentLifecycleRpc("firstLevel",{courseId:COURSE_ID});
    if(!readback||!readback.allowed||!Array.isArray(readback.saved)||!byId(readback.saved,next.id))throw Error("level_one_readback_failed");
    lastFeedback=byId(readback.saved,next.id);data=readback;render();
    if(consented)await gradeSaved(next.id);
   }catch(e){
    var msg=host.querySelector("#officialSaveMessage");if(msg)msg.textContent=t("لم يتم تأكيد الحفظ: ","Save not confirmed: ")+String(e&&e.message||e);
    button.disabled=false;
   }
  };
 }
 render();
}
root.LEX_OFFICIAL_LEVEL_ONE={mount:mount};
if(typeof module!=="undefined"&&module.exports)module.exports={mount:mount};
})(typeof window!=="undefined"?window:globalThis);
