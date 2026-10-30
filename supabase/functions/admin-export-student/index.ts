import {corsHeaders,requireStaff} from "../_shared/auth.ts";
import {legalSources} from "../_shared/qatar-civil-provisions.mjs";
const headers={...corsHeaders,"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private"};
const reply=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return reply({error:"method_not_allowed"},405);
 try{
  const {admin,profile,user}=await requireStaff(req);
  const body=await req.json();
  if(body.action==="overview"){
    let people=admin.from("profiles").select("id").eq("role","student");
    if(profile.role==="instructor"){
      const staff=await admin.from("profiles").select("cohort_id").eq("id",user.id).single();
      if(staff.error||!staff.data?.cohort_id)return reply({ok:true,records:{student_diagnostic_runs:[],student_training_sessions:[],student_training_answers:[]}});
      people=people.eq("cohort_id",staff.data.cohort_id);
    }
    const permittedIds:string[]=[];
    for(let page=0;page<20;page++){
      const permitted=await people.order("id",{ascending:true}).range(page*500,page*500+499);
      if(permitted.error)throw Error("students_fetch_failed");
      permittedIds.push(...(permitted.data||[]).map((p:any)=>p.id));
      if((permitted.data||[]).length<500)break;
      if(page===19)throw Error("overview_scope_too_large");
    }
    const records:Record<string,unknown[]>={student_diagnostic_runs:[],student_training_sessions:[],student_training_answers:[]};
    const ids=permittedIds;
    for(let i=0;i<ids.length;i+=50){
      for(const table of Object.keys(records)){
        const fields=table==="student_diagnostic_runs"?"user_id,course_id,status,result,updated_at":table==="student_training_sessions"?"user_id,course_id,session_number,started_at,completed_at":"user_id,course_id,session_number,item_id,dimension,evaluation,submitted_at";
        for(let page=0;page<20;page++){
          let query=admin.from(table).select(fields).in("user_id",ids.slice(i,i+50)).eq("course_id","qa-qu-lawc101-rights").order("user_id",{ascending:true});
          if(table!=="student_diagnostic_runs")query=query.order("session_number",{ascending:true});
          if(table==="student_training_answers")query=query.order("item_id",{ascending:true});
          const rows=await query.range(page*500,page*500+499);
          if(rows.error)throw Error(table+"_fetch_failed");
          records[table].push(...(rows.data||[]).map((r:any)=>{
            if(table==="student_training_answers")return {...r,evaluation:{status:r.evaluation?.status,rubric_version:r.evaluation?.rubric_version,provisional_percent:r.evaluation?.provisional_percent}};
            if(table==="student_diagnostic_runs"&&profile.role==="instructor"){
              const source=r.result||{},recall=source.measurements?.recall?.ai_grade||null;
              return {...r,result:{
                metrics:{understanding:source.metrics?.understanding??null,application:source.metrics?.application??null},
                measurements:{recall:{ai_grade:recall?{status:recall.status,rubric_version:recall.rubric_version,provisional_percent:recall.provisional_percent}:null}}
              }};
            }
            return r;
          }));
          if((rows.data||[]).length<500)break;
          if(page===19)throw Error("overview_rows_exceeded");
        }
      }
    }
    return reply({ok:true,records,generated_at:new Date().toISOString()});
  }
  // An instructor may request the aggregated overview for an assigned cohort;
  // individual full archives are restricted to the owner and administrators.
  if(!["owner","admin"].includes(profile.role))return reply({error:"admin_export_forbidden"},403);
  const uid=String(body.user_id||"");
  if(!/^[a-f0-9-]{36}$/i.test(uid))return reply({error:"invalid_student_id"},400);
  const prof=await admin.from("profiles").select("id,role,username,display_name,university,year_label,country_code,cohort_id,active,account_status,created_at").eq("id",uid).single();
  if(prof.error||!prof.data||prof.data.role!=="student")return reply({error:"student_not_found"},404);
  if(profile.role==="instructor"){
    const scoped=await admin.from("profiles").select("cohort_id").eq("id",user.id).single();
    if(scoped.error||!scoped.data.cohort_id||scoped.data.cohort_id!==prof.data.cohort_id)
      return reply({error:"student_outside_instructor_scope"},403);
  }
  const tables=["enrollments","attempts","learner_snapshots","learning_plans","mastery_evidence","reviews","pilot_ai_grades","ai_grading_runs","student_diagnostic_runs","student_training_sessions","student_training_answers","student_level_completions"];
  async function pageTable(table:string,key="user_id"){
   const output:Record<string,unknown>[]=[];
   let page=0,more=true;
   while(more&&page<40){
    const a=page*500,b=a+499;
    const orders:Record<string,string[]>={enrollments:["course_id"],pilot_ai_grades:["attempt_id"],student_diagnostic_runs:["course_id"],student_training_sessions:["course_id","session_number"],student_training_answers:["course_id","session_number","item_id"],student_level_completions:["course_id","level_number"]};
    let query=admin.from(table).select("*").eq(key,uid);
    for(const field of orders[table]||["id"])query=query.order(field,{ascending:true});
    const q=await query.range(a,b);
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
  // An incomplete archive must never be advertised as a successful export.
  // The administrator can use a paginated archival job if any table exceeds
  // the protective export cap. No existing student data is changed here.
  if(truncated.length)return reply({ok:false,error:"export_incomplete",tables:truncated},409);
  const ids=(data.attempts as Array<{id:string}>).map(a=>a.id);
  const human:unknown[]=[];
  for(let i=0;i<ids.length;i+=100){
   const q=await admin.from("pilot_human_grades").select("*").in("attempt_id",ids.slice(i,i+100));
   if(q.error)throw new Error("pilot_human_grades_fetch_failed: "+q.error.message);
   human.push(...(q.data||[]));
  }
  data.pilot_human_grades=human;
  const referenced=new Set<string>();
  function collect(value:any){if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==="object"){if(typeof value.item_id==="string")referenced.add(value.item_id);if(typeof value.id==="string")referenced.add(value.id);for(const key of ["answers","draft","tasks_json","items","question_snapshot"])if(value[key])collect(value[key]);}}
  collect(data.attempts);collect(data.student_training_answers);collect(data.student_training_sessions);collect(data.student_diagnostic_runs);
  const itemIds=[...referenced];
  const items:unknown[]=[];
  for(let i=0;i<itemIds.length;i+=100){
   const q=await admin.from("content_items").select("id,prompt_ar,dimension,course_id,source_ids,options_json,rubric_json,metadata").in("id",itemIds.slice(i,i+100));
   if(q.error)throw new Error("content_items_fetch_failed: "+q.error.message);
   items.push(...(q.data||[]));
  }
  if((data.student_diagnostic_runs as any[]).length){
    const diagnosticQuestions=await admin.from("content_items").select("id,prompt_ar,dimension,course_id,source_ids,options_json,rubric_json,metadata").eq("course_id","qa-qu-lawc101-rights").limit(1000);
    if(diagnosticQuestions.error)throw Error("diagnostic_questions_fetch_failed");
    if((diagnosticQuestions.data||[]).length>=1000)throw Error("diagnostic_question_limit");
    items.push(...(diagnosticQuestions.data||[]).filter((q:any)=>q.metadata?.official_diagnostic_v2_id));
  }
  data.questions=items;
  const sourceIds=[...new Set((items as any[]).flatMap(q=>q.source_ids||[]))];
  const sourceRows:any[]=[];
  for(let i=0;i<sourceIds.length;i+=100){const found=await admin.from("content_sources").select("id,excerpt,status").in("id",sourceIds.slice(i,i+100));if(found.error)throw Error("legal_sources_fetch_failed");sourceRows.push(...(found.data||[]));}
  data.legal_sources=sourceRows.map(s=>/^qa-civil-2004-art(?:39|[4-5][0-9]|6[0-3])$/.test(s.id)?legalSources([s])[0]:s);
  const exportedCounts=Object.fromEntries(Object.entries(data).filter(([,rows])=>Array.isArray(rows)).map(([table,rows])=>[table,(rows as unknown[]).length]));
  return reply({ok:true,student:prof.data,records:data,truncated:[],export_counts:exportedCounts,generated_at:new Date().toISOString()});
 }catch(e){
  const m=e instanceof Error?e.message:String(e);
  return reply({error:m},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:503);
 }
});