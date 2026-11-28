'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const flow=require('../assets/learning-rounds.js');
test('help fades only after repeated valid comparable performance',()=>{
 assert.equal(flow.supportLevel([]),'example');
 assert.equal(flow.supportLevel([{percent:59}]),'example');
 assert.equal(flow.supportLevel([{percent:65}]),'partial');
 assert.equal(flow.supportLevel([{percent:90},{percent:80}]),'hint');
 assert.equal(flow.supportLevel([{percent:90},{percent:90},{percent:85}]),'none');
 assert.equal(flow.supportLevel([{percent:90},{percent:20},{percent:90}]),'partial');
 for(const percent of [NaN,Infinity,-1,101,'90',null])assert.equal(flow.supportLevel([{percent}]),'example');
});
const base={id:'synthetic',sources:['qa-civil-2004-art49'],rule_ar:'قاعدة تدريب اصطناعية',rule_en:'Synthetic practice rule',prompt_ar:'الواقعة: عمره عشرون عامًا.\nالسؤال: ما أثر ذلك؟',prompt_en:'Facts: The person is twenty.\nQuestion: What follows?',outcome_ar:'نتيجة اصطناعية',outcome_en:'Synthetic result'};
test('only complete bilingual approved formats are offered',()=>{
 assert.deepEqual(flow.variants([{...base,dimension:'exam_execution'}]).map(x=>x.kind),['application']);
 assert.equal(flow.variants([{...base,dimension:'exam_execution',outcome_en:''}]).length,0);
 const comparison={...base,dimension:'understanding',comparison_ar:['صحيح','خطأ'],comparison_en:['accurate','inaccurate'],inaccurate_ar:['خطأ']};
 assert.deepEqual(flow.variants([comparison]).map(x=>x.kind),['explain','correct_error','classify']);
 assert.deepEqual(flow.variants([{...comparison,inaccurate_ar:['غير مطابق']}]).map(x=>x.kind),['explain']);
 assert.deepEqual(flow.variants([{...base,sources:[],dimension:'recall'}]),[]);
});
test('a four-topic review retains tasks sharing a format but not a topic',()=>{
 const first={...base,id:'review-first',dimension:'recall'};
 const fourth={...base,id:'review-fourth',dimension:'recall',title_ar:'الموضوع الرابع',title_en:'Fourth review topic'};
 const options=flow.variants([first,{...base,id:'review-second',dimension:'understanding'},{...base,id:'review-third',dimension:'exam_execution'},fourth,first]);
 assert.deepEqual(options.filter(x=>x.kind==='recall').map(x=>x.item.id),['review-first','review-fourth']);
 assert.equal(new Set(options.map(x=>x.item.id)).size,4);
});
test('career perspective preserves facts and keeps the original available',()=>{
 const v={kind:'application',item:base};
 for(const lang of ['ar','en'])for(const role of ['none','judge','lawyer','professor']){
  const text=flow.prompt(v,role,lang);assert.ok(text.includes(lang==='ar'?'عمره عشرون عامًا':'person is twenty'));
 }
 assert.notEqual(flow.prompt(v,'judge','en'),flow.prompt(v,'lawyer','en'));
 assert.notEqual(flow.prompt(v,'lawyer','en'),flow.prompt(v,'professor','en'));
});
test('round status comes from supplied confirmed saved answers without scores',()=>{
 const html=flow.roundHtml({lang:'en',data:{tasks:[{},{}],saved:[{}],completed:false}});
 assert.ok(html.includes('Round 2 of 2'));assert.ok(html.includes('Saved to your account: 1 / 2'));
 assert.ok(!html.includes('%'));assert.ok(!flow.model(base,'hint','en').includes(base.outcome_en));
});
