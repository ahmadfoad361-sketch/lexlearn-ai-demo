(function(){
"use strict";
var KEY="lexlearn_students_v2",SESSION="lexlearn_student_session";
var params=new URLSearchParams(location.search),ENTRY_COUNTRY=(params.get("country")||"").toLowerCase();
var err=document.getElementById("studentError");
try{var lastUsername=localStorage.getItem("lexlearn_last_student_username");if(lastUsername)document.getElementById("studentUser").value=lastUsername;}catch(_){}
async function login(u,p){
  err.style.display="none";
  if(window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()){
    try{
      var cloud=await LEX_CLOUD.signInStudent(u,p),pr=cloud.profile;
      var chosen=ENTRY_COUNTRY==="qa"?"qa":(pr.country_code||null);
      localStorage.setItem(SESSION,JSON.stringify({
        studentId:pr.id,name:pr.display_name,username:pr.username,
        country:chosen,cloud:true,at:Date.now()
      }));
      if(ENTRY_COUNTRY==="qa")localStorage.setItem("lexlearn_country_setup_v2_rights_"+pr.id,"true");
      location.href="student-en.html";return;
    }catch(e){
      err.textContent=e&&e.message==="student_pending_approval"?"Registration received; your account is awaiting supervisor approval.":e&&e.message==="student_account_not_active"?"This account is paused or disabled; contact LexLearn support.":"Sign-in failed. Check your email or username and password.";
      err.style.display="block";return;
    }
  }
  err.textContent="Student cloud sign-in is temporarily unavailable. No local demo account can log in.";err.style.display="block";return;
}
document.getElementById("studentLogin").addEventListener("submit",function(e){
  e.preventDefault();login(document.getElementById("studentUser").value.trim(),document.getElementById("studentPassword").value);
});
var demoButton=document.getElementById("demoStudent");
if(demoButton)demoButton.onclick=function(){location.href="showcase-en.html";};
})();