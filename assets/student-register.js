(function(){
"use strict";
var ar=document.documentElement.lang==="ar",
 form=document.getElementById("registerForm"),status=document.getElementById("status"),btn=document.getElementById("registerBtn");
function say(a,b){return ar?a:b;}
function show(message,error){status.textContent=message;status.className=error?"error":"ok";}
function phoneNumber(value){
 var x=String(value||"").trim().replace(/[\\s().-]/g,"");
 if(x.startsWith("00"))x="+"+x.slice(2);
 return /^\\+[1-9][0-9]{7,14}$/.test(x)?x:null;
}
form.addEventListener("submit",async function(ev){
 ev.preventDefault();
 var name=document.getElementById("fullName").value.trim(),
  email=document.getElementById("email").value.trim().toLowerCase(),
  whatsapp=phoneNumber(document.getElementById("whatsapp").value),
  password=document.getElementById("password").value,
  uni=document.getElementById("university").value.trim(),
  year=document.getElementById("year").value,
  country=document.getElementById("country").value;
 if(!name||!uni||!year||!country||password.length<10||password.length>72){
  show(say("أكمل البيانات المطلوبة، واستخدم كلمة مرور من 10 إلى 72 حرفًا.","Complete required fields and use a 10–72 character password."),true);return;
 }
 if(!whatsapp){show(say("أدخل رقم واتساب دوليًا صحيحًا يبدأ بمفتاح الدولة مثل +974 أو +20.","Enter a valid international WhatsApp number starting with +974, +20, etc."),true);return;}
 if(email&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){
  show(say("صيغة البريد الإلكتروني غير صحيحة. يمكنك تركه فارغًا.","The email address is not valid; you can leave it blank."),true);return;
 }
 if(!document.getElementById("consent").checked){
  show(say("راجع سياسة الخصوصية وشروط الاستخدام ووافق عليهما.","Read and accept the privacy policy and terms of use."),true);return;
 }
 if(!window.LEX_CLOUD||!LEX_CLOUD.isConfigured()){
  show(say("خدمة تسجيل الطلاب غير متاحة الآن.","Registration is currently unavailable."),true);return;
 }
 btn.disabled=true;show(say("جارٍ إرسال طلب التسجيل...","Submitting your registration..."),false);
 try{
  var db=LEX_CLOUD.db(),result;
  if(email){
    result=await db.auth.signUp({
      email:email,password:password,
      options:{data:{display_name:name,university:uni,year_label:year,country_code:country,
        whatsapp_e164:whatsapp,registration_channel:"self",
        privacy_notice_version:"2026-10-12-v3"}}
    });
    if(result.error)throw result.error;
    if(result.data&&result.data.session)await db.auth.signOut();
  }else{
    result=await db.functions.invoke("student-register-whatsapp",{body:{
      name:name,whatsapp_e164:whatsapp,password:password,university:uni,year_label:year,
      country_code:country,accepted_privacy:true
    }});
    if(result.error||!result.data||result.data.ok!==true){
      var code=result.data&&result.data.error;
      if(!code&&result.error&&result.error.context&&typeof result.error.context.json==="function"){
        try{code=(await result.error.context.json()).error;}catch(_){}
      }
      if(code==="too_many_registrations")throw new Error("rate_limit");
      if(code==="registration_not_completed")throw new Error("registration_not_completed");
      throw new Error("request_failed");
    }
  }
  form.reset();
  show(email?
    say("تم إرسال الطلب. تحقق من بريدك إذا وصلتك رسالة، ثم انتظر موافقة المشرف.","Registration submitted. Please verify your email if requested and wait for supervisor approval."):
    say("تم تسجيل طلبك بالواتساب. احتفظ بكلمة المرور، وينتظر الحساب تحقق المشرف من الرقم واعتماده قبل تسجيل الدخول.","WhatsApp registration submitted. Keep your password safe; your supervisor must verify the number and approve your account before sign-in."),false);
 }catch(e){
  show(e&&e.message==="rate_limit"?
   say("وصلت للحد المسموح لطلبات التسجيل. حاول بعد ساعة.","Registration limit reached. Try again in an hour."):
   say("تعذر إكمال الطلب. ربما الرقم مسجّل بالفعل؛ تحقق من البيانات أو تواصل مع المشرف.","We could not complete registration. This number may already be registered; check your details or contact the supervisor."),true);
 }finally{btn.disabled=false;}
});
})();