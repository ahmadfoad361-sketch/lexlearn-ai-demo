/* Original editorial micro-messages developed for LexLearn.
   No third-party person's name, title, endorsement or implied consent. */
(function(root){"use strict";
  var quotes=[{"ar":["الأفكار الجديدة تستحق التجربة","قبل أن تُحكم عليها بالأرقام."],"en":["New ideas deserve a trial","before they are judged by numbers."]},{"ar":["الاستثمار المبكر يبدأ بسؤال","ما المشكلة الحقيقية التي نحلّها؟"],"en":["Early investing starts with one question:","What real problem does this solve?"]},{"ar":["الابتكار يحتاج شجاعة الاختبار","لا وعودًا بنتائج لم تتحقق."],"en":["Innovation calls for testing courage,","not promises of unproven results."]},{"ar":["أفضل خطوة بعد الفكرة","اختبارها مع من سيستخدمها."],"en":["The best next step after an idea","is testing it with real users."]},{"ar":["لا تجعل الفكرة أكبر من أدلتها،","واجعل أدلتها تنمو بالتجربة."],"en":["Don't let a claim outgrow the evidence;","let evidence grow through experiments."]},{"ar":["القيمة تبدأ من احتياج واضح","وتتأكد عندما يقيسها المستخدم."],"en":["Value begins with a clear need","and becomes clearer when users test it."]},{"ar":["الفكرة الطموحة تحتاج شريكًا","يرى قيمة التعلّم قبل التوسع."],"en":["An ambitious idea needs a partner","who values learning before scaling."]},{"ar":["الاستثمار في التعليم","استثمار في قدرة الإنسان على التفكير."],"en":["Investing in education","means investing in human thinking."]},{"ar":["اجعل كل تجربة تعلّمنا شيئًا","قبل أن نقرر الخطوة التالية."],"en":["Let each pilot teach us something","before choosing the next step."]},{"ar":["النمو المستدام يبدأ بالتحقق","ثم يأتي التوسع على أساس واضح."],"en":["Sustainable growth starts with validation;","scaling should rest on a clear foundation."]}];
  var key="lexlearn_investor_original_v1",deck=[],last=-1;
  function shuffle(){
    deck=quotes.map(function(_,i){return i;});
    for(var i=deck.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=deck[i];deck[i]=deck[j];deck[j]=t;}
    if(deck.length>1&&deck[deck.length-1]===last){var z=deck[0];deck[0]=deck[deck.length-1];deck[deck.length-1]=z;}
  }
  try{var v=JSON.parse(root.sessionStorage.getItem(key)||"null");if(v&&Array.isArray(v.deck)&&v.deck.every(function(i){return Number.isInteger(i)&&i>=0&&i<quotes.length;})&&Number.isInteger(v.last)){deck=v.deck;last=v.last;}}catch(_){}
  function next(){if(!deck.length)shuffle();var id=deck.pop();last=id;try{root.sessionStorage.setItem(key,JSON.stringify({deck:deck,last:last}));}catch(_){}return quotes[id];}
  function render(target,lang,phrase){
    if(!target)return null;
    var item=phrase||next(),ar=lang==="ar";
    target.setAttribute("lang",ar?"ar":"en");target.setAttribute("dir",ar?"rtl":"ltr");
    while(target.firstChild)target.removeChild(target.firstChild);
    var heading=root.document.createElement("span");heading.className="ll-investor-eyebrow";
    heading.textContent=ar?"من رؤية المؤسس":"FROM THE FOUNDER’S VISION";
    var body=root.document.createElement("p");body.className="ll-quote-main";
    (ar?item.ar:item.en).forEach(function(line){var span=root.document.createElement("span");span.textContent=line;body.appendChild(span);});
    target.appendChild(heading);target.appendChild(body);
    return item;
  }
  root.LEXLEARN_INVESTOR_QUOTES={count:quotes.length,next:next,render:render};
})(window);
