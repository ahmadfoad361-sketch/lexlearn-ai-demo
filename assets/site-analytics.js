/* LexLearn first-party, privacy-respecting page visibility and use-time estimates.
   No answers, full URLs, keystrokes, emails or IP addresses are submitted. */
(function(){
"use strict";
if(window.__lexActivityLoaded)return;window.__lexActivityLoaded=true;
if(navigator.webdriver||navigator.doNotTrack==="1"||window.doNotTrack==="1"||navigator.globalPrivacyControl)return;
var cfg=window.LEX_CONFIG||{};
if(!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.crypto||!crypto.randomUUID)return;
var page=location.pathname.split("/").pop()||"index.html";
if(!/^[a-z0-9-]+\.html$/.test(page)||/^(admin|reset-password)/.test(page)||page==="instructor-login.html")return;
var IDLE_MS=5*60*1000,HEARTBEAT_MS=30*1000,MIN_GAP_MS=20*1000;
var lastInteraction=Date.now(),lastSample=0,inFlight=false;
function markActivity(){
 var idle=Date.now()-lastInteraction>IDLE_MS;
 lastInteraction=Date.now();
 if(idle&&document.visibilityState==="visible")record();
}
async function record(ending){
 var now=Date.now();
 if(inFlight||now-lastSample<MIN_GAP_MS||(!ending&&document.visibilityState!=="visible")||now-lastInteraction>IDLE_MS)return;
 lastSample=now;inFlight=true;
 try{
  var visitor=JSON.parse(localStorage.getItem("lex_activity_visitor")||"null");
  var session=JSON.parse(localStorage.getItem("lex_activity_session")||"null");
  if(!visitor||!visitor.id||!visitor.created||now-visitor.created>90*86400000){
   visitor={id:crypto.randomUUID(),created:now};session=null;
   localStorage.setItem("lex_activity_visitor",JSON.stringify(visitor));
  }
  if(!session||!session.id||now-session.last>30*60000)session={id:crypto.randomUUID()};
  session.last=now;localStorage.setItem("lex_activity_session",JSON.stringify(session));
  var headers={"Content-Type":"application/json",apikey:cfg.supabaseAnonKey};
  if(window.LEX_CLOUD&&window.LEX_CLOUD.isConfigured()){
   var current=await window.LEX_CLOUD.db().auth.getSession();
   if(current.data?.session?.access_token)headers.Authorization="Bearer "+current.data.session.access_token;
  }
  await fetch(cfg.supabaseUrl+"/functions/v1/site-activity",{
   method:"POST",headers:headers,
   body:JSON.stringify({event_id:crypto.randomUUID(),visitor_id:visitor.id,session_id:session.id,page:page}),
   keepalive:true,credentials:"omit",referrerPolicy:"no-referrer"
  });
 }catch(_){/* Measurement failures must not interrupt learning. */}
 finally{inFlight=false;}
}
record(false);
["pointerdown","keydown","touchstart","scroll"].forEach(function(type){
 document.addEventListener(type,markActivity,{passive:true});
});
document.addEventListener("visibilitychange",function(){
 if(document.visibilityState==="visible"){lastInteraction=Date.now();record(false);}
 else record(true);
});
window.addEventListener("pagehide",function(){record(true);});
window.addEventListener("pageshow",function(event){if(event.persisted){lastInteraction=Date.now();record(false);}});
setInterval(function(){if(document.visibilityState==="visible")record(false);},HEARTBEAT_MS);
})();
