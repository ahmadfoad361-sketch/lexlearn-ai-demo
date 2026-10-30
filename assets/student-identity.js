/* Own authenticated identity only. No photo or profile data is stored in browser storage. */
(function(root){'use strict';
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function en(){return document.documentElement.lang==='en';}
function t(ar,eng){return en()?eng:ar;}
function photo(p){return typeof p.avatar_data_url==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(p.avatar_data_url)?p.avatar_data_url:'';}
function number(p){var n=String(p.lexlearn_number||'');return /^[1-9][0-9]*$/.test(n)?'LL-'+n.padStart(6,'0'):'';}
var loaded=null,initial=null;
async function request(body){if(!root.LEX_CLOUD||!LEX_CLOUD.db())throw Error('not_signed_in');var r=await LEX_CLOUD.db().functions.invoke('student-profile',{body:body});if(r.error||!r.data||!r.data.ok)throw Error(r.data&&r.data.error||'profile_unavailable');loaded=r.data.profile;return loaded;}
function avatar(p,cls){return '<span class="identityAvatar '+(cls||'')+'">'+(photo(p)?'<img src="'+photo(p)+'" alt="'+esc(t('صورتك الشخصية','Your profile photo'))+'">':'<span aria-hidden="true">'+esc((p.display_name||p.username||'L').trim().slice(0,1))+'</span>')+'</span>';}
function updateBadge(p){var a=document.getElementById('studentIdentityLink');if(!a){a=document.createElement('a');a.id='studentIdentityLink';a.className='studentIdentityLink';document.body.appendChild(a);}a.href='student-profile.html'+(en()?'?lang=en':'');a.innerHTML=avatar(p)+'<span><b>'+esc(p.display_name||p.username)+'</b><small>'+esc(number(p))+' · '+t('ملفي الشخصي','My profile')+'</small></span>';a.setAttribute('aria-label',t('فتح ملفي الشخصي','Open my profile'));}
function payload(p){return JSON.stringify({project:'LexLearn',card_type:'student',card_id:number(p),name:String(p.display_name||p.username||''),username:String(p.username||''),university:String(p.university||''),faculty:String(p.faculty||''),department:String(p.academic_section||''),year:String(p.year_label||''),country:String(p.country_code||'')});}
function qr(p){if(!root.qrcode)throw Error('qr_unavailable');root.qrcode.stringToBytes=root.qrcode.stringToBytesFuncs['UTF-8'];var code=root.qrcode(0,'M');code.addData(payload(p),'Byte');code.make();return code.createSvgTag({cellSize:4,margin:16,scalable:true});}
function card(p){
 var brand=root.LEX_CARD_BRAND;if(!brand)throw Error('card_brand_unavailable');
 var display=p.display_name||p.username||'',university=String(p.university||'').trim();
 return '<article class="identityCard" dir="rtl">'+brand.brandHeader('بطاقة طالب · STUDENT')+
 avatar(p,'cardAvatar')+'<h2 class="'+brand.nameClass(display)+'">'+esc(display)+'</h2>'+
 '<strong class="cardNumber" dir="ltr">'+esc(number(p))+'</strong>'+
 brand.universityBlock(university,p.faculty||'')+
 (p.academic_section?'<p class="cardMeta">'+esc(p.academic_section)+'</p>':'')+
 (p.year_label?'<p class="cardYear">'+esc(p.year_label)+'</p>':'')+
 '<div class="cardQr" aria-label="رمز QR يتضمن بيانات البطاقة واسم المستخدم">'+qr(p)+'</div>'+
 '<p class="cardLogin">اسم الدخول: <b dir="ltr">'+esc(p.username||'—')+'</b></p>'+
 '<small class="cardFooter">بطاقة تعريف بمنصة <b dir="ltr">LexLearn</b> · ليست إثباتًا رسميًا من الجامعة</small></article>';
}
function printCard(p){if(!number(p))throw Error('missing_number');var popup=root.open('','_blank');if(!popup)throw Error('popup_blocked');popup.document.open();popup.document.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LexLearn '+esc(number(p))+'</title><link rel="stylesheet" href="assets/student-identity.css"></head><body class="cardPrintPage"><div class="cardPrintToolbar"><button id="printCard">طباعة / حفظ PDF</button><p>اختر «حفظ بتنسيق PDF» من نافذة الطباعة. مقاس البطاقة A6.</p></div>'+card(p)+'</body></html>');popup.document.close();popup.document.getElementById('printCard').onclick=function(){var cardEl=popup.document.querySelector('.identityCard');cardEl.style.zoom='1';cardEl.style.zoom=String(Math.min(1,525/cardEl.scrollHeight));popup.focus();popup.print();};popup.focus();}
async function compress(file){if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('invalid_photo');var bitmap=await createImageBitmap(file);try{var canvas=document.createElement('canvas');canvas.width=canvas.height=400;var ctx=canvas.getContext('2d'),side=Math.min(bitmap.width,bitmap.height);ctx.fillStyle='#fff';ctx.fillRect(0,0,400,400);ctx.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,400,400);var quality=.82,data=canvas.toDataURL('image/jpeg',quality);while(data.length>200000&&quality>.3){quality-=.12;data=canvas.toDataURL('image/jpeg',quality);}if(data.length>200000)throw Error('photo_too_large');return data;}finally{bitmap.close();}}
root.LEX_IDENTITY={load:function(){return loaded?Promise.resolve(loaded):initial||(initial=request({action:'get'}));},save:function(p){return request(Object.assign({},p,{action:'update'}));},number:number,avatar:avatar,payload:payload,card:card,print:printCard,compress:compress,updateBadge:updateBadge,esc:esc};
if(root.LEX_CLOUD&&root.LEX_CLOUD.isConfigured())root.LEX_IDENTITY.load().then(updateBadge).catch(function(){});
})(window);
