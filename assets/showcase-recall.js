/* Shared by the browser and showcase-grade. No provider, embeddings or example matching.
 * Conservative proposition rules: scores are evidenced points, NOT semantic mastery.
 * Unknown language/negation scope must abstain. Keep exact original excerpts for review. */
(function(root){
'use strict';
var criteria=[
 {id:'birth_alive',weight:2,ar:'بداية الشخصية القانونية بالولادة حية',en:'Legal personality begins at live birth'},
 {id:'death',weight:1,ar:'انتهاء الشخصية القانونية بالموت',en:'Legal personality ends at death'},
 {id:'prenatal_rights',weight:2,ar:'حقوق الحمل التي لا يحتاج سببها إلى قبول',en:'Prenatal rights whose cause requires no acceptance'},
 {id:'live_birth_condition',weight:2,ar:'اشتراط الولادة حية لثبوت تلك الحقوق',en:'Those rights depend on live birth'}
];
function norm(s){return s.toLowerCase().normalize('NFKC').replace(/[\u064b-\u065f\u0670ـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[’']/g,'').replace(/\s+/g,' ').trim();}
function assess(answer,lang){
 var ar=lang!=='en',raw=String(answer||'').trim();
 var parts=raw.split(/[،,؛;.!?؟\n]+/).map(function(s){return s.trim();}).filter(Boolean);
 // Split coordinated propositions before analysing polarity; never match across a contrast.
 parts=parts.flatMap(function(s){return s.split(/\s+(?=ولكن|لكن|وتنتهي|وتنقضي|وبوفاته|وتستمر|والحمل|وللحمل|وللجنين|وتبدا|وتثبت للحمل|but\b|and ends\b|and terminates\b|and begins\b)/i);});
 var rows=criteria.map(function(c){return {id:c.id,label:ar?c.ar:c.en,max_points:c.weight,points:0,status:'unrecognized',evidence:[],contrary:[]};});
 function add(i,positive,p){var a=positive?rows[i].evidence:rows[i].contrary;if(!a.includes(p))a.push(p);}
 var personality=/(?:شخصي|(?:ال)?شخص قانوني|الشخص القانوني|legal personality|legal personhood)/;
 var prenatal=/(?:حمل|جنين|للجنين|prenatal|unborn|fetus|foetus)/;
 var rights=/(?:حقوق|الحق|حقه|rights?)/;
 var birth=/(?:(?:ولاد|ولد|يولد|مولود|ميلاد|الحياه|للحي)[^،؛.]{0,24}حي\S*|born alive|live birth)/;
 parts.forEach(function(p,index){
  var t=norm(p),prev=norm(parts[index-1]||''),ctx=prev+' '+t;
  var hasPerson=personality.test(t)||(/^(?:and begins|and ends|لكن|ولكن|وتنتهي|وتبدا)\b/.test(t)&&personality.test(prev)),hasBirth=birth.test(t),hasPrenatal=prenatal.test(t);
  var start=/(?:تبدا|يبدا|بدايه|يكتسب|تكتسب|تثبت|يثبت|تقوم|ثبوت|وجود|begins?|starts?|acquir|commenc)/.test(t);
  var death=/(?:موت|موته|وفا[ته]|توفي|مات|death|dies|dying)/.test(t);
  var ending=/(?:تنتهي|تنقضي|انتهاء|تنقطع|انتهت|تزول|خاتمه|نهايه|تمتد الي لحظه|ends?|terminat|ceases?)/.test(t);
  var negStart=/(?:لا|لم|ليس|لن)\s+(?:تبدا|يبدا|يكتسب|تثبت|يثبت|تقوم)|(?:does not|doesnt|never)\s+(?:begin|start)|not (?:begin|start)/.test(t);
  // Treat "does not begin ... except on live birth" as a positive exclusive condition.
  var exceptStart=/(?:لا|لم|ليس|لن)\s+(?:تبدا|يبدا)[^،؛.]{0,90}\sالا\s/.test(t)||/does not (?:begin|start)[^.]{0,90}\buntil\b/.test(t);
  var wrongTiming=/(?:قبل[^،؛.]{0,18}(?:ولاد|ميلاد)|لا بالولاد|before[^.]{0,15}(?:birth|born))/.test(t);
  var wrongBirth=/(?:ولاد\S*\s+ميت|الولاده ميت|ولد\S*\s+ميت|سن الرشد|بلوغ|conception|stillbirth|born dead|adulthood)/.test(t);
  var wrongOrigin=/(?:تكتسب|يكتسب|تبدا|يبدا|تقوم|begins?|starts?|commenc)[^.]{0,50}(?:بالحمل|عند الحمل|من الحمل|بمجرد الحمل|at conception|from conception)/.test(t);
  // "الشخصية القانونية تثبت بولادة الجنين حيا" establishes the start of
  // personality, even though "الجنين" appears in the birth description.
  // Only a clause *about prenatal rights* should block that inference.
  var discussingPrenatalRights=hasPrenatal&&rights.test(t);
  // If the text instead explicitly starts personality at conception, a later
  // mention of live birth must not turn an incorrect rule into positive credit.
  if(hasPerson&&start&&wrongOrigin&&!negStart)add(0,false,p);
  if(hasPerson&&start&&hasBirth&&!discussingPrenatalRights&&(!negStart||exceptStart)&&!wrongOrigin&&!wrongBirth&&!wrongTiming)add(0,true,p);
  if(hasPerson&&start&&((negStart&&!exceptStart)||wrongTiming||(wrongBirth&&!/(?:^|\s)(?:لا|لم|ليس|not|never)(?:\s|$)/.test(t))))add(0,false,p);
  var negEnd=/(?:لا|لم|لن)\s+(?:تنتهي|تنقضي|تنقطع)|(?:does not|doesnt|never)\s+(?:end|cease|terminat)/.test(t);
  var exceptEnd=/(?:لا|لم|لن)\s+(?:تنتهي|تنقضي|تنقطع)[^،؛.]{0,90}\sالا\s/.test(t);
  var continues=/(?:تستمر|تبقي|تظل|continues?|survives?|persists?)/.test(t)&&/(?:بعد|after)/.test(t);
  if(death&&(hasPerson||personality.test(prev))){
   if(ending&&(!negEnd||exceptEnd)&&!continues)add(1,true,p);
   if((negEnd&&!exceptEnd)||continues)add(1,false,p);
  }
  var noAcceptance=/(?:لا|لم)\s+(?:يحتاج|تحتاج|تتطلب|يتطلب|تستلزم|يستلزم|يقتضي|يتوقف)[^،؛.]{0,45}قبول|دون\s+(?:اشتراط\s+)?قبول|دون حاجه[^،؛.]{0,20}قبول|بغير قبول|غير متوقف[^،؛.]{0,20}قبول|(?:do(?:es)? not|dont|doesnt) require acceptance|(?:not|never) requiring acceptance|requir(?:e|ing|es) no acceptance|without (?:requiring )?acceptance/.test(t);
  var requireAcceptance=/(?:يحتاج|تحتاج|تتطلب|يتطلب|تستلزم|يستلزم)[^،؛.]{0,25}قبول|(?:requires?|requiring) acceptance/.test(t)&&!noAcceptance;
  if(hasPrenatal&&rights.test(t)&&noAcceptance&&!/(?:لا تثبت|لا حقوق|ليست[^.]{0,20}حقوق|ليس[^.]{0,20}حقوق|no rights)/.test(t))add(2,true,p);
  if(hasPrenatal&&rights.test(t)&&requireAcceptance)add(2,false,p);
  var cond=/(?:بشرط|شريطه|شرط|يشترط|يتوقف|متوقف|على ان|علي ان|على شرط|علي شرط|ما دام|متي|اذا|رهين|مرهون|مشروط|provided|conditional|depend|only if|subject to)/.test(t);
  var deniesCondition=/(?:لا يشترط|شرط عدم الولاد|بشرط ان لا يولد|اذا لم يولد|دون شرط|من دون شرط|بلا شرط|بصرف النظر|حتي لو لم يولد|ولو لم يولد|ولو ولد ميت|حتى لو ولد ميت|regardless|even if[^.]{0,20}(?:not|dead)|no condition|not conditional|does not depend|without live birth)/.test(t);
  // A condition-only clause can inherit its referent from the immediately preceding prenatal-rights clause.
  var rightContext=(hasPrenatal&&rights.test(t))||(!hasPerson&&prenatal.test(ctx)&&rights.test(ctx));
  if(rightContext&&hasBirth&&cond&&!/(?:لا تثبت|لا حقوق|no rights)/.test(t)&&!deniesCondition&&!/(?:لم|لا|لن) يولد/.test(t))add(3,true,p);
  if(rightContext&&deniesCondition)add(3,false,p);
 });
 var conflicts=[];
 rows.forEach(function(r){
  r.status=r.evidence.length?(r.contrary.length?'conflicting':'supported'):(r.contrary.length?'contradicted':'unrecognized');
  if(r.status==='supported')r.points=r.max_points;
  if(r.status==='conflicting')conflicts.push(r.label);
 });
 var points=rows.reduce(function(n,r){return n+r.points;},0),wrong=rows.some(function(r){return r.status==='contradicted';});
 // Questions, quoted hypotheticals, uncertain assertions and complex unscoped negation abstain.
 var uncertain=/[?؟]|(?:ربما|لعل|قد تبدا|اظن|لست متاكدا|maybe|perhaps|not sure|ليس صحيحا|غير صحيح|خاطئ|عباره|العباره|قال|يقول|it is false|incorrect statement|quoted)/i.test(norm(raw));
 var hasLegalTokens=/(?:شخصي|مولود|ولاد|حمل|جنين|وفا|موت|حقوق|قانون|ولد|حق|personality|rights?|birth|born|unborn|death|acceptance)/.test(norm(raw));
 var reason=conflicts.length?'conflicting_propositions':uncertain?'ambiguous_assertion':points?'evidenced_elements':wrong?'explicit_incorrect_proposition':!hasLegalTokens?'no_legal_content':raw.length<40?'incomplete_proposition':'unrecognized_wording';
 var score=conflicts.length||uncertain?null:points?Math.round(points/7*100):wrong?0:null;
 var messages={
  conflicting_propositions:['توجد أحكام متناقضة بشأن العنصر نفسه؛ عُرضت الأدلة المتعارضة، وتحتاج الدرجة إلى مراجعة المشرف.','Conflicting claims about the same element need supervisor review; both excerpts are shown.'],
  ambiguous_assertion:['الصياغة استفهامية أو مترددة؛ لا يمكن الجزم بأنك تقرر الحكم القانوني المذكور.','The wording is a question or an uncertain assertion, so a reliable score cannot be assigned.'],
  evidenced_elements:['هذه نقاط العناصر المثبتة فقط من 7، بتقييم محلي محدود قابل للمراجعة. عدم التعرّف على عنصر لا يثبت خطأه.','These are evidenced points out of 7 from limited local rules, subject to review. An unrecognized element is not necessarily wrong.'],
  explicit_incorrect_proposition:['توجد عبارة صريحة تخالف القاعدة القانونية ولم يُثبت عنصر صحيح. الصفر المبدئي مبني على هذه العبارة، ويخضع للمراجعة.','An explicit statement contradicts the rule and no correct element was established. This provisional zero is based on that statement and needs review.'],
  incomplete_proposition:['لم يتعرّف الفحص المحدود على علاقة قانونية مكتملة في هذه الإجابة القصيرة. وضّح متى تبدأ الشخصية ومتى تنتهي، وما حقوق الحمل المشروطة بالولادة حية. عدم التعرف لا يعني أن إجابتك خاطئة؛ يمكنك تعديلها أو طلب مراجعة المشرف.','The limited checker could not establish a complete legal relationship in this short answer. Explain when personality begins and ends and which prenatal rights depend on live birth. Unrecognized does not mean wrong; revise your answer or request supervisor review.'],
  no_legal_content:['لم يتم التعرف على إجابة قانونية في النص المكتوب. اكتب ما تتذكره من القاعدة أو اختر «لا أتذكر». لا تُحتسب درجة صفر بسبب نص غير مفهوم.','No recognizable legal answer was found. Write what you recall about the rule or choose “I do not remember”. No zero is assigned to unintelligible text.'],
  unrecognized_wording:['لم يستطع المحرك المحلي إثبات علاقة قانونية بثقة في هذه الصياغة. ستظل الإجابة والأدلة متاحة للمشرف دون احتسابها صفرًا.','The local engine could not confidently establish a legal proposition in this wording. The answer remains available for review without being scored zero.']
 };
 return {grade_status:score===null?'insufficient_evidence':'rule_assessed',recall_score:score,feedback:messages[reason][ar?0:1],details:{engine:'local-propositions-v5',provider:'none',provider_status:'disabled_no_paid_calls',provisional:true,reason:reason,points:points,max_points:7,criteria:rows,achieved:rows.filter(function(r){return r.status==='supported';}).map(function(r){return {id:r.id,evidence:r.evidence.join(' … '),points:r.points};}),missing:rows.filter(function(r){return r.status!=='supported';}).map(function(r){return r.id;}),contradictions:conflicts,source_ids:['qa-civil-2004-art39','qa-civil-2004-art40']}};
}
// Public practice reports rubric coverage even when semantic meaning needs review.
// The conservative academic assessment above remains unchanged.
function assessPractice(answer,lang){
 var grade=assess(answer,lang),ar=lang!=='en',d=grade.details;
 var review=grade.recall_score===null;
 var points=review?(d.reason==='ambiguous_assertion'?0:d.points):d.points;
 var score=review?Math.round(points/d.max_points*100):grade.recall_score;
 var note=ar?'نسبة الحفظ هنا تقيس عناصر الإجابة التي تحقق منها المحرك الداخلي، وليست حكمًا نهائيًا على إتقانك.':'This recall percentage measures answer elements verified by the internal engine, not final mastery.';
 var feedback=review?(ar?'تحقق المحرك الداخلي من '+points+' من '+d.max_points+' نقاط. راجع العناصر الموضحة أدناه ثم أعد صياغة إجابتك؛ عدم التعرّف على صياغتك لا يثبت أنها خاطئة.':'The internal engine verified '+points+' of '+d.max_points+' points. Review the elements below and revise your answer; unrecognized wording is not proof that it is wrong.'):grade.feedback;
 return {grade_status:'practice_coverage',recall_score:score,feedback:feedback+' '+note,details:Object.assign({},d,{score_basis:'verified_element_coverage',needs_review:review,coverage_points:points,academic_score:grade.recall_score,criteria:d.reason==='ambiguous_assertion'?d.criteria.map(function(c){return Object.assign({},c,{points:0,status:'unrecognized'});}):d.criteria})};
}
var api={assess:assess,assessPractice:assessPractice,criteria:criteria};root.LEX_RECALL=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
