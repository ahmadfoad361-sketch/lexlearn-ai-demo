# LexLearn — academic grading acceptance gates (30 October 2026)

The automatic grader remains **provisional**, not a certified university examiner.

## Completed engineering
- The authenticated training grader uses question-specific rubrics and approved sources, validates evidence, and performs a second model review.
- First-level answers may now use the same grader, but only after explicit consent. The saved database answer, not a client-submitted prompt or grade, is authoritative.
- Partial-criterion reasons appear in the first-level student UI. No AI failure is treated as zero.

## Outstanding independent validation
- Collect at least 200–300 *anonymous* answers independently graded by two university instructors.
- Use `node scripts/grade-benchmark.mjs /private/grades.json` to measure agreement; the provided thresholds are proposed, not certified.
- Have a third instructor adjudicate cases of substantial disagreement.
- Review legal source accuracy, appropriateness of partial credits, repeated-answer stability, and error severity.
- Run `scripts/k6-grade-staging.js` only against a separate staging Supabase project with 500 synthetic students and explicit cost permission. It is deliberately blocked against the current production project.
- Check p95/p99 latency, 429s, queue depth, provider spending, duplicate billing, persistent result integrity, and post-restart recovery.
- **Production has a 400-run/day safety cap**. Do not raise limits or label capacity for 500 concurrent paid assessments until the queue and budget controls are measured.

### Private calibration JSON schema
```json
{
  "cases": [
    {
      "id": "anonymous-answer-001",
      "human_scores": [70, 75],
      "ai_score": 72,
      "critical_error": false
    }
  ]
}
```

Do not commit student answers, identifying records, raw test JWTs, API keys, or the private server-side grading implementation to this public repository.
