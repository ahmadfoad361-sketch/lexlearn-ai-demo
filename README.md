# LexLearn

Working bilingual prototype for adaptive legal learning in Qatar's Theory of Rights (Civil Code Articles 39–63).

The student completes an initial diagnostic, performs topic-specific tasks, and receives a changing training order based on measured evidence. The program has 24 teaching sessions and six weekly assessments, with sequential unlocking and a final completion screen. Authenticated student attempts, snapshots and learning plans use the existing central Supabase backend and faculty access policies.

The five displayed skills are recall, understanding, application to facts, legal precision and exam answer structure. Untested skills remain unscored. Essay element checks are provisional, prompt-specific lexical checks with visible evidence, not certified semantic judgments. Structured essay checks measure organisation separately from legal correctness. Instructor review and a controlled baseline/follow-up study are required to validate learning impact.

The approved logo is preserved unchanged. Content and rubrics for the active program share one bilingual source in `assets/learning-quality.js`.

Validation: `node tests/adaptive-engine.test.js`, `node tests/production-boundaries.test.js`, `node tests/learning-quality.test.js`, `node tests/program-flow.test.js`, `node scripts/build-public.js`.

All 24 reference rules meet their own bilingual recall rubrics. Exam structure checks require separately populated sections rather than a list of headings. The instructor can inspect submitted essay history. These are software checks, not evidence of learning impact; see [the academic pilot protocol](docs/academic-pilot.md).

Founder: Dr. Ahmed Feky.

Live: https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/
