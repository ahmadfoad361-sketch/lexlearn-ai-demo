/* Institution images in searchable suggestions, flags in native country selectors. */
(function(root){"use strict";
const brand=()=>root.LEX_UNIVERSITY_BRANDS;
const country=form=>form?.querySelector('[name="country_code"],#country,#cohortCountry');
const university=form=>form?.querySelector('[name="university"],#university,#uni,#cohortUniversity');
function icon(name,code){
 const src=brand()?.url(name,code);
 if(!src){const e=document.createElement("b");e.className="academicOptionBadge";e.textContent=brand()?.initials(name)||"UNI";return e;}
 const i=document.createElement("img");i.className="academicUniversityLogo";i.src=src;i.crossOrigin="anonymous";i.alt="";i.loading="lazy";
 i.onerror=()=>{if(i.isConnected){const b=document.createElement("b");b.className="academicOptionBadge "+i.className;b.textContent=brand()?.initials(name)||"UNI";i.replaceWith(b);}};
 return i;
}
function paint(){
 document.querySelectorAll(".academicOptions").forEach(list=>{
  const field=list._academicOwner,c=country(field?.closest("form"))?.value;
  if(!field)return;
  list.querySelectorAll('[role="option"]').forEach(option=>{
   if(option.dataset.logoDone)return;option.dataset.logoDone="1";
   const original=option.textContent.trim(),name=original.split(" — ")[0];
   const span=document.createElement("span");span.className="academicUniversityText";span.textContent=original;
   option.replaceChildren(icon(name,c),span);
  });
 });
 document.querySelectorAll("form").forEach(form=>{
  const c=country(form),u=university(form);
  if(c?.tagName==="SELECT"){
   for(const option of c.options){
    const flag=brand()?.flag[option.value];
    if(flag&&!option.dataset.flagDone){option.textContent=flag+" "+option.textContent;option.dataset.flagDone="1";}
   }
   let f=form.querySelector(".academicCountryMark");
   if(!f){f=document.createElement("span");f.className="academicCountryMark";c.closest("label")?.appendChild(f);}
   if(f&&f.dataset.country!==c.value){f.dataset.country=c.value;f.replaceChildren();if(brand()?.flag[c.value]){const img=document.createElement("img");img.src="assets/flags/"+c.value+".svg";img.alt="";f.append(img,document.createTextNode(c.options[c.selectedIndex]?.textContent||""));}}
   if(!c.dataset.flagListener){c.dataset.flagListener="1";c.addEventListener("change",paint);}
  }
  const combo=u?.closest(".academicCombo");
  if(combo){
   const update=()=>{combo.querySelector(".academicUniversityPreview")?.remove();if(!u.value.trim())return;const img=icon(u.value,c?.value);img.classList.add("academicUniversityPreview");combo.appendChild(img);};
   if(!u.dataset.previewListener){u.dataset.previewListener="1";u.addEventListener("change",update);u.addEventListener("input",update);}
   if(u.value.trim()&&!combo.querySelector(".academicUniversityPreview"))update();
  }
 });
 const chooser=document.getElementById("facultyCardUniversity");
 if(chooser){
  const update=()=>{chooser.parentElement?.querySelector(".academicFacultyLogo")?.remove();const name=chooser.selectedOptions[0]?.textContent.split(" — ")[0];if(!name)return;const img=icon(name);img.classList.add("academicFacultyLogo");chooser.insertAdjacentElement("afterend",img);};
  if(!chooser.dataset.logoListener){chooser.dataset.logoListener="1";chooser.addEventListener("change",update);update();}
 }
}
let queued=false;
function queue(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;paint();});}
function mount(){queue();new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length))queue();}).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})(window);
