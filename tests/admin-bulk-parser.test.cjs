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
