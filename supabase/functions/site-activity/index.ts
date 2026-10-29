import {adminClient} from "../_shared/auth.ts";
const allowedOrigins=new Set(["https://ahmadfoad361-sketch.github.io","https://lexlearnsmart.com","https://www.lexlearnsmart.com"]);
const baseHeaders={"Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Vary":"Origin"};
const pages=new Set(["index.html","index-en.html","conference.html","showcase.html","showcase-en.html","showcase-level1.html","showcase-level1-en.html","program.html","program-en.html","diagnostic.html","student-practice.html","student-path.html","student-profile.html","student.html","student-en.html","student-login.html","student-login-en.html","student-register.html","student-register-en.html","privacy.html","privacy-en.html","terms.html","terms-en.html"]);
const uuid=(value:unknown)=>typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin")||"";
 const headers:Record<string,string>={...baseHeaders};
 if(allowedOrigins.has(origin))headers["Access-Control-Allow-Origin"]=origin;
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(!allowedOrigins.has(origin))return reply({error:"origin_not_allowed"},403);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"method_not_allowed"},405);
 try{
  if(Number(req.headers.get("content-length"))>2048)return reply({error:"invalid_event"},400);
  const raw=await req.text();if(raw.length>2048)return reply({error:"invalid_event"},400);
  const b=JSON.parse(raw);
  if(!uuid(b.event_id)||!uuid(b.visitor_id)||!uuid(b.session_id)||!pages.has(b.page))return reply({error:"invalid_event"},400);
  const admin=adminClient();let userId:string|null=null;
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer /i,"");
  if(token){
   const {data,error}=await admin.auth.getUser(token);
   if(error||!data.user)return reply({error:"UNAUTHORIZED"},401);
   const p=await admin.from("profiles").select("id,role,active").eq("id",data.user.id).single();
   if(p.data?.active&&["student","instructor"].includes(p.data.role))userId=p.data.id;
  }
  // A rotating HMAC is used only for short-lived rate limiting. No IP is stored.
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const network=(req.headers.get("x-forwarded-for")||"unknown").split(",")[0].trim();
  const hash=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(new Date().toISOString().slice(0,13)+"|"+network));
  const fingerprint=Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,"0")).join("");
  const {data,error}=await admin.rpc("lex_record_site_activity",{p_event:b.event_id,p_visitor:b.visitor_id,p_session:b.session_id,p_user:userId,p_page:b.page,p_network:fingerprint});
  if(error)return reply({error:"activity_unavailable"},503);
  return reply({ok:data===true},data===true?200:429);
 }catch(_){return reply({error:"invalid_event"},400);}
});
