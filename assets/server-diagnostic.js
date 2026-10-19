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
async function startUI(){
 var area=root.document.getElementById("officialDiagnostic");if(!area)return;
 var cloud=root.LEX_CLOUD;
 function render(html){area.innerHTML=html;}
 function fail(err){
  var msg=String(err&&err.message||err);
  if(/diagnostic_academic_approval_pending/i.test(msg)){
   render("<p role='status'>"+tr("أسئلة التشخيص تنتظر مراجعة قانونية وأكاديمية. لا يُسمح بعرضها قبل اعتمادها. الديمو العام متاح بصورة منفصلة.","Official diagnostic questions await legal and academic review. The public demo is separate and remains available.")+"</p><a href='"+portal()+"'>"+tr("حساب الطالب","Student portal")+"</a>");return;
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
  if(status.status==="completed"){root.location.replace(program());return;}
  if(!await D.academicItemsApproved(cloud))throw new Error("diagnostic_academic_approval_pending");
  if(status.status==="not_started"){
   render("<p>"+tr("سيُحفظ كل سؤال على الخادم. لن تُحسب المهارة غير المقاسة صفرًا، ولن تُمنح الإجابة الحرة درجة دلالية آلية.","Each answer is saved on the server. Unmeasured skills are not zero and free text is not graded automatically.")+"</p>"+
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
  if(status.status==="completed"){root.location.replace(program());return;}
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
      var check=await cloud.studentLifecycleRpc("status",{courseId:COURSE_ID});
      if(check.status!=="completed"||check.attempt_id!==reply.attempt_id)throw new Error("completion_readback_failed");
      root.location.replace(program());
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
