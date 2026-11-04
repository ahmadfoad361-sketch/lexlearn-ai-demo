(function(){
"use strict";
var KEY="lexlearn_students_v2",SESSION="lexlearn_student_session";
var params=new URLSearchParams(location.search),ENTRY_COUNTRY=(params.get("country")||"").toLowerCase();
var err=document.getElementById("studentError");
var form=document.getElementById("studentLogin"),busy=false,cooldownUntil=0,cooldownTimer=null;
var submitButton=form.querySelector('button[type="submit"]');
function syncBusy(){if(submitButton)submitButton.disabled=busy||Date.now()<cooldownUntil;form.setAttribute("aria-busy",busy?"true":"false");}
function showCooldown(){
 if(cooldownTimer)clearTimeout(cooldownTimer);
 var seconds=Math.max(0,Math.ceil((cooldownUntil-Date.now())/1000));
 err.textContent=seconds?"There are many sign-in attempts right now. Wait {seconds} seconds, then try again.".replace("{seconds}",String(seconds)):"You can try signing in now.";
 err.style.display="block";syncBusy();
 if(seconds)cooldownTimer=setTimeout(showCooldown,1000);
}
function isRateLimited(e){return Number(e&&e.status)===429||/^(over_request_rate_limit|too_many_requests|rate_limit_exceeded)$/.test(String(e&&e.code||""));}
if(params.get('reason')==='session'){err.textContent="Your session has ended. Please sign in again.";err.style.display='block';}
try{var lastUsername=localStorage.getItem("lexlearn_last_student_username");if(lastUsername)document.getElementById("studentUser").value=lastUsername;}catch(_){}
async function login(u,p){
  if(busy)return;
  if(Date.now()<cooldownUntil){showCooldown();return;}
  busy=true;syncBusy();
  try{
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
      if(isRateLimited(e)){
        cooldownUntil=Date.now()+Math.max(15,Math.min(120,Number(e.retryAfter)||30))*1000;
        showCooldown();return;
      }
      err.textContent=e&&e.message==="student_pending_approval"?"Registration received; your account is awaiting supervisor approval.":e&&e.message==="student_account_not_active"?"This account is paused or disabled; contact LexLearn support.":"Sign-in failed. Check your email or username and password.";
      err.style.display="block";return;
    }
  }
  err.textContent="Student cloud sign-in is temporarily unavailable. No local demo account can log in.";err.style.display="block";return;
  }finally{busy=false;syncBusy();}
}
document.getElementById("studentLogin").addEventListener("submit",function(e){
  e.preventDefault();return login(document.getElementById("studentUser").value.trim(),document.getElementById("studentPassword").value);
});
var demoButton=document.getElementById("demoStudent");
if(demoButton)demoButton.onclick=function(){location.href="showcase-en.html";};
})();
