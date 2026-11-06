# Smart Study Coach — gated student-path wiring (REVIEW ONLY)

**NOT PRODUCTION READY.** This branch must not be merged or deployed to Production before approved encrypted off-Supabase backup with independently verified restore, release/security gates and student consent.

## Implementation in this branch

- Student authenticated via existing training path; coach initializes only after identity and allowed training overview.
- The saved-answer path records a completed session only after server confirmation.
- The coach can suggest a break only when the learner clicks **next session** on a completed session screen. It does not interrupt typing, saving, assessment, or existing session celebrations.
- Rules: 30m estimated activity OR 3 confirmed completions plus >=15m activity for short break; 75m OR 5 completions plus >=45m activity for possible end-of-day.
- UI respects 2 prompts/day, 30m suppression after showing/continue, 2 closes => mute today, explicit mute today, Escape, reduced motion, 5/10/15-minute timer, 5 activities, AR/EN.
- Preview activation requires \`?coach_preview=1\` **on this feature branch only**. Otherwise no data is collected and the learner flow remains unchanged.
- No new Supabase migrations, tables, Edge Functions, APIs, paid AI calls, or changes to official scoring.
- Preview activity counts 15s pulses only for a visible, focused tab with a recent interaction (3m grace), and excludes modal time. Single-browser lease reduces duplicate counts among tabs. This is an **estimate**, not a verified cross-device union.

## Media and visual review

Source media (realistic legal-study hero with official LexLearn X on laptop, five matching activity tiles) are in the accompanying local review ZIP. The seven image assets are **not included in the GitHub branch yet**; they must be installed under \`assets/study-coach/\` before viewing it on a hosted preview. CSS has a cream fallback where the media has not yet been installed. Do not merge this branch without all images and an accessibility/performance review.

## What still blocks a real pilot

1. Production backup and actual restore proof; Production change freeze remains in force.
2. A server-controlled feature flag with OFF/SHADOW/PILOT/ON, a kill switch and scoped JWT/RLS.
3. Server-authenticated activity interval union across tabs and devices, saved timer, event audit, timezone confirmation.
4. Privacy policy, explicit informed consent, withdraw/delete process, retention policy.
5. Shadow-only calibration then a one-student opt-in pilot after full security and load testing.
6. P95 performance budgets, mobile 4G, accessibility, AR/EN, regression, rollback, actual 100-student QA.

**Neither unit tests nor a static visual prototype is proof of educational effectiveness.**
