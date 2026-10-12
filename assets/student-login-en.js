(function(){
"use strict";
var KEY="lexlearn_students_v2",SESSION="lexlearn_student_session";
var params=new URLSearchParams(location.search),ENTRY_COUNTRY=(params.get("country")||"").toLowerCase();
function seed(){
  var a=[];try{a=JSON.parse(localStorage.getItem(KEY)||"[]");}catch(e){}
  var demo1={id:"stu-demo-001",name:"Demo Student 01",username:"student01",password:"Learn2027!",cohort:"Pilot A",university:"Qatar University",year:"First Year",subject:"rights",country:null,active:true,createdAt:Date.now()};
  var demo2={id:"stu-demo-002",name:"Demo Student 02",username:"student02",password:"Learn2027!",cohort:"Pilot A",university:"Qatar University",year:"First Year",subject:"rights",country:null,active:true,createdAt:Date.now()};
  if(!a.some(function(x){return x.id===demo1.id||x.username==="student01";}))a.unshift(demo1);
  if(!a.some(function(x){return x.id===demo2.id||x.username==="student02";}))a.push(demo2);
  a.forEach(function(x){if(x.country===undefined)x.country=null;});
  localStorage.setItem(KEY,JSON.stringify(a));
  return a;
}
var students=seed(),err=document.getElementById("studentError");
try{var lastUsername=localStorage.getItem("lexlearn_last_student_username");if(lastUsername)document.getElementById("studentUser").value=lastUsername;}catch(_){}
async function login(u,p){
  err.style.display="none";
  if(window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()){
    try{
      var cloud=await LEX_CLOUD.signInStudent(u,p),pr=cloud.profile;
      var chosen=ENTRY_COUNTRY==="qa"?"qa":(pr.country_code||null);
      localStorage.setItem(SESSION,JSON.stringify({
        studentId:pr.id,name:pr.display_name,username:pr.username,
        country:chosen,cloud:true,at:Date.now()
      }));
      if(ENTRY_COUNTRY==="qa")localStorage.setItem("lexlearn_country_setup_v2_rights_"+pr.id,"true");
      location.href="student-en.html";return;
    }catch(e){
      err.textContent=e&&e.message==="student_pending_approval"?"Registration received; your account is awaiting supervisor approval.":e&&e.message==="student_account_not_active"?"This account is paused or disabled; contact LexLearn support.":"Sign-in failed. Check your email or username and password.";
      err.style.display="block";return;
    }
  }
  var st=students.find(function(x){return x.active!==false&&x.username.toLowerCase()===String(u).toLowerCase()&&x.password===p;});
  if(!st){err.textContent="The username or password is incorrect, or the account is inactive.";err.style.display="block";return;}
  var chosen=ENTRY_COUNTRY==="qa"?"qa":(st.country||null);
  localStorage.setItem(SESSION,JSON.stringify({studentId:st.id,name:st.name,username:st.username,country:chosen,cloud:false,at:Date.now()}));
  if(ENTRY_COUNTRY==="qa")localStorage.setItem("lexlearn_country_setup_v2_rights_"+st.id,"true");
  location.href="student-en.html";
}
document.getElementById("studentLogin").addEventListener("submit",function(e){
  e.preventDefault();login(document.getElementById("studentUser").value.trim(),document.getElementById("studentPassword").value);
});
var demoButton=document.getElementById("demoStudent");
if(demoButton&&window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured())demoButton.style.display="none";
demoButton.onclick=function(){
  if(window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()){
    err.textContent="The local demo account is not available in production mode.";err.style.display="block";return;
  }
  login("student01","Learn2027!");
};
})();