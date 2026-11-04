/* LexLearn bulk onboarding: isolated, client-side parsing and PDF/ZIP generation.
   Credential values are ephemeral and must never be cached, logged or uploaded for parsing. */
(function(root,factory){
  "use strict";
  var api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.LEX_BULK_CORE=api;
})(typeof window!=="undefined"?window:globalThis,function(){
"use strict";
function clean(v){return String(v==null?"":v).replace(/[\u200B-\u200D\uFEFF]/g,"").replace(/\s+/g," ").trim();}
function validUsername(v){return /^[a-z0-9._-]{3,32}$/.test(String(v||"").toLowerCase());}
function csvRecords(text){
 text=String(text||"").replace(/^\uFEFF/,"");
 var first=(text.split(/\r?\n/,1)[0]||""),separators=[",",";","\t"];
 var sep=separators.sort(function(a,b){return first.split(b).length-first.split(a).length;})[0];
 var rows=[],row=[],cell="",quoted=false;
 for(var i=0;i<text.length;i++){
  var c=text[i];
  if(c==='"'){
   if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;
  }else if(c===sep&&!quoted){row.push(clean(cell));cell="";}
  else if((c==="\n"||c==="\r")&&!quoted){
   if(c==="\r"&&text[i+1]==="\n")i++;
   row.push(clean(cell));if(row.some(Boolean))rows.push(row);
   cell="";row=[];
  }else cell+=c;
 }
 row.push(clean(cell));if(row.some(Boolean))rows.push(row);
 return rows;
}
function parseText(text){
 var raw=String(text||"").replace(/^\uFEFF/,""),lines=raw.split(/\r?\n/);
 return lines.map(function(t){
  return clean(t.replace(/^\s*(?:\d{1,4}[\s.\-–):]+|[•*]\s*)/,"")
    .replace(/^الاسم\s*[:\-]\s*/,""));
 }).filter(function(t){
  return t.length>=3&&t.length<=160&&!/^(الاسم|name|الطلاب|students|student names|serial|مسلسل|رقم)$/i.test(t);
 }).map(function(t){return {name:t,username:""};});
}
function parseCsv(text){
 var rows=csvRecords(text);if(!rows.length)return [];
 var head=rows[0].map(function(x){return clean(x).toLowerCase().replace(/[ _-]/g,"");});
 var nameIndex=head.findIndex(function(x){return /^(name|fullname|studentname|الاسم|اسمالطالب|الاسمالكامل)$/.test(x);});
 var usernameIndex=head.findIndex(function(x){return /^(username|login|user|اسمالدخول|اسمالمستخدم)$/.test(x);});
 if(nameIndex<0)return parseText(text); // Text list, no recognized CSV header.
 return rows.slice(1).map(function(cols){
  return {name:clean(cols[nameIndex]),username:clean(cols[usernameIndex]||"").toLowerCase()};
 }).filter(function(x){return x.name.length>=2;});
}
function usernameFor(i,used){
 used=used||new Set();
 var n=i+1,user;
 do{user="lex"+String(n).padStart(6,"0");n++;}while(used.has(user));
 used.add(user);return user;
}
function validate(rows,existing){
 var used=new Set((existing||[]).map(function(x){return String(x.username||x).toLowerCase();}));
 var names=new Set(),duplicates=new Set();
 return rows.map(function(row,i){
  var name=clean(row.name),username=clean(row.username).toLowerCase();
  if(!username)username=usernameFor(i,used);
  var errors=[];
  if(name.length<2||name.length>160)errors.push("اسم غير صالح");
  if(!validUsername(username))errors.push("اسم دخول غير صالح");
  if(used.has(username)&&clean(row.username))errors.push("اسم الدخول مستخدم");
  if(names.has(username))errors.push("اسم دخول مكرر في الملف");
  names.add(username);
  if(!clean(row.username))used.add(username);
  return {name,username,errors:errors,status:"ready"};
 });
}
function pageName(v){return clean(v).replace(/[\\/:*?"<>|]/g,"-").slice(0,58)||"student";}
function escapeHtml(x){return String(x==null?"":x).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function binaryPdf(pages){
 // JPEG images on A5/A4 pages. Arabic text is rasterized with native Canvas shaping.
 var t=new TextEncoder(),parts=[],offsets=[0],pos=0;
 function add(x){var arr=typeof x==="string"?t.encode(x):x;parts.push(arr);pos+=arr.length;}
 function obj(n,body){offsets[n]=pos;add(n+" 0 obj\n");add(body);add("\nendobj\n");}
 add("%PDF-1.4\n");
 obj(1,"<< /Type /Catalog /Pages 2 0 R >>");
 var ids=pages.map(function(_,i){return 3+3*i;});
 obj(2,"<< /Type /Pages /Kids ["+ids.map(function(id){return id+" 0 R";}).join(" ")+"] /Count "+pages.length+" >>");
 pages.forEach(function(p,i){
  var id=ids[i],w=p.paperW||595,h=p.paperH||842;
  obj(id,"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+w+" "+h+"] /Resources << /XObject << /I "+(id+2)+" 0 R >> >> /Contents "+(id+1)+" 0 R >>");
  var draw="q\n"+w+" 0 0 "+h+" 0 0 cm\n/I Do\nQ\n";
  obj(id+1,"<< /Length "+t.encode(draw).length+" >>\nstream\n"+draw+"endstream");
  offsets[id+2]=pos;
  add((id+2)+" 0 obj\n<< /Type /XObject /Subtype /Image /Width "+p.w+" /Height "+p.h+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+p.jpeg.length+" >>\nstream\n");
  add(p.jpeg);add("\nendstream\nendobj\n");
 });
 var count=2+pages.length*3,at=pos;add("xref\n0 "+(count+1)+"\n0000000000 65535 f \n");
 for(var z=1;z<=count;z++)add(String(offsets[z]).padStart(10,"0")+" 00000 n \n");
 add("trailer\n<< /Size "+(count+1)+" /Root 1 0 R >>\nstartxref\n"+at+"\n%%EOF");
 return new Blob(parts,{type:"application/pdf"});
}
function jpeg(c){
 try{
 var width=c.width,height=c.height;
 var b64=c.toDataURL("image/jpeg",.88).split(",")[1],s=atob(b64),bytes=new Uint8Array(s.length);
 for(var i=0;i<s.length;i++)bytes[i]=s.charCodeAt(i);
 return {jpeg:bytes,w:width,h:height,paperW:595,paperH:842};
 }finally{
  // The PDF owns the encoded bytes now. Release the large raster immediately,
  // including on encoding failure, instead of waiting for browser collection.
  c.width=1;c.height=1;
 }
}
var logoPromise=null;
function logoImage(){
 if(!logoPromise)logoPromise=(async function(){
  try{var im=new Image();im.src="assets/lexlearn-logo.svg";await im.decode();return im;}catch(_){return null;}
 })();
 return logoPromise;
}
function canvas(){var c=document.createElement("canvas");c.width=1240;c.height=1754;return c;}
function head(g,title,sub,logo){
 var c=g.canvas,w=c.width;
 g.fillStyle="#f9f4ef";g.fillRect(0,0,c.width,c.height);
 g.fillStyle="#111d31";g.fillRect(0,0,c.width,300);
 g.fillStyle="#8a1f39";g.fillRect(0,290,c.width,14);
 if(logo)g.drawImage(logo,74,66,132,132);
 g.textAlign="right";g.direction="ltr";g.fillStyle="#ffffff";
 g.font="bold 72px Arial";g.fillText("LexLearn",1125,132);
 g.font="32px Arial";g.fillText("Smart legal learning",1125,185);
 g.direction="rtl";g.textAlign="center";g.fillStyle="#111d31";
 g.font='bold 50px "IBM Plex Sans Arabic",Tahoma,sans-serif';g.fillText(title,w/2,390);
 g.fillStyle="#8a1f39";g.font='30px "IBM Plex Sans Arabic",Tahoma,sans-serif';g.fillText(sub,w/2,440);
}
function fit(g,s,max=900,size=40){
 while(size>22){g.font='bold '+size+'px "IBM Plex Sans Arabic",Tahoma,sans-serif';if(g.measureText(clean(s)).width<=max)break;size-=2;}
 return size;
}
function line(g,label,value,y,secret){
 g.textAlign="right";g.direction="rtl";g.fillStyle="#536078";
 g.font='32px "IBM Plex Sans Arabic",Tahoma,sans-serif';g.fillText(label,1080,y);
 g.fillStyle=secret?"#8a1f39":"#111d31";
 g.font='bold '+fit(g,value,950,43)+'px "IBM Plex Sans Arabic",Tahoma,sans-serif';
 g.fillText(clean(value)||"—",1080,y+65,970);
 g.strokeStyle="#ddd7cc";g.beginPath();g.moveTo(140,y+92);g.lineTo(1090,y+92);g.stroke();
}
async function credentialPdf(p,group,professor){
 if(document.fonts)await document.fonts.ready;
 var c=canvas(),g=c.getContext("2d"),logo=await logoImage();
 head(g,"بيانات دخول الطالب","نسخة خاصة — تُسلّم للطالب وحده",logo);
 line(g,"اسم الطالب",p.name,560,false);
 line(g,"اسم المستخدم / Username",p.username,745,false);
 line(g,"كلمة المرور الأولية / Temporary password",p.temporary_password,930,true);
 line(g,"المجموعة / Group",group,1115,false);
 line(g,"الأستاذ الجامعي / Professor",professor,1300,false);
 g.fillStyle="#8a1f39";g.font='bold 31px "IBM Plex Sans Arabic",Tahoma,sans-serif';
 g.direction="rtl";g.textAlign="center";
 g.fillText("غيّر كلمة المرور عند أول دخول ولا تشاركها مع الآخرين.",c.width/2,1530,1090);
 g.fillStyle="#536078";g.font="25px Arial";g.direction="ltr";
 g.fillText("https://lexlearnsmart.com",c.width/2,1625);
 return binaryPdf([jpeg(c)]);
}
async function rosterPdf(rows,group,professor){
 if(document.fonts)await document.fonts.ready;
 var logo=await logoImage(),pages=[],perPage=25,sets=Math.max(1,Math.ceil(rows.length/perPage));
 for(var pg=0;pg<sets;pg++){
  var c=canvas(),g=c.getContext("2d");head(g,"كشف طلاب المجموعة",group,logo);
  g.direction="rtl";g.textAlign="right";g.fillStyle="#111d31";
  g.font='bold 28px "IBM Plex Sans Arabic",Tahoma,sans-serif';
  g.fillText("الأستاذ الجامعي: "+clean(professor),1100,535,950);
  g.fillText("عدد الطلاب: "+rows.length+"  ·  صفحة "+(pg+1)+" من "+sets,1100,585);
  g.fillStyle="#eee4d9";g.fillRect(80,630,1080,62);
  g.fillStyle="#111d31";g.fillText("م",1100,675);g.fillText("اسم الطالب",980,675);g.fillText("اسم الدخول",450,675);
  rows.slice(pg*perPage,(pg+1)*perPage).forEach(function(row,i){
   var y=735+i*37;
   if(i%2===1){g.fillStyle="#f3efe7";g.fillRect(80,y-31,1080,36);}
   g.fillStyle="#111d31";g.font='25px "IBM Plex Sans Arabic",Tahoma,sans-serif';
   g.fillText(String(pg*perPage+i+1),1100,y);
   g.fillText(clean(row.name),980,y,480);
   g.direction="ltr";g.textAlign="left";g.fillText(clean(row.username),135,y,330);
   g.direction="rtl";g.textAlign="right";
  });
  g.font='25px "IBM Plex Sans Arabic",Tahoma,sans-serif';g.fillStyle="#8a1f39";
  g.fillText("لا يتضمن الكشف كلمات المرور حفاظًا على خصوصية الطلاب.",1100,1690);
  pages.push(jpeg(c));
 }
 return binaryPdf(pages);
}
var crcTable=null;
function crc32(a){
 if(!crcTable){crcTable=[];for(var n=0;n<256;n++){var k=n;for(var j=0;j<8;j++)k=(k&1)?(0xedb88320^(k>>>1)):(k>>>1);crcTable[n]=k>>>0;}}
 var c=0xffffffff;for(var i=0;i<a.length;i++)c=crcTable[(c^a[i])&255]^(c>>>8);
 return (c^0xffffffff)>>>0;
}
async function zipFiles(files){
 var encoder=new TextEncoder(),parts=[],central=[],position=0;
 function push(bytes){parts.push(bytes);position+=bytes.length;}
 function header(size){return new Uint8Array(size);}
 function w16(d,i,v){d[i]=v&255;d[i+1]=(v>>>8)&255;}
 function w32(d,i,v){w16(d,i,v&65535);w16(d,i+2,(v>>>16)&65535);}
 for(const f of files){
  var filename=encoder.encode(f.name),bytes=new Uint8Array(await f.blob.arrayBuffer()),crc=crc32(bytes),at=position;
  if(bytes.length>25000000)throw Error("file_too_large");
  var l=header(30);
  w32(l,0,0x04034b50);w16(l,4,20);w16(l,6,0x0800);w16(l,8,0);
  w32(l,14,crc);w32(l,18,bytes.length);w32(l,22,bytes.length);w16(l,26,filename.length);
  push(l);push(filename);push(bytes);
  var c=header(46);w32(c,0,0x02014b50);w16(c,4,20);w16(c,6,20);w16(c,8,0x0800);
  w32(c,16,crc);w32(c,20,bytes.length);w32(c,24,bytes.length);
  w16(c,28,filename.length);w32(c,42,at);central.push(c,filename);
 }
 var start=position;central.forEach(push);
 var end=header(22);w32(end,0,0x06054b50);w16(end,8,files.length);
 w16(end,10,files.length);w32(end,12,position-start);w32(end,16,start);push(end);
 return new Blob(parts,{type:"application/zip"});
}
function download(blob,name){
 var url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(function(){URL.revokeObjectURL(url);},1500);
}
return {clean,validUsername,csvRecords,parseText,parseCsv,usernameFor,validate,pageName,escapeHtml,
 credentialPdf,rosterPdf,zipFiles,download};
});
