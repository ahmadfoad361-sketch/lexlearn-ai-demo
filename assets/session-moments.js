/* Session encouragement: research names appear as quiet attribution; links and research-explanation notes stay off learner cards. */
(function(root){"use strict";
var sources={
 retrieval:{ar:"هنري روديغر وجيفري كاربيك — جامعة واشنطن في سانت لويس · 2006",en:"Henry Roediger & Jeffrey Karpicke — Washington University in St. Louis · 2006",url:"https://pubmed.ncbi.nlm.nih.gov/16507066/"},
 understanding:{ar:"جيفري كاربيك وجانيل بلانت — جامعة بوردو · 2011",en:"Jeffrey Karpicke & Janell Blunt — Purdue University · 2011",url:"https://pubmed.ncbi.nlm.nih.gov/21252317/"},
 spacing:{ar:"جون دنلوسكي وزملاؤه — فريق بحث من جامعات كينت ستيت وديوك وويسكونسن–ماديسون وفيرجينيا · 2013",en:"John Dunlosky and colleagues — Kent State, Duke, Wisconsin–Madison and Virginia universities · 2013",url:"https://doi.org/10.1177/1529100612453266"}
};
var phrases=[
 {source:"retrieval",ar:"محاولة التذكّر ليست اختبارًا فقط؛ إنها فرصة لتثبيت ما تعلمته.",en:"Trying to recall does more than test you; it can strengthen what you have learned."},
 {source:"understanding",ar:"الاسترجاع قد يساعدك على فهم الفكرة، لا على تكرار كلماتها فقط.",en:"Retrieval can help you understand an idea, beyond repeating its words."},
 {source:"spacing",ar:"وزّع مراجعتك على أيام متباعدة؛ فهذا يساعدك على التذكّر على المدى الطويل.",en:"Spread your revision across days to support longer-term recall."},
 {source:"retrieval",ar:"أغلق النص قليلًا، وحاول استرجاع الفكرة؛ التذكّر النشط يدعم بقاءها.",en:"Close the text and try to recall the idea; active retrieval supports retention."},
 {source:"understanding",ar:"أعِد بناء ما تعلمته من ذاكرتك؛ فقد تدعم هذه المحاولة فهمك للعلاقات بين الأفكار.",en:"Reconstruct what you learned from memory; this can support understanding of relationships between ideas."},
 {source:"spacing",ar:"جلسة اليوم خطوة؛ والعودة إلى ما تعلمته لاحقًا تساعد على بقائه.",en:"Today's session is one step; returning to it later helps learning last."},
 {source:"retrieval",ar:"التدرّب على استرجاع ما تعلمته قد يفيدك لاحقًا أكثر من إعادة قراءته وحدها.",en:"Practising recall can benefit later memory more than rereading alone."},
 {source:"understanding",ar:"درّب نفسك على استرجاع المعنى؛ فقد تساعدك هذه الممارسة على إجابة أسئلة تتطلب الفهم.",en:"Practise retrieving meaning; it can help with questions that require understanding."},
 {source:"spacing",ar:"اجمع بين اختبار نفسك والمراجعة المتباعدة؛ فهما من أساليب المذاكرة الفعّالة.",en:"Combine self-testing with spaced revision: two effective study techniques."}
];
var seen=new Set();
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function valid(n){return Number.isInteger(n)&&n>=1&&n<=30;}
function forSession(n,context){
 if(!valid(n))return null;
 var phrase=phrases[(n-1)%phrases.length];
 // Personalize the encouraging theme from confirmed skill estimates only.
 if(context){
  var recall=context.recall,understanding=context.understanding;
  if(typeof recall==="number"&&Number.isFinite(recall)&&recall>=0&&recall<=100&&
    typeof understanding==="number"&&Number.isFinite(understanding)&&understanding>=0&&understanding<=100){
    var target=recall+9<understanding?"retrieval":understanding+9<recall?"understanding":null;
    if(target){var relevant=phrases.filter(function(item){return item.source===target;});if(relevant.length)phrase=relevant[(n-1)%relevant.length];}
  }
 }
 return {ar:phrase.ar,en:phrase.en,source:sources[phrase.source]};
}
function render(n,lang,context){var p=forSession(n,context);if(!p)return "";var en=lang==="en";
 return "<section class='sessionMomentCard' data-moment-session='"+n+"' lang='"+(en?"en":"ar")+"' dir='"+(en?"ltr":"rtl")+"'><img class='sessionMomentMark' src='assets/lexlearn-x-transparent.svg' alt='' width='90' height='90'><span class='sessionMomentBrand' lang='en'>LexLearn</span><p class='sessionMomentKicker'>"+(en?"ONE MORE STEP IN YOUR JOURNEY":"خطوة جديدة في رحلتك")+"</p><h2>"+(en?"You completed session "+n:"أنهيت الجلسة "+n)+"</h2><figure><blockquote>"+esc(en?p.en:p.ar)+"</blockquote><figcaption class='sessionMomentAttribution'>"+esc(en?p.source.en:p.source.ar)+"</figcaption></figure></section>";
}
function show(n,lang,key,context){
 if(!valid(n)||!key||seen.has(key)||!root.document||!root.document.body)return false;
 var storageKey='lex_session_moment_v2_'+key;
 try{if(root.sessionStorage&&root.sessionStorage.getItem(storageKey))return false;}catch(_){}
 var notice=root.document.createElement('div');notice.className='sessionMomentNotice';
 notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 notice.textContent=lang==='en'?'Session '+n+' answers saved. Continue when you are ready.':'حُفظت إجابات الجلسة '+n+'. تابع عندما تكون مستعدًا.';
 var host=root.document.getElementById&&root.document.getElementById('studentTrainingApp');
 (host||root.document.body).appendChild(notice);seen.add(key);
 try{if(root.sessionStorage)root.sessionStorage.setItem(storageKey,'1');}catch(_){}
 root.setTimeout(function(){notice.remove();},3800);return true;
}
var api={sources:sources,phrases:phrases,forSession:forSession,render:render,show:show};root.LEX_SESSION_MOMENTS=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);

