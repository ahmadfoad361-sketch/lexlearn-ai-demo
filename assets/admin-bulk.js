/* LexLearn administrative bulk enrollment.
   No credential persistence. The existing per-student secured Edge function is
   used, with bounded concurrency and per-row success/failure. */
(function(root){"use strict";
const api=root.LEX_CLOUD,core=root.LEX_BULK_CORE;
const app=document.getElementById("bulkApp");
if(!api||!core||!api.isConfigured()||!app){
  if(app)app.textContent="تعذر تحميل خدمات الإدارة. افتح لوحة الإشراف وأعد تسجيل الدخول.";
  return;
}
const state={cohorts:[],students:[],instructors:[],assignments:[],rows:[],
  cohortId:"",running:false,downloaded:false,outputCount:0,abort:false,
  batchId:(root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():null)};
const $=id=>document.getElementById(id);
function show(id,text){const el=$(id);if(el)el.textContent=text;}
function group(){return state.cohorts.find(x=>x.id===state.cohortId);}
function scope(g){
 const first=state.students.find(s=>s.cohortId===g.id)||{};
 return {name:g.name,university:g.institution||first.university||"",
  faculty:g.faculty||first.faculty||"",
  year:g.academic_year||first.year||"",
  country:g.country_code||first.country||"",
  course:g.course_id||first.course_id||"",subject:g.subject_name||""};
}
function professor(g){
 if(!g)return "لم يُعيَّن أستاذ جامعي";
 const d=scope(g),names=[];
 for(const a of state.assignments){
  if(a.active===false||a.country_code!==d.country||a.university!==d.university||
     a.faculty!==d.faculty||a.course_id!==d.course)continue;
  if(String(a.year_label||"").replace("الفرقة","السنة").trim()!==
     String(d.year||"").replace("الفرقة","السنة").trim())continue;
  const p=state.instructors.find(x=>x.instructor_id===a.instructor_id);
  if(p&&p.profiles?.active!==false)
   names.push(p.profiles?.display_name||p.official_email||"");
 }
 return Array.from(new Set(names.filter(Boolean))).join("، ")||"لم يُعيَّن أستاذ جامعي";
}
function updateScope(){
 const g=group();
 show("bulkScope",g?[
  "الدولة: "+scope(g).country,
  "الجامعة: "+scope(g).university,
  "الكلية: "+scope(g).faculty,
  "الفرقة: "+scope(g).year,
  "المادة: "+scope(g).subject,
  "الأستاذ: "+professor(g)].join(" · "):"اختر مجموعة قبل إنشاء الحسابات");
 updateButtons();
}
function updateButtons(){
 const some=state.rows.some(r=>r.status==="ready"||r.status==="failed");
 const bad=state.rows.some(r=>r.errors?.length);
 const consent=$("bulkTerms")?.checked===true;
 const d=group()?scope(group()):null;
 $("bulkCreate").disabled=state.running||!d||!d.university||!d.faculty||!d.year||!["qa","eg","sa","ae"].includes(d.country)||
  d.course!=="qa-qu-lawc101-rights"||!state.batchId||!consent||!some||bad;
 $("bulkDownload").disabled=state.running||!state.rows.some(r=>r.status==="created");
 $("bulkRoster").disabled=state.running||!state.rows.some(r=>r.status==="created");
 $("bulkCohort").disabled=state.running;
 $("bulkParse").disabled=state.running;
 $("bulkFile").disabled=state.running;
 $("bulkManual").disabled=state.running;
 $("bulkTerms").disabled=state.running;
}
function note(row){
 if(row.errors?.length)return "راجع: "+row.errors.join("، ");
 if(row.status==="created")return "تم الإنشاء، كلمة المرور محفوظة مؤقتًا في هذه الصفحة";
 if(row.status==="processing")return "جارٍ إنشاء الحساب…";
 if(row.status==="failed")return "فشل: "+(row.reason||"خطأ غير معروف");
 return "جاهز";
}
function render(){
 const tb=$("bulkRows");tb.replaceChildren();
 if(!state.rows.length){
  const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=5;
  td.textContent="أدخل أسماء الطلاب أولًا";tr.appendChild(td);tb.appendChild(tr);
  updateButtons();return;
 }
 state.rows.forEach((r,i)=>{
  const tr=document.createElement("tr");
  const serial=document.createElement("td");serial.textContent=String(i+1);
  tr.appendChild(serial);
  ["name","username"].forEach(key=>{
   const td=document.createElement("td"),inp=document.createElement("input");
   inp.type="text";inp.maxLength=key==="name"?160:32;
   inp.setAttribute("aria-label",key==="name"?"اسم الطالب":"اسم الدخول");
   inp.value=r[key];inp.disabled=state.running||r.status==="created";
   inp.addEventListener("change",()=>{
    r[key]=key==="username"?inp.value.trim().toLowerCase():core.clean(inp.value);
    validateAll();render();
   });
   td.appendChild(inp);tr.appendChild(td);
  });
  const status=document.createElement("td");
  status.className=r.status==="created"?"success":r.errors?.length||r.status==="failed"?"err":"pending";
  status.textContent=note(r);tr.appendChild(status);
  const actions=document.createElement("td");
  const b=document.createElement("button");b.type="button";
  if(r.status==="created"){
   b.textContent="PDF الطالب";b.disabled=state.running;
   b.addEventListener("click",async()=>{
    b.disabled=true;
    try{
     const g=group(),pdf=await core.credentialPdf(r,scope(g).name,professor(g));
     core.download(pdf,core.pageName(r.name)+"-"+r.username+".pdf");
    }catch(_){alert("تعذر إنشاء PDF. حاول تنزيل الحزمة الجماعية.");}
    finally{b.disabled=false;}
   });
  }else{
   b.textContent="حذف من القائمة";b.disabled=state.running;
   b.addEventListener("click",()=>{state.rows.splice(i,1);validateAll();render();});
  }
  actions.appendChild(b);tr.appendChild(actions);tb.appendChild(tr);
 });
 updateButtons();
}
function validateAll(){
 const previous=state.rows.map(x=>({status:x.status,password:x.temporary_password,
  user_id:x.user_id,reason:x.reason,lexlearn_number:x.lexlearn_number}));
 const clean=core.validate(state.rows,state.students);
 state.rows=clean.map((r,i)=>({
  ...r,status:previous[i].status==="created"?"created":
    previous[i].status==="processing"?"processing":previous[i].status==="failed"?"failed":"ready",
  temporary_password:previous[i].password,user_id:previous[i].user_id,
  lexlearn_number:previous[i].lexlearn_number,reason:previous[i].reason
 }));
}
function applyParsed(rows,source){
 if(state.running)return;
 if(state.rows.some(x=>x.status==="created")&&!confirm("توجد بيانات دخول أنشئت ولم تُنزّل. استبدال القائمة سيفقد كلمات المرور الأولى. هل حمّلت الحزمة؟"))return;
 if(!rows.length){show("bulkParseStatus","لم أتعرف على أسماء. أدخلها يدويًا أو استخدم ملف CSV واضح.");return;}
 if(rows.length>100){show("bulkParseStatus","الحد الأقصى 100 طالب لكل دفعة. قسّم الملف إلى دفعات أصغر.");return;}
 state.rows=rows.map(r=>({name:core.clean(r.name),username:core.clean(r.username).toLowerCase(),status:"ready"}));
 state.downloaded=false;validateAll();render();
 show("bulkParseStatus","قرأت "+rows.length+" سجلًا من "+source+". راجع جميع الأسماء وأسماء الدخول قبل الضغط على إنشاء.");
}
function loadScript(src,global){
 return new Promise((resolve,reject)=>{
  if(root[global])return resolve(root[global]);
  const s=document.createElement("script");s.src=src;s.async=true;
  s.onload=()=>root[global]?resolve(root[global]):reject(Error("library_unavailable"));
  s.onerror=()=>reject(Error("library_download_failed"));
  document.head.appendChild(s);
 });
}
async function ocr(input){
 const T=await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js","Tesseract");
 const worker=await T.createWorker("ara+eng");
 try{
  const result=await worker.recognize(input);
  return result?.data?.text||"";
 }finally{await worker.terminate();}
}
async function parsePdf(file){
 const pdfjs=await loadScript("https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js","pdfjsLib");
 pdfjs.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
 const doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
 if(doc.numPages>10)throw Error("ملف PDF يتجاوز 10 صفحات؛ قسّمه قبل الرفع.");
 const text=[];
 for(let i=1;i<=doc.numPages;i++){
  show("bulkParseStatus","قراءة PDF — صفحة "+i+" من "+doc.numPages);
  const page=await doc.getPage(i),blocks=await page.getTextContent();
  // PDF.js may split one Arabic name into many positioned fragments.
  // Rebuild visual text lines by their vertical baseline before review.
  const groups=new Map();
  for(const item of blocks.items||[]){
   const baseline=Math.round(Number(item.transform?.[5]||0)/3)*3;
   if(!groups.has(baseline))groups.set(baseline,[]);
   groups.get(baseline).push({x:Number(item.transform?.[4]||0),str:String(item.str||"")});
  }
  let value=Array.from(groups.entries()).sort((a,b)=>b[0]-a[0])
   .map(([_,chunks])=>chunks.sort((a,b)=>b.x-a.x).map(x=>x.str).join(" "))
   .join("\n").trim();
  if(value.length<12){
   show("bulkParseStatus","فحص صورة الصفحة "+i+" محليًا…");
   const view=page.getViewport({scale:1.5}),canvas=document.createElement("canvas");
   canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
   await page.render({canvasContext:canvas.getContext("2d"),viewport:view}).promise;
   value=await ocr(canvas);
  }
  text.push(value);
 }
 return text.join("\n");
}
async function parseFile(file){
 if(!file)return;
 if(file.size>15*1024*1024)throw Error("الحد الأقصى لحجم الملف 15 MB.");
 const name=file.name.toLowerCase(),type=String(file.type||"");
 if(name.endsWith(".csv"))return {data:core.parseCsv(await file.text()),kind:"CSV"};
 if(name.endsWith(".txt"))return {data:core.parseText(await file.text()),kind:"TXT"};
 if(name.endsWith(".pdf")||type==="application/pdf")return {data:core.parseText(await parsePdf(file)),kind:"PDF"};
 if(/^image\/(png|jpeg|webp)$/.test(type)||/\.(png|jpe?g|webp)$/.test(name)){
  const url=URL.createObjectURL(file);
  try{return {data:core.parseText(await ocr(url)),kind:"صورة"};}
  finally{URL.revokeObjectURL(url);}
 }
 throw Error("نوع الملف غير مدعوم");
}
function errorLabel(result){
 const c=String(result?.error||result?.message||"");
 if(c==="create_user_failed")return "اسم المستخدم مكرر أو رفضه نظام الدخول";
 if(c==="registration_terms_required")return "لم تُستكمل موافقة التسجيل";
 if(c==="invalid_pilot_profile_fields")return "بيانات المجموعة غير مكتملة";
 return c.slice(0,140)||"تعذر إنشاء الحساب";
}
async function submit(){
 if(state.running||!group()||!$("bulkTerms").checked)return;
 validateAll();render();
 if(state.rows.some(r=>r.errors.length)){alert("صحح الأخطاء أولًا.");return;}
 const todo=state.rows.filter(r=>r.status!=="created");
 if(!todo.length)return;
 if(!confirm("إنشاء "+todo.length+" حسابًا داخل "+group().name+"؟ بعد الإنشاء ستُعرض كلمات المرور الأولية لهذه الجلسة فقط."))return;
 state.running=true;state.downloaded=false;updateButtons();
 const g=group(),d=scope(g);let done=0;
 if(d.course!=="qa-qu-lawc101-rights"||!d.university||!d.faculty||!d.year||!["qa","eg","sa","ae"].includes(d.country)){
  state.running=false;updateButtons();
  alert("المجموعة تفتقد بيانات أكاديمية موثقة (الدولة والجامعة والكلية والفرقة والمقرر) أو تستخدم مقررًا غير مدعوم؛ استكمل البيانات قبل الإنشاء.");
  return;
 }
 const pool=async()=>{
  while(todo.length){
   const row=todo.shift();if(!row)break;
   row.status="processing";render();
   try{
    const result=await api.createStudent({
     name:row.name,username:row.username,cohort_id:g.id,
     bulk_import:true,batch_id:state.batchId,
     country_code:d.country,university:d.university,faculty:d.faculty,
     year:d.year,course_id:d.course,
     accepted_registration_terms:true,accepted_terms_version:"2026-10-23-v6"
    });
    if(result?.ok!==true||!result.temporary_password)throw Error(errorLabel(result));
    row.status="created";row.user_id=result.user_id;
    row.lexlearn_number=result.lexlearn_number;
    row.temporary_password=result.temporary_password;delete row.reason;
   }catch(e){row.status="failed";row.reason=errorLabel(e);}
   done++;
   show("bulkProgress",done+" / "+state.rows.length+" · "+
    state.rows.filter(x=>x.status==="created").length+" حساب ناجح");
   render();
  }
 };
 try{await Promise.all([pool(),pool(),pool()]);}
 finally{
  state.running=false;render();
  const n=state.rows.filter(r=>r.status==="created").length;
  show("bulkProgress",n+" حساب تم إنشاؤه، "+state.rows.filter(r=>r.status==="failed").length+
    " فشل. "+(n?"نزّل الحزمة الآن؛ كلمات المرور لا يمكن عرضها مرة أخرى بعد إغلاق الصفحة.":""));
 }
}
async function outputRoster(){
 const g=group(),rows=state.rows.filter(r=>r.status==="created");
 if(!g||!rows.length)return;
 const blob=await core.rosterPdf(rows,g.name,professor(g));
 core.download(blob,"LexLearn-كشف-"+core.pageName(g.name)+".pdf");
}
async function outputZip(){
 if(state.running)return;
 const g=group(),rows=state.rows.filter(r=>r.status==="created");
 if(!g||!rows.length)return;
 const b=$("bulkDownload");b.disabled=true;
 try{
  const files=[];
  for(let i=0;i<rows.length;i++){
   show("bulkProgress","إنشاء PDF الطالب "+(i+1)+" / "+rows.length);
   const r=rows[i],blob=await core.credentialPdf(r,g.name,professor(g));
   files.push({name:"students/"+String(i+1).padStart(3,"0")+"-"+core.pageName(r.name)+"-"+r.username+".pdf",blob});
  }
  files.push({name:"LexLearn-كشف-المجموعة.pdf",blob:await core.rosterPdf(rows,g.name,professor(g))});
  const archive=await core.zipFiles(files);
  core.download(archive,"LexLearn-"+core.pageName(g.name)+"-حسابات-الطلاب.zip");
  state.downloaded=true;state.outputCount=rows.length;
  show("bulkProgress","تم إنشاء ZIP يتضمن "+rows.length+" ملف طالب وملف كشف واحد. حافظ على سريته.");
 }catch(_){alert("تعذر توليد ZIP؛ يمكن تنزيل PDF لكل طالب على حدة.");}
 finally{b.disabled=false;}
}
window.addEventListener("beforeunload",e=>{
 if(state.rows.some(r=>r.status==="created")&&!state.downloaded){
  e.preventDefault();e.returnValue="";
 }
});
async function start(){
 try{
  const who=await api.profile();
  if(!who||who.active!==true||!["owner","admin"].includes(who.role)){
   location.replace("admin-login.html");return;
  }
  const results=await Promise.all([api.listCohorts(),api.listStudents(),
   api.db().functions.invoke("admin-manage-instructors",{body:{action:"list"}}).catch(()=>({error:true}))]);
  state.cohorts=results[0];state.students=results[1];
  if(!results[2].error&&results[2].data?.ok){
   state.instructors=results[2].data.instructors||[];
   state.assignments=results[2].data.assignments||[];
  }
  const select=$("bulkCohort");select.replaceChildren();
  const def=document.createElement("option");def.value="";def.textContent="اختر مجموعة…";
  select.appendChild(def);
  state.cohorts.forEach(c=>{
   const opt=document.createElement("option");opt.value=c.id;opt.textContent=c.name;
   select.appendChild(opt);
  });
  const requested=new URLSearchParams(location.search).get("cohort");
  if(state.cohorts.some(c=>c.id===requested))select.value=requested;
  state.cohortId=select.value;updateScope();render();
  select.addEventListener("change",()=>{
   if(state.rows.some(r=>r.status==="created")&&!state.downloaded&&
      !confirm("تم إنشاء حسابات ولم تُنزّل كلمات مرورها بعد. هل تريد تغيير المجموعة؟")){
    select.value=state.cohortId;return;
   }
   if(state.cohortId!==select.value&&state.rows.some(r=>r.status==="created")){
     state.rows=[];state.downloaded=false;render();
   }
   state.cohortId=select.value;updateScope();
  });
  $("bulkParse").onclick=()=>applyParsed(core.parseText($("bulkManual").value),"الإدخال اليدوي");
  $("bulkFile").onchange=async()=>{
   const file=$("bulkFile").files?.[0];if(!file)return;
   show("bulkParseStatus","جارٍ قراءة الملف محليًا…");
   try{const r=await parseFile(file);applyParsed(r.data,r.kind);}
   catch(e){show("bulkParseStatus","تعذر قراءة الملف: "+(e?.message||"خطأ غير معروف")+". يمكن إدخال الأسماء يدويًا.");}
   finally{$("bulkFile").value="";}
  };
  $("bulkTerms").onchange=updateButtons;
  $("bulkCreate").onclick=submit;
  $("bulkDownload").onclick=outputZip;
  $("bulkRoster").onclick=outputRoster;
 }catch(_){
  show("bulkScope","تعذر الوصول إلى بيانات الإدارة. تأكد من صلاحيتك واتصال Supabase.");
  $("bulkCreate").disabled=true;
 }
}
start();
})(window);