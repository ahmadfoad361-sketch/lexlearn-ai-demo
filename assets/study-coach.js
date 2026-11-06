/* LexLearn Smart Study Coach — REVIEW ONLY. Browser-only preview, no Supabase writes. */
(function(root){'use strict';
var enabled=new URLSearchParams(root.location.search).get('coach_preview')==='1';
var learner='',language='ar',inited=false,overlay=null,onContinue=null,clockId=0,dialogWasOpen=false,lastFocus=null;
var TAB='coach-'+Math.random().toString(36).slice(2),STORAGE='lexlearn:study-coach-preview:v1:';
var lastInteraction=Date.now(),lastTick=Date.now();
var rules={breakAfterSeconds:1800,breakAfterSessions:3,breakSessionMinSeconds:900,stopAfterSeconds:4500,stopAfterSessions:5,stopSessionMinSeconds:2700,maxDailyMessages:2,continueSilenceMs:1800000,idleGraceMs:180000};
function now(){return Date.now();}
var tz=(function(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'Africa/Cairo';}catch(e){return 'Africa/Cairo';}})();
function dayKey(){try{var p=new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());function v(k){return p.find(function(x){return x.type===k;}).value;}return v('year')+'-'+v('month')+'-'+v('day');}catch(e){return new Date().toISOString().slice(0,10);}}
function key(){return STORAGE+learner+':'+dayKey();}
function read(k){try{return JSON.parse(root.localStorage.getItem(k)||'null');}catch(e){return null;}}
function write(k,v){try{root.localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function state(){var s=read(key());return s&&s.day===dayKey()?s:{day:dayKey(),activeSeconds:0,completed:[],shown:0,closed:0,muted:false,silentUntil:0,breakEnds:0};}
function save(s){if(s&&learner)write(key(),s);}
function tr(ar,en){return language==='en'?en:ar;}
function markInteraction(){lastInteraction=now();}
function canAccumulate(){return !root.document.hidden&&root.document.hasFocus()&&now()-lastInteraction<rules.idleGraceMs&&!dialogWasOpen;}
function tick(){if(!enabled||!inited||!learner)return;var t=now(),delta=Math.max(0,Math.min(15,(t-lastTick)/1000));lastTick=t;if(!canAccumulate())return;
var leaseKey=key()+':lease',lease=read(leaseKey);if(lease&&lease.until>t&&lease.tab!==TAB)return;
write(leaseKey,{tab:TAB,until:t+22000});var s=state();s.activeSeconds=Math.min(86400,s.activeSeconds+delta);save(s);}
function init(o){if(!enabled||!o||!o.learnerId)return;var id=String(o.learnerId);if(learner===id&&inited)return;learner=id;language=o.language==='en'?'en':'ar';inited=true;lastInteraction=now();lastTick=now();
['pointerdown','keydown','scroll','touchstart'].forEach(function(ev){root.document.addEventListener(ev,markInteraction,{passive:true});});
root.document.addEventListener('visibilitychange',function(){lastTick=now();markInteraction();});
root.addEventListener('focus',function(){lastTick=now();markInteraction();});root.addEventListener('pagehide',tick);root.setInterval(tick,15000);}
function recordCompleted(id,n){if(!enabled||!inited||id!==learner)return;n=Number(n);if(!Number.isInteger(n)||n<1||n>30)return;var s=state();if(s.completed.indexOf(n)<0){s.completed.push(n);save(s);}}
function threshold(){if(!enabled||!inited||!learner||dialogWasOpen||root.document.hidden)return null;
var s=state();if(s.muted||s.closed>=2||s.shown>=rules.maxDailyMessages||s.silentUntil>now())return null;
if(s.activeSeconds>=rules.stopAfterSeconds||(s.completed.length>=rules.stopAfterSessions&&s.activeSeconds>=rules.stopSessionMinSeconds))return 'stop';
if(s.activeSeconds>=rules.breakAfterSeconds||(s.completed.length>=rules.breakAfterSessions&&s.activeSeconds>=rules.breakSessionMinSeconds))return 'break';
return null;}
function mins(){var b=overlay&&overlay.querySelector('[data-minutes][aria-pressed="true"]');return b?Number(b.getAttribute('data-minutes')):10;}
function updateStart(){overlay.querySelector('[data-action=start]').textContent=tr('ابدأ الاستراحة (','Start break (')+mins()+' '+tr('دقائق)','min)');}
function mount(){if(overlay)return;overlay=root.document.createElement('div');overlay.id='llCoachOverlay';overlay.className='ll-coach-layer';overlay.hidden=true;
overlay.innerHTML='<section class="ll-coach-dialog" role="dialog" aria-modal="true" aria-labelledby="llCoachTitle" aria-describedby="llCoachDesc" tabindex="-1">'+
'<button type="button" class="ll-coach-x" data-action="close" aria-label="'+tr('إغلاق النافذة','Close dialog')+'">×</button>'+
'<div class="ll-coach-top"><div class="ll-coach-hero" role="img" aria-label="'+tr('طالب جامعي يستريح أمام لابتوب يحمل شعار LexLearn','University student taking a break beside a LexLearn laptop')+'"></div>'+
'<div class="ll-coach-intro"><div class="ll-coach-brand" dir="ltr"><img src="assets/lexlearn-x-transparent.svg" alt=""/>LexLearn</div><small>Smart Study Coach</small><h2 id="llCoachTitle"></h2><p id="llCoachDesc"></p></div></div>'+
'<div class="ll-coach-content"><h3>'+tr('اختر نشاطًا خفيفًا أثناء الاستراحة','Choose a gentle break activity')+'</h3><div class="ll-coach-activities">'+
[tr('انظر بعيدًا عن الشاشة','Look away from the screen'),tr('اشرب بعض الماء','Have some water'),tr('تمشَّ قليلًا إن أمكن','Take a short walk if possible'),tr('اجلس بهدوء للحظات','Sit quietly for a moment'),tr('تمدّد برفق','Stretch gently')].map(function(s,i){return '<button type="button" class="ll-coach-activity" data-activity="'+i+'" aria-pressed="'+(i===0?'true':'false')+'"><img loading="lazy" src="assets/study-coach/activity-'+(i+1)+'.webp" alt=""/><span>'+s+'</span></button>';}).join('')+'</div>'+
'<button class="ll-coach-unsuitable" data-action="unsuitable" type="button">'+tr('هذا النشاط غير مناسب لي','This activity does not suit me')+'</button>'+
'<div class="ll-coach-duration"><strong>'+tr('مدة الاستراحة','Break duration')+'</strong><div role="group" aria-label="'+tr('مدة الاستراحة','Break duration')+'">'+[5,10,15].map(function(m){return '<button type="button" data-minutes="'+m+'" aria-pressed="'+(m===10?'true':'false')+'">'+m+' '+tr('دقائق','min')+'</button>';}).join('')+'</div></div>'+
'<p id="llCoachClock" role="timer" aria-live="off" hidden></p><p id="llCoachAnnouncement" class="ll-coach-sr" role="status" aria-live="polite"></p>'+
'<div class="ll-coach-actions"><button type="button" data-action="start" class="ll-coach-primary"></button><button type="button" data-action="continue" class="ll-coach-secondary">'+tr('سأكمل الآن','Continue now')+'</button><button type="button" data-action="mute" class="ll-coach-quiet">'+tr('لا تذكّرني اليوم','Do not remind me today')+'</button></div></div></section>';
root.document.body.appendChild(overlay);var dlg=overlay.querySelector('.ll-coach-dialog');dlg.setAttribute('dir',language==='ar'?'rtl':'ltr');
overlay.addEventListener('click',function(e){var el=e.target.closest('button');if(!el)return;
if(el.hasAttribute('data-activity')){overlay.querySelectorAll('[data-activity]').forEach(function(b){b.setAttribute('aria-pressed',String(el===b));});return;}
if(el.hasAttribute('data-minutes')){overlay.querySelectorAll('[data-minutes]').forEach(function(b){b.setAttribute('aria-pressed',String(el===b));});updateStart();return;}
switch(el.getAttribute('data-action')){case 'close':dismiss(false);break;case 'continue':dismiss(true);break;
case 'mute':var s=state();s.muted=true;save(s);hide();break;
case 'unsuitable':var bs=[].slice.call(overlay.querySelectorAll('[data-activity]'));var i=bs.findIndex(function(b){return b.getAttribute('aria-pressed')==='true';});bs[(i+1)%bs.length].click();break;
case 'start':startBreak();break;}});
dlg.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();dismiss(false);return;}if(e.key==='Tab'){var bs=[].slice.call(dlg.querySelectorAll('button:not([disabled])'));var i=bs.indexOf(root.document.activeElement);
if(e.shiftKey&&i===0){e.preventDefault();bs[bs.length-1].focus();}else if(!e.shiftKey&&i===bs.length-1){e.preventDefault();bs[0].focus();}}});}
function show(kind,go){mount();var s=state();s.shown++;s.silentUntil=now()+rules.continueSilenceMs;save(s);onContinue=go;dialogWasOpen=true;lastFocus=root.document.activeElement;
overlay.querySelector('#llCoachTitle').textContent=kind==='stop'?tr('قد يكون هذا وقتًا مناسبًا للاكتفاء اليوم','Consider ending your study for today'):tr('وقت مناسب لاستراحة قصيرة','A good time for a short break');
overlay.querySelector('#llCoachDesc').textContent=kind==='stop'?tr('يمكنك المتابعة إن أحببت، أو العودة إلى التدريب لاحقًا.','You can continue if you wish, or return to your training later.'):tr('خُذ استراحة قصيرة، ثم عُد عندما تكون مستعدًا.','Take a short break, then return when you are ready.');
overlay.hidden=false;root.document.body.classList.add('ll-coach-open');updateStart();overlay.querySelector('.ll-coach-dialog').focus();}
function hide(){if(!overlay)return;dialogWasOpen=false;overlay.hidden=true;root.document.body.classList.remove('ll-coach-open');if(clockId)root.clearInterval(clockId);clockId=0;if(lastFocus&&lastFocus.isConnected)lastFocus.focus();onContinue=null;}
function dismiss(navigate){var s=state();if(navigate)s.silentUntil=now()+rules.continueSilenceMs;else{s.closed++;if(s.closed>=2)s.muted=true;}save(s);var fn=onContinue;hide();if(navigate&&typeof fn==='function')fn();}
function startBreak(){var s=state();s.breakEnds=now()+mins()*60000;save(s);overlay.querySelector('[data-action=start]').disabled=true;overlay.querySelector('#llCoachClock').hidden=false;
overlay.querySelector('#llCoachAnnouncement').textContent=tr('بدأت الاستراحة','Your break has started');updateClock();clockId=root.setInterval(updateClock,1000);}
function updateClock(){var s=state(),rem=Math.max(0,Math.ceil((s.breakEnds-now())/1000));var el=overlay.querySelector('#llCoachClock');el.textContent=String(Math.floor(rem/60)).padStart(2,'0')+':'+String(rem%60).padStart(2,'0');
if(rem<=0){root.clearInterval(clockId);clockId=0;overlay.querySelector('#llCoachAnnouncement').textContent=tr('انتهت الاستراحة. يمكنك المتابعة عندما تكون مستعدًا.','Break finished. Continue when you are ready.');overlay.querySelector('[data-action=start]').disabled=false;overlay.querySelector('[data-action=start]').textContent=tr('ابدأ استراحة أخرى','Start another break');s.breakEnds=0;save(s);}}
function offerAtBoundary(o){if(!enabled||!inited||!o||o.learnerId!==learner)return false;var k=threshold();if(!k)return false;show(k,o.go);return true;}
root.LEX_STUDY_COACH={init:init,recordCompleted:recordCompleted,offerAtBoundary:offerAtBoundary,enabled:enabled,getDebugSummary:function(){if(!enabled)return null;var s=state();return {activeSeconds:Math.round(s.activeSeconds),sessions:s.completed.length,shown:s.shown,closed:s.closed,muted:s.muted};}};
})(window);
