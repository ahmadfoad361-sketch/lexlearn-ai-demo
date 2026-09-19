# LexLearn AI v6 — Locked Student Experience Blueprint

## Product promise
Same destination for every learner; the route changes with evidence.

LexLearn should develop:
1. Legal map / conceptual structure
2. Recall
3. Understanding
4. Legal precision / distinction
5. Issue spotting
6. Transfer and application
7. Legal argument / exam construction
8. Delayed retention and calibrated confidence

## Student journey — locked
Login -> assigned course -> grouped diagnostic -> result evidence -> 3 personal growth goals -> short daily session -> varied practice -> spaced review -> transfer/exam challenge -> re-measure -> plan update.

### Diagnostic
- Five explicit levels: Easy -> Medium -> Difficult -> Transfer -> Exam
- Questions grouped to reduce fatigue
- One confidence rating per group
- MCQ early, short writing at exam stage
- Unmeasured dimensions never display 0%

### Personalized growth
After diagnosis, show only three priorities:
- what to improve
- why it was selected
- next training action

Do not assign a permanent “learning style” personality label.

### Daily session
Target 5–8 minutes:
- Understand
- Distinguish
- Apply
- Stabilize/retrieve

Use one micro-lesson, one worked example, one short challenge, and optional extension.

### Error memory
Store error type, not only right/wrong:
- missing knowledge
- incomplete understanding
- legal-precision confusion
- transfer/application gap
- exam-structure gap
- high-confidence misconception

Future remediation should change the form of the task instead of simply repeating the same question.

### Strong learners
Skip repetitive easy work and move toward:
- boundary cases
- changed facts
- misleading facts
- competing analyses
- critique of an answer
- complex exam construction

### Mastery ladder
Know -> distinguish -> explain -> spot in facts -> apply -> write exam answer.

### Visual / motion language
- Maroon + navy + warm gold + off-white
- Realistic/illustrative legal-learning imagery
- Emojis as lightweight cues, not decoration everywhere
- Short transition scenes between milestones
- Gavel/stamp/file motion only at meaningful moments
- Respect prefers-reduced-motion
- No noisy autoplay sound
- Motion must support learning, never compete with it

## Admin experience — locked
Admin can:
- create student account
- assign one or more courses
- reset password
- view student list and attention flags
- drill down: student -> course -> dimension -> group -> question/answer/confidence/score
- view reviews and activities
- export student data
- later filter by date/course/error type

Student can see only own experience and assigned courses.

## Prototype vs production
### Implemented in v6 static prototype
- local admin setup
- local student accounts
- separate per-student state keys
- admin analytics drill-down
- data export
- personalized goals
- error memory
- micro-learning
- mastery ladder
- animated group transition
- visual learning scenes
- grouped diagnostic and concept-rubric written scoring

### Mandatory before real student pilot
- secure backend authentication
- server-side role/row permissions
- cloud database
- password hashing handled by auth provider
- audit/admin logs
- data minimization, retention and deletion rules
- privacy notice / consent workflow
- true spaced-review scheduler
- reviewed question/content bank
- secure grounded semantic AI grading
- content versioning/effective dates
- pilot analytics and instrumentation
- accessibility and mobile QA
- backup/export/admin recovery process

Do not call the local prototype “secure multi-user authentication.” It demonstrates the workflow only.


## v6.4 focused-path refinement
Student-facing language is formal Modern Standard Arabic. Colloquial wording is not permitted in production UI.

The active training plan now follows a single-focus rule:
1. Select the weakest active skill dimension supported by evidence.
2. Show only the lesson and challenges relevant to that dimension.
3. Hide unrelated challenges while that path is active.
4. Progress through: guided learning -> targeted practice -> path assessment.
5. A path closes when the learner passes its assessment at the current prototype threshold.
6. Once closed, it disappears from active training and the next demonstrated weakness becomes the active path.
7. Completed paths remain visible only in progress/history, not as active tasks.
8. If no active weakness remains, show an all-clear state and only necessary delayed reviews.

The student navigation should remain intentionally small: training plan, progress, courses. Separate challenge/review libraries should not compete with the active plan.
