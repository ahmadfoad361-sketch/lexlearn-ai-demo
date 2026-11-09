/* LexLearn: read-only, server-authoritative access to personal study glossary.
 * Never use localStorage/cached grades to decide if an active examination is unfinished.
 * A session is active from server trainingOpen until completed_at is persisted.
 */
(function(root){
"use strict";
const COURSE="qa-qu-lawc101-rights";
let latestAllowed=false;
async function check(cloud){
 latestAllowed=false;
 const api=cloud||root.LEX_CLOUD;
 if(!api||!api.db||!api.requireStudent)throw Error("glossary_access_unavailable");
 await api.requireStudent();
 const db=api.db();
 if(!db||!db.rpc)throw Error("glossary_access_unavailable");
 const result=await db.rpc("lex_glossary_access_allowed",{p_course_id:COURSE});
 if(result.error||typeof result.data!=="boolean")throw Error("glossary_access_unavailable");
 latestAllowed=result.data;
 return latestAllowed;
}
function notice(language){
 return language==="en"?"Your legal dictionary becomes available when this session is completed.":
  "يتفعّل دخول القاموس بعد انتهاء الجلسة.";
}
function linkHtml(allowed,language){
 if(allowed!==true)return "<span class='lexGlossaryLocked' aria-disabled='true' role='status'>🔒 "+notice(language)+"</span>";
 return "<a class='lexGlossaryNav' data-lex-glossary-link='1' href='student-glossary.html?lang="+(language==="en"?"en":"ar")+"'>📖 "+
  (language==="en"?"My legal dictionary":"قاموسي القانوني")+"</a>";
}
let installed=false;
function installLinkGuard(cloud){
 if(installed||!root.document||!root.document.addEventListener)return;
 installed=true;
 root.document.addEventListener("click",async function(e){
  const a=e.target&&e.target.closest&&e.target.closest("a[data-lex-glossary-link]");
  if(!a)return;
  e.preventDefault();
  if(a.dataset.lexChecking==="1")return;
  a.dataset.lexChecking="1";
  try{
   if(await check(cloud)){root.location.href=a.href;return;}
   a.outerHTML=linkHtml(false,root.document.documentElement.lang==="en"?"en":"ar");
  }catch(_){
   a.outerHTML="<span class='lexGlossaryLocked' role='status'>"+
     (root.document.documentElement.lang==="en"?"Cannot verify dictionary access. Refresh this page.":"تعذّر التحقق من إتاحة القاموس. حدّث الصفحة.")+"</span>";
  }finally{a.dataset.lexChecking="0";}
 },true);
}
root.LEX_GLOSSARY_ACCESS={check:check,notice:notice,linkHtml:linkHtml,canShowTerms:function(){return latestAllowed===true;},installLinkGuard:installLinkGuard};
if(typeof module!=="undefined"&&module.exports)module.exports=root.LEX_GLOSSARY_ACCESS;
})(typeof window!=="undefined"?window:globalThis);
