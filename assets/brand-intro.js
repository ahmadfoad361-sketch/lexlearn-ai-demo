(function(){
  "use strict";
  var root=document.documentElement,key="lexlearn_brand_intro_v1";
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,"seen");}catch(e){}
  root.classList.add("lexIntroActive");

  function paintHomeQuote(){
    var node=document.querySelector(".lexIntroQuote");
    if(!node)return;
    if(window.LEXLEARN_LEARNING_LINES){
      window.LEXLEARN_LEARNING_LINES.render(node,root.lang==="ar"?"ar":"en");
    }else node.textContent=root.lang==="ar"?"نفهم لنتذكّر، ونسترجع لنفهم أكثر.":"We understand to remember and retrieve to understand more.";
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",paintHomeQuote,{once:true});
  else paintHomeQuote();

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
