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
function weakName(s){return {recall:t("الاسترجاع","Recall"),understanding:t("الفهم","Understanding"),exam_execution:t("بناء الإجابة","Exam answer structure")}[s]||t("التأسيس","Foundations");}
function byId(a,id){return (a||[]).find(function(x){return x.item_id===id;});}
function feedback(item){
 var ev=item&&item.evaluation||{},provisional=noHtmlScore(ev.provisional_percent);
 return "<div class='feedback' role='status'><b>"+t("تغطية مبدئية لعناصر القاعدة: ","Provisional legal-rule coverage: ")+esc(provisional)+"</b>"+
 "<p>"+esc((lang()==="en"?ev.feedback_en:ev.feedback_ar)||t("يلزم التأكد من المعنى القانوني مع مراجعة علمية.","Legal meaning still needs independent review."))+"</p>"+
 "<small>"+t("تحليل آلي داخلي يستند إلى ألفاظ القاعدة المرجعية؛ لا يفهم كل المرادفات أو الاستثناءات. لا تُحتسب النسبة درجة نهائية.","Internal reference-term coverage; it can miss paraphrases, negation and legal exceptions. Not a final grade.")+"</small></div>";
}
async function boot(){
 if(!host)return;
 var cloud=root.LEX_CLOUD;
 function show(x){host.innerHTML=x;}
 function reportError(e){show("<p role='alert'>"+t("تعذر تأكيد حالة الطالب على الخادم. لم يتم فتح أي مستوى دون تحقق. ","Student server verification failed. No level was opened without validation. ")+esc(e&&e.message||e)+"</p><a href='student-login"+(lang()==="en"?"-en":"")+".html'>"+t("دخول الطالب","Sign in")+"</a>");}
 show("<p role='status'>"+t("جارٍ تحميل تدريبك المحفوظ...","Loading your saved training...")+"</p>");
 try{
  var uid=await root.LEX_OFFICIAL_DIAGNOSTIC.identity(cloud);
  var overview=await cloud.studentLifecycleRpc("trainingOverview",{courseId:COURSE});
  if(!overview||!overview.allowed){
    show("<p>"+t("ابدأ التقييم التشخيصي أولًا حتى تتكوّن خطتك.","Complete the diagnostic first to create your individual plan.")+"</p><a href='diagnostic.html?lang="+lang()+"'>"+t("ابدأ التشخيص","Start diagnostic")+"</a>");return;
  }
  var selected=Number(new URLSearchParams(root.location.search).get("session"));
  if(!Number.isInteger(selected)||selected<1||selected>30||selected>overview.unlocked)selected=overview.unlocked;
  if(overview.program_completed)selected=30;
  var data=null,busy=false;
  var programLabels=Array.from({length:30},function(_,i){return (i+1)%5===0?
    t("تقييم ومراجعة الأسبوع ","Week checkpoint ")+Math.ceil((i+1)/5):
    t("الجلسة ","Session ")+(i+1);});
  function nav(){
   return "<div class='heading'><div><b>"+t("المسار الأكاديمي الداخلي","Internal learning path")+"</b><p>"+t("المقرر: نظرية الحق • 6 أسابيع • 30 جلسة • نتائج لكل طالب","Theory of Rights • 6 weeks • 30 sessions • individual results")+"</p></div><a href='student"+(lang()==="en"?"-en":"")+".html'>"+t("حساب الطالب","Student account")+"</a></div>"+
   "<p class='scope' role='note'>"+t("مسار تدريبي داخلي باعتماد مؤسس LexLearn، غير معتمد كدرجات جامعية. يعتمد على حفظ الإجابات مركزيًا؛ لا يتأثر بنتائج الديمو العام.","Founder-approved internal practice; no university-certified marks. Responses are server-saved and isolated from the public demo.")+"</p>"+
   "<p class='overview'>"+t("التقدم المحفوظ: ","Verified practice progress: ")+overview.completed_count+" / 30 · "+t("الجلسة الحالية: ","Current session: ")+overview.unlocked+"</p>"+
   "<div class='sessionGrid'>"+programLabels.map(function(v,i){
    var n=i+1,done=n<=overview.completed_count,active=n===selected,locked=n>overview.unlocked;
    return locked?"<span class='session locked' aria-disabled='true'>"+esc(v)+" 🔒</span>":
    "<a class='session "+(done?"complete ":"")+(active?"active":"")+"' href='"+url(n)+"'>"+esc(v)+(done?" ✓":"")+"</a>";
   }).join("")+"</div>";
  }
  async function open(n){
   busy=true;show(nav()+"<p role='status'>"+t("جارٍ تأكيد صلاحية الجلسة...","Verifying session access...")+"</p>");
   try{
    var result=await cloud.studentLifecycleRpc("trainingOpen",{courseId:COURSE,session:n});
    if(!result||!result.allowed||!Array.isArray(result.tasks)||!Array.isArray(result.saved))throw Error(result&&result.reason||"invalid_session");
    selected=n;data=result;busy=false;render();
   }catch(e){reportError(e);}
  }
  function render(){
   if(!data)return;
   var saved=data.saved||[],next=(data.tasks||[]).find(function(q){return !byId(saved,q.id);}),completed=data.completed;
   var name=t("الأسبوع ","Week ")+Math.ceil(selected/5)+" · "+programLabels[selected-1];
   var why="<p>"+t("الأولوية الحالية حسب التشخيص والتدريب المحفوظ: ","Current priority from diagnostic and saved performance: ")+"<b>"+esc(weakName(data.weakest))+"</b>. "+
    t("لذلك يختلف ترتيب الأسئلة بين الطلاب، ويعاد حسابه في الجلسات التالية.","Task order changes with each learner's measured practice; it is recalculated for later sessions.")+"</p>";
   var completedFeedback=saved.map(function(v){
    return "<details class='past'><summary>"+t("إجابتك السابقة: ","Saved answer: ")+esc(v.item_id)+"</summary><p style='white-space:pre-wrap'>"+esc(v.answer_text)+"</p>"+feedback(v)+"</details>";
   }).join("");
   var main="<section class='stage'><h1>"+esc(name)+"</h1>"+why+
    "<p>"+t("أُرسلت ","Saved ")+saved.length+" / "+data.tasks.length+t(" إجابات على الخادم."," answers on the server.")+"</p>"+
    completedFeedback;
   if(completed){
    main+="<h2>"+t("اكتملت تدريبات الجلسة","Practice session completed")+"</h2>"+
    "<p>"+t("تم تسجيل إتمام التدريب، وليس إتقانًا جامعيًا معتمدًا. يمكن متابعة الجلسة التالية الآن.","Practice completion is recorded, not certified mastery. You may continue to the next session.")+"</p>"+
    (selected<30?"<button type='button' id='nextSession'>"+t("انتقل للجلسة التالية","Continue to next session")+"</button>":
     "<p role='status'>"+t("اكتملت الجلسات التدريبية الثلاثون. احتفظ بنتائجك للمراجعة.","All 30 practice sessions completed; your results remain saved for review.")+"</p>");
   }else if(next){
    var prompt=lang()==="en"?next.prompt_en:next.prompt_ar;
    main+="<h2>"+esc((lang()==="en"?next.title_en:next.title_ar)||weakName(next.dimension))+"</h2>"+
      "<p class='taskType'>"+t("تدريب على: ","Focus: ")+esc(weakName(next.dimension))+"</p>"+
      "<div class='prompt' style='white-space:pre-wrap'>"+esc(prompt)+"</div>"+
      "<label for='adaptiveEssay'>"+t("اكتب إجابتك القانونية بأسلوبك","Write your legal explanation in your own words")+"</label>"+
      "<textarea id='adaptiveEssay' rows='7' maxlength='4000' placeholder='"+t("المسألة والقاعدة والتطبيق والنتيجة عند الحاجة...","Identify rule, facts, analysis and result where relevant...")+"'></textarea>"+
      "<button type='button' id='adaptiveSubmit'>"+t("احفظ الإجابة وحللها ثم انتقل","Save, analyse, and continue")+"</button>"+
      "<p id='adaptiveError' role='alert'></p>";
   }
   main+="</section>";
   show(nav()+main);
   var nextButton=host.querySelector("#nextSession");
   if(nextButton)nextButton.onclick=function(){if(!busy){overview.unlocked=Math.min(30,selected+1);overview.completed_count=Math.max(overview.completed_count,selected);root.location.href=url(selected+1);}};
   var submit=host.querySelector("#adaptiveSubmit");
   if(submit)submit.onclick=async function(){
    if(busy)return;
    var answer=host.querySelector("#adaptiveEssay").value.trim();
    if(answer.length<8){host.querySelector("#adaptiveError").textContent=t("اكتب إجابة من ثمانية أحرف على الأقل.","Write at least eight characters.");return;}
    busy=true;submit.disabled=true;host.querySelector("#adaptiveError").textContent=t("يجري الحفظ والتقييم الداخلي...","Saving and performing provisional review...");
    try{
     var v=await cloud.studentLifecycleRpc("trainingSubmit",{courseId:COURSE,session:selected,itemId:next.id,answer:answer});
     if(!v||!v.allowed||!v.saved||!byId(v.saved,next.id))throw Error("answer_not_verified");
     var checked=await cloud.studentLifecycleRpc("trainingOpen",{courseId:COURSE,session:selected});
     if(!checked||!checked.allowed||!byId(checked.saved,next.id))throw Error("answer_readback_failed");
     data=checked;
     if(data.completed){var fresh=await cloud.studentLifecycleRpc("trainingOverview",{courseId:COURSE});if(fresh&&fresh.allowed)overview=fresh;}
     busy=false;render();
    }catch(e){busy=false;submit.disabled=false;host.querySelector("#adaptiveError").textContent=t("لم يُؤكد الحفظ؛ لم تُحتسب المهمة. ","Save not verified; task remains pending. ")+String(e&&e.message||e);}
   };
  }
  await open(selected);
 }catch(e){reportError(e);}
}
root.LEX_STUDENT_PATH={mount:boot,noHtmlScore:noHtmlScore};
if(typeof module!=="undefined"&&module.exports)module.exports=root.LEX_STUDENT_PATH;
})(typeof window!=="undefined"?window:globalThis);