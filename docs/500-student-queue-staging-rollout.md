# LexLearn | Safe rollout of 500-student grading queue

## Status
This PR prepares the **architecture**, not a production throughput certificate. It introduces
a DB feature flag set to **false**. No students or real grades are modified simply by merging.
Do not activate or perform live stress tests on LexLearn Production.

## Why a queue is required
A 500-student simultaneous session is **500 concurrent authenticated users**, not 500
simultaneous calls to a paid LLM. The written answer is saved by the existing
\`lex_training_submit\` and \`lex_diagnostic_complete\` RPCs before admission.
Admitted jobs are idempotent per immutable answer and can wait safely; the worker
atomically commits verified grades and audit records. Failed/unverified grades never
become fake 0%. The existing student UI polls its own job on a jittered interval.

## Install in an isolated Supabase staging project ONLY
1. Create a separate Supabase project with no copied real student PII, after approving
   the plan/cost. Provision **500 synthetic student accounts** with active enrollment,
   current consent, and one saved answer each; use staging-only dummy emails/passwords.
2. Run the proposed migration \`20261030_500_student_ai_queue_staging.sql\`
   through your usual reviewed migration workflow. The queue stays disabled.
3. Deploy \`lexlearn-ai-enqueue\` with JWT verification **enabled**, and
   \`lexlearn-ai-worker\` with JWT verification **disabled**. The worker independently
   validates a custom 32+ character \`LEX_AI_WORKER_SECRET\` before any privileged DB access.
   Deploy the two modified existing graders as well; GitHub Pages alone does NOT
   publish Edge Functions.
4. In staging, set \`OPENAI_GRADING_API_KEY\` with a strict provider spending ceiling.
   Configure \`LEX_AI_WORKER_SECRET\` only in Edge Function secrets and in Supabase
   Vault (do not check either secret into Git).
5. Schedule the worker with pg_cron + pg_net **only after** setting those secrets.
   Example, execute manually in **staging** after enabling the extensions:

   \`\`\`sql
   -- The two Vault entries must be created through a secure admin workflow:
   -- lex_ai_staging_project_url, lex_ai_staging_worker_secret
   select cron.schedule('lex-ai-queue-staging', '10 seconds', $job$
     select net.http_post(
       url := (select decrypted_secret from vault.decrypted_secrets
               where name='lex_ai_staging_project_url') ||
              '/functions/v1/lexlearn-ai-worker',
       headers := jsonb_build_object(
         'Content-Type','application/json',
         'x-lex-worker-secret',(select decrypted_secret from vault.decrypted_secrets
                                where name='lex_ai_staging_worker_secret')
       ),
       body := '{}'::jsonb, timeout_milliseconds := 15000
     );
   $job$);
   \`\`\`

   The Vault entries should contain the **staging URL** and the same dedicated
   secret as the worker. Do not use the service-role key in the HTTP request.

6. Explicitly activate **staging** only when the provider budget and quota are approved:

   \`\`\`sql
   update public.lex_ai_queue_settings set enabled=true,
      max_active=4, max_pending=3000, max_daily_starts=1200,
      max_attempts=3,updated_at=now() where id=true;
   \`\`\`

   Start with 4 global active AI grading jobs, then adjust only after measuring
   provider requests/minute, tokens/minute, queue-drain times and error rates.
   4 is not a promise of quick results for 500 simultaneous submissions.

7. Run the isolated PostgreSQL CI tests and staging integration checks. To run the
   authenticated k6 test, supply 500 staging-only credentials in a local JSON file
   with entries \`{"email":"...","password":"...","session":1,"item_id":"rights-v1-s1-recall"}\`.
   The load script refuses the known production host and GitHub Pages.
   \`\`\`bash
   k6 run --env STAGING_URL="https://STAGING_REF.supabase.co" \
     --env STAGING_ANON_KEY="STAGING_PUBLISHABLE_KEY" \
     --env TEST_USERS_FILE="./staging-users.json" \
     --env MODE="read" scripts/load/500-students.k6.js

   # Next, with 500 pre-saved practice answers in staging:
   k6 run --env STAGING_URL="https://STAGING_REF.supabase.co" \
     --env STAGING_ANON_KEY="STAGING_PUBLISHABLE_KEY" \
     --env TEST_USERS_FILE="./staging-users.json" \
     --env MODE="admission" scripts/load/500-students.k6.js
   \`\`\`

   A load test authenticating and opening records is **not** sufficient to certify the
   paid AI worker; separately execute queued jobs with a controlled budget in staging.

## Release gate
PASS requires: (a) 500 accounts can authenticate with no cross-user access;
(b) all 500 submissions are durably recorded; (c) duplicates do not double bill;
(d) all queued records reach completed or an explicit review-required state;
(e) manual retries and crashes cannot overwrite later work; (f) complete archive
matches every student's original answers; (g) tested backpressure, UI progress,
provider budget/quotas and rollback. Record p50/p95/p99 latency and queue wait.
Do **not** equate 500 accepted jobs with 500 completed AI grades.

## Operational SQL
\`\`\`sql
select state,count(*) as jobs from public.lex_ai_queue_jobs group by state;
select count(*) as attempts_last_24h from public.lex_ai_queue_attempts
 where started_at>now()-interval '24 hours';
select max(now()-created_at) as oldest_pending_age
 from public.lex_ai_queue_jobs where state='queued';
\`\`\`

**Emergency halt** (stops admissions and new claims without deleting saved answers):
\`\`\`sql
update public.lex_ai_queue_settings set enabled=false where id=true;
\`\`\`
If necessary, deactivate the staging Cron job. Existing running jobs can finish,
and unprocessed work remains in the DB. Review \`review_required\` records; never
silently convert them into zero scores.

## Constraints still requiring verification
- Provider/account TPM/RPM quotas, actual LLM latency, total spend, and Edge Function
  memory/time limits are not measured by the synthetic SQL test.
- All rubric/legal source checks and academic approvals must remain valid.
- Existing student documents and student reports must be tested after any
  deployment. The instructor sees only authorized summary metrics.
- This release initially supports the approved Qatar course ID only. Egyptian
  universities need their own course mappings, legal references and rubric approvals.
- Use backup/restore drills and retention/export policy before an institutional pilot.

Provider/BG docs:
https://supabase.com/docs/guides/functions/schedule-functions
https://supabase.com/docs/guides/cron/quickstart
https://supabase.com/docs/guides/functions/limits
