(function(){
"use strict";
var root=document.getElementById("researchPilotApp"),cloud=window.LEX_CLOUD,blocked=false,pending=null;
function safe(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function msg(s,isError){root.innerHTML='<div class="card '+(isError?"error":"")+'">'+safe(s)+'</div>';}
async function call(body){
 if(!cloud||!cloud.isConfigured||!cloud.isConfigured())throw Error("تعذر الاتصال بخدمة LexLearn.");
 var db=cloud.db();if(!db)throw Error("خدمة تسجيل الدخول غير متاحة.");
 var {data,error}=await db.functions.invoke("lexlearn-research-single-student",{body:body});
 if(error||!data)throw Error(data&&data.error||error&&error.message||"تعذر إكمال طلب التجربة.");
 return data;
}
function busy(on){blocked=on;root.querySelectorAll("button").forEach(function(el){el.disabled=!!on;});}
function meter(p){
 if(!p)return "";
 return "<section class='card'><h2>ملخص التدريب غير الرسمي</h2><p>تمت الإجابة عن "+Number(p.answered_count||0)+" مهمة، منها "+
 Number(p.objective_answers||0)+" أسئلة موضوعية، و"+Number(p.reflection_pending_human_review||0)+" إجابة تعليل تحتاج مراجعة أكاديمية.</p>"+
 "<p class='muted'>"+safe(p.warning)+"</p></section>";
}
function showNext(){
 if(!pending)return;
 var s=pending;pending=null;render(s);
}
function reviewMessage(data){
 var fb=data.feedback;
 if(!fb)return false;
 pending=Object.assign({},data,{feedback:null});
 root.innerHTML="<section class='card feedback'><h2>تغذية راجعة للتعلم</h2><p>"+safe(fb.message_ar)+"</p>"+
 (fb.review_required?"<p class='muted'>هذه الإجابة لا تُقوَّم آليًا ولا تؤثر على نتائجك.</p>":"")+
 "<button id='researchContinue'>الانتقال للخطوة التالية</button></section>"+meter(data.progress);
 root.querySelector("#researchContinue").onclick=showNext;
 return true;
}
function render(d){
 if(d.eligible===false){msg("هذا المسار التجريبي غير متاح لهذا الحساب. استمر في التدريب الرسمي المعتاد.",true);return;}
 if(d.consent_required||d.consented===false){
  root.innerHTML="<section class='card'><h2>موافقة على التجربة الاختيارية</h2>"+
  "<p>ستُحفظ إجابات هذه التجربة بصورة منفصلة عن درجاتك الرسمية، ليتمكن المشرف من مراجعة جودة الأسئلة وتحليل التعليل. لا تُستخدم إجاباتك تلقائيًا لتغيير تقدمك.</p>"+
  "<p class='muted'>بإمكان المشرف إيقاف التجربة دون المساس بأي نتائج سابقة. يمكنك متابعة تدريبك الأصلي بدلًا من الاشتراك.</p>"+
  "<button id='researchOptIn'>أوافق وأبدأ التدريب الاختياري</button> <a href='student.html'>الاستمرار في النظام المعتاد</a></section>";
  root.querySelector("#researchOptIn").onclick=async function(){if(blocked)return;busy(true);try{render(await call({action:"consent"}));}catch(e){msg(e.message,true);}finally{busy(false);}};
  return;
 }
 if(d.feedback&&reviewMessage(d))return;
 var p=meter(d.progress);
 if(d.phase==="completed"){
  root.innerHTML="<section class='card'><h2>اكتملت مراحل التجربة</h2><p>انتهت الأسئلة الموضوعية والمراجعات المؤجلة. إجابات التعليل ما زالت تحتاج مراجعة أكاديمية بشرية مستقلة، ونتائج هذه التجربة لا تدخل الدرجات الرسمية.</p><a href='student.html'>العودة للتدريب المعتاد</a></section>"+p;return;
 }
 if(d.waiting_until){
  var date=new Date(d.waiting_until);
  root.innerHTML="<section class='card'><h2>موعد المراجعة التالية</h2>"+
  "<p>انتهت مرحلة التدريب الحالية. حاول استرجاع القاعدة من ذاكرتك دون فتح الإجابة السابقة عند موعد المراجعة.</p>"+
  "<p><strong>"+safe(isNaN(date.valueOf())?"قريبًا":new Intl.DateTimeFormat("ar-EG",{dateStyle:"full",timeStyle:"short"}).format(date))+"</strong></p>"+
  "<button id='researchRefresh' type='button'>تحقق من إتاحة المراجعة</button> <a href='student.html'>العودة للتدريب المعتاد</a></section>"+p;
  root.querySelector("#researchRefresh").onclick=load;return;
 }
 var q=d.task;
 if(!q){msg("لا توجد مهمة متاحة حاليًا. تحقق لاحقًا.");return;}
 var intro=q.worked_example_ar?"<div class='intro'><strong>مثال داعم:</strong> "+safe(q.worked_example_ar)+"</div>":"";
 var sources="<p class='muted'>المصادر القانونية: "+(q.source_ids||[]).map(safe).join("، ")+"</p>";
 if(q.kind==="choice"){
  root.innerHTML="<section class='card'><h2>سؤال قانوني تكيفي</h2>"+intro+
   "<form id='researchForm'><fieldset><legend>"+safe(q.prompt_ar)+"</legend>"+
   q.options_ar.map(function(s,i){return "<label class='choice'><input required type='radio' name='choice' value='"+i+"'>"+safe(s)+"</label>";}).join("")+
   "</fieldset><button type='submit'>اعتماد الإجابة</button></form>"+sources+"<p class='error' id='researchError' role='alert'></p></section>"+p;
  root.querySelector("#researchForm").onsubmit=function(e){e.preventDefault();if(blocked)return;
   var radio=root.querySelector('input[name="choice"]:checked');if(!radio){root.querySelector("#researchError").textContent="اختر إجابة أولًا.";return;}
   submit({action:"submit",task_key:q.id,selected_index:Number(radio.value)});
  };
 }else{
  root.innerHTML="<section class='card'><h2>اشرح السبب القانوني</h2>"+intro+
   "<form id='researchForm'><p>"+safe(q.prompt_ar)+"</p><textarea id='researchExplanation' minlength='10' maxlength='1800' required placeholder='اكتب التعليل القانوني بأسلوبك...'></textarea>"+
   "<p class='muted'>لا توجد درجة تلقائية للإجابة المفتوحة، ولا تستخدم هذه الإجابة لتغيير مستواك الرسمي.</p>"+
   "<button type='submit'>حفظ التعليل التجريبي</button></form>"+sources+"<p class='error' id='researchError' role='alert'></p></section>"+p;
  root.querySelector("#researchForm").onsubmit=function(e){e.preventDefault();if(blocked)return;var a=root.querySelector("#researchExplanation").value.trim();
   if(a.length<10){root.querySelector("#researchError").textContent="اكتب تعليلًا من عشرة أحرف على الأقل.";return;}
   submit({action:"submit",task_key:q.id,answer_text:a});
  };
 }
}
async function submit(payload){if(blocked)return;busy(true);try{render(await call(payload));}catch(e){msg("تعذر حفظ الإجابة: "+e.message,true);}finally{busy(false);}}
async function load(){if(blocked)return;busy(true);try{render(await call({action:"state"}));}catch(e){msg("تعذر تحميل التدريب: "+e.message,true);}finally{busy(false);}}
async function boot(){try{
 if(!cloud||!cloud.db())throw Error("الرجاء فتح حساب الطالب أولًا.");
 var {data,error}=await cloud.db().auth.getUser();
 if(error||!data||!data.user){msg("يرجى تسجيل الدخول بحساب الطالب أولًا.",true);return;}
 var r=await call({action:"eligibility"});
 if(r.eligible===false){render(r);return;}
 if(r.consented===false){render({eligible:true,consent_required:true,non_credit:true});return;}
 await load();
 }catch(e){msg("التجربة غير متاحة الآن: "+e.message,true);}}
window.LEX_RESEARCH_PILOT={mount:boot};
if(!document.getElementById("researchPilotWorkspace"))boot();
})();