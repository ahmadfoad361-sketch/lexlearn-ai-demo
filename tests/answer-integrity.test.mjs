import assert from "node:assert/strict";
import { classifyFreeAnswer } from "../supabase/functions/_shared/answer-integrity.mjs";

const cases=[
 ["","empty"],["??? ...!!!","empty"],["123456789","obvious_noise"],
 ["لا أعلم","explicit_unknown"],["لا اعرف","explicit_unknown"],["لا أتذكر الإجابة","explicit_unknown"],
 ["مش عارف","explicit_unknown"],["مش عارف خالص","explicit_unknown"],["معرفش","explicit_unknown"],
 ["ماعرفش","explicit_unknown"],["نسيت","explicit_unknown"],["لا أدري","explicit_unknown"],
 ["idk","explicit_unknown"],["I don't know","explicit_unknown"],["I do not know the answer","explicit_unknown"],
 ["not sure","explicit_unknown"],["I can't remember","explicit_unknown"],
 ["qwertyuiop","obvious_noise"],["asdfghjkl","obvious_noise"],["zxcvbnm","obvious_noise"],
 ["سسسسسسسسسس","obvious_noise"],["aaaaaaa","obvious_noise"],["لا لا لا لا","obvious_noise"],
 ["لا أعرف، لكن سن الرشد 18 سنة كاملة","assessable"],
 ["لا أعلم النص حرفيًا، ولكن الشركة لها ذمة مالية مستقلة","assessable"],
 ["I don't know the article number, but the company may litigate","assessable"],
 ["نعم، للشركة حق التقاضي ولها ممثل قانوني","assessable"],
 ["لا؛ لأنه لا يتوافر شرط الولادة حيا","assessable"],
 ["الشخصية المعنوية لها ذمة مستقلة وحق التقاضي","assessable"],
 ["الضرر وحده لا يكفي لإثبات سوء استعمال الحق","assessable"],
 ["انعدام السبب لا يلغي حق التقاضي","assessable"],
 ["سن الرشد ثمانية عشر سنة","assessable"],
 ["هل يحق للشركة رفع الدعوى؟ نعم","assessable"],
 ["هغعخزغبرر كذم دفح","assessable"], // ambiguous: NO automatic rejection by speculative dictionary
 ["لا", "assessable"], // short but potentially a meaningful legal answer; other validators may check adequacy
];
let passed=0;
for(const [answer,expected] of cases){
 const r=classifyFreeAnswer(answer);
 assert.equal(r.kind,expected,JSON.stringify({answer,expected,actual:r.kind}));
 if(r.kind==="obvious_noise") {
  assert.equal(r.grade,0,"Obvious meaningless input gets deterministic task zero");
  assert.equal(r.counts_as_evidence,true,"Task is recorded as an unsuccessful attempt");
 } else {
  assert.equal(r.grade,null,"Unknown and assessable input should not receive a fabricated grade");
  if(r.kind==="explicit_unknown"||r.kind==="empty")assert.equal(r.counts_as_evidence,false,"A hint/no-answer is not a grade");
 }
 passed++;
}
for(const s of ["لا أعلم","لا أتذكر الإجابة","مش عارف خالص","qwertyuiop","سسسسسسسسس"]){
 assert.notEqual(classifyFreeAnswer(s).kind,"assessable","Clearly non-substantive answers must bypass paid legal AI grading");
}
console.log("PASS: "+passed+" Arabic/English answer cases. Obvious nonsense => task 0%; explicit unknown => hint/no grade; legal content => semantic review.");
