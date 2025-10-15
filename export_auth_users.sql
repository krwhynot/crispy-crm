-- Export auth.users data in a format that can be imported
-- This query generates INSERT statements with all user data

SELECT
  'INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  COALESCE(quote_literal(instance_id::text) || '::uuid', 'NULL') || ', ' ||
  COALESCE(quote_literal(aud), 'NULL') || ', ' ||
  COALESCE(quote_literal(role), 'NULL') || ', ' ||
  COALESCE(quote_literal(email), 'NULL') || ', ' ||
  COALESCE(quote_literal(encrypted_password), 'NULL') || ', ' ||
  COALESCE(quote_literal(email_confirmed_at::text) || '::timestamptz', 'NULL') || ', ' ||
  COALESCE(quote_literal(invited_at::text) || '::timestamptz', 'NULL') || ', ' ||
  COALESCE(quote_literal(confirmation_token), 'NULL') || ', ' ||
  COALESCE(quote_literal(confirmation_sent_at::text) || '::timestamptz', 'NULL') || ', ' ||
  COALESCE(quote_literal(recovery_token), 'NULL') || ', ' ||
  COALESCE(quote_literal(recovery_sent_at::text) || '::timestamptz', 'NULL') || ', ' ||
  COALESCE(quote_literal(email_change_token_new), 'NULL') || ', ' ||
  COALESCE(quote_literal(email_change), 'NULL') || ', ' ||
  COALESCE(quote_literal(email_change_sent_at::text) || '::timestamptz', 'NULL') || ', ' ||
  COALESCE(quote_literal(last_sign_in_at::text) || '::timestamptz', 'NULL') || ', ' ||
  COALESCE(quote_literal(raw_app_meta_data::text) || '::jsonb', 'NULL') || ', ' ||
  COALESCE(quote_literal(raw_user_meta_data::text) || '::jsonb', 'NULL') || ', ' ||
  COALESCE(is_super_admin::text, 'false') || ', ' ||
  COALESCE(quote_literal(created_at::text) || '::timestamptz', 'NULL') || ', ' ||
  COALESCE(quote_literal(updated_at::text) || '::timestamptz', 'NULL') || ', ' ||
  COALESCE(quote_literal(phone), 'NULL') || ', ' ||
  COALESCE(quote_literal(phone_confirmed_at::text) || '::timestamptz', 'NULL') || ', ' ||
  COALESCE(quote_literal(phone_change), 'NULL') || ', ' ||
  COALESCE(quote_literal(phone_change_token), 'NULL') || ', ' ||
  COALESCE(quote_literal(phone_change_sent_at::text) || '::timestamptz', 'NULL') || ', ' ||
  COALESCE(quote_literal(email_change_token_current), 'NULL') || ', ' ||
  COALESCE(email_change_confirm_status::text, '0') || ', ' ||
  COALESCE(quote_literal(banned_until::text) || '::timestamptz', 'NULL') || ', ' ||
  COALESCE(quote_literal(reauthentication_token), 'NULL') || ', ' ||
  COALESCE(quote_literal(reauthentication_sent_at::text) || '::timestamptz', 'NULL') || ', ' ||
  COALESCE(is_sso_user::text, 'false') || ', ' ||
  COALESCE(quote_literal(deleted_at::text) || '::timestamptz', 'NULL') || ', ' ||
  COALESCE(is_anonymous::text, 'false') ||
  ') ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;' as insert_statement
FROM auth.users
WHERE deleted_at IS NULL;
