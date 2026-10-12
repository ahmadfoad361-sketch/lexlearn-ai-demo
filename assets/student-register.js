(function(){
"use strict";
var ar=document.documentElement.lang==="ar";
var form=document.getElementById("registerForm"),status=document.getElementById("status"),btn=document.getElementById("registerBtn");
function say(a,b){return ar?a:b;}
function show(message,error){status.textContent=message;status.className=error?"error":"ok";}
form.addEventListener("submit",async function(ev){
 ev.preventDefault();
 var name=document.getElementById("fullName").value.trim(),
     email=document.getElementById("email").value.trim().toLowerCase(),
     password=document.getElementById("password").value,
     uni=document.getElementById("university").value.trim(),
     year=document.getElementById("year").value,
     country=document.getElementById("country").value;
 if(!name||!email||!uni||!year||!country||password.length<10){show(say("أكمل البيانات المطلوبة، واستخدم كلمة مرور لا تقل عن 10 أحرف.","Complete required fields and use a password of at least 10 characters."),true);return;}
 if(!document.getElementById("consent").checked){show(say("اقرأ سياسة الخصوصية وشروط الاستخدام ووافق عليهما لإكمال الطلب.","Please review and accept the privacy policy and terms to continue."),true);return;}
 if(!window.LEX_CLOUD||!LEX_CLOUD.isConfigured()){show(say("خدمة تسجيل الطلاب غير متاحة حاليًا.","Student registration service is currently unavailable."),true);return;}
 btn.disabled=true;show(say("جارٍ إرسال طلب التسجيل...","Submitting registration request..."),false);
 try{
  var db=LEX_CLOUD.db();
  var result=await db.auth.signUp({
   email:email,password:password,
   options:{data:{display_name:name,university:uni,year_label:year,country_code:country,registration_channel:"self",privacy_notice_version:"2026-10-06-v1"}}
  });
  if(result.error)throw result.error;
  if(result.data&&result.data.session)await db.auth.signOut();
  form.reset();
  show(say("تم إرسال طلب التسجيل. راجع بريدك لتأكيده إذا وصلت رسالة، ثم انتظر اعتماد المشرف قبل الدخول إلى التدريب.","Registration request submitted. Verify your email if prompted, then wait for supervisor approval before accessing training."),false);
 }catch(e){
  show(say("تعذر إرسال الطلب. تحقق من البريد والاتصال أو حاول لاحقًا.","Unable to submit registration. Check your email and connection or try again later."),true);
 }finally{btn.disabled=false;}
});
})();