(function(){
"use strict";
const AR={
 skip:"انتقل إلى المحتوى",home:"الموقع الرئيسي",
 promo:"LexLearn في Web Summit Qatar 2027 — اكتشف رؤيتنا. جرّب الديمو. تعرّف على التجربة الجامعية.",
 eyebrow:"التعلم القانوني التكيفي · البداية من قطر",
 heroTitle:"التفكير القانوني الأفضل يبدأ بتشخيص أدق.",
 heroSub:"اختر المسار المناسب لك للتعرف على LexLearn: نسخة تجريبية عاملة تستفيد من مهارات الطالب الأقوى لتطوير المهارات الأضعف.",
 visitor:"زائر",studentTitle:"طالب",studentDesc:"جرّب LexLearn بنفسك",studentCTA:"افتح الديمو ←",
 univTitle:"جامعة أو مؤسسة تعليمية",univDesc:"اكتشف فكرة التجربة الأكاديمية وآلية التعاون.",univCTA:"اعرف خطة التجربة ←",
 invTitle:"مستثمر أو شريك",invDesc:"اطّلع على الرؤية وخريطة الطريق التي تبدأ بقطر والحالة الحالية بوضوح.",invCTA:"اكتشف الرؤية ←",
 label01:"01 / المشكلة",problemHeading:"الدرجة نفسها قد تخفي مشكلات تعلم مختلفة.",
 problemLead:"طالب يحفظ القاعدة ولا يستطيع شرحها. وآخر يفهمها لكنه لا يسترجعها وقت الاختبار. الدرجة وحدها لا تكشف التدريب الأنسب لكل طالب.",
 solutionLabel:"حل LexLearn",solutionHeading:"نحدّد ما يحتاج إلى تطوير، ونستخدم المهارة الأقوى لتقوية الأضعف.",
 solutionBody:"يقود التشخيص إلى تدريب مستهدف دون أن يحل النظام محل استقلال الطالب أو رقابة المشرف الأكاديمي.",
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
 slide5Small:"التحقق الأكاديمي",slide5H:"30–60 طالبًا · 6–8 أسابيع",slide5P:"مقترح تجربة بإشراف أكاديمي مع قياس قبلي وبعدي.",
 slide6Small:"خريطة الطريق",slide6H:"قطر أولًا، ثم التوسع",slide6P:"نبدأ بكليات القانون القطرية، ثم نتحقق من الأثر قبل التوسع في المواد والأسواق.",
 deckNote:"هذه معاينة عامة مختصرة للموبايل وليست العرض الاستثماري السري الكامل. أعداد التجربة مقترحة وليست نتائج منفذة.",
 label05:"05 / التجربة الجامعية",pilotTitle:"تعاون أكاديمي قابل للقياس",
 pilotBody:"نقترح تجربة أكاديمية محددة بإشراف جامعي لقياس الأثر قبل التوسع",
 pilotStudents:"طالبًا مقترحًا",pilotWeeks:"أسابيع مقترحة",
 pilot1:"قبل التجربة: تشخيص أولي لكل مهارة.",pilot2:"أثناء التجربة: تدريبات مستهدفة بإشراف أكاديمي وضوابط للخصوصية.",pilot3:"بعد التجربة: قياس مؤشرات التعلم الأولية، ومراجعة موثوقية التصحيح وسهولة الاستخدام تحت إشراف أكاديمي.",
 pilotCTA:"ناقش تجربة جامعية ←",
 label06:"06 / للمستثمرين والشركاء",visionTitle:"قطر أولًا. الدليل قبل التوسع.",
 visionLead:"رؤيتنا طويلة المدى منصة تعليمية تبدأ بالتشخيص وتقدم توصيات قابلة للفهم مع استمرار دور الأستاذ.",
 phase1:"نسخة تجريبية عاملة",phase1P:"تطوير واختبار تجربة الطالب وأدوات المشرف.",phase2:"تجربة أكاديمية في قطر",phase2P:"مقترح 30–60 طالبًا خلال 6–8 أسابيع لقياس النتائج الأولية.",phase3:"التحقق من المنتج",phase3P:"تحسين تحليل الإجابات التحريرية ومراجعة المحتوى وسير عمل المشرف.",phase4:"التوسع المدروس",phase4P:"النظر في مواد قانونية وتخصصات أخرى بعد قيام أدلة مناسبة.",
 honestyTitle:"أين وصلنا اليوم؟",status1:"نسخة تجريبية عاملة",status2:"تحليل الإجابات التحريرية بالذكاء الاصطناعي: قيد التطوير",status2Title:"تحليل الإجابات التحريرية بالذكاء الاصطناعي",status2State:"قيد التطوير والتحقق من الدقة",status3:"التحقق من الأثر التعليمي سيتم عبر التجربة المقترحة",
 label07:"07 / التواصل",contactTitle:"لنستكشف الخطوة التالية معًا.",contactText:"التجارب الجامعية، ودعم الاحتضان، والشراكات التقنية، ومناقشات الاستثمار الأولية.",
 emailCTA:"راسل المؤسس بالبريد ←",waCTA:"شارك الصفحة عبر واتساب ←",qrCTA:"تحميل رمز QR للطباعة ↓",waNote:"زر واتساب يشارك رابط الصفحة حاليًا؛ التواصل المباشر يحتاج إلى رقم منشور معتمد.",
 founderName:"د. أحمد فؤاد الفقي",founderRole:"المؤسس والرئيس التنفيذي",privacy:"الخصوصية",
 footerNote:"نسخة تجريبية عاملة، وليست خدمة تقييم جامعي معتمدة."
};
const EN={
 skip:"Skip to content",home:"Main site",
 promo:"LexLearn at Web Summit Qatar 2027 — Discover our vision. Try the demo. Explore a university pilot.",
 eyebrow:"ADAPTIVE LEGAL LEARNING · QATAR FIRST",
 heroTitle:"Better legal thinking starts with better diagnosis.",
 heroSub:"Choose your path to explore LexLearn. A working beta built to turn a student's stronger skill into a bridge for the weaker one.",
 visitor:"VISITOR",studentTitle:"Student",studentDesc:"Try LexLearn yourself",studentCTA:"Open live demo →",
 univTitle:"University or institution",univDesc:"Explore the academic pilot and how to collaborate.",univCTA:"Explore the pilot →",
 invTitle:"Investor or partner",invDesc:"See the vision, Qatar-first roadmap and honest current status.",invCTA:"View roadmap →",
 label01:"01 / THE PROBLEM",problemHeading:"The same score can hide different learning problems.",
 problemLead:"One student remembers a rule but struggles to explain it. Another understands the idea but cannot recall it during an exam. A single score does not reveal the next useful step.",
 solutionLabel:"THE LEXLEARN RESPONSE",solutionHeading:"Identify the gap. Build the weaker skill from the stronger one.",solutionBody:"Diagnosis guides targeted practice while students remain independent and academic supervisors keep control.",
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
 slide5Small:"ACADEMIC VALIDATION",slide5H:"30–60 students · 6–8 weeks",slide5P:"A proposed supervised pilot with pre/post tasks and measured evidence.",
 slide6Small:"QATAR-FIRST ROADMAP",slide6H:"Validate, then expand",slide6P:"Start with Qatari law faculties, validate impact, then consider broader disciplines and markets.",
 deckNote:"Public mobile summary rather than the full confidential investor presentation. Figures are a proposal, not completed pilot results.",
 label05:"05 / UNIVERSITY PILOT",pilotTitle:"Measurable academic collaboration",pilotBody:"We propose a focused, faculty-supervised academic pilot to measure learning impact before expanding.",pilotStudents:"students proposed",pilotWeeks:"weeks proposed",
 pilot1:"Before: establish a baseline using skill-specific tasks.",pilot2:"During: deliver structured practice with faculty oversight and privacy safeguards.",pilot3:"After: review usability, scoring agreement and early learning indicators. Impact remains to be established.",pilotCTA:"Discuss an academic pilot ↗",
 label06:"06 / INVESTORS & PARTNERS",visionTitle:"Qatar first. Proof before scale.",visionLead:"The long-term vision is a diagnostic-first learning platform with explainable recommendations and meaningful faculty oversight.",
 phase1:"Working beta",phase1P:"Core student experience and supervisor tools under development and testing.",phase2:"Qatari academic pilot",phase2P:"Propose 30–60 students over 6–8 weeks; measure the first outcomes.",phase3:"Product validation",phase3P:"Refine AI analysis of written answers, legal review and scalable faculty workflows.",phase4:"Broader expansion",phase4P:"Consider additional legal subjects and then other disciplines only after evidence.",
 honestyTitle:"Where we stand today",status1:"Working beta",status2:"AI analysis of written answers: in progress",status2Title:"AI analysis of written answers",status2State:"In progress · validating reliability",status3:"Learning impact not yet proven",
 label07:"07 / CONTACT",contactTitle:"Let's explore what comes next.",contactText:"Academic pilots, incubation support, technical partnerships and early-stage conversations.",emailCTA:"Email the founder ↗",waCTA:"Share via WhatsApp ↗",qrCTA:"Print QR code ↓",waNote:"WhatsApp currently shares this page; direct WhatsApp contact will require a public contact number.",founderName:"Dr Ahmed Foad Elfeky",founderRole:"Founder & CEO",privacy:"Privacy",footerNote:"A working beta, not an accredited university assessment service."
};
const languageButtonEN=document.getElementById("langEN"),languageButtonAR=document.getElementById("langAR");
const student=document.getElementById("studentCard"),demo=document.getElementById("demoLink"),
 home=document.getElementById("homeLink"),homeBrand=document.getElementById("homeBrand"),footHome=document.getElementById("footHome"),
 privacy=document.getElementById("privacyLink"),deck=document.getElementById("downloadDeck"),waShare=document.getElementById("waShare");
let active="en";
function setLang(next){
 active=next==="ar"?"ar":"en";
 const t=active==="ar"?AR:EN;
 document.documentElement.lang=active;
 document.documentElement.dir=active==="ar"?"rtl":"ltr";
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