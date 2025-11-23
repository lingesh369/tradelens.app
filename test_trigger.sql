-- Insert a test user into auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'authenticated',
    'authenticated',
    'testuser@example.com',
    '$2a$10$abcdefghijklmnopqrstuvwxyz', -- dummy password hash
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Test", "last_name": "User", "username": "testuser123"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Check if the trigger created the profile
SELECT * FROM app_users WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
SELECT * FROM trader_profiles WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
SELECT * FROM user_subscriptions WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
