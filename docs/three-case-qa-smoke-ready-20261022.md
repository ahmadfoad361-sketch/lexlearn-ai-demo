# LexLearn – 3-case paid smoke test (ready, NOT YET RUN)
**Environment:** Existing Supabase LexLearn Production project, but a separate smoke-only endpoint. **No student answers, scores or production course state are modified.**

## Deployed and verified
- Edge Function `lexlearn-grading-smoke` is ACTIVE v1 with **verify_jwt=true**.
- Existing `grade-answer` v8 and locked `lexlearn-grading-pilot` v2 were not replaced or unlocked.
- SQL migration `three_case_ai_smoke_20261022` applied successfully. Table `public.lex_ai_grading_smoke` has **zero rows** after deployment. RLS is enabled; `authenticated` cannot SELECT and `anon` cannot INSERT.
- All six GitHub quality jobs completed successfully on commit `d81484525de852b8f3e3b3581753621c64099dc4`.
- The API key remains inside Supabase secret `OPENAI_GRADING_API_KEY`, never disclosed.
- Official references: Qatari Civil Code No.22/2004, Art.39 & Art.40, Al Meezan approved source excerpts.
- Results are educational **engineering QA**, not independent academic certification.

## Three fixed, non-identifying scenarios
| Case ID | Gold expectation out of 100 | Reproducible scope |
|---|---|---|
| `full_ar` | 85–100 | Accurate Arabic legal propositions and three DISTINCT explained cues |
| `reversed_ar` | 0–25 **or abstain for human review** | Reversed birth/death rule and outright denial of conditional prenatal rights |
| `paraphrase_en` | 70–75 | Correct English paraphrase of 3 statutory propositions, no mnemonic cues |

The gold ranges are pre-specified test heuristics for our 8-weight-criterion pilot. They are **not** measured mastery percentages.

## How the project owner runs ONE paid test inside the Supabase dashboard
1. Open **Edge Functions** → **lexlearn-grading-smoke** → **Test**.
2. Select HTTP `POST`; request content type `application/json`; Body: `{"case_id":"full_ar"}`.
3. Under the tester's **Authorization** dropdown use the dashboard's built-in **service role token** (or a *logged-in LexLearn owner JWT*). Never copy, photograph or paste any service role secret into a chat. Plain anon JWT must fail 403.
4. Click **Send Request** ONCE only. The server first reserves `full_ar` atomically in a table with a unique primary key; retries fail 409 and cannot rebill.
5. Read the JSON: `provisional_score`, `agrees_with_gold`, `reason`, `usage.input_tokens`, `usage.output_tokens`, `usage.estimated_usd`, and `student_records_modified:false`.
6. If result is unclear, request a screenshot **excluding any Authorization headers or tokens**. Do not use other cases until reviewed.
7. Test `GET` with same authorization to read saved audit results; GET does not call OpenAI or spend money.

**If Test UI does not offer a token dropdown with a safe built-in service-role selection, STOP; do not manually copy a service-role key.** We can build a safer signed-in owner-only control next.

## Hard safety controls
- Exactly three allowlisted IDs. Atomic DB primary-key reservation **before** provider request; one billed attempt max per case. Even a timeout spends its slot and cannot auto-retry.
- Owner or Supabase Dashboard service-role authorization required, valid JWT at gateway; no public/anon call to OpenAI.
- Synthetic answers exist only in server source; no user-provided answer, names, e-mails, university or academic IDs sent.
- Strict schema, cited evidence, known Arabic legal excerpts, English equivalent and contradictory claim tests.
- JSON responses contain a preliminary score only if validated; uncertain grades are held for human review.
- Provider model `gpt-5.4-mini`, maximum output 1200 tokens, with a total three requests worst-case if all triggered. Price estimate USD 0.75/M input, USD 4.50/M output (2026-10-22); real use recorded per attempt.
- OpenAI project has user-enabled hard USD5 monthly spend limit. Small overage remains possible during enforcement.
- Not connected to official diagnostic/training RPCs or any automatic student progression.

## Remaining
- **Real provider calls: not performed.** Zero smoke rows as of the verification query.
- First manual test request is the next step.
- Blind academic and pedagogical review must still approve these rubric criteria and verify false highs, false lows and bilingual parity with more independently marked cases.
