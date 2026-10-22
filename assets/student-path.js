/* LexLearn: authenticated, server-gated, founder-authorized 30-session internal pilot.
 * The four-task public demo and browser local scores never enter this student path.
 * Heuristic rubric coverage is labelled provisional: it is not LLM semantic grading.
 */
(function(root){
"use strict";
var COURSE="qa-qu-lawc101-rights",host=root.document.getElementById("studentTrainingApp");
function lang(){return new URLSearchParams(root.location.search).get("lang")==="en"?"en":"ar";}
function t(ar,en){return lang()==="en"?en:ar;}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function url(n){return "student-path.html?lang="+lang()+(n?"&session="+n:"");}
function noHtmlScore(value){return typeof value==="number"&&isFinite(value)?Math.round(Math.max(0,Math.min(100,value)))+"%":t("غير قابل للتقدير","Not reliably measurable");}
function weakName(s){return {recall:t("الحفظ","Recall"),understanding:t("الفهم","Understanding"),exam_execution:t("بناء الإجابة","Exam answer structure")}[s]||t("التأسيس","Foundations");}
function byId(a,id){return (a||[]).find(function(x){return x.item_id===id;});}
function provisionalSkillPlan(rows){
 var api=root.LEX_SKILL_POLICY;if(!api)return null;
 function skill(dim){
  var scores=(rows||[]).filter(function(x){return x.dimension===dim&&x.evaluation&&x.evaluation.status==="preliminary_internal"})
   .map(function(x){return x.evaluation.provisional_percent;})
   .filter(function(v){return typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100;});
  return scores.length?{value:scores.reduce(function(a,b){return a+b;},0)/scores.length,
   evidence:scores.length,measured:true,provisional:true,method:"lexical_rubric_coverage_v1",status:"preliminary_internal"}:null;
 }
 return api.policy({recall:skill("recall"),understanding:skill("understanding")});
}
function adaptiveGuidance(data,rows,task){
 var p=data&&data.skill_policy||provisionalSkillPlan(rows);
 if(!p||!root.LEX_SKILL_POLICY)return "";
 var txt=data&&task&&(lang()==="en"?task.instruction_en:task.instruction_ar);
 if(!txt)txt=root.LEX_SKILL_POLICY.exercise(p,task&&task.dimension,lang());
 return "<aside class='scope' role='note'><b>"+t("طريقة التدريب المقترحة: ","Suggested learning approach: ")+"</b>"+esc(txt)+
 "<p>"+t("هذا توجيه تدريبي قابل للتعديل، وليس تصنيفًا ثابتًا لشخصيتك أو إثباتًا لإتقان المادة.",
 "This is provisional practice guidance, not a fixed learning style or confirmed mastery.")+"</p></aside>";
}

function previousAnswerTitle(item,task){
  var dimension=(task&&task.dimension)||(item&&item.dimension);
  var localizedTitle=task&&(lang()==="en"?task.title_en:task.title_ar);
  return t("إجابتك السابقة — ","Your previous answer — ")+weakName(dimension)+(localizedTitle?" · "+String(localizedTitle):"");
}
function feedback(item){
 var ev=item&&item.evaluation||{},provisional=noHtmlScore(ev.provisional_percent);
 return "<div class='feedback' role='status'><b>"+t("تغطية مبدئية لعناصر القاعدة: ","Provisional legal-rule coverage: ")+esc(provisional)+"</b>"+
 "<p>"+esc((lang()==="en"?ev.feedback_en:ev.feedback_ar)||t("يلزم التأكد من المعنى القانوني مع مراجعة علمية.","Legal meaning still needs independent review."))+"</p>"+
 "<small>"+t("تقدير أولي لتغطية عناصر القاعدة، وقد لا يلتقط بعض الصياغات أو الاستثناءات. راجع الملاحظات مع المشرف عند الحاجة.","Preliminary coverage of rule elements may miss paraphrases or exceptions. Discuss the feedback with your instructor when needed.")+"</small></div>";
}
function progressModel(rows,session){
 var start=Math.floor((session-1)/5)*5+1,checkpoint=session%5===0;
 function metric(dim,from,to){
  var all=(rows||[]).filter(function(x){return x.dimension===dim&&x.session_number>=from&&x.session_number<=to;});
  var scored=all.map(function(x){return x.evaluation&&x.evaluation.provisional_percent;}).filter(function(v){return typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100;});
  return {score:scored.length?Math.round(scored.reduce(function(a,b){return a+b;},0)/scored.length):null,assessed:scored.length,total:all.length};
 }
 var skills=["recall","understanding"].map(function(dim){
  var current=metric(dim,session,session),earlier=metric(dim,start,session-1);
  return {dimension:dim,current:current,earlier:earlier,change:current.score!==null&&earlier.score!==null?current.score-earlier.score:null};
 });
 return {level:Math.ceil(session/5),checkpoint:checkpoint,skills:skills,needsReview:skills.filter(function(x){return x.current.score===null||x.current.score<70||x.current.assessed<x.current.total;}).map(function(x){return x.dimension;})};
}
function progressHtml(rows,session,historyAvailable){
 var m=progressModel(rows,session);
 return "<section class='progressReport' aria-label='"+t("ملخص تقدمك","Your progress report")+"'><h2>"+
 (m.checkpoint?t("نتيجة المستوى ","Level result ")+m.level:t("ملخص الجلسة ","Session summary ")+session)+"</h2>"+
 "<p class='completionState'>✓ "+(m.checkpoint?t("أتممت مهام هذا المستوى وتقييمه.","You completed this level and its checkpoint."):t("أتممت مهام هذه الجلسة.","You completed this session's tasks."))+"</p>"+
 "<div class='progressSkills'>"+m.skills.map(function(x){
  var v=x.current.score;
  return "<article class='progressSkill'><h3>"+esc(weakName(x.dimension))+"</h3><strong>"+noHtmlScore(v)+"</strong>"+
  (v===null?"":"<div class='skillMeter' role='progressbar' aria-label='"+esc(weakName(x.dimension))+"' aria-valuemin='0' aria-valuemax='100' aria-valuenow='"+v+"'><i style='width:"+v+"%'></i></div>")+
  "<p>"+t("إجابات جرى تقييمها: ","Assessed answers: ")+x.current.assessed+" / "+x.current.total+"</p>"+
  (historyAvailable&&x.earlier.total?"<p>"+t("متوسط التدريب السابق في المستوى: ","Earlier practice average in this level: ")+noHtmlScore(x.earlier.score)+"</p>":"")+
  (historyAvailable&&x.change!==null?"<p class='scoreChange'>"+t("تغيّر المؤشر: ","Indicator change: ")+(x.change>0?"+":"")+x.change+t(" نقطة"," points")+"</p>":"")+"</article>";
 }).join("")+"</div>"+
 "<p class='nextAdvice'><b>"+t("خطوتك التالية: ","Your next step: ")+"</b>"+
 (m.needsReview.length?t("راجع ملاحظات ","Review the feedback for ")+m.needsReview.map(weakName).join(t(" و"," and "))+t(" وأعد المحاولة قبل الاعتماد على هذا المؤشر."," and practise again before relying on this estimate."):t("يمكنك متابعة التدريب مع الاحتفاظ بملاحظاتك للمراجعة.","Continue practising and keep your feedback for later review."))+"</p>"+
 (!historyAvailable?"<p>"+t("تعذر تحميل المقارنة السابقة؛ المعروض هنا من إجابات هذه الجلسة المحفوظة فقط.","Earlier comparison could not load; the results shown use only this session's saved answers.")+"</p>":"")+
 "<small>"+t("النسب مؤشرات أولية لتغطية عناصر الإجابة، وليست درجات إتقان معتمدة. المقارنة بين مهام مختلفة لا تثبت وحدها تحسن التعلم. نوصي بالمراجعة إذا قل المؤشر عن 70% أو بقيت إجابات دون تقدير.","Percentages are preliminary answer-coverage indicators, not certified mastery scores. Comparing different tasks alone does not establish learning gains. Review is recommended below 70% or when answers remain ungraded.")+"</small></section>";
}
async function boot(){
 if(!host)return;
 var cloud=root.LEX_CLOUD;
 function show(x){host.innerHTML=x;}
 function reportError(e){show("<p role='alert'>"+t("تعذر تحميل تدريبك الآن. تحقق من اتصالك ثم حاول مجددًا، أو سجّل الدخول إلى حسابك. ","Your training could not be loaded. Check your connection and try again, or sign in to your account. ")+"</p><a href='student-login"+(lang()==="en"?"-en":"")+".html'>"+t("دخول الطالب","Sign in")+"</a>");}
 show("<p role='status'>"+t("جارٍ تحميل تدريبك المحفوظ...","Loading your saved training...")+"</p>");
 try{
  var uid=await root.LEX_OFFICIAL_DIAGNOSTIC.identity(cloud);
  var overview=await cloud.studentLifecycleRpc("trainingOverview",{courseId:COURSE});
  if(!overview||!overview.allowed){
    show("<p>"+t("ابدأ التقييم التشخيصي أولًا حتى تتكوّن خطتك.","Complete the diagnostic first to create your individual plan.")+"</p><a href='diagnostic.html?lang="+lang()+"'>"+t("ابدأ التشخيص","Start diagnostic")+"</a>");return;
  }
  var selected=Number(new URLSearchParams(root.location.search).get("session"));
  if(!Number.isInteger(selected)||selected<1||selected>30||selected>overview.unlocked)selected=overview.unlocked;
  var data=null,busy=false,progressRows=[],historyAvailable=false;
  async function loadProgress(){
   progressRows=(data.saved||[]).map(function(x){return Object.assign({},x,{session_number:selected});});historyAvailable=false;
   try{
    var client=cloud.db(),from=Math.floor((selected-1)/5)*5+1;
    var response=await client.from("student_training_answers").select("session_number,item_id,dimension,evaluation").eq("user_id",uid).eq("course_id",COURSE).gte("session_number",from).lte("session_number",selected).order("session_number",{ascending:true}).limit(250);
    if(response.error||!Array.isArray(response.data))return;
    var prior=response.data.filter(function(x){return x.session_number<selected;});
    progressRows=prior.concat(progressRows);historyAvailable=true;
   }catch(_){}
  }
  var programLabels=Array.from({length:30},function(_,i){return (i+1)%5===0?
    t("تقييم ومراجعة الأسبوع ","Week checkpoint ")+Math.ceil((i+1)/5):
    t("الجلسة ","Session ")+(i+1);});
  function nav(){
   return "<div class='heading'><div><b>"+t("مسارك التدريبي المتكيف","Your adaptive learning path")+"</b><p>"+t("المقرر: نظرية الحق • 6 أسابيع • 30 جلسة • نتائج لكل طالب","Theory of Rights • 6 weeks • 30 sessions • individual results")+"</p></div><a href='student"+(lang()==="en"?"-en":"")+".html'>"+t("حساب الطالب","Student account")+"</a></div>"+
   "<p class='scope' role='note'>"+t("تدريب يتكيف مع أدائك، مع حفظ إجاباتك وتقدمك في حسابك. النتائج مؤشرات تدريبية قابلة لمراجعة المشرف، وليست درجات جامعية معتمدة.","Practice adapts to your performance, with answers and progress saved to your account. Results are training indicators subject to instructor review, not certified university marks.")+"</p>"+
   "<p class='overview'>"+t("التقدم المحفوظ: ","Verified practice progress: ")+overview.completed_count+" / 30 · "+t("الجلسة الحالية: ","Current session: ")+overview.unlocked+"</p>"+
   "<div class='levelStrip'>"+Array.from({length:6},function(_,i){
    var level=i+1,start=i*5+1,end=level*5,done=overview.completed_count>=end,unlocked=overview.unlocked>=start;
    var label=t("المستوى ","Level ")+level+(done?t(" · مكتمل ✓"," · completed ✓"):t(" · "," · ")+Math.max(0,Math.min(5,overview.completed_count-i*5))+" / 5");
    return unlocked?"<a class='levelCard "+(done?"complete":"")+"' href='"+url(done?end:Math.min(end,overview.unlocked))+"'>"+label+"</a>":"<span class='levelCard locked' aria-disabled='true'>"+label+" 🔒</span>";
   }).join("")+"</div><details class='allSessions'><summary>"+t("عرض جلسات البرنامج الثلاثين","Show all 30 programme sessions")+"</summary><div class='sessionGrid'>"+programLabels.map(function(v,i){
    var n=i+1,done=n<=overview.completed_count,active=n===selected,locked=n>overview.unlocked;
    return locked?"<span class='session locked' aria-disabled='true'>"+esc(v)+" 🔒</span>":
    "<a class='session "+(done?"complete ":"")+(active?"active":"")+"' href='"+url(n)+"'>"+esc(v)+(done?" ✓":"")+"</a>";
   }).join("")+"</div></details>";
  }
  async function open(n){
   busy=true;show(nav()+"<p role='status'>"+t("جارٍ تأكيد صلاحية الجلسة...","Verifying session access...")+"</p>");
   try{
    var result=await cloud.studentLifecycleRpc("trainingOpen",{courseId:COURSE,session:n});
    if(!result||!result.allowed||!Array.isArray(result.tasks)||!Array.isArray(result.saved))throw Error(result&&result.reason||"invalid_session");
    selected=n;data=result;await loadProgress();busy=false;render();
   }catch(e){reportError(e);}
  }
  function render(){
   if(!data)return;
   var saved=data.saved||[],next=(data.tasks||[]).find(function(q){return !byId(saved,q.id);}),completed=data.completed;
   var name=t("الأسبوع ","Week ")+Math.ceil(selected/5)+" · "+programLabels[selected-1];
   var why="<p>"+t("الأولوية الحالية حسب التشخيص والتدريب المحفوظ: ","Current priority from diagnostic and saved performance: ")+"<b>"+esc(weakName(data.weakest))+"</b>. "+
    t("لذلك يختلف ترتيب الأسئلة بين الطلاب، ويعاد حسابه في الجلسات التالية.","Task order changes with each learner's measured practice; it is recalculated for later sessions.")+"</p>";
   var completedFeedback=saved.map(function(v){
    var task=(data.tasks||[]).find(function(q){return q.id===v.item_id;});
    return "<details class='past'><summary>"+esc(previousAnswerTitle(v,task))+"</summary><p style='white-space:pre-wrap'>"+esc(v.answer_text)+"</p>"+feedback(v)+"</details>";
   }).join("");
   var main="<section class='stage'><h1>"+esc(name)+"</h1>"+why+
    "<p>"+t("أُرسلت ","Saved ")+saved.length+" / "+data.tasks.length+t(" إجابات محفوظة في حسابك."," answers to your account.")+"</p>"+
    completedFeedback;
   if(completed){
    main+=progressHtml(progressRows,selected,historyAvailable);
    main+="<h2>"+t("اكتملت تدريبات الجلسة","Practice session completed")+"</h2>"+
    "<p>"+t("أتممت تدريب هذه الجلسة وحُفظت إجاباتك. يمكنك متابعة الجلسة التالية ومراجعة ملاحظاتك في أي وقت.","Your practice and answers are saved. Continue to the next session and revisit your feedback at any time.")+"</p>"+
    (selected<30?"<button type='button' id='nextSession'>"+(selected%5===0?t("انتقل إلى المستوى ","Continue to level ")+(Math.ceil(selected/5)+1):t("انتقل للجلسة التالية","Continue to next session"))+"</button>":
     "<p role='status'>"+t("اكتملت الجلسات التدريبية الثلاثون. احتفظ بنتائجك للمراجعة.","All 30 practice sessions completed; your results remain saved for review.")+"</p>");
   }else if(next){
    var prompt=lang()==="en"?next.prompt_en:next.prompt_ar;
    main+="<h2>"+esc((lang()==="en"?next.title_en:next.title_ar)||weakName(next.dimension))+"</h2>"+
      "<p class='taskType'>"+t("تدريب على: ","Focus: ")+esc(weakName(next.dimension))+"</p>"+
      adaptiveGuidance(data,progressRows,next)+
      "<div class='prompt' style='white-space:pre-wrap'>"+esc(prompt)+"</div>"+
      "<label for='adaptiveEssay'>"+t("اكتب إجابتك القانونية بأسلوبك","Write your legal explanation in your own words")+"</label>"+
      "<textarea id='adaptiveEssay' rows='7' maxlength='4000' placeholder='"+t("المسألة والقاعدة والتطبيق والنتيجة عند الحاجة...","Identify rule, facts, analysis and result where relevant...")+"'></textarea>"+
      "<button type='button' id='adaptiveSubmit'>"+t("احفظ الإجابة وحللها ثم انتقل","Save, analyse, and continue")+"</button>"+
      "<p id='adaptiveError' role='alert'></p>";
   }
   main+="</section>";
   show(nav()+main);
   var nextButton=host.querySelector("#nextSession");
   if(nextButton)nextButton.onclick=function(){if(!busy){root.location.href=url(selected+1);}};
   var submit=host.querySelector("#adaptiveSubmit");
   if(submit)submit.onclick=async function(){
    if(busy)return;
    var answer=host.querySelector("#adaptiveEssay").value.trim();
    if(answer.length<8){host.querySelector("#adaptiveError").textContent=t("اكتب إجابة من ثمانية أحرف على الأقل.","Write at least eight characters.");return;}
    busy=true;submit.disabled=true;host.querySelector("#adaptiveError").textContent=t("جارٍ حفظ إجابتك وتحليلها...","Saving and performing provisional review...");
    try{
     var v=await cloud.studentLifecycleRpc("trainingSubmit",{courseId:COURSE,session:selected,itemId:next.id,answer:answer});
     if(!v||!v.allowed||!v.saved||!byId(v.saved,next.id))throw Error("answer_not_verified");
     var checked=await cloud.studentLifecycleRpc("trainingOpen",{courseId:COURSE,session:selected});
     if(!checked||!checked.allowed||!byId(checked.saved,next.id))throw Error("answer_readback_failed");
     data=checked;
     if(data.completed){var fresh=await cloud.studentLifecycleRpc("trainingOverview",{courseId:COURSE});if(fresh&&fresh.allowed)overview=fresh;await loadProgress();}
     busy=false;render();
    }catch(e){busy=false;submit.disabled=false;host.querySelector("#adaptiveError").textContent=t("تعذر تأكيد حفظ الإجابة. إجابتك ما زالت هنا؛ تحقق من الاتصال ثم أعد المحاولة.","We could not confirm your answer was saved. Your text is still here; check your connection and try again.");}
   };
  }
  await open(selected);
 }catch(e){reportError(e);}
}
root.LEX_STUDENT_PATH={mount:boot,noHtmlScore:noHtmlScore,previousAnswerTitle:previousAnswerTitle,progressModel:progressModel,progressHtml:progressHtml,provisionalSkillPlan:provisionalSkillPlan,adaptiveGuidance:adaptiveGuidance};
if(typeof module!=="undefined"&&module.exports)module.exports=root.LEX_STUDENT_PATH;
})(typeof window!=="undefined"?window:globalThis);