import {corsHeaders,json,requireStaff} from "../_shared/auth.ts";
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 try{
  const {admin}=await requireStaff(req);
  const b=await req.json(),days=Number(b.days??7),page=Number(b.page??0);
  if(![1,7,30,90].includes(days)||!Number.isInteger(page)||page<0||page>100000)return json({error:"invalid_period"},400);
  const result=await admin.rpc("lex_site_activity_report",{p_days:days,p_page:page});
  if(result.error||!result.data)return json({error:"report_unavailable"},503);
  const report=result.data;
  // Auth is accessed on the server only. Failure is 'unavailable', never 'never logged in'.
  for(let start=0;start<report.accounts.length;start+=5){
   await Promise.all(report.accounts.slice(start,start+5).map(async(account:{id:string;last_sign_in_at?:string|null;login_available?:boolean})=>{
    const r=await admin.auth.admin.getUserById(account.id);
    account.login_available=!r.error&&!!r.data?.user;
    account.last_sign_in_at=account.login_available?r.data.user?.last_sign_in_at||null:null;
   }));
  }
  return json({ok:true,...report});
 }catch(e){const code=e instanceof Error?e.message:"error";return json({error:code==="UNAUTHORIZED"||code==="FORBIDDEN"?code:"report_unavailable"},code==="UNAUTHORIZED"?401:code==="FORBIDDEN"?403:503);}
});
