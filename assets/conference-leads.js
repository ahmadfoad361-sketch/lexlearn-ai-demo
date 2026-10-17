/* LexLearn 2027 conference: consent-based leads. No analytics or marketing tracking.
   WA Business number is intentionally empty until the founder confirms it. */
(function(){
"use strict";
var endpoint="https://emxiuwcuxyljfynnzpnh.supabase.co/functions/v1/conference-lead";
var publicAnonJwt="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVteGl1d2N1eHlsamZ5bm56cG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNDk2NzEsImV4cCI6MjEwNjgyNTY3MX0.4om41WoeatrOixmPjhcyahBNdEQF_N6PLMiGIz6bDoQ";
var businessNumber="201014408788"; // User-confirmed +20 101 440 8788, E.164 digits for wa.me
var form=document.getElementById("leadForm"),status=document.getElementById("leadStatus");
if(!form||!status)return;
var submit=form.querySelector("[type=submit]"),audience=form.elements.audience,faculty=form.elements.faculty;
var facultyField=document.getElementById("facultyField"),wa=document.getElementById("waBusiness");
var primary=document.getElementById("formCTA"),share=document.getElementById("waShare");
var paths=document.getElementById("pathsReturn"),contact=document.getElementById("contact"),footer=document.querySelector("footer.foot");
var dict={
 ar:{
 pilotBody:"تُنفَّذ التجربة بالتعاون مع الجامعة، وتتولى LexLearn متابعتها وتقييم نتائجها.",
 pilotBefore:"قبل التجربة",pilotDuring:"أثناء التجربة",pilotAfter:"بعد التجربة",
 pilot1:"تجري LexLearn تشخيصًا أوليًا لكل مهارة.",pilot2:"تشرف LexLearn على التدريب وتتابع تقدّم الطلاب مع مراعاة الخصوصية.",pilot3:"تحلل LexLearn النتائج الأولية وتراجع موثوقية التصحيح وسهولة الاستخدام.",
 pilotLexLearnTitle:"دور LexLearn",pilotLexLearnRole:"تتولى LexLearn متابعة التجربة وتقييم نتائجها.",pilotNeedsTitle:"المطلوب من الجامعة",pilotNeeds:"مجموعة طلاب متطوعين، ومسؤول اتصال لتنسيق الموافقات والمواعيد، والاتفاق على جلسات حضورية أو عن بُعد.",
 pilotValueTitle:"ما تحصل عليه الجامعة",pilotValue:"تقرير أولي مجمّع لمؤشرات التعلم والنتائج، مع إمكان مراجعة الجامعة للنتائج وتقييمها بشكل مستقل.",
 pilotEthics:"نتائج الطلاب مجهولة الهوية وتُعرض في تقارير مجمّعة فقط، مع الحصول على الموافقات الأكاديمية اللازمة.",
 pilotCTA:"ناقش تجربة جامعية",
 visionLead:"رؤيتنا طويلة المدى: منصة تعليمية تبدأ بالتشخيص، وتقدّم توصيات واضحة، مع بقاء دور الأستاذ.",
 investorAsk:"نبحث عن شراكات للتجربة الأكاديمية ودعم استراتيجي ومناقشات تمويل مبكر. تفاصيل الاستثمار تُناقش في العرض التفصيلي.",
 investorCTA:"اطلب العرض التفصيلي",
 phase2PStart:"تجربة مقترحة تشمل",phase2PMid:"طالبًا خلال",phase2PEnd:"أسابيع لقياس النتائج الأولية.",
 statusReady:"جاهزة",statusUpcoming:"قادمة",statusProgress:"قيد التنفيذ",
 formCTA:"اترك بياناتك",businessCTA:"تواصل معنا عبر واتساب",emailCTA:"البريد الإلكتروني",
 formTitle:"خلّينا نتواصل",formIntro:"اترك بياناتك علشان نقدر نتواصل معاك بخصوص LexLearn.",
 fieldName:"الاسم",fieldOrg:"الجامعة أو الجهة",fieldAudience:"أنا",fieldFaculty:"الكلية أو القسم",fieldContact:"رقم الهاتف أو البريد الإلكتروني",
 roleStudent:"طالب",roleInvestor:"مستثمر أو شريك",roleUniversity:"جامعة أو مؤسسة",
 formConsent:"أوافق على استخدام بيانات التواصل للرد على طلبي فقط.",formPrivacy:"سياسة الخصوصية",
 formSubmit:"إرسال الطلب",sendBusy:"جاري الإرسال…",success:"تم استلام طلبك بنجاح. هنتواصل معاك ببيانات التواصل اللي كتبتها.",
 invalid:"اكتب اسمك وجهتك ورقمًا أو بريدًا صحيحًا، ووافق على سياسة استخدام بيانات التواصل.",
 error:"تعذّر إرسال الطلب. جرّب مرة أخرى أو استخدم البريد.",rate:"طلبات كثيرة من نفس الشبكة. جرّب لاحقًا أو استخدم البريد.",
 shareTitle:"شارك صفحة المؤتمر",returnPaths:"رجوع للمسارات"
 },
 en:{
 pilotBody:"The pilot will run in collaboration with the university, with LexLearn following progress and evaluating the results.",
 pilotBefore:"Before",pilotDuring:"During",pilotAfter:"After",
 pilot1:"LexLearn establishes a baseline for each skill.",pilot2:"LexLearn supervises the practice and follows student progress with privacy safeguards.",pilot3:"LexLearn reviews initial results, scoring reliability and usability.",
 pilotLexLearnTitle:"LexLearn's role",pilotLexLearnRole:"LexLearn follows the pilot and evaluates its results.",pilotNeedsTitle:"What we need from the university",pilotNeeds:"A volunteer student group, a university contact to coordinate approvals and schedules, and agreed in-person or online sessions.",
 pilotValueTitle:"What the university receives",pilotValue:"An aggregated preliminary learning-impact report and results summary. The university can independently review and assess the findings.",
 pilotEthics:"Student results will be de-identified and shared only in aggregated reports, subject to academic consent and safeguards.",
 pilotCTA:"Discuss a university pilot",
 visionLead:"Our long-term vision: a learning platform that starts with diagnosis, offers clear recommendations and preserves the professor's role.",
 investorAsk:"We seek academic pilot partnerships, strategic support and early-stage investment conversations. Detailed figures are available on request.",
 investorCTA:"Request the detailed pitch",
 phase2PStart:"Proposed pilot for",phase2PMid:"students over",phase2PEnd:"weeks to measure early outcomes.",
 statusReady:"Ready",statusUpcoming:"Upcoming",statusProgress:"In progress",
 formCTA:"Leave your details",businessCTA:"Chat on WhatsApp",emailCTA:"Email",
 formTitle:"Let's connect",formIntro:"Share a few details so we can follow up about your interest in LexLearn.",
 fieldName:"Your name",fieldOrg:"University or organization",fieldAudience:"I am a",fieldFaculty:"Faculty or department",fieldContact:"Phone number or email",
 roleStudent:"Student",roleInvestor:"Investor or partner",roleUniversity:"University or institution",
 formConsent:"I agree to the use of my contact details only to reply to my inquiry.",formPrivacy:"Privacy policy",
 formSubmit:"Send request",sendBusy:"Sending…",success:"Your request was received successfully. We'll follow up using the contact information provided.",
 invalid:"Enter your name, organization and a valid phone number or email, and agree to the data-use policy.",
 error:"Unable to submit right now. Please retry or email us.",rate:"Too many requests from this network. Please try again later or email us.",
 shareTitle:"Share conference page",returnPaths:"Back to paths"
 }
};
function normalizeContact(value){
 return String(value||"").trim().replace(/[\u0660-\u0669\u06f0-\u06f9]/g,function(ch){
   var n=ch.charCodeAt(0);
   return String(n>=0x6f0?n-0x6f0:n-0x660);
 });
}
function language(){return document.documentElement.lang==="ar"?"ar":"en";}
function translate(){
 var x=dict[language()];
 document.querySelectorAll("[data-t]").forEach(function(el){var key=el.getAttribute("data-t");if(key in x)el.textContent=x[key];});
 document.getElementById("formPrivacy").href=language()==="ar"?"privacy.html":"privacy-en.html";
 share.setAttribute("aria-label",x.shareTitle);share.title=x.shareTitle;
 if(/^[1-9][0-9]{7,14}$/.test(businessNumber)){
  var introduction=language()==="ar"?"مرحبًا، تعرفت على LexLearn في Web Summit Qatar 2027 وأرغب في معرفة المزيد عن المشروع.":"Hello, I discovered LexLearn at Web Summit Qatar 2027 and would like to learn more about the project.";
  wa.href="https://wa.me/"+businessNumber+"?text="+encodeURIComponent(introduction);
 }
 if(paths){
  paths.innerHTML='<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5m0 0-6 6m6-6 6 6"/></svg>';
  paths.setAttribute("aria-label",x.returnPaths);paths.title=x.returnPaths;
 }
}
function changeRole(){
 var uni=audience.value==="university";
 facultyField.hidden=!uni;faculty.required=uni;
}
function chooseRole(role){
 if(!["student","investor","university"].includes(role))return;
 audience.value=role;changeRole();
 status.textContent="";
}
document.querySelectorAll("[data-lead-role]").forEach(function(a){a.addEventListener("click",function(){chooseRole(a.getAttribute("data-lead-role"));});});
audience.addEventListener("change",changeRole);
["langAR","langEN"].forEach(function(id){var b=document.getElementById(id);if(b)b.addEventListener("click",translate);});
if(/^[1-9][0-9]{7,14}$/.test(businessNumber)){
 wa.hidden=false;
 wa.classList.add("buttonPrimary");
 primary.classList.remove("buttonPrimary");
 primary.classList.add("buttonSecondary");
}
if(paths){
 function trackScroll(){
  var contactVisible=contact && contact.getBoundingClientRect().top<window.innerHeight*0.88;
  var footerVisible=footer && footer.getBoundingClientRect().top<window.innerHeight;
  if(contactVisible||footerVisible)paths.classList.remove("isVisible");
 }
 window.addEventListener("scroll",trackScroll,{passive:true});
 window.addEventListener("resize",trackScroll,{passive:true});
 trackScroll();
}
form.addEventListener("submit",async function(event){
 event.preventDefault();
 var x=dict[language()];
 var field=form.elements;
 var payload={
  visitor_name:field.visitor_name.value.trim(),
  organization:field.organization.value.trim(),
  faculty:field.faculty.value.trim(),
  audience:field.audience.value,
  contact:normalizeContact(field.contact.value),
  website:field.website.value,
  consent:field.consent.checked
 };
 var validContact=/^(?:[^\s@]+@[^\s@]+\.[^\s@]+|[+0-9][0-9\s().-]{5,24})$/.test(payload.contact);
 if(payload.visitor_name.length<2||payload.organization.length<2||!validContact||
    (payload.audience==="university"&&payload.faculty.length<2)||!payload.consent){
  status.textContent=x.invalid;status.dataset.state="error";form.reportValidity();return;
 }
 submit.disabled=true;submit.textContent=x.sendBusy;status.textContent="";delete status.dataset.state;
 try{
  var controller=new AbortController();var timeout=setTimeout(function(){controller.abort();},12000);
  var response;
  try{
   response=await fetch(endpoint,{
    method:"POST",mode:"cors",cache:"no-store",signal:controller.signal,
    headers:{"content-type":"application/json","apikey":publicAnonJwt,"authorization":"Bearer "+publicAnonJwt},
    body:JSON.stringify(payload)
   });
  }finally{clearTimeout(timeout);}
  var result=await response.json().catch(function(){return {};});
  if(!response.ok||result.ok!==true)throw new Error(result.error||"unknown");
  status.textContent=x.success;status.dataset.state="success";
  var prior=audience.value;form.reset();audience.value=prior;changeRole();
 }catch(err){
  status.textContent=err.message==="rate_limit"?x.rate:x.error;status.dataset.state="error";
 }finally{submit.disabled=false;submit.textContent=x.formSubmit;}
});
translate();changeRole();
})();
