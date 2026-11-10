'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
async function harness(role='admin'){
 const nodes=new Map(),calls=[];let uuid=0,response={data:{status:'ready_for_review',draft_id:'draft-1',question:{title_ar:'<img src=x onerror=bad()>',question_ar:'سؤال تجريبي',reference_answer_ar:'إجابة للمراجعة',legal_explanation_ar:'تعليل',rubric_criteria:[{criterion_ar:'<script>bad()</script>',maximum_points:2}],source_ids:['law-39'],research_study_ids:['study-1']}}};
 function node(id){if(!nodes.has(id))nodes.set(id,{value:id==='evidenceCount'?'2':id==='course'?'course-1':id==='skill'?'recall':'',selectedOptions:id==='sources'?[{value:'law-39'}]:[],innerHTML:'',textContent:'',style:{},hidden:true,disabled:id==='generate',checked:false,events:{},addEventListener(type,fn){this.events[type]=fn;}});return nodes.get(id);}
 const db={functions:{invoke:async(name,{body})=>{calls.push({name,body});if(name==='lexlearn-research-guidance')return {data:body.action==='catalog'?{studies:[],rules:[]}:{courses:[],approved_sources:[]}};return typeof response==='function'?response():response;}}};
 const context={window:{LEX_CLOUD:{isConfigured:()=>true,profile:async()=>({role,active:true}),db:()=>db}},document:{getElementById:node},crypto:{randomUUID:()=>`request-${++uuid}`},console};
 vm.runInNewContext(fs.readFileSync('assets/admin-research.js','utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));
 return {nodes,node,calls,setResponse:r=>response=r,generate:()=>node('generate').events.click(),clear:()=>node('clear').events.click(),draftCalls:()=>calls.filter(c=>c.name==='lexlearn-research-question-draft')};
}
test('loading staff console never generates a paid draft; nonstaff cannot trigger one',async()=>{
 for(const role of ['admin','owner','student','instructor']){const h=await harness(role);assert.equal(h.draftCalls().length,0);h.node('draftCostConsent').checked=true;if(['student','instructor'].includes(role)){await h.generate();assert.equal(h.draftCalls().length,0);assert.equal(h.node('generate').disabled,true);}}
});
test('explicit cost consent and valid legal sources are required',async()=>{
 const h=await harness();await h.generate();assert.equal(h.draftCalls().length,0);h.node('draftCostConsent').checked=true;h.node('sources').selectedOptions=[];await h.generate();assert.equal(h.draftCalls().length,0);h.node('sources').selectedOptions=[{value:'law-39'}];h.node('evidenceCount').value='-1';await h.generate();assert.equal(h.draftCalls().length,0);
});
test('network uncertainty reuses request key; changed inputs cannot silently create another charge',async()=>{
 const h=await harness();h.node('draftCostConsent').checked=true;h.setResponse(async()=>{throw Error('network lost');});await h.generate();await h.generate();assert.equal(h.draftCalls().length,2);assert.equal(h.draftCalls()[0].body.request_key,h.draftCalls()[1].body.request_key);h.node('skill').value='application';await h.generate();assert.equal(h.draftCalls().length,2);
});
test('double click is ignored while request is in flight; returned HTML is escaped',async()=>{
 const h=await harness();h.node('draftCostConsent').checked=true;let resolve;h.setResponse(()=>new Promise(r=>resolve=r));const first=h.generate();await h.generate();assert.equal(h.draftCalls().length,1);assert.equal(h.node('clear').disabled,true);h.clear();resolve({data:{status:'ready_for_review',draft_id:'<x>',question:{title_ar:'<script>bad()</script>',question_ar:'Q',reference_answer_ar:'A',legal_explanation_ar:'R',rubric_criteria:[],source_ids:[],research_study_ids:[]}}});await first;assert.match(h.node('generated').innerHTML,/&lt;script&gt;/);assert.doesNotMatch(h.node('generated').innerHTML,/<script>/);assert.equal(h.node('clear').disabled,false);
});
test('reserved and failed outcomes are reported without automatic retry; clear requires renewed consent',async()=>{
 const h=await harness();h.node('draftCostConsent').checked=true;h.setResponse({data:{status:'reserved'}});await h.generate();assert.match(h.node('status').textContent,/قيد التوليد/);h.setResponse({data:{status:'failed'}});await h.generate();assert.match(h.node('status').textContent,/لن نكرر/);const old=h.draftCalls()[0].body.request_key;h.clear();assert.equal(h.node('draftCostConsent').checked,false);h.node('course').value='course-1';await h.generate();assert.equal(h.draftCalls().length,2);h.node('draftCostConsent').checked=true;await h.generate();assert.notEqual(h.draftCalls()[2].body.request_key,old);
});
