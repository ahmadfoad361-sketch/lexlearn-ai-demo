/* LexLearn personal legal glossary: student-only, non-credit evidence. */
(function(root){
"use strict";
var COURSE="qa-qu-lawc101-rights";
var TERMS=[
 ["collateral-kinship","قرابة الحواشي",46],
 ["direct-kinship","القرابة المباشرة",46],
 ["kinship-degree","درجة القرابة",47],
 ["legal-domicile","الموطن",43],
 ["chosen-domicile","الموطن المختار",44],
 ["legal-personality","الشخصية القانونية",39],
 ["capacity-to-act","أهلية الأداء",49],
 ["lack-discernment","عديم التمييز",50],
 ["limited-capacity","ناقص الأهلية",51],
 ["juristic-person","الشخص المعنوي",53],
 ["separate-estate","ذمة مالية مستقلة",54],
 ["public-property","الأموال العامة",57],
 ["immovable-by-destination","عقار بالتخصيص",59],
 ["fungible-items","الأشياء المثلية",60],
 ["nonfungible-items","الأشياء القيمية",60],
 ["abuse-of-right","استعمال الحق غير مشروع",63]
];
// Beginner explanations derived from the displayed course articles; pending academic review, not AI-generated.
var BEGINNER_TERMS=[
 [
  "unborn-child",
  "الحمل المستكن",
  40,
  "الجنين الذي لم يولد بعد. يثبت له في هذه المادة ما لا يحتاج سببه إلى قبول، بشرط تمام ولادته حيًا.",
  "An unborn child. Under this article, certain rights requiring no acceptance are conditional on live birth.",
  "قد تثبت للجنين حقوق لا يحتاج سببها إلى قبول، بشرط ولادته حيًا.",
  "A prenatal right requiring no acceptance may vest subject to live birth."
 ],
 [
  "missing-person",
  "المفقود",
  39,
  "شخص انقطعت أخباره ولا يُعلم على وجه اليقين أحيّ هو أم ميت؛ وتنظم أحواله قوانين خاصة.",
  "A person whose whereabouts and life status are unknown; special laws govern the case.",
  "انقطعت أخبار شخص، فلا يُعامل موته على أنه ثابت لمجرد غيابه.",
  "A person's absence alone does not establish death."
 ],
 [
  "absent-person",
  "الغائب",
  39,
  "شخص غاب عن موطنه؛ تخضع أحكام غيبته للقواعد الخاصة المنظمة لذلك.",
  "A person absent from their domicile; applicable special rules govern the absence.",
  "قد يغيب شخص عن بلده مدة طويلة، وتختلف آثاره القانونية بحسب القواعد الخاصة.",
  "A person may be away from their country for a long period; legal consequences depend on special rules."
 ],
 [
  "habitual-residence",
  "وجه معتاد",
  41,
  "الإقامة على نحو اعتيادي، لا مجرد الوجود العارض في مكان.",
  "Habitual residence rather than a temporary presence.",
  "من يقيم عادة في الدوحة لا يتخذ كل مكان يزوره موطنًا لمجرد الزيارة.",
  "A habitual resident of Doha does not acquire a domicile in every place visited."
 ],
 [
  "minor",
  "القاصر",
  43,
  "من لم يبلغ سن الرشد؛ وتخضع أهليته للأحكام القانونية الخاصة بعمره وحالته.",
  "A person below the age of majority; capacity is governed by applicable rules.",
  "الشخص البالغ سبع عشرة سنة لم يبلغ سن الرشد المقررة في المادة 49.",
  "A seventeen-year-old has not reached the age of majority under Article 49."
 ],
 [
  "interdicted-person",
  "المحجور عليه",
  43,
  "شخص خضعت أهليته لقيود الحجر وفقًا للقانون.",
  "A person subject to legally imposed restrictions on capacity.",
  "قد يكون للمحجور عليه موطن خاص بالنسبة إلى الأعمال التي يعده القانون أهلًا لأدائها.",
  "An interdicted person may have a separate domicile for acts they are legally capable of performing."
 ],
 [
  "legal-representative",
  "ينوب عن هؤلاء قانوناً",
  43,
  "يقوم مقام هؤلاء في الحدود التي يسمح بها القانون.",
  "Acts as their legal representative within the limits of the law.",
  "قد يمثل الولي القاصر في التصرفات التي يجيزها القانون.",
  "A guardian may represent a minor in legally permitted transactions."
 ],
 [
  "compulsory-enforcement",
  "التنفيذ الجبري",
  44,
  "اتخاذ الإجراءات القانونية لإجبار المدين على تنفيذ التزام قابل للتنفيذ وفقًا للقانون.",
  "Legal procedures to enforce an enforceable obligation compulsorily.",
  "قد يتخذ الدائن إجراءات التنفيذ وفقًا لسند قابل للتنفيذ.",
  "A creditor may pursue enforcement under an enforceable instrument."
 ],
 [
  "common-ancestor",
  "أصل مشترك",
  45,
  "شخص تنتسب إليه فروع متعددة من الأسرة.",
  "An ancestor shared by members of a family.",
  "الأب أصل مشترك لأبنائه.",
  "A father is a common ancestor of his children."
 ],
 [
  "descendants",
  "الفروع",
  46,
  "من يتحدرون من شخص، كالأبناء والأحفاد.",
  "Descendants, such as children and grandchildren.",
  "الابن فرع لأبيه.",
  "A son is his father's descendant."
 ],
 [
  "ascendants",
  "الأصول",
  46,
  "من ينتسب إليهم الشخص صعودًا، كالآباء والأجداد.",
  "Ascendants, such as parents and grandparents.",
  "الجد من أصول الحفيد.",
  "A grandfather is an ascendant of a grandchild."
 ],
 [
  "affinity",
  "المصاهرة",
  48,
  "صلة تنشأ بسبب الزواج، وتحدد درجتها بدرجة قرابة الزوج.",
  "A relationship by marriage, measured by the spouse's degree of kinship.",
  "تحدد درجة المصاهرة مع قريب الزوج بحسب درجة قرابته للزوج.",
  "Affinity with a spouse's relative follows that relative's degree of kinship."
 ],
 [
  "majority",
  "سن الرشد",
  49,
  "السن التي يحددها القانون لبلوغ الرشد؛ وهي في المادة 49 ثماني عشرة سنة كاملة، مع مراعاة القيود القانونية.",
  "The statutory age of majority: eighteen full years under Article 49, subject to legal restrictions.",
  "من أتم الثامنة عشرة بلغ سن الرشد، مع مراعاة القيود الواردة في المادة.",
  "A person completing eighteen years reaches majority, subject to the article's restrictions."
 ],
 [
  "legal-acts",
  "التصرفات القانونية",
  49,
  "أعمال إرادية يقصد بها إحداث أثر قانوني، مثل إنشاء حق أو التزام.",
  "Voluntary acts intended to produce a legal effect, such as creating a right or obligation.",
  "إبرام عقد بيع مثال على تصرف قانوني.",
  "Concluding a sale contract is a legal act."
 ],
 [
  "guardianship",
  "الولاية",
  49,
  "سلطة يقررها القانون للولي في حدود معينة لرعاية شؤون من يخضع لولايته.",
  "Legal authority exercised by a guardian within prescribed limits.",
  "قد يباشر الولي بعض التصرفات المتعلقة بمال القاصر وفقًا للقانون.",
  "A guardian may perform certain acts concerning a minor's property under the law."
 ],
 [
  "tutelage",
  "الوصاية",
  49,
  "نظام لحماية مصالح من يحتاج إلى وصي، في حدود ما يقرره القانون.",
  "A legal arrangement protecting a person through a tutor or guardian within statutory limits.",
  "قد يعهد إلى وصي بإدارة مال القاصر وفق الضوابط القانونية.",
  "A tutor may manage a minor's property under legal safeguards."
 ],
 [
  "discernment",
  "سن التمييز",
  51,
  "المرحلة العمرية التي يبدأ معها الاعتداد بقدرة الشخص على التمييز وفق القانون؛ وتعد المادة 50 من لم يكمل السابعة عديم التمييز.",
  "The age at which legal discernment is recognized; Article 50 treats children under seven as lacking discernment.",
  "من أتم السابعة ولم يبلغ الرشد يخضع لأحكام ناقصي الأهلية وفق المادة 51.",
  "A child who has completed seven but not reached majority falls under Article 51."
 ],
 [
  "waqf",
  "الأوقاف",
  53,
  "أموال تخصص لغرض الوقف وفق أحكامه القانونية، ويعدها النص من الأشخاص المعنوية.",
  "Property dedicated to an endowment under applicable law; this article lists endowments as juristic persons.",
  "قد يخصص عقار للوقف وفق القانون المنظم له.",
  "A property may be dedicated as an endowment under applicable law."
 ],
 [
  "natural-person",
  "الشخص الطبيعي",
  54,
  "الإنسان بصفته شخصًا في نظر القانون، تمييزًا له عن الشخص المعنوي.",
  "A human being recognized as a person in law, distinct from a juristic person.",
  "الإنسان شخص طبيعي، أما الشركة التي يمنحها القانون الشخصية فهي شخص معنوي.",
  "A human is a natural person; a legally recognized company is a juristic person."
 ],
 [
  "litigation",
  "حق التقاضي",
  54,
  "حق اللجوء إلى القضاء في الحدود التي يقررها القانون.",
  "The right to resort to courts within the limits of the law.",
  "يجوز للشركة ذات الشخصية المعنوية أن تلجأ إلى القضاء وفق القانون.",
  "A company with legal personality may resort to courts under the law."
 ],
 [
  "possession",
  "حيازتها",
  56,
  "السيطرة الفعلية على شيء في السياق القانوني، ولا يلزم أن تعني ملكيته.",
  "Factual control over a thing; possession does not necessarily mean ownership.",
  "قد يحوز المستأجر شيئًا دون أن يكون مالكه.",
  "A tenant may possess a thing without owning it."
 ],
 [
  "public-benefit",
  "منفعة عامة",
  57,
  "غرض يخدم المصلحة العامة؛ وتخصيص المال له من شروط اعتبار بعض أموال الدولة أموالًا عامة.",
  "A public-purpose use; dedication to it is a condition for certain state property to qualify as public property.",
  "الطريق العام مثال على مال مخصص للمنفعة العامة.",
  "A public road is an example of property dedicated to public use."
 ],
 [
  "attachment",
  "الحجز عليها",
  57,
  "إجراء قانوني يرد على المال في سياق التنفيذ أو التحفظ؛ وتمنع المادة الحجز على الأموال العامة.",
  "A legal attachment of property in enforcement or preservation; this article prohibits attachment of public property.",
  "لا يجوز الحجز على مال عام وفق المادة 57.",
  "Public property cannot be attached under Article 57."
 ],
 [
  "prescription",
  "التقادم",
  57,
  "مرور مدة يحددها القانون قد تترتب عليها آثار قانونية؛ وتمنع المادة تملك الأموال العامة بالتقادم.",
  "Passage of a statutory period that may have legal effects; public property cannot be acquired by prescription here.",
  "لا يكتسب شخص ملكية مال عام لمجرد مرور مدة من حيازته.",
  "Possession over time alone cannot establish ownership of public property."
 ],
 [
  "immovable",
  "عقار",
  59,
  "شيء ثابت في مكانه لا يمكن نقله دون تلف أو تغيير في هيئته، وفق المادة 59.",
  "A thing fixed in place that cannot be moved without damage or alteration under Article 59.",
  "الأرض مثال على العقار.",
  "Land is an example of immovable property."
 ],
 [
  "movable",
  "منقول",
  59,
  "شيء لا يدخل في تعريف العقار، مع مراعاة الأحكام الخاصة كالعقار بالتخصيص.",
  "A thing outside the definition of immovable property, subject to special rules.",
  "القلم مثال على المنقول.",
  "A pen is an example of movable property."
 ],
 [
  "real-right",
  "حق عيني",
  59,
  "حق يرد مباشرة على شيء معين، مثل حق الملكية.",
  "A right directly over a specific thing, such as ownership.",
  "حق ملكية أرض حق عيني على عقار.",
  "Ownership of land is a real right over immovable property."
 ],
 [
  "consumable",
  "الأشياء الاستهلاكية",
  61,
  "أشياء لا يتحقق الانتفاع بها إلا باستهلاكها أو إنفاقها، وفق المادة 61.",
  "Things that can be used only by consuming or spending them under Article 61.",
  "الطعام مثال على شيء استهلاكي.",
  "Food is an example of a consumable thing."
 ],
 [
  "unlawful-interest",
  "غير مشروعة",
  63,
  "وصف للمصلحة المخالفة للقانون في سياق المادة، بما يجعل استعمال الحق غير مشروع في هذه الحالة.",
  "An interest contrary to law in this context, making the exercise of the right unlawful.",
  "استعمال حق لتحقيق مصلحة يحظرها القانون يدخل في هذه الحالة.",
  "Exercising a right to pursue a legally prohibited interest falls within this case."
 ],
 [
  "excessive-harm",
  "ضرراً فاحشاً غير مألوف",
  63,
  "ضرر شديد يتجاوز ما يُعد مألوفًا؛ وهو من حالات الاستعمال غير المشروع المذكورة في المادة.",
  "Gross and unusual harm, listed by the article as a case of unlawful exercise of a right.",
  "يُبحث مدى فحش الضرر وعدم مألوفيته بحسب ظروف الواقعة.",
  "Whether harm is gross and unusual depends on the facts."
 ]
];
BEGINNER_TERMS.forEach(function(v){TERMS.push(v.slice(0,3));});
var APPLY={
 "collateral-kinship":{q:"أي علاقة تعد قرابة حواشٍ؟",a:["أب وابنه","أخ وأخته","أم وابنتها"]},
 "direct-kinship":{q:"أي علاقة تعد قرابة مباشرة؟",a:["أخ وأخوه","ابن عم وابنة عمه","جد وحفيدته"]},
 "kinship-degree":{q:"عند حساب درجة قرابة الحواشي، ما الأصل المشترك؟",a:["يُحسب ضمن عدد الدرجات","لا يُحسب ضمن عدد الدرجات","لا تؤثر صلة النسب"]},
 "chosen-domicile":{q:"شخص اختار موطنًا لعمل قانوني محدد. ما الشرط المذكور في المادة؟",a:["أن يكون الاختيار كتابةً","أن يكون بالضرورة مكان الميلاد","أن يقيم فيه طوال حياته"]},
 "capacity-to-act":{q:"ما الذي تتعلق به أهلية الأداء؟",a:["مباشرة التصرفات القانونية","الاسم في شهادة الميلاد فقط","القرابة بين الإخوة"]},
 "lack-discernment":{q:"طفل لم يكمل السابعة. ما وصفه في المادة 50؟",a:["كامل الأهلية","عديم التمييز","شخص معنوي"]},
 "limited-capacity":{q:"شخص بلغ سن التمييز ولم يبلغ الرشد. كيف تصفه المادة 51؟",a:["ناقص الأهلية","كامل الأهلية دائمًا","ليس شخصًا قانونيًا"]},
 "juristic-person":{q:"أي مثال يعد شخصًا معنويًا وفق المادة 53؟",a:["شركة مدنية","أب وابنه","موطن مختار"]},
 "separate-estate":{q:"ما الأثر المقصود بالذمة المالية المستقلة للشخص المعنوي؟",a:["تتحد أمواله دائمًا مع أموال أعضائه","توجد له حقوق والتزامات مالية منفصلة","لا يملك حقوقًا مالية"]},
 "public-property":{q:"متى تعد أموال الدولة أو الشخص المعنوي العام أموالًا عامة؟",a:["كلما امتلكتها أي شركة خاصة","عند تخصيصها لمنفعة عامة بالفعل أو بمقتضى القانون","حين تكون منقولة فقط"]},
 "immovable-by-destination":{q:"متى يمكن اعتبار المنقول عقارًا بالتخصيص؟",a:["عندما يضعه صاحب العقار لخدمته أو استغلاله","بمجرد بيعه خارج العقار","إذا كان كل منقول بلا استثناء"]},
 "fungible-items":{q:"أي مثال أقرب للأشياء المثلية؟",a:["لوحة أصلية فريدة","كمية سكر من النوع نفسه تُباع بالوزن","عقار محدد بعنوانه"]},
 "nonfungible-items":{q:"ما الذي يميز الشيء القيمي؟",a:["تساوي وحداته دومًا دون فرق","اختلاف وحداته في القيمة أو الصفات اختلافًا معتدًا به","تقديره بالوزن فقط"]},
 "abuse-of-right":{q:"أي حالة وردت ضمن الاستعمال غير المشروع للحق؟",a:["استعماله لتحقيق مصلحة مشروعة بلا تعسف","قصد الإضرار بالغير وحده","ممارسته دون ضرر مطلقًا"]}
};
var glossaryCache=new Map(),lastSelection="",popupSequence=0,noticeTimer=null;
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function tr(ar,en){return root.document&&root.document.documentElement.lang==="en"?en:ar;}
function normalize(s){return String(s||"").normalize("NFKC").replace(/[ًٌٍَُِّْـ]/g,"").replace(/\s+/g," ").trim();}
function termKey(s){
 var canonical=normalize(s).toLocaleLowerCase();
 var known=TERMS.find(function(t){return normalize(t[1]).toLocaleLowerCase()===canonical;});
 return known?known[0]:"manual-"+canonical.slice(0,90);
}
function isLetter(c){return !!c&&/[\u0621-\u064aA-Za-z]/.test(c);}
function linkText(article,text){
 var s=String(text||""),terms=TERMS.filter(function(t){return t[2]===Number(article);}),i=0,parts=[];
 if(root.LEX_GLOSSARY_ACCESS&&!root.LEX_GLOSSARY_ACCESS.canShowTerms())return esc(s);
 while(i<s.length){
  var best=null;
  terms.forEach(function(term){
   var pos=s.indexOf(term[1],i);
   while(pos>=0&&(isLetter(s[pos-1])||isLetter(s[pos+term[1].length])))pos=s.indexOf(term[1],pos+term[1].length);
   if(pos>=0&&(!best||pos<best.pos||(pos===best.pos&&term[1].length>best.term[1].length)))best={term:term,pos:pos};
  });
  if(!best){parts.push(esc(s.slice(i)));break;}
  if(best.pos>i)parts.push(esc(s.slice(i,best.pos)));
  parts.push("<button class='lexGlossaryTerm' type='button' data-lex-term='"+esc(best.term[0])+"' data-lex-article='"+Number(article)+"' aria-label='"+esc(tr("اشرح المصطلح ","Explain term ")+best.term[1])+"'>"+esc(best.term[1])+"</button>");
  i=best.pos+best.term[1].length;
 }
 return parts.join("");
}
function label(term){return term&&term[1]||"";}
function find(key){return TERMS.find(function(x){return x[0]===key;})||null;}
async function student(){
 var cloud=root.LEX_CLOUD;if(!cloud||!cloud.db)throw Error("cloud_unavailable");
 var user=await cloud.requireStudent();return {client:cloud.db(),id:user.id};
}
function modal(){
 var d=root.document.getElementById("lexGlossaryDialog");
 if(d)return d;
 d=root.document.createElement("dialog");d.id="lexGlossaryDialog";d.className="lexGlossaryDialog";
 root.document.body.appendChild(d);
 d.addEventListener("click",function(e){if(e.target===d)d.close();});
 return d;
}
function popShow(term,article,source){
 var d=modal();d.dataset.lexRequest=String(++popupSequence);d.innerHTML="<section class='lexGlossaryDialogBody'><div class='lexGlossaryDialogHeader'><b>"+esc(term)+"</b><button type='button' data-close aria-label='"+esc(tr("إغلاق","Close"))+"'>×</button></div><p class='lexGlossarySource'>"+esc(tr("القانون المدني القطري رقم 22 لسنة 2004 • المادة ","Qatar Civil Code, Law 22/2004 • Article "))+article+"</p><p id='lexGlossaryMeaning' aria-live='polite'>"+esc(tr("جارٍ تحميل شرح المصطلح…","Loading a short explanation…"))+"</p><section class='lexGlossaryExample' id='lexGlossaryExample' hidden><strong>"+esc(tr("مثال قانوني للتوضيح","Illustrative legal example"))+"</strong><p id='lexGlossaryExampleText'></p></section><p class='lexGlossarySafety'>"+esc(tr("شرح مبسّط لأغراض الدراسة، لا يغيّر النص القانوني أو نتيجة الاختبار.","A study aid; it does not alter law text or assessment results."))+"</p><label class='lexPersonalMoment'>"+esc(tr("ما الذي دفعك إلى اختيار هذا المصطلح؟ (اختياري)","What made you choose this term? (optional)"))+"<textarea id='lexPersonalMoment' maxlength='350' rows='2' placeholder='"+esc(tr("مثال: ورد المصطلح في مسألة قانونية","E.g. I saw it in a legal case"))+"'></textarea></label><p role='alert' id='lexGlossaryError'></p><button type='button' class='lexGlossarySave' id='lexGlossarySave' disabled>"+esc(tr("أضف إلى قاموسي","Save to my dictionary"))+"</button></section>";
 d.querySelector("[data-close]").onclick=function(){d.close();};
 if(!d.open)d.showModal();
 return d;
}
async function resolveTerm(key,term,article,context,allowAi){
 if(glossaryCache.has(key))return glossaryCache.get(key);
 var current=await student();
 var r=await current.client.from("lex_glossary_definitions")
 .select("term_key,term_ar,definition_ar,definition_en,example_ar,example_en,source_article,source_status")
 .eq("course_id",COURSE).eq("term_key",key).eq("source_status","curated").maybeSingle();
 if(r.error)throw r.error;
 if(r.data){
  var value={key:key,term:r.data.term_ar,article:r.data.source_article,definition_ar:r.data.definition_ar,definition_en:r.data.definition_en,example_ar:r.data.example_ar||"",example_en:r.data.example_en||"",status:"curated"};
  glossaryCache.set(key,value);return value;
 }
 var beginner=BEGINNER_TERMS.find(function(v){return v[0]===key;});
 if(beginner){
  var value={key:key,term:beginner[1],article:beginner[2],definition_ar:beginner[3],definition_en:beginner[4],example_ar:beginner[5],example_en:beginner[6],status:"pending",beginnerDraft:true};
  glossaryCache.set(key,value);return value;
 }
 if(!allowAi)throw Error("ai_consent_needed");
 // An unknown term is explained only after the student explicitly requests AI.
 // The browser never receives the provider's API key.
 var fullContext=String(context||""),foundAt=fullContext.indexOf(term),from=foundAt<0?0:Math.max(0,foundAt-180);
 var excerpt=fullContext.slice(from,from+650);
 var ai=await current.client.functions.invoke("lexlearn-glossary-define",{
  body:{course_id:COURSE,term:term,article_number:article,context:excerpt,accept_ai_processing:true}
 });
 if(ai.error||!ai.data||!ai.data.definition_ar)throw ai.error||Error("ai_definition_unavailable");
 var value={key:key,term:term,article:article,definition_ar:String(ai.data.definition_ar).slice(0,800),definition_en:String(ai.data.definition_en||"").slice(0,800),example_ar:String(ai.data.example_ar||"").slice(0,900),example_en:String(ai.data.example_en||"").slice(0,900),status:"ai_unverified"};
 glossaryCache.set(key,value);return value;
}
async function save(value,note){
 var who=await student();
 var row={student_id:who.id,course_id:COURSE,term_key:value.key,term_ar:value.term,
  article_number:value.article,definition_ar:value.definition_ar||"",definition_en:value.definition_en||"",example_ar:value.example_ar||"",example_en:value.example_en||"",definition_status:value.status||"pending",personal_note:String(note||"").trim().slice(0,350)};
 var prior=await who.client.from("lex_student_glossary").select("id,definition_status,personal_note,example_ar,example_en").eq("student_id",who.id)
 .eq("course_id",COURSE).eq("term_key",value.key).maybeSingle();
 if(prior.error)throw prior.error;
 if(prior.data){
  var upgrade=prior.data.definition_status==="pending"&&value.status!=="pending";
  var addExample=!!row.example_ar&&(!prior.data.example_ar||!prior.data.example_en);
  if(upgrade||addExample){
   var changes={updated_at:new Date().toISOString()};
   if(upgrade){changes.definition_ar=row.definition_ar;changes.definition_en=row.definition_en;changes.definition_status=row.definition_status;}
   if(addExample){changes.example_ar=row.example_ar;changes.example_en=row.example_en;}
   var patch=await who.client.from("lex_student_glossary").update(changes).eq("id",prior.data.id).eq("student_id",who.id);
   if(patch.error)throw patch.error;
  }
  return false;
 }
 // A manually selected word and curated word may use different keys.
 var all=await who.client.from("lex_student_glossary").select("term_ar")
  .eq("student_id",who.id).eq("course_id",COURSE).limit(500);
 if(all.error)throw all.error;
 var canonicalName=normalize(row.term_ar).toLocaleLowerCase();
 if((all.data||[]).some(function(item){return normalize(item.term_ar).toLocaleLowerCase()===canonicalName;}))return false;
 var out=await who.client.from("lex_student_glossary").insert(row);
 if(out.error){if(out.error.code==="23505")return false;throw out.error;}
 return true;
}
function announceSaved(message){
 var notice=root.document.getElementById("lexGlossarySaveNotice");
 if(!notice){
  notice=root.document.createElement("div");
  notice.id="lexGlossarySaveNotice";
  notice.className="lexGlossarySaveNotice";
  notice.setAttribute("role","status");notice.setAttribute("aria-live","polite");
  root.document.body.appendChild(notice);
 }
 notice.textContent=message;notice.hidden=false;
 if(noticeTimer&&root.clearTimeout)root.clearTimeout(noticeTimer);
 if(root.setTimeout)noticeTimer=root.setTimeout(function(){notice.hidden=true;},3500);
}
async function openWord(word,article,context,knownKey){
 var term=find(knownKey)||TERMS.find(function(v){return v[1]===word&&v[2]===Number(article);});
 var key=term?term[0]:termKey(word),name=term?label(term):normalize(word);
 if(!name||name.length>120)return;
 var d=popShow(name,article,context),token=d.dataset.lexRequest,
     isCurrent=function(){return d.open&&d.dataset.lexRequest===token;},
     meaning=d.querySelector("#lexGlossaryMeaning"),btn=d.querySelector("#lexGlossarySave"),err=d.querySelector("#lexGlossaryError");
 var value={key:key,term:name,article:article,definition_ar:"",definition_en:"",example_ar:"",example_en:"",status:"pending"};
 function showMeaning(){
  if(!isCurrent())return;
  meaning.textContent=tr(value.definition_ar,value.definition_en||value.definition_ar);
  var exampleBox=d.querySelector("#lexGlossaryExample"),exampleText=d.querySelector("#lexGlossaryExampleText");
  var shownExample=tr(value.example_ar||"",value.example_en||value.example_ar||"");
  exampleBox.hidden=!shownExample;
  exampleText.textContent=shownExample;
  if(value.beginnerDraft){
   var draftNote=root.document.createElement("small");draftNote.className="lexGlossaryAiNote";
   draftNote.textContent=tr("شرح تعليمي أولي مستند إلى المادة؛ بانتظار المراجعة الأكاديمية.","A preliminary source-based learning explanation, pending academic review.");
   meaning.appendChild(draftNote);
  }
  if(value.status==="ai_unverified"){
   var note=root.document.createElement("small");note.className="lexGlossaryAiNote";
   note.textContent=tr("شرح أولي مولّد بالذكاء الاصطناعي؛ راجع النص الأصلي.","AI-generated draft. Check the original legal provision.");
   meaning.appendChild(note);
  }
 }
 try{
  value=await resolveTerm(key,name,article,context,false);
  showMeaning();
 }catch(e){
  if(!isCurrent())return;
  if(e&&e.message==="ai_consent_needed"){
   meaning.textContent=tr("المصطلح غير موجود في بنك التعريفات المعتمد. يمكنك حفظه الآن أو طلب شرح آلي اختياري.","This term is not in the curated dictionary. Save it now or request an optional AI explanation.");
   var consent=root.document.createElement("p");consent.className="lexGlossarySafety";
   consent.textContent=tr("بالضغط على طلب الشرح، سيُرسل المصطلح ومقتطف من المادة القانونية إلى مزوّد الذكاء الاصطناعي، دون اسمك أو إجاباتك.","By requesting AI, this term and a legal-text excerpt are sent to the AI provider, without your name or answers.");
   meaning.appendChild(consent);
   var aiButton=root.document.createElement("button");aiButton.type="button";aiButton.className="lexGlossaryAiRequest";
   aiButton.textContent=tr("اشرحه بالذكاء الاصطناعي","Explain with AI");
   meaning.appendChild(aiButton);
   aiButton.onclick=async function(){
    aiButton.disabled=true;aiButton.textContent=tr("جارٍ طلب الشرح…","Requesting explanation…");
    try{
     value=await resolveTerm(key,name,article,context,true);showMeaning();
     btn.disabled=false;btn.textContent=tr("أضف إلى قاموسي","Save to my dictionary");
    }catch(_){
     if(!isCurrent())return;
     meaning.textContent=tr("خدمة الشرح الآلي غير متاحة الآن. ما زال بإمكانك حفظ المصطلح للمراجعة لاحقًا.","AI explanation is unavailable now. You can still save the term for later review.");
    }
   };
  }else{
   meaning.textContent=tr("تعذّر تحميل الشرح الآن. يمكنك حفظ المصطلح للمراجعة لاحقًا.","Explanation unavailable. You can save the term for later review.");
  }
 }
 if(!isCurrent())return;
 btn.disabled=false;
 btn.onclick=async function(){
  btn.disabled=true;err.textContent="";
  try{
   var fresh=await save(value,d.querySelector("#lexPersonalMoment").value);
   if(!isCurrent())return;
   d.close();
   announceSaved(fresh?tr("✓ تمت إضافة المصطلح إلى قاموسك","✓ Term added to your dictionary"):
     tr("✓ المصطلح موجود بالفعل في قاموسك","✓ Already in your dictionary"));
  }catch(_){
   if(!isCurrent())return;
   btn.disabled=false;
   err.textContent=tr("لم يُحفظ المصطلح؛ تحقق من اتصالك أو صلاحية حسابك.","Could not save. Check your connection and account access.");
  }
 };
}
function bindArticle(node){
 if(!node||node.dataset.lexGlossaryBound)return;node.dataset.lexGlossaryBound="1";
 node.querySelectorAll("figure[data-article]").forEach(function(fig){
  var block=fig.querySelector("blockquote");if(!block)return;
  var control=root.document.createElement("button");control.type="button";control.className="lexGlossarySelection";
  control.textContent=tr("اشرح كلمة أو عبارة أخرى من هذه المادة","Explain another word or phrase from this article");
  block.after(control);
  control.onclick=function(){
   var word=root.prompt(tr("اكتب الكلمة أو العبارة كما وردت في المادة:","Type a word or phrase from this article:"));
   if(word===null)return;word=normalize(word);
   if(word.length<2||word.length>90||!normalize(block.textContent).includes(word)){root.alert(tr("اختر كلمة أو عبارة واردة في نص المادة.","Choose a word or phrase that appears in the provision."));return;}
   openWord(word,Number(fig.dataset.article),block.textContent,termKey(word));
  };
 });
 node.addEventListener("click",function(e){
  var b=e.target.closest("[data-lex-term]");if(!b||!node.contains(b))return;
  var fig=b.closest("[data-article]"),number=Number(b.dataset.lexArticle);
  var plain=fig&&fig.querySelector("blockquote");
  openWord(b.textContent,number,plain&&plain.textContent||"",b.dataset.lexTerm);
 });
 node.addEventListener("pointerup",function(e){
  var block=e.target.closest("blockquote");if(!block||!node.contains(block))return;
  var selection=root.getSelection?root.getSelection():null;
  if(!selection||selection.isCollapsed)return;
  var word=normalize(selection.toString());if(word.length<2||word.length>90||word.includes("\n"))return;
  lastSelection=word;
  var fig=block.closest("[data-article]"),number=Number(fig&&fig.dataset.article);
  if(!number)return;
  var old=node.querySelector(".lexGlossarySelectedText");if(old)old.remove();
  var control=root.document.createElement("button");control.type="button";control.className="lexGlossarySelection lexGlossarySelectedText";
  control.textContent=tr("اشرح «"+word+"» وأضفه لقاموسي","Explain and save “"+word+"”");
  block.after(control);
  control.onclick=function(){control.remove();openWord(word,number,block.textContent,"");};
 });
}
function appendLink(){
 return "<a class='lexGlossaryNav' href='student-glossary.html?lang="+esc(root.document.documentElement.lang==="en"?"en":"ar")+"'>📖 "+esc(tr("قاموسي القانوني","My legal dictionary"))+"</a>";
}
function formatDate(iso){try{return new Date(iso).toLocaleDateString(root.document.documentElement.lang==="en"?"en-GB":"ar-EG");}catch(_){return "";}}
function due(row){return !row.next_review_at||new Date(row.next_review_at).getTime()<=Date.now();}
async function mountPage(){
 var host=root.document.getElementById("personalGlossaryApp");if(!host)return;
 host.innerHTML="<p role='status'>"+esc(tr("جارٍ تحميل قاموسك المحفوظ…","Loading your dictionary…"))+"</p>";
 var who,entries=[],reviews=[];
 try{
  who=await student();
  if(!root.LEX_GLOSSARY_ACCESS)throw Error("glossary_access_unavailable");
  var allowed=await root.LEX_GLOSSARY_ACCESS.check(root.LEX_CLOUD);
  if(!allowed){
    host.innerHTML="<section class='lexDictionaryLocked' role='status'><h1>"+esc(tr("القاموس متاح بعد انتهاء الجلسة","Dictionary opens after your session"))+"</h1><p>"+esc(root.LEX_GLOSSARY_ACCESS.notice(root.document.documentElement.lang))+"</p><a href='student-path.html?lang="+esc(root.document.documentElement.lang==="en"?"en":"ar")+"'>"+esc(tr("أكمل جلستك","Continue your session"))+"</a></section>";
    return;
  }
  var [list,history]=await Promise.all([
   who.client.from("lex_student_glossary").select("*").eq("student_id",who.id).eq("course_id",COURSE).order("added_at",{ascending:false}).limit(500),
   who.client.from("lex_student_glossary_reviews").select("entry_id,skill,assessment_mode,outcome,created_at").eq("student_id",who.id).order("created_at",{ascending:false}).limit(1500)
  ]);
  if(list.error||history.error)throw list.error||history.error;
  entries=list.data||[];reviews=history.data||[];
 }catch(_){host.innerHTML="<p role='alert'>"+esc(tr("تعذر تحميل القاموس. سجل الدخول وتحقق من اتصالك.","Could not load the dictionary. Sign in and check your connection."))+"</p><a href='student-login.html'>"+esc(tr("دخول الطالب","Sign in"))+"</a>";return;}
 var attempt=[],testItems=[],pos=0,stage="",current=null;
 function latest(row,skill){return reviews.find(function(v){return v.entry_id===row.id&&v.skill===skill;})||null;}
 function renderList(filter){
  var shown=entries.filter(function(e){
   return !filter||normalize(e.term_ar).includes(normalize(filter));
  });
  host.innerHTML="<div class='lexDictionaryHero'><span class='lexDictionaryEyebrow'>My Legal Dictionary</span><h1>"+esc(tr("قاموسي القانوني","My Legal Dictionary"))+"</h1><p>"+esc(tr("قاموسك أنت؛ يبدأ فارغًا وتضيف إليه فقط المصطلحات التي تختارها من النص القانوني.","Start with an empty dictionary. Save only the terms you personally choose while reading."))+"</p><div class='lexDictionaryStats'><span><b>"+entries.length+"</b>"+esc(tr("مصطلحًا محفوظًا"," saved terms"))+"</span><span><b>"+entries.filter(due).length+"</b>"+esc(tr("جاهزًا للمراجعة"," due for review"))+"</span></div></div>"+
  "<section class='lexDictionaryToolbar'><label>"+esc(tr("ابحث في قاموسك","Search your terms"))+"<input id='lexDictionarySearch' value='"+esc(filter||"")+"' maxlength='100' placeholder='"+esc(tr("اكتب مصطلحًا…","Search a term…"))+"'></label><button type='button' id='lexDictionaryQuiz' "+(!entries.length?"disabled":"")+">"+esc(tr("اختبر قاموسي","Test my dictionary"))+"</button></section>"+
  (!entries.length?"<div class='lexDictionaryEmpty'>"+esc(tr("قاموسك فارغ حتى الآن. اقرأ المادة، واختَر بنفسك مصطلحًا ثم اضغط «أضف لقاموسي».","Your dictionary is empty. Choose a term yourself in the legal text, then save it."))+"</div>":
   "<div class='lexDictionaryGrid'>"+shown.map(function(e){
     var definition=e.definition_ar?(root.document.documentElement.lang==="en"&&e.definition_en?e.definition_en:e.definition_ar):tr("الشرح لم يتوفر بعد، ويمكنك إعادة طلبه من نص المادة.","The explanation is pending. Reopen the legal text to request it.");
     var example=e.example_ar?(root.document.documentElement.lang==="en"&&e.example_en?e.example_en:e.example_ar):"";
     return "<article class='lexDictionaryCard'><div class='lexDictionaryCardTop'><h2>"+esc(e.term_ar)+"</h2></div><p>"+esc(definition)+"</p>"+(example?"<div class='lexDictionaryExample'><b>"+esc(tr("مثال للتوضيح:","Illustrative example:"))+"</b><p>"+esc(example)+"</p></div>":"")+(e.personal_note?"<div class='lexPersonalMemory'><b>"+esc(tr("ملاحظتي: ","My note: "))+"</b>"+esc(e.personal_note)+"</div>":"")+"<small>"+esc(tr("القانون المدني القطري 22/2004 — المادة ","Qatar Civil Code 22/2004 — Article "))+esc(e.article_number||"—")+" · "+esc(formatDate(e.added_at))+"</small>"+
       (e.definition_status==="ai_unverified"?"<p class='lexDictionaryCaution'>"+esc(tr("شرح آلي أولي — غير مُراجع أكاديميًا","AI draft — not academically reviewed"))+"</p>":"")+"</article>";
   }).join("")+"</div>")+
  "<p class='lexDictionaryHint'>"+esc(tr("هذا قاموسك الشخصي؛ لا تُضاف إليه كلمات تلقائيًا. اختبر ما حفظته في الوقت الذي يناسبك.","This is your personal dictionary. Terms are never added automatically. Review whenever you like."))+"</p>";
  var search=host.querySelector("#lexDictionarySearch");if(search)search.oninput=function(){var v=search.value;renderList(v);var newer=host.querySelector("#lexDictionarySearch");newer.focus();newer.setSelectionRange(v.length,v.length);};
  var quiz=host.querySelector("#lexDictionaryQuiz");if(quiz)quiz.onclick=function(){testItems=entries.filter(due).filter(function(e){return !!e.definition_ar;}).slice(0,12);if(!testItems.length)testItems=entries.filter(function(e){return !!e.definition_ar;}).slice(0,12);if(!testItems.length){host.querySelector(".lexDictionaryHint").textContent=tr("كل مصطلحاتك تنتظر شرحًا. أعد فتحها من النص القانوني.","All saved terms await explanations.");return;}pos=0;attempt=[];question();};
 }
 async function record(entry,skill,mode,outcome,optionIndex){
  if(mode==="objective"){
   var response=await who.client.functions.invoke("lexlearn-glossary-review",{
    body:{entry_id:entry.id,option_index:optionIndex}
   });
   if(response.error||!response.data||response.data.ok!==true)throw Error("review_unconfirmed");
   attempt.push({entry:entry.id,skill:skill,mode:"objective",outcome:"saved"});
   return;
  }
  var result=await who.client.from("lex_student_glossary_reviews").insert({entry_id:entry.id,student_id:who.id,skill:skill,assessment_mode:mode,outcome:outcome});
  if(result.error)throw result.error;
  var when=new Date(Date.now()+((outcome==="incorrect"||outcome==="not_recalled")?1:3)*86400000).toISOString();
  await who.client.from("lex_student_glossary").update({next_review_at:when,updated_at:new Date().toISOString()}).eq("student_id",who.id).eq("id",entry.id);
  attempt.push({entry:entry.id,skill:skill,outcome:outcome,mode:mode});
  reviews.unshift({entry_id:entry.id,skill:skill,assessment_mode:mode,outcome:outcome,created_at:new Date().toISOString()});
 }
 function question(){
  current=testItems[pos];
  if(!current){finish();return;}
  stage="recall";
  host.innerHTML="<section class='lexQuiz'><div class='lexQuizTop'><small>"+esc(tr("المصطلح ","Term ")+(pos+1)+" / "+testItems.length)+"</small><button id='lexQuizExit' type='button'>"+esc(tr("العودة للقاموس","Back to dictionary"))+"</button></div><span class='lexQuizChip'>"+esc(tr("تذكّر دون مساعدة","Recall from memory"))+"</span><h1>"+esc(current.term_ar)+"</h1><label>"+esc(tr("ما معناه؟ اكتب ما تتذكره بكلماتك.","What does it mean? Write what you remember."))+"<textarea id='lexQuizRecall' rows='4' maxlength='500'></textarea></label><button type='button' id='lexQuizReveal'>"+esc(tr("أظهر التعريف ثم قيّم تذكري","Reveal meaning and rate my recall"))+"</button><div id='lexQuizFeedback' aria-live='polite'></div></section>";
  host.querySelector("#lexQuizExit").onclick=function(){renderList("");};
  host.querySelector("#lexQuizReveal").onclick=function(){
   var val=host.querySelector("#lexQuizRecall").value.trim();
   var msg=host.querySelector("#lexQuizFeedback");
   msg.innerHTML="<div class='lexQuizReference'><strong>"+esc(tr("التعريف المرجعي","Reference definition"))+"</strong><p>"+esc(root.document.documentElement.lang==="en"&&current.definition_en?current.definition_en:current.definition_ar)+"</p>"+(current.example_ar?"<div class='lexQuizExample'><b>"+esc(tr("مثال للتوضيح:","Illustrative example:"))+"</b> "+esc(root.document.documentElement.lang==="en"&&current.example_en?current.example_en:current.example_ar)+"</div>":"")+"<small>"+esc(tr("لا يُصحَّح النص الحر تلقائيًا هنا. اختر تقييمًا صادقًا بعد المقارنة.","Free text is not automatically graded here. Rate your recall after comparing."))+"</small></div><div class='lexQuizChoices'><button type='button' data-rate='recalled'>"+esc(tr("تذكرت المعنى بشكل صحيح","I recalled the meaning"))+"</button><button type='button' data-rate='not_recalled'>"+esc(tr("احتجت إلى مراجعة","I needed a review"))+"</button></div><p role='alert' id='lexQuizError'></p>";
   msg.querySelectorAll("[data-rate]").forEach(function(b){if(b.dataset.rate==="recalled"&&!val)b.disabled=true;b.onclick=async function(){
    msg.querySelectorAll("button").forEach(function(x){x.disabled=true;});
    try{await record(current,"recall","self_report",b.dataset.rate);application();}
    catch(_){msg.querySelectorAll("button").forEach(function(x){x.disabled=false;});msg.querySelector("#lexQuizError").textContent=tr("تعذر حفظ المراجعة. حاول مرة أخرى.","Could not save review. Retry.");}
   };});
  };
 }
 function application(){
  var ex=APPLY[current.term_key];if(!ex){pos++;question();return;}
  stage="understanding";
  host.innerHTML="<section class='lexQuiz'><div class='lexQuizTop'><small>"+esc(tr("السؤال التطبيقي ","Application ")+(pos+1)+" / "+testItems.length)+"</small><button id='lexQuizExit' type='button'>"+esc(tr("العودة للقاموس","Back to dictionary"))+"</button></div><span class='lexQuizChip'>"+esc(tr("هل فهمت الاستخدام؟","Can you apply it?"))+"</span><h1>"+esc(ex.q)+"</h1><fieldset>"+ex.a.map(function(a,i){return "<label class='lexQuizOption'><input type='radio' name='lexChoice' value='"+i+"'>"+esc(a)+"</label>";}).join("")+"</fieldset><button type='button' id='lexQuizSubmit'>"+esc(tr("تحقق من الفهم","Check understanding"))+"</button><p role='alert' id='lexQuizError'></p></section>";
  host.querySelector("#lexQuizExit").onclick=function(){renderList("");};
  host.querySelector("#lexQuizSubmit").onclick=async function(){
   var checked=host.querySelector("input[name=lexChoice]:checked"),error=host.querySelector("#lexQuizError"),btn=host.querySelector("#lexQuizSubmit");
   if(!checked){error.textContent=tr("اختر إجابة أولًا.","Choose an answer.");return;}
   btn.disabled=true;
   try{await record(current,"understanding","objective",null,Number(checked.value));pos++;question();}
   catch(_){btn.disabled=false;error.textContent=tr("تعذر حفظ النتيجة؛ حاول مجددًا.","Could not save the result. Retry.");}
  };
 }
 function finish(){
  var reviewed=attempt.filter(function(x){return x.skill==="recall";}).length;
  host.innerHTML="<section class='lexQuiz lexQuizResult'><span class='lexQuizChip'>"+esc(tr("مراجعة القاموس","Dictionary review"))+"</span><h1>"+esc(tr("اكتملت المراجعة","Review complete"))+"</h1><p>"+esc(tr("راجعت "+reviewed+" مصطلحًا من قاموسك. يمكنك العودة إلى قاموسك أو بدء جلسة جديدة.","You reviewed "+reviewed+" terms. Return to your dictionary or continue learning."))+"</p><button type='button' id='lexQuizEnd'>"+esc(tr("العودة إلى قاموسي","Back to dictionary"))+"</button></section>";
  host.querySelector("#lexQuizEnd").onclick=function(){renderList("");};
 }
 renderList("");
 if(root.document&&root.document.addEventListener){
   root.document.addEventListener("visibilitychange",async function(){
     if(root.document.hidden)return;
     try{
       if(!await root.LEX_GLOSSARY_ACCESS.check(root.LEX_CLOUD)){
         host.innerHTML="<section class='lexDictionaryLocked' role='status'><h1>"+esc(tr("يتفعّل دخول القاموس بعد انتهاء الجلسة.","Dictionary access resumes after the session."))+"</h1><a href='student-path.html?lang="+esc(root.document.documentElement.lang==="en"?"en":"ar")+"'>"+esc(tr("أكمل جلستك","Continue your session"))+"</a></section>";
       }
     }catch(_){host.innerHTML="<p role='alert'>"+esc(tr("تعذر التحقق من إتاحة القاموس. أعد تحميل الصفحة.","Could not verify glossary access. Refresh this page."))+"</p>";}
   });
 }
}
var api={terms:TERMS,beginnerTerms:BEGINNER_TERMS,apply:APPLY,linkText:linkText,normalize:normalize,termKey:termKey,bindArticle:bindArticle,appendLink:appendLink,mountPage:mountPage};
root.LEX_GLOSSARY=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
