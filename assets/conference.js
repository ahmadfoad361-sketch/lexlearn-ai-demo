(function(){
"use strict";
const AR={
 skip:"انتقل إلى المحتوى",home:"الموقع الرئيسي",
 promo:"\u2066LexLearn\u2069 في مؤتمر \u2066Web Summit Qatar 2027\u2069 — اكتشف الرؤية وجرّب المنصة وتعرّف على التجربة الجامعية.",promoShort:"\u2066LexLearn\u2069 · \u2066Web Summit Qatar 2027\u2069 · نسخة \u2066ALPHA\u2069",
 eyebrow:"ليكس ليرن · منصة تعليمية لطلاب القانون",
 heroTitle:"قيّم مهاراتك القانونية، وطوّرها انطلاقًا من نقاط قوتك.",
 heroSubBefore:"يشخّص",heroSub:"نقاط قوتك في التفكير القانوني، ويبني مسارك لتقوية المهارات الأضعف.",
 studentTitle:"طالب",studentDesc:"جرّب الحفظ والفهم في تجربة تفاعلية قصيرة.",studentCTA:"افتح التجربة التفاعلية",
 univTitle:"جامعة أو مؤسسة تعليمية",univDesc:"تعرّف على التجربة الجامعية المقترحة.",univCTA:"اعرف خطة التجربة الجامعية",
 invTitle:"مستثمر أو شريك",invDesc:"الرؤية وخارطة الطريق بدءًا من قطر.",invCTA:"اطّلع على الرؤية",
 label01:"01 / المشكلة",problemHeading:"الدرجة نفسها قد تخفي مشكلات تعلم مختلفة.",
 problemLead:"طالب يحفظ القاعدة ولا يستطيع شرحها. وآخر يفهمها لكنه لا يسترجعها وقت الاختبار. الدرجة وحدها لا تكشف التدريب الأنسب لكل طالب.",
 solutionLabel:"حل LexLearn",solutionHeading:"نحدّد ما يحتاج إلى تطوير، ونستخدم المهارة الأقوى لتقوية الأضعف.",
 solutionBody:"تستخدم LexLearn التشخيص لتقديم تدريب مستهدف، مع بقاء دور المشرف الأكاديمي في التدريس والتقييم الأكاديمي المستقل.",
 label02:"02 / كيف تعمل المنصة",howHeading:"خمس مهارات محددة، ومسار تعلم قابل للتكيف.",
 howNote:"المحاور الخمسة هي إطار المنتج المستهدف؛ أما التجربة التفاعلية العامة فتعرض جانبَي الحفظ والفهم فقط.",
 skill1:"الحفظ",skill1D:"استرجاع القاعدة القانونية بدقة.",
 skill2:"الفهم",skill2D:"شرح عناصر القاعدة وأسبابها.",
 skill3:"التطبيق",skill3D:"تطبيق الحكم على وقائع جديدة.",
 skill4:"الدقة القانونية",skill4D:"استخدام المصطلحات والشروط الصحيحة.",
 skill5:"بناء الإجابة في الامتحان",skill5D:"صياغة إجابة قانونية مرتبة ومعللة.",
 strengthTitle:"مثال لمبدأ التكيف",strengthBody:"حفظ قوي مع فهم أضعف ← تدريب على شرح عناصر القاعدة. فهم قوي مع حفظ أضعف ← بناء مفاتيح للتذكر انطلاقًا من الفكرة التي فهمها الطالب بالفعل.",
 label03:"03 / جرّب بنفسك",demoTitle:"عِش التجربة التفاعلية.",
 demoBody:"التجربة التفاعلية تعرض جزءًا من الفكرة، وتحديدًا الحفظ والفهم، مع تقييم محلي مبدئي. ولا تمثل تشخيصًا جامعيًا معتمدًا لجميع المهارات الخمس أو تجربة ميدانية مكتملة.",
 demoButton:"جرّب التجربة التفاعلية ←",flow1:"اقرأ قاعدة قانونية",flow2:"أجب عن الأسئلة",flow3:"شاهد تحليلًا مبدئيًا",flow4:"نقوّي المهارة الأضعف بالمهارة الأقوى",
 label04:"04 / عرض المشروع",deckTitle:"الفكرة في بطاقات عرض مختصرة.",
 deckDesc:"عرض عام خفيف للموبايل من دون تحميل قارئ PDF ثقيل.",download:"تحميل العرض PDF ↓",
 slide1Small:"المشكلة",slide1H:"أبعد من مجرد درجات",slide1P:"قد يتعثر طلاب القانون لأسباب مختلفة. يبدأ LexLearn بالتشخيص.",
 slide2Small:"آلية العمل",slide2H:"شخّص ← كيّف ← درّب",slide2P:"استثمر المهارة الأقوى لدى الطالب لتقوية المهارة الأضعف.",
 slide3Small:"المهارات الخمس",slide3H:"ملف تعلم أكثر وضوحًا",slide3P:"الحفظ · الفهم · التطبيق · الدقة القانونية · بناء الإجابة في الامتحان.",
 slide4Small:"الوضع الحالي",slide4H:"نسخة تجريبية عاملة",slide4P:"تحليل الإجابات المقالية بالذكاء الاصطناعي: قيد التطوير. التحقق من الأثر التعليمي سيتم عبر التجربة المقترحة.",
 slide5Small:"التحقق الأكاديمي",slide5H:"30–60 طالبًا · 6–8 أسابيع",slide5P:"تجربة مقترحة بإشراف LexLearn ومتابعتها، مع قياس قبلي وبعدي بالتنسيق مع الجامعة.",
 slide6Small:"خريطة الطريق",slide6H:"قطر أولًا، ثم التوسع",slide6P:"نبدأ بكليات القانون القطرية، ثم نتحقق من الأثر قبل التوسع في المواد والأسواق.",
 deckNote:"هذه معاينة عامة مختصرة للموبايل وليست العرض الاستثماري السري الكامل. أعداد التجربة مقترحة وليست نتائج منفذة.",deckSwipeHint:"مرّر أفقيًا لاستعراض بقية الشرائح ↔",returnPaths:"رجوع للمسارات",
 label05:"05 / التجربة الجامعية",pilotTitle:"تعاون أكاديمي قابل للقياس",
 pilotOffer:"تجربة مجانية محدودة المدة، بلا التزام بالشراء.",pilotBody:"تُنفَّذ التجربة بالتعاون مع الجامعة، ويُحدَّد تصميم القياس بالتشاور معها، وتتولى LexLearn المتابعة وإعداد التقرير.",
 pilotLexLearnTitle:"دور LexLearn",pilotLexLearnRole:"تتولى LexLearn متابعة التجربة وتقييم نتائجها.",
 pilotNeedsTitle:"المطلوب من الجامعة",pilotNeeds:"مشرف أكاديمي، ومجموعة طلاب متطوعين، وقاعة أو لقاء عن بُعد في وقت متفق عليه، مع التنسيق للموافقات الأكاديمية.",pilotValueTitle:"ما تحصل عليه الجامعة",pilotValue:"تقرير قياس أثر تعليمي أولي ومجمّع ومجهول الهوية، يمكن للجامعة مراجعته وتقييمه بصورة مستقلة.",pilotEthics:"التقارير المسلَّمة للجامعة مجمّعة ومجهولة الهوية؛ ومتابعة المشرف الأكاديمي للطلاب تتم وفق الموافقات الأكاديمية اللازمة.",
 pilotStudents:"طالبًا",pilotStudentsHelp:"العدد المقترح لمشاركة طلاب القانون.",pilotWeeks:"أسابيع",pilotWeeksHelp:"مدة التدريب والقياس القبلي والبعدي.",
 pilotBefore:"قبل التجربة",pilotDuring:"أثناء التجربة",pilotAfter:"بعد التجربة",pilot1:"تجري LexLearn تشخيصًا أوليًا لكل مهارة.",pilot2:"تتابع LexLearn التدريب وتقدّم الطلاب.",pilot3:"تراجع LexLearn نتائج التجربة ومؤشرات التعلّم الأولية.",
 pilotCTA:"ناقش تجربة جامعية",pilotWhatsApp:"واتساب",investorCTA:"اطلب العرض التفصيلي",investorAsk:"نبحث عن شراكات للتجربة الأكاديمية ودعم استراتيجي ومناقشات تمويل مبكر؛ التفاصيل في العرض التفصيلي.",statusReady:"جاهزة",statusProgress:"قيد التنفيذ",statusUpcoming:"قادمة",businessCTA:"تواصل معنا عبر واتساب",shareTitle:"شارك صفحة المؤتمر",phase2PStart:"تجربة مقترحة تشمل",phase2PMid:"طالبًا خلال",phase2PEnd:"أسابيع لقياس النتائج الأولية.",
 label06:"06 / للمستثمرين والشركاء",visionTitle:"قطر أولًا. الدليل قبل التوسع.",
 visionLead:"رؤيتنا طويلة المدى منصة تعليمية تبدأ بالتشخيص وتقدم توصيات قابلة للفهم مع استمرار دور المشرف الأكاديمي.",
 phase1:"نسخة تجريبية عاملة",phase1P:"تطوير واختبار تجربة الطالب وأدوات المشرف.",phase2:"تجربة أكاديمية في قطر",phase2P:"مقترح 30–60 طالبًا خلال 6–8 أسابيع لقياس النتائج الأولية.",phase3:"التحقق من المنتج",phase3P:"تحسين دقة تحليل الإجابات، ومراجعة المحتوى، وتجهيز أدوات المشرف الأكاديمي للتجربة.",phase4:"التوسع المدروس",phase4P:"النظر في مواد قانونية وتخصصات أخرى بعد توفر أدلة كافية من التجربة.",
 evidenceNote:"الأثر التعليمي لم يُثبت بعد؛ وسنقيسه من خلال التجربة الجامعية المقترحة.",honestyTitle:"أين وصلنا اليوم؟",status1:"نسخة تجريبية عاملة",status2:"تحليل الإجابات المقالية بالذكاء الاصطناعي: قيد التطوير",status2Title:"تحليل الإجابات المقالية بالذكاء الاصطناعي",status2State:"قيد التطوير والتحقق من الدقة",status3:"التحقق من الأثر التعليمي سيتم عبر التجربة المقترحة",
 label07:"07 / التواصل",contactTitle:"لنستكشف الخطوة التالية معًا.",contactText:"التجارب الجامعية، ودعم الاحتضان، والشراكات التقنية، ومناقشات الاستثمار الأولية.",
 emailCTA:"تواصل مع المؤسس",waCTA:"شارك الصفحة عبر واتساب ←",qrCTA:"تحميل رمز QR للطباعة ↓",waNote:"",
 founderName:"د. أحمد فؤاد الفقي",founderRole:"المؤسس والرئيس التنفيذي",privacy:"الخصوصية",
 footerNote:"نسخة تجريبية عاملة، وليست خدمة تقييم جامعي معتمدة.",contactFormTitle:"اترك بيانات التواصل",contactFormDesc:"اختر صفتك واترك وسيلة تواصل لنناقش العرض أو التجربة الجامعية.",leadName:"الاسم",leadOrg:"الجهة (اختياري)",leadRole:"أنا",leadContact:"رقم واتساب أو بريد إلكتروني",leadRoleStudent:"طالب",leadRoleInvestor:"مستثمر أو شريك",leadRoleUniversity:"جامعة أو مؤسسة",leadSubmit:"تابع الإرسال عبر واتساب",leadEmail:"أرسل عبر البريد",leadPrivacy:"لا تُخزَّن بياناتك على هذه الصفحة؛ يُفتح واتساب أو البريد برسالة جاهزة ولن تُرسل إلا بعد تأكيدك.",pitchNote:"اترك بياناتك وسنرسل لك العرض.",phase1Link:"جرّب التجربة التفاعلية",
 leadConsentLabel:"أوافق على استخدام بياناتي للتواصل معي بشأن LexLearn وفق سياسة الخصوصية.",leadPrivacyLink:"اقرأ سياسة الخصوصية",
 leadSaveSubmit:"أرسل طلب التواصل",leadSaving:"جارٍ تسجيل طلبك...",
 leadSuccess:"تم استلام طلبك بنجاح، وسنتواصل معك عبر الوسيلة التي حددتها.",
 leadFailure:"تعذر حفظ طلبك الآن. حاول مرة أخرى، أو تواصل عبر واتساب أو البريد.",
 leadRateLimit:"طلبات كثيرة في وقت قصير؛ حاول بعد قليل.",
 leadCaptchaRequired:"يرجى إكمال التحقق الأمني قبل الإرسال.",
 leadLivePrivacy:"يُحفظ طلبك بعد موافقتك والتحقق الأمني، ويمكنك طلب حذفه عبر البريد الموضح في سياسة الخصوصية."
};
const EN={
 skip:"Skip to content",home:"Main site",
 promo:"LexLearn at Web Summit Qatar 2027 — Discover our vision. Try the demo. Explore a university pilot.",promoShort:"LexLearn · Web Summit Qatar 2027 · ALPHA",
 eyebrow:"LEXLEARN · LEGAL LEARNING FOR STUDENTS",
 heroTitle:"Assess your legal learning skills. Build on your strengths.",
 heroSubBefore:"",heroSub:"diagnoses your strengths in legal thinking and builds your learning path to strengthen weaker skills.",
 studentTitle:"Student",studentDesc:"Try recall and understanding in a short interactive experience.",studentCTA:"Open interactive experience",
 univTitle:"University or institution",univDesc:"Explore a proposed supervised university pilot.",univCTA:"Explore the university pilot plan",
 invTitle:"Investor or partner",invDesc:"See the vision and Qatar-first roadmap.",invCTA:"View roadmap",
 label01:"01 / THE PROBLEM",problemHeading:"The same score can hide different learning problems.",
 problemLead:"One student remembers a rule but struggles to explain it. Another understands the idea but cannot recall it during an exam. A single score does not reveal the next useful step.",
 solutionLabel:"THE LEXLEARN RESPONSE",solutionHeading:"Identify the gap. Build the weaker skill from the stronger one.",solutionBody:"LexLearn guides skill diagnosis and practice without replacing university teaching or independent academic assessment.",
 label02:"02 / HOW IT WORKS",howHeading:"Five precise skills. One adaptable path.",howNote:"The five-axis framework is the product vision; the public interactive experience currently illustrates recall and understanding only.",
 skill1:"Recall",skill1D:"Retrieve the legal rule accurately.",skill2:"Understanding",skill2D:"Explain why the legal rule works.",skill3:"Application",skill3D:"Apply the rule to a new set of facts.",skill4:"Legal precision",skill4D:"Use accurate legal terms and conditions.",skill5:"Exam answer structure",skill5D:"Build a clear, supported legal answer.",
 strengthTitle:"Example of the adaptive principle",strengthBody:"Strong recall + weaker understanding → practise explaining each element of the rule. Strong understanding + weaker recall → create memory cues from the concept already understood.",
 label03:"03 / TRY IT YOURSELF",demoTitle:"Try the live experience.",demoBody:"The interactive experience shows part of the idea—recall and understanding, with provisional local evaluation. It does not represent a validated five-skill diagnosis or a completed university pilot.",demoButton:"Try the interactive experience ↗",
 flow1:"Read a legal rule",flow2:"Answer questions",flow3:"See a provisional analysis",flow4:"Strengthen the weaker skill using the stronger one",
 label04:"04 / PITCH DECK",deckTitle:"The idea, in slides.",deckDesc:"A lightweight public preview of the pitch. No heavy PDF viewer.",download:"Download PDF ↓",
 slide1Small:"THE OPPORTUNITY",slide1H:"Beyond grades",slide1P:"Law students may struggle for very different reasons. LexLearn starts with diagnosis.",
 slide2Small:"THE METHOD",slide2H:"Diagnose → Adapt → Practise",slide2P:"Use the student's strongest skill to strengthen the weakest skill.",
 slide3Small:"FIVE SKILLS",slide3H:"A clearer learning profile",slide3P:"Recall · Understanding · Application · Legal precision · Exam answer structure.",
 slide4Small:"CURRENT STATUS",slide4H:"Working beta",slide4P:"AI analysis of written answers: in progress. Learning impact not yet proven.",
 slide5Small:"ACADEMIC VALIDATION",slide5H:"30–60 students · 6–8 weeks",slide5P:"A proposed LexLearn-led pilot with baseline and follow-up assessments.",
 slide6Small:"QATAR-FIRST ROADMAP",slide6H:"Validate, then expand",slide6P:"Start with Qatari law faculties, validate impact, then consider broader disciplines and markets.",
 deckNote:"Public mobile summary rather than the full confidential investor presentation. Figures are a proposal, not completed pilot results.",deckSwipeHint:"Swipe sideways to see the other slides ↔",returnPaths:"Back to paths",
 label05:"05 / UNIVERSITY PILOT",pilotTitle:"Measurable academic collaboration",pilotOffer:"A free, limited-duration pilot with no purchase commitment.",pilotBody:"The pilot is run in collaboration with the university. The measurement design is agreed jointly, and LexLearn handles follow-up and the report.",
 pilotLexLearnTitle:"LexLearn's role",pilotLexLearnRole:"LexLearn follows the pilot and evaluates its results.",
 pilotNeedsTitle:"What we need from the university",pilotNeeds:"An academic supervisor, volunteer students, and an agreed classroom or online session time, subject to academic approvals.",pilotValueTitle:"What the university receives",pilotValue:"An aggregated, anonymised preliminary learning-impact report, independently reviewable by the university.",pilotEthics:"Reports delivered to the university are aggregated and anonymised; academic supervisor follow-up of individual students takes place only under the required academic approvals.",pilotStudents:"students",pilotStudentsHelp:"Proposed number of law students taking part.",pilotWeeks:"weeks",pilotWeeksHelp:"Duration of practice and pre-/post-assessment.",
 pilotBefore:"Before",pilotDuring:"During",pilotAfter:"After",pilot1:"LexLearn establishes a baseline for each skill.",pilot2:"LexLearn follows the practice and student progress.",pilot3:"LexLearn reviews the pilot results and early learning indicators.",pilotCTA:"Discuss a university pilot",pilotWhatsApp:"WhatsApp",investorCTA:"Request the detailed pitch",investorAsk:"We seek academic pilot partners, strategic support and early-stage funding discussions. Details are available in the full pitch.",statusReady:"Ready",statusProgress:"In progress",statusUpcoming:"Upcoming",businessCTA:"Chat on WhatsApp",shareTitle:"Share the conference page",phase2PStart:"Proposed pilot for",phase2PMid:"students over",phase2PEnd:"weeks to measure early outcomes.",
 label06:"06 / INVESTORS & PARTNERS",visionTitle:"Qatar first. Proof before scale.",visionLead:"The long-term vision is a diagnostic-first learning platform with explainable recommendations and meaningful faculty oversight.",
 phase1:"Working beta",phase1P:"Core student experience and supervisor tools under development and testing.",phase2:"Qatari academic pilot",phase2P:"Propose 30–60 students over 6–8 weeks; measure the first outcomes.",phase3:"Product validation",phase3P:"Improve essay-answer analysis accuracy, review content and prepare academic supervisor tools for the pilot.",phase4:"Broader expansion",phase4P:"Consider other legal subjects and disciplines once sufficient pilot evidence is available.",
 evidenceNote:"Learning impact has not yet been demonstrated; we will evaluate it through the proposed academic pilot.",honestyTitle:"Where we stand today",status1:"Working beta",status2:"AI analysis of written answers: in progress",status2Title:"AI analysis of written answers",status2State:"In progress · validating reliability",status3:"Learning impact not yet proven",
 label07:"07 / CONTACT",contactTitle:"Let's explore what comes next.",contactText:"Academic pilots, incubation support, technical partnerships and early-stage conversations.",emailCTA:"Contact the founder",waCTA:"Share via WhatsApp ↗",qrCTA:"Print QR code ↓",waNote:"",founderName:"Dr Ahmed Foad Elfeky",founderRole:"Founder & CEO",privacy:"Privacy",footerNote:"A working beta, not an accredited university assessment service.",contactFormTitle:"Leave your contact details",contactFormDesc:"Select your role and share a way to reach you about the pitch or academic pilot.",leadName:"Name",leadOrg:"Organisation (optional)",leadRole:"I am a",leadContact:"WhatsApp number or email",leadRoleStudent:"Student",leadRoleInvestor:"Investor or partner",leadRoleUniversity:"University or institution",leadSubmit:"Continue on WhatsApp",leadEmail:"Send by email",leadPrivacy:"This page does not store your details. WhatsApp or email opens a draft; nothing is sent until you confirm.",pitchNote:"Leave your contact details and we will send you the pitch.",phase1Link:"Try the interactive experience",
 leadConsentLabel:"I agree that LexLearn may use my details to contact me about my inquiry, under its privacy policy.",leadPrivacyLink:"Read the privacy policy",
 leadSaveSubmit:"Send contact request",leadSaving:"Saving your request...",
 leadSuccess:"Your request was received successfully. We will contact you using your chosen details.",
 leadFailure:"We couldn't save your request. Please retry, or use WhatsApp or email.",
 leadRateLimit:"Too many requests in a short time. Please try again shortly.",
 leadCaptchaRequired:"Please complete the security check before submitting.",
 leadLivePrivacy:"With your consent, your inquiry is saved securely after verification. You can request deletion using the email in our privacy policy."
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
let leadMode="draft";
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
 if(backToPaths)backToPaths.setAttribute("aria-label",t.returnPaths);
 languageButtonEN.setAttribute("aria-pressed",String(active==="en"));languageButtonAR.setAttribute("aria-pressed",String(active==="ar"));
 const prefix=active==="ar"?"":"-en";
 student.href="showcase"+prefix+".html?country=qa&subject=rights";
 demo.href=student.href;
 const roadmapDemo=typeof document.querySelector==="function"?document.querySelector(".roadmapDemoLink"):null;
 if(roadmapDemo)roadmapDemo.href=student.href;
 home.href=homeBrand.href=footHome.href=active==="ar"?"index.html":"index-en.html";
 privacy.href=active==="ar"?"privacy.html":"privacy-en.html";
 const leadPrivacyLink=document.getElementById("leadPrivacyLink");
 if(leadPrivacyLink)leadPrivacyLink.href=privacy.href;
 const leadSaveButton=document.getElementById("leadSubmit");
 if(leadSaveButton)leadSaveButton.textContent=leadMode==="save"?t.leadSaveSubmit:t.leadSubmit;
 const leadNote=typeof document.querySelector==="function"?document.querySelector(".leadForm .leadPrivacy"):null;
 if(leadNote)leadNote.textContent=leadMode==="save"?t.leadLivePrivacy:t.leadPrivacy;
 deck.removeAttribute("download");
 deck.href=active==="ar"?"#deck":"assets/lexlearn-public-pitch-en.pdf";
 if(active==="en")deck.setAttribute("download","LexLearn-Public-Pitch-EN.pdf");
 waShare.href="https://api.whatsapp.com/send?text="+encodeURIComponent("LexLearn — https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/go/");
 const business=document.getElementById("waBusiness"),pilotWA=document.getElementById("pilotWhatsApp");
 const greeting=active==="ar"?"مرحبًا، تعرفت على LexLearn في Web Summit Qatar 2027 وأرغب في معرفة المزيد.":"Hello, I discovered LexLearn at Web Summit Qatar 2027 and would like to learn more.";
 const pilotMessage=active==="ar"?"مرحبًا، أرغب في مناقشة التجربة الجامعية المقترحة لـLexLearn.":"Hello, I'd like to discuss the proposed LexLearn university pilot.";
 if(business)business.href="https://wa.me/201014408788?text="+encodeURIComponent(greeting);
 if(pilotWA)pilotWA.href="https://wa.me/201014408788?text="+encodeURIComponent(pilotMessage);
 if(waShare){waShare.title=t.shareTitle;waShare.setAttribute("aria-label",t.shareTitle);}
 const investorQuote=document.getElementById("investorQuote");
 if(investorQuote&&window.LEXLEARN_INVESTOR_QUOTES&&investorQuote.children&&investorQuote.children.length)window.LEXLEARN_INVESTOR_QUOTES.render(investorQuote,active);

 try{localStorage.setItem("lexlearn_conference_language",active);}catch(_){}
}
function printArabicDeck(){
 if(typeof window.lexlearnDownloadPublicDeck==="function") window.lexlearnDownloadPublicDeck("ar");
 else alert("The download is unavailable. Please reload the page.");
}

languageButtonEN.addEventListener("click",function(){setLang("en");});
languageButtonAR.addEventListener("click",function(){setLang("ar");});
deck.addEventListener("click",function(event){if(active==="ar"){event.preventDefault();printArabicDeck();}});
// Conference opt-in storage: never claim delivery before the server confirms an insert.
// When Turnstile is unconfigured, retain the existing direct WhatsApp/email draft actions.
const leadForm=document.getElementById("leadForm");
if(leadForm){
 const endpoint="https://emxiuwcuxyljfynnzpnh.supabase.co/functions/v1/conference-lead";
 const roleSelect=document.getElementById("leadRole"),emailButton=document.getElementById("leadEmail");
 const submitButton=document.getElementById("leadSubmit"),consentGroup=document.getElementById("leadConsentGroup");
 const consentCheck=document.getElementById("leadConsent"),captchaMount=document.getElementById("leadTurnstile");
 const statusEl=document.getElementById("leadStatus"),privacyNote=typeof leadForm.querySelector==="function"?leadForm.querySelector(".leadPrivacy"):null;
 let captchaToken="",widgetId=null,isBusy=false;
 function tr(key){return (active==="ar"?AR:EN)[key]||key;}
 function status(message,state){
  statusEl.textContent=message;statusEl.dataset.state=state||"";
 }
 function setMode(next){
  leadMode=next;
  const enabled=next==="save";
  consentGroup.hidden=!enabled;consentCheck.required=enabled;captchaMount.hidden=!enabled;
  submitButton.textContent=tr(enabled?"leadSaveSubmit":"leadSubmit");
  if(privacyNote)privacyNote.textContent=tr(enabled?"leadLivePrivacy":"leadPrivacy");
 }
 document.querySelectorAll("[data-role]").forEach(function(link){
  link.addEventListener("click",function(){roleSelect.value=link.getAttribute("data-role")||"student";status("","");});
 });
 function leadMessage(){
  const ar=active==="ar",role=roleSelect.value,roleLabel=tr("leadRole"+role.charAt(0).toUpperCase()+role.slice(1));
  const name=document.getElementById("leadName").value.trim();
  const org=document.getElementById("leadOrg").value.trim();
  const contact=document.getElementById("leadContact").value.trim();
  const context=role==="investor"?(ar?"طلب العرض التفصيلي":"Request detailed pitch"):role==="university"?(ar?"مناقشة التجربة الجامعية":"Discuss university pilot"):(ar?"التعرف على LexLearn":"Learn about LexLearn");
  return ["LexLearn — Web Summit Qatar 2027",context,(ar?"الاسم: ":"Name: ")+name,
   (ar?"الجهة: ":"Organisation: ")+(org||"—"),(ar?"الصفة: ":"Role: ")+roleLabel,
   (ar?"وسيلة التواصل: ":"Contact: ")+contact].join("\n");
 }
 function draftValid(){
  const previous=consentCheck.required;consentCheck.required=false;
  const valid=leadForm.reportValidity();consentCheck.required=previous;
  return valid;
 }
 function resetCaptcha(){
  captchaToken="";
  if(widgetId!==null&&window.turnstile&&typeof window.turnstile.reset==="function")window.turnstile.reset(widgetId);
 }
 async function sendStoredLead(){
  if(!leadForm.reportValidity())return;
  if(!captchaToken){status(tr("leadCaptchaRequired"),"error");return;}
  isBusy=true;submitButton.disabled=true;emailButton.disabled=true;
  submitButton.textContent=tr("leadSaving");status("","");
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},
    signal:controller.signal,body:JSON.stringify({
     name:document.getElementById("leadName").value.trim(),
     organization:document.getElementById("leadOrg").value.trim(),
     role:roleSelect.value,contact:document.getElementById("leadContact").value.trim(),
     consent:consentCheck.checked,privacyNoticeVersion:"2026-10-17",
     turnstileToken:captchaToken,website:document.getElementById("leadWebsite").value
    })});
   let responseData={};try{responseData=await response.json();}catch(_){}
   if(response.ok&&responseData.ok===true){
    const lastRole=roleSelect.value;leadForm.reset();roleSelect.value=lastRole;
    status(tr("leadSuccess"),"success");
   }else status(tr(response.status===429?"leadRateLimit":"leadFailure"),"error");
  }catch(_){status(tr("leadFailure"),"error");}
  finally{clearTimeout(timer);resetCaptcha();isBusy=false;submitButton.disabled=false;emailButton.disabled=false;submitButton.textContent=tr("leadSaveSubmit");}
 }
 leadForm.addEventListener("submit",function(event){
  event.preventDefault();if(isBusy)return;
  if(leadMode==="save"){void sendStoredLead();return;}
  if(!draftValid())return;
  window.location.href="https://wa.me/201014408788?text="+encodeURIComponent(leadMessage());
 });
 emailButton.addEventListener("click",function(){
  if(isBusy||!draftValid())return;
  const subject=active==="ar"?"LexLearn — طلب تواصل من صفحة المؤتمر":"LexLearn — Conference contact request";
  window.location.href="mailto:ahmadfoad361@gmail.com?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(leadMessage());
 });
 async function setupSecureIntake(){
  if(typeof fetch!=="function"||typeof AbortController!=="function")return;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
   const res=await fetch(endpoint,{method:"GET",signal:controller.signal,cache:"no-store"});
   if(!res.ok)return;
   const config=await res.json();
   if(!config.enabled||!/^[-_a-zA-Z0-9]{5,100}$/.test(config.siteKey||""))return;
   const script=document.createElement("script");script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";script.async=true;
   await new Promise(function(resolve,reject){
    script.onload=resolve;script.onerror=reject;document.head.appendChild(script);
   });
   if(!window.turnstile||typeof window.turnstile.render!=="function")return;
   captchaMount.hidden=false;
   widgetId=window.turnstile.render(captchaMount,{sitekey:config.siteKey,theme:"auto",
    callback:function(token){captchaToken=token;status("","");},
    "expired-callback":function(){captchaToken="";},
    "error-callback":function(){captchaToken="";status(tr("leadCaptchaRequired"),"error");}
   });
   setMode("save");
  }catch(_){setMode("draft");}
  finally{clearTimeout(timer);}
 }
 setMode("draft");
 void setupSecureIntake();
}
let saved="en";try{saved=localStorage.getItem("lexlearn_conference_language")==="ar"?"ar":"en";}catch(_){}
// Respect an explicit language on fresh conference URLs.
var query=window.location&&typeof window.location.search==="string"?window.location.search:"";
var explicitLanguage=/(?:^\?|&)lang=(ar|en)(?:&|$)/.exec(query);
setLang(explicitLanguage?explicitLanguage[1]:saved);
})();