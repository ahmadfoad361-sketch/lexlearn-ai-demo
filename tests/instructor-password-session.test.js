const assert=require("node:assert/strict");
const vm=require("node:vm"),fs=require("node:fs");
const source=fs.readFileSync("assets/instructor-dashboard.js","utf8");
const page=fs.readFileSync("instructor.html","utf8");
const login=fs.readFileSync("instructor-login.html","utf8");
assert.match(page,/instructor-dashboard\.js\?v=20261029\.summaryonly1/);
assert.match(login,/instructor-login\.js\?v=20261029\.loginhelp2/);
assert.doesNotMatch(source,/setOwnPassword\([^)]*\);await reload\(\)/,
 "Never reload old JWT immediately after password rotation");
assert.match(source,/location\.replace\("instructor-login\.html\?password_updated=1"\)/);

async function attempt(newPass,confirmation,returnValue){
 let profileCalls=0,writeCalls=0,logoutCalls=0,redirect="",formHandler;
 const status={textContent:"",appendChild(){},setAttribute(){}};
 const button={disabled:false};
 const form={reset(){this.wasReset=true;},wasReset:false,querySelector(){return button;}};
 const fieldValue={password:newPass,password_confirm:confirmation};
 const doc={
  getElementById(id){
   if(id==="instructorApp")return {innerHTML:""};
   if(id==="instructorLogout")return {onclick:null};
   if(id==="firstProfessorPassword")return form;
   if(id==="activateMessage")return status;
   throw Error("Unexpected DOM id: "+id);
  },
  createElement(){return{href:"",textContent:""};},
  createTextNode(t){return t;}
 };
 const ctx={document:doc,window:{},console,location:{replace(s){redirect=s;}},
  FormData:class{constructor(){ }get(k){return fieldValue[k];}},
  LEX_CLOUD:{
   db(){return {rpc(){throw Error("Roster should not load before relogin");}};},
   async profile(){profileCalls++;return{role:"instructor",active:true,must_change_password:true};},
   async setOwnPassword(password){writeCalls++;assert.equal(password,newPass);return returnValue;},
   async signOut(){logoutCalls++;throw Error("JWT already invalidated");}
  }
 };
 vm.runInNewContext(source,ctx,{filename:"instructor-dashboard.js"});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(typeof form.onsubmit,"function","Must show first-login password form");
 await form.onsubmit({preventDefault(){},currentTarget:form});
 return {status:status.textContent,button,redirect,profileCalls,writeCalls,logoutCalls,reset:form.wasReset};
}
(async()=>{
 const mismatch=await attempt("long-password-2026","not-the-same",{ok:true});
 assert.equal(mismatch.writeCalls,0,"Different confirmations never rotate credentials");
 assert.match(mismatch.status,/غير متطابقتين/);
 assert.equal(mismatch.redirect,"");
 const ok=await attempt("new-secret-2026","new-secret-2026",{ok:true,profile:{must_change_password:false}});
 assert.equal(ok.writeCalls,1);
 assert.equal(ok.profileCalls,1,"Must not request instructor profile with invalidated JWT");
 assert.equal(ok.logoutCalls,1);
 assert.equal(ok.redirect,"instructor-login.html?password_updated=1");
 assert.equal(ok.reset,true);
 const unconfirmed=await attempt("new-secret-2026","new-secret-2026",{ok:false,error:"failure"});
 assert.equal(unconfirmed.redirect,"");
 assert.match(unconfirmed.status,/تعذر التأكد/);
 console.log("PASS first-login professor password change: correct confirmation, no stale-token reload, successful re-login prompt, non-misleading errors");
})().catch(e=>{console.error(e);process.exitCode=1;});
