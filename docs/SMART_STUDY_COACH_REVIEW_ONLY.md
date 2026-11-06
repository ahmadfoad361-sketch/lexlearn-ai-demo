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

## End-of-break audio (preview only, 2026-11-06)

- After the student **clicks Start break**, the browser unlocks Web Audio and plays a gentle original three-note sine chime **once** when the countdown reaches zero.
- A visible on/off checkbox defaults to ON and the learner can mute the sound at any time; when OFF there is no audio.
- The finish message and `Return to training` control remain available even if sound cannot be played.
- The timer still relies on the browser remaining alive; browsers may throttle background tabs or block audio, and a closed website cannot guarantee an alert. No push notifications and no native app audio are implemented.
- Automated review tested completion with three scheduled oscillator notes, no repeat on subsequent timer ticks, muted completion with zero additional notes, no JavaScript errors, and all controls visible at 390×844.
- This does not change the feature flag, server-grade timing, student consent or production release requirements.

## 2026-11-06: Requested simplified mobile experience

- The standalone review HTML now opens **directly on the realistic student rest image and modal**, rather than a simulation control screen.
- No sound icon, checkbox, or test-sound button in the student-facing popup. Sound is primed on **Start break** user interaction; when the timer ends a gentle original chime repeats briefly (max 12 seconds), and touching or pressing a key in the popup stops it without displaying any new sound UI. If the popup is closed before the timer finishes, the pending alert is cancelled.
- The close X is a plain unframed white × placed over the photo; the 'This activity does not suit me' row was removed.
- Preview checks: 390x844 viewport renders the photo, five activity cards, timer and actions; sound mocked with WebAudio shows 3 notes at the deadline and no more notes after a screen tap; zero JavaScript page errors.
- Note that TikTok and other in-app browsers add their **own** top navigation bar and close button, outside the webpage's control. Mobile background audio may be suppressed by the platform; only an open active page is supported.
- Media images still need to be added to the feature branch before a hosted preview; the embedded-image standalone HTML includes these assets. No production deployment is authorized.
