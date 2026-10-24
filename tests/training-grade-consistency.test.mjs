import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { summarize, interpret, VERSION } from "../supabase/functions/lexlearn-training-ai-grade/assessment.mjs";

const result = (dimension, status, rubric_version, provisional_percent) => ({
  dimension, evaluation: { status, rubric_version, provisional_percent }
});

test("only confirmed current v4 training grades drive adaptive skill scores", () => {
  assert.equal(VERSION, "lexlearn-training-ai-v4");
  const data = summarize([
    result("recall", "preliminary_internal", undefined, 100),
    result("recall", "preliminary_ai", "lexlearn-training-ai-v2", 90),
    result("recall", "ai_review_required", VERSION, 97),
    result("recall", "preliminary_ai", VERSION, 40),
    result("understanding", "preliminary_ai", "lexlearn-training-ai-v3", 99),
    result("understanding", "preliminary_ai", VERSION, 75)
  ], null);
  assert.deepEqual(data.skills, { recall: 40, understanding: 75 });
  assert.equal(data.priority, "recall");
});

test("missing AI result remains unknown instead of becoming a made-up mark", () => {
  const data = summarize([
    result("recall", "preliminary_internal", null, 88),
    result("understanding", "ai_review_required", VERSION, null)
  ], null);
  assert.deepEqual(data.skills, { recall: null, understanding: null });
  assert.equal(data.priority, "foundation");
});

test("zero is a legitimate confirmed mark, not a missing mark", () => {
  const data = summarize([result("recall", "preliminary_ai", VERSION, 0)], null);
  assert.equal(data.skills.recall, 0);
});

test("deterministic rubric computes partial credit independent of model total", () => {
  const rubric = { criteria: [
    { id: "live_birth", label: "ولادة حية", weight: 2 },
    { id: "prenatal", label: "حقوق الحمل", weight: 1 }
  ] };
  const answer = "تبدأ الشخصية بالولادة حياً، وقد ذكرت الحمل دون ذكر الشرط.";
  const grade = interpret({
    review_required: false, confidence: .93,
    criteria: [
      { id: "live_birth", met: true, credit: 1, evidence: "بالولادة حياً", explanation_ar: "صحيح", explanation_en: "Correct" },
      { id: "prenatal", met: false, credit: .5, evidence: "ذكرت الحمل", explanation_ar: "الشرط ناقص", explanation_en: "Condition missing" }
    ], feedback_ar: "أحسنت، أكمل الشرط.", feedback_en: "Good start; add the condition."
  }, rubric, answer);
  assert.equal(grade.status, "preliminary_ai");
  assert.equal(grade.provisional_percent, 83);
  assert.deepEqual(grade.criteria_partial, ["prenatal"]);
  assert.equal(grade.academic_certified, false);
});

test("invented evidence and uncertain scores are rejected", () => {
  const rubric = { criteria: [{ id: "condition", weight: 1 }] };
  const response = { confidence: .91, review_required: false,
    criteria: [{ id: "condition", met: true, credit: 1, evidence: "unquoted words", explanation_ar: "صحيح", explanation_en: "Correct" }],
    feedback_ar: "تحليل", feedback_en: "Feedback" };
  assert.throws(() => interpret(response, rubric, "إجابتي الأصلية"), /invalid_evidence/);
  assert.throws(() => interpret({ ...response, confidence: .5 }, rubric, "إجابتي الأصلية"), /human_review_required/);
});

test("public and authenticated flows stay separated and no opening-page batch regrade", () => {
  const client = readFileSync(new URL("../assets/student-path.js", import.meta.url), "utf8");
  assert.match(client, /function confirmedGrade\(ev\)/);
  assert.doesNotMatch(client, /var repair=\(data\.saved\|\|\[\]\)/);
  for (const [path, language] of [["program.js", "ar"], ["program-en.js", "en"]]) {
    const legacy = readFileSync(new URL("../assets/" + path, import.meta.url), "utf8");
    assert.ok(legacy.includes('location.replace("student-path.html?lang=' + language + '")'));
  }
});
