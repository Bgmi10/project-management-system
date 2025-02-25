/*
  # Add random test user

  1. New Data
    - Adds a random test user with email 'random.user@example.com'
    - Creates corresponding profile entry
    
  2. Security
    - Uses secure password hashing
    - Maintains existing RLS policies
*/

-- Insert a random test user into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'random.user@example.com',
  crypt('randompass123', gen_salt('bf')),
  now(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  FALSE,
  now(),
  now(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL
) ON CONFLICT (email) DO NOTHING;

-- Insert corresponding profile
INSERT INTO profiles (
  id,
  username,
  updated_at
)
SELECT 
  id,
  'randomuser',
  now()
FROM auth.users
WHERE email = 'random.user@example.com'
ON CONFLICT DO NOTHING;