(async function(){
"use strict";
const URL="https://emxiuwcuxyljfynnzpnh.supabase.co";
const KEY="sb_publishable_AlUGXdTwlvIqpyKJbHGBlg_Qr-dAXef";
const statusEl=document.getElementById("status"),login=document.getElementById("login"),owner=document.getElementById("owner");
const form=document.getElementById("loginForm"),numeric=document.getElementById("numericGrade");
const cases=[
 {id:"full_ar_v2",label:"التحقق من تصحيح الإجابة العربية الصحيحة المكتملة (إصدار جديد)",range:"85–100%"},
 {id:"paraphrase_en",label:"اختبار صياغة إنجليزية صحيحة دون مفاتيح التذكر",range:"70–75%"},
 {id:"reversed_ar",label:"اختبار إجابة عربية خاطئة قانونيًا",range:"0–25%"}
];
const client=window.supabase.createClient(URL,KEY,{auth:{autoRefreshToken:true,persistSession:true,
 storageKey:"lexlearn-owner-grading-smoke-v1"}});
let pending=false,used=new Set();
function say(x){statusEl.textContent=typeof x==="string"?x:JSON.stringify(x,null,2)}
function showGrade(data){
 const score=data&&data.provisional_score;
 if(typeof score!=="number"||!Number.isFinite(score)){numeric.classList.add("hidden");return;}
 numeric.classList.remove("hidden");
 document.getElementById("numericValue").textContent=String(score)+"%";
 const c=document.getElementById("numericBreakdown");c.textContent="";
 const parts=data.score_breakdown||{};
 const labels={rule_content:"استرجاع القاعدة القانونية",memory_cues:"مفاتيح التذكر",understanding:"الفهم",application:"التطبيق",exam_structure:"بناء الإجابة"};
 Object.keys(parts).forEach(k=>{
  const x=parts[k];if(typeof x?.percent!=="number")return;
  const p=document.createElement("p");
  p.textContent=(labels[k]||"معيار "+k)+": "+x.percent+"% ("+x.earned+" من "+x.total+" درجات معيارية)";
  c.appendChild(p);
 });
}
async function invoke(method,body){
 const r=await client.functions.invoke("lexlearn-grading-smoke",{method,...(body?{body}:{})});
 if(r.error){
  let details=r.error.message||"Unknown server error";
  if(r.error.context&&typeof r.error.context.json==="function"){
   try{details=JSON.stringify(await r.error.context.json())}catch(_){}
  }
  throw Error(details);
 }
 return r.data;
}
function renderButtons(){
 const box=document.getElementById("remainingCases");box.textContent="";
 cases.forEach(t=>{
  const b=document.createElement("button");
  b.type="button";
  b.disabled=pending||used.has(t.id);
  b.textContent=(used.has(t.id)?"تم استخدام الحالة: ":"تشغيل: ")+t.label+" ("+t.range+")";
  b.addEventListener("click",()=>runCase(t.id));
  box.appendChild(b);
 });
}
async function showSession(){
 const {data:{session}}=await client.auth.getSession();
 if(!session){login.classList.remove("hidden");owner.classList.add("hidden");say("سجّل الدخول بحساب المالك لاختبار الاتصال.");return;}
 try{
  const state=await invoke("GET");
  if(!state||state.test_only!==true)throw Error("Could not verify owner access");
  login.classList.add("hidden");owner.classList.remove("hidden");
  used=new Set((state.results||[]).map(x=>x.case_id));
  renderButtons();
  say("حالات الاختبار المحفوظة (لا يمكن تكرار خصمها):\n"+JSON.stringify(state.results||[],null,2));
 }catch(e){
  owner.classList.add("hidden");login.classList.remove("hidden");say("لم تُقبل صلاحية المالك: "+(e.message||""));
 }
}
async function runCase(case_id){
 if(pending||used.has(case_id))return;
 const task=cases.find(x=>x.id===case_id);if(!task)return;
 if(!window.confirm("تشغيل "+task.label+"؟ سيُستدعى OpenAI مرة واحدة، بتكلفة صغيرة، ولن يُسمح بإعادة نفس المحاولة."))return;
 pending=true;used.add(case_id);renderButtons();numeric.classList.add("hidden");
 say("جاري إرسال الإجابة الافتراضية للمصحح مرة واحدة... لا تكرر الإرسال.");
 try{
  const data=await invoke("POST",{case_id});
  showGrade(data);
  say(data);
 }catch(e){
  say("حدث خطأ أو انتهت المحاولة: "+e.message+"\nلا تكرر الطلب. اضغط «عرض النتائج المسجلة» للتحقق.");
 }finally{pending=false;renderButtons();}
}
form.addEventListener("submit",async(ev)=>{
 ev.preventDefault();const btn=document.getElementById("loginBtn");btn.disabled=true;
 try{
  const email=document.getElementById("mail").value.trim(),pass=document.getElementById("password").value;
  const {error}=await client.auth.signInWithPassword({email,password:pass});
  document.getElementById("password").value="";
  if(error)throw Error(error.message);
  await showSession();
 }catch(e){say("تعذّر تسجيل الدخول: "+e.message)}
 finally{btn.disabled=false;document.getElementById("password").value="";}
});
document.getElementById("refreshBtn").addEventListener("click",showSession);
document.getElementById("logoutBtn").addEventListener("click",async()=>{
 await client.auth.signOut();owner.classList.add("hidden");login.classList.remove("hidden");say("تم تسجيل الخروج.");
});
await showSession();
})();