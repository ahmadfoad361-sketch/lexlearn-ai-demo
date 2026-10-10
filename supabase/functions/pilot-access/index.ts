import {corsHeaders,json,requireUser} from "../_shared/auth.ts";

// Authenticated student-only access probe: never disclose tester IDs or unreleased content.
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 try{
  const {user,profile,admin}=await requireUser(req);
  if(profile.role!=="student")return json({error:"student_only"},403);
  const released=new Set((Deno.env.get("PILOT_RELEASE_TOPICS")||"").split(",").map(s=>s.trim()).filter(Boolean));
  const testers=new Set((Deno.env.get("PILOT_QA_STUDENT_IDS")||"").split(",").map(s=>s.trim()).filter(Boolean));
  const qa=testers.has(user.id);
  const topics:number[]=[];
  for(const topic of [1,22]){
   if(!qa&&!released.has(String(topic)))continue;
   const ids=["recall","understanding","exam"].map(skill=>"rights-v1-s"+topic+"-"+skill);
   const r=await admin.from("content_items").select("id,status").in("id",ids);
   if(!r.error&&r.data?.length===3&&r.data.every((x:any)=>x.status==="approved"))topics.push(topic);
  }
  return json({allowed:topics.length>0,qa,topics});
 }catch(e){
  const code=e instanceof Error?e.message:"";
  return json({error:code==="UNAUTHORIZED"||code==="FORBIDDEN"?code:"internal_error"},code==="UNAUTHORIZED"?401:code==="FORBIDDEN"?403:500);
 }
});
