# LexLearn grading policy — no paid external AI API

Decision: LexLearn public demonstration must run with **zero paid external AI inference calls**. ChatGPT is a developer/reviewer tool in this workflow, not a server-side inference engine for visitors. A ChatGPT consumer subscription does not provide unattended site grading capacity.

## Public showcase

- `supabase/functions/showcase-grade/handler.mjs` uses the existing local/server-side proposition evaluator `assets/showcase-recall.js`, after authenticated submission and approved-source checks.
- Scores, if recognized, are **provisional rubric evidence**, not general legal-semantic understanding or a university-certified grade. Unrecognized or conflicting meanings should abstain, not be assigned an invented zero.
- The original answer, recognized evidence, feedback and provisional status are persisted to the supervisor-accessible record after a successful server receipt.
- Never call paid model endpoints from this public handler, even if unrelated deployment secrets happen to exist. CI tests guard against accidental reintroduction.

## Pilot readiness gate

- The academic pilot `pilot-grade` and broader `grade-answer` workflows **must not be represented as a functioning no-cost semantic model** simply because those endpoints are deployed.
- Keep unapproved academic content and readiness flags gated until an actual automatic grading design that meets quality and availability requirements is delivered, or a transparent academic staff review path is agreed.
- An assistant session can author rubric criteria, label human-reviewed examples and test the deterministic engine; it cannot silently receive or grade every student response while the owner's computer is off.
- Before student release: verify legal references and rubrics with authorized reviewers; run bilingual correctness/negation/paraphrase benchmarks; test an actual student receipt, authorized supervisor override, privacy, and abstention cases.

## Never misrepresent

- Rule-matching is **not** OpenAI model inference. Label it as limited/rule-based.
- A fallback rule score is not evidence of long-term retention, understanding or exam readiness.
- A local check not saved to the server is not an official assessment.
- Do not request OpenAI API billing or API keys as a prerequisite for the no-cost demonstration.
