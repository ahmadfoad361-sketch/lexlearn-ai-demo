# LexLearn Issue 36 — student diagnostic, adaptive plan and release report

**2026-10-18 | Branch:** fix/issue-36-student-diagnostic-architecture
**Delivery:** isolated review branch only; no merge, no production deployment, no DDL/RLS changes.

## Confirmed root cause

The public showcase stores a demo state and demo_submissions independently of the authenticated student profile read by program.js and student.js. The preview route can simulate stage one with null skill indicators, but that is not an official student diagnostic. In addition, certain score displays coerce null to zero and local heuristics can substitute 50 for missing evidence. Objective answers, provisional lexical free-answer checks and the four guided demonstration activities represent three different evidence classes.

## Architecture and implementation

PUBLIC: showcase / showcase-en → six sample MCQs + free answer → four guided practice tasks → demonstration-only summary. This path never creates an official student baseline or academic progression.

REGISTERED: active Supabase-authenticated student → active course enrollment + learning-data consent → diagnostic.html (Arabic/English) → check human-approved questions → one objective assessment and optional free answer → versioned result with per-item source, methods, statuses, counts and timestamps → two scoped learner_snapshots of type profile and course → verify by cloud readback → student-specific training plan → stage-one session entry, gated by academic approvals.

- Shared implementation: assets/official-diagnostic.js and diagnostic.html. Both programs and both student portals consume the same scoped diagnostic.
- Official record: student_id, course_id, attempt_id, completed_at, version, rubric_version, individual answers, measurement provenance, review_status and trainingPlan.
- Source of truth: learner_snapshots, keyed by authenticated user, qa-rights, snapshot type. Course snapshot stores the diagnosticAttemptId and officialTrainingPlan. On partial save/relogin, restore repairs a missing course snapshot without making the student repeat the diagnostic; the app refuses to claim cloud persistence on failure.
- Language switching retains a same-tab unfinished draft in sessionStorage; the saved profile and course are language-independent. A demo receipt is never promoted to a graded student record.
- Actual learning items remain protected: the official diagnostic requires six independently approved, reviewed content_items mapped by metadata.official_diagnostic_v1_id, while first-stage training checks existing PILOT_RELEASE_TOPICS. Until approval the student sees an informative locked state instead of academic content.

## Honest scoring and adaptation

MCQ rule recognition is not unaided memorization. Free recall is null/pending_human_review without a grounded reviewed score; lexical similarity cannot automatically award legal mastery. A genuine 0 is used only for a valid, wrong *scored* objective answer. Missing values stay null/Not measured, not 0 and not a fabricated 50. Four public activities show x/y practice questions, not a second diagnostic result. No progress gain or retention effect is claimed without comparable follow-up assessment.

Three differentiated *provisional* first-session plans:
- Recognition stronger than explanation: explain the rule, change one fact, supported retrieval. This is explicitly labelled a rule-recognition advantage, not verified free recall.
- Understanding stronger than recognition: memory cues, reconstruction and delayed retrieval; unaided recall remains pending review.
- Insufficient evidence: worked example, supported decision and unaided check, without inventing a strong or weak dimension.
A balanced provisional plan also exists. The student sees a reason and the missing evidence. These short question groups are NOT a validated psychometric diagnostic.

## Files changed

New: diagnostic.html, assets/official-diagnostic.js, tests/official-diagnostic.test.js and this report.
Updated: assets/program.js, assets/program-en.js, assets/student.js, assets/student-en.js; the four matching HTML shells; scripts/build-public.js; .github/workflows/quality.yml and .github/workflows/pages.yml.
Existing public showcase scripts and their four guided tasks remain separate.

## Actual tests and limitations

GitHub Actions quality checks on this branch completed successfully after the implementation changes, including the existing bilingual 30-session *fixture* checks, demo regression suite, grading safety, production-boundary checks and the new mock-cloud test.

The new test actually exercised three artificial learners (recognition-led, understanding-led, insufficient), saved session 1 with three different task orders, valid objective zero vs unmeasured null, pending free review, no automatic keyword score, a repeated attempt that cannot overwrite the first, failed cloud persistence, interrupted profile/course save, reload with empty browser cache and cloud restoration. English/Arabic integration paths were inspected by automated source and build tests. **These are mocked cloud and Node tests, not real browser tests against live Supabase.**

Still required before accepting the user story: real Chrome/mobile E2E with authorized test accounts; logged-out/relogin and locale switch with real network; two-user unauthorized access attempts; proof of every task's academic approval; network failure handling while training; network screenshots and supervisor review workflow. The current first academic lesson is gated, so a full authenticated *live* session cannot yet pass.

## Live Supabase inspection (read-only)

Production project: emxiuwcuxyljfynnzpnh. RLS was enabled on learner_snapshots, learning_plans, content_items, attempts and enrollments. Snapshot own writes/read use auth.uid with an active-user check and scoped staff access; there is an existing unique key (user_id,course_id,snapshot_type). The Qatar rights course is qa-qu-lawc101-rights, and there were 2 matching enrollments. **All 76 current academic content items were legal_review** at inspection. No migration, change to a policy, approval status, role, secret or production data was performed.

Important limitation: a learner can currently write his/her own course snapshot under existing RLS. UI sequential locks are not server-authoritative anti-tamper controls. Before an academic-stakes pilot, a separately reviewed server-side finalization/progression endpoint and immutable evidence contract are necessary, with explicit authorization for any RLS change. Do not weaken owner/staff RLS to accelerate the release.

## Acceptance decision and next gates

- PASS: isolated branch, separation contract, evidence model, first-session plan derivation, honest null display, no paid OpenAI API, existing demonstration unaffected, unit/mocked integration CI.
- CONDITIONAL: cloud readback/recovery as verified in mocks; real authenticated integration and locale/relogin still to test.
- BLOCKED: academic approval of the official six diagnostic items and 76 candidate curriculum items, review of actual semantic recall, release of pilot topics, browser E2E with test accounts, server-side anti-cheat progression.

**Do not merge, publish or change production RLS until the items above are cleared and reviewed.** Rollback requires only closing the draft PR: main and production are unchanged.
