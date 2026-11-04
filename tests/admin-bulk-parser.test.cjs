const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const core=require("../assets/admin-bulk-core.js");
test("CSV: Arabic text, quoted commas and quotes, explicit username",()=>{
 const rows=core.parseCsv('name,username\n"أحمد، محمد علي",ahmed14\n"ندى ""نونة"" سالم",nada14');
 assert.deepEqual(rows,[{name:"أحمد، محمد علي",username:"ahmed14"},{name:'ندى "نونة" سالم',username:"nada14"}]);
});
test("TSV and manual numbered Arabic names",()=>{
 assert.deepEqual(core.parseCsv("name\tusername\nسارة حسن\tsara1"),[{name:"سارة حسن",username:"sara1"}]);
 assert.deepEqual(core.parseText("1. أحمد محمد\n2- يوسف حسن\n• نور أحمد"),
 [{name:"أحمد محمد",username:""},{name:"يوسف حسن",username:""},{name:"نور أحمد",username:""}]);
});
test("duplicate and invalid login names reject before creating accounts",()=>{
 const v=core.validate([{name:"مريم علي",username:"user1"},{name:"أحمد علي",username:"user1"},
 {name:"علي حسن",username:"@@@@"},{name:"نور علي"}],["lex000001"]);
 assert.deepEqual(v[0].errors,[]);
 assert.ok(v[1].errors.some(x=>x.includes("مكرر")));
 assert.ok(v[2].errors.some(x=>x.includes("غير صالح")));
 assert.equal(v[3].username,"lex000004");
});
test("automatic usernames skip already used values",()=>{
 const v=core.validate([{name:"أحمد حسن"},{name:"نور أحمد"}],["lex000001","lex000002"]);
 assert.equal(v[0].username,"lex000003");
 assert.equal(v[1].username,"lex000004");
});
test("ZIP uses true Unicode filenames and valid ZIP local/end signatures",async()=>{
 const z=await core.zipFiles([{name:"students/001-أحمد.pdf",blob:new Blob(["%PDF-1.4\nTEST"])},
 {name:"LexLearn-كشف-المجموعة.pdf",blob:new Blob(["%PDF-1.4\nROSTER"])}]);
 const b=new Uint8Array(await z.arrayBuffer());
 const d=new DataView(b.buffer);
 assert.equal(d.getUint32(0,true),0x04034b50);
 assert.equal(d.getUint32(b.length-22,true),0x06054b50);
 assert.equal(d.getUint16(b.length-12,true),2);
});
test("archive UI never deletes students and group PDF excludes passwords",()=>{
 const archive=fs.readFileSync("assets/admin-archive.js","utf8");
 const bulk=fs.readFileSync("assets/admin-bulk.js","utf8");
 const helper=fs.readFileSync("assets/admin-bulk-core.js","utf8");
 assert.ok(!archive.includes('action:"delete_student"'));
 assert.ok(archive.includes('"restore_student"'));
 assert.ok(archive.includes('"archive_student"'));
 assert.ok(bulk.includes('accepted_registration_terms:true'));
 const roster=helper.slice(helper.indexOf("async function rosterPdf"),helper.indexOf("var crcTable"));
 assert.ok(!roster.includes("temporary_password"));
});
test("syntax of admin files",()=>{
 for(const p of ["assets/admin-cloud.js","assets/admin-bulk-core.js","assets/admin-bulk.js","assets/admin-archive.js"]){
  const s=fs.readFileSync(p,"utf8");assert.doesNotThrow(()=>new Function(s),p);
 }
});

test("browser-canvas smoke test: individual A4 and multi-page roster PDFs generated in memory",async()=>{
 const originalDocument=global.document,originalImage=global.Image;
 const canvases=[];let failEncoding=false,logoDecodes=0;
 try{
  global.Image=class{async decode(){logoDecodes++;}};
  global.document={
   fonts:{ready:Promise.resolve()},
   createElement(kind){
    assert.equal(kind,"canvas");
    const canvas={width:1240,height:1754};
    canvases.push(canvas);
    const g=new Proxy({canvas,measureText(x){return {width:String(x).length*18};}},{
     get(obj,key){return key in obj?obj[key]:(()=>{});},
     set(obj,key,value){obj[key]=value;return true;}
    });
    canvas.getContext=()=>g;
    // A mock JPEG byte stream verifies PDF structure; real browser uses canvas.toDataURL.
    canvas.toDataURL=()=>{if(failEncoding)throw Error('encoding_failed');return "data:image/jpeg;base64,"+Buffer.from("simulated-jpeg").toString("base64");};
    return canvas;
   }
  };
  const person={name:"أحمد محمد علي",username:"lex000001",temporary_password:"sample-ONLY-NotReal999"};
  const one=await core.credentialPdf(person,"المجموعة الثانية","د. أستاذ تجريبي");
  const txt=Buffer.from(await one.arrayBuffer()).toString("latin1");
  assert.match(txt,/^%PDF-1\.4/);
  assert.match(txt,/\/Count 1/);
  assert.match(txt,/\/Width 1240 \/Height 1754/,'PDF retains original raster dimensions');
  assert.ok(canvases.every(c=>c.width===1&&c.height===1),'completed individual image memory is released immediately');
  const people=Array.from({length:60},(_,i)=>({name:"طالب تجريبي "+i,username:"lex"+String(i).padStart(6,"0")}));
  const roster=await core.rosterPdf(people,"المجموعة الثانية","د. أستاذ تجريبي");
  const rosterText=Buffer.from(await roster.arrayBuffer()).toString("latin1");
  assert.match(rosterText,/^%PDF-1\.4/);
  assert.match(rosterText,/\/Count 3/);
  assert.ok(!rosterText.includes(person.temporary_password));
  assert.equal(canvases.length,4);
  assert.ok(canvases.every(c=>c.width===1&&c.height===1),'each roster image is released after encoding');
  failEncoding=true;
  await assert.rejects(core.credentialPdf(person,'Synthetic','Synthetic'),/encoding_failed/);
  assert.ok(canvases.every(c=>c.width===1&&c.height===1),'encoding failure also releases its raster');
  assert.equal(logoDecodes,1,'a batch shares one decoded logo instead of retaining hundreds');
 }finally{
  global.document=originalDocument;global.Image=originalImage;
 }
});

test("bulk enrollment must not invent missing academic placement",()=>{
 const s=fs.readFileSync("assets/admin-bulk.js","utf8");
 const part=s.slice(s.indexOf("function scope(g)"),s.indexOf("function professor(g)"));
 assert.ok(!part.includes('first.country||"qa"'));
 assert.ok(!part.includes('first.faculty||"كلية الحقوق"'));
 assert.ok(!part.includes('g.course_id||"qa-qu-lawc101-rights"'));
 assert.ok(s.includes('!d.year'));
});
