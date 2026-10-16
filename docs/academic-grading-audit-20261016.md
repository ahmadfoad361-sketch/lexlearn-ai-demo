# LexLearn — Independent legal-answer grading audit / مراجعة التصحيح القانوني المستقلة
**Date:** 2026-10-16. **Status:** ready-to-use protocol; NOT a completed independent validation.

## 1. What to review
Released Qatar pilot items only: **s1** (legal personality, articles 39–40) and **s22** (unlawful interest / sole intent to harm, article 63), with article text checked against the current approved official source by a Qatar-qualified instructor. Maintain law/reference version, language, answer wording, model version, and rubric hash.

## 2. Source and answer collection
Collect genuine student answers with informed consent; do not substitute synthetic prompts or model-generated variants for human performance. Oversample abbreviated colloquial Arabic, alternative correct drafting, nuanced conditional phrasing, negation, mistaken condition, contradictory assertions, answers with legally true but irrelevant statements, short vs long answers, Arabic/English and mixed-language responses. Explicitly include **unknown / insufficient evidence** categories. Separate 20% untouched holdout before tuning; freeze source IDs and stratify by content and language.

## 3. Independent reviewer sheet — one row per reviewer per response
| Column | Allowed data / rule |
|---|---|
| `study_id` | pseudonymous random ID; no student name |
| `item_id` | approved item + fixed legal source |
| `language` | ar / en / mixed / other |
| `response_text` | securely stored original (with consent), not in public repo |
| `criterion_birth_alive` | 0 absent/wrong; 1 partly established; 2 correct and applied; NA irrelevant |
| `criterion_end_at_death` | 0 / 1 / 2 / NA |
| `criterion_prenatal_scope` | 0 / 1 / 2 / NA |
| `criterion_live_birth_condition` | 0 / 1 / 2 / NA |
| `criterion_unlawful_interest` | 0 / 1 / 2 / NA — for s22 |
| `criterion_sole_intent_to_harm` | 0 / 1 / 2 / NA — for s22 |
| `fatal_legal_error` | yes / no / uncertain; cite exact answer span |
| `legal_outcome` | correct / partial / wrong / ungradable |
| `source_id` | university-validated article citation |
| `rater_id` | blind A / B, not instructor name in released export |
| `notes` | text evidence, **never** assume plausible meaning when absent |
| `adjudication` | independent result with rationale, only after A/B locked |

Criteria apply *only to the content demanded by the item*, not the whole course. Do not penalize a legally correct answer simply for omitting student mnemonic cues, decorative structure, or verbatim legal wording. For legal precision, direct contradiction should override keyword hits.

## 4. Workflow and separation of duties
1. Legal faculty approve the source article version, each question, the expected legally decisive elements, acceptable paraphrases and negative examples **before** student collection.
2. Export only consented responses with pseudonyms. Human grader A and B work independently, blind to tool score, group assignment, test phase, one another and student identity.
3. Lock their decisions; adjudicator resolves conflicts and publishes documented adjudication. Preserve original conflicting judgments.
4. Freeze holdout answers and rubrics; *then* compute system predictions without changing prompts, thresholds or code. Do not optimize on holdout.
5. Calculate agreement for legal outcome and element scores; separately publish false full-credit on wrong answers (unsafe positive), false zero on correct answers (unfair negative), contradiction handling, abstention rate, accuracy by language/item/answer length and 95% confidence intervals.
6. Investigate high-risk errors **before** allowing automated legal scores to affect student progression. If data insufficient, present 'pending supervisor review', not a confident mark.

## 5. Suggested release gates — proposals, not validated scientific cutoffs
- 0 confirmed *critical* wrong-legal-outcome high-confidence full-credit cases in the locked pilot holdout. If observed, block automatic pass/fail and route to faculty.
- Publish precision/recall and confidence intervals, reviewer agreement, and calibration; do not cherry-pick favorable samples or infer robustness from zero errors in a tiny set.
- Confirm that the Arabic and English rubrics produce semantically equivalent outcomes for matched legal propositions; reconcile translation disagreements.
- All student-facing feedback references a verified legal source and clearly indicates provisional / reviewed status.
- Human override and appeals mechanism work end-to-end with secure audit logs before any operational grade is used.

## 6. Pending university actions
- [ ] Approved reference text and s1/s22 model answer (named reviewer + signed date)
- [ ] Ethics/consent and institutional data-security approval
- [ ] Two real independent human reviewers (signed audit sheets)
- [ ] Locked adjudicated human-answer benchmark
- [ ] Analysis of error distributions and grading release decision

**Important:** existing `tests/qa-39-40-300-answer-variants.json` and `validation/*benchmark.json` are technical test fixtures, not independent ground truth from first-year law students.
