(function(){
"use strict";
document.querySelectorAll("[data-password-target]").forEach(function(button){
  var target=document.getElementById(button.getAttribute("data-password-target"));
  if(!target)return;
  button.addEventListener("click",function(){
    var reveal=target.type==="password";
    target.type=reveal?"text":"password";
    button.textContent=reveal?(document.documentElement.lang==="en"?"Hide":"إخفاء"):(document.documentElement.lang==="en"?"Show":"إظهار");
    button.setAttribute("aria-pressed",String(reveal));
    button.setAttribute("aria-label",reveal?(document.documentElement.lang==="en"?"Hide password":"إخفاء كلمة المرور"):(document.documentElement.lang==="en"?"Show password":"إظهار كلمة المرور"));
  });
});
var remember=document.getElementById("rememberMe");
if(remember&&window.LEX_CLOUD&&LEX_CLOUD.rememberMe){
 remember.checked=LEX_CLOUD.rememberMe();
 remember.addEventListener("change",function(){LEX_CLOUD.setRememberMe(remember.checked);});
}
})();