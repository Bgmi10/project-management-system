/*
  # Add random test user

  1. New Data
    - Adds a test user to the auth.users table
    - Creates corresponding profile in profiles table
    
  2. Security
    - Uses secure password hashing
    - Maintains existing RLS policies
*/

-- Insert a test user into auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT DO NOTHING;

-- Insert corresponding profile
INSERT INTO profiles (
  id,
  username,
  updated_at
)
SELECT 
  id,
  'testuser',
  now()
FROM auth.users
WHERE email = 'test@example.com'
ON CONFLICT DO NOTHING;