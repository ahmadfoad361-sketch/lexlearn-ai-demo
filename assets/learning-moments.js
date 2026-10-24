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
async function resultPng(data,lang){
 var en=lang==="en",canvas=root.document.createElement('canvas');canvas.width=1200;canvas.height=900;
 if(root.document.fonts&&root.document.fonts.ready)await root.document.fonts.ready;
 var c=canvas.getContext('2d');if(!c)throw Error('canvas_unavailable');
 c.fillStyle='#f9f4ef';c.fillRect(0,0,1200,900);c.fillStyle='#111d31';c.fillRect(0,0,1200,190);
 c.textAlign='center';c.textBaseline='middle';c.direction=en?'ltr':'rtl';
 function text(value,x,y,size,color){c.fillStyle=color;c.font='600 '+size+'px Tahoma, Arial, sans-serif';c.fillText(value,x,y);}
 function lines(value,y,size,color,maxWidth){c.font='600 '+size+'px Tahoma, Arial, sans-serif';var line='',out=[];String(value).split(/\s+/).forEach(function(w){var next=line?line+' '+w:w;if(c.measureText(next).width>maxWidth&&line){out.push(line);line=w;}else line=next;});if(line)out.push(line);out.forEach(function(t,i){text(t,600,y+i*(size+14),size,color);});return out.length*(size+14);}
 var title=data.kind==='diagnostic'?(en?'Your starting point':'نقطة انطلاقك'):data.kind==='level'?(en?'Level '+data.level+' completed':'أنجزت المستوى '+data.level):(en?'Session '+data.session+' completed':'أنجزت الجلسة '+data.session);
 text('LexLearn',600,64,34,'#eedba9');text(title,600,132,40,'#ffffff');
 text(en?'Qatar Civil Code · Law No. 22 of 2004':'القانون المدني القطري · القانون رقم (22) لسنة 2004',600,230,24,'#526074');
 [{name:en?'Understanding':'الفهم',value:score(data.understanding),color:'#247b78'},{name:en?'Recall':'الحفظ',value:score(data.recall),color:'#8a1f39'}].forEach(function(v,i){var x=350+i*500;c.beginPath();c.arc(x,400,115,0,Math.PI*2);c.fillStyle='#ffffff';c.fill();c.lineWidth=18;c.strokeStyle='#e7e1df';c.stroke();if(v.value!==null&&v.value>0){c.beginPath();c.arc(x,400,115,-Math.PI/2,-Math.PI/2+Math.PI*2*v.value/100);c.strokeStyle=v.color;c.stroke();}text(v.value===null?(en?'Not assessed':'لم يكتمل التصحيح'):v.value+'%',x,400,v.value===null?24:60,'#111d31');text(v.name,x,560,32,v.color);});
 text(en?'Your answers are saved. Keep building, one step at a time.':'إجاباتك محفوظة. واصل التعلم خطوة بخطوة.',600,630,27,'#111d31');
 var phrase=root.LEX_SESSION_MOMENTS&&root.LEX_SESSION_MOMENTS.forSession(data.session);
 if(phrase){var height=lines(en?phrase.en:phrase.ar,702,27,'#18253b',1030);lines(en?phrase.source.en:phrase.source.ar,710+height,20,'#795423',1050);}
 text(en?'Preliminary practice indicators · Not a university grade':'مؤشرات تدريبية مبدئية · ليست درجة جامعية',600,862,21,'#526074');
 return await new Promise(function(resolve,reject){canvas.toBlob(function(blob){if(blob)resolve(blob);else reject(Error('image_export_failed'));},'image/png');});
}
function bindDownload(host,data,lang){var b=host&&host.querySelector("#downloadResultCard");if(!b)return;b.onclick=async function(){
 b.disabled=true;var label=b.textContent;b.textContent=lang==='en'?'Preparing your image…':'نجهز صورة إنجازك…';
 try{var blob=await resultPng(data,lang),url=root.URL.createObjectURL(blob),a=root.document.createElement('a');a.href=url;a.download='lexlearn-'+(data.kind==='diagnostic'?'diagnostic':data.kind+'-'+(data.kind==='level'?data.level:data.session))+'.png';root.document.body.appendChild(a);a.click();a.remove();root.setTimeout(function(){root.URL.revokeObjectURL(url);},1000);b.textContent=label;}
 catch(_){b.textContent=lang==='en'?'Image unavailable — retry':'تعذر تجهيز الصورة — حاول مجددًا';}finally{b.disabled=false;}
 };}

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
var api={score:score,ring:ring,hero:hero,completion:completion,downloadButton:downloadButton,resultSvg:resultSvg,resultPng:resultPng,bindDownload:bindDownload,celebrate:celebrate,saveProgress:saveProgress};root.LEX_MOMENTS=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);


