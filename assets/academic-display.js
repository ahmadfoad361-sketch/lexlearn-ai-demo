/* Presentation aliases only. Stored academic identities are never rewritten here. */
(function(root){
"use strict";
function text(value){return String(value==null?"":value).trim().toLowerCase().replace(/\s+/g," ");}
function universityKey(value){
 var key=text(value);
 return ["جامعة لوسيل","لوسيل","lusail university","lusail"].indexOf(key)>=0?"lusail university":key;
}
function university(value){return universityKey(value)==="lusail university"?"جامعة لوسيل":String(value==null?"":value).trim();}
function facultyKey(value,institution){
 var key=text(value);
 return universityKey(institution)==="lusail university"&&["law","faculty of law","college of law","كلية القانون","القانون"].indexOf(key)>=0?"كلية القانون":key;
}
function faculty(value,institution){return facultyKey(value,institution)==="كلية القانون"?"كلية القانون":String(value==null?"":value).trim();}
function year(value){
 var raw=String(value==null?"":value).trim(),key=text(raw).replace(/[\u064B-\u065F\u0670]/g,"").replace(/[أإآ]/g,"ا");
 var match=key.match(/^(?:(?:السنة|سنة|الفرقة|فرقة)\s*)?(الاولي|الاولى|اولي|اولى|الثانية|ثانية|الثالثة|ثالثة|الرابعة|رابعة|[1-4١-٤])$/);
 if(!match)return raw;
 var ordinal={"الاولي":1,"الاولى":1,"اولي":1,"اولى":1,"الثانية":2,"ثانية":2,"الثالثة":3,"ثالثة":3,"الرابعة":4,"رابعة":4,"١":1,"٢":2,"٣":3,"٤":4};
 var n=ordinal[match[1]]||Number(match[1]);
 return "الفرقة "+["","الأولى","الثانية","الثالثة","الرابعة"][n];
}
function preserveStored(patch,student){
 var copy=Object.assign({},patch);
 if(Object.prototype.hasOwnProperty.call(copy,"university")&&student.university!=null&&universityKey(copy.university)===universityKey(student.university))copy.university=student.university;
 if(universityKey(copy.university)===universityKey(student.university)&&Object.prototype.hasOwnProperty.call(copy,"faculty")&&student.faculty!=null&&facultyKey(copy.faculty,student.university)===facultyKey(student.faculty,student.university))copy.faculty=student.faculty;
 if(Object.prototype.hasOwnProperty.call(copy,"year_label")&&student.year!=null&&year(copy.year_label)===year(student.year))copy.year_label=student.year;
 return copy;
}
var api={text:text,universityKey:universityKey,university:university,facultyKey:facultyKey,faculty:faculty,year:year,preserveStored:preserveStored};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.LEX_ACADEMIC=api;
})(typeof window!=="undefined"?window:null);
