# LexLearn Qatar pilot — staging readiness audit (2026-10-10)

**Status: NOT RELEASED.** This report is an audit of live project metadata and prepared staging code, **not** a successful live AI benchmark or a published release.

## Scope and legal sources

Pilot course: `qa-qu-lawc101-rights`. Only s1 (civil code Articles 39–40) and s22 (Article 63).

- s1: Personality starts at complete live birth, ends at death; prenatal rights whose cause needs no acceptance are conditional on live birth. Official law: [39](https://www.almeezan.qa/LawArticles.aspx?LawArticleID=36483&LawID=2559&language=ar), [40](https://www.almeezan.qa/LawArticles.aspx?LawArticleID=36484&LawID=2559&language=ar).
- s22: An unlawful intended interest and sole intent to cause harm are **independent** unlawful-exercise grounds. Damage alone is not proof that harm was the sole intent, nor does failure to prove that intent resolve the other Article 63 grounds. Official law: [63](https://www.almeezan.qa/LawArticles.aspx?LawArticleID=36507&LawID=2559&language=ar).

The three linked source rows exist in Production with `approved` status and nonempty excerpts. Some excerpts are summaries, not complete statutory provisions. Do not claim they reproduce the full legislation.

## Production state observed

Project: `LexLearn Production` (`emxiuwcuxyljfynnzpnh`), `ACTIVE_HEALTHY`; existing deployed `pilot-grade` version **4**, JWT enforcement on.

| Content item | Stage | Before | After |
|---|---|---|---|
| `rights-v1-s1-recall` | s1 · الحفظ | `legal_review` | `legal_review` |
| `rights-v1-s1-understanding` | s1 · الفهم | `legal_review` | `legal_review` |
| `rights-v1-s1-exam` | s1 · بناء الإجابة | `legal_review` | `legal_review` |
| `rights-v1-s22-recall` | s22 · الحفظ | `legal_review` | `legal_review` |
| `rights-v1-s22-understanding` | s22 · الفهم | `legal_review` | `legal_review` |
| `rights-v1-s22-exam` | s22 · بناء الإجابة | `legal_review` | `legal_review` |

No legal or learning reviewer is recorded on any of the six items. Only one active owner and one active student profile were present when queried. The existing `content-review` function enforces a distinct second reviewer. Do not forge a second identity, insert status via SQL, or approve on behalf of a person who has not reviewed the material.

`assets/pilot-learning.js`: `release={1:false,22:false}` on main **and** staging branch. The rest of the question bank is unchanged.

`pilot_ai_grades` and `pilot_human_grades`: **0 rows** at the time of inspection. No real pilot AI/student/supervisor outcome was verified. The previous 2026-10-09 audit found the provider secret configuration incomplete; production Secrets were not readable or writable with the connector available in this review. Do not infer readiness.

## Changes staged (separate branch only, not production)

- A dedicated `scripts/validate-pilot-grading.js` calls **pilot-grade** in authenticated supervisor **preview**, not `grade-answer`.
- `validation/pilot-semantic-benchmark.json`: **160 preliminary cases**, covering 2 topics × 5 stages (`step3`, `step4`, `step5`, `day1`, `day7`) × 2 languages × 8 variants: faithful, paraphrased, incorrect, incomplete, ambiguous, verbose without substance, corrected quotation of a false claim, and instruction injection. Cases remain `pending_human_review`.
- The staged `pilot-grade` refuses success if an essential comparison or harm-intent distinction is missing even when the weighted total passes. It adds a server-side topic release gate and a specific authenticated student QA allowlist; unexpected exceptions no longer return raw internal error text.
- Staged `pilot-access` authenticates a QA student, checks approved content, and returns only the eligible topic IDs. The staged `pilot-qa.html` student experience calls the actual grading function, persists real attempts, and uses a separate QA learning snapshot (does not overwrite the main course). The one-week held-out review now uses its intended scenario.
- Staged student code does not misrepresent an AI percentage as a supervisor-revised grade. **Known gap:** human override has a pass/fail decision and feedback, but no independent stored numeric human score; add and verify this before calling numerical supervisor correction fully complete.

## Model and production secret setup

A documented compatible **candidate** is `gpt-4.1-mini`, which supports the Responses API and Structured Outputs. No claim is made that the current account has access until a successful actual request. Production owner/admin must set these securely in [Supabase Edge Function Secrets](https://supabase.com/dashboard/project/emxiuwcuxyljfynnzpnh/settings/functions):

- `OPENAI_API_KEY`: a valid scoped OpenAI API credential, entered only in the secure dashboard.
- `OPENAI_MODEL`: start with `gpt-4.1-mini`; confirm via actual `pilot-grade` request and check its returned schema before retaining.
- `PILOT_QA_STUDENT_IDS`: authorized QA student UUIDs, private server-side allowlist.
- `PILOT_RELEASE_TOPICS`: **unset/empty** until launch acceptance, then `1,22` only. A server-side flag is independent of the frontend `release` flag.

**Never** place keys or session tokens in GitHub files, chat, reports, logs, or browser code. The live runner reads the staff session token and public Supabase key from secure environment variables and writes a local report; do not commit a report containing student answers.

## Execution and human verification

1. Compare the developer's **uncommitted local worktree** with `main` and this branch before merging. A GitHub connector cannot see uncommitted files on a developer's machine; no reconciliation has yet been possible.
2. Use the existing authorized review function: first an actual legal reviewer advances the six items `legal_review → learning_review`; then a different actual reviewer evaluates learning outcomes and advances `learning_review → approved`. Check `admin_audit` and reviewer IDs.
3. Confirm secrets and authorized preview function deployment with JWT verification on. Leave both release flags closed. Run `node tests/pilot-readiness.test.js` and `node scripts/validate-pilot-grading.js` for structural checks. This is **not** proof of AI accuracy.
4. Provide secure environment variables `LEX_VALIDATION_TOKEN` (staff session), `LEX_SUPABASE_ANON_KEY` (publishable/anon key), `LEX_SUPABASE_URL=https://emxiuwcuxyljfynnzpnh.supabase.co`. Then run `node scripts/validate-pilot-grading.js --live --output ./pilot-live-report.local.json`. Short trial: add `--limit 20`. Review disagreements manually; revise model, criteria or content and rerun the **live** suite.
5. Deploy the staging `pilot-access` function with JWT enabled. Using a real authenticated, allowlisted student, open the gated `pilot-qa.html` QA route, complete the six training steps for each topic, submit real `step3/4/5` essays and both delayed reviews. Confirm `attempts → pilot_ai_grades` linkage and that the supervisor sees the student's original text, AI result, criteria and source references in `admin.html`.
6. In supervisor view, confirm one valid AI grade without comment; correct another through the manual form. Verify student gets the supervisor verdict first, no other user's attempts are accessible, and student preview is forbidden. Test two failures cause a one-step return; low confidence, ambiguous answers, missing sources, provider unavailability, and authorization failure must **not** auto-pass.
7. Only after all tests, a complete two-reviewer approval, fixes and clean CI/build: reconcile the local worktree; merge reviewed changes; set client `release={1:true,22:true}` and server `PILOT_RELEASE_TOPICS=1,22`; publish and test the actual Arabic/English student pages. **If any gate fails, stop; flags remain false.**

Existing entrypoints:
- Student: https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/student-login.html
- Supervisor: https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/admin-login.html
- Staff-only preview: https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/pilot-review.html
- Closed QA page: `pilot-qa.html` **only on staging code, not yet deployed**.

## Results and unresolved acceptance gates

| Gate | Result |
|---|---|
| Production project and deployed v4 presence | Verified |
| Legal articles 39/40/63 and source row existence | Verified |
| Dedicated benchmark completeness | Prepared, not model-verified |
| Model credential set and actual structured response | Not verified |
| Two distinct human approvals | Not met |
| Live staff preview calls | Not run |
| Real authenticated student attempt and feedback | Not run |
| Human confirmation / correction E2E | Not run |
| RLS isolation and denial testing with real sessions | Policies inspected; live test not run |
| Worktree-versus-GitHub reconciliation | Not possible from connector |
| Build, CI and published revision | Not run / not deployed |
| Pilot public release | **Blocked — remains false for both** |

**Acceptance verdict: NO-GO.** It would be inaccurate to present this staging preparation as a successfully launched or validated pilot.
