(function(){
"use strict";
const cloud=window.LEX_CLOUD, root=document.getElementById("workspace"), loading=document.getElementById("loading");
const msg=document.getElementById("msg"), booksEl=document.getElementById("books"),detail=document.getElementById("detail");
let state={books:[],pages:[],links:[],items:[],courses:[],uploads:[],countries:[],universities:[],faculties:[],can_approve:false},selected=null,locked=false;
const $=id=>document.getElementById(id);
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const kind={textbook:"كتاب",legislation:"تشريع",exam:"امتحان",lecture:"محاضرة",academic_study:"بحث علمي",model_answer:"نموذج إجابة",course_outline:"خطة مقرر",summary:"ملخص أو مذكرة"};
const semesterText={first:"الفصل الأول",second:"الفصل الثاني",both:"الفصلان",unassigned:"لم يُحدد الفصل"};
const country={qa:"قطر",eg:"مصر",sa:"السعودية",ae:"الإمارات",kw:"الكويت",bh:"البحرين",om:"عُمان",jo:"الأردن",ma:"المغرب",tn:"تونس",dz:"الجزائر",general:"عام"};
function notice(t,fail=false){msg.style.display="block";msg.textContent=t;msg.style.background=fail?"#ffece9":"#e6f0fa";msg.scrollIntoView({behavior:"smooth",block:"nearest"});}
async function call(body){
 const r=await cloud.db().functions.invoke("lexlearn-reference-library",{body});
 if(r.error){let txt=r.error.message||"تعذّر الاتصال";try{if(r.error.context){const j=await r.error.context.json();txt=j.error||txt;}}catch(_){}throw Error(txt);}
 if(r.data?.error)throw Error(r.data.error);
 return r.data;
}

const REGION_EXCLUDE=new Set(["EU","UN","QO","AC","CP","DG","EA","IC","TA","XA","XB","ZZ"]);
const regionNames=typeof Intl.DisplayNames==="function"?new Intl.DisplayNames(["ar"],{type:"region"}):null;
const regionOptions=[];
for(let i=65;i<=90;i++)for(let j=65;j<=90;j++){
 const code=String.fromCharCode(i,j),label=regionNames?.of(code);
 if(label&&label!==code&&!REGION_EXCLUDE.has(code)&&!/غير معروفة/.test(label))regionOptions.push({code:code.toLowerCase(),name:label});
}
regionOptions.sort((a,b)=>a.name.localeCompare(b.name,"ar"));
function selectedDirectory(){
 return {country:$("jurisdictionSelect")?.value||"qa",university:$("universitySelect")?.value||"",faculty:$("facultySelect")?.value||"",course:$("courseSelect")?.value||""};
}
function updateCourses(preferred=""){
 const sel=$("courseSelect"),countryCode=$("jurisdictionSelect").value,universityKey=$("universitySelect").value;
 if(!sel)return;
 const courses=state.courses.filter(c=>universityKey&&c.country_code===countryCode&&c.institution_key===universityKey);
 sel.innerHTML='<option value="">بدون مقرر محدد (مرجع عام للجامعة أو الكلية)</option>'+
 courses.map(c=>'<option value="'+escape(c.id)+'">'+escape(c.title_ar+" — "+(c.course_code||c.id))+'</option>').join("");
 if(courses.some(c=>c.id===preferred))sel.value=preferred;
}
function updateFaculties(preferred=""){
 const uni=state.universities.find(u=>u.institution_key===$("universitySelect").value);
 const sel=$("facultySelect");
 const faculties=uni?state.faculties.filter(f=>f.university_id===uni.id):[];
 sel.innerHTML='<option value="">'+(uni?"اختر كلية القانون":"اختر الجامعة أولًا")+'</option>'+
 faculties.map(f=>'<option value="'+escape(f.id)+'">'+escape(f.name_ar+(f.provenance==="staff_added"?" (مضافة من المشرف)":""))+'</option>').join("");
 sel.disabled=!uni;
 if(faculties.some(f=>f.id===preferred))sel.value=preferred;
 $("directoryHint").textContent=uni
  ?("الجامعة: "+uni.name_ar+". اختر كلية القانون، ثم المقرر إن وجد. لا تنتقل مراجعها إلى دولة أخرى.")
  :("يمكنك تسجيل مرجع عام للدولة دون جامعة، أو اختيار جامعة وكلية القانون. الجامعات غير الموجودة يمكن إضافتها أدناه.");
}
function updateUniversities(preferred="",faculty="",course=""){
 const countryCode=$("jurisdictionSelect").value;
 const sel=$("universitySelect");
 const universities=state.universities.filter(u=>u.country_code===countryCode);
 sel.innerHTML='<option value="">مرجع قانوني عام للدولة (بدون جامعة)</option>'+
 universities.map(u=>'<option value="'+escape(u.institution_key)+'">'+escape(u.name_ar+(u.provenance==="staff_added"?" (مضافة من المشرف)":""))+'</option>').join("");
 if(universities.some(u=>u.institution_key===preferred))sel.value=preferred;
 updateFaculties(faculty);updateCourses(course);
 $("universityCountryHint").textContent="الدولة التي ستضاف إليها الجامعة: "+(state.countries.find(c=>c.code===countryCode)?.name_ar||countryCode);
}
function renderDirectory(preserve={}){
 const countrySelect=$("jurisdictionSelect");
 const codes=state.countries||[];
 countrySelect.innerHTML='<option value="general">مرجع عام غير مرتبط بدولة</option>'+
 codes.map(c=>'<option value="'+escape(c.code)+'">'+escape(c.name_ar)+'</option>').join("");
 countrySelect.value=preserve.country==="general"?"general":(codes.some(c=>c.code===preserve.country)?preserve.country:(codes.some(c=>c.code==="qa")?"qa":codes[0]?.code||"general"));
 updateUniversities(preserve.university||"",preserve.faculty||"",preserve.course||"");
 const enabled=new Set(codes.map(c=>c.code));
 const avail=regionOptions.filter(r=>!enabled.has(r.code));
 $("countryToAdd").innerHTML='<option value="" selected disabled>اختر الدولة من القائمة</option>'+avail.map(r=>'<option value="'+escape(r.code)+'">'+escape(r.name)+" ("+r.code.toUpperCase()+")"+'</option>').join("");
 $("countryToAdd").disabled=!avail.length;
 $("directoryAdmin").hidden=!state.can_approve;
}
function placement(form){return {semester_scope:form.elements.namedItem("semester_scope")?.value||"",lecture_number:form.elements.namedItem("lecture_number")?.value||"",unit_title:form.elements.namedItem("unit_title")?.value||""};}
function renderBooks(){
 if(!state.books.length){booksEl.innerHTML='<p class="muted">لا توجد كتب مسجلة بعد.</p>';return;}
 const groups={};state.books.forEach(b=>{let c=state.courses.find(x=>x.id===b.course_id);let u=state.universities.find(x=>x.institution_key===(c?.institution_key||b.institution_key));let k=(state.countries.find(x=>x.code===b.jurisdiction)?.name_ar||country[b.jurisdiction]||b.jurisdiction)+" · "+(u?.name_ar||"مرجع عام")+" · "+(c?.title_ar||b.subject_name)+" · "+(semesterText[b.semester_scope]||"لم يُحدد الفصل");(groups[k]||(groups[k]=[])).push(b);});
 booksEl.innerHTML=Object.entries(groups).map(([group,books])=>'<h3 style="font-size:14px;margin:14px 0 5px">'+escape(group)+'</h3>'+books.map(b=>
   '<button type="button" class="bookBtn '+(b.id===selected?"active":"")+'" data-book="'+escape(b.id)+'"><b>'+escape(b.title)+'</b><br><small>'+escape((semesterText[b.semester_scope]||"غير محدد")+" · "+(b.lecture_number?"محاضرة "+b.lecture_number:"كل المحاضرات/غير محدد")+" · "+(b.curriculum_name||"عام"))+' · '+escape(b.status==="approved"?"معتمد":"مسودة")+'</small></button>').join("")).join("");
 booksEl.querySelectorAll("[data-book]").forEach(btn=>btn.addEventListener("click",()=>{selected=btn.dataset.book;renderBooks();renderDetail();}));
}
function renderDetail(){
 const b=state.books.find(x=>x.id===selected);if(!b){detail.textContent="اختر كتابًا من القائمة.";return;}
 const pages=state.pages.filter(x=>x.book_id===b.id).sort((x,y)=>x.page_number-y.page_number);
 const items=state.items.filter(x=>(!b.course_id||x.course_id===b.course_id)&&(b.jurisdiction==="general"||state.courses.find(c=>c.id===x.course_id)?.country_code===b.jurisdiction));
 const ups=state.uploads.filter(x=>x.book_id===b.id);
 const diagCourse="qa-qu-lawc101-rights";
 const diagAllowed=state.can_approve&&b.status==="approved"&&
    (b.jurisdiction==="qa"||b.jurisdiction==="general")&&(!b.course_id||b.course_id===diagCourse);
 const diagLinks=state.diagnostic_links||[];
 detail.innerHTML='<h2>'+escape(b.title)+'</h2><p class="muted">'+escape((country[b.jurisdiction]||b.jurisdiction)+" · "+b.curriculum_name+" · "+b.subject_name+" · "+(kind[b.reference_kind]||b.reference_kind))+'</p>'+
 '<p class="muted">الجامعة: '+escape(state.universities.find(u=>u.institution_key===(state.courses.find(c=>c.id===b.course_id)?.institution_key||b.institution_key))?.name_ar||"عام")+' · '+escape(semesterText[b.semester_scope]||"غير محدد")+' · '+escape(b.lecture_number?"المحاضرة "+b.lecture_number:"رقم المحاضرة غير محدد")+' · '+escape(b.unit_title||"لم يحدد الموضوع")+' · الكلية: '+escape(state.faculties.find(f=>f.id===b.faculty_id)?.name_ar||"غير محددة")+'</p>'+
 (b.source_url&&/^https:\/\//.test(b.source_url)?'<p><a href="'+escape(b.source_url)+'" target="_blank" rel="noopener noreferrer">فتح المصدر الأصلي ↗</a></p>':"")+
 '<p class="muted">التوثيق: '+escape(b.authenticity||"unverified")+' · حقوق الاستخدام: '+escape(b.rights_status||"link_only")+'</p>'+
 (b.source_note?'<p class="muted">'+escape(b.source_note)+'</p>':"")+
 '<div class="stack"><span class="tag">حالة المرجع: '+escape(b.status)+'</span>'+
 (state.can_approve&&b.status==="draft"?'<button type="button" id="approveBook">اعتماد المرجع</button>':"")+'</div><hr>'+
 '<h2>تغذية الذكاء الاصطناعي بملفات وصور</h2>'+
 '<p class="muted">ارفع صورة أو PDF. سنحفظ الملف الأصلي بصورة خاصة ونستخرج النص إلى صفحات مسودة قابلة للتصحيح. في كل دفعة من PDF نعالج حتى 8 صفحات لتجنب التكاليف المفاجئة.</p>'+
 '<form id="fileForm"><label>اختر ملف PDF أو صورة (بحد أقصى 12 ميجابايت)<input id="sourceFile" type="file" accept=".pdf,application/pdf,image/jpeg,image/png,image/webp" required></label>'+
 '<label>الفصل المرتبط بالصفحات<select name="semester_scope"><option value="">حسب المرجع</option><option value="first">الأول</option><option value="second">الثاني</option></select></label><label>رقم المحاضرة<input type="number" name="lecture_number" min="1" max="100" placeholder="حسب المرجع"></label><label>موضوع المحاضرة<input name="unit_title" maxlength="180" placeholder="حسب المرجع"></label>'+
 '<div class="stack"><div style="flex:1"><label>من صفحة PDF<input name="start" type="number" min="1" value="1"></label></div>'+
 '<div style="flex:1"><label>إلى صفحة PDF (8 كحد أقصى)<input name="end" type="number" min="1" placeholder="تلقائي"></label></div>'+
 '<div style="flex:1"><label>رقم صفحة الصورة<input name="imagePage" type="number" min="1" value="1"></label></div></div>'+
 '<button type="submit">حفظ الملف واستخراج النصوص</button></form><hr>'+
 '<h2>إضافة نص علمي يدويًا</h2><form id="textForm"><label>الفصل المرتبط بالصفحة<select name="semester_scope"><option value="">حسب المرجع</option><option value="first">الأول</option><option value="second">الثاني</option></select></label><label>رقم المحاضرة<input name="lecture_number" type="number" min="1" max="100" placeholder="حسب المرجع"></label><label>موضوع المحاضرة<input name="unit_title" maxlength="180" placeholder="حسب المرجع"></label><label>رقم الصفحة<input type="number" name="page_number" min="1" max="9999" required></label>'+
 '<label>النص المرجعي للصفحة<textarea name="excerpt" minlength="5" maxlength="7000" required placeholder="انسخ النص كما ورد بالكتاب"></textarea></label>'+
 '<button type="submit" class="secondary">إضافة الصفحة كمسودة</button></form><hr>'+
 '<h2>صفحات المرجع ('+pages.length+')</h2>'+
 (pages.length?pages.map(p=>{const links=state.links.filter(l=>l.page_id===p.id);
 return '<article class="page"><b>صفحة '+p.page_number+'</b> <small>'+escape(semesterText[p.semester_scope]||"غير محدد")+' · '+escape(p.lecture_number?"محاضرة "+p.lecture_number:"المحاضرة غير محددة")+' · '+escape(p.unit_title||"غير محدد")+'</small> <span class="tag">'+escape(p.status==="approved"?"معتمدة":"غير معتمدة")+'</span><p>'+escape(p.excerpt)+'</p>'+
 '<details><summary>مراجعة وتعديل النص</summary><textarea id="edit-'+p.id+'">'+escape(p.excerpt)+'</textarea><button type="button" class="secondary" data-save="'+p.id+'">حفظ التعديل كمسودة</button></details>'+
 '<div class="stack">'+(p.storage_path?'<button class="secondary" data-image="'+p.id+'">عرض الصورة الأصلية</button>':"")+
 (p.status==="draft"&&state.can_approve?'<button data-approve="'+p.id+'">اعتماد هذه الصفحة</button>':"")+'</div>'+
 (p.status==="approved"&&b.status==="approved"&&state.can_approve?
 '<div><label>اربط الصفحة بسؤال من نفس الدولة والمقرر</label><select id="item-'+p.id+'"><option value="">اختر السؤال…</option>'+items.map(i=>
 '<option value="'+escape(i.id)+'">'+escape(i.dimension+" — "+i.prompt_ar.slice(0,140))+'</option>').join("")+'</select><button class="secondary" data-link="'+p.id+'">ربط الصفحة بالسؤال</button></div>':"")+
 '<div class="muted">الأسئلة المرتبطة: '+(links.length?links.map(l=>escape(l.item_id)+' <button class="secondary" data-unlink="'+escape(p.id)+'" data-item="'+escape(l.item_id)+'">إزالة الربط</button>').join("، "):"لا يوجد")+'</div>'+
 (diagAllowed&&p.status==="approved"?
 (diagLinks.some(l=>l.page_id===p.id&&l.course_id===diagCourse)?
 '<button type="button" class="secondary" data-unlink-diagnostic="'+escape(p.id)+'">إزالة مرجع التشخيص القطري</button>':
 '<button type="button" class="secondary" data-link-diagnostic="'+escape(p.id)+'">ربط بمراجعة الإجابة الحرة في التشخيص القطري</button>'):"")+'</article>';
 }).join(""):'<p class="muted">لا توجد صفحات لهذا المرجع. ابدأ برفع ملف أو إدخال نص.</p>')+
 '<hr><h2>الملفات المحفوظة ('+ups.length+')</h2>'+
 (ups.length?ups.map(x=>'<p class="muted">'+escape(x.original_filename)+' · '+escape(new Date(x.created_at).toLocaleString("ar-EG"))+'</p>').join(""):'<p class="muted">لا يوجد ملف أصلي محفوظ بعد.</p>');
 const f=$("textForm");f.onsubmit=async e=>{e.preventDefault();await guarded(async()=>{await call({action:"save_page",book_id:b.id,page_number:Number(f.page_number.value),excerpt:f.excerpt.value,...placement(f)});notice("أضيف النص كمسودة. راجعه ثم اعتمده.");await refresh(b.id);});};
 $("fileForm").onsubmit=async e=>{e.preventDefault();await guarded(()=>ingest($("fileForm"),b));};
 if($("approveBook"))$("approveBook").onclick=()=>guarded(async()=>{await call({action:"approve_book",book_id:b.id});notice("تم اعتماد بيانات المرجع.");await refresh(b.id);});
 detail.querySelectorAll("[data-save]").forEach(x=>x.onclick=()=>guarded(async()=>{await call({action:"update_page",page_id:x.dataset.save,excerpt:$("edit-"+x.dataset.save).value});notice("تم حفظ النص؛ يحتاج إعادة اعتماد.");await refresh(b.id);}));
 detail.querySelectorAll("[data-approve]").forEach(x=>x.onclick=()=>guarded(async()=>{await call({action:"approve_page",page_id:x.dataset.approve});notice("اعتمدت الصفحة. يمكن الآن ربطها بسؤال.");await refresh(b.id);}));
 detail.querySelectorAll("[data-image]").forEach(x=>x.onclick=()=>guarded(async()=>{const d=await call({action:"signed_image",page_id:x.dataset.image});window.open(d.url,"_blank","noopener");}));
 detail.querySelectorAll("[data-link]").forEach(x=>x.onclick=()=>guarded(async()=>{const id=$("item-"+x.dataset.link).value;if(!id){notice("اختر سؤالًا أولًا.",true);return;}await call({action:"link",page_id:x.dataset.link,item_id:id});notice("تم الربط. سيُرسل نص هذه الصفحة تلقائيًا مع سؤال التدريب المعني إلى محرك OpenAI.");await refresh(b.id);}));
 detail.querySelectorAll("[data-unlink]").forEach(x=>x.onclick=()=>guarded(async()=>{await call({action:"unlink",page_id:x.dataset.unlink,item_id:x.dataset.item});notice("أزيل الربط دون حذف النص.");await refresh(b.id);}));
 detail.querySelectorAll("[data-link-diagnostic]").forEach(x=>x.onclick=()=>guarded(async()=>{
   await call({action:"link_diagnostic",page_id:x.dataset.linkDiagnostic,course_id:diagCourse});
   notice("تم الربط بسؤال الاسترجاع الحر في الاختبار التشخيصي القطري.");await refresh(b.id);
 }));
 detail.querySelectorAll("[data-unlink-diagnostic]").forEach(x=>x.onclick=()=>guarded(async()=>{
   await call({action:"unlink_diagnostic",page_id:x.dataset.unlinkDiagnostic,course_id:diagCourse});
   notice("أزيل ربط التشخيص.");await refresh(b.id);
 }));
}
async function guarded(task){
 if(locked)return;locked=true;
 detail.querySelectorAll("button").forEach(x=>x.disabled=true);
 try{await task();}catch(e){notice("تعذّر إتمام الإجراء: "+e.message,true);}
 finally{locked=false;detail.querySelectorAll("button").forEach(x=>x.disabled=false);}
}
function base64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",")[1]);r.onerror=()=>reject(Error("تعذرت قراءة الملف"));r.readAsDataURL(file);});}
async function ingest(form,b){
 const file=$("sourceFile").files[0];if(!file)throw Error("اختر ملفًا.");
 if(file.size>12000000||file.size<100)throw Error("حجم الملف غير مدعوم (100 بايت إلى 12 ميجابايت).");
 const mime=file.type||(/\.pdf$/i.test(file.name)?"application/pdf":"");
 if(!["application/pdf","image/jpeg","image/png","image/webp"].includes(mime))throw Error("نوع الملف غير مدعوم");
 notice("يتم حفظ الملف الأصلي في التخزين الخاص…");
 const data=await base64(file);
 await call({action:"upload_document",book_id:b.id,filename:file.name,mime,base64:data});
 if(mime!=="application/pdf"){
   const n=Number(form.imagePage.value);
   notice("تم حفظ الصورة. جارٍ استخراج النص من الصفحة رقم "+n+"…");
   await call({action:"extract_page",book_id:b.id,page_number:n,mime,image_base64:data,...placement(form)});
   notice("تم حفظ الصورة ونصها المستخرج كمسودة للمراجعة.");
   await refresh(b.id);return;
 }
 const pdfjs=await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
 pdfjs.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
 const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
 const start=Number(form.start.value||1),end=Number(form.end.value||Math.min(pdf.numPages,start+7));
 if(!Number.isInteger(start)||start<1||start>pdf.numPages||!Number.isInteger(end)||end<start||end>pdf.numPages||end-start>=8)throw Error("اختر نطاقًا صحيحًا بحد أقصى 8 صفحات من "+pdf.numPages+" صفحة.");
 let done=0,errors=[];
 for(let n=start;n<=end;n++){
   try{
    notice("تم حفظ PDF ("+pdf.numPages+" صفحة). جارٍ معالجة صفحة "+n+" من "+end+"…");
    const page=await pdf.getPage(n);
    const text=await page.getTextContent();
    const content=(text.items||[]).map(t=>t.str||"").join(" ").replace(/\s+/g," ").trim();
    if(content.length>=120){
      await call({action:"save_page",book_id:b.id,page_number:n,excerpt:content.slice(0,7000),...placement(form)});
    }else{
      const viewport=page.getViewport({scale:1.2});
      const canvas=document.createElement("canvas");
      canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
      await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
      const base64Image=canvas.toDataURL("image/jpeg",.76).split(",")[1];
      await call({action:"extract_page",book_id:b.id,page_number:n,mime:"image/jpeg",image_base64:base64Image,...placement(form)});
    }
    done++;
   }catch(e){errors.push("صفحة "+n+": "+e.message);}
 }
 notice("تم استخراج "+done+" صفحة كمسودات تحتاج مراجعة."+(errors.length?"\nلم تتم معالجة: "+errors.join("؛ "):"")+"\nلا تتأثر نتائج الطلاب إلا بعد اعتماد الصفحات وربطها بالأسئلة.",errors.length>0);
 await refresh(b.id);
}
async function refresh(keep,selectedValues){
 const preserve=selectedValues||selectedDirectory();
 const data=await call({action:"list"});
 state=data;selected=keep||selected||state.books[0]?.id||null;
 renderDirectory(preserve);renderBooks();renderDetail();
}
async function boot(){
 if(!cloud||!cloud.isConfigured()){location.replace("admin-login.html");return;}
 try{
 const p=await cloud.profile();
 if(!p||p.active!==true||!["owner","admin","instructor"].includes(p.role)){location.replace("admin-login.html");return;}
 loading.hidden=true;root.hidden=false;
 await refresh();
 $("jurisdictionSelect").addEventListener("change",()=>updateUniversities());
 $("universitySelect").addEventListener("change",()=>{updateFaculties();updateCourses();});
 $("countryForm").onsubmit=e=>{e.preventDefault();guarded(async()=>{
   const code=$("countryToAdd").value;
   const region=regionOptions.find(x=>x.code===code);
   if(!region)throw Error("اختر الدولة من القائمة.");
   await call({action:"add_country",country_code:code,country_name_ar:region.name});
   await refresh(undefined,{country:code});
   notice("أضيفت الدولة إلى القائمة؛ يمكنك الآن إضافة جامعاتها وكليات القانون.");
 });};
 $("universityForm").onsubmit=e=>{e.preventDefault();guarded(async()=>{
   const f=e.currentTarget,countryCode=$("jurisdictionSelect").value;
   if(countryCode==="general")throw Error("اختر دولة محددة قبل إضافة الجامعة.");
   const form=Object.fromEntries(new FormData(f).entries());
   const result=await call({action:"add_university",country_code:countryCode,...form});
   await refresh(undefined,{country:countryCode,university:result.institution_key,faculty:result.faculty_id});
   f.reset();notice("حُفظت الجامعة وكلية القانون ضمن الدولة المختارة. تظل بحاجة للتحقق الأكاديمي قبل اعتماد مراجعها.");
 });};
 $("facultyForm").onsubmit=e=>{e.preventDefault();guarded(async()=>{
   const f=e.currentTarget,countryCode=$("jurisdictionSelect").value;
   const uni=state.universities.find(x=>x.institution_key===$("universitySelect").value);
   if(!uni||uni.country_code!==countryCode)throw Error("اختر الجامعة أولًا.");
   const payload=Object.fromEntries(new FormData(f).entries());
   const result=await call({action:"add_faculty",university_id:uni.id,...payload});
   await refresh(undefined,{country:countryCode,university:uni.institution_key,faculty:result.faculty_id});
   f.reset();notice("حُفظت الكلية الإضافية في الجامعة الصحيحة.");
 });};
 $("bookForm").onsubmit=e=>{e.preventDefault();guarded(async()=>{
   const f=e.currentTarget;
   const b=Object.fromEntries(new FormData(f).entries());
   if(b.institution_key&&!b.faculty_id)throw Error("اختر اسم كلية القانون التابعة للجامعة.");
   if(b.course_id&&!b.institution_key)throw Error("اختر الجامعة أولًا قبل ربط مقرر.");
   const r=await call({action:"create_book",...b});
   notice("تم إنشاء المرجع كمسودة. أضف نصوصه أو صوره ثم اعتمده.");
   const countryCode=b.jurisdiction,university=b.institution_key,faculty=b.faculty_id;
   f.reset();await refresh(r.id,{country:countryCode,university,faculty});
 });};
 }catch(e){loading.textContent="تعذّر فتح مكتبة المراجع: "+e.message;notice("تحقق من تسجيل الدخول بحساب مشرف.",true);}
}
boot();
})();