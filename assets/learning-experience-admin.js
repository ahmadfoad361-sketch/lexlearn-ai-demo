/* Owner/admin aggregate learning-experience observations. No answer text or grading. */
(function(root){"use strict";
var node=root.document&&root.document.getElementById("learningExperienceSummary");
if(!node||!root.LEX_CONFIG||root.LEX_CONFIG.learningRoundsV1!==true)return;
var en=new URLSearchParams(root.location.search).get("lang")==="en",t=function(a,b){return en?b:a;};
function esc(x){return String(x==null?"":x).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
(async function(){
 var p=await root.LEX_CLOUD.profile();if(!p||p.active!==true||!["owner","admin"].includes(p.role))return;
 node.hidden=false;
 node.innerHTML="<details class='panel'><summary>"+t("تجربة التدريب وأسباب التوقف","Training experience and stopping reasons")+"</summary><div class='learningExperienceBody'><p>"+t("افتح الملخص لعرض الملاحظات المتاحة لآخر 14 يومًا.","Open the summary to view available observations for the last 14 days.")+"</p></div></details>";
 var details=node.querySelector("details"),body=node.querySelector(".learningExperienceBody");
 async function load(){
  body.innerHTML="<p role='status'>"+t("جارٍ تجميع الملاحظات…","Aggregating observations…")+"</p>";
  try{
   var r=await root.LEX_CLOUD.db().rpc("lex_learning_experience_summary",{p_days:14});if(r.error||!r.data)throw Error();
   var d=r.data,events=d.events||{},practice=d.practice||{},reasons=d.reasons||{};
   var rows=[[t("جولات شوهدت","Observed rounds"),events.round_opened||0],[t("توقف اختاره الطالب","Explicit pauses"),events.pause_requested||0],[t("عودة بعد توقف محفوظ","Returns after a saved pause"),events.round_resumed||0],[t("استراحات بدأت","Breaks started"),events.break_started||0],[t("محاولات إضافية بمساعدة","Assisted extra practice"),practice.assisted||0],[t("محاولات إضافية دون فتح مساعدة","Extra practice without help opened"),practice.without_help_opened||0],[t("جلسات مرصودة لم تكتمل خلال 48 ساعة","Observed sessions not completed after 48 hours"),d.observed_sessions_not_completed_48h||0]];
   body.innerHTML="<p>"+t("هذه ملاحظات استخدام وإجابات اختيارية. عدم اكتمال جلسة لا يثبت التسرب، ولا تدخل المحاولات الإضافية في درجات الحفظ والفهم.","These are usage observations and optional self-reports. An unfinished session does not establish dropout. Extra practice does not enter recall or understanding scores.")+"</p><table><tbody>"+
    rows.map(function(x){return "<tr><th>"+esc(x[0])+"</th><td>"+Number(x[1])+"</td></tr>";}).join("")+"</tbody></table><h3>"+t("أسباب التوقف المصرّح بها","Self-reported stopping reasons")+"</h3><p>"+
    [["repetition","تكرار","Repetition"],["too_hard","صعوبة","Difficulty"],["tired","تعب","Tiredness"],["short_of_time","ضيق وقت","Short of time"],["other","سبب آخر","Another reason"]].map(function(x){return esc(t(x[1],x[2]))+": "+Number(reasons[x[0]]||0);}).join(" · ")+"</p><button type='button' data-learning-reload>"+t("تحديث الملخص","Refresh summary")+"</button>";
   body.querySelector("[data-learning-reload]").onclick=load;
  }catch(_){body.innerHTML="<p>"+t("لم يتوفر ملخص مؤكد الآن. لا تُفسَّر البيانات غير المتاحة على أنها صفر.","A confirmed summary is unavailable. Missing data is not treated as zero.")+"</p>";}
 }
 details.addEventListener("toggle",function(){if(details.open)load();});
})().catch(function(){});
})(window);

