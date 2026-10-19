# LexLearn — Issue #36 server-authoritative student journey, acceptance handoff

**Date:** 2026-10-19
**Branch:** \`fix/student-lifecycle-server-gated-20261019\` (based on draft PR #37, not \`main\`)
**State:** Code + isolated PostgreSQL + headless Chrome tests green; **NOT approved for production, NOT deployed, NOT real authenticated staging E2E**.

## 1. Verified root cause

The current GitHub Pages \`main\` anonymous \`program.html\` still sends "ابدأ التقييم" to \`showcase.html\`. The showcase stores public demonstration submissions only, not a student diagnostic. The program previously expected a client-readable student profile snapshot, found none and displayed "start with a short assessment" again. Earlier proposed fixes were on a non-deployed branch and relied on client-writable cloud snapshot fields.

## 2. Implemented contract (proposed, needs production migration review)

**Public**
- \`showcase.html\` / \`showcase-en.html\` is visibly labeled public demo on every screen. Demonstration answers may be stored for anonymous supervisor review; **no results enter a student's authenticated record or count for grades**.
- \`showcase-level1.html\` / \`showcase-level1-en.html\` provide a separately marked public, non-academic first-session preview. They do not log in, change academic status or unlock official materials.
- Live \`program.html?demo=1&preview=stage1&start=1\` is no longer a valid anonymous bypass. The public program requires a signed-in student; development-only query flags are off by default.

**Authenticated**
- Sign-in validated against Supabase Auth, active student, course enrollment and learning-data consent.
- \`public.student_diagnostic_runs\` stores the official \`in_progress / completed\` record per \`user_id, course_id\`; absent record means \`not_started\`. There is only one authoritative row and one attempt per student/course. Browser local storage is **never authoritative**.
- Server RPCs \`lex_diagnostic_status\`, \`lex_diagnostic_begin\`, \`lex_diagnostic_draft\`, \`lex_diagnostic_complete\`, \`lex_level_access\`. All RPCs require the authenticated enrolled user and use isolated SQL/security-definer authorization. Students have read-only RLS on their own diagnostic row and **no write permissions** to official results or level completions.
- Save one answer at a time via a server draft, resume partial attempt, finalize atomically with a row lock, use DB-approved option answer keys. Repeated completion returns the immutable original result and original attempt ID.
- Store provisional measurements (recognition, understanding, application), null for unaided recall unless separately reviewed; free text remains pending human review without automatic semantic grade. Plan is based on measured evidence, with clear reasons for recognition-led, understanding-led, balanced and insufficient evidence.
- Level permissions are checked server-side. Even if diagnostic is complete, no level is open without \`student_level_releases\` having deliberate academic approval and publication; Level 2+ additionally requires a server-authorized previous-level completion. Browser URLs, caches and manually altered snapshots cannot issue official unlocks.
- Display student identity and logout in the official program and diagnostic. On unexpected server failures, show clear action to return to portal, **never** silently substitute public demo.
- Build identifier is injected in the HTML footer by \`scripts/build-public.js\`.

**Deliberately not implemented:** An authorized official course lesson renderer and supervisor-approved level completion/advancement transaction. The old client-side progression remains disallowed for signed-in official progress. A published first-level preview exists for conference demonstration only.

## 3. Actual passing tests — evidence, not assumptions

[GitHub Actions run 39191108966](https://github.com/ahmadfoad361-sketch/lexlearn-ai-demo/actions/runs/39191108966) completed **successfully**, at tested commit \`f5c168071238ea0c65994fd2ac683d27f8d6b0d9\`.

- CI existing JavaScript diagnostics and showcase tests: **pass**.
- AR/EN UI simulation additionally verified six sequential server-confirmed answers through free recall. This uncovered a stuck `saving` latch after the first question; it was repaired before the green run. Tests include resume, retry, network failure and unapproved-content gates.
- **Actual PostgreSQL 16 and 17 isolated runner services:** proposed migration applied to a temporary fixture, with real PostgreSQL RLS and RPC execution. Three test principals exercised recognition-led, understanding-led and insufficient-evidence outcomes; draft/readback/repeat completion; expected null free-recall; strict cross-user reads, instructor cohort restrictions, idempotence and refusal to open direct Level 2. **Pass.**
- **Actual Chrome headless browser against locally served production build artifact (NOT live GitHub Pages):** Arabic/English × desktop/mobile public program requires login; demo badge visible; preview level one task actually renders; no uncaught JS errors. **Pass.**
- Some earlier runs failed on test-fixture permission or outdated badge assertion and were corrected; the passing run above is the acceptance evidence.

**NOT tested:** network 2xx save with real Supabase Auth test principal on a hosted staging project; real logged-in browser video of in_progress→completed; actual post-deploy published URL screenshot with build ID; production negative API access; content-release action. These are mandatory before release. The external live-browser provider was unavailable due wallet balance. No claim to live production E2E.

## 4. Production-impact and academic review

- Production project \`emxiuwcuxyljfynnzpnh\` was inspected read-only. The Qatar course's **72 content items remain \`legal_review\`**, not approved.
- The six official diagnostic questions are also an independent review packet and must match authorized approved content exactly in both languages before use.
- The migration is a proposal committed to GitHub only; **none of its SQL, RLS, or level-release flags has been applied to production**, and no existing student data was changed.
- A separate Supabase development branch was requested but blocked by a cost-confirmation requirement. Do not incur extra cost without explicit approval.
- Paid OpenAI API remains **unused**.

## 5. Required staged validation and release checklist

1. Approve the incremental SQL migration against a schema-diff / least-privilege review, confirm backward compatibility and transaction behavior.
2. Create an explicitly authorized staging database and test students; run an authenticated Playwright + network trace suite for new / partial / completed, refresh/back/locale, two-account RLS, no duplicate grades, denied direct Level 2.
3. Review and approve the official six questions and each required academic content item. Do not toggle approval fields simply to make a demo appear successful.
4. Complete server-authorized first-level content serving and level completion workflow; keep higher levels locked until stage progression API is reviewed.
5. Re-run CI, then merge only with explicit release authorization. Confirm GitHub Pages job and test the **PUBLISHED URL** in an incognito session. Provide screen video a-f with build ID and sanitized network log.
6. Roll back the frontend to prior commit if post-release verification fails; roll back any future SQL schema only by a separately reviewed compensating migration, preserving official student records.

**Decision: code branch can be reviewed; academic student deployment is BLOCKED. Public preview is meeting-only and cannot be represented as the live official student experience.**

## 6. Follow-up release-control checks

- After a verified server `completed` status, the bilingual program now selects its stored adaptive **level-one view directly**, with no dependency on `start=1` query parameters or re-running the public demo.
- The view fails closed if EITHER the server `lex_level_access(level=1)` declines OR the actual academic pilot session is not released in `LEX_PILOT.isReleased`. In this state students see an explanatory saved plan, **not the unapproved lesson or a fabricated grade**.
- Added `tests/student-gate-source.test.js` to prevent regressions in the two-language (Arabic and English) program entry; it also checks that no unauthorised public demo URL unlocks the course, and that the six-question server diagnostic completes with an explicit status.
- Added an **after-publication Chrome test** to the GitHub Pages workflow which uses the actual deployment URL and verifies the footer's **exact commit ID**, public demo, and isolated nonacademic level-one preview. Browser recordings are uploaded for review. This is only a *future release gate*: no published-site evidence exists until that post-deploy step actually runs.
- GitHub Pages deployment is now explicitly restricted to `refs/heads/main`; a feature-branch workflow dispatch cannot intentionally deploy this draft.
- Read-only production `information_schema` verification confirms the needed columns/types in `profiles`, `enrollments`, `consent_records`, `content_items`, `courses` and `attempts` match the proposal's basic assumptions. This is NOT proof that a migration works on the full production schema or current data.

### Existing-student handling

A saved legacy `learner_snapshots` or anonymous showcase submission is **retained as historical data** but does not count as server-finalized diagnostic evidence, does not set status `completed`, and cannot unlock levels. An existing student whose official server row is absent is treated as `not_started` and is invited to take the new authenticated assessment once after the approved bank becomes available. A separate staff-reviewed legacy equivalence/import procedure can be designed if genuine prior assessments can be authenticated; no automatic migration or deletion is authorized.

### Remaining decision boundaries

The proposed migration introduces new tables and RPCs but is **not deployed**. An authorized server-side learning-content reader and graded level completion workflow still need implementation and review; the front-end preview is not a substitute. Provisioning paid Supabase staging was blocked pending cost approval. Neither a full real JWT/Auth browser test nor a production network trace/recording has been completed. Do not merge or publish this branch until the SQL/RLS review, full staging E2E, content approvals and user-controlled release decision are completed.

The latest passing CI run and commit SHA should be taken from the branch checks at review time; earlier linked passing runs certify only their specific commit.
