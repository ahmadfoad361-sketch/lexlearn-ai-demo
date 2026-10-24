/* Presentation only: preserve wording and saved answers while making article references memorable. */
(function(root){"use strict";
function segments(value){
 var text=String(value),pattern=/(?:\bArticles?|\bArt\.|المادة|المادتان|المادتين|المواد)\s*[(（]?[0-9٠-٩۰-۹]+[)）]?(?:\s*(?:[–—−\-،,]|إلى|الى|و|and|to|&)\s*[(（]?[0-9٠-٩۰-۹]+[)）]?)*/gi;
 var out=[],last=0,m;while((m=pattern.exec(text))){if(m.index>last)out.push({text:text.slice(last,m.index),article:false});out.push({text:m[0],article:true});last=pattern.lastIndex;}
 if(last<text.length)out.push({text:text.slice(last),article:false});return out;
}
function enhance(scope){
 var doc=root.document,skip='script,style,textarea,input,select,option,code,pre,svg,canvas,[contenteditable],.legalArticleNumber,[aria-hidden="true"]';
 if(!scope||!scope.isConnected)return;
 var texts=[];
 if(scope.nodeType===3)texts.push(scope);
 else if(scope.nodeType===1){if(scope.matches(skip))return;var walker=doc.createTreeWalker(scope,root.NodeFilter.SHOW_TEXT),node;while((node=walker.nextNode()))texts.push(node);}
 texts.forEach(function(node){if(!node.parentElement||node.parentElement.closest(skip))return;var parts=segments(node.nodeValue);if(!parts.some(function(p){return p.article;}))return;
  var fragment=doc.createDocumentFragment();parts.forEach(function(p){if(!p.article){fragment.appendChild(doc.createTextNode(p.text));return;}var mark=doc.createElement('strong');mark.className='legalArticleNumber';mark.textContent=p.text;fragment.appendChild(mark);});node.replaceWith(fragment);
 });
}
function mount(){enhance(root.document.body);new root.MutationObserver(function(records){records.forEach(function(r){if(r.type==='characterData')enhance(r.target);else r.addedNodes.forEach(enhance);});}).observe(root.document.body,{childList:true,subtree:true,characterData:true});}
var api={segments:segments};root.LEX_LEGAL_EMPHASIS=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();}
})(typeof window!=='undefined'?window:globalThis);
