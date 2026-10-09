const assert=require('assert'),fs=require('fs'),vm=require('vm');
const P=require('../assets/pilot-learning'),Q=require('../assets/learning-quality');
assert.equal(P.isReleased(1),false);assert.equal(P.isReleased(22),false);assert.equal(P.isReleased(2),false);
const s={step:2,failures:0};
assert.equal(P.advance(s,false),'retry');assert.equal(s.step,2);
assert.equal(P.advance(s,false),'support');assert.equal(s.step,1);
assert.equal(P.advance(s,true),'advance');assert.equal(s.step,2);
assert.equal(P.advance(s,null),'pending');assert.equal(s.step,2);assert.equal(s.failures,0);
const course={},now=Date.UTC(2026,9,9,9);
P.schedule(course,1,now);P.schedule(course,1,now+1000);P.schedule(course,22,now);P.schedule(course,2,now);
assert.equal(course.delayedReviews.length,4);
assert.equal(course.delayedReviews[0].dueAt,now+86400000);
assert.equal(course.delayedReviews[1].dueAt,now+7*86400000);
const ics=P.calendar(course.delayedReviews,'en',now);
assert(ics.includes('BEGIN:VALARM\r\nTRIGGER:PT0M'));assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,4);
assert(ics.includes('DTSTART:20261010T090000Z'));assert(ics.includes('program-en.html'));
assert.equal(P.submitReview(course,course.delayedReviews[0].id,'a different accurate cue',now+86400000),true);
assert.equal(course.delayedReviews[0].score,null);assert.equal(course.delayedReviews[0].status,'pending_review');
assert.equal(P.submitReview(course,course.delayedReviews[0].id,'duplicate',now),false);
assert.equal((P.calendar(course.delayedReviews,'ar',now).match(/BEGIN:VEVENT/g)||[]).length,3);
for(const n of [1,22])for(const lang of ['ar','en']){
 const c=P.content[n][lang];assert.equal(c.solution.length,4);assert.equal(c.reasons.length,4);
 assert.equal(c.completion.length,3);assert.equal(c.changeOptions.length,3);assert.equal(c.compare.length,2);
 assert(c.transfer&&c.rule&&c.keys.length>=2);
}
assert(P.content[22].ar.changeWhy.includes('لا يعني'));
assert(P.calendar(course.delayedReviews,'ar',now).split('\r\n').every(l=>Buffer.byteLength(l)<=75));
// Exercise rendered controls: failures return to the example; pending essays do not pass.
function fixture(){
 let nodes=[];
 class Element{
  constructor(attrs={}){this.attrs=attrs;this.dataset={};this.value='';for(const [k,v] of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;}
  set innerHTML(html){this.html=html;if(this.root)nodes=[];for(const tag of html.match(/<[a-z][^>]*>/gi)||[]){const a={};for(const m of tag.matchAll(/([a-z-]+)="([^"]*)"/gi))a[m[1]]=m[2];nodes.push(new Element(a));}}
  get innerHTML(){return this.html||'';}
  querySelector(selector){return this.querySelectorAll(selector).slice(-1)[0]||null;}
  querySelectorAll(selector){if(selector.startsWith('#'))return nodes.filter(n=>n.attrs.id===selector.slice(1));const m=selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);return m?nodes.filter(n=>n.attrs[m[1]]!==undefined&&(m[2]===undefined||n.attrs[m[1]]===m[2])):[];}
 }
 const host=new Element();host.root=true;return host;
}
global.LEX_QUALITY=Q;
for(const lang of ['ar','en']){
 const host=fixture(),c={};assert.equal(P.mount(host,1,lang,{course:c}),false);assert.equal(host.innerHTML,'');
 P.mount(host,1,lang,{course:c,reviewMode:true});
 host.querySelector('#readExample').onclick();
 for(let i=0;i<2;i++){host.querySelector('[data-pilot-option="1"]').onclick();host.querySelector('#pilotNext').onclick();}
 assert(host.querySelector('#readExample'));
 host.querySelector('#readExample').onclick();
 for(let i=0;i<2;i++){host.querySelector('[data-pilot-option="0"]').onclick();host.querySelector('#pilotNext').onclick();}
 const st=c.pilotLessons['s1-'+P.version];assert.equal(st.step,3);
 for(let step=3;step<6;step++){
  host.querySelector('#pilotAnswer').value='An answer requiring a human decision';host.querySelector('#pilotSubmit').onclick();
  assert.equal(st.step,step);assert.equal(st.attempts.slice(-1)[0].score,null);assert.equal(st.pending,true);
  host.querySelector('#reviewPass').onclick();
 }
 assert.equal(st.step,6);assert.equal(c.delayedReviews.length,2);
}
for(const lang of ['ar','en']){
 const host=fixture(),course={};let completed=0,finished;
 P.mount(host,22,lang,{course,reviewMode:true,onComplete:s=>{completed++;finished=s;}});
 host.querySelector('#readExample').onclick();
 for(const step of [1,2]){host.querySelector('[data-pilot-option="0"]').onclick();host.querySelector('#pilotNext').onclick();}
 for(const step of [3,4,5]){host.querySelector('#pilotAnswer').value='A reasoned answer';host.querySelector('#pilotSubmit').onclick();host.querySelector('#reviewPass').onclick();}
 assert.equal(completed,1);assert.equal(finished.step,6);assert.equal(course.delayedReviews,undefined,'the course completion callback owns scheduling');
}
// Reviewer UI never opens draft questions for unauthenticated/inactive/student profiles.
(async()=>{
 const saved=[];
 let override=null;
 global.LEX_CLOUD={isConfigured:()=>true,recordAttempt:async row=>{saved.push(row);return {id:'attempt-1'};},gradePilot:async data=>{assert.equal(data.attempt_id,'attempt-1');return {status:'scored',passed:false};},db:()=>({from:table=>{assert(['pilot_human_grades','pilot_ai_grades'].includes(table));return {select:()=>({eq:()=>({maybeSingle:async()=>({data:table==='pilot_ai_grades'?{status:'scored',passed:false,feedback:'راجِع شرط الولادة الحية قبل تقرير النتيجة.'}:override})})})};}})};
 assert.equal(await P.persistAttempt(1,'step4','قاعدة صحيحة ومفاتيح مستقلة','recall'),'attempt-1');
 assert.equal(saved[0].score,null);assert.equal(saved[0].grading_method,'pilot_human_pending');
 assert.equal(saved[0].selected_option,'pilot:s1:step4:'+P.version);
 assert.equal((await P.loadGrade('attempt-1')).passed,false);
 assert.equal((await P.loadGrade('attempt-1')).source,'automatic');
 assert.equal((await P.gradeAttempt('attempt-1','ar')).status,'scored');
 override={passed:true,feedback:'راجع المشرف التطبيق وأكد صحة النتيجة.'};assert.equal((await P.loadGrade('attempt-1')).passed,true);assert.equal((await P.loadGrade('attempt-1')).source,'instructor');
 delete global.LEX_CLOUD;
 for(const profile of [null,{role:'student',active:true},{role:'owner',active:false},{role:'instructor',active:true}]){
  let mounted=false;const controls={innerHTML:'',querySelectorAll:()=>[]},host={innerHTML:''},languageButton={};
  const context={document:{getElementById:id=>id==='pilotControls'?controls:id==='pilotSurface'?host:languageButton,documentElement:{}},LEX_CLOUD:{isConfigured:()=>true,profile:async()=>profile},LEX_PILOT:{mount:()=>{mounted=true;}}};context.window=context;
  await vm.runInNewContext(fs.readFileSync('assets/pilot-review.js','utf8'),context);
  assert.equal(mounted,false);
  assert.equal(controls.innerHTML.includes('data-topic'),profile?.role==='instructor');
 }
 console.log('Pilot release gates, adaptation, delayed reviews, calendar and staff access passed');
})().catch(e=>{console.error(e);process.exit(1);});
