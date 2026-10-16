# LexLearn learning-science evidence and showcase audit (16 October 2026)

> **Status:** design-research brief, NOT proof of LexLearn efficacy. Code baseline for this review: `e18e5c1bf9d42edf69c018e332a4f5a111158a58` (16 Oct 2026). Assessed the public `showcase`, not every feature in the student pilot. A browser-based end-to-end student trial was NOT performed.

## Scientific conclusion / الخلاصة

Evidence supports semantic elaboration, retrieval, distributed review, self-explanation and meaningful corrective feedback as **general learning principles**. Technology-enabled personalization is promising, but evidence has **not** yet demonstrated that LexLearn's own recall/understanding adaptive branches outperform the same exercises delivered in a fixed sequence. Treat this as the novel, testable product hypothesis.

Also, do **not** describe `strong in recall` or `strong in understanding` as a permanent learning style. Describe only observed skill indicators from a limited attempt (Pashler et al., 2008).

## Evidence bibliography (original source / original text access)

| Study | Evidence for design | Access |
| --- | --- | --- |
| Craik & Tulving (1975) | Meaningful encoding / deeper processing | [DOI](https://doi.org/10.1037/0096-3445.104.3.268), often restricted |
| Roediger & Karpicke (2006) | Retention improves after retrieval | [Author PDF](https://learninglab.psych.purdue.edu/downloads/2006/2006_Roediger_Karpicke_PsychSci.pdf) |
| Cepeda et al. (2006) | Distributed practice; interval matters | [Institutional full text](https://escholarship.org/uc/item/3rr6q10c) |
| Pashler et al. (2008) | No adequate case for fixed learning styles | [Free publisher article](https://doi.org/10.1111/j.1539-6053.2009.01038.x) |
| Karpicke & Blunt (2011) | Retrieval benefits conceptual questions | [Author PDF](https://learninglab.psych.purdue.edu/downloads/2011/2011_Karpicke_Blunt_Science.pdf); personal-use restrictions |
| Dunlosky et al. (2013) | Testing and spacing rank highly | [Academic-hosted PDF](https://www.whz.de/fileadmin/lehre/hochschuldidaktik/docs/dunloskiimprovingstudentlearning.pdf) |
| Kulik & Fletcher (2016) | Intelligent tutoring effect varies by evaluation | [DOI](https://doi.org/10.3102/0034654315581420), restricted |
| Bisra et al. (2018) | Self-explanation meta-analysis | [DOI](https://doi.org/10.1007/s10648-018-9434-x), access varies |
| Pan & Rickard (2018) | Retrieval and transfer (not automatic) | [PubMed](https://pubmed.ncbi.nlm.nih.gov/29733621/) |
| Wisniewski et al. (2020) | Content-rich feedback; heterogeneous benefits | [Open full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456/) |
| Agarwal et al. (2021) | Classroom retrieval systematic review, 50 experiments | [Open full text](https://doi.org/10.1007/s10648-021-09595-9) |
| Hooshyar et al. (2024) | Personalized technology-enabled learning, 47 studies | [DOI](https://doi.org/10.1016/j.compedu.2024.105169), version may be restricted |
| Kestin et al. (2025) | RCT of AI tutoring in physics; NOT legal grading | [Open full text](https://doi.org/10.1038/s41598-025-97652-6) |

**Copyright:** Do not commit publisher PDFs to this repo. Link to originals and licensed author versions.

## Current public-showcase audit (explicit design rubric, not an efficacy metric)

Scale 0=absent, 1=partial, 2=functionally present in code. Ten equal-weight checks.

| Check | Code observation | /2 |
| --- | --- | ---: |
| Semantic/meaningful learning | Rule, meaning contrasts and conditions | 2 |
| Separate recall and understanding diagnosis | Different questions but few items and no validated routing cutoff | 1 |
| Unassisted retrieval | Free-text reconstruction before reference | 2 |
| Student self-explanation | Why/causal prompts, free writing self-compared | 1 |
| Targeted weak-skill branch | Recall/understanding/balanced flows in `showcase-learning-cycle.js` | 2 |
| Explanatory feedback | Option explanation and reference comparison after answer | 2 |
| Transfer via a changed fact | New legal fact-pattern and conditional questions | 2 |
| Actually delayed reassessment **in showcase** | The public four-step preview is immediate | 0 |
| Validated legal essay correctness | Rules can abstain but no independently marked validation has been demonstrated | 0 |
| Independent learning gains | No randomized comparison with delayed unseen test in public demo | 0 |
| **Total** | **Internal code coverage of this defined rubric ONLY** | **12/20 (60%)** |

Do not market this figure as “60% scientifically validated” or “60% effective”. The full `adaptive-engine.js` has retention and scheduled-review logic **outside** the assessed short showcase; code presence does not establish its efficacy or every live workflow integration.

## Key code observations

- `assets/showcase.js`: two recall choice items, four understanding choice items and one open reconstruction. The final branch compares provisional metrics, which may differ in reliability.
- `assets/showcase-learning-cycle.js`: 4 guided activities along either `recall`, `understanding`, or `balanced` route. Free practice writing is self-compared, not human- or semantically graded.
- `assets/showcase-recall.js`: conservative rule-based detection and abstention; *not* a proven semantic legal grader. Needs bilingual, negation, exception and adversarial scoring benchmark.
- `assets/adaptive-engine.js`: central scheduling logic and delayed checks are defined for the wider student app.
- Code quality checks for baseline `e18e5c1` passed in GitHub Actions (16 Oct 2026); those checks are not empirical learning results.

## Engineering backlog prioritized

- **P0:** Show assessment uncertainty; do not assign enduring fixed “learner-type” labels. This branch improves the **showcase result-screen text** in AR and EN, but does not change the underlying measurement.
- **P0:** Obtain expert approved answer keys, independent double-marking, and evaluate scoring errors per question/language (especially negation, contradiction, paraphrase).
- **P1:** Test delayed retention with new equivalent questions after 1, 7 and 14 days; preserve a never-exposed assessment bank. Avoid claiming immediate self-comparison proves retention.
- **P1:** Randomize *adaptive pathway versus identical fixed-order tasks*; fixed reading/wait times, preregistered primary delayed legal outcome.
- **P1:** Define routing with calibrated item-level evidence and uncertainty; do not compare raw proportions from very small dissimilar item sets as strong diagnostic evidence.
- **P2:** Law lecturer sign-off of statutory material, all distractors and both AR/EN explanations against official Qatar Civil Code references.

## University pilot: isolating the LexLearn-specific claim

**Primary hypothesis:** Adaptive routing improves a **14-day delayed independent legal-test score** versus content- and time-matched nonadaptive routing.

1. Participants: consenting first-year law students in Qatar; sample size by prespecified power calculation.
2. A: adaptive LexLearn, B: same tasks/time in fixed order; optional C: usual teaching in addition.
3. Six weeks / six levels. Pretest, immediate posttest, 14-day delayed test (optionally 28-day).
4. Novel held-out statutory rule and case-based assessments, separately scoring recall, comprehension and application.
5. Two blinded law raters. Report agreement and disagreements; do not use automated scores as the only “ground truth”.
6. Preregister primary endpoint, inclusion, missingness/attrition, confound controls, analysis and confidence intervals before recruitment.
7. University ethics/consent and student data protection. Publish null and mixed findings transparently.

### University-facing safe claim / صياغة مأمونة

“LexLearn is a research-informed adaptive legal-learning prototype. It integrates retrieval, self-explanation, feedback and skill-based guided practice. Its incremental advantage over matched nonadaptive instruction and its legal-scoring validity are proposed for independent university evaluation.”

«ليكس ليرن نموذج أولي في التعليم القانوني التكيفي يسترشد بنتائج علم التعلم. تُختبر جدوى التخصيص ودقة التصحيح القانوني بصورة مستقلة مع شريك أكاديمي قبل الادعاء بفاعلية مثبتة للمنصة».

Earlier detailed repository reviews: [scientific-evidence-review-20261009.md](scientific-evidence-review-20261009.md) and [academic-pilot.md](academic-pilot.md).
