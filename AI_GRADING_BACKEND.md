# LexLearn AI — Grounded Semantic Grading Backend Contract

## لماذا هذه الطبقة منفصلة؟
GitHub Pages واجهة ثابتة ولا يجوز وضع مفتاح نموذج ذكاء اصطناعي داخل JavaScript في المتصفح. لذلك التصحيح الدلالي الإنتاجي يجب أن يعمل في Backend آمن.

## Endpoint
POST /api/grade

### Request
```json
{
  "course_id": "QA-QU-LAWC213",
  "item_id": "213-x1",
  "answer": "إجابة الطالب",
  "language": "ar"
}
```

لا يرسل المتصفح مفتاح API ولا يقرر بنفسه المصادر القانونية.

## Server-side flow
1. Fetch the item by item_id.
2. Reject it unless content status is approved.
3. Load only the approved rubric and approved source excerpts linked to that item/course.
4. Send to the grading model:
   - question
   - approved rubric
   - approved source excerpts
   - learner answer
5. Instruct the model:
   - do not use outside legal knowledge;
   - do not cite any rule/article absent from supplied sources;
   - distinguish omission from contradiction;
   - accept legally equivalent paraphrases;
   - flag unsupported or conflicting statements.
6. Validate structured JSON output server-side.
7. Save feedback as training evidence, not an official university grade.

## Response
```json
{
  "score": 0.75,
  "achieved_criteria": [
    {"id":"c1","label":"المصادر الإرادية","evidence":"..."}
  ],
  "missing_criteria": [
    {"id":"c4","label":"مثال مناسب"}
  ],
  "contradictions": [],
  "feedback_ar": "...",
  "model_confidence": 0.86,
  "needs_human_review": false,
  "source_ids": ["QU_COURSES_AR","QU_CATALOG_2526"]
}
```

## Mandatory fallback
If the model response is invalid, confidence is low, or evidence conflicts:
```json
{
  "needs_human_review": true,
  "score": null
}
```

## Current prototype behavior
The live GitHub Pages build uses `concept_rubric_v2` locally. It matches required concepts using multiple accepted expressions and partial phrase matching. This is intentionally more flexible than exact keyword matching, but it is not a substitute for the secure grounded AI endpoint above.
