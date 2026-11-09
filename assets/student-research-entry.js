(function(){
"use strict";
var offer=document.getElementById("researchPilotOffer");
if(!offer)return;
var cloud=window.LEX_CLOUD,workspace=document.getElementById("researchPilotWorkspace"),
 original=document.getElementById("studentTrainingApp"),loaded=false;
function showResearch(){
 if(!workspace||!original)return;
 original.hidden=true;workspace.hidden=false;offer.hidden=true;
 if(!loaded){loaded=true;window.LEX_RESEARCH_PILOT.mount();}
}
function showOriginal(){
 if(!workspace||!original)return;
 workspace.hidden=true;original.hidden=false;
 offer.hidden=false;
 var mode=offer.querySelector("#researchPilotSwitch");
 if(mode)mode.focus();
}
(async function(){
 try{
  if(!cloud||!cloud.db())return;
  var u=await cloud.db().auth.getUser();
  if(u.error||!u.data||!u.data.user)return;
  // A server-authenticated singleton allowlist is the only source of pilot entitlement.
  // Fail closed: if service is not published/paused/not eligible, standard training is untouched.
  var r=await cloud.db().functions.invoke("lexlearn-research-single-student",{body:{action:"eligibility"}});
  if(r.error||!r.data||r.data.eligible!==true||r.data.non_credit!==true)return;
  if(workspace&&original&&window.LEX_RESEARCH_PILOT){
   offer.innerHTML="<h2>جلساتك القانونية المعتادة</h2><p>يمكنك الرجوع لجلساتك السابقة في أي وقت، دون فقد أي إجابة أو نتيجة محفوظة.</p>"+
    "<button type='button' id='researchPilotSwitch'>العودة إلى التدريب المطوّر</button>";
   offer.hidden=true;
   var back=workspace.querySelector("#researchShowOriginal");
   if(back)back.onclick=showOriginal;
   offer.querySelector("#researchPilotSwitch").onclick=showResearch;
   showResearch();
  }else{
   // A separate safe opt-in page is also available from the account overview.
   offer.innerHTML="<h2>التدريب المطوّر — نسخة تجريبية خاصة</h2>"+
    "<p>تدريب اختياري بأسئلة تختلف وفق إجاباتك، ومراجعات مؤجلة. لا يؤثر في جلساتك الرسمية.</p>"+
    "<a href='student-research-pilot.html'>فتح التدريب التجريبي</a>";
   offer.hidden=false;
  }
 }catch(_){
  if(workspace)workspace.hidden=true;
  if(original)original.hidden=false;
  offer.hidden=true;
 }
})();
})();