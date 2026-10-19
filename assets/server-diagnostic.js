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

function report(status,uid){
 var d=status&&status.result||{},metrics=d.metrics||{},measurements=d.measurements||{};
 if(status.status!=="completed"||d.source!=="server_finalized_diagnostic"||d.student_id!==uid)throw Error("unverified_diagnostic_report");
 function numberOrNot(v){return typeof v==="number"&&Number.isFinite(v)?Math.max(0,Math.min(100,Math.round(v)))+"%":tr("لم يُقَس","Not measured");}
 var rec=measurements.recall||{},internal=rec.internal_grade||{},p=status.training_plan||{};
 var free=typeof internal.provisional_percent==="number"&&Number.isFinite(internal.provisional_percent)?numberOrNot(internal.provisional_percent):tr("بانتظار تقييم كافٍ أو مراجعة","Not enough evidence / awaiting review");
 var reasons={"recall-led":tr("نبدأ بتقوية الفهم والتحليل.","Focus first on explanation and understanding."),
   "understanding-led":tr("نبدأ بتقوية الاسترجاع من الذاكرة.","Start with unaided retrieval practice."),
   "balanced":tr("نبدأ بالتطبيق مع الحفاظ على توازن المهارات.","Begin with application and balanced practice."),
   "foundation":tr("نبدأ من تأسيس القاعدة قبل رفع الصعوبة.","Begin with supported foundations.")};
 var mode=p.mode||"foundation";
 var tiles=[
   [tr("التعرّف على القاعدة","Rule recognition"),metrics.recognition],
   [tr("الفهم","Understanding"),metrics.understanding],
   [tr("التطبيق","Application"),metrics.application]
 ].map(function(x){return "<div class='resultMetric' style='background:#F9F4EF;border-radius:12px;padding:1rem;min-width:130px;flex:1'><small>"+esc(x[0])+"</small><div style='font-weight:800;font-size:1.65rem'>"+esc(numberOrNot(x[1]))+"</div></div>";}).join("");
 return "<section class='diagnosticReport' role='region' aria-label='"+tr("نتيجة التشخيص","Diagnostic results")+"'>"+
 "<h2>"+tr("نتيجة تقييمك التشخيصي","Your diagnostic result")+"</h2>"+
 "<p role='status'>"+tr("الاختبار محفوظ ومؤكد على الخادم. تستطيع الرجوع لهذه الصفحة لرؤية نتيجتك.","Your assessment was saved and verified on the server. Return here to see your result.")+"</p>"+
 "<div style='display:flex;flex-wrap:wrap;gap:.75rem'>"+tiles+"</div>"+
 "<div class='resultMetric' style='margin:1rem 0;padding:1rem;border:1px solid #e5d9dc;border-radius:12px'><b>"+tr("الإجابة الحرة — التقييم الداخلي المبدئي","Free answer — provisional internal evaluation")+": "+esc(free)+"</b>"+
 "<p>"+tr("هذه نسبة آلية مبدئية لتغطية عناصر القاعدة القانونية؛ ليست درجة جامعية نهائية، وليست تصحيحًا دلاليًا بنموذج لغوي.","This is preliminary rule-coverage analysis, not a final university mark or LLM-based semantic grading.")+"</p>"+
 (Array.isArray(internal.criteria_met)&&internal.criteria_met.length?"<p>"+tr("عناصر التقطها المحرك","Detected elements")+": "+esc(internal.criteria_met.join("، "))+"</p>":"")+
 (Array.isArray(internal.criteria_missing)&&internal.criteria_missing.length?"<p>"+tr("عناصر راجعها","Review these elements")+": "+esc(internal.criteria_missing.join("، "))+"</p>":"")+
 "</div>"+
 "<h2>"+tr("خطة تدريبك المتكيفة","Your adaptive practice plan")+"</h2>"+
 "<p>"+esc((lang()==="en"?p.reason_en:p.reason_ar)||reasons[mode]||reasons.foundation)+"</p>"+
 "<p>"+tr("الترتيب المبدئي: ","Initial order: ")+esc(Array.isArray(p.firstTasks)?p.firstTasks.join(" ← "):"foundation")+"</p>"+
 "<div class='actions'><a class='actionCard' style='display:inline-block;background:#111D31;color:white;padding:1rem 1.3rem;border-radius:10px;text-decoration:none' href='"+program()+"'>"+tr("ابدأ المستوى الأول المتكيف","Start your adaptive first level")+"</a></div>"+
 "<p><a href='"+portal()+"'>"+tr("العودة لحساب الطالب","Back to student account")+"</a></p></section>";
}

