# LexLearn — Pilot release gates and frozen measurement protocol

**Version:** DRAFT-0.1 · 2026-10-23  
**Status:** Preparation only. NOT academic approval and NOT authorization to enrol study participants.

## Scope and what is verified
- Founder internal pilot: 30 sessions / 6 levels, with authenticated student diagnostic and recorded answers.
- One completed student diagnostic and one complete first session were observed before this change.
- The independent AI smoke runner passed two scenarios (wrong Arabic 0%, correct English paraphrase 75%); the complete Arabic case `full_ar` previously failed output-schema validation. **No successful student-linked OpenAI numeric grade has yet been verified.**
- A historical text-match diagnostic number of 100% was corrected internally to 40% *criterion coverage* and must not be misrepresented as a memory aptitude score.
- GitHub Pages release and database version must both be checked after rollout.
- Current 72 essay items are *founder internal pilot content*, NOT independent university legal review. See `legal-review-72-items.csv`.

## P0 release gates — require independent evidence
| Gate | Test | Pass condition | Owner |
|---|---|---|---|
| Login, consent, secure enrolment | Fresh student with informed consent, no duplicate prompts for same purpose | Works on mobile and desktop; no cross-account data | Technical lead |
| Diagnostic | Fresh student completes 6 objective items + free recall | A single persistent attempt, results retrieve after relogin | Technical lead |
| "Not sure" | Choose Not sure for application item | Recorded `unmeasured` and NOT 0%; skill not ranked weak from that response; later item explicitly offered to remeasure | Technical + learning reviewer |
| AI grading `full_ar` | New *synthetic* Arabic complete-answer fixture with strict response schema | Valid human-interpretable rubric; no schema failure; result auditable; no student affected | Technical lead |
| AI alternative wording | >20 diverse bilingual answers, including full, partial, contradictory, refusal, synonym, negation | Independent legal reviewers score blindly; predefined agreement/error threshold before study | Legal reviewer |
| Completion & resume | Full 30-session automated path; manually finish two real-device sessions | Saved answers, correct session gate, back-navigation, no duplicate submissions | Technical lead |
| Accessible essay UI | Guided IRAC practice vs unscaffolded assessment | Prompt clear without staff explanation for >=1 usability participant; identical server answer structure | Learning reviewer |
| Data safety | Two student accounts + one staff | No cross-account visibility; audit only available to authorized staff | Technical lead |
| Academic content | Every used legal item, including pre/post | Reviewer identity/date/approval; correct jurisdiction and effective legal references | Legal reviewer |
| External provider key | Rotate any key ever pasted or shared in a chat | Only active server-side secret; billing cap and logging verified | Founder |

All gates require date, tester, result, and evidence link. A GitHub unit test or a published UI by itself does not close a scientific gate.

## Academic scoring policy
1. Separate **legal criterion coverage** (how many legally correct elements appear) from **memory retrieval**, **understanding**, **application**, **exam answer construction** and **delayed retention**.
2. Store a weighted criterion rubric and correct alternative Arabic/English expressions for every assessed item. Literal wording is required only if formally part of the stated objective.
3. Contradictions, legal errors, missing answers, and Not sure are different observations. A missing answer is not an observed zero.
4. Provisional lexical percentages remain in private audit data; **do not show them to students or rank their ability from them**. Use descriptive feedback until independent validation.
5. No AI grade is an official university mark. Log model, prompt_version, rubric_version, source text version, usage/cost metadata and academic review state.
6. Distinguish mnemonic-cue training from correctness of a recalled legal proposition. Missing optional mnemonic aids must not reduce the legal correctness score.

## Legal content review
- Each item: country/jurisdiction (Egypt/Qatar/shared only after verifying both), effective law, article text/source, expected legal outcome, alternative correct outcomes, contradictions, criterion weights, acceptable AR/EN paraphrases, prompt ambiguity, and reviewer name/date.
- Start with six sessions for usability/internal dry-run, but review **all items to be used in the study** before launching a research cohort.
- Qatar legal content cannot be silently substituted for an Egyptian law faculty cohort. Preserve separate course/source mapping.
- A founder pilot flag is not academic endorsement or legal review. Never change `legal_review` to `approved` until authorized evidence is captured.

## Pre/post measurement design (must be approved before recruiting research participants)
- Pre-test Form A and post-test Form B: same skills, format, weighting, duration, and comparable independent item difficulty; different scenarios and wording.
- Independent blinded legal review of both forms. Counterbalance A/B across participants if feasible.
- Two-week delayed assessment Form C for retention, without access to previously answered questions.
- Practice with scaffolding (step-by-step Issue/Rule/Application/Conclusion). Measure unaided skill on pre/post tasks with equivalent *minimal help*, not the guided practice screen.
- Record missing/Not sure separately; distinguish unanswered from incorrect.
- Fix curriculum, grade weights, model version, rubric hashes, provider, exclusions and primary outcome *before* the study; subsequent modifications create a new study version/cohort.
- Prefer comparable treatment/control groups or matched comparison where feasible, with institutional ethics/data permissions; analyze paired scores and uncertainty, not merely raw gains.
- Preserve complete per-student diagnostic, all sessions, unedited free answers, dated grades, and instrument version; separate research IDs from contact details.
- Do not make effectiveness or percentage improvement claims without adequate and independently reviewed data.

## Internal experiment sequence
1. Two synthetic profiles (stronger recognition than understanding, and the reverse); inspect whether their **measured evidence** justifies different paths. When evidence is insufficient, use balanced training rather than asserting a diagnosed weakness.
2. Fresh student end-to-end path: signup, consent, diagnostic, result, session 1, save, relogin, session 2. Check mobile.
3. Independent legal reviewer adjudicates disagreements and validates item bank.
4. Limited usability dry-run with permission, observing whether the student can understand the legal question and next action without staff guidance.
5. Only after all P0 gates pass: preregister research protocol and recruit student cohort.

## Open issues requiring human participation
- Review/sign the 72-row legal checklist, beginning with six sessions. **No independent approval exists in the current data.**
- Independently calibrate pre/post forms; cannot be simulated by AI.
- Owner-authenticated one-time paid smoke test of a new `full_ar` variant (not the already-spent original).
- Confirm institutional ethics/privacy permission before recording actual student research outcomes.

## Traceability
Repository: `ahmadfoad361-sketch/lexlearn-ai-demo`  
Course: `qa-qu-lawc101-rights`  
Records: `student_diagnostic_runs`, `student_training_sessions`, `student_training_answers`, `ai_grading_runs`, `lex_ai_grading_smoke`.
