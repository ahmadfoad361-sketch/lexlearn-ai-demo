(function(root){
"use strict";
var cfg=root.LEX_CLOUD_CONFIG||{};
var client=null;
function isConfigured(){return !!(cfg.enabled&&cfg.url&&cfg.publishableKey&&root.supabase&&root.supabase.createClient);}
function db(){
  if(!isConfigured())return null;
  if(!client)client=root.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return client;
}
function emailForUsername(username){
  var u=String(username||"").trim().toLowerCase().replace(/[^a-z0-9._-]/g,"");
  return u+"@"+(cfg.usernameDomain||"users.lexlearn.local");
}
async function session(){
  var c=db();if(!c)return null;
  var r=await c.auth.getSession();if(r.error)throw r.error;
  return r.data.session||null;
}
async function signInUsername(username,password){
  var c=db();if(!c)throw new Error("CLOUD_NOT_CONFIGURED");
  var r=await c.auth.signInWithPassword({email:emailForUsername(username),password:password});
  if(r.error)throw r.error;
  var p=await getProfile();
  if(!p||p.active===false||p.role!=="student"){await c.auth.signOut();throw new Error("STUDENT_ACCESS_DENIED");}
  return {session:r.data.session,profile:p};
}
async function signInEmail(email,password){
  var c=db();if(!c)throw new Error("CLOUD_NOT_CONFIGURED");
  var r=await c.auth.signInWithPassword({email:String(email||"").trim().toLowerCase(),password:password});
  if(r.error)throw r.error;
  var p=await getProfile();
  if(!p||p.active===false||["owner","admin","instructor"].indexOf(p.role)<0){await c.auth.signOut();throw new Error("ADMIN_ACCESS_DENIED");}
  return {session:r.data.session,profile:p};
}
async function signOut(){var c=db();if(c)await c.auth.signOut();}
async function getProfile(){
  var c=db();if(!c)return null;
  var s=await session();if(!s)return null;
  var r=await c.from("profiles").select("id,role,username,display_name,active,must_change_password,university,year_label,cohort_id,locale").eq("id",s.user.id).maybeSingle();
  if(r.error)throw r.error;return r.data||null;
}
async function listStudents(){
  var c=db();if(!c)return [];
  var r=await c.from("profiles").select("id,username,display_name,active,must_change_password,university,year_label,cohort_id,created_at,cohorts(name)").eq("role","student").order("created_at",{ascending:false});
  if(r.error)throw r.error;return r.data||[];
}
async function listCohorts(){
  var c=db();if(!c)return [];
  var r=await c.from("cohorts").select("*").order("name");
  if(r.error)throw r.error;return r.data||[];
}
async function createCohort(row){
  var c=db();var r=await c.from("cohorts").insert(row).select().single();if(r.error)throw r.error;return r.data;
}
async function invokeAdminUser(payload){
  var c=db();if(!c)throw new Error("CLOUD_NOT_CONFIGURED");
  var r=await c.functions.invoke("admin-user",{body:payload});
  if(r.error)throw r.error;
  if(r.data&&r.data.error)throw new Error(r.data.error);
  return r.data;
}
async function createStudent(data){return invokeAdminUser({action:"create",student:data});}
async function resetStudentPassword(userId){return invokeAdminUser({action:"reset_password",userId:userId});}
async function setStudentActive(userId,active){return invokeAdminUser({action:"set_active",userId:userId,active:!!active});}
async function adminAudit(action,targetUserId,details){
  var c=db();if(!c)return null;
  var s=await session();if(!s)return null;
  var r=await c.from("admin_audit").insert({actor_user_id:s.user.id,target_user_id:targetUserId||null,action:action,details:details||{}});
  if(r.error)throw r.error;return true;
}
async function listAdminAudit(limit){
  var c=db();if(!c)return [];
  var r=await c.from("admin_audit").select("*").order("created_at",{ascending:false}).limit(limit||250);
  if(r.error)throw r.error;return r.data||[];
}
async function saveSnapshot(input){
  var c=db();if(!c)return null;var s=await session();if(!s)return null;
  var row={user_id:s.user.id,course_id:input.courseId,snapshot_type:input.snapshotType,state:input.state||{},version:input.version||1};
  var r=await c.from("learner_snapshots").upsert(row,{onConflict:"user_id,course_id,snapshot_type"}).select().single();
  if(r.error)throw r.error;return r.data;
}
async function loadSnapshot(courseId,snapshotType){
  var c=db();if(!c)return null;var s=await session();if(!s)return null;
  var r=await c.from("learner_snapshots").select("state,version,updated_at").eq("user_id",s.user.id).eq("course_id",courseId).eq("snapshot_type",snapshotType).maybeSingle();
  if(r.error)throw r.error;return r.data||null;
}
async function saveAttempt(row){
  var c=db();if(!c)return null;var s=await session();if(!s)return null;
  row=Object.assign({},row,{user_id:s.user.id});
  var r=await c.from("attempts").insert(row).select().single();if(r.error)throw r.error;return r.data;
}
async function saveLearningPlan(row){
  var c=db();if(!c)return null;var s=await session();if(!s)return null;
  row=Object.assign({},row,{user_id:s.user.id});
  var r=await c.from("learning_plans").upsert(row,{onConflict:"user_id,course_id"}).select().single();if(r.error)throw r.error;return r.data;
}
async function gradeAnswer(payload){
  var c=db();if(!c)throw new Error("CLOUD_NOT_CONFIGURED");
  var r=await c.functions.invoke("grade-answer",{body:payload});
  if(r.error)throw r.error;return r.data;
}
root.LEX_CLOUD={
  isConfigured:isConfigured,db:db,emailForUsername:emailForUsername,session:session,
  signInUsername:signInUsername,signInEmail:signInEmail,signOut:signOut,getProfile:getProfile,
  listStudents:listStudents,listCohorts:listCohorts,createCohort:createCohort,
  createStudent:createStudent,resetStudentPassword:resetStudentPassword,setStudentActive:setStudentActive,
  adminAudit:adminAudit,listAdminAudit:listAdminAudit,
  saveSnapshot:saveSnapshot,loadSnapshot:loadSnapshot,saveAttempt:saveAttempt,
  saveLearningPlan:saveLearningPlan,gradeAnswer:gradeAnswer
};
})(window);
