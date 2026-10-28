(function(){
"use strict";
var cardUsername=new URLSearchParams(location.hash.slice(1)).get("username");
if(cardUsername){var field=document.getElementById("studentUser");if(field)field.value=cardUsername;history.replaceState(null,"",location.pathname+location.search);}

var KEY="lexlearn_students_v2",SESSION="lexlearn_student_session";
var params=new URLSearchParams(location.search),ENTRY_COUNTRY=(params.get("country")||"").toLowerCase();
var err=document.getElementById("studentError");
try{var lastUsername=localStorage.getItem("lexlearn_last_student_username");if(lastUsername&&!cardUsername)document.getElementById("studentUser").value=lastUsername;}catch(_){}
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
      location.href="student.html";return;
    }catch(e){
      err.textContent=e&&/^student_access_/.test(e.message)?"التدريب متاح بعد الاعتماد وخلال مدة التجربة. راجع المشرف بشأن حالة حسابك.":e&&(/student_pending_approval|student_access_pending/.test(e.message))?"تم تسجيل طلبك، والحساب في انتظار موافقة المشرف.":e&&e.message==="student_account_not_active"?"الحساب موقوف أو معطّل؛ تواصل مع إدارة LexLearn.":"تعذر الدخول. تحقق من البريد أو اسم المستخدم وكلمة المرور.";
      err.style.display="block";return;
    }
  }
  err.textContent="تعذر تسجيل الدخول السحابي؛ لا يُسمح بدخول حساب تجريبي محلي.";err.style.display="block";return;
}
document.getElementById("studentLogin").addEventListener("submit",function(e){
  e.preventDefault();login(document.getElementById("studentUser").value.trim(),document.getElementById("studentPassword").value);
});
var demoButton=document.getElementById("demoStudent");
if(demoButton)demoButton.onclick=function(){location.href="showcase.html";};
})();