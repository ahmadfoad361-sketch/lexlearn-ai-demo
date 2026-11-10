(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var refs=[],rules=[],availableCourses=[],availableSources=[];
var cloud=window.LEX_CLOUD,client=null,authorized=false,generating=false,pendingDraft=null;
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function status(message,isError){$("status").hidden=false;$("status").textContent=message;$("status").style.borderColor=isError?"#8a1f39":"#e2dbd7";}
function safeLink(link){return /^https:\/\//i.test(String(link||""))?String(link):"#";}
async function api(body){
 var r=await client.functions.invoke("lexlearn-research-guidance",{body:body});
 if(r.error)throw new Error(String(r.error.message||"تعذر الاتصال بخدمة الأبحاث"));
 if(!r.data||r.data.error)throw new Error(r.data&&r.data.error||"invalid_research_response");
 return r.data;
}
function renderReferences(){
 var q=$("search").value.trim().toLowerCase();
 var matched=refs.filter(function(x){return (x.title_en+" "+x.title_ar+" "+x.authors+" "+x.publication_year+" "+x.country_or_institution).toLowerCase().indexOf(q)>=0;});
 $("refList").innerHTML=matched.map(function(x){
   return '<article><h3>'+esc(x.id)+' · '+esc(x.title_ar)+'</h3><small>'+esc(x.title_en)+'</small><small>'+esc(x.authors)+' · '+esc(x.publication_year)+' · '+esc(x.country_or_institution)+'</small>'+
   '<p><b>النتيجة:</b> '+esc(x.findings_summary_ar)+'</p>'+
   '<p><b>التطبيق:</b> '+esc(x.application_ar)+'</p>'+
   '<p><b>الحدود:</b> '+esc(x.limitations_ar)+'</p><a href="'+esc(safeLink(x.source_url))+'" target="_blank" rel="noopener noreferrer">سجل البحث الأصلي</a></article>';
 }).join("")||'<p class="muted">لا توجد مراجع بهذه الكلمات.</p>';
}
function chosenCourse(){return availableCourses.find(function(x){return x.id===$("course").value;})||null;}
function paintSources(){
 var c=chosenCourse(),country=c&&c.country_code,old=Array.from($("sources").selectedOptions).map(function(x){return x.value;});
 var list=availableSources.filter(function(s){return !country||s.country_code===country||s.country_code==="general";});
 $("sources").innerHTML=list.map(function(s){
  return '<option value="'+esc(s.id)+'"'+(old.indexOf(s.id)>=0?' selected':'')+'>'+esc(s.title||s.id)+' · '+esc(s.authority||s.country_code)+'</option>';
 }).join("");
 if(!list.length)$("sourceHint").textContent="لا توجد مصادر قانونية معتمدة لهذا البلد؛ لا يمكن توليد مسودة نشر.";
 else $("sourceHint").textContent="اختر حتى 10 مصادر. المراجعة القانونية والأكاديمية مطلوبة قبل استخدام السؤال مع الطلاب.";
}
function showBlueprint(r){
 var refMap={};refs.forEach(function(x){refMap[x.id]=x;});
 var title=r.evidence_status==="insufficient_for_routing"?"الأدلة قليلة: لا نحدد مسارًا ثابتًا":"مؤشرات أولية للتوجيه فقط";
 var h='<h3>'+esc(title)+'</h3><p><b>حالة المصدر:</b> '+esc(r.source_status||"غير محدد")+'</p>';
 if(!r.draft_questions||!r.draft_questions.length)
   h+='<div class="note">لا توجد مصادر قانونية موثقة لهذا الاختيار. تظهر استراتيجية التدريب فقط، ولا تُنشأ مسودة سؤال حتى اعتماد المصدر.</div>';
 (r.draft_questions||[]).forEach(function(x,i){
   h+='<article><h3>مسودة '+(i+1)+' · '+esc(x.skill)+'</h3><p>'+esc(x.prompt_ar)+'</p><p><b>الغرض التربوي:</b> '+esc(x.teaching_intent)+'</p>'+
   '<p><b>مراجعة إلزامية:</b> '+(x.required_human_inputs||[]).map(esc).join("، ")+'</p><small>غير معتمد للنشر · المصادر: '+(x.approved_legal_source_ids||[]).map(esc).join("، ")+'</small></article>';
 });
 var studies=[];
 (r.citations||[]).forEach(function(x){if(refMap[x.id])studies.push(x);});
 h+='<h3>الأبحاث التي يستند إليها الاقتراح</h3><p>'+(studies.map(function(x){return '<a href="'+esc(safeLink(x.source_url))+'" target="_blank" rel="noopener noreferrer">'+esc(x.id)+' — '+esc(x.title_en)+'</a>';}).join(" | ")||"غير متاحة")+'</p>';
 h+='<div class="note">هذه مسودة تعليمية للخبير، وليست سؤالًا قانونيًا مصححًا أو مصرحًا بنشره. لا تتغير بها درجات الطلاب أو مساراتهم.</div>';
 $("proposals").innerHTML=h;
}
async function propose(){
 $("propose").disabled=true;
 status("جار مطابقة التوصيات التربوية بالمصادر المعتمدة…");
 try{
   var n=Number($("evidenceCount").value);
   if(!Number.isInteger(n)||n<0||n>500)throw new Error("عدد المحاولات يجب أن يكون من 0 إلى 500");
   var ids=Array.from($("sources").selectedOptions).map(function(x){return x.value;});
   if(ids.length>10)throw new Error("الحد الأقصى 10 مصادر");
   var result=await api({action:"blueprint",target_skill:$("skill").value,evidence_count:n,course_id:$("course").value,approved_source_ids:ids});
   showBlueprint(result);status("تم إعداد المقترحات. أي سؤال يحتاج مراجعة قانونية وتربوية قبل اعتماده.");
 }catch(e){status("تعذّر إعداد المقترحات: "+e.message,true);}
 finally{$("propose").disabled=false;}
}
async function start(){
 try{
   if(!cloud||!cloud.isConfigured||!cloud.isConfigured())throw new Error("تعذر الاتصال بالنظام السحابي");
   var p=await cloud.profile();
   if(!p||p.active===false||["owner","admin"].indexOf(p.role)<0)throw new Error("هذه الواجهة متاحة لحسابات المدير والمشرف المصرح لهم فقط");
   client=cloud.db();if(!client)throw new Error("لم يبدأ اتصال قاعدة البيانات");
   var results=await Promise.all([api({action:"catalog"}),api({action:"sources"})]);
   var catalog=results[0],sourceResults=results[1];
   refs=catalog.studies||[];rules=catalog.rules||[];
   availableCourses=sourceResults.courses||[];
   availableSources=sourceResults.approved_sources||[];
   $("researchCount").textContent=String(refs.length);
   $("rulesCount").textContent=String(rules.length);
   $("course").innerHTML='<option value="">اختر مقررًا</option>'+availableCourses.map(function(c){
     return '<option value="'+esc(c.id)+'">'+esc(c.title_ar||c.id)+' ('+esc(c.country_code)+')</option>';
   }).join("");
   paintSources();renderReferences();authorized=true;$("generate").disabled=false;$("workspace").hidden=false;
   status("تم التحقق من صلاحية الإدارة. يمكن استعراض الأبحاث وإعداد مسودات لا تؤثر على حسابات الطلاب.");
 }catch(e){status("لم تُفتح الواجهة: "+e.message+". سجّل الدخول من لوحة الإدارة ثم أعد المحاولة.",true);}
}
async function generateAiDraft(){
 if(generating)return;
 generating=true;$("generate").disabled=true;$("clear").disabled=true;
 status("جار توليد مسودة سؤال من المصادر القانونية والأبحاث التعليمية. لا تُستخدم هذه المسودة مع الطلاب قبل اعتمادها.");
 try{
  if(!authorized||!client)throw new Error("سجّل الدخول بحساب مشرف مصرح له أولًا");
  if(!$("draftCostConsent").checked)throw new Error("فعّل الموافقة على تكلفة التوليد قبل الطلب");
  var course=$("course").value,skill=$("skill").value,attempts=Number($("evidenceCount").value);
  var ids=Array.from($("sources").selectedOptions).map(function(x){return x.value;});
  if(!course||ids.length<1||ids.length>3)throw new Error("اختر مقررًا ومصدرًا قانونيًا إلى ثلاثة مصادر معتمدة");
  if(!Number.isInteger(attempts)||attempts<0||attempts>500)throw new Error("أدخل عدد محاولات صحيحًا بين 0 و500");
  var signature=JSON.stringify([course,skill,attempts,ids.slice().sort()]);
  if(pendingDraft&&pendingDraft.signature!==signature)throw new Error("تحقق من الطلب السابق بنفس الاختيارات أو امسحها لبدء طلب جديد");
  if(!pendingDraft)pendingDraft={signature:signature,key:crypto.randomUUID()};
  var key=pendingDraft.key;
  var r=await client.functions.invoke("lexlearn-research-question-draft",{body:{
    action:"generate",request_key:key,course_id:course,target_skill:skill,
    approved_source_ids:ids,evidence_count:attempts
  }});
  if(r.error||!r.data||r.data.error)throw new Error(r.data&&r.data.error||r.error&&r.error.message||"خدمة إنشاء السؤال غير متاحة");
  if(r.data.status==="reserved")throw new Error("الطلب السابق ما زال قيد التوليد. أعد التحقق بنفس الزر دون إنشاء طلب آخر");
  if(r.data.status==="failed")throw new Error("الطلب السابق لم يكتمل. لن نكرر تكلفته تلقائيًا؛ امسح الاختيارات إذا أردت بدء طلب جديد");
  var d=r.data.question;
  if(r.data.status!=="ready_for_review"||!d)throw new Error("المسودة لم تكتمل");
  var markup='<article><h3>مسودة سؤال قانوني غير معتمدة: '+esc(d.title_ar)+'</h3>'+
   '<p><b>السؤال:</b> '+esc(d.question_ar)+'</p>'+
   '<p><b>إجابة مقترحة للمراجعة:</b> '+esc(d.reference_answer_ar)+'</p>'+
   '<p><b>التعليل:</b> '+esc(d.legal_explanation_ar)+'</p>'+
   '<h3>معايير التصحيح المقترحة</h3><ol>'+((d.rubric_criteria||[]).map(function(q){return '<li>'+esc(q.criterion_ar)+' — '+esc(q.maximum_points)+' نقطة</li>';}).join(""))+'</ol>'+
   '<p><b>المصادر القانونية:</b> '+(d.source_ids||[]).map(esc).join("، ")+'</p>'+
   '<p><b>مراجع التصميم التربوي:</b> '+(d.research_study_ids||[]).map(esc).join("، ")+'</p>'+
   '<div class="note"><b>المسودة محفوظة للمراجعة:</b> '+esc(r.data.draft_id)+'. يجب اعتماد المرجع القانوني والإجابة والمشتتات والدرجة بواسطة مختصين قبل أي استخدام رسمي. لم يتم نشر السؤال أو تحديث أي درجة.</div></article>';
  $("generated").innerHTML=markup;
  status("تم حفظ مسودة السؤال في سجل المراجعة الداخلي. لا توجد أي تغييرات في بنك الأسئلة المنشورة.");
 }catch(e){status("تعذر توليد السؤال: "+e.message,true);}
 finally{generating=false;$("generate").disabled=!authorized;$("clear").disabled=false;}
}
$("generate").addEventListener("click",generateAiDraft);
$("search").addEventListener("input",renderReferences);
$("course").addEventListener("change",paintSources);
$("propose").addEventListener("click",propose);
$("clear").addEventListener("click",function(){
 if(generating)return;
 pendingDraft=null;$("generated").innerHTML="";$("draftCostConsent").checked=false;
 $("skill").value="foundation";$("evidenceCount").value="0";$("course").value="";paintSources();$("proposals").innerHTML="";
});
start();
})();