(function(){
"use strict";
var node=document.getElementById("researchPilotOffer");
if(!node)return;
var cloud=window.LEX_CLOUD;
(async function(){
 try{
  if(!cloud||!cloud.db())return;
  var u=await cloud.db().auth.getUser();
  if(u.error||!u.data||!u.data.user)return;
  var r=await cloud.db().functions.invoke("lexlearn-research-single-student",{body:{action:"eligibility"}});
  if(r.error||!r.data||r.data.eligible!==true||r.data.non_credit!==true)return;
  node.innerHTML="<h2>مسار تجريبي إضافي: تعلم القانون بطرق بحثية</h2>"+
   "<p>تدريب اختياري قصير بأسئلة متغيرة حسب إجاباتك، ثم مراجعة بعد يومين وأخرى بعد أسبوعين. لا يؤثر على درجتك أو تدريبك الرسمي.</p>"+
   "<a href='student-research-pilot.html'>فتح التدريب التجريبي</a>";
  node.hidden=false;
 }catch(_){node.hidden=true;}
})();
})();