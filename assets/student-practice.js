/* Signed-in, NON-CREDIT rehearsal while independently reviewed academic content is locked.
   Never writes official diagnostic tables, learner snapshots, releases, grades or milestones. */
(function(root){
"use strict";
var Q=[],D,COURSE="qa-qu-lawc101-rights";
function tr(ar,en){return new URLSearchParams(root.location.search).get("lang")==="en"?en:ar;}
function lang(){return new URLSearchParams(root.location.search).get("lang")==="en"?"en":"ar";}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function plans(rows){
 var c={recognition:{correct:0,total:0},understanding:{correct:0,total:0},application:{correct:0,total:0}};
 rows.forEach(function(r){if(c[r.dimension]&&r.selected>=0){c[r.dimension].total++;if(r.correct)c[r.dimension].correct++;}});
 var pct=function(x){return x.total?Math.round(100*x.correct/x.total):null;};
 var r=pct(c.recognition),u=pct(c.understanding),a=pct(c.application),mode="foundation";
 if(c.recognition.total>=2&&c.understanding.total>=2){
  mode=r<45&&u<45?"foundation":r-u>=25?"recall-led":u-r>=25?"understanding-led":"balanced";
 }
 return {mode:mode,recognition:r,understanding:u,application:a,
  order:mode==="recall-led"?["understanding","exam","recall"]:mode==="understanding-led"?["recall","understanding","exam"]:mode==="balanced"?["exam","understanding","recall"]:["understanding","recall","exam"]};
}
var tasks={
 recall:{titleAr:"استرجاع القاعدة",titleEn:"Recall the legal rule",
  promptAr:"من ذاكرتك، وضّح متى تبدأ الشخصية القانونية للإنسان ومتى تنتهي، ثم اذكر مثالًا لحق قد يثبت للحمل بشروط.",
  promptEn:"Without looking at a source, explain when legal personality begins and ends, then give an example of a conditional prenatal right.",
  helpAr:"استخدم مفاتيح قصيرة ثم أعد صياغة القاعدة بنفسك.",helpEn:"Use short memory cues, then reconstruct the rule in your own words."},
 understanding:{titleAr:"اشرح السبب",titleEn:"Explain the reasoning",
  promptAr:"وُلد طفل حيًا ثم تُوفي بعد ساعات. هل كانت له شخصية قانونية؟ اشرح السبب القانوني دون الاكتفاء بنعم أو لا.",
  promptEn:"A child was born alive and died a few hours later. Did legal personality arise? Explain why, rather than answering yes or no.",
  helpAr:"اربط واقعة الولادة الحية بالقاعدة والنتيجة.",helpEn:"Link the live birth facts to the rule and result."},
 exam:{titleAr:"بناء الإجابة الامتحانية",titleEn:"Structure an exam answer",
  promptAr:"في واقعة افتراضية، تقرر حق مالي لحمل، ثم وُلد حيًا. نظّم الإجابة تحت أربعة عناوين: المسألة، القاعدة، التطبيق، النتيجة.",
  promptEn:"In a hypothetical case, a financial right is reserved for an unborn child who is subsequently born alive. Answer using Issue, Rule, Application and Conclusion.",
  helpAr:"حدد الشرط القانوني ثم طبّقه على الواقعة قبل كتابة النتيجة.",helpEn:"Identify the legal condition, apply it to the facts, then state the conclusion."}
};
function hint(answer){
 var s=String(answer||"").replace(/[إأآىة]/g,function(c){return {"إ":"ا","أ":"ا","آ":"ا","ى":"ي","ة":"ه"}[c]||c;}).toLowerCase();
 if(s.trim().length<12)return null;
 var birth=/(ولاد|ولد|born|birth)/.test(s)&&/(حي|live|alive)/.test(s);
 var person=/(شخص|personality)/.test(s);
 var conditional=/(شرط|حمل|جنين|حق|condition|unborn|rights?)/.test(s);
 var score=(birth?50:0)+(person?25:0)+(conditional?25:0);
 return {covered:score,needsReview:true};
}
async function mount(){
 var node=root.document.getElementById("studentPractice");if(!node)return;
 D=root.LEX_OFFICIAL_DIAGNOSTIC;Q=D&&D.QUESTIONS||[];
 if(!D||Q.length!==6){node.textContent=tr("تعذر تحميل بنك التدريب.","Practice bank unavailable.");return;}
 node.innerHTML="<p role='status'>"+tr("جارٍ التحقق من حساب الطالب...","Checking student identity...")+"</p>";
 var uid,cloud=root.LEX_CLOUD;
 try{
  uid=await D.identity(cloud);
  var status=await cloud.studentLifecycleRpc("status",{courseId:COURSE});
  if(status.status==="completed"){node.innerHTML="<p>"+tr("لديك تشخيص رسمي محفوظ بالفعل. افتح البرنامج الرسمي.","Your official diagnostic is already saved. Go to the official program.")+"</p><a href='program"+(lang()==="en"?"-en":"")+".html?country=qa&subject=rights'>"+tr("افتح البرنامج","Open program")+"</a>";return;}
 }catch(e){node.innerHTML="<p role='alert'>"+tr("يجب تسجيل الدخول بحساب طالب نشط ومُسجّل في المقرر. ","A verified enrolled student account is required. ")+esc(e.message||e)+"</p><a href='student-login"+(lang()==="en"?"-en":"")+".html'>"+tr("دخول الطالب","Sign in")+"</a>";return;}
 var key="lex_practice_noncredit_v1_"+uid+"_"+COURSE,store=root.sessionStorage;
 var state={pos:0,rows:[],free:"",plan:null,taskIndex:0,responses:{}};
 try{
  var old=JSON.parse(store.getItem(key)||"null");
  if(old&&old.user_id===uid&&Number.isInteger(old.pos)&&old.pos>=0&&old.pos<=6&&Array.isArray(old.rows)&&old.rows.length===old.pos&&old.rows.every(function(r,i){return Q[i]&&Q[i].id===r.id;})&&old.responses&&typeof old.responses==="object"){
   state={pos:old.pos,rows:old.rows,free:String(old.free||""),plan:old.plan||null,taskIndex:Math.max(0,Math.min(3,Number(old.taskIndex)||0)),responses:old.responses};
  }
 }catch(_){}
 function remember(){try{store.setItem(key,JSON.stringify(Object.assign({user_id:uid},state)));}catch(_){}}
 var banner="<p class='practice-warning' role='note'>"+tr(
 "مسار تدريبي خاص بحساب الطالب — غير معتمد أكاديميًا. لا تدخل النتائج في الدرجة الرسمية، ولا تُرسل إلى المشرف. تُحفظ مؤقتًا في هذه الجلسة على جهازك فقط. الديمو العام منفصل.",
 "Signed-in student rehearsal — NOT academically approved. No official grades or supervisor submission. Temporary data stays in this browser tab only. The public demo is separate.")+"</p>";
 function render(){
  if(!state.plan)return renderDiagnostic();
  renderTraining();
 }
 function renderDiagnostic(){
  var done=state.pos===Q.length,q=Q[state.pos];
  var html=banner+"<p class='counter'>"+tr("التقييم التدريبي","Practice diagnostic")+" · "+(state.pos+1)+" / 7</p>";
  if(!done){
   html+="<h2>"+esc(q[lang()])+"</h2><fieldset>"+q[lang()+"Options"].map(function(a,i){return "<label class='choice'><input type='radio' name='practiceAnswer' value='"+i+"'>"+esc(a)+"</label>";}).join("")+
     "<label class='choice'><input type='radio' name='practiceAnswer' value='-1'>"+tr("لا أدري — لا تُحتسب صفرًا","Not sure — not treated as zero")+"</label></fieldset>";
  }else{
   html+="<h2>"+tr("إجابة حرة اختيارية","Optional free recall")+"</h2><p>"+tr("اكتب القاعدة بلغتك. تقييم النص هنا تجريبي، ولا يُعتمد كدرجة قانونية.","Write the rule in your words. The free-text analysis is only a rehearsal, not a legal grade.")+"</p><textarea id='practiceFree' rows='5' maxlength='2000'></textarea>";
  }
  html+="<button type='button' id='practiceNext'>"+(done?tr("حلّل إجاباتي وابدأ المستوى التدريبي الأول","See my plan and start first practice level"):tr("السؤال التالي","Next question"))+"</button><p role='alert' id='practiceError'></p>";
  node.innerHTML=html;
  if(done){node.querySelector("#practiceFree").value=state.free;node.querySelector("#practiceFree").oninput=function(){state.free=this.value;remember();};}
  node.querySelector("#practiceNext").onclick=function(){
   if(!done){
    var selected=node.querySelector('input[name="practiceAnswer"]:checked');
    if(!selected){node.querySelector("#practiceError").textContent=tr("اختر إجابة أو لا أدري.","Choose an answer or Not sure.");return;}
    var p=Number(selected.value);
    state.rows.push({id:q.id,dimension:q.dimension,selected:p,correct:p===q.a});
    state.pos++;remember();render();return;
   }
   state.plan=plans(state.rows);state.taskIndex=0;remember();render();
  };
 }
 function format(v){return v==null?tr("غير مقاس","Not measured"):v+"%";}
 function renderTraining(){
  var p=state.plan,idx=state.taskIndex,t=p.order[idx];
  var summary=banner+"<h2>"+tr("تحليل أولي لإجاباتك","Provisional analysis of your answers")+"</h2>"+
   "<div class='metrics'><span>"+tr("التعرف على القاعدة","Recognition")+": <b>"+format(p.recognition)+"</b></span><span>"+tr("الفهم","Understanding")+": <b>"+format(p.understanding)+"</b></span><span>"+tr("التطبيق","Application")+": <b>"+format(p.application)+"</b></span><span>"+tr("الحفظ الحر","Free recall")+": <b>"+tr("غير معتمد","Uncertified")+"</b></span></div>"+
   "<p>"+(p.mode==="recall-led"?tr("التعرف أقوى من الفهم؛ سنبدأ بتفسير القانون.","Recognition is stronger; we begin with explanation."):p.mode==="understanding-led"?tr("الفهم أقوى من التعرف؛ سنبدأ بالاسترجاع.","Understanding is stronger; we begin with retrieval."):p.mode==="balanced"?tr("سنبدأ بالتطبيق ثم الفهم والاسترجاع.","Start with application, then explanation and retrieval."):tr("الأدلة غير كافية لتحديد قوة مؤكدة؛ نبدأ بخطوة تأسيسية.","Insufficient evidence; begin with a supported foundation."))+"</p>";
  if(idx>=3){
   node.innerHTML=summary+"<h2>"+tr("اكتملت الجلسة التدريبية الأولى","First practice session complete")+"</h2><p>"+tr("حُفظت مسودات التدريب داخل جلسة المتصفح فقط. هذا ليس إنجازًا أكاديميًا ولا يفتح المستوى الثاني.","Practice answers were kept within this browser session only. This is not academic completion and cannot unlock level two.")+"</p><a href='student"+(lang()==="en"?"-en":"")+".html'>"+tr("حساب الطالب","Student account")+"</a>";
   return;
  }
  var task=tasks[t];
  var previous=p.order.slice(0,idx).map(function(id){
   var a=state.responses[id],h=hint(a);
   return "<section class='done'><b>"+esc(lang()==="en"?tasks[id].titleEn:tasks[id].titleAr)+"</b><p>"+tr("إجابة محفوظة مؤقتًا. ","Answer saved temporarily. ")+
    (h?tr("تغطية مؤشرات نصية تجريبية: ","Provisional keyword coverage: ")+h.covered+"% — "+tr("تحتاج مراجعة معنى الإجابة.","meaning needs review.") :tr("لا تتوفر أدلة كافية لتقدير نسبة.","Insufficient evidence for a percentage."))+"</p></section>";
  }).join("");
  node.innerHTML=summary+"<p class='counter'>"+tr("المستوى الأول التدريبي • مهمة ","Practice level 1 • Task ")+(idx+1)+" / 3</p>"+
   previous+"<h2>"+esc(lang()==="en"?task.titleEn:task.titleAr)+"</h2><p>"+esc(lang()==="en"?task.helpEn:task.helpAr)+"</p><div class='prompt'>"+esc(lang()==="en"?task.promptEn:task.promptAr)+"</div>"+
   "<label for='taskAnswer'>"+tr("إجابتك الحرة","Your free-text answer")+"</label><textarea id='taskAnswer' rows='6' maxlength='4000'></textarea>"+
   "<button type='button' id='taskNext'>"+tr("احفظ مؤقتًا وانتقل للتدريب التالي","Save locally and continue")+"</button><p role='alert' id='practiceError'></p>";
  node.querySelector("#taskAnswer").value=state.responses[t]||"";
  node.querySelector("#taskNext").onclick=function(){
   var a=node.querySelector("#taskAnswer").value.trim();
   if(a.length<8){node.querySelector("#practiceError").textContent=tr("اكتب إجابة من ثمانية أحرف على الأقل.","Write at least eight characters.");return;}
   state.responses[t]=a;state.taskIndex++;remember();render();
  };
 }
 render();
}
var api={mount:mount,plans:plans,hint:hint,tasks:tasks};
root.LEX_STUDENT_PRACTICE=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
