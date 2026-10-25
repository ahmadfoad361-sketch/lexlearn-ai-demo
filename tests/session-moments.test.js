const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const moments=require('../assets/session-moments.js');
assert.equal(moments.phrases.length,9);
for(let n=1;n<=30;n++)for(const lang of ['ar','en']){const p=moments.forSession(n),html=moments.render(n,lang);
 assert.ok(p.source.url.startsWith('https://'),'the research record stays available internally');
 assert.ok(html.replace(/&#39;/g,"'").replace(/&amp;/g,"&").replace(/&quot;/g,'"').includes(lang==='ar'?p.ar:p.en),'display the encouragement itself');
 assert.ok(!html.includes(p.source.url)&&!html.includes(p.source.ar)&&!html.includes(p.source.en),'research byline must not appear on learner card');
 assert.ok(!/figcaption|sessionMomentNote|sessionMomentSource|الدراسة الأصلية|اقتباسًا حرفيًا|original study|verbatim quotation/.test(html),
  'no academic footnotes or UI-explanation labels on completion cards');
 assert.ok(html.includes("data-moment-session='"+n+"'"));
 if(n>1)assert.notEqual(p.ar,moments.forSession(n-1).ar,'adjacent sessions show different lines');
}
for(const n of [0,31,NaN,'1','<script>']){assert.equal(moments.forSession(n),null);assert.equal(moments.render(n,'ar'),'');}
function environment({storageBlocked=false,supported=true}={}){
 const storage=new Map(),timers=[],dialogs=[];let focusRestored=false;
 const window={sessionStorage:{getItem:k=>{if(storageBlocked)throw Error();return storage.get(k);},setItem:(k,v)=>{if(storageBlocked)throw Error();storage.set(k,v);}},setTimeout:f=>{timers.push(f);return timers.length;},clearTimeout(){},document:{activeElement:{isConnected:true,focus(){focusRestored=true;}},body:{appendChild:d=>dialogs.push(d)},createElement(){const events={},button={};return {open:false,setAttribute(){},querySelector:()=>button,addEventListener:(k,f)=>events[k]=f,showModal:supported?function(){this.open=true;}:undefined,close(){this.open=false;events.close();},remove(){this.removed=true;},button};}}};window.window=window;
 vm.runInNewContext(fs.readFileSync('assets/session-moments.js','utf8'),window);return {api:window.LEX_SESSION_MOMENTS,dialogs,timers,storage,restored:()=>focusRestored};
}
const e=environment();assert.equal(e.api.show(3,'ar','student:course:3'),true);assert.equal(e.dialogs[0].open,true);assert.equal(e.api.show(3,'ar','student:course:3'),false);e.timers[0]();assert.ok(e.dialogs[0].removed);assert.ok(e.restored());assert.ok(e.storage.size===1);
const manual=environment();manual.api.show(1,'en','other');manual.dialogs[0].button.onclick();assert.ok(manual.dialogs[0].removed);manual.timers[0]();
const blocked=environment({storageBlocked:true});assert.equal(blocked.api.show(1,'ar','one'),true);assert.equal(blocked.api.show(1,'ar','one'),false);
assert.equal(environment({supported:false}).api.show(1,'ar','one'),false,'unsupported dialogs retain the inline report without an overlay');
const page=fs.readFileSync('student-path.html','utf8');assert.ok(page.includes('assets/session-moments.js')&&page.includes('assets/session-moments.css'));const css=fs.readFileSync('assets/session-moments.css','utf8');assert.ok(css.includes('prefers-reduced-motion:reduce'));assert.ok(css.includes('100dvh'));
console.log('Session encouragement: concise bilingual learner cards, internal source tracking, stable rotation, automatic close and no replay PASS');

