"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

async function check(lang){
 const store=new Map(),elements=new Map(),sent=[],ids=[];
 const el=()=>({value:"",textContent:"",onclick:null,focus(){this.focused=true;},
   set innerHTML(html){this._html=String(html);for(const x of this._html.matchAll(/\\bid="([^"]+)"/g))elements.set(x[1],el());},
   get innerHTML(){return this._html||"";}});
 const app=el();
 const document={
   documentElement:{lang},
   getElementById(id){return id==="showcaseApp"?app:elements.get(id)||null;},
   querySelectorAll(){return []},
   createElement(){return el()}
 };
 const newReceipt={
   received:true,submission_id:"revised-submission",grade_status:"rule_assessed",recall_score:29,
   choice_indicators:{understanding:25},details:{reason:"evidenced_elements",criteria:[],points:2,provider:"none"},
   feedback:"Provisional evidence only"
 };
 const db={auth:{getSession:async()=>({data:{session:{access_token:"test"}}})},
  functions:{invoke:async(name,opts)=>{assert.equal(name,"showcase-grade");sent.push(opts.body);return {data:newReceipt};}}};
 let uuid=0;
 const context={document,window:{LEX_QUALITY:{},LEX_SHOWCASE_CYCLE:{recommend:()=>"balanced"},
   LEX_RECALL:{assess:()=>({details:{},recall_score:null})},
   LEX_CLOUD:{isConfigured:()=>true,db:()=>db}},
   sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
   crypto:{randomUUID:()=>{let id="00000000-0000-4000-8000-"+String(++uuid).padStart(12,"0");ids.push(id);return id;}},
   setTimeout,clearTimeout,Date,console};
 context.window.window=context.window;
 context.LEX_CLOUD=context.window.LEX_CLOUD;
 vm.createContext(context);
 let source=fs.readFileSync("assets/showcase"+(lang==="en"?"-en":"")+".js","utf8");
 source=source.replace(/\\}\\)\\(\\);\\s*$/, `window.__test={show:function(receipt,initial){
   free=initial;requestId="00000000-0000-4000-8000-000000000099";
   answers=["recall","recall","understanding","understanding","understanding","understanding"].map(type=>({type,selected:0,correct:true}));
   lastDemo={receipt,grade:receipt,summary:{metrics:{recall:null,understanding:25},weak:"balanced"}};
   resultScreen();
  }};})();`);
 vm.runInContext(source,context);
 const prior={received:true,submission_id:"original-submission",grade_status:"insufficient_evidence",
  recall_score:null,choice_indicators:{understanding:25},details:{reason:"incomplete_proposition",criteria:[]},
  feedback:"Not assessed"};
 context.window.__test.show(prior,"الولادة حيا");
 assert(elements.get("editFreeAnswer"),"revision CTA shown on results");
 elements.get("editFreeAnswer").onclick();
 const field=elements.get("revisedFreeAnswer");
 assert.equal(field.value,"الولادة حيا","old text retained for editing");
 elements.get("submitRevisedFree").onclick();
 assert(elements.get("revisedFreeError").textContent.length>0,"unchanged text must not create another submission");
 assert.equal(sent.length,0);
 const improved="تبدأ الشخصية القانونية بالولادة حية، وتنتهي بالموت، ويثبت للحمل المستكن حق لا يحتاج إلى قبول بشرط أن يولد حيا.";
 field.value=improved;
 elements.get("submitRevisedFree").onclick();
 const pending=JSON.parse(store.get("lexlearn-demo-v3-"+lang));
 assert.equal(pending.receipt,null,"old receipt must not be reused with revised request id");
 assert.equal(pending.free,improved);
 assert.notEqual(pending.requestId,"00000000-0000-4000-8000-000000000099");
 await new Promise(ok=>setTimeout(ok,10));
 assert.equal(sent.length,1,"edited answer should be sent once");
 assert.equal(sent[0].answer,improved);
 assert.equal(sent[0].request_id,pending.requestId);
 assert.equal(sent[0].choices.length,6,"diagnostic answers are retained rather than retaken");
 assert(elements.get("editFreeAnswer"),"another review opportunity remains after provisional grade");
 assert(app.innerHTML.includes("revised-submission"),"new receipt shown without pretending old attempt overwritten");
}
(async()=>{await check("ar");await check("en");console.log("Showcase revise-and-resubmit, immutable receipt, both languages: PASS");})().catch(err=>{console.error(err);process.exit(1);});
