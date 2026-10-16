# LexLearn — Qatar university pilot and evidence-verification protocol / بروتوكول التحقق العلمي
**Version:** 2026-10-16 — pre-registration draft for academic review. **Not an efficacy result.**

## 1. القرار البحثي / Core scientific claim
**AR:** تفترض LexLearn أن التمرين الذي يتكيف مع أداء الطالب المتغير في الحفظ والفهم قد يحسن الاسترجاع المؤجل وتطبيق القاعدة على واقعة جديدة، فوق فائدة التعليم الموحد الذي يستخدم الاسترجاع والتغذية الراجعة والمراجعة المتباعدة. الأدلة المنشورة تدعم تلك المكونات، **ولا تثبت بعد ميزة التخصيص في LexLearn**.

**EN:** LexLearn hypothesizes that adapting practice to *observed, revisable* recall and comprehension performance may improve delayed retention and transfer over an otherwise equivalent uniform evidence-based programme. Existing research supports the underlying strategies, **not LexLearn's specific adaptation effect or legal grading accuracy**.

## 2. Evidence → code matrix (verified against repository, 2026-10-16)
| Principle | Scientific basis | Observable implementation | Limitation and gate |
|---|---|---|---|
| Retrieval without visible answer | Roediger & Karpicke (2006); Karpicke & Blunt (2011) | `showcase.js` free recall; `showcase-learning-cycle.js` reconstruct | Within-session attempts alone do not establish durable memory; held-out delayed tests |
| Meaningful understanding / self-explanation | Craik & Tulving (1975); Chi et al. (1994); Bisra et al. (2018) | `showcase-learning-cycle.js` meaning / explain; `assets/learning-keys.js` cue + meaning | Open writing is currently self-compared/ungraded in preview; independent human rubric |
| Feedback on misconception / legal conditions | Wisniewski et al. (2020) | Choice feedback in learning cycle; tentative proposition evidence in `showcase-recall.js` | Feedback quality depends on legal correctness and explainability |
| Spaced review | Cepeda et al. (2006, 2008); Dunlosky et al. (2013) | `pilot-learning.js` schedules after 1 and 7 days; `adaptive-engine.js` error-based delays | Intervals are engineering defaults; task completion != verified retained competence |
| Worked examples / fading support | Sweller & Cooper (1985); Atkinson et al. (2000) | Foundation preview worked question added in this branch | One preview is illustrative, not a measured mastery hierarchy |
| Transfer to new legal facts | Pan & Rickard (2018), Butler (2010) | `showcase-learning-cycle.js` changed fact practice | Only truly unseen, separately scored cases constitute independent transfer assessment |
| Adaptation by observed performance | Kulik & Fletcher (2016); Hooshyar et al. (2024) | `recommend(recall,understanding)`: low-low → foundation; comparative weakness → targeted route | Threshold 45 is provisional; one free response + four choices cannot establish a fixed learner trait |
| Caution against learning-style labels | Pashler et al. (2008) | UI calls results provisional task indicators | Do not claim immutable 'visual/auditory' learning styles or validated psychometric diagnosis |

**Technical grading boundary:** `assets/adaptive-engine.js` uses `keyword_fallback`; `showcase-recall.js` applies local proposition rules and may abstain. Neither is a legally validated general semantic evaluator. Existing automated unit tests and synthetic answer cases **do not** constitute an independent student-answer validation sample.

## 3. Three-group experimental design
- **A — usual study:** same legally approved syllabus and target study duration, conventional reading and lecturer-approved practice.
- **B — uniform evidence-informed:** same content, retrieval, feedback and spaced review for all learners, without branching on performance.
- **C — LexLearn adaptive:** same content, practice duration, feedback and review opportunities as B, but activity order and scaffolding vary from provisional, repeated student-performance indicators.
- **Why three arms:** C vs B isolates the *incremental effect of adaptation*; B vs A tests the standard evidence-based training package. Two arms (C vs A) cannot distinguish those mechanisms.
- Population: consenting first-year law students at a participating Qatar university, within the selected, lecturer-approved topics (Qatar Civil Code 22/2004, including articles 39–40, 63). Exclude or analyze separately students with previously completed training on identical test items.
- Random assignment stratified by baseline assessment and language proficiency where feasible; preregister whether individually or by tutorial section. University ethics approval and informed consent **before recruitment**. Use pseudonymous study IDs.
- Preregister outcome measures, exclusion rules, analysis, target effect, power calculation, recruitment plan, stopping policy, and any multiple-comparison correction. No post-hoc invention of a sample size justified as 'power'.

