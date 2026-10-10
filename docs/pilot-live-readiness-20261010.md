# LexLearn — Qatar supervised pilot release (10 October 2026)

## Decision and authorized scope

Per project owner's instruction, a **single real authorized supervisor** can review the legal and instructional fitness of questions, inspect student answers, confirm automatic grading, and correct grades. The former two-different-reviewers requirement is waived. No reviewer identity is fabricated.

Only these two lessons are released in `assets/pilot-learning.js`: `release={1:true,22:true}`:

- `s1`: beginning and ending of legal personality; prenatal rights requiring no acceptance are conditional on complete live birth — Qatari Civil Code Articles [39](https://www.almeezan.qa/LawArticles.aspx?LawArticleID=36483&LawID=2559&language=ar) and [40](https://www.almeezan.qa/LawArticles.aspx?LawArticleID=36484&LawID=2559&language=ar).
- `s22`: unlawful intended interest and sole intention to harm as **independent** grounds; damage alone does not establish sole intent; the other Article 63 grounds remain examinable — [Article 63](https://www.almeezan.qa/LawArticles.aspx?LawArticleID=36507&LawID=2559&language=ar).

Other question-bank topics remain closed; no broad approval or migration of 72 questions was made.

## Student and supervisor paths

- Student login: https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/student-login.html
- Arabic training: https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/program.html
- English training: https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/program-en.html
- Supervisor login: https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/admin-login.html
- Supervisor dashboard: https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/admin.html
- Instructor-only question preview: https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/pilot-review.html

A student must sign in and complete the diagnosis and sequential training requirements before reaching a lesson. The student is **not** given supervisor preview access.

The student submits `step3`, `step4`, `step5`, one-day and seven-day reviews. Each submission is saved in `attempts` with a specific `pilot:s1` or `pilot:s22` stage ID. The `pilot-grade` function checks the authenticated student, attempt ownership and source references. It scores only if a configured, validated model returns a defensible outcome. Invalid or unavailable model outcomes are stored in `pilot_ai_grades` as `review_required`, `score=null`, `passed=null` to wait for the supervisor. This never automatically advances a student.

The supervisor opens **الإدارة → متابعة التصحيح** and sees the question, law, full student answer, grading criteria, AI result, and source identifiers. If AI has a valid score, **راجعت التصحيح ولا توجد ملاحظة** confirms without additional commentary. Otherwise the supervisor manually records whether the answer passes, along with explanatory feedback; the student receives this verdict as higher priority than AI. Student access to other students' attempts remains restricted by RLS.

The supervisor opens **الإدارة → مراجعة المحتوى**, reviews the six questions and sources, then can press **اعتماد المشرف** once on each; no second reviewer is needed. Only real authenticated actions are logged with the acting user ID.

## Exact six content-review items

| Item | Topic | Status at initial rollout | Review actor |
|---|---|---|---|
| `rights-v1-s1-recall` | s1 · حفظ | `legal_review` | Actual supervisor after review |
| `rights-v1-s1-understanding` | s1 · فهم | `legal_review` | Actual supervisor after review |
| `rights-v1-s1-exam` | s1 · بناء الإجابة | `legal_review` | Actual supervisor after review |
| `rights-v1-s22-recall` | s22 · حفظ | `legal_review` | Actual supervisor after review |
| `rights-v1-s22-understanding` | s22 · فهم | `legal_review` | Actual supervisor after review |
| `rights-v1-s22-exam` | s22 · بناء الإجابة | `legal_review` | Actual supervisor after review |

The learning content and student lessons can be visible **while supervisor confirmation is pending** by explicit owner request. Visibility does not imply prior formal sign-off or scientifically established AI accuracy.

## Verification and limitations

- Existing Supabase project `emxiuwcuxyljfynnzpnh`, role-guarded `pilot-grade` and `content-review` functions.
- Preview and student grading remain separated; JWT verification on all deployed Edge Functions.
- Dedicated `validation/pilot-semantic-benchmark.json` contains 160 bilingual test cases; it is **not** a successful live model evaluation.
- Automated/static CI exercises student flow, release flags, grader success/failure, legal distinctions, authorization guards, and public site build. It does **not** substitute for a student-supervisor session.
- AI credentials `OPENAI_API_KEY` and `OPENAI_MODEL` must be configured by an authorized Supabase owner in private Edge Function Secrets. Until then, **manual supervisor grading is the operating fallback**; do not claim AI live accuracy.
- Supervisor override is pass/fail with feedback rather than a separately stored numeric manual score.
- GitHub cannot inspect uncommitted changes on an external developer PC; do not overwrite local files without comparison.
- Preserve RLS, avoid service-role secrets in the browser, and retain no numeric grade for unverified AI output.

## Acceptance checks after deployment

1. Open the public Arabic and English student pages, confirm topics s1/s22 appear and other pilots remain closed.
2. With an actual student login, complete s1; check an essay attempt exists and appears in **متابعة التصحيح** for the supervisor.
3. Verify model-unavailable submissions show **بانتظار مراجعة المشرف**, not success; approve manually and confirm the student can proceed.
4. Reject two consecutive answers and confirm a one-step return; verify daily and weekly reviews.
5. Confirm a second student's session cannot query another student's answers, human grades, or staff-only preview.
6. Press **اعتماد المشرف** once for each reviewed content item only if the question and sources are suitable; verify the acting identity in audit logs.

**Release is supervised, not auto-certified.** The owner has waived a separate second reviewer; genuine identity and student-safety checks remain.
