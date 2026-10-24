/* LexLearn assessment wait experience: only an interface, never a fake progress indicator.
 * Research messages reuse the already attributed research summaries in session-moments.js.
 */
(function(root){
"use strict";
var current=null;
function en(language){return language==="en";}
function tr(language,ar,english){return en(language)?english:ar;}
function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function learnerName(value){
 var name=String(value||"").replace(/\s+/g," ").trim();
 return name.length>65?name.slice(0,65).trim():name;
}
function researchMessages(dimension){
 var lib=root.LEX_SESSION_MOMENTS,phrases=lib&&lib.phrases||[],sources=lib&&lib.sources||{};
 var topical=dimension==="recall"?"retrieval":dimension==="understanding"?"understanding":null;
 var matching=topical?phrases.filter(function(p){return p.source===topical;}):phrases.slice();
 if(matching.length<2)matching=phrases.slice();
 return matching.slice(0,5).map(function(p){return {ar:p.ar,en:p.en,source:sources[p.source]||null};});
}
var fallback=[
 {ar:"محاولتك الحالية تساعدك على معرفة ما أتقنته وما يحتاج إلى مراجعة.",en:"This attempt can show what you know and what to revisit."},
 {ar:"يمكنك أن تستفيد من الملاحظات بعد التصحيح في تحسين محاولتك القادمة.",en:"Use the feedback after grading to strengthen your next attempt."},
 {ar:"التعلم يتطور بالمحاولة والمراجعة، لا بالدرجة وحدها.",en:"Learning grows through practice and feedback, not just a score."}
];
function begin(options){
 var doc=root.document;if(!doc||!doc.body)return {setPhase:function(){},setStep:function(){},finish:function(){}};
 if(current)current.finish();
 options=options||{};
 var language=options.language==="en"?"en":"ar",name=learnerName(options.name),messages=researchMessages(options.dimension);
 if(!messages.length)messages=fallback;
 var lastFocus=doc.activeElement,oldOverflow=doc.body.style.overflow;
 var overlay=doc.createElement("div");
 overlay.className="lexGradingWait";overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");
 overlay.setAttribute("aria-label",tr(language,"جارٍ حفظ الإجابة وتصحيحها","Saving and assessing your answer"));
 overlay.setAttribute("dir",en(language)?"ltr":"rtl");
 overlay.innerHTML="<div class='lexGradingWaitPanel' tabindex='-1'>"+
 "<div class='lexGradingWaitOrbit'><span class='lexGradingWaitOrbitRing' aria-hidden='true'></span>"+
 "<img src='assets/lexlearn-logo.svg' alt='LexLearn'></div>"+
 "<p class='lexGradingWaitKicker'>"+tr(language,"رحلتك في التعلّم","YOUR LEARNING JOURNEY")+"</p>"+
 "<h2 class='lexGradingWaitTitle'></h2>"+
 "<p class='lexGradingWaitLead' role='status' aria-live='polite'></p>"+
 "<div class='lexGradingWaitQuote'><p class='lexGradingWaitMessage'></p><span class='lexGradingWaitSource'></span></div>"+
 "<div class='lexGradingWaitFoot'><span class='lexGradingWaitDots' aria-hidden='true'><i></i><i></i><i></i></span>"+
 "<span class='lexGradingWaitFootText'>"+tr(language,"النتيجة لم تصدر بعد — هذه ليست نسبة إنجاز","Assessment still in progress — no score yet")+"</span></div>"+
 "</div>";
 var heading=overlay.querySelector(".lexGradingWaitTitle"),lead=overlay.querySelector(".lexGradingWaitLead");
 var quote=overlay.querySelector(".lexGradingWaitMessage"),source=overlay.querySelector(".lexGradingWaitSource");
 var foot=overlay.querySelector(".lexGradingWaitFootText");
 var position=0,finished=false,interval=null,phase="saving",step="";
 var greeting=name?(en(language)?name+", ":"يا "+name+"، "):"";
 function renderPhase(){
   if(phase==="saving"){
     heading.textContent=tr(language,greeting+"بنحفظ إجابتك","Saving your answer"+(name?", "+name:""));
     lead.textContent=tr(language,"نتأكد أولًا من حفظ إجابتك في حسابك قبل التصحيح.","We are confirming that your answer is saved before assessment.");
   }else{
     heading.textContent=tr(language,greeting+"بنراجع إجابتك بعناية","Reviewing your answer"+(name?", "+name:""));
     lead.textContent=step||tr(language,"جارٍ تقييم إجابتك وفق عناصر السؤال والمراجع المعتمدة.","Your answer is being assessed using the question rubric and approved references.");
   }
 }
 function renderMessage(){
   var p=messages[position%messages.length];position++;
   quote.textContent=en(language)?p.en:p.ar;
   source.textContent=p.source?
     tr(language,"رسالة تربوية مبسّطة مستندة إلى: ","A simplified research-inspired message: ")+(en(language)?p.source.en:p.source.ar):
     tr(language,"رسالة تشجيعية أثناء الانتظار","Encouragement during assessment");
 }
 function finish(){
   if(finished)return;
   finished=true;if(interval!==null)root.clearInterval(interval);
   overlay.remove();doc.body.style.overflow=oldOverflow;
   if(lastFocus&&lastFocus.isConnected&&typeof lastFocus.focus==="function"){
     try{lastFocus.focus({preventScroll:true});}catch(_){}
   }
   if(current===handle)current=null;
 }
 var handle={
  setPhase:function(next){if(finished)return;if(next==="saving"||next==="grading"){phase=next;renderPhase();}},
  setStep:function(number,total){if(finished)return;
    if(Number.isInteger(number)&&Number.isInteger(total)&&total>0&&number>=1&&number<=total){
     step=tr(language,"نراجع الإجابة "+number+" من "+total+"، مع الاحتفاظ بكل إجاباتك المحفوظة.","Reviewing answer "+number+" of "+total+"; your saved work is retained.");
     phase="grading";renderPhase();
    }
  },
  finish:finish
 };
 doc.body.appendChild(overlay);doc.body.style.overflow="hidden";
 renderPhase();renderMessage();
 try{overlay.querySelector(".lexGradingWaitPanel").focus({preventScroll:true});}catch(_){}
 if(messages.length>1)interval=root.setInterval(function(){if(!finished)renderMessage();},6500);
 current=handle;return handle;
}
root.LEX_GRADING_WAIT={begin:begin};
if(typeof module!=="undefined"&&module.exports)module.exports=root.LEX_GRADING_WAIT;
})(typeof window!=="undefined"?window:globalThis);
