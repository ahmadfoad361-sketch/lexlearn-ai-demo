/* LexLearn optional non-credit learning extensions.
 * All access checks and persistence are server/RLS enforced.
 * Never changes official scores, session progression, or AI provider budgets.
 */
(function(root){
"use strict";
var COURSE="qa-qu-lawc101-rights", MILESTONES=[2,4,6];
function tr(lang,ar,en){return lang==="en"?en:ar;}
function esc(x){return String(x==null?"":x).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;",[String.fromCharCode(39)]:"&#39;"}[c];});}
function isMilestone(n){return MILESTONES.includes(Number(n));}
function eligibleReview(n){return Number.isInteger(n)&&n>=2&&n<=30&&n%2===0;}
function tasksFrom(session){return Array.isArray(session&&session.tasks_json)?session.tasks_json:[];}
function reviewSource(sessions,n){
 var available=(Array.isArray(sessions)?sessions:[]).filter(function(s){return Number(s.session_number)<n&&s.completed_at&&tasksFrom(s).length;});
 var target=n===2?1:n-3;
 available.sort(function(a,b){return Math.abs(a.session_number-target)-Math.abs(b.session_number-target)||a.session_number-b.session_number;});
 for(var session of available){
  var task=tasksFrom(session).find(function(x){return x.dimension==="recall"&&x.id&&(x.prompt_ar||x.prompt_en);})||
   tasksFrom(session).find(function(x){return x.dimension==="understanding"&&x.id&&(x.prompt_ar||x.prompt_en);});
  if(task)return {session:Number(session.session_number),task:task};
 }
 return null;
}
function lawContext(task,lang){
 return root.LEX_LEGAL_STUDY&&root.LEX_LEGAL_STUDY.context?
  root.LEX_LEGAL_STUDY.context(task&&task.sources||[],lang):
  "<p>"+esc(tr(lang,"القانون المدني القطري رقم (22) لسنة 2004","Qatar Civil Code, Law 22 of 2004"))+"</p>";
}
function textOf(task,lang){return String(lang==="en"?(task.prompt_en||task.prompt_ar):(task.prompt_ar||task.prompt_en)||"");}
function visible(node,html){if(node&&node.isConnected)node.innerHTML=html;}
function note(node,lang){
 visible(node,"<p class='lexExtensionNote'>"+tr(lang,
  "تقدمك في الجلسات محفوظ. تقدر تكمل دراستك في أي وقت.",
  "Your session progress remains saved. Continue your learning whenever you like.")+"</p>");
}
async function mountReview(node,opts){
 if(!node||!opts||!eligibleReview(opts.session))return;
 var lang=opts.lang||"ar",db=opts.cloud.db(),n=opts.session,uid=opts.uid;
 try{
  var existing=await db.from("lex_retrieval_checks").select("id,source_session").eq("student_id",uid).eq("course_id",COURSE).eq("after_session",n).limit(2);
  if(existing.error)throw existing.error;
  if(!node.isConnected)return;
  if(existing.data&&existing.data.length){
   visible(node,"<section class='lexExtensionCard'><h3>"+tr(lang,"✦ مراجعتك محفوظة","✦ Review saved")+"</h3><p>"+
    tr(lang,"أحسنت! رجعت لمعلومة سابقة ودرّبت ذاكرتك عليها.","Well done! You revisited earlier learning.")+"</p></section>");return;
  }
  var prior=await db.from("student_training_sessions").select("session_number,completed_at,tasks_json")
   .eq("user_id",uid).eq("course_id",COURSE).lt("session_number",n).not("completed_at","is",null).order("session_number",{ascending:true}).limit(30);
  if(prior.error)throw prior.error;
  var selected=reviewSource(prior.data,n);
  if(!selected){node.textContent="";return;}
  var question=selected.task;
  visible(node,"<section class='lexExtensionCard' aria-labelledby='lexRecallTitle'><p class='lexExtensionEyebrow'>"+
   tr(lang,"مراجعة ذكية مدمجة","Integrated recall")+"</p><h3 id='lexRecallTitle'>"+
   tr(lang,"سؤال واحد من اللي اتعلمته","One question from your earlier learning")+"</h3><p>"+
   tr(lang,"حاول تسترجع المعلومة من ذاكرتك، من غير ما ترجع للإجابة السابقة.","Try retrieving the idea without looking back at your previous answer.")+
   "</p>"+lawContext(question,lang)+"<p class='lexExtensionSourceHint'>"+tr(lang,"حاول الإجابة أولًا من الذاكرة.","Try answering from memory first.")+"</p><div class='lexExtensionPrompt'>"+esc(textOf(question,lang))+"</div>"+
   "<label for='lexRecallAnswer'>"+tr(lang,"اكتب اللي تفتكره","Write what you remember")+"</label>"+
   "<textarea id='lexRecallAnswer' rows='4' maxlength='4000'></textarea>"+
   "<button type='button' id='lexRecallSave'>"+tr(lang,"احفظ مراجعتي","Save my review")+"</button>"+
   "<p class='lexExtensionStatus' id='lexRecallStatus' role='status' aria-live='polite'></p>"+
   "<small>"+tr(lang,"المراجعة اختيارية، ولا تغيّر درجات الجلسات أو نتيجة التشخيص.","Optional and non-credit. Official session scores remain unchanged.")+"</small></section>");
  var button=node.querySelector("#lexRecallSave"),textarea=node.querySelector("#lexRecallAnswer");
  button.onclick=async function(){
   var answer=textarea.value.trim(),status=node.querySelector("#lexRecallStatus");
   if(answer.length<12){status.textContent=tr(lang,"اكتب فكرة قصيرة من اللي تفتكره، وبعدين احفظها.","Write a short thought from memory, then save it.");return;}
   button.disabled=true;status.textContent=tr(lang,"بنحفظ مراجعتك…","Saving your review…");
   try{
    var r=await db.from("lex_retrieval_checks").insert({
     student_id:uid,course_id:COURSE,after_session:n,source_session:selected.session,
     source_item_id:String(question.id),answer_text:answer
    });
    if(r.error){
     if(r.error.code!=="23505")throw r.error;
     var prior=await db.from("lex_retrieval_checks").select("id").eq("student_id",uid).eq("course_id",COURSE).eq("after_session",n).eq("source_item_id",String(question.id)).maybeSingle();
     if(prior.error||!prior.data)throw new Error("review_save_unconfirmed");
    }
    visible(node,"<section class='lexExtensionCard'><h3>"+tr(lang,"✓ خطوة جديدة في رحلتك","✓ Another step forward")+
      "</h3><p>"+tr(lang,"أحسنت! استرجعت معلومة قديمة وسجلت مراجعتك. تقدر تكمل الجلسة التالية.","Great work revisiting earlier material. Your review was saved.")+"</p></section>");
   }catch(_){button.disabled=false;status.textContent=tr(lang,"تقدر تكمل دلوقتي وترجع للمراجعة بعدين.","You can continue now and return to this review later.");}
  };
 }catch(_){node.textContent="";}
}
function careerCard(n,lang){
 var href="student-future.html?lang="+encodeURIComponent(lang)+"&milestone="+n;
 return "<section class='lexExtensionCard lexFutureCard'><p class='lexExtensionEyebrow'>"+tr(lang,"اختار مهنتك القادمة","Choose your future role")+"</p>"+
  "<h3>"+tr(lang,"جاهز تعيش دورك في القانون؟","Ready to try a legal profession?")+"</h3>"+
  "<p>"+tr(lang,"اختار مرة قاضي، أو محامي، أو أستاذ جامعي. تقدر تغيّر الدور في كل تحدٍّ.","Try judge, lawyer, or professor. Choose again at each new milestone.")+"</p>"+
  "<a class='lexExtensionAction' href='"+href+"'>"+tr(lang,"ابدأ التحدي الاختياري","Start the optional role challenge")+"</a></section>";
}
function mountCareerCard(node,opts){
 if(!node||!opts||!isMilestone(opts.session))return;
 visible(node,careerCard(opts.session,opts.lang||"ar"));
}
function roleTasks(lang){
 return {
 judge:{name:tr(lang,"قاضي","Judge"),lead:tr(lang,
  "تخيّل أنك القاضي في الواقعة الواردة أدناه. اذكر الوقائع الحاسمة، والقاعدة القانونية، ثم حكمك التدريبي وأسبابك.",
  "You are the judge in the approved case below. State the key facts, the legal rule, your mock decision, and your reasons.")},
 lawyer:{name:tr(lang,"محامي","Lawyer"),lead:tr(lang,
  "اختَر طرفًا من أطراف الواقعة وقدّم مرافعة عنه. حدد طلبك القانوني وأسانيده وكيف تطبقها على الوقائع.",
  "Represent one party in the approved case. State your request, legal grounds, and application to the facts.")},
 professor:{name:tr(lang,"أستاذ جامعي","University professor"),lead:tr(lang,
  "اشرح القاعدة التي تناولها الدرس لطلاب الفرقة الأولى بأسلوبك، ثم قدّم مثالًا وسؤالًا يختبر الفهم.",
  "Explain the approved rule in your own words to first-year students, with an example and a checking question.")}
 };
}
function roleTask(tasks,role){
 var preferred=role==="professor"?"understanding":"exam_execution";
 return tasks.find(function(t){return t.dimension===preferred&&(t.prompt_ar||t.prompt_en)&&t.id;})||
 tasks.find(function(t){return t.dimension==="understanding"&&(t.prompt_ar||t.prompt_en)&&t.id;})||
 tasks.find(function(t){return (t.prompt_ar||t.prompt_en)&&t.id;})||null;
}
async function mountCareer(node){
 if(!node)return;
 var query=new URLSearchParams(root.location.search),lang=query.get("lang")==="en"?"en":"ar",
  n=Number(query.get("milestone")),cloud=root.LEX_CLOUD;
 if(!isMilestone(n)){visible(node,"<p>"+tr(lang,"افتح التحدي من جلساتك المكتملة.","Open the challenge from your completed sessions.")+"</p>");return;}
 visible(node,"<p role='status'>"+tr(lang,"بنجهز التحدي الخاص بك…","Preparing your role challenge…")+"</p>");
 try{
  var user=await cloud.requireStudent(),uid=user.id,db=cloud.db();
  var completed=await db.from("student_training_sessions").select("session_number,completed_at,tasks_json")
   .eq("user_id",uid).eq("course_id",COURSE).eq("session_number",n).maybeSingle();
  if(completed.error)throw completed.error;
  if(!completed.data||Number(completed.data.session_number)!==n||!completed.data.completed_at){
   visible(node,"<div class='lexExtensionCard'><h2>"+tr(lang,"تحديك القادم","Your next role challenge")+"</h2><p>"+
   tr(lang,"يفتح بعد إكمال الجلسة رقم ","Unlocks after completing session ")+n+"</p>"+
   "<a href='student-path.html?lang="+lang+"'>"+tr(lang,"ارجع إلى رحلتك","Back to learning")+"</a></div>");return;
  }
  var previous=await db.from("lex_career_trials").select("milestone_session,role_choice,representation_side,scenario_version,answer_text").eq("student_id",uid).eq("course_id",COURSE).order("milestone_session",{ascending:true});
  if(previous.error)throw previous.error;
  var records=previous.data||[],mine=records.find(function(x){return x.milestone_session===n;});
  function preference(){
   var counts={judge:0,lawyer:0,professor:0};
   records.forEach(function(x){if(Object.hasOwn(counts,x.role_choice))counts[x.role_choice]++;});
   if(!records.length)return "";
   var names=roleTasks(lang);
   return "<div class='lexExtensionPreferences'><h3>"+tr(lang,"المهن التي جرّبتها","Roles you've tried")+"</h3><p>"+
    Object.keys(counts).map(function(k){return esc(names[k].name)+": "+counts[k];}).join(" · ")+
    "</p><small>"+tr(lang,"اختياراتك تعبّر عن اهتماماتك، وليست اختبارًا لصلاحيتك المهنية.","Your choices show interests, not professional aptitude.")+"</small></div>";
  }
  if(mine&&root.LEX_CAREER_AUDIO)root.LEX_CAREER_AUDIO.mount(node,{uid:uid,n:n,lang:lang,choice:mine.role_choice+(mine.representation_side||"claimant"),role:mine.role_choice,side:mine.representation_side||"claimant",version:mine.scenario_version||"legacy"});
  if(mine){
   visible(node,"<div class='lexExtensionCard'><h1>"+tr(lang,"✓ أنهيت تحدي المهنة","✓ Role challenge completed")+"</h1><p>"+
     tr(lang,"أحسنت! جرّبت دور ","Great work trying the role of ")+esc(roleTasks(lang)[mine.role_choice]?.name||"")+
     "</p><h3>"+tr(lang,"نصك المحفوظ","Your saved answer")+"</h3><p style='white-space:pre-wrap'>"+esc(mine.answer_text||"")+"</p>"+preference()+"<a class='lexExtensionAction' href='student-path.html?lang="+lang+"'>"+tr(lang,"العودة إلى دراستك","Back to learning")+"</a></div>");return;
  }
  var taskList=tasksFrom(completed.data),roles=roleTasks(lang),selected="judge",side="claimant",inputMode="typed",recognition=null;
  function render(){
   var task=roleTask(taskList,selected),scenario=root.LEX_CAREER_CASES?.get(n,selected,side,lang);
   if(!task||!scenario){visible(node,"<p>"+tr(lang,"تحديك سيكون جاهزًا مع الدرس المعتمد.","The role challenge needs an approved lesson.")+"</p>");return;}
   visible(node,"<div class='lexExtensionCard'><span class='lexExtensionEyebrow'>"+tr(lang,"تحدي الجلسة ","Session challenge ")+n+
    "</span><h1>"+tr(lang,"اختار مهنتك القادمة","Choose your future role")+"</h1>"+
    "<p>"+tr(lang,"كل مهنة بتشوف نفس القانون من زاوية مختلفة. تقدر تختار وظيفة جديدة في المرة القادمة.","Each role explores the law differently. You can switch next time.")+"</p>"+
    "<div class='lexRoleGrid'>"+Object.keys(roles).map(function(k){
     return "<button type='button' data-lex-role='"+k+"' class='"+(selected===k?"chosen":"")+"' aria-pressed='"+(selected===k)+"'>"+
      esc(roles[k].name)+"</button>";
    }).join("")+"</div><h2>"+esc(roles[selected].name)+"</h2><p>"+esc(roles[selected].lead)+"</p>"+
    (selected==="lawyer"?"<label>"+tr(lang,"الطرف الذي تمثله","Your client")+" <select id=lexCareerParty><option value=claimant>"+tr(lang,"المدعي","Claimant")+"</option><option value=defendant>"+tr(lang,"المدعى عليه","Defendant")+"</option></select></label>":"")+lawContext(task,lang)+"<div class='lexExtensionPrompt'>"+esc(scenario||textOf(task,lang))+"</div>"+
    "<label for='lexCareerAnswer'>"+tr(lang,"قدم إجابتك بأسلوبك","Give your answer in your own words")+"</label>"+
    "<textarea id='lexCareerAnswer' rows='8' maxlength='4000'></textarea>"+
    "<div class='lexCareerActions'><button type='button' id='lexCareerSave'>"+
    tr(lang,"احفظ تجربتي المهنية","Save my role challenge")+"</button>"+
    ((root.SpeechRecognition||root.webkitSpeechRecognition)?"<button type='button' class='lexSpeak' id='lexCareerSpeak'>"+
    tr(lang,"🎙️ تحويل كلامي إلى نص","🎙️ Dictate my answer")+"</button>":"")+
    "</div><p class='lexExtensionStatus' id='lexCareerStatus' role='status' aria-live='polite'></p>"+
    "<small>"+tr(lang,
     "هذا تدريب اختياري، ولا يؤثر على درجاتك. إذا استخدمت الإملاء الصوتي فقد يعتمد على خدمة المتصفح؛ راجع النص قبل حفظه. لا نخزن تسجيلًا صوتيًا.",
     "This is optional and non-credit. Browser dictation may use an external speech service; review the transcript before saving. No audio recording is stored.")+"</small></div>");
   node.querySelectorAll("[data-lex-role]").forEach(function(b){b.onclick=function(){if(recognition)try{recognition.stop();}catch(_){} selected=b.dataset.lexRole;inputMode="typed";render();};});
   var party=node.querySelector("#lexCareerParty");if(party){party.value=side;party.onchange=function(){side=party.value;render();};}
   if(root.LEX_CAREER_AUDIO)root.LEX_CAREER_AUDIO.mount(node,{uid:uid,n:n,lang:lang,choice:selected+side,role:selected,side:side,version:"career-roles-v2"});
   var save=node.querySelector("#lexCareerSave"),area=node.querySelector("#lexCareerAnswer"),status=node.querySelector("#lexCareerStatus");
   var speak=node.querySelector("#lexCareerSpeak");
   if(speak)speak.onclick=function(){
    var Speech=root.SpeechRecognition||root.webkitSpeechRecognition;
    try{
     recognition=new Speech();recognition.lang=lang==="ar"?"ar-QA":"en-US";recognition.interimResults=false;recognition.continuous=false;
     recognition.onresult=function(ev){var transcript=Array.from(ev.results).map(function(r){return r[0].transcript;}).join(" ").trim();if(transcript){area.value=(area.value+" "+transcript).trim();inputMode="speech_transcript";status.textContent=tr(lang,"راجع النص وعدّله إذا احتاج، ثم احفظه.","Review and edit the transcript before saving.");}};
     recognition.onerror=function(){status.textContent=tr(lang,"تقدر تكتب الإجابة مباشرة.","You can type your answer instead.");};
     recognition.start();status.textContent=tr(lang,"اتكلم دلوقتي…","Speak now…");
    }catch(_){status.textContent=tr(lang,"الإجابة الكتابية متاحة دائمًا.","Typing is always available.");}
   };
   save.onclick=async function(){
    var answer=area.value.trim();
    if(answer.length<20){status.textContent=tr(lang,"كمّل فكرتك في جملتين على الأقل، وبعدين احفظها.","Add a couple of sentences, then save.");return;}
    save.disabled=true;status.textContent=tr(lang,"بنحفظ إجابتك…","Saving your answer…");
    try{
     var r=await db.from("lex_career_trials").insert({
       student_id:uid,course_id:COURSE,milestone_session:n,source_item_id:String(task.id),
       role_choice:selected,answer_text:answer,input_mode:area.dataset?.speechTranscribed?"speech_transcript":inputMode,scenario_version:"career-roles-v2",representation_side:side
     });
     var savedRole=selected;
     if(r.error){
      if(r.error.code!=="23505")throw r.error;
      var prior=await db.from("lex_career_trials").select("role_choice").eq("student_id",uid).eq("course_id",COURSE).eq("milestone_session",n).maybeSingle();
      if(prior.error||!prior.data||!Object.hasOwn(roles,prior.data.role_choice))throw new Error("role_save_unconfirmed");
      savedRole=prior.data.role_choice;
     }
     records.push({milestone_session:n,role_choice:savedRole});
     visible(node,"<section class='lexExtensionCard'><h1>"+tr(lang,"✓ أول خطوة في مهنتك","✓ Your professional journey begins")+
      "</h1><p>"+tr(lang,"أحسنت! حفظنا محاولتك التدريبية. تقدر تجرب مهنة تانية في التحدي القادم.","Great work! Your practice is saved. Try another role at your next milestone.")+
      "</p>"+preference()+"<a class='lexExtensionAction' href='student-path.html?lang="+lang+"'>"+tr(lang,"أكمل رحلتك","Continue learning")+"</a></section>");
    }catch(_){save.disabled=false;status.textContent=tr(lang,"تقدر تحتفظ بإجابتك الآن وترجع لحفظها لاحقًا.","You can keep your answer and try saving again later.");}
   };
  }
  render();
 }catch(_){note(node,lang);}
}
var api={isMilestone:isMilestone,eligibleReview:eligibleReview,reviewSource:reviewSource,roleTask:roleTask,careerCard:careerCard,mountReview:mountReview,mountCareerCard:mountCareerCard,mountCareer:mountCareer};
root.LEX_LEARNER_EXTENSIONS=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
