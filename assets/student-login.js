(function(){
"use strict";
var KEY="lexlearn_students_v2",SESSION="lexlearn_student_session";
function seed(){
  var a=[];try{a=JSON.parse(localStorage.getItem(KEY)||"[]");}catch(e){}
  if(!a.length){
    a=[
      {id:"stu-demo-001",name:"طالب تجريبي 01",username:"student01",password:"Learn2027!",cohort:"Pilot A",university:"Qatar University",year:"السنة الأولى",subject:"sources",active:true,createdAt:Date.now()},
      {id:"stu-demo-002",name:"طالب تجريبي 02",username:"student02",password:"Learn2027!",cohort:"Pilot A",university:"Qatar University",year:"السنة الأولى",subject:"sources",active:true,createdAt:Date.now()}
    ];
    localStorage.setItem(KEY,JSON.stringify(a));
  }
  return a;
}
var students=seed(),err=document.getElementById("studentError");
function login(u,p){
  var st=students.find(function(x){return x.active!==false&&x.username.toLowerCase()===String(u).toLowerCase()&&x.password===p;});
  if(!st){err.textContent="اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب غير نشط.";err.style.display="block";return;}
  localStorage.setItem(SESSION,JSON.stringify({studentId:st.id,name:st.name,username:st.username,at:Date.now()}));location.href="student.html";
}
document.getElementById("studentLogin").addEventListener("submit",function(e){e.preventDefault();login(document.getElementById("studentUser").value.trim(),document.getElementById("studentPassword").value);});
document.getElementById("demoStudent").onclick=function(){login("student01","Learn2027!");};
})();