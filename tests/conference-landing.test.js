const fs=require("node:fs"),assert=require("node:assert/strict");
const read=(file)=>fs.readFileSync(file,"utf8");
const html=read("conference.html"),js=read("assets/conference.js"),css=read("assets/conference.css");
const go=read("go/index.html"),pub=read("scripts/build-public.js"),ar=read("index.html"),
en=read("index-en.html"),arLogic=read("assets/v9-law.js");
assert.match(html,/<html lang="en" dir="ltr">/,"conference defaults to English");
assert.ok(html.indexOf('class="paths"')<html.indexOf('id="problem"'),"visitor pathways must be above long text");
for(const id of ["studentCard","pilot","vision","how","demo","deck","contact","langEN","langAR","downloadDeck"])assert.ok(html.includes('id="'+id+'"'),"missing "+id);
for(const skill of ["Recall","Understanding","Application","Legal precision","Exam answer structure"])assert.ok(js.includes(skill),"missing exact English skill "+skill);
for(const skill of ["الحفظ","الفهم","التطبيق","الدقة القانونية","بناء الإجابة الامتحانية"])assert.ok(js.includes(skill),"missing exact Arabic skill "+skill);
for(const phrase of ["Working beta","AI analysis of written answers: in progress","Learning impact not yet proven","30–60","6–8","Dr Ahmed Foad Elfeky","Founder & CEO","Qatari law faculties"])assert.ok(js.includes(phrase)||html.includes(phrase),"required public copy: "+phrase);
for(const forbidden of ["Qatar University","Lusail University","HBKU","exam performance","QAR","USD","$49","Google Ads","gtag(","fbq(","pixel","<video"])assert.ok(!html.includes(forbidden)&&!js.includes(forbidden),"forbidden public item: "+forbidden);
assert.ok(!html.includes("<form"),"no contact data form");
assert.ok(!/<script[^>]+src="https?:/i.test(html),"no third party scripts");
assert.ok(html.includes("mailto:ahmadfoad361@gmail.com"),"direct email contact required");

assert.ok(!html.includes('id="science"')&&!html.includes("researchBasis")&&!html.includes("researchCards"),"scientific sources should appear in transition quotes, not as a standalone presentation section");
assert.ok(!js.includes("scienceEyebrow:")&&!js.includes("scienceHeading:"),"unused research-section translations should be removed");
assert.ok(!css.includes(".researchCards")&&!css.includes(".researchBasis"),"no obsolete research-card styling in main page");
assert.ok(html.includes('class="honestyAi"')&&html.includes('data-t="status2Title"')&&html.includes('data-t="status2State"'),"AI development status must be readable as two lines");
assert.ok(js.includes('status2State:"قيد التطوير والتحقق من الدقة"'),"AI beta status must remain honest");
const transitions=read("assets/lexlearn-navigation.js");
for(const name of ["Test-Enhanced Learning","Karpicke &amp; Blunt","Dunlosky et al.","ll-paper-field","ll-learning-quote"])assert.ok(transitions.includes(name),"missing research-inspired transition "+name);
assert.ok(read("assets/lexlearn-navigation.css").includes(".ll-research-slip"),"journal paper visuals missing");

assert.ok(html.includes("api.whatsapp.com/send?text"),"WhatsApp share button");
assert.ok(html.includes("property=\"og:image\""),"OG preview required");
assert.ok(html.includes("lexlearn-og.jpg")&&html.includes("lexlearn-x-transparent.svg"));
assert.ok(fs.existsSync("assets/lexlearn-og.jpg"));
assert.ok(read("assets/lexlearn-x-transparent.svg").includes("clear-paper"));
assert.ok(read("assets/lexlearn-public-pitch-en.pdf").startsWith("%PDF-1.4"),"downloadable public PDF required");
assert.ok(js.includes('localStorage.setItem("lexlearn_conference_language"'),"remember language");
assert.ok(css.includes("max-width:690px"),"mobile breakpoint required");
for(const phrase of ["تعاون أكاديمي قابل للقياس","نقترح تجربة أكاديمية محددة بإشراف جامعي لقياس الأثر قبل التوسع","التحقق من الأثر التعليمي سيتم عبر التجربة المقترحة"]){
  assert.ok(js.includes(phrase),"approved Arabic conference copy missing: "+phrase);
}
assert.ok(read("assets/lexlearn-navigation.css").includes(".ll-back-inline .ll-back-label{display:inline!important}"),"mobile back control must show visible label");
assert.ok(read("assets/conference.css").includes(".pilot > div:first-child h2"),"pilot heading responsive treatment missing");

assert.ok(go.includes("../conference.html")&&go.includes("window.location.replace("),"permanent QR redirect required");
assert.ok(pub.includes('"go/index.html"')&&pub.includes('"conference.html"'),"release artifact must include routes");
assert.ok(pub.includes('"lexlearn-go-qr.svg"')&&pub.includes('"conference-pdf.js"'),"release must ship PDF and QR assets");
assert.ok(html.includes('id="printQR"')&&html.includes('assets/lexlearn-go-qr.svg'),"printable /go QR link missing");
assert.ok(html.includes('assets/conference-pdf.js')&&js.includes('lexlearnDownloadPublicDeck("ar")'),"direct Arabic PDF download missing");
assert.ok(read("assets/conference-pdf.js").includes('application/pdf'),"Arabic PDF generator not included");

assert.ok(!ar.includes("conferencePromo")&&!en.includes("conferencePromo"),"no duplicate event strip above the official logo");
assert.ok(!arLogic.includes("اكتشف LexLearn | Explore LexLearn")&&!en.includes("اكتشف LexLearn | Explore LexLearn"),"remove duplicate Explore button from both homes");
assert.ok(!read("student.html").includes("conferencePromo")&&!read("student-en.html").includes("conferencePromo"),"no promo in training");

assert.ok(html.includes('assets/lexlearn-navigation.js')&&html.includes('assets/lexlearn-navigation.css'),"conference route navigation must load");
const nav=read("assets/lexlearn-navigation.js"),navCss=read("assets/lexlearn-navigation.css");
for(const key of ["toStudent","toUniversity","toInvestor","Opening the student demo","جاري عرض خطة التعاون الجامعي","lexlearnBack","lexlearnTransition"])assert.ok(nav.includes(key),"visitor navigation missing "+key);
assert.ok(nav.includes('!\\/go')||nav.includes('go\\/?'),"back navigation must avoid /go redirect loops");
assert.ok(navCss.includes("prefers-reduced-motion")&&navCss.includes("safe-area-inset-top"),"accessibility and iPhone back controls required");
assert.ok(js.includes('flow4:"نقوّي المهارة الأضعف بالمهارة الأقوى"'),"flow must explicitly build on the stronger skill in Arabic");
assert.ok(js.includes('flow4:"Strengthen the weaker skill using the stronger one"'),"flow must explicitly build on the stronger skill in English");
assert.ok(html.includes('data-t="flow4">Strengthen the weaker skill using the stronger one'),"English default must match dynamic copy");
for(const page of ["showcase.html","showcase-en.html","program.html","program-en.html","student.html","student-en.html"]) {
  assert.ok(read(page).includes("lexlearn-navigation.js"),"back arrow missing in "+page);
}
assert.ok(pub.includes('"lexlearn-navigation.js"')&&pub.includes('"lexlearn-navigation.css"'),"back navigation assets must ship");
assert.ok(pub.includes('fs.writeFileSync(full,html)'),"build must include back navigation for subpages");

assert.ok(fs.existsSync("showcase.html"),"demo link unchanged");

/* Simulate language controls without external browser scripts or tracking. */
const vm=require("node:vm");
const nodes=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{id,href:"",attrs:{},handlers:{},
 addEventListener(type,fn){this.handlers[type]=fn;},
 setAttribute(key,val){this.attrs[key]=val;},
 removeAttribute(key){delete this.attrs[key];}
});return nodes.get(id);}
const translatable=["heroTitle","skill1","skill2","skill3","skill4","skill5","founderName","download"]
 .map(k=>({key:k,textContent:"",getAttribute(){return this.key;}}));
