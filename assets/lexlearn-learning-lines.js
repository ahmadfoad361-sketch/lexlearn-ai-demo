/* LexLearn learning-science microcopy.
   Original editorial paraphrases, not verbatim quotations from researchers.
   No analytics or cookies. Each tab shuffles the phrase deck without repeating.
*/
(function (root) {
  "use strict";
  var groups = [{"id":"meaning","sourceAr":"أبحاث الفهم والذاكرة · كريك وتولفينج","sourceEn":"Memory research · Craik & Tulving","lines":[[["حين نفهم معنى المعلومة","تصبح أيسر استرجاعًا"],["When we understand an idea's meaning,","it becomes easier to recall."]],[["الفهم يمنح المعلومة سياقًا","والسياق يساعد على تذكّرها"],["Understanding gives knowledge context;","context supports recall."]],[["لا نكتفي بتكرار الكلمات","بل نبحث عن المعنى وراءها"],["Don't merely repeat the words;","look for the meaning behind them."]],[["كل رابط نفهمه بين الأفكار","يمنح الذاكرة طريقًا إضافيًا"],["Each meaningful link between ideas","offers another route to recall."]],[["التفكير في معنى المعرفة","يساعدها على البقاء في الذاكرة"],["Thinking through an idea's meaning","can help it stay in memory."]],[["المعرفة المرتبطة بسياق واضح","أيسر في الفهم والاسترجاع"],["Knowledge placed in a clear context","is easier to understand and recall."]],[["نبدأ بالفكرة لا بمجرد لفظها","كي نتذكرها بصورة أفضل"],["Start with the idea, not just its wording;","recall can become more effective."]],[["كلما نظمنا المعنى بوضوح","سهلنا استدعاء تفاصيله"],["The more clearly we organise meaning,","the easier its details are to retrieve."]],[["الفهم العميق ليس ضد الحفظ","بل قد يكون أحد أقوى مساعديه"],["Deep understanding is not the enemy of memory;","it can be one of its strongest allies."]]]},{"id":"retrieval","sourceAr":"أبحاث الاسترجاع · كاربيك وبلانت","sourceEn":"Retrieval research · Karpicke & Blunt","lines":[[["استرجاع المعرفة لا يختبر الذاكرة فقط","بل قد يفتح بابًا لفهم أعمق"],["Retrieving knowledge does more than test memory;","it can deepen understanding."]],[["حين نحاول تذكّر فكرة","نمنح أنفسنا فرصة لفهمها مجددًا"],["When we try to recall an idea,","we give ourselves a chance to understand it again."]],[["الاسترجاع النشط ليس تكرارًا آليًا","بل فرصة لإعادة بناء المعرفة"],["Active retrieval is not mechanical repetition;","it is a chance to reconstruct knowledge."]],[["التذكّر النشط قد يدعم الاستدلال","لا مجرد استعادة الألفاظ"],["Active recall can support reasoning,","not just repeating words."]],[["ما نسترجعه بوعي","قد يصبح أيسر تطبيقًا"],["Knowledge we actively retrieve","may become easier to apply."]],[["الأسئلة الجيدة لا تقيس المعرفة فحسب","بل تساعد على تطويرها"],["Good questions do more than measure knowledge;","they can help develop it."]],[["كل محاولة استرجاع","فرصة لاكتشاف ما يحتاج إلى فهم"],["Each attempt to retrieve knowledge","can reveal what needs deeper understanding."]],[["الاسترجاع يساعد على بناء التعلم","وليس مجرد اختبار نتيجته"],["Retrieval can build learning;","it does not only measure the result."]],[["التذكّر الواعي يقوّي المعرفة","ويمنح الفهم فرصة للنمو"],["Thoughtful recall strengthens knowledge","and gives understanding room to grow."]]]},{"id":"bridge","sourceAr":"مبدأ تعلّم في LexLearn","sourceEn":"LexLearn learning principle","lines":[[["نفهم لنتذكّر","ونسترجع لنفهم أكثر"],["We understand to remember;","we retrieve to understand more."]],[["الفهم يرسّخ المعرفة","والاسترجاع قد يعمّقها"],["Understanding anchors knowledge;","retrieval can deepen it."]],[["من الفهم إلى التذكّر","ومن الاسترجاع إلى الفهم"],["From understanding to recall;","from retrieval back to understanding."]],[["نستفيد من مهارتنا الأقوى","كي ننمّي المهارة الأضعف"],["Start with your stronger skill","to develop the weaker one."]],[["كل مهارة قوية","يمكن أن تكون جسرًا إلى مهارة أخرى"],["Every strong skill","can be a bridge to another."]],[["لا يبدأ التعلم دومًا من الضعف","فقد يبدأ مما نتقنه بالفعل"],["Learning need not begin with weakness;","it can begin with what we already do well."]],[["نفهم القاعدة ثم نسترجعها","ونسترجعها لنختبر مدى فهمنا"],["Understand the rule, then retrieve it;","retrieve it to test your understanding."]],[["الحفظ والفهم ليسا طريقين منفصلين","بل مهارتان يمكن أن تتعاونا"],["Recall and understanding are not separate roads;","they can work together."]],[["نتعلّم بما نتقنه اليوم","لنطوّر ما نحتاج إليه غدًا"],["Build on what you know today","to develop what you need tomorrow."]]]}];
  var phrases = [];
  groups.forEach(function (g) {
    g.lines.forEach(function (pair) {
      phrases.push({
        category:g.id,
        ar:pair[0],
        en:pair[1],
        sourceAr:g.sourceAr,
        sourceEn:g.sourceEn
      });
    });
  });
  var deck = [], last = -1, storageKey = "lexlearn_quote_shuffle_v2";
  function shuffle() {
    deck = phrases.map(function (_, i) { return i; });
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = deck[i];
      deck[i] = deck[j]; deck[j] = t;
    }
    if (deck.length > 1 && deck[deck.length - 1] === last) {
      var k = deck[0]; deck[0] = deck[deck.length - 1]; deck[deck.length - 1] = k;
    }
  }
  try {
    var saved = JSON.parse(root.sessionStorage.getItem(storageKey) || "null");
    if (saved && Array.isArray(saved.deck) && typeof saved.last === "number" &&
        saved.deck.length <= phrases.length && saved.deck.every(function (id) {
          return Number.isInteger(id) && id >= 0 && id < phrases.length;
        })) {
      deck = saved.deck; last = saved.last;
    }
  } catch (_) { /* private browsing may disable session storage */ }
  function next() {
    if (!deck.length) shuffle();
    var id = deck.pop();
    last = id;
    try { root.sessionStorage.setItem(storageKey, JSON.stringify({deck:deck,last:last})); } catch (_) {}
    return phrases[id];
  }
  function render(target, lang, phrase) {
    if (!target) return;
    var data = phrase || next();
    var locale = lang === "ar" ? "ar" : "en";
    target.setAttribute("lang", locale);
    target.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    while (target.firstChild) target.removeChild(target.firstChild);
    var main = root.document.createElement("p");
    main.className = "ll-quote-main";
    data[locale].forEach(function (segment) {
      var span = root.document.createElement("span");
      span.textContent = segment;
      main.appendChild(span);
    });
    var source = root.document.createElement("small");
    source.className = "ll-quote-source";
    source.textContent = locale === "ar" ? data.sourceAr : data.sourceEn;
    target.appendChild(main);
    target.appendChild(source);
    return data;
  }
  root.LEXLEARN_LEARNING_LINES = {next:next, render:render, count:phrases.length};
})(window);
