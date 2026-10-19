/* Conference-only appearance preference. Apply before CSS to avoid a light flash. */
(function () {
  'use strict';
  var root=document.documentElement,key='lexlearn_conference_theme';
  function valid(value){return value==='dark'||value==='light';}
  var theme='light';
  try{var saved=localStorage.getItem(key);if(valid(saved))theme=saved;}catch(_){}
  root.setAttribute('data-theme',theme);
  function sync(){
    var button=document.getElementById('conferenceThemeToggle');if(!button)return;
    var dark=root.getAttribute('data-theme')==='dark',ar=root.lang==='ar';
    var label=ar?(dark?'الوضع الفاتح':'الوضع الداكن'):(dark?'Light mode':'Dark mode');
    button.setAttribute('aria-label',label);button.title=label;
    button.setAttribute('aria-pressed',String(dark));
    button.querySelector('[data-theme-icon]').textContent=dark?'☀':'☾';
    button.querySelector('[data-theme-label]').textContent=label;
  }
  function apply(value,remember){
    if(!valid(value))return;
    root.setAttribute('data-theme',value);
    if(remember)try{localStorage.setItem(key,value);}catch(_){}
    sync();
  }
  document.addEventListener('DOMContentLoaded',function(){
    var button=document.getElementById('conferenceThemeToggle');if(!button)return;
    button.hidden=false;
    button.addEventListener('click',function(){apply(root.getAttribute('data-theme')==='dark'?'light':'dark',true);});
    new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['lang']});
    sync();
  });
  window.addEventListener('storage',function(event){if(event.key===key)apply(valid(event.newValue)?event.newValue:'light',false);});
})();
