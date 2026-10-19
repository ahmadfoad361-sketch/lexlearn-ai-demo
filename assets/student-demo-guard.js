/* LexLearn: visitor demo isolation for signed-in students.
 * Navigation affordance only; assessment segregation remains server-controlled.
 * Verify Supabase Auth + active role before redirecting/blocking. Never trust localStorage alone.
 */
(function(root){
"use strict";
if(!root||!root.document||!root.location)return;
var D=root.document,loc=root.location,lang=(D.documentElement.getAttribute("lang")||"ar").toLowerCase()==="en"?"en":"ar";
var demoPath=/\/(?:showcase|showcase-en|showcase-level1|showcase-level1-en)\.html$/i;
var isDemoPage=demoPath.test(loc.pathname);
var verifiedStudent=false,checking=false;
function text(ar,en){return lang==="en"?en:ar;}
function isDemoUrl(href){
 try{var u=new URL(href,loc.href);return u.origin===loc.origin&&demoPath.test(u.pathname);}
 catch(_){return false;}
}
function dimLinks(){
 D.querySelectorAll("a[href]").forEach(function(link){
  if(!isDemoUrl(link.getAttribute("href")))return;
  if(link.getAttribute("data-lex-demo-locked")==="1")return;
  link.setAttribute("data-lex-demo-locked","1");
  link.setAttribute("aria-disabled","true");
  link.setAttribute("tabindex","-1");
  link.setAttribute("title",text("الديمو مخصص للزوار فقط؛ تابع دراستك من حساب الطالب.","Demo is for visitors only. Continue from your student account."));
  link.style.opacity=".38";link.style.filter="grayscale(1)";link.style.cursor="not-allowed";
  link.style.pointerEvents="none";
  var label=D.createElement("small");
  label.className="lex-student-demo-notice";
  label.textContent=text(" · للزوار فقط"," · Visitors only");
  label.setAttribute("aria-hidden","true");
  link.appendChild(label);
 });
}
function activeStudent(){
 var cloud=root.LEX_CLOUD;
 if(!cloud||!cloud.isConfigured||!cloud.isConfigured()||!cloud.db)return Promise.resolve(false);
 return cloud.db().auth.getUser().then(function(who){
  var current=who&&who.data&&who.data.user;
  if(!current||who.error)return false;
  return cloud.profile().then(function(p){
   return !!p&&p.id===current.id&&p.role==="student"&&p.active===true;
  });
 }).catch(function(){return false;});
}
function redirect(){
 if(isDemoPage){
  loc.replace(lang==="en"?"student-en.html":"student.html");
  return true;
 }
 return false;
}
async function check(){
 if(checking)return; checking=true;
 var found=await activeStudent();
 if(!found)return;
 verifiedStudent=true;
 if(redirect())return;
 if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",dimLinks,{once:true});else dimLinks();
 if(root.MutationObserver){
  var observer=new MutationObserver(function(){dimLinks();});
  observer.observe(D.body||D.documentElement,{childList:true,subtree:true});
 }
}
D.addEventListener("click",function(e){
 if(!verifiedStudent)return;
 var target=e.target&&e.target.closest&&e.target.closest("a[href]");
 if(target&&isDemoUrl(target.getAttribute("href"))){
  e.preventDefault();e.stopImmediatePropagation();
 }
},true);
root.LEX_STUDENT_DEMO_LOCK={check:check,isDemoUrl:isDemoUrl};
check();
})(typeof window!=="undefined"?window:null);
