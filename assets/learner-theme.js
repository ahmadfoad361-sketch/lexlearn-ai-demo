/* Appearance only; never reads or changes learning records. Conference is independent. */
(function(){"use strict";
var root=document.documentElement,key="lexlearn_learner_theme",theme="light";
try{var saved=localStorage.getItem(key)||localStorage.getItem("lexlearn_conference_theme");if(saved==="dark"||saved==="light")theme=saved;}catch(_){}
function apply(value){root.setAttribute("data-learner-theme",value);root.style.colorScheme=value;}
apply(theme);
function mount(){
 var button=document.createElement("button");button.type="button";button.id="learnerThemeToggle";button.className="learnerThemeToggle";
 function label(){var dark=root.getAttribute("data-learner-theme")==="dark",en=root.lang==="en";button.textContent=(dark?"☀ ":"☾ ")+(en?(dark?"Light mode":"Dark mode"):(dark?"الوضع الفاتح":"الوضع الداكن"));button.setAttribute("aria-pressed",String(dark));}
 button.onclick=function(){theme=root.getAttribute("data-learner-theme")==="dark"?"light":"dark";apply(theme);try{localStorage.setItem(key,theme);}catch(_){}label();};
 document.body.appendChild(button);label();
 window.addEventListener("storage",function(e){if(e.key===key){apply(e.newValue==="dark"?"dark":"light");label();}});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();

