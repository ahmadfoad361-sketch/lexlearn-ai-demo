# LexLearn policy: meaningless answers, honest uncertainty, legally wrong keyword matches

Updated 29 Oct 2026 to reflect the founder's explicit decision.

## Student-facing behavior

- **Obvious meaningless writing** (repeated characters, number-only strings, recognizable keyboard noise): save the answer as an attempted task and **award 0% for that task**. Do not charge the AI provider. The student may continue but gains no false mastery. Zero may be included in task-based training summaries, clearly distinguished from AI-assessed grades.
- **«لا أعلم / لا أعرف / مش عارف / لا أتذكر / I don't know»** with no legal substance: **do not save as an attempt and do not award zero**; show a contextual first-step hint, and leave the response editable for a second try. An explicit “I don't know” button uses the same protected server path.
- **Legally wrong or copied vocabulary**: never award points merely for headings, matching the statute's words, or negated legal statements. Incorrect propositions score zero for the relevant criteria; where **all** required meanings are wrong, the task receives zero; genuinely correct partial propositions receive proportionate credit. The semantic verifier reviews meaning, not the number of common words.
- **Uncertain gibberish and mixed answers**: send through semantic assessment and withhold unsupported scores. The deterministic filter intentionally rejects only unambiguous nonsense so legitimate, concise legal answers are not discarded.
- No task zero or hint constitutes a formal academic judgement of the student's complete memory or understanding.

## What is implemented in the draft PR

- `supabase/sql/answer-integrity-20261029.sql`: server-authoritative classifier, hint response before saving, deterministic `nonanswer_zero` evaluation, and normal semantic grading route for substantive answers.
- `assets/student-path.js`: hint button, feedback for task 0%, ability to retry “I don't know”, and 0 counted in task-series statistics.
- `supabase/functions/lexlearn-training-ai-grade/index.ts`: skip paid semantic AI if already determined to be noise, and strengthen meaning-first legal verification.
- `supabase/functions/lexlearn-training-ai-grade/assessment.mjs`: include deterministic zeros in task-based adaptive summaries.
- Unit cases for Arabic/Egyptian Arabic/English, plus an authenticated isolated PostgreSQL acceptance suite in the quality workflow.

**Release rules:** This is a draft PR. The PostgreSQL patch must be deployed alongside the UI and Edge function after CI and browser tests, to avoid an inconsistent transition. Do not merge until CI passes and a controlled smoke test validates the whole student flow. No production data or learner grades have been mutated by this PR.

## Evidence from the previous read-only production tests

Current production `lex_training_rubric_coverage` gives a **lexical** 20% for meaningless essay headings plus «لا أعرف», 27% for a contradicted age-of-majority statement, and 0% for some repeated characters. These are only unverified lexical coverage scores, not legal accuracy. The semantic grading route uses a draft model and independent verifier; a genuine post-deployment live API accuracy test (with a consented test user and provider budget) remains required.

## Sources

- Qatar Civil Code articles 39–63 via the official Al Meezan portal (statutory source IDs in `content_sources`).
- Prior research on retrieval practice: Roediger & Karpicke (2006), Dunlosky et al. (2013); no claim that this particular deterministic filter is itself validated by those studies.
