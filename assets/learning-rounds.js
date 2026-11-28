/* Short rounds and optional post-session practice. Never assigns official scores. */
(function(root){"use strict";
var COURSE="qa-qu-lawc101-rights",VERSION="learning-rounds-v1";
function tr(lang,ar,en){return lang==="en"?en:ar;}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function enabled(){return !!(root.LEX_CONFIG&&root.LEX_CONFIG.learningRoundsV1===true);}
function id(){return root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():null;}
function privateOptOut(){var n=root.navigator||{};return n.globalPrivacyControl===true||n.doNotTrack==="1"||root.doNotTrack==="1";}
function key(o){return VERSION+":"+o.uid+":"+o.session;}
function sessionFlag(o,value){try{if(value===undefined)return root.sessionStorage.getItem(key(o));root.sessionStorage.setItem(key(o),value);}catch(_){}return null;}
async function event(o,type,extra,essential){
 if(!o||!o.cloud||!o.uid||(!essential&&privateOptOut()))return false;
 var uuid=id();if(!uuid)return false;
 try{
  var row={id:uuid,student_id:o.uid,course_id:COURSE,session_number:o.session,event_type:type,item_id:extra&&extra.itemId||null,reason:extra&&extra.reason||null};
  var request=o.cloud.db().from("lex_learning_events").insert(row).select("id").maybeSingle(),timer;
  var r=await Promise.race([request,new Promise(function(resolve){timer=root.setTimeout(function(){resolve({error:true});},4000);})]);
  root.clearTimeout(timer);
  return !r.error&&r.data&&r.data.id===uuid;
 }catch(_){root.clearTimeout(timer);return false;}
}
function supportLevel(history){
 var a=(Array.isArray(history)?history:[]).filter(function(x){return x&&Number.isFinite(x.percent)&&x.percent>=0&&x.percent<=100;}).slice(0,3);
 if(a.length>=3&&a.every(function(x){return x.percent>=85;}))return "none";
 if(a.length>=2&&a.slice(0,2).every(function(x){return x.percent>=80;}))return "hint";
 if(a.length&&a[0].percent>=60)return "partial";
 return "example";
}
function context(item,lang){return root.LEX_LEGAL_STUDY&&root.LEX_LEGAL_STUDY.context?root.LEX_LEGAL_STUDY.context(item.sources||[],lang):"<p><b>"+tr(lang,"دولة قطر · القانون المدني رقم 22 لسنة 2004","Qatar · Civil Code, Law No. 22 of 2004")+"</b></p>";}
function field(item,name,lang){return String(item&&item[name+(lang==="en"?"_en":"_ar")]||"");}
function facts(item,lang){
 var p=field(item,"prompt",lang),g=root.LEX_LEGAL_CASE_GUIDE;
 var parsed=g&&g.parse&&g.parse(p,lang);
 return parsed&&parsed.facts?String(parsed.facts):p.split("\n")[0];
}
function variants(items){
 var out=[],seen={};
 (Array.isArray(items)?items:[]).forEach(function(item){
  if(!item||!item.id||!Array.isArray(item.sources)||!item.sources.length)return;
  function add(kind){if(!seen[kind]){out.push({kind:kind,item:item});seen[kind]=true;}}
  if(item.dimension==="recall"&&item.rule_ar&&item.rule_en)add("recall");
  if(item.dimension==="understanding"&&item.rule_ar&&item.rule_en){
   add("explain");
   if(Array.isArray(item.comparison_ar)&&Array.isArray(item.comparison_en)&&item.comparison_ar.length===2&&item.comparison_en.length===2){
    var wrong=(Array.isArray(item.inaccurate_ar)?item.inaccurate_ar:[]),matches=item.comparison_ar.filter(function(s){return wrong.indexOf(s)>=0;});
    if(matches.length===1){add("correct_error");add("classify");}
   }
  }
  if(item.dimension==="exam_execution"&&item.outcome_ar&&item.outcome_en&&item.rule_ar&&item.rule_en)add("application");
 });
 return out;
}
function kindName(kind,lang){var ar={recall:"استرجاع قصير",explain:"شرح المعنى",correct_error:"تصحيح عبارة",classify:"اختيار مع مراجعة",application:"تطبيق على واقعة"};
 var en={recall:"Short recall",explain:"Explain meaning",correct_error:"Correct a statement",classify:"Choose and review",application:"Apply to facts"};return (lang==="en"?en:ar)[kind]||kind;}
function roleName(role,lang){return {none:tr(lang,"بأسلوبك","Your own approach"),judge:tr(lang,"قاضٍ","Judge"),lawyer:tr(lang,"محامٍ","Lawyer"),professor:tr(lang,"أستاذ جامعي","University professor")}[role];}
function prompt(v,role,lang){
 var i=v.item;
 if(v.kind==="application"){
  var lead=role==="judge"?tr(lang,"كقاضٍ في هذا التدريب، ما قرارك؟ اذكر سببًا من القاعدة.","As the judge in this practice, what is your decision? Give a reason from the rule."):
   role==="lawyer"?tr(lang,"كمحامٍ، قدّم رأيًا قصيرًا لمن سألك عن هذه الواقعة. اذكر النتيجة وسببها القانوني.","As a lawyer, give a short opinion to someone asking about these facts. State the outcome and its legal reason."):
   role==="professor"?tr(lang,"كأستاذ جامعي، اشرح لطالب جديد كيف تصل إلى النتيجة من هذه الواقعة والقاعدة.","As a professor, explain to a new student how the facts and rule lead to the outcome."):
   tr(lang,"ما النتيجة في هذه الواقعة؟ اربطها بشرط من القاعدة.","What is the outcome here? Connect it to one condition in the rule.");
  return "<p>"+esc(facts(i,lang))+"</p><p>"+esc(lead)+"</p>";
 }
 if(v.kind==="recall")return "<p>"+tr(lang,"من ذاكرتك، اكتب الفكرة القانونية ثم شرطًا مؤثرًا فيها. لا يلزم مقال طويل.","From memory, state the legal idea and one condition that matters. A long answer is not needed.")+"</p>";
 if(v.kind==="explain")return "<p>"+tr(lang,"اشرح معنى القاعدة بأسلوبك في جمل قصيرة. بيّن العلاقة بين الحكم وشرطه.","Explain the rule in short sentences of your own. Show how the legal result depends on its condition.")+"</p>";
 var statements=lang==="en"?i.comparison_en:i.comparison_ar;
 return "<p>"+tr(lang,v.kind==="classify"?"اختر العبارة الأدق. ستراجع التفسير بعد حفظ محاولتك.":"أي العبارتين غير دقيقة؟ صححها واذكر الفرق.",v.kind==="classify"?"Choose the more accurate statement, then review the explanation after saving.":"Which statement is inaccurate? Correct it and explain the difference.")+"</p>"+
  statements.map(function(s,n){return "<div class='roundStatement'>"+(v.kind==="classify"?"<label><input type='radio' name='roundChoice' value='"+n+"'> ":"<b>"+(n+1)+". </b>")+esc(s)+(v.kind==="classify"?"</label>":"")+"</div>";}).join("");
}
function model(item,level,lang){
 var rule=field(item,"rule",lang),outcome=field(item,"outcome",lang);
 if(level==="none")return "<p>"+tr(lang,"ابدأ بمحاولة مستقلة. يمكنك طلب تلميح إذا احتجت.","Try independently first. You can ask for a hint if needed.")+"</p>";
 if(level==="hint")return "<p>"+tr(lang,"تلميح: حدّد الشرط الحاسم، ثم ابحث عن الواقعة التي تحققه أو تنفيه.","Hint: identify the decisive condition, then the fact that satisfies or defeats it.")+"</p>";
 var body="<h4>"+tr(lang,"القاعدة التي نعتمد عليها","The rule we use")+"</h4><p>"+esc(rule)+"</p>";
 if(level==="example"&&outcome)body="<h4>"+tr(lang,"الواقعة المعتمدة","Approved facts")+"</h4><p>"+esc(facts(item,lang))+"</p>"+body+
  "<h4>"+tr(lang,"ربطها بالنتيجة","Connecting it to the outcome")+"</h4><p>"+esc(outcome)+"</p>";
 else body+="<p>"+tr(lang,"أكمل أنت: أي واقعة في السؤال ترتبط بهذا الشرط؟ وما أثرها؟","Complete the next step: which fact connects to this condition, and what follows?")+"</p>";
 return body+context(item,lang);
}
function roundHtml(o){
 var data=o.data||{},saved=Array.isArray(data.saved)?data.saved:[],total=(data.tasks||[]).length;
 if(!total)return "";
 return "<section class='learningRound' aria-labelledby='learningRoundTitle'><div><p class='roundEyebrow'>"+tr(o.lang,"خطوة واحدة في كل مرة","One step at a time")+"</p><h2 id='learningRoundTitle'>"+
  (data.completed?tr(o.lang,"اكتملت إجابات هذه الجلسة","This session's answers are saved"):tr(o.lang,"جولة ","Round ")+Math.min(saved.length+1,total)+tr(o.lang," من "," of ")+total)+
  "</h2><p>"+(saved.length?tr(o.lang,"المحفوظ في حسابك: ","Saved to your account: ")+saved.length+" / "+total:tr(o.lang,"ابدأ بالسؤال الحالي. يمكنك التوقف بعد حفظ الإجابة.","Start with this question. You can stop after saving your answer."))+"</p></div>"+
  "<div class='roundActions'><button type='button' data-round-break>"+tr(o.lang,"استراحة","Take a break")+"</button><button type='button' data-round-pause>"+tr(o.lang,"أكمل لاحقًا","Continue later")+"</button></div>"+
  "<div class='roundPause' hidden><p>"+tr(o.lang,"يمكنك العودة إلى الإجابات المحفوظة. ما سبب توقفك؟ الإجابة اختيارية.","You can return to your saved answers. Why are you stopping? Answering is optional.")+"</p><div class='roundReasons'>"+
  [["repetition","تكرار","Repetition"],["too_hard","صعوبة","Too difficult"],["tired","تعب","Tired"],["short_of_time","ضيق وقت","Short of time"],["other","سبب آخر","Another reason"]].map(function(r){return "<button type='button' data-round-reason='"+r[0]+"' aria-pressed='false'>"+tr(o.lang,r[1],r[2])+"</button>";}).join("")+
  "</div><a class='roundLeave' href='student"+(o.lang==="en"?"-en":"")+".html'>"+tr(o.lang,"العودة إلى حسابي","Back to my account")+"</a></div><p class='roundStatus' role='status' aria-live='polite'></p></section>";
}
function mountRound(node,o){
 if(!enabled()||!node||!o||!o.data||o.data.allowed!==true)return;
 node.innerHTML=roundHtml(o);var panel=node.querySelector(".roundPause"),status=node.querySelector(".roundStatus"),reason=null;
 if(!panel)return;
 var marker=sessionFlag(o);
 if(marker==="paused"&&(o.data.saved||[]).length){sessionFlag(o,"resumed");event(o,"round_resumed");}
 var openKey=key(o)+":opened:"+((o.data.saved||[]).length);try{if(!root.sessionStorage.getItem(openKey)){root.sessionStorage.setItem(openKey,"1");event(o,"round_opened");}}catch(_){}
 node.querySelector("[data-round-pause]").onclick=function(){
  if(o.hasDraft&&o.hasDraft()){status.textContent=tr(o.lang,"إجابتك الحالية لم تُحفظ بعد. احفظها أولًا، أو خذ استراحة مع إبقاء الصفحة مفتوحة.","Your current answer is not saved yet. Save it first, or take a break with this page open.");return;}
  panel.hidden=!panel.hidden;
 };
 node.querySelectorAll("[data-round-reason]").forEach(function(b){b.onclick=function(){reason=b.dataset.roundReason;node.querySelectorAll("[data-round-reason]").forEach(function(x){x.setAttribute("aria-pressed",String(x===b));});};});
 node.querySelector(".roundLeave").onclick=async function(e){e.preventDefault();sessionFlag(o,"paused");var href=this.href;await Promise.all([event(o,"pause_requested"),reason?event(o,"exit_reason",{reason:reason},true):Promise.resolve(false)]);root.location.assign(href);};
 node.querySelector("[data-round-break]").onclick=function(){
  var coach=root.LEX_STUDY_COACH;
  if(coach&&coach.openBreak&&coach.openBreak({learnerId:o.uid,language:o.lang,onEvent:function(type){event(o,type);}}))return;
  status.textContent=tr(o.lang,"يمكنك الاستراحة والعودة إلى الصفحة. تبقى إجابتك المكتوبة هنا ما دمت لم تغلقها.","Take a break and return to this page. Your draft stays here while the page remains open.");
 };
 var c=root.LEX_STUDY_COACH,advice=c&&c.advice&&c.advice();
 if(advice)status.textContent=tr(o.lang,"قد يناسبك الآن أخذ استراحة قصيرة. القرار لك.","A short break may help now. You choose when to take it.");
}
async function mountPractice(node,o){
 if(!enabled()||!node||!o||!o.data||o.data.allowed!==true||o.data.completed!==true)return;
 node.innerHTML="<details class='learningPractice'><summary>"+tr(o.lang,"غيّر طريقة التدريب — اختياري","Try a different practice format — optional")+"</summary><div class='roundPracticeBody'><p role='status'>"+tr(o.lang,"نجهّز تدريبك المحفوظ…","Preparing practice from your saved session…")+"</p></div></details>";
 var details=node.querySelector("details"),body=node.querySelector(".roundPracticeBody"),loaded=false;
 details.addEventListener("toggle",async function(){
  if(!details.open||loaded)return;loaded=true;
  try{
   var r=await o.cloud.db().rpc("lex_learning_support",{p_course:COURSE,p_session:o.session});
   if(r.error||!r.data||r.data.allowed!==true)throw Error("support_unavailable");
   var options=variants(r.data.items);
   if(!options.length)throw Error("no_approved_variant");
   var chosen=options[o.session%options.length],role="none",currentLevel="none",recommended=supportLevel(chosen.item.confirmed_history),attemptId=id(),saved=false,draft="",choice="",busy=false,helpByItem={};
   options.forEach(function(v){if(v.item.help_opened)helpByItem[v.item.id]="hint";});
   function helpLevel(){return helpByItem[chosen.item.id]||"none";}
   var names=options.map(function(v){return kindName(v.kind,o.lang);});
   function remember(){var a=body.querySelector("textarea");if(a)draft=a.value;var checked=body.querySelector("input[name=roundChoice]:checked");if(checked)choice=checked.value;}
   function render(){
    body.innerHTML="<p>"+tr(o.lang,"جرّب شكلًا مختلفًا للسؤال نفسه أو للمهارة نفسها. هذه محاولة تدريبية لا تغيّر درجات الجلسة.","Try another format for the same question or skill. This practice does not change session scores.")+"</p>"+
     "<div class='roundTaskKinds' role='group' aria-label='"+tr(o.lang,"نوع المهمة","Task format")+"'>"+options.map(function(v,n){return "<button type='button' data-round-kind='"+n+"' aria-pressed='"+(chosen===v)+"'>"+esc(names[n])+"</button>";}).join("")+"</div>"+
     "<h3>"+esc(field(chosen.item,"title",o.lang))+"</h3>"+context(chosen.item,o.lang)+
     (chosen.kind==="application"?"<div class='roundRoles' role='group' aria-label='"+tr(o.lang,"منظور السؤال","Question perspective")+"'>"+["none","judge","lawyer","professor"].map(function(k){return "<button type='button' data-round-role='"+k+"' aria-pressed='"+(role===k)+"'>"+roleName(k,o.lang)+"</button>";}).join("")+"</div>":"")+
     "<div class='roundTaskPrompt'>"+prompt(chosen,role,o.lang)+"</div>"+
     "<details class='roundOriginal'><summary>"+tr(o.lang,"السؤال الأصلي المعتمد","Original approved question")+"</summary><p style='white-space:pre-wrap'>"+esc(field(chosen.item,"prompt",o.lang))+"</p></details>"+
     (currentLevel!=="none"?"<section class='roundModel'><h4>"+tr(o.lang,"مساعدة لهذه المحاولة","Help for this attempt")+"</h4>"+model(chosen.item,currentLevel,o.lang)+"</section>":"")+
     "<div class='roundActions'><button type='button' data-round-help>"+(currentLevel==="none"?tr(o.lang,"أحتاج مساعدة","I need help"):currentLevel==="hint"?tr(o.lang,"أحتاج مثالًا","I need an example"):tr(o.lang,"تلميح أقصر","Shorter hint"))+"</button></div>"+
     (chosen.kind==="classify"?"":"<label for='roundPracticeAnswer'>"+tr(o.lang,"اكتب إجابتك في جمل قصيرة","Write your answer in short sentences")+"</label><textarea id='roundPracticeAnswer' rows='3' maxlength='4000'>"+esc(draft)+"</textarea>")+
     "<p class='roundAssistanceLabel'>"+(helpLevel()==="none"?tr(o.lang,"محاولة دون فتح المساعدة هنا · خارج الدرجة الرسمية","No help opened here · outside the official score"):tr(o.lang,"محاولة بمساعدة · لا تُعد قياسًا مستقلًا","Assisted attempt · not an independent measure"))+"</p>"+
     "<button type='button' data-round-save>"+tr(o.lang,"احفظ المحاولة وراجع الفكرة","Save attempt and review")+"</button><p class='roundPracticeStatus' role='status' aria-live='polite'></p>";
    if(choice!==""){var input=body.querySelector("input[value='"+choice+"']");if(input)input.checked=true;}
    body.querySelectorAll("[data-round-kind]").forEach(function(b){b.onclick=function(){remember();if(draft.trim()||choice!==""){body.querySelector(".roundPracticeStatus").textContent=tr(o.lang,"احفظ محاولتك الحالية أولًا قبل تغيير نوع المهمة.","Save this attempt before changing the task format.");return;}chosen=options[Number(b.dataset.roundKind)];recommended=supportLevel(chosen.item.confirmed_history);currentLevel="none";role="none";attemptId=id();render();};});
    body.querySelectorAll("[data-round-role]").forEach(function(b){b.onclick=function(){remember();if(draft.trim()){body.querySelector(".roundPracticeStatus").textContent=tr(o.lang,"احفظ محاولتك قبل تغيير المنظور.","Save this attempt before changing perspective.");return;}role=b.dataset.roundRole;render();};});
    body.querySelector("[data-round-help]").onclick=async function(){if(busy)return;remember();busy=true;
     var status=body.querySelector(".roundPracticeStatus"),ok=await event(o,"support_opened",{itemId:chosen.item.id},true);
     busy=false;if(!ok){status.textContent=tr(o.lang,"لم يتأكد تسجيل المساعدة. يمكنك المحاولة دونها أو العودة لاحقًا.","Help could not be recorded. You can try without it or return later.");return;}
     currentLevel=currentLevel==="none"?(recommended==="none"?"hint":recommended):currentLevel==="hint"?"example":"hint";
     var rank={none:0,hint:1,partial:2,example:3};if(rank[currentLevel]>rank[helpLevel()])helpByItem[chosen.item.id]=currentLevel;render();
    };
    body.querySelector("[data-round-save]").onclick=save;
   }
   async function save(){
    if(saved||busy)return;remember();var status=body.querySelector(".roundPracticeStatus");
    var statements=o.lang==="en"?chosen.item.comparison_en:chosen.item.comparison_ar;
    var answer=chosen.kind==="classify"&&choice!==""?String(Number(choice)+1)+": "+statements[Number(choice)]:draft.trim();
    if(answer.length<2||answer.length>4000){status.textContent=tr(o.lang,"اكتب إجابة قصيرة أو اختر عبارة أولًا.","Write a short answer or choose a statement first.");return;}
    if(!attemptId){status.textContent=tr(o.lang,"تعذر بدء الحفظ على هذا المتصفح.","Saving is unavailable in this browser.");return;}
    busy=true;body.querySelector("[data-round-save]").disabled=true;
    try{
     var row={id:attemptId,student_id:o.uid,course_id:COURSE,after_session:o.session,source_item_id:chosen.item.id,task_kind:chosen.kind,role_choice:role,support_level:helpLevel(),assisted:helpLevel()!=="none",answer_text:answer};
     var write=await o.cloud.db().from("lex_learning_practice").insert(row).select("id,measurement_kind").maybeSingle();
     if(write.error&&write.error.code==="23505")write=await o.cloud.db().from("lex_learning_practice").select("id,measurement_kind").eq("id",attemptId).eq("student_id",o.uid).maybeSingle();
     if(write.error||!write.data||write.data.id!==attemptId||write.data.measurement_kind!=="practice")throw Error("practice_unconfirmed");
     saved=true;event(o,"practice_saved",{itemId:chosen.item.id});
     body.innerHTML="<p role='status'><b>"+tr(o.lang,"حُفظت محاولتك التدريبية.","Your practice attempt is saved.")+"</b></p>"+context(chosen.item,o.lang)+
      "<p>"+tr(o.lang,"قارن فكرتك بالقاعدة والنتيجة المعتمدتين. لا تصدر نسبة من هذه المحاولة.","Compare your reasoning with the approved rule and outcome. This attempt does not issue a percentage.")+"</p>"+
      model(chosen.item,"example",o.lang)+"<p class='roundAssistanceLabel'>"+(helpLevel()==="none"?tr(o.lang,"المساعدة ظهرت بعد حفظ الإجابة.","Help was shown after saving your answer."):tr(o.lang,"المحاولة محفوظة بوصفها محاولة بمساعدة.","Saved as an assisted attempt."))+"</p>";
    }catch(_){status.textContent=tr(o.lang,"لم يتأكد الحفظ. إجابتك باقية هنا؛ حاول مجددًا عند عودة الاتصال.","Saving is unconfirmed. Your answer stays here; try again when connected.");body.querySelector("[data-round-save]").disabled=false;}
    finally{busy=false;}
   }
   render();
  }catch(_){body.innerHTML="<p>"+tr(o.lang,"التدريب الإضافي غير متاح الآن. إجابات الجلسة محفوظة ويمكنك متابعة رحلتك.","Extra practice is unavailable now. Your session answers remain saved and you can continue.")+"</p>";}
 });
}
var api={enabled:enabled,event:event,supportLevel:supportLevel,variants:variants,roundHtml:roundHtml,mountRound:mountRound,mountPractice:mountPractice,prompt:prompt,model:model,version:VERSION};
root.LEX_LEARNING_ROUNDS=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);

