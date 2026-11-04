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
 err.textContent=seconds?"محاولات دخول كثيرة الآن. انتظر {seconds} ثانية ثم حاول مرة أخرى.".replace("{seconds}",String(seconds)):"يمكنك محاولة تسجيل الدخول الآن.";
 err.style.display="block";syncBusy();
 if(seconds)cooldownTimer=setTimeout(showCooldown,1000);
}
function isRateLimited(e){return Number(e&&e.status)===429||/^(over_request_rate_limit|too_many_requests|rate_limit_exceeded)$/.test(String(e&&e.code||""));}
if(params.get('reason')==='session'){err.textContent="انتهت جلسة الدخول. سجّل الدخول من جديد.";err.style.display='block';}
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
      location.href="student.html";return;
    }catch(e){
      if(isRateLimited(e)){
        cooldownUntil=Date.now()+Math.max(15,Math.min(120,Number(e.retryAfter)||30))*1000;
        showCooldown();return;
      }
      err.textContent=e&&e.message==="student_pending_approval"?"تم تسجيل طلبك، والحساب في انتظار موافقة المشرف.":e&&e.message==="student_account_not_active"?"الحساب موقوف أو معطّل؛ تواصل مع إدارة LexLearn.":"تعذر الدخول. تحقق من البريد أو اسم المستخدم وكلمة المرور.";
      err.style.display="block";return;
    }
  }
  err.textContent="تعذر تسجيل الدخول السحابي؛ لا يُسمح بدخول حساب تجريبي محلي.";err.style.display="block";return;
  }finally{busy=false;syncBusy();}
}
document.getElementById("studentLogin").addEventListener("submit",function(e){
  e.preventDefault();return login(document.getElementById("studentUser").value.trim(),document.getElementById("studentPassword").value);
});
var demoButton=document.getElementById("demoStudent");
if(demoButton)demoButton.onclick=function(){location.href="showcase.html";};
})();
