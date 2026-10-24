import {corsHeaders,json as respond,requireUser} from "../_shared/auth.ts";
const json=(body:unknown,status=200)=>{const r=respond(body,status);r.headers.set("Cache-Control","no-store, private");return r;};
const fields="id,role,username,display_name,university,faculty,academic_section,year_label,country_code,lexlearn_number,avatar_data_url";
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 try{
  const {user,profile,admin}=await requireUser(req);
  if(profile.role!=="student")return json({error:"student_only"},403);
  const body=await req.json();
  if(body.action==="update"){
   const patch:Record<string,unknown>={};
   for(const key of ["display_name","university","faculty","academic_section","year_label"]){
    if(key in body){const value=String(body[key]??"").trim();if(value.length>140||key==="display_name"&&value.length<2)return json({error:"invalid_profile_field"},400);patch[key]=value;}
   }
   if("avatar_data_url" in body){
    const value=body.avatar_data_url;
    if(value!==null){
     if(typeof value!=="string"||value.length>200000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value))return json({error:"invalid_photo"},400);
     let bytes;try{bytes=atob(value.split(",")[1]);}catch(_){return json({error:"invalid_photo"},400);}
     if(bytes.length<4||bytes.charCodeAt(0)!==255||bytes.charCodeAt(1)!==216||bytes.charCodeAt(2)!==255)return json({error:"invalid_photo"},400);
    }
    patch.avatar_data_url=value;
   }
   if(!Object.keys(patch).length)return json({error:"no_allowed_fields"},400);
   const r=await admin.from("profiles").update(patch).eq("id",user.id).select(fields).single();
   if(r.error)throw Error("profile_save_failed");
   return json({ok:true,profile:r.data});
  }
  if(body.action!=="get")return json({error:"invalid_action"},400);
  const r=await admin.from("profiles").select(fields).eq("id",user.id).single();
  if(r.error)throw Error("profile_load_failed");
  return json({ok:true,profile:r.data});
 }catch(e){const m=e instanceof Error?e.message:String(e);return json({error:m},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:503);}
});
