# LexLearn AI — Production Auth & Student Analytics Architecture

## Goal
The live v6 prototype demonstrates the full product flow locally:
- Admin account
- Admin-created student usernames/passwords
- Per-student dashboard
- Student-only view of that student's learning state
- Admin drill-down to course, diagnostic groups, questions, answers, confidence, scores, reviews, activities
- Student data export
- Personalized learning goals, error memory, micro-learning, spaced-review queue, progress ladder

The prototype uses browser localStorage only. It is NOT sufficient for a real pilot with students.

## Production security boundary
Before real student use, move identity and learning records to a server-side backend. Never store plaintext passwords or authorization rules in the browser.

### Roles
- OWNER / ADMIN: create and deactivate student accounts, assign courses, reset passwords, view/export all learner evidence.
- STUDENT: read/write only own profile, attempts, reviews, activities and assigned courses.
- CONTENT_REVIEWER (future): content workflow only; no student personal data unless explicitly authorized.

## Recommended core tables
### users
- id
- role
- username
- display_name
- status
- created_at
- last_login_at

### enrollments
- user_id
- course_id
- status
- assigned_at

### attempts
- id
- user_id
- course_id
- item_id
- answer
- score
- confidence
- hint_count
- latency_ms
- created_at

### mastery_evidence
- user_id
- course_id
- dimension
- evidence_value
- source_attempt_id
- created_at

### learning_plans
- user_id
- course_id
- route
- goals_json
- updated_at

### reviews
- user_id
- item_id
- due_at
- interval_data
- status

### activity_events
- user_id
- course_id
- activity_type
- result_json
- created_at

### content_items
- item_id
- course_id
- level
- dimension
- version
- review_status
- source_ids

## Authorization rules
- Student queries must always be filtered server-side by authenticated user_id.
- Student cannot supply an arbitrary user_id to read another learner.
- Admin authorization must be verified server-side, never from a hidden button or browser flag.
- Course access comes from enrollments.
- Password reset invalidates prior sessions when appropriate.
- Audit sensitive admin actions.

## Analytics
Admin dashboard should support:
- Overview: active students, completion, average measured mastery, attention flags.
- Drill-down: student -> course -> dimension -> group -> item/attempt.
- Error-type trends: knowledge gap, misconception, legal-precision confusion, transfer/application gap, exam-structure gap.
- Confidence mismatch: high-confidence wrong answers.
- Return/retention: due reviews completed and delayed performance.
- Exports with time range and course filters.

## Privacy / data minimization
- Collect only data required for learning adaptation.
- Avoid permanent psychological/personality labels.
- Keep learner profile topic-specific and evidence-based.
- Separate academic feedback from official university grades.
- Define retention/deletion policy before pilot.
- Log consent/notice version shown to student.

## Product rules already locked
- Grouped diagnostic, one confidence rating per group.
- Easy -> Medium -> Difficult -> Transfer -> Exam.
- Three current learning goals, not an overwhelming task list.
- Micro-learning sessions roughly 5-8 minutes.
- Error memory drives remediation.
- Strong learners skip repetitive easy work and receive harder transfer/exam tasks.
- Delayed retention remains unmeasured until a later review.
- Motion and visuals support transitions but must not distract; respect prefers-reduced-motion.
- Semantic AI grading must be grounded in approved course/source material and return Training Feedback, not an official grade.
