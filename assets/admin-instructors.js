(function(){
"use strict";
const APP=document.getElementById("adminInstructorApp"),C=LEX_CLOUD.db();
const esc=v=>String(v??"").replace(/[&<>"']/g,k=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[k]));
let state={teachers:[],assignments:[],courses:[],credential:null,editing:new URLSearchParams(location.search).get("edit")||"",cohort:null,cohortId:new URLSearchParams(location.search).get("cohort")||""};
async function readableError(error){
 let code=error?.message||"";
 try{if(error?.context?.json){const body=await error.context.json();code=body.error||code;}}catch(_){}
 const messages={
  invalid_email:"صيغة البريد غير صحيحة. مثال: professor@gmail.com. يُقبل البريد الشخصي والجامعي.",
  invalid_instructor_name:"أدخل اسم الدكتور كاملًا (خمسة أحرف على الأقل عند إنشاء الحساب).",
  invalid_whatsapp:"رقم واتساب غير صحيح. اكتبه بالصيغة الدولية، مثل +201000000000، أو اتركه فارغًا.",
  email_already_registered:"هذا البريد مسجل لحساب آخر. افتح الحساب الموجود لتعديله أو استخدم بريدًا آخر.",
  official_email_already_registered:"هذا البريد مسجل لحساب دكتور آخر. افتح حسابه من السجل أدناه.",
  missing_course_scope:"أكمل المادة والدولة والجامعة والكلية والفرقة في التكليف الأكاديمي.",
  course_not_available:"اختر مقررًا منشورًا يتدرب عليه الطلاب؛ المقررات المرجعية غير متاحة للتكليف.",
  assignment_not_found:"التكليف غير موجود. حدّث الصفحة.",
  assignment_conflict:"يوجد تكليف مماثل للدكتور بالفعل. راجع التكليفات الحالية.",
  invalid_scope:"راجع المادة والدولة والجامعة والكلية والفرقة في التكليف الأكاديمي.",
  instructor_assignment_failed:"تعذر حفظ تكليف المادة، وأُلغي إنشاء الحساب. راجع المقرر وبيانات التكليف.",
  instructor_password_reset_failed:"تعذر إصدار كلمة مرور جديدة للدكتور. تواصل مع المسؤول التقني إذا تكرر الخطأ.",
  temporary_login_verification_failed:"تغيرت كلمة المرور لكن فشل اختبار دخولها آليًا؛ أصدر كلمة مؤقتة أخرى قبل إرسالها للدكتور.",
  account_creation_failed:"تعذر إنشاء الحساب في خدمة الدخول. حاول مرة أخرى؛ لا يشترط بريد جامعي.",
  email_update_failed:"تعذر تغيير بريد تسجيل الدخول. لم يُحفظ البريد الجديد.",
  instructor_update_not_confirmed:"لم يتأكد حفظ التعديلات. حدّث الصفحة لمراجعة البيانات قبل المحاولة مجددًا.",
  UNAUTHORIZED:"انتهت جلسة الدخول. سجّل دخول المشرف مجددًا.",
  FORBIDDEN:"هذه العملية متاحة للمشرف المفوض ومالك المنصة فقط."
 };
 return messages[code]||"تعذر إتمام العملية. تحقق من الاتصال وحاول مجددًا؛ لا يعني هذا بالضرورة وجود خطأ في البريد.";
}
function scopeFields(prefix,showTeacher=false){
 const options=state.courses.filter(c=>c.status==="approved"&&!c.metadata?.reference_track_only).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.title_ar||c.id)+' — '+esc(c.id)+'</option>').join("");
 return '<div class="grid">'+
 (showTeacher?'<label>الدكتور<select name="instructor_id" required>'+state.teachers.map(x=>'<option value="'+x.instructor_id+'">'+esc(x.profiles?.display_name||x.official_email)+'</option>').join("")+'</select></label>':'')+
 '<label>المادة الموجودة في LexLearn<select name="course_id" required>'+options+'</select></label>'+
 '<label>عنوان المادة<input name="subject_name" required maxlength="160" placeholder="نظرية الحق"></label>'+
 '<label>الدولة<select name="country_code"><option value="qa">قطر</option><option value="eg">مصر</option><option value="sa">السعودية</option><option value="ae">الإمارات</option><option value="other">أخرى</option></select></label>'+
 '<label>الجامعة<input name="university" required maxlength="160" placeholder="اكتب اسم الجامعة بنفس صيغة تسجيل طلابها"></label>'+
 '<label>الكلية<input name="faculty" required maxlength="160" placeholder="كلية الحقوق"></label>'+
 '<label>الفرقة<select name="year_label"><option value="السنة الأولى">الفرقة الأولى</option><option value="السنة الثانية">الفرقة الثانية</option><option value="السنة الثالثة">الفرقة الثالثة</option><option value="السنة الرابعة">الفرقة الرابعة</option></select></label></div>'+
 '<p class="hint">التطابق يتم وفق الدولة والجامعة والكلية والفرقة والمقرر، وليس مجرد نفس اسم الجامعة. لن تظهر للدكتور حسابات الطلاب خارج هذا النطاق.</p>';
}
function form(){
 return '<section class="panel"><h1>تسجيل بيانات الأساتذة الجامعيين</h1><p>إضافة حساب أكاديمي من داخل لوحة المشرف فقط، وتحديد المقرر والفرقة والكلية والجامعة.</p>'+
 '<form id="createInstructor"><div class="grid"><label>اسم عضو هيئة التدريس<input name="name" required maxlength="160"></label>'+
 '<label>البريد الإلكتروني للدكتور<input name="email" type="email" required maxlength="254" placeholder="professor@gmail.com" autocomplete="email" dir="ltr"></label>'+
 '<label>اللقب العلمي<select name="academic_title"><option>دكتور</option><option>أستاذ مساعد</option><option>أستاذ مشارك</option><option>أستاذ</option></select></label>'+
 '<label>التخصص<input name="specialization" maxlength="160" placeholder="القانون المدني"></label>'+
 '<label>رقم واتساب دولي (اختياري)<input name="whatsapp" placeholder="+201000000000"></label></div>'+
 '<p class="hint">يُقبل Gmail والبريد الشخصي أو الجامعي. يُستخدم هذا البريد لتسجيل دخول الدكتور.</p><h3>التكليف الأكاديمي الأول</h3>'+scopeFields("new")+
 '<button class="primary" type="submit">إنشاء حساب الدكتور وتكليفه بالمادة</button><p id="createStatus" role="status"></p></form></section>'+
 '<section class="panel"><h2>إسناد مادة أو فرقة إضافية لدكتور مسجل</h2><form id="assignInstructor">'+scopeFields("extra",true)+
 '<button type="submit" class="secondary">إضافة تكليف أكاديمي</button><p id="assignmentStatus" role="status"></p></form></section>';
}
function editTeacher(t){
 if(state.editing!==t.instructor_id)return "";
 function field(label,name,val,max,type){
  return '<label>'+label+'<input name="'+name+'" maxlength="'+max+'" type="'+(type||"text")+'" value="'+esc(val||"")+'" '+(name==="name"||name==="email"?'required':'')+'></label>';
 }
 return '<form class="facultyEditForm" data-update-teacher="'+esc(t.instructor_id)+'">'+
  '<h3>تعديل بطاقة الدكتور</h3><p class="hint">تحديث البريد الإلكتروني يغيّر بريد تسجيل دخول الدكتور. الجامعة والفرقة والمادة تُدار من التكليفات أدناه.</p>'+
  '<div class="grid">'+
  field("اسم الدكتور","name",t.profiles?.display_name,160)+
  field("البريد الإلكتروني للدكتور","email",t.official_email,254,"email")+
  field("اللقب العلمي","academic_title",t.academic_title,90)+
  field("التخصص","specialization",t.specialization,160)+
  field("الواتساب الدولي (اختياري)","whatsapp",t.whatsapp_e164,24)+
  field("الساعات المكتبية","office_hours",t.office_hours,160)+
  '</div><label>نبذة عن الدكتور<textarea name="bio" maxlength="600">'+esc(t.bio||"")+'</textarea></label>'+
  '<button class="primary" type="submit">حفظ تعديلات الدكتور</button> '+
  '<button class="secondary" type="button" data-cancel-edit>إلغاء</button>'+
  '<p role="status" class="editTeacherStatus"></p></form>';
}
function list(){
 return '<section class="panel"><h2>سجل الدكاترة والتكليفات</h2><p>'+state.teachers.length+' عضو هيئة تدريس مسجل</p>'+
 (!state.teachers.length?'<p class="notice">لا توجد حسابات دكاترة بعد. أنشئ الحساب الأول من النموذج بالأعلى.</p>':state.teachers.map(t=>{
 const a=state.assignments.filter(x=>x.instructor_id===t.instructor_id);
 return '<div class="summary"><div class="toolbar"><div><h3>'+esc(t.academic_title||"دكتور")+' '+esc(t.profiles?.display_name||"")+'</h3><p>'+esc(t.official_email)+' • '+esc(t.specialization||"")+'</p><small>واتساب: '+esc(t.whatsapp_e164||"—")+'</small></div>'+
 '<div class="actions"><button data-edit-teacher="'+t.instructor_id+'" class="secondary">فتح وتعديل البيانات</button> '+
 '<button type="button" data-reset-teacher="'+esc(t.instructor_id)+'" class="secondary">إصدار كلمة مرور بديلة</button> '+
 '<button data-teacher="'+t.instructor_id+'" data-active="'+(t.profiles?.active?"false":"true")+'" class="secondary">'+(t.profiles?.active?"تعطيل حساب الدكتور":"تفعيل الحساب")+'</button></div></div>'+
 editTeacher(t)+
  a.map(x=>'<div class="course"><b>'+esc(x.subject_name)+'</b><p>'+esc(window.LEX_ACADEMIC.university(x.university))+' — '+esc(x.faculty)+' — '+esc(window.LEX_ACADEMIC.year(x.year_label))+'</p>'+
 '<p class="hint">المقرر: '+esc(state.courses.find(c=>c.id===x.course_id)?.title_ar||x.course_id)+'</p>'+
 '<details class="assignmentEditor"><summary>تعديل التكليف والمقرر</summary><form data-edit-assignment="'+esc(x.id)+'" data-instructor="'+esc(t.instructor_id)+'">'+scopeFields('edit')+'<button type="submit" class="primary">حفظ التكليف</button><p role="status"></p></form></details>'+
 '<button type="button" class="secondary" data-assignment="'+x.id+'" data-owner="'+t.instructor_id+'" data-active="'+(!x.active)+'">'+(x.active?"إيقاف تكليف":"تفعيل تكليف")+'</button></div>').join("")+'</div>';
 }).join(""))+'</section>';
}
function useCohortDefaults(form){
 if(!state.cohort||!form)return;
 const g=state.cohort;
 const values={course_id:g.course_id||"qa-qu-lawc101-rights",
 subject_name:g.subject_name||"نظرية الحق",country_code:g.country_code||"qa",
 university:g.institution||"",faculty:g.faculty||"كلية الحقوق",
 year_label:g.academic_year||"السنة الأولى"};
 for(const [key,value] of Object.entries(values)){
  const input=form.elements.namedItem(key);if(!input||!value)continue;
  if(key==="year_label")input.value=["السنة الأولى","السنة الثانية","السنة الثالثة","السنة الرابعة"]
   .find(y=>LEX_ACADEMIC.year(y)===LEX_ACADEMIC.year(value))||"السنة الأولى";
  else input.value=value;
 }
}
function page(){
 APP.innerHTML=(state.cohort?'<section class="panel notice"><h2>إضافة أستاذ جامعي لمجموعة '+esc(state.cohort.name)+'</h2><p>بيانات الجامعة والكلية والفرقة والمادة أدناه مملوءة تلقائيًا. اختر إسناد تكليف لدكتور مسجل أو أنشئ حساب دكتور جديدًا. التكليف يشمل الطلاب المطابقين لنفس النطاق الأكاديمي.</p><a href="admin.html#cohorts">العودة إلى المجموعات</a></section>':'')+'<section class="panel"><span class="eyebrow">إدارة أكاديمية مستقلة عن الطلاب</span><h1>حسابات أساتذة الجامعات</h1><p>يتم إصدار اسم الدخول وكلمة مرور مؤقتة من المشرف. لا يظهر للدكتور شيء من وظائف إدارة الطالب أو أدوات مراجعة المحتوى.</p><a href="instructor-login.html" target="_blank" rel="noopener">فتح بوابة دخول الدكتور وإرسال رابطها إليه</a></section>'+
 (state.credential?'<section class="panel notice"><h2>بيانات الدخول الأولية — تظهر مرة واحدة</h2><p>البريد الإلكتروني: <b>'+esc(state.credential.email)+'</b></p><p>كلمة المرور المؤقتة: <b>'+esc(state.credential.temporary_password)+'</b></p><div class="actions"><button id="copyTeacherPassword" type="button" class="primary">نسخ كلمة المرور فقط</button><button id="copyTeacher" type="button" class="secondary">نسخ بيانات الدخول كاملة</button></div><p class="hint">'+(state.credential.login_verified?'تم اختبار كلمة المرور الجديدة بنجاح من خدمة الدخول. ':'')+'سلّمها للدكتور بقناة آمنة واطلب منه تغيير كلمة المرور. لا نحتفظ بها داخل سجل الإدارة.</p></section>':'')+
 form()+list();
 if(state.cohort){
  useCohortDefaults(document.getElementById("createInstructor"));
  useCohortDefaults(document.getElementById("assignInstructor"));
 }
 if(state.editing){const current=document.querySelector('.facultyEditForm');if(current)current.scrollIntoView({block:"nearest"});}
 document.getElementById("createInstructor").onsubmit=async e=>{
  e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget));
  const status=document.getElementById("createStatus"),submit=e.currentTarget.querySelector('[type="submit"]');submit.disabled=true;status.textContent="جارٍ إنشاء حساب الدكتور…";
  try{const x=await C.functions.invoke("admin-manage-instructors",{body:{action:"create",...b}});
   if(x.error||!x.data?.ok)throw x.error||Error(x.data?.error);
   state.credential=x.data;await reload();
  }catch(error){status.textContent=await readableError(error);}finally{submit.disabled=false;}
 };
 document.getElementById("assignInstructor").onsubmit=async e=>{
  e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget)),status=document.getElementById("assignmentStatus");
  status.textContent="جارٍ حفظ التكليف…";
  try{const x=await C.functions.invoke("admin-manage-instructors",{body:{action:"assignment",...b}});
   if(x.error||!x.data?.ok)throw x.error||Error(x.data?.error);
   await reload();
  }catch(error){status.textContent=await readableError(error);}
 };
 document.querySelectorAll("[data-edit-assignment]").forEach(form=>{
  const scope=state.assignments.find(x=>x.id===form.dataset.editAssignment);
  for(const name of ["course_id","subject_name","country_code","university","faculty","year_label"]){
   const el=form.elements.namedItem(name);let value=scope[name];
   if(name==="year_label")value=["السنة الأولى","السنة الثانية","السنة الثالثة","السنة الرابعة"].find(x=>LEX_ACADEMIC.year(x)===LEX_ACADEMIC.year(value))||value;
   if(el.tagName==="SELECT"&&![...el.options].some(x=>x.value===value)){
    const option=new Option(name==="course_id"?"المقرر الحالي غير منشور — اختر مقررًا منشورًا":value,value,true,true);option.disabled=true;el.add(option);
   }
   el.value=value;
  }
  form.onsubmit=async e=>{
   e.preventDefault();const status=form.querySelector('[role="status"]'),submit=form.querySelector('[type="submit"]');
   submit.disabled=true;status.textContent="جارٍ حفظ التكليف…";
   try{const reply=await C.functions.invoke("admin-manage-instructors",{body:{action:"update-assignment",assignment_id:form.dataset.editAssignment,instructor_id:form.dataset.instructor,...Object.fromEntries(new FormData(form))}});
    if(reply.error||!reply.data?.ok)throw reply.error||Error(reply.data?.error);await reload();
   }catch(error){status.textContent=await readableError(error);submit.disabled=false;}
  };
 });
 document.querySelectorAll("[data-edit-teacher]").forEach(b=>b.onclick=()=>{
  state.editing=state.editing===b.dataset.editTeacher?"":b.dataset.editTeacher;
  history.replaceState(null,"",state.editing?"?edit="+encodeURIComponent(state.editing):location.pathname);
  page();
 });
 document.querySelectorAll("[data-cancel-edit]").forEach(b=>b.onclick=()=>{
  state.editing="";history.replaceState(null,"",location.pathname);page();
 });
 document.querySelectorAll("[data-update-teacher]").forEach(form=>form.onsubmit=async e=>{
  e.preventDefault();const status=form.querySelector(".editTeacherStatus");
  const submit=form.querySelector('[type="submit"]');submit.disabled=true;status.textContent="جارٍ حفظ بيانات الدكتور…";
  try{
   const b=Object.fromEntries(new FormData(form).entries());
   const reply=await C.functions.invoke("admin-manage-instructors",{body:{action:"update",instructor_id:form.dataset.updateTeacher,...b}});
   if(reply.error||!reply.data?.ok)throw reply.error||Error(reply.data?.error||"not_saved");
   await reload();
   const updated=document.querySelector(".facultyEditForm .editTeacherStatus");
   if(updated)updated.textContent="تم تحديث بيانات الدكتور.";
  }catch(error){submit.disabled=false;status.textContent=await readableError(error);}
 });
 document.querySelectorAll("[data-reset-teacher]").forEach(b=>b.onclick=async()=>{
  const teacher=state.teachers.find(t=>t.instructor_id===b.dataset.resetTeacher);
  if(!teacher||!confirm("إصدار كلمة مرور مؤقتة جديدة للدكتور "+(teacher.profiles?.display_name||teacher.official_email)+"؟ ستتوقف كلمة المرور السابقة، ولن تتغير صلاحيات الحساب."))return;
  b.disabled=true;
  try{
   const reply=await C.functions.invoke("admin-manage-instructors",{body:{action:"reset-password",instructor_id:teacher.instructor_id}});
   if(reply.error||!reply.data?.ok||!reply.data?.temporary_password)throw reply.error||Error(reply.data?.error||"instructor_password_reset_failed");
   state.credential=reply.data;page();
   window.scrollTo(0,0);
  }catch(error){b.disabled=false;alert(await readableError(error));}
 });
 document.querySelectorAll("[data-teacher]").forEach(b=>b.onclick=async()=>{
  if(!confirm("تأكيد تعديل حالة حساب الدكتور؟"))return;
  b.disabled=true;await C.functions.invoke("admin-manage-instructors",{body:{action:"set-active",instructor_id:b.dataset.teacher,active:b.dataset.active==="true"}});await reload();
 });
 document.querySelectorAll("[data-assignment]").forEach(b=>b.onclick=async()=>{
  b.disabled=true;await C.functions.invoke("admin-manage-instructors",{body:{action:"scope-active",
   instructor_id:b.dataset.owner,assignment_id:b.dataset.assignment,active:b.dataset.active==="true"}});await reload();
 });
   const onlyPassword=document.getElementById("copyTeacherPassword");
  if(onlyPassword)onlyPassword.onclick=async()=>{try{await navigator.clipboard.writeText(state.credential.temporary_password);onlyPassword.textContent="تم نسخ كلمة المرور فقط";}catch(_){alert("تعذر النسخ التلقائي؛ اضغط مطولًا على كلمة المرور وحدد نسخ.");}};
