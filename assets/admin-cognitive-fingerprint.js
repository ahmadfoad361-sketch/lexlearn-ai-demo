/* Supervisor-only cognitive fingerprint view derived from approved, scoped rubric evidence.
 * No extra AI calls, no regrading, no diagnoses, no claims of validated learning gain.
 * The server endpoint remains owner/admin-only.
 */
(function(root){
"use strict";
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const actions={
 rebuild_memory_cues:"إعادة بناء مفاتيح الاسترجاع",
 contrast_one_condition:"المقارنة بين واقعتين تختلفان في شرط",
 practice_exam_structure:"تنظيم المسألة والقاعدة والتطبيق والنتيجة",
 reconstruct_from_memory:"استرجاع عناصر القاعدة دون نص",
 explain_then_vary_case:"شرح القاعدة ثم تغيير واقعة تطبيقية"
};
const names={recall:"الحفظ",understanding:"الفهم"};
function model(learning){
 const rows=Array.isArray(learning&&learning.concepts)?learning.concepts:[];
 return rows.filter(c=>c&&["recall","understanding"].includes(c.dimension)&&Number.isInteger(c.evidence_count)&&c.evidence_count>0&&
 typeof c.rolling_percent==="number"&&Number.isFinite(c.rolling_percent)&&c.rolling_percent>=0&&c.rolling_percent<=100&&
 c.measurement==="provisional_criterion_coverage").map(c=>({
  name:String(c.label_ar||c.label_en||"عنصر قانوني"),dimension:c.dimension,
  evidence:c.evidence_count,coverage:Math.round(c.rolling_percent),last:c.last_session,
  action:actions[c.next_step]||"تدريب مناسب للمفهوم",
  confidence:c.evidence_count>=2?"repeated_observation":"single_observation",
  tag:c.evidence_count>=2?"ملاحظة تكررت في مهام مرتبطة":"ملاحظة أولية"
 })).sort((a,b)=>b.evidence-a.evidence||a.coverage-b.coverage).slice(0,6);
}
function render(learning){
 const rows=model(learning);
 if(!rows.length)return "<section class='lexFingerprint'><h3>البصمة المعرفية</h3><p>تُبنى البصمة تدريجيًا من عناصر تقييم موثقة، ولم تتوافر حتى الآن أدلة كافية لتكوين ملخص.</p></section>";
 const repeated=rows.filter(x=>x.confidence==="repeated_observation").length;
 return "<section class='lexFingerprint' aria-labelledby='lexFingerprintTitle'><h3 id='lexFingerprintTitle'>البصمة المعرفية — للمشرف فقط</h3>"+
  "<p>رصد وصفي لعناصر الإجابات المصححة وفق المعايير الحالية. يوضح المواضع التي قد تستفيد من نوع تدريب مختلف، ولا يحكم على قدرات الطالب الدائمة.</p>"+
  "<div class='lexFingerprintHead'><span>مفاهيم لها شواهد: <b>"+rows.length+"</b></span><span>ملاحظات تكررت: <b>"+repeated+"</b></span></div>"+
  "<div class='lexFingerprintGrid'>"+rows.map(c=>"<article class='lexFingerprintItem'><strong>"+escape(c.name)+"</strong>"+
    "<p>"+escape(names[c.dimension])+" · "+escape(c.tag)+"</p>"+
    "<div class='lexFingerprintMeter'><progress value='"+c.coverage+"' max='100'></progress><b>"+c.coverage+"%</b></div>"+
    "<small>تغطية عناصر التقييم (وليست قياسًا موحدًا للإتقان) · "+c.evidence+" شواهد</small>"+
    "<p><b>تدريب مقترح:</b> "+escape(c.action)+"</p></article>").join("")+"</div>"+
  "<p class='lexFingerprintFoot'>الاستنتاجات احتمالية؛ لا يُعتمد وصف «صعوبة متكررة» من محاولة واحدة. لا تظهر هذه التفاصيل للطالب، ولا تُعدَّل الدرجات الأصلية.</p></section>";
}
root.LEX_COGNITIVE_FINGERPRINT={model,render};
if(typeof module!=="undefined"&&module.exports)module.exports={model,render};
})(typeof window!=="undefined"?window:globalThis);
