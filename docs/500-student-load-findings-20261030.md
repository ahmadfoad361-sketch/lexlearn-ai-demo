# LexLearn — 500-student capacity evidence (30 October 2026)

## Actual isolated database benchmark
- 500 SQL admission requests via 25 concurrent PostgreSQL 17 clients: **0 errors**.
- Total wall time: **5.27 seconds**; per-operation p95 **374 ms**.
- Isolated queue acceptance tests validate: duplicate prevention, lease limits, audit persistence, tenant isolation, protected lease token.
- This was **not** 500 simultaneous authenticated Supabase web sessions and did **not** call paid LLMs.

## Production historical latency (small sample)
- Diagnostic AI v3: n=3, average **23.826 seconds**, p50 25.059 seconds.
- Training AI v4: n=21, average **44.742 seconds**, p50 46.524 seconds, p95 64.476 seconds.
- The service uses a first-pass analysis followed by independent verification.

## Illustrative 500-answer completion estimates
These are algebraic estimates based on historical averages, not guaranteed SLAs. Exclude queue scheduler overhead, provider throttles, retries and host latency.

| AI jobs concurrently | 500 diagnosis answers | 500 training answers | 1500 training answers (3 each) |
|---:|---:|---:|---:|
| 4 | about 50 minutes | about 93 minutes | about 280 minutes |
| 8 | about 25 minutes | about 47 minutes | about 140 minutes |
| 16 | about 12.5 minutes | about 23 minutes | about 70 minutes |
| 32 | about 6.3 minutes | about 12 minutes | about 35 minutes |

- Default global job concurrency **4**, queue disabled until staged activation.
- Current 24-hour provider **attempt** budget default 1200. 1500 distinct tasks cannot all be served within that limit in one day.
- Each grading may use at least two billable provider API calls. Provider RPM/TPM and spend limits must be verified before increasing concurrency.

## Release gate
Safe staging only until 500 authentic staging sign-ins, 500 real saved-answer flows, 500 queued jobs, bounded full job drain, exports and zero data crossovers are verified.
No changes to LexLearn Production are warranted on an unverified staging result.
Production deployment will require linking the frontend changes with deployment of Edge Functions and DB migrations, followed by staged rollout and rollback verification.

## Supabase cost verification
One connected Free-plan organization was found with 1 current project. New separate project quote was USD 0 per month; branching quote was USD 0.01344 per hour. Account-specific organization selection must be confirmed before provisioning.
