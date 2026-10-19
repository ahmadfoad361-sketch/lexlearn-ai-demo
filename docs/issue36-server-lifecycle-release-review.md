# Issue 36 — Server-controlled student journey: review report (19 Oct 2026)

## Exact state
This is a code-review branch only. Not merged; not deployed. No production Supabase migration, RLS privilege change, academic approval or student-data mutation. The published main website remains on the old visitor flow until verified deployment.

## Root cause
The published public program points "Start diagnostic" to the showcase; four demo exercises never save an official student diagnostic. The old program then reopens the assessment request. The previous PR #37 used owner-writable snapshots without a server-authoritative completed status and allowed trust confusion.

## Changes
- Public: only showcase.html, showcase-en.html and showcase-level1*.html show a non-credit demo, with persistent truthful mode label. No demo results transfer to student accounts.
- Student: program, diagnostic and portal require real cloud authentication. Query parameters demo, start and preview cannot bypass it. Identity and sign-out are visible in student study screens.
- Server: proposed migration 20261019_001_student_diagnostic_lifecycle.sql adds a server-owned state machine, one attempt per user/course, draft persistence and atomic completion. Three states: not_started, in_progress, completed. The browser cannot set authoritative completion.
- Objective questions are scored inside PostgreSQL from approved answer keys. Missing/unknown skills remain null, not zero; free recall awaits human review. Different objective performance patterns produce different explained first-session plans.
- Level access verifies completion, an approved/published academic-level release and previous-level verified progress. Level 2 direct requests fail. Authoritative tables are read-only/inaccessible to student writes; legacy learner snapshots are untrusted caches only.
- Published build includes a visible short Git commit ID and cache-busted JS. Local seeded demo credentials were removed from student login. No paid OpenAI API was added.

## Actual proof
GitHub Actions runs a real PostgreSQL 16/17 service, with SYNTHETIC (not production) accounts, source fixtures, and role policies. Tests check idempotence, six-item grading, student isolation, a partial draft, three profiles, unauthorized table updates, an academic lock and direct Level 2 denial. It also runs headless Chrome against the BUILT LOCAL artifact in Arabic and English on desktop/mobile and verifies mode banners, URL-parameter bypass protection, preview and build ID. Node tests additionally simulate the diagnostic UI and failure paths.

THESE TESTS ARE NOT an authenticated production website test. No video or browser network trace against real Supabase has yet been obtained. Local profile-role emulation is not a substitute for two real JWT accounts.

## Production/staging blockers
1. Staging Supabase branch creation requested a paid-cost confirmation. The user must explicitly approve that charge; no separate branch was created.
2. Production currently has 72 Qatar rights content items in legal_review; the six new official items also need authorized legal AND pedagogic approvals, distinct reviewers and matching Arabic/English source texts. No approval is fabricated.
3. A separately reviewed stage-release/grading endpoint, actual Auth/HTTP staging accounts and negative RLS tests are required before authentic academic training can open.
4. Legacy/local student snapshots must NOT be silently promoted to completed; prepare a staffed audit import and allow a fresh diagnostic if original evidence cannot be certified.
5. Published deployment must receive exact-build verification, private-window browser test, test account (then privacy-compliant cleanup), video and redacted network status logs. Revert to the prior Pages build if failed.

## Rollback
No production rollback needed until this patch is merged. Before future deployment, confirm backups, production policies, rollback commit and migration safety. A rollback must not discard previously committed diagnostic records.

## Final signoff
Code quality / isolated Postgres / local built artifact: subject to the current CI result.
Real staging Auth, published production and university release: NOT YET VERIFIED.
