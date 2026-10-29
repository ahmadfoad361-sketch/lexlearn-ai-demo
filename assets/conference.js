(function(){
"use strict";
const AR={
 businessLabel:"النموذج التجاري المقترح",buyerTitle:"لمن نقدّم الحل؟",buyerText:"الجامعات وكليات القانون التي تبحث عن تدريب إضافي ومتابعة أوضح لتقدّم الطلاب.",revenueTitle:"كيف يتحول إلى إيراد؟",revenueText:"تراخيص مؤسسية للمقررات أو مجموعات الطلاب. تُحدَّد الأسعار ونطاق الخدمة بعد التجربة وبالاتفاق مع الجهة.",validationTitle:"ما الذي نريد إثباته؟",validationText:"دقة التقييم، والتزام الطلاب بالتدريب، ومؤشرات التحسن على أسئلة جديدة؛ ثم بحث اتفاق مدفوع إذا ناسبت النتائج احتياج الجهة.",businessNote:"هذا تصور تجاري مقترح، وليس إعلانًا عن مبيعات أو اتفاقات قائمة.",
 adminLogin:"دخول المشرف",instructorLogin:"دخول أستاذ الجامعة",skip:"انتقل إلى المحتوى",home:"الموقع الرئيسي",
 promo:"\u2066LexLearn\u2069 في مؤتمر \u2066Web Summit Qatar 2027\u2069 — اكتشف الرؤية وجرّب المنصة وتعرّف على التجربة الجامعية.",promoShort:"\u2066LexLearn\u2069 · \u2066Web Summit Qatar 2027\u2069 · نسخة \u2066ALPHA\u2069",
 eyebrow:"ليكس ليرن · منصة تعليمية لطلاب القانون",
 heroTitle:"قيّم مهاراتك القانونية، وطوّرها انطلاقًا من نقاط قوتك.",
 heroSubBefore:"يشخّص",heroSub:"نقاط قوتك في تعلّم القانون، ويقترح تدريبًا يساعدك على التقدّم خطوة خطوة.",
 studentTitle:"طالب",studentDesc:"جرّب الحفظ والفهم في تجربة تفاعلية قصيرة.",studentCTA:"افتح التجربة التفاعلية",
 univTitle:"جامعة أو مؤسسة تعليمية",univDesc:"تعرّف على التجربة الجامعية المقترحة.",univCTA:"اعرف خطة التجربة الجامعية",
 invTitle:"مستثمر أو شريك",invDesc:"الرؤية وخارطة التعاون الأكاديمي والتوسع.",invCTA:"اطّلع على الرؤية",
 label01:"01 / المشكلة",problemHeading:"الدرجة نفسها قد تخفي مشكلات تعلم مختلفة.",
 problemLead:"قد يتذكر طالب نص القاعدة ويحتاج إلى تدريب على تطبيقها، بينما يفهمها آخر ويحتاج إلى تثبيتها في الذاكرة. الدرجة وحدها لا تحدد الخطوة الأنسب لكل منهما.",
 solutionLabel:"حل LexLearn",solutionHeading:"نبدأ بما يتقنه الطالب، ونبني عليه التدريب التالي.",
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
 demoButton:"جرّب التجربة التفاعلية ←",flow1:"اقرأ قاعدة قانونية",flow2:"أجب عن الأسئلة",flow3:"شاهد تحليلًا مبدئيًا",flow4:"نتدرّب انطلاقًا من نقاط قوتك",
 label04:"04 / عرض المشروع",deckTitle:"الفكرة في بطاقات عرض مختصرة.",
 deckDesc:"المشكلة، وطريقة التعلّم، وخطة التجربة الجامعية في ست شرائح.",download:"تحميل العرض PDF ↓",
 slide1Small:"المشكلة",slide1H:"أبعد من مجرد درجات",slide1P:"قد يتعثر طلاب القانون لأسباب مختلفة. يبدأ LexLearn بالتشخيص.",
 slide2Small:"آلية العمل",slide2H:"شخّص ← كيّف ← درّب",slide2P:"استثمر المهارة الأقوى لدى الطالب لتقوية المهارة الأضعف.",
 slide3Small:"المهارات الخمس",slide3H:"ملف تعلم أكثر وضوحًا",slide3P:"الحفظ · الفهم · التطبيق · الدقة القانونية · بناء الإجابة في الامتحان.",
 slide4Small:"الوضع الحالي",slide4H:"نسخة تجريبية عاملة",slide4P:"تحليل الإجابات المقالية بالذكاء الاصطناعي: قيد التطوير. التحقق من الأثر التعليمي سيتم عبر التجربة المقترحة.",
 slide5Small:"التحقق الأكاديمي",slide5H:"30–60 طالبًا · 6–8 أسابيع",slide5P:"تجربة مقترحة بإشراف LexLearn ومتابعتها، مع قياس قبلي وبعدي بالتنسيق مع الجامعة.",
 slide6Small:"خريطة الطريق",slide6H:"التحقق الأكاديمي، ثم التوسع",slide6P:"نبدأ بالتعاون مع كليات القانون، ونتحقق من الأثر قبل التوسع في المواد والأسواق.",
 deckNote:"ملخص للتعريف بالمشروع. أعداد التجربة ومدتها مقترحة، والتفاصيل متاحة للنقاش.",deckSwipeHint:"مرّر أفقيًا لاستعراض بقية الشرائح ↔",returnPaths:"العودة للأعلى",
 label05:"05 / التجربة الجامعية",pilotTitle:"تعاون أكاديمي قابل للقياس",
 pilotOffer:"تجربة مجانية محدودة المدة، بلا التزام بالشراء.",pilotBody:"تُنفَّذ التجربة بالتعاون مع الجامعة، ويُحدَّد تصميم القياس بالتشاور معها، وتتولى LexLearn المتابعة وإعداد التقرير.",
 pilotLexLearnTitle:"دور LexLearn",pilotLexLearnRole:"تتولى LexLearn متابعة التجربة وتقييم نتائجها.",
 pilotNeedsTitle:"المطلوب من الجامعة",pilotNeeds:"مشرف أكاديمي، ومجموعة طلاب متطوعين، وقاعة أو لقاء عن بُعد في وقت متفق عليه، مع التنسيق للموافقات الأكاديمية.",pilotValueTitle:"ما تحصل عليه الجامعة",pilotValue:"تقرير قياس أثر تعليمي أولي ومجمّع ومجهول الهوية، يمكن للجامعة مراجعته وتقييمه بصورة مستقلة.",pilotEthics:"التقارير المسلَّمة للجامعة مجمّعة ومجهولة الهوية؛ ومتابعة المشرف الأكاديمي للطلاب تتم وفق الموافقات الأكاديمية اللازمة.",
 pilotStudents:"طالبًا",pilotStudentsHelp:"العدد المقترح لمشاركة طلاب القانون.",pilotWeeks:"أسابيع",pilotWeeksHelp:"مدة التدريب والقياس القبلي والبعدي.",
 pilotBefore:"قبل التجربة",pilotDuring:"أثناء التجربة",pilotAfter:"بعد التجربة",pilot1:"تجري LexLearn تشخيصًا أوليًا لكل مهارة.",pilot2:"تتابع LexLearn التدريب وتقدّم الطلاب.",pilot3:"تراجع LexLearn نتائج التجربة ومؤشرات التعلّم الأولية.",
 pilotCTA:"ناقش تجربة جامعية",pilotWhatsApp:"واتساب",investorCTA:"اطلب العرض التفصيلي",investorAsk:"نبحث عن شراكات للتجربة الأكاديمية ودعم استراتيجي ومناقشات تمويل مبكر؛ التفاصيل في العرض التفصيلي.",statusReady:"جاهزة",statusProgress:"قيد التنفيذ",statusUpcoming:"قادمة",businessCTA:"تواصل معنا عبر واتساب",shareTitle:"شارك صفحة المؤتمر",phase2PStart:"تجربة مقترحة تشمل",phase2PMid:"طالبًا خلال",phase2PEnd:"أسابيع لقياس النتائج الأولية.",
 label06:"06 / للمستثمرين والشركاء",visionTitle:"الدليل قبل التوسع.",
 visionLead:"رؤيتنا طويلة المدى منصة تعليمية تبدأ بالتشخيص وتقدم توصيات قابلة للفهم مع استمرار دور المشرف الأكاديمي.",
 phase1:"نسخة تجريبية عاملة",phase1P:"تطوير واختبار تجربة الطالب وأدوات المشرف.",phase2:"تجربة أكاديمية بالتعاون مع الجامعات",phase2P:"مقترح 30–60 طالبًا خلال 6–8 أسابيع لقياس النتائج الأولية.",phase3:"التحقق من المنتج",phase3P:"تحسين دقة تحليل الإجابات، ومراجعة المحتوى، وتجهيز أدوات المشرف الأكاديمي للتجربة.",phase4:"التوسع المدروس",phase4P:"النظر في مواد قانونية وتخصصات أخرى بعد توفر أدلة كافية من التجربة.",
 evidenceNote:"الأثر التعليمي لم يُثبت بعد؛ وسنقيسه من خلال التجربة الجامعية المقترحة.",honestyTitle:"أين وصلنا اليوم؟",status1:"نسخة تجريبية عاملة",status2:"تحليل الإجابات المقالية بالذكاء الاصطناعي: قيد التطوير",status2Title:"تحليل الإجابات المقالية بالذكاء الاصطناعي",status2State:"قيد التطوير والتحقق من الدقة",status3:"التحقق من الأثر التعليمي سيتم عبر التجربة المقترحة",
 label07:"07 / التواصل",contactTitle:"لنستكشف الخطوة التالية معًا.",contactText:"التجارب الجامعية، ودعم الاحتضان، والشراكات التقنية، ومناقشات الاستثمار الأولية.",
 emailCTA:"تواصل مع المؤسس",waCTA:"شارك الصفحة عبر واتساب ←",qrCTA:"تحميل رمز QR للطباعة ↓",waNote:"",
 founderName:"د. أحمد فؤاد الفقي",founderRole:"المؤسس والرئيس التنفيذي",privacy:"الخصوصية",
 footerNote:"نسخة تجريبية عاملة، وليست خدمة تقييم جامعي معتمدة.",contactFormTitle:"اترك بيانات التواصل",contactFormDesc:"اختر صفتك واترك وسيلة تواصل لنناقش العرض أو التجربة الجامعية.",leadName:"الاسم",leadOrg:"الجهة (اختياري)",leadRole:"أنا",leadContact:"رقم واتساب أو بريد إلكتروني",leadRoleStudent:"طالب",leadRoleInvestor:"مستثمر أو شريك",leadRoleUniversity:"جامعة أو مؤسسة",leadSubmit:"تابع الإرسال عبر واتساب",leadEmail:"أرسل عبر البريد",leadPrivacy:"لا تُخزَّن بياناتك على هذه الصفحة؛ يُفتح واتساب أو البريد برسالة جاهزة ولن تُرسل إلا بعد تأكيدك.",pitchNote:"تواصل معنا لطلب العرض ومناقشة فرصة التعاون.",phase1Link:"جرّب التجربة التفاعلية",
 leadConsentLabel:"أوافق على استخدام بياناتي للتواصل معي بشأن LexLearn وفق سياسة الخصوصية.",leadPrivacyLink:"اقرأ سياسة الخصوصية",
 leadSaveSubmit:"أرسل طلب التواصل",leadSaving:"جارٍ تسجيل طلبك...",
 leadSuccess:"تم استلام طلبك بنجاح، وسنتواصل معك عبر الوسيلة التي حددتها.",
 leadFailure:"تعذر حفظ طلبك الآن. حاول مرة أخرى، أو تواصل عبر واتساب أو البريد.",
 leadRateLimit:"طلبات كثيرة في وقت قصير؛ حاول بعد قليل.",
 leadCaptchaRequired:"يرجى إكمال التحقق الأمني قبل الإرسال.",
 leadLivePrivacy:"لا يُحفظ طلبك إلا بعد موافقتك وتأكيد التحقق الأمني. ويمكنك طلب حذف بياناتك وفق سياسة الخصوصية.",
 leadChecking:"جارٍ التحقق من توفر نموذج التواصل الآمن…",leadUnavailable:"يسعدنا التواصل معك عبر واتساب أو البريد. نموذج الإرسال المباشر غير متاح حاليًا.",
 contactOtherWays:"تواصل مع LexLearn",leadInvalidContact:"أدخل بريدًا إلكترونيًا صحيحًا أو رقم هاتف دوليًا صالحًا."
};
const EN={
 businessLabel:"PROPOSED BUSINESS MODEL",buyerTitle:"Who is it for?",buyerText:"Universities and law faculties seeking additional student practice and clearer progress monitoring.",revenueTitle:"How could it earn revenue?",revenueText:"Institutional licences for courses or student cohorts. Pricing and scope would be agreed after the pilot.",validationTitle:"What must the pilot establish?",validationText:"Assessment reliability, student engagement and progress on new questions; then explore a paid agreement if the results meet the institution's needs.",businessNote:"A proposed commercial approach, not a claim of existing sales or signed agreements.",
 adminLogin:"Supervisor login",instructorLogin:"Professor login",skip:"Skip to content",home:"Main site",
 promo:"LexLearn at Web Summit Qatar 2027 — Discover our vision. Try the demo. Explore a university pilot.",promoShort:"LexLearn · Web Summit Qatar 2027 · ALPHA",
 eyebrow:"LEXLEARN · LEGAL LEARNING FOR STUDENTS",
 heroTitle:"Assess your legal learning skills. Build on your strengths.",
 heroSubBefore:"",heroSub:"explores your strengths in legal learning and suggests practice to help you progress step by step.",
 studentTitle:"Student",studentDesc:"Try recall and understanding in a short interactive experience.",studentCTA:"Open interactive experience",
 univTitle:"University or institution",univDesc:"Explore a proposed supervised university pilot.",univCTA:"Explore the university pilot plan",
 invTitle:"Investor or partner",invDesc:"See the vision and academic roadmap.",invCTA:"View roadmap",
 label01:"01 / THE PROBLEM",problemHeading:"The same score can hide different learning problems.",
 problemLead:"One student remembers a rule but struggles to explain it. Another understands the idea but cannot recall it during an exam. A single score does not reveal the next useful step.",
 solutionLabel:"THE LEXLEARN RESPONSE",solutionHeading:"Start with what the student can do, then build the next skill.",solutionBody:"LexLearn guides skill diagnosis and practice without replacing university teaching or independent academic assessment.",
 label02:"02 / HOW IT WORKS",howHeading:"Five precise skills. One adaptable path.",howNote:"The five-axis framework is the product vision; the public interactive experience currently illustrates recall and understanding only.",
 skill1:"Recall",skill1D:"Retrieve the legal rule accurately.",skill2:"Understanding",skill2D:"Explain why the legal rule works.",skill3:"Application",skill3D:"Apply the rule to a new set of facts.",skill4:"Legal precision",skill4D:"Use accurate legal terms and conditions.",skill5:"Exam answer structure",skill5D:"Build a clear, supported legal answer.",
 strengthTitle:"Example of the adaptive principle",strengthBody:"Strong recall + weaker understanding → practise explaining each element of the rule. Strong understanding + weaker recall → create memory cues from the concept already understood.",
 label03:"03 / TRY IT YOURSELF",demoTitle:"Try the live experience.",demoBody:"The interactive experience shows part of the idea—recall and understanding, with provisional local evaluation. It does not represent a validated five-skill diagnosis or a completed university pilot.",demoButton:"Try the interactive experience ↗",
 flow1:"Read a legal rule",flow2:"Answer questions",flow3:"See a provisional analysis",flow4:"Build the next skill from a strength",
 label04:"04 / PITCH DECK",deckTitle:"The idea, in slides.",deckDesc:"The problem, learning approach and proposed university pilot in six slides.",download:"Download PDF ↓",
 slide1Small:"THE OPPORTUNITY",slide1H:"Beyond grades",slide1P:"Law students may struggle for very different reasons. LexLearn starts with diagnosis.",
 slide2Small:"THE METHOD",slide2H:"Diagnose → Adapt → Practise",slide2P:"Use the student's strongest skill to strengthen the weakest skill.",
 slide3Small:"FIVE SKILLS",slide3H:"A clearer learning profile",slide3P:"Recall · Understanding · Application · Legal precision · Exam answer structure.",
 slide4Small:"CURRENT STATUS",slide4H:"Working beta",slide4P:"AI analysis of written answers: in progress. Learning impact not yet proven.",
 slide5Small:"ACADEMIC VALIDATION",slide5H:"30–60 students · 6–8 weeks",slide5P:"A proposed LexLearn-led pilot with baseline and follow-up assessments.",
 slide6Small:"ACADEMIC ROADMAP",slide6H:"Validate, then expand",slide6P:"Work with law faculties, validate impact, then consider broader disciplines and markets.",
 deckNote:"A public introduction to the project. Pilot size and duration are proposed; further details are available for discussion.",deckSwipeHint:"Swipe sideways to see the other slides ↔",returnPaths:"Back to top",
 label05:"05 / UNIVERSITY PILOT",pilotTitle:"Measurable academic collaboration",pilotOffer:"A free, limited-duration pilot with no purchase commitment.",pilotBody:"The pilot is run in collaboration with the university. The measurement design is agreed jointly, and LexLearn handles follow-up and the report.",
 pilotLexLearnTitle:"LexLearn's role",pilotLexLearnRole:"LexLearn follows the pilot and evaluates its results.",
 pilotNeedsTitle:"What we need from the university",pilotNeeds:"An academic supervisor, volunteer students, and an agreed classroom or online session time, subject to academic approvals.",pilotValueTitle:"What the university receives",pilotValue:"An aggregated, anonymised preliminary learning-impact report, independently reviewable by the university.",pilotEthics:"Reports delivered to the university are aggregated and anonymised; academic supervisor follow-up of individual students takes place only under the required academic approvals.",pilotStudents:"students",pilotStudentsHelp:"Proposed number of law students taking part.",pilotWeeks:"weeks",pilotWeeksHelp:"Duration of practice and pre-/post-assessment.",
 pilotBefore:"Before",pilotDuring:"During",pilotAfter:"After",pilot1:"LexLearn establishes a baseline for each skill.",pilot2:"LexLearn follows the practice and student progress.",pilot3:"LexLearn reviews the pilot results and early learning indicators.",pilotCTA:"Discuss a university pilot",pilotWhatsApp:"WhatsApp",investorCTA:"Request the detailed pitch",investorAsk:"We seek academic pilot partners, strategic support and early-stage funding discussions. Details are available in the full pitch.",statusReady:"Ready",statusProgress:"In progress",statusUpcoming:"Upcoming",businessCTA:"Chat on WhatsApp",shareTitle:"Share the conference page",phase2PStart:"Proposed pilot for",phase2PMid:"students over",phase2PEnd:"weeks to measure early outcomes.",
 label06:"06 / INVESTORS & PARTNERS",visionTitle:"Proof before scale.",visionLead:"The long-term vision is a diagnostic-first learning platform with explainable recommendations and meaningful faculty oversight.",
 phase1:"Working beta",phase1P:"Core student experience and supervisor tools under development and testing.",phase2:"University academic pilot",phase2P:"Propose 30–60 students over 6–8 weeks; measure the first outcomes.",phase3:"Product validation",phase3P:"Improve essay-answer analysis accuracy, review content and prepare academic supervisor tools for the pilot.",phase4:"Broader expansion",phase4P:"Consider other legal subjects and disciplines once sufficient pilot evidence is available.",
 evidenceNote:"Learning impact has not yet been demonstrated; we will evaluate it through the proposed academic pilot.",honestyTitle:"Where we stand today",status1:"Working beta",status2:"AI analysis of written answers: in progress",status2Title:"AI analysis of written answers",status2State:"In progress · validating reliability",status3:"Learning impact not yet proven",
 label07:"07 / CONTACT",contactTitle:"Let's explore what comes next.",contactText:"Academic pilots, incubation support, technical partnerships and early-stage conversations.",emailCTA:"Contact the founder",waCTA:"Share via WhatsApp ↗",qrCTA:"Print QR code ↓",waNote:"",founderName:"Dr Ahmed Fouad El Feky",founderRole:"Founder & CEO",privacy:"Privacy",footerNote:"A working beta, not an accredited university assessment service.",contactFormTitle:"Leave your contact details",contactFormDesc:"Select your role and share a way to reach you about the pitch or academic pilot.",leadName:"Name",leadOrg:"Organisation (optional)",leadRole:"I am a",leadContact:"WhatsApp number or email",leadRoleStudent:"Student",leadRoleInvestor:"Investor or partner",leadRoleUniversity:"University or institution",leadSubmit:"Continue on WhatsApp",leadEmail:"Send by email",leadPrivacy:"This page does not store your details. WhatsApp or email opens a draft; nothing is sent until you confirm.",pitchNote:"Contact us for the detailed pitch and a conversation about working together.",phase1Link:"Try the interactive experience",
 leadConsentLabel:"I agree that LexLearn may use my details to contact me about my inquiry, under its privacy policy.",leadPrivacyLink:"Read the privacy policy",
 leadSaveSubmit:"Send contact request",leadSaving:"Saving your request...",
 leadSuccess:"Your request was received successfully. We will contact you using your chosen details.",
 leadFailure:"We couldn't save your request. Please retry, or use WhatsApp or email.",
 leadRateLimit:"Too many requests in a short time. Please try again shortly.",
 leadCaptchaRequired:"Please complete the security check before submitting.",
 leadLivePrivacy:"Your inquiry is saved only after consent and successful security verification. You can request deletion under our privacy policy.",
 leadChecking:"Checking secure contact form availability…",leadUnavailable:"Reach us on WhatsApp or email. Direct form submission is temporarily unavailable.",
 contactOtherWays:"Contact LexLearn",leadInvalidContact:"Enter a valid email address or international phone number."
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
 function refreshBackPaths(){
  // Keep the return control available at PDF, contact and founder sections,
  // including direct section links and browser-restored scroll positions.
  var show=(window.scrollY||0)>140;
  backToPaths.classList.toggle("isVisible",show);
  backToPaths.setAttribute("aria-hidden",show?"false":"true");
  backToPaths.tabIndex=show?0:-1;
 }
 window.addEventListener("scroll",refreshBackPaths,{passive:true});
 window.addEventListener("resize",refreshBackPaths,{passive:true});
 window.addEventListener("pageshow",refreshBackPaths);
 window.addEventListener("hashchange",refreshBackPaths);
 refreshBackPaths();
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
 if(leadSaveButton)leadSaveButton.textContent=t.leadSaveSubmit;
 const availability=document.getElementById("leadStatus");
 if(availability&&leadMode==="unavailable")availability.textContent=t.leadUnavailable;
 else if(availability&&leadMode==="checking")availability.textContent=t.leadChecking;
 const leadNote=typeof document.querySelector==="function"?document.querySelector(".leadForm .leadPrivacy"):null;
 if(leadNote)leadNote.textContent=t.leadLivePrivacy;
 deck.removeAttribute("download");
 deck.href=active==="ar"?"#deck":"assets/lexlearn-public-pitch-en.pdf";
 if(active==="en")deck.setAttribute("download","LexLearn-Public-Pitch-EN.pdf");
 waShare.href="https://api.whatsapp.com/send?text="+encodeURIComponent("LexLearn — https://lexlearnsmart.com/go/");
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
// Conference inquiry: only confirmed server storage counts as a submitted request.
// If verification is not configured, the form is disabled and direct links remain available.
const leadForm=document.getElementById("leadForm");
if(leadForm){
 const endpoint="https://emxiuwcuxyljfynnzpnh.supabase.co/functions/v1/conference-lead";
 const roleSelect=document.getElementById("leadRole"),submitButton=document.getElementById("leadSubmit");
 const consentGroup=document.getElementById("leadConsentGroup"),consentCheck=document.getElementById("leadConsent");
 const captchaMount=document.getElementById("leadTurnstile"),statusEl=document.getElementById("leadStatus");
 const contactInput=document.getElementById("leadContact");
 let captchaToken="",widgetId=null,isBusy=false;
 function tr(key){return (active==="ar"?AR:EN)[key]||key;}
 function status(message,state){
  if(!statusEl)return;
  statusEl.textContent=message;statusEl.setAttribute("data-state",state||"");
 }
 function setMode(next){
  leadMode=next;
  const ready=next==="save";
  leadForm.setAttribute("data-mode",next);
  leadForm.setAttribute("aria-busy",String(next==="checking"));
  document.querySelectorAll("#leadForm .leadFields, #leadForm .leadActions, #leadForm .leadPrivacy, #leadForm > h3, #leadForm > p:not(#leadStatus)").forEach(function(el){el.hidden=!ready;});
  if(consentGroup)consentGroup.hidden=!ready;
  if(consentCheck)consentCheck.required=true;
  if(captchaMount)captchaMount.hidden=!ready;
  submitButton.disabled=!ready;
  submitButton.textContent=tr("leadSaveSubmit");
  if(next==="unavailable")status(tr("leadUnavailable"),"info");
  if(next==="checking")status(tr("leadChecking"),"info");
 }
 document.querySelectorAll("[data-role]").forEach(function(link){
  link.addEventListener("click",function(){
   roleSelect.value=link.getAttribute("data-role")||"student";
  });
 });
 function validateContact(){
  const raw=String(contactInput.value||"").trim();
  const email=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)&&raw.length<=120;
  const phone=/^\+?[0-9]{7,15}$/.test(raw.replace(/[\s().\-]/g,""));
  if(typeof contactInput.setCustomValidity==="function")
   contactInput.setCustomValidity(email||phone?"":tr("leadInvalidContact"));
  return email||phone;
 }
 if(contactInput&&typeof contactInput.addEventListener==="function")
  contactInput.addEventListener("input",validateContact);
 function resetCaptcha(){
  captchaToken="";
  if(widgetId!==null&&window.turnstile&&typeof window.turnstile.reset==="function"){
   try{window.turnstile.reset(widgetId);}catch(_){}
  }
 }
 async function sendStoredLead(){
  validateContact();
  if(!leadForm.reportValidity())return;
  if(!captchaToken){status(tr("leadCaptchaRequired"),"error");return;}
  isBusy=true;submitButton.disabled=true;submitButton.textContent=tr("leadSaving");status("","");
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},
    signal:controller.signal,body:JSON.stringify({
     name:document.getElementById("leadName").value.trim(),
     organization:document.getElementById("leadOrg").value.trim(),
     role:roleSelect.value,contact:contactInput.value.trim(),
     consent:consentCheck.checked,privacyNoticeVersion:"2026-10-17",
     turnstileToken:captchaToken,website:document.getElementById("leadWebsite").value
    })});
   let result={};try{result=await response.json();}catch(_){}
   if(response.ok&&result.ok===true){
    const role=roleSelect.value;leadForm.reset();roleSelect.value=role;
    if(typeof contactInput.setCustomValidity==="function")contactInput.setCustomValidity("");
    status(tr("leadSuccess"),"success");
   }else status(tr(response.status===429?"leadRateLimit":response.status===403?"leadCaptchaRequired":"leadFailure"),"error");
  }catch(_){status(tr("leadFailure"),"error");}
  finally{
   clearTimeout(timer);resetCaptcha();isBusy=false;
   submitButton.disabled=leadMode!=="save";submitButton.textContent=tr("leadSaveSubmit");
  }
 }
 leadForm.addEventListener("submit",function(event){
  event.preventDefault();if(isBusy||leadMode!=="save")return;
  void sendStoredLead();
 });
 async function setupSecureIntake(){
  if(typeof fetch!=="function"||typeof AbortController!=="function"){setMode("unavailable");return;}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
   const response=await fetch(endpoint,{method:"GET",signal:controller.signal,cache:"no-store"});
   if(!response.ok){setMode("unavailable");return;}
   const config=await response.json();
   if(config.enabled!==true||!/^[-_a-zA-Z0-9]{5,100}$/.test(config.siteKey||"")){setMode("unavailable");return;}
   const script=document.createElement("script");
   script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";script.async=true;
   const loaded=await new Promise(function(resolve){
    const loadingTimer=setTimeout(()=>resolve(false),10000);
    script.onload=function(){clearTimeout(loadingTimer);resolve(true);};
    script.onerror=function(){clearTimeout(loadingTimer);resolve(false);};
    document.head.appendChild(script);
   });
   if(!loaded||!window.turnstile||typeof window.turnstile.render!=="function"){setMode("unavailable");return;}
   captchaMount.hidden=false;
   widgetId=window.turnstile.render(captchaMount,{
    sitekey:config.siteKey,theme:"auto",
    callback:function(token){captchaToken=token;status("","");},
    "expired-callback":function(){captchaToken="";},
    "error-callback":function(){captchaToken="";status(tr("leadCaptchaRequired"),"error");}
   });
   setMode("save");status("","");
  }catch(_){setMode("unavailable");}
  finally{clearTimeout(timer);}
 }
 setMode("checking");
 void setupSecureIntake();
}
let saved="en";try{saved=localStorage.getItem("lexlearn_conference_language")==="ar"?"ar":"en";}catch(_){}
// Respect an explicit language on fresh conference URLs.
var query=window.location&&typeof window.location.search==="string"?window.location.search:"";
var explicitLanguage=/(?:^\?|&)lang=(ar|en)(?:&|$)/.exec(query);
setLang(explicitLanguage?explicitLanguage[1]:saved);
})();