(function(){
"use strict";
var ar=document.documentElement.lang==="ar",
 academic=new URLSearchParams(location.search).get("mode")==="academic",
 form=document.getElementById("registerForm"),
 status=document.getElementById("status"),
 button=document.getElementById("registerBtn"),
 receipt=document.getElementById("conferenceAccount"),
 usernameLabel=document.getElementById("createdUsername"),
 studentNameLabel=document.getElementById("createdStudentName"),
 copyButton=document.getElementById("copyUsername"),
 startButton=document.getElementById("startTraining");
function say(a,b){return ar?a:b;}
if(academic){
 var academicFields=document.getElementById("academicFields"),academicTitle=document.querySelector(".formCard h2"),academicIntro=document.querySelector(".intro p"),contactEmail=document.getElementById("email");
 academicFields.hidden=false;
 ["faculty","institutionalEmail","researchConsent"].forEach(function(id){document.getElementById(id).required=true;});
 if(contactEmail)contactEmail.closest("label").hidden=true;
 if(academicTitle)academicTitle.textContent=say("تسجيل المشاركة البحثية الجامعية","University research pilot registration");
 var formHint=document.querySelector(".formCard > p");if(formHint)formHint.textContent=say("البريد الجامعي مطلوب للمشاركة البحثية ولا يُعد موثقًا إلا بعد مراجعة المشرف. رقم القيد حسب شرط الكلية.","University email is required but is not considered verified until staff review. Student number depends on faculty policy.");
 var steps=document.querySelectorAll(".intro .steps li");if(steps&&steps.length===3){steps[0].textContent=say("1 — أدخل بيانات الانتساب والموافقة البحثية","1 — Enter affiliation and research consent");steps[1].textContent=say("2 — استلم اسم المستخدم الخاص بك","2 — Receive your username");steps[2].textContent=say("3 — انتظر اعتماد المشرف ثم ابدأ","3 — Await supervisor approval before training");}
 if(academicIntro)academicIntro.textContent=say("تُراجع بياناتك الجامعية قبل بدء المشاركة في التجربة البحثية.","Your university details will be reviewed before research participation begins.");
 var switchLanguage=document.getElementById("switchLanguage");if(switchLanguage)switchLanguage.href+="?mode=academic";
}

function show(message,error){status.textContent=message;status.className=error?"error":"ok";}
function normalizePhone(value){
 var phone=String(value||"").trim().replace(/[\s().-]/g,"");
 if(phone.startsWith("00"))phone="+"+phone.slice(2);
 return phone;
}
copyButton.addEventListener("click",async function(){
 var value=usernameLabel.textContent;
 if(!value)return;
 try{await navigator.clipboard.writeText(value);copyButton.textContent=say("تم النسخ","Copied");}
 catch(_){
  var selection=window.getSelection(),range=document.createRange();
  range.selectNodeContents(usernameLabel);selection.removeAllRanges();selection.addRange(range);
  copyButton.textContent=say("حدد الاسم وانسخه","Select and copy username");
 }
});
form.addEventListener("submit",async function(ev){
 ev.preventDefault();
 var name=document.getElementById("fullName").value.trim(),
  email=document.getElementById("email").value.trim().toLowerCase(),
  phoneInput=document.getElementById("whatsapp").value,
  whatsapp=normalizePhone(phoneInput),
  password=document.getElementById("password").value,
  university=document.getElementById("university").value.trim(),
  year=document.getElementById("year").value,
  country=document.getElementById("country").value,
  institutionalEmail=academic?document.getElementById("institutionalEmail").value.trim().toLowerCase():"",
  faculty=academic?document.getElementById("faculty").value.trim():"",
  studentNumber=academic?document.getElementById("studentNumber").value.trim():"";
 if(!name||!university||!year||!country||password.length<10||password.length>72||academic&&(!institutionalEmail||!faculty||!document.getElementById("researchConsent").checked)){
  show(say("أكمل البيانات الأساسية، وكلمة مرور من 10 إلى 72 حرفًا.","Complete your basic details and enter a password of 10–72 characters."),true);return;
 }
 if(academic&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(institutionalEmail)){show(say("يرجى كتابة بريد جامعي صحيح.","Enter a valid university email address."),true);return;}
 if(whatsapp&&!/^\+[1-9][0-9]{7,14}$/.test(whatsapp)){
  show(say("إذا كتبت الواتساب فأدخله مع مفتاح الدولة مثل +974 أو +20، أو اتركه فارغًا.","If you add WhatsApp, include the country code such as +974 or +20, or leave it blank."),true);return;
 }
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
  show(say("أدخل بريدًا صحيحًا أو اترك الحقل فارغًا.","Enter a valid email or leave the field blank."),true);return;
 }
 if(!document.getElementById("consent").checked){
  show(say("راجع سياسة الخصوصية وشروط الاستخدام ووافق عليهما.","Review and accept the privacy policy and terms."),true);return;
 }
 if(!window.LEX_CLOUD||!LEX_CLOUD.isConfigured()){
  show(say("خدمة التسجيل غير متاحة حاليًا.","Registration is currently unavailable."),true);return;
 }
 button.disabled=true;
 receipt.hidden=true;
 show(say("جارٍ إنشاء حسابك...","Creating your account..."),false);
 try{
  var db=LEX_CLOUD.db();
  var response=await db.functions.invoke("student-register-whatsapp",{body:{
   name:name,email:email||null,whatsapp_e164:whatsapp||null,
   registration_track:academic?"academic":"conference",institutional_email:institutionalEmail||null,
   faculty:faculty||null,student_registration_number:studentNumber||null,accepted_research:academic,
   password:password,university:university,year_label:year,
   country_code:country,accepted_privacy:true,website:""
  }});
  var code=response.data&&response.data.error;
  if(!code&&response.error&&response.error.context&&typeof response.error.context.json==="function"){
   try{code=(await response.error.context.json()).error;}catch(_){}
  }
  if(response.error||!response.data||response.data.ok!==true||!response.data.username){
   if(code==="too_many_registrations")throw new Error("rate_limit");
   if(code==="student_number_required_by_faculty")throw new Error("student_number_required");
   if(code==="university_email_domain_not_allowed")throw new Error("institutional_domain_required");
   throw new Error("registration_failed");
  }
  var username=String(response.data.username);
  try{localStorage.setItem("lexlearn_last_student_username",username);}catch(_){}
  usernameLabel.textContent=username;
  studentNameLabel.textContent=name;
  receipt.hidden=false;
  form.hidden=true;
  if(typeof receipt.scrollIntoView==="function")receipt.scrollIntoView({block:"center",behavior:"smooth"});
  copyButton.textContent=say("نسخ اسم المستخدم","Copy username");
  // Supabase Auth is based on the generated username, not unverified contact data.
  try{
   if(academic){
    startButton.href=ar?"student-login.html":"student-login-en.html";
    startButton.textContent=say("الدخول بعد اعتماد المشرف","Sign in after supervisor approval");
    show(say("تم إنشاء حساب المشاركة. بيانات البريد الجامعي قيد التحقق والمراجعة، ولن تبدأ التجربة حتى اعتمادها.","Research account created. University details await manual verification and approval before participation."),false);
    form.reset();return;
   }
   var signed=await LEX_CLOUD.signInStudent(username,password);
   var profile=signed.profile;
   localStorage.setItem("lexlearn_student_session",JSON.stringify({
    studentId:profile.id,name:profile.display_name,username:profile.username,
    country:profile.country_code||country,cloud:true,at:Date.now()
   }));
   if(country==="qa")localStorage.setItem("lexlearn_country_setup_v2_rights_"+profile.id,"true");
   startButton.href=ar?"student.html":"student-en.html";
   show(say("حسابك جاهز! احتفظ باسم المستخدم، ثم اضغط «ابدأ التدريب».","Your account is ready! Save your username and select Start training."),false);
  }catch(_){
   startButton.href=ar?"student-login.html":"student-login-en.html";
   startButton.textContent=say("اذهب لصفحة الدخول","Go to sign-in");
   show(say("تم إنشاء حسابك بنجاح. احفظ اسم المستخدم، ثم سجّل الدخول بنفس كلمة المرور.","Account created. Save your username and sign in using the same password."),false);
  }
  form.reset();
 }catch(e){
  show(e.message==="student_number_required"?say("الكلية تشترط رقم القيد، يرجى إدخاله.","Your faculty requires your student number. Please provide it."):
   e.message==="institutional_domain_required"?say("استخدم نطاق البريد الجامعي المعتمد لدى الكلية.","Use an email address from your faculty’s approved university domain."):
   e.message==="rate_limit"?
   say("طلبات التسجيل من هذه الشبكة كثيرة الآن. حاول لاحقًا أو استخدم شبكة أخرى.","Too many registrations on this network. Try later or use another connection."):
   say("تعذر إنشاء الحساب الآن. حاول مجددًا أو اطلب مساعدة المشرف.","Unable to create an account right now. Please try again or ask a supervisor for help."),true);
 }finally{button.disabled=false;}
});
})();