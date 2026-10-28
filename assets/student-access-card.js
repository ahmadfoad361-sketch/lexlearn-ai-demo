(function(root){
'use strict';
function fit(ctx,value,x,y,width,size){ctx.font='700 '+size+'px Arial';while(ctx.measureText(value).width>width&&size>18)ctx.font='700 '+(--size)+'px Arial';ctx.fillText(value,x,y);}
function loginUrl(username){var u=new URL('student-login.html',location.href);u.hash='username='+encodeURIComponent(username);return u.href;}
async function download(p,password){
 if(!password)throw Error('initial_password_unavailable');
 await document.fonts.ready;
 var canvas=document.createElement('canvas');canvas.width=1200;canvas.height=800;
 var c=canvas.getContext('2d');c.fillStyle='#f9f4ef';c.fillRect(0,0,1200,800);c.fillStyle='#142b5f';c.fillRect(0,0,1200,128);c.fillStyle='#8f1d3f';c.fillRect(0,128,1200,12);
 c.textAlign='left';c.fillStyle='#fff';c.font='bold 54px Arial';c.fillText('LexLearn',55,82);
 c.direction='rtl';c.textAlign='right';c.font='bold 32px Arial';c.fillText('بطاقة دخول الطالب',1140,80);
 c.fillStyle='#142b5f';fit(c,p.name||p.display_name||'',1140,210,1080,44);
 c.font='26px Arial';c.fillText((p.university||'')+' — '+(p.faculty||''),1140,265);
 var number=p.number||('LL-'+String(p.lexlearn_number||'').padStart(6,'0'));
 c.fillStyle='#8f1d3f';c.font='bold 25px Arial';c.fillText('اسم الدخول',1140,335);c.fillText('الرقم التعريفي',1140,445);c.fillText('كلمة المرور الأولية',1140,555);
 c.fillStyle='#142b5f';c.direction='ltr';fit(c,p.username,1140,382,730,38);fit(c,number,1140,490,730,36);fit(c,password,1140,600,730,34);
 var q=root.qrcode(0,'M');q.addData(loginUrl(p.username));q.make();var n=q.getModuleCount(),unit=Math.floor(275/(n+8)),side=unit*(n+8),x=55,y=330;
 c.fillStyle='#fff';c.fillRect(x,y,side,side);c.fillStyle='#142b5f';for(var r=0;r<n;r++)for(var col=0;col<n;col++)if(q.isDark(r,col))c.fillRect(x+(col+4)*unit,y+(r+4)*unit,unit,unit);
 c.direction='rtl';c.textAlign='right';c.font='23px Arial';c.fillText('الرمز يفتح صفحة الدخول ولا يحتوي على كلمة المرور.',1140,685);
 c.fillText('احفظ البطاقة بشكل خاص. يبدأ التدريب بعد اعتماد المشرف.',1140,725);
 c.fillStyle='#8f1d3f';c.fillText('غيّر كلمة المرور الأولية عند أول دخول للحساب الذي أنشأه المشرف.',1140,765);
 var blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('image_failed');
 var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='LexLearn-'+p.username+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
root.LEX_ACCESS_CARD={download:download,loginUrl:loginUrl};
})(window);
