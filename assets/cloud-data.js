(function(root){
"use strict";
var cfg=root.LEX_CONFIG||{},client=null;
function isConfigured(){return !!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&root.supabase&&root.supabase.createClient);}
function db(){
  if(!isConfigured())return null;
  if(!client)client=root.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return client;
}
function studentEmail(username){return String(username||"").trim().toLowerCase()+"@"+(cfg.studentEmailDomain||"students.lexlearn.local");}
async function profile(){
  var c=db();if(!c)return null;
  var u=await c.auth.getUser();if(u.error||!u.data.user)return null;
  var p=await c.from("profiles").select("id,role,username,display_name,active,must_change_password,university,year_label,cohort_id,locale,country_code").eq("id",u.data.user.id).single();
  if(p.error)throw p.error;return p.data;
}
async function signInStudent(username,password){
  var c=db();if(!c)throw new Error("cloud_not_configured");
  var r=await c.auth.signInWithPassword({email:studentEmail(username),password:password});
  if(r.error)throw r.error;
  var p=await profile();
  if(!p||p.role!=="student"||p.active===false){await c.auth.signOut();throw new Error("student_account_not_active");}
  return {user:r.data.user,profile:p};
}
async function signInAdmin(email,password){
  var c=db();if(!c)throw new Error("cloud_not_configured");
  var r=await c.auth.signInWithPassword({email:String(email||"").trim(),password:password});
  if(r.error)throw r.error;
  var p=await profile();
  if(!p||["owner","admin","instructor"].indexOf(p.role)<0||p.active===false){await c.auth.signOut();throw new Error("admin_role_required");}
  return {user:r.data.user,profile:p};
}
async function signOut(){var c=db();if(c)await c.auth.signOut();}
async function loadSnapshot(opts){
  var c=db();if(!c)return null;
  var q=c.from("learner_snapshots").select("state,version,updated_at").eq("course_id",opts.courseId).eq("snapshot_type",opts.snapshotType);
  if(opts.userId)q=q.eq("user_id",opts.userId);
  var r=await q.maybeSingle();if(r.error)throw r.error;return r.data;
}
async function saveSnapshot(opts){
  var c=db();if(!c)return null;
  var u=await c.auth.getUser();if(u.error||!u.data.user)throw new Error("not_authenticated");
  var row={user_id:u.data.user.id,course_id:opts.courseId,snapshot_type:opts.snapshotType,state:opts.state,version:Number(opts.version)||1,updated_at:new Date().toISOString()};
  var r=await c.from("learner_snapshots").upsert(row,{onConflict:"user_id,course_id,snapshot_type"}).select().single();
  if(r.error)throw r.error;return r.data;
}
async function listStudents(){
  var c=db();if(!c)return [];
  var r=await c.from("profiles").select("id,username,display_name,active,must_change_password,university,year_label,cohort_id,created_at,cohorts(name)").eq("role","student").order("created_at",{ascending:false});
  if(r.error)throw r.error;
  return (r.data||[]).map(function(x){return{id:x.id,name:x.display_name,username:x.username,active:x.active,mustChangePassword:x.must_change_password,university:x.university,year:x.year_label,country:x.country_code||"qa",cohort:x.cohorts&&x.cohorts.name||"",createdAt:x.created_at,cloud:true};});
}
async function listCohorts(){
  var c=db();if(!c)return[];
  var r=await c.from("cohorts").select("id,name,institution,academic_year,active,created_at").order("created_at");
  if(r.error)throw r.error;return r.data||[];
}
async function listAudit(){
  var c=db();if(!c)return[];
  var r=await c.from("admin_audit").select("id,actor_user_id,target_user_id,action,details,created_at").order("created_at",{ascending:false}).limit(250);
  if(r.error)throw r.error;return r.data||[];
}
async function invoke(name,body){
  var c=db();if(!c)throw new Error("cloud_not_configured");
  var r=await c.functions.invoke(name,{body:body||{}});
  if(r.error)throw r.error;return r.data;
}
async function createStudent(data){return invoke("admin-create-student",data);}
async function manageStudent(data){return invoke("admin-manage-student",data);}
async function createCohort(data){
  var c=db();if(!c)throw new Error("cloud_not_configured");
  var row={name:String(data.name||"").trim(),institution:data.institution||null,academic_year:data.academic_year||null,active:true};
  if(!row.name)throw new Error("cohort_name_required");
  var r=await c.from("cohorts").insert(row).select().single();if(r.error)throw r.error;return r.data;
}
async function setOwnPassword(password){
  if(String(password||"").length<10)throw new Error("password_too_short");
  return invoke("account-set-password",{password:String(password)});
}
async function gradeAnswer(data){return invoke("grade-answer",data);}
async function recordAttempt(row){
  var c=db();if(!c)return null;
  var u=await c.auth.getUser();if(u.error||!u.data.user)return null;
  row=Object.assign({},row,{user_id:u.data.user.id});
  var r=await c.from("attempts").insert(row).select().single();if(r.error)throw r.error;return r.data;
}
async function saveLearningPlan(row){
  var c=db();if(!c)return null;
  var u=await c.auth.getUser();if(u.error||!u.data.user)return null;
  row=Object.assign({},row,{user_id:u.data.user.id,updated_at:new Date().toISOString()});
  var r=await c.from("learning_plans").upsert(row,{onConflict:"user_id,course_id"}).select().single();if(r.error)throw r.error;return r.data;
}
root.LEX_CLOUD={isConfigured:isConfigured,db:db,studentEmail:studentEmail,profile:profile,signInStudent:signInStudent,signInAdmin:signInAdmin,signOut:signOut,loadSnapshot:loadSnapshot,saveSnapshot:saveSnapshot,listStudents:listStudents,listCohorts:listCohorts,listAudit:listAudit,createStudent:createStudent,manageStudent:manageStudent,createCohort:createCohort,setOwnPassword:setOwnPassword,gradeAnswer:gradeAnswer,recordAttempt:recordAttempt,saveLearningPlan:saveLearningPlan};
})(typeof globalThis!=="undefined"?globalThis:this);
