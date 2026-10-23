# Personal assessment for the operational pilot

The signed-in `student-path.html` route now requests semantic assessment of each saved training answer from `lexlearn-training-ai-grade`. The existing diagnostic already displays separate understanding and recall estimates; its scoring and one-use AI policy are preserved.

The training service authenticates an active enrolled student, verifies the AI acceptance saved with their registration and reads the immutable saved answer, approved question, rubric and legal sources itself. It accepts no caller-supplied answer, student identity, rubric or score. OpenAI receives the question, rubric, sources and answer, without student profile/contact fields. It uses the existing server-only `OPENAI_GRADING_API_KEY` and `gpt-5.4-mini`, matching the diagnostic service.

The server computes the percentage from rubric weights and exact quoted evidence. Ambiguous or failed assessment yields no percentage. An atomic compare-and-swap reservation prevents duplicate charges for one saved answer. Requests are limited to 40 grading runs per learner per hour and 400 training runs across the pilot in 24 hours (these count checks are operational limits, not transactional billing caps). Interrupted reserved attempts remain pending for supervisor investigation and are not automatically charged again.

The skill summary uses the latest three semantic training results per dimension, with the saved diagnostic as the initial baseline. Lexical/internal scores never enter these estimates. The learner sees two preliminary skill estimates and tailored guidance; the remaining authorized tasks prioritize the weaker skill after each assessment. Existing task identities, progression requirements and content releases stay server controlled. These practice estimates are not validated mastery measures or university grades.

Staff signup now collects the same faculty, department/class section, optional university registration number and optional cohort email as self-signup, validates and saves them to the existing profile columns, and rolls back the new auth account if enrollment or profile persistence fails. All residences enter the same Qatar-law pilot, consistent with self-signup. A staff-assisted signup requires an explicit attestation that the student accepted the complete registration terms. Both learning-data and AI acceptance are recorded at registration. The training page never prompts again.

Validation: `node tests/training-ai.test.mjs`, `node tests/training-ai-client.test.js`, `node tests/admin-pilot-registration.test.mjs` (Node 24 for TypeScript stripping), existing diagnostic, full-path, consent, signup and publication suites, and public artifact build. Mocked provider cases cover evidence rejection, partial answers, duplicate/concurrent submissions, failure without fabricated scores, bilingual display, consent, changed priorities and staff profile persistence/rollback. Live paid model quality and an authenticated pilot on the published version still require operational verification; local mocks are not evidence of teaching impact.



Update: registration now has one unchecked, required acceptance covering privacy, learning-data processing and the disclosed OpenAI assessment purpose (`2026-10-23-v6`). The server requires that terms version before recording the two technical consent records. Existing historical records are not retroactively changed or reinterpreted as AI acceptance.

