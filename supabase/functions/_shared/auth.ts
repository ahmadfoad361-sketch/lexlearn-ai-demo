import { createClient } from "npm:@supabase/supabase-js@2";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

export function json(data: unknown, status=200){
  return new Response(JSON.stringify(data),{status,headers:cors});
}

export async function context(req: Request){
  const url=Deno.env.get("SUPABASE_URL")||"";
  const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  const authorization=req.headers.get("Authorization")||"";
  if(!authorization) throw new Error("missing_authorization");
  const userClient=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const token=authorization.replace(/^Bearer\s+/i,"");
  const {data:{user},error}=await userClient.auth.getUser(token);
  if(error||!user) throw new Error("not_authenticated");
  const adminClient=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:profile,error:pe}=await adminClient.from("profiles").select("*").eq("id",user.id).single();
  if(pe||!profile||profile.active===false) throw new Error("inactive_profile");
  return {user,userClient,adminClient,profile};
}

export function requireStaff(profile:any){
  if(!["owner","admin","instructor","content_reviewer"].includes(profile.role)) throw new Error("staff_required");
}

export function randomPassword(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b)=>chars[b%chars.length]).join("");
}
