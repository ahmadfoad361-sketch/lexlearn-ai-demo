const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const elements={},qrPayloads=[];
const doc={getElementById:id=>elements[id],activeElement:null,body:{appendChild(node){elements[node.id]=node;}},createElement(tag){
 if(tag==='dialog')return {innerHTML:'',setAttribute(){},addEventListener(){},querySelector(selector){return elements[selector.slice(1)]||(elements[selector.slice(1)]={});},showModal(){this.open=true;},close(){this.open=false;},remove(){delete elements[this.id];}};
 return {click(){this.clicked=true;},remove(){}};
}};
function qrcode(){return {addData(text){qrPayloads.push(text);},make(){},createSvgTag(){return '<svg></svg>';}};}qrcode.stringToBytesFuncs={'UTF-8':x=>x};
const window={qrcode,LEX_ACADEMIC:{university:x=>x},LEX_CARD_PDF:{async create(p,api){assert.equal(api.label,'أستاذ جامعي · FACULTY');assert.equal(api.allowUnnumbered,true);assert.equal(api.number(p),'');return new Blob(['%PDF-1.4']);}},open(){return null;}};
vm.runInNewContext(fs.readFileSync('assets/instructor-card.js','utf8'),{window,document:doc,URL:{createObjectURL:()=> 'blob:card',revokeObjectURL(){}},setTimeout(){}});
const roster={profile:{name:'أحمد <script>',academic_title:'دكتور',specialization:'القانون المدني',official_email:'private@example.com',whatsapp:'private-phone'},assignments:[{university:'جامعة عجمان',faculty:'كلية القانون'},{university:'جامعة عجمان',faculty:'كلية القانون'}],students:[{name:'SECRET STUDENT',answer:'SECRET ANSWER'}]};
const api=window.LEX_INSTRUCTOR_CARD,p=api.details(roster);
assert.equal(p.university,'جامعة عجمان');assert.equal(p.faculty,'كلية القانون');
const html=api.card(p);assert.match(html,/أستاذ جامعي · FACULTY/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|TRAINEE|SECRET|private/);
const payload=JSON.parse(api.payload(p));assert.equal(payload.role,'faculty');assert.doesNotMatch(JSON.stringify(payload),/private|SECRET|password|students/);
api.open(roster,()=>{});assert.equal(elements.instructorCardDialog.open,true);
assert.match(elements.instructorCardDialog.innerHTML,/aria-label="إغلاق البطاقة"[^>]*>×<\/button>/);
elements.printFacultyCard.onclick();assert.match(elements.facultyCardStatus.textContent,/اسمح/);
(async()=>{await elements.downloadFacultyCard.onclick();assert.equal(elements.downloadFacultyCard.disabled,false);assert.match(elements.facultyCardStatus.textContent,/تم تجهيز/);elements.closeFacultyCard.onclick();assert.equal(elements.instructorCardDialog.open,false);console.log('PASS: faculty card identity, private QR, escaping, modal, blocked-popup feedback and PDF download');})().catch(e=>{console.error(e);process.exitCode=1;});
