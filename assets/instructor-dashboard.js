(function(){
"use strict";
const APP=document.getElementById("instructorApp"),C=LEX_CLOUD.db();
const state={roster:null,assignment:"",selected:"",report:null,busy:false};
const esc=v=>String(v??"").replace(/[&<>"']/g,k=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[k]));
const el=id=>document.getElementById(id);
const num=x=>x===null||x===undefined||x===""||!Number.isFinite(Number(x))?null:Math.round(Number(x));
const pct=v=>num(v)===null?"لم يُقَس":num(v)+"%";
const dimension=k=>({recall:"الحفظ / استرجاع القاعدة",understanding:"الفهم"})[k]||k;
const datum=x=>x?new Date(x).toLocaleDateString("ar-EG"):"—";
function policy(){return '<p class="notice">هذه مؤشرات أولية لتغطية عناصر الأسئلة في التدريبات، وليست درجات جامعية. لا يُستدل على تحسن ثابت بين فترتين إلا إذا كان القياس متكافئًا ومعايير التصحيح موحدة.</p>';}
function scopeStudents(){
 const a=(state.roster?.students||[]);
 return a.filter(s=>s.assignment_id===state.assignment);
}
function profile(){
 const p=state.roster.profile||{};
 return '<section class="panel"><div class="profileHero"><div class="brand"><div class="avatar">د</div><div><span class="eyebrow">بطاقة دكتور جامعة</span><h1>'+esc(p.academic_title||"دكتور")+' '+esc(p.name||"")+'</h1><p>'+esc(p.official_email||"")+'</p><small>'+esc(p.specialization||"التخصص غير مدخل")+'</small></div></div><button class="secondary" id="editProfile">تعديل ملفي</button></div>'+
 '<div class="grid"><div><b>واتساب التواصل</b><p>'+esc(p.whatsapp||"—")+'</p></div><div><b>الساعات المكتبية</b><p>'+esc(p.office_hours||"—")+'</p></div></div>'+
 '<p>'+esc(p.bio||"")+'</p></section>';
}
function editForm(){
 const p=state.roster.profile||{};
 return '<section class="panel"><h2>تعديل بيانات الدكتور الشخصية</h2><p class="hint">يمكن تعديل البيانات الشخصية فقط. بريد تسجيل الدخول والجامعة والمواد والفرق يحددها المشرف.</p><form id="profileEdit"><div class="grid">'+
 '<label>الاسم الأكاديمي<input name="name" maxlength="160" value="'+esc(p.name)+'" required></label>'+
 '<label>اللقب العلمي<input name="academic_title" maxlength="90" value="'+esc(p.academic_title||"دكتور")+'"></label>'+
 '<label>التخصص<input name="specialization" maxlength="160" value="'+esc(p.specialization)+'"></label>'+
 '<label>رقم واتساب دولي (اختياري)<input name="whatsapp" placeholder="+201000000000" value="'+esc(p.whatsapp)+'"></label>'+
 '<label>الساعات المكتبية<input name="office_hours" maxlength="160" value="'+esc(p.office_hours)+'"></label></div>'+
 '<label>نبذة مختصرة<textarea name="bio" maxlength="600">'+esc(p.bio)+'</textarea></label>'+
 '<button class="primary" type="submit">حفظ البيانات</button><button id="cancelEdit" class="secondary" type="button">إلغاء</button><p id="profileStatus" role="status"></p></form>'+
 '<h3>تغيير كلمة المرور</h3><form id="changeProfessorPassword"><label>كلمة مرور جديدة (10 أحرف على الأقل)<input name="password" type="password" minlength="10" required autocomplete="new-password"></label><button type="submit" class="secondary">تغيير كلمة المرور</button><p id="passwordStatus" role="status"></p></form></section>';
}
function assignments(){
 const a=state.roster.assignments||[];
 return '<section class="panel"><h2>المواد والفرق المكلف بتدريسها</h2><div class="grid">'+a.map(x=>'<div class="course"><b>'+esc(x.subject)+'</b><p>'+esc(window.LEX_ACADEMIC.university(x.university))+' — '+esc(x.faculty)+'</p><small>'+esc(window.LEX_ACADEMIC.year(x.year))+'</small></div>').join("")+'</div><label>المادة المعروضة<select id="scopeSelect">'+a.map(x=>'<option value="'+esc(x.id)+'" '+(state.assignment===x.id?"selected":"")+'>'+esc(x.subject)+' — '+esc(window.LEX_ACADEMIC.university(x.university))+' — '+esc(window.LEX_ACADEMIC.year(x.year))+'</option>').join("")+'</select></label></section>';
}
function studentProgress(r){
 if(!r)return '<p class="loading">اختر طالبًا لعرض تقدم المهارات.</p>';
 const d=r.diagnostic||{},points=Array.isArray(r.checkpoints)?r.checkpoints:[],missing=Array.isArray(r.missing_criteria)?r.missing_criteria:[];
 const periods=[...new Set(points.map(x=>x.period))].sort((a,b)=>a-b);
 return '<div class="panel"><div class="toolbar"><div><span class="eyebrow">تطور المهارات</span><h2>'+esc(r.student?.name)+'</h2><p>'+esc(window.LEX_ACADEMIC.university(r.student?.university))+' — '+esc(r.student?.faculty)+' — '+esc(window.LEX_ACADEMIC.year(r.student?.year))+'</p></div><button class="print" id="printReport">طباعة التقرير</button></div>'+
 '<div class="grid three"><div class="metric">تقدير الحفظ عند التشخيص<strong>'+pct(d.recall)+'</strong><small>قياس أولي مستقل</small></div><div class="metric">تقدير الفهم عند التشخيص<strong>'+pct(d.understanding)+'</strong><small>قياس أولي مستقل</small></div><div class="metric">جلسات مكتملة<strong>'+Number(r.completed_sessions||0)+'</strong><small>كل خمس جلسات = فترة متابعة</small></div></div>'+
 '<h3>متابعة كل خمس جلسات مكتملة</h3>'+
 (points.length?'<div class="tableScroll"><table class="dataTable"><thead><tr><th>الفترة</th><th>المهارة</th><th>التقدير</th><th>إجابات مقيمة</th><th>نسخة التصحيح</th></tr></thead><tbody>'+
 points.map(x=>'<tr><td>جلسات '+((x.period-1)*5+1)+'–'+(x.period*5)+'</td><td>'+dimension(x.dimension)+'</td><td><strong>'+pct(x.percent)+'</strong><div class="bar"><span style="width:'+Math.max(0,Math.min(100,num(x.percent)||0))+'%"></span></div></td><td>'+x.samples+'</td><td>'+esc(x.rubric_version||"غير موثقة")+'</td></tr>').join("")+'</tbody></table></div>':
 '<p class="notice">لم تكتمل فترة من 5 جلسات بعد، أو لا توجد نتائج قابلة للعرض لهذه الفترة. لن نخترع خطًا بيانيًا قبل توفر القياس.</p>')+
 '<h3>توجيهات التقوية</h3>'+recommend(r)+
 '<h3>العناصر التي تكررت الإشارة إلى نقصها</h3><p>'+ (missing.length?missing.map(m=>'<span class="tag">'+esc(m.element)+' ('+m.count+')</span>').join(" "):"لا توجد عناصر نقص مسجلة بصورة قابلة للاستخلاص بعد")+'</p>'+policy()+'</div>';
}
function recommend(r){
 const p=r.checkpoints||[],rs=p.filter(x=>x.dimension==="recall").at(-1),
  us=p.filter(x=>x.dimension==="understanding").at(-1);
 const advice=[];
 if(rs&&rs.samples>0&&num(rs.percent)<65)advice.push("الرجوع إلى العناصر الأساسية للقاعدة، ثم تدريب الطالب على استرجاعها دون النظر للنص.");
 if(us&&us.samples>0&&num(us.percent)<65)advice.push("شرح القاعدة بأمثلة متقابلة، ثم تكليف الطالب بتفسير سبب الاختيار لا مجرد تحديد الإجابة.");
 if(!p.length)advice.push("استكمال خمس جلسات أولًا، ثم مراجعة إجابات الطالب مع أستاذ المادة قبل إصدار أي توصية فردية.");
 if(!advice.length)advice.push("الاستمرار في المراجعة الدورية وتقديم مسائل متنوعة، مع التحقق من ثبات مستوى الإجابات.");
 return '<div class="summary">'+advice.map(x=>'<p>• '+x+'</p>').join("")+'</div>';
}
function roster(){
 const students=scopeStudents();
 return '<section class="studentSummary"><aside class="panel"><h2>طلاب الفرقة والمقرر</h2><p class="meta">'+students.length+' طالب مسجّل في النطاق المحدد</p><div class="list">'+students.map(s=>'<button data-student="'+esc(s.id)+'" class="'+(state.selected===s.id?"active":"")+'"><b>'+esc(s.name)+'</b><small> — '+esc(window.LEX_ACADEMIC.year(s.year))+'</small></button>').join("")+'</div></aside><div id="individualResult">'+studentProgress(state.report)+'</div></section>';
}
function groupIntro(){return '<section class="panel"><div class="toolbar"><div><h2>تحليل جماعي للطلاب</h2><p>لمساعدة الأستاذ في معرفة الموضوعات التي تحتاج إعادة شرح أو تطوير محتواها لاحقًا.</p></div><button id="runGroup" class="primary">تحليل طلاب المادة</button></div><div id="groupResults"></div></section>';}
function render(showEdit=false){
 APP.innerHTML=profile()+(showEdit?editForm():"")+assignments()+roster()+groupIntro();
 el("editProfile").onclick=()=>render(true);
 if(el("profileEdit")){el("cancelEdit").onclick=()=>render(false);el("profileEdit").onsubmit=saveProfile;
 el("changeProfessorPassword").onsubmit=async e=>{e.preventDefault();try{await LEX_CLOUD.setOwnPassword(new FormData(e.currentTarget).get("password"));el("passwordStatus").textContent="تم تغيير كلمة المرور.";e.currentTarget.reset();}catch(_){el("passwordStatus").textContent="تعذر تحديث كلمة المرور.";}};}
 el("scopeSelect").onchange=e=>{state.assignment=e.target.value;state.report=null;state.selected="";render();};
 document.querySelectorAll("[data-student]").forEach(b=>b.onclick=()=>loadStudent(b.dataset.student));
 el("runGroup").onclick=groupAnalysis;
 if(el("printReport"))el("printReport").onclick=()=>window.print();
}
async function saveProfile(e){
 e.preventDefault();const f=new FormData(e.currentTarget);
 el("profileStatus").textContent="جارٍ الحفظ…";
 try{
  const name=String(f.get("name")||"").trim();if(name.length<5)throw Error("name");
  const patch={academic_title:f.get("academic_title"),specialization:f.get("specialization"),
   office_hours:f.get("office_hours"),bio:f.get("bio"),whatsapp:f.get("whatsapp")};
  const r=await C.rpc("lex_instructor_update_profile",{p_data:patch});
  if(r.error||!r.data?.ok)throw r.error||Error("save_failed");
  await LEX_CLOUD.updateOwnProfile({display_name:name});
  await reload();
 }catch(_){el("profileStatus").textContent="تعذر الحفظ، تأكد من صحة رقم الواتساب وصلاحية الحساب.";}
}
async function loadStudent(studentId){
 state.selected=studentId;state.report=null;render();
 const box=el("individualResult");
 box.innerHTML='<section class="panel loading">جارٍ تحميل سجل الطالب ضمن صلاحية المقرر…</section>';
 try{
  const r=await C.rpc("lex_staff_skill_progress",{p_student:studentId,p_course:(state.roster.assignments||[]).find(a=>a.id===state.assignment)?.course_id});
  if(r.error)throw r.error;
  state.report=r.data;box.innerHTML=studentProgress(state.report);
  if(el("printReport"))el("printReport").onclick=()=>window.print();
 }catch(_){box.innerHTML='<section class="panel danger">تعذر تحميل سجل الطالب أو ليس ضمن صلاحية هذه المادة.</section>';}
}
async function groupAnalysis(){
 const students=scopeStudents(),node=el("groupResults");
 if(students.length<5){node.innerHTML='<p class="notice">نحتاج بيانات خمسة طلاب على الأقل لإظهار تحليل جماعي قابل للاستخدام. يمكنك متابعة الطلبة فرديًا الآن.</p>';return;}
 node.innerHTML='<p class="loading">جارٍ تلخيص المؤشرات المتاحة لطلاب المادة…</p>';
 try{
  const reports=[];
  for(const s of students.slice(0,150)){
   const r=await C.rpc("lex_staff_skill_progress",{p_student:s.id,p_course:(state.roster.assignments||[]).find(a=>a.id===state.assignment)?.course_id});
   if(!r.error&&r.data)reports.push(r.data);
  }
  const by=new Map(),missing=new Map();
  reports.forEach(r=>{
   (r.checkpoints||[]).forEach(c=>{
    const key=[c.period,c.dimension,c.rubric_version||"unspecified"].join("|");
    const g=by.get(key)||{period:c.period,dimension:c.dimension,rubric:c.rubric_version,students:0,values:[]};
    g.students++;g.values.push(Number(c.percent));by.set(key,g);
   });
   new Set((r.missing_criteria||[]).map(m=>m.element)).forEach(element=>missing.set(element,(missing.get(element)||0)+1));
  });
  const rows=[...by.values()].filter(g=>g.students>=5).sort((a,b)=>a.period-b.period);
  node.innerHTML='<p>عدد الطلاب المشمولين بالتحليل: '+reports.length+' من '+students.length+' — التقديرات آلية وتجريبية.</p>'+
   (rows.length?'<div class="tableScroll"><table class="dataTable"><thead><tr><th>الفترة</th><th>المهارة</th><th>عدد الطلاب</th><th>متوسط تغطية العناصر</th><th>معيار التصحيح</th></tr></thead><tbody>'+
   rows.map(g=>'<tr><td>'+g.period+'</td><td>'+dimension(g.dimension)+'</td><td>'+g.students+'</td><td>'+Math.round(g.values.reduce((a,b)=>a+b,0)/g.values.length)+'%</td><td>'+esc(g.rubric||"غير محدد")+'</td></tr>').join("")+'</tbody></table></div>':
   '<p class="notice">لا تتوافر خمس نتائج طلابية قابلة للمقارنة في فترة واحدة ومعيار واحد. لا يمكن احتساب متوسط جماعي موثوق بعد.</p>')+
   '<h3>الأجزاء التي تستحق مراجعة طريقة شرحها</h3><p class="hint">عدد الطلبة الذين ظهر لديهم هذا الاحتياج، لا عدد مرات الخطأ. يُقترح تعديل الشرح عند تكراره لدى نسبة معتبرة.</p>'+
   ([...missing.entries()].sort((a,b)=>b[1]-a[1]).slice(0,7).map(([k,v])=>'<span class="tag">'+esc(k)+' — '+v+' طلاب ('+Math.round(100*v/reports.length)+'%)'+'</span>').join(" ")||
   '<p>لا توجد بيانات كافية عن العناصر الناقصة حاليًا.</p>')+
   '<p class="hint">يمكن الاستفادة من هذه القائمة عند تطوير المحاضرات، لكن لا تعتمد وحدها لتغيير الكتاب الجامعي دون مراجعة أكاديمية ومقارنة اختبارات متكافئة.</p>'+policy();
 }catch(_){node.innerHTML='<p class="danger">تعذر إتمام التحليل الجماعي.</p>';}
}
async function reload(){
 const c=await LEX_CLOUD.profile();
 if(!c||c.role!=="instructor"||c.active!==true)throw Error("FORBIDDEN");
 if(c.must_change_password){
  APP.innerHTML='<section class="panel"><h1>تعيين كلمة مرور دائمة للدكتور</h1><p>لأمان بيانات الطلاب، يجب تغيير كلمة المرور المؤقتة قبل عرض أي سجل تعليمي.</p>'+
   '<form id="firstProfessorPassword"><label>كلمة المرور الجديدة (10 أحرف على الأقل)<input name="password" type="password" required minlength="10" autocomplete="new-password"></label>'+
   '<button type="submit" class="primary">تفعيل حساب الدكتور</button><p id="activateMessage" role="status"></p></form></section>';
  document.getElementById("firstProfessorPassword").onsubmit=async e=>{
   e.preventDefault();try{await LEX_CLOUD.setOwnPassword(new FormData(e.currentTarget).get("password"));await reload();}
   catch(_){document.getElementById("activateMessage").textContent="لم يتم تغيير كلمة المرور، حاول مجددًا.";}
  };
  return;
 }
 const r=await C.rpc("lex_instructor_roster");
 if(r.error||!r.data||!r.data.profile)throw r.error||Error("no_profile");
 state.roster=r.data;
 state.assignment=state.assignment||(r.data.assignments||[])[0]?.id||"";
 render();
}
el("instructorLogout").onclick=async()=>{await LEX_CLOUD.signOut();location.replace("instructor-login.html");};
reload().catch(()=>APP.innerHTML='<section class="panel danger"><h2>تعذر فتح حساب الدكتور</h2><p>لا توجد صلاحية تدريس نشطة للحساب، أو لا توجد بيانات أكاديمية مكتملة. تواصل مع المشرف.</p><a href="instructor-login.html">العودة لتسجيل الدخول</a></section>');
})();