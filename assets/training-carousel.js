(function(){
  "use strict";
  var current=null;
  function init(){
    var root=document.querySelector('[data-training-carousel]');
    if(current&&current.root===root)return;
    if(current)current.destroy();
    if(!root)return;
    var slides=Array.from(root.querySelectorAll('.qualitySlide'));
    var dots=Array.from(root.querySelectorAll('[data-slide-index]'));
    var pause=root.querySelector('[data-carousel-pause]'),status=root.querySelector('[data-carousel-status]');
    var ar=document.documentElement.lang==='ar',reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var index=0,timer=null,cleanup=null,busy=false,paused=!!reduced,hover=false,focused=false;
    function schedule(){
      clearInterval(timer);timer=null;
      if(!paused&&!hover&&!focused&&!document.hidden)timer=setInterval(function(){if(!root.isConnected){destroy();return;}show((index+1)%slides.length,false);},6500);
    }
    function show(next,manual){
      if(busy||next===index)return;
      var old=slides[index];
      old.classList.remove('isActive');old.classList.add('isLeaving');old.setAttribute('aria-hidden','true');
      index=next;slides[index].classList.add('isActive');slides[index].setAttribute('aria-hidden','false');
      dots.forEach(function(dot,i){dot.setAttribute('aria-pressed',String(i===index));});
      if(manual)status.textContent=slides[index].querySelector('h2').textContent;
      busy=true;cleanup=setTimeout(function(){old.classList.remove('isLeaving');busy=false;},reduced?0:560);
      schedule();
    }
    function updatePause(){pause.textContent=paused?(ar?'تشغيل الحركة':'Play slides'):(ar?'إيقاف الحركة':'Pause slides');pause.setAttribute('aria-pressed',String(paused));schedule();}
    dots.forEach(function(dot){dot.onclick=function(){show(Number(dot.dataset.slideIndex),true);};});
    pause.onclick=function(){paused=!paused;updatePause();};
    root.onpointerenter=function(){hover=true;schedule();};root.onpointerleave=function(){hover=false;schedule();};
    root.onfocusin=function(){focused=true;schedule();};root.onfocusout=function(e){focused=root.contains(e.relatedTarget);schedule();};
    function visibility(){if(!root.isConnected){destroy();return;}schedule();}
    function destroy(){clearInterval(timer);clearTimeout(cleanup);document.removeEventListener('visibilitychange',visibility);current=null;}
    document.addEventListener('visibilitychange',visibility);
    current={root:root,destroy:destroy};updatePause();
  }
  window.LEX_CAROUSEL={init:init};init();
})();
