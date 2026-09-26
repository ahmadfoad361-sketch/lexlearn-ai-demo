(function(){
"use strict";
var APP=document.getElementById("programApp");
var qs=new URLSearchParams(location.search);
var DEMO=qs.get("demo")==="1";
var AUTO_START=qs.get("start")==="1";
var COUNTRY=qs.get("country")||"qa";
var SUBJECT=qs.get("subject")||"sources";
var STUDENT_SESSION=(function(){try{return JSON.parse(localStorage.getItem("lexlearn_student_session"))||null;}catch(e){return null;}})();
var STUDENT_SCOPE=STUDENT_SESSION&&STUDENT_SESSION.studentId?("_"+STUDENT_SESSION.studentId):"";
var PROFILE_KEY="lexlearn_v9_profile"+STUDENT_SCOPE;
var COURSE_KEY="lexlearn_course_v1_"+COUNTRY+"_"+SUBJECT+STUDENT_SCOPE;
var TEXT64="ينعقد العقد بمجرد ارتباط الإيجاب بالقبول، إذا كان محله وسببه معتبرين قانونًا، وذلك دون إخلال بما يتطلبه القانون من أوضاع خاصة لانعقاد بعض العقود.";
var curriculum=[
  {week:1,title:"أساس القاعدة القانونية",sessions:[
    ["بداية البرنامج","العقد: الفكرة والعناصر","core"],
    ["التراضي","الإيجاب والقبول","core"],
    ["صحة العناصر","المحل والسبب","core"],
    ["الدقة القانونية","ما الذي لا يجوز إسقاطه؟","adaptive"],
    ["تقييم التقدم 1","استرجاع + فهم + تطبيق","assessment"]
  ]},
  {week:2,title:"مصادر الالتزام",sessions:[
    ["خريطة المصادر","العقد والإرادة المنفردة","core"],
    ["المصادر غير الإرادية","الفعل الضار والفعل النافع","core"],
    ["القانون كمصدر","متى ينشئ الالتزام مباشرة؟","core"],
    ["تمييز المصدر","Case Detective","adaptive"],
    ["تقييم التقدم 2","تمييز المصدر تحت ضغط الوقت","assessment"]
  ]},
  {week:3,title:"التطبيق على الوقائع",sessions:[
    ["اكتشاف المسألة","التقاط الواقعة الحاسمة","core"],
    ["Change One Fact","تغيير واقعة واحدة","adaptive"],
    ["استبعاد المشتت","ما الواقعة غير المؤثرة؟","adaptive"],
    ["مسألة قصيرة","قاعدة → واقعة → نتيجة","adaptive"],
    ["تقييم التقدم 3","تطبيق على حالات جديدة","assessment"]
  ]},
  {week:4,title:"الذاكرة القانونية الدقيقة",sessions:[
    ["استرجاع متباعد","المصطلحات والعناصر","review"],
    ["Missing Element","اكتشف العنصر الناقص","adaptive"],
    ["تصحيح الصياغة","اكتشف كلمة تغيّر الحكم","adaptive"],
    ["ذاكرة الفهم","مفتاح معنى لكل لفظ","review"],
    ["تقييم التقدم 4","استرجاع بعد تأخير","assessment"]
  ]},
  {week:5,title:"الإجابة الامتحانية",sessions:[
    ["Issue Spotting","ما المسألة القانونية؟","core"],
    ["بناء الإجابة","قاعدة → شروط → تطبيق → نتيجة","core"],
    ["تعليل النتيجة","لماذا وصلنا للحكم؟","adaptive"],
    ["Mini Mock","إجابة قصيرة تحت وقت","adaptive"],
    ["تقييم التقدم 5","جودة البناء الامتحاني","assessment"]
  ]},
  {week:6,title:"التثبيت والمحاكاة",sessions:[
    ["مراجعة تراكمية","استرجاع من الأسابيع السابقة","review"],
    ["مسألة مركبة","أكثر من مصدر وأكثر من عنصر","adaptive"],
    ["Mock تدريبي","مسألة كاملة","adaptive"],
    ["خطة ما بعد البرنامج","ما الذي يحتاج استمرارًا؟","review"],
    ["التقييم النهائي","تشخيص ختامي + خطة شخصية","assessment"]
  ]}
];

var skills=[
  {id:"contract",name:"انعقاد العقد",state:"stable"},
  {id:"sources",name:"تمييز مصادر الالتزام",state:"learning"},
  {id:"spot",name:"التقاط العنصر الحاسم",state:"learning"},
  {id:"apply",name:"التطبيق على الوقائع",state:"learning"},
  {id:"exam",name:"بناء الإجابة القانونية",state:"new"}
];
var taskBank={
  review:{kind:"review",title:"مراجعة بدون إعادة قراءة",q:"أي عنصر كان لازمًا إلى جانب الإيجاب والقبول في المادة 64؟",opts:["المحل والسبب المعتبران قانونًا","وقوع ضرر","مرور سنة"],a:0,skill:"contract",why:"العنصر المقصود هو المحل والسبب المعتبران قانونًا."},
  core:{kind:"core",title:"تمييز المصادر",q:"أي عبارة أدق؟",opts:["كل المصادر إرادية","القانون قد ينشئ الالتزام مباشرة","الفعل الضار عقد"],a:1,skill:"sources",why:"القانون قد يكون مصدرًا مباشرًا للالتزام."},
  apply:{kind:"adaptive",title:"Change One Fact",q:"اتفق الطرفان على كل العناصر، لكن محل العقد غير جائز قانونًا. ما أثر تغيير هذه الواقعة؟",opts:["لا يكفي الاتفاق وحده","ينعقد العقد دائمًا","يصبح المصدر فعلًا ضارًا"],a:0,skill:"apply",why:"تغير المحل القانوني يغيّر نتيجة تحليل الانعقاد."},
  spot:{kind:"adaptive",title:"Case Detective",q:"أي واقعة هي الأهم في تحديد ما إذا كان الاتفاق انعقد كعقد صحيح؟",opts:["لون الورق المستخدم","مشروعية المحل وتطابق الإرادتين","مكان جلوس الطرفين"],a:1,skill:"spot",why:"الواقعة القانونية الحاسمة مرتبطة بالعناصر التي يتطلبها الانعقاد."},
  exam:{kind:"adaptive",title:"بناء الإجابة",q:"أي ترتيب أقرب لإجابة قانونية جيدة عن انعقاد العقد؟",opts:["النتيجة فقط","القاعدة ثم الشروط ثم التطبيق ثم النتيجة","سرد الوقائع بلا قاعدة"],a:1,skill:"exam",why:"الإجابة القانونية تحتاج قاعدة وشروطًا وتطبيقًا ثم نتيجة، لا مجرد النتيجة."},
  understanding:{kind:"adaptive",title:"فهم عناصر القاعدة",q:"لماذا لا يكفي مجرد الإيجاب والقبول دائمًا؟",opts:["لأن النص يربط الانعقاد أيضًا باعتبار المحل والسبب وبالأوضاع الخاصة عند اللزوم","لأن كل عقد يحتاج شاهدين","لأن العقد لا ينعقد إلا بعد سنة"],a:0,skill:"contract",why:"الفهم هنا يقوم على ربط الإيجاب والقبول بباقي شروط النص."},
  recall:{kind:"adaptive",title:"استرجاع العناصر",q:"أي مجموعة تجمع أهم عناصر المادة 64؟",opts:["الإيجاب والقبول + المحل والسبب + الأوضاع الخاصة عند اللزوم","الضرر + الخطأ + السببية","الإثراء + الافتقار فقط"],a:0,skill:"contract",why:"هذه هي العناصر التي وردت في نص المادة 64."},
  retention:{kind:"adaptive",title:"استرجاع مؤجل",q:"من غير الرجوع للنص: ما الاستثناء الذي تحفظه المادة 64 لبعض العقود؟",opts:["مراعاة الأوضاع الخاصة التي يتطلبها القانون","وجوب وجود ضرر","وجوب مرور مدة"],a:0,skill:"contract",why:"النص أبقى على الأوضاع الخاصة التي يتطلبها القانون لبعض العقود.",memory:"اربط الاستثناء بوظيفته: بعض العقود لا يكفي فيها التراضي وحده لأن القانون يفرض شكلًا خاصًا."},
  explainRule:{kind:"adaptive",mode:"free",showText:true,title:"من الحفظ إلى الفهم",q:"اشرح في سطرين: لماذا لا يكفي وجود الإيجاب والقبول وحدهما دائمًا لانعقاد العقد؟",skill:"contract",model:"لأن التراضي عنصر أساسي، لكن صحة الانعقاد ترتبط أيضًا بمشروعية المحل والسبب، وقد يتطلب القانون أوضاعًا خاصة لبعض العقود.",why:"المطلوب هنا ليس ترديد النص؛ المطلوب بيان وظيفة كل عنصر وعلاقته بالنتيجة.",memory:"احفظ المعنى أولًا: تراضٍ + عناصر صحيحة + شكل خاص عند اللزوم."},
  whyContrast:{kind:"adaptive",title:"فهم لا ترديد",q:"اتفق طرفان في حالتين متشابهتين، لكن المحل في الحالة الثانية غير جائز قانونًا. لماذا تختلف النتيجة؟",opts:["لأن صحة المحل جزء من بناء القاعدة وليس تفصيلًا ثانويًا","لأن عدد الأطراف تغيّر","لأن كل اتفاق صحيح بمجرد القبول"],a:0,skill:"apply",why:"الفهم يظهر عندما تعرف أي عنصر يغيّر الحكم ولماذا.",memory:"اربط كل كلمة محفوظة بأثر: إذا اختل المحل تغيّرت نتيجة الانعقاد."},
  memoryAnchor:{kind:"adaptive",title:"من الفهم إلى التثبيت",q:"أي مفتاح ذاكرة يحفظ بنية القاعدة دون فصلها عن معناها؟",opts:["إيجاب/قبول ← محل/سبب ← أوضاع خاصة عند اللزوم","ضرر ← خطأ ← سببية","زمن ← مكان ← شاهد"],a:0,skill:"contract",why:"نحن لا نحفظ فقرة صماء؛ نحفظ هيكلًا ذا معنى يمكن إعادة بناء القاعدة منه.",memory:"مفتاح الذاكرة: تراضٍ → صحة العناصر → شكل خاص عند اللزوم."},
  reconstruct:{kind:"adaptive",mode:"free",title:"استرجاع مع معنى",q:"من ذاكرتك، اكتب 3 مفاتيح فقط تعيد بها بناء قاعدة انعقاد العقد، ثم اكتب بجانب كل مفتاح وظيفته.",skill:"contract",model:"1) الإيجاب والقبول: وجود التراضي. 2) المحل والسبب المعتبران قانونًا: سلامة عناصر العقد. 3) الأوضاع الخاصة عند اللزوم: احترام الشكل الذي يفرضه القانون لبعض العقود.",why:"هذا التدريب يربط الذاكرة بالسبب القانوني، فلا يبقى الحفظ منفصلًا عن الفهم.",memory:"إذا نسيت العبارة الطويلة، استرجع الهيكل ثم أعد بناء الصياغة."}
};
var weekTasks={
  1:[
    {kind:"core",title:"التقاط القاعدة",q:"أي عبارة تعبّر عن جوهر انعقاد العقد في النص المعروض؟",opts:["تطابق الإرادتين مع سلامة العناصر القانونية","وجود ضرر فقط","مرور مدة زمنية"],a:0,skill:"contract",why:"جوهر القاعدة هو التراضي مع بقاء باقي العناصر القانونية معتبرة.",memory:"ابدأ دائمًا بالسؤال: هل يوجد تراضٍ؟ وهل العناصر صحيحة قانونًا؟"},
    {kind:"adaptive",title:"Missing Element",q:"الصياغة الآتية ناقصة: «ينعقد العقد بمجرد الإيجاب والقبول». ما الإضافة التي تمنع الفهم المبتور؟",opts:["مراعاة المحل والسبب والأوضاع الخاصة عند اللزوم","ذكر مكان التوقيع","ذكر عمر المتعاقدين دائمًا"],a:0,skill:"contract",why:"الحفظ الصحيح لا يسقط العناصر التي قد تغيّر نتيجة الانعقاد.",memory:"لا تحفظ صدر القاعدة وتنسى قيودها."},
    {kind:"adaptive",title:"فسّر اللفظ",q:"ما فائدة عبارة «دون إخلال بما يتطلبه القانون من أوضاع خاصة»؟",opts:["تمنع اعتبار التراضي كافيًا في كل العقود","تلغي الإيجاب والقبول","تجعل كل العقود شكلية"],a:0,skill:"contract",why:"هذه العبارة تحفظ الاستثناء: بعض العقود تتطلب شكلًا خاصًا.",memory:"الاستثناء ليس زائدًا؛ هو مفتاح لتغيير الحكم."},
    {kind:"adaptive",mode:"free",title:"اشرح بطريقتك",q:"اكتب في سطر واحد الفرق بين وجود اتفاق وبين صحة انعقاد العقد.",skill:"contract",model:"قد يوجد اتفاق بين الطرفين، لكن صحة الانعقاد تتطلب أيضًا سلامة العناصر التي يشترطها القانون وقد تتطلب شكلًا خاصًا.",why:"الفهم يظهر عندما تفصل بين وجود الإرادة وبين اكتمال البناء القانوني.",memory:"اتفاق ≠ دائمًا عقد صحيح."}
  ],
  2:[
    {kind:"core",title:"خريطة المصادر",q:"أي ترتيب يساعدك على تمييز مصدر الالتزام؟",opts:["اسأل أولًا: هل نشأ من إرادة؟ ثم هل سببه فعل؟ ثم هل أنشأه القانون مباشرة؟","احفظ أسماء المصادر بلا مقارنة","ابدأ دائمًا بالفعل الضار"],a:0,skill:"sources",why:"التمييز يبدأ بأسئلة منطقية لا بقائمة محفوظة فقط.",memory:"إرادة؟ فعل؟ قانون؟"},
    {kind:"adaptive",title:"تمييز المصدر",q:"التزام نشأ لأن شخصًا أتلف مال غيره دون عقد بينهما. ما الباب الأقرب؟",opts:["الفعل الضار","العقد","الإرادة المنفردة"],a:0,skill:"sources",why:"غياب الاتفاق ووجود إضرار يوجهان إلى الفعل الضار.",memory:"اسأل: ما الواقعة التي أنشأت الالتزام؟"},
    {kind:"adaptive",title:"القانون كمصدر",q:"متى يكون القانون مصدرًا مباشرًا للالتزام؟",opts:["عندما ينشئ الالتزام بذاته دون الحاجة إلى عقد أو فعل سابق محدد","فقط إذا وُجد عقد","لا يكون مصدرًا أبدًا"],a:0,skill:"sources",why:"قد يرتب القانون التزامًا مباشرة متى قرر ذلك.",memory:"مصدر مباشر = النص نفسه أنشأ الالتزام."},
    {kind:"adaptive",mode:"free",title:"قارن مصدرين",q:"اكتب فرقًا واحدًا واضحًا بين العقد والفعل الضار من حيث سبب نشوء الالتزام.",skill:"sources",model:"العقد يقوم على توافق إرادتين لإنشاء أثر قانوني، بينما الفعل الضار ينشئ الالتزام بالتعويض بسبب الإضرار دون حاجة لاتفاق.",why:"المقارنة تثبت الفكرة أكثر من حفظ تعريفين منفصلين.",memory:"العقد: إرادة متوافقة. الفعل الضار: إضرار يولد التزامًا."}
  ],
  3:[
    {kind:"adaptive",title:"Case Detective",q:"في واقعة طويلة، أي معلومة يجب أن تبحث عنها أولًا؟",opts:["الواقعة التي إذا تغيرت تغير الحكم القانوني","أطول جملة في السؤال","اسم أول شخص ذُكر"],a:0,skill:"spot",why:"الواقعة الحاسمة هي التي تتحكم في تطبيق القاعدة.",memory:"اسأل: لو شلت الواقعة دي، هل الحكم يتغير؟"},
    {kind:"adaptive",title:"Change One Fact",q:"كان المحل جائزًا فأصبح محظورًا قانونًا، وبقي كل شيء آخر كما هو. ما المتوقع؟",opts:["قد تتغير نتيجة صحة العقد","لا يتغير شيء أبدًا","يتحول الأمر تلقائيًا إلى إثراء بلا سبب"],a:0,skill:"apply",why:"تغيير عنصر قانوني حاسم يغير نتيجة التطبيق.",memory:"غيّر واقعة واحدة ثم راقب الحكم."},
    {kind:"adaptive",title:"المشتت",q:"أي واقعة أقل صلة عادةً بتحليل صحة انعقاد العقد؟",opts:["لون الورق الذي كتب عليه الاتفاق","مشروعية المحل","تطابق الإيجاب والقبول"],a:0,skill:"spot",why:"ليست كل الوقائع في السؤال لها وزن قانوني.",memory:"فرّق بين الوقائع السردية والوقائع القانونية."},
    {kind:"adaptive",mode:"free",title:"طبق القاعدة",q:"طرفان اتفقا على بيع شيء محظور. اكتب النتيجة في جملتين: قاعدة ثم تطبيق.",skill:"apply",model:"التراضي وحده لا يكفي إذا كان المحل غير معتبر قانونًا. وبما أن محل الاتفاق محظور، فلا يكفي تطابق الإرادتين وحده لسلامة الانعقاد.",why:"التطبيق الجيد يربط عنصر القاعدة بواقعة محددة.",memory:"قاعدة محددة + واقعة محددة = نتيجة."}
  ],
  4:[
    {kind:"review",title:"استرجاع بدون نص",q:"أي مجموعة تحفظ هيكل قاعدة انعقاد العقد بأقل كلمات؟",opts:["تراضٍ → محل/سبب → شكل خاص عند اللزوم","ضرر → مدة → شاهد","مكان → زمن → توقيع"],a:0,skill:"contract",why:"هذا الهيكل يسمح بإعادة بناء القاعدة بدل حفظ فقرة صماء.",memory:"هيكل قبل الألفاظ."},
    {kind:"adaptive",title:"Missing Element",q:"«العقد ينعقد بتطابق الإرادتين إذا كان محله معتبرًا قانونًا». ما العنصر الذي سقط من الصياغة المختصرة؟",opts:["السبب","الضرر","المدة"],a:0,skill:"contract",why:"الدقة القانونية تعني عدم إسقاط عنصر جوهري من النص المدروس.",memory:"المحل والسبب زوج لا تنس أحدهما."},
    {kind:"adaptive",title:"اكتشف الخطأ",q:"أي صياغة أخطر لأنها تغيّر معنى القاعدة؟",opts:["ينعقد العقد دائمًا بمجرد الإيجاب والقبول","قد يتطلب القانون أوضاعًا خاصة لبعض العقود","يشترط اعتبار المحل والسبب قانونًا"],a:0,skill:"contract",why:"كلمة «دائمًا» تلغي القيود والاستثناءات الموجودة في القاعدة.",memory:"انتبه للكلمات المطلقة: دائمًا، أبدًا، في كل الأحوال."},
    {kind:"review",mode:"free",title:"استرجاع مؤجل",q:"من غير الرجوع للنص: اكتب العناصر الثلاثة التي تبني منها القاعدة، ثم معنى كل عنصر بكلمة أو كلمتين.",skill:"contract",model:"التراضي: توافق الإرادتين. المحل والسبب: سلامة العناصر القانونية. الأوضاع الخاصة: الشكل الذي قد يفرضه القانون.",why:"الذاكرة الأقوى هي التي تحفظ العنصر ومعناه معًا.",memory:"لفظ + وظيفة = ذاكرة قانونية قابلة للاستخدام."}
  ],
  5:[
    {kind:"core",title:"Issue Spotting",q:"قبل كتابة الإجابة، ما أول شيء تحدده في المسألة؟",opts:["المسألة القانونية المطلوب حسمها","الخاتمة الطويلة","كل الوقائع بلا تمييز"],a:0,skill:"exam",why:"الإجابة المنظمة تبدأ بتحديد المسألة القانونية.",memory:"المسألة أولًا، ثم القاعدة."},
    {kind:"core",title:"هيكل الإجابة",q:"ما الترتيب الأكثر أمانًا لإجابة تطبيقية قصيرة؟",opts:["مسألة → قاعدة → شروط/عناصر → تطبيق → نتيجة","نتيجة → قصة الوقائع → قاعدة","حفظ النص فقط"],a:0,skill:"exam",why:"هذا الهيكل يمنع القفز من القاعدة إلى النتيجة بلا تطبيق.",memory:"م ق ش ت ن: مسألة، قاعدة، شروط، تطبيق، نتيجة."},
    {kind:"adaptive",title:"تعليل النتيجة",q:"أي جملة تمثل تطبيقًا وليس مجرد تكرار للقاعدة؟",opts:["وبما أن محل الاتفاق محظور، فإن شرط سلامة المحل لا يتحقق","المحل يجب أن يكون معتبرًا قانونًا","العقد من مصادر الالتزام"],a:0,skill:"exam",why:"التطبيق يربط القاعدة بواقعة السؤال.",memory:"ابدأ التطبيق بـ: وبما أن..."},
    {kind:"adaptive",mode:"free",title:"Mini Mock",q:"اكتب إجابة من 4 جمل لمسألة: اتفق شخصان على بيع شيء محظور قانونًا.",skill:"exam",model:"المسألة هي مدى صحة انعقاد الاتفاق. القاعدة أن التراضي لا يكفي وحده بل يجب أن يكون المحل والسبب معتبرين قانونًا. وبما أن محل الاتفاق محظور، فلا يتحقق هذا الشرط. لذلك لا يكفي تطابق الإرادتين لسلامة الانعقاد.",why:"الأداء الامتحاني يجمع الفهم والذاكرة والتطبيق في بنية واحدة.",memory:"كل جملة لها وظيفة: مسألة، قاعدة، تطبيق، نتيجة."}
  ],
  6:[
    {kind:"review",title:"مراجعة تراكمية",q:"أي سؤال يكشف أنك نسيت معنى مصدر الالتزام رغم أنك تحفظ اسمه؟",opts:["هل تستطيع تمييزه في واقعة جديدة؟","هل تستطيع نطق الاسم؟","هل كتبته بخط واضح؟"],a:0,skill:"sources",why:"الثبات الحقيقي يظهر في التمييز والتطبيق، لا في ترديد الاسم.",memory:"الاسم بلا معيار تمييز = حفظ هش."},
    {kind:"adaptive",title:"مسألة مركبة",q:"وجد اتفاق بين طرفين، لكن المحل محظور، ونتج عن التنفيذ ضرر للغير. ما التصرف الأفضل في التحليل؟",opts:["افصل مسائل العقد عن الفعل الضار ولا تخلط بين مصدري الالتزام","اختر مصدرًا واحدًا فقط مهما كانت الوقائع","اعتبر كل شيء عقدًا"],a:0,skill:"apply",why:"المسائل المركبة قد تجمع أكثر من مصدر وأكثر من قاعدة.",memory:"قسّم المسألة إلى مشكلات صغيرة."},
    {kind:"adaptive",title:"اختبار القرار",q:"إذا تحسن فهمك لكن ظل الاسترجاع بطيئًا قبل الامتحان، ما التدريب الأنسب؟",opts:["استرجاع متباعد قصير للمفاتيح القانونية","قراءة الفصل كاملًا مرات متتالية","إلغاء أسئلة التطبيق"],a:0,skill:"contract",why:"الهدف هو جعل الفهم متاحًا بسرعة وقت الحاجة.",memory:"الفهم يحتاج مفتاح استدعاء."},
    {kind:"adaptive",mode:"free",title:"خطة الاستمرار",q:"اكتب في 3 نقاط: ما الذي ستراجعه بعد البرنامج؟ وما نوع السؤال الذي ستستخدمه؟ ومتى ستعيد الاختبار؟",skill:"exam",model:"1) أراجع العناصر التي ما زالت ضعيفة. 2) أستخدم استرجاعًا وتطبيقًا على وقائع جديدة، لا إعادة قراءة فقط. 3) أعيد اختبارًا مختصرًا بعد عدة أيام لقياس الاحتفاظ.",why:"نهاية البرنامج ليست نهاية التعلم؛ المطلوب خطة صيانة للمعلومة.",memory:"راجع الضعف، اختبره، ثم أعد القياس."}
  ]
};

var assessmentBank=[
  {q:"من غير الرجوع للنص: أي مجموعة تمثل الهيكل الأقرب لقاعدة انعقاد العقد؟",opts:["تراضٍ + سلامة المحل والسبب + الأوضاع الخاصة عند اللزوم","ضرر + خطأ + سببية","إثراء + افتقار فقط"],a:0,skill:"contract"},
  {q:"لماذا لا يكفي الإيجاب والقبول وحدهما دائمًا؟",opts:["لأن القانون قد يشترط سلامة عناصر أخرى أو أوضاعًا خاصة","لأن كل عقد يحتاج شاهدين","لأن القبول لا قيمة له"],a:0,skill:"contract"},
  {q:"عرض شخص بيع شيء وقبل الآخر، لكن القانون يمنع التعامل في هذا الشيء. ما المشكلة الأساسية؟",opts:["المحل","الإيجاب","مرور الزمن"],a:0,skill:"apply"},
  {q:"التزام نشأ من إتلاف مال الغير دون اتفاق. أي مصدر أقرب؟",opts:["الفعل الضار","العقد","الإرادة المنفردة"],a:0,skill:"sources"},
  {q:"أي واقعة هي الأكثر حسمًا في سؤال عن صحة انعقاد عقد؟",opts:["مشروعية المحل","لون الورق","مكان جلوس الطرفين"],a:0,skill:"spot"},
  {q:"إذا تغيرت واقعة حاسمة وبقيت باقي الوقائع ثابتة، ما التدريب الذي يقيس الفهم أفضل؟",opts:["Change One Fact","إعادة قراءة النص","نسخ التعريف"],a:0,skill:"apply"},
  {q:"في سؤال امتحاني تطبيقي، ما الهيكل الأنسب؟",opts:["المسألة ثم القاعدة ثم التطبيق ثم النتيجة","النتيجة فقط","سرد الوقائع فقط"],a:0,skill:"exam"},
  {q:"أي جملة تمثل تطبيقًا قانونيًا؟",opts:["وبما أن المحل محظور فلا يتحقق شرط سلامته","المحل يجب أن يكون معتبرًا قانونًا","العقد مصدر من مصادر الالتزام"],a:0,skill:"exam"}
];

function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
function ico(name){
  var p={
    lock:'<rect x="18" y="29" width="28" height="23" rx="5"/><path d="M24 29v-7a8 8 0 0 1 16 0v7"/>',
    check:'<circle cx="32" cy="32" r="23"/><path d="m21 32 7 7 15-16"/>',
    trophy:'<path d="M22 13h20v12c0 9-5 15-10 15s-10-6-10-15z"/><path d="M22 18h-8v5c0 6 4 10 10 10M42 18h8v5c0 6-4 10-10 10M32 40v9M23 52h18"/>',
    brain:'<path d="M25 13c-7 0-10 5-9 10-5 2-6 10-1 13-3 6 3 13 9 11 2 5 10 5 12 0 6 2 12-5 9-11 5-3 4-11-1-13 1-5-2-10-9-10"/><path d="M32 14v34M23 24c4 0 6 2 9 5M41 24c-4 0-6 2-9 5M22 39c4 0 7-2 10-5M42 39c-4 0-7-2-10-5"/>',
    bulb:'<path d="M32 10a15 15 0 0 0-9 27c3 2 4 5 4 8h10c0-3 1-6 4-8a15 15 0 0 0-9-27z"/><path d="M27 50h10M29 55h6"/>',
    scale:'<path d="M32 11v39M20 17h24M12 26l8-9 8 9M36 26l8-9 8 9M10 26h20c0 7-4 11-10 11S10 33 10 26zM34 26h20c0 7-4 11-10 11s-10-4-10-11zM22 53h20"/>',
    repeat:'<path d="M16 21a20 20 0 0 1 32 2l4 5M52 17v11H41M48 43a20 20 0 0 1-32-2l-4-5M12 47V36h11"/>',
    pen:'<path d="M14 49l4-14 24-24 11 11-24 24zM18 35l11 11M37 16l11 11"/><path d="M13 52h38"/>',
    star:'<path d="m32 9 7 14 16 2-12 11 3 16-14-8-14 8 3-16L9 25l16-2z"/>'
  };
  return '<svg class="uiIcon" viewBox="0 0 64 64" aria-hidden="true">'+(p[name]||p.star)+'</svg>';
}
function loadProfile(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY))||{results:{}};}catch(e){return {results:{}};}}
function diagnostic(){
  if(DEMO)return {metrics:{recall:82,understanding:88,application:58,retention:64,exam:55}};
  var p=loadProfile(),k=COUNTRY+"-"+SUBJECT;return p.results&&p.results[k]?p.results[k]:null;
}
function defaultCourse(){return {session:1,started:true,completed:[],errors:DEMO?[{skill:"apply",label:"يخلط بين وجود الاتفاق وصحة المحل",count:2},{skill:"spot",label:"لا يلتقط الواقعة الحاسمة بسرعة",count:1}]:[],history:[],lastAssessment:null,weekResults:{},repairRequired:false,repairWeek:null,adminOverrideWeeks:{},achievements:[]};}
function loadCourse(){
  try{
    var c=JSON.parse(localStorage.getItem(COURSE_KEY))||defaultCourse();
    c.weekResults=c.weekResults||{};c.adminOverrideWeeks=c.adminOverrideWeeks||{};c.achievements=c.achievements||[];
    if(c.repairRequired==null)c.repairRequired=false;
    return c;
  }catch(e){return defaultCourse();}
}
var state={view:"home",task:0,answers:[],assessmentAnswers:[],queue:[],course:loadCourse(),diag:diagnostic(),repairMode:false,weekPreview:null};
function save(){if(!DEMO)localStorage.setItem(COURSE_KEY,JSON.stringify(state.course));}
function sessionMeta(n){var idx=Math.max(1,Math.min(30,n))-1;var w=Math.floor(idx/5),d=idx%5;var x=curriculum[w].sessions[d];return {week:w+1,day:d+1,title:x[0],detail:x[1],kind:x[2],weekTitle:curriculum[w].title};}
function weakestDimension(){
  var m=(state.diag&&state.diag.metrics)||{};
  var list=[["recall",m.recall==null?100:m.recall],["understanding",m.understanding==null?100:m.understanding],["application",m.application==null?100:m.application],["retention",m.retention==null?100:m.retention],["exam",m.exam==null?100:m.exam]];
  return list.sort(function(a,b){return a[1]-b[1];})[0][0];
}
function strongestErrorSkill(){
  var es=(state.course.errors||[]).slice().sort(function(a,b){return b.count-a.count;});
  return es.length?es[0].skill:null;
}
function learningBridge(){
  var m=(state.diag&&state.diag.metrics)||{};
  var recall=m.recall==null?50:m.recall,understanding=m.understanding==null?50:m.understanding;
  var gap=recall-understanding;
  if(gap>=12)return {type:"memorizer",title:"من الحفظ إلى الفهم",lead:"ذاكرتك أقوى من تفسيرك للقاعدة. لن نطلب منك حفظًا أكثر؛ سنحوّل ما تحفظه إلى أسباب وعلاقات وتطبيق.",primary:taskBank.explainRule,secondary:taskBank.whyContrast};
  if(gap<=-12)return {type:"understander",title:"من الفهم إلى التثبيت",lead:"فهمك أقوى من سرعة الاسترجاع. سنحوّل المعنى الذي تفهمه إلى مفاتيح ذاكرة قصيرة ثم نسترجعها على فترات.",primary:taskBank.memoryAnchor,secondary:taskBank.reconstruct};
  return {type:"balanced",title:"ربط الفهم بالذاكرة",lead:"سنحافظ على التوازن: استرجاع قصير للقاعدة ثم تفسير أو تطبيق حتى لا يتحول الحفظ إلى ترديد ولا الفهم إلى معرفة يصعب استدعاؤها.",primary:taskBank.memoryAnchor,secondary:taskBank.whyContrast};
}
function buildTrainingQueue(){
  var dim=weakestDimension(),err=strongestErrorSkill(),bridge=learningBridge(),meta=sessionMeta(state.course.session);
  var adaptive=dim==="application"?taskBank.apply:dim==="understanding"?taskBank.understanding:dim==="recall"?taskBank.recall:dim==="retention"?taskBank.retention:taskBank.exam;
  var errorTask=err==="spot"?taskBank.spot:err==="apply"?taskBank.apply:err==="exam"?taskBank.exam:null;
  var pool=(weekTasks[meta.week]||weekTasks[1]).slice();
  var offset=(meta.day-1)%pool.length;
  var rotated=pool.slice(offset).concat(pool.slice(0,offset));
  var q=[taskBank.review,bridge.primary,rotated[0],rotated[1],adaptive,rotated[2]];
  if(errorTask&&q.indexOf(errorTask)===-1)q.push(errorTask);
  if(bridge.secondary&&q.indexOf(bridge.secondary)===-1)q.push(bridge.secondary);
  return q.slice(0,8);
}
function chrome(inner){
  APP.innerHTML='<div class="courseShell"><header class="courseTop"><div class="courseTopIn">'+
    '<div class="brand"><div class="mark">Lx</div><div><b>LexLearn</b><small>برنامج التدريب</small></div></div>'+
    '<div class="topActions"><a class="topBtn" href="showcase.html">الديمو التشخيصي</a><a class="topBtn" href="index.html">الرئيسية</a></div>'+
  '</div></header><main class="courseWrap">'+inner+'</main></div>';
}
function render(){
  if(state.view==="home")return home();
  if(state.view==="train")return train();
  if(state.view==="sessionResult")return sessionResult();
  if(state.view==="assessment")return assessment();
  if(state.view==="assessmentResult")return assessmentResult();
  if(state.view==="achievement")return achievementBoard();
  if(state.view==="repairAssessment")return repairAssessment();
  if(state.view==="weekSummary")return weekSummary();
}
function home(){
  var m=sessionMeta(state.course.session),d=state.diag;
  if(!d&&!DEMO){
    chrome('<section class="hero"><div class="heroMain"><span class="kicker">برنامج التدريب</span><h1>مصادر الالتزام</h1><p>البرنامج يحتاج تقييم بداية حتى يبني أول جلسة على أدائك الحقيقي.</p><div class="choiceRow"><a class="primary" style="text-decoration:none" href="index.html">ابدأ تقييم البداية</a></div></div><div class="heroSide"><h3>التقييم مستقل</h3><p>يمكنك إجراء التقييم فقط والخروج، أو العودة بعده وبدء البرنامج.</p></div></section>');
    return;
  }
  var metrics=d?d.metrics:{recall:0,understanding:0,application:0,retention:0,exam:0};
  chrome(
    '<section class="hero"><div class="heroMain"><span class="kicker">'+(DEMO?'برنامجك':'برنامجك')+'</span>'+
    '<h1>جلسة اليوم '+state.course.session+' من 30</h1><p>'+esc(m.title)+' • '+esc(m.detail)+'</p>'+
    '<div class="heroMeta"><span>≈ 20 دقيقة</span><span>الأسبوع '+m.week+' من 6</span><span>30 جلسة عملية</span><span>'+kindLabel(m.kind)+'</span></div>'+
    '<div class="choiceRow"><button class="primary" id="startSession">'+(m.kind==="assessment"?"ابدأ تقييم التقدم":(DEMO?"ابدأ التدريب الفعلي الآن":"ابدأ جلسة اليوم"))+'</button>'+(DEMO?'<a class="secondary" style="text-decoration:none" href="showcase.html">جرّب التقييم الذي يبني المسار</a>':'')+'</div></div>'+
    '<div class="heroSide"><h3>أولوية اليوم</h3><p>'+priorityText(metrics)+'</p><div class="notice">ابدأ بالأولوية الحالية، ثم تابع جلسات التدريب بالتدرج.</div></div></section>'+
    (DEMO?'<section class="practiceNow"><div><span class="kicker">تجربة عملية</span><h2>الجزء التالي ليس شرحًا للخطة</h2><p>عند الضغط على الزر ستجيب بنفسك: استرجاع من الذاكرة، سؤال يحوّل الحفظ إلى فهم أو الفهم إلى تثبيت، ثم تطبيق على واقعة قانونية.</p></div><button class="primary" id="practiceNowBtn">ادخل الجلسة العملية</button></section>':'')+
    bridgeCard(metrics)+
    weekBar(m.week)+
    '<section class="grid"><div class="card">'+sessionCard(m)+'</div><div class="card">'+skillsCard()+'</div></section>'+
    '<section class="grid" style="margin-top:18px"><div class="card">'+errorCard()+'</div><div class="card">'+assessmentCard(metrics)+'</div></section>'
  );
  document.getElementById("startSession").onclick=function(){state.answers=[];state.assessmentAnswers=[];state.task=0;state.queue=buildTrainingQueue();state.view=m.kind==="assessment"?"assessment":"train";render();};
  var pn=document.getElementById("practiceNowBtn");if(pn)pn.onclick=function(){state.answers=[];state.assessmentAnswers=[];state.task=0;state.queue=buildTrainingQueue();state.view="train";render();};
  bindWeekRoadmap(m.week);
}
function kindLabel(k){return k==="assessment"?"تقييم مستقل":k==="review"?"مراجعة متباعدة":k==="adaptive"?"تدريب متكيف":"تدريب أساسي";}
function priorityText(m){
  var list=[["الاسترجاع",m.recall||0],["الفهم",m.understanding||0],["التطبيق",m.application||0],["الاحتفاظ",m.retention||0],["الصياغة",m.exam||0]].sort(function(a,b){return a[1]-b[1];});
  return "الأولوية الحالية: "+list[0][0]+". الجلسات القادمة ستزيد تدريب هذا الجانب بدون إعادة ما أتقنته بالكامل.";
}
function bridgeCard(m){
  var b=learningBridge();
  return '<section class="bridgePanel"><div class="bridgeHead"><div><span class="kicker">جسر التعلم</span><h2>'+esc(b.title)+'</h2><p>'+esc(b.lead)+'</p></div><div class="bridgeScore"><span>الاسترجاع</span><b>'+Math.round(m.recall||0)+'</b><span>الفهم</span><b>'+Math.round(m.understanding||0)+'</b></div></div><div class="bridgeSteps"><div><b>1</b><span>استرجع</span><small>من الذاكرة قبل فتح النص</small></div><div><b>2</b><span>فسّر</span><small>قل لماذا تعمل القاعدة هكذا</small></div><div><b>3</b><span>طبّق</span><small>غيّر واقعة واحدة واختبر النتيجة</small></div><div><b>4</b><span>ثبّت</span><small>مفتاح ذاكرة مرتبط بالمعنى</small></div></div></section>';
}
function weekResult(w){return (state.course.weekResults||{})[w]||null;}
function weekUnlocked(w,current){
  if(w===1)return true;
  if(w<=current)return true;
  var prev=weekResult(w-1);
  return !!(prev&&(prev.status==="mastered"||prev.status==="completed"||prev.status==="completed_with_support"))||!!(state.course.adminOverrideWeeks&&state.course.adminOverrideWeeks[w]);
}
function weekBar(current){
  return '<section class="weekRoadmap"><div class="roadmapTitle"><div><span class="kicker">مسار 6 أسابيع</span><h2>كل أسبوع يفتح بعد إكمال المرحلة السابقة</h2></div><span class="roadmapCount">'+Math.max(0,state.course.completed.length)+' / 30 جلسة</span></div><div class="weekBar">'+curriculum.map(function(w){
    var r=weekResult(w.week),open=weekUnlocked(w.week,current),cls="",status="",icon="lock";
    if(r&&r.status==="repair"){cls="needs";status="يحتاج تثبيت";icon="repeat";}
    else if(r){cls="done";status=r.status==="mastered"?"مكتمل بإتقان":"مكتمل";icon="check";}
    else if(w.week===current){cls="current";status="متاح الآن";icon="star";}
    else if(open){cls="available";status="متاح";icon="star";}
    else{cls="locked";status="مغلق";icon="lock";}
    return '<button class="week '+cls+'" '+(open?'data-week-open="'+w.week+'"':'disabled')+'><span class="weekIcon">'+ico(icon)+'</span><b>الأسبوع '+w.week+'</b><small>'+esc(w.title)+'</small><em>'+status+'</em></button>';
  }).join("")+'</div></section>';
}
function bindWeekRoadmap(current){
  document.querySelectorAll("[data-week-open]").forEach(function(b){b.onclick=function(){
    var w=Number(b.dataset.weekOpen);
    if(w===current){var el=document.querySelector(".sessionHead");if(el)el.scrollIntoView({behavior:"smooth",block:"center"});return;}
    if(w<current||weekResult(w)){state.weekPreview=w;state.view="weekSummary";render();}
  };});
}
function weekSummary(){
  var w=state.weekPreview||1,r=weekResult(w),meta=curriculum[w-1];
  var status=r?(r.status==="mastered"?"مكتمل بإتقان":r.status==="repair"?"يحتاج تثبيت":"مكتمل"):"لم يكتمل بعد";
  chrome('<section class="stage"><div class="achievementCard compact"><span class="achievementIcon">'+ico(r&&r.status!=="repair"?"check":"repeat")+'</span><span class="kicker">ملخص الأسبوع '+w+'</span><h2>'+esc(meta.title)+'</h2><div class="achievementState '+(r&&r.status==="repair"?"need":"ok")+'">'+status+'</div>'+(r?'<p>نتيجة تقييم المرحلة: <b>'+r.score+'%</b></p>':'<p>لا توجد نتيجة نهائية لهذه المرحلة بعد.</p>')+'<div class="sessionPlan">'+meta.sessions.map(function(x,i){return '<div class="planItem"><span class="dot">'+(i+1)+'</span><div><b>'+esc(x[0])+'</b><small>'+esc(x[1])+'</small></div></div>';}).join("")+'</div><div class="choiceRow"><button class="primary" id="weekBack">العودة للمسار</button></div></div></section>');
  document.getElementById("weekBack").onclick=function(){state.view="home";render();};
}
function sessionCard(m){
  var bridge=learningBridge();
  var items=m.kind==="assessment"?
    [["8 مهام تقييم مستقلة","assess"],["استرجاع + فهم + تطبيق","assess"],["لا توجد تغذية راجعة أثناء التقييم","assess"],["النتيجة تحدّث الجلسات التالية","assess"]]:
    [["استرجاع من الذاكرة","review"],[bridge.title,"adapt"],["مهمة من موضوع الأسبوع","core"],["تطبيق على واقعة جديدة","adapt"],["تدريب على أضعف مهارة","adapt"],["تغذية راجعة + مرساة ذاكرة","core"]];
  return '<div class="sessionHead"><div><h2>'+esc(m.title)+'</h2><p>'+esc(m.detail)+'</p></div><div class="sessionNum">'+String(state.course.session).padStart(2,"0")+'</div></div>'+
    '<div class="sessionPlan">'+items.map(function(x,i){return '<div class="planItem"><span class="dot">'+(i+1)+'</span><div><b>'+esc(x[0])+'</b></div><span class="badge '+x[1]+'">'+badgeLabel(x[1])+'</span></div>';}).join("")+'</div>';
}
function badgeLabel(x){return x==="review"?"مراجعة":x==="adapt"?"متكيف":x==="assess"?"تقييم":"أساسي";}
function skillsCard(){
  return '<h3>حالة المهارات</h3><p>الحالة تتغير من أكثر من محاولة، وليس من سؤال واحد.</p><div class="skillList">'+skills.map(function(s){return '<div class="skill"><div><b>'+esc(s.name)+'</b><small>'+stateArabic(s.state)+'</small></div><span class="state '+s.state+'">'+stateArabic(s.state)+'</span></div>';}).join("")+'</div>';
}
function stateArabic(s){return s==="stable"?"مستقرة":s==="retained"?"مثبتة":s==="learning"?"قيد التدريب":"جديدة";}
function errorCard(){
  var es=state.course.errors||[];
  return '<h3>سجل ملاحظات الأداء</h3><p>تظهر هنا الأخطاء التي تكررت في محاولاتك السابقة.</p>'+(es.length?es.map(function(e){return '<div class="errorItem"><b>'+esc(e.label)+'</b><span>تكرر '+e.count+' مرة</span></div>';}).join(""):'<div class="notice">لا توجد أخطاء متكررة مسجلة بعد.</div>');
}
function assessmentCard(m){
  return '<h3>التقييم المستقل</h3><p>كل خامس جلسة يوجد تقييم من 8 مهام، ثم تقييم نهائي في الجلسة 30.</p><div class="resultGrid">'+metric("استرجاع",m.recall)+metric("فهم",m.understanding)+metric("تطبيق",m.application)+'</div>';
}
function qualitative(v){if(v==null)return "لم يُقَس";if(v>=80)return "إجابات صحيحة في أغلب المهام";if(v>=45)return "نتائج متباينة";return "صعوبة متكررة";}
function metric(n,v){return '<div class="metric"><span>'+n+'</span><b>'+qualitative(v)+'</b><small>من محاولاتك الحالية</small></div>';}

