/* LexLearn - progressive legal-case answer guide.
 * Pure client-side presentation: never changes the academic question, source,
 * server-bound item ID, saved record, rubric, or student progress.
 */
(function(root){
"use strict";
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
var map={"الواقعة":"facts","المسألة":"issue","القاعدة":"rule","التطبيق":"application","النتيجة":"conclusion",
 "facts":"facts","fact":"facts","case":"facts","scenario":"facts","issue":"issue","rule":"rule",
 "application":"application","conclusion":"conclusion"};
var headings={ar:["المسألة","القاعدة","التطبيق","النتيجة"],en:["Issue","Rule","Application","Conclusion"]};
var copy={
 ar:{case:"الواقعة",main:"السؤال الرئيسي",intro:"رتّب إجابتك في أربع خطوات قصيرة، خطوة واحدة في كل مرة.",
      step:"خطوة",of:"من",previous:"السابق",next:"التالي",review:"راجع إجابتي",
      send:"احفظ الإجابة وانتقل",edit:"تعديل الإجابة",summary:"إجابتك قبل الحفظ",
      empty:"لم تكتب إجابة لهذا الجزء.",missing:"اكتب إجابتك أو أكمل باقي الخطوات قبل الحفظ.",
      notes:["ما المسألة القانونية التي تحتاج إلى حسم؟","ما القاعدة القانونية المناسبة؟","كيف تنطبق القاعدة على وقائع السؤال؟","ما النتيجة القانونية؟ ولماذا؟"],
      hints:["صِغ السؤال القانوني في جملة واحدة.","اكتب الشرط أو الحكم القانوني بأسلوبك.","اربط ما حدث في الواقعة بالشروط القانونية.","اذكر الإجابة النهائية وسببًا مختصرًا."],
      placeholders:["السؤال القانوني هو...","القاعدة التي أعتمد عليها...","في هذه الواقعة...","إذن... لأن..."],
      defaultQuestion:"ما الحكم القانوني الذي تثيره الواقعة؟",
      guidance:"يمكنك العودة لتعديل أي خطوة. إذا لم تعرف جزءًا، اتركه فارغًا بدل التخمين."},
 en:{case:"Case facts",main:"Main question",intro:"Build your legal answer in four short steps, one at a time.",
      step:"Step",of:"of",previous:"Back",next:"Next",review:"Review my answer",
      send:"Save answer and continue",edit:"Edit answer",summary:"Review before saving",
      empty:"No answer for this section.",missing:"Write your answer or complete the remaining steps before saving.",
      notes:["What legal issue needs to be resolved?","Which legal rule applies?","How does the rule apply to these facts?","What is your conclusion, and why?"],
      hints:["Write the legal question in one sentence.","State the relevant condition in your own words.","Connect the facts to the condition.","Give a clear conclusion with a short reason."],
      placeholders:["The legal issue is...","The rule I rely on is...","Here, the facts show...","Therefore... because..."],
      defaultQuestion:"What legal question do these facts raise?",
      guidance:"Go back to edit any step. If you're unsure about one part, leave it blank rather than guessing."}
};
function parse(prompt,language){
 var parts={},found=0;
 String(prompt||"").split(/\r?\n/).forEach(function(line){
  var match=line.trim().match(/^([^:：]{2,26})\s*[:：]\s*(.+)$/u);
  if(!match)return;
  var key=map[match[1].trim().toLowerCase()];
  if(key&&!parts[key]){parts[key]=match[2].trim();found++;}
 });
 if(found!==5||!parts.facts||!parts.issue||!parts.rule||!parts.application||!parts.conclusion)return null;
 var caseText=parts.facts,breakpoint=caseText.indexOf(". "),facts=caseText,question="";
 // The bank's case statements begin with a factual sentence followed by the
 // actual question. Keep ALL of the remaining question, including qualifiers.
 if(breakpoint>=0){
  facts=caseText.slice(0,breakpoint+1).trim();
  question=caseText.slice(breakpoint+2).trim();
 }
 if(!question){facts=caseText;question=copy[language==="en"?"en":"ar"].defaultQuestion;}
 return {facts:facts,question:question,sections:parts};
}
function compose(parts,language){
 var labels=headings[language==="en"?"en":"ar"];
 return (parts||[]).map(function(s,i){
  var value=String(s||"").trim();
  return value?labels[i]+": "+value:"";
 }).filter(Boolean).join("\n");
}
function mount(host,opts){
 if(!host||!opts)return null;
 var language=opts.language==="en"?"en":"ar",labels=headings[language],c=copy[language];
 var question=parse(opts.prompt,language);
 if(!question)return null;
 var draft=["","","",""],step=0,review=false;
 function saveCurrent(){
  var field=host.querySelector("#legalCasePart");
  if(field&&!review)draft[step]=field.value;
 }
 function render(){
  var bar='<div class="caseSteps" aria-label="'+esc(language==="en"?"Answer progress":"مراحل كتابة الإجابة")+'">'+
   labels.map(function(label,i){return '<span class="caseStep '+(i===step&&!review?"active ":"")+
    (draft[i].trim()?"filled":"")+'" aria-current="'+(i===step&&!review?"step":"false")+'">'+(i+1)+' · '+esc(label)+'</span>';}).join("")+'</div>';
  var top='<div class="caseFacts"><span class="caseEyebrow">'+esc(c.case)+'</span><p>'+esc(question.facts)+'</p></div>'+
   '<div class="caseMainQuestion"><span class="caseEyebrow">'+esc(c.main)+'</span><h3>'+esc(question.question)+'</h3></div>';
  var body=review?
   '<section class="caseAnswerStep"><h3>'+esc(c.summary)+'</h3>'+
   '<div class="caseReview">'+labels.map(function(label,i){return '<div><b>'+esc(label)+'</b><p>'+
     (draft[i].trim()?esc(draft[i].trim()):'<span class="caseEmpty">'+esc(c.empty)+'</span>')+'</p></div>';}).join("")+'</div>'+
   '<p class="caseGuidance">'+esc(c.guidance)+'</p>'+
   '<div class="caseActions"><button type="button" class="caseBack" id="caseBack">'+esc(c.edit)+'</button>'+
   '<button type="button" class="caseNext" id="caseSubmit">'+esc(c.send)+'</button></div></section>':
   '<section class="caseAnswerStep"><div class="caseStepCount">'+esc(c.step)+' '+(step+1)+' '+esc(c.of)+' 4</div>'+
   '<h3>'+esc(labels[step])+'</h3><p class="caseHelp">'+esc(c.notes[step])+'</p>'+
   '<label class="caseHint" for="legalCasePart">'+esc(c.hints[step])+'</label>'+
   '<textarea id="legalCasePart" maxlength="850" rows="5" placeholder="'+esc(c.placeholders[step])+'">'+esc(draft[step])+'</textarea>'+
   '<div class="caseActions">'+(step>0?'<button type="button" class="caseBack" id="caseBack">'+esc(c.previous)+'</button>':'')+
   '<button type="button" class="caseNext" id="caseNext">'+esc(step===3?c.review:c.next)+'</button></div></section>';
  host.innerHTML='<div class="legalCaseGuide" dir="'+(language==="en"?"ltr":"rtl")+'">'+top+
   '<p class="caseIntro">'+esc(c.intro)+'</p>'+bar+body+
   '<p id="caseStatus" class="caseStatus" role="status" aria-live="polite"></p></div>';
  var back=host.querySelector("#caseBack"),next=host.querySelector("#caseNext"),submit=host.querySelector("#caseSubmit");
  if(back)back.onclick=function(){if(review){review=false;step=3;}else{saveCurrent();step--;}render();};
  if(next)next.onclick=function(){saveCurrent();if(step===3)review=true;else step++;render();};
  if(submit)submit.onclick=function(){
   var answer=compose(draft,language);
   if(answer.length<8){host.querySelector("#caseStatus").textContent=c.missing;return;}
   if(typeof opts.onSubmit==="function")opts.onSubmit(answer,submit);
  };
 }
 render();
 return {getAnswer:function(){saveCurrent();return compose(draft,language);},getStep:function(){return step;},getParts:function(){saveCurrent();return draft.slice();}};
}
root.LEX_LEGAL_CASE_GUIDE={parse:parse,compose:compose,mount:mount};
if(typeof module!=="undefined"&&module.exports)module.exports=root.LEX_LEGAL_CASE_GUIDE;
})(typeof window!=="undefined"?window:globalThis);
