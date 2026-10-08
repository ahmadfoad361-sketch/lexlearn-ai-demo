# Constructed-answer grading and adaptive training

Implemented 2026-10-08.

## Score boundary

`LEX_QUALITY.grade` produces element evidence and `coverageScore` only. Legal `overall` and every mastery axis remain null. A structured answer cannot pass without a substantive review. Pending scores never create skill-gap evidence. Old prompt_rubric_v3 and assessment_essay_profile_v1 evidence is excluded from the learner model.

`gradeAsync` invokes the authenticated grade-answer function using a stable task key (`rights-v1-s{teaching-session}-{recall|understanding|exam}`). The server selects exactly one approved content item whose rubric_json.lex_task_key matches, then loads its approved sources. The client cannot supply a rubric or legal source. Missing approval, missing sources, unavailable provider, low confidence, malformed response, or a review request leaves the score pending. A confirmed contradiction scores zero. Confidence >=0.8 is an operational threshold, not a measured guarantee of accuracy.

Weekly progression stays locked while its essay is pending. The displayed overall grade is also null, rather than treating pending work as zero. Training can continue within the available week.

## Deployment blocker

Read-only production check on 2026-10-08: zero approved content items exist for qa-qu-lawc101-rights. Consequently, real semantic scoring cannot currently succeed for this program. This change must not be described as a working or independently validated AI grader. Provider configuration and billing have not been verified.

To activate: create/review each canonical task in content_items, retain the exact public prompt/scenario, set its rubric_json.lex_task_key, define legal criteria and unacceptable conclusions, attach approved source IDs, obtain academic approval, and set OPENAI_API_KEY and OPENAI_MODEL securely in Supabase. Do not place secrets in browser code or commit them. Test valid paraphrases, false conclusions, negation, missing qualifiers, and student instruction injection against the actual model before production claims.

## Personalization

A persisted learner seed and retry count select task variants. Recent confirmed performance in the target skill selects four difficulty levels; guided practice exposes the reference, while high performance asks for critique/comparison. A sixth task reviews a previously failed topic, with a three-session lag as fallback. Twelve additional bilingual fact patterns change decisive facts across six topics: live birth, domicile, age/capacity, entity domicile, common ownership/allocation, and harmful intent/unlawful interests. Other topics offer decision/critique/comparison variants around the original case. This is a finite bank, not unlimited personalized generation.

## Verification

Node suites verify the public rubric boundary, malformed/unavailable semantic responses, the real Edge Function handler with isolated database/auth/provider doubles, substantive-review gate behavior across all thirty bilingual sessions, pending review locks, and adaptation/retry/error-targeted review. Provider doubles do not establish live-model legal accuracy.
