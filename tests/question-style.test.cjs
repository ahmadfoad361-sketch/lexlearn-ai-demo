const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const beginner=require('../assets/beginner-prompts.js');
const style=require('../assets/question-style.js'),Q=require('../assets/learning-quality.js'),guide=require('../assets/legal-case-guide.js');
const topics=Object.values(Q.topics);
test('all bilingual authoring tasks default to the common style and retain canonical requirements',()=>{
 let count=0;
 for(const topic of topics)for(const lang of ['ar','en'])for(const dim of ['recall','understanding','exam']){
  const task=dim==='exam'?Q.examTask(topic.session,lang):Q.makeEssay(topic,lang,dim);
  assert.equal(task.questionStyle,style.version);assert.ok(task.originalPrompt);assert.ok(task.displayPrompt);count++;
  const clone=structuredClone(task),rubric=task.qualityRubric;
  style.author(task,lang);assert.deepEqual(task,clone);assert.equal(task.qualityRubric,rubric);
  if(dim==='recall'){assert.match(task.displayPrompt,lang==='ar'?/ثلاث كلمات أو عبارات قصيرة مختلفة/:/three distinct short words or phrases/);assert.match(task.displayPrompt,/1\..*\n2\..*\n3\./);}
  if(dim==='understanding'){
   const expected=beginner.clarifyComparison('rights-v1-s'+topic.session+'-understanding',lang,task.comparison);
   for(const statement of expected)assert.ok(task.displayPrompt.includes(statement));
   assert.ok(expected.every(x=>x.endsWith('.')));
   assert.equal(expected.length,task.comparison.length);
   const html=style.render(task.displayPrompt,lang);assert.ok(html.indexOf('questionComparison')<html.indexOf('questionFollowup'));
   assert.match(html,/comparisonStatement/);
   assert.doesNotMatch(task.displayPrompt,lang==='ar'?/إحداهما غير دقيقة|أي العبارتين.*غير دقيقة/:/one is inaccurate|Which is inaccurate/);
   assert.match(task.originalPrompt,lang==='ar'?/إحداهما غير دقيقة/:/one is inaccurate/);
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

test('official question type cards have distinct accessible presentation without changing grading',()=>{
 const fs=require('node:fs');
 const student=fs.readFileSync('assets/student-path.js','utf8');
 const css=fs.readFileSync('assets/learner-experience.css','utf8');
 for(const dim of ['recall','understanding','exam_execution'])assert.match(css,new RegExp('stage--'+dim));
 assert.match(student,/stage--/);
 assert.match(css,/questionBrief/);
 assert.match(css,/comparisonStatement/);
});

test('comparison classification is learner-owned, bilingual and passed through existing answer flow',()=>{
 const sorter=require('../assets/comparison-cards.js');
 function card(n,choice){return {dataset:{lexCardIndex:String(n),lexChoice:choice}};}
 const host={querySelectorAll:()=>[card(2,'inaccurate'),card(1,'accurate')]};
 assert.equal(sorter.answer(host,'ar'),'تقييمي المستقل للعبارات:\nالعبارة 1: دقيقة قانونيًا.\nالعبارة 2: غير دقيقة قانونيًا.');
 assert.equal(sorter.answer(host,'en'),'My assessment of each statement:\nStatement 1: legally accurate.\nStatement 2: legally inaccurate.');
 assert.equal(sorter.answer({querySelectorAll:()=>[card(1,''),card(2,'')]},'ar'),'');
 const source=fs.readFileSync('assets/comparison-cards.js','utf8');
 assert.match(source,/pointerdown/);assert.match(source,/pointermove/);assert.match(source,/pointerup/);
 assert.match(source,/dragstart/);assert.match(source,/dragover/);assert.match(source,/keydown/);
 const page=fs.readFileSync('student-path.html','utf8');
 assert.match(page,/assets\/comparison-cards.js/);assert.match(page,/assets\/comparison-cards.css/);
 const student=fs.readFileSync('assets/student-path.js','utf8');
 assert.match(student,/LEX_COMPARISON_CARDS\.mount/);
 assert.match(student,/LEX_COMPARISON_CARDS\.answer/);
});

test('all learner question entry points use the same accessible clarity stylesheet',()=>{
 const pages=['diagnostic.html','student-path.html','program.html','program-en.html',
  'showcase.html','showcase-en.html','showcase-level1.html','showcase-level1-en.html',
  'student-practice.html','student-future.html','student-research-pilot.html',
  'pilot-review.html','pilot-qa.html'];
 for(const page of pages){
  const source=fs.readFileSync(page,'utf8');
  assert.match(source,/assets\/question-clarity\.css/,page);
 }
 const css=fs.readFileSync('assets/question-clarity.css','utf8');
 for(const region of ['#officialDiagnostic','#studentPractice','#studentTrainingApp',
  '#officialLevelMount','#showcaseApp','#careerApp','.taskCard']){
  assert.ok(css.includes(region),'missing clarity scope '+region);
 }
 assert.match(css,/html\[lang="en"\]/);
 assert.match(css,/data-learner-theme="dark"/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/prefers-reduced-motion/);
 assert.doesNotMatch(css,/position:\s*absolute[^;]*!important/);
});

/* Dark visual palette regressions; checks presentation only, never student data. */
function darkThemeTokens(css,selector){
 const start=css.lastIndexOf(selector);
 assert.ok(start>=0,'Missing visual theme selector '+selector);
 const end=css.indexOf('}',start);
 assert.ok(end>start,'Unterminated visual theme selector '+selector);
 return Object.fromEntries([...css.slice(start+selector.length,end).matchAll(/--([a-z-]+)\s*:\s*([^;]+);/g)].map(([,name,value])=>[name,value.trim().split('/*')[0].trim()]));
}
function darkThemeLuminance(hex){
 const rgb=hex.slice(1).match(/.{2}/g).map(n=>parseInt(n,16)/255);
 const [r,g,b]=rgb.map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
 return .2126*r+.7152*g+.0722*b;
}
function darkThemeContrast(a,b){
 const x=darkThemeLuminance(a),y=darkThemeLuminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
test('dark mode palette uses accessible muted brick and distinct navy card layers',()=>{
 const css=fs.readFileSync('assets/learner-experience.css','utf8');
 const dark=darkThemeTokens(css,'html[data-learner-theme=dark] {');
 assert.equal(dark['lx-bg'].toLowerCase(),'#111d31');
 assert.equal(dark['lx-surface'],'#1e3049');
 assert.equal(dark['lx-raised'],'#2b405c');
 assert.equal(dark['lx-accent'],'#e794ab');
 assert.equal(dark['lx-accent-line'],'#d8718a');
 assert.ok(darkThemeContrast(dark['lx-ink'],dark['lx-bg'])>=7);
 assert.ok(darkThemeContrast(dark['lx-surface'],dark['lx-bg'])>=1.25);
 assert.ok(darkThemeContrast(dark['lx-raised'],dark['lx-surface'])>=1.25);
 assert.ok(darkThemeContrast(dark['lx-accent'],dark['lx-raised'])>=4.5);
 assert.ok(darkThemeContrast(dark['lx-accent-line'],dark['lx-raised'])>=3);
});
test('dark mode changes do not alter the brand light palette or primary burgundy CTAs',()=>{
 const css=fs.readFileSync('assets/learner-experience.css','utf8');
 const light=darkThemeTokens(css,'html[data-learner-theme] {');
 assert.equal(light['lx-bg'].toLowerCase(),'#f9f4ef');
 assert.equal(light['lx-surface'],'#fffdfb');
 assert.equal(light['lx-accent'].toLowerCase(),'#8a1f39');
 assert.match(css,/\.btn\.primary[^}]*background:#8a1f39;color:#fff;border-color:#8a1f39/);
});
test('dark question labels follow the shared card and muted brick palette',()=>{
 const question=fs.readFileSync('assets/question-clarity.css','utf8');
 const learner=fs.readFileSync('assets/learner-experience.css','utf8');
 const dark=darkThemeTokens(question,'html[data-learner-theme="dark"]{');
 assert.equal(dark['question-paper'],'var(--lx-surface,#1e3049)');
 assert.equal(dark['question-soft'],'var(--lx-raised,#2b405c)');
 assert.equal(dark['question-accent'],'var(--lx-accent-line,#d8718a)');
 assert.match(question,/background:var\(--lx-accent,#e794ab\);color:#111d31/);
 assert.match(learner,/\.stage--understanding\{--session-accent:var\(--lx-accent\)\}/);
 assert.match(learner,/\.comparisonNumber\{\s*color:#111d31/);
});

test('dark results and occupied comparison buckets remain visibly differentiated',()=>{
 const learner=fs.readFileSync('assets/learner-experience.css','utf8');
 const cards=fs.readFileSync('assets/comparison-cards.css','utf8');
 assert.match(learner,/html\[data-learner-theme="dark"\] \.skillStageScorecard[^\n]*background:var\(--lx-surface\)/);
 assert.match(learner,/html\[data-learner-theme="dark"\] \.skillStageScorecard \.progressSkill[^\n]*background:var\(--lx-raised\)/);
 assert.match(learner,/\.caseMainQuestion\)\{background:var\(--lx-raised\);color:var\(--lx-ink\);border-color:var\(--lx-border\)/);
 assert.match(cards,/data-learner-theme=dark\] #studentTrainingApp \.lexSortTarget:has\(\.lexSortableCard\)\{/);
 assert.match(cards,/border-style:solid/);
 assert.match(cards,/background:color-mix\(in srgb,var\(--lx-accent/);
});

test('personal glossary canonicalizes manually selected known terms before saving',()=>{
 const glossary=require('../assets/personal-glossary.js');
 assert.equal(glossary.termKey('الموطن'),'legal-domicile');
 assert.equal(glossary.termKey(' المَوْطِن  '),'legal-domicile');
 assert.equal(glossary.termKey('  عَقَارٌ بالتخصيص '),'immovable-by-destination');
 assert.equal(glossary.termKey('Legal TERM'),'manual-legal term');
 const source=fs.readFileSync('assets/personal-glossary.js','utf8');
 assert.match(source,/\.eq\("student_id",who.id\)\.eq\("course_id",COURSE\)\.limit\(500\)/);
 assert.match(source,/if\(out.error.code==="23505"\)return false/);
 assert.match(source,/d\.close\(\);\s*announceSaved\(/);
});
test('admin navigation closes on another dropdown, outside pointer, and Escape',()=>{
 const source=fs.readFileSync('assets/admin-appearance.js','utf8');
 assert.match(source,/details\.adminNavGroup\[open\]/);
 assert.match(source,/addEventListener\("toggle"/);
 assert.match(source,/addEventListener\("pointerdown"/);
 assert.match(source,/e\.key==="Escape"/);
});


test('approved dark learning screens use one shared card and CTA language',()=>{
 const css=fs.readFileSync('assets/question-clarity.css','utf8');
 assert.match(css,/LexLearn unified dark learner screens/);
 for(const selector of [
  '#studentTrainingApp .legalStudy>h2',
  '#studentTrainingApp .legalStudyEyebrow',
  '#studentTrainingApp #beginLegalQuestions',
  '#studentTrainingApp #adaptiveSubmit',
  '#studentTrainingApp .stage .questionBrief',
  '#studentTrainingApp .stage .questionGuidance',
  '#officialDiagnostic #serverNext',
  '#showcaseApp .stageCard .btn.primary',
  '#programApp .stage .primary'
 ])assert.ok(css.includes(selector),'Missing unified dark UI selector: '+selector);
 for(const page of [
  'diagnostic.html','student-path.html','program.html','program-en.html',
  'showcase.html','showcase-en.html','showcase-level1.html','showcase-level1-en.html'
 ]){
  const html=fs.readFileSync(page,'utf8');
  const version=page==='student-path.html'?'20261128.official-layouts2':'20261120.2';
  assert.ok(html.includes('assets/question-clarity.css?v='+version),'Stale question stylesheet: '+page);
 }
 const originals=fs.readFileSync('assets/legal-study.js','utf8');
 assert.match(originals,/function render\(ids,lang\)/);
 assert.match(originals,/id='beginLegalQuestions'/);
});


test('dark training recall edge and hint button stay subtle but accessible',()=>{
 const css=fs.readFileSync('assets/learner-experience.css','utf8');
 const html=fs.readFileSync('student-path.html','utf8');
 const source=fs.readFileSync('assets/student-path.js','utf8');
 assert.match(css,/Dark learner question finishing touches — 2026-11-20/);
 assert.match(css,/html\[data-learner-theme=dark\] #studentTrainingApp \.stage--recall\{\s*--session-accent:#83a9bd;/);
 assert.match(css,/html\[data-learner-theme=dark\] #studentTrainingApp #adaptiveUnknown\{\s*background:#2b405c;/);
 assert.match(css,/#adaptiveUnknown:focus-visible\{\s*outline:3px solid #e794ab;/);
 assert.match(html,/assets\/learner-experience\.css\?v=20261125\.paired1/);
 assert.match(source,/id='adaptiveUnknown'/);
 assert.match(source,/id='adaptiveSubmit'/);
});


test('three separate answer fields preserve question boundaries and combined limit',()=>{
 for(const lang of ['ar','en']){
  assert.equal(style.hasThreeParts(style.freeDiagnostic(lang)),true);
  assert.equal(style.hasThreeParts('1. One\n2. Two'),false);
  assert.equal(style.hasThreeParts('1. One\n2. Two\n3. Three\n3. Four'),false);
  const html=style.answerFields('answer',lang,2000);
  assert.equal((html.match(/<textarea/g)||[]).length,3);
  for(const id of ['answer','answerPart2','answerPart3'])assert.ok(html.includes("for='"+id+"'"));
  const fields={ '#answer':{value:'first\nsecond line'},'#answerPart2':{value:''},'#answerPart3':{value:'third'} };
  const host={querySelector:id=>fields[id]};
  assert.deepEqual(style.collectAnswers(host,'answer',lang,2000),{text:'1. first\nsecond line\n\n3. third',missing:1,tooLong:false});
  assert.equal(style.collectAnswers(host,'answer',lang,10).tooLong,true);
  for(const field of Object.values(fields))field.value='';
  assert.deepEqual(style.collectAnswers(host,'answer',lang,2000),{text:'',missing:3,tooLong:false});
 }
});

 test('beginner vocabulary includes source-based bilingual definitions and examples',()=>{const glossary=require('../assets/personal-glossary.js');assert.equal(glossary.beginnerTerms.length,30);assert.equal(glossary.terms.length,46);for(const row of glossary.beginnerTerms){assert.equal(row.length,7);assert.ok(row.slice(3).every(v=>v.length>10));assert.ok(row[2]>=39&&row[2]<=63);}assert.equal(new Set(glossary.terms.map(v=>v[0])).size,46);});

 test('numbered questions precede their own fields and retain comparison cards and escaping',()=>{
 const p='Topic <test>\n1. First <unsafe>\n2. Compare\nReview each statement on its own:\nA < B\nC > D\n3. Explain the effect.';
 const html=style.answerFields('paired','en',4000,p);
 assert.equal((html.match(/<textarea/g)||[]).length,3);
 assert.ok(html.indexOf('First &lt;unsafe&gt;')<html.indexOf("id='paired'"));
 assert.ok(html.indexOf("id='paired'")<html.indexOf('2. Compare'));
 assert.ok(html.indexOf('2. Compare')<html.indexOf('questionComparison'));
 assert.ok(html.indexOf('A &lt; B')<html.indexOf("id='pairedPart2'"));
 assert.ok(html.indexOf("id='pairedPart2'")<html.indexOf('3. Explain'));
 assert.ok(html.indexOf('3. Explain')<html.indexOf("id='pairedPart3'"));
 assert.ok(!html.includes('<unsafe>'));
 assert.equal(style.hasThreeParts('Intro\n١. أول\n٢. ثان\n٣. ثالث'),true);
 assert.equal(style.hasThreeParts('Intro\n1. A\n2. B\n3. C\n4. D'),false);
 assert.equal(style.hasThreeParts('Intro\n1. A\n3. C\n2. B'),false);
 assert.equal(style.hasThreeParts('One question only'),false);
 for(const lang of ['ar','en']){
  const output=style.answerFields('diag',lang,2000,style.freeDiagnostic(lang));
  assert.equal((output.match(/<textarea/g)||[]).length,3);
  assert.ok(output.indexOf("id='diag'")<output.indexOf('2. '));
 }
 const f={ '#draft':{value:''}, '#draftPart2':{value:''}, '#draftPart3':{value:''} },host={querySelector:id=>f[id]};
 style.restoreAnswers(host,'draft','1. first\n\n3. third');
 assert.equal(f['#draft'].value,'first');assert.equal(f['#draftPart2'].value,'');assert.equal(f['#draftPart3'].value,'third');
 assert.equal(style.readAnswer(host,'draft','en',4000).text,'1. first\n\n3. third');
 style.disableAnswers(host,'draft');assert.ok(Object.values(f).every(x=>x.disabled));
 });

test('clear legal language preserves canonical comparison order, unfamiliar versions and all 24 topic pairs',()=>{
 for(const topic of topics)for(const lang of ['ar','en']){
  const task=Q.makeEssay(topic,lang,'understanding'),id='rights-v1-s'+topic.session+'-understanding';
  const raw=task.comparison.slice(),changed=beginner.clarifyComparison(id,lang,raw);
  assert.equal(changed.length,2);assert.notDeepEqual(changed,raw);
  assert.deepEqual(beginner.clarifyComparison(id,lang,raw.slice().reverse()),changed.slice().reverse());
  assert.deepEqual(beginner.clarifyComparison('unknown',lang,raw),raw);
  const modified=[raw[0],raw[1]+' EXCEPTION'];
  assert.deepEqual(beginner.clarifyComparison(id,lang,modified),modified);
  assert.ok(task.originalPrompt.includes(raw[0]));
  assert.ok(task.originalPrompt.includes(raw[1]));
 }
 const task=Q.makeEssay(Q.topic(14),'ar','understanding');
 assert.match(task.displayPrompt,/الشخص الطبيعي والشخص المعنوي/);
 assert.doesNotMatch(task.displayPrompt,/تتحد بداية الشخصية|كل معنوي/);
 assert.match(task.displayPrompt,/ذمة مالية مستقلة/);
 const official8=['ثماني عشرة سنة كاملة تكفي لكمال الأهلية ولو صدر حكم بالحجر','بلوغ ثماني عشرة سنة كاملة مع عدم القضاء باستمرار الولاية أو الوصاية على المال أو بالحجر'];
 const revised8=beginner.clarifyComparison('rights-v1-s8-understanding','ar',official8);
 assert.match(revised8[0],/حتى لو صدر حكم بالحجر/);
 assert.match(revised8[1],/ما لم يُقضَ باستمرار الولاية أو الوصاية على ماله أو بالحجر/);
 const html=style.answerFields('clarity','ar',4000,task.displayPrompt);
 assert.ok(html.indexOf('questionComparison')<html.indexOf("id='clarityPart2'"));
 assert.ok(html.indexOf("id='clarityPart2'")<html.indexOf("id='clarityPart3'"));
});
test('legal answer starters are optional and conclusion language belongs only in the final step',()=>{
 const source=fs.readFileSync('assets/legal-case-guide.js','utf8');
 const arrays=Array.from(source.matchAll(/placeholders:(\[[^\n]+\]),/g)).map(m=>JSON.parse(m[1]));
 assert.equal(arrays.length,2);
 for(const arr of arrays){assert.equal(arr.length,4);assert.ok(arr.slice(0,3).every(s=>!/إذن|Therefore/i.test(s)));assert.match(arr[3],/إذن|Therefore/i);}
 assert.equal(guide.compose(['','','',''],'ar'),'');
 assert.equal(guide.compose(['مسألة','قاعدة','تطبيق','نتيجة'],'ar'),'المسألة: مسألة\nالقاعدة: قاعدة\nالتطبيق: تطبيق\nالنتيجة: نتيجة');
});

test('the special official majority question keeps every statutory condition and separate answers',()=>{
 const raw='اشرح قاعدة «الرشد والتمييز» (المادتان 49–50) بأسلوبك مع بيان سن الرشد، وانعدام التمييز، وأثر القضاء باستمرار الولاية أو الوصاية على المال أو بالحجر. ثم حدد العبارة غير الدقيقة من العبارتين وصححها مع التعليل:\nثماني عشرة سنة كاملة تكفي لكمال الأهلية ولو صدر حكم بالحجر\nبلوغ ثماني عشرة سنة كاملة مع عدم القضاء باستمرار الولاية أو الوصاية على المال أو بالحجر';
 const task={id:'rights-v1-s8-understanding',dimension:'understanding',prompt_ar:raw};
 const result=style.prepare(task,'ar');
 assert.ok(style.hasThreeParts(result));
 assert.match(result,/سن الرشد/);assert.match(result,/عديم التمييز/);
 assert.match(result,/أثر القضاء باستمرار الولاية أو الوصاية على المال أو بالحجر/);
 assert.match(result,/حتى لو صدر حكم بالحجر/);assert.match(result,/صحّح الخطأ/);
 assert.equal(style.prepare({...task,prompt_ar:raw+'\nشرط إضافي'},'ar'),raw+'\nشرط إضافي');
});

test('actual English majority variant preserves the judicial exception and independent answer areas',()=>{
 const raw='Explain majority and discernment under Articles 49–50, including the age of majority, lack of discernment, and the legal effect of judicial continuation of property guardianship/tutorship or interdiction. Identify and correct the inaccurate statement:\nEighteen complete years always suffice even when interdiction has been judicially imposed\nEighteen complete years with no judicial continuation of guardianship/tutorship over property or interdiction';
 const input={id:'rights-v1-s8-understanding',dimension:'understanding',prompt_en:raw};
 const out=style.prepare(input,'en');assert.ok(style.hasThreeParts(out));assert.match(out,/when a person lacks discernment/);assert.match(out,/court decision continuing guardianship or tutorship over property/);assert.match(out,/even if a court has imposed interdiction/);assert.equal(style.prepare({...input,prompt_en:raw+'\nAdditional requirement'},'en'),raw+'\nAdditional requirement');
});