const language={lang:"en",dir:"ltr"},doc={
 documentElement:language,title:"",
 getElementById:node,
 querySelectorAll(selector){return selector==="[data-t]"?translatable:[];}
};
const store=new Map();
vm.runInNewContext(js,{document:doc,window:{},localStorage:{
 getItem:key=>store.get(key)||null,setItem:(key,val)=>store.set(key,val)
},encodeURIComponent,console});
assert.equal(language.lang,"en");
assert.equal(translatable.find(x=>x.key==="skill5").textContent,"Exam answer structure");
node("langAR").handlers.click();
assert.equal(language.lang,"ar");assert.equal(language.dir,"rtl");
assert.equal(translatable.find(x=>x.key==="skill5").textContent,"بناء الإجابة الامتحانية");
assert.equal(translatable.find(x=>x.key==="founderName").textContent,"د. أحمد فؤاد الفقي");
assert.ok(node("studentCard").href.startsWith("showcase.html"));
assert.equal(store.get("lexlearn_conference_language"),"ar");
node("langEN").handlers.click();
assert.equal(language.lang,"en");assert.equal(language.dir,"ltr");
assert.ok(node("studentCard").href.startsWith("showcase-en.html"));
assert.ok(node("downloadDeck").href.endsWith("lexlearn-public-pitch-en.pdf"));


