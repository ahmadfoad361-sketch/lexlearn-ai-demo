# Semantic partial credit and recovery

The prior all-or-nothing criterion calculation could award zero when an answer demonstrated a correct component of a compound legal criterion. v3 uses 0, 0.5 or 1 per criterion, with exact saved-answer evidence for every positive award and bilingual explanations. Totals remain calculated server-side from approved weights. Criterion labels come from the approved rubric. This is task fulfilment, not a validated estimate of overall comprehension.

Saved v2 assessments are re-evaluated on opening their session. Their old scores are excluded from current reports and adaptation. Unconfirmed provider responses remain unscored and offer retry. Retries are limited to three audited requests per learner/item/version, within existing hourly and daily budgets; current successful grades are cached. Reservations and final writes use compare-and-swap. Logs retain safe failure categories without secrets or provider payloads.

No new consent is requested: the existing registration acceptance remains required server-side. Answers, academic rubrics, task scope and progress gates remain unchanged. Reassessment occurs only against the signed-in learner's own saved work.

