import { corsHeaders,json,requireContentReviewer } from "../_shared/auth.ts";

const nextStatus:Record<string,string>={
  draft:"legal_review",
  legal_review:"learning_review",
  learning_review:"approved"
};

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  try{
    const {user,profile,admin}=await requireContentReviewer(req);
    const b=await req.json(),itemId=String(b.item_id||""),action=String(b.action||"advance");
    if(!itemId)return json({error:"item_id_required"},400);
    const current=await admin.from("content_items").select("id,status,course_id,metadata,legal_reviewer,learning_reviewer").eq("id",itemId).single();
    if(current.error||!current.data)return json({error:"item_not_found"},404);
    let target=current.data.status;
    if(action==="advance"){
      target=nextStatus[current.data.status];
      if(!target)return json({error:"no_valid_next_status"},409);
      if(current.data.status==="legal_review"&&b.review_type==="learning")
        return json({error:"legal_review_must_precede_learning_review"},409);
      if(current.data.status==="learning_review"&&current.data.legal_reviewer===user.id)
        return json({error:"second_reviewer_required"},409);
    }else if(action==="retire"){
      target="retired";
    }else if(action==="return_to_legal_review"){
      target="legal_review";
    }else return json({error:"unknown_action"},400);

    const patch:any={status:target,reviewed_at:new Date().toISOString()};
    if(target==="learning_review")patch.legal_reviewer=user.id;
    if(target==="approved")patch.learning_reviewer=user.id;
    const r=await admin.from("content_items").update(patch).eq("id",itemId).select("id,status,course_id,reviewed_at").single();
    if(r.error)throw r.error;
    await admin.from("admin_audit").insert({
      actor_user_id:user.id,
      action:"CONTENT_"+target.toUpperCase(),
      details:{item_id:itemId,from:current.data.status,to:target,course_id:current.data.course_id}
    });
    return json({ok:true,item:r.data});
  }catch(e){
    const m=e instanceof Error?e.message:String(e);
    return json({error:m},m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500);
  }
});
