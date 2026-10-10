(async function(){
"use strict";
var controls=document.getElementById("pilotQaControls"),surface=document.getElementById("pilotQaSurface"),reviews=document.getElementById("pilotQaReviews");
var course={},lang="ar",topic=null,allowed=[];
const courseId="qa-pilot-s1-s22";
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function notice(message){controls.innerHTML="<h1>LexLearn QA</h1><p>"+esc(message)+"</p><a class='secondary' href='student-login.html'>دخول الطالب</a>";}
function save(){
 try{localStorage.setItem("lexlearn-qa-pilot",JSON.stringify(course));}catch(e){}
 LEX_CLOUD.saveSnapshot({courseId:courseId,snapshotType:"course",state:course}).catch(function(){controls.setAttribute("data-sync","pending");});
}
function nav(){
 controls.innerHTML="<h1>"+(lang==="ar"?"تجربة طالب مصرح له":"Authorized student QA")+"</h1><p>"+(lang==="ar"?"بيئة اختبار مغلقة؛ التصحيح ومحاولات الطالب محفوظة مركزيًا، ولا يعني ذلك إطلاق الموضوع للجمهور.":"Restricted QA; submissions and grading are saved centrally. Topics are not publicly launched.")+"</p><div class='choiceRow'>"+allowed.map(n=>"<button class='primary' data-topic='"+n+"'>s"+n+" · "+esc(LEX_PILOT.content[n][lang].title)+"</button>").join("")+"<button class='secondary' id='changeLang'>"+(lang==="ar"?"English":"العربية")+"</button><a class='secondary' href='student.html'>"+(lang==="ar"?"حساب الطالب":"Student home")+"</a></div>";
 controls.querySelectorAll("[data-topic]").forEach(b=>b.onclick=function(){mount(Number(b.dataset.topic));});
 controls.querySelector("#changeLang").onclick=function(){lang=lang==="ar"?"en":"ar";document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";surface.innerHTML="";topic=null;nav();renderReviews();};
}
function renderReviews(){
 reviews.innerHTML="";
 if(typeof LEX_PILOT.dashboard==="function")LEX_PILOT.dashboard(reviews,course,lang,save,function(){surface.innerHTML="";renderReviews();},true);
}
function mount(n){
 if(!allowed.includes(n))return;
 topic=n;surface.innerHTML="";
 var ok=LEX_PILOT.mount(surface,n,lang,{qaAuthorized:true,course:course,onSave:save,onExit:function(){surface.innerHTML="";renderReviews();},onComplete:function(){
  LEX_PILOT.schedule(course,n);save();
  surface.innerHTML="<section class='taskCard'><h2>"+(lang==="ar"?"اكتملت خطوات التدريب":"Training steps completed")+"</h2><p>"+(lang==="ar"?"ستظهر مراجعتا اليوم والأسبوع عند حلول موعديهما.":"The one-day and seven-day reviews will appear when due.")+"</p><button class='secondary' id='backQa'>"+(lang==="ar"?"عودة":"Back")+"</button></section>";
  surface.querySelector("#backQa").onclick=function(){surface.innerHTML="";renderReviews();};
  renderReviews();
 }});
 if(!ok)notice(lang==="ar"?"لم يُصرح لك بهذا الموضوع.":"Topic is not authorized.");
}
try{
 if(!window.LEX_CLOUD||!LEX_CLOUD.isConfigured()){notice("الاتصال المركزي غير مجهز.");return;}
 var p=await LEX_CLOUD.profile();
 if(!p||p.role!=="student"||p.active===false){notice("يلزم تسجيل الدخول بحساب الطالب المصرح له.");return;}
 var response=await LEX_CLOUD.db().functions.invoke("pilot-access",{body:{}});
 if(response.error||!response.data||response.data.qa!==true||!response.data.allowed){notice("غير مصرح لهذا الحساب بالتجربة المحدودة.");return;}
 allowed=response.data.topics.filter(n=>n===1||n===22);
 if(!allowed.length){notice("المهام لم تُعتمد قانونيًا وتعليميًا بعد.");return;}
 var snap=await LEX_CLOUD.loadSnapshot({courseId:courseId,snapshotType:"course"});
 if(snap&&snap.state)course=snap.state;
 else{try{course=JSON.parse(localStorage.getItem("lexlearn-qa-pilot")||"{}");}catch(e){course={};}}
 nav();renderReviews();
}catch(e){notice("تعذر التحقق من جلسة الطالب. أعد تسجيل الدخول.");}
})();
