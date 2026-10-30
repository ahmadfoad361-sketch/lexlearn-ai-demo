/* LexLearn faculty identity: primary assignment only; QR contains identity and login email, never passwords.
   The QR is information only, NOT a university-issued credential or authenticity proof. */
(function(root){"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const label="أستاذ جامعي · FACULTY";
function details(roster,index=0){
 const p=roster.profile||{},assignments=roster.assignments||[];
 const assignment=assignments[Math.max(0,Math.min(assignments.length-1,index))]||{};
 const academic=root.LEX_ACADEMIC||{};
 const university=typeof academic.university==="function"?academic.university(assignment.university):String(assignment.university||"");
 const faculty=typeof academic.faculty==="function"?academic.faculty(assignment.faculty,assignment.university):String(assignment.faculty||"");
 const name=String(p.name||"").trim().replace(/\s+/g," ");
 const title=String(p.academic_title||"دكتور").trim();
 const display_name=(name===title||name.startsWith(title+" "))?name:[title,name].filter(Boolean).join(" ");
 return {display_name:display_name,username:String(p.official_email||"").trim().toLowerCase(),
  university:university,faculty:faculty,academic_section:p.specialization||"",year_label:"",
  card_id:"",role:"faculty"};
}
function payload(p){
 return JSON.stringify({project:"LexLearn",card_type:"faculty",name:p.display_name,
  username:p.username,university:p.university,faculty:p.faculty,specialization:p.academic_section});
}
const api={number:()=>"",allowUnnumbered:true,label:label,payload:payload};
function card(p){
 const brand=root.LEX_CARD_BRAND;if(!brand)throw Error("card_brand_unavailable");
 root.qrcode.stringToBytes=root.qrcode.stringToBytesFuncs["UTF-8"];
 const qr=root.qrcode(0,"M");qr.addData(payload(p),"Byte");qr.make();
 return '<article class="identityCard facultyIdentityCard" dir="rtl">'+brand.brandHeader(label)+
 '<span class="identityAvatar cardAvatar" aria-hidden="true">'+esc((p.display_name||"د").trim().replace(/^(دكتور|د\.|أستاذ|استاذ)\s*/,"").slice(0,1)||"د")+'</span>'+
 '<h2 class="'+brand.nameClass(p.display_name)+'">'+esc(p.display_name)+'</h2>'+
 brand.universityBlock(p.university,p.faculty)+
 (p.academic_section?'<p class="cardMeta">'+esc(p.academic_section)+'</p>':'')+
 '<div class="cardQr" aria-label="رمز QR يتضمن بيانات بطاقة الدكتور واسم الدخول">'+qr.createSvgTag({cellSize:4,margin:16,scalable:true})+'</div>'+
 '<p class="cardLogin">اسم الدخول: <b dir="ltr">'+esc(p.username||"—")+'</b></p>'+
 '<small class="cardFooter">بطاقة تعريف بمنصة <b dir="ltr">LexLearn</b> · ليست إثباتًا رسميًا من الجامعة</small></article>';
}
function print(p){
 const popup=root.open("","_blank");if(!popup)throw Error("popup_blocked");
 popup.document.open();
 popup.document.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LexLearn — بطاقة أستاذ الجامعة</title><link rel="stylesheet" href="assets/student-identity.css"></head><body class="cardPrintPage"><div class="cardPrintToolbar"><button id="printFacultyCard">طباعة / حفظ PDF</button><p>مقاس البطاقة A6</p></div>'+card(p)+'</body></html>');
 popup.document.close();
 popup.document.getElementById("printFacultyCard").onclick=()=>{
  const node=popup.document.querySelector(".identityCard");node.style.zoom="1";node.style.zoom=String(Math.min(1,525/node.scrollHeight));
  popup.focus();popup.print();
 };
 popup.focus();
}
function open(roster,onEdit){
 const old=document.getElementById("instructorCardDialog");if(old)old.remove();
 const assignments=roster.assignments||[];let index=0;
 const dialog=document.createElement("dialog");dialog.id="instructorCardDialog";
 dialog.className="instructorCardDialog";dialog.setAttribute("aria-labelledby","facultyCardTitle");
 const options=assignments.length>1?'<label class="cardUniversityChooser">الجامعة المعروضة على البطاقة <select id="facultyCardUniversity">'+assignments.map((a,i)=>
  '<option value="'+i+'">'+esc((root.LEX_ACADEMIC?.university?.(a.university)||a.university||"جامعة")+" — "+(a.faculty||""))+'</option>').join("")+'</select></label>':"";
 dialog.innerHTML='<div class="toolbar"><h2 id="facultyCardTitle">بطاقتي التعريفية</h2><button type="button" id="closeFacultyCard" class="facultyCardClose" aria-label="إغلاق البطاقة" title="إغلاق">×</button></div>'+
 options+'<div id="facultyCardPreview">'+card(details(roster,index))+'</div>'+
 '<div class="actions"><button type="button" id="downloadFacultyCard" class="primary">تحميل البطاقة PDF</button>'+
 '<button type="button" id="printFacultyCard" class="secondary">طباعة البطاقة</button>'+
 '<button type="button" id="editFacultyCard" class="secondary">تعديل بياناتي</button></div>'+
 '<p class="hint">يحتوي QR على بيانات البطاقة واسم تسجيل الدخول (البريد الإلكتروني)، ولا يحتوي كلمة المرور.</p>'+
 '<p id="facultyCardStatus" role="status" aria-live="polite"></p>';
 document.body.appendChild(dialog);
 const status=dialog.querySelector("#facultyCardStatus"),previous=document.activeElement;
 dialog.addEventListener("close",()=>{dialog.remove();if(previous&&previous.isConnected)previous.focus();});
 dialog.querySelector("#closeFacultyCard").onclick=()=>dialog.close();
 const chooser=dialog.querySelector("#facultyCardUniversity");
 if(chooser)chooser.onchange=()=>{index=Number(chooser.value)||0;dialog.querySelector("#facultyCardPreview").innerHTML=card(details(roster,index));};
 dialog.querySelector("#editFacultyCard").onclick=()=>{dialog.close();onEdit();document.getElementById("profileEdit")?.scrollIntoView({block:"start"});};
 dialog.querySelector("#printFacultyCard").onclick=()=>{try{print(details(roster,index));}catch(_){status.textContent="اسمح بفتح نافذة الطباعة ثم حاول مجددًا.";}};
 dialog.querySelector("#downloadFacultyCard").onclick=async function(){
  this.disabled=true;status.textContent="جارٍ تجهيز البطاقة…";
  try{
   const blob=await root.LEX_CARD_PDF.create(details(roster,index),api),url=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=url;a.download="LexLearn-Faculty-Card.pdf";document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent="تم تجهيز البطاقة للتحميل.";
  }catch(_){status.textContent="تعذر تجهيز البطاقة. حاول مجددًا.";}finally{this.disabled=false;}
 };
 dialog.showModal();
}
root.LEX_INSTRUCTOR_CARD={open,details,card,payload};
})(window);
