/* University image directory used by school pickers, faculty/student cards and A6 PDFs.
 * Logo URLs are fixed on the LexLearn server and resolve to university-published image assets.
 * The badge indicates an account holder's self-declared or staff-entered affiliation only.
 * It is not a university-issued ID or institutional endorsement. */
(function(root){"use strict";
const registry=[
 ["qa-qu","qa",["Qatar University","جامعة قطر","جامعه قطر"]],
 ["qa-lusail","qa",["Lusail University","جامعة لوسيل","جامعه لوسيل","لوسيل"]],
 ["qa-hbku","qa",["Hamad Bin Khalifa University","جامعة حمد بن خليفة","جامعه حمد بن خليفه"]],
 ["qa-udst","qa",["University of Doha for Science and Technology","جامعة الدوحة للعلوم والتكنولوجيا","جامعة الدوحة للعلوم و التكنولوجيا"]],
 ["qa-doha","qa",["Doha Institute for Graduate Studies","معهد الدوحة للدراسات العليا"]],
 ["ae-ajman","ae",["Ajman University","جامعة عجمان","جامعه عجمان"]],
 ["ae-sharjah","ae",["University of Sharjah","جامعة الشارقة","جامعه الشارقه"]],
 ["ae-uaeu","ae",["United Arab Emirates University","جامعة الإمارات العربية المتحدة","جامعة الامارات العربية المتحدة","جامعة الإمارات"]],
 ["ae-adu","ae",["Abu Dhabi University","جامعة أبوظبي","جامعة ابوظبي"]],
 ["ae-zayed","ae",["Zayed University","جامعة زايد"]],
 ["ae-alain","ae",["Al Ain University","جامعة العين"]],
 ["ae-dubai","ae",["University of Dubai","جامعة دبي"]],
 ["ae-city","ae",["City University Ajman","جامعة المدينة عجمان","جامعة المدينة - عجمان"]],
 ["ae-alwasl","ae",["Al Wasl University","جامعة الوصل"]],
 ["ae-alqasimia","ae",["Al Qasimia University","جامعة القاسمية"]],
 ["eg-tanta","eg",["Tanta University","جامعة طنطا","جامعه طنطا"]],
 ["eg-ainshams","eg",["Ain Shams University","جامعة عين شمس"]],
 ["eg-cairo","eg",["Cairo University","جامعة القاهرة","جامعة القاهره"]],
 ["eg-mansoura","eg",["Mansoura University","جامعة المنصورة"]],
 ["eg-zagazig","eg",["Zagazig University","جامعة الزقازيق"]],
 ["eg-benha","eg",["Benha University","جامعة بنها"]]
];
const flag={qa:"🇶🇦",eg:"🇪🇬",ae:"🇦🇪",sa:"🇸🇦"};
const map=new Map();
const norm=v=>String(v||"").toLowerCase().normalize("NFKC").replace(/[\u064b-\u065f\u0670]/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/\s+/g," ").trim();
registry.forEach(([id,country,names])=>names.forEach(name=>map.set(country+":"+norm(name),{id,country,names})));
function find(name,country){
 const k=norm(name);
 if(!k)return null;
 if(country&&map.has(country+":"+k))return map.get(country+":"+k);
 for(const c of ["qa","ae","eg"])if(map.has(c+":"+k))return map.get(c+":"+k);
 return null;
}
function url(name,country){
 const item=find(name,country),base=root.LEX_CONFIG?.supabaseUrl;
 if(!item||typeof base!=="string"||!/^https:\/\/[-a-z0-9.]+\.supabase\.co\/?$/i.test(base))return "";
 return base.replace(/\/$/,"")+"/functions/v1/university-brand?id="+encodeURIComponent(item.id)+"&rev=crest-20261030";
}
function initials(value){
 const item=find(value),v=item?.id;
 if(v){
  const known={"qa-qu":"QU","qa-lusail":"LU","qa-hbku":"HBKU","qa-udst":"UDST","qa-doha":"DI",
  "ae-ajman":"AU","ae-sharjah":"UOS","ae-uaeu":"UAEU","ae-adu":"ADU","ae-zayed":"ZU","ae-alain":"AAU","ae-dubai":"UD","ae-city":"CUA","ae-alwasl":"AWU","ae-alqasimia":"AQU",
  "eg-tanta":"TU","eg-ainshams":"ASU","eg-cairo":"CU","eg-mansoura":"MU","eg-zagazig":"ZU","eg-benha":"BU"};
  return known[v]||"UNI";
 }
 const words=String(value||"").trim().split(/\s+/).filter(Boolean);
 return words.length>1?words.slice(0,2).map(x=>x[0]).join("").toUpperCase():words[0]?.slice(0,2).toUpperCase()||"UNI";
}
root.LEX_UNIVERSITY_BRANDS={find,url,initials,flag,registry:registry.map(([id,country,names])=>({id,country,names:[...names]}))};
if(typeof module!=="undefined"&&module.exports)module.exports=root.LEX_UNIVERSITY_BRANDS;
})(typeof window!=="undefined"?window:globalThis);
