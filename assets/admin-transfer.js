(function(root){
"use strict";
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function defaultGroup(groups){var match=groups.find(function(g){return String(g.name||"").trim()==="المجموعة الثانية";});return match?match.id:"";}
function formHtml(student,groups){
 var selected=defaultGroup(groups);
 return '<button class="close" type="button" data-cancel aria-label="إغلاق">×</button><h2 id="transferTitle">نقل الطالب</h2>'+
 '<p><b>'+esc(student.name||student.username)+'</b> · المجموعة الحالية: '+esc(student.cohort||"طالب حر")+'</p>'+
 '<p>يحتفظ الطالب بحسابه ورقمه التعريفي وتفعيله وكل نتائج التشخيص والتدريب ونسب الحفظ والفهم.</p>'+
 '<form class="formGrid"><label>النقل إلى<select name="destination"><option value="free">طالب حر</option><option value="group" selected>مجموعة</option></select></label>'+
 '<label data-group>المجموعة<select name="cohort_id" required><option value="">اختر مجموعة متوافقة</option>'+
 groups.map(function(g){return '<option value="'+esc(g.id)+'"'+(g.id===selected?' selected':'')+'>'+esc(g.name)+'</option>';}).join("")+'</select></label>'+
 (!groups.length?'<p data-empty>لا توجد مجموعة أخرى متوافقة حاليًا. راجع بيانات الدولة والجامعة والكلية والفرقة والمقرر في المجموعة والطالب، أو اختر «طالب حر».</p>':"")+
 '<p role="status" aria-live="polite" data-status></p><div class="modalActions"><button class="btn secondary" type="button" data-cancel>إلغاء</button><button class="btn primary" type="submit">تأكيد النقل</button></div></form>';
}
var opening=false;
async function open(student,onSaved){
 if(opening)return;opening=true;
 var dialog;
 try{
  var options=await root.LEX_CLOUD.manageStudent({action:"transfer_options",user_id:student.id});
  if(!options||options.ok!==true||options.student_id!==student.id||!Array.isArray(options.groups))throw Error("تعذر تحميل المجموعات المتوافقة.");
  dialog=root.document.createElement("dialog");dialog.className="modal studentTransferDialog";
  dialog.setAttribute("aria-labelledby","transferTitle");dialog.innerHTML=formHtml(student,options.groups);
  root.document.body.appendChild(dialog);
  var form=dialog.querySelector("form"),destination=form.elements.destination,group=form.elements.cohort_id;
  var status=dialog.querySelector("[data-status]"),save=form.querySelector('[type="submit"]'),saving=false;
  function close(){if(saving)return;dialog.close();dialog.remove();opening=false;}
  dialog.querySelectorAll("[data-cancel]").forEach(function(b){b.onclick=close;});
  dialog.addEventListener("cancel",function(e){e.preventDefault();close();});
  destination.onchange=function(){var free=destination.value==="free";dialog.querySelector("[data-group]").hidden=free;group.required=!free;group.disabled=free;var empty=dialog.querySelector("[data-empty]");if(empty)empty.hidden=free;status.textContent="";};
  form.onsubmit=async function(e){
   e.preventDefault();if(saving)return;
   var free=destination.value==="free",target=free?null:options.groups.find(function(g){return g.id===group.value;});
   if(!free&&!target){status.textContent="اختر مجموعة متوافقة أولًا.";return;}
   if(free&&options.current_cohort_id===null){status.textContent="الطالب مسجل بالفعل كطالب حر.";return;}
   if(!root.confirm("تأكيد نقل "+(student.name||student.username)+" إلى "+(free?"طالب حر":target.name)+"؟ سيبقى حسابه وسجله ونتائجه كما هي."))return;
   saving=true;save.disabled=true;destination.disabled=true;group.disabled=true;status.textContent="جارٍ حفظ النقل…";
   try{
    var result=await root.LEX_CLOUD.manageStudent({action:"transfer_student",user_id:student.id,destination:free?"free":"group",cohort_id:free?null:target.id,expected_cohort_id:options.current_cohort_id,confirmed:true});
    if(!result||result.ok!==true||result.student_id!==student.id||result.cohort_id!==(free?null:target.id))throw Error("تعذر تأكيد حفظ النقل. أغلق النافذة وحدّث القائمة قبل المحاولة مجددًا.");
    saving=false;close();await onSaved(result);
   }catch(error){saving=false;save.disabled=false;destination.disabled=false;group.disabled=free;status.textContent=error.message||"تعذر النقل؛ أعد المحاولة.";}
  };
  dialog.showModal();
 }catch(error){if(dialog)dialog.remove();opening=false;root.alert(error.message||"تعذر فتح نموذج النقل.");}
}
root.LEX_ADMIN_TRANSFER={open:open,formHtml:formHtml,defaultGroup:defaultGroup};
})(window);
