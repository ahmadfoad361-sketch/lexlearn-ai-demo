/* Native home links and an accessible, decorative orbit on learner pages. */
(function(){"use strict";
function enhance(){
 var home=document.documentElement.lang==="en"?"index-en.html":"index.html";
 document.querySelectorAll('.v9-brand,.en-brand,.demoBrand,.brandTop,.brand,.wsqParticipant').forEach(function(el){
  if(el.closest('a'))return;
  var a=document.createElement('a');a.className='learnerBrandHome';a.href=home;a.setAttribute('aria-label','LexLearn — '+(home==='index.html'?'الرئيسية':'Home'));el.parentNode.insertBefore(a,el);a.appendChild(el);
 });
 document.querySelectorAll('img[src*="lexlearn-logo"],img[src*="lexlearn-x-transparent"]').forEach(function(img){
  if(img.closest('.lexIntro,[aria-hidden="true"],.learnerLogoOrbit'))return;
  if(img.getAttribute('src').includes('lexlearn-logo.svg'))img.setAttribute('src','assets/lexlearn-x-transparent.svg');
  var parent=img.parentNode,orbit=document.createElement('span');orbit.className='learnerLogoOrbit';
  parent.insertBefore(orbit,img);orbit.appendChild(img);
  if(!orbit.closest('a')){var a=document.createElement('a');a.href=home;a.className='learnerBrandHome';a.setAttribute('aria-label','LexLearn — '+(home==='index.html'?'الرئيسية':'Home'));parent.insertBefore(a,orbit);a.appendChild(orbit);}
 });
}
function mount(){enhance();new MutationObserver(function(records){if(records.some(function(r){return r.addedNodes.length;}))enhance();}).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
