# LexLearn — evidence-to-design standard (25 Nov 2026)

Status: research-informed design requirements; not a validation study or legal grading certification. This file is an internal development reference in PR #156, not a production release. Sources examined: archived LexLearn_Original_Research_Reading_List.csv (R01–R16), Scientific Foundations & Independent Validation Plan (16 Oct 2026), Research Foundation EN, and the 2 Nov Drive evidence map (https://docs.google.com/document/d/1Ce2b4coP7e1Tg6_RkoyT4DxfZoNL2yPvSMosE19OiWU/edit). 19 distinct references identified; publisher/academic records and accessible text/abstracts were consulted; not all original full articles were read in full. The claimed expanded 50/52-reference inventory has not been located. Do not misrepresent coverage.

## Traceability
| ID | Reference | Design application and boundary |
|---|---|---|
| R01 | Craik & Tulving 1975 https://doi.org/10.1037/0096-3445.104.3.268 | Meaningful cue to statutory condition/consequence; word-memory experiments do not validate law instruction. |
| R02 | Dunlosky et al. 2013 https://doi.org/10.1177/1529100612453266 | Prioritize self-testing and distributed practice. Isolated keyword mnemonics are not the basis for a mastery score. |
| R03 | Roediger & Karpicke 2006 https://doi.org/10.1111/j.1467-9280.2006.01693.x | Unaided attempt before feedback; measure delayed retention separately from immediate performance. |
| R04 | Karpicke & Blunt 2011 https://pubmed.ncbi.nlm.nih.gov/21252317/ | Retrieval can aid comprehension/inference; do not equate recall score with comprehension or generalize every result to law. |
| R05 | Cepeda et al. 2006 https://doi.org/10.1037/0033-2909.132.3.354 | Spread retrieval over time; interval depends on retention target. |
| R06 | Cepeda et al. 2008 https://doi.org/10.1111/j.1467-9280.2008.02209.x | Treat 1/7/14-day schedules as configurable pilot hypotheses, not universal optima. |
| R07 | Chi et al. 1994 https://doi.org/10.1207/s15516709cog1803_3 | Ask the student to explain legal conditions and consequences in their own words. |
| R08 | Atkinson et al. 2000 https://doi.org/10.3102/00346543070002181 | For novices, use integrated worked examples before independent problems; vary surface facts, gradually fade assistance. |
| R09 | Bisra et al. 2018 https://doi.org/10.1007/s10648-018-9434-x | Prompt meaningful self-explanation; do not score mere verbosity. |
| R10 | Agarwal et al. 2021 https://doi.org/10.1007/s10648-021-09595-9 | Low-stakes retrieval across sessions; limited representation of non-WEIRD populations means Qatar pilot matters. |
| R11 | Pan & Rickard 2018 https://pubmed.ncbi.nlm.nih.gov/29733621/ | Assess transfer using unseen fact patterns with a materially changed legal condition, not only paraphrased training items. |
| R12 | Wisniewski et al. 2020 https://doi.org/10.3389/fpsyg.2019.03087 | Specific corrective feedback after the attempt: missing condition, legal error, next action; do not reveal future assessment answers. |
| R13 | Pashler et al. 2008 https://doi.org/10.1111/j.1539-6053.2009.01038.x | No fixed learner styles. Adapt to observed skill evidence and uncertainty, not immutable labels. |
| R14 | Kulik & Fletcher 2016 https://doi.org/10.3102/0034654315581420 | Intelligent tutors may help; compare on independent measures rather than only platform-native tests. |
| R15 | Hooshyar et al. 2024 https://doi.org/10.1016/j.compedu.2024.105169 | Performance-responsive personalization in university setting is promising; specific bidirectional LexLearn routing is unvalidated. |
| R16 | Kestin et al. 2025 https://doi.org/10.1038/s41598-025-97652-6 | Structured AI tutor evidence in physics is not legal grading evidence. |
| R17 | McDaniel et al. 2007 https://doi.org/10.1080/09541440701326154 | Classroom retrieval with feedback; test law-specific implementation rather than infer direct effect. |
| R18 | McDaniel et al. 2011 https://doi.org/10.1037/a0021782 | Short quizzes at deliberate times; school science context is not equivalent to university law. |
| R19 | McDaniel et al. 2013 https://doi.org/10.1002/acp.2914 | Spaced quizzing with feedback can support transfer; use new legal cases and evaluate independently. |

## Acceptance criteria for new questions
- Assign the four measured skills separately: recall, understanding, legal precision, exam answer structure. One prompt can have distinct rubric elements but scores must not be conflated.
- Clear standard Arabic/English, complete propositions, explicit scope. Keep legally decisive words, conditions, exceptions and correct/inaccurate meaning. No clues from answer length, fixed truth patterns or language awkwardness. Localize names/places/currency only if legal jurisdiction is correct. Do not change existing item meaning or truth pattern under same scoring version. Unknown versions stay untouched.
- Recall: hide legal text, dictionary and prior responses; learner-generated cue must link to a legal condition or consequence; assess actual reconstruction, not presence of words. Three cues are a design choice not a research-established optimum. Separate assisted practice from unassisted measurement.
- Understanding: explain why, distinguish related concepts, classify each proposition and correct any mistake; do not show answer during assessment. Diverse truth patterns only in a versioned, legally and pedagogically reviewed bank with compatible rubric.
- Exam reasoning: issue, rule, application, conclusion; optional sentence starters never score evidence; 'therefore' only in conclusion. Gradually reduce scaffolding as verified performance improves, test on novel cases.
- Feedback: after attempt, distinguish missing elements, contradictions, legal error and valid reasoning; do not penalize paraphrase if legally equivalent. Human legal benchmark before claiming semantic accuracy.
- Adaptation: observed skills, not learning styles. Weak recall + adequate understanding: semantic cues then unaided reconstruction and spaced review. Adequate recall + weak understanding: explain/contrast conditions then new facts. Both weak: worked examples then supported practice, gradually fade. Both strong: harder legal reasoning and integration, not language ambiguity. Small/sparse evidence or outage: do not infer weakness; continue last reliable path, do not score pending as zero; update future sessions after complete catch-up. Existing grades, question versions and started session remain intact.
- Boredom: vary activity format while keeping objective and source fixed. Introduce optional low-stakes classification, error finding, fact variation, legal roles; no reward mechanic as evidence of mastery. Test completion, time and delayed retention, not engagement alone.
- Validate: faculty approves item bank, two blinded legal assessors on withheld answers (correct paraphrase, partial, contradictory, negation/exception), immediate and delayed independent tests. Compare ordinary learning, matched nonadaptive retrieval/spacing, and adaptive LexLearn; content and study time matched. No claim of optimal intervals, proven adaptive effects or AI grading accuracy before evidence.

## Current release boundary
PR #156 is wording-only, preserves existing rubric and assessment IDs. These acceptance requirements are not evidence that all features have been implemented or passed. Any change to score calculation, difficulty progression, truth distribution, or approved item content needs a new validated version, test cases, and release gates. No production data changes or paid calls in this reference review.
