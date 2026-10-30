/* Offline regression: no API calls or student records. Run: node --test scripts/qa-level-one-grading.mjs */
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {test} from "node:test";
import assert from "node:assert/strict";

const source=readFileSync(new URL("../assets/official-level-one.js",import.meta.url),"utf8");
function setup(initialConsent=false){
 const root={},module={exports:{}};
 runInNewContext(source,{window:root,module,console});
 const tasks=["understanding","recall","exam"].map((part,i)=>({
  id:"rights-v1-s1-"+part,dimension:part,
  title_ar:"السؤال "+(i+1),title_en:"Question "+(i+1),
  prompt_ar:"اشرح القاعدة القانونية بدقة وفق المواد المطلوبة.",
  prompt_en:"Explain the legal rule and its meaning accurately."
 }));
 let consent=initialConsent,grades=0,consents=0,submissions=0,saved=[];
 const textarea={value:"تبدأ الشخصية القانونية بالولادة حياً."};
 const controls={save:{disabled:false},grant:{disabled:false},message:{textContent:""}};
 const host={innerHTML:"",querySelector(selector){
  return {"#officialSaveAnswer":controls.save,"#officialEssayAnswer":textarea,
   "#levelOneConsent":controls.grant,"#officialSaveMessage":controls.message}[selector]||null;
 },querySelectorAll(){return[];}};
 const snapshot=()=>({allowed:true,tasks,saved:saved.slice(),reason_ar:"تدريب متوازن",plan_mode:"balanced"});
 const cloud={
  studentLifecycleRpc:async(action,payload)=>{
   if(action==="firstLevel")return snapshot();
   if(action==="submitLevelOne"){
    submissions++;
    saved.push({item_id:payload.itemId,evaluation:{status:"preliminary_internal",provisional_percent:40}});
    return snapshot();
   }
   throw Error("unexpected action");
  },
  getConsent:async()=>consent?{accepted:true}:null,
  recordConsent:async()=>{consent=true;consents++;return{accepted:true}},
  gradeLevelOneAi:async(itemId)=>{
   grades++;
   saved.find(x=>x.item_id===itemId).evaluation={
    status:"preliminary_ai",rubric_version:"lexlearn-training-ai-v4",
    provisional_percent:50,feedback_ar:"جزء صحيح وجزء يحتاج استكمالًا.",criteria:[
     {id:"birth",label_ar:"بدء الشخصية",credit:1,evidence:"تبدأ الشخصية",explanation_ar:"صحيح"},
     {id:"death",label_ar:"انتهاء الشخصية",credit:0.5,evidence:"بالولادة حياً",explanation_ar:"ينقص شرط"}
    ]
   };
   return{status:"preliminary_ai"};
  }
 };
 return {mount:()=>module.exports.mount(host,{lang:"ar",cloud}),host,controls,counts:()=>({grades,consents,submissions})};
}

test("No external grading without the learner's explicit consent",async()=>{
 const app=setup(false);await app.mount();
 assert.match(app.host.innerHTML,/levelOneConsent/);
 await app.controls.save.onclick();
 assert.equal(app.counts().submissions,1);
 assert.equal(app.counts().grades,0);
});

test("After consent, grading uses the saved answer and renders criterion feedback",async()=>{
 const app=setup(false);await app.mount();
 await app.controls.grant.onclick();
 assert.equal(app.counts().consents,1);
 await app.controls.save.onclick();
 assert.equal(app.counts().grades,1);
 assert.match(app.host.innerHTML,/تصحيح دلالي مبدئي/);
 assert.match(app.host.innerHTML,/صحيح جزئيًا/);
 assert.match(app.host.innerHTML,/تقييم تدريبي غير معتمد/);
});

test("Existing learner consent does not trigger grading until an answer exists",async()=>{
 const app=setup(true);await app.mount();
 assert.equal(app.counts().grades,0);
 await app.controls.save.onclick();
 assert.equal(app.counts().grades,1);
});
