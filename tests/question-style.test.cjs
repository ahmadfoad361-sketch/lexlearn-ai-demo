const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const style=require('../assets/question-style.js'),Q=require('../assets/learning-quality.js'),guide=require('../assets/legal-case-guide.js');
const topics=Object.values(Q.topics);
test('all bilingual authoring tasks default to the common style and retain canonical requirements',()=>{
 let count=0;
 for(const topic of topics)for(const lang of ['ar','en'])for(const dim of ['recall','understanding','exam']){
  const task=dim==='exam'?Q.examTask(topic.session,lang):Q.makeEssay(topic,lang,dim);
  assert.equal(task.questionStyle,style.version);assert.ok(task.originalPrompt);assert.ok(task.displayPrompt);count++;
  const clone=structuredClone(task),rubric=task.qualityRubric;
  style.author(task,lang);assert.deepEqual(task,clone);assert.equal(task.qualityRubric,rubric);
  if(dim==='recall'){assert.match(task.displayPrompt,lang==='ar'?/ثلاث كلمات/:/three short memory cues/);assert.match(task.displayPrompt,/1\..*\n2\..*\n3\./);}
  if(dim==='understanding'){
   for(const statement of task.comparison)assert.ok(task.displayPrompt.includes(statement));
   const html=style.render(task.displayPrompt,lang);assert.ok(html.indexOf('questionComparison')<html.indexOf('questionFollowup'));
  }
  if(dim==='exam'){assert.ok(guide.parse(task.displayPrompt,lang));assert.equal(task.displayPrompt.split('\n').length,5);}
 }
 assert.equal(count,144);
});
test('changed or unknown questions never lose an additional condition or requirement',()=>{
 for(const dim of ['recall','understanding','exam']){
  const t=dim==='exam'?Q.examTask(1,'ar'):Q.makeEssay(Q.topic(1),'ar',dim);
  const raw=t.originalPrompt+'\nشرط إضافي خاص بهذا السؤال يجب إبقاؤه.';
  const displayed=style.prepare({id:'unknown',dimension:dim==='exam'?'exam_execution':dim,prompt_ar:raw},'ar');
  assert.equal(displayed,raw);
 }
});
test('diagnostic answer choices and their positions are unchanged for all six items',()=>{
 const context={};vm.runInNewContext(fs.readFileSync('assets/official-diagnostic.js','utf8'),context);
 const questions=context.LEX_OFFICIAL_DIAGNOSTIC.QUESTIONS;assert.equal(questions.length,6);
 for(const q of questions)for(const lang of ['ar','en']){
  const shown=style.diagnostic(q,lang);assert.equal(shown.prompt,q[lang]);
  assert.deepEqual(shown.options,Array.from(q[lang+'Options']));assert.notEqual(shown.options,q[lang+'Options']);
 }
 for(const lang of ['ar','en'])assert.match(style.freeDiagnostic(lang),/1\..*\n2\..*\n3\./);
});
test('all entry points load the style before the consuming UI',()=>{
 for(const page of ['diagnostic.html','student-path.html','program.html','program-en.html','showcase.html','showcase-en.html','showcase-level1.html','showcase-level1-en.html','pilot-review.html','pilot-qa.html']){
  const html=fs.readFileSync(page,'utf8'),styleAt=html.indexOf('assets/question-style.js'),beginnerAt=html.indexOf('assets/beginner-prompts.js');
  assert.ok(styleAt>beginnerAt&&beginnerAt>=0,page);
  const consumer=html.search(/assets\/(?:learning-quality|official-level-one|server-diagnostic|student-path)\.js/);
  assert.ok(consumer>styleAt,page);
 }
 assert.match(fs.readFileSync('assets/official-level-one.js','utf8'),/LEX_QUESTION_STYLE\.prepare/);
 assert.match(fs.readFileSync('assets/learner-extensions.js','utf8'),/LEX_QUESTION_STYLE\.prepare/);
});
test('saved task identity, scores and progression never enter the style adapter',()=>{
 const source=fs.readFileSync('assets/question-style.js','utf8');
 assert.doesNotMatch(source,/LEX_CLOUD|\.rpc\(|fetch\(|localStorage|sessionStorage|\.insert\(|\.update\(/);
 const input=Object.freeze({id:'same-id',dimension:'recall',prompt_ar:'سؤال غير معروف',score:36,answer:'saved answer'});
 assert.equal(style.prepare(input,'ar'),'سؤال غير معروف');assert.equal(input.score,36);
});
test('legacy bookmarks preserve Arabic/English and cannot replace an active training question',()=>{
 const source=fs.readFileSync('assets/student-research-pilot.js','utf8');
 for(const lang of ['ar','en']){
  let target=null;const window={location:{search:'?lang='+lang,replace:x=>target=x}};
  vm.runInNewContext(source,{document:{getElementById:()=>null},window,URLSearchParams});
  assert.equal(target,'student-path.html?lang='+lang);
  target=null;vm.runInNewContext(source,{document:{getElementById:()=>({})},window,URLSearchParams});assert.equal(target,null);
 }
});