async function startUI(){
 var area=root.document.getElementById("officialDiagnostic");if(!area)return;
 var cloud=root.LEX_CLOUD;
 function render(html){area.innerHTML=html;}
 function fail(err){
  var msg=String(err&&err.message||err);
  if(/diagnostic_academic_approval_pending/i.test(msg)){
   render("<p role='status'>"+tr("أسئلة التشخيص الرسمية تنتظر مراجعة واعتمادًا قانونيًا وأكاديميًا مستقلًا. يمكنك الآن تجربة تقييم تدريبي متكيف داخل حسابك، ولن يُحتسب ضمن نتائجك الرسمية.","The official questions await independent review. You can now start a signed-in adaptive rehearsal, separate from official records.")+"</p><p><a class='practice-start' href='student-practice.html?lang="+lang()+"'>"+tr("ابدأ التقييم التدريبي التكيفي الآن","Start adaptive student practice now")+"</a></p><a href='"+portal()+"'>"+tr("حساب الطالب","Student portal")+"</a>");return;
  }
  render("<p role='alert'>"+tr("تعذّر تأكيد حالة التشخيص بالخادم. لا توجد نتيجة محفوظة مؤكدة. ","Unable to confirm the server diagnostic state. No result can be assumed. ")+esc(msg)+"</p><a href='"+portal()+"'>"+tr("حساب الطالب","Student portal")+"</a>");
 }
 render("<p role='status'>"+tr("جارٍ التحقق من حالة الطالب على الخادم…","Checking your server-side student status…")+"</p>");
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
  if(status.status==="completed"){render(report(status,student));return;}
  if(!await D.academicItemsApproved(cloud))throw new Error("diagnostic_academic_approval_pending");
  if(status.status==="not_started"){
   render("<p>"+tr("سيُحفظ كل سؤال على الخادم. تحلل الإجابة الحرة داخليًا إلى نسبة مبدئية إذا توفرت أدلة كافية، وإلا تظهر غير مكتملة دون صفر وهمي.","Each answer is saved on the server. Free text gets a provisional internal percentage when assessable; otherwise it stays ungraded, never a fabricated zero.")+"</p>"+
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
  if(status.status==="completed"){render(report(status,student));return;}
  var answers=Array.isArray(status.draft)?status.draft.slice():[];
  if(answers.length>Q.length){fail(new Error("invalid_server_draft"));return;}
  if(answers.some(function(x,i){return !Q[i]||x.question_id!==Q[i].id;})){fail(new Error("inconsistent_server_draft"));return;}
  var idx=answers.length, saving=false;
  function page(){
   var done=idx===Q.length,q=Q[idx],progress=Math.round(100*idx/(Q.length+1));
   var html="<div role='status'>"+tr("التشخيص الرسمي","Official diagnostic")+" · "+(idx+1)+" / "+(Q.length+1)+" · "+progress+"%</div>";
   if(!done){
    html+="<h2>"+esc(q[lang()])+"</h2><fieldset><legend>"+tr("اختر إجابتك أو «لا أدري»","Choose your answer or Not sure")+"</legend>"+
      q[lang()+"Options"].map(function(o,j){return "<label class='choice'><input name='selected' type='radio' value='"+j+"'>"+esc(o)+"</label>";}).join("")+
      "<label class='choice'><input name='selected' type='radio' value='-1'>"+tr("لا أدري (لم يُقَس)","Not sure (not measured)")+"</label></fieldset>";
   }else{
    html+="<h2>"+tr("استرجاع حر (اختياري، للمراجعة البشرية)","Free recall (optional; pending human review)")+"</h2>"+
      "<textarea id='ungradedText' rows='5' maxlength='2000' aria-label='"+tr("إجابة حرة","Free answer")+"'></textarea>";
   }
   html+="<button id='serverNext'>"+(done?tr("حفظ واعتماد نتيجة التشخيص على الخادم","Save diagnostic on server"):tr("حفظ والانتقال للسؤال التالي","Save and continue"))+"</button>"+
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
      var reply=await cloud.studentLifecycleRpc("complete",{courseId:COURSE_ID,answers:answers,freeText:root.document.getElementById("ungradedText").value||""});
      if(reply.status!=="completed"||!reply.result||reply.result.source!=="server_finalized_diagnostic"||reply.result.student_id!==student||!reply.training_plan)throw new Error("completion_not_confirmed");
      // Give the optional free recall an internally generated preliminary percentage;
      // if interpretation is inconclusive, preserve pending review rather than invent success.
      if((root.document.getElementById("ungradedText")&&root.document.getElementById("ungradedText").value||"").trim()){
       try{await cloud.studentLifecycleRpc("reviewDiagnostic",{courseId:COURSE_ID});}
       catch(e){if(root.console&&root.console.warn)root.console.warn("Provisional diagnostic review pending:",String(e&&e.message||e));}
      }
      var check=await cloud.studentLifecycleRpc("status",{courseId:COURSE_ID});
      if(check.status!=="completed"||check.attempt_id!==reply.attempt_id)throw new Error("completion_readback_failed");
      saving=false;render(report(check,student));
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
