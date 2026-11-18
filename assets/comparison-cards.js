/* Accessible comparison-card sorting for official student practice.
 * Drag/tap/keyboard choose a legal classification; the approved server handles scoring.
 */
(function(root){
"use strict";
function tr(lang,ar,en){return lang==="en"?en:ar;}
function assign(card,zone){
 if(!card||!zone)return;
 var bucket=zone.querySelector(".lexSortBucket");
 if(!bucket)return;
 bucket.appendChild(card);
 card.dataset.lexChoice=zone.dataset.lexSortTarget;
 card.setAttribute("aria-pressed","true");
 card.classList.remove("lexSortSelected");
 card.style.transform="";
 card.style.pointerEvents="";
}
function mount(host,lang){
 if(!host||!host.querySelector)return false;
 var group=host.querySelector(".questionComparison");
 if(!group||group.dataset.lexSortMounted==="1")return false;
 var cards=Array.from(group.querySelectorAll(".comparisonStatement"));
 if(cards.length!==2)return false;
 var doc=group.ownerDocument;
 group.dataset.lexSortMounted="1";
 var deck=doc.createElement("div");
 deck.className="lexComparisonDeck";
 cards[0].parentNode.insertBefore(deck,cards[0]);
 cards.forEach(function(card,i){
  deck.appendChild(card);
  card.setAttribute("role","button");
  card.setAttribute("tabindex","0");
  card.setAttribute("aria-pressed","false");
  card.dataset.lexCardIndex=String(i+1);
  card.classList.add("lexSortableCard");
 });
 var hint=doc.createElement("p");
 hint.className="lexSortHint";
 hint.textContent=tr(lang,"اسحب كل بطاقة إلى التصنيف المناسب، أو اضغط عليها ثم اختر التصنيف. اشرح سبب اختيارك في الإجابة.","Drag each card to a category, or tap the card and then a category. Explain your reasoning in your answer.");
 group.appendChild(hint);
 var targets=doc.createElement("div");
 targets.className="lexSortTargets";
 targets.setAttribute("role","group");
 targets.setAttribute("aria-label",tr(lang,"تصنيف العبارات","Classify statements"));
 [["accurate",tr(lang,"دقيقة قانونيًا","Legally accurate")],["inaccurate",tr(lang,"غير دقيقة قانونيًا","Legally inaccurate")]].forEach(function(pair){
  var zone=doc.createElement("div");
  zone.className="lexSortTarget";
  zone.dataset.lexSortTarget=pair[0];
  zone.setAttribute("role","button");
  zone.setAttribute("tabindex","0");
  zone.setAttribute("aria-label",pair[1]);
  var title=doc.createElement("strong");title.textContent=pair[1];
  var bucket=doc.createElement("div");bucket.className="lexSortBucket";
  zone.appendChild(title);zone.appendChild(bucket);
  targets.appendChild(zone);
 });
 group.appendChild(targets);
 var selected=null,drag=null;
 function select(card){
  selected=card;
  cards.forEach(function(c){c.classList.toggle("lexSortSelected",c===card);});
 }
 function move(card,zone){assign(card,zone);selected=null;cards.forEach(function(c){c.classList.remove("lexSortSelected");});}
 function lookupZone(x,y){
  if(typeof doc.elementFromPoint!=="function")return null;
  // Ignore the moving card for accurate hit-testing on touch and mouse.
  var prev=drag&&drag.card?drag.card.style.pointerEvents:"";
  if(drag&&drag.card)drag.card.style.pointerEvents="none";
  var hit=doc.elementFromPoint(x,y);
  if(drag&&drag.card)drag.card.style.pointerEvents=prev;
  return hit&&hit.closest?hit.closest("[data-lex-sort-target]"):null;
 }
 cards.forEach(function(card){
  card.addEventListener("click",function(e){e.stopPropagation();select(card);});
  card.addEventListener("keydown",function(e){
   if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();select(card);}
   if(e.key==="Escape"){e.stopPropagation();selected=null;card.classList.remove("lexSortSelected");}
  });
  card.setAttribute("draggable","true");
  card.addEventListener("dragstart",function(e){
   select(card);
   if(e.dataTransfer){e.dataTransfer.setData("text/plain",card.dataset.lexCardIndex);e.dataTransfer.effectAllowed="move";}
  });
  card.addEventListener("pointerdown",function(e){
   if(e.button!=null&&e.button!==0)return;
   select(card);
   drag={card:card,id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
   if(card.setPointerCapture)try{card.setPointerCapture(e.pointerId);}catch(_){}
  });
  card.addEventListener("pointermove",function(e){
   if(!drag||drag.card!==card||e.pointerId!==drag.id)return;
   var dx=e.clientX-drag.x,dy=e.clientY-drag.y;
   if(!drag.moved&&Math.hypot(dx,dy)<7)return;
   drag.moved=true;card.classList.add("lexIsDragging");
   card.style.transform="translate("+dx+"px,"+dy+"px)";
  });
  function end(e,commit){
   if(!drag||drag.card!==card||e.pointerId!==drag.id)return;
   var zone=commit&&drag.moved?lookupZone(e.clientX,e.clientY):null;
   card.style.transform="";card.classList.remove("lexIsDragging");
   if(zone)move(card,zone);
   if(card.hasPointerCapture&&card.hasPointerCapture(e.pointerId))try{card.releasePointerCapture(e.pointerId);}catch(_){}
   drag=null;
  }
  card.addEventListener("pointerup",function(e){end(e,true);});
  card.addEventListener("pointercancel",function(e){end(e,false);});
 });
 targets.querySelectorAll(".lexSortTarget").forEach(function(zone){
  zone.addEventListener("click",function(e){if(e.target!==zone&&!e.target.closest("strong"))return;if(selected)move(selected,zone);});
  zone.addEventListener("keydown",function(e){
   if((e.key==="Enter"||e.key===" ")&&e.target===zone){e.preventDefault();if(selected)move(selected,zone);}
  });
  zone.addEventListener("dragover",function(e){e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect="move";});
  zone.addEventListener("drop",function(e){
   e.preventDefault();
   var n=e.dataTransfer&&e.dataTransfer.getData("text/plain");
   var card=cards.find(function(c){return c.dataset.lexCardIndex===n;});
   if(card)move(card,zone);
  });
 });
 return true;
}
function answer(host,lang){
 if(!host||!host.querySelectorAll)return "";
 var cards=Array.from(host.querySelectorAll(".questionComparison [data-lex-card-index]"));
 var lines=cards.filter(function(c){return c.dataset.lexChoice==="accurate"||c.dataset.lexChoice==="inaccurate";})
 .sort(function(a,b){return Number(a.dataset.lexCardIndex)-Number(b.dataset.lexCardIndex);})
 .map(function(c){
  var n=c.dataset.lexCardIndex,accurate=c.dataset.lexChoice==="accurate";
  return tr(lang,"العبارة "+n+": "+(accurate?"دقيقة قانونيًا.":"غير دقيقة قانونيًا."),
   "Statement "+n+": "+(accurate?"legally accurate.":"legally inaccurate."));
 });
 return lines.length?tr(lang,"تقييمي المستقل للعبارات:","My assessment of each statement:")+"\n"+lines.join("\n"):"";
}
var api={mount:mount,answer:answer};
root.LEX_COMPARISON_CARDS=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
