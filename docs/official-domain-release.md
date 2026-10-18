# LexLearn official domain — release checklist

This is a deployment runbook, not evidence that the domain has been purchased or that the live AI pilot has been validated.

## Preserve existing service

- Current source: `main` on GitHub, deployed by `.github/workflows/pages.yml`.
- Default preview origin: `https://ahmadfoad361-sketch.github.io`; current project path: `/lexlearn-ai-demo/`.
- Supabase project: `emxiuwcuxyljfynnzpnh`. Do not put OpenAI secrets, service-role keys, Turnstile secrets or other private keys in the web repository.
- The `/go` route is the durable QR destination. Keep it independent of a demo pathname or a temporary conference page.

## 1. Purchase, verify and configure

1. Confirm ownership, availability, initial price, renewal price and selected exact domain. Obtain the owner's approval before purchase.
2. Add a custom domain in **GitHub → Settings → Pages** for this repository.
3. Use the DNS records GitHub currently specifies for apex and/or `www`. If using the apex with GitHub Pages A records, the current GitHub documentation specifies:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   For `www` use `CNAME → ahmadfoad361-sketch.github.io` (no repository path). Avoid wildcard records. Verify the actual setup against the current GitHub docs and Cloudflare behavior.
4. Enforce HTTPS in GitHub Pages after GitHub validates DNS and provisions the certificate. Verify the desired apex/`www` redirect and keep the original Pages address functioning for old links as appropriate.
5. This repository deploys with GitHub Actions, so a `CNAME` file in the artifact is **not** required by GitHub Pages.

## 2. Adapt backend site restrictions

1. **Both** `showcase-grade` and `conference-lead` must be deployed from the matching reviewed source commit after verification.
2. Set Supabase Edge Function secret `LEX_ALLOWED_ORIGINS` to approved HTTPS origins, e.g. `https://example.com,https://www.example.com`. Do not include a path, a trailing slash, HTTP, or a wildcard.
3. Keep JWT validation for `showcase-grade`; do not turn it into an unrestricted anonymous endpoint to bypass a login error.
4. In Cloudflare Turnstile's widget settings add the real domain hostnames that will serve the contact form. Its server-side `siteverify` result must match the approved request origin's hostname.
5. Update Supabase Auth's Site URL and Redirect URLs for password resets and other flows, and test them from both languages.
6. Keep `TURNSTILE_SECRET_KEY` and `OPENAI_API_KEY` server-side only. ChatGPT subscription access does not substitute for OpenAI API billing.
7. Verify production notifications and permitted staff access to contact messages, without exposing student or lead records in frontend code.

## 3. Required independent smoke tests

- Arabic and English landing, conference, demo, student login, admin login, privacy and terms.
- Responsive mobile and desktop views; live assets load from the root custom domain (no fixed `/lexlearn-ai-demo/` assumptions).
- `/go` works after the move; existing printed QR can be redirected via the permanent entrypoint.
- CORS preflight from approved custom domain succeeds, and a request from an unapproved domain fails. An accepted origin **still requires** valid authentication for grading.
- Turnstile accepts the approved hostname and rejects invalid tokens. Rate limits still apply.
- Real, authorized student submission returns a persistence receipt. Read the same attempt from a staff session; verify supervisor review, source references and saved decision. Never treat mock passing as actual AI validation.
- Test that provider failure and unverifiable legal content remain ungraded or pending review, never a fabricated zero.
- Run the GitHub PR test job; review the diff before merging. Do not deploy the academic pilot until legally and educationally approved.

## Release boundaries

**Official informational site:** May go live after frontend, contact and security tests pass.

**University pilot:** Must remain separately gated until article review, funded/model-configured semantic grading, real student/staff end-to-end tests, privacy approval and documented academic review.

References: [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [Supabase Edge Function CORS](https://supabase.com/docs/guides/functions/cors).
