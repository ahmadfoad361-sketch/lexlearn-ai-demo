/* Official, authenticated diagnostic. Public showcase is never an input. Issue #36. */
(function(root){
"use strict";
var COURSE_SCOPE="qa-rights",COURSE_DB_ID="qa-qu-lawc101-rights",VERSION=2,RUBRIC="lexdiagnostic-objective-v2";
var QUESTIONS=[
 {id:"q39r",dimension:"recognition",ar:"متى تبدأ الشخصية القانونية للإنسان كأصل وفق المادة 39؟",en:"When does legal personality begin as a general rule under Article 39?",arOptions:["بتمام ولادته حيًا","عند إتمام السابعة","عند تمام 18 سنة"],enOptions:["Upon live birth","At age seven","At age eighteen"],a:0},
 {id:"q49r",dimension:"recognition",ar:"ما سن الرشد كأصل وفق المادة 49؟",en:"What is the general age of majority under Article 49?",arOptions:["21 سنة","18 سنة كاملة","7 سنوات"],enOptions:["Twenty-one","Eighteen full years","Seven"],a:1},
 {id:"q62r",dimension:"recognition",ar:"أي عبارة أقرب إلى قاعدة المادة 62؟",en:"Which statement best reflects Article 62?",arOptions:["كل ضرر يوجب التعويض","كل استعمال للحق ممنوع","الاستعمال المشروع لا يرتب المسؤولية لمجرد الضرر"],enOptions:["Every harm requires compensation","Every exercise of a right is forbidden","Lawful exercise does not create liability merely because harm occurs"],a:2},
 {id:"q39u",dimension:"understanding",ar:"وُلد طفل حيًا ثم توفي بعد ساعات. ما التفسير الأدق؟",en:"A child was born alive and died hours later. Which explanation is most accurate?",arOptions:["لم تثبت له شخصية قانونية","ثبتت له الشخصية عند الولادة وانتهت بالوفاة","تبدأ الشخصية عند الرشد"],enOptions:["No legal personality arose","Personality began at live birth and ended at death","Personality begins at majority"],a:1},
 {id:"q50u",dimension:"understanding",ar:"طفل عمره ست سنوات يملك مالًا ويحاول إبرام تصرف قانوني بنفسه. أي تفسير قانوني أدق؟",en:"A six-year-old owns property and attempts to enter a legal transaction alone. Which explanation is legally sound?",arOptions:["له أهلية الأداء الكاملة لأنه يملك مالًا","لا يكون أهلًا لأداء التصرفات القانونية لكونه عديم التمييز، وإن أمكن أن تثبت له حقوق","لا تثبت له شخصية قانونية حتى يبلغ السابعة"],enOptions:["Owning property gives him full capacity to act","He lacks capacity to enter legal acts because he is below the age of discernment, though rights may vest in him","He has no legal personality until age seven"],a:1},
 {id:"q63a",dimension:"application",ar:"يستعمل شخص حقًا بهدف الإضرار بالغير وحده. ما التكييف الأقرب؟",en:"Someone exercises a right solely to harm another. What is the closest legal classification?",arOptions:["يكون مشروعًا دائمًا","يكفي وجود الحق لاستبعاد التعسف","يكون استعمالًا غير مشروع للحق لانفراد قصد الإضرار"],enOptions:["Always lawful","Having a right always excludes abuse","It is an unlawful exercise of the right because causing harm was the sole aim"],a:2}
];
function valid(x,uid){
 return !!(x&&x.version===VERSION&&x.source==="student_official_diagnostic"&&x.completed_at&&x.student_id===uid&&x.course_id===COURSE_DB_ID&&x.attempt_id&&x.measurements&&x.trainingPlan);
}
function scored(rows,dim){
 var a=rows.filter(function(x){return x.dimension===dim&&Number.isInteger(x.selected)&&x.selected>=0&&x.selected<=2;});
 return {value:a.length?Math.round(100*a.filter(function(x){return x.correct;}).length/a.length):null,
  measured:a.length>0,item_count:a.length,method:"objective_mcq",status:a.length?"provisional_objective":"not_measured",
  source_id:"student_diagnostic_mcq",rubric_version:RUBRIC};
}
function build(uid,rows,free,attemptId,date){
 var recognition=scored(rows,"recognition"),understanding=scored(rows,"understanding"),application=scored(rows,"application");
 // Recognition of an answer is not unaided free recall. Do not turn it into a memorization grade.
 var recall={value:null,measured:false,item_count:free.trim()?1:0,method:"human_review_required",status:free.trim()?"pending_human_review":"not_measured",source_id:"student_diagnostic_free",rubric_version:RUBRIC};
 var profile="insufficient_evidence";
 if(recognition.item_count>=2&&understanding.item_count>=2){
  // Low-both signals guided foundations, not high-confidence balanced skills.
  if(recognition.value<45&&understanding.value<45)profile="foundation";
  else if(recognition.value-understanding.value>=25)profile="recall-led";
  else if(understanding.value-recognition.value>=25)profile="understanding-led";
  else profile="balanced";
 }
 var plans={
  "recall-led":{mode:"recall-led",weakest:"understanding",firstTasks:["explain_rule","change_one_fact","supported_retrieval"],reason_ar:"التعرّف على القواعد في الأسئلة الموضوعية أقوى من تفسيرها؛ نبدأ بشرح السبب وتغيير واقعة. لا نعتبر هذا قياسًا للحفظ الحر.",reason_en:"Objective rule recognition exceeded explanatory understanding; start with explanation and a changed fact. This is not a free-recall score."},
  "understanding-led":{mode:"understanding-led",weakest:"recall",firstTasks:["memory_cues","reconstruct","delayed_retrieval"],reason_ar:"تفسير القاعدة أقوى من التعرف الموضوعي عليها؛ نبدأ بمفاتيح استرجاع ثم إعادة البناء. الحفظ الحر ينتظر المراجعة.",reason_en:"Explanatory understanding exceeded objective rule recognition; start with retrieval cues and reconstruction. Free recall awaits review."},
  "balanced":{mode:"balanced",weakest:"application",firstTasks:["supported_rule","one_fact","retrieval_check"],reason_ar:"الأسئلة الموضوعية لا تكفي لتحديد أولوية قاطعة؛ نبدأ بمراجعة متوازنة ثم نعيد القياس.",reason_en:"Objective evidence does not establish a clear dominant skill; start with balanced practice and reassess."},
  "insufficient_evidence":{mode:"foundation",weakest:"foundation",firstTasks:["worked_example","supported_decision","unaided_check"],reason_ar:"لا توجد إجابات موضوعية كافية للمقارنة؛ تبدأ جلسة تأسيسية دون افتراض ضعف أو قوة مؤكدة.",reason_en:"There is insufficient comparable objective evidence; begin with supported foundations without assuming strength or weakness."}
 };
 var plan=plans[profile]||plans.insufficient_evidence; // foundation shares the safe no-assumptions plan
 return {version:VERSION,source:"student_official_diagnostic",student_id:uid,course_id:COURSE_DB_ID,attempt_id:attemptId,completed_at:date,legal_reference:"Qatar Civil Code Law 22/2004 Arts 39,49,50,62,63",review_status:free.trim()?"pending_human_review":"not_requested",
  measurements:{recognition:recognition,recall:recall,understanding:understanding,application:application,
    legal_precision:{value:null,measured:false,item_count:0,status:"not_measured",method:"none",rubric_version:RUBRIC,source_id:null},
    exam:{value:null,measured:false,item_count:0,status:"not_measured",method:"none",rubric_version:RUBRIC,source_id:null},
    retention:{value:null,measured:false,item_count:0,status:"not_measured",method:"none",rubric_version:RUBRIC,source_id:null}},
  metrics:{recall:null,understanding:understanding.value,application:application.value,legal_precision:null,exam:null,retention:null},
  choiceIndicators:{recognition:recognition.value,understanding:understanding.value,application:application.value},
  profileType:profile,trainingPlan:plan,free_answer:free.trim(),answers:rows.map(function(r){return {question_id:r.id,dimension:r.dimension,selected:r.selected,correct:r.correct};}),rubric_version:RUBRIC};
}
function localProfileKey(uid){return "lexlearn_v9_profile_"+uid;}
function localCourseKey(uid){return "lexlearn_course_v2_qa_rights_"+uid;}
function defaultCourse(attemptId,plan){return {session:1,started:true,completed:[],evidence:[],errors:[],history:[],lastAssessment:null,weekResults:{},repairRequired:false,repairWeek:null,adminOverrideWeeks:{},achievements:[],completedProgram:false,completedAt:null,diagnosticAttemptId:attemptId,officialTrainingPlan:plan};}
function language(){return new URLSearchParams(root.location.search).get("lang")==="en"?"en":"ar";}
function target(lang){return "program"+(lang==="en"?"-en":"")+".html?country=qa&subject=rights&start=1";}
function escapeHtml(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&quot;"}[c];});}
function message(lang,ar,en){return lang==="en"?en:ar;}
async function identity(cloud){
 var c=cloud&&cloud.db&&cloud.db();
 if(!c)throw new Error("cloud_not_configured");
 var u=await c.auth.getUser();if(u.error||!u.data||!u.data.user)throw new Error("not_authenticated");
 var profile=await cloud.profile();
 if(!profile||profile.role!=="student"||profile.active===false||profile.id!==u.data.user.id)throw new Error("student_account_not_active");
 var e=await c.from("enrollments").select("course_id,status").eq("user_id",u.data.user.id).eq("course_id",COURSE_DB_ID).eq("status","active").maybeSingle();
 if(e.error)throw e.error;if(!e.data)throw new Error("not_enrolled_in_this_course");
 var consent=await cloud.getConsent("2026-10-06-v1","learning_data");
 if(!consent)throw new Error("learning_data_consent_required");
 return u.data.user.id;
}
async function persist(cloud,uid,result){
 // Cloud is authoritative; never issue an official result based on browser storage alone.
 var old=await cloud.loadSnapshot({courseId:COURSE_SCOPE,snapshotType:"profile"});
 var profile=old&&old.state&&typeof old.state==="object"?old.state:{results:{}};
 profile.results=profile.results||{};
 if(valid(profile.results[COURSE_SCOPE],uid)){await restore(cloud,uid);return profile.results[COURSE_SCOPE];}
 var next=Object.assign({},profile,{results:Object.assign({},profile.results)});
 next.results[COURSE_SCOPE]=result;
 await cloud.saveSnapshot({courseId:COURSE_SCOPE,snapshotType:"profile",state:next,version:VERSION});
 var cs=await cloud.loadSnapshot({courseId:COURSE_SCOPE,snapshotType:"course"});
 var course=cs&&cs.state?cs.state:defaultCourse(result.attempt_id,result.trainingPlan);
 if(!course.diagnosticAttemptId)course.diagnosticAttemptId=result.attempt_id;
 if(!course.officialTrainingPlan)course.officialTrainingPlan=result.trainingPlan;
 await cloud.saveSnapshot({courseId:COURSE_SCOPE,snapshotType:"course",state:course});
 var check=await cloud.loadSnapshot({courseId:COURSE_SCOPE,snapshotType:"profile"});
 var proof=check&&check.state&&check.state.results&&check.state.results[COURSE_SCOPE];
 var checkedCourse=await cloud.loadSnapshot({courseId:COURSE_SCOPE,snapshotType:"course"});
 if(!valid(proof,uid)||proof.attempt_id!==result.attempt_id||!checkedCourse||!checkedCourse.state||checkedCourse.state.diagnosticAttemptId!==result.attempt_id)throw new Error("cloud_readback_failed");
 root.localStorage.setItem(localProfileKey(uid),JSON.stringify(check.state));
 root.localStorage.setItem(localCourseKey(uid),JSON.stringify(checkedCourse.state));
 // Secondary reporting is deliberately not a prerequisite for the authoritative snapshots.
 if(cloud.saveLearningPlan){
  try{await cloud.saveLearningPlan({course_id:COURSE_DB_ID,weakest_dimension:result.trainingPlan.weakest==="foundation"?null:result.trainingPlan.weakest,strongest_dimension:null,bridge_mode:result.trainingPlan.mode,goals_json:[{firstTasks:result.trainingPlan.firstTasks,reason:result.trainingPlan.reason_en}],model_json:{source:result.source,attempt_id:result.attempt_id,measurements:result.measurements}});}catch(_){}
 }
 return proof;
}
async function restore(cloud,uid){
 var ps=await cloud.loadSnapshot({courseId:COURSE_SCOPE,snapshotType:"profile"});
 var d=ps&&ps.state&&ps.state.results&&ps.state.results[COURSE_SCOPE];
 if(!valid(d,uid))return null;
 // Recover interrupted profile->course save without ever asking for another diagnostic.
 var cs=await cloud.loadSnapshot({courseId:COURSE_SCOPE,snapshotType:"course"});
 var course=cs&&cs.state?cs.state:defaultCourse(d.attempt_id,d.trainingPlan);
 if(course.diagnosticAttemptId&&course.diagnosticAttemptId!==d.attempt_id)throw new Error("diagnostic_course_mismatch");
 if(!cs||!cs.state||!course.diagnosticAttemptId){course.diagnosticAttemptId=d.attempt_id;course.officialTrainingPlan=d.trainingPlan;await cloud.saveSnapshot({courseId:COURSE_SCOPE,snapshotType:"course",state:course});}
 root.localStorage.setItem(localProfileKey(uid),JSON.stringify(ps.state));
 root.localStorage.setItem(localCourseKey(uid),JSON.stringify(course));
 return d;
}
var LAW_SOURCES={
 q39r:["qa-civil-2004-art39"],q49r:["qa-civil-2004-art49"],q62r:["qa-civil-2004-art62"],
 q39u:["qa-civil-2004-art39"],q50u:["qa-civil-2004-art39","qa-civil-2004-art50"],q63a:["qa-civil-2004-art63"]
};
function exactApprovedQuestion(item,q){
 var x=item||{},metadata=x.metadata||{},opts=x.options_json||{},key=x.answer_key_json||{},rubric=x.rubric_json||{},sources=x.source_ids||[];
 var independentlyApproved=!!x.reviewed_at&&!!x.legal_reviewer&&!!x.learning_reviewer&&
  x.legal_reviewer!==x.learning_reviewer&&metadata.legal_approval===true&&metadata.learning_approval===true;
 var founderPilot=metadata.owner_pilot_approved===true&&
  metadata.pilot_review_mode==="founder_authorized_ai_assisted_20261019"&&
  metadata.legal_approval===false&&metadata.learning_approval===false&&
  !x.legal_reviewer&&!x.learning_reviewer;
 return x.status==="approved"&&(independentlyApproved||founderPilot)&&
  metadata.official_diagnostic_v2_id===q.id&&x.prompt_ar===q.ar&&rubric.prompt_en===q.en&&
  JSON.stringify(opts.ar)===JSON.stringify(q.arOptions)&&
  JSON.stringify(opts.en)===JSON.stringify(q.enOptions)&&
  Number.isInteger(key.correct_index)&&key.correct_index===q.a&&
  (LAW_SOURCES[q.id]||[]).every(function(src){return sources.indexOf(src)!==-1;});
}
async function academicItemsApproved(cloud){
 var c=cloud&&cloud.db&&cloud.db();if(!c)throw new Error("cloud_not_configured");
 // Fail closed. A reviewed record must explicitly map to EACH deployed question.
 var r=await c.from("content_items").select("status,metadata,reviewed_at,legal_reviewer,learning_reviewer,prompt_ar,rubric_json,options_json,answer_key_json,source_ids")
   .eq("course_id",COURSE_DB_ID).eq("status","approved");
 if(r.error)throw r.error;
 var items=r.data||[];
 return QUESTIONS.every(function(q){return items.some(function(item){return exactApprovedQuestion(item,q);});});
}
async function mount(){
 var rootEl=root.document.getElementById("officialDiagnostic"),lang=language(),cloud=root.LEX_CLOUD;
 if(!rootEl)return;
 function show(html){rootEl.innerHTML=html;}
 show("<p role='status'>"+message(lang,"جارٍ التحقق من حسابك ومقررك…","Verifying your account and course…")+"</p>");
 var uid;
 try{uid=await identity(cloud);var old=await restore(cloud,uid);if(old){root.location.replace(target(lang));return;}
  if(!await academicItemsApproved(cloud)){show("<p role='status'>"+message(lang,"الاختبار الرسمي لم يُفتح بعد: عناصر التشخيص تنتظر الاعتماد القانوني والأكاديمي. نتائج الديمو العام لا تُنقل إلى حسابك.","The official diagnostic is locked pending legal and academic approval of every diagnostic item. Public demo scores are not imported.")+"</p><a href='student"+(lang==="en"?"-en":"")+".html'>"+message(lang,"حساب الطالب","Student portal")+"</a>");return;}}
 catch(err){show("<p role='alert'>"+escapeHtml(message(lang,"تعذّر التحقق من الحساب أو التسجيل بالمقرر: ","Cannot verify account/enrolment: ")+String(err.message||err))+"</p><a href='student-login"+(lang==="en"?"-en":"")+".html'>"+message(lang,"تسجيل الدخول","Sign in")+"</a>");return;}
 var pos=0,rows=[],busy=false,answers={},freeDraft="";
 var draftKey="lexlearn_official_diagnostic_draft_"+uid+"_"+COURSE_SCOPE;
 try{
  var oldDraft=JSON.parse(root.sessionStorage.getItem(draftKey)||"null");
  if(oldDraft&&Number.isInteger(oldDraft.pos)&&oldDraft.pos>=0&&oldDraft.pos<=QUESTIONS.length&&Array.isArray(oldDraft.rows)&&oldDraft.rows.length===oldDraft.pos&&oldDraft.rows.every(function(r,i){return r.id===QUESTIONS[i].id;})){
   pos=oldDraft.pos;rows=oldDraft.rows;answers=oldDraft.answers||{};freeDraft=String(oldDraft.free||"");
  }
 }catch(_){}
 function rememberDraft(){try{root.sessionStorage.setItem(draftKey,JSON.stringify({pos:pos,rows:rows,answers:answers,free:freeDraft}));}catch(_){}}
 function page(){
  var q=QUESTIONS[pos],last=pos===QUESTIONS.length,progress=Math.round(pos/(QUESTIONS.length+1)*100);
  var html="<p class='subtle'>"+message(lang,"تقييم الطالب الرسمي، منفصل عن الديمو العام. لا تُمنح درجة للحفظ الحر آليًا.","Official student diagnostic, separate from the public demo. Free recall is never automatically graded.")+"</p>"+
   "<p role='status'>"+message(lang,"الخطوة ","Step ")+(pos+1)+" / "+(QUESTIONS.length+1)+" · "+progress+"%</p>";
  if(!last){
   html+="<h2>"+escapeHtml(q[lang])+"</h2><fieldset><legend>"+message(lang,"اختر إجابة واحدة أو لا أدري","Choose one answer or Not sure")+"</legend>"+
    q[(lang==="en"?"en":"ar")+"Options"].map(function(o,i){return "<label class='choice'><input type='radio' name='answer' value='"+i+"' "+(answers[q.id]===i?"checked":"")+"> "+escapeHtml(o)+"</label>";}).join("")+
    "<label class='choice'><input type='radio' name='answer' value='-1' "+(answers[q.id]===-1?"checked":"")+">"+message(lang,"لا أدري — غير مقاس","Not sure — unmeasured")+"</label></fieldset>";
  }else html+="<h2>"+message(lang,"استرجع قاعدة من ذاكرتك (اختياري)","Recall a legal rule unaided (optional)")+"</h2>"+
   "<p>"+message(lang,"اكتب ما تتذكره عن بدء الشخصية القانونية؛ يُحفظ النص للمراجعة البشرية، دون تقدير دلالي مؤكد أو نسبة حفظ.","Write what you remember about when legal personality begins. This is saved for human review, with no semantic score.")+"</p><textarea id='freeRecall' rows='5' maxlength='2000' placeholder='"+message(lang,"اكتب بطريقتك…","In your own words…")+"'></textarea>";
  html+="<div class='actions'><button id='diagNext'>"+(last?message(lang,"احفظ التشخيص وابدأ الخطة","Save diagnostic & open plan"):message(lang,"التالي","Next"))+"</button></div><p id='diagError' role='alert'></p>";
  show(html);
  if(last){var freeBox=root.document.getElementById("freeRecall");freeBox.value=freeDraft;freeBox.oninput=function(){freeDraft=freeBox.value;rememberDraft();};}
  root.document.getElementById("diagNext").onclick=async function(){
   if(busy)return;
   if(!last){
    var selected=rootEl.querySelector("input[name=answer]:checked");
    if(!selected){root.document.getElementById("diagError").textContent=message(lang,"اختر إجابة أو لا أدري.","Choose an answer or Not sure.");return;}
    var pick=Number(selected.value);answers[q.id]=pick;
    rows.push({id:q.id,dimension:q.dimension,selected:pick,correct:pick===q.a});
    pos++;rememberDraft();page();return;
   }
   busy=true;var button=root.document.getElementById("diagNext");button.disabled=true;
   var free=root.document.getElementById("freeRecall").value||"";
   var attempt=(root.crypto&&root.crypto.randomUUID)?root.crypto.randomUUID():"diagnostic-"+uid+"-"+Date.now();
   var result=build(uid,rows,free,attempt,new Date().toISOString());
   try{await persist(cloud,uid,result);try{root.sessionStorage.removeItem(draftKey);}catch(_){}root.location.replace(target(lang));}
   catch(e){busy=false;button.disabled=false;root.document.getElementById("diagError").textContent=message(lang,"لم يُؤكد الحفظ المركزي. احتفظ بهذه الصفحة وأعد المحاولة: ","Central saving not confirmed. Retry here: ")+String(e.message||e);}
  };
 }
 page();
}
var api={QUESTIONS:QUESTIONS,build:build,valid:valid,persist:persist,restore:restore,identity:identity,academicItemsApproved:academicItemsApproved,exactApprovedQuestion:exactApprovedQuestion,defaultCourse:defaultCourse,mount:mount};
root.LEX_OFFICIAL_DIAGNOSTIC=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
