(function(){
"use strict";
var zone=document.getElementById("saraPilotStaff");
if(!zone)return;
var cloud=window.LEX_CLOUD,msg=document.getElementById("saraPilotMessage"),target=document.getElementById("saraPilotResults");
var preview=null,working=false;
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function notice(s){msg.textContent=String(s);}
async function invoke(action){
 if(!cloud||!cloud.profile||!cloud.db())throw Error("خدمة السحابة غير متاحة.");
 var profile=await cloud.profile();
 if(!profile||profile.active!==true||["owner","admin"].indexOf(profile.role)<0)throw Error("يلزم حساب مدير مخوّل.");
 var r=await cloud.db().functions.invoke("lexlearn-research-single-student",{body:{action:action}});
 if(r.error||!r.data||r.data.error)throw Error(r.data&&r.data.error||r.error&&r.error.message||"تعذر الطلب");
 if(r.data.cohort_size!==1||r.data.non_credit!==true||r.data.no_student_grade_updates!==true)throw Error("فشل التحقق من تجربة الطالب الواحد.");
 return r.data;
}
function display(r){
 preview=r;var p=(r.participants||[])[0];
 var answers=r.results||[];
 var head="<p><b>عدد الطلاب في التجربة:</b> 1 فقط · <b>الحالة:</b> "+esc(p.status)+
 " · <b>الموافقة:</b> "+(p.consented?"تمت":"لم تتم بعد")+
 " · <b>الأسئلة المجاب عنها:</b> "+Number(p.answered||0)+"</p>";
 var rows=answers.length?"<h3>إجابات التجربة للمراجعة، وليست درجات رسمية</h3>"+
 answers.map(function(a){return "<div style='padding:12px;border:1px solid #ddd;border-radius:10px;margin:10px 0'>"+
 "<strong>"+esc(a.task_key)+"</strong> · "+esc(a.submitted_at||"")+
 "<p>"+(a.free_text?esc(a.free_text):"اختيار رقم "+(Number(a.selected_index)+1))+"</p>"+
 (typeof a.correct==="boolean"?"<small>"+(a.correct?"إجابة موضوعية صحيحة":"إجابة موضوعية تحتاج مراجعة")+"</small>":"<small>تعليل مفتوح لم يُصحح آليًا</small>")+"</div>";}).join(""):"<p class='muted'>لم تُرسل أي إجابات تجريبية بعد.</p>";
 target.innerHTML=head+rows+"<p class='muted'>لا تتم مزامنة هذه الإجابات مع سجل الحفظ والفهم أو الدرجات الرسمية.</p>";
 document.getElementById("saraPause").disabled=p.status==="paused";
 document.getElementById("saraResume").disabled=p.status==="enabled";
}
async function run(action){
 if(working)return;working=true;
 var buttons=zone.querySelectorAll("button");buttons.forEach(function(b){b.disabled=true;});
 notice("جارٍ فحص تجربة الطالب الواحد…");
 try{var r=await invoke(action);display(r);notice("تم تحديث حالة التجربة دون تعديل أي درجة أو إجابة رسمية.");}
 catch(e){notice("تعذر إكمال الطلب: "+e.message);}
 finally{working=false;if(!preview)buttons.forEach(function(b){b.disabled=false;});}
}
document.getElementById("saraRefresh").onclick=function(){run("admin_review");};
document.getElementById("saraPause").onclick=function(){if(window.confirm("هل تريد إيقاف التجربة الاختيارية فقط، مع الاحتفاظ بإجابات الطالب؟"))run("admin_pause");};
document.getElementById("saraResume").onclick=function(){if(window.confirm("هل تريد إعادة إتاحة التجربة الاختيارية لطالبها الحالي فقط؟"))run("admin_resume");};
})();