const assert = require("node:assert/strict");
const fs = require("node:fs");
const Cycle = require("../assets/showcase-learning-cycle.js");
const asHtml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

for(const lang of ["ar","en"]){
  for(const mode of ["recall","understanding","foundation","balanced"]){
    const tasks = Cycle.plan(mode,lang);
    assert.equal(tasks.length,4);
    assert(tasks.every(t=>t.title&&t.prompt&&(t.type==="choice"||t.type==="free")));
    assert(tasks.some(t=>t.type==="free"),"Must contain a constructed response");
    assert(tasks.some(t=>t.type==="choice"),"Must have a check with objective feedback");
    assert(tasks.some(t=>t.type==="choice"&&/case|وقائع|واقعة|شرط|condition|استثمر|apply/i.test(t.title)),"Must include transfer practice");
    assert(tasks.filter(t=>t.type==="choice").every(t=>t.options.length===3&&t.correct===0));
    assert(tasks.filter(t=>t.type==="free").every(t=>t.comparison&&t.lesson));
  }
}
let markup="",els={};
const makeElement=(attrs={})=>{
  const node={attrs,onclick:null,disabled:false,textContent:"",value:"",classList:{classes:[],add(x){this.classes.push(x)}},
    getAttribute(key){return this.attrs[key]},focus(){}};
  let htmlValue="";
  Object.defineProperty(node,"innerHTML",{get(){return htmlValue},set(value){
    htmlValue=String(value);
    // Browsers create children when innerHTML changes; model this in the test DOM.
    for(const found of htmlValue.matchAll(/\bid="([^"]+)"/g))els[found[1]]=makeElement();
  }});
  return node;
};
global.document={
  getElementById(id){return els[id]||null},
  querySelectorAll(sel){return sel==="[data-cycle-choice]"?(els._choices||[]):[]}
};
let backCalls=0;
function stage(percent,html){
  assert.equal(percent,100);
  markup=html;
  els={};
  for(const found of html.matchAll(/\bid="([^"]+)"/g))els[found[1]]=makeElement();
  els._choices=[...html.matchAll(/data-cycle-choice="(\d+)"/g)].map(x=>makeElement({"data-cycle-choice":x[1]}));
}
for(const lang of ["ar","en"]){
  for(const mode of ["recall","understanding","foundation","balanced"]){
    let tasks=Cycle.plan(mode,lang);
    const did=Cycle.run({lang,weak:mode,stage,goBack(){backCalls++}});
    assert.equal(did,true);
    assert(els.cycleStart,"Must present an invitation to start guided practice");
    els.cycleStart.onclick();
    for(let i=0;i<4;i++){
      assert(markup.includes(tasks[i].title),"Practice step must match the selected weakness");
      assert(markup.includes((i+1)+" / 4"),"Numbered stages are required");
      if(tasks[i].type==="free"){
        els.cycleAnswer.value="المعلومة القانونية مع شرح الشرط والنتيجة. Reasoned comparison.";
        els.cycleCompare.onclick();
        assert(els.cycleFeedback.innerHTML.includes(asHtml(tasks[i].comparison)));
        assert(els.cycleFeedback.innerHTML.includes(lang==="en"?"No automated semantic grading":"لم تُجرَ مقارنة دلالية"));
      }else{
        const right=els._choices.find(x=>x.getAttribute("data-cycle-choice")==="0");
        assert(right,"Expected an objective correct alternative");
        right.onclick();
        assert(els._choices.every(x=>x.disabled),"Options must lock after an answer");
        assert(els.cycleFeedback.innerHTML.includes(asHtml(tasks[i].feedback)));
      }
      assert(els.cycleNext,"Next step must require completed interaction");
      els.cycleNext.onclick();
    }
    assert(markup.includes(lang==="ar"?"اكتملت دورة التدريب":"Practice cycle complete"));
    assert(markup.includes(lang==="ar"?"لم تدخل في العدد":"were not scored"));
    assert(els.cycleAgain&&els.cycleBack);
    assert(els.cycleFirstStage,"A completed cycle must offer stage-one preview");
    assert(markup.includes((lang==="ar"?"program.html":"program-en.html")+"?demo=1&start=1&preview=stage1&country=qa&subject=rights"),
      "Stage-one CTA must not loop back to an unsigned official programme");
    assert(markup.includes(lang==="ar"?"البرنامج الجامعي ما زال غير معتمد":"not yet approved for students"),
      "Academic pilot release status must be explicit");
    els.cycleBack.onclick();
    els.cycleAgain.onclick();
    assert(els.cycleStart,"Restart must reset the training cycle");
  }
}
assert.equal(backCalls,8);
for (const [recall,understanding,expected] of [
  [20,25,"foundation"],[0,0,"foundation"],[40,80,"recall"],
  [90,30,"understanding"],[75,75,"balanced"],[null,30,"balanced"],
  [30,null,"balanced"],[NaN,30,"balanced"],[-5,30,"balanced"],[150,30,"balanced"]
]) assert.equal(Cycle.recommend(recall,understanding),expected);
const build=fs.readFileSync("scripts/build-public.js","utf8");
for(const asset of ["showcase-learning-cycle.js","showcase-learning-cycle.css"])assert(build.includes(asset));
for(const page of ["showcase.html","showcase-en.html"]){
  const html=fs.readFileSync(page,"utf8");
  assert(html.includes("assets/showcase-learning-cycle.js"));
  assert(html.includes("assets/showcase-learning-cycle.css"));
  assert(html.indexOf("showcase-learning-cycle.js")<html.indexOf(page==="showcase.html"?"assets/showcase.js":"assets/showcase-en.js"));
}
console.log("Interactive research-aligned learning cycle (3 branches, 2 languages, 4 steps, feedback): PASS");
