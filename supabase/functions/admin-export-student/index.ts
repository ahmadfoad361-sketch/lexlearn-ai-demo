import {corsHeaders,requireStaff} from "../_shared/auth.ts";
const headers={...corsHeaders,"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private"};
const reply=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return reply({error:"method_not_allowed"},405);
 try{
  const {admin,profile,user}=await requireStaff(req);
  const body=await req.json();
  const uid=String(body.user_id||"");
  if(!/^[a-f0-9-]{36}$/i.test(uid))return reply({error:"invalid_student_id"},400);
  const prof=await admin.from("profiles").select("id,role,username,display_name,university,year_label,country_code,cohort_id,active,account_status,created_at,registration_track,faculty,institutional_email,institutional_email_verified_at,student_registration_number").eq("id",uid).single();
  if(prof.error||!prof.data||prof.data.role!=="student")return reply({error:"student_not_found"},404);
  if(profile.role==="instructor"){
    const scoped=await admin.from("profiles").select("cohort_id").eq("id",user.id).single();
    if(scoped.error||!scoped.data.cohort_id||scoped.data.cohort_id!==prof.data.cohort_id)
      return reply({error:"student_outside_instructor_scope"},403);
  }
  const tables=["enrollments","attempts","learner_snapshots","learning_plans","mastery_evidence","reviews","pilot_ai_grades","ai_grading_runs",
    "student_diagnostic_runs","student_training_sessions","student_training_answers","student_level_responses","consent_records","admin_audit"];
  async function pageTable(table:string,key="user_id"){
   const output:Record<string,unknown>[]=[];
   let page=0,more=true;
   while(more&&page<40){
    const a=page*500,b=a+499;
    const orderField=table==="enrollments"?"course_id":table==="pilot_ai_grades"?"attempt_id":
      table==="student_diagnostic_runs"?"created_at":table==="student_training_sessions"?"session_number":
      table==="student_training_answers"||table==="student_level_responses"?"session_number":
      table==="consent_records"?"created_at":"id";
    const order=table==="student_level_responses"?"level_number":orderField;
    const filter=table==="admin_audit"?"target_user_id":key;
    const q=await admin.from(table).select("*").eq(filter,uid).order(order,{ascending:true}).range(a,b);
    if(q.error)throw new Error(table+"_fetch_failed: "+q.error.message);
    const entries=q.data||[];
    output.push(...entries);
    more=entries.length===500;page++;
   }
   return {rows:output,truncated:more};
  }
  const result=await Promise.all(tables.map(t=>pageTable(t)));
  const data:Record<string,unknown>={};
  const truncated:string[]=[];
  tables.forEach((t,i)=>{data[t]=result[i].rows;if(result[i].truncated)truncated.push(t);});
  const ids=(data.attempts as Array<{id:string}>).map(a=>a.id);
  const human:unknown[]=[];
  for(let i=0;i<ids.length;i+=100){
   const q=await admin.from("pilot_human_grades").select("*").in("attempt_id",ids.slice(i,i+100));
   if(q.error)throw new Error("pilot_human_grades_fetch_failed: "+q.error.message);
   human.push(...(q.data||[]));
  }
  data.pilot_human_grades=human;
  const itemIds=[...new Set((data.attempts as Array<{item_id:string}>).map(x=>x.item_id).filter(Boolean))];
  const items:unknown[]=[];
  for(let i=0;i<itemIds.length;i+=100){
   const q=await admin.from("content_items").select("id,prompt_ar,dimension,course_id,source_ids").in("id",itemIds.slice(i,i+100));
   if(q.error)throw new Error("content_items_fetch_failed: "+q.error.message);
   items.push(...(q.data||[]));
  }
  data.questions=items;
  return reply({ok:true,student:prof.data,records:data,truncated,generated_at:new Date().toISOString()});
 }catch(e){
  const m=e instanceof Error?e.message:String(e);
  return reply({error:m},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:503);
 }
});