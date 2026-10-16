# LexLearn — research and implementation check (16 October 2026)

Scope: first-year Qatar civil law, mainly Articles 39–40 and 63. Baseline reviewed: commit `e18e5c1bf9d42edf69c018e332a4f5a111158a58`; this update is a targeted proposal and has not established learning effectiveness.

## Evidence-based conclusions
- Retrieval practice and distributed practice are supported by broad evidence (Dunlosky et al. 2013; Roediger & Karpicke 2006; Cepeda et al. 2006; Agarwal et al. 2021).
- Meaningful semantic encoding, self-explanation, worked examples and informative feedback offer additional design rationale (Craik & Tulving 1975; Chi et al. 1994; Bisra et al. 2018; Atkinson et al. 2000; Wisniewski et al. 2020).
- Transfer is not automatic; require independent unseen legal fact patterns (Pan & Rickard 2018).
- Do not label students as fixed learning styles. Current observed task scores must remain provisional (Pashler et al. 2008).
- No study cited here establishes that LexLearn's specific adaptive branching improves Qatari legal education.

## Code alignment — transparent engineering checklist (NOT an efficacy percentage)
12 criteria: 2=visible in reviewed code; 1=partial; 0=not validated/absent. Total **15/24 (62.5% source-level coverage)**, NOT a claim that 62.5% of science is implemented, 62.5% of students benefit, or 62.5% of the system is academically certified.

| Criterion | Score |
| --- | ---: |
| Separate recall/comprehension indicators | 2 |
| Closed-book free reconstruction | 2 |
| Condition-based self explanation | 2 |
| Learner-generated meaning-linked retrieval cues | 2 |
| Performance-responsive routing with sufficient evidence | 1 |
| Avoidance of fixed styles | 2 |
| Worked example plus controlled support fading | 1 |
| Transfer using meaningfully changed facts | 1 |
| Corrective and legally accurate feedback | 1 |
| Delayed review evidenced in pilot path | 1 |
| Independently validated legal essay grading | 0 |
| Controlled student learning-outcome experiment | 0 |

Affected features reviewed: `assets/showcase.js`, `assets/showcase-en.js`, `assets/showcase-learning-cycle.js`, `assets/showcase-recall.js`, `assets/learning-keys.js`, `assets/adaptive-engine.js`, `assets/pilot-learning.js`, `docs/academic-pilot.md`.

## Small safeguard in this PR
- Add `LEX_SHOWCASE_CYCLE.route(recall, understanding)` to prefer balanced practice when scores are unmeasured, invalid, close (<25 percentage points), or both low (<45).
- This 25-point and 45-point boundary is a conservative **engineering heuristic**, not a scientifically validated diagnostic threshold.
- Apply consistently to Arabic and English demo, including resumed attempts. No production exam-grade or student mastery data are altered.
- Confirm automated unit/integration tests before merging; production demo remains unchanged until merge.

## Independent validation protocol
Prefer a time/content-matched **three-arm randomized comparison**:
1. Usual study;
2. Uniform retrieval plus spacing;
3. LexLearn adaptive routing.

Pre-register a primary endpoint such as delayed legally accurate transfer on unseen Qatar-law vignettes (e.g., day 14). Collect independent baseline and posttests; have two blinded legal assessors judge written responses with a common rubric; report agreement, attrition, uncertainty and scores separated by recall, comprehension and application. Sample sizes require prior power/precision planning. Obtain institutional ethics and faculty approval first. **Do not use in-app automatic essay scoring as the gold standard.**

## Research entry points
- Dunlosky et al. 2013 full text: https://www.whz.de/fileadmin/lehre/hochschuldidaktik/docs/dunloskiimprovingstudentlearning.pdf
- Roediger & Karpicke 2006 original: https://learninglab.psych.purdue.edu/downloads/2006/2006_Roediger_Karpicke_PsychSci.pdf
- Cepeda et al. 2006 original: https://escholarship.org/content/qt3rr6q10c/qt3rr6q10c.pdf
- Karpicke & Blunt 2011 original: https://learninglab.psych.purdue.edu/downloads/2011/2011_Karpicke_Blunt_Science.pdf
- Agarwal et al. 2021 original: https://pdf.poojaagarwal.com/Agarwal_etal_2021_EDPR.pdf
- Chi et al. 1994 original: https://education.asu.edu/sites/g/files/litvpz656/files/lcl/chideleeuwchiulavancher_3.pdf
- Pan & Rickard 2018 original: https://pdf.retrievalpractice.org/transfer/Pan_Rickard_2018.pdf
- Pashler et al. 2008 publisher: https://doi.org/10.1111/j.1539-6053.2009.01038.x
- Wisniewski et al. 2020 open text: https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456/

The existing, more detailed literature mapping remains in `docs/scientific-evidence-review-20261009.md`.
