/* Presentation only. Completion and scores must come from confirmed server records. */
(function(root){
"use strict";
var celebrated=new Set();
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function score(v){return typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100?Math.round(v):null;}
function trophy(){return "<svg viewBox='0 0 120 120' aria-hidden='true'><circle cx='60' cy='60' r='54' fill='#f6e8b8'/><path d='M39 25h42v24c0 17-10 27-21 27S39 66 39 49Z' fill='#d5aa4a'/><path d='M39 33H25v12c0 12 9 18 18 18M81 33h14v12c0 12-9 18-18 18' fill='none' stroke='#b58129' stroke-width='7'/><path d='M60 76v15m-17 5h34' stroke='#111d31' stroke-width='8' stroke-linecap='round'/><path d='m60 35 4 9 10 1-8 7 2 10-8-5-8 5 2-10-8-7 10-1Z' fill='#fff5d8'/></svg>";}
function ring(v,kind){var n=score(v);return "<svg class='momentRing "+(kind==="recall"?"memory":"meaning")+"' viewBox='0 0 120 120' aria-hidden='true'><circle class='ringBase' cx='60' cy='60' r='49'/><circle class='ringValue' cx='60' cy='60' r='49' pathLength='100' stroke-dasharray='"+(n===null?0:n)+" 100' transform='rotate(-90 60 60)'/></svg>";}
function hero(data,lang){var en=lang==="en",level=Number.isInteger(data.level)&&data.level>=1&&data.level<=6?data.level:1,isLevel=data.kind==="level",isDiagnostic=data.kind==="diagnostic";
 return "<div class='momentHero "+(isDiagnostic?"diagnosticMoment":"")+"'><div class='momentMedal'>"+trophy()+"</div><div><span class='momentKicker'>"+(en?"YOUR LEARNING JOURNEY":"رحلتك في التعلم")+"</span><h2>"+(isDiagnostic?(en?"Your learning journey starts here":"هذه بداية رحلتك"):isLevel?(en?"Level "+level+" completed!":"أكملت المستوى "+level+"!"):(en?"One more step forward":"خطوة جديدة في رحلتك"))+"</h2><p>"+(isDiagnostic?(en?"Two indicators to guide your next practice.":"مؤشران يساعدانك على اختيار تدريبك التالي."):isLevel?(en?"Your answers are saved. Take a moment to enjoy your progress.":"إجاباتك محفوظة. خذ لحظة للاحتفال بما أنجزته."):(en?"Your session is saved. Keep building, one answer at a time.":"حُفظت جلستك. تقدمك يتكوّن خطوة بخطوة."))+"</p></div></div>";
}
function completion(data,lang){return "<div class='momentCompletion'>"+hero(data,lang)+(data.kind==='level'?"<div class='momentJourney' aria-label='"+(lang==="en"?"Level progress":"تقدم المستويات")+"'>"+Array.from({length:6},function(_,i){return "<span class='"+(i<(data.level||1)?"earned":"")+"'>"+(i+1)+"</span>";}).join("")+"</div>":"")+"</div>";}
function downloadButton(lang){return "<button type='button' id='downloadResultCard' class='momentDownload'>"+(lang==="en"?"Download my result card":"حمّل بطاقة إنجازك")+" <span aria-hidden='true'>↓</span></button>";}
function resultSvg(data,lang){
 var en=lang==="en",title=data.kind==="diagnostic"?(en?"Your starting point":"نقطة انطلاقك"):data.kind==="level"?(en?"Level "+data.level+" complete":"أنجزت المستوى "+data.level):(en?"Session "+data.session+" complete":"أنجزت الجلسة "+data.session);
 var cells=[{name:en?"Understanding":"الفهم",value:score(data.understanding),color:'#247b78'},{name:en?"Recall":"الحفظ",value:score(data.recall),color:'#8a1f39'}];
 return "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800' role='img'><title>"+esc(title)+"</title><rect width='1200' height='800' rx='32' fill='#f9f4ef'/><path d='M0 0h1200v190H0Z' fill='#111d31'/><g font-family='Arial,Tahoma,sans-serif' text-anchor='middle'><text x='600' y='85' fill='#eedba9' font-size='30'>LexLearn</text><text x='600' y='147' fill='white' font-size='42' direction='"+(en?'ltr':'rtl')+"'>"+esc(title)+"</text>"+
 "<text x='600' y='228' fill='#526074' font-size='22' direction='"+(en?'ltr':'rtl')+"'>"+(en?"Qatar Civil Code · Law No. 22 of 2004":"القانون المدني القطري · القانون رقم (22) لسنة 2004")+"</text>"+
 cells.map(function(c,i){var x=360+i*480;return "<circle cx='"+x+"' cy='390' r='128' fill='white' stroke='#e7e1df' stroke-width='20'/><circle cx='"+x+"' cy='390' r='128' fill='none' stroke='"+c.color+"' stroke-width='20' stroke-dasharray='"+((c.value===null?0:c.value)/100*2*Math.PI*128)+" "+(2*Math.PI*128)+"' transform='rotate(-90 "+x+" 390)'/><text x='"+x+"' y='410' fill='#111d31' font-size='"+(c.value===null?28:64)+"'>"+esc(c.value===null?(en?'Under review':'قيد المراجعة'):c.value+'%')+"</text><text x='"+x+"' y='575' fill='"+c.color+"' font-size='36'>"+c.name+"</text>";}).join("")+
 "<text x='600' y='680' fill='#111d31' font-size='26'>"+(en?"Your answers are saved. Your next step starts here.":"إجاباتك محفوظة. وخطوتك التالية تبدأ من هنا.")+"</text><text x='600' y='735' fill='#526074' font-size='22'>"+(en?"Preliminary practice estimates · Not a university grade":"تقديرات تدريبية مبدئية · ليست درجة جامعية")+"</text></g></svg>";
}
function bindDownload(host,data,lang){var b=host&&host.querySelector("#downloadResultCard");if(!b)return;b.onclick=function(){var blob=new Blob([resultSvg(data,lang)],{type:'image/svg+xml;charset=utf-8'}),url=root.URL.createObjectURL(blob),a=root.document.createElement('a');a.href=url;a.download='lexlearn-'+(data.kind==='diagnostic'?'diagnostic':data.kind+'-'+(data.kind==='level'?data.level:data.session))+'.svg';root.document.body.appendChild(a);a.click();a.remove();root.setTimeout(function(){root.URL.revokeObjectURL(url);},1000);};}
function reduced(){return !!(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches);}
function celebrate(host,key){
 if(!host||celebrated.has(key)||reduced())return false;
 try{if(root.sessionStorage&&root.sessionStorage.getItem('lex_moment_'+key))return false;}catch(_){}
 celebrated.add(key);try{if(root.sessionStorage)root.sessionStorage.setItem('lex_moment_'+key,'1');}catch(_){}
 var layer=root.document.createElement('div');layer.className='momentConfetti';layer.setAttribute('aria-hidden','true');
 for(var i=0;i<44;i++){var p=root.document.createElement('i');p.style.cssText='--x:'+(i*37%100)+'%;--delay:'+(i%9*70)+'ms;--spin:'+(i%2?680:-540)+'deg;background:'+['#d5aa4a','#8a1f39','#247b78','#e8c8a5'][i%4];layer.appendChild(p);}
 host.appendChild(layer);root.setTimeout(function(){layer.remove();},3400);return true;
}
function saveProgress(step,lang){var en=lang==='en';return "<div class='answerSaving' role='status' aria-live='polite'><span class='answerSavingIcon' aria-hidden='true'></span><div><b>"+(step==='assessment'?(en?'Reviewing your answer…':'نراجع إجابتك الآن…'):(en?'Saving your answer…':'نحفظ إجابتك الآن…'))+"</b><small>"+(step==='assessment'?(en?'Saved securely · Preparing your feedback':'تم الحفظ · نجهّز ملاحظات تساعدك في الخطوة التالية'):(en?'One moment while we confirm your saved work':'لحظات حتى نتأكد من حفظ مجهودك'))+"</small></div></div>";}
var api={score:score,ring:ring,hero:hero,completion:completion,downloadButton:downloadButton,resultSvg:resultSvg,bindDownload:bindDownload,celebrate:celebrate,saveProgress:saveProgress};root.LEX_MOMENTS=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);


