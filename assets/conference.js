(function(){
"use strict";
const AR={
 skip:"انتقل إلى المحتوى",home:"الموقع الرئيسي",
 promo:"\u2066LexLearn\u2069 في مؤتمر \u2066Web Summit Qatar 2027\u2069 — اكتشف الرؤية وجرّب المنصة وتعرّف على التجربة الجامعية.",promoShort:"\u2066LexLearn\u2069 · \u2066Web Summit Qatar 2027\u2069 · برنامج \u2066ALPHA\u2069",
 eyebrow:"ليكس ليرن · منصة تعليمية لطلاب القانون",
 heroTitle:"قيّم مهاراتك القانونية… وطوّرها انطلاقًا من نقاط قوتك",
 heroSubBefore:"يشخّص",heroSub:"نقاط قوتك في التفكير القانوني، ويبني مسارك لتقوية نقاط ضعفك.",
 studentTitle:"طالب",studentDesc:"جرّب تقييم الحفظ والفهم.",studentCTA:"افتح التجربة",
 univTitle:"جامعة أو مؤسسة تعليمية",univDesc:"تعرّف على التجربة الجامعية المقترحة.",univCTA:"خطة التجربة",
 invTitle:"مستثمر أو شريك",invDesc:"الرؤية وخارطة الطريق بدءًا من قطر.",invCTA:"اطّلع على الرؤية",
 label01:"01 / المشكلة",problemHeading:"الدرجة نفسها قد تخفي مشكلات تعلم مختلفة.",
 problemLead:"طالب يحفظ القاعدة ولا يستطيع شرحها. وآخر يفهمها لكنه لا يسترجعها وقت الاختبار. الدرجة وحدها لا تكشف التدريب الأنسب لكل طالب.",
 solutionLabel:"حل LexLearn",solutionHeading:"نحدّد ما يحتاج إلى تطوير، ونستخدم المهارة الأقوى لتقوية الأضعف.",
 solutionBody:"تستخدم LexLearn التشخيص لتقديم تدريب مستهدف، مع بقاء دور الأستاذ الجامعي في التدريس والتقييم الأكاديمي المستقل.",
 label02:"02 / كيف تعمل المنصة",howHeading:"خمس مهارات محددة، ومسار تعلم قابل للتكيف.",
 howNote:"المحاور الخمسة هي إطار المنتج المستهدف؛ أما الديمو العام فيعرض جانبَي الحفظ والفهم فقط.",
 skill1:"الحفظ",skill1D:"استرجاع القاعدة القانونية بدقة.",
 skill2:"الفهم",skill2D:"شرح عناصر القاعدة وأسبابها.",
 skill3:"التطبيق",skill3D:"تطبيق الحكم على وقائع جديدة.",
 skill4:"الدقة القانونية",skill4D:"استخدام المصطلحات والشروط الصحيحة.",
 skill5:"بناء الإجابة الامتحانية",skill5D:"صياغة إجابة قانونية مرتبة ومعللة.",
 strengthTitle:"مثال لمبدأ التكيف",strengthBody:"حفظ قوي مع فهم أضعف ← تدريب على شرح عناصر القاعدة. فهم قوي مع حفظ أضعف ← بناء مفاتيح للتذكر انطلاقًا من الفكرة التي فهمها الطالب بالفعل.",
 label03:"03 / جرّب بنفسك",demoTitle:"عِش التجربة التفاعلية.",
 demoBody:"الديمو يعرض جزءًا من الفكرة، وتحديدًا الحفظ والفهم، مع تقييم محلي مبدئي. ولا يمثل تشخيصًا جامعيًا معتمدًا لجميع المهارات الخمس أو تجربة ميدانية مكتملة.",
 demoButton:"جرّب الديمو المباشر ←",flow1:"اقرأ قاعدة قانونية",flow2:"أجب عن الأسئلة",flow3:"شاهد تحليلًا مبدئيًا",flow4:"نقوّي المهارة الأضعف بالمهارة الأقوى",
 label04:"04 / عرض المشروع",deckTitle:"الفكرة في بطاقات عرض مختصرة.",
 deckDesc:"عرض عام خفيف للموبايل من دون تحميل قارئ PDF ثقيل.",download:"تحميل العرض PDF ↓",
 slide1Small:"المشكلة",slide1H:"أبعد من مجرد درجات",slide1P:"قد يتعثر طلاب القانون لأسباب مختلفة. يبدأ LexLearn بالتشخيص.",
 slide2Small:"آلية العمل",slide2H:"شخّص ← كيّف ← درّب",slide2P:"استثمر المهارة الأقوى لدى الطالب لتقوية المهارة الأضعف.",
 slide3Small:"المهارات الخمس",slide3H:"ملف تعلم أكثر وضوحًا",slide3P:"الحفظ · الفهم · التطبيق · الدقة القانونية · بناء الإجابة الامتحانية.",
 slide4Small:"الوضع الحالي",slide4H:"نسخة تجريبية عاملة",slide4P:"تحليل الإجابات التحريرية بالذكاء الاصطناعي: قيد التطوير. التحقق من الأثر التعليمي سيتم عبر التجربة المقترحة.",
 slide5Small:"التحقق الأكاديمي",slide5H:"30–60 طالبًا · 6–8 أسابيع",slide5P:"تجربة مقترحة بإشراف LexLearn ومتابعتها، مع قياس قبلي وبعدي بالتنسيق مع الجامعة.",
 slide6Small:"خريطة الطريق",slide6H:"قطر أولًا، ثم التوسع",slide6P:"نبدأ بكليات القانون القطرية، ثم نتحقق من الأثر قبل التوسع في المواد والأسواق.",
 deckNote:"هذه معاينة عامة مختصرة للموبايل وليست العرض الاستثماري السري الكامل. أعداد التجربة مقترحة وليست نتائج منفذة.",deckSwipeHint:"مرّر أفقيًا لاستعراض بقية الشرائح ↔",returnPaths:"رجوع للمسارات",
 label05:"05 / التجربة الجامعية",pilotTitle:"تعاون أكاديمي قابل للقياس",
 pilotBody:"تُنفَّذ التجربة بالتعاون مع الجامعة، وتتولى LexLearn متابعتها وتقييم نتائجها.",
 pilotLexLearnTitle:"دور LexLearn",pilotLexLearnRole:"تتولى LexLearn متابعة التجربة وتقييم نتائجها.",
 pilotStudents:"طالبًا مقترحًا",pilotStudentsHelp:"عدد طلاب القانون المقترح مشاركتهم في التجربة.",pilotWeeks:"أسابيع مقترحة",pilotWeeksHelp:"مدة التدريب والقياس القبلي والبعدي المقترحة.",
 pilot1:"قبل التجربة: تجري LexLearn تشخيصًا أوليًا لكل مهارة.",pilot2:"أثناء التجربة: تشرف LexLearn على التدريبات وتتابع تقدّم الطلاب مع مراعاة الخصوصية.",pilot3:"بعد التجربة: تحلل LexLearn النتائج الأولية وتراجع موثوقية التصحيح وسهولة الاستخدام.",
 pilotCTA:"ناقش تجربة جامعية ←",
 label06:"06 / للمستثمرين والشركاء",visionTitle:"قطر أولًا. الدليل قبل التوسع.",
 visionLead:"رؤيتنا طويلة المدى منصة تعليمية تبدأ بالتشخيص وتقدم توصيات قابلة للفهم مع استمرار دور الأستاذ.",
 phase1:"نسخة تجريبية عاملة",phase1P:"تطوير واختبار تجربة الطالب وأدوات المشرف.",phase2:"تجربة أكاديمية في قطر",phase2P:"مقترح 30–60 طالبًا خلال 6–8 أسابيع لقياس النتائج الأولية.",phase3:"التحقق من المنتج",phase3P:"تحسين تحليل الإجابات التحريرية ومراجعة المحتوى وسير عمل المشرف.",phase4:"التوسع المدروس",phase4P:"النظر في مواد قانونية وتخصصات أخرى بعد قيام أدلة مناسبة.",
 evidenceNote:"الأثر التعليمي لم يُثبت بعد؛ وسنقيسه من خلال التجربة الجامعية المقترحة.",honestyTitle:"أين وصلنا اليوم؟",status1:"نسخة تجريبية عاملة",status2:"تحليل الإجابات التحريرية بالذكاء الاصطناعي: قيد التطوير",status2Title:"تحليل الإجابات التحريرية بالذكاء الاصطناعي",status2State:"قيد التطوير والتحقق من الدقة",status3:"التحقق من الأثر التعليمي سيتم عبر التجربة المقترحة",
 label07:"07 / التواصل",contactTitle:"لنستكشف الخطوة التالية معًا.",contactText:"التجارب الجامعية، ودعم الاحتضان، والشراكات التقنية، ومناقشات الاستثمار الأولية.",
 emailCTA:"راسل المؤسس بالبريد ←",waCTA:"شارك الصفحة عبر واتساب ←",qrCTA:"تحميل رمز QR للطباعة ↓",waNote:"زر واتساب يشارك رابط الصفحة حاليًا؛ التواصل المباشر يحتاج إلى رقم منشور معتمد.",
 founderName:"د. أحمد فؤاد الفقي",founderRole:"المؤسس والرئيس التنفيذي",privacy:"الخصوصية",
 footerNote:"نسخة تجريبية عاملة، وليست خدمة تقييم جامعي معتمدة."
};
const EN={
 skip:"Skip to content",home:"Main site",
 promo:"LexLearn at Web Summit Qatar 2027 — Discover our vision. Try the demo. Explore a university pilot.",promoShort:"LexLearn · Web Summit Qatar 2027 · ALPHA",
 eyebrow:"LEXLEARN · LEGAL LEARNING FOR STUDENTS",
 heroTitle:"Assess your legal learning skills. Build on your strengths.",
 heroSubBefore:"",heroSub:"diagnoses your strengths in legal thinking and builds your learning path to strengthen weaker skills.",
 studentTitle:"Student",studentDesc:"Try the live legal-learning demo.",studentCTA:"Open live demo",
 univTitle:"University or institution",univDesc:"Explore a proposed supervised university pilot.",univCTA:"Explore the pilot",
 invTitle:"Investor or partner",invDesc:"See the vision and Qatar-first roadmap.",invCTA:"View roadmap",
 label01:"01 / THE PROBLEM",problemHeading:"The same score can hide different learning problems.",
 problemLead:"One student remembers a rule but struggles to explain it. Another understands the idea but cannot recall it during an exam. A single score does not reveal the next useful step.",
 solutionLabel:"THE LEXLEARN RESPONSE",solutionHeading:"Identify the gap. Build the weaker skill from the stronger one.",solutionBody:"LexLearn guides skill diagnosis and practice without replacing university teaching or independent academic assessment.",
 label02:"02 / HOW IT WORKS",howHeading:"Five precise skills. One adaptable path.",howNote:"The five-axis framework is the product vision; the public demo currently illustrates recall and understanding only.",
 skill1:"Recall",skill1D:"Retrieve the legal rule accurately.",skill2:"Understanding",skill2D:"Explain why the legal rule works.",skill3:"Application",skill3D:"Apply the rule to a new set of facts.",skill4:"Legal precision",skill4D:"Use accurate legal terms and conditions.",skill5:"Exam answer structure",skill5D:"Build a clear, supported legal answer.",
 strengthTitle:"Example of the adaptive principle",strengthBody:"Strong recall + weaker understanding → practise explaining each element of the rule. Strong understanding + weaker recall → create memory cues from the concept already understood.",
 label03:"03 / TRY IT YOURSELF",demoTitle:"Try the live experience.",demoBody:"The public demo shows part of the idea—recall and understanding, with provisional local evaluation. It does not represent a validated five-skill diagnosis or a completed university pilot.",demoButton:"Try the live demo ↗",
 flow1:"Read a legal rule",flow2:"Answer questions",flow3:"See a provisional analysis",flow4:"Strengthen the weaker skill using the stronger one",
 label04:"04 / PITCH DECK",deckTitle:"The idea, in slides.",deckDesc:"A lightweight public preview of the pitch. No heavy PDF viewer.",download:"Download PDF ↓",
 slide1Small:"THE OPPORTUNITY",slide1H:"Beyond grades",slide1P:"Law students may struggle for very different reasons. LexLearn starts with diagnosis.",
 slide2Small:"THE METHOD",slide2H:"Diagnose → Adapt → Practise",slide2P:"Use the student's strongest skill to strengthen the weakest skill.",
 slide3Small:"FIVE SKILLS",slide3H:"A clearer learning profile",slide3P:"Recall · Understanding · Application · Legal precision · Exam answer structure.",
 slide4Small:"CURRENT STATUS",slide4H:"Working beta",slide4P:"AI analysis of written answers: in progress. Learning impact not yet proven.",
 slide5Small:"ACADEMIC VALIDATION",slide5H:"30–60 students · 6–8 weeks",slide5P:"A proposed LexLearn-led pilot with baseline and follow-up assessments.",
 slide6Small:"QATAR-FIRST ROADMAP",slide6H:"Validate, then expand",slide6P:"Start with Qatari law faculties, validate impact, then consider broader disciplines and markets.",
 deckNote:"Public mobile summary rather than the full confidential investor presentation. Figures are a proposal, not completed pilot results.",deckSwipeHint:"Swipe sideways to see the other slides ↔",returnPaths:"Back to paths",
 label05:"05 / UNIVERSITY PILOT",pilotTitle:"Measurable academic collaboration",pilotBody:"The pilot will run in collaboration with the university, with LexLearn following progress and evaluating the results.",
 pilotLexLearnTitle:"LexLearn's role",pilotLexLearnRole:"LexLearn follows the pilot and evaluates its results.",pilotStudents:"students proposed",pilotStudentsHelp:"Proposed number of law students in the pilot.",pilotWeeks:"weeks proposed",pilotWeeksHelp:"Proposed duration for practice and before/after assessment.",
 pilot1:"Before: LexLearn establishes a skill-specific baseline.",pilot2:"During: LexLearn supervises practice and follows student progress with privacy safeguards.",pilot3:"After: LexLearn reviews initial results, scoring reliability and usability; impact remains to be established.",pilotCTA:"Discuss an academic pilot ↗",
 label06:"06 / INVESTORS & PARTNERS",visionTitle:"Qatar first. Proof before scale.",visionLead:"The long-term vision is a diagnostic-first learning platform with explainable recommendations and meaningful faculty oversight.",
 phase1:"Working beta",phase1P:"Core student experience and supervisor tools under development and testing.",phase2:"Qatari academic pilot",phase2P:"Propose 30–60 students over 6–8 weeks; measure the first outcomes.",phase3:"Product validation",phase3P:"Refine AI analysis of written answers, legal review and scalable faculty workflows.",phase4:"Broader expansion",phase4P:"Consider additional legal subjects and then other disciplines only after evidence.",
 evidenceNote:"Learning impact has not yet been demonstrated; we will evaluate it through the proposed academic pilot.",honestyTitle:"Where we stand today",status1:"Working beta",status2:"AI analysis of written answers: in progress",status2Title:"AI analysis of written answers",status2State:"In progress · validating reliability",status3:"Learning impact not yet proven",
 label07:"07 / CONTACT",contactTitle:"Let's explore what comes next.",contactText:"Academic pilots, incubation support, technical partnerships and early-stage conversations.",emailCTA:"Email the founder ↗",waCTA:"Share via WhatsApp ↗",qrCTA:"Print QR code ↓",waNote:"WhatsApp currently shares this page; direct WhatsApp contact will require a public contact number.",founderName:"Dr Ahmed Foad Elfeky",founderRole:"Founder & CEO",privacy:"Privacy",footerNote:"A working beta, not an accredited university assessment service."
};
const languageButtonEN=document.getElementById("langEN"),languageButtonAR=document.getElementById("langAR");
const student=document.getElementById("studentCard"),demo=document.getElementById("demoLink"),
 home=document.getElementById("homeLink"),homeBrand=document.getElementById("homeBrand"),footHome=document.getElementById("footHome"),
 privacy=document.getElementById("privacyLink"),deck=document.getElementById("downloadDeck"),waShare=document.getElementById("waShare");
const carousel=document.getElementById("deckSlides"),deckDots=document.getElementById("deckDots");
const deckPrev=document.getElementById("deckPrev"),deckNext=document.getElementById("deckNext");
const backToPaths=document.getElementById("pathsReturn");
let selectedSlide=0,dotButtons=[];
function goSlide(index){
 if(!carousel || !carousel.children || !carousel.children.length)return;
 selectedSlide=Math.max(0,Math.min(carousel.children.length-1,index));
 var slide=carousel.children[selectedSlide];
 if(typeof slide.scrollIntoView==="function")slide.scrollIntoView({behavior:"smooth",block:"nearest",inline:"start"});
 refreshSlides();
}
function refreshSlides(){
 dotButtons.forEach(function(b,i){b.setAttribute("aria-current",i===selectedSlide?"true":"false");});
 if(deckPrev)deckPrev.disabled=selectedSlide===0;
 if(deckNext)deckNext.disabled=!carousel||!carousel.children||selectedSlide>=carousel.children.length-1;
}
if(carousel && carousel.children && carousel.children.length && deckDots && typeof document.createElement==="function"){
 Array.from(carousel.children).forEach(function(_slide,i){
  var b=document.createElement("button");b.type="button";b.className="deckDot";
  b.setAttribute("aria-label","Slide "+(i+1));b.setAttribute("aria-current",i===0?"true":"false");
  b.addEventListener("click",function(){goSlide(i);});
  deckDots.appendChild(b);dotButtons.push(b);
 });
 deckPrev.addEventListener("click",function(){goSlide(selectedSlide-1);});
 deckNext.addEventListener("click",function(){goSlide(selectedSlide+1);});
 carousel.addEventListener("scroll",function(){
  var rect=carousel.getBoundingClientRect(),rtl=document.documentElement.dir==="rtl",best=Infinity;
  Array.from(carousel.children).forEach(function(slide,i){
   var r=slide.getBoundingClientRect();
   var distance=Math.abs(rtl?r.right-rect.right:r.left-rect.left);
   if(distance<best){best=distance;selectedSlide=i;}
  });
  refreshSlides();
 },{passive:true});
 refreshSlides();
}
if(backToPaths && typeof window.addEventListener==="function"){
 var hasUserScrolled=false;
 function refreshBackPaths(){
  var first=document.getElementById("paths");
  var contact=document.getElementById("contact"),footer=document.querySelector("footer.foot");
  var firstBottom=first&&first.getBoundingClientRect?first.getBoundingClientRect().bottom:120;
  var contactTop=contact&&contact.getBoundingClientRect?contact.getBoundingClientRect().top:Infinity;
  var footerTop=footer&&footer.getBoundingClientRect?footer.getBoundingClientRect().top:Infinity;
  var viewport=window.innerHeight||700,depth=window.scrollY||0;
  var show=hasUserScrolled && depth>140 && firstBottom<110 && contactTop>viewport*.82 && footerTop>viewport;
  backToPaths.classList.toggle("isVisible",show);
  backToPaths.setAttribute("aria-hidden",show?"false":"true");
  backToPaths.tabIndex=show?0:-1;
 }
 window.addEventListener("scroll",function(){hasUserScrolled=true;refreshBackPaths();},{passive:true});
 window.addEventListener("resize",refreshBackPaths,{passive:true});
 backToPaths.setAttribute("aria-hidden","true");
 backToPaths.tabIndex=-1;
}
let active="en";
function setLang(next){
 active=next==="ar"?"ar":"en";
 const t=active==="ar"?AR:EN;
 const subBefore=document.getElementById("heroSubLead");
 if(subBefore)subBefore.hidden=active!=="ar";
 document.documentElement.lang=active;
 document.documentElement.dir=active==="ar"?"rtl":"ltr";
 if(carousel)carousel.dir=active==="ar"?"rtl":"ltr";
 dotButtons.forEach(function(b,i){b.setAttribute("aria-label",(active==="ar"?"الشريحة ":"Slide ")+(i+1));});
 document.title=active==="ar"?"LexLearn | اكتشف رؤيتنا — مؤتمر قطر 2027":"LexLearn | Explore the Vision — Web Summit Qatar 2027";
 document.querySelectorAll("[data-t]").forEach(function(el){const k=el.getAttribute("data-t");if(k in t)el.textContent=t[k];});
 languageButtonEN.setAttribute("aria-pressed",String(active==="en"));languageButtonAR.setAttribute("aria-pressed",String(active==="ar"));
 const prefix=active==="ar"?"":"-en";
 student.href="showcase"+prefix+".html?country=qa&subject=rights";
 demo.href=student.href;
 home.href=homeBrand.href=footHome.href=active==="ar"?"index.html":"index-en.html";
 privacy.href=active==="ar"?"privacy.html":"privacy-en.html";
 deck.removeAttribute("download");
 deck.href=active==="ar"?"#deck":"assets/lexlearn-public-pitch-en.pdf";
 if(active==="en")deck.setAttribute("download","LexLearn-Public-Pitch-EN.pdf");
 waShare.href="https://api.whatsapp.com/send?text="+encodeURIComponent("LexLearn — https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/go/");
 try{localStorage.setItem("lexlearn_conference_language",active);}catch(_){}
}
function printArabicDeck(){
 if(typeof window.lexlearnDownloadPublicDeck==="function") window.lexlearnDownloadPublicDeck("ar");
 else alert("The download is unavailable. Please reload the page.");
}

languageButtonEN.addEventListener("click",function(){setLang("en");});
languageButtonAR.addEventListener("click",function(){setLang("ar");});
deck.addEventListener("click",function(event){if(active==="ar"){event.preventDefault();printArabicDeck();}});
let saved="en";try{saved=localStorage.getItem("lexlearn_conference_language")==="ar"?"ar":"en";}catch(_){}
setLang(saved);
})();