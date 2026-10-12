const assert=require('node:assert/strict'),fs=require('node:fs'),R=require('../assets/showcase-recall');
const cases=[
 ['complete','تبدأ شخصية الإنسان بتمام ولادته حياً، وتنتهي بموته. والحمل المستكن أهل لثبوت الحقوق التي لا يحتاج سببها إلى قبول، وذلك بشرط تمام ولادته حياً.',100],
 ['reordered','للحمل المستكن حقوق منشؤها غير متوقف على قبول، ويتوقف ثبوتها على أن يولد حيا؛ الموت خاتمة الشخصية، وثبوت الشخصية القانونية مرتبط بتمام الولادة حيا.',100],
 ['one','تبدأ الشخصية القانونية بالولادة حية.',29],
 ['missing condition','تبدأ الشخصية القانونية بالولادة حية، وتنتهي بالموت، وللجنين حقوق لا يحتاج سببها إلى قبول.',71],
 ['negative','لا تبدأ الشخصية القانونية بالولادة حية.',0],
 ['contradiction','تبدأ الشخصية القانونية بالولادة حية، ولكن الشخصية القانونية لا تبدأ بالولادة حية.',null],
 ['fragment','الولادة حيا',null],
 ['nonsense','قبول حياة موت حقوق ولادة',null],
 ['question','هل تبدأ الشخصية القانونية بالولادة حية؟',null],
 ['uncertain','ربما تبدأ الشخصية القانونية بالولادة حية.',null],
 ['english','Legal personality begins at live birth and ends at death. An unborn child acquires rights that require no acceptance, provided that the child is born alive.',100,'en'],
 ['english negation','Legal personality does not begin at live birth.',0,'en'],
 ['english conflict','Legal personality begins at live birth. Legal personality does not begin at live birth.',null,'en'],
 ['negative condition','تثبت حقوق الحمل ولو لم يولد حيا.',0],
 ['acceptance required','تثبت للحمل الحقوق التي يحتاج سببها إلى قبول.',0],
 ['stillborn wrong','الولادة ميتا تثبت الشخصية القانونية كاملة.',0],
 ['no punctuation','تبدأ الشخصية القانونية بالولادة حية وتنتهي بالموت وللحمل حقوق لا تحتاج إلى قبول بشرط أن يولد حيا',100],
 ['reverse English','Rights of the unborn require no acceptance, conditional on live birth. Legal personality ends at death and begins when born alive.',100,'en']
];
for(const [name,answer,expected,lang='ar'] of cases){let r=R.assess(answer,lang);assert.equal(r.recall_score,expected,name+': '+JSON.stringify(r.details));for(const c of r.details.criteria)for(const quote of [...c.evidence,...c.contrary])assert(answer.includes(quote),'verbatim evidence');}
// Corpus is a coverage probe, not semantic ground truth or a classifier by similarity.
const corpus=require('./qa-39-40-300-answer-variants.json').examples,counts={};
for(const x of corpus){let r=R.assess(x.answer,'ar'),c=counts[x.reference_category]??={n:0,full:0,partial:0,unscored:0,zero:0};c.n++;c[r.recall_score===100?'full':r.recall_score===null?'unscored':r.recall_score===0?'zero':'partial']++;assert(!(x.reference_category==='contradiction_or_error'&&r.recall_score===100),x.id+' cannot receive full marks');}
console.log('Legal acceptance cases PASS:',cases.length);console.log(JSON.stringify(counts,null,2));
module.exports=cases;
