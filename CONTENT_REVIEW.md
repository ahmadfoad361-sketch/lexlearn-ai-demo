# LexLearn AI — Content Review Gate

هذه الوثيقة تمنع تحويل الـPilot إلى بنك أسئلة غير مُراجع.

## قاعدة النشر
لا يدخل أي سؤال إلى حالة `approved` قبل مرور مراجعتين منفصلتين:

1. **Legal Review** — متخصص في المقرر يراجع صحة المفهوم، مفتاح الإجابة، المشتتات، وعدم وجود تعميم أو استثناء ناقص.
2. **Learning Review** — يراجع مستوى الصعوبة، جودة المشتتات، وضوح الصياغة، وهل السؤال يقيس البُعد المقصود فعلًا.

الحالات:
`draft → legal_review → learning_review → approved → retired`

## بطاقة مراجعة كل سؤال
- Course / Unit / Topic
- Learning objective
- Level: Easy / Medium / Difficult / Transfer / Exam
- Dimension
- Official source IDs
- Question text
- Correct answer / rubric
- Why each distractor is plausible
- Legal reviewer + date
- Educational reviewer + date
- Version / change notes

## قواعد المحتوى
- كل مشتت في أسئلة الاختيار يكون قانونيًا ومعقولًا، لا اختيارًا من مجال بعيد.
- لا يُستخدم رقم مادة أو نص تشريعي إلا من مصدر قانوني رسمي ومعتمد ومؤرخ.
- أسئلة Transfer لا تذكر اسم الباب صراحة في الوقائع.
- أسئلة Exam تستخدم Rubric مفاهيمي؛ الصياغة المختلفة لا تُرفض إذا حققت الفكرة.
- لا تُستخدم أوراق امتحانات فعلية قبل التحقق من مصدرها وحق استخدامها.
- الإحصاءات عن تكرار أسئلة الامتحانات لا تظهر إلا من بيانات موثقة.

## AI grading production gate
الواجهة الحالية تستخدم `concept_rubric_v2` محليًا. قبل Pilot حقيقي للتصحيح المقالى بالذكاء الاصطناعي:
- يكون الاستدعاء من Backend آمن، لا من GitHub Pages مباشرة.
- لا تُرسل للنموذج إلا: السؤال + Rubric المعتمد + المقاطع/المصادر المعتمدة المرتبطة بالسؤال + إجابة الطالب.
- يمنع النموذج من الاستشهاد بمادة أو قاعدة غير موجودة في الحزمة المرسلة.
- يعيد: achieved_criteria, missing_criteria, feedback, confidence.
- إذا لم تكفِ المصادر أو انخفضت الثقة، يعيد `needs_human_review` ولا يخمن.
- الناتج يسمى Training Feedback وليس Official Grade.