function train(){
  var q=state.queue.length?state.queue:buildTrainingQueue(),t=q[state.task%q.length];
  var input=t.mode==="free"?
    '<textarea class="textarea" id="freeAnswer" placeholder="اكتب إجابتك بطريقتك..."></textarea><div class="choiceRow"><button class="primary" id="checkFree">قارن إجابتي</button></div>':
    '<div class="options">'+t.opts.map(function(o,i){return '<button class="option" data-a="'+i+'">'+esc(o)+'</button>';}).join("")+'</div>';
  chrome('<section class="stage"><div class="progress"><i style="width:'+((state.task+1)/q.length*100)+'%"></i></div><div class="taskCard">'+
    '<span class="kicker">'+esc(kindLabel(t.kind))+' • '+(state.task+1)+' / '+q.length+'</span><h2>'+esc(t.title)+'</h2>'+
    (t.showText?'<div class="legalBox"><small>النص القانوني</small><div>'+esc(TEXT64)+'</div></div>':'')+
    '<p>'+esc(t.q)+'</p>'+input+'<div id="feed"></div></div></section>');
  if(t.mode==="free"){
    document.getElementById("checkFree").onclick=function(){
      var answer=(document.getElementById("freeAnswer").value||"").trim();
      if(!answer){document.getElementById("feed").innerHTML='<div class="notice">اكتب محاولة قصيرة أولًا؛ الهدف أن تُخرج المعنى من ذاكرتك قبل رؤية النموذج.</div>';return;}
      document.getElementById("freeAnswer").disabled=true;document.getElementById("checkFree").disabled=true;
      document.getElementById("feed").innerHTML='<div class="modelAnswer"><b>نموذج للمقارنة</b><p>'+esc(t.model)+'</p></div><div class="feedback">'+esc(t.why)+'</div>'+(t.memory?'<div class="memoryAnchor"><b>مرساة الذاكرة</b><span>'+esc(t.memory)+'</span></div>':'')+'<div class="choiceRow"><button class="primary" id="freeGood">إجابتي قريبة</button><button class="secondary" id="freeRetry">أحتاج تدريبًا أكثر</button></div>';
      document.getElementById("freeGood").onclick=function(){completeTask(t,true,q);};
      document.getElementById("freeRetry").onclick=function(){completeTask(t,false,q);};
    };
  }else{
    document.querySelectorAll("[data-a]").forEach(function(b){b.onclick=function(){
      var i=Number(b.dataset.a),correct=i===t.a;
      document.querySelectorAll("[data-a]").forEach(function(x){x.disabled=true;});b.classList.add(correct?"good":"bad");
      document.getElementById("feed").innerHTML='<div class="feedback">'+esc(t.why)+'</div>'+(t.memory?'<div class="memoryAnchor"><b>مرساة الذاكرة</b><span>'+esc(t.memory)+'</span></div>':'')+'<div class="choiceRow"><button class="primary" id="nextTask">'+(state.task<q.length-1?"التالي":"إنهاء الجلسة")+'</button></div>';
      document.getElementById("nextTask").onclick=function(){completeTask(t,correct,q);};
    };});
  }
}
function completeTask(t,correct,q){
  state.answers.push({skill:t.skill,correct:correct,bridge:learningBridge().type});
  if(!correct)addError(t.skill,errorLabel(t.skill));
  if(state.task<q.length-1){state.task++;render();}else finishTraining();
}
function errorLabel(skill){var map={apply:"يحتاج نقل القاعدة إلى الواقعة بدقة",spot:"لا يلتقط العنصر الحاسم",sources:"يخلط بين مصادر الالتزام",contract:"يسقط عنصرًا من شروط الانعقاد",exam:"هيكل الإجابة غير مكتمل"};return map[skill]||"خطأ متكرر"; }
function addError(skill,label){
  var e=state.course.errors.find(function(x){return x.skill===skill;});if(e)e.count++;else state.course.errors.push({skill:skill,label:label,count:1});
}
function finishTraining(){
  state.course.history.push({session:state.course.session,type:"training",answers:state.answers,ts:Date.now()});
  state.course.completed.push(state.course.session);
  state.course.session=Math.min(30,state.course.session+1);save();state.view="sessionResult";render();
}
function sessionResult(){
  var correct=state.answers.filter(function(x){return x.correct;}).length,total=state.answers.length||1,p=Math.round(correct/total*100),sessionDesc=correct>=Math.ceil(total*.75)?"الجلسة مستقرة — انتقل للخطوة التالية":correct>=Math.ceil(total*.4)?"محتاج جولة إضافية على بعض المهارات":"الأولوية الآن للتثبيت قبل التقدم";
  chrome('<section class="stage"><div class="taskCard"><span class="kicker">جلسة مكتملة</span><h2>خلصت جلسة اليوم</h2>'+
    '<div class="resultGrid"><div class="metric"><span>أداء الجلسة</span><b>'+sessionDesc+'</b><small>ملخص الجلسة</small></div><div class="metric"><span>عدد المهام</span><b>'+total+'</b></div><div class="metric"><span>الجلسة القادمة</span><b>'+state.course.session+'</b></div></div>'+
    '<div class="notice">سيُستخدم أداؤك لاختيار التدريب التالي.</div>'+
    '<div class="choiceRow"><button class="primary" id="backHome">العودة للبرنامج</button></div></div></section>');
  document.getElementById("backHome").onclick=function(){state.view="home";render();};
}
function assessment(){
  var q=assessmentBank[state.task%assessmentBank.length];
  chrome('<section class="stage"><div class="progress"><i style="width:'+((state.task+1)/assessmentBank.length*100)+'%"></i></div><div class="taskCard">'+
    '<span class="kicker">تقييم التقدم • '+(state.task+1)+' / '+assessmentBank.length+'</span><h2>'+esc(q.q)+'</h2>'+
    '<div class="options">'+q.opts.map(function(o,i){return '<button class="option" data-a="'+i+'">'+esc(o)+'</button>';}).join("")+'</div></div></section>');
  document.querySelectorAll("[data-a]").forEach(function(b){b.onclick=function(){
    state.assessmentAnswers.push({skill:q.skill,correct:Number(b.dataset.a)===q.a});if(state.task<assessmentBank.length-1){state.task++;render();}else finishAssessment();
  };});
}
function finishAssessment(){
  var a=state.assessmentAnswers,c=a.filter(function(x){return x.correct;}).length,p=Math.round(c/(a.length||1)*100);
  state.course.lastAssessment={session:state.course.session,score:p,ts:Date.now()};
  state.course.history.push({session:state.course.session,type:"assessment",score:p,answers:a,ts:Date.now()});
  state.course.completed.push(state.course.session);state.course.session=Math.min(30,state.course.session+1);save();state.view="assessmentResult";render();
}
function assessmentResult(){
  var p=state.course.lastAssessment?state.course.lastAssessment.score:0;
  var decision="تم حفظ نتيجة تقييم التقدم وتحديث جلساتك التالية.";
  chrome('<section class="stage"><div class="taskCard"><span class="kicker">نتيجة التقييم المستقل</span><h2>'+qualitative(p)+'</h2>'+
    '<p>'+esc(decision)+'</p><div class="notice">تابع البرنامج للانتقال إلى الجلسة التالية.</div>'+
    '<div class="choiceRow"><button class="primary" id="backHome">العودة للبرنامج</button></div></div></section>');
  document.getElementById("backHome").onclick=function(){state.view="home";render();};
}
if(DEMO&&AUTO_START){state.answers=[];state.assessmentAnswers=[];state.task=0;state.queue=buildTrainingQueue();state.view="train";}
render();
})();