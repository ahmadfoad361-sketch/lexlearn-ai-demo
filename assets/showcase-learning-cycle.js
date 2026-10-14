(function (root) {
"use strict";

// A short, source-grounded learning cycle. This is educational feedback,
// not certified essay grading or a delayed-memory measurement.
function pick(ar, a, b) { return ar ? a : b; }
function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function(c) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}
function plan(weak, lang) {
  var ar = lang !== "en", mode = weak === "recall" || weak === "understanding" ? weak : "balanced";
  var recall = {
    type:"free",
    title:pick(ar,"ابدأ بما تتذكره","Begin with what you recall"),
    prompt:pick(ar,"من ذاكرتك، اكتب متى تبدأ شخصية الإنسان ومتى تنتهي، وما شرط حقوق الحمل المذكورة في المادتين 39 و40.","Without looking back, state when legal personality begins and ends, and the condition attached to the stated prenatal rights."),
    comparison:pick(ar,"تبدأ شخصية الإنسان بتمام ولادته حيًا وتنتهي بموته. وللحمل المستكن حقوق لا يحتاج سببها إلى قبول، بشرط تمام ولادته حيًا.","Legal personality begins with complete live birth and ends at death. The stated prenatal rights, whose causes do not require acceptance, depend on complete live birth."),
    lesson:pick(ar,"قارن العناصر الثلاثة بمعناها، لا بمجرد تشابه الألفاظ.","Compare the three legal elements by meaning, not merely matching words.")
  };
  var meaning = {
    type:"choice",
    title:pick(ar,"من القاعدة إلى المعنى","From the rule to its meaning"),
    prompt:pick(ar,"لماذا لا يعني إمكان ثبوت حقوق معينة للحمل أن الشخصية القانونية تبدأ قبل الولادة؟","Why do certain prenatal rights not mean that legal personality begins before birth?"),
    options: ar ? [
      "لأن بدء الشخصية مرتبط بالولادة حية، أما حقوق الحمل المذكورة فمشروطة بتمام الولادة حية.",
      "لأن جميع حقوق الحمل تثبت دون أي شروط.",
      "لأن الشخصية القانونية تبدأ بمجرد الحمل."
    ] : [
      "Because personality begins at live birth, while the stated prenatal rights are conditional on live birth.",
      "Because all prenatal rights vest without conditions.",
      "Because legal personality begins at conception."
    ],
    correct:0,
    feedback:pick(ar,"التمييز الأساسي بين بدء الشخصية وبين حقوق محددة مشروطة بالولادة حية؛ فلا نخلط بين المركزين.","Distinguish the start of legal personality from particular conditional prenatal rights.")
  };
  var memoryCues = {
    type:"free",
    title:pick(ar,"حوّل المعنى إلى مفاتيح ذاكرة","Turn meaning into retrieval cues"),
    prompt:pick(ar,"من فهمك للقاعدة، اختر كلمتين أو ثلاث كلمات مفتاحية من عندك. أمام كل واحدة اشرح أي شرط أو أثر قانوني ستذكّرك به.","From your understanding, create two or three retrieval cues of your own. Explain which condition or legal effect each cue should help you remember."),
    comparison:pick(ar,"مثال توضيحي، وليس كلمات إلزامية: «ولادة حية ← بدء الشخصية»؛ «الموت ← نهاية الشخصية»؛ «الحمل ← حقوق محددة مشروطة بولادته حيًا».","Illustrative cues, not required wording: 'Live birth → personality begins'; 'Death → personality ends'; 'Unborn child → certain rights conditional on live birth'."),
    lesson:pick(ar,"المفتاح مفيد عندما يربط اللفظ بعلاقته القانونية الصحيحة، لا عندما يكون مجرد كلمة محفوظة.","A cue is useful when it links wording to the correct legal relationship, not simply to an isolated word.")
  };
  var explain = {
    type:"free",
    title:pick(ar,"اشرح السبب لا النص فقط","Explain why, not just what"),
    prompt:pick(ar,"اشرح بأسلوبك: إذا نشأ سبب حق للحمل لا يحتاج إلى قبول، فما أهمية شرط الولادة حية في تقرير ثبوت هذا الحق؟","In your own words: if the cause of a prenatal right does not require acceptance, why does live birth still matter for that right?"),
    comparison:pick(ar,"عدم احتياج سبب الحق إلى قبول لا يلغي الشرط الآخر الذي نص عليه القانون: تمام الولادة حية. إذا تخلف هذا الشرط، فلا يثبت الحق المذكور استنادًا إلى هذا الحكم.","The fact that a right's cause requires no acceptance does not remove the separate statutory condition of complete live birth. Without that condition, the specified right does not vest under this rule."),
    lesson:pick(ar,"الشرح الجيد يربط السبب والشرط بالأثر القانوني، بدل إعادة ترديد الكلمات.","A good explanation connects the legal cause, condition, and consequence instead of repeating the wording.")
  };
  var capacity = {
    type:"choice",
    title:pick(ar,"استثمر فهمك قبل الاسترجاع","Use understanding before recall"),
    prompt:pick(ar,"ولد طفل حيًا، فهل ثبوت شخصيته القانونية يعني أنه أصبح كامل أهلية الأداء فورًا؟","A child is born alive. Does having legal personality mean the child immediately has full capacity to act?"),
    options:ar ? [
      "لا؛ بداية الشخصية تختلف عن كمال أهلية الأداء.",
      "نعم؛ لأن الولادة الحية تمنح كامل أهلية الأداء فورًا.",
      "لا؛ لأن الشخصية لا تثبت للإنسان إلا عند بلوغ سن الرشد."
    ] : [
      "No. Legal personality and full capacity to act are distinct.",
      "Yes. Live birth immediately confers full capacity to act.",
      "No. Legal personality begins only at adulthood."
    ],
    correct:0,
    feedback:pick(ar,"أنت تستخدم معنى القاعدة للتمييز بين مفاهيم متقاربة قبل بناء مفاتيح لاسترجاعها.","You use the meaning to distinguish related legal concepts before building cues for later recall.")
  };
  var reconstruct = {
    type:"free",
    title:pick(ar,"أعد بناء القاعدة من دون النص","Rebuild the rule without the text"),
    prompt:pick(ar,"أخفينا القاعدة والمثال. استخدم المفاتيح التي كتبتها لتعيد صياغة بداية الشخصية ونهايتها وشرط الحقوق المذكورة للحمل.","The rule and example are hidden. Use your own cues to reconstruct the start and end of personality and the condition attached to the stated prenatal rights."),
    comparison:recall.comparison,
    lesson:pick(ar,"هذه مقارنة ذاتية تدريبية. لم يُمنح نصك درجة آلية، ولا تعني المحاولة الآن تحقق الاحتفاظ طويل المدى.","This is guided self-comparison, not an automatically graded essay or evidence of long-term retention.")
  };
  var transfer = {
    type:"choice",
    title:pick(ar,"جرّب القاعدة على واقعة جديدة","Apply the rule to a new case"),
    prompt:pick(ar,"وُلِد طفل حيًا ثم توفي بعد مدة قصيرة. قال شخص: «لم تكن له شخصية قانونية لأنه توفي صغيرًا». ما الرد الصحيح؟","A child was born alive but died shortly afterward. Someone argues that the child never had legal personality because of the early death. Which answer is correct?"),
    options:ar ? [
      "كانت له شخصية منذ الولادة الحية، وانتهت بموته.",
      "لا تثبت الشخصية إلا إذا استمر حيًا حتى سن الرشد.",
      "الشخصية تبدأ عند الوفاة ثم تنتهي عند بلوغ الرشد."
    ] : [
      "Personality began at live birth and ended at death.",
      "Personality does not begin unless the child survives to adulthood.",
      "Personality begins at death and ends at adulthood."
    ],
    correct:0,
    feedback:pick(ar,"تغيّر الوقائع لا يغيّر شرط بدء الشخصية: الولادة حية. الوفاة حدث مستقل ينهي الشخصية بعد قيامها.","Changing the facts does not change the live-birth condition. Death independently ends personality after it has begun.")
  };
  var noBirth = {
    type:"choice",
    title:pick(ar,"اختبر أثر تغيير شرط واحد","Test the effect of one changed condition"),
    prompt:pick(ar,"وُجد سبب لحق الحمل لا يحتاج إلى قبول، لكن لم تتم الولادة حية. هل يكفي نشوء السبب لثبوت هذا الحق وفق المادة 40؟","A prenatal right's cause required no acceptance, but live birth did not occur. Is the cause alone sufficient for the right under Article 40?"),
    options:ar ? [
      "لا؛ لم يتحقق شرط تمام الولادة حية.",
      "نعم؛ لأن عدم اشتراط القبول يلغي شرط الولادة.",
      "نعم؛ لأن الشخصية القانونية تبدأ من وقت الحمل."
    ] : [
      "No. The live-birth condition was not met.",
      "Yes. The absence of an acceptance requirement removes the live-birth condition.",
      "Yes. Personality begins at conception."
    ],
    correct:0,
    feedback:pick(ar,"النتيجة تتغير بتغير شرط قانوني حاسم؛ لا يكفي تكرار نص المادة دون ملاحظة أثر هذا الشرط.","The outcome changes when a decisive legal condition changes. Repeating a provision alone is not enough.")
  };
  if(mode === "recall") return [capacity,memoryCues,reconstruct,transfer];
  if(mode === "understanding") return [recall,meaning,explain,noBirth];
  return [recall,meaning,memoryCues,transfer];
}
function run(options) {
  options = options || {};
  if(typeof options.stage !== "function" || typeof options.goBack !== "function") return false;
  var ar = options.lang !== "en";
  var flowArrow = pick(ar,"←","→");
  var weak = options.weak === "recall" || options.weak === "understanding" ? options.weak : "balanced";
  var tasks = plan(weak,options.lang), pos = 0, choiceScores = [];
  var description = weak === "recall" ?
    pick(ar,"ظهر الفهم أقوى من الاسترجاع في هذه المحاولة؛ سنبدأ من المعنى لنُثبّت عناصر القاعدة في الذاكرة.","Understanding appeared stronger than recall in this attempt; use meaning to strengthen recall.") :
    weak === "understanding" ?
    pick(ar,"ظهر الاسترجاع أقوى من الفهم في هذه المحاولة؛ سنستخدم القاعدة التي تتذكرها لتفسير الشروط وتطبيقها.","Recall appeared stronger than understanding in this attempt; use the recalled rule to explain and apply it.") :
    pick(ar,"لا تسمح هذه المحاولة بتحديد مهارة أضعف بثقة. سنجمع الاسترجاع والشرح والتطبيق في مسار متوازن.","This attempt does not establish a weaker skill with confidence; follow a balanced practice path.");
  function stage(html) {
    options.stage(100,'<div class="learningCycle">'+html+'</div>');
  }
  function backButton() {
    return '<button type="button" class="btn secondary" id="cycleBack">'+pick(ar,"العودة للنتيجة","Back to results")+'</button>';
  }
  function wireBack() {
    var el=document.getElementById("cycleBack");
    if(el) el.onclick=options.goBack;
  }
  function intro() {
    stage('<span class="demoEyebrow">'+pick(ar,"بعد التشخيص · تطبيق عملي","After diagnosis · guided practice")+'</span>'+
      '<h2>'+pick(ar,"استخدم قوتك لتطوّر ما تحتاجه","Use your strength to build your next skill")+'</h2>'+
      '<p class="cycleLead">'+esc(description)+'</p>'+
      '<div class="cyclePath"><span>'+pick(ar,"تشخيص","Diagnosis")+'</span><span aria-hidden="true">'+flowArrow+'</span><span>'+pick(ar,"تدريب مخصص","Targeted practice")+'</span><span aria-hidden="true">'+flowArrow+'</span><span>'+pick(ar,"واقعة جديدة","New case")+'</span></div>'+
      '<p class="cycleSmall">'+pick(ar,"أربع مهام قصيرة. تظهر الإجابة المرجعية بعد محاولتك. الكتابة الحرة تُقارن ذاتيًا ولا تُصحَّح آليًا هنا؛ هذه معاينة تعليمية لا اختبار إتقان.","Four short activities with reference feedback. Free text is for self-comparison, not automatic essay grading; this illustrates the learning path.")+'</p>'+
      '<div class="demoActions"><button type="button" class="btn primary" id="cycleStart">'+pick(ar,"ابدأ التدريب المخصص","Start targeted practice")+'</button>'+backButton()+'</div>');
    document.getElementById("cycleStart").onclick=render;
    wireBack();
  }
  function render() {
    if(pos>=tasks.length){finish();return;}
    var task=tasks[pos], free=task.type==="free";
    var progress='<div class="cycleProgress"><span>'+pick(ar,"التدريب","Practice")+' '+(pos+1)+' / '+tasks.length+'</span><div class="cycleMeter"><i style="width:'+((pos+1)*100/tasks.length)+'%"></i></div></div>';
    var question=free ?
      '<textarea class="freeInput cycleInput" id="cycleAnswer" maxlength="1600" aria-label="'+pick(ar,"إجابتك التدريبية","Your practice answer")+'" placeholder="'+pick(ar,"اكتب بطريقتك؛ لا يلزم حفظ الصياغة حرفيًا.","Write in your own words; exact wording is not required.")+'"></textarea><p class="cycleHint">'+pick(ar,"لن تُحسب هذه الكتابة ضمن درجتك السابقة.","This text does not change your earlier score.")+'</p><button type="button" class="btn primary" id="cycleCompare">'+pick(ar,"قارن إجابتي بالنموذج","Compare with the reference")+'</button>' :
      '<div class="choices cycleChoices">'+[2,0,1].map(function(index){return '<button type="button" class="choice" data-cycle-choice="'+index+'">'+esc(task.options[index])+'</button>';}).join("")+'</div>';
    stage(progress+'<h2>'+esc(task.title)+'</h2><p class="cycleLead">'+esc(task.prompt)+'</p>'+question+
      '<div id="cycleFeedback" class="cycleFeedback" aria-live="polite"></div>'+
      '<div class="demoActions">'+backButton()+'</div>');
    wireBack();
    if(free){
      document.getElementById("cycleCompare").onclick=function(){
        var field=document.getElementById("cycleAnswer"),value=field.value.trim();
        if(!value){document.getElementById("cycleFeedback").textContent=pick(ar,"اكتب محاولتك أولًا، حتى لو كانت غير مكتملة.","Write an attempt first, even if incomplete.");field.focus();return;}
        field.disabled=true;this.disabled=true;
        feedback('<span class="cycleLabel">'+pick(ar,"نموذج للمقارنة الذاتية","Reference for self-comparison")+'</span><p>'+esc(task.comparison)+'</p><small>'+esc(task.lesson)+'</small><small>'+pick(ar,"لم تُجرَ مقارنة دلالية آلية لهذه الإجابة.","No automated semantic grading has been applied to this answer.")+'</small>',true);
      };
    } else {
      document.querySelectorAll("[data-cycle-choice]").forEach(function(btn){
        btn.onclick=function(){
          var selected=Number(this.getAttribute("data-cycle-choice")),correct=selected===task.correct;
          choiceScores.push(correct);
          document.querySelectorAll("[data-cycle-choice]").forEach(function(b){
            b.disabled=true;
            if(Number(b.getAttribute("data-cycle-choice"))===task.correct)b.classList.add("good");
          });
          if(!correct)this.classList.add("bad");
          feedback('<span class="cycleLabel">'+(correct?pick(ar,"إجابة صحيحة","Correct answer"):pick(ar,"راجع الفرق بين الشرط والنتيجة","Review the condition and outcome"))+'</span><p>'+esc(task.feedback)+'</p>',correct);
        };
      });
    }
  }
  function feedback(content,good) {
    document.getElementById("cycleFeedback").innerHTML='<div class="cycleNote '+(good?"cycleNoteOk":"cycleNoteReview")+'">'+content+'</div><button type="button" class="btn primary" id="cycleNext">'+(pos===tasks.length-1?pick(ar,"عرض خلاصة التدريب","View practice summary"):pick(ar,"المهمة التالية","Next activity"))+'</button>';
    document.getElementById("cycleNext").onclick=function(){pos++;render();};
  }
  function finish() {
    var correct=choiceScores.filter(Boolean).length;
    stage('<span class="demoEyebrow">'+pick(ar,"اكتملت دورة التدريب","Practice cycle complete")+'</span>'+
      '<div class="cycleFinishIcon" aria-hidden="true">✓</div>'+
      '<h2>'+pick(ar,"من التشخيص إلى تدريب موجّه","From diagnosis to targeted practice")+'</h2>'+
      '<p class="cycleLead">'+pick(ar,"استخدمت معلومة أو مهارة أظهرتها محاولتك لتتدرّب على مهارة أخرى، ثم واجهت سؤالًا بواقعة مختلفة.","You used an observed strength to practise another skill, then addressed a changed fact pattern.")+'</p>'+
      '<div class="cycleSummary"><div><b>'+tasks.length+'</b><span>'+pick(ar,"خطوات تدريبية","Practice steps")+'</span></div><div><b>'+correct+' / '+choiceScores.length+'</b><span>'+pick(ar,"أسئلة اختيار صحيحة أثناء التدريب","Correct multiple-choice checks")+'</span></div></div>'+
      '<p class="cycleSmall">'+pick(ar,"الكتابة الحرة كانت للمقارنة الذاتية ولم تدخل في العدد. لا تُقاس فاعلية التدريب أو الاحتفاظ طويل المدى في هذه المعاينة. يتيح البرنامج الدراسي مراجعات فعلية مؤجلة بعد يوم وأسبوع في الموضوعات التجريبية.","Free-text comparisons were not scored. This preview does not measure learning gains or long-term retention. The full student pilot includes delayed reviews after a day and a week for selected topics.")+'</p>'+
      '<div class="demoActions"><button type="button" class="btn primary" id="cycleAgain">'+pick(ar,"أعد دورة التدريب","Repeat practice")+'</button>'+backButton()+
      '<a class="btn secondary" href="'+(ar?"program.html":"program-en.html")+'">'+pick(ar,"البرنامج الدراسي الكامل","Full learning programme")+'</a></div>');
    document.getElementById("cycleAgain").onclick=function(){pos=0;choiceScores=[];intro();};
    wireBack();
  }
  intro();
  return true;
}
var api={plan:plan,run:run};
root.LEX_SHOWCASE_CYCLE=api;
if(typeof module!=="undefined" && module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