/* Three research-grounded themes; short original editorial sentences,
   shuffled once per cycle and rendered in two separate lines. */
const linesCode=read("assets/lexlearn-learning-lines.js");
assert.ok(html.includes("assets/lexlearn-learning-lines.js"),"conference must load quote bank before navigation");
assert.ok(html.indexOf("assets/lexlearn-learning-lines.js")<html.indexOf("assets/lexlearn-navigation.js"),"quote bank must load before transition");
assert.ok(ar.includes("assets/lexlearn-learning-lines.js")&&en.includes("assets/lexlearn-learning-lines.js"),"home splash must load quote bank in both languages");
assert.ok(ar.includes('class="lexIntroQuote"')&&en.includes('class="lexIntroQuote"'),"home splash quote slot missing");
assert.ok(read("assets/brand-intro.js").includes("paintHomeQuote"),"home splash must display randomized quote");
assert.ok(nav.includes("LEXLEARN_LEARNING_LINES.render"),"visitor transition must display randomized phrase");
assert.ok(!nav.includes("مستوحى من أبحاث التعلّم والاسترجاع"),"remove generic inspiration phrase");
assert.ok(pub.includes('"lexlearn-learning-lines.js"'),"publish bilingual learning quote asset");
assert.ok(linesCode.includes("Original editorial paraphrases, not verbatim quotations"),"avoid misattributing original editorial lines as direct quotations");
const quoteStorage=new Map();
const quoteWin={sessionStorage:{getItem:k=>quoteStorage.get(k)||null,setItem:(k,v)=>quoteStorage.set(k,v)}};
vm.runInNewContext(linesCode,{window:quoteWin});
const bank=quoteWin.LEXLEARN_LEARNING_LINES;
assert.equal(bank.count,27,"must ship 27 short, bilingual paired learning lines");
const seen=new Set(),categories=new Set();
let lastPhrase="";
for(let i=0;i<bank.count;i++){
  const p=bank.next();
  assert.equal(p.ar.length,2);assert.equal(p.en.length,2);
  assert.ok(p.ar.every(Boolean)&&p.en.every(Boolean),"quotes must not have empty fragments");
  seen.add(p.ar.join(" / "));categories.add(p.category);lastPhrase=p.ar.join(" / ");
}
assert.equal(seen.size,27,"do not repeat until all quotes appear");
assert.equal(categories.size,3,"include understanding, retrieval and combined skills");
assert.notEqual(bank.next().ar.join(" / "),lastPhrase,"do not repeat the immediate previous phrase");


