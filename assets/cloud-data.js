(function(root){
"use strict";
var cfg=root.LEX_CONFIG||{},client=null;
function isConfigured(){return !!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&root.supabase&&root.supabase.createClient);}
var REMEMBER_KEY="lexlearn_keep_signed_in";
function rememberMe(){try{return root.localStorage.getItem(REMEMBER_KEY)!=="0";}catch(_){return true;}}
function storageKey(){return "sb-"+String(cfg.supabaseUrl||"").split("://").pop().split(".")[0]+"-auth-token";}
function authStorage(){
 return {
  getItem:function(k){try{return (rememberMe()?root.localStorage:root.sessionStorage).getItem(k);}catch(_){return null;}},
  setItem:function(k,v){try{var keep=rememberMe(),dst=keep?root.localStorage:root.sessionStorage,other=keep?root.sessionStorage:root.localStorage;dst.setItem(k,v);other.removeItem(k);}catch(_){}},
  removeItem:function(k){try{root.localStorage.removeItem(k);root.sessionStorage.removeItem(k);}catch(_){}}
 };
}
function setRememberMe(keep){
 var current=rememberMe(),from=current?root.localStorage:root.sessionStorage,to=keep?root.localStorage:root.sessionStorage;
 try{
  var keys=[storageKey(),storageKey()+"-code-verifier"];
  keys.forEach(function(k){var value=from.getItem(k);if(value)to.setItem(k,value);from.removeItem(k);});
  root.localStorage.setItem(REMEMBER_KEY,keep?"1":"0");
 }catch(_){}
}
function db(){
  if(!isConfigured())return null;
  if(!client)client=root.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:authStorage()}});
  return client;
}
function studentEmail(username){return String(username||"").trim().toLowerCase()+"@"+(cfg.studentEmailDomain||"students.lexlearn.local");}
async function profile(){
  var c=db();if(!c)return null;
  var u=await c.auth.getUser();if(u.error||!u.data.user)return null;
  var p=await c.from("profiles").select("id,role,username,display_name,active,account_status,whatsapp_e164,must_change_password,university,year_label,cohort_id,locale,country_code").eq("id",u.data.user.id).single();
  if(p.error)throw p.error;return p.data;
}
async function signInStudent(username,password){
  var c=db();if(!c)throw new Error("cloud_not_configured");
  var identifier=String(username||"").trim().toLowerCase();
  var phone=identifier.replace(/[\s().-]/g,"");
  if(phone.startsWith("00"))phone="+"+phone.slice(2);
  var options=/^\+[1-9][0-9]{7,14}$/.test(phone)?
   {phone:phone,password:password}:
   {email:identifier.includes("@")?identifier:studentEmail(identifier),password:password};
  var r=await c.auth.signInWithPassword(options);
  if(r.error)throw r.error;
  var p=await profile();
  if(!p||p.role!=="student"||p.active===false){
   await c.auth.signOut();
   throw new Error(p&&p.account_status==="pending"?"student_pending_approval":"student_account_not_active");
  }
  return {user:r.data.user,profile:p};
}
async function signInAdmin(email,password){
  var c=db();if(!c)throw new Error("cloud_not_configured");
  var r=await c.auth.signInWithPassword({email:String(email||"").trim(),password:password});
  if(r.error)throw r.error;
  var p=await profile();
  if(!p||["owner","admin"].indexOf(p.role)<0||p.active===false){await c.auth.signOut();throw new Error("admin_role_required");}
  return {user:r.data.user,profile:p};
}
async function signOut(){var c=db();if(c)await c.auth.signOut();}
async function requestPasswordReset(email,redirectTo){
  var c=db();if(!c)throw new Error("cloud_not_configured");
  var opts=redirectTo?{redirectTo:redirectTo}:{};
  var r=await c.auth.resetPasswordForEmail(String(email||"").trim(),opts);
  if(r.error)throw r.error;return true;
}
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
  var r=await c.from("profiles").select("id,username,display_name,active,account_status,whatsapp_e164,whatsapp_verified_at,must_change_password,university,faculty,academic_section,student_registration_number,institutional_group_email,year_label,country_code,cohort_id,created_at,cohorts(name)").eq("role","student").order("created_at",{ascending:false});
  if(r.error)throw r.error;
  return (r.data||[]).map(function(x){return{id:x.id,name:x.display_name,username:x.username,active:x.active,accountStatus:x.account_status||(x.active?"active":"disabled"),whatsapp:x.whatsapp_e164,whatsappVerified:!!x.whatsapp_verified_at,mustChangePassword:x.must_change_password,university:x.university,faculty:x.faculty,section:x.academic_section,studentRegistrationNumber:x.student_registration_number,groupEmail:x.institutional_group_email,year:x.year_label,country:x.country_code||"qa",cohort:x.cohorts&&x.cohorts.name||"",createdAt:x.created_at,cloud:true};});
}
async function listCohorts(){
  var c=db();if(!c)return[];
  var r=await c.from("cohorts").select("id,name,institution,academic_year,faculty,country_code,course_id,subject_name,active,created_at").order("created_at");
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
async function listContentItems(courseId){
  var c=db();if(!c)return[];
  var q=c.from("content_items").select("id,course_id,unit_id,concept_id,dimension,difficulty,item_type,prompt_ar,source_ids,status,version,reviewed_at,metadata").order("updated_at",{ascending:false});
  if(courseId)q=q.eq("course_id",courseId);
  var r=await q;if(r.error)throw r.error;return r.data||[];
}
async function reviewContent(data){return invoke("content-review",data);}
async function createCohort(data){
  var c=db();if(!c)throw new Error("cloud_not_configured");
  var row={name:String(data.name||"").trim(),institution:String(data.institution||"").trim()||null,academic_year:data.academic_year||null,faculty:String(data.faculty||"").trim()||null,country_code:data.country_code||"qa",course_id:data.course_id||"qa-qu-lawc101-rights",subject_name:String(data.subject_name||"").trim()||"نظرية الحق",active:true};
  if(!row.name)throw new Error("cohort_name_required");
  var r=await c.from("cohorts").insert(row).select().single();if(r.error)throw r.error;return r.data;
}
async function updateCohortDefaults(data){
 var c=db();if(!c)throw new Error("cloud_not_configured");
 var id=String(data.id||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))throw Error("invalid_cohort");
 var row={institution:String(data.institution||"").trim()||null,academic_year:data.academic_year||null,
 faculty:String(data.faculty||"").trim()||null,country_code:data.country_code||"qa",
 course_id:data.course_id||"qa-qu-lawc101-rights",subject_name:String(data.subject_name||"").trim()||"نظرية الحق"};
 var r=await c.from("cohorts").update(row).eq("id",id).select("id").single();
 if(r.error)throw r.error;return r.data;
}
async function setOwnPassword(password){
  if(String(password||"").length<10)throw new Error("password_too_short");
  return invoke("account-update-profile",{password:String(password)});
}
async function updateOwnProfile(patch){return invoke("account-update-profile",patch||{});}
async function gradeAnswer(data){return invoke("grade-answer",data);}
async function gradePilot(data){return invoke("pilot-grade",data);}
async function gradeDiagnosticAi(){return invoke("lexlearn-diagnostic-ai-grade",{});}
async function gradeTrainingAi(session,itemId){
 try{return await invoke("lexlearn-training-ai-grade",{session:session,item_id:itemId});}
 catch(error){
  var code='assessment_unavailable';
  if(error&&error.context&&typeof error.context.json==='function')try{var detail=await error.context.json();if(detail&&typeof detail.error==='string')code=detail.error;}catch(_){}
  var failure=new Error(code);failure.code=code;throw failure;
 }
}
async function trainingAiSummary(){return invoke("lexlearn-training-ai-grade",{action:"summary"});}
async function getDiagnosticAiAudit(attemptId){
 if(!/^[a-f0-9-]{36}$/i.test(String(attemptId||"")))return null;
 var c=db();if(!c)return null;
 var u=await c.auth.getUser();if(u.error||!u.data.user)return null;
 var r=await c.from("ai_grading_runs").select("result")
  .eq("user_id",u.data.user.id)
  .eq("course_id","qa-qu-lawc101-rights")
  .eq("item_id","diagnostic-legal-personality:"+attemptId)
  .in("prompt_version",["lexlearn-diagnostic-ai-v1","lexlearn-diagnostic-ai-v2"])
  .order("created_at",{ascending:false}).limit(1).maybeSingle();
 if(r.error)throw r.error;
 return r.data&&r.data.result||null;
}
async function getConsent(noticeVersion,consentType){
  var c=db();if(!c)return null;
  var u=await c.auth.getUser();if(u.error||!u.data.user)return null;
  var r=await c.from("consent_records").select("id,accepted,created_at").eq("user_id",u.data.user.id).eq("notice_version",noticeVersion).eq("consent_type",consentType||"learning_data").eq("accepted",true).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(r.error)throw r.error;return r.data||null;
}
async function recordConsent(noticeVersion,consentType,accepted){
  var c=db();if(!c)return null;
  var u=await c.auth.getUser();if(u.error||!u.data.user)throw new Error("not_authenticated");
  var r=await c.from("consent_records").insert({user_id:u.data.user.id,notice_version:noticeVersion,consent_type:consentType||"learning_data",accepted:!!accepted}).select().single();
  if(r.error)throw r.error;return r.data;
}
async function logEvent(eventType,eventData){
  var c=db();if(!c)return null;
  var u=await c.auth.getUser();if(u.error||!u.data.user)return null;
  var safe=eventData&&typeof eventData==="object"?eventData:{};
  var r=await c.from("activity_events").insert({user_id:u.data.user.id,event_type:String(eventType||"CLIENT_EVENT").slice(0,80),event_data:safe}).select("id").single();
  if(r.error)throw r.error;return r.data;
}
async function recordAttempt(row){
  var c=db();if(!c)return null;
  var u=await c.auth.getUser();if(u.error||!u.data.user)return null;
  row=Object.assign({},row,{user_id:u.data.user.id});
  var r=await c.from("attempts").insert(row).select().single();if(r.error)throw r.error;return r.data;
}
async function studentLifecycleRpc(action,params){
 var c=db();if(!c)throw new Error("cloud_not_configured");
 var calls={status:"lex_diagnostic_status",begin:"lex_diagnostic_begin",draft:"lex_diagnostic_draft",
    complete:"lex_diagnostic_complete",reviewDiagnostic:"lex_diagnostic_internal_assess",level:"lex_level_access",firstLevel:"lex_level_one_open",submitLevelOne:"lex_level_one_submit",trainingOverview:"lex_training_overview",trainingOpen:"lex_training_session_open",trainingSubmit:"lex_training_submit"};
 if(!Object.prototype.hasOwnProperty.call(calls,action))throw new Error("unknown_lifecycle_action");
 var args={p_course:params&&params.courseId||"qa-qu-lawc101-rights"};
 if(action==="draft"||action==="complete")args.p_answers=params.answers;
 if(action==="complete")args.p_free_text=params.freeText||"";
 if(action==="level")args.p_level=params.level;
 if(action==="submitLevelOne"){args.p_item_id=params.itemId;args.p_answer=params.answer;}
  if(action==="trainingOpen"||action==="trainingSubmit")args.p_session=params.session;
  if(action==="trainingSubmit"){args.p_item_id=params.itemId;args.p_answer=params.answer;}
 var r=await c.rpc(calls[action],args);
 if(r.error)throw new Error(r.error.message||"lifecycle_server_unavailable");
 if(!r.data||typeof r.data!=="object")throw new Error("unverified_lifecycle_response");
 return r.data;
}
async function saveLearningPlan(row){
  var c=db();if(!c)return null;
  var u=await c.auth.getUser();if(u.error||!u.data.user)return null;
  row=Object.assign({},row,{user_id:u.data.user.id,updated_at:new Date().toISOString()});
  var r=await c.from("learning_plans").upsert(row,{onConflict:"user_id,course_id"}).select().single();if(r.error)throw r.error;return r.data;
}
root.LEX_CLOUD={isConfigured:isConfigured,db:db,rememberMe:rememberMe,setRememberMe:setRememberMe,studentEmail:studentEmail,profile:profile,signInStudent:signInStudent,signInAdmin:signInAdmin,signOut:signOut,requestPasswordReset:requestPasswordReset,loadSnapshot:loadSnapshot,saveSnapshot:saveSnapshot,listStudents:listStudents,listCohorts:listCohorts,listAudit:listAudit,listContentItems:listContentItems,reviewContent:reviewContent,createStudent:createStudent,manageStudent:manageStudent,createCohort:createCohort,updateCohortDefaults:updateCohortDefaults,setOwnPassword:setOwnPassword,updateOwnProfile:updateOwnProfile,studentLifecycleRpc:studentLifecycleRpc,gradeAnswer:gradeAnswer,gradePilot:gradePilot,gradeDiagnosticAi:gradeDiagnosticAi,gradeTrainingAi:gradeTrainingAi,trainingAiSummary:trainingAiSummary,getDiagnosticAiAudit:getDiagnosticAiAudit,getConsent:getConsent,recordConsent:recordConsent,logEvent:logEvent,recordAttempt:recordAttempt,saveLearningPlan:saveLearningPlan};
if(typeof window!=="undefined"){
  window.addEventListener("error",function(ev){
    if(!isConfigured())return;
    logEvent("CLIENT_ERROR",{message:String(ev.message||"error").slice(0,180),file:String(ev.filename||"").split("/").pop(),line:ev.lineno||null,column:ev.colno||null}).catch(function(){});
  });
  window.addEventListener("unhandledrejection",function(ev){
    if(!isConfigured())return;
    var reason=ev.reason&&ev.reason.message?ev.reason.message:String(ev.reason||"promise_rejection");
    logEvent("CLIENT_PROMISE_REJECTION",{message:reason.slice(0,180)}).catch(function(){});
  });
}
})(typeof globalThis!=="undefined"?globalThis:this);

