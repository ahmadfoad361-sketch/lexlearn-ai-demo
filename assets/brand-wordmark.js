/* One two-colour wordmark across static headers and dynamically rendered portals. */
(function(){
"use strict";
var selector='.v9-brand b,.en-brand b,.brand b,.brand strong,.brand>span,.brandTop b,.brand-intro-name,.lexIntroName,.wsqParticipantName,.identity b,.demoBrand b,.profileBrand b,.diagEyebrow,header>div>b,header.top>div>b';
function enhance(){
 document.querySelectorAll(selector).forEach(function(el){
  if(el.querySelector('.lexWordmark'))return;
  var text=el.textContent||'',match=text.match(/^\s*LexLearn(?=\s|$)/);
  if(!match)return;
  var word=document.createElement('span');word.className='lexWordmark';word.dir='ltr';word.lang='en';
  var lex=document.createElement('span'),learn=document.createElement('span');
  lex.className='lexWordmarkLex';lex.textContent='Lex';learn.className='lexWordmarkLearn';learn.textContent='Learn';
  word.append(lex,learn);el.replaceChildren(word,document.createTextNode(text.slice(match[0].length)));
 });
}
function mount(){enhance();new MutationObserver(function(records){if(records.some(function(r){return r.addedNodes.length;}))enhance();}).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
