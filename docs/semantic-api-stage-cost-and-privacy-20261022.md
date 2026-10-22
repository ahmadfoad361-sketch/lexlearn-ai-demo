# LexLearn semantic API — disabled staging integration, October 2026

## Status / non-negotiable release controls
- **Prepared on draft PR #51 only. Not deployed. Not enabled. No provider billing incurred.**
- API integration lives only in the Supabase Edge Function `grade-answer`, NOT the browser.
- Explicit dual server-side release flags, both default disabled:
  - `LEX_AI_GRADING_ENABLED=true`
  - `LEX_AI_SPEND_APPROVED=true`
  - plus the allowlisted `LEX_AI_GRADING_MODEL=gpt-5.4-mini` and secret `OPENAI_API_KEY`
- **Do not set these flags, deploy the function, buy credits, or attach a payment method without separate founder authorization of exact costs, data handling and billing controls.**
- The currently deployed `grade-answer` and official diagnostic/training RPCs are untouched. The official student path's SQL provisional grading is not silently replaced by this provider.

## Planned provider and cost estimate, subject to model/pricing changes
Official OpenAI API page (as checked 2026-10-22): `gpt-5.4-mini` standard costs **US$0.75 / million input tokens** and **US$4.50 / million output tokens**.
- Example: 2,500 input tokens and 500 output tokens = 2,500*0.75/1,000,000 + 500*4.50/1,000,000 = **$0.004125 per attempt** (~0.41 US cents).
- 200 requests at the example size = **$0.825**. 1,000 requests = **$4.125**.
- Real cost depends on answer length, source excerpts, provider-generated tokens, retries and price changes. Output is limited to `max_output_tokens:1400`; input (student answer 4,000 characters; up to six source excerpts of 1,800 chars each) also has bounded size, but token count varies by language.
- Internal monthly volume safeguard starts at **200 calls per UTC calendar month**, with **12 calls per student per hour**, and logs a reservation before calling external provider. Concurrent calls can bypass a naïve count check; this is **not a hard monetary ceiling**.
- Proposed initial billed proof: **no more than $5 USD** on a separate AI project with an account/provider **hard spend control**, if available and verified in the actual account. Do not assume alert-only project budgets impose a hard cap. Recheck controls and prepaid balance at activation.
- No model billing is authorized from the user's "prepare" approval.

## Data handling and role safety
1. Require authenticated active **student**, enrolled in the requested course.
2. Require separately recorded affirmative consent `consent_type=external_ai_grading`, `notice_version=2026-10-22-v1`. Student consent workflow/user notice must be independently approved and built before live enablement.
3. Only send the answer text (after consent), a task question, dimension, **legal/learning reviewer-approved criterion rubric**, and **approved official reference excerpts**. No learner name, student ID, phone, email, university or cohort in provider prompt.
4. Validate model JSON with strict schema; every achieved criterion must quote an **exact passage** of the submitted answer; score must match **approved weights**. Reject fabricated evidence, duplicate/missing criterion labels, contradictions, malformed output and low-confidence assessments.
5. Accepted output is **preliminary only**, `needs_human_review=true`, `mastery_confirmed=false`. The model is not an academic examiner and does not unlock stages automatically.
6. Send `store:false`. This limits provider-side response storage, but is **not by itself a complete retention/privacy guarantee**; confirm provider policies and university data processing approvals before sending student work.
7. Local logs contain only model/usage/counts and evaluation metadata, never API key or the raw answer. Don't log student answer in exceptions.
8. Return no grade if internet/provider unavailable, enrollment, content, consent or source check fails.

## Before any activation
- Deploy a stage-only Supabase Edge Function, never straight to production.
- Approve a detailed external-data notice and UI consent.
- Independently approve the intended item's `rubric_json.criteria` bank, criterion IDs, legal source excerpts and reviewer identities. Many founder-internal practice items lack the independent approval required for this provider; they will be correctly rejected until reviewed.
- Verify a provider *hard* spending limit or prepaid boundary, plus an atomic database quota or otherwise avoid concurrent uncontrolled requests.
- Require explicit founder decision on the **$5 USD** proposed limit (or a different number). No default billable activation.
- Validate 100+ blinded and independently annotated legal answers, across Arabic, English, wrong assertions, correct refutations, partials and mixed-language/noisy responses, and publish false-positive, false-negative and abstention rates.
- Integrate an asynchronous, properly authorized review record back into the official student training flow only after that stage passes; do not let the client's reported grade overwrite authoritative student learning data.

## Mock CI
`tests/semantic-provider-contract.test.mjs`: schema, local flags, rubrics, fabricated evidence, hallucinated response checks, provisional handling.
`tests/semantic-service.test.js`: synthetic Edge Function handler, disabled/budget gate, enrollment/consent, trusted source, mocked provider payload, fake low-credibility provider answer, request-count safeguard.
No API traffic or payment.