/* Investor-only attributed ideas, official 2027 conference mark and mobile entry. */
assert.ok(html.includes('id="investorQuote"')&&html.includes("assets/lexlearn-investor-quotes.js"),"investor quote must be visible with source in investor section");
assert.ok(html.indexOf("assets/lexlearn-investor-quotes.js")<html.indexOf("assets/lexlearn-navigation.js"),"investor quote bank must load first");
assert.ok(nav.includes('config.message === "toInvestor"')&&nav.includes("LEXLEARN_INVESTOR_QUOTES.render"),"only investor path gets investor copy");
assert.ok(nav.includes("investorQuotePanel")&&nav.includes("activeInvestorQuote"),"investor page must preserve the selected quote");
assert.ok(nav.includes("investorMode ? 1800 : 720"),"investor-only transition should permit reading without slowing student demo");
const investorCode=read("assets/lexlearn-investor-quotes.js");
assert.ok(pub.includes('"lexlearn-investor-quotes.js"'),"investor code must ship in public build");
assert.ok(investorCode.includes("Source · adapted insight")&&investorCode.includes("المصدر الأصلي · صياغة بالمعنى"),"must distinguish summaries from literal statements");
const ivStorage=new Map(), ivContext={sessionStorage:{getItem:k=>ivStorage.get(k)||null,setItem:(k,v)=>ivStorage.set(k,v)}};
vm.runInNewContext(investorCode,{window:ivContext});
const ivBank=ivContext.LEXLEARN_INVESTOR_QUOTES;
assert.equal(ivBank.count,10,"ten source-backed investor quotes required");
let prevAuthor=null;
const seenInvestor=new Set(),authorsInvestor=new Set();
for(let i=0;i<ivBank.count;i++){
  const q=ivBank.next();
  assert.equal(q.en.length,2);assert.equal(q.ar.length,2);
  assert.ok(q.en.every(Boolean)&&q.ar.every(Boolean));
  assert.ok(q.source.startsWith("https://"),"verify each investor saying links to an original source");
  assert.notEqual(q.name,prevAuthor,"avoid same investor on consecutive quotes");
  seenInvestor.add(q.en.join(" / "));authorsInvestor.add(q.name);prevAuthor=q.name;
}
assert.equal(seenInvestor.size,10,"investor quotes must rotate without repeats");
assert.ok(authorsInvestor.size>=6,"perspectives must come from varied business leaders");
assert.notEqual(ivBank.next().name,prevAuthor,"do not repeat business leader at deck boundary");
assert.ok(en.includes('class="wsqEventCTA"')&&ar.includes('class="wsqEventCTA"'),"Web Summit homepage needs a static dedicated conference entry in both languages");
assert.ok(en.includes("qatar.websummit.com/wp-media/2026/02/QAT27_positive-768x139.png"),"home button must use the official unchanged 2027 logo");
assert.ok(read("assets/conference-promo.css").includes(".wsqEventCTA"),"branded conference entry must have responsive styles");
assert.ok(ar.includes("assets/v9-law.js?v=20261014.14"),"publish refreshed Arabic homepage");
assert.ok(ar.includes("wsqHomeFeature")&&en.includes("wsqHomeFeature"),"2027 conference entry must be visible without waiting for dynamic app scripts");
assert.ok(!arLogic.includes('class="wsqEventCTA"'),"conference button should not duplicate in the Arabic app");
assert.ok(ar.includes("QAT27_positive-768x139.png")&&en.includes("QAT27_positive-768x139.png"),"both conference buttons need the official logo");


/* Web Summit visitors arrive via QR, usually on a narrow phone. */
assert.ok(!html.includes('id="science"')&&!html.includes("researchBasis"),"no standalone research section in conference");
assert.ok(html.includes('class="promoMobile"')&&html.includes('data-t="promoShort"'),"mobile banner must be concise");
assert.ok(html.includes('class="deckSwipeHint"')&&html.includes('data-t="deckSwipeHint"'),"phone visitors must know pitch cards swipe");
assert.ok(js.includes('promoShort:"LexLearn · Web Summit Qatar 2027 · ALPHA"'),"compact event identity in both languages");
assert.ok(js.includes('deckSwipeHint:"مرّر أفقيًا لاستعراض بقية الشرائح ↔"'),"Arabic swipe hint required");
assert.ok(css.includes("Mobile-first conference refinements for visitors"),"conference needs phone-first layout review");
for(const marker of [".skills article{display:grid",".slides{display:flex",".path{min-height:0",".demoInfo .button{width:100%",".promoMobile{display:block","scroll-margin-top:115px"])
  assert.ok(css.includes(marker),"missing mobile readability rule "+marker);
