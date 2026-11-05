(function(){
"use strict";
var get=function(id){return document.getElementById(id);};
if(!get("shadowCompare")||!get("shadowLoad"))return;
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function txt(s){get("shadowMessage").textContent=String(s||"");}
var loaded=null;
function lines(arr,fn){return (arr||[]).map(fn).join("");}
function render(data){
 loaded=data;
 var o=data.original,x=data.experimental,pairs=data.research&&data.research.citations||[];
 var opts=Array.isArray(o.options&&o.options.ar)?o.options.ar:[];
 var before='<article class="shadowItem"><h3>السؤال المعتمد حاليًا</h3><div class="shadowTag">النسخة '+esc(o.version)+' · '+esc(o.item_type)+' · '+esc(o.dimension)+' · محفوظ دون أي تعديل</div>'+
  '<p>'+esc(o.question_ar)+'</p><ol>'+lines(opts,function(a){return '<li>'+esc(a)+'</li>';})+'</ol>'+
  '<small>المصدر: '+esc((o.source_ids||[]).join("، "))+'</small></article>';
 var after='<article class="shadowItem"><h3>المسودة البحثية المقترحة</h3><div class="shadowTag">غير معتمدة · معروضة للمقارنة فقط · لا تدخل بنك الطلاب</div>'+
  '<p>'+esc(x.prompt_ar)+'</p><p><b>الإجابة المرجعية المبدئية:</b> '+esc(x.reference_answer_ar)+'</p>'+
  '<p><b>الهدف:</b> '+esc(x.goal_ar)+'</p><b>معيار تصحيح مقترح (10 درجات):</b><ol>'+lines(x.rubric_criteria,function(r){return '<li>'+esc(r.criterion)+' ('+esc(r.points)+' درجات)</li>';})+'</ol></article>';
 var followups='<h3>كيف سيختلف التدريب عند الخطأ؟</h3><ul>'+
  lines(Object.keys(x.followups||{}),function(k){var labels={rule_confusion:"خلط في القاعدة",exception_confusion:"خلط في الشرط",weak_transfer:"ضعف التطبيق",correct:"إجابة صحيحة"};return '<li><b>'+esc(labels[k]||k)+':</b> '+esc(x.followups[k])+'</li>';})+
  '</ul>';
 var citations='<h3>الأبحاث المستخدمة في تصميم المقترح</h3><p>'+
  lines(pairs,function(r){return '<a href="'+esc(/^https:\/\//.test(r.source_url)?r.source_url:"#")+'" target="_blank" rel="noopener noreferrer">'+esc(r.id)+' — '+esc(r.title_en)+'</a> · ';})+'</p>';
 var criteria=data.comparison_requirements&&data.comparison_requirements.criteria||[];
 var reviews='<h3>قائمة المراجعة قبل اعتماد السؤال</h3><p class="muted">هذه القائمة فحص بصري للمشرف، ولا تحفظ قرار اعتماد أو تغيّر المحتوى.</p>'+
  lines(criteria,function(k,i){return '<label class="shadowCheck"><input type="checkbox" data-shadow-review="'+i+'"> '+esc(k)+'</label>';})+
  '<div class="note">النتيجة: لا يمكن نشر المسودة أو استخدامها في التصحيح قبل مراجعة قانونية وتعليمية مستقلة ومعايرة صعوبة الأسئلة. لا تقارن نسب سؤال اختيار متعدد ونسبة سؤال مقالي مباشرة.</div>';
 get("shadowCompare").innerHTML='<div class="shadowGrid">'+before+after+'</div>'+followups+citations+reviews;
 txt("المقارنة جاهزة. فحص بصمة السؤال الأصلي: "+o.checksum.slice(0,15)+"… (تعريف للنسخة الحالية، ليس تقييمًا لطلاب).");
}
async function load(){
 get("shadowLoad").disabled=true;txt("جار قراءة السؤال المعتمد والتحقق من مصادر المسودة ومراجعها…");
 try{
  var cloud=window.LEX_CLOUD;
  if(!cloud||!cloud.isConfigured||!cloud.isConfigured())throw Error("خدمة السحابة غير متاحة");
  var p=await cloud.profile();
  if(!p||p.active===false||["admin","owner"].indexOf(p.role)<0)throw Error("مطلوب الدخول بحساب مشرف مخوّل");
  var db=cloud.db();if(!db)throw Error("قاعدة البيانات غير متاحة");
  var r=await db.functions.invoke("lexlearn-research-shadow-comparison",{body:{action:"compare",item_id:get("shadowItemId").value}});
  if(r.error||!r.data||r.data.error)throw Error(r.data&&r.data.error||r.error&&r.error.message||"تعذر تحميل المقارنة");
  if(r.data.mode!=="shadow_only"||r.data.live_student_rollout!==false||r.data.baseline_is_unchanged!==true||r.data.experimental.publishable!==false)
    throw Error("فشلت اختبارات وضع المقارنة الآمن");
  render(r.data);
 }catch(e){txt("تعذر عرض المقارنة: "+e.message);get("shadowCompare").textContent="";}
 finally{get("shadowLoad").disabled=false;}
}
get("shadowLoad").addEventListener("click",load);
get("shadowItemId").addEventListener("change",function(){loaded=null;get("shadowCompare").textContent="";txt("اختر عرض المقارنة لجلب نسخة السؤال المعتمد الحالية.");});
})();