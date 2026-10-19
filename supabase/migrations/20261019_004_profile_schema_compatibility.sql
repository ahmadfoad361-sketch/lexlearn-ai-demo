-- Production-schema parity for freshly built LOCAL staging environments.
-- Production already contains these columns (checked read-only 2026-10-19).
-- No student records or permissions are modified.
begin;
alter table public.profiles
 add column if not exists account_status text not null default 'active',
 add column if not exists whatsapp_e164 text,
 add column if not exists whatsapp_verified_at timestamptz,
 add column if not exists contact_email text;
commit;
