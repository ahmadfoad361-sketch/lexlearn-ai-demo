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

[GitHub Actions run 39190712974](https://github.com/ahmadfoad361-sketch/lexlearn-ai-demo/actions/runs/39190712974) completed **successfully**, at tested commit \`724636f69dbe8d25f18ba8d96d0d4eb43928fee5\`.

- CI existing JavaScript diagnostics and showcase tests: **pass**.
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
