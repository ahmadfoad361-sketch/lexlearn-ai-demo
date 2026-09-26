(function(){
"use strict";
var ADMIN_KEY="lexlearn_admin_v2",SESSION_KEY="lexlearn_admin_session";
function seed(){
  var a;try{a=JSON.parse(localStorage.getItem(ADMIN_KEY)||"null");}catch(e){}
  if(!a){a={id:"admin-demo",name:"Dr. Ahmed Feky",email:"admin@lexlearn.demo",password:"LexLearn2027!",active:true};localStorage.setItem(ADMIN_KEY,JSON.stringify(a));}
  return a;
}
var admin=seed(),form=document.getElementById("adminLogin"),err=document.getElementById("adminError");
function login(email,password){
  if(admin.active&&String(email).toLowerCase()===admin.email.toLowerCase()&&password===admin.password){
    localStorage.setItem(SESSION_KEY,JSON.stringify({adminId:admin.id,name:admin.name,at:Date.now()}));location.href="admin.html";return;
  }
  err.textContent="بيانات الدخول غير صحيحة.";err.style.display="block";
}
form.addEventListener("submit",function(e){e.preventDefault();login(document.getElementById("adminEmail").value.trim(),document.getElementById("adminPassword").value);});
document.getElementById("demoAdmin").onclick=function(){document.getElementById("adminEmail").value=admin.email;document.getElementById("adminPassword").value=admin.password;login(admin.email,admin.password);};
})();