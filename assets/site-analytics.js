/* First-party, bounded activity measurement. No query strings, answers or contact data. */
(function(){
"use strict";
if(window.__lexActivityLoaded)return;window.__lexActivityLoaded=true;
if(navigator.webdriver||navigator.doNotTrack==="1"||window.doNotTrack==="1"||navigator.globalPrivacyControl)return;
var cfg=window.LEX_CONFIG||{};
if(!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.crypto||!crypto.randomUUID)return;
var page=location.pathname.split('/').pop()||"index.html";
if(!/^[a-z0-9-]+\.html$/.test(page)||/^(admin|instructor|reset-password)/.test(page))return;
async function record(){
 try{
  var now=Date.now(),visitor=JSON.parse(localStorage.getItem("lex_activity_visitor")||"null"),session=JSON.parse(localStorage.getItem("lex_activity_session")||"null");
  if(!visitor||!visitor.id||now-visitor.created>90*86400000){visitor={id:crypto.randomUUID(),created:now};session=null;localStorage.setItem("lex_activity_visitor",JSON.stringify(visitor));}
  if(!session||!session.id||now-session.last>30*60000)session={id:crypto.randomUUID()};
  session.last=now;localStorage.setItem("lex_activity_session",JSON.stringify(session));
  var headers={"Content-Type":"application/json",apikey:cfg.supabaseAnonKey};
  if(window.LEX_CLOUD&&LEX_CLOUD.isConfigured()){
   var current=await LEX_CLOUD.db().auth.getSession();
   if(current.data?.session?.access_token)headers.Authorization="Bearer "+current.data.session.access_token;
  }
  var payload={event_id:crypto.randomUUID(),visitor_id:visitor.id,session_id:session.id,page:page};
  await fetch(cfg.supabaseUrl+"/functions/v1/site-activity",{method:"POST",headers:headers,body:JSON.stringify(payload),keepalive:true,credentials:"omit",referrerPolicy:"no-referrer"});
 }catch(_){/* Storage restrictions or measurement failures must never block learning. */}
}
function visible(){if(document.visibilityState!=="hidden"){document.removeEventListener("visibilitychange",visible);record();}}
visible();if(document.visibilityState==="hidden")document.addEventListener("visibilitychange",visible);
window.addEventListener("pageshow",function(e){if(e.persisted)record();});
})();
