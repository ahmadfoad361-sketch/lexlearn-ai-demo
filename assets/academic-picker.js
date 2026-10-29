/* Shared academic fields. Selected names keep their stored identity for roster matching. */
(function(root){
"use strict";
// Seed names checked against the education authorities' university directories, 29 Oct 2026.
// Additional institutions can always be entered; this is a suggestion list, not an eligibility list.
var catalog={
 qa:[["Qatar University","جامعة قطر"],["Lusail University","جامعة لوسيل"],["Hamad Bin Khalifa University","جامعة حمد بن خليفة"],["University of Doha for Science and Technology","جامعة الدوحة للعلوم والتكنولوجيا"],["Doha Institute for Graduate Studies","معهد الدوحة للدراسات العليا"]],
 eg:[["جامعة طنطا","Tanta University"],["جامعة القاهرة","Cairo University"],["جامعة عين شمس","Ain Shams University"],["جامعة الإسكندرية","Alexandria University"],["جامعة المنصورة","Mansoura University"],["جامعة الزقازيق","Zagazig University"],["جامعة أسيوط","Assiut University"],["جامعة بنها","Benha University"],["جامعة المنوفية","Menoufia University"],["جامعة كفر الشيخ","Kafrelsheikh University"],["جامعة قناة السويس","Suez Canal University"],["جامعة دمنهور","Damanhour University"]],
 sa:[["جامعة الملك سعود","King Saud University"],["جامعة الملك عبدالعزيز","King Abdulaziz University"],["جامعة طيبة","Taibah University"],["جامعة أم القرى","Umm Al-Qura University"],["الجامعة الإسلامية","Islamic University of Madinah"],["جامعة الإمام محمد بن سعود الإسلامية","Imam Mohammad Ibn Saud Islamic University"],["جامعة الملك فيصل","King Faisal University"],["جامعة القصيم","Qassim University"],["جامعة جدة","University of Jeddah"]],
 ae:[["جامعة عجمان","Ajman University"],["جامعة الشارقة","University of Sharjah"],["جامعة الإمارات العربية المتحدة","United Arab Emirates University"],["جامعة أبوظبي","Abu Dhabi University"],["جامعة العين","Al Ain University"],["جامعة دبي","University of Dubai"],["جامعة زايد","Zayed University"],["جامعة أم القيوين","Umm Al Quwain University"],["جامعة المدينة عجمان","City University Ajman"],["جامعة الوصل","Al Wasl University"],["جامعة القاسمية","Al Qasimia University"]]
};
var recorded=[],serial=0;
function key(s){return String(s||"").toLowerCase().normalize("NFKC").replace(/[\u064b-\u065f\u0670]/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/\s+/g," ").trim();}
function remember(rows){(rows||[]).forEach(function(r){var country=r.country_code||r.country,university=r.university||r.institution;if(country&&university&&!recorded.some(function(x){return x.country===country&&key(x.value)===key(university);}))recorded.push({country:country,value:String(university)});});}
function options(country,query){
 var rows=(catalog[country]||[]).map(function(pair){
  var stored=recorded.find(function(x){return x.country===country&&pair.some(function(v){return key(v)===key(x.value);});});
  return {value:stored?stored.value:pair[0],names:pair};
 });
 recorded.filter(function(x){return x.country===country;}).forEach(function(x){if(!rows.some(function(r){return key(r.value)===key(x.value);}))rows.push({value:x.value,names:[x.value]});});
 var q=key(query);return rows.filter(function(r){return !q||r.names.concat(r.value).some(function(n){return key(n).includes(q);});});
}
function mount(form){
 if(!form||form.dataset.academicPicker)return;
 var country=form.querySelector('[name="country_code"],#country,#cohortCountry');
 var uni=form.querySelector('[name="university"],#university,#uni,#cohortUniversity');
 var faculty=form.querySelector('[name="faculty"],#faculty,#cohortFaculty');
 if(!country||!uni||!faculty)return;
 var labels=[country,uni,faculty].map(function(e){return e.closest('label');});
 if(labels.some(function(e){return !e;})||!labels.every(function(e){return e.parentElement===labels[0].parentElement;}))return;
 form.dataset.academicPicker="1";
 var parent=labels[0].parentElement;labels.slice().reverse().forEach(function(label){parent.prepend(label);});
 var en=document.documentElement.lang==="en",help=document.createElement('small');
 help.className="academicPickerHelp";help.textContent=en?'Choose the country, then type to find a university. You may enter an unlisted university.':'اختر الدولة ثم اكتب أول جزء من اسم الجامعة. يمكنك كتابة جامعة غير موجودة.';
 labels[1].appendChild(help);
 uni.removeAttribute('list');uni.autocomplete='off';uni.placeholder=en?'Type a university name':'اكتب للبحث عن الجامعة';
 var box=document.createElement('div'),list=document.createElement('div');
 box.className='academicCombo';uni.parentNode.insertBefore(box,uni);box.appendChild(uni);document.body.appendChild(list);list._academicOwner=uni;
 list.className='academicOptions';list.id='academicOptions'+(++serial);list.setAttribute('role','listbox');list.setAttribute('aria-label',en?'Universities':'الجامعات');list.hidden=true;
 uni.setAttribute('role','combobox');uni.setAttribute('aria-autocomplete','list');uni.setAttribute('aria-expanded','false');uni.setAttribute('aria-controls',list.id);
 var current=[],active=-1;
 function close(){list.hidden=true;uni.setAttribute('aria-expanded','false');uni.removeAttribute('aria-activedescendant');active=-1;}
 function choose(index){if(!current[index])return;uni.value=current[index].value;close();uni.dispatchEvent(new Event('change',{bubbles:true}));}
 function place(){
  if(list.hidden)return;
  var rect=uni.getBoundingClientRect(),spaceBelow=window.innerHeight-rect.bottom-12;
  list.style.left=rect.left+'px';list.style.width=rect.width+'px';
  list.style.maxHeight=Math.max(100,Math.min(260,spaceBelow>160?spaceBelow:rect.top-12))+'px';
  list.style.top=(spaceBelow>160?rect.bottom+4:Math.max(8,rect.top-list.offsetHeight-4))+'px';
 }
 function draw(query){
  document.querySelectorAll('.academicOptions').forEach(function(other){if(other!==list&&other._close)other._close();});
  current=options(country.value,query);active=-1;list.replaceChildren();uni.removeAttribute('aria-activedescendant');
  current.forEach(function(row,i){var item=document.createElement('div');item.id=list.id+'-'+i;item.setAttribute('role','option');item.setAttribute('aria-selected','false');item.textContent=row.names.join(' — ');item.addEventListener('mousedown',function(e){e.preventDefault();});item.addEventListener('click',function(){choose(i);});list.appendChild(item);});
  if(!current.length){var empty=document.createElement('p');empty.textContent=en?'No match — you can keep the university name you typed.':'لا توجد نتيجة؛ يمكنك استخدام اسم الجامعة الذي كتبته.';list.appendChild(empty);}
  list.hidden=false;uni.setAttribute('aria-expanded','true');
  place();
 }
 uni.addEventListener('focus',function(){draw('');});uni.addEventListener('input',function(){draw(uni.value);});uni.addEventListener('blur',close);
 uni.addEventListener('keydown',function(e){
  if(e.key==='Escape'){e.preventDefault();close();return;}
  if(e.key==='Enter'&&!list.hidden&&(active>=0||current.length===1)){e.preventDefault();choose(active>=0?active:0);return;}
  if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;e.preventDefault();if(list.hidden)draw(uni.value);
  if(!current.length)return;active=active<0?(e.key==='ArrowDown'?0:current.length-1):(active+(e.key==='ArrowDown'?1:-1)+current.length)%current.length;
  Array.from(list.children).forEach(function(item,i){item.setAttribute('aria-selected',String(i===active));});
  uni.setAttribute('aria-activedescendant',list.children[active].id);list.children[active].scrollIntoView({block:'nearest'});
 });
 country.addEventListener('change',function(){uni.value='';faculty.value='';close();uni.dispatchEvent(new Event('change',{bubbles:true}));});
 list._close=close;list._place=place;form.addEventListener('reset',close);
}
function mountAll(scope){document.querySelectorAll('.academicOptions').forEach(function(list){if(!list._academicOwner.isConnected)list.remove();});(scope||document).querySelectorAll('form').forEach(mount);}
root.LEX_ACADEMIC_PICKER={mount:mount,mountAll:mountAll,remember:remember,options:options};
if(typeof module!=='undefined'&&module.exports)module.exports={options:options,key:key,remember:remember};
if(typeof document!=='undefined'){
 function positionLists(e){if(e&&e.target&&e.target.closest&&e.target.closest('.academicOptions'))return;document.querySelectorAll('.academicOptions').forEach(function(list){if(list._place)list._place();});}
 document.addEventListener('scroll',positionLists,true);window.addEventListener('resize',positionLists);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){mountAll();});else mountAll();
}
})(typeof window!=='undefined'?window:globalThis);
