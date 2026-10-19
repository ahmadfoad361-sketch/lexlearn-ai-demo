/* Conference-only presentation. The learning programme and its scoring are unchanged. */
(()=>{'use strict';
const root=document.documentElement,first=document.getElementById('paths');if(!first)return;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const cards=Array.from(first.querySelectorAll('.path')),pause=document.getElementById('exhibitPause');
const modal=document.getElementById('visitorScene'),intro=document.getElementById('brandIntro'),video=document.getElementById('brandIntroVideo');
const audienceVideo=document.getElementById('audienceLogoVideo'),audienceStill=document.getElementById('audienceLogoStill');
const citations=window.LEXLEARN_CONFERENCE_CITATIONS||{investor:[],research:[]};
let paused=false,engaged=false,spot=-1,role='student',quoteIndex=0,introTimer;
const copy={
 en:{student:{label:'FOR THE STUDENT',title:'We understand how you think. We build your path.',cta:'Start the interactive experience',note:'An illustrative scene. The interactive experience opens with its original questions and evaluation.'},university:{label:'FOR UNIVERSITIES & LAW FACULTIES',title:'Assessing legal skills and developing them from the student’s strengths.',cta:'Explore the proposed pilot',note:'Illustrative law faculty lecture theatre. Academic collaboration remains proposed.'},investor:{label:'FOR INVESTORS & PARTNERS',title:'A programme to assess and develop law students’ skills.',cta:'Explore the vision & roadmap',note:'Illustrative scene. Product validation and the academic pilot remain proposed or in progress.'},skills:['Recall','Smart analysis','Practice','Understanding'],close:'Back to choices',pause:'Pause motion',resume:'Resume motion',source:'Read source',excerpt:'Source excerpt',translation:'Translated source excerpt'},
 ar:{student:{label:'للطالب',title:'نفهم طريقة تفكيرك، ونبني طريقك.',cta:'ابدأ التجربة التفاعلية',note:'مشهد توضيحي. تُفتح التجربة التفاعلية بأسئلتها وتقييمها الأصليين.'},university:{label:'للجامعات وكليات القانون',title:'تقييم المهارات القانونية وتطويرها من نقاط قوة الطالب',cta:'اكتشف التجربة الجامعية المقترحة',note:'مشهد توضيحي لمدرّج كلية قانون. التعاون الأكاديمي ما زال مقترحًا.'},investor:{label:'للمستثمرين والشركاء',title:'برنامج لتقييم مهارات طالب القانون وتطويرها',cta:'اكتشف الرؤية وخارطة الطريق',note:'مشهد توضيحي. التحقق من المنتج والتجربة الجامعية ما زالا مقترحين أو قيد التطوير.'},skills:['حفظ','تحليل ذكي','تدريب','فهم'],close:'العودة للاختيارات',pause:'إيقاف الحركة',resume:'تشغيل الحركة',source:'المصدر',excerpt:'مقتطف موثّق',translation:'ترجمة مقتطف موثّق'}
};
const assets={student:'assets/conference-media/student-law.webp',university:'assets/conference-media/law-lecture-v3.webp',investor:'assets/conference-media/investor-men-v3.webp'};
const lang=()=>root.lang==='ar'?'ar':'en';
const order=citations.investor.map((_,i)=>i);
for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
function item(bank){const list=citations[bank]||[];if(!list.length)return null;return bank==='investor'?list[order[quoteIndex%order.length]]:list[quoteIndex%list.length];}
function attribution(host,q){if(!host||!q)return;const ar=lang()==='ar',t=copy[lang()];host.replaceChildren();const author=document.createElement('span');author.textContent=(ar?q.authorAr:q.authorEn)+' · '+q.year+' · '+(ar?t.translation:t.excerpt);const link=document.createElement('a');link.href=q.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=t.source;host.appendChild(author);host.appendChild(link);}
function renderBanks(){document.querySelectorAll('[data-quote-bank]').forEach(host=>{const q=item(host.getAttribute('data-quote-bank'));if(!q)return;const quote=document.createElement('p');quote.className='visual-quote';quote.textContent='“'+q[lang()]+'”';const credit=document.createElement('div');credit.className='quote-attribution';attribution(credit,q);host.replaceChildren(quote,credit);});}
function demoURL(){return 'showcase'+(lang()==='ar'?'':'-en')+'.html?country=qa&subject=rights';}
function clearSpot(){cards.forEach(card=>card.classList.remove('is-spotlight'));}
function setJourney(host,words){host.replaceChildren(...words.map(word=>{const li=document.createElement('li');li.textContent=word;return li;}));}
function renderModal(){const t=copy[lang()],r=t[role];document.getElementById('visitorSceneImage').src=assets[role];document.getElementById('visitorSceneLabel').textContent=r.label;document.getElementById('visitorSceneTitle').textContent=r.title;document.getElementById('visitorSceneNote').textContent=r.note;setJourney(document.getElementById('visitorJourney'),t.skills);const cta=document.getElementById('visitorSceneCTA');cta.textContent=r.cta;cta.href=role==='student'?demoURL():role==='university'?'#pilot':'#vision';renderModalQuote();document.getElementById('visitorSceneClose').textContent=t.close;}
function renderModalQuote(){const quote=document.getElementById('visitorSceneQuote'),credit=document.getElementById('visitorQuoteCredit');const bank=role==='investor'?'investor':role==='university'?'research':null;const q=bank?item(bank):null;quote.hidden=credit.hidden=!q;if(q){quote.textContent='“'+q[lang()]+'”';attribution(credit,q);}}
function translate(){const ar=lang()==='ar';document.querySelectorAll('[data-exhibit-en],[data-visual-en]').forEach(el=>{const prefix=el.hasAttribute('data-visual-en')?'data-visual-':'data-exhibit-';el.textContent=el.getAttribute(prefix+(ar?'ar':'en'));});pause.textContent=copy[lang()][paused?'resume':'pause'];document.querySelectorAll('.visual-demo-link').forEach(a=>a.href=demoURL());renderBanks();if(modal.open)renderModal();}
function tick(){if(document.hidden||paused||reduced.matches||intro.open)return;if(!engaged&&first.getBoundingClientRect().bottom>100){clearSpot();spot=(spot+1)%cards.length;cards[spot].classList.add('is-spotlight');}quoteIndex++;renderBanks();if(modal.open)renderModalQuote();}
function stopAudienceLogo(){audienceVideo.pause();audienceVideo.hidden=true;audienceStill.hidden=false;}
function playAudienceLogo(){stopAudienceLogo();if(paused||reduced.matches)return;audienceVideo.currentTime=0;audienceVideo.hidden=false;audienceStill.hidden=true;try{const p=audienceVideo.play();if(p&&p.catch)p.catch(stopAudienceLogo);}catch(_){stopAudienceLogo();}}
['ended','error'].forEach(e=>audienceVideo.addEventListener(e,stopAudienceLogo));
modal.addEventListener('close',stopAudienceLogo);
pause.addEventListener('click',()=>{paused=!paused;root.classList.toggle('visual-motion-paused',paused);pause.setAttribute('aria-pressed',String(paused));clearSpot();if(paused)stopAudienceLogo();translate();});
cards.forEach((card,i)=>{card.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button>0||typeof modal.showModal!=='function')return;event.preventDefault();event.stopImmediatePropagation();engaged=true;clearSpot();cards.forEach(c=>c.classList.remove('is-selected'));card.classList.add('is-selected');role=['student','university','investor'][i];renderModal();modal.showModal();playAudienceLogo();},true);});
document.getElementById('visitorSceneClose').addEventListener('click',()=>modal.close());
document.getElementById('visitorSceneCTA').addEventListener('click',event=>{if(role==='student')return;event.preventDefault();const target=document.getElementById(role==='university'?'pilot':'vision');modal.close();target.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});});
modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();}});
first.querySelector('.paths').addEventListener('pointerdown',()=>{engaged=true;clearSpot();},{passive:true});
first.querySelector('.paths').addEventListener('focusin',()=>{engaged=true;clearSpot();});
function markIntroSeen(){try{sessionStorage.setItem('lexlearn_conference_intro_v3','seen');}catch(_){}}
function closeIntro(){clearTimeout(introTimer);video.pause();if(intro.open)intro.close();markIntroSeen();}
function playIntro(){if(typeof intro.showModal!=='function'||reduced.matches||paused)return;try{intro.showModal();video.currentTime=0;video.muted=true;const p=video.play();if(p&&typeof p.catch==='function')p.catch(closeIntro);introTimer=setTimeout(closeIntro,6500);}catch(_){closeIntro();}}
video.addEventListener('ended',closeIntro);video.addEventListener('error',closeIntro);document.getElementById('introSkip').addEventListener('click',closeIntro);intro.addEventListener('cancel',()=>{clearTimeout(introTimer);video.pause();markIntroSeen();});
document.getElementById('replayIntro').addEventListener('click',playIntro);
new MutationObserver(translate).observe(root,{attributes:true,attributeFilter:['lang']});translate();
window.addEventListener('DOMContentLoaded',()=>{let seen=false;try{seen=sessionStorage.getItem('lexlearn_conference_intro_v3')==='seen';}catch(_){}if(!location.hash&&(!seen||new URLSearchParams(location.search).get('intro')==='1'))playIntro();});
setInterval(tick,9000);
window.addEventListener('pagehide',()=>{clearTimeout(introTimer);video.pause();stopAudienceLogo();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(intro.open)closeIntro();stopAudienceLogo();}});
})();
