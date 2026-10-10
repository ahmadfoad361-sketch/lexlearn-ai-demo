import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
};

export function json(body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json; charset=utf-8"}});
}
export function adminClient(){
  return createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
}
export async function requireStaff(req:Request){
  const auth=req.headers.get("Authorization")||"";
  const userClient=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:{user},error}=await userClient.auth.getUser();
  if(error||!user)throw new Error("UNAUTHORIZED");
  const admin=adminClient();
  const {data:profile,error:pe}=await admin.from("profiles").select("id,role,active,display_name").eq("id",user.id).single();
  if(pe||!profile||profile.active===false||!["owner","admin","instructor"].includes(profile.role))throw new Error("FORBIDDEN");
  return {user,profile,admin};
}
export async function requireUser(req:Request){
  const auth=req.headers.get("Authorization")||"";
  const userClient=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:{user},error}=await userClient.auth.getUser();
  if(error||!user)throw new Error("UNAUTHORIZED");
  const admin=adminClient();
  const {data:profile}=await admin.from("profiles").select("id,role,active").eq("id",user.id).single();
  if(!profile||profile.active===false)throw new Error("FORBIDDEN");
  return {user,profile,admin};
}

export async function requireContentReviewer(req:Request){
  const auth=req.headers.get("Authorization")||"";
  const userClient=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:{user},error}=await userClient.auth.getUser();
  if(error||!user)throw new Error("UNAUTHORIZED");
  const admin=adminClient();
  const {data:profile,error:pe}=await admin.from("profiles").select("id,role,active,display_name").eq("id",user.id).single();
  if(pe||!profile||profile.active===false||!["owner","admin","instructor","content_reviewer"].includes(profile.role))throw new Error("FORBIDDEN");
  return {user,profile,admin};
}
