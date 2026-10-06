(function(){
"use strict";
var SESSION_KEY="lexlearn_admin_session";
var form=document.getElementById("adminLogin"),err=document.getElementById("adminError");
async function login(email,password){
  err.style.display="none";
  if(window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()){
    try{
      var cloud=await LEX_CLOUD.signInAdmin(email,password),pr=cloud.profile;
      localStorage.setItem(SESSION_KEY,JSON.stringify({
        adminId:pr.id,name:pr.display_name||pr.username,role:pr.role,cloud:true,at:Date.now()
      }));
      location.href="admin.html";return;
    }catch(e){
      err.textContent="بيانات الدخول غير صحيحة أو الحساب لا يملك صلاحية الإدارة.";
      err.style.display="block";return;
    }
  }
  var local=null;
  try{local=JSON.parse(localStorage.getItem("lexlearn_admin_v2")||"null");}catch(e){}
  if(local&&local.active&&String(email).toLowerCase()===String(local.email||"").toLowerCase()&&password===local.password){
    localStorage.setItem(SESSION_KEY,JSON.stringify({adminId:local.id,name:local.name,role:"admin",cloud:false,at:Date.now()}));
    location.href="admin.html";return;
  }
  err.textContent="بيانات الدخول غير صحيحة.";
  err.style.display="block";
}
form.addEventListener("submit",function(e){
  e.preventDefault();
  login(document.getElementById("adminEmail").value.trim(),document.getElementById("adminPassword").value);
});
var forgot=document.getElementById("forgotAdminPassword");
if(forgot)forgot.onclick=async function(){
  var email=document.getElementById("adminEmail").value.trim();
  if(!email){err.textContent="اكتب البريد الإلكتروني أولًا.";err.style.display="block";return;}
  try{
    await LEX_CLOUD.requestPasswordReset(email,location.origin+location.pathname.replace("admin-login.html","reset-password.html"));
    err.textContent="تم إرسال رابط استعادة جديد إلى بريدك. افتح أحدث رسالة فقط.";
    err.style.display="block";
  }catch(e){err.textContent="تعذر إرسال رابط الاستعادة الآن.";err.style.display="block";}
};
var demo=document.getElementById("demoAdmin");
if(demo&&window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured())demo.style.display="none";
if(demo)demo.onclick=function(){
  if(window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()){
    err.textContent="حساب الإدارة التجريبي المحلي غير متاح في وضع الإنتاج.";
  }else{
    err.textContent="استخدم حساب الإدارة المحلي الموجود على هذا الجهاز.";
  }
  err.style.display="block";
};
})();