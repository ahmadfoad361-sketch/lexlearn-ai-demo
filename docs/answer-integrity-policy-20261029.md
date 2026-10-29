# Free-answer integrity: proposed policy and test evidence (29 Oct 2026)

## Verified existing production behavior (read-only SQL)
- `lex_training_submit` accepts any 8–4000 character non-empty answer, saves it in `student_training_answers`, then marks a session complete when its expected answer count is reached. It does not require an intelligible legal answer.
- `lex_training_rubric_coverage` is only **lexical**; on the production database, a wholly wrong statement about the age of majority got 27% *preliminary lexical coverage*; writing headings plus “لا أعرف” got 20%. This is not a semantic AI score; it must never be displayed as verified ability.
- Obvious gibberish (e.g. `qwertyuiopasdfghjkl`) and longer admissions of ignorance are accepted by the current length gate; shorter `لا أعلم` is rejected.
- `lexlearn-training-ai-grade` reads the persisted `rubric_json` and legal sources. Its paid provider cannot be tested through a read-only SQL query; fake provider tests are NOT evidence of live semantic accuracy.
- The 11 recent rubric updates are already in Supabase; no account or lesson data was changed by this review.

## Safe educational response (not yet wired into live product)

1. Show an explicit `لا أعرف / I don't know` **button** (no forced gibberish). First click shows one scaffolded clue and asks for a retry. A second click offers “See the worked example and continue practising”, clearly labelled `support_needed`.
2. Record **distinct states**, not fabricated grades: `answered`, `explicit_unknown`, `unresponsive`, `human_review_required`. Never turn a skip into 0% *overall* recall/understanding; distinguish an answered task score from the not-measured skill dimension.
3. In `lex_training_submit`, validate **on the server before saving** (client JavaScript alone can be bypassed). For confirmed keyboard spam/number-only/repeated-character input return an explainable `answer_needs_revision` result, do NOT increment the completed task count. Allow a legitimate short legal answer to reach ordinary evaluation; never use a blanket minimum word count to infer ignorance.
4. For an explicit “I don't know”, return a teach/skip state without sending the text to the paid model and **do not count the exercise as mastered**. Require a worked example, explanation and later retry before issuing any learning-achievement claim. One may allow the learner to advance to a different learning activity, but progress must be labelled `practised/needs_support`, not `passed`.
5. For uncertain nonsense or mixed answers, use semantic review; credit only legal components supported by quotes and source text, flag ambiguity. The verifier may reject off-topic content. Do not grant points for keywords or essay headings alone.
6. Record capped resubmissions with no personal ridicule, and show supportive feedback: “عادي إنك مش فاكر. هنراجع القاعدة معًا وبعدها نحاول تاني.”
7. Use instructor-visible aggregates of knowledge-gap/skip events, not raw embarrassing language. Never count a skipped exercise as a measured 0 for **entire skill ability**.

## Critical acceptance tests
- Known admissions of no knowledge in Egyptian and standard Arabic plus English; whitespace and common punctuation.
- Legitimate short legal answers (e.g. “لا”) and answers containing “لا أعرف” plus *correct substance* must not be blocked by a broad regex.
- Arabic keyboard noise, English keyboard noise, digit/symbol-only input, repetition; no grade/model charge/no completion credit.
- Wrong but keyword-rich legal claims must score zero on contradicted rubric elements, never lexical overlap; partial truthful reasoning gets limited credit.
- Repeat/relogin: explicit skip state persists, no route bypass, no double-award. Existing real learner scores remain unchanged.
- Test one ephemeral account on locally isolated Supabase + browser across all 30 sessions; then a tightly controlled live smoke with owner-authorized budget if paid AI needed.

## Implementation status
This branch contains a **conservative pure classifier and automated unit cases only**. It is deliberately NOT wired into live RPC/frontend/Edge Functions, because partial deployment would not fix the existing progression loophole and could punish honest students. Merge only as reusable tested infrastructure; full release needs server RPC, user interface, backend grading and persistence tests together.
