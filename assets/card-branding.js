/* Consistent, neutral academic affiliation badge. University trademarks are never invented.
   Approved official logo assets can be supplied in LEX_UNIVERSITY_LOGOS (same-origin paths). */
(function(root){"use strict";
const aliases=[
 {key:"qu",pattern:/^(?:qatar university|جامعة قطر|جامعه قطر)$/i,short:"QU"},
 {key:"lusail",pattern:/^(?:lusail university|جامعة لوسيل|جامعه لوسيل|لوسيل)$/i,short:"LU"},
 {key:"ajman",pattern:/^(?:ajman university|جامعة عجمان|جامعه عجمان)$/i,short:"AU"},
 {key:"tanta",pattern:/^(?:tanta university|جامعة طنطا|جامعه طنطا)$/i,short:"TU"}
];
function entry(name){
 var raw=String(name||"").trim().replace(/\s+/g," ");
 return aliases.find(x=>x.pattern.test(raw))||null;
}
function initials(name){
 if(root.LEX_UNIVERSITY_BRANDS)return root.LEX_UNIVERSITY_BRANDS.initials(name);
 var item=entry(name);if(item)return item.short;
 var parts=String(name||"").trim().split(/\s+/).filter(Boolean).filter(x=>!["جامعة","جامعه","university","college","of"].includes(x.toLowerCase()));
 return parts.length>1?parts.slice(0,2).map(x=>x[0]).join("").toUpperCase():parts.length?parts[0].slice(0,2).toUpperCase():"UNI";
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function logo(name){
 const official=root.LEX_UNIVERSITY_BRANDS?.url(name);
 if(official)return official;
 const item=entry(name),urls=root.LEX_UNIVERSITY_LOGOS||{};
 const path=item&&urls[item.key];
 // Only institution-approved copies hosted in the LexLearn site are accepted.
 return typeof path==="string"&&/^assets\/university-logos\/[a-z0-9-]+\.(?:svg|png|webp)$/.test(path)?path:"";
}
function mark(name){
 const url=logo(name),fallback='<span class="cardUniversityInitials">'+esc(initials(name))+'</span>';
 return '<span class="cardUniversityMark'+(url?' cardUniversityMarkLogo':'')+'" aria-label="'+esc(name)+'">'+fallback+
 (url?'<img class="universityOfficialLogo" src="'+esc(url)+'" alt="" crossorigin="anonymous" loading="eager" decoding="async">':'')+'</span>';
}
if(root.document){
 root.document.addEventListener("error",event=>{
  const element=event.target;
  if(element?.classList?.contains("universityOfficialLogo"))element.remove();
 },true);
}
function wordmark(){
 return '<span class="cardWordmark" dir="ltr" lang="en"><span class="cardWordLex">Lex</span><span class="cardWordLearn">Learn</span></span>';
}
function brandHeader(roleLabel){
 return '<div class="cardTop"><div class="cardBrandLine"><img class="cardLogoX" src="assets/lexlearn-x-transparent.svg" alt="" />'+wordmark()+'</div><small>'+esc(roleLabel)+'</small></div>';
}
function universityBlock(name,faculty){
 if(!name&&!faculty)return "";
 // University identity is communicated by its crest alone. The text
 // remains available to screen readers and in the QR/profile, not duplicated
 // alongside the emblem on the card.
 return (name?'<div class="cardAffiliation cardAffiliationCrestOnly">'+mark(name)+'</div>':'')+
 (faculty?'<p class="cardFacultyStandalone">'+esc(faculty)+'</p>':'');
}
function nameClass(value){
 const length=String(value||"").length;
 return length>48?"cardName cardNameXL":length>29?"cardName cardNameLong":"cardName";
}
root.LEX_CARD_BRAND={entry:entry,initials:initials,logo:logo,mark:mark,wordmark:wordmark,brandHeader:brandHeader,universityBlock:universityBlock,nameClass:nameClass};
})(window);
