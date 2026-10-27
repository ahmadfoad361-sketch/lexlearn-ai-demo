/* Reading preferences only: never reads or changes account/learning records. */
(function(){
 "use strict";
 var key="lexlearn_admin_font_size",root=document.documentElement,header=null,observer=null;
 function read(){try{return localStorage.getItem(key)==="large";}catch(_){return false;}}
 function apply(large){root.setAttribute("data-admin-font",large?"large":"normal");var input=document.getElementById("adminLargeText");if(input)input.checked=large;}
 apply(read());
 function mount(){
  var top=document.querySelector(".top");if(!top)return;
  if(!document.getElementById("adminLargeText")){
   var label=document.createElement("label");label.className="adminReadingControl";
   var input=document.createElement("input");input.type="checkbox";input.id="adminLargeText";input.checked=read();
   input.onchange=function(){apply(input.checked);try{localStorage.setItem(key,input.checked?"large":"normal");}catch(_){}};
   label.appendChild(input);label.appendChild(document.createTextNode("تكبير الخط أكثر"));
   (top.querySelector(".topin")||top).appendChild(label);
  }
  if(header!==top){
   if(observer)observer.disconnect();header=top;
   var measure=function(){root.style.setProperty("--admin-header-height",Math.ceil(top.getBoundingClientRect().height)+"px");};
   measure();if(window.ResizeObserver){observer=new ResizeObserver(measure);observer.observe(top);}
  }
 }
 window.LEX_ADMIN_APPEARANCE={mount:mount};
 document.addEventListener("DOMContentLoaded",mount);
 window.addEventListener("storage",function(e){if(e.key===key)apply(read());});
 var closed=[];
 window.addEventListener("beforeprint",function(){closed=Array.from(document.querySelectorAll("details.studentRecordSection:not([open])"));closed.forEach(function(d){d.open=true;});});
 window.addEventListener("afterprint",function(){closed.forEach(function(d){d.open=false;});closed=[];});
})();
