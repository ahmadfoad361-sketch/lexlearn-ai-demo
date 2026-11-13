(async function(){"use strict";
const status=document.getElementById("voiceStatus"),list=document.getElementById("voiceReviews"),db=window.LEX_CLOUD?.db();
async function call(b){const r=await db.functions.invoke("lexlearn-career-audio",{body:b});if(r.error||!r.data)throw Error("unavailable");return r.data;}
try{
if(!db)throw Error("login");async function load(cursor){const r=await call({action:"list",cursor});if(!Array.isArray(r.items))throw Error("forbidden");
status.textContent=r.items.length||list.childElementCount?"":"لا توجد تسجيلات محفوظة حتى الآن.";
for(const row of r.items){const trial=row.lex_career_trials||{},person=row.profiles||{},card=document.createElement("section");card.className="lexExtensionCard";
const title=document.createElement("h2");title.textContent=(person.display_name||person.username||"طالب")+" — الجلسة "+trial.milestone_session;card.append(title);const law=document.createElement("p");law.style.fontWeight="700";law.textContent="القانون المدني القطري رقم 22 لسنة 2004 — "+({2:"المادة 41",4:"المادة 44",6:"المادتان 45 و46"}[trial.milestone_session]||"")+" — "+({judge:"قاضٍ",lawyer:"محامٍ",professor:"أستاذ جامعي"}[trial.role_choice]||"");card.append(law);
const scenario=document.createElement("p");scenario.style.whiteSpace="pre-wrap";scenario.textContent=trial.scenario_version==="career-roles-v2"?window.LEX_CAREER_CASES.get(trial.milestone_session,trial.role_choice,trial.representation_side,"ar"):"محاولة من النسخة السابقة؛ تُراجع وفق واقعتها الأصلية.";card.append(scenario);
const label=document.createElement("h3");label.textContent="نص الطالب";card.append(label);const answer=document.createElement("p");answer.style.whiteSpace="pre-wrap";answer.textContent=trial.answer_text||"";card.append(answer);
const play=document.createElement("button");play.textContent="الاستماع إلى التسجيل";const player=document.createElement("audio");player.controls=true;player.setAttribute("controlslist","nodownload");player.style.display="block";player.style.width="100%";
play.onclick=async()=>{play.disabled=true;try{const v=await call({action:"play",id:row.id});if(!v.url)throw Error("play");player.src=v.url;await player.play();}catch{status.textContent="تعذر تشغيل التسجيل. اضغط مجددًا لتجديد رابط الاستماع.";}finally{play.disabled=false;}};if(row.status!=="ready")play.disabled=true;card.append(play,player);
const note=document.createElement("textarea");note.maxLength=2000;note.value=row.review_note||"";note.placeholder="تقييم وضوح الصوت وترتيب الأفكار والإلقاء، وملاحظاتك للمتابعة. لا يغيّر الدرجات الحالية.";note.setAttribute("aria-label","تقييم الأداء الشفهي");card.append(note);
const save=document.createElement("button");save.textContent="حفظ تقييم المشرف";save.onclick=async()=>{save.disabled=true;try{const x=await call({action:"review",id:row.id,note:note.value});if(!x.ok)throw Error("save");status.textContent="حُفظ تقييم الأداء الشفهي.";}catch{status.textContent="لم يتأكد حفظ التقييم. أعد المحاولة.";}finally{save.disabled=false;}};card.append(save);const remove=document.createElement("button");remove.textContent="حذف التسجيل";remove.onclick=async()=>{if(!confirm("حذف التسجيل وتقييمه نهائيًا؟ يبقى نص المحاولة ودرجات الطالب كما هما."))return;remove.disabled=true;try{const x=await call({action:"delete",id:row.id,confirm:true});if(!x.ok)throw Error("delete");player.pause();player.removeAttribute("src");card.remove();status.textContent="حُذف التسجيل.";}catch{remove.disabled=false;status.textContent="لم يتأكد الحذف. أعد المحاولة.";}};card.append(remove);list.append(card);
}
if(r.next_cursor){const more=document.createElement("button");more.textContent="عرض المزيد";more.onclick=async()=>{more.disabled=true;try{await load(r.next_cursor);more.remove();}catch{more.disabled=false;status.textContent="تعذر تحميل المزيد. أعد المحاولة.";}};list.append(more);}
}
await load(null);
}catch{status.textContent="هذه الصفحة لإدارة LexLearn فقط. سجّل الدخول بحساب المشرف الإداري.";list.replaceChildren();}
})();
