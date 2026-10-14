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

assert.ok(html.includes('id="science"')&&html.includes('data-t="scienceHeading"'),"research foundation must be accessible on the page");
for(const pmid of ["16507066","21252317","26173288"]){
  assert.ok(html.includes("pubmed.ncbi.nlm.nih.gov/"+pmid+"/"),"missing real research citation "+pmid);
}
assert.ok(js.includes("لا تثبت الأثر التعليمي لمنصة LexLearn"),"research must not claim LexLearn is scientifically validated");
assert.ok(html.includes('class="honestyAi"')&&html.includes('data-t="status2Title"')&&html.includes('data-t="status2State"'),"AI development status must be readable as two lines");
assert.ok(js.includes('status2State:"قيد التطوير والتحقق من الدقة"'),"AI beta status must remain honest");
const transitions=read("assets/lexlearn-navigation.js");
for(const name of ["Test-Enhanced Learning","Karpicke &amp; Blunt","Dunlosky et al.","ll-paper-field","ll-transition-context"])assert.ok(transitions.includes(name),"missing research-inspired transition "+name);
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

assert.ok(ar.includes("conferencePromo")&&en.includes("conferencePromo"),"one promo strip on homepages");
assert.ok(arLogic.includes("اكتشف LexLearn | Explore LexLearn")&&en.includes("اكتشف LexLearn | Explore LexLearn"),"discover CTA on home");
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

console.log("conference landing release test PASS");
