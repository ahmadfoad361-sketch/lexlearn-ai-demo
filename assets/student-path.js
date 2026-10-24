/* LexLearn: authenticated, server-gated, founder-authorized 30-session internal pilot.
 * The four-task public demo and browser local scores never enter this student path.
 * Only confirmed semantic assessments enter the visual scores; completion remains server-authorized.
 */
(function(root){
"use strict";
var COURSE="qa-qu-lawc101-rights",host=root.document.getElementById("studentTrainingApp");
function lang(){return new URLSearchParams(root.location.search).get("lang")==="en"?"en":"ar";}
function t(ar,en){return lang()==="en"?en:ar;}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function url(n){return "student-path.html?lang="+lang()+(n?"&session="+n:"")+"&app=20261024-assessment-release";}
function noHtmlScore(value){return typeof value==="number"&&isFinite(value)?Math.round(Math.max(0,Math.min(100,value)))+"%":t("غير قابل للتقدير","Not reliably measurable");}
function weakName(s){return {recall:t("الحفظ","Recall"),understanding:t("الفهم","Understanding"),exam_execution:t("بناء الإجابة","Exam answer structure")}[s]||t("التأسيس","Foundations");}
function byId(a,id){return (a||[]).find(function(x){return x.item_id===id;});}
function previousAnswerTitle(item,task){
  var dimension=(task&&task.dimension)||(item&&item.dimension);
  var localizedTitle=task&&(lang()==="en"?task.title_en:task.title_ar);
  return t("إجابتك السابقة — ","Your previous answer — ")+weakName(dimension)+(localizedTitle?" · "+String(localizedTitle):"");
}
function lawContext(ids){return root.LEX_LEGAL_STUDY?root.LEX_LEGAL_STUDY.context(ids||[],lang()):"";}
// Only verified current-version OpenAI rubric results may affect displayed scores.
function confirmedGrade(ev){return !!(ev&&ev.status==="preliminary_ai"&&ev.rubric_version==="lexlearn-training-ai-v4"&&
 typeof ev.provisional_percent==="number"&&Number.isFinite(ev.provisional_percent)&&ev.provisional_percent>=0&&ev.provisional_percent<=100);}
function needsAssessment(v){return !confirmedGrade(v&&v.evaluation);}
function feedback(item){
 var ev=item&&item.evaluation||{};
 if(confirmedGrade(ev)){
  var verdict={correct:t("إجابة صحيحة","Correct answer"),partially_correct:t("إجابة صحيحة جزئيًا","Partly correct answer"),needs_revision:t("الإجابة تحتاج تصحيحًا","Answer needs correction")}[ev.verdict]||t("تصحيح إجابتك","Your answer assessment");
  var details=Array.isArray(ev.criteria)?"<ul class='criterionFeedback'>"+ev.criteria.map(function(c){
   if(typeof c.credit!=="number")return "";
   var state=c.credit===1?t("✓ صحيح","✓ Correct"):c.credit>0?t("◐ صحيح جزئيًا","◐ Partly correct"):t("✗ ناقص أو يحتاج تصحيحًا","✗ Missing or needs correction");
   return "<li class='"+(c.credit===1?"criterionCorrect":c.credit>0?"criterionPartial":"criterionIncorrect")+"'><b>"+esc(state)+" — "+esc(lang()==="en"?c.label_en:c.label_ar)+"</b>"+(c.evidence?"<blockquote>«"+esc(c.evidence)+"»</blockquote>":"")+"<p>"+esc(lang()==="en"?c.explanation_en:c.explanation_ar)+"</p></li>";
  }).join("")+"</ul>":"";
  return "<div class='feedback' role='status'><b>"+esc(verdict)+": "+esc(noHtmlScore(ev.provisional_percent))+"</b><p style='white-space:pre-wrap'>"+esc(lang()==="en"?ev.feedback_en:ev.feedback_ar)+"</p>"+details+"<small>"+t("نسبة استيفاء متطلبات هذا السؤال، بتصحيح OpenAI. ليست حكمًا على قدرتك الكاملة على الفهم، ووالمشرف يتابع تقدمك.","OpenAI assessment of this task’s requirements, not your entire understanding ability; instructor oversight only.")+"</small></div>";
 }
 return "<div class='feedback' role='status'><b>"+t("حُفظت الإجابة — التصحيح غير مكتمل","Answer saved — assessment incomplete")+"</b>"+
 "<p>"+t("لم يتأكد التصحيح بالذكاء الاصطناعي بعد. أعد طلب التصحيح من الزر أدناه؛ لن تُعرض نسبة قبل تأكيده.","AI assessment has not been confirmed. Retry below; no percentage is shown before confirmation.")+"</p>"+
 "<small>"+t("مؤشرات تدريبية أولية وليست درجة جامعية أو قياسًا معتمدًا. ستظهر الملاحظات فور اكتمال التصحيح الآلي.","Preliminary practice indicators, not an accredited mark. Detailed feedback appears when automatic assessment completes.")+"</small></div>";
}

function progressModel(rows,session){
 var start=Math.floor((session-1)/5)*5+1,checkpoint=session%5===0;
 function metric(dim,from,to){
  var all=(rows||[]).filter(function(x){return x.dimension===dim&&x.session_number>=from&&x.session_number<=to;});
  var scored=all.filter(function(x){return confirmedGrade(x.evaluation);}).map(function(x){return x.evaluation&&x.evaluation.provisional_percent;}).filter(function(v){return typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100;});
  return {score:scored.length?Math.round(scored.reduce(function(a,b){return a+b;},0)/scored.length):null,assessed:scored.length,total:all.length};
 }
 var skills=["recall","understanding"].map(function(dim){
  var current=metric(dim,session,session),earlier=metric(dim,start,session-1);
  return {dimension:dim,current:current,earlier:earlier,change:current.score!==null&&earlier.score!==null?current.score-earlier.score:null};
 });
 return {level:Math.ceil(session/5),checkpoint:checkpoint,skills:skills,needsReview:skills.filter(function(x){return x.current.score===null||x.current.score<70||x.current.assessed<x.current.total;}).map(function(x){return x.dimension;})};
}
function examSummary(rows,session){
 var entries=(rows||[]).filter(function(r){return r.session_number===session&&r.dimension==="exam_execution";});
 if(!entries.length)return "";
 var values=entries.filter(function(r){return confirmedGrade(r.evaluation);}).map(function(r){return r.evaluation.provisional_percent;}).filter(function(v){return typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100;});
 return "<p class='examSummary'><b>"+t("بناء الإجابة والتطبيق في هذه الجلسة: ","Answer structure and application in this session: ")+(values.length?noHtmlScore(values.reduce(function(a,b){return a+b;},0)/values.length):t("التصحيح غير مكتمل","Assessment incomplete"))+"</b><br><small>"+t("هذه نتيجة سؤال التطبيق، وتُعرض منفصلة عن الحفظ والفهم.","This is the application question result, shown separately from recall and understanding.")+"</small></p>";
}
function progressHtml(rows,session,historyAvailable){
 var m=progressModel(rows,session),visual=root.LEX_MOMENTS,card=momentData(rows,session);
 return "<section class='progressReport' aria-label='"+t("ملخص تقدمك","Your progress report")+"'><h2>"+
 (m.checkpoint?t("إتمام المستوى ","Level completion ")+m.level:t("ملخص الجلسة ","Session summary ")+session)+"</h2>"+
 (visual?visual.completion(card,lang()):"")+
 (root.LEX_SESSION_MOMENTS?root.LEX_SESSION_MOMENTS.render(session,lang()):"")+
 "<p class='completionState'>✓ "+t("أكملت مهام هذه الجلسة وحُفظت إجاباتك.","You completed this session and your answers were saved.")+"</p>"+
 "<div class='progressSkills'>"+m.skills.map(function(x){
   var aiRows=(rows||[]).filter(function(r){return r.dimension===x.dimension&&r.session_number===session&&r.evaluation&&confirmedGrade(r.evaluation);});
   var values=aiRows.map(function(r){return r.evaluation.provisional_percent;}).filter(function(v){return typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100;});
   var shown=values.length?noHtmlScore(values.reduce(function(a,b){return a+b;},0)/values.length):t("التصحيح غير مكتمل","Assessment incomplete");
   return "<article class='progressSkill'><h3>"+esc(weakName(x.dimension))+"</h3>"+(visual&&values.length?visual.ring(card[x.dimension],x.dimension):"")+"<strong class='"+(values.length?"":"assessmentMissing")+"'>"+esc(values.length?shown:t("التصحيح غير مكتمل","Assessment incomplete"))+"</strong>"+
   "<p>"+t("إجابات محفوظة: ","Saved answers: ")+x.current.total+"</p></article>";
 }).join("")+"</div>"+examSummary(rows,session)+
 "<p class='nextAdvice'>"+(card.recall!==null&&card.understanding!==null?(card.recall<card.understanding?t("الفهم أقوى في هذه الجلسة؛ حوّل المعنى إلى مفاتيح قصيرة ثم استرجع القاعدة.","Understanding was stronger in this session. Turn meaning into brief cues, then recall the rule."):card.understanding<card.recall?t("الحفظ أقوى في هذه الجلسة؛ اشرح السبب بكلماتك وجرّب تغيير شرط واحد.","Recall was stronger in this session. Explain why in your words, then change one condition."):t("نتيجتا الحفظ والفهم متقاربتان؛ طبّق القاعدة في مثال جديد.","Recall and understanding are close. Apply the rule in a new example.")):t("خطوتك التالية: اختر جزءًا احتجت فيه إلى مساعدة، واشرحه بكلماتك، ثم جرّبه في مثال جديد.","Your next step: choose one part you needed help with, explain it in your own words, then try it in a new example."))+"</p>"+
 "<small>"+t("هذه مؤشرات تدريبية أولية، وليست درجات رسمية. سيُعاد قياس المهارات بأسئلة مستقلة.","These are preliminary practice indicators, not official grades. Skills will be reassessed with independent questions.")+"</small>"+(visual?visual.downloadButton(lang()):"")+"</section>";
}
function momentData(rows,session){
 var data={kind:session%5===0?"level":"session",level:Math.ceil(session/5),session:session};
 ["recall","understanding"].forEach(function(dim){var a=(rows||[]).filter(function(r){return r.session_number===session&&r.dimension===dim&&r.evaluation&&confirmedGrade(r.evaluation);}).map(function(r){return r.evaluation.provisional_percent;}).filter(function(v){return typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100;});data[dim]=a.length?Math.round(a.reduce(function(x,y){return x+y;},0)/a.length):null;});
 return data;
}

async function boot(){
 if(!host)return;
 var cloud=root.LEX_CLOUD;
 function show(x){host.innerHTML=x;}
 function reportError(e){show("<p role='alert'>"+t("تعذر تحميل تدريبك الآن. تحقق من اتصالك ثم حاول مجددًا، أو سجّل الدخول إلى حسابك. ","Your training could not be loaded. Check your connection and try again, or sign in to your account. ")+"</p><a href='student-login"+(lang()==="en"?"-en":"")+".html'>"+t("دخول الطالب","Sign in")+"</a>");}
 show("<p role='status'>"+t("جارٍ تحميل تدريبك المحفوظ...","Loading your saved training...")+"</p>");
 try{
  var uid=await root.LEX_OFFICIAL_DIAGNOSTIC.identity(cloud);
  // The real authenticated profile is the only source for the personalized wait screen.
  var learnerDisplayName="";
  try{var ownProfile=await cloud.profile();if(ownProfile&&ownProfile.id===uid)learnerDisplayName=String(ownProfile.display_name||"");}catch(_){}
  var overview=await cloud.studentLifecycleRpc("trainingOverview",{courseId:COURSE});
  if(!overview||!overview.allowed){
    show("<p>"+t("ابدأ التقييم التشخيصي أولًا حتى تتكوّن خطتك.","Complete the diagnostic first to create your individual plan.")+"</p><a href='diagnostic.html?lang="+lang()+"'>"+t("ابدأ التشخيص","Start diagnostic")+"</a>");return;
  }
  var selected=Number(new URLSearchParams(root.location.search).get("session"));
  if(!Number.isInteger(selected)||selected<1||selected>30||selected>overview.unlocked)selected=overview.unlocked;
  var data=null,busy=false,progressRows=[],historyAvailable=false,adaptation=null,acceptedAi=false,aiUnavailable=false,gradingIssue="",studyRead=false;
  try{if(cloud.getConsent)acceptedAi=!!await cloud.getConsent("lexlearn-ai-grading-v1","external_ai_grading");}catch(_){}
  function gradingMessage(){
   if(gradingIssue==='approved_rubric_required'||gradingIssue==='approved_sources_required')return t("لم تتمكن الخدمة من تحميل معايير السؤال ومصادره. إجابتك محفوظة؛ أعد التصحيح من الزر أدناه.","The question criteria or sources could not load. Your answer is saved; retry below.");
   if(gradingIssue==='answer_retry_limit')return t("لم نحصل على نتيجة مؤكدة بعد المحاولات المتاحة لهذه الإجابة. إجابتك محفوظة ولم تُحتسب صفرًا.","No confirmed result was obtained within this answer’s retry allowance. Your answer is saved and has not been scored zero.");
   if(gradingIssue==='provider_timeout')return t("استغرق التصحيح وقتًا أطول من المتاح. إجابتك محفوظة؛ أعد التصحيح من الزر أدناه.","Assessment took longer than the available time. Your answer is saved; retry below.");
   return t("لم يكتمل التصحيح الآلي. إجابتك محفوظة؛ أعد التصحيح من الزر أدناه لتظهر النتيجة والملاحظات.","Automatic assessment did not complete. Your answer is saved; retry below to see the result and feedback.");
  }
  async function requestAssessment(itemId){
   try{var result=await cloud.gradeTrainingAi(selected,itemId);if(!result||result.status!=="preliminary_ai")gradingIssue=result&&result.reason||"assessment_unconfirmed";return result;}
   catch(error){gradingIssue=error&&error.code||error&&error.message||"assessment_unavailable";throw error;}
  }
  async function refreshAdaptation(){
   if(cloud.trainingAiSummary)try{adaptation=await cloud.trainingAiSummary();}catch(_){adaptation=null;}
  }
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
   return "<div class='heading'><div><b>"+t("مسارك التدريبي المتكيف","Your adaptive learning path")+"</b><p>"+t("المقرر: نظرية الحق • 6 أسابيع • 30 جلسة • نتائج لكل طالب","Theory of Rights • 6 weeks • 30 sessions • individual results")+"</p>"+lawContext([])+"</div><a href='student"+(lang()==="en"?"-en":"")+".html'>"+t("حساب الطالب","Student account")+"</a></div>"+
   "<p class='scope' role='note'>"+t("تدريب يتكيف مع أدائك، مع حفظ إجاباتك وتقدمك في حسابك. النتائج مؤشرات تدريبية والمشرف يتابع تقدمك، وليست درجات جامعية معتمدة.","Practice adapts to your performance, with answers and progress saved to your account. Results are training indicators instructor oversight only, not certified university marks.")+"</p>"+
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
    selected=n;data=result;studyRead=false;
    // Do not silently regrade saved work on navigation; use explicit retry controls.
    await refreshAdaptation();if(data.completed)await loadProgress();busy=false;render();
   }catch(e){reportError(e);}
  }
  function render(){
   if(!data)return;
   if(!studyRead&&!(data.saved||[]).length&&!data.completed&&root.LEX_LEGAL_STUDY){
    var sourceIds=[];(data.tasks||[]).forEach(function(q){sourceIds=sourceIds.concat(q.sources||[]);});
    var reading=root.LEX_LEGAL_STUDY.render(sourceIds,lang());
    if(reading){
     show(nav()+reading);
     host.querySelector("#beginLegalQuestions").onclick=function(){studyRead=true;render();};
     return;
    }
   }
   var saved=data.saved||[],remaining=(data.tasks||[]).filter(function(q){return !byId(saved,q.id);});
   if(adaptation&&adaptation.priority!=="foundation")remaining.sort(function(a,b){return (a.dimension===adaptation.priority?0:1)-(b.dimension===adaptation.priority?0:1);});
   var next=remaining[0],completed=data.completed;
   var name=t("الأسبوع ","Week ")+Math.ceil(selected/5)+" · "+programLabels[selected-1];
   var why="<p>"+t("ترتيب تدريبي مبدئي وفق المعلومات المتاحة، وسيُراجع بعد جمع أدلة أكثر.","Preliminary practice sequence based on available evidence; this will be revisited as more evidence is collected.")+"</p>";
   if(adaptation&&adaptation.skills){
    why+="<div class='progressSkills'>"+["understanding","recall"].map(function(dim){return "<article class='progressSkill'><h3>"+esc(weakName(dim))+"</h3><strong>"+esc(noHtmlScore(adaptation.skills[dim]))+"</strong></article>";}).join("")+"</div><p>"+
     (adaptation.priority==="recall"?t("الأولوية الآن للحفظ: استخدم مفاتيح قصيرة، ثم أغلق النص وأعد بناء القاعدة من ذاكرتك.","Recall priority: use brief cues, close the text, then reconstruct the rule."):
      adaptation.priority==="understanding"?t("الأولوية الآن للفهم: اشرح سبب القاعدة، ثم غيّر شرطًا واحدًا وفسّر أثره على النتيجة.","Understanding priority: explain why the rule works, then change one condition and explain the result."):
      t("نحتاج إجابات أكثر لتحديد الأولوية؛ ابدأ بشرح القاعدة ثم استرجاعها.","More evidence is needed; start by explaining and retrieving the rule."))+"</p><small>"+t("تقديرات مبدئية تتحدث بعد تصحيح إجاباتك؛ ليست درجات جامعية.","Preliminary estimates update after answer assessment; these are not university marks.")+"</small>";
   }
   if(aiUnavailable)why+="<p role='status'>"+t("حُفظت إجابتك، لكن التصحيح بالذكاء الاصطناعي لم يتأكد. يمكنك المتابعة؛ لن نمنح نسبة بديلة أو نغيّر الأولوية بناءً عليها.","Your answer is saved, but AI assessment was not confirmed. Continue practice; no replacement score or priority change is inferred.")+"</p>";
   var completedFeedback=saved.map(function(v,index){
    var task=(data.tasks||[]).find(function(q){return q.id===v.item_id;});
    return "<details class='past'"+(v===saved[saved.length-1]?" open":"")+"><summary>"+esc(previousAnswerTitle(v,task))+"</summary>"+lawContext(task&&task.sources)+"<p style='white-space:pre-wrap'>"+esc(v.answer_text)+"</p>"+feedback(v)+(needsAssessment(v)&&acceptedAi&&cloud.gradeTrainingAi?"<button type='button' id='retryGrade"+index+"'>"+t("أعد تصحيح هذه الإجابة","Retry assessment of this answer")+"</button>":"")+"</details>";
   }).join("");
   var resume=next?"<section class='learnerWelcome'><div><h2>"+t("تدريبك التالي جاهز","Your next practice is ready")+"</h2><p>"+t("إجاباتك السابقة محفوظة؛ أكمل خطوة واحدة الآن.","Your previous answers are saved. Continue one step at a time.")+"</p></div><a href='#currentPractice'>"+t("أكمل تدريبك","Continue practice")+"</a></section>":"";
   var main=resume+"<section class='stage'><h1>"+esc(name)+"</h1>"+why+
    "<p>"+t("أُرسلت ","Saved ")+saved.length+" / "+data.tasks.length+t(" إجابات محفوظة في حسابك."," answers to your account.")+"</p>"+
    completedFeedback;
   if(completed){
    main+=progressHtml(progressRows,selected,historyAvailable);
    if(saved.some(needsAssessment)&&acceptedAi&&cloud.gradeTrainingAi)main+="<div class='assessmentRecovery' role='status'><p>"+gradingMessage()+"</p><button type='button' id='retrySessionGrades'>"+t("أعد تصحيح إجابات الجلسة","Retry session assessment")+"</button><p id='sessionGradeStatus' aria-live='polite'></p></div>";
    main+="<h2>"+t("اكتملت تدريبات الجلسة","Practice session completed")+"</h2>"+
    "<p>"+t("أتممت تدريب هذه الجلسة وحُفظت إجاباتك. يمكنك متابعة الجلسة التالية ومراجعة ملاحظاتك في أي وقت.","Your practice and answers are saved. Continue to the next session and revisit your feedback at any time.")+"</p>"+
    (selected<30?"<button type='button' id='nextSession'>"+(selected%5===0?t("انتقل إلى المستوى ","Continue to level ")+(Math.ceil(selected/5)+1):t("انتقل للجلسة التالية","Continue to next session"))+"</button>":
     "<p role='status'>"+t("اكتملت الجلسات التدريبية الثلاثون. احتفظ بنتائجك للمراجعة.","All 30 practice sessions completed; your results remain saved for review.")+"</p>");
   }else if(next){
    var prompt=root.LEX_BEGINNER_PROMPTS?root.LEX_BEGINNER_PROMPTS.prepare(next,lang()):(lang()==="en"?next.prompt_en:next.prompt_ar);
    if(root.LEX_LEGAL_STUDY)prompt=root.LEX_LEGAL_STUDY.qualify(prompt,lang());
    var guide=root.LEX_LEGAL_CASE_GUIDE;
    var guided=next.dimension==="exam_execution"&&guide&&guide.parse(prompt,lang());
    main+="<h2 id='currentPractice' tabindex='-1'>"+esc((lang()==="en"?next.title_en:next.title_ar)||weakName(next.dimension))+"</h2>"+
      lawContext(next.sources)+"<p class='taskType'>"+t("تدريب على: ","Focus: ")+esc(weakName(next.dimension))+"</p>";
    if(guided){
     // The preserved legal question is presented one step at a time, but the
     // answer goes to the existing server rubric with explicit section headings.
     main+="<div id='legalExamGuide'></div>";
    }else{
     main+="<div class='prompt' style='white-space:pre-wrap'>"+esc(prompt)+"</div>"+
      "<label for='adaptiveEssay'>"+t("اكتب إجابتك القانونية بأسلوبك","Write your legal explanation in your own words")+"</label>"+
      "<textarea id='adaptiveEssay' rows='7' maxlength='4000' placeholder='"+t("اكتب إجابتك بأسلوبك...","Write your answer in your own words...")+"'></textarea>"+
      "<button type='button' id='adaptiveSubmit'>"+t("احفظ الإجابة وحللها ثم انتقل","Save, analyse, and continue")+"</button>";
    }
    main+="<div id='answerSaveProgress'></div><p id='adaptiveError' role='alert' aria-live='polite'></p>";
   }
   main+="</section>";
   show(nav()+main);
   if(completed&&root.LEX_MOMENTS)root.LEX_MOMENTS.bindDownload(host,momentData(progressRows,selected),lang());
   saved.forEach(function(v,index){var retry=host.querySelector("#retryGrade"+index);if(retry)retry.onclick=async function(){
    if(busy)return;busy=true;retry.disabled=true;retry.textContent=t("نصحح إجابتك…","Assessing your answer…");
    var wait=root.LEX_GRADING_WAIT?root.LEX_GRADING_WAIT.begin({name:learnerDisplayName,language:lang(),dimension:v.dimension,stage:"grading"}):null;
    if(wait)wait.setPhase("grading");
    try{var graded=await requestAssessment(v.item_id);aiUnavailable=!graded||graded.status!=="preliminary_ai";
     var reread=await cloud.studentLifecycleRpc("trainingOpen",{courseId:COURSE,session:selected});
     if(!reread||!reread.allowed||!Array.isArray(reread.saved))throw Error("grade_readback_failed");
     data=reread;await refreshAdaptation();if(data.completed)await loadProgress();busy=false;render();
    }catch(_){busy=false;retry.disabled=false;retry.textContent=t("التصحيح غير متاح الآن؛ حاول لاحقًا","Assessment unavailable; retry later");}
    finally{if(wait)wait.finish();}
   };});
   var allRetry=host.querySelector("#retrySessionGrades");
   if(allRetry)allRetry.onclick=async function(){
    if(busy)return;busy=true;allRetry.disabled=true;
    var missing=saved.filter(needsAssessment),note=host.querySelector("#sessionGradeStatus");
    var wait=root.LEX_GRADING_WAIT?root.LEX_GRADING_WAIT.begin({name:learnerDisplayName,language:lang(),dimension:"exam_execution",stage:"grading"}):null;
    if(wait)wait.setPhase("grading");
    for(var i=0;i<missing.length;i++){
     if(note)note.textContent=t("نصحح الإجابة ","Assessing answer ")+(i+1)+" / "+missing.length;
     if(wait)wait.setStep(i+1,missing.length);
     try{var outcome=await requestAssessment(missing[i].item_id);aiUnavailable=!outcome||outcome.status!=="preliminary_ai";}catch(_){aiUnavailable=true;}
    }
    try{var updated=await cloud.studentLifecycleRpc("trainingOpen",{courseId:COURSE,session:selected});if(!updated||!updated.allowed||!Array.isArray(updated.saved))throw Error();data=updated;await refreshAdaptation();await loadProgress();busy=false;render();}
    catch(_){busy=false;allRetry.disabled=false;if(note)note.textContent=t("تعذر تحديث النتيجة الآن. أعد المحاولة.","Results could not refresh. Retry.");}
    finally{if(wait)wait.finish();}
   };
   var nextButton=host.querySelector("#nextSession");
   if(nextButton)nextButton.onclick=function(){if(!busy){root.location.href=url(selected+1);}};
   async function submitAnswer(answer,button){
    if(busy)return;
    answer=String(answer||"").trim();
    var error=host.querySelector("#adaptiveError");
    if(answer.length<8){if(error)error.textContent=t("اكتب إجابة من ثمانية أحرف على الأقل.","Write at least eight characters.");return;}
    busy=true;button.disabled=true;
    if(error)error.textContent=t("جارٍ حفظ إجابتك وتحليلها...","Saving and performing provisional review...");
    var savingView=host.querySelector("#answerSaveProgress");
    if(savingView&&root.LEX_MOMENTS){if(error)error.textContent="";savingView.innerHTML=root.LEX_MOMENTS.saveProgress("saving",lang());}
    var wait=acceptedAi&&cloud.gradeTrainingAi&&root.LEX_GRADING_WAIT?
      root.LEX_GRADING_WAIT.begin({name:learnerDisplayName,language:lang(),dimension:next.dimension,stage:"saving"}):null;
    try{
     var v=await cloud.studentLifecycleRpc("trainingSubmit",{courseId:COURSE,session:selected,itemId:next.id,answer:answer});
     if(!v||!v.allowed||!v.saved||!byId(v.saved,next.id))throw Error("answer_not_verified");
     if(savingView&&root.LEX_MOMENTS)savingView.innerHTML=root.LEX_MOMENTS.saveProgress("assessment",lang());
     if(wait)wait.setPhase("grading");
     aiUnavailable=false;
     if(acceptedAi&&cloud.gradeTrainingAi){
      try{var ai=await requestAssessment(next.id);aiUnavailable=!ai||ai.status!=="preliminary_ai";}
      catch(_){aiUnavailable=true;}
     }
     var checked=await cloud.studentLifecycleRpc("trainingOpen",{courseId:COURSE,session:selected});
     if(!checked||!checked.allowed||!byId(checked.saved,next.id))throw Error("answer_readback_failed");
     data=checked;await refreshAdaptation();
     if(data.completed){
      var fresh=await cloud.studentLifecycleRpc("trainingOverview",{courseId:COURSE});
      if(fresh&&fresh.allowed)overview=fresh;
      await loadProgress();
     }
     busy=false;render();
     if(data.completed&&root.LEX_SESSION_MOMENTS)root.LEX_SESSION_MOMENTS.show(selected,lang(),uid+":"+COURSE+":"+selected);
     if(data.completed&&selected%5===0&&overview.completed_count>=selected&&root.LEX_MOMENTS)root.LEX_MOMENTS.celebrate((root.document.querySelector&&root.document.querySelector(".sessionMomentDialog[open]"))||host,uid+":"+COURSE+":"+selected);
    }catch(e){
     busy=false;button.disabled=false;
     if(savingView)savingView.innerHTML="";
     if(error)error.textContent=t("تعذر تأكيد حفظ الإجابة. إجابتك ما زالت هنا؛ تحقق من الاتصال ثم أعد المحاولة.","We could not confirm your answer was saved. Your text is still here; check the connection and try again.");
    }finally{if(wait)wait.finish();}
   }
   if(next&&guided){
    guide.mount(host.querySelector("#legalExamGuide"),{prompt:prompt,language:lang(),onSubmit:submitAnswer});
   }else if(next){
    var submit=host.querySelector("#adaptiveSubmit");
    if(submit)submit.onclick=function(){
     return submitAnswer(host.querySelector("#adaptiveEssay").value,this);
    };
   }
  }
  await open(selected);
 }catch(e){reportError(e);}
}
root.LEX_STUDENT_PATH={mount:boot,noHtmlScore:noHtmlScore,previousAnswerTitle:previousAnswerTitle,progressModel:progressModel,progressHtml:progressHtml};
if(typeof module!=="undefined"&&module.exports)module.exports=root.LEX_STUDENT_PATH;
})(typeof window!=="undefined"?window:globalThis);