const copy=document.getElementById("copyTeacher");
 if(copy)copy.onclick=()=>navigator.clipboard.writeText("LexLearn\nالبريد: "+state.credential.email+"\nكلمة المرور المؤقتة: "+state.credential.temporary_password+"\nhttps://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/instructor-login.html");
}
async function reload(){
 const me=await LEX_CLOUD.profile();
 if(!me||!["owner","admin"].includes(me.role)||me.active!==true)throw Error("FORBIDDEN");
 const [x,c,group]=await Promise.all([

  C.functions.invoke("admin-manage-instructors",{body:{action:"list"}}),
  C.from("courses").select("id,title_ar,country_code,status,metadata").order("title_ar"),
  state.cohortId&&/^[0-9a-f-]{36}$/i.test(state.cohortId)?C.from("cohorts").select("id,name,institution,academic_year,faculty,country_code,course_id,subject_name").eq("id",state.cohortId).maybeSingle():Promise.resolve({data:null,error:null})
 ]);
 if(x.error||!x.data?.ok||c.error)throw Error("load_failed");
 if(group.error)throw Error("cohort_load_failed");state.cohort=group.data||null;
 state.teachers=x.data.instructors||[];state.assignments=x.data.assignments||[];state.courses=c.data||[];
 page();
}
reload().catch(()=>APP.innerHTML='<section class="panel danger"><h2>تعذر فتح سجل الأساتذة</h2><p>هذه الصفحة مخصصة لمالك LexLearn والمشرف المفوض فقط. راجع تسجيل الدخول وصلاحيات الحساب.</p><a href="admin-login.html">دخول المشرف</a></section>');
})();