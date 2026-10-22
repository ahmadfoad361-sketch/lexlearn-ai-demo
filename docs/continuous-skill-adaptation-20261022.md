# LexLearn continuous adaptation — implementation handoff (2026-10-22)

## Branch safety
Feature branch only. **Do not apply the DRAFT SQL migration to LexLearn Production without a reviewed release decision**, backup, staged accounts and an authenticated browser/network check. Do not merge or publish automatically. Existing production learner results and public four-task showcase stay untouched.

## What changed
1. `assets/skill-policy.js`: continuous, uncertainty-aware assessment of actual **unaided recall** and **understanding** indicators. Explicitly rejects rule recognition as recall. Both numbers must come from assessable observations; otherwise the result is `measurement_needed`, never an invented zero or 50% skill grade.
2. `assets/server-diagnostic.js`: separates preliminary free-recall coverage from rule recognition, understanding, and application on the result screen; displays review state without hiding the student learning plan.
3. `assets/student-path.js` / `student-path.html`: visualised task-specific learning instructions with student-level evidence, provisional labels and a fallback policy based on saved practice evidence. The independently stored authoritative server task list remains authoritative; the browser does not unlock or alter grades.
4. `supabase/migrations/20261022_001_continuous_skill_policy_DRAFT.sql`: proposes founder-pilot **server** functions for individual decision plus distinct learning scaffolds. Requires review before deployment. Adds explicit dual-low foundation handling to new diagnostic completions, preserves the official source rubric, and does not invent recall grades.
5. `tests/continuous-skill-policy.test.js` and `tests/sql/continuous-skill-policy-acceptance.sql`: four learner quadrants, tiny differences, uncertainty and missing evidence, opposite bridge directions, provisional scores and no false mastery. CI hooks added to quality.yml.

## Design parameterization (proposed, not a published learning-science constant)
- Recall and understanding are *two numeric dimensions*, not lifelong categories.
- When either dimension is not independently measured, keep the indicator null; use guided balanced/diagnostic practice while checking unaided recall.
- Compute an uncertainty allowance from number of independent observations; *differences of 2–3 percentage points never trigger a skill switch* based on these sparse indicators.
- Both below 40: provisional foundational path. Both above 85: provisional consolidation/transfer. Values here are configurable product hypotheses, not empirically calibrated cutoffs.
- With independently reviewed high-confidence indicators, allow a continuous bridge: attention to the weaker skill increases gradually, within 50–85%; no hard-coded student personality.
- With repeatedly observed *low-confidence textual coverage*, a wide difference after at least six observations in **each** dimension may provisionally suggest 50–60% weak-skill practice, labelled `provisional_bridge`. It is not academic mastery, validated correctness or independent learning evidence.
- Every training task can show strategy-specific instructional scaffolding. This changes the learning *method* for the same law-approved question; no unsourced legal text is generated.
- All saved responses can mark **practice completion**. Mastery remains unconfirmed without an independent reviewed assessment and delayed retention evidence. Level unlocking is a *practice progression* only.

## Critical limitations / acceptance blockers
- Current formal diagnostic has 3 rule-recognition MCQs, 2 understanding MCQs, 1 application MCQ, and an independent free-recall response. Recognition **cannot** become a genuine recall percentage. Free-recall lexical coverage is only preliminary, low-confidence; if human reviewed grading is unavailable, a reliable numeric recall indicator is not yet available. The planned final UX goal of two dependable numbers is not fully met until the diagnostic bank and grading undergo rigorous review.
- Proposed SQL is **not applied to Supabase Production**, and the published website remains unchanged; the frontend additions are not yet a live end-to-end release.
- Server SQL practice personalization is scaffolding plus task order/priority, not an automatically generated and scientifically validated bespoke curriculum. Real tutor differentiation must be validated against fixed-order task delivery.
- Current six-category academic certification, PDF student reporting, supervisor controls, human appeal and final testing still require separate audits.
- The project does **not** yet prove that LexLearn's approach outperforms equivalent time and tasks delivered without adaptation.

## Release prerequisites
1. GitHub quality and isolated PostgreSQL tests green.
2. Independent law-content, rubric and pilot-ethics sign-off, with signed date and reviewer.
3. Stage/development project with two real authenticated test accounts and negative RLS API checks.
4. Confirm read-back of diagnostic/plan and session history over refresh, logout/login, both locales and device sizes.
5. Verify each quadrant plus small 2–3% differences, network failure, uncertainty, 30-session gated progression, no fabricated grades, report accuracy and honest completion wording.
6. User approves an exact release SHA and separately reviews the Supabase migration before live deployment.

## References
- `docs/learning-design-qatar.md` and `docs/lexlearn-evidence-update-20261016.md`
- Dunlosky et al. 2013 (retrieval, distributed practice); Pashler et al. 2008 (avoid fixed learning styles). The custom LexLearn weighting has **not** been scientifically validated.
