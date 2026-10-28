import {corsHeaders,json,requireStaff} from "../_shared/auth.ts";
const ORIGIN="https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/";
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 try{
  const {user,admin}=await requireStaff(req);
  const body=await req.json(),action=String(body.action||"list");
  if(!["list","save","assign","approve","pause","invite"].includes(action))return json({error:"invalid_action"},400);
  const data={...(body.data||{})};let token="";
  if(action==="invite"){
   token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,"0")).join("");
   data.token_hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,"0")).join("");
  }
  const result=await admin.rpc("lex_admin_trials",{p_actor:user.id,p_action:action,p_data:data});
  if(result.error)return json({error:result.error.message},409);
  // Older paused accounts may have an Auth ban. Unban only after the database approval succeeds.
  const failed:string[]=[];
  if(action==="approve")for(const id of data.user_ids||[]){
   const r=await admin.auth.admin.updateUserById(id,{ban_duration:"none"});if(r.error)failed.push(id);
  }
  return json({ok:true,...result.data,...(token?{invitation_url:ORIGIN+"student-register.html#invite="+token}:{}),...(failed.length?{auth_unban_failed:failed}:{} )});
 }catch(e){const m=e instanceof Error?e.message:"unavailable";return json({error:m},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500);}
});
