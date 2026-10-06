(function(){
"use strict";
var form=document.getElementById("resetForm"),pw=document.getElementById("newPassword"),confirm=document.getElementById("confirmPassword"),msg=document.getElementById("resetMsg"),btn=document.getElementById("resetBtn");
function show(text,ok){msg.textContent=text;msg.style.display="block";msg.style.color=ok?"#176b45":"#9b1c31";}
async function ready(){
  if(!window.LEX_CLOUD||!LEX_CLOUD.isConfigured||!LEX_CLOUD.isConfigured()){show("خدمة الحساب غير مهيأة.",false);return;}
  var c=LEX_CLOUD.db();
  var session=await c.auth.getSession();
  if(!session.data.session){
    show("رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا من صفحة دخول المدير.",false);
    btn.disabled=true;
  }
}
form.addEventListener("submit",async function(e){
  e.preventDefault();
  msg.style.display="none";
  var a=pw.value,b=confirm.value;
  if(a.length<10){show("كلمة المرور يجب ألا تقل عن 10 أحرف.",false);return;}
  if(a!==b){show("كلمتا المرور غير متطابقتين.",false);return;}
  btn.disabled=true;
  try{
    var c=LEX_CLOUD.db();
    var r=await c.auth.updateUser({password:a});
    if(r.error)throw r.error;
    show("تم تغيير كلمة المرور بنجاح. سيتم تحويلك إلى صفحة دخول المدير.",true);
    setTimeout(function(){location.href="admin-login.html";},1400);
  }catch(err){
    var m=String(err&&err.message||"");
    if((err&&err.code==="same_password")||/different from the old password|same password/i.test(m)){
      show("كلمة المرور الجديدة هي نفسها كلمة المرور الحالية. استخدم كلمة مختلفة، أو ارجع وسجّل الدخول بهذه الكلمة.",false);
    }else{
      show("تعذر تغيير كلمة المرور. اطلب رابط استعادة جديدًا.",false);
    }
    btn.disabled=false;
  }
});
ready();
})();