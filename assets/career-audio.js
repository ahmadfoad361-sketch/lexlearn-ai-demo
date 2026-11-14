(function(root){"use strict";
let card=null,stream=null,recorder=null,blob=null,objectUrl="",timer=0,started=0,duration=0,key="",recognition=null;
const en=()=>card?.lang==="en",t=(ar,eng)=>en()?eng:ar;
function stopTracks(){try{recognition?.stop();}catch{}recognition=null;if(stream)stream.getTracks().forEach(x=>x.stop());stream=null;clearTimeout(timer);}
function release(){try{if(recorder?.state==="recording")recorder.stop();}catch{}stopTracks();if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl="";blob=null;card?.remove();card=null;}
root.addEventListener("pagehide",release);
async function mount(node,o){
const next=o.uid+":"+o.n+":"+o.choice;if(key===next&&card?.isConnected)return;release();key=next;
card=document.createElement("section");card.className="lexExtensionCard";card.lang=o.lang;node.insertAdjacentElement("afterend",card);
card.innerHTML="<h2>"+t("التسجيل الصوتي للإشراف","Audio for administration")+"</h2><p>"+t("إرسال التسجيل للإشراف اختياري ومستقل عن التصحيح والدرجات.","Sending audio to administration is optional and separate from grading.")+"</p><label><input type=checkbox data-transcribe> "+t("أوافق اختياريًا على تحويل صوتي إلى نص عبر خدمة المتصفح أيضًا.","Optionally, I agree to also transcribe my audio using the browser service.")+"</label><p><button data-start>"+t("بدء التسجيل","Start recording")+"</button> <button data-stop disabled>"+t("إيقاف","Stop")+"</button> <button data-upload disabled>"+t("إرسال الصوت للإشراف","Send audio to administration")+"</button></p><audio data-preview controls hidden></audio><p data-status role='status'></p><small>"+t("حتى 3 دقائق و4 ميجابايت.","Up to 3 minutes and 4 MB.")+"</small>";
const current=card,status=card.querySelector("[data-status]"),start=card.querySelector("[data-start]"),stop=card.querySelector("[data-stop]"),upload=card.querySelector("[data-upload]");
try{const r=await root.LEX_CLOUD.db().functions.invoke("lexlearn-career-audio",{body:{action:"status",milestone:o.n}});if(r.data?.saved){current.innerHTML="<p>"+t("التسجيل محفوظ ومتاح لإدارة LexLearn فقط.","Audio is saved and available only to LexLearn administration.")+"</p>";return;}}catch{}
start.onclick=async()=>{
if(!navigator.mediaDevices?.getUserMedia||!root.MediaRecorder){status.textContent=t("التسجيل غير مدعوم هنا. الكتابة متاحة.","Recording is unavailable here; typing remains available.");return;}
try{stopTracks();blob=null;if(objectUrl)URL.revokeObjectURL(objectUrl);start.disabled=true;node.querySelectorAll("[data-lex-role],#lexCareerParty,#lexCareerSave").forEach(x=>x.disabled=true);
const acquired=await navigator.mediaDevices.getUserMedia({audio:true,video:false});if(!current.isConnected||card!==current){acquired.getTracks().forEach(x=>x.stop());return;}stream=acquired;
const mime=["audio/webm","audio/mp4","audio/ogg"].find(x=>MediaRecorder.isTypeSupported(x));if(!mime)throw Error("unsupported");
const chunks=[];let bytes=0,tooLarge=false;recorder=new MediaRecorder(stream,{mimeType:mime});started=Date.now();
recorder.ondataavailable=e=>{bytes+=e.data.size;if(bytes>4194304){tooLarge=true;if(recorder.state==="recording")recorder.stop();}else if(e.data.size)chunks.push(e.data);};
recorder.onstop=()=>{if(card!==current)return;stopTracks();node.querySelectorAll("[data-lex-role],#lexCareerParty,#lexCareerSave").forEach(x=>x.disabled=false);duration=Math.max(1,Math.min(180,Math.round((Date.now()-started)/1000)));start.disabled=false;stop.disabled=true;
if(tooLarge){status.textContent=t("التسجيل كبير؛ جرّب تسجيلًا أقصر.","Recording is too large. Try a shorter recording.");return;}
blob=new Blob(chunks,{type:mime});if(!blob.size){blob=null;upload.disabled=true;status.textContent=t("لم يُلتقط صوت. سجّل مدة أطول ثم أوقف التسجيل.","No audio was captured. Record a little longer, then stop.");return;}objectUrl=URL.createObjectURL(blob);const a=current.querySelector("[data-preview]");a.src=objectUrl;a.hidden=false;upload.disabled=false;status.textContent=t("راجع التسجيل ثم أرسله للإشراف.","Review the recording, then send it to administration.");};
recorder.onerror=()=>{stopTracks();node.querySelectorAll("[data-lex-role],#lexCareerParty,#lexCareerSave").forEach(x=>x.disabled=false);start.disabled=false;stop.disabled=true;status.textContent=t("تعذر التسجيل. يمكنك إعادة المحاولة.","Recording failed. You can try again.");};
if(current.querySelector("[data-transcribe]").checked){const Speech=root.SpeechRecognition||root.webkitSpeechRecognition;if(Speech){recognition=new Speech();recognition.lang=o.lang==="en"?"en-US":"ar-QA";recognition.continuous=true;recognition.interimResults=false;recognition.onresult=e=>{if(card!==current)return;const area=node.querySelector("#lexCareerAnswer");if(area){area.value=(area.value+" "+Array.from(e.results).slice(e.resultIndex).filter(x=>x.isFinal).map(x=>x[0].transcript).join(" ")).trim();area.dataset.speechTranscribed="true";}};recognition.onerror=()=>{};try{recognition.start();}catch{recognition=null;}}}
recorder.start(500);stop.disabled=false;upload.disabled=true;status.textContent=t("جارٍ التسجيل…","Recording…");timer=setTimeout(()=>{if(recorder.state==="recording")recorder.stop();},180000);
}catch{stopTracks();node.querySelectorAll("[data-lex-role],#lexCareerParty,#lexCareerSave").forEach(x=>x.disabled=false);start.disabled=false;status.textContent=t("تعذر تشغيل الميكروفون؛ يمكنك استخدام الكتابة.","Microphone access failed; typing remains available.");}};
stop.onclick=()=>{if(recorder?.state==="recording")recorder.stop();};
upload.onclick=async()=>{if(!blob)return;upload.disabled=true;
const data=new FormData();data.append("audio",blob,"recording");data.append("milestone",String(o.n));data.append("duration",String(duration));data.append("consent","career-voice-v1");data.append("role_choice",o.role);data.append("side",o.side);data.append("scenario_version",o.version);
try{
const db=root.LEX_CLOUD.db();
if(o.sourceItemId){
 const existing=await db.from("lex_career_trials").select("role_choice").eq("student_id",o.uid).eq("course_id","qa-qu-lawc101-rights").eq("milestone_session",o.n).maybeSingle();
 if(existing.error)throw Error("trial_lookup_failed");
 if(!existing.data){
  const area=node.querySelector("#lexCareerAnswer"),text=(area?.value||"").trim();
  const marker=t("إجابة صوتية مرفقة للإشراف فقط.","Audio response attached for administration only.");
  const trial=await db.from("lex_career_trials").insert({student_id:o.uid,course_id:"qa-qu-lawc101-rights",milestone_session:o.n,source_item_id:o.sourceItemId,role_choice:o.role,representation_side:o.side,scenario_version:o.version,answer_text:text.length>=20?text:marker+(text?"\\n"+text:""),input_mode:area?.dataset?.speechTranscribed?"speech_transcript":"typed"});
  if(trial.error&&trial.error.code!=="23505")throw Error("trial_save_failed");
 }
}
const r=await db.functions.invoke("lexlearn-career-audio",{body:data});if(r.error||!r.data?.ok)throw Error(r.data?.error||"upload_failed");
if(objectUrl)URL.revokeObjectURL(objectUrl);blob=null;current.innerHTML="<p role='status'>"+t("تم حفظ الصوت لإدارة LexLearn فقط.","Audio saved for LexLearn administration only.")+"</p>";
}catch{upload.disabled=false;status.textContent=t("لم يتأكد حفظ الصوت. أعد المحاولة؛ يبقى التسجيل هنا ما دمت في الصفحة.","Audio saving is unconfirmed. Retry; the recording remains available while this page stays open.");}};
}
root.LEX_CAREER_AUDIO={mount};
})(window);
