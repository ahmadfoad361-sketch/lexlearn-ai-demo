# LexLearn Issue #36 — Adaptive Level One implementation (19 October 2026)

**Scope:** Server-controlled first lesson after authenticated diagnostic, on draft PR #39 only. This is an engineering completion of the previously missing *session-one task delivery and answer persistence*, **NOT production deployment or institutional academic approval**.

## Implemented journey

1. Registered student authenticates through Supabase Auth and holds active course enrollment and informed consent.
2. Six approved diagnostic MCQs are answered once; the server saves an objective provisional result, assigns a mode and confirms its own completed status. Free-form answers are **not** automatically given a legal-semantic grade.
3. `program.html` / `program-en.html` reads completed diagnostic directly from the server, then `lex_level_access(course,1)`, never a public demo flag.
4. An approved level-one release permits only the three individually reviewed `content_items` for `concept_id='topic-1'`, `unit_id='week-1'`: `rights-v1-s1-recall`, `rights-v1-s1-understanding`, `rights-v1-s1-exam`. Topics concern Qatar Civil Code Arts 39–40 (beginning of legal personality and prenatal rights). Only question text and legal source IDs are supplied to the learner; answer keys and marking rubrics stay server-side.
5. Task order varies by verified diagnostic plan:
   - `recall-led`: **understanding → exam_execution → recall**
   - `understanding-led`: **recall → understanding → exam_execution**
   - `balanced`: **exam_execution → understanding → recall**
   - `foundation` (including insufficient evidence): **understanding → recall → exam_execution**
   Brief learner guidance is matched to each task and plan; unsupported percentages are not shown.
6. Each free answer is saved via authenticated `lex_level_one_submit` to a unique `student_level_responses` row scoped to that student, course, lesson and item. Repeated submits are idempotent; subsequent edits or duplicate authoritative rows are not permitted. Reloads and language changes load saved responses via `lex_level_one_open`.
7. After three saves, status is **`practice_completed_pending_review`**. The learner is NOT awarded a score, certified completion, or Level Two unlock. Official level completion still requires human-reviewed server authorization.

## Changed components

- Proposed SQL: `supabase/migrations/20261019_002_official_level_one.sql`, dependent on `20261019_001_student_diagnostic_lifecycle.sql`.
- Official UI: `assets/official-level-one.js`, included in both program pages and public artifact builder.
- Client: `assets/cloud-data.js` routes `firstLevel` and `submitLevelOne` through RPC, and both program scripts route signed-in students to official first-level tasks. Both portal scripts check actual task availability before showing Level One open.
- Tests: `tests/sql/level-one-acceptance.sql` (real PostgreSQL), `tests/official-level-one-ui.test.js` (client simulated RPC), `tests/student-adaptive-browser.cjs` (actual headless Chrome with **intercepted** mock RPC, not hosted staging), plus guard and existing suite.

## Verified CI

[Quality workflow 39193355162](https://github.com/ahmadfoad361-sketch/lexlearn-ai-demo/actions/runs/39193355162), commit `fbf2cba042d879bc8afbed3366c350e29bf870d6`: **success**.
- Isolated PostgreSQL 16 and 17: academic content withholding; three adaptive plans, idempotent per-student persistence, resume, cross-account RLS rejection, no false legal scoring, Level 2 blocked.
- Chrome: AR and EN, public demo/preview and six authenticated *UI-fixture* combinations (3 plan modes × 2 languages), three answers per student, refresh to next incomplete item, no runtime exceptions.
- JavaScript unit and regression suite: success.

**These are not real live student browser tests.** The browser authentication and RPCs were intentionally intercepted for deterministic CI; actual hosted Supabase Auth and HTTP 2xx save/readback remain unverified.

## Production blockers

**READ-ONLY production observations:** Qatar Theory of Rights bank has 72 items in `legal_review`. The official six MCQs also lack authorized independent approval records. Neither new migration has been applied; production holds no official lifecycle tables. No merge/deployment has occurred.

Release requires all of:
1. Explicit consent for an isolated Supabase staging project if it has a charge; apply migrations 001 and 002 **there first** and validate role grants/real JWTs.
2. Independent legal + educational reviewers legitimately sign off six MCQs and the three session-one items in the actual review workflow. Do not toggle flags simply for a demo. Release session one via explicitly approved `student_level_releases` row.
3. Hosted, real-account Playwright E2E for three student modes, re-login, refresh, concurrent saves, two-account cross-user reads and direct Level 2 denial, with sanitized network traces and screen recordings.
4. Approved source of server-side human grading and Level 1 completion before any higher level, if later progression is required.
5. Separate production migration and deployment approval, rollback review; after main GitHub Pages release, run the URL+SHA browser check and real student smoke again.
6. **Do not represent** `practice_completed_pending_review` as a verified grade or academic course completion.

**Decision:** the adaptive first-level user experience and persistence are implemented in the draft; a real university-facing student experience is **not yet live**.
