# Learner milestones and first-year wording

The diagnostic and training reports now show two color-coded score rings, an illustrated achievement header, a six-level completion strip at checkpoints, and a locally downloadable SVG result image. The image includes only available scores and the completion label; it contains no learner name or contact details. Missing assessments remain pending and never become zero or a fabricated percentage.

During submission, the learner sees saving followed by assessment preparation. A brief, silent confetti effect appears only after a submitted checkpoint has been read back as complete and the server overview confirms completion. A previously saved report does not replay it. Reduced-motion preferences suppress the confetti and spinner animation. Celebration storage is presentation-only and never authorizes progression.

Question presentation is reviewed for learners with no previous legal education. The 24 recall and 24 understanding prompts use short numbered instructions, while the two legal comparison statements remain unchanged. The 24 Arabic application cases use shorter equivalent sentences, guarded by an exact match of the original case sentence. Changed or unfamiliar cases fall back to their original wording. The four answer sections explain “issue”, “rule”, “application” and “conclusion” in everyday language in both Arabic and English; their saved section labels remain unchanged for grading.

All 72 live Arabic/English prompt hashes matched `validation/content-review-bank.json` before the presentation changes. The approved database prompts, legal sources, decisive facts and grading criteria were not edited. The semantic assessor still receives the original approved prompt and rubric. Its v2 feedback instruction now explicitly addresses a first-year learner, requests short sentences, explains unavoidable terminology and gives three short feedback paragraphs.

`AGENTS.md` preserves the owner's standing requirement to review future free-response wording for first-year beginners.

Validation includes the existing publication suite, `tests/learning-moments.test.js` and `tests/beginner-prompts.test.js`. Covered cases include pending scores, image contents, reduced motion, duplicate celebration prevention, failed saves, old-report reloads, guarded case rewrites, all 72 prompts and preservation of legal qualifications. Browser previews with clearly labeled synthetic data were inspected at desktop and 390px mobile widths; actual report rendering, reference-free pending indicators, confetti element creation and result download were checked.

