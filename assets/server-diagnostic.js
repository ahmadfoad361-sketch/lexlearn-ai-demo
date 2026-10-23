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
 var d=status&&status.result||{};
 if(status.status!=="completed"||d.source!=="server_finalized_diagnostic"||d.student_id!==uid)
  throw Error("unverified_diagnostic_report");
 var rec=d.measurements&&d.measurements.recall||{},
  ai=rec.ai_grade||{},corrected=rec.corrected_internal_grade||{},internal=rec.internal_grade||{};
 function score(value){return typeof value==="number"&&Number.isFinite(value)&&value>=0&&value<=100?Math.round(value):null;}
 // Academic estimate, not a validated memory-capacity measure:
 // 1. successfully saved semantic AI weighted criterion coverage;
 // 2. the corrected three-criterion server rubric, including legacy correction;
 // 3. only a new internal grade that explicitly covers all three criteria.
 var memory=null,origin="";
 if(ai.status==="preliminary_ai"&&score(ai.provisional_percent)!==null){
  memory=score(ai.provisional_percent);origin="openai";
 }else if(corrected.status==="preliminary_internal"&&score(corrected.provisional_percent)!==null){
  memory=score(corrected.provisional_percent);origin="internal";
 }else if(internal.status==="preliminary_internal"&&score(internal.provisional_percent)!==null){
  var names=(Array.isArray(internal.criteria_met)?internal.criteria_met:[])
    .concat(Array.isArray(internal.criteria_missing)?internal.criteria_missing:[]);
  if(["live_birth","death_end","prenatal_conditional_rights"].every(function(c){return names.indexOf(c)>=0;})){
   memory=score(internal.provisional_percent);origin="internal";
  }
 }
 var understanding=score(d.metrics&&d.metrics.understanding);
 // The outcome screen has exactly two skill indicators; the training link is navigation.
 function metric(name,value,id,description){
  var shown=value===null?tr("لم يتوفر تقدير بعد","Estimate not available"):value+"%";
  return "<article class='diagScoreCard' data-score='"+id+"' aria-label='"+esc(name)+"'>"+
   "<div class='diagScoreLabel'>"+esc(name)+"</div>"+
   "<div class='diagScoreValue' data-score-value='"+id+"'>"+esc(shown)+"</div>"+
   "<div class='diagScoreTrack' aria-hidden='true'><span style='width:"+(value===null?0:value)+"%'></span></div>"+
   "<small>"+esc(description)+"</small></article>";
 }
 return "<section class='diagnosticReport diagnosticTwoScores' role='region' aria-label='"+tr("نتيجة التشخيص","Diagnostic results")+"'>"+
  "<h2>"+tr("نتيجة الاختبار التشخيصي","Your diagnostic result")+"</h2>"+
  "<div class='diagScoresGrid'>"+
  metric(tr("تقدير الحفظ","Estimated recall"),memory,"recall",
    origin==="openai"?tr("تقدير أولي من تحليل الإجابة الحرة","Preliminary assessment of your free answer"):
    origin==="internal"?tr("تقدير أولي لتغطية عناصر القاعدة","Preliminary legal-rule coverage"):
    tr("الإجابة الحرة لم تُقيّم بدرجة موثوقة","No reliable free-answer estimate"))+
  metric(tr("تقدير الفهم","Estimated understanding"),understanding,"understanding",
    understanding===null?tr("لم تتوفر إجابات فهم كافية","Insufficient understanding responses"):
    tr("تقدير أولي من أسئلة الفهم","Preliminary result from understanding questions"))+
  "</div>"+
  "<p class='diagScoreDisclaimer'>"+tr("هذه تقديرات مبدئية للتدريب، وليست درجات جامعية أو قياسًا نهائيًا لمهاراتك.","These are preliminary practice estimates, not official grades or validated mastery measures.")+"</p>"+
  "<div class='actions'><a class='actionCard' style='display:inline-block;background:#111D31;color:white;padding:1rem 1.3rem;border-radius:10px;text-decoration:none' href='student-path.html?lang="+lang()+"'>"+
  tr("ابدأ التدريب","Start training")+"</a></div></section>";
}

async function startUI(){
 var area=root.document.getElementById("officialDiagnostic");if(!area)return;
 var cloud=root.LEX_CLOUD;
 function render(html){area.innerHTML=html;}
 async function showCompleted(status){
  render(report(status,student));
 }
 function fail(err){
  if(root.console&&root.console.warn)root.console.warn("LexLearn diagnostic unavailable:",String(err&&err.message||err));
  render("<p role='alert'>"+tr("تعذّر فتح الاختبار أو تأكيد حفظه. بياناتك المحفوظة لم تُحذف. حاول إعادة فتح الصفحة، وإذا استمرت المشكلة تواصل مع المشرف.","Unable to open or confirm this assessment. Your saved work has not been deleted. Reload or contact the supervisor.")+
   "</p><a href='"+portal()+"'>"+tr("حساب الطالب","Student account")+"</a>");
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
    }catch(e){error.textContent=tr("تعذّر حفظ هذه الخطوة. إجابتك ما زالت موجودة؛ حاول مرة أخرى، وإذا استمرت المشكلة تواصل مع المشرف.","Could not save this step. Your answer is still here; retry or contact the supervisor.");saving=false;var btn=root.document.getElementById("serverNext");if(btn)btn.disabled=false;}
   };
  }
  page();
 }
}
root.LEX_SERVER_DIAGNOSTIC={mount:startUI};
if(typeof module!=="undefined"&&module.exports)module.exports={mount:startUI};
})(typeof window!=="undefined"?window:globalThis);
