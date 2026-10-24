(function(){
"use strict";
const cloud=window.LEX_CLOUD, root=document.getElementById("workspace"), loading=document.getElementById("loading");
const msg=document.getElementById("msg"), booksEl=document.getElementById("books"),detail=document.getElementById("detail");
let state={books:[],pages:[],links:[],items:[],courses:[],uploads:[],can_approve:false},selected=null,locked=false;
const $=id=>document.getElementById(id);
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const kind={textbook:"كتاب",legislation:"تشريع",exam:"امتحان",lecture:"محاضرة",academic_study:"بحث علمي",model_answer:"نموذج إجابة"};
const country={qa:"قطر",eg:"مصر",sa:"السعودية",ae:"الإمارات",kw:"الكويت",bh:"البحرين",om:"عُمان",jo:"الأردن",ma:"المغرب",tn:"تونس",dz:"الجزائر",general:"عام"};
function notice(t,fail=false){msg.style.display="block";msg.textContent=t;msg.style.background=fail?"#ffece9":"#e6f0fa";msg.scrollIntoView({behavior:"smooth",block:"nearest"});}
async function call(body){
 const r=await cloud.db().functions.invoke("lexlearn-reference-library",{body});
 if(r.error){let txt=r.error.message||"تعذّر الاتصال";try{if(r.error.context){const j=await r.error.context.json();txt=j.error||txt;}}catch(_){}throw Error(txt);}
 if(r.data?.error)throw Error(r.data.error);
 return r.data;
}
function liveCourseOptions(){
 const sel=$("courseSelect");if(!sel)return;
 sel.innerHTML='<option value="">بدون مقرر محدد</option>'+state.courses.map(c=>'<option value="'+escape(c.id)+'">'+escape((country[c.country_code]||c.country_code)+" · "+c.title_ar+" — "+c.id)+'</option>').join("");
}
function renderBooks(){
 if(!state.books.length){booksEl.innerHTML='<p class="muted">لا توجد كتب مسجلة بعد.</p>';return;}
 const groups={};state.books.forEach(b=>{let k=(country[b.jurisdiction]||b.jurisdiction)+" · "+(b.education_stage==="university"?"جامعي":b.education_stage)+" · "+b.subject_name;(groups[k]||(groups[k]=[])).push(b);});
 booksEl.innerHTML=Object.entries(groups).map(([group,books])=>'<h3 style="font-size:14px;margin:14px 0 5px">'+escape(group)+'</h3>'+books.map(b=>
   '<button type="button" class="bookBtn '+(b.id===selected?"active":"")+'" data-book="'+escape(b.id)+'"><b>'+escape(b.title)+'</b><br><small>'+escape(b.curriculum_name||"عام")+' · '+escape(b.status==="approved"?"معتمد":"مسودة")+'</small></button>').join("")).join("");
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
 '<div class="stack"><span class="tag">حالة المرجع: '+escape(b.status)+'</span>'+
 (state.can_approve&&b.status==="draft"?'<button type="button" id="approveBook">اعتماد المرجع</button>':"")+'</div><hr>'+
 '<h2>تغذية الذكاء الاصطناعي بملفات وصور</h2>'+
 '<p class="muted">ارفع صورة أو PDF. سنحفظ الملف الأصلي بصورة خاصة ونستخرج النص إلى صفحات مسودة قابلة للتصحيح. في كل دفعة من PDF نعالج حتى 8 صفحات لتجنب التكاليف المفاجئة.</p>'+
 '<form id="fileForm"><label>اختر ملف PDF أو صورة (بحد أقصى 12 ميجابايت)<input id="sourceFile" type="file" accept=".pdf,application/pdf,image/jpeg,image/png,image/webp" required></label>'+
 '<div class="stack"><div style="flex:1"><label>من صفحة PDF<input name="start" type="number" min="1" value="1"></label></div>'+
 '<div style="flex:1"><label>إلى صفحة PDF (8 كحد أقصى)<input name="end" type="number" min="1" placeholder="تلقائي"></label></div>'+
 '<div style="flex:1"><label>رقم صفحة الصورة<input name="imagePage" type="number" min="1" value="1"></label></div></div>'+
 '<button type="submit">حفظ الملف واستخراج النصوص</button></form><hr>'+
 '<h2>إضافة نص علمي يدويًا</h2><form id="textForm"><label>رقم الصفحة<input type="number" name="page_number" min="1" max="9999" required></label>'+
 '<label>النص المرجعي للصفحة<textarea name="excerpt" minlength="5" maxlength="7000" required placeholder="انسخ النص كما ورد بالكتاب"></textarea></label>'+
 '<button type="submit" class="secondary">إضافة الصفحة كمسودة</button></form><hr>'+
 '<h2>صفحات المرجع ('+pages.length+')</h2>'+
 (pages.length?pages.map(p=>{const links=state.links.filter(l=>l.page_id===p.id);
 return '<article class="page"><b>صفحة '+p.page_number+'</b> <span class="tag">'+escape(p.status==="approved"?"معتمدة":"غير معتمدة")+'</span><p>'+escape(p.excerpt)+'</p>'+
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
 const f=$("textForm");f.onsubmit=async e=>{e.preventDefault();await guarded(async()=>{await call({action:"save_page",book_id:b.id,page_number:Number(f.page_number.value),excerpt:f.excerpt.value});notice("أضيف النص كمسودة. راجعه ثم اعتمده.");await refresh(b.id);});};
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
   await call({action:"extract_page",book_id:b.id,page_number:n,mime,image_base64:data});
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
      await call({action:"save_page",book_id:b.id,page_number:n,excerpt:content.slice(0,7000)});
    }else{
      const viewport=page.getViewport({scale:1.2});
      const canvas=document.createElement("canvas");
      canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
      await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
      const base64Image=canvas.toDataURL("image/jpeg",.76).split(",")[1];
      await call({action:"extract_page",book_id:b.id,page_number:n,mime:"image/jpeg",image_base64:base64Image});
    }
    done++;
   }catch(e){errors.push("صفحة "+n+": "+e.message);}
 }
 notice("تم استخراج "+done+" صفحة كمسودات تحتاج مراجعة."+(errors.length?"\nلم تتم معالجة: "+errors.join("؛ "):"")+"\nلا تتأثر نتائج الطلاب إلا بعد اعتماد الصفحات وربطها بالأسئلة.",errors.length>0);
 await refresh(b.id);
}
async function refresh(keep){
 const data=await call({action:"list"});
 state=data;selected=keep||selected||state.books[0]?.id||null;
 liveCourseOptions();renderBooks();renderDetail();
}
async function boot(){
 if(!cloud||!cloud.isConfigured()){location.replace("admin-login.html");return;}
 try{
 const p=await cloud.profile();
 if(!p||p.active!==true||!["owner","admin","instructor"].includes(p.role)){location.replace("admin-login.html");return;}
 loading.hidden=true;root.hidden=false;
 await refresh();
 $("bookForm").onsubmit=e=>{e.preventDefault();guarded(async()=>{
   const f=e.currentTarget;
   const b=Object.fromEntries(new FormData(f).entries());
   const r=await call({action:"create_book",...b});
   notice("تم إنشاء المرجع كمسودة. أضف نصوصه أو صوره ثم اعتمده.");
   f.reset();await refresh(r.id);
 });};
 }catch(e){loading.textContent="تعذّر فتح مكتبة المراجع: "+e.message;notice("تحقق من تسجيل الدخول بحساب مشرف.",true);}
}
boot();
})();