/* Reversible student archive, owner/admin UI only. Never deletes student rows. */
(function(root){"use strict";
const api=root.LEX_CLOUD,$=id=>document.getElementById(id);
const state={students:[],cohorts:[],selected:"",busy:false};
function groupId(s){return s.cohortId||null;}
function currentStudents(){
 if(!state.selected)return [];
 if(state.selected==="free")return state.students.filter(s=>!groupId(s));
 return state.students.filter(s=>groupId(s)===state.selected);
}
function cell(tr,v){
 const td=document.createElement("td");td.textContent=String(v==null?"":v);tr.appendChild(td);return td;
}
function count(){
 const list=currentStudents();
 $("archiveCount").textContent=list.filter(s=>s.accountStatus!=="archived").length+
  " غير مؤرشف · "+list.filter(s=>s.accountStatus==="archived").length+" في الأرشيف";
}
function render(){
 const sel=$("archiveCohort"),active=$("activeArchiveRows"),past=$("archivedRows");
 active.replaceChildren();past.replaceChildren();count();
 const list=currentStudents(),non=list.filter(s=>s.accountStatus!=="archived");
 const archived=state.students.filter(s=>s.accountStatus==="archived"&&
   (!state.selected||state.selected==="free"&&!groupId(s)||groupId(s)===state.selected));
 $("archiveGroup").disabled=state.busy||!state.selected||!non.length;
 if(!non.length){const tr=document.createElement("tr"),td=cell(tr,"لا توجد حسابات نشطة لهذه المجموعة");td.colSpan=4;active.appendChild(tr);}
 for(const s of non){
  const tr=document.createElement("tr");cell(tr,s.name||s.username);cell(tr,s.username);
  cell(tr,s.accountStatus||"active");
  const td=document.createElement("td"),button=document.createElement("button");
  button.textContent="أرشفة الطالب";button.disabled=state.busy;
  button.onclick=()=>archiveOne(s);
  td.appendChild(button);tr.appendChild(td);active.appendChild(tr);
 }
 if(!archived.length){const tr=document.createElement("tr"),td=cell(tr,"الأرشيف فارغ");td.colSpan=4;past.appendChild(tr);}
 for(const s of archived){
  const tr=document.createElement("tr");cell(tr,s.name||s.username);
  cell(tr,s.cohort||"طالب حر");cell(tr,s.username);
  const td=document.createElement("td"),button=document.createElement("button");
  button.textContent="استعادة الحساب";button.disabled=state.busy;
  button.onclick=()=>restoreOne(s);
  td.appendChild(button);tr.appendChild(td);past.appendChild(tr);
 }
}
async function load(){
 state.students=await api.listStudents();state.cohorts=await api.listCohorts();
 const select=$("archiveCohort");select.replaceChildren();
 const opt=document.createElement("option");opt.value="";opt.textContent="كل الأرشيف / اختر مجموعة للعمل";select.appendChild(opt);
 const free=document.createElement("option");free.value="free";free.textContent="طلاب أحرار (بلا مجموعة)";select.appendChild(free);
 for(const g of state.cohorts){const option=document.createElement("option");option.value=g.id;option.textContent=g.name;select.appendChild(option);}
 if(state.selected&&state.selected!== "free"&&!state.cohorts.some(x=>x.id===state.selected))state.selected="";
 select.value=state.selected;render();
}
async function call(action,s,reason){
 const result=await api.manageStudent({action,user_id:s.id,confirmed:true,reason});
 if(!result||result.ok!==true||result.history_preserved!==true)
  throw Error(result?.error||"لم يؤكد الخادم حفظ الأرشفة");
 return result;
}
async function archiveOne(s){
 const reason=prompt("سبب الأرشفة لحساب "+(s.name||s.username)+" (مثل: انتهى مقرر المجموعة):","انتهاء المقرر");
 if(reason===null)return;
 if(!reason.trim()){alert("سبب الأرشفة مطلوب.");return;}
 if(!confirm("أرشفة "+(s.name||s.username)+"؟ سيُوقف دخوله وتُحفظ إجاباته ودرجاته ومجموعته."))return;
 state.busy=true;render();
 try{await call("archive_student",s,reason.trim());await load();}
 catch(e){alert("تعذرت الأرشفة: "+String(e?.message||e));}
 finally{state.busy=false;render();}
}
async function restoreOne(s){
 if(!confirm("استعادة حساب "+(s.name||s.username)+" إلى حالته السابقة، دون فقد سجل التدريب؟"))return;
 state.busy=true;render();
 try{
  const result=await call("restore_student",s,"استعادة بناءً على طلب الإدارة");
  await load();
  if(result.original_auth_ban_retained===true)
   alert("تمت الاستعادة مع الإبقاء على حظر الدخول القديم؛ راجع قرار الحظر السابق قبل تفعيل الدخول.");
 }
 catch(e){alert("تعذرت الاستعادة: "+String(e?.message||e));}
 finally{state.busy=false;render();}
}
async function archiveGroup(){
 if(state.busy||!state.selected)return;
 const g=state.cohorts.find(x=>x.id===state.selected);
 const list=currentStudents().filter(x=>x.accountStatus!=="archived");
 if(!list.length)return;
 const reason=prompt("سبب أرشفة المجموعة ("+list.length+" طالب)، واسم المقرر أو تاريخ انتهائه:","انتهاء المقرر");
 if(reason===null)return;
 if(!reason.trim()){alert("يلزم تسجيل سبب الأرشفة.");return;}
 if(!confirm("تأكيد نهائي: أرشفة "+list.length+" حسابًا للمجموعة "+(g?.name||"طلاب أحرار")+"؟ لن يُحذف أي سجل أو درجة."))return;
 state.busy=true;render();
 let success=0,fail=[];
 // Bounded sequential archive: never assume that all accounts succeeded.
 for(const s of list){
  $("archiveCount").textContent="أرشفة "+(success+fail.length+1)+" / "+list.length;
  try{await call("archive_student",s,reason.trim());success++;}
  catch(e){fail.push((s.name||s.username)+": "+String(e?.message||e));}
 }
 try{await load();}catch(_){/* Show stored operation result even if refresh fails. */}
 state.busy=false;render();
 alert("تمت أرشفة "+success+" حسابًا. "+(fail.length?"تعذر أرشفة "+fail.length+" حساب: \n"+fail.slice(0,8).join("\n"):"جميع الحسابات محفوظة في الأرشيف."));
}
async function start(){
 if(!api||!api.isConfigured()){location.replace("admin-login.html");return;}
 try{
  const me=await api.profile();
  if(!me||me.active!==true||!["owner","admin"].includes(me.role)){location.replace("admin-login.html");return;}
  const c=new URLSearchParams(location.search).get("cohort");
  state.selected=c||"";
  $("archiveCohort").onchange=e=>{state.selected=e.target.value;render();};
  $("archiveGroup").onclick=archiveGroup;
  await load();
 }catch(_){$("archiveCount").textContent="تعذر تحميل أرشيف الحسابات أو انتهت جلسة الإدارة.";}
}
start();
})(window);