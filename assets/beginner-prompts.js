/* First-year presentation. Original server prompts and rubrics remain authoritative. */
(function(root){
"use strict";
var CASES={
 "rights-v1-s1-exam": {
  "source": "الواقعة: وجد سبب حق للحمل لا يحتاج إلى قبول، ثم تمت ولادته حيًا. ما أثر الولادة على الحق المقصود؟",
  "simple": "نشأ للجنين حق لا يحتاج إلى قبول منه، ثم وُلد الطفل حيًا. ماذا يحدث لهذا الحق بعد الولادة؟"
 },
 "rights-v1-s2-exam": {
  "source": "الواقعة: يقيم شخص عادة في الدوحة ويزور الريان ثلاثة أيام. هل تُعد الزيارة القصيرة موطنًا آخر له؟ وضّح السبب.",
  "simple": "يعيش شخص عادةً في الدوحة، وزار الريان لمدة ثلاثة أيام. هل تُعد هذه الزيارة القصيرة موطنًا آخر له؟ اشرح السبب."
 },
 "rights-v1-s3-exam": {
  "source": "الواقعة: قاصر له موطن نائب قانوني ويباشر تصرفًا أجازه القانون له. هل يجوز أن يكون للقاصر موطن خاص بهذا التصرف المأذون؟",
  "simple": "شخص قاصر له ممثل قانوني، ويسمح له القانون بالقيام بتصرف محدد بنفسه. هل يمكن أن يكون له موطن خاص بهذا التصرف؟"
 },
 "rights-v1-s4-exam": {
  "source": "الواقعة: اتفق الطرفان شفهيًا على موطن لإعلانات عقد معين، دون دليل كتابي. هل يكفي الاتفاق الشفهي لإثبات الموطن المختار؟ بيّن شرط الإثبات.",
  "simple": "اتفق شخصان بالكلام فقط على موطن لإعلانات عقد معين، ولا يوجد دليل مكتوب. هل يكفي هذا الاتفاق لإثبات الموطن المختار؟ اذكر شرط الإثبات."
 },
 "rights-v1-s6-exam": {
  "source": "الواقعة: يشترك أخوان في الأب، وليس أحدهما أصلًا للآخر. كيف تصنف القرابة؟",
  "simple": "أخوان لهما الأب نفسه، وليس أحدهما أصلًا للآخر. ما نوع القرابة بينهما؟"
 },
 "rights-v1-s7-exam": {
  "source": "الواقعة: تريد حساب درجة القرابة بين أخوين. ما درجة القرابة بين الأخوين؟ وضّح خطوات حسابها.",
  "simple": "أمامك أخوان. ما درجة القرابة بينهما؟ اشرح كيف حسبتها خطوة بخطوة."
 },
 "rights-v1-s8-exam": {
  "source": "الواقعة: أتم شخص ثماني عشرة سنة لكن يوجد سبب قانوني لاستمرار الحجر. هل يكفي بلوغ سن الثامنة عشرة لاعتباره كامل أهلية الأداء في هذه الحالة؟",
  "simple": "أتم شخص 18 سنة، لكن يوجد سبب قانوني لاستمرار الحجر عليه. هل بلوغه 18 سنة يكفي وحده ليصبح كامل أهلية التصرف في هذه الحالة؟"
 },
 "rights-v1-s9-exam": {
  "source": "الواقعة: شخص مميز عمره 17 سنة، دون إذن خاص في الوقائع. هل هو كامل الأهلية أم ناقص الأهلية أم عديم التمييز؟ علّل اختيارك.",
  "simple": "شخص عمره 17 سنة ولديه تمييز، ولا يوجد في المثال إذن خاص له. هل هو كامل الأهلية، أم ناقص الأهلية، أم عديم التمييز؟ اشرح اختيارك."
 },
 "rights-v1-s11-exam": {
  "source": "الواقعة: اجتمع أشخاص في نشاط مشترك دون واقعة تثبت الاعتراف القانوني. هل يكفي هذا الاجتماع لاعتبارهم شخصًا معنويًا؟ بيّن ما يجب التحقق منه.",
  "simple": "اجتمع أشخاص للعمل في نشاط مشترك. ولا يوجد في المثال ما يثبت اعتراف القانون بهم كشخص معنوي. هل يكفي اجتماعهم وحده؟ اذكر ما يجب التأكد منه."
 },
 "rights-v1-s12-exam": {
  "source": "الواقعة: شركة ذات شخصية معنوية تريد رفع دعوى باسمها. هل يحق للشركة رفع الدعوى باسمها؟ اذكر القاعدة التي تستند إليها، وبيّن علاقتها بالشخصية المعنوية.",
  "simple": "شركة لها شخصية معنوية تريد رفع دعوى باسمها. هل يحق لها ذلك؟ اذكر القاعدة، ثم اشرح علاقة رفع الدعوى بالشخصية المعنوية."
 },
 "rights-v1-s13-exam": {
  "source": "الواقعة: مركز شركة في الخارج وإدارتها المحلية بالدوحة، ومديرها يسكن الريان. أين موطن نشاطها القطري؟",
  "simple": "المركز الرئيسي لشركة خارج قطر، وإدارتها المحلية في الدوحة. مدير الشركة يسكن الريان. أين موطن نشاط الشركة داخل قطر؟"
 },
 "rights-v1-s14-exam": {
  "source": "الواقعة: طُلب منك تحديد أهلية شركة بالاعتماد على عمر مؤسسها. هل عمر المؤسس هو معيار أهلية الشركة؟ وضّح المعيار الذي يجب الرجوع إليه.",
  "simple": "يريد شخص معرفة أهلية شركة من خلال عمر مؤسسها. هل عمر المؤسس هو المعيار الصحيح؟ اذكر المعيار الذي يجب الرجوع إليه."
 },
 "rights-v1-s16-exam": {
  "source": "الواقعة: شيء له قيمة اقتصادية لكن القانون يخرجه من التعامل. هل تكفي قيمته الاقتصادية لجعله محلًا للحقوق المالية رغم هذا الحظر؟",
  "simple": "شيء له قيمة مالية، لكن القانون يمنع التعامل فيه. هل قيمته المالية وحدها تكفي ليكون محلًا لحقوق مالية رغم هذا المنع؟"
 },
 "rights-v1-s17-exam": {
  "source": "الواقعة: أرض الدولة مخصصة فعليًا لحديقة عامة. طلب دائن الحجز عليها. هل يجوز الحجز على هذه الأرض؟ علّل وفق شروط المال العام وحمايته.",
  "simple": "أرض مملوكة للدولة وتُستخدم فعلًا كحديقة عامة. يريد دائن الحجز عليها. هل يسمح القانون بالحجز؟ اشرح اعتمادًا على شروط المال العام وحمايته."
 },
 "rights-v1-s18-exam": {
  "source": "الواقعة: مالك أرض يملك أيضًا آلة منقولة وضعها في أرضه لخدمتها. هل تعد الآلة عقارًا بالتخصيص؟ اربط النتيجة بملكية الأرض والآلة والغرض من وضعها.",
  "simple": "شخص يملك أرضًا وآلة منقولة، ووضع الآلة في أرضه لخدمتها. هل تُعد الآلة عقارًا بالتخصيص؟ اربط إجابتك بملكية الأرض والآلة وسبب وضعها."
 },
 "rights-v1-s19-exam": {
  "source": "الواقعة: سيارة معدة للبيع في معرض. ما أثر تخصيصها للبيع في المادة 61؟",
  "simple": "سيارة معروضة للبيع في معرض. كيف يؤثر تخصيصها للبيع في وصفها وفق المادة 61؟"
 },
 "rights-v1-s21-exam": {
  "source": "الواقعة: ثبت استعمال حق بصورة مشروعة وحدث ضرر، دون تحقق حالة تعسف. هل يلتزم صاحب الحق بالتعويض لمجرد وقوع الضرر في هذه الحالة؟ علّل.",
  "simple": "ثبت أن شخصًا استعمل حقه بطريقة مشروعة، وحدث ضرر دون أي حالة تعسف. هل يلتزم بالتعويض لمجرد حدوث الضرر في هذه الحالة؟ اشرح."
 },
 "rights-v1-s22-exam": {
  "source": "الواقعة: استعمل شخص حقه دون غرض سوى إيذاء جاره. هل يُعد هذا الاستعمال مشروعًا؟ حدّد أثر انفراد قصد الإضرار.",
  "simple": "استعمل شخص حقه لهدف واحد فقط: إيذاء جاره. هل هذا الاستعمال مشروع؟ اشرح أثر كون الإضرار هو الهدف الوحيد."
 },
 "rights-v1-s23-exam": {
  "source": "الواقعة: يحقق الاستعمال فائدة ضئيلة جدًا مع ضرر بالغ للجار. هل يوجد تعسف في استعمال الحق؟ ناقش التناسب بين الفائدة والضرر.",
  "simple": "استعمل شخص حقه فحقق فائدة صغيرة جدًا، وسبب ضررًا كبيرًا لجاره. هل يعد ذلك تعسفًا في استعمال الحق؟ قارن بين الفائدة والضرر."
 },
 "rights-v1-s24-exam": {
  "source": "الواقعة: كان الاستعمال لفائدة معتبرة ثم صار بلا غرض سوى الإضرار. هل يؤثر تغيّر الغرض في مشروعية استعمال الحق؟ قارن الحالتين وعلّل.",
  "simple": "استعمل شخص حقه أولًا لتحقيق فائدة معتبرة. ثم تغير هدفه وأصبح يريد الإضرار فقط. هل يؤثر تغير الهدف في مشروعية الاستعمال؟ قارن الحالتين واشرح."
 },
 "rights-v1-s26-exam": {
  "source": "الواقعة: شخص عمره 17 سنة يقيم عادة في الدوحة. هل ثبوت الشخصية والموطن يكفي لكمال أهلية الأداء؟",
  "simple": "شخص عمره 17 سنة ويعيش عادةً في الدوحة. هل وجود شخصية قانونية وموطن له يكفي ليكون كامل أهلية التصرف؟"
 },
 "rights-v1-s27-exam": {
  "source": "الواقعة: تملك الدولة أرضًا غير مخصصة لمنفعة عامة، لا بالفعل ولا بمقتضى القانون. هل تكفي ملكية الدولة وحدها لاعتبار الأرض مالًا عامًا؟ علّل.",
  "simple": "تملك الدولة أرضًا غير مخصصة لمنفعة عامة، لا بالفعل ولا بنص القانون. هل ملكية الدولة وحدها تجعلها مالًا عامًا؟ اشرح."
 },
 "rights-v1-s28-exam": {
  "source": "الواقعة: يستعمل مالك أرضه دون أي غرض سوى إيذاء جاره. هل يجعل امتلاكه للأرض هذا الاستعمال مشروعًا؟ علّل بقصد الاستعمال.",
  "simple": "يستخدم مالك أرضه لهدف واحد فقط: إيذاء جاره. هل ملكيته للأرض تجعل هذا الاستعمال مشروعًا؟ اشرح على أساس هدفه من الاستعمال."
 },
 "rights-v1-s29-exam": {
  "source": "الواقعة: شركة مركزها بالخارج وإدارتها القطرية في الدوحة تستعمل ملكها بقصد منفرد لإضرار جارها. حدد موطن النشاط ومشروعية الاستعمال.",
  "simple": "المركز الرئيسي لشركة خارج قطر، وإدارتها داخل قطر في الدوحة. تستخدم الشركة ملكها بهدف واحد فقط: إيذاء جارها. حدد موطن نشاطها في قطر، ثم اشرح هل استعمالها للملك مشروع."
 }
};
// Wording-only equivalents, matched by exact item ID and exact original statement.
// These pairs preserve statement order, deliberately inaccurate propositions, and source scope.
// No truth labels, answers, new hints or scoring changes are introduced here.
var CLEAR_COMPARISONS={
 "rights-v1-s1-understanding": {
  "ar": [
   [
    "الشخصية تبدأ بالولادة حية؛ وبعض حقوق الحمل معلقة على ذلك",
    "تبدأ الشخصية القانونية للإنسان بتمام ولادته حيًا، ويتوقف ثبوت بعض حقوق الجنين على ولادته حيًا."
   ],
   [
    "الشخصية تبدأ بالحمل؛ والولادة تؤكد أهلية الأداء الكاملة",
    "تبدأ الشخصية القانونية للإنسان منذ الحمل، وتؤكد الولادة تمتعه بأهلية الأداء الكاملة."
   ]
  ],
  "en": [
   [
    "Personality begins at live birth; certain prenatal rights depend on it",
    "A human being acquires legal personality upon completed live birth; certain prenatal rights depend on live birth."
   ],
   [
    "Personality begins at conception; birth confirms full capacity to act",
    "A human being acquires legal personality at conception, and birth confirms full capacity to act."
   ]
  ]
 },
 "rights-v1-s2-understanding": {
  "ar": [
   [
    "الإقامة المعتادة مع إمكان تعدد الموطن",
    "يتحدد الموطن العام بمكان الإقامة المعتادة، ويجوز أن يكون للشخص أكثر من موطن."
   ],
   [
    "مكان الميلاد مع امتناع تعدد الموطن",
    "يتحدد الموطن العام بمكان الميلاد، ولا يجوز أن يكون للشخص أكثر من موطن."
   ]
  ],
  "en": [
   [
    "Habitual residence, with multiple domiciles possible",
    "General domicile is determined by habitual residence; a person may have more than one domicile."
   ],
   [
    "Place of birth, with multiple domiciles excluded",
    "General domicile is determined by birthplace; a person cannot have more than one domicile."
   ]
  ]
 },
 "rights-v1-s3-understanding": {
  "ar": [
   [
    "يختص بشؤون النشاط دون إلغاء الموطن العام",
    "يقتصر الموطن المهني على ما يتعلق بالنشاط التجاري أو الحرفي، دون إلغاء الموطن العام."
   ],
   [
    "يلغي الموطن العام بالنسبة إلى جميع التصرفات",
    "يحل الموطن المهني محل الموطن العام في جميع التصرفات القانونية."
   ]
  ],
  "en": [
   [
    "It concerns business matters without eliminating general domicile",
    "Business domicile concerns matters connected to the business or profession, without replacing general domicile."
   ],
   [
    "It replaces general domicile for every legal transaction",
    "Business domicile replaces general domicile for all legal transactions."
   ]
  ]
 },
 "rights-v1-s4-understanding": {
  "ar": [
   [
    "موطن لعمل معين وما يتعلق به مع إثبات كتابي",
    "يُتخذ الموطن المختار لعمل قانوني معين وما يتعلق به، ويجب إثباته كتابةً."
   ],
   [
    "موطن لكل الأعمال بمجرد الاتفاق دون كتابة",
    "يكفي الاتفاق على الموطن المختار دون كتابة، ويسري على جميع الأعمال القانونية."
   ]
  ],
  "en": [
   [
    "For a specified act and related matters, proved in writing",
    "A chosen domicile concerns a specified legal act and related matters and must be proved in writing."
   ],
   [
    "For every act through agreement without written proof",
    "An agreement without written proof establishes a chosen domicile for all legal acts."
   ]
  ]
 },
 "rights-v1-s6-understanding": {
  "ar": [
   [
    "علاقة أصل وفرع مقابل أصل مشترك دون تلك العلاقة",
    "تكون القرابة المباشرة بين الأصول والفروع، أما قرابة الحواشي فتقوم على أصل مشترك دون أن يكون أحد القريبين فرعًا للآخر."
   ],
   [
    "اختلاف الجنس مقابل اتحاد الجنس بين القريبين",
    "يتحدد الفرق بين القرابة المباشرة وقرابة الحواشي بحسب اتفاق جنس القريبين أو اختلافه."
   ]
  ],
  "en": [
   [
    "Descent between the two versus a common ancestor without descent",
    "Direct kinship links ascendants and descendants; collateral kinship links people with a common ancestor where neither descends from the other."
   ],
   [
    "Different sexes versus the same sex between the relatives",
    "Direct and collateral kinship are distinguished by whether the two relatives are of the same or different sexes."
   ]
  ]
 },
 "rights-v1-s7-understanding": {
  "ar": [
   [
    "الصعود ثم النزول دون احتساب الأصل المشترك",
    "تُحسب درجة قرابة الحواشي بعدّ الفروع صعودًا إلى الأصل المشترك ثم نزولًا إلى الفرع الآخر، دون احتساب الأصل المشترك."
   ],
   [
    "الصعود ثم النزول مع احتساب الأصل المشترك",
    "تُحسب درجة قرابة الحواشي بعدّ الفروع صعودًا ثم نزولًا، مع احتساب الأصل المشترك ضمن الدرجات."
   ]
  ],
  "en": [
   [
    "Count ascent and descent, excluding the common ancestor",
    "Collateral kinship degrees are counted up to the common ancestor and down to the other relative, excluding that ancestor."
   ],
   [
    "Count ascent and descent, including the common ancestor",
    "Collateral kinship degrees are counted up and down, including the common ancestor as a degree."
   ]
  ]
 },
 "rights-v1-s8-understanding": {
  "ar": [
   [
    "ثماني عشرة كاملة مع غياب سبب استمرار الولاية أو الحجر",
    "يبلغ الشخص سن الرشد عند إتمام ثماني عشرة سنة، وتكون أهليته كاملة ما لم يوجد سبب قانوني لاستمرار الولاية أو الحجر."
   ],
   [
    "ثماني عشرة كاملة ولو استمر سبب قانوني للحجر",
    "يكون الشخص كامل أهلية الأداء بمجرد إتمام ثماني عشرة سنة، ولو استمر سبب قانوني للحجر."
   ],
   [
    "ثماني عشرة سنة كاملة تكفي لكمال الأهلية ولو صدر حكم بالحجر",
    "يكفي إتمام ثماني عشرة سنة لكمال أهلية الأداء، حتى لو صدر حكم بالحجر على الشخص."
   ],
   [
    "بلوغ ثماني عشرة سنة كاملة مع عدم القضاء باستمرار الولاية أو الوصاية على المال أو بالحجر",
    "يكون من أتم ثماني عشرة سنة كامل أهلية الأداء ما لم يُقضَ باستمرار الولاية أو الوصاية على ماله أو بالحجر عليه."
   ]
  ],
  "en": [
   [
    "Eighteen full years without a ground for continued guardianship",
    "A person reaches majority at eighteen full years and has full capacity unless a legal ground for continued guardianship or interdiction remains."
   ],
   [
    "Eighteen full years even if a legal ground for interdiction remains",
    "A person has full capacity at eighteen full years even if a legal ground for interdiction remains."
   ]
  ]
 },
 "rights-v1-s9-understanding": {
  "ar": [
   [
    "بلوغ التمييز دون الرشد يقرر نقص أهلية الأداء",
    "يكون من بلغ سن التمييز ولم يبلغ سن الرشد ناقص أهلية الأداء."
   ],
   [
    "بلوغ التمييز دون الرشد يقرر انعدام الشخصية",
    "يفقد من بلغ سن التمييز ولم يبلغ سن الرشد شخصيته القانونية."
   ]
  ],
  "en": [
   [
    "Discernment before majority entails limited capacity to act",
    "A person who has reached discernment but not majority has limited capacity to act."
   ],
   [
    "Discernment before majority entails absence of legal personality",
    "A person who has reached discernment but not majority has no legal personality."
   ]
  ]
 },
 "rights-v1-s11-understanding": {
  "ar": [
   [
    "منح القانون الشخصية لمجموعة أشخاص أو أموال",
    "تكتسب مجموعة الأشخاص أو الأموال الشخصية المعنوية إذا منحها القانون هذه الشخصية."
   ],
   [
    "كثرة أعضاء المجموعة ولو لم يمنحها القانون الشخصية",
    "تكتسب مجموعة الأشخاص الشخصية المعنوية بمجرد كثرة أعضائها، ولو لم يمنحها القانون هذه الشخصية."
   ]
  ],
  "en": [
   [
    "Legal recognition of personality for persons or assets",
    "A group of persons or assets acquires legal personality when the law grants it."
   ],
   [
    "A large membership without legal recognition of personality",
    "A group acquires legal personality solely because it has many members, even without legal recognition."
   ]
  ]
 },
 "rights-v1-s12-understanding": {
  "ar": [
   [
    "تمييز مال الشخص المعنوي عن مال أعضائه",
    "تكون الذمة المالية للشخص المعنوي مستقلة عن ذمم أعضائه المالية."
   ],
   [
    "اندماج مال الشخص المعنوي في مال أكبر عضو",
    "تندمج الذمة المالية للشخص المعنوي في الذمة المالية لأكبر أعضائه."
   ]
  ],
  "en": [
   [
    "The legal person’s estate is distinct from its members’ estates",
    "A legal person's estate is independent of its members' estates."
   ],
   [
    "The legal person’s estate merges with the largest member’s estate",
    "A legal person's estate merges with the estate of its largest member."
   ]
  ]
 },
 "rights-v1-s13-understanding": {
  "ar": [
   [
    "بمكان الإدارة المحلية بالنسبة لذلك النشاط",
    "إذا كان المركز الرئيسي للشخص المعنوي في الخارج وله نشاط في قطر، يكون موطنه بالنسبة إلى ذلك النشاط في مكان إدارته المحلية."
   ],
   [
    "بموطن المدير الشخصي بالنسبة لجميع الأنشطة",
    "إذا كان المركز الرئيسي للشخص المعنوي في الخارج وله نشاط في قطر، يكون موطنه في مكان الإقامة الشخصية لمديره بالنسبة إلى جميع الأنشطة."
   ]
  ],
  "en": [
   [
    "By local management for that particular activity",
    "If a legal person has its principal office abroad and operates in Qatar, its domicile for that activity is the location of its local management."
   ],
   [
    "By the manager’s personal domicile for every activity",
    "If a legal person has its principal office abroad and operates in Qatar, its domicile for all activities is the manager's personal domicile."
   ]
  ]
 },
 "rights-v1-s14-understanding": {
  "ar": [
   [
    "تختلف بداية الشخصية مع استقلال الذمة ووجود تمثيل للمعنوي",
    "تختلف بداية الشخصية القانونية للشخص الطبيعي عن بداية الشخصية المعنوية، وللشخص المعنوي ذمة مالية مستقلة ومن يمثله قانونًا."
   ],
   [
    "تتحد بداية الشخصية مع تطبيق سن الرشد على كل معنوي",
    "تبدأ الشخصية القانونية للشخص الطبيعي والشخص المعنوي بالطريقة نفسها، ويُطبق سن الرشد على كل شخص معنوي."
   ]
  ],
  "en": [
   [
    "Personality begins differently; entities have separate estates and representation",
    "The beginning of human legal personality differs from that of a legal entity; a legal entity has an independent estate and a legal representative."
   ],
   [
    "Personality begins identically; majority applies to every legal entity",
    "Human legal personality and entity personality begin in the same way; the age of majority applies to every legal entity."
   ]
  ]
 },
 "rights-v1-s16-understanding": {
  "ar": [
   [
    "الخروج عن التعامل بالطبيعة أو بحكم القانون",
    "لا يصلح الشيء محلًا للحقوق المالية إذا كان خارجًا عن التعامل بطبيعته أو بحكم القانون."
   ],
   [
    "عدم وجود مالك حالي للشيء وقت التصنيف",
    "لا يصلح الشيء محلًا للحقوق المالية لمجرد عدم وجود مالك حالي له."
   ]
  ],
  "en": [
   [
    "Exclusion from dealings by nature or law",
    "An object cannot be the subject of financial rights if it is excluded from dealings by nature or by law."
   ],
   [
    "Absence of a current owner at the time of classification",
    "An object cannot be the subject of financial rights merely because it has no current owner."
   ]
  ]
 },
 "rights-v1-s17-understanding": {
  "ar": [
   [
    "تخصيص مال الجهة العامة لمنفعة عامة",
    "يُعد مال الدولة أو الشخص المعنوي العام مالًا عامًا إذا خُصص لمنفعة عامة."
   ],
   [
    "كون المال عقارًا ولو لم يخصص للمنفعة العامة",
    "يُعد مال الدولة أو الشخص المعنوي العام مالًا عامًا لمجرد كونه عقارًا، ولو لم يُخصص لمنفعة عامة."
   ]
  ],
  "en": [
   [
    "Allocation of publicly owned property to public benefit",
    "Property owned by the state or a public legal person is public property if allocated to public benefit."
   ],
   [
    "Being immovable, without allocation to public benefit",
    "Property owned by the state or a public legal person is public property merely because it is immovable, even without allocation to public benefit."
   ]
  ]
 },
 "rights-v1-s18-understanding": {
  "ar": [
   [
    "الثبات بحيث لا ينقل دون تلف أو تغيير في الهيئة",
    "يُعد الشيء عقارًا بطبيعته إذا كان ثابتًا في مكانه ولا يمكن نقله دون تلف أو تغيير في هيئته."
   ],
   [
    "ارتفاع القيمة بحيث يتعذر استبداله بشيء مماثل",
    "يُعد الشيء عقارًا بطبيعته إذا ارتفعت قيمته وتعذر استبداله بشيء مماثل."
   ]
  ],
  "en": [
   [
    "Fixed in place so movement causes damage or alteration",
    "An object is immovable by nature if it is fixed in place and cannot be moved without damage or alteration of form."
   ],
   [
    "High value that prevents replacement by a similar item",
    "An object is immovable by nature if its high value prevents replacement by a similar item."
   ]
  ]
 },
 "rights-v1-s19-understanding": {
  "ar": [
   [
    "قابلية استبدال الآحاد عرفًا دون تفاوت معتبر",
    "تكون الأشياء مثلية عندما يمكن أن يحل بعضها محل بعض بحسب العرف دون فرق يُعتد به."
   ],
   [
    "قابلية نقل الشيء ماديًا دون تلف في هيئته",
    "تكون الأشياء مثلية إذا أمكن نقلها من مكان إلى آخر دون تلف أو تغيير في هيئتها."
   ]
  ],
  "en": [
   [
    "Customary substitution of units without significant difference",
    "Things are fungible if their units can customarily substitute for one another without a significant difference."
   ],
   [
    "Physical movement without damage or alteration of form",
    "Things are fungible if they can be moved without damage or alteration of form."
   ]
  ]
 },
 "rights-v1-s21-understanding": {
  "ar": [
   [
    "لا يرتب وحده مسؤولية مع ثبوت مشروعية الاستعمال",
    "لا يكفي وقوع الضرر وحده لترتيب مسؤولية صاحب الحق إذا ثبت أنه استعمل حقه استعمالًا مشروعًا."
   ],
   [
    "يرتب وحده مسؤولية ولو ثبتت مشروعية الاستعمال",
    "يكفي وقوع الضرر وحده لترتيب مسؤولية صاحب الحق، حتى إذا ثبت أنه استعمل حقه استعمالًا مشروعًا."
   ]
  ],
  "en": [
   [
    "Damage alone does not create liability when exercise is lawful",
    "Damage alone does not make a right-holder liable when the exercise of the right is lawful."
   ],
   [
    "Damage alone creates liability even when exercise is lawful",
    "Damage alone makes a right-holder liable even when the exercise of the right is lawful."
   ]
  ]
 },
 "rights-v1-s22-understanding": {
  "ar": [
   [
    "القصد المنفرد معيار مستقل؛ الضرر وحده لا يثبت القصد",
    "قصد الإضرار وحده سبب مستقل لعدم مشروعية استعمال الحق، ولا يثبت هذا القصد بمجرد وقوع الضرر."
   ],
   [
    "أي ضرر دليل حاسم على أن القصد الوحيد هو الإضرار",
    "يكفي وقوع أي ضرر لإثبات أن الإضرار كان القصد الوحيد لصاحب الحق."
   ]
  ],
  "en": [
   [
    "Sole purpose is an independent ground; damage alone does not prove it",
    "A sole purpose of harming another is an independent ground of unlawful exercise; damage alone does not establish that purpose."
   ],
   [
    "Any damage conclusively proves that harm was the sole purpose",
    "Any damage conclusively establishes that harming another was the right-holder's sole purpose."
   ]
  ]
 },
 "rights-v1-s23-understanding": {
  "ar": [
   [
    "موازنة المصلحة والضرر مقابل فحش الضرر وعدم مألوفيته",
    "عدم التناسب بين المصلحة والضرر يختلف عن معيار كون الضرر فاحشًا وغير مألوف."
   ],
   [
    "موازنة قيمة المال مقابل عدد الأشخاص في كل نزاع",
    "يتحدد التعسف في استعمال الحق بمقارنة قيمة المال بعدد الأشخاص في كل نزاع."
   ]
  ],
  "en": [
   [
    "Balance interest and harm versus excessive and unusual harm",
    "Disproportion between interest and harm is distinct from the criterion of excessive and unusual harm."
   ],
   [
    "Balance property value against the number of people in every dispute",
    "Abuse of a right is determined by comparing property value with the number of people in every dispute."
   ]
  ]
 },
 "rights-v1-s24-understanding": {
  "ar": [
   [
    "أعيد اختبار معيار المشروعية المتصل بالواقعة المتغيرة",
    "إذا تغيرت واقعة مؤثرة، أعيد النظر في معيار مشروعية استعمال الحق المرتبط بتلك الواقعة."
   ],
   [
    "أثبت النتيجة الأولى لأن أصل الحق لم يتغير في الواقعة",
    "أتمسك بالنتيجة الأولى رغم تغير الواقعة المؤثرة، لأن أصل الحق لم يتغير."
   ]
  ],
  "en": [
   [
    "Retest the lawfulness ground connected to the changed fact",
    "If a decisive fact changes, I reconsider the lawfulness criterion connected to that fact."
   ],
   [
    "Keep the first result because existence of the right has not changed",
    "I keep the initial conclusion despite the changed decisive fact because the right itself has not changed."
   ]
  ]
 },
 "rights-v1-s26-understanding": {
  "ar": [
   [
    "ثماني عشرة كاملة مع غياب سبب استمرار الولاية أو الحجر",
    "يبلغ الشخص سن الرشد عند إتمام ثماني عشرة سنة، وتكون أهليته كاملة ما لم يوجد سبب قانوني لاستمرار الولاية أو الحجر."
   ],
   [
    "ثماني عشرة كاملة ولو استمر سبب قانوني للحجر",
    "يكون الشخص كامل أهلية الأداء بمجرد إتمام ثماني عشرة سنة، ولو استمر سبب قانوني للحجر."
   ]
  ],
  "en": [
   [
    "Eighteen full years without a ground for continued guardianship",
    "A person reaches majority at eighteen full years and has full capacity unless a legal ground for continued guardianship or interdiction remains."
   ],
   [
    "Eighteen full years even if a legal ground for interdiction remains",
    "A person has full capacity at eighteen full years even if a legal ground for interdiction remains."
   ]
  ]
 },
 "rights-v1-s27-understanding": {
  "ar": [
   [
    "تخصيص مال الجهة العامة لمنفعة عامة",
    "يُعد مال الدولة أو الشخص المعنوي العام مالًا عامًا إذا خُصص لمنفعة عامة."
   ],
   [
    "كون المال عقارًا ولو لم يخصص للمنفعة العامة",
    "يُعد مال الدولة أو الشخص المعنوي العام مالًا عامًا لمجرد كونه عقارًا، ولو لم يُخصص لمنفعة عامة."
   ]
  ],
  "en": [
   [
    "Allocation of publicly owned property to public benefit",
    "Property owned by the state or a public legal person is public property if allocated to public benefit."
   ],
   [
    "Being immovable, without allocation to public benefit",
    "Property owned by the state or a public legal person is public property merely because it is immovable, even without allocation to public benefit."
   ]
  ]
 },
 "rights-v1-s28-understanding": {
  "ar": [
   [
    "القصد المنفرد معيار مستقل؛ الضرر وحده لا يثبت القصد",
    "قصد الإضرار وحده سبب مستقل لعدم مشروعية استعمال الحق، ولا يثبت هذا القصد بمجرد وقوع الضرر."
   ],
   [
    "أي ضرر دليل حاسم على أن القصد الوحيد هو الإضرار",
    "يكفي وقوع أي ضرر لإثبات أن الإضرار كان القصد الوحيد لصاحب الحق."
   ]
  ],
  "en": [
   [
    "Sole purpose is an independent ground; damage alone does not prove it",
    "A sole purpose of harming another is an independent ground of unlawful exercise; damage alone does not establish that purpose."
   ],
   [
    "Any damage conclusively proves that harm was the sole purpose",
    "Any damage conclusively establishes that harming another was the right-holder's sole purpose."
   ]
  ]
 },
 "rights-v1-s29-understanding": {
  "ar": [
   [
    "بمكان الإدارة المحلية بالنسبة لذلك النشاط",
    "إذا كان المركز الرئيسي للشخص المعنوي في الخارج وله نشاط في قطر، يكون موطنه بالنسبة إلى ذلك النشاط في مكان إدارته المحلية."
   ],
   [
    "بموطن المدير الشخصي بالنسبة لجميع الأنشطة",
    "إذا كان المركز الرئيسي للشخص المعنوي في الخارج وله نشاط في قطر، يكون موطنه في مكان الإقامة الشخصية لمديره بالنسبة إلى جميع الأنشطة."
   ]
  ],
  "en": [
   [
    "By local management for that particular activity",
    "If a legal person has its principal office abroad and operates in Qatar, its domicile for that activity is the location of its local management."
   ],
   [
    "By the manager’s personal domicile for every activity",
    "If a legal person has its principal office abroad and operates in Qatar, its domicile for all activities is the manager's personal domicile."
   ]
  ]
 }
};
CLEAR_COMPARISONS["rights-v1-s8-understanding"].en.push(
 ["Eighteen complete years always suffice even when interdiction has been judicially imposed","Reaching eighteen full years is sufficient for full capacity to act, even if a court has imposed interdiction."],
 ["Eighteen complete years with no judicial continuation of guardianship/tutorship over property or interdiction","A person who reaches eighteen full years has full capacity to act unless a court has continued guardianship or tutorship over their property, or imposed interdiction."]
);
function clarifyComparison(id,language,statements){
 var entry=CLEAR_COMPARISONS[id],lang=language==="en"?"en":"ar";
 if(!entry||!Array.isArray(statements)||statements.length!==2)return statements;
 var pairs=entry[lang],matches=statements.map(function(statement){return pairs.find(function(pair){return pair[0]===statement;});});
 // Preserve unknown or partially changed question versions in full.
 return matches.every(Boolean)?matches.map(function(pair){return pair[1];}):statements;
}
function prepare(task,lang){
 var en=lang==="en",raw=String((en?task.prompt_en:task.prompt_ar)||""),lines=raw.split(/\r?\n/),dim=task.dimension;
 if(!en&&dim==="exam_execution"&&CASES[task.id]&&CASES[task.id].source===lines[0]){
  lines[0]="الواقعة: "+CASES[task.id].simple;return lines.join("\n");
 }
 var topic=en?(lines[0].match(/“([^”]+)”/)||[])[1]:(lines[0].match(/«([^»]+)»/)||[])[1];
 var ref=(lines[0].match(/\(([^)]+)\)/)||[])[1];
 if(!topic||!ref)return raw;
 if(!en&&topic==="الطبيعي والمعنوي")topic="الشخص الطبيعي والشخص المعنوي";
 if(dim==="recall"&&/^(من ذاكرتك، اكتب قاعدة|From memory, write the rule on)/.test(raw))return en?
  "From memory, answer about “"+topic+"” ("+ref+").\n1. Write the elements of the rule and its conditions that you remember, briefly.\n2. Choose three distinct short words or phrases that help you recall the rule.\n3. Explain what each cue helps you remember. You do not need to solve a case.":
  "من ذاكرتك، أجب عن «"+topic+"» ("+ref+").\n1. اكتب عناصر القاعدة وشروطها التي تتذكرها، في جمل قصيرة.\n2. اختر ثلاث كلمات أو عبارات قصيرة مختلفة تساعدك على تذكّر القاعدة.\n3. اشرح ما يذكّرك به كل مفتاح من عناصر القاعدة. لا يُطلب منك حل واقعة.";
 if(dim==="understanding"&&/^(اشرح قاعدة|Explain the rule on)/.test(raw)){
  // UI wording alone is neutral; the approved server prompt and rubric remain unchanged.
  var marker=en?"Compare these statements; one is inaccurate:":"عبارتان للمقارنة؛ إحداهما غير دقيقة:";
  var visibleMarker=en?"Review each statement on its own:":"قيّم كل عبارة على حدة:";
  var at=lines.indexOf(marker);if(at<0||lines.length<at+3)return raw;
  var header=en?"Explain “"+topic+"” ("+ref+") in your own words.":
    "اشرح «"+topic+"» ("+ref+") بأسلوبك.";
  var questions=en?[
   "1. Explain the rule and the meaning of its conditions briefly.",
   "2. Decide whether each statement is accurate. Explain and correct any error.",
   "3. In one or two sentences, explain how the legal condition affects the outcome."
  ]:[
   "1. اشرح القاعدة ومعنى شروطها باختصار.",
   "2. حدّد لكل عبارة على حدة هل هي دقيقة قانونيًا أم لا، واذكر السبب، وصحّح الخطأ إن وجد.",
   "3. في سطر أو سطرين، وضّح أثر الشرط القانوني على النتيجة."
  ];
  // The comparison belongs immediately after question 2, never after question 3.
  return [header,questions[0],questions[1],visibleMarker].concat(clarifyComparison(task.id,lang,lines.slice(at+1))).concat([questions[2]]).join("\n");
 }
 return raw;
}
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function render(text,language){
 var source=String(text||""),lines=source.split(/\r?\n/),en=language==="en";
 var legacy=en?"Compare these statements; one is inaccurate:":"عبارتان للمقارنة؛ إحداهما غير دقيقة:";
 var neutral=en?"Review each statement on its own:":"قيّم كل عبارة على حدة:";
 var at=lines.indexOf(neutral);if(at<0)at=lines.indexOf(legacy);
 function headerAndSteps(parts){
  var heading=parts[0]||"",steps=parts.slice(1).join("\n");
  return "<div class='questionBrief' style='white-space:pre-wrap'>"+esc(heading)+"</div>"+
   (steps?"<div class='questionGuidance' style='white-space:pre-wrap'>"+esc(steps)+"</div>":"");
 }
 var lead="<span class='questionLeadLabel'>"+(en?"Your task":"السؤال")+"</span>";
 if(at<0||lines.length<at+3)return "<section class='prompt clearQuestionPrompt questionSingle'>"+lead+headerAndSteps(lines)+"</section>";
 var marker=lines[at],before=lines.slice(0,at),pair=lines.slice(at+1,at+3),after=lines.slice(at+3).join("\n");
 return "<section class='prompt clearQuestionPrompt'>"+lead+headerAndSteps(before)+
 "<div class='questionComparison' role='group' aria-label='"+(en?"Evaluate each statement":"تقييم العبارات")+"'>"+
 "<strong>"+esc(marker)+"</strong>"+
 pair.map(function(value,i){return "<p class='comparisonStatement'><span class='comparisonNumber'>"+(i+1)+"</span>"+esc(value)+"</p>";}).join("")+
 "</div>"+(after?"<div class='questionFollowup' style='white-space:pre-wrap'>"+esc(after)+"</div>":"")+"</section>";
}
root.LEX_BEGINNER_PROMPTS={prepare:prepare,render:render,cases:CASES,clarifyComparison:clarifyComparison};
if(typeof module!=="undefined"&&module.exports)module.exports=root.LEX_BEGINNER_PROMPTS;
})(typeof window!=="undefined"?window:globalThis);

