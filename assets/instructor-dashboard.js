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
function passwordFields(){
 return '<label>كلمة المرور الجديدة (10 أحرف على الأقل)<input name="password" type="password" minlength="10" required autocomplete="new-password"></label>'+
 '<label>تأكيد كلمة المرور الجديدة<input name="password_confirm" type="password" minlength="10" required autocomplete="new-password"></label>';
}
async function savePasswordAndRelogin(form,statusId){
 const status=el(statusId),submit=form.querySelector('[type="submit"]');
 const values=new FormData(form);
 const password=String(values.get("password")||"");
 if(password.length<10){status.textContent="يجب ألا تقل كلمة المرور عن 10 أحرف.";return;}
 if(password!==values.get("password_confirm")){status.textContent="كلمتا المرور غير متطابقتين.";return;}
 submit.disabled=true;
 status.textContent="جارٍ حفظ كلمة المرور الجديدة…";
 try{
  const result=await LEX_CLOUD.setOwnPassword(password);
  if(!result||result.ok!==true)throw Error("password_change_unconfirmed");
  // Password rotation may invalidate the previous access token; never reload with it.
  status.textContent="تم تغيير كلمة المرور بنجاح. ستعود الآن لتسجيل الدخول بها.";
  form.reset();
  try{await LEX_CLOUD.signOut();}catch(_){}
  location.replace("instructor-login.html?password_updated=1");
 }catch(error){
  const code=String(error?.message||"");
  if(/401|unauthorized|jwt|session|refresh_token|token_expired/i.test(code)||error?.context?.status===401){
   status.textContent="انتهت جلسة الدخول. ربما تم حفظ كلمة المرور بالفعل؛ جرّب الدخول بالكلمة الجديدة من بوابة الدكتور.";
   const link=document.createElement("a");link.href="instructor-login.html";link.textContent="الذهاب لتسجيل الدخول";
   status.appendChild(document.createTextNode(" "));status.appendChild(link);
  }else{
   status.textContent="تعذر التأكد من تغيير كلمة المرور. لا تكرر المحاولة قبل تجربة الدخول بالكلمة الجديدة أو التواصل مع المشرف.";
  }
  submit.disabled=false;
 }
}
function policy(){return '<p class="notice">هذه مؤشرات أولية لتغطية عناصر الأسئلة في التدريبات، وليست درجات جامعية. لا يُستدل على تحسن ثابت بين فترتين إلا إذا كان القياس متكافئًا ومعايير التصحيح موحدة.</p>';}
function scopeStudents(){
 const a=(state.roster?.students||[]);
 return a.filter(s=>s.assignment_id===state.assignment);
}
function updateProfileBadge(){
 const p=state.roster.profile||{};
 let badge=el("instructorIdentityLink");
 if(!badge){badge=document.createElement("a");badge.id="instructorIdentityLink";badge.className="instructorIdentityLink";document.body.appendChild(badge);}
 badge.href="#instructorProfile";badge.setAttribute("aria-label","فتح ملفي الشخصي");
 badge.innerHTML='<span class="instructorIdentityAvatar" aria-hidden="true">'+esc((p.name||"د").trim().slice(0,1))+'</span><span><b>'+esc(p.academic_title||"دكتور")+' '+esc(p.name||"")+'</b><small>ملفي الشخصي · عضو هيئة التدريس</small></span>';
 badge.onclick=e=>{e.preventDefault();window.LEX_INSTRUCTOR_CARD.open(state.roster,()=>render(true));};
}
function bindLogout(){
 const button=el("instructorLogout");
 if(button)button.onclick=async()=>{await LEX_CLOUD.signOut();location.replace("instructor-login.html");};
}
function profile(){
 const p=state.roster.profile||{};
 return '<section class="panel" id="instructorProfile"><div class="facultyProfileHeading"><span class="eyebrow">بطاقة دكتور جامعة</span><button type="button" id="instructorLogout" class="facultyLogout">تسجيل الخروج</button></div><div class="profileHero"><div class="brand"><div class="avatar">د</div><div><h1>'+esc(p.academic_title||"دكتور")+' '+esc(p.name||"")+'</h1><p>'+esc(p.official_email||"")+'</p><small>'+esc(p.specialization||"التخصص غير مدخل")+'</small></div></div><div class="actions"><button class="primary" id="openInstructorCard">بطاقتي التعريفية</button><button class="secondary" id="editProfile">تعديل ملفي</button></div></div>'+
 (p.whatsapp?'<div class="grid"><div><b>واتساب التواصل</b><p>'+esc(p.whatsapp)+'</p></div></div>':'')+
 '<p>'+esc(p.bio||"")+'</p></section>';
}
function editForm(){
 const p=state.roster.profile||{};
 return '<section class="panel"><h2>تعديل بيانات الدكتور الشخصية</h2><p class="hint">يمكن تعديل البيانات الشخصية فقط. بريد تسجيل الدخول والجامعة والمواد والفرق يحددها المشرف.</p><form id="profileEdit"><div class="grid">'+
 '<label>الاسم الأكاديمي<input name="name" maxlength="160" value="'+esc(p.name)+'" required></label>'+
 '<label>اللقب العلمي<input name="academic_title" maxlength="90" value="'+esc(p.academic_title||"دكتور")+'"></label>'+
 '<label>التخصص<input name="specialization" maxlength="160" value="'+esc(p.specialization)+'"></label>'+
 '<label>رقم واتساب دولي (اختياري)<input name="whatsapp" placeholder="+201000000000" value="'+esc(p.whatsapp)+'"></label>'+
 '</div>'+
 '<label>نبذة مختصرة<textarea name="bio" maxlength="600">'+esc(p.bio)+'</textarea></label>'+
 '<button class="primary" type="submit">حفظ البيانات</button><button id="cancelEdit" class="secondary" type="button">إلغاء</button><p id="profileStatus" role="status"></p></form>'+
 '<h3>تغيير كلمة المرور</h3><form id="changeProfessorPassword">'+passwordFields()+'<button type="submit" class="secondary">حفظ كلمة المرور الجديدة</button><p id="passwordStatus" role="status" aria-live="polite"></p></form></section>';
}
function assignments(){
 const a=state.roster.assignments||[];
 return '<section class="panel"><h2>المواد والفرق المكلف بتدريسها</h2><div class="grid">'+a.map(x=>'<div class="course"><b>'+esc(x.subject)+'</b><p>'+esc(window.LEX_ACADEMIC.university(x.university))+' — '+esc(x.faculty)+'</p><small>'+esc(window.LEX_ACADEMIC.year(x.year))+'</small></div>').join("")+'</div><label>المادة المعروضة<select id="scopeSelect">'+a.map(x=>'<option value="'+esc(x.id)+'" '+(state.assignment===x.id?"selected":"")+'>'+esc(x.subject)+' — '+esc(window.LEX_ACADEMIC.university(x.university))+' — '+esc(window.LEX_ACADEMIC.year(x.year))+'</option>').join("")+'</select></label></section>';
}
function studentProgress(r){
 if(!r)return '<p class="loading">اختر طالبًا لعرض ملخص حفظه وفهمه.</p>';
 const d=r.diagnostic||{},points=Array.isArray(r.checkpoints)?r.checkpoints:[];
 return '<section class="panel" id="professorSummaryPrintable"><div class="toolbar"><div>'+
 '<span class="eyebrow">ملخص تقدم المهارات</span><h2>'+esc(r.student?.name||"الطالب")+'</h2>'+
 '<p>'+esc(window.LEX_ACADEMIC.university(r.student?.university))+' — '+esc(r.student?.faculty)+' — '+esc(window.LEX_ACADEMIC.year(r.student?.year))+'</p></div>'+
 '<button type="button" class="print" id="printReport">طباعة ملخص الحفظ والفهم فقط</button></div>'+
 '<div class="grid three"><div class="metric"><span>تقدير الحفظ عند التشخيص</span><strong>'+pct(d.recall)+'</strong><small>قياس أولي مستقل</small></div>'+
 '<div class="metric"><span>تقدير الفهم عند التشخيص</span><strong>'+pct(d.understanding)+'</strong><small>قياس أولي مستقل</small></div>'+
 '<div class="metric"><span>جلسات مكتملة</span><strong>'+Math.max(0,Number(r.completed_sessions)||0)+'</strong><small>كل خمس جلسات = فترة متابعة</small></div></div>'+
 '<h3>متابعة كل خمس جلسات مكتملة</h3>'+
 (points.length?'<div class="tableScroll"><table class="dataTable"><thead><tr><th>الفترة</th><th>المهارة</th><th>التقدير</th></tr></thead><tbody>'+
 points.map(x=>'<tr><td>جلسات '+((x.period-1)*5+1)+'–'+(x.period*5)+'</td><td>'+esc(dimension(x.dimension))+
 '</td><td><strong>'+pct(x.percent)+'</strong><div class="bar"><span style="width:'+Math.max(0,Math.min(100,num(x.percent)||0))+'%"></span></div></td></tr>').join("")+'</tbody></table></div>':
 '<p class="notice">لم تكتمل فترة متابعة من خمس جلسات بعد. سيظهر تطور الحفظ والفهم بعد اكتمالها وتوفر قياسات قابلة للمقارنة.</p>')+
 policy()+'</section>';
}
function roster(){
 const students=scopeStudents();
 return '<section class="studentSummary"><aside class="panel"><h2>طلاب الفرقة والمقرر</h2><p class="meta">'+students.length+' طالب مسجّل في النطاق المحدد</p><div class="list">'+students.map(s=>'<button data-student="'+esc(s.id)+'" class="'+(state.selected===s.id?"active":"")+'"><b>'+esc(s.name)+'</b><small> — '+esc(window.LEX_ACADEMIC.year(s.year))+'</small></button>').join("")+'</div></aside><div id="individualResult">'+studentProgress(state.report)+'</div></section>';
}
function groupIntro(){return '<section class="panel"><div class="toolbar"><div><h2>تحليل جماعي للطلاب</h2><p>لمساعدة الأستاذ في معرفة الموضوعات التي تحتاج إعادة شرح أو تطوير محتواها لاحقًا.</p></div><button id="runGroup" class="primary">تحليل طلاب المادة</button></div><div id="groupResults"></div></section>';}
function render(showEdit=false){
 updateProfileBadge();
 APP.innerHTML=profile()+(showEdit?editForm():"")+assignments()+roster()+groupIntro();
 bindLogout();
 el("editProfile").onclick=()=>render(true);
 el("openInstructorCard").onclick=()=>window.LEX_INSTRUCTOR_CARD.open(state.roster,()=>render(true));
 if(el("profileEdit")){el("cancelEdit").onclick=()=>render(false);el("profileEdit").onsubmit=saveProfile;
 el("changeProfessorPassword").onsubmit=e=>{e.preventDefault();return savePasswordAndRelogin(e.currentTarget,"passwordStatus");};}
 el("scopeSelect").onchange=e=>{state.assignment=e.target.value;state.report=null;state.selected="";render();};
 document.querySelectorAll("[data-student]").forEach(b=>b.onclick=()=>loadStudent(b.dataset.student));
 el("runGroup").onclick=groupAnalysis;
 if(el("printReport"))el("printReport").onclick=()=>window.print();
}
async function saveProfile(e){
 e.preventDefault();const f=new FormData(e.currentTarget);
 el("profileStatus").textContent="جارٍ الحفظ…";
 try{
  const name=String(f.get("name")||"").trim();if(name.replace(/^(?:(?:دكتور|الدكتور|أستاذ|الاستاذ|الأستاذ|د\.|Dr\.?|Prof\.?)\s+)+/iu,"").split(/\s+/).filter(Boolean).length<2)throw Error("name");
  const patch={academic_title:f.get("academic_title"),specialization:f.get("specialization"),
   bio:f.get("bio"),whatsapp:f.get("whatsapp")};
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
 if(students.length<5){node.innerHTML='<p class="notice">يلزم وجود خمسة طلاب على الأقل لعرض تحليل جماعي. تبقى مؤشرات كل طالب متاحة على حدة.</p>';return;}
 node.innerHTML='<p class="loading">جارٍ حساب المؤشرات الإجمالية للفرقة والمقرر…</p>';
 try{
  const reports=[];
  for(const s of students.slice(0,150)){
   const r=await C.rpc("lex_staff_skill_progress",{p_student:s.id,p_course:(state.roster.assignments||[]).find(a=>a.id===state.assignment)?.course_id});
   if(!r.error&&r.data)reports.push(r.data);
  }
  if(reports.length<5){node.innerHTML='<p class="notice">البيانات المتاحة لأقل من خمسة طلاب، لذلك لا نعرض متوسطًا جماعيًا.</p>';return;}
  const means={recall:[],understanding:[]};
  const groups=new Map();
  let completed=0;
  for(const r of reports){
   completed+=Math.max(0,Number(r.completed_sessions)||0);
   for(const dim of ["recall","understanding"]){
    const n=num(r.diagnostic?.[dim]);
    if(n!==null&&n>=0&&n<=100)means[dim].push(n);
   }
   (r.checkpoints||[]).forEach(c=>{
    const key=[c.period,c.dimension,c.rubric_version||"unspecified"].join("|");
    const group=groups.get(key)||{period:c.period,dimension:c.dimension,rubric:c.rubric_version,students:0,values:[]};
    if(num(c.percent)!==null){group.students++;group.values.push(num(c.percent));groups.set(key,group);}
   });
  }
  const average=v=>Math.round(v.reduce((a,b)=>a+b,0)/v.length)+"%";
  const baseline=dim=>means[dim].length>=5?average(means[dim]):"بيانات غير كافية";
  const points=[...groups.values()].filter(x=>x.students>=5).sort((a,b)=>a.period-b.period);
  node.innerHTML='<div class="grid three">'+
   '<div class="metric"><span>الطلاب المشمولون</span><strong>'+reports.length+'</strong><small>من '+students.length+' طالبًا ضمن المادة</small></div>'+
   '<div class="metric"><span>متوسط الحفظ عند التشخيص</span><strong>'+baseline("recall")+'</strong><small>عدد القياسات: '+means.recall.length+'</small></div>'+
   '<div class="metric"><span>متوسط الفهم عند التشخيص</span><strong>'+baseline("understanding")+'</strong><small>عدد القياسات: '+means.understanding.length+'</small></div></div>'+
   '<p class="hint">إجمالي الجلسات المكتملة لهؤلاء الطلاب: '+completed+'. هذه تقديرات أولية وليست درجات جامعية.</p>'+
   '<h3>تطور المجموعة بعد كل خمس جلسات</h3>'+
   (points.length?'<div class="tableScroll"><table class="dataTable"><thead><tr><th>الفترة</th><th>المهارة</th><th>الطلاب المقاسون</th><th>متوسط التقدير</th></tr></thead><tbody>'+
   points.map(x=>'<tr><td>الفترة '+x.period+'</td><td>'+esc(dimension(x.dimension))+'</td><td>'+x.students+'</td><td>'+average(x.values)+'</td></tr>').join("")+'</tbody></table></div>':
   '<p class="notice">لم تتوفر خمسة قياسات متكافئة في فترة متابعة واحدة بعد.</p>')+
   '<p class="hint">للمقارنة العلمية، تُجمع النتائج فقط عند توحيد فترة القياس ومعيار التصحيح؛ ولا يتم عرض الأسئلة أو الإجابات أو بنود التصحيح الفردية.</p>'+policy();
 }catch(_){node.innerHTML='<p class="danger">تعذر إتمام التحليل الجماعي.</p>';}
}
async function reload(){
 const c=await LEX_CLOUD.profile();
 if(!c||c.role!=="instructor"||c.active!==true)throw Error("FORBIDDEN");
 if(c.must_change_password){
  APP.innerHTML='<section class="panel"><div class="facultyProfileHeading"><span class="eyebrow">حساب الأستاذ الجامعي</span><button type="button" id="instructorLogout" class="facultyLogout">تسجيل الخروج</button></div><h1>تعيين كلمة مرور دائمة للدكتور</h1><p>لأمان بيانات الطلاب، يجب تغيير كلمة المرور المؤقتة قبل عرض أي سجل تعليمي.</p>'+
   '<form id="firstProfessorPassword">'+passwordFields()+
   '<button type="submit" class="primary">حفظ كلمة المرور الجديدة</button><p id="activateMessage" role="status" aria-live="polite"></p></form></section>';
  bindLogout();
  document.getElementById("firstProfessorPassword").onsubmit=async e=>{
   e.preventDefault();await savePasswordAndRelogin(e.currentTarget,"activateMessage");
  };
  return;
 }
 const r=await C.rpc("lex_instructor_roster");
 if(r.error||!r.data||!r.data.profile)throw r.error||Error("no_profile");
 state.roster=r.data;
 state.assignment=state.assignment||(r.data.assignments||[])[0]?.id||"";
 render();
}
reload().catch(()=>APP.innerHTML='<section class="panel danger"><h2>تعذر فتح حساب الدكتور</h2><p>لا توجد صلاحية تدريس نشطة للحساب، أو لا توجد بيانات أكاديمية مكتملة. تواصل مع المشرف.</p><a href="instructor-login.html">العودة لتسجيل الدخول</a></section>');
})();