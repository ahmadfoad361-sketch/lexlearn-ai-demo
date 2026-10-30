/* Faculty identity is built only from the authenticated roster; no student data or credentials in QR. */
(function(root){'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label='أستاذ جامعي · FACULTY';
function details(roster){
 const p=roster.profile||{},a=roster.assignments||[];
 const unique=values=>[...new Set(values.filter(Boolean))].join(' · ');
 return {display_name:[p.academic_title||'دكتور',p.name].filter(Boolean).join(' '),
 university:unique(a.map(x=>root.LEX_ACADEMIC.university(x.university))),
 faculty:unique(a.map(x=>x.faculty)),academic_section:p.specialization||'',year_label:''};
}
function payload(p){return JSON.stringify({project:'LexLearn',role:'faculty',name:p.display_name,university:p.university,faculty:p.faculty,specialization:p.academic_section});}
const api={number:()=>'',allowUnnumbered:true,label:label,payload:payload};
function card(p){
 root.qrcode.stringToBytes=root.qrcode.stringToBytesFuncs['UTF-8'];
 const qr=root.qrcode(0,'M');qr.addData(payload(p),'Byte');qr.make();
 return '<article class="identityCard" dir="rtl"><div class="cardTop"><img src="assets/lexlearn-x-transparent.svg" alt=""><b dir="ltr">LexLearn</b><small>'+label+'</small></div><span class="identityAvatar cardAvatar" aria-hidden="true">'+esc(p.display_name.trim().slice(0,1))+'</span><h2>'+esc(p.display_name)+'</h2><p>'+esc(p.university)+'</p><p>'+esc(p.faculty)+'</p><p>'+esc(p.academic_section)+'</p><div class="cardQr" aria-label="رمز QR لبيانات البطاقة">'+qr.createSvgTag({cellSize:4,margin:16,scalable:true})+'</div><small class="cardFooter">بطاقة تعريف بمشروع ليكس ليرن · عضو هيئة التدريس</small></article>';
}
function print(p){
 const popup=root.open('','_blank');if(!popup)throw Error('popup_blocked');
 popup.document.open();popup.document.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LexLearn — بطاقة أستاذ الجامعة</title><link rel="stylesheet" href="assets/student-identity.css"></head><body class="cardPrintPage"><div class="cardPrintToolbar"><button id="printFacultyCard">طباعة / حفظ PDF</button><p>مقاس البطاقة A6</p></div>'+card(p)+'</body></html>');popup.document.close();
 popup.document.getElementById('printFacultyCard').onclick=()=>{const node=popup.document.querySelector('.identityCard');node.style.zoom='1';node.style.zoom=String(Math.min(1,525/node.scrollHeight));popup.focus();popup.print();};popup.focus();
}
function open(roster,onEdit){
 const old=document.getElementById('instructorCardDialog');if(old)old.remove();
 const p=details(roster),dialog=document.createElement('dialog');dialog.id='instructorCardDialog';dialog.className='instructorCardDialog';dialog.setAttribute('aria-labelledby','facultyCardTitle');
 dialog.innerHTML='<div class="toolbar"><h2 id="facultyCardTitle">بطاقتي التعريفية</h2><button type="button" id="closeFacultyCard" class="secondary" autofocus>إغلاق</button></div>'+card(p)+'<div class="actions"><button type="button" id="downloadFacultyCard" class="primary">تحميل البطاقة PDF</button><button type="button" id="printFacultyCard" class="secondary">طباعة البطاقة</button><button type="button" id="editFacultyCard" class="secondary">تعديل بياناتي</button></div><p class="hint">رمز QR يحمل بيانات التعريف الأكاديمية فقط.</p><p id="facultyCardStatus" role="status" aria-live="polite"></p>';
 document.body.appendChild(dialog);const status=dialog.querySelector('#facultyCardStatus'),previous=document.activeElement;
 dialog.addEventListener('close',()=>{dialog.remove();if(previous&&previous.isConnected)previous.focus();});
 dialog.querySelector('#closeFacultyCard').onclick=()=>dialog.close();
 dialog.querySelector('#editFacultyCard').onclick=()=>{dialog.close();onEdit();document.getElementById('profileEdit')?.scrollIntoView({block:'start'});};
 dialog.querySelector('#printFacultyCard').onclick=()=>{try{print(p);}catch(_){status.textContent='اسمح بفتح نافذة الطباعة ثم حاول مجددًا.';}};
 dialog.querySelector('#downloadFacultyCard').onclick=async function(){
  this.disabled=true;status.textContent='جارٍ تجهيز البطاقة…';
  try{const blob=await root.LEX_CARD_PDF.create(p,api),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='LexLearn-Faculty-Card.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='تم تجهيز بطاقة PDF للتحميل.';}
  catch(_){status.textContent='تعذر تجهيز البطاقة. حاول مجددًا.';}finally{this.disabled=false;}
 };
 dialog.showModal();
}
root.LEX_INSTRUCTOR_CARD={open:open,details:details,card:card,payload:payload};
})(window);
