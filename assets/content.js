
window.LEX_CONTENT = {
  version: "2.1-student-p0",
  productScope: {
    audience: "law_students_only",
    activeJurisdictions: ["QA"],
    waitlistJurisdictions: ["EG"],
    pilot: "Qatar University - LAWC 101"
  },
  jurisdictions: [
    {id:"QA", name_ar:"قطر", flag:"🇶🇦", enabled:true},
    {id:"EG", name_ar:"مصر", flag:"🇪🇬", enabled:false, note:"قريبًا — البنية جاهزة وسيتم تفعيل المحتوى بعد المراجعة."}
  ],
  courses: [
    {
      id:"QA-QU-LAWC101",
      jurisdiction:"QA",
      university:"جامعة قطر",
      code:"LAWC 101",
      title_ar:"مدخل إلى القانون",
      language:"ar",
      status:"pilot",
      officialSource:"https://www.qu.edu.qa/ar/Colleges/law/departments/private-law/Pages/course-description.aspx",
      sourceNote:"هيكل المقرر مبني على الوصف الرسمي المنشور لجامعة قطر. عناصر التدريب الحالية Seed تجريبية وتحتاج اعتمادًا قانونيًا وتربويًا قبل الإطلاق العام.",
      units:[
        {id:"u-law",title:"نظرية القانون",topics:["مفهوم القاعدة القانونية وخصائصها","تقسيمات القانون","مصادر القانون","تفسير القانون","نطاق تطبيق القانون","إلغاء القانون"]},
        {id:"u-right",title:"نظرية الحق",topics:["مفهوم الحق وأنواعه","الأشخاص الطبيعية والمعنوية","محل الحق / الأموال","التعسف في استعمال الحق"]}
      ]
    }
  ],
  diagnosticItems: [
    {
      id:"d01",course:"QA-QU-LAWC101",topic:"مفهوم القاعدة القانونية وخصائصها",dimension:"recall",difficulty:1,type:"mcq",
      prompt:"أي عبارة تصف القاعدة القانونية بصورة أدق؟",
      options:[
        {id:"a",text:"قاعدة تنظم السلوك الاجتماعي ويقترن احترامها بجزاء تنظمه السلطة العامة.",score:1},
        {id:"b",text:"رأي شخصي لا يترتب على مخالفته أي أثر قانوني.",score:0},
        {id:"c",text:"نصيحة أخلاقية فقط.",score:0}
      ],
      explanation:"الهدف هنا استرجاع الخصائص الأساسية للقاعدة القانونية، لا حفظ صياغة بعينها.",
      sourceIds:["QU-LAWC101-DESC"]
    },
    {
      id:"d02",course:"QA-QU-LAWC101",topic:"تقسيمات القانون",dimension:"understanding",difficulty:1,type:"mcq_reason",
      prompt:"لو كان السؤال يطلب التمييز بين قواعد تنظم علاقة الدولة بالأفراد وقواعد تنظم علاقات الأفراد فيما بينهم، فما الفكرة التي يختبرها؟",
      options:[
        {id:"a",text:"تقسيمات القانون.",score:1},
        {id:"b",text:"إلغاء القانون.",score:0},
        {id:"c",text:"محل الحق.",score:0}
      ],
      reasonPrompt:"اكتب سبب اختيارك في جملة قصيرة.",
      keywords:["عام","خاص","تقسيم","علاقة","الدولة","الأفراد"],
      explanation:"التصنيف هنا يتعلق بتقسيمات القانون وبطبيعة العلاقات التي تنظمها القواعد.",
      sourceIds:["QU-LAWC101-DESC"]
    },
    {
      id:"d03",course:"QA-QU-LAWC101",topic:"مصادر القانون",dimension:"recall",difficulty:2,type:"mcq",
      prompt:"أي موضوع من الآتي يدخل ضمن ما يدرسه مقرر مدخل إلى القانون في جامعة قطر؟",
      options:[
        {id:"a",text:"مصادر القانون وتفسيره.",score:1},
        {id:"b",text:"هندسة البرمجيات.",score:0},
        {id:"c",text:"المحاسبة الإدارية.",score:0}
      ],
      explanation:"الوصف الرسمي للمقرر يذكر مصادر القانون وتفسيره ضمن نظرية القانون.",
      sourceIds:["QU-LAWC101-DESC"]
    },
    {
      id:"d04",course:"QA-QU-LAWC101",topic:"تفسير القانون",dimension:"understanding",difficulty:2,type:"mcq_reason",
      prompt:"ظهر نص قانوني يحتمل معنيين مختلفين عند تطبيقه على واقعة. ما المهارة الأقرب التي يحتاجها الطالب أولًا؟",
      options:[
        {id:"a",text:"تفسير النص القانوني.",score:1},
        {id:"b",text:"حفظ رقم المادة فقط.",score:0},
        {id:"c",text:"تجاهل اختلاف المعنى.",score:0}
      ],
      reasonPrompt:"لماذا؟",
      keywords:["معنى","تفسير","نص","احتمال","مراد","قصد"],
      explanation:"التفسير يتعلق بتحديد المعنى القانوني الذي يحمل عليه النص عند التطبيق.",
      sourceIds:["QU-LAWC101-DESC"]
    },
    {
      id:"d05",course:"QA-QU-LAWC101",topic:"نطاق تطبيق القانون",dimension:"transfer",difficulty:2,type:"mcq_reason",
      prompt:"قاعدة قانونية جديدة صدر بها تشريع. السؤال هو: على أي أشخاص ووقائع، وفي أي زمن، تسري؟ أي موضوع تستدعيه الواقعة؟",
      options:[
        {id:"a",text:"نطاق تطبيق القانون.",score:1},
        {id:"b",text:"أنواع الأموال فقط.",score:0},
        {id:"c",text:"إلغاء الحق.",score:0}
      ],
      reasonPrompt:"اشرح باختصار لماذا اخترت هذا الموضوع.",
      keywords:["سريان","زمان","مكان","أشخاص","تطبيق","نطاق"],
      explanation:"هذه أسئلة تتعلق بحدود سريان القاعدة القانونية وتطبيقها.",
      sourceIds:["QU-LAWC101-DESC"]
    },
    {
      id:"d06",course:"QA-QU-LAWC101",topic:"إلغاء القانون",dimension:"legal_precision",difficulty:2,type:"mcq",
      prompt:"إذا استُبدل تنظيم قانوني سابق بتنظيم جديد على نحو يزيل العمل بالأول، فأي مفهوم هو الأدق؟",
      options:[
        {id:"a",text:"إلغاء القانون أو إنهاء سريانه وفقًا للقواعد المقررة.",score:1},
        {id:"b",text:"تفسير الحق.",score:0},
        {id:"c",text:"إنشاء شخص معنوي.",score:0}
      ],
      explanation:"التمييز الدقيق بين الإلغاء والتفسير والتطبيق جزء من الدقة القانونية.",
      sourceIds:["QU-LAWC101-DESC"]
    },
    {
      id:"d07",course:"QA-QU-LAWC101",topic:"مفهوم الحق وأنواعه",dimension:"understanding",difficulty:2,type:"mcq_reason",
      prompt:"لماذا يختلف سؤال «ما الحق؟» عن سؤال «ما القاعدة القانونية؟»؟",
      options:[
        {id:"a",text:"لأن الأول يتعلق بمركز أو مصلحة قانونية، والثاني يتعلق بقاعدة تنظم السلوك.",score:1},
        {id:"b",text:"لا يوجد أي فرق بينهما.",score:0},
        {id:"c",text:"لأن الحق لا علاقة له بالقانون.",score:0}
      ],
      reasonPrompt:"اكتب الفرق بكلماتك.",
      keywords:["مصلحة","سلطة","مركز","قاعدة","تنظم","سلوك"],
      explanation:"المطلوب هنا التمييز بين مفهوم القاعدة القانونية ومفهوم الحق.",
      sourceIds:["QU-LAWC101-DESC"]
    },
    {
      id:"d08",course:"QA-QU-LAWC101",topic:"الأشخاص الطبيعية والمعنوية",dimension:"recall",difficulty:2,type:"mcq",
      prompt:"أي زوج من الآتي يطابق أحد موضوعات نظرية الحق في المقرر؟",
      options:[
        {id:"a",text:"الأشخاص الطبيعية والأشخاص المعنوية.",score:1},
        {id:"b",text:"الألوان والأشكال.",score:0},
        {id:"c",text:"البرمجة والشبكات.",score:0}
      ],
      explanation:"الوصف الرسمي يذكر أشخاص الحق: الأشخاص الطبيعية والمعنوية.",
      sourceIds:["QU-LAWC101-DESC"]
    },
    {
      id:"d09",course:"QA-QU-LAWC101",topic:"محل الحق / الأموال",dimension:"transfer",difficulty:3,type:"mcq_reason",
      prompt:"نزاع يدور حول الشيء الذي يَرِد عليه الحق وما إذا كان من الأموال التي يمكن أن تكون محلًا له. أي جزء من المقرر هو الأقرب؟",
      options:[
        {id:"a",text:"محل الحق / الأموال.",score:1},
        {id:"b",text:"إلغاء القانون.",score:0},
        {id:"c",text:"تقسيمات القانون فقط.",score:0}
      ],
      reasonPrompt:"حدد الكلمة أو الفكرة التي قادتك للاختيار.",
      keywords:["محل","مال","أموال","شيء","يرد","الحق"],
      explanation:"المطلوب نقل المفهوم إلى واقعة جديدة بدل مجرد تذكر عنوانه.",
      sourceIds:["QU-LAWC101-DESC"]
    },
    {
      id:"d10",course:"QA-QU-LAWC101",topic:"التعسف في استعمال الحق",dimension:"transfer",difficulty:3,type:"mcq_reason",
      prompt:"شخص يملك حقًا من حيث الأصل، لكنه يستخدمه بطريقة تثير سؤالًا عن حدود المشروعية في استعمال الحق. أي موضوع ينبغي فحصه؟",
      options:[
        {id:"a",text:"التعسف في استعمال الحق.",score:1},
        {id:"b",text:"إلغاء القانون.",score:0},
        {id:"c",text:"مصادر الالتزام فقط.",score:0}
      ],
      reasonPrompt:"لماذا لا يكفي أن نقول إن الشخص «صاحب حق» وينتهي التحليل؟",
      keywords:["حدود","استعمال","تعسف","مشروعية","حق","ضرر"],
      explanation:"امتلاك الحق لا يمنع بحث حدود استعماله، وهو من موضوعات المقرر.",
      sourceIds:["QU-LAWC101-DESC"]
    },
    {
      id:"d11",course:"QA-QU-LAWC101",topic:"مفهوم القاعدة القانونية وخصائصها",dimension:"legal_precision",difficulty:3,type:"missing_element",
      prompt:"أكمل العنصر الناقص في العبارة التعليمية: «القاعدة القانونية قاعدة عامة و____، تنظم السلوك الاجتماعي».",
      accepted:["مجردة","مُجردة"],
      explanation:"هذا النشاط يقيس دقة المصطلح، لا مجرد الفكرة العامة.",
      sourceIds:["SEED-REVIEW-REQUIRED"]
    },
    {
      id:"d12",course:"QA-QU-LAWC101",topic:"تفسير القانون",dimension:"transfer",difficulty:3,type:"mcq_reason",
      prompt:"طالب حفظ تعريفًا واحدًا لتفسير القانون. في مسألة جديدة، وجد عبارتين في النص يمكن فهمهما بطريقتين. ما التصرف التعليمي الأدق؟",
      options:[
        {id:"a",text:"يربط ألفاظ النص بالسياق القانوني ويبرر المعنى الذي اختاره.",score:1},
        {id:"b",text:"يكرر التعريف المحفوظ دون التعامل مع النص.",score:0},
        {id:"c",text:"يتجاهل النص ويختار عشوائيًا.",score:0}
      ],
      reasonPrompt:"اكتب سببًا مختصرًا.",
      keywords:["سياق","معنى","ألفاظ","نص","تبرير","تفسير"],
      explanation:"الانتقال من التعريف إلى التعامل مع نص جديد هو Transfer.",
      sourceIds:["QU-LAWC101-DESC"]
    },
    {
      id:"d13",course:"QA-QU-LAWC101",topic:"مصادر القانون",dimension:"understanding",difficulty:3,type:"mcq_reason",
      prompt:"لو عرف الطالب أسماء مصادر القانون لكنه لا يستطيع تفسير لماذا نبحث عن «مصدر» القاعدة أصلًا، فأي بُعد يحتاج دعمًا أكبر؟",
      options:[
        {id:"a",text:"الفهم.",score:1},
        {id:"b",text:"السرعة فقط.",score:0},
        {id:"c",text:"الحفظ وحده لا غير.",score:0}
      ],
      reasonPrompt:"اكتب ما الذي ينقصه.",
      keywords:["فهم","سبب","مصدر","نشأة","قاعدة","مرجع"],
      explanation:"معرفة الأسماء لا تكفي إذا لم يفهم الطالب وظيفة مفهوم المصدر.",
      sourceIds:["SEED-REVIEW-REQUIRED"]
    },
    {
      id:"d14",course:"QA-QU-LAWC101",topic:"نظرية القانون",dimension:"exam_execution",difficulty:3,type:"build_answer",
      prompt:"اكتب إجابة قصيرة جدًا (3–4 سطور) لسؤال: «بيّن بإيجاز لماذا لا يكفي حفظ تعريف القاعدة القانونية وحده لفهمها.»",
      rubric:[
        {key:"definition",label:"الإشارة إلى أن التعريف نقطة بداية",keywords:["تعريف","بداية","أساس"]},
        {key:"elements",label:"ذكر الخصائص أو العناصر",keywords:["خصائص","عناصر","عامة","مجردة","جزاء"]},
        {key:"application",label:"الإشارة إلى التطبيق أو التمييز",keywords:["تطبيق","تمييز","واقعة","مثال","حالة"]}
      ],
      explanation:"يُقيّم ترتيب الفكرة والعناصر الأساسية كتدريب، وليس كدرجة جامعية رسمية.",
      sourceIds:["SEED-REVIEW-REQUIRED"]
    },
    {
      id:"d15",course:"QA-QU-LAWC101",topic:"نظرية الحق",dimension:"exam_execution",difficulty:4,type:"build_answer",
      prompt:"في إجابة امتحانية قصيرة، كيف تفرّق بين «صاحب الحق» و«محل الحق»؟",
      rubric:[
        {key:"holder",label:"تحديد صاحب الحق كشخص طبيعي أو معنوي",keywords:["صاحب","شخص","طبيعي","معنوي"]},
        {key:"object",label:"تحديد محل الحق بأنه ما يرد عليه الحق",keywords:["محل","يرد","مال","أموال","شيء"]},
        {key:"contrast",label:"إظهار الفرق بين الاثنين",keywords:["فرق","بينما","أما","مقابل"]}
      ],
      explanation:"هذا النشاط يدرب على بناء إجابة تمييزية واضحة.",
      sourceIds:["QU-LAWC101-DESC"]
    },
    {
      id:"d16",course:"QA-QU-LAWC101",topic:"نطاق تطبيق القانون",dimension:"recall",difficulty:3,type:"load_recall",
      prompt:"اقرأ البطاقات الثلاث ثم اضغط «أخفي البطاقات»، وبعدها اختر الموضوع الذي تناول حدود سريان القانون.",
      cards:["تفسير القانون: البحث عن معنى النص.","نطاق تطبيق القانون: بحث حدود السريان.","إلغاء القانون: انتهاء العمل بتنظيم سابق."],
      options:[
        {id:"a",text:"نطاق تطبيق القانون.",score:1},
        {id:"b",text:"تفسير القانون.",score:0},
        {id:"c",text:"إلغاء القانون.",score:0}
      ],
      explanation:"هذا يقيس استرجاعًا قانونيًا تحت حمل معلومات صغير، وليس ذاكرة بصرية عامة.",
      sourceIds:["QU-LAWC101-DESC"]
    }
  ],
  activities: {
    MISSING_ELEMENT: {
      id:"MISSING_ELEMENT",title:"العنصر الناقص",icon:"🧩",dimension:"legal_precision",
      description:"تثبيت الكلمات والعناصر القانونية الدقيقة بدون تحويل التعلم إلى حفظ أعمى.",
      items:[
        {id:"me1",topic:"مفهوم القاعدة القانونية وخصائصها",prompt:"القاعدة القانونية قاعدة عامة و____.",answer:"مجردة",accepted:["مجردة","مُجردة"],explanation:"المطلوب تثبيت المصطلح الدقيق."},
        {id:"me2",topic:"نظرية الحق",prompt:"يدرس المقرر أشخاص الحق: الأشخاص الطبيعية و____.",answer:"المعنوية",accepted:["المعنوية","المعنويين"],explanation:"تمييز الشخص الطبيعي عن الشخص المعنوي من أساسيات نظرية الحق."},
        {id:"me3",topic:"نظرية القانون",prompt:"من موضوعات المقرر: مصادر القانون، تفسيره، نطاق تطبيقه، وكيفية ____.",answer:"إلغائه",accepted:["إلغائه","الغائه","إلغاءه","إلغاء القانون"],explanation:"يرتبط هذا بالجزء الخاص بسريان القواعد القانونية وإنهائها."}
      ]
    },
    CHANGE_ONE_FACT: {
      id:"CHANGE_ONE_FACT",title:"غيّر واقعة واحدة",icon:"🔁",dimension:"transfer",
      description:"تغيير حقيقة واحدة في المسألة لمعرفة هل الطالب يفهم متى يتغير التكييف.",
      items:[
        {
          id:"cf1",topic:"التعسف في استعمال الحق",
          scenario:"في الحالة الأولى السؤال عن وجود الحق نفسه. غيّرنا واقعة واحدة: أصبح وجود الحق ثابتًا، والنزاع فقط حول طريقة استعماله.",
          prompt:"أي موضوع أصبح أكثر أهمية بعد تغيير الواقعة؟",
          options:[{id:"a",text:"التعسف في استعمال الحق.",score:1},{id:"b",text:"إلغاء القانون.",score:0},{id:"c",text:"مصادر القانون.",score:0}],
          explanation:"تغيرت نقطة النزاع من وجود الحق إلى حدود استعماله."
        },
        {
          id:"cf2",topic:"نطاق تطبيق القانون",
          scenario:"كان السؤال عن معنى عبارة في النص. غيّرنا واقعة واحدة: لم يعد الخلاف عن المعنى، بل عن تاريخ بدء سريان النص.",
          prompt:"ما الموضوع الذي انتقل إليه التحليل؟",
          options:[{id:"a",text:"نطاق تطبيق القانون.",score:1},{id:"b",text:"تفسير القانون فقط.",score:0},{id:"c",text:"الأشخاص المعنوية.",score:0}],
          explanation:"تاريخ السريان يدخل في نطاق تطبيق القانون."
        }
      ]
    },
    CASE_DETECTIVE: {
      id:"CASE_DETECTIVE",title:"محقق القضية",icon:"🕵️",dimension:"transfer",
      description:"تحديد المسألة القانونية من الوقائع قبل البحث عن الإجابة.",
      items:[
        {
          id:"cd1",topic:"تفسير القانون",
          scenario:"أمامك نص قصير، ويدور خلاف بين طرفين حول معنى لفظ ورد فيه. أحدهما يقرأه قراءة ضيقة والآخر قراءة أوسع.",
          prompt:"ما المسألة القانونية الأساسية التي يجب أن تبدأ بها؟",
          options:[{id:"a",text:"تفسير النص.",score:1},{id:"b",text:"محل الحق.",score:0},{id:"c",text:"إلغاء القانون.",score:0}],
          explanation:"المؤشر الحاسم في الوقائع هو الخلاف حول معنى اللفظ."
        },
        {
          id:"cd2",topic:"الأشخاص الطبيعية والمعنوية",
          scenario:"السؤال ليس عن الشيء محل الحق، بل عن الجهة التي يمكن أن تكون صاحبة الحق: فرد أم كيان معترف به قانونًا.",
          prompt:"أي باب هو الأقرب؟",
          options:[{id:"a",text:"أشخاص الحق.",score:1},{id:"b",text:"نطاق تطبيق القانون.",score:0},{id:"c",text:"إلغاء القانون.",score:0}],
          explanation:"المشكلة تتعلق بصاحب الحق وصفته."
        }
      ]
    },
    BUILD_THE_ANSWER: {
      id:"BUILD_THE_ANSWER",title:"ابنِ إجابة الامتحان",icon:"✍️",dimension:"exam_execution",
      description:"تحويل المعرفة إلى إجابة مرتبة تحقق عناصر السؤال بدل الإجابة المبعثرة.",
      items:[
        {
          id:"ba1",topic:"نظرية القانون",prompt:"رتّب إجابة مختصرة لسؤال: «اذكر المحاور العامة التي يدرسها مقرر مدخل إلى القانون».",
          rubric:[
            {label:"نظرية القانون",keywords:["نظرية القانون","القاعدة القانونية","مصادر","تفسير","نطاق","إلغاء"]},
            {label:"نظرية الحق",keywords:["نظرية الحق","الحق","الأشخاص","الأموال","التعسف"]},
            {label:"ترتيب واضح",keywords:["أولاً","ثانيًا","أولا","ثانيا","من ناحية","كما"]}
          ],
          explanation:"الهدف هو بناء إجابة منظمة تغطي المحورين بدل سرد كلمات منفصلة."
        },
        {
          id:"ba2",topic:"نظرية الحق",prompt:"اكتب 4 سطور تبيّن الفرق بين «أشخاص الحق» و«محل الحق» مع مثال بسيط.",
          rubric:[
            {label:"أشخاص الحق",keywords:["طبيعي","معنوي","شخص","صاحب"]},
            {label:"محل الحق",keywords:["مال","أموال","شيء","محل","يرد"]},
            {label:"مثال/تمييز",keywords:["مثال","مثل","بينما","أما","فرق"]}
          ],
          explanation:"تدريب على المقارنة المنظمة مع مثال بسيط."
        }
      ]
    }
  },
  sources: {
    "QU-LAWC101-DESC":{
      label:"جامعة قطر — وصف مقرر مدخل إلى القانون LAWC 101",
      url:"https://www.qu.edu.qa/ar/Colleges/law/departments/private-law/Pages/course-description.aspx",
      status:"official-course-description"
    },
    "SEED-REVIEW-REQUIRED":{
      label:"Seed تعليمي داخلي — يحتاج مراجعة قانونية وتربوية قبل النشر العام",
      url:"",
      status:"draft"
    }
  }
};
