const assert = require("node:assert/strict");
const path = require("node:path");
const {assess}=require(path.join(__dirname,"..","assets","showcase-recall.js"));
const scenarios=[
 {name:"Arabic full rule",lang:"ar",answer:"تبدأ شخصية الإنسان بتمام ولادته حياً وتنتهي بموته، والحمل المستكن أهل لثبوت الحقوق التي لا يحتاج سببها إلى قبول بشرط تمام ولادته حياً.",score:100},
 {name:"Arabic correct paraphrase",lang:"ar",answer:"تثبت الشخصية القانونية عند الميلاد حياً وتزول عند الوفاة، ويتمتع الجنين بحقوق لا يتطلب سببها القبول على أن يولد حياً.",score:100},
 {name:"English correct",lang:"en",answer:"Legal personality begins upon live birth and ends at death. The unborn child has rights not requiring acceptance provided the child is born alive.",score:100},
 {name:"English paraphrase",lang:"en",answer:"A human's legal personality commences when born alive and terminates on death. An unborn child may benefit from rights that do not require acceptance, conditional on live birth.",score:100},
 {name:"Gibberish",lang:"ar",answer:"شيربيب",score:null,reason:"no_legal_content"},
 {name:"Bare fragment",lang:"ar",answer:"الولادة حيا",score:null,reason:"incomplete_proposition"},
 {name:"Explicit false rule",lang:"ar",answer:"لا تبدأ الشخصية القانونية بالولادة حياً ولا تنتهي بالوفاة.",score:0},
 {name:"Contradictory claim",lang:"ar",answer:"تبدأ شخصية الإنسان بتمام ولادته حياً، ولكن لا تبدأ شخصية الإنسان بتمام ولادته حياً.",score:null,reason:"conflicting_propositions"},
 {name:"Wrong start",lang:"ar",answer:"تبدأ الشخصية القانونية عند الحمل وتنتهي عند بلوغ الرشد.",score:0},
 {name:"Exclusive start",lang:"ar",answer:"لا تبدأ شخصية الإنسان إلا بتمام ولادته حياً.",score:29}
];
let passed=0;
for(const c of scenarios){
 const r=assess(c.answer,c.lang);
 assert.equal(r.recall_score,c.score,c.name);
 if(c.reason)assert.equal(r.details.reason,c.reason,c.name);
 passed++;
}
console.log("LexLearn conservative recall smoke tests passed:",passed);
