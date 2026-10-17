# LexLearn conference enquiries — activation checklist

Status: code and secured database are deployed. Secure form submissions remain intentionally disabled until production Turnstile credentials are configured. This is **not** a completed end-to-end delivery test.

## Intended user experience

- Secure opt-in form comes first on `conference.html` in Arabic and English.
- Role-specific university / investor CTAs open `#leadForm` with the matching role preselected.
- `Send contact request` is disabled when secure intake cannot be verified.
- WhatsApp and email stay available **below the form** as direct alternatives.
- Never claim that a visitor inquiry was saved until Supabase returns `{"ok":true}`.
- No finance figures or unverified investor testimonials in public copy.

## One-time Cloudflare Turnstile configuration

1. Go to the official Cloudflare dashboard > Turnstile > Add widget.
2. Name it `LexLearn Conference Contact`. Choose Managed mode.
3. **Allowed hostname:** `ahmadfoad361-sketch.github.io` (no protocol or path). The deployed route is `/lexlearn-ai-demo/conference.html`.
4. Copy the **sitekey** and **secret key**. Do not commit the secret, send it in chat, or include it in browser JS.
5. In the Supabase Dashboard, select LexLearn Production project `emxiuwcuxyljfynnzpnh`, open Edge Functions > Secrets. Add:
   - `TURNSTILE_SITE_KEY` = Cloudflare public sitekey
   - `TURNSTILE_SECRET_KEY` = Cloudflare private secret
   - `LEAD_HMAC_SECRET` = an independently generated, high-entropy server-side secret (recommended)
6. Save. The deployed `conference-lead` Edge Function reads the secrets at runtime. The conference page checks the protected function's public configuration before enabling the submit button.
7. The function always performs server-side Siteverify, checks the verified hostname, validates consent and data, enforces an atomic rate window, and applies a per-contact/per-role/day keyed deduplication rule.

Never use Cloudflare's test keys in production.

## Notification email setup

The function can send an immediate email **after** the inquiry is stored, if a verified sending service is configured. Set the following **only in Supabase Edge Functions > Secrets**:

- `RESEND_API_KEY` = restricted sending API key.
- `LEAD_NOTIFY_TO` = founder's approved destination mailbox.
- `LEAD_NOTIFY_FROM` = an address from a sender identity verified by the email provider.

The user elected to defer an official LexLearn mailbox/domain. Do **not** invent or use an unverified sender. Without these settings, inquiries can still be securely recorded once Turnstile is enabled, but notification status remains `pending`, and direct email alerts are **not active**. The interim ChatGPT hourly check is a separate notification mechanism, not an email provider and not instantaneous.

The table exposes `notification_status`, `notification_attempts`, `notification_retry_after` for later operator review and a retry worker. Do not claim automated retry is functional until a scheduler or retry invocation is actually configured and tested.

## Verification

1. Open `conference.html?lang=ar#contact` and EN counterpart.
2. Check the primary submit button enables only with a valid production Turnstile widget.
3. Submit one consented inquiry with test contact details and complete the widget. Wait for confirmed success.
4. Verify the row in `public.conference_leads`, including audience, consent, and notification state.
5. Retry the same exact inquiry: only one row should exist. Submit the same contact with another role: it is a distinct enquiry.
6. Test blank/invalid fields, unchecked consent, spam field, expired Turnstile token, rate limit and slow network.
7. Confirm `anon` and `authenticated` have **no** table read/write grants; RLS is on; only service-side credentials insert.
8. For notifications: verify actual mailbox delivery and record state, and test recovery from a provider failure before claiming success.
9. Check no affected student/demo auth or assessment functions, and both Actions workflows pass.
10. Check QR via actual phone and both mobile languages.

## Privacy and owner operations

- Privacy pages describe the personal-data fields, purposes, consent, security measures, proposed retention and the access/correction/deletion email.
- The consent retention date is a policy objective, not a guaranteed cleanup job until the approved deletion procedure is scheduled and verified.
- Only authorized operators should inspect `conference_leads` in the Supabase dashboard.
- Never log raw names, phone numbers or email addresses from received data.
