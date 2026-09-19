# LexLearn AI v7 — Adaptive Training Implementation Report

Date: 2026-09-19

## Scope

This release extends the existing v6.5 prototype. It does not rebuild the product or replace the approved visual identity. The work focuses on retention, error-aware review, observation, hierarchical mastery, confidence calibration, an Exam Intelligence MVP schema, testability, and safer pilot boundaries.

## Files changed / added

- `assets/adaptive-engine.js` — pure adaptive-learning engine.
- `assets/app.js` — integration with the current student/admin experience.
- `assets/content.js` — backward-compatible metadata enrichment.
- `index.html` — loads the adaptive engine and bumps cache version to v7.0.
- `tests/adaptive-engine.test.js` — automated logic tests.
- `.github/workflows/quality.yml` — syntax and adaptive-engine CI checks.
- `.github/workflows/pages.yml` — Pages deployment is gated by tests.
- `IMPLEMENTATION_REPORT_V7.md` — this report.

## Implemented behavior

### 1. Confirmed retention before path completion

A skill path is no longer completed from one >=80% assessment.

First pass:
- stores `firstPassAt`;
- stores `retentionDueAt`;
- switches to `retention_check_pending`;
- records `retentionStatus = pending`.

The retention check is not available until at least 24 hours have elapsed. A second >=80% pass then records `confirmedAt`, sets `retentionStatus = confirmed`, and completes the path.

Failure on the delayed check returns the path to practice, records a retention failure, and schedules a faster review.

### 2. Error-aware review scheduling

Review timing now considers error type in addition to score:
- high-confidence misconception: 6 hours;
- concept confusion: 12 hours;
- application difficulty: 24 hours;
- retention failure: 6 hours;
- exam/incomplete-understanding gaps: 24 hours;
- ordinary knowledge gap: 24 or 72 hours depending on score.

The rules live centrally in `assets/adaptive-engine.js`.

### 3. Review variants

Reviews and delayed checks try to avoid the exact original item. Selection prefers:
1. same `variantGroupId`;
2. same `conceptId` and dimension;
3. same unit and dimension;
4. same dimension.

The current content bank is still small, so fallback can still occur when no alternative exists. The data model is now ready for richer authored variants.

### 4. Interactive Learn stage

The micro-lesson now requires a small, non-graded interaction before the student can move to practice. It is deliberately not added to mastery scoring.

### 5. Observation dimension

`observation` is now a sixth performance dimension. MISSING_ELEMENT and CHANGE_ONE_FACT activities generate separate observation evidence instead of being absorbed only into recall/precision/transfer. Each current course also has an observation micro-lesson.

### 6. Hierarchical mastery

Content items now support:
- `courseId`
- `unitId`
- `conceptId`
- `dimension`
- `variantGroupId`

The engine computes:
- dimension mastery;
- unit mastery;
- concept mastery.

The student dashboard and instructor view expose unit-level summaries.

### 7. Calibration

Confidence data is compared with actual group performance over recent evidence. Current states are:
- accurate;
- overconfidence;
- underconfidence;
- insufficient_data.

The numeric difference is retained internally; the interface shows a simpler educational label.

### 8. Priority weakness selection

Primary weakness is no longer chosen only by the lowest mastery score. Priority can now include:
- mastery weakness;
- exam importance weight;
- repeated errors;
- error type;
- high-confidence misconception;
- retention failure.

The engine also returns `reasons` for explainability.

### 9. Exam Intelligence MVP

The schema now supports:
- `examFrequencyTag`: rare / medium / frequent / unknown;
- `examImportanceWeight`;
- `frequencySource`.

No historical exam frequency has been fabricated. Current seeded content is marked `unknown` with weight 0 until verified evidence is entered from past exams, faculty review, or another documented source.

### 10. Grading interface

Written grading is routed through a single `gradeAnswer(answer, rubric, context)` interface and returns structured output including:
- score;
- matchedConcepts;
- missingConcepts;
- misconceptions;
- feedback;
- gradingMethod.

The current implementation is explicitly `keyword_fallback`, not semantic AI grading.

### 11. Storage boundary

Browser persistence is now called through a small `DATA_REPO` abstraction. It still uses localStorage in this prototype, but UI/business logic no longer needs to depend directly on storage calls everywhere. This is preparation for a real synchronized backend.

### 12. Authentication warning

The UI now explicitly warns that the current local FNV-based hash is not appropriate for real student use and that no sensitive password should be used in the prototype.

## Automated tests

`tests/adaptive-engine.test.js` covers:
- first pass -> pending retention;
- prevention of early retention confirmation;
- delayed confirmation after 24 hours;
- retention failure and return to practice;
- review intervals by error type;
- high-confidence misconception classification;
- concept confusion and application difficulty classification;
- overconfidence / underconfidence / accurate calibration;
- unit + concept + observation mastery aggregation;
- priority scoring;
- alternative review item selection;
- grading interface and `keyword_fallback`;
- migration/defaults for older local data.

GitHub Actions also runs `node --check` on:
- `assets/adaptive-engine.js`
- `assets/content.js`
- `assets/app.js`

Pages deployment is now dependent on successful tests.

## Practical acceptance scenario

### Normal success path

Diagnostic
-> weakness selected by priority
-> Learn micro-lesson
-> non-graded interaction
-> focused Practice
-> initial Assessment
-> >=80% records first pass only
-> path becomes retention_check_pending
-> 24-hour minimum gap
-> delayed check tries a different item measuring the same skill
-> >=80% confirms retention
-> path becomes completed
-> next priority is selected.

### High-confidence misconception path

Wrong answer + high confidence
-> classified as high_confidence_misconception
-> faster review schedule
-> later review tries an alternative item
-> the event influences priority selection and calibration.

## Still local / mock / incomplete

The following remain intentionally incomplete and must not be presented as production-ready:

- Authentication and authorization are still browser-local.
- FNV is not secure password hashing.
- Roles are not enforced by a server.
- Accounts/progress do not yet synchronize across devices.
- Semantic AI grading is not connected; current grading is keyword/rubric fallback.
- Exam Intelligence contains schema only; real frequency data has not yet been populated.
- The variant bank is structurally supported but still too small for guaranteed unique variants in every concept.
- Content is not represented as university-approved merely because it appears in the demo.

## Required before a real student pilot

1. Backend authentication with secure password hashing and session management.
2. Server-side authorization for admin/student boundaries.
3. Synchronized persistent student progress and review schedules.
4. Real Exam Intelligence evidence entry and provenance review.
5. Larger authored variant bank for important concepts.
6. Content/legal review appropriate to the intended institution.
7. Production privacy, retention, backup, and audit policies.
8. If semantic AI grading is enabled, server-side model access, rubric validation, monitoring, and human-review rules.

## Compatibility

Existing local student state is migrated with defaults at runtime. New fields are optional and older records should not crash solely because retention, calibration, observation, unit mastery, or concept mastery fields are absent.
