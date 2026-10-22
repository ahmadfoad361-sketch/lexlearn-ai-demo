(async function(){
"use strict";
const URL="https://emxiuwcuxyljfynnzpnh.supabase.co";
const KEY="sb_publishable_AlUGXdTwlvIqpyKJbHGBlg_Qr-dAXef";
const statusEl=document.getElementById("status"),login=document.getElementById("login"),owner=document.getElementById("owner");
const form=document.getElementById("loginForm"),run=document.getElementById("runBtn");
const client=window.supabase.createClient(URL,KEY,{auth:{autoRefreshToken:true,persistSession:true,
 storageKey:"lexlearn-owner-grading-smoke-v1"}});
function say(x){statusEl.textContent=typeof x==="string"?x:JSON.stringify(x,null,2)}
function locked(yes){run.disabled=!!yes;}
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
async function showSession(){
 const {data:{session}}=await client.auth.getSession();
 if(!session){login.classList.remove("hidden");owner.classList.add("hidden");say("سجّل الدخول بحساب المالك لاختبار الاتصال.");return;}
 try{
  const state=await invoke("GET");
  if(!state||state.test_only!==true)throw Error("Could not verify owner access");
  login.classList.add("hidden");owner.classList.remove("hidden");
  const existing=state.results||[],used=existing.some(x=>x.case_id==="full_ar");
  locked(used);
  say(used?"الحالة full_ar سُجلت من قبل، ولن تُعاد. النتائج:\n"+JSON.stringify(existing,null,2):
   "تم التحقق من صلاحية المالك. الحالة full_ar جاهزة لاختبار واحد فقط.\n"+JSON.stringify(existing,null,2));
 }catch(e){
  owner.classList.add("hidden");login.classList.remove("hidden");say("لم تُقبل صلاحية المالك: "+(e.message||""));
 }
}
form.addEventListener("submit",async(ev)=>{
 ev.preventDefault();const btn=document.getElementById("loginBtn");btn.disabled=true;
 try{
  const email=document.getElementById("mail").value.trim(),pass=document.getElementById("password").value;
  // Credentials go straight to Supabase Auth and NEVER to the grading function.
  const {error}=await client.auth.signInWithPassword({email,password:pass});
  document.getElementById("password").value="";
  if(error)throw Error(error.message);
  await showSession();
 }catch(e){say("تعذّر تسجيل الدخول: "+e.message)}
 finally{btn.disabled=false;document.getElementById("password").value="";}
});
run.addEventListener("click",async()=>{
 if(!confirm("ستُرسل إجابة افتراضية واحدة للتصحيح عبر API، وقد يُخصم مبلغ صغير. هل تريد تنفيذ أول محاولة الآن؟"))return;
 locked(true);say("جاري إرسال حالة الاختبار مرة واحدة... لا تضغط مجددًا.");
 try{const data=await invoke("POST",{case_id:"full_ar"});say(data)}
 catch(e){say("نتيجة الطلب: "+e.message+"\nلا تكرر الطلب. استخدم زر عرض النتائج المسجّلة.")}
});
document.getElementById("refreshBtn").addEventListener("click",showSession);
document.getElementById("logoutBtn").addEventListener("click",async()=>{await client.auth.signOut();owner.classList.add("hidden");login.classList.remove("hidden");say("تم تسجيل الخروج.");});
await showSession();
})();