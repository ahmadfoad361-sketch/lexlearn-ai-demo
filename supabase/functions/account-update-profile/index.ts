import { corsHeaders,json,requireUser } from "../_shared/auth.ts";

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  try{
    const {user,admin}=await requireUser(req);
    const b=await req.json(),patch:any={};
    if("country_code" in b){
      const country=String(b.country_code||"").toLowerCase();
      if(!["qa","eg"].includes(country))return json({error:"unsupported_country"},400);
      patch.country_code=country;
    }
    if("locale" in b){
      const locale=String(b.locale||"ar");
      if(!["ar","en"].includes(locale))return json({error:"unsupported_locale"},400);
      patch.locale=locale;
    }
    if("display_name" in b){
      const name=String(b.display_name||"").trim();
      if(!name)return json({error:"display_name_required"},400);
      patch.display_name=name;
    }
    if(!Object.keys(patch).length)return json({error:"no_allowed_fields"},400);
    const r=await admin.from("profiles").update(patch).eq("id",user.id).select("id,username,display_name,country_code,locale").single();
    if(r.error)throw r.error;
    await admin.from("activity_events").insert({user_id:user.id,event_type:"UPDATE_PROFILE",event_data:{fields:Object.keys(patch)}});
    return json({ok:true,profile:r.data});
  }catch(e){
    const m=e instanceof Error?e.message:String(e);
    return json({error:m},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500);
  }
});
