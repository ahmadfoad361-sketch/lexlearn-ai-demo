(function(){
"use strict";
const f=document.getElementById("instructorLogin"),error=document.getElementById("instructorError");
const pwField=document.getElementById("instructorPassword"),reveal=document.getElementById("showInstructorPassword");
if(reveal)reveal.onchange=()=>{pwField.type=reveal.checked?"text":"password";};
if(new URLSearchParams(location.search).get("password_updated")==="1"){
 error.textContent="تم حفظ كلمة المرور الجديدة. سجّل الدخول الآن باستخدام البريد الإلكتروني وكلمة المرور الجديدة.";
 error.setAttribute("role","status");
 document.getElementById("instructorEmail").focus();
}
f.onsubmit=async function(e){
 e.preventDefault();error.textContent="جارٍ التحقق من الحساب…";
 try{
  const c=LEX_CLOUD.db();if(!c)throw Error("service_unavailable");
  const result=await c.auth.signInWithPassword({email:document.getElementById("instructorEmail").value.trim().toLowerCase(),
   password:document.getElementById("instructorPassword").value});
  if(result.error)throw result.error;
  const me=await LEX_CLOUD.profile();
  if(!me||me.role!=="instructor"||me.active!==true){
   await LEX_CLOUD.signOut();throw Error("role_not_allowed");
  }
  location.replace("instructor.html");
 }catch(e){
  const message=String(e?.code||e?.message||"");
  error.textContent=/invalid_credentials|Invalid login credentials/i.test(message)?
   "البريد أو كلمة المرور غير مطابقين. عند إصدار كلمة جديدة، استخدم زر «نسخ كلمة المرور فقط» في لوحة المشرف، وراجع الملء التلقائي على الهاتف.":
   "تعذر الدخول. راجع الاتصال أو تواصل مع المشرف لتحديث بيانات الدخول.";
 }
};
})();