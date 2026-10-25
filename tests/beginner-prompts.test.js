const assert=require('node:assert/strict'),fs=require('node:fs');
const beginner=require('../assets/beginner-prompts.js'),guide=require('../assets/legal-case-guide.js');
const bank=JSON.parse(fs.readFileSync('validation/content-review-bank.json','utf8')).items;
let recall=0,understanding=0,cases=0;
for(const item of bank){
 const task={...item,prompt_en:item.rubric_json.prompt_en};
 const ar=beginner.prepare(task,'ar'),en=beginner.prepare(task,'en');
 if(item.dimension==='recall'){recall++;for(const text of [ar,en]){assert.ok(text.includes('1.')&&text.includes('2.')&&text.includes('3.'));}assert.match(ar,/ثلاث كلمات/);assert.match(en,/three short memory cues/);}
 if(item.dimension==='understanding'){
  understanding++;const marker='عبارتان للمقارنة؛ إحداهما غير دقيقة:';
  assert.ok(ar.slice(ar.indexOf(marker)).startsWith(item.prompt_ar.slice(item.prompt_ar.indexOf(marker))),'preserve every comparison and its legal qualifiers while allowing the third explanatory step');
  assert.match(ar,/صحّحها/);assert.match(en,/Correct it/);
 }
 if(item.dimension==='exam_execution'){
  cases++;assert.ok(beginner.cases[item.id]);assert.equal(beginner.cases[item.id].source,item.prompt_ar.split('\n')[0]);
  assert.ok(guide.parse(ar,'ar'));assert.ok(guide.parse(en,'en'));
  assert.equal(ar.split('\n').slice(1).join('\n'),item.prompt_ar.split('\n').slice(1).join('\n'),'preserve the four answer sections');
  assert.ok(ar.split('\n')[0].endsWith(beginner.cases[item.id].simple));
 }
}
assert.deepEqual([recall,understanding,cases],[24,24,24]);
assert.match(beginner.cases['rights-v1-s9-exam'].simple,/17.*لا يوجد.*إذن خاص/);
assert.match(beginner.cases['rights-v1-s21-exam'].simple,/مشروعة.*دون أي حالة تعسف/);
assert.match(beginner.cases['rights-v1-s27-exam'].simple,/لا بالفعل ولا بنص القانون/);
const changed={id:'rights-v1-s1-exam',dimension:'exam_execution',prompt_ar:'الواقعة: تغيرت شروط الواقعة. لا تستبدل هذا السؤال.'};assert.equal(beginner.prepare(changed,'ar'),changed.prompt_ar,'a changed question must not inherit an old case rewrite');
for(const page of ['diagnostic.html','student-path.html']){const text=fs.readFileSync(page,'utf8');assert.ok(text.includes('assets/learning-moments.js')&&text.includes('assets/learning-moments.css'));}
assert.match(fs.readFileSync('AGENTS.md','utf8'),/no prior legal education/);
console.log('First-year question review: all 72 bank items, bilingual steps, exact comparisons, 24 guarded case rewrites and decisive qualifications PASS');

