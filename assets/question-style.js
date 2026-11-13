/* Default question authoring and presentation. Canonical prompts and grading stay separate. */
(function(root){
"use strict";
var VERSION="lexlearn-question-style-v1";
var beginner=root.LEX_BEGINNER_PROMPTS;
if(!beginner&&typeof require==="function")beginner=require("./beginner-prompts.js");
var policy=Object.freeze({
 version:VERSION,
 recall:"Retrieve the rule and its conditions before seeing the answer. Keep the requested memory cues.",
 understanding:"Explain in your own words. Compare the supplied statements, correct the inaccurate one, and explain the decisive difference.",
 application:"Apply the approved rule to the supplied facts. Preserve every qualification and each requested outcome.",
 exam:"Explain the question, relevant rule, connection to the facts and conclusion in short steps.",
 review:"Reuse the saved approved task with the same requirements. Do not turn a practice review into a new scored assessment.",
 safeguards:"Use Arabic and English for first-year learners. Never add facts, hints, rubric elements, scores, weights or approval. Keep the original prompt."
});
var examSteps={
 ar:["المسألة: اكتب السؤال الذي تريد الإجابة عنه في الواقعة. تكفي جملة واحدة.",
 "القاعدة: اكتب الحكم أو الشرط القانوني الذي تعتمد عليه. لا يلزم رقم المادة إلا إذا طُلب.",
 "التطبيق: اربط ما حدث بشروط القاعدة. وضّح لماذا تحققت الشروط أو لم تتحقق.",
 "النتيجة: أجب عن سؤال الواقعة مع سبب قصير. اكتب كل جزء تحت عنوانه."],
 en:["Issue: write the question to answer about these facts. One sentence is enough.",
 "Rule: write the legal rule or condition you rely on. An article number is not required unless requested.",
 "Application: connect what happened to the rule's conditions. Explain why they are or are not met.",
 "Conclusion: answer the case question with a short reason. Use a heading for each section."]
};
// Only replace these exact instructions. Edited or unfamiliar questions retain their wording.
var originalExamSteps={
 ar:["المسألة: اكتب السؤال القانوني المطلوب حسمه في الواقعة، بجملة واحدة.","القاعدة: اذكر القاعدة أو الشرط القانوني الذي ستعتمد عليه؛ لا يلزم رقم المادة إلا إذا طُلب.","التطبيق: اربط الوقائع بالقاعدة، ووضّح لماذا تتحقق شروطها أو لا تتحقق.","النتيجة: أجب عن سؤال الواقعة بوضوح، مع سبب مختصر. اكتب كل جزء تحت عنوانه."],
 en:["Issue: state the legal question raised by the facts in one sentence.","Rule: identify the relevant legal rule or condition; an article number is not required unless requested.","Application: connect the facts to the rule and explain which conditions are or are not met.","Conclusion: answer the question clearly with a brief reason. Use a heading for each section."]
};
function prepare(task,language){
 var lang=language==="en"?"en":"ar",raw=String(task&&task[lang==="en"?"prompt_en":"prompt_ar"]||"");
 if(!task)return raw;
 if(["recall","understanding"].includes(task.dimension)&&!knownEssay(raw,task.dimension,lang))return raw;
 var text=beginner?beginner.prepare(task,lang):raw;
 if(task.dimension==="exam_execution"){
  var lines=text.split(/\r?\n/);
  if(JSON.stringify(lines.slice(1))===JSON.stringify(originalExamSteps[lang]))
   text=[lines[0]].concat(examSteps[lang]).join("\n");
 }
 return text;
}
function knownEssay(raw,dim,lang){
 var lines=raw.split(/\r?\n/),ar=lang==="ar";
 var title=ar?(lines[0].match(/«([^»]+)»/)||[])[1]:(lines[0].match(/“([^”]+)”/)||[])[1];
 var ref=(lines[0].match(/\(([^)]+)\)/)||[])[1];
 if(!title||!ref)return false;
 var first=dim==="recall"?(ar?"من ذاكرتك، اكتب قاعدة «"+title+"» ("+ref+")، ثم اختر ثلاث كلمات أو عبارات قصيرة تساعدك على تذكّر عناصرها.":"From memory, write the rule on “"+title+"” ("+ref+"), then choose three short words or phrases that help you recall its elements."):
  (ar?"اشرح قاعدة «"+title+"» ("+ref+") بأسلوبك، بحيث يفهم القارئ معناها وشروطها.":"Explain the rule on “"+title+"” ("+ref+") in your own words so a reader can understand its meaning and conditions.");
 var instructions=dim==="recall"?(ar?["اكتب عناصر القاعدة وشروطها التي تتذكرها، دون الرجوع إلى النص.","اذكر ثلاثة مفاتيح للحفظ؛ والمفتاح كلمة أو عبارة تذكّرك بجزء من القاعدة.","اشرح بإيجاز الجزء الذي يذكّرك به كل مفتاح. لا يُطلب مثال أو تطبيق على واقعة."]:["Write the elements and conditions you remember without consulting the text.","Give three memory cues: a cue is a short word or phrase that reminds you of part of the rule.","Briefly explain what each cue helps you recall. No example or application to facts is required."]):
  (ar?["اشرح معنى عناصر القاعدة وشروطها بجمل قصيرة.","قارن العبارتين أدناه: حدّد العبارة غير الدقيقة وصححها، وبيّن باختصار أثر الكلمة أو الشرط المختلف.","لا يُطلب حل واقعة أو كتابة مقال طويل."]:["Explain the elements and conditions in short sentences.","Compare the two statements below: identify and correct the inaccurate one, and briefly explain the effect of the changed word or condition.","No fact pattern or long essay is required."]);
 return lines[0]===first&&JSON.stringify(lines.slice(1,4))===JSON.stringify(instructions)&&
  (dim==="recall"?lines.length===4:lines.length===7&&lines[4]===(ar?"عبارتان للمقارنة؛ إحداهما غير دقيقة:":"Compare these statements; one is inaccurate:"));
}
function author(task,language){
 if(!task||!task.qualityRubric||!["recall","understanding","exam"].includes(task.dimension))return task;
 var lang=language==="en"?"en":"ar",r=task.qualityRubric;
 var original=[task.q].concat(task.instructions||[]);
 if(task.comparison)original=original.concat([lang==="en"?"Compare these statements; one is inaccurate:":"عبارتان للمقارنة؛ إحداهما غير دقيقة:"],task.comparison);
 var raw=original.join("\n"),input={id:"rights-v1-s"+r.topicSession+"-"+(task.dimension==="exam"?"exam":task.dimension),dimension:task.dimension==="exam"?"exam_execution":task.dimension};
 input[lang==="en"?"prompt_en":"prompt_ar"]=raw;
 // Add presentation fields only. IDs, dimensions, references and all rubric objects are unchanged.
 return Object.assign({},task,{questionStyle:VERSION,originalPrompt:raw,displayPrompt:prepare(input,lang)});
}
function diagnostic(question,language){
 // Objective diagnostic choices and their order stay exactly as approved. Do not add a
 // comparison or an explanation requirement to a question scored as a single choice.
 var lang=language==="en"?"en":"ar";
 return {prompt:String(question&&question[lang]||""),options:Array.from(question&&question[lang+"Options"]||[]),questionStyle:VERSION};
}
function freeDiagnostic(language){return language==="en"?
 "Answer from memory in your own words. Do not reopen the legal text.\n1. When does a human being's legal personality begin?\n2. When does it end?\n3. What does Article 40 of the Qatar Civil Code, promulgated by Law No. 22 of 2004, say about an unborn child's rights?":
 "أجب من ذاكرتك بأسلوبك. لا تفتح النص القانوني.\n1. متى تبدأ الشخصية القانونية للإنسان؟\n2. متى تنتهي؟\n3. ماذا تقول المادة 40 من القانون المدني القطري الصادر بالقانون رقم (22) لسنة 2004 عن حقوق الجنين قبل ولادته؟";
}
function render(text,language){return beginner.render(text,language);}
var api=Object.freeze({version:VERSION,policy:policy,prepare:prepare,author:author,diagnostic:diagnostic,freeDiagnostic:freeDiagnostic,render:render});
root.LEX_QUESTION_STYLE=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
