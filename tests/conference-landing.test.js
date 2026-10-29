const fs=require("node:fs"),assert=require("node:assert/strict");
const read=(file)=>fs.readFileSync(file,"utf8");
const html=read("conference.html"),js=read("assets/conference.js"),css=read("assets/conference.css");
const go=read("go/index.html"),pub=read("scripts/build-public.js"),ar=read("index.html"),
en=read("index-en.html"),arLogic=read("assets/v9-law.js");
assert.match(html,/<html lang="en" dir="ltr">/,"conference defaults to English");
assert.ok(html.indexOf('class="paths"')<html.indexOf('id="problem"'),"visitor pathways must be above long text");
for(const id of ["studentCard","pilot","vision","how","demo","deck","contact","langEN","langAR","downloadDeck"])assert.ok(html.includes('id="'+id+'"'),"missing "+id);
for(const skill of ["Recall","Understanding","Application","Legal precision","Exam answer structure"])assert.ok(js.includes(skill),"missing exact English skill "+skill);
for(const skill of ["الحفظ","الفهم","التطبيق","الدقة القانونية","بناء الإجابة في الامتحان"])assert.ok(js.includes(skill),"missing exact Arabic skill "+skill);
for(const phrase of ["Working beta","AI analysis of written answers: in progress","Learning impact not yet proven","30–60","6–8","Dr Ahmed Fouad El Feky","Founder & CEO","Qatari law faculties"])assert.ok(js.includes(phrase)||html.includes(phrase),"required public copy: "+phrase);
for(const forbidden of ["HBKU","exam performance","QAR","USD","$49","Google Ads","gtag(","fbq(","pixel"])assert.ok(!html.includes(forbidden)&&!js.includes(forbidden),"forbidden public item: "+forbidden);
assert.ok(html.includes('<form id="leadForm"')&&html.includes('id="leadName"')&&html.includes('id="leadRole"')&&html.includes('id="leadContact"'),"conference contact form must contain opted-in contact fields");
assert.ok(!/<script[^>]+src="https?:/i.test(html),"no third party scripts");
assert.ok(html.includes("mailto:Ahmadfoad361@gmail.com"),"confirmed email must be a working mailto link");

assert.ok(!html.includes('id="science"')&&!html.includes("researchBasis")&&!html.includes("researchCards"),"scientific sources should appear in transition quotes, not as a standalone presentation section");
assert.ok(!js.includes("scienceEyebrow:")&&!js.includes("scienceHeading:"),"unused research-section translations should be removed");
assert.ok(!css.includes(".researchCards")&&!css.includes(".researchBasis"),"no obsolete research-card styling in main page");
assert.ok(!html.includes('class="honesty"')&&html.includes('class="evidenceNote"'),"avoid duplicate investor status panel but keep clear learning-impact uncertainty");
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
assert.ok(!/\.honeypot\s*\{[^}]*left\s*:\s*-\d{3,}px/i.test(css),"Honeypot must never push RTL canvas thousands of pixels offscreen");
assert.ok(/\.honeypot\s*\{[^}]*clip-path:inset\(50%\)/.test(css),"Keep anti-spam honeypot visually hidden without layout overflow");
for(const phrase of ["تعاون أكاديمي قابل للقياس","تُنفَّذ التجربة بالتعاون مع الجامعة، ويُحدَّد تصميم القياس بالتشاور معها، وتتولى LexLearn المتابعة وإعداد التقرير.","التحقق من الأثر التعليمي سيتم عبر التجربة المقترحة"]){
  assert.ok(js.includes(phrase),"accurate Arabic conference copy missing: "+phrase);
}
assert.ok(read("assets/lexlearn-navigation.css").includes(".ll-back-inline .ll-back-label{display:inline!important}"),"mobile back control must show visible label");
assert.ok(read("assets/conference.css").includes(".pilot > div:first-child h2"),"pilot heading responsive treatment missing");

assert.ok(go.includes("../conference.html")&&go.includes("window.location.replace("),"permanent QR redirect required");
assert.ok(!go.includes('<link rel="canonical"')&&!go.includes("https://ahmadfoad361-sketch.github.io"),"printed QR redirect must not canonicalize to the old preview hostname");
const leadServer=read("supabase/functions/conference-lead/index.ts");
assert.ok(leadServer.includes('Deno.env.get("LEX_ALLOWED_ORIGINS")'),"conference lead function must support explicit approved production origins");
assert.ok(leadServer.includes('Deno.env.get("RESEND_API_KEY")')&&leadServer.includes('Deno.env.get("LEAD_NOTIFY_TO")')&&leadServer.includes('Deno.env.get("LEAD_NOTIFY_FROM")'),"contact form must check configured staff notification before accepting leads");
assert.ok(leadServer.includes('siteKey&&secret&&serverKey&&notifyReady'),"must fail closed when no owner delivery channel is ready");
assert.ok(!leadServer.includes("enabled:Boolean(siteKey&&secret&&serverKey)"),"do not accept unobservable leads");
assert.ok(leadServer.includes('notification_status:"failed"'),"revoked notification configuration must flag a saved lead for retry");

assert.ok(leadServer.includes('!allowedOrigins().has(origin)'),"conference form must reject unknown origins");
assert.ok(leadServer.includes('check.hostname===hostname'),"Turnstile must verify the requesting approved site hostname");
assert.ok(leadServer.includes('new URL(origin).hostname'),"Turnstile hostname must be derived from the authorized origin");
assert.ok(!leadServer.includes('check.hostname==="ahmadfoad361-sketch.github.io"'),"Turnstile cannot be locked to GitHub Pages after custom-domain launch");
assert.ok(pub.includes('"go/index.html"')&&pub.includes('"conference.html"'),"release artifact must include routes");
assert.ok(pub.includes('"lexlearn-go-qr.svg"')&&pub.includes('"conference-pdf.js"'),"release must ship PDF and QR assets");
assert.ok(!html.includes('id="printQR"')&&pub.includes('"lexlearn-go-qr.svg"'),"visitor page must not show owner-only QR download, but published QR asset stays available");
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
assert.ok(js.includes('flow4:"نتدرّب انطلاقًا من نقاط قوتك"'),"flow must explicitly build on the stronger skill in Arabic");
assert.ok(js.includes('flow4:"Build the next skill from a strength"'),"flow must explicitly build on the stronger skill in English");
assert.ok(html.includes('data-t="flow4">Build the next skill from a strength'),"English default must match dynamic copy");
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
const translatable=["heroTitle","skill1","skill2","skill3","skill4","skill5","founderName","download","promo","promoShort","pilotLexLearnTitle","pilotLexLearnRole","pilotOffer","pilotBody","pilotEthics"]
 .map(k=>({key:k,textContent:"",getAttribute(){return this.key;}}));
const language={lang:"en",dir:"ltr"},doc={
 documentElement:language,title:"",
 getElementById:node,
 querySelectorAll(selector){if(selector.startsWith("#leadForm .leadFields"))return [node("leadFields"),node("leadActions"),node("leadPrivacy")];return selector==="[data-t]"?translatable:[];}
};
const store=new Map();
vm.runInNewContext(js,{document:doc,window:{},localStorage:{
 getItem:key=>store.get(key)||null,setItem:(key,val)=>store.set(key,val)
},encodeURIComponent,console});
assert.equal(language.lang,"en");
assert.equal(node("leadFields").hidden,true,"unavailable secure intake must not invite users to fill an unusable form");
assert.equal(node("leadActions").hidden,true,"hide the unavailable submit CTA while preserving working contact links");
assert.equal(node("leadSubmit").disabled,true,"the hidden submit action must remain blocked");
assert.ok(html.includes('class="businessModel"')&&html.includes('data-t="businessNote"'),"commercial approach must be explicitly labelled proposed");
assert.equal(translatable.find(x=>x.key==="skill5").textContent,"Exam answer structure");
assert.match(node("leadStatus").textContent,/WhatsApp/,"language rendering must retain the current unavailable-contact state");
node("langAR").handlers.click();
assert.equal(language.lang,"ar");assert.equal(language.dir,"rtl");
assert.equal(translatable.find(x=>x.key==="pilotLexLearnRole").textContent,"تتولى LexLearn متابعة التجربة وتقييم نتائجها.");
assert.equal(translatable.find(x=>x.key==='pilotOffer').textContent,'تجربة مجانية محدودة المدة، بلا التزام بالشراء.');
assert.ok(translatable.find(x=>x.key==='pilotBody').textContent.includes('يُحدَّد تصميم القياس بالتشاور معها'));
assert.ok(translatable.find(x=>x.key==='pilotEthics').textContent.includes('التقارير المسلَّمة للجامعة'));
assert.equal(translatable.find(x=>x.key==="skill5").textContent,"بناء الإجابة في الامتحان");
assert.equal(translatable.find(x=>x.key==="founderName").textContent,"د. أحمد فؤاد الفقي");
assert.ok(node("studentCard").href.startsWith("showcase.html"));
assert.equal(store.get("lexlearn_conference_language"),"ar");

const arPromo=translatable.find(x=>x.key==="promo");
const arPromoShort=translatable.find(x=>x.key==="promoShort");
assert.equal(arPromo.textContent,"\u2066LexLearn\u2069 في مؤتمر \u2066Web Summit Qatar 2027\u2069 — اكتشف الرؤية وجرّب المنصة وتعرّف على التجربة الجامعية.");
assert.equal(arPromoShort.textContent,"\u2066LexLearn\u2069 · \u2066Web Summit Qatar 2027\u2069 · نسخة \u2066ALPHA\u2069");

node("langEN").handlers.click();
assert.equal(translatable.find(x=>x.key==="pilotLexLearnRole").textContent,"LexLearn follows the pilot and evaluates its results.");
assert.equal(translatable.find(x=>x.key==='pilotOffer').textContent,'A free, limited-duration pilot with no purchase commitment.');
assert.ok(translatable.find(x=>x.key==='pilotBody').textContent.includes('The measurement design is agreed jointly'));
assert.ok(translatable.find(x=>x.key==='pilotEthics').textContent.includes('academic supervisor follow-up of individual students'));


/* Open direct Arabic URL with an English saved preference: URL controls initial language. */
vm.runInNewContext(js,{
 document:doc,window:{location:{search:"?lang=ar&review=fresh"}},
 localStorage:{getItem:()=> "en",setItem:()=>{}},encodeURIComponent,console
});
assert.equal(language.lang,"ar","?lang=ar must open the fresh pilot in Arabic regardless of old saved preference");
assert.equal(translatable.find(x=>x.key==="pilotLexLearnRole").textContent,"تتولى LexLearn متابعة التجربة وتقييم نتائجها.");
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


/* Investor messages are original; no unverified personal endorsement or consent. */
assert.ok(html.includes('id="investorQuote"')&&html.includes("assets/lexlearn-investor-quotes.js"),"investor section needs independent perspectives");
assert.ok(nav.includes('config.message === "toInvestor"')&&nav.includes("LEXLEARN_INVESTOR_QUOTES.render"),"investment microcopy only in investor route");
const investorCode=read("assets/lexlearn-investor-quotes.js");
assert.ok(pub.includes('"lexlearn-investor-quotes.js"'),"ship investor microcopy");
assert.ok(investorCode.includes("No third-party person's name"),"no implied celebrity endorsement");
for(const name of ["Reid Hoffman","John Doerr","Jeff Bezos","Peter Thiel","Ray Dalio","Paul Graham"]){
 assert.ok(!investorCode.includes(name),"personal name cannot be used without verified approval: "+name);
}
const ivStorage=new Map(),ivContext={sessionStorage:{getItem:k=>ivStorage.get(k)||null,setItem:(k,v)=>ivStorage.set(k,v)}};
vm.runInNewContext(investorCode,{window:ivContext});
const ivBank=ivContext.LEXLEARN_INVESTOR_QUOTES;
assert.equal(ivBank.count,10);
const uniqueInvestor=new Set();
for(let i=0;i<ivBank.count;i++){
 const idea=ivBank.next();
 assert.equal(idea.ar.length,2);assert.equal(idea.en.length,2);
 uniqueInvestor.add(idea.en.join(" "));
}
assert.equal(uniqueInvestor.size,10,"all ten original insights should rotate without repeats");
assert.ok(en.includes('class="wsqEventCTA"')&&ar.includes('class="wsqEventCTA"'),"Web Summit homepage needs a static dedicated conference entry in both languages");
assert.ok(en.includes("qatar.websummit.com/wp-media/2026/02/QAT27_positive-768x139.png"),"home button must use the official unchanged 2027 logo");
assert.ok(read("assets/conference-promo.css").includes(".wsqEventCTA"),"branded conference entry must have responsive styles");
assert.ok(ar.includes("assets/v9-law.js?v=20261029.instructor1"),"publish refreshed Arabic homepage");
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
assert.ok(pub.includes("20261015.3"),"public build must invalidate old navigation styles across routes");

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
 querySelectorAll(){return [];},
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
  assert.ok(home.includes('class="wsqEventLogo"'),"official conference logo must be inside the single card link");
  assert.ok(!home.includes('class="wsqLangSwitch"'),"language switch must no longer sit under the conference logo");
  assert.ok(home.includes('class="wsqEventAction"'),"conference entry needs clear action");
  assert.ok(!home.includes("wsqEventArrow"),"no arrow square");
  assert.ok(!home.includes("homeUtilityBar"),"no bar above conference logo");
  assert.ok(!home.includes('class="conferencePromo"'),"no duplicate event strip");
  assert.ok(!home.includes("conferenceDiscoverCTA"),"no repeated Explore LexLearn button");
  assert.ok(home.includes("assets/conference-promo.css?v=20261014.20"),"refresh fixed RTL-safe left-alignment stylesheet");
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
assert.ok(promoCss.includes(".wsqEventLogo{")&&promoCss.includes("flex-direction:column"),"mobile event logo must lead inside its card");
assert.ok(promoCss.includes(".lexHomeLang{")&&!promoCss.includes(".wsqLangSwitch{"),"language switch must be beside LexLearn instead of event logo");
assert.ok(promoCss.includes(".wsqEventCTA{")&&promoCss.includes("width:min(100%,720px)"),"mobile hero uses one bordered event card");
assert.ok(promoCss.includes("@media(max-width:760px)"),"full-width responsive event hero required");
assert.ok(ar.includes("اكتشف مشاركتنا في المؤتمر")&&en.includes("Explore our conference participation"),"conference CTA must be localized");
assert.ok(homeCss.includes(".qualityHero .qualityActions,.en-hero .actions{display:grid!important;grid-template-columns:minmax(0,1fr)!important"),"functional actions must remain one-column on mobile");
assert.ok(homeCss.includes("width:100%!important;max-width:100%;min-width:0;min-height:53px!important"),"action hit areas remain large");
assert.ok(arLogic.includes('class="qualityActions"')&&arLogic.includes('class="qualityDemoAction"'),"Arabic functional hero actions intact");
assert.ok(en.includes('class="actions"')&&en.includes('class="qualityDemoAction"'),"English functional hero actions intact");
assert.ok(!arLogic.includes("conferenceDiscoverCTA")&&!en.includes("conferenceDiscoverCTA"),"no duplicated navigation to conference");
assert.ok(en.includes('<div class="en-topin"><nav class="lexHomeLang"'),"English small E/ع switch must be first, physically to the left of LexLearn brand");
assert.ok(arLogic.includes("lexHomeLang"),"Arabic E/ع switch belongs in LexLearn header row");
assert.ok(arLogic.indexOf("lexHomeLang")>arLogic.indexOf("v9-topactions"),"Arabic language navigation must be last, physically to the left of LexLearn brand");
assert.ok(promoCss.includes(".wsqEventCTA{")&&promoCss.includes("border-top:5px solid #8A1F39"),"conference entry returns to the first-style bordered card");
assert.ok(ar.includes('<bdi lang="en" dir="ltr">LexLearn</bdi>')&&ar.includes('<bdi lang="en" dir="ltr">Web Summit Qatar 2027</bdi>'),"Arabic participation headline must isolate Latin brand names");
assert.ok(ar.includes('class="wsqEventName" lang="en" dir="ltr"'),"isolate the LTR product/program name beneath Arabic title");
assert.ok(ar.includes("خطة التعاون الجامعي")&&en.includes("proposed university pilot"),"keep conference project/pilot meaning in both languages");
assert.ok(promoCss.includes(".wsqEventLogo{")&&promoCss.includes(".wsqHomeFeature{"),"official Web Summit logo still leads the homepage inside the card");
for(const home of [ar,en]){
  const anchor=home.indexOf('<div class="wsqEventCTA"');
  const img=home.indexOf('<img class="wsqEventLogo"',anchor);
  const copy=home.indexOf('<span class="wsqEventCopy">',anchor);
  const close=home.indexOf('</a>',anchor);
  assert.ok(anchor>=0&&img>anchor&&copy>img&&close>copy,"the official logo, text and CTA must be inside the same clickable card");
  assert.ok(home.indexOf('class="wsqHomeFeature"')<home.indexOf('class="wsqEventLogo"'),"event card is the first prominent home element");
  assert.equal((home.match(/class="wsqEventLogo"/g)||[]).length,1,"the event logo must never be duplicated above the card");
}
assert.ok(arLogic.includes('<nav class="lexHomeLang"')&&arLogic.indexOf('<nav class="lexHomeLang"')>arLogic.indexOf("v9-topactions"),"Arabic left-side language pill must be a sibling after the top action region");
assert.ok(promoCss.includes(".v9-topin>.lexHomeLang")&&promoCss.includes(".en-topin>.lexHomeLang"),"small language control must anchor to LexLearn header row on both languages");




/* User mobile screenshot: language control must be at physical x≈12 px,
   NOT clustered beside the RTL LexLearn logo towards the centre. */
assert.ok(promoCss.includes("All-screen placement fixed to the SCREEN's physical left edge"),"explicit physical-left mobile positioning required");
assert.ok(promoCss.includes(".v9-topin,.en-topin{")&&promoCss.includes("position:relative!important"),"both header rails must be local positioning containers");
assert.ok(promoCss.includes(".v9-topin>.lexHomeLang,.en-topin>.lexHomeLang{"),"both page language buttons must anchor to the header rail");
assert.ok(promoCss.includes("left:calc(12px + env(safe-area-inset-left,0px))!important"),"button must use physical left, not RTL inline-start");
assert.ok(promoCss.includes("right:auto!important")&&promoCss.includes("transform:translateY(-50%)!important"),"no conflicting right positioning");
assert.ok(!promoCss.includes("inset-inline-end:auto!important")&&!promoCss.includes("inset-inline-start:auto!important"),"logical inset overrides physical left in RTL and pulls the language switch toward the centre");
const mobileLangRule=promoCss.slice(promoCss.indexOf(".v9-topin>.lexHomeLang,.en-topin>.lexHomeLang{",promoCss.indexOf("All-screen placement fixed to the SCREEN")));
assert.ok(mobileLangRule.includes("left:calc(12px + env(safe-area-inset-left,0px))!important"),"RTL safe left must be the final anchor");
assert.ok(promoCss.includes("@media(max-width:355px)")&&promoCss.includes("left:calc(10px + env(safe-area-inset-left,0px))!important"),"small iPhone switch must remain against physical left edge");

assert.ok(promoCss.includes("max-width:calc(100% - 106px)!important"),"reserve left-side space to avoid wordmark overlap");
assert.ok(promoCss.includes(".v9-topin>.v9-topactions:empty{display:none!important}"),"empty app actions must not affect the language rail");
assert.ok(arLogic.indexOf('<nav class="lexHomeLang"')>arLogic.indexOf("v9-topactions"),"Arabic language button must stay outside brand markup");
assert.ok(en.indexOf('<div class="en-topin"><nav class="lexHomeLang"')>=0,"English language switch remains separately positioned within header rail");


/* Conference design must announce the *named* participant, and adapt as one
   coherent promotional card across narrow phones, tablets and desktop. */
assert.ok(ar.includes("منصة <bdi")&&ar.includes("تشارك في <bdi"),"Arabic headline explicitly says LexLearn participates");
assert.ok(en.includes("LexLearn is joining Web Summit Qatar 2027"),"English headline explicitly announces participation");
assert.ok(ar.includes("يسعدنا الإعلان عن مشاركتنا ضمن برنامج ALPHA")&&en.includes("We are proud to be part of the ALPHA"),"genuine ALPHA participation remains transparent");
assert.ok(promoCss.includes("Conference participation: the SAME card adapts deliberately to desktop"),"card must have dedicated responsive design");
assert.ok(promoCss.includes("@media(min-width:1024px)")&&promoCss.includes("grid-template-columns:minmax(0,0.98fr) minmax(0,1.02fr)"),"desktop must use balanced two-column logo and announcement");
assert.ok(promoCss.includes("@media(min-width:761px) and (max-width:1023px)"),"tablet must have its own layout");
assert.ok(promoCss.includes("@media(max-width:760px)")&&promoCss.includes(".wsqEventLogo{width:min(100%,350px)"),"phone must show large official summit logo");
assert.ok(promoCss.includes("@media(max-width:355px)")&&promoCss.includes(".wsqParticipantName{font-size:26px}"),"small phone brand must not overflow");
assert.ok(promoCss.includes(".wsqEventDetails strong{overflow-wrap:break-word"),"bilingual participation headline must wrap rather than overlap");


/* 2027 conference QR first-fold usability requirements. */
assert.ok(html.includes('data-t="eyebrow">LEXLEARN · LEGAL LEARNING FOR STUDENTS'),"first fold must identify the product as education for law students");
assert.ok(html.includes("Assess your legal learning skills. Build on your strengths."),"default English title must immediately describe what LexLearn does");
assert.ok(js.includes('heroTitle:"قيّم مهاراتك القانونية، وطوّرها انطلاقًا من نقاط قوتك."'),"Arabic heading should explain student benefit in five seconds");
assert.ok(js.includes('eyebrow:"ليكس ليرن · منصة تعليمية لطلاب القانون"'),"Arabic eyebrow must identify education and avoid Latin punctuation");
assert.ok(js.includes('heroSubBefore:"يشخّص",heroSub:"نقاط قوتك في تعلّم القانون، ويقترح تدريبًا يساعدك على التقدّم خطوة خطوة."'),"Arabic subhead must use Modern Standard Arabic with brand isolated");
assert.equal((html.match(/class="pathNo"/g)||[]).length,3,"three numbered visitor choices required");
assert.ok(!html.includes('data-t="visitor"')&&!js.includes('visitor:"زائر"')&&!js.includes('visitor:"VISITOR"'),"remove redundant visitor label");
assert.equal((html.match(/class="pathGlyph" aria-hidden="true"><svg viewBox=/g)||[]).length,3,"replace each visitor emoji with a branded SVG (carousel arrows are separate)");
assert.ok(!html.includes('aria-hidden="true">↗</span>')&&!html.includes('aria-hidden="true">→</span>'),"no iPhone emoji arrows in visitor choices");
for(const key of ['studentCTA','univCTA','invCTA']){
  assert.ok(html.includes('class="pathCTA"><span data-t="'+key+'">'),"visitor CTA must be distinct from its SVG icon");
}
assert.ok(css.includes("Web Summit Qatar 2027 / ALPHA: first-screen visitor choice redesign"),"compact first-fold CSS required");
assert.ok(css.includes('grid-template-areas:"num title glyph" "num desc glyph" "num cta glyph"'),"cards must use mobile three-line compact grid");
assert.ok(css.includes('@media(max-height:700px) and (max-width:760px)'),"short phones need compact vertical spacing");
assert.ok(css.includes('.paths .pathGlyph svg{width:18px;height:18px'),"SVG arrows must use branded colour and constrained size");
assert.ok(nav.includes('back.hidden = true')&&nav.includes('back.setAttribute("aria-hidden", "true")'),"redundant conference Home button must be hidden from display and accessibility tree");
assert.ok(css.includes('.site-header #lexlearnBack[hidden]{display:none!important}'),"Home button must remain hidden despite shared styling");
assert.ok(js.includes('promoShort:"\\u2066LexLearn\\u2069 · \\u2066Web Summit Qatar 2027\\u2069 · نسخة \\u2066ALPHA\\u2069"'),"Arabic mobile strip must preserve official Latin brands and translate only connective text");
assert.ok(js.includes('promo:"\\u2066LexLearn\\u2069 في مؤتمر \\u2066Web Summit Qatar 2027\\u2069 — اكتشف الرؤية وجرّب المنصة وتعرّف على التجربة الجامعية."'),"Arabic desktop promo must retain official English names and readable RTL isolates");
assert.ok(!js.includes("ويب ساميت قطر ٢٠٢٧")&&!js.includes("ليكس ليرن · ويب ساميت"),"do not localize the event or project brand names in event strip");
assert.ok(js.includes('promoShort:"LexLearn · Web Summit Qatar 2027 · ALPHA"'),"English banner retains official event identity");
assert.ok(html.includes('title="Web Summit Qatar 2027 · ALPHA"')&&pub.includes('"go/index.html"')&&pub.includes('"lexlearn-go-qr.svg"'),"translated strip and permanent printed QR retained without visitor download");
assert.ok(html.includes("assets/conference.css?v=20261019.12")&&html.includes("assets/conference.js?v=20261029.instructor1"),"invalidate mobile first-fold UI cache");


/* Follow-up UX contract: conference, pilot, investor and student demo. */
assert.ok(html.includes('id="pathsReturn"')&&html.includes('href="#paths"'),"return to visitor paths must be accessible");
assert.ok(html.includes('data-t="returnPaths">Back to top</span>'),"floating return must have a visible localized label");
assert.ok(js.includes('backToPaths.setAttribute("aria-label",t.returnPaths)'),"return arrow accessible label must localize to Arabic and English");
assert.ok(html.includes('id="deckPrev"')&&html.includes('id="deckNext"')&&html.includes('id="deckDots"'),"carousel requires arrows and dots");
assert.ok(js.includes("slide.scrollIntoView")&&js.includes("rtl?r.right-rect.right:r.left-rect.left"),"RTL/LTR card scrolling must use physical direction correctly");
assert.ok(js.includes('carousel.dir=active==="ar"?"rtl":"ltr"'),"carousel should follow language switch");
assert.ok(css.includes("scroll-snap-type:x mandatory")&&css.includes(".deckDot[aria-current=true]"),"carousel swipe and active page dots must be styled");
assert.ok(html.includes('data-t="pilotStudentsHelp"')&&html.includes('data-t="pilotWeeksHelp"'),"explain both pilot figures");
assert.ok(js.includes("pilotStudentsHelp:")&&js.includes("pilotWeeksHelp:"),"both languages must explain the 30–60 students and 6–8 weeks");
assert.ok(!html.includes('id="formCTA"')&&html.includes('href="#leadForm"'),"investor and academic CTAs open opt-in contact form");
assert.ok(html.includes('class="button buttonSecondary" id="emailContact"')&&html.includes('class="shareIcon" id="waShare"'),"email secondary and link-sharing a compact icon");
assert.ok(html.includes('class="heroBrand" dir="ltr"')&&html.includes('id="heroSubLead"')&&js.includes('heroSubBefore:"يشخّص"'),"RTL headline displays formal verb before isolated LexLearn mark");
const sc=read("assets/showcase.js"),scEn=read("assets/showcase-en.js"),scCss=read("assets/showcase.css");
assert.doesNotThrow(()=>new vm.Script(sc,{filename:"assets/showcase.js"}),"Arabic demo JS must parse");
assert.doesNotThrow(()=>new vm.Script(scEn,{filename:"assets/showcase-en.js"}),"English demo JS must parse");
for(const code of [sc,scEn]){
 assert.ok(code.includes('class="demoGhost demoBack" href="conference.html#paths"'),"single header Back instead of Home+floating Back");
 assert.ok(!code.slice(code.indexOf("function chrome"),code.indexOf("function stage")).includes("نفهم طريقة تفكيرك، ونبني طريقك."),"remove tagline beneath demo logo");
 assert.ok(code.includes("اقرأ قاعدة قصيرة، ثم أجب عن 6 أسئلة واكتب ما تتذكره. بعدها جرّب 4 أنشطة تدريبية تناسب نتيجة محاولتك."),"short intro must be exact");
 assert.ok(code.includes("لا تحتاج إلى كتابة اسمك لتجربة الديمو."),"privacy line immediately below Start");
 assert.ok(code.includes('class="btn primary demoStart"'),"Start CTA enlarged");
}
assert.ok(nav.includes('showcase(?:-en)?'),"public demo must skip generic floating Back injection");
assert.ok(scCss.includes(".demoIntro .demoStart{display:block;width:min(100%,485px)")&&scCss.includes(".demoIntro .stageCard:before{display:none}"),"wide CTA and no abrupt colored stripe");
assert.ok(!read("showcase.html").includes("fonts.googleapis.com")&&!read("showcase-en.html").includes("fonts.googleapis.com"),"remove blocking remote Google fonts");
assert.ok(html.includes("assets/conference.css?v=20261019.12")&&html.includes("assets/conference.js?v=20261029.instructor1"),"bump CSS/JS cache");


/* Conversion UX: direct email and WhatsApp, without any visitor data collection. */
assert.ok(pub.includes('"conference.js"')&&!pub.includes('"conference-leads.js"'),"retired data-capture client must not be published");
assert.ok(!html.includes("conference-leads.js")&&!html.includes("conference-contact.js"),"a single language JS handles both conference languages");
assert.ok(html.includes('<form id="leadForm"')&&!js.includes("localStorage.setItem(\"lexlearn_lead\""),"contact form is present but no contact data is stored locally");
assert.ok(html.includes('id="leadConsent"')&&html.includes('id="leadTurnstile"')&&html.includes('id="leadStatus"'),"conference form visibly mounts opt-in consent, bot protection and delivery feedback");
assert.ok(html.indexOf('<form id="leadForm"')<html.indexOf('id="waBusiness"'),"lead form must be primary, above WhatsApp and email alternatives");
assert.ok(html.includes('id="leadSubmit" class="button buttonPrimary" data-t="leadSaveSubmit" disabled'),"no misleading direct-send button before secure intake is configured");
assert.ok(js.includes('setMode("unavailable")')&&js.includes('submitButton.disabled=!ready'),"unavailable security must disable the submit action, not misrepresent a WhatsApp draft as saved");
assert.ok(!js.includes('window.location.href="https://wa.me'),"form does not silently redirect to WhatsApp");

assert.ok(js.includes('leadMode!=="save"')&&js.includes("response.ok&&result.ok===true"),"secure form saves only when ready and only confirms on server success");
assert.ok(js.includes("functions/v1/conference-lead")&&js.includes("sendStoredLead")&&js.includes("turnstileToken"),"conference lead form uses secure server intake after Turnstile verification");
assert.ok(html.includes('class="button buttonSecondary" id="waBusiness"')&&html.includes("https://wa.me/201014408788"),"verified WhatsApp remains an alternative to the secure contact form");
assert.ok(html.includes('class="button buttonSecondary" id="emailContact"')&&html.includes('class="shareIcon" id="waShare"'),"email and share icon still available");
assert.ok(html.includes('href="mailto:Ahmadfoad361@gmail.com"'),"founder email is unchanged");
assert.ok(html.includes('class="founderPhoto"'),"founder card image slot remains");
assert.ok(read("privacy.html").includes("موافقة صريحة")&&read("privacy-en.html").includes("unticked consent box"),"privacy policies disclose opt-in secure conference storage");
assert.ok(html.includes('<bdi dir="ltr">30–60</bdi>')&&html.includes('<bdi dir="ltr">6–8</bdi>'),"retain proposed pilot ranges in readable order");
assert.ok(html.includes('class="roadmapStatus statusReady"')&&html.includes('class="roadmapStatus statusProgress"')&&html.includes('class="roadmapStatus statusUpcoming"'),"status labels preserved");
assert.ok(css.includes(".roadmap::before")&&css.includes(".roadmapMarker"),"investor timeline remains intact");
assert.ok(html.includes('id="pathsReturn"'),"return to paths retained");
assert.ok(html.includes('data-t="pilotNeedsTitle"')&&html.includes('data-t="pilotValueTitle"')&&html.includes('data-t="pilotEthics"'),"pilot input/output/ethics cards remain");
assert.ok(sc.includes('class="demoLangGroup"')&&sc.includes('stageProgressText'),"student demo remains bilingual with progress indicator");
assert.ok(scCss.includes(".demoLangGroup"),"demo language switch styling remains");

/* Investor timeline chronology, honest status indicators, RTL Safari readability. */
const visionHTML=html.slice(html.indexOf('<section id="vision"'),html.indexOf('<section id="contact"'));
assert.ok(visionHTML.includes('class="roadmapReady"')&&visionHTML.includes('class="roadmapProgress"'),"timeline has ready and in-progress states");
assert.equal((visionHTML.match(/class="roadmapUpcoming"/g)||[]).length,2,"the pilot and expansion must remain upcoming");
const roadmapOrder=[visionHTML.indexOf('data-t="phase1"'),visionHTML.indexOf('data-t="phase3"'),visionHTML.indexOf('data-t="phase2"'),visionHTML.indexOf('data-t="phase4"')];
assert.ok(roadmapOrder.every((pos,i)=>pos>=0&&(i===0||pos>roadmapOrder[i-1])),"timeline must read Ready → Validation in progress → Qatar pilot upcoming → Expansion upcoming");
assert.ok(visionHTML.indexOf('class="roadmapStatus statusReady"')<visionHTML.indexOf('class="roadmapStatus statusProgress"'),"ready comes before in-progress");
assert.ok(visionHTML.indexOf('class="roadmapStatus statusProgress"')<visionHTML.indexOf('class="roadmapStatus statusUpcoming"'),"in-progress comes before upcoming");
assert.ok(!visionHTML.includes('class="honesty"')&&visionHTML.includes('data-t="evidenceNote"'),"remove duplicate today panel while retaining empirical caveat");
assert.ok(js.includes('evidenceNote:"الأثر التعليمي لم يُثبت بعد؛ وسنقيسه'),"Arabic uncertainty must remain honest");
assert.ok(js.includes('evidenceNote:"Learning impact has not yet been demonstrated'),"English uncertainty must remain honest");
assert.ok(css.includes('.roadmap li.roadmapProgress .roadmapMarker{')&&css.includes('conic-gradient('),"in-progress node should be half-filled");
assert.ok(css.indexOf(".roadmap li.roadmapProgress .roadmapMarker{")>css.indexOf(".roadmap li:nth-child(2) .roadmapMarker"),"new progress state overrides legacy nth-child background colors");

assert.ok(css.includes('.roadmap li.roadmapUpcoming .roadmapMarker{background:#fffdfb'),"upcoming nodes should be hollow");
assert.ok(css.includes('.roadmap li.roadmapReady .roadmapMarker{background:var(--burgundy)'),"ready node must be solid");
assert.ok(css.includes('prefers-reduced-motion:reduce')&&css.includes('.roadmap .roadmapProgress .roadmapMarker::after{animation:none'),"respect reduced motion for gentle pulse");
assert.ok(css.includes('.paths .pathCTA>span{text-decoration:underline'),"card CTA underline only spans text");
assert.ok(css.includes('.section.frame{scroll-margin-top:88px')&&css.includes('.section.frame{scroll-margin-top:76px'),"all section anchors share consistent desktop/mobile offsets");
assert.ok(css.includes('.roadmap::before{inset-inline-start:31px')&&css.includes('.roadmap::before{inset-inline-start:20px'),"timeline line is offset from viewport edge on desktop and mobile");
assert.ok(visionHTML.includes('class="pilotNumbers"')&&visionHTML.includes('<bdi dir="ltr">30–60</bdi>')&&visionHTML.includes('<bdi dir="ltr">6–8</bdi>'),"Qatar pilot range remains LTR isolated");
assert.ok(css.includes('.roadmap .pilotNumbers bdi{display:inline-block')&&css.includes('font-variant-numeric:tabular-nums'),"Safari pilot numbers do not break across lines");
assert.ok(js.includes('var show=(window.scrollY||0)>140;')&&!js.includes('contactTop>viewport'),"return remains available at contact/footer and restored scroll positions");
assert.ok(js.includes('backToPaths.tabIndex=show?0:-1'),"invisible floating control must not be focusable");
assert.ok(css.includes('.pathsReturn.isVisible{opacity:.76'),"subtle return control opacity avoids obscuring copy");


/* Exact bilingual pilot promises and consistent non-collecting contact actions. */
const pilotText=html.slice(html.indexOf('<section id="pilot"'),html.indexOf('<section id="vision"'));
for(const key of ["pilotOffer","pilotBody","pilotLexLearnTitle","pilotLexLearnRole","pilotNeedsTitle","pilotValueTitle","pilotEthics"]){
 assert.ok(pilotText.includes('data-t="'+key+'"'),"pilot has text key "+key);
}
assert.ok(pilotText.includes("A free, limited-duration pilot with no purchase commitment."),"English offer must match approved copy");
assert.ok(pilotText.includes("The pilot is run in collaboration with the university. The measurement design is agreed jointly, and LexLearn handles follow-up and the report."),"English subtitle exact");
assert.ok(pilotText.includes("Reports delivered to the university are aggregated and anonymised; academic supervisor follow-up of individual students takes place only under the required academic approvals."),"English privacy note exact");
assert.ok(js.includes("تجربة مجانية محدودة المدة، بلا التزام بالشراء."),"Arabic highlighted offer must be exact");
assert.ok(js.includes("تُنفَّذ التجربة بالتعاون مع الجامعة، ويُحدَّد تصميم القياس بالتشاور معها، وتتولى LexLearn المتابعة وإعداد التقرير."),"Arabic subtitle exact");
assert.ok(js.includes("التقارير المسلَّمة للجامعة مجمّعة ومجهولة الهوية؛ ومتابعة المشرف الأكاديمي للطلاب تتم وفق الموافقات الأكاديمية اللازمة."),"Arabic privacy note exact");
assert.ok(pilotText.includes("id=\"academicContact\" href=\"#leadForm\""),"university pilot opens the contact form");
assert.ok(pilotText.includes('id="pilotWhatsApp"')&&pilotText.includes("https://wa.me/201014408788"),"pilot has secondary WhatsApp channel");
assert.ok(pilotText.indexOf('id="academicContact"') < pilotText.indexOf('id="pilotWhatsApp"'),"form is primary for the academic pilot");
const pilotProposal=pilotText.slice(pilotText.indexOf('class="photo-original-content"'));
assert.ok(!pilotProposal.includes("Qatar University")&&!pilotProposal.includes("Lusail University")&&!pilotProposal.includes("HBKU"),"proposal copy must not imply an institution is a partner");
assert.ok((pilotText.match(/class="pilotStepNum"/g)||[]).length===3,"three pilot phases unchanged");
assert.ok((pilotText.match(/<div><h3 data-t="pilot(?:LexLearnTitle|NeedsTitle|ValueTitle)"/g)||[]).length===3,"three role cards unchanged");
assert.ok(pilotText.includes('30–60')&&pilotText.includes('6–8')&&pilotText.includes('data-t="pilotStudents"')&&pilotText.includes('data-t="pilotWeeks"'),"proposed ranges retained");
assert.ok(css.includes(".pilotExchange>div{background:#fffdfb!important"),"all three role cards must have identical background and border");
assert.ok(css.includes(".pilotOffer{display:inline-block"),"free pilot line receives visible highlighting");
assert.ok(css.includes(".pilotActions{grid-column:1/-1;display:grid"),"two direct-contact pilot buttons align responsively");
assert.ok(html.includes("assets/conference.js?v=20261017.11")&&html.includes("assets/conference.css?v=20261019.12"),"invalidate conference client cache");
assert.ok(js.includes('id="pilotWhatsApp"')===false,"pilot WhatsApp IDs belong in HTML, not generated markup");

console.log("conference landing release test PASS");

// A local, muted logo animation and attributed university scene are now part of the approved conference design.
assert.equal((html.match(/<video\b/g)||[]).length,2);
assert.match(html,/<video id="brandIntroVideo" muted playsinline preload="none"/);
assert.ok(html.includes('Illustrative law faculty lecture theatre'));
assert.ok(pub.includes('conference-media/logo-intro-navy.mp4'));
assert.ok(pub.includes('conference-experience.js'));

// Return stays reachable at deep sections and on browser-restored positions.
{
 const listeners={},attrs={};let visible=false;
 const returnButton={classList:{toggle(name,value){visible=value;}},setAttribute(key,value){attrs[key]=value;},tabIndex:-1};
 const browser={scrollY:2200,addEventListener(name,fn){listeners[name]=fn;}};
 const navigationBlock=js.slice(js.indexOf('if(backToPaths && typeof window.addEventListener'),js.indexOf('let active="en";'));
 vm.runInNewContext(navigationBlock,{backToPaths:returnButton,window:browser});
 assert.ok(visible&&returnButton.tabIndex===0&&attrs['aria-hidden']==='false','deep-link return must be available immediately');
 for(const depth of [800,5000,9000]){browser.scrollY=depth;listeners.scroll();assert.ok(visible&&returnButton.tabIndex===0,'PDF/contact/footer must retain keyboard-accessible return');}
 browser.scrollY=0;listeners.scroll();assert.ok(!visible&&returnButton.tabIndex===-1,'hide only when already at conference home');
 browser.scrollY=9000;listeners.pageshow();assert.ok(visible,'restore return on browser back');
 assert.ok(html.includes('class="visitor-return-bar"'),'audience dialogs must retain their sticky home control');
}

// Appearance stays conference-only and remains usable when storage is blocked.
{
 const themeCode=read('assets/conference-theme.js');
 function appearance(saved,blocked=false){
   const attrs={},handlers={},events={},labels={};let observer;
   const root={lang:'ar',setAttribute(k,v){attrs[k]=v;},getAttribute(k){return attrs[k];}};
   const button={hidden:true,setAttribute(k,v){labels[k]=v;},querySelector(s){return labels[s]||(labels[s]={textContent:''});},addEventListener(k,fn){handlers[k]=fn;}};
   const storage=new Map(saved===null?[]:[['lexlearn_conference_theme',saved]]);
   vm.runInNewContext(themeCode,{document:{documentElement:root,getElementById(){return button;},addEventListener(k,fn){events[k]=fn;}},window:{addEventListener(k,fn){events[k]=fn;}},localStorage:{getItem(k){if(blocked)throw Error('blocked');return storage.get(k);},setItem(k,v){if(blocked)throw Error('blocked');storage.set(k,v);}},MutationObserver:function(fn){observer=fn;this.observe=()=>{};}});
   return {attrs,labels,root,button,storage,handlers,events,observe:()=>observer()};
 }
 const dark=appearance('dark');assert.equal(dark.attrs['data-theme'],'dark','apply saved appearance before DOM is ready');
 dark.events.DOMContentLoaded();assert.equal(dark.button.hidden,false);assert.equal(dark.labels['aria-label'],'الوضع الفاتح');
 dark.handlers.click();assert.equal(dark.attrs['data-theme'],'light');assert.equal(dark.storage.get('lexlearn_conference_theme'),'light');
 dark.root.lang='en';dark.observe();assert.equal(dark.labels['aria-label'],'Dark mode');
 dark.events.storage({key:'lexlearn_conference_theme',newValue:'dark'});assert.equal(dark.attrs['data-theme'],'dark');
 dark.events.storage({key:'lexlearn_conference_theme',newValue:null});assert.equal(dark.attrs['data-theme'],'light');
 for(const saved of [null,'invalid'])assert.equal(appearance(saved).attrs['data-theme'],'light');
 const blocked=appearance(null,true);blocked.events.DOMContentLoaded();blocked.handlers.click();assert.equal(blocked.attrs['data-theme'],'dark','toggle works without storage permissions');
 assert.ok(html.indexOf('assets/conference-theme.js')<html.indexOf('assets/conference.css'),'restore appearance before CSS');
 assert.ok(pub.includes('"conference-theme.js"')&&pub.includes('"conference-theme.css"'),'ship appearance assets');
}