assert.ok(nav.includes('isConference?"الرئيسية":"رجوع"')&&nav.includes('isConference?"Home":"Back"'),"conference button must say الرئيسية / Home, subpage button remains رجوع / Back");
assert.ok(nav.includes('loc.assign(isArabic() ? "index.html" : "index-en.html")'),"conference Home always opens language-matched home");
assert.ok(!nav.includes("if (isConference && loc.hash)"),"Home must not merely scroll to visitor cards");
assert.ok(navCss.includes("Keep quote transitions usable on small and short iPhones"),"mobile transition must not clip quotations");
assert.ok(pub.includes("20261014.11"),"public build must invalidate old navigation styles across routes");

/* Verify conference Home action after arriving via /go, in both languages. */
const navMockButtons=Object.create(null);
function navFakeElement(){
  const listeners={};
  return {listeners, title:"", textContent:"", innerHTML:"", hidden:false,
    classList:{add(){},remove(){},toggle(){}},
    setAttribute(){},addEventListener(type,cb){listeners[type]=cb;},
    querySelector(){return {textContent:"",addEventListener(){}};}
  };
}
const homeButton=navFakeElement(), toolbarMock={insertBefore(node){assert.equal(node,homeButton);}};
const navDoc={
 documentElement:{lang:"ar"},
 referrer:"https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/go/",
 createElement(){return homeButton;},
 querySelector(q){return q===".site-header .top-actions"?toolbarMock:null;},
 getElementById(id){
  if(id==="investorQuote")return null;
  if(!navMockButtons[id])navMockButtons[id]=navFakeElement();
  return navMockButtons[id];
 },
 body:{appendChild(){}},
 addEventListener(){}
};
let homeDestination="";
const navWindow={
 location:{pathname:"/lexlearn-ai-demo/conference.html",origin:"https://ahmadfoad361-sketch.github.io",search:"",hash:"#vision",assign(path){homeDestination=path;}},
 history:{length:2,back(){throw Error("Home must not call history.back");}},
 addEventListener(){}
};
vm.runInNewContext(nav,{document:navDoc,window:navWindow,clearTimeout,setTimeout});
assert.equal(homeButton.title,"الرئيسية");
homeButton.listeners.click();
assert.equal(homeDestination,"index.html");
homeDestination="";
navDoc.documentElement.lang="en";
navMockButtons.langEN.listeners.click();
assert.equal(homeButton.title,"Home");
homeButton.listeners.click();
assert.equal(homeDestination,"index-en.html");


