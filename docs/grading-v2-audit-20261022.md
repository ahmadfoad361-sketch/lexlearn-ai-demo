# LexLearn grading reliability — internal audit and staged fix (22 October 2026)

## What was changed (draft PR #51 only)
- Added `supabase/migrations/20261022_003_relation_based_grading_DRAFT.sql` AFTER the earlier contradiction guard.
- Grade the *specific source-bound legal relationships* in topic 1 (start at live birth, end at death, conditional prenatal rights), in Arabic and English, rather than assigning large grades based on matched words.
- Recognize paraphrases and an explicit correct contrast with conception; detect reversed rules and contradictions.
- `diagnostic-legal-personality` evaluates **one tested start-of-personality proposition**, not overall memory. Topic 1 recall practice evaluates three separate propositions with preliminary weights 35/35/30. Those weights are author choices, not validated psychometrics.
- Retain `needs_human_review=true` even for preliminary scored items; never interpret 100% criterion coverage as evidence of retained learning, semantic accuracy across the whole law, or mastery.
- For understanding/essay application and lessons lacking a separately reviewed semantic rubric, return `needs_human_review`, with **no numerical score** rather than fake certainty. This is an intentionally conservative pilot change; such lessons cannot be certified/fully assessed until expanded rubrics or a separately authorized semantic/human review route are ready.
- Student UI confirms the answer was saved and asks for meaning review rather than saying a hidden zero is measured. Diagnostic UI explains the narrow scope of an initial percentage.
- Feature branch remains in draft; no update has been made to live Supabase Production or the public GitHub Pages site.

## Evidence from isolated CI
- Original 16 bilingual answer fixtures found dangerous false highs and false lows: reverse rule 100%, prenatal denial 83% practice / 100% diagnostic, accurate Arabic paraphrase 17% practice / 0% diagnostic, correct English 0% practice.
- With this staged grader, `full_correct` 100% (3/3 propositions); `correct_refutation` 70%; `correct_not_conception` 70%; Arabic `synonym` 70%; Arabic `partial` 35%; English `en_correct` 70%; English `en_refute` 35%. Diagnostic records 100% when its **single** birth-start proposition is recognized.
- Incorrect inversion, wrong death/birth claims, categorical prenatal denial, contradictions and keyword-only input all yield `needs_human_review` with a null preliminary score; they are NOT called 0% or treated as correct.
- All 16 cases are enforced by regression assertions in `tests/sql/recall-diverse-cases.sql`, with authenticated two-student journeys in `tests/sql/two-students-recall-extremes.sql` and skill boundaries in `tests/sql/grading-v2-acceptance.sql`.
- CI checks include isolated PostgreSQL, roles and RLS, independent learner histories, Javascript, Chrome with mocked RPC, and build gating. They are not yet production-account end-to-end evidence.

## Still required before the university pilot
1. Independent lawyer/instructor review of the proposition rubric against current authenticated statutory text, any exceptions, and relevant exam tasks.
2. Create topic-specific, bilingual, reviewer-approved evidence rubrics for the remaining units and **separately** for understanding, case application and exam-answer construction; or connect a securely evaluated semantic provider with express cost/data-processing approval. No generic token matching.
3. Calibrate against a large *independently marked and blind-scored* corpus of correct, partially correct, wrong, refutations, quotes, noisy and mixed-language answers. Report separate false-positive, false-negative, abstention and language-parity rates.
4. Stage real signed-in learner accounts on isolated auth/database with full save/refresh/progress/authorization tests.
5. Decide sign-off and approval for **separate** deployment steps to Supabase and GitHub Pages. Never merge automatically.

**Scientific limit:** Robustness on 16 hand-authored cases is promising *engineering evidence*, not pedagogical validation or a production-ready legal semantic grader.
