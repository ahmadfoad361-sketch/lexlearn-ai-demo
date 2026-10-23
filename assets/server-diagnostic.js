/* LexLearn authenticated server-only diagnostic UI. Public showcase has no access. */
(function(root){
"use strict";
var D=root.LEX_OFFICIAL_DIAGNOSTIC, COURSE_ID="qa-qu-lawc101-rights", Q=D&&D.QUESTIONS||[];
function lang(){return new URLSearchParams(root.location.search).get("lang")==="en"?"en":"ar";}
function tr(ar,en){return lang()==="en"?en:ar;}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&quot;"}[c];});}
function program(){return "program"+(lang()==="en"?"-en":"")+".html?country=qa&subject=rights";}
function portal(){return "student"+(lang()==="en"?"-en":"")+".html";}
function login(){return "student-login"+(lang()==="en"?"-en":"")+".html";}

function taskLabel(key){
 var labels={
  explain_rule:["شرح القاعدة بأسلوبك","Explain the rule"],change_one_fact:["تغيير واقعة واحدة","Change one fact"],supported_retrieval:["استرجاع بمساعدة","Supported recall"],
  memory_cues:["مفاتيح للذاكرة","Memory cues"],reconstruct:["إعادة بناء القاعدة","Reconstruct the rule"],delayed_retrieval:["استرجاع بعد فترة","Spaced recall"],
  supported_rule:["مراجعة القاعدة","Review the rule"],one_fact:["تطبيق على واقعة","Apply to a fact"],retrieval_check:["اختبار الاسترجاع","Recall check"],
  worked_example:["مثال محلول","Worked example"],supported_decision:["تطبيق مع إرشاد","Guided application"],unaided_check:["اختبار دون مساعدة","Unaided practice"]
 };
 return (labels[key]||labels.worked_example)[lang()==="en"?1:0];
}

function criterionLabel(key){
 var labels={live_birth:["بداية الشخصية بالولادة الحية","Personality begins with live birth"],death_end:["نهاية الشخصية بالوفاة","Personality ends at death"],prenatal_conditional_rights:["حقوق الحمل المشروطة","Conditional prenatal rights"]};
 return (labels[key]||["عنصر من القاعدة يحتاج مراجعة","Rule element to review"])[lang()==="en"?1:0];
}
function report(status,uid){
 var d=status&&status.result||{},metrics=d.metrics||{},measurements=d.measurements||{};
 if(status.status!=="completed"||d.source!=="server_finalized_diagnostic"||d.student_id!==uid)throw Error("unverified_diagnostic_report");
 function numberOrNot(v){return typeof v==="number"&&Number.isFinite(v)?Math.max(0,Math.min(100,Math.round(v)))+"%":tr("لم يُقَس","Not measured");}
 var rec=measurements.recall||{},internal=rec.internal_grade||{},ai=rec.ai_grade||{},p=status.training_plan||{};
 var aiRecall=ai.status==="preliminary_ai"&&Number.isFinite(ai.provisional_percent)?ai.provisional_percent:null;
 var corrected=rec.corrected_internal_grade||{},internalCoverage=corrected.status==="preliminary_internal"&&Number.isFinite(corrected.provisional_percent)?corrected.provisional_percent:null;
 var oldCriterion=(Array.isArray(internal.criteria_met)?internal.criteria_met:[]);
 var oldCriterionCount=oldCriterion.length;
 // Legacy internal scorer uses ONE criterion as its whole denominator: 100% is NOT memorization mastery.
 var applicationSkipped=metrics.application==null&&Array.isArray(d.answers)&&d.answers.some(function(a){return a.question_id==="q63a"&&a.selected===-1;});
 var free=oldCriterionCount?tr("تم رصد "+oldCriterionCount+" عنصر صحيح مبدئيًا","Detected "+oldCriterionCount+" provisional legal element(s)"):
   tr("لا توجد أدلة كافية لتقدير الإجابة","Insufficient evidence for grading");
 var reasons={"recall-led":tr("نبدأ بتقوية الفهم والتحليل.","Focus first on explanation and understanding."),
   "understanding-led":tr("نبدأ بتقوية الاسترجاع من الذاكرة.","Start with unaided retrieval practice."),
   "balanced":tr("نبدأ بالتطبيق مع الحفاظ على توازن المهارات.","Begin with application and balanced practice."),
   "foundation":tr("نبدأ من تأسيس القاعدة قبل رفع الصعوبة.","Begin with supported foundations.")};
 var mode=p.mode||"foundation";
 var tiles=[
   [tr("استرجاع القاعدة","Legal rule recall"),tr("مؤشر أولي قيد المراجعة","Preliminary; under review")],
   [tr("التعرّف على القاعدة","Rule recognition"),tr("تحتاج إعادة قياس","Needs repeat assessment")],
   [tr("الفهم","Understanding"),tr("تحتاج إعادة قياس","Needs repeat assessment")],
   [tr("التطبيق","Application"),applicationSkipped?tr("اختار لا أدري — سنعيد السؤال","Not sure — will reassess"):tr("تحتاج إعادة قياس","Needs repeat assessment")]
 ].map(function(x){return "<div class='resultMetric' style='background:#F9F4EF;border-radius:12px;padding:1rem;min-width:130px;flex:1'><small>"+esc(x[0])+"</small><div style='font-weight:700;font-size:1rem'>"+esc(x[1])+"</div></div>";}).join("");
 return "<section class='diagnosticReport' role='region' aria-label='"+tr("نتيجة التشخيص","Diagnostic results")+"'>"+
 "<h2>"+tr("نتيجة تقييمك التشخيصي","Your diagnostic result")+"</h2>"+
 "<p role='status'>"+tr("حُفظت نتيجتك في حسابك. يمكنك العودة إلى هذه الصفحة لمراجعتها في أي وقت.","Your result is saved to your account. Return to this page to review it at any time.")+"</p>"+
 "<div style='display:flex;flex-wrap:wrap;gap:.75rem'>"+tiles+"</div>"+
 (applicationSkipped?"<p class='diagMetricNote' role='note'>"+tr("التطبيق لم يأخذ نسبة لأن الإجابة المسجلة على سؤال التطبيق الوحيد كانت «لا أدري». هذا لا يعني 0%، وسنعيد قياس التطبيق في التدريبات.","No application percentage was calculated because the single application question was answered 'Not sure'. This is not 0%; application will be assessed again during practice.")+"</p>":"")+
 "<div class='resultMetric' style='margin:1rem 0;padding:1rem;border:1px solid #e5d9dc;border-radius:12px'><b>"+tr("الإجابة الحرة — عناصر يُنصح بمراجعتها","Free response — review checklist")+": "+esc(free)+"</b>"+
 "<p>"+((internal.provisional_percent===100&&oldCriterionCount===1)?tr("التقييم الداخلي القديم اعتمد عنصرًا واحدًا فقط؛ لم يعد يُستخدم للحكم على مستوى الحفظ.","The earlier one-element text matching is not used to determine memory ability."):
 tr("المؤشر الداخلي يفحص بعض عناصر الإجابة، ولا يُعتبر وحده قياسًا معتمدًا للحفظ أو درجة نهائية.","Internal rule matching checks some parts of the response and does not establish memorization mastery or a final grade."))+"</p>"+
 (Array.isArray(internal.criteria_met)&&internal.criteria_met.length?"<p>"+tr("عناصر ظهرت في إجابتك","Detected elements")+": "+esc(internal.criteria_met.map(criterionLabel).join(lang()==="en"?", ":"، "))+"</p>":"")+
 (Array.isArray(internal.criteria_missing)&&internal.criteria_missing.length?"<p>"+tr("عناصر راجعها","Review these elements")+": "+esc(internal.criteria_missing.map(criterionLabel).join(lang()==="en"?", ":"، "))+"</p>":"")+
 "</div>"+
 (aiRecall!==null?"<p class='diagMetricNote'>"+tr("تم تحليل الإجابة باستخدام الذكاء الاصطناعي. هذه مؤشرات تدريبية أولية وليست درجة أكاديمية.","The answer was reviewed with AI. Findings are preliminary practice indicators, not an academic mark.")+"</p>":"")+
 (aiRecall===null?"<section class='retroAiPanel' id='retroAiPanel'><h3>"+tr("تصحيح الإجابة المحفوظة باستخدام OpenAI","Grade your saved answer using OpenAI")+"</h3><p>"+tr("يمكن تقييم إجابتك الحرة المحفوظة بمساعدة الذكاء الاصطناعي دون إعادة الاختبار.","Your saved free-text answer can be reviewed with AI without repeating the assessment.")+"</p><label class='retroAiLabel' id='retroAiConsentLabel'><input id='retroAiConsent' type='checkbox'>"+tr("أوافق على إرسال نص إجابتي فقط إلى OpenAI للتقييم المبدئي، دون إرسال اسمي أو بيانات حسابي.","I consent to sending only my saved answer text to OpenAI for a preliminary assessment, without my name or account details.")+"</label><button id='retroAiGrade' type='button'>"+tr("راجع إجابتي بالذكاء الاصطناعي","Review my answer with AI")+"</button><p id='retroAiMessage' role='status' aria-live='polite'></p></section>":"")+
 "<h2>"+tr("خطة تدريبك المتكيفة","Your adaptive practice plan")+"</h2>"+
 "<p>"+esc((lang()==="en"?p.reason_en:p.reason_ar)||reasons[mode]||reasons.foundation)+"</p>"+
 "<p>"+tr("الترتيب المبدئي: ","Initial order: ")+esc(Array.isArray(p.firstTasks)&&p.firstTasks.length?p.firstTasks.map(taskLabel).join(lang()==="en"?" → ":" ← "):taskLabel("worked_example"))+"</p>"+
 "<div class='actions'><a class='actionCard' style='display:inline-block;background:#111D31;color:white;padding:1rem 1.3rem;border-radius:10px;text-decoration:none' href='student-path.html?lang="+lang()+"'>"+tr("ابدأ المستوى الأول المتكيف","Start your adaptive first level")+"</a></div>"+
 "<p><a href='"+portal()+"'>"+tr("العودة لحساب الطالب","Back to student account")+"</a></p></section>";
}

async function startUI(){
 var area=root.document.getElementById("officialDiagnostic");if(!area)return;
 var cloud=root.LEX_CLOUD;
 function render(html){area.innerHTML=html;}
 function concealAiAction(){
  var panel=root.document.getElementById("retroAiPanel");
  if(panel)panel.style.display="none";
 }
 async function showCompleted(status){
  render(report(status,student));
  var btn=root.document.getElementById("retroAiGrade");if(!btn)return;
  // One paid invocation per diagnostic: never offer a reviewed/reserved attempt again.
  try{
   var prior=cloud.getDiagnosticAiAudit&&await cloud.getDiagnosticAiAudit(status.attempt_id);
   if(prior&&["completed","reserved","review_required"].indexOf(prior.status)>=0){
    concealAiAction();return;
   }
  }catch(_){}
  var existingConsent=false;
  try{if(cloud.getConsent)existingConsent=!!await cloud.getConsent("lexlearn-ai-grading-v1","external_ai_grading");}catch(_){}
  var label=root.document.getElementById("retroAiConsentLabel");
  if(existingConsent&&label)label.style.display="none";
  btn.onclick=async function(){
   var box=root.document.getElementById("retroAiConsent"),msg=root.document.getElementById("retroAiMessage");
   if(!existingConsent&&(!box||!box.checked)){
    if(msg)msg.textContent=tr("يلزم اختيار الموافقة قبل إرسال الإجابة للتصحيح.","Choose the optional consent before submitting your answer for grading.");
    return;
   }
   btn.disabled=true;
   if(msg)msg.textContent=tr("جارٍ تقييم إجابتك…","Assessing your answer…");
   try{
    if(!existingConsent){
     await cloud.recordConsent("lexlearn-ai-grading-v1","external_ai_grading",true);
     existingConsent=true;
    }
    await cloud.gradeDiagnosticAi();
    var saved=await cloud.studentLifecycleRpc("status",{courseId:COURSE_ID});
    var recall=saved.result&&saved.result.measurements&&saved.result.measurements.recall;
    var ai=recall&&recall.ai_grade;
    if(saved.status==="completed"&&saved.result.student_id===student&&
       ai&&ai.status==="preliminary_ai"&&Number.isFinite(ai.provisional_percent)){
     await showCompleted(saved);return;
    }
   }catch(_){}
   // Provider/review details remain in server audit only, not the student UI.
   if(msg)msg.textContent="";
   concealAiAction();
  };
 }
 function fail(err){
  var msg=String(err&&err.message||err);
  if(/diagnostic_academic_approval_pending/i.test(msg)){
   render("<p role='status'>"+tr("أسئلة التشخيص الرسمية تنتظر مراجعة واعتمادًا قانونيًا وأكاديميًا مستقلًا. يمكنك الآن تجربة تقييم تدريبي متكيف داخل حسابك، ولن يُحتسب ضمن نتائجك الرسمية.","The official questions await independent review. You can now start a signed-in adaptive rehearsal, separate from official records.")+"</p><p><a class='practice-start' href='student-practice.html?lang="+lang()+"'>"+tr("ابدأ التقييم التدريبي التكيفي الآن","Start adaptive student practice now")+"</a></p><a href='"+portal()+"'>"+tr("حساب الطالب","Student portal")+"</a>");return;
  }
  render("<p role='alert'>"+tr("تعذّر تأكيد حالة التشخيص بالخادم. لا توجد نتيجة محفوظة مؤكدة. ","Unable to confirm the server diagnostic state. No result can be assumed. ")+esc(msg)+"</p><a href='"+portal()+"'>"+tr("حساب الطالب","Student portal")+"</a>");
 }
 render("<p role='status'>"+tr("جارٍ تحميل تقييمك…","Loading your assessment…")+"</p>");
 var student,studentName;
 try{
  student=await D.identity(cloud);
  var profile=await cloud.profile();studentName=profile.display_name||profile.username||student;
  var header=root.document.querySelector("header");
  if(header){
    var identity=root.document.createElement("p");identity.setAttribute("role","status");
    identity.textContent=tr("حساب الطالب: ","Student account: ")+studentName;header.appendChild(identity);
    var logout=root.document.createElement("button");logout.textContent=tr("تسجيل الخروج","Sign out");
    logout.type="button";logout.onclick=async function(){await cloud.signOut();root.location.replace(login());};header.appendChild(logout);
  }
  var status=await cloud.studentLifecycleRpc("status",{courseId:COURSE_ID});
  if(status.status==="completed"){await showCompleted(status);return;}
  if(!await D.academicItemsApproved(cloud))throw new Error("diagnostic_academic_approval_pending");
  if(status.status==="not_started"){
   render("<p>"+tr("ابدأ بتقييم قصير لتحديد نقطة انطلاقك. تُحفظ إجاباتك في حسابك، وتحصل الإجابة الحرة على تقدير مبدئي عند توفر أدلة كافية لتقييمها.","Start with a short assessment to find your starting point. Answers are saved to your account; free responses receive a preliminary estimate when there is enough evidence to assess them.")+"</p>"+
    "<button id='beginDiagnostic'>"+tr("ابدأ التشخيص الرسمي","Begin official diagnostic")+"</button><p id='startError' role='alert'></p>");
   root.document.getElementById("beginDiagnostic").onclick=async function(){
    this.disabled=true;
    try{var s=await cloud.studentLifecycleRpc("begin",{courseId:COURSE_ID});await present(s);}
    catch(e){fail(e);}
   };
  }else if(status.status==="in_progress"){await present(status);}
  else throw new Error("unknown_diagnostic_status");
 }catch(e){fail(e);}
 async function present(status){
  if(status.status==="completed"){await showCompleted(status);return;}
  var answers=Array.isArray(status.draft)?status.draft.slice():[];
  if(answers.length>Q.length){fail(new Error("invalid_server_draft"));return;}
  if(answers.some(function(x,i){return !Q[i]||x.question_id!==Q[i].id;})){fail(new Error("inconsistent_server_draft"));return;}
  var acceptedAi=false;
  try{if(cloud.getConsent)acceptedAi=!!await cloud.getConsent("lexlearn-ai-grading-v1","external_ai_grading");}catch(_){}
  var idx=answers.length, saving=false;
  function page(){
   var done=idx===Q.length,q=Q[idx],progress=Math.round(100*idx/(Q.length+1));
   var html="<div class='diagProgressHeader' role='status'><span>"+tr("السؤال ","Question ")+(idx+1)+" / "+(Q.length+1)+"</span><strong>"+progress+"%</strong></div>"+
    "<div class='diagProgressTrack' role='progressbar' aria-label='"+tr("تقدّم الاختبار","Assessment progress")+"' aria-valuemin='0' aria-valuemax='100' aria-valuenow='"+progress+"'><span class='diagProgressFill' style='width:"+progress+"%'></span></div>";
   if(!done){
    html+="<h2>"+esc(q[lang()])+"</h2><fieldset><legend>"+tr("اختر إجابتك أو «لا أدري»","Choose your answer or Not sure")+"</legend>"+
      q[lang()+"Options"].map(function(o,j){return "<label class='choice'><input name='selected' type='radio' value='"+j+"'>"+esc(o)+"</label>";}).join("")+
      "<label class='choice'><input name='selected' type='radio' value='-1'>"+tr("لا أدري (لم يُقَس)","Not sure (not measured)")+"</label></fieldset>";
   }else{
    html+="<h2>"+tr("استرجاع من الذاكرة (اختياري)","Recall from memory (optional)")+"</h2>"+
      "<p>"+tr("اكتب من ذاكرتك: متى تبدأ الشخصية القانونية للإنسان؟ عبّر عن القاعدة بأسلوبك دون الرجوع إلى النص.","From memory, when does a human being’s legal personality begin? State the rule in your own words without consulting the text.")+"</p>"+
      "<p>"+tr("ثم اذكر متى تنتهي الشخصية القانونية، وما حكم حقوق الحمل المستكن وفق المادة 40. لا تستعن بأي مصادر.","Also explain when personality ends and the status of an unborn child’s conditional rights under Article 40. Do not use outside sources.")+"</p>"+
      "<textarea id='ungradedText' rows='5' maxlength='2000' aria-label='"+tr("إجابة حرة","Free answer")+"'></textarea>"+
      (acceptedAi?"<p class='diagConsentSaved' role='note'>"+tr("موافقتك السابقة على التصحيح الخارجي محفوظة؛ لن نطلبها مرة ثانية.","Your prior external AI grading consent is saved; we won't ask again.")+"</p>":
      "<label style='display:block;margin:1rem 0;line-height:1.65'><input type='checkbox' id='aiConsent' style='margin-inline-end:.45rem'>"+tr("موافقة لمرة واحدة: أسمح بإرسال نص إجابتي الحرة فقط إلى OpenAI للتصحيح المبدئي، دون اسمي أو جامعتي. يمكنك إكمال الاختبار دون هذه الموافقة.","One-time optional consent: I authorize sending only my free-text answer to OpenAI for preliminary grading, without my name or university. I can complete the test without agreeing.")+"</label>");
   }
   html+="<button id='serverNext'>"+(done?tr("احفظ التقييم واعرض نتيجتي","Save assessment and show my result"):tr("حفظ والانتقال للسؤال التالي","Save and continue"))+"</button>"+
   "<p id='serverError' role='alert'></p>";
   render(html);
   root.document.getElementById("serverNext").onclick=async function(){
    if(saving)return;
    saving=true;this.disabled=true;
    var error=root.document.getElementById("serverError");
    try{
     if(!done){
      var sel=area.querySelector("input[name=selected]:checked");
      if(!sel){throw new Error(tr("اختر إجابة أو «لا أدري»","Choose an answer or Not sure"));}
      var next=answers.concat([{question_id:q.id,selected:Number(sel.value)}]);
      var reply=await cloud.studentLifecycleRpc("draft",{courseId:COURSE_ID,answers:next});
      if(reply.status!=="in_progress"||!Array.isArray(reply.draft)||reply.draft.length!==next.length)throw new Error("draft_not_confirmed");
      answers=reply.draft;idx=answers.length;saving=false;page();
     }else{
      var opt=root.document.getElementById("aiConsent"),aiRequested=!!(root.document.getElementById("ungradedText").value||"").trim()&&(acceptedAi||!!(opt&&opt.checked));
      if(aiRequested&&!acceptedAi){if(!cloud.recordConsent)throw new Error("ai_consent_service_unavailable");await cloud.recordConsent("lexlearn-ai-grading-v1","external_ai_grading",true);acceptedAi=true;}
      var reply=await cloud.studentLifecycleRpc("complete",{courseId:COURSE_ID,answers:answers,freeText:root.document.getElementById("ungradedText").value||""});
      if(reply.status!=="completed"||!reply.result||reply.result.source!=="server_finalized_diagnostic"||reply.result.student_id!==student||!reply.training_plan)throw new Error("completion_not_confirmed");
      // Give the optional free recall an internally generated preliminary percentage;
      // if interpretation is inconclusive, preserve pending review rather than invent success.
      if((root.document.getElementById("ungradedText")&&root.document.getElementById("ungradedText").value||"").trim()){
       try{await cloud.studentLifecycleRpc("reviewDiagnostic",{courseId:COURSE_ID});}
       catch(e){if(root.console&&root.console.warn)root.console.warn("Provisional diagnostic review pending:",String(e&&e.message||e));}
      }
      if(aiRequested){try{await cloud.gradeDiagnosticAi();}catch(_){}}
      var check=await cloud.studentLifecycleRpc("status",{courseId:COURSE_ID});
      if(check.status!=="completed"||check.attempt_id!==reply.attempt_id)throw new Error("completion_readback_failed");
      saving=false;await showCompleted(check);
     }
    }catch(e){error.textContent=tr("تعذّر تأكيد الحفظ: ","Save not confirmed: ")+String(e.message||e);saving=false;var btn=root.document.getElementById("serverNext");if(btn)btn.disabled=false;}
   };
  }
  page();
 }
}
root.LEX_SERVER_DIAGNOSTIC={mount:startUI};
if(typeof module!=="undefined"&&module.exports)module.exports={mount:startUI};
})(typeof window!=="undefined"?window:globalThis);
