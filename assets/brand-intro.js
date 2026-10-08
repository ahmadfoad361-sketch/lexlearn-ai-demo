(function(){
  "use strict";
  var root=document.documentElement,key="lexlearn_brand_intro_v1";
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,"seen");}catch(e){}
  root.classList.add("lexIntroActive");
  var timer=setTimeout(dismiss,1600);
  function dismiss(){
    root.classList.remove("lexIntroActive");
    clearTimeout(timer);
    document.removeEventListener("keydown",dismiss);
    document.removeEventListener("pointerdown",onPointer);
  }
  function onPointer(event){if(event.target.closest&&event.target.closest(".lexIntro"))dismiss();}
  document.addEventListener("keydown",dismiss);
  document.addEventListener("pointerdown",onPointer);
})();
