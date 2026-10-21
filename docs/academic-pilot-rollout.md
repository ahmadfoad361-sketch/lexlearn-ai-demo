# LexLearn university research registration and complete learner reports

## Scope
- The existing conference registration route remains unchanged at `student-register.html`.
- The opt-in **academic research track** is `student-register.html?mode=academic` (English: `student-register-en.html?mode=academic`).
- Academic applicants provide university, faculty, year, institutional email, optional student number, and explicit research participation consent.
- Institutional emails are **not email-OTP verified**. Academic accounts stay pending until authorized staff perform off-platform affiliation verification and attest to it. Never claim institutional verification from email entry alone.
- Institution policies can require a student number and limit the email domain. Configure only on the basis of an agreed faculty requirement. Otherwise student number is optional.
- Do **not** request national ID or photos of ID cards.
- Admin PDF reports now include official diagnostic runs, training sessions and every saved training answer, consent and applicable staff audit actions in addition to the legacy learner records.
- The **source records are persisted in Supabase**, and the PDF can be regenerated/downloaded via browser **Print / Save PDF**. The current change does **not** store a separate permanent PDF object in Storage or implement immutable research snapshots.

## Deployment dependencies and safe order
1. Back up schema and verify existing student records. Review and apply `supabase/sql/academic_pilot_registration.sql` using an appropriate official migration workflow.
2. Confirm `academic_registration_policies` exists and is inaccessible to `anon`/`authenticated`; configure faculty-specific requirements if agreed.
3. Deploy `student-register-whatsapp`, `admin-manage-student`, `admin-export-student` Edge Functions with their existing JWT/security settings (the registration function remains public; the admin functions use `requireStaff`).
4. Deploy frontend assets/HTML together (never deploy the updated `cloud-data.js` before the profile columns exist).
5. Perform test admissions: conference registration unaffected; academic form stays pending; missing university email and consent are rejected; faculty-required student number and domain policy enforced server-side; supervisor may not activate academic account without manual affiliation attestation; access limited to correct student/cohort.
6. Verify PDF export for a fresh student with official diagnostic, at least one session, answers, grading, consent and audit; also verify empty histories, browser print and no unintentional data exposure.
7. Verify 6-week/30-session actual access separately; this change does not alter academic content approval or per-session gate logic.

## Research integrity notes
- `accepted_research` is separate from accepting the app's privacy/terms notice, but the full research notice and institutional ethics approval, if required, must still be finalized before recruitment.
- The report is a read-only reproduction of existing data, not a substitute for an immutable audit log or anonymised research export.
- Supervisor resets/skips for the official 30-session lifecycle are NOT included and require their own server-authorized event-sourcing feature.
- Egypt-specific curricula need their own approved content and enrolment settings; this form does not imply the Qatar law course is valid for every jurisdiction.