## 4. Assessment schedule and blinding
**T0 (baseline)** → assigned practice with equal time and content → **T1 immediately** → **T2 day 7** → **T3 day 28** (timing may be fixed by university before data collection). Each test uses unseen equivalent questions; never merely replay the training texts.

Primary outcome: accuracy of unseen legal *application/transfer* at T2 (human-graded preregistered rubric).

Secondary outcomes: unaided recall of legal conditions at T2/T3; legal precision; explanation quality; exam-answer structure; study time; review adherence; harmful misapplication; completion/withdrawal; usability. Record number of hints / help exposures; do not use self-checked practice answers as ground-truth.

Two independent law graders blind to group and timepoint; adjudicate differences. Use numerical rubric agreement with ICC (appropriate form preregistered), categorical decisions with weighted kappa; report raw disagreements. Accuracy of automated grader must be separately benchmarked against adjudicated human judgments.

Proposed analysis: intention-to-treat on available participants with explicitly reported missingness, ANCOVA or mixed model adjusting baseline, institution/section as appropriate, effect sizes + 95% CI; sensitivity for attrition and contamination. Protocol and deidentified aggregate results to be reviewed by the university.

## 5. LexLearn-only adaptation evaluation
- C vs B is the primary causal contrast for the specific LexLearn hypothesis.
- Log and disclose exact branch rule, threshold, diagnostic item count, scheduling defaults, version/hash.
- Do not claim that a 45-point dual weakness cutoff or a 24-hour review rule is an empirically optimal value.
- Test whether high diagnostic score differences reliably predict subsequent independent performance, with uncertainty intervals and subgroup calibration (Arabic vs English if sufficient data).
- Analyze student outcomes, not clicks, code coverage, or percentage of research features implemented.

## 6. Data safeguarding and release gates
Before live student recruitment: university approves legal prompts/rubrics and Arabic/English versions; validates consent, retention schedule, secure student data access and deletion, cross-device sync, teacher oversight, access-control rules and incident process; makes the study registration publicly accessible where appropriate. Do not store student names in research grading exports. Audit grading as detailed in `docs/academic-grading-audit-20261016.md`.

### Status (2026-10-16)
- [x] Pre-registration and legal-grading audit draft prepared
- [x] Showcase foundation path implemented on a review branch, pending merge
- [ ] University-approved content and reviewer signatures
- [ ] Human answer benchmark, analyzed and signed
- [ ] University ethics approval / participants / outcome collection
- [ ] Statistical analysis / published efficacy conclusions

## References / قائمة مراجع مختارة
- Craik & Tulving (1975), *Depth of Processing and the Retention of Words in Episodic Memory*: https://doi.org/10.1037/0096-3445.104.3.268
- Roediger & Karpicke (2006), *Test-Enhanced Learning*: https://doi.org/10.1111/j.1467-9280.2006.01693.x
- Karpicke & Blunt (2011), *Retrieval Practice Produces More Learning*: https://doi.org/10.1126/science.1199327
- Cepeda et al. (2006), *Distributed Practice*: https://doi.org/10.1037/0033-2909.132.3.354
- Cepeda et al. (2008), *Spacing Effects*: https://doi.org/10.1111/j.1467-9280.2008.02209.x
- Chi et al. (1994), *Eliciting Self-Explanations*: https://doi.org/10.1207/s15516709cog1803_3
- Dunlosky et al. (2013), *Improving Students’ Learning*: https://doi.org/10.1177/1529100612453266
- Pashler et al. (2008), *Learning Styles*: https://doi.org/10.1111/j.1539-6053.2009.01038.x
- Pan & Rickard (2018), *Transfer of Test-Enhanced Learning*: https://doi.org/10.1037/bul0000151
- Wisniewski et al. (2020), *The Power of Feedback Revisited*: https://doi.org/10.3389/fpsyg.2019.03087
- Kulik & Fletcher (2016), *Effectiveness of Intelligent Tutoring Systems*: https://doi.org/10.3102/0034654315581420
- Bisra et al. (2018), *Inducing Self-Explanation*: https://doi.org/10.1007/s10648-018-9434-x
- Agarwal, Nunes & Blunt (2021), *Retrieval Practice Consistently Benefits Student Learning*: https://doi.org/10.1007/s10648-021-09595-9
- Hooshyar et al. (2024), *Personalized Technology-Enhanced Learning*: https://doi.org/10.1016/j.compedu.2024.105169
- Kestin et al. (2025), *AI Tutoring Outperforms In-Class Active Learning*: https://doi.org/10.1038/s41598-025-97652-6

**Full-text access:** use DOI/author links in `docs/scientific-evidence-review-20261009.md`. Some PDFs are publisher restricted or licensed for personal noncommercial study only. Do not bulk rehost/repackage copyrighted PDFs without clear reuse rights.
