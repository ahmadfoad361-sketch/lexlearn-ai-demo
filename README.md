# LexLearn public interface

This repository contains the public website and browser assets for LexLearn. Production authentication, student data, official assessment and training progression are enforced by the existing server APIs.

Backend implementation, database migrations, internal research, development fixtures and confidential integration tests are maintained separately in a private repository.

Build and check the public release:

```sh
node scripts/build-public.js
node scripts/security-public-boundary.cjs
node scripts/verify-public-links.cjs
```

The source boundary accepts only published website files and explicitly listed release infrastructure. Do not commit server source, database exports, credentials or internal validation material here.

The public demo runs in the browser, so its visible code and materials remain public. Removing internal files from the current branch does not retract previously published Git history or third-party copies.

## Observability (optional, browser-safe)

The Pages build supports optional **PostHog** anonymous event counts and **Sentry**
generic error signals. It is off by default; the runtime does not send to either
provider when corresponding configuration variables are empty.

Configure **GitHub → Settings → Secrets and variables → Actions → Variables**
(not Secrets, because browser DSNs/project tokens are public browser configuration):

- \`LEX_OBSERVABILITY_ENABLED\`: set to \`1\` only **after** staging tests and privacy review. Leave empty for a fully inert production build.
- \`LEX_POSTHOG_PROJECT_KEY\`: the **PostHog project token** (\`phc_...\`) from the
  approved PostHog project. Ingestion uses \`https://eu.i.posthog.com\`.
- \`LEX_SENTRY_DSN\`: the **public Sentry DSN** from the selected browser project.

**Never** enter a PostHog personal API key, OpenAI API key, Supabase service-role
key, Redis password, or any other backend secret in these variables. If a secret
key is supplied by mistake, rotate it immediately. For an official rollout,
verify correct privacy notice/consent and test with synthetic data first.

The code only allows a fixed page category and explicitly named lifecycle events;
it does not inspect answer text or form fields, collect emails, or use URL query
parameters. Browser Do Not Track/Global Privacy Control disables PostHog. Session
Replay and PostHog autocapture are **not** used. Sentry is configured without
automatic integrations and emits only sanitized error categories.

To explicitly record a **server-confirmed** learning action after a successful
database response, the relevant UI code may call
\`window.LEX_OBSERVABILITY?.track("diagnostic_completed")\`. Do not fire completion
events on attempted submissions or speculative grading. This change currently
captures only allowable page openings automatically, **not** real grading outcomes.

Review the pull request's CI, deploy to an isolated test site, and verify the
resulting payloads before switching production ingestion on.