// The conference's OFFICIAL logo must be the first visible homepage brand:
// no promo strip, utility header, or duplicate Explore LexLearn button above it.
const homeCss=read("assets/quality.css"), promoCss=read("assets/conference-promo.css");
for(const home of [ar,en]){
  assert.equal((home.match(/class="wsqEventCTA"/g)||[]).length,1,"one coherent event card per homepage");
  assert.ok(home.includes('class="wsqLogoLink"'),"official logo must itself link to conference");
  assert.ok(!home.includes('class="wsqLangSwitch"'),"language switch must no longer sit under the conference logo");
  assert.ok(home.includes('class="wsqEventAction"'),"conference entry needs clear action");
  assert.ok(!home.includes("wsqEventArrow"),"no arrow square");
  assert.ok(!home.includes("homeUtilityBar"),"no bar above conference logo");
  assert.ok(!home.includes('class="conferencePromo"'),"no duplicate event strip");
  assert.ok(!home.includes("conferenceDiscoverCTA"),"no repeated Explore LexLearn button");
  assert.ok(home.includes("assets/conference-promo.css?v=20261014.14"),"refresh full-width event presentation");
  assert.ok(home.includes('href="conference.html"'),"logo and card must open conference");
  assert.ok(home.includes("qatar.websummit.com/wp-media/2026/02/QAT27_positive-768x139.png"),"unchanged official Web Summit logo");
  assert.ok(home.includes('class="wsqEventName"'),"separate event/program line from the main heading to prevent RTL/LTR collisions");
}
const enEvent=en.indexOf('<div class="wsqHomeFeature"'),enHeader=en.indexOf('<header class="en-top">');
const arEvent=ar.indexOf('<div class="wsqHomeFeature"'),arApp=ar.indexOf('<div id="lawApp">');
assert.ok(enEvent>=0&&enHeader>enEvent,"Web Summit logo must precede all English home branding");
assert.ok(arEvent>=0&&arApp>arEvent,"Web Summit logo must precede dynamically-rendered Arabic header");
assert.ok(arLogic.includes("lexHomeLangCurrent")&&arLogic.includes("العربية")&&arLogic.includes("English"),"dynamic Arabic LexLearn header must provide both language choices");
assert.ok(en.includes('title="العربية"')&&en.includes('title="English"'),"English LexLearn header must provide both language choices");
assert.ok(promoCss.includes(".wsqEventBrand")&&promoCss.includes(".wsqLogoLink>img"),"event logo must own large top-row layout");
assert.ok(promoCss.includes(".lexHomeLang{")&&!promoCss.includes(".wsqLangSwitch{"),"language switch must be beside LexLearn instead of event logo");
assert.ok(promoCss.includes(".wsqHomeFeature .wsqEventCTA"),"mobile hero uses a single presentation structure");
assert.ok(promoCss.includes("@media(max-width:760px)"),"full-width responsive event hero required");
assert.ok(ar.includes("افتح صفحة المؤتمر")&&en.includes("Open conference page"),"conference CTA must be localized");
assert.ok(homeCss.includes(".qualityHero .qualityActions,.en-hero .actions{display:grid!important;grid-template-columns:minmax(0,1fr)!important"),"functional actions must remain one-column on mobile");
assert.ok(homeCss.includes("width:100%!important;max-width:100%;min-width:0;min-height:53px!important"),"action hit areas remain large");
assert.ok(arLogic.includes('class="qualityActions"')&&arLogic.includes('class="qualityDemoAction"'),"Arabic functional hero actions intact");
assert.ok(en.includes('class="actions"')&&en.includes('class="qualityDemoAction"'),"English functional hero actions intact");
assert.ok(!arLogic.includes("conferenceDiscoverCTA")&&!en.includes("conferenceDiscoverCTA"),"no duplicated navigation to conference");
assert.ok(en.includes('<div class="en-brand"><nav class="lexHomeLang"'),"English small E/ع switch sits to physical left of LexLearn mark");
assert.ok(arLogic.includes('class="lexHomeLang"'),"Arabic E/ع switch is inside LexLearn brand row");
assert.ok(arLogic.indexOf('class="lexHomeLang"')<arLogic.indexOf('class="v9-topactions"'),"Arabic language navigation must precede app action widgets");
assert.ok(promoCss.includes(".wsqEventCTA{")&&promoCss.includes("border-top:4px solid #8A1F39"),"conference entry returns to a separate bordered first-style card");
assert.ok(ar.includes('<strong>مشاركتنا في المؤتمر</strong>'),"Arabic conference heading must not interleave English words");
assert.ok(ar.includes('class="wsqEventName" lang="en" dir="ltr"'),"isolate the LTR product/program name beneath Arabic title");
assert.ok(ar.includes("خطة التعاون الجامعي")&&en.includes("proposed university pilot"),"keep conference project/pilot meaning in both languages");
assert.ok(promoCss.includes(".wsqLogoLink>img")&&promoCss.includes(".wsqEventBrand"),"official logo still leads the homepage");


console.log("conference landing release test PASS");
