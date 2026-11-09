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
var glossaryCache=new Map(),lastSelection="";
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function tr(ar,en){return root.document&&root.document.documentElement.lang==="en"?en:ar;}
function normalize(s){return String(s||"").normalize("NFKC").replace(/[ًٌٍَُِّْـ]/g,"").replace(/\s+/g," ").trim();}
function termKey(s){return "manual-"+normalize(s).slice(0,90);}
function isLetter(c){return !!c&&/[\u0621-\u064aA-Za-z]/.test(c);}
function linkText(article,text){
 var s=String(text||""),terms=TERMS.filter(function(t){return t[2]===Number(article);}),i=0,parts=[];
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
 var d=modal();d.innerHTML="<section class='lexGlossaryDialogBody'><div class='lexGlossaryDialogHeader'><b>"+esc(term)+"</b><button type='button' data-close aria-label='"+esc(tr("إغلاق","Close"))+"'>×</button></div><p class='lexGlossarySource'>"+esc(tr("القانون المدني القطري رقم 22 لسنة 2004 • المادة ","Qatar Civil Code, Law 22/2004 • Article "))+article+"</p><p id='lexGlossaryMeaning' aria-live='polite'>"+esc(tr("جارٍ تحميل شرح المصطلح…","Loading a short explanation…"))+"</p><section class='lexGlossaryExample' id='lexGlossaryExample' hidden><strong>"+esc(tr("مثال قانوني للتوضيح","Illustrative legal example"))+"</strong><p id='lexGlossaryExampleText'></p></section><p class='lexGlossarySafety'>"+esc(tr("تبسيط للمذاكرة، ولا يغيّر النص القانوني أو نتيجة الاختبار.","A study aid; it does not alter law text or assessment results."))+"</p><label class='lexPersonalMoment'>"+esc(tr("إيه الموقف اللي خلاك تختار المصطلح؟ (اختياري)","What made you choose this term? (optional)"))+"<textarea id='lexPersonalMoment' maxlength='350' rows='2' placeholder='"+esc(tr("مثال: قابلته في مسألة قانونية","E.g. I saw it in a legal case"))+"'></textarea></label><p role='alert' id='lexGlossaryError'></p><button type='button' class='lexGlossarySave' id='lexGlossarySave' disabled>"+esc(tr("أضف لقاموسي","Save to my dictionary"))+"</button></section>";
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
 var out=await who.client.from("lex_student_glossary").insert(row);if(out.error&&out.error.code!=="23505")throw out.error;
 return true;
}
async function openWord(word,article,context,knownKey){
 var term=find(knownKey)||TERMS.find(function(v){return v[1]===word&&v[2]===Number(article);});
 var key=term?term[0]:termKey(word),name=term?label(term):normalize(word);
 if(!name||name.length>120)return;
 var d=popShow(name,article,context),meaning=d.querySelector("#lexGlossaryMeaning"),btn=d.querySelector("#lexGlossarySave"),err=d.querySelector("#lexGlossaryError");
 var value={key:key,term:name,article:article,definition_ar:"",definition_en:"",example_ar:"",example_en:"",status:"pending"};
 function showMeaning(){
  if(!d.open)return;
  meaning.textContent=tr(value.definition_ar,value.definition_en||value.definition_ar);
  var exampleBox=d.querySelector("#lexGlossaryExample"),exampleText=d.querySelector("#lexGlossaryExampleText");
  var shownExample=tr(value.example_ar||"",value.example_en||value.example_ar||"");
  exampleBox.hidden=!shownExample;
  exampleText.textContent=shownExample;
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
  if(!d.open)return;
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
     btn.disabled=false;btn.textContent=tr("أضف لقاموسي","Save to my dictionary");
    }catch(_){
     if(!d.open)return;
     meaning.textContent=tr("خدمة الشرح الآلي غير متاحة الآن. ما زال بإمكانك حفظ المصطلح للمراجعة لاحقًا.","AI explanation is unavailable now. You can still save the term for later review.");
    }
   };
  }else{
   meaning.textContent=tr("تعذّر تحميل الشرح الآن. يمكنك حفظ المصطلح للمراجعة لاحقًا.","Explanation unavailable. You can save the term for later review.");
  }
 }
 if(!d.open)return;
 btn.disabled=false;
 btn.onclick=async function(){
  btn.disabled=true;err.textContent="";
  try{var fresh=await save(value,d.querySelector("#lexPersonalMoment").value);btn.textContent=fresh?tr("✓ تم الحفظ","✓ Saved"):tr("✓ موجود في قاموسك","✓ Already saved");}
  catch(_){btn.disabled=false;err.textContent=tr("لم يُحفظ المصطلح؛ تحقق من اتصالك أو صلاحية حسابك.","Could not save. Check your connection and account access.");}
 };
}
function bindArticle(node){
 if(!node||node.dataset.lexGlossaryBound)return;node.dataset.lexGlossaryBound="1";
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
  var old=node.querySelector(".lexGlossarySelection");if(old)old.remove();
  var control=root.document.createElement("button");control.type="button";control.className="lexGlossarySelection";
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
  host.innerHTML="<section class='lexQuiz lexQuizResult'><span class='lexQuizChip'>"+esc(tr("مراجعة القاموس","Dictionary review"))+"</span><h1>"+esc(tr("خلصت مراجعتك","Review complete"))+"</h1><p>"+esc(tr("راجعت "+reviewed+" مصطلحًا من قاموسك. تقدر ترجع لقاموسك أو تبدأ جلسة جديدة.","You reviewed "+reviewed+" terms. Return to your dictionary or continue learning."))+"</p><button type='button' id='lexQuizEnd'>"+esc(tr("العودة لقاموسي","Back to dictionary"))+"</button></section>";
  host.querySelector("#lexQuizEnd").onclick=function(){renderList("");};
 }
 renderList("");
}
var api={terms:TERMS,apply:APPLY,linkText:linkText,normalize:normalize,bindArticle:bindArticle,appendLink:appendLink,mountPage:mountPage};
root.LEX_GLOSSARY=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
