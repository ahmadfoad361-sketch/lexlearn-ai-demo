-- Stable system-issued project number; photos retain the existing private profile access scope.
alter table public.profiles add column lexlearn_number bigint generated always as identity;
alter table public.profiles add constraint profiles_lexlearn_number_unique unique (lexlearn_number);
alter table public.profiles add column avatar_data_url text;
alter table public.profiles add constraint profiles_avatar_jpeg_limit check (avatar_data_url is null or (length(avatar_data_url) <= 200000 and avatar_data_url ~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}$'));
