(function(root){
"use strict";
// Learning Keys: a study aid, not an assessment or a legal-grade credential.
function esc(x){return String(x==null?"":x).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function trim(x,max){return String(x==null?"":x).trim().slice(0,max||600);}
function notes(course){if(!course||typeof course!=="object")return {};if(!course.learningKeys||typeof course.learningKeys!=="object"||Array.isArray(course.learningKeys))course.learningKeys={};return course.learningKeys;}
function sourceFor(n){
 var t=root.LEX_QUALITY&&root.LEX_QUALITY.topic?root.LEX_QUALITY.topic(n):null;
 var p=root.LEX_PILOT&&root.LEX_PILOT.content&&root.LEX_PILOT.content[n];
 return {title:t&&t.ar||p&&p.ar&&p.ar.title||"الموضوع "+n,reference:t&&t.ref||"",link:p&&p.source||"https://www.almeezan.qa/LawView.aspx?LawID=2559&language=ar",pilot:p&&p.ar||null};
}
function entry(course,n){
 var all=notes(course),key=String(n);if(!all[key]||typeof all[key]!=="object")all[key]={topic:n,cues:[],reviewedAt:null,updatedAt:null};
 if(!Array.isArray(all[key].cues))all[key].cues=[];
 return all[key];
}
function seed(course,n){
 n=Number(n);if(!Number.isInteger(n)||n<1||n>30)return null;
 var row=entry(course,n),src=sourceFor(n);
 if(src.pilot&&row.cues.length===0){
  (src.pilot.keys||[]).forEach(function(k,i){row.cues.push({id:"reference-"+n+"-"+i,cue:trim(k,120),meaning:trim(src.pilot.rule,600),origin:"pilot_reference",status:"reference",updatedAt:Date.now()});});
  row.updatedAt=Date.now();
 }
 return row;
}
function ingestPilot(course){
 var lessons=course&&course.pilotLessons||{};
 Object.keys(lessons).forEach(function(id){
  var m=/^s(\d+)-/.exec(id),n=m?Number(m[1]):0;
  if(!n)return;
  var row=seed(course,n);
  var attempts=lessons[id]&&lessons[id].attempts||[];
  attempts.filter(function(a){return a&&a.step===4&&a.answer;}).forEach(function(a){
   var key="pilot-"+(a.attemptId||String(a.ts||"")+"-"+trim(a.answer,20));
   if(row.cues.some(function(x){return x.id===key;}))return;
   row.cues.push({id:key,cue:trim(a.answer,260),meaning:"مفاتيح أنشأها الطالب؛ تُراجع مع المصدر أو المشرف.",origin:"student",status:a.status==="reviewed"&&a.score===1?"reviewed":"unverified",updatedAt:Date.now()});
   row.updatedAt=Date.now();
  });
 });
}
function overview(course){
 ingestPilot(course);var ids={};
 (course&&course.completed||[]).forEach(function(n){if(Number.isInteger(Number(n))&&n>=1&&n<=30)ids[n]=true;});
 Object.keys(notes(course)).forEach(function(n){if(Number(n)>=1&&Number(n)<=30)ids[n]=true;});
 return Object.keys(ids).map(Number).sort(function(a,b){return a-b;});
}
function card(course,n){
 var src=sourceFor(n),row=seed(course,n)||entry(course,n);
 return '<article class="keyCard"><header><div><small>الجلسة '+n+' · المواد '+esc(src.reference)+'</small><h3>'+esc(src.title)+'</h3></div><a href="'+esc(src.link)+'" target="_blank" rel="noopener noreferrer">النص القانوني</a></header>'+
 (row.cues.length?row.cues.map(function(c,i){return '<div class="keyItem"><div class="keyCue"><span>المفتاح '+(i+1)+'</span><b>'+esc(c.cue)+'</b></div><button class="secondary smallKeyBtn" data-reveal="'+n+':'+i+'" aria-expanded="false">أظهر المعنى</button><p class="keyMeaning" id="key-meaning-'+n+'-'+i+'" hidden>'+esc(c.meaning||"اربط هذا المفتاح بمعناه القانوني من المقرر.")+'</p><small class="keyStatus">'+(c.status==="reference"?"مفتاح مرجعي للتدريب - لا يعني الإتقان":c.status==="reviewed"?"راجعته جهة التصحيح في المحاولة السابقة":"مفتاح شخصي؛ يحتاج مراجعة قانونية")+'</small></div>';}).join(""):'<p class="keyEmpty">مفيش مفاتيح محفوظة للموضوع ده بعد. اكتب أول مفتاح بمعناه.</p>')+
 '<form class="keyEditor" data-topic="'+n+'"><label>مفتاح جديد أو عبارة قصيرة<input name="cue" maxlength="130" required placeholder="مثال: ولادة حية ← بداية الشخصية" autocomplete="off"></label><label>معنى المفتاح وعلاقته بالقاعدة<textarea name="meaning" maxlength="650" required placeholder="اشرح متى ينطبق المفتاح، وما الشرط القانوني المرتبط به."></textarea></label><button class="primary" type="submit">احفظ المفتاح</button></form></article>';
}
function render(course){
 var ids=overview(course);var now=Date.now();
 return '<section class="keysPage" aria-label="نوتة المفاتيح"><div class="keysIntro"><span class="kicker">My Learning Keys</span><h1>نوتة المفاتيح</h1><p>مفاتيح قصيرة تساعدك على تذكّر عناصر المقرر وفهم معناها، ثم تطبيق القاعدة وبناء إجابة مقالية. المرجع الأساسي هو مقرر الجامعة والنص القانوني.</p><div class="keyCycle"><span>مفتاح مرتبط بمعنى</span><span>استرجاع دون مساعدة</span><span>تفسير وتطبيق</span><span>إجابة مقالية</span></div><p class="keysWarning">النوتة للمذاكرة بين الجلسات فقط، وليست جزءًا من درجة الاختبار. إظهار المعنى أو حفظ مفتاح لا يُثبت الإتقان. أثناء التقييم لا تظهر المفاتيح.</p></div>'+
 (ids.length?'<div class="keysGrid">'+ids.map(function(n){return card(course,n);}).join("")+'</div>':'<div class="keyEmptyBox"><h2>ابدأ بأول جلسة</h2><p>بعد التدريب على موضوع، ستظهر هنا المفاتيح المرجعية المتاحة ومفاتيحك الشخصية.</p></div>')+
 '<footer class="keysFooter"><button type="button" class="secondary" id="keysBack">العودة للبرنامج</button><p>آخر تحديث: '+new Date(now).toLocaleDateString("ar-EG")+'</p></footer></section>';
}
function bind(course,onSave,onBack){
 document.querySelectorAll(".keyEditor").forEach(function(f){f.onsubmit=function(e){
  e.preventDefault();var n=Number(f.dataset.topic),cue=trim(f.elements.cue.value,130),meaning=trim(f.elements.meaning.value,650);
  if(!cue||!meaning)return;
  var row=entry(course,n);row.cues.push({id:"personal-"+Date.now()+"-"+row.cues.length,cue:cue,meaning:meaning,origin:"student",status:"unverified",updatedAt:Date.now()});row.updatedAt=Date.now();
  onSave();f.reset();var parent=f.closest(".keyCard");if(parent){var fresh=document.createElement("div");fresh.innerHTML=card(course,n);parent.replaceWith(fresh.firstChild);}bind(course,onSave,onBack);
 };});
 document.querySelectorAll("[data-reveal]").forEach(function(btn){btn.onclick=function(){var id=btn.dataset.reveal.split(":"),el=document.getElementById("key-meaning-"+id[0]+"-"+id[1]);if(!el)return;el.hidden=!el.hidden;btn.textContent=el.hidden?"أظهر المعنى":"أخفِ المعنى";btn.setAttribute("aria-expanded",String(!el.hidden));};});
 var back=document.getElementById("keysBack");if(back)back.onclick=onBack;
}
root.LEX_KEYS={notes:notes,seed:seed,ingestPilot:ingestPilot,overview:overview,render:render,bind:bind};
if(typeof module!=="undefined")module.exports=root.LEX_KEYS;
})(typeof window!=="undefined"?window:globalThis);
