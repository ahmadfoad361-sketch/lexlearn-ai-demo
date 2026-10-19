const assert=require("node:assert/strict");
const fs=require("node:fs");
const D=require("../assets/official-diagnostic.js");
const law={q39r:["qa-civil-2004-art39"],q49r:["qa-civil-2004-art49"],
 q62r:["qa-civil-2004-art62"],q39u:["qa-civil-2004-art39"],
 q50u:["qa-civil-2004-art39","qa-civil-2004-art50"],
 q63a:["qa-civil-2004-art63"]};
for(const q of D.QUESTIONS){
 const x={status:"approved",reviewed_at:null,legal_reviewer:null,learning_reviewer:null,
  metadata:{official_diagnostic_v2_id:q.id,owner_pilot_approved:true,
    pilot_review_mode:"founder_authorized_ai_assisted_20261019",legal_approval:false,learning_approval:false},
  prompt_ar:q.ar,options_json:{ar:q.arOptions,en:q.enOptions},
  rubric_json:{prompt_en:q.en},answer_key_json:{correct_index:q.a},source_ids:law[q.id]};
 assert.ok(D.exactApprovedQuestion(x,q),"founder-reviewed exact item "+q.id);
 for(const patch of [
  {metadata:{...x.metadata,owner_pilot_approved:false}},
  {metadata:{...x.metadata,legal_approval:true}},
  {metadata:{...x.metadata,pilot_review_mode:"fake"}},
  {answer_key_json:{correct_index:(q.a+1)%3}},
  {source_ids:[]},{prompt_ar:"unreviewed content"}]){
  assert.equal(D.exactApprovedQuestion({...x,...patch},q),false,"tampered pilot item must be rejected");
 }
}
const sql=fs.readFileSync("supabase/migrations/20261019_004_founder_authorized_pilot_release.sql","utf8");
assert.ok(sql.includes("academic_approved,founder_pilot_approved,published"));
assert.ok(sql.includes("values('qa-qu-lawc101-rights',1,false,true,true"));
assert.ok(sql.includes("legal_reviewer is null and learning_reviewer is null"));
assert.ok(sql.includes("legal_approval\":false")&&sql.includes("learning_approval\":false"));
assert.ok(!sql.includes("update public.student_level_completions"));
console.log("Founder pilot opt-in provenance and exact legal questions: PASS");