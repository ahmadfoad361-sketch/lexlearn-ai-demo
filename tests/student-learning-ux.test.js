const assert=require("node:assert/strict");
const fs=require("node:fs");
const beginner=require("../assets/beginner-prompts.js");
const raw=[
"اشرح قاعدة «موطن الشخص» (المادة 42).",
"1. اشرح معنى القاعدة.",
"2. حدّد أهم شروطها.",
"3. اشرح أثر تغيير شرط.",
"عبارتان للمقارنة؛ إحداهما غير دقيقة:",
"مكان الميلاد هو الموطن دائمًا.",
"الإقامة المعتادة قد تحدد الموطن."
].join("\n");
const prompt=beginner.prepare({id:"test-understanding",dimension:"understanding",prompt_ar:raw},"ar");
assert.ok(prompt.includes("عبارتان للمقارنة"));
assert.ok(prompt.indexOf("2. أي العبارتين")<prompt.indexOf("عبارتان للمقارنة"));
assert.ok(prompt.indexOf("عبارتان للمقارنة")<prompt.indexOf("3. في سطر"));
const html=beginner.render(prompt,"ar");
assert.ok(html.indexOf("questionComparison")<html.indexOf("questionFollowup"));
assert.ok(html.includes("الإقامة المعتادة"));
assert.ok(!beginner.render("ما معنى الحق؟","ar").includes("questionComparison"));
const student=fs.readFileSync("assets/student-path.js","utf8");
assert.ok(student.includes("lawNumberRail(data.tasks,lang())"),"article rail must use exact session source IDs");
assert.ok(student.includes("startGradingWait"),"grading wait must stay active");
assert.ok(!student.includes("بتصحيح OpenAI."),"learner feedback must not brand the model provider");
assert.ok(student.includes('replace(/Open[\\s-]*AI/gi'),"dynamic feedback must mask provider branding");
const styles=fs.readFileSync("assets/learner-experience.css","utf8");
assert.ok(styles.includes(".legalNumberRail")&&styles.includes("position:sticky"));
assert.ok(styles.includes("--lx-tab-paper:#f3e2c7")&&styles.includes("--lx-tab-paper:#34445c"),"paper tabs have distinct light/dark colors");
assert.ok(styles.includes("clip-path:polygon(")&&styles.includes(".legalNumberChip"),"article numbers are shown as notebook-style bookmark tabs");
assert.ok(styles.includes("min-width:1540px")&&styles.includes("max-width:600px"),"bookmark rail has sidebar and mobile treatments");
assert.ok(styles.includes("body:has(#officialDiagnostic)"),"diagnostic contrast must work in dark mode");
assert.ok(styles.includes("prefers-reduced-motion"),"respect reduced motion");
const published=fs.readFileSync("scripts/build-public.js","utf8");
for(const asset of ['"beginner-prompts.js"','"student-path.js"','"learner-experience.css"'])
 assert.ok(published.includes(asset),"required asset missing from public build: "+asset);
console.log("PASS: simplified bilingual questions, comparison placement, article rail, vendor-neutral student text, dark-mode contrast");
