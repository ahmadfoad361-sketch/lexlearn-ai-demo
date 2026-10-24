/* Real Chrome route-and-training test with intercepted test-only RPC. NOT a hosted Supabase or live OpenAI test. */
const { chromium } = require("playwright-core");
const fs = require("node:fs"), assert = require("node:assert/strict");
const base = "http://127.0.0.1:18765/";
const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium"].find(x => x && fs.existsSync(x));
const UID = "10000000-0000-4000-8000-000000000001";

function fakeCloud(root) {
 const mode = root.localStorage.getItem("fake_adaptive_mode") || "recall-led";
 const byMode = {
  "recall-led": ["understanding", "exam_execution", "recall"],
  "understanding-led": ["recall", "understanding", "exam_execution"],
  foundation: ["understanding", "recall", "exam_execution"]
 };
 const taskIds = { understanding: "rights-v1-s1-understanding", recall: "rights-v1-s1-recall", exam_execution: "rights-v1-s1-exam" };
 const tasks = (byMode[mode] || byMode.foundation).map(d => ({
  id: taskIds[d], dimension: d, title_ar: "سؤال قانوني " + d, title_en: "Legal question " + d,
  prompt_ar: "اذكر القاعدة القانونية وفسرها في واقعة قانونية.", prompt_en: "Explain the legal rule and the facts.",
  sources: []
 }));
 function saved() { try { return JSON.parse(root.localStorage.getItem("fixture_responses") || "[]"); } catch (_) { return []; } }
 function save(rows) { root.localStorage.setItem("fixture_responses", JSON.stringify(rows)); }
 function priority() { return mode === "recall-led" ? "understanding" : mode === "understanding-led" ? "recall" : "foundation"; }
 const query = { select() { return query; }, eq() { return query; }, gte() { return query; }, lte() { return query; },
  order() { return query; }, limit: async () => ({ data: [], error: null }) };
 root.LEX_CLOUD = {
  isConfigured: () => true,
  profile: async () => ({ id: UID, role: "student", active: true, display_name: "Verified Fixture Student" }),
  getConsent: async () => true,
  db: () => ({ auth: { getUser: async () => ({ data: { user: { id: UID } }, error: null }) }, from: () => query }),
  trainingAiSummary: async () => ({ priority: priority(), skills: { recall: 45, understanding: 70 }, status: "preliminary_evidence" }),
  gradeTrainingAi: async (_session, itemId) => {
   const rows = saved(), row = rows.find(x => x.item_id === itemId);
   if (!row) throw Error("grading requires a previously saved answer");
   row.evaluation = { status: "preliminary_ai", rubric_version: "lexlearn-training-ai-v4",
    provisional_percent: row.dimension === "understanding" ? 74 : 55, verdict: "partially_correct",
    feedback_ar: "إجابة قانونية مبدئية مع جزء يحتاج استكمالاً.", feedback_en: "Preliminary answer with one missing element." };
   save(rows);root.localStorage.setItem("fixture_grade_calls", String(Number(root.localStorage.getItem("fixture_grade_calls") || 0) + 1));
   return { status: "preliminary_ai" };
  },
  studentLifecycleRpc: async (action, p) => {
   const rows = saved();
   if (action === "trainingOverview") return { allowed: true, unlocked: rows.length === 3 ? 2 : 1,
    completed_count: rows.length === 3 ? 1 : 0, program_completed: false };
   if (action === "trainingOpen") return { allowed: true, session_number: p.session, tasks, saved: rows, completed: rows.length === 3 };
   if (action === "trainingSubmit") {
    if (!rows.find(x => x.item_id === p.itemId)) rows.push({ item_id: p.itemId, dimension: tasks.find(x => x.id === p.itemId).dimension,
     answer_text: p.answer, evaluation: { status: "preliminary_internal", provisional_percent: null } });
    save(rows);return { allowed: true, saved: rows };
   }
   throw Error("Unexpected student lifecycle action: " + action);
  },
  signOut: async () => true
 };
}

(async () => {
 assert.ok(chrome, "Chromium is required");
 const browser = await chromium.launch({ headless: true, executablePath: chrome, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
 const checks = [];
 try {
  for (const lang of ["ar", "en"]) for (const mode of ["recall-led", "understanding-led", "foundation"]) {
   const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
   const page = await context.newPage(), errors = [];
   page.on("pageerror", e => errors.push(e.message));
   await page.addInitScript(({ uid, mode }) => {
    localStorage.setItem("lexlearn_student_session", JSON.stringify({ cloud: true, studentId: uid }));
    localStorage.setItem("fake_adaptive_mode", mode);
   }, { uid: UID, mode });
   await page.route("**/assets/cloud-data.js**", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "(" + fakeCloud.toString() + ")(window);" }));
   await page.route("**/assets/official-diagnostic.js**", r => r.fulfill({ status: 200, contentType: "application/javascript", body: 'window.LEX_OFFICIAL_DIAGNOSTIC={identity:async()=>"'+UID+'"};' }));
   await page.route("**/assets/legal-study.js**", r => r.fulfill({ status: 200, contentType: "application/javascript", body: 'window.LEX_LEGAL_STUDY={render:()=>"",context:()=>"",qualify:x=>x};' }));
   const legacy = "program" + (lang === "en" ? "-en" : "") + ".html";
   await page.goto(base + legacy + "?country=qa&subject=rights", { waitUntil: "domcontentloaded", timeout: 35000 });
   await page.waitForURL(url => url.pathname.endsWith("/student-path.html") && url.searchParams.get("lang") === lang, { timeout: 20000 });
   const answer = page.locator("#adaptiveEssay");
   await answer.waitFor({ timeout: 20000 });
   const first = await page.locator("#currentPractice").innerText();
   const expected = mode === "understanding-led" ? "recall" : "understanding";
   assert.ok(first.includes(expected), "Expected a tailored first task: " + first);
   await answer.fill("The legal rule gives a clear condition and I apply it to the relevant fact.");
   await page.locator("#adaptiveSubmit").click();
   await page.getByText(/1\s*\/\s*3/).first().waitFor({ timeout: 18000 });
   assert.equal(await page.evaluate(() => Number(localStorage.getItem("fixture_grade_calls"))), 1);
   await page.reload({ waitUntil: "domcontentloaded" });
   await answer.waitFor({ timeout: 18000 });
   await page.getByText(/1\s*\/\s*3/).first().waitFor({ timeout: 18000 });
   assert.equal(await page.evaluate(() => Number(localStorage.getItem("fixture_grade_calls"))), 1, "no paid regrade on reopening");
   for (let task = 2; task <= 3; task++) {
    await answer.fill("The legal issue requires stating the rule, applying each relevant fact, and explaining the conclusion.");
    await page.locator("#adaptiveSubmit").click();
    await page.getByText(new RegExp(task + "\\s*\\/\\s*3")).first().waitFor({ timeout: 18000 });
   }
   await page.getByText(lang === "ar" ? "اكتملت تدريبات الجلسة" : "Practice session completed").waitFor({ timeout: 18000 });
   assert.equal(await page.evaluate(() => Number(localStorage.getItem("fixture_grade_calls"))), 3, "one successful AI grade per saved answer");
   assert.equal(errors.length, 0, errors.join("; "));
   checks.push({ lang, mode, canonicalRoute: true, completedThree: true, reloaded: true });
   await context.close();
  }
  console.log("PASS: canonical training in real Chrome (RPC and AI mocked): " + JSON.stringify(checks));
 } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
