/* A6 card PDF. Rasterized Arabic preserves shaping in PDF viewers and at print time. */
(function(root){'use strict';
function pdf(jpeg,width,height){var encoder=new TextEncoder(),parts=[],offsets=[0],size=0;function add(v){var bytes=typeof v==='string'?encoder.encode(v):v;parts.push(bytes);size+=bytes.length;}function obj(n,body){offsets[n]=size;add(n+' 0 obj\n');add(body);add('\nendobj\n');}add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 297.6378 419.5276] /Resources << /XObject << /Card 5 0 R >> >> /Contents 4 0 R >>');var stream='q\n297.6378 0 0 419.5276 0 0 cm\n/Card Do\nQ\n';obj(4,'<< /Length '+encoder.encode(stream).length+' >>\nstream\n'+stream+'endstream');offsets[5]=size;add('5 0 obj\n<< /Type /XObject /Subtype /Image /Width '+width+' /Height '+height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n');add(jpeg);add('\nendstream\nendobj\n');var xref=size;add('xref\n0 6\n0000000000 65535 f \n');for(var i=1;i<=5;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');return new Blob(parts,{type:'application/pdf'});}
async function image(src){var img=new Image();img.src=src;await img.decode();return img;}
async function create(p,cardApi){
 var api=cardApi||root.LEX_IDENTITY,brand=root.LEX_CARD_BRAND;
 if(!api.allowUnnumbered&&!api.number(p))throw Error('missing_number');
 if(document.fonts)await document.fonts.ready;
 var canvas=document.createElement('canvas');canvas.width=1050;canvas.height=1480;
 var c=canvas.getContext('2d');if(!c)throw Error('no_canvas');
 c.fillStyle='#fffaf2';c.fillRect(0,0,1050,1480);
 c.strokeStyle='#bda16a';c.lineWidth=5;c.strokeRect(15,15,1020,1450);
 var gradient=c.createLinearGradient(0,0,1050,285);
 gradient.addColorStop(0,'#111d31');gradient.addColorStop(1,'#273959');
 c.fillStyle=gradient;c.fillRect(18,18,1014,280);
 // Exact navy/burgundy LexLearn identity and the X artwork, also used in the HTML card.
 c.fillStyle='#f9f4ef';c.beginPath();c.roundRect(275,67,520,125,22);c.fill();
 c.font='bold 70px Tahoma,Arial';c.textAlign='left';c.direction='ltr';
 var lex='Lex',learn='Learn',w1=c.measureText(lex).width,w2=c.measureText(learn).width;
 var tx=535-(w1+w2)/2;c.fillStyle='#142b5f';c.fillText(lex,tx,147);
 c.fillStyle='#8a1f39';c.fillText(learn,tx+w1,147);
 var logo=await image('assets/lexlearn-x-transparent.svg');
 c.drawImage(logo,205,82,85,85);
 c.textAlign='center';c.fillStyle='#f0d5a2';c.font='29px Tahoma,Arial';
 c.fillText(api.label||'بطاقة طالب · STUDENT',525,242,920);
 // Portrait or safe initial.
 c.save();c.beginPath();c.arc(525,323,105,0,Math.PI*2);c.clip();
 c.fillStyle='#e8d6bd';c.fillRect(420,218,210,210);
 var photo=typeof p.avatar_data_url==='string'&&/^data:image\/jpeg;base64,/.test(p.avatar_data_url)?p.avatar_data_url:null;
 if(photo){var picture=await image(photo);c.drawImage(picture,420,218,210,210);}
 else{c.direction='rtl';c.fillStyle='#172641';c.font='bold 94px Tahoma,Arial';
  c.fillText(String(p.display_name||'L').trim().replace(/^(دكتور|د\.|أستاذ)\s*/,'').slice(0,1)||'L',525,358);}
 c.restore();c.strokeStyle='#fffaf2';c.lineWidth=9;c.beginPath();c.arc(525,323,105,0,Math.PI*2);c.stroke();
 function wrap(text,maxWidth,px,maxLines){
  var words=String(text||'').trim().split(/\s+/).filter(Boolean),lines=[],piece='';
  c.font=(px>=34?'bold ':'')+px+'px Tahoma,Arial';
  for(var i=0;i<words.length;i++){
   var next=piece?piece+' '+words[i]:words[i];
   if(c.measureText(next).width>maxWidth&&piece){lines.push(piece);piece=words[i];}else piece=next;
  }
  if(piece)lines.push(piece);
  if(lines.length>maxLines&&px>19)return wrap(text,maxWidth,px-2,maxLines);
  return {lines:lines.slice(0,maxLines),px:px};
 }
 function draw(text,y,px,maxWidth,maxLines,color){
  if(!String(text||'').trim())return y;
  c.textAlign='center';c.direction='rtl';c.fillStyle=color||'#172641';
  var fitted=wrap(text,maxWidth,px,maxLines),lineHeight=fitted.px*1.5;
  c.font=(fitted.px>=34?'bold ':'')+fitted.px+'px Tahoma,Arial';
  fitted.lines.forEach(function(line){c.fillText(line,525,y,maxWidth);y+=lineHeight;});
  return y;
 }
 var y=496;
 y=draw(p.display_name||p.username||'',y,53,900,2,'#172641');
 var number=api.number(p);
 if(number){c.direction='ltr';c.fillStyle='#8a1f39';c.font='bold 37px Tahoma,Arial';c.fillText(number,525,y+2);y+=52;}
 y=Math.max(635,y+12);
 // The affiliation panel uses one university, never a concatenated list.
 c.fillStyle='#f5f0e9';c.strokeStyle='#ded4bf';c.lineWidth=2;
 c.beginPath();c.roundRect(95,y,860,162,23);c.fill();c.stroke();
 c.fillStyle='#fff';c.strokeStyle='#c9b88e';c.beginPath();c.roundRect(760,y+38,98,85,18);c.fill();c.stroke();
 c.direction='ltr';c.textAlign='center';c.fillStyle='#8a1f39';c.font='bold 30px Tahoma,Arial';
 c.fillText(brand?brand.initials(p.university):'UNI',809,y+91,85);
 var univY=y+59;c.direction='rtl';c.textAlign='center';
 c.save();c.beginPath();c.rect(140,y+10,585,145);c.clip();
 c.translate(-100,0);
 draw(p.university||'',univY,35,575,2,'#172641');
 draw(p.faculty||'',univY+55,27,575,1,'#536078');
 c.restore();
 y+=183;
 if(p.academic_section)y=draw(p.academic_section,y,26,900,1,'#35415a')+12;
 if(p.year_label)y=draw(p.year_label,y,27,900,1,'#8a1f39')+12;
 var qr=root.qrcode(0,'M');root.qrcode.stringToBytes=root.qrcode.stringToBytesFuncs['UTF-8'];
 qr.addData(api.payload(p),'Byte');qr.make();
 var n=qr.getModuleCount(),module=Math.floor(415/(n+8)),qrWidth=(n+8)*module,x=Math.round((1050-qrWidth)/2),top=Math.max(927,Math.min(y+20,970));
 c.fillStyle='#fff';c.fillRect(x,top,qrWidth,qrWidth);c.fillStyle='#000';
 for(var row=0;row<n;row++)for(var col=0;col<n;col++){
  if(qr.isDark(row,col))c.fillRect(x+(col+4)*module,top+(row+4)*module,module,module);
 }
 var login=String(p.username||'');
 if(login){
  c.direction='rtl';c.textAlign='center';c.fillStyle='#35415a';c.font='23px Tahoma,Arial';
  c.fillText('اسم الدخول:',525,top+qrWidth+34);
  c.direction='ltr';c.font='bold 25px Tahoma,Arial';
  c.fillText(login,525,top+qrWidth+67,900);
 }
 c.direction='rtl';c.textAlign='center';c.fillStyle='#536078';c.font='24px Tahoma,Arial';
 c.fillText('بطاقة تعريف بمنصة',590,1434);
 c.direction='ltr';c.font='bold 24px Tahoma,Arial';c.fillStyle='#142b5f';c.fillText('Lex',358,1434);
 c.fillStyle='#8a1f39';c.fillText('Learn',396,1434);
 var bytes=Uint8Array.from(atob(canvas.toDataURL('image/jpeg',.95).split(',')[1]),function(v){return v.charCodeAt(0);});
 return pdf(bytes,1050,1480);
}
async function download(p){var blob=await create(p),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='LexLearn-'+root.LEX_IDENTITY.number(p)+'.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},30000);}
root.LEX_CARD_PDF={create:create,download:download,encode:pdf};
})(window);
