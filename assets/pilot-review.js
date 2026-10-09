(async function(){
"use strict";
var controls=document.getElementById("pilotControls"),host=document.getElementById("pilotSurface"),course={},language="ar";
try{
 var p=window.LEX_CLOUD&&LEX_CLOUD.isConfigured()?await LEX_CLOUD.profile():null;
 if(!p||p.active===false||["owner","admin","instructor"].indexOf(p.role)<0){controls.innerHTML='<h1>معاينة للمشرف</h1><p>سجّل الدخول بحساب الإدارة لفتح مراجعة الموضوعين.</p><a class="primary" href="admin-login.html">دخول الإدارة</a>';return;}
 controls.innerHTML='<h1>مراجعة التدريب الجديد</h1><p>الموضوعان مسودتان. يمكنك اختبار التصحيح الآلي من حساب المشرف؛ لا تحفظ المعاينة درجات طلاب. أزرار الانتقال محاكاة منفصلة.</p><div class="choiceRow"><button class="primary" data-topic="1">s1 · بداية الشخصية</button><button class="primary" data-topic="22">s22 · استعمال الحق</button><button class="secondary" id="reviewLanguage">English / العربية</button><a class="secondary" href="admin.html">الإدارة</a></div>';
 function start(n){course={};LEX_PILOT.mount(host,n,language,{course:course,reviewMode:true,onExit:function(){host.innerHTML="";}});}
 controls.querySelectorAll("[data-topic]").forEach(function(b){b.onclick=function(){start(Number(b.dataset.topic));};});
 document.getElementById("reviewLanguage").onclick=function(){language=language==="ar"?"en":"ar";host.innerHTML="";document.documentElement.lang=language;document.documentElement.dir=language==="ar"?"rtl":"ltr";};
}catch(e){controls.innerHTML='<h1>تعذر التحقق من حساب المشرف</h1><p>أعد تسجيل الدخول ثم افتح المعاينة.</p><a class="primary" href="admin-login.html">دخول الإدارة</a>';}
})();
