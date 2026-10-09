const assert=require('assert'),fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('supabase/functions/pilot-grade/index.ts','utf8').replace(/^import .*;\n/,'').replace(/^type Criterion=.*;\n/m,'').replace(/:Record<number,string\[\]>/g,'').replace(/:Criterion\[\]/g,'').replace(/:number\b|:string\b|:any\b/g,'');
const ID='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
async function run(options={}){
 let handler,modelInput,saved=null;
 const attempt={id:ID,user_id:'student',course_id:'qa-qu-lawc101-rights',selected_option:'pilot:s1:step5:20261009.3',answer_text:options.answer||'الموت ينهي الشخصية؛ ثبتت الوفاة فلا ينتظر إغلاق الحساب، وانتهت الشخصية بالوفاة.',grading_method:'pilot_human_pending',score:null};
 const admin={from(table){const q={select(){return q;},eq(){return q;},in(){return q;},gte(){return q;},single:async()=>table==='attempts'?{data:options.foreign?{...attempt,user_id:'other'}:attempt}:{data:saved,error:null},maybeSingle:async()=>({data:null}),insert:function(row){saved=row;return q;},then(resolve){resolve(table==='content_items'?{data:['recall','understanding','exam'].map(id=>({id,status:options.draft?'legal_review':'approved'}))}:table==='content_sources'?{data:options.sources===false?[]:[{id:'qa-civil-2004-art39',status:'approved',excerpt:'تبدأ شخصية الإنسان بتمام ولادته حياً، وتنتهي بموته.'},{id:'qa-civil-2004-art40',status:'approved',excerpt:'الحمل المستكن أهل لثبوت الحقوق بشرط ولادته حياً.'}]}:{count:0});}};return q;}};
 const context={Response,Date,JSON,Number,String,Error,Set,console,corsHeaders:{},json:(body,status=200)=>({body,status}),requireUser:async()=>({user:{id:'student'},profile:{role:options.staff?'instructor':'student'},admin}),Deno:{env:{get:k=>options.noKey?undefined:k==='OPENAI_MODEL'?'test-model':'test-key'},serve:h=>handler=h},fetch:async(url,init)=>{modelInput=JSON.parse(init.body);const rubric=JSON.parse(modelInput.input).criteria;let response=options.bad?{score:1,achieved:[{id:'invented',evidence:'الموت'}],missing:[],contradictions:[],feedback:'محاولة تحتاج تدقيقًا للقاعدة.',confidence:.91,needs_review:false}:options.wrong?{score:0,achieved:[],missing:rubric.map(c=>c.id),contradictions:['ينسب انتهاء الشخصية إلى إغلاق الحساب'],feedback:'انتهاء الشخصية يكون بالموت؛ لا يتوقف على إغلاق الحساب.',confidence:.91,needs_review:false}:{score:1,achieved:rubric.map(c=>({id:c.id,evidence:'الموت'})),missing:[],contradictions:[],feedback:'ربطت الوفاة بانتهاء الشخصية ورفضت شرط الحساب البنكي.',confidence:.91,needs_review:false};return {ok:true,json:async()=>({output_text:JSON.stringify(response)})};}};
 vm.runInNewContext(code,context);
 const result=await handler({method:'POST',json:async()=>options.preview?{preview:true,topic:1,stage:'step5',answer:attempt.answer_text,language:'ar'}:{attempt_id:ID,language:'ar'}});
 return {result,saved,modelInput};
}
(async()=>{
 let r=await run();assert.equal(r.result.body.passed,true);assert.equal(r.saved.status,'scored');assert.deepEqual(Array.from(r.saved.source_ids),['qa-civil-2004-art39','qa-civil-2004-art40']);assert.equal(r.modelInput.store,false);
 r=await run({wrong:true});assert.equal(r.result.body.passed,false);assert.equal(r.saved.score,0);
 r=await run({bad:true});assert.equal(r.result.body.status,'review_required');assert.equal(r.saved.score,null);
 assert.equal((await run({draft:true})).result.status,422);
 assert.equal((await run({sources:false})).result.status,422);
 assert.equal((await run({foreign:true})).result.status,403);
 assert.equal((await run({noKey:true})).result.status,503);
 assert.equal((await run({preview:true})).result.status,403);
 r=await run({preview:true,staff:true,draft:true});assert.equal(r.result.body.preview,true);assert.equal(r.saved,null);
 console.log('Pilot auto grader: authenticated, sourced, validated and monitored paths PASS');
})().catch(e=>{console.error(e);process.exit(1);});
