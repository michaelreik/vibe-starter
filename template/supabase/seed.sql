-- Local development admin user.
-- Created on every `npx supabase db reset`. Production projects are seeded
-- via the /setup skill, which calls Supabase Admin API with credentials you
-- choose interactively — this file is local only.
--
-- Credentials: admin@example.local / changeme

do $$
declare
  uid uuid := gen_random_uuid();
begin
  insert into auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    is_sso_user, is_anonymous,
    -- GoTrue's SQL scan rejects NULL on these — empty strings are required.
    confirmation_token, recovery_token,
    email_change, email_change_token_new, email_change_token_current,
    phone_change, phone_change_token,
    reauthentication_token
  ) values (
    uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'admin@example.local', crypt('changeme', gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    '{}'::jsonb,
    now(), now(),
    false, false,
    '', '',
    '', '', '',
    '', '',
    ''
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    uid::text, uid,
    jsonb_build_object('sub', uid::text, 'email', 'admin@example.local', 'email_verified', true),
    'email',
    now(), now(), now()
  );
end $$;
