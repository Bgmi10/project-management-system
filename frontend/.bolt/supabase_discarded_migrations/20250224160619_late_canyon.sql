/*
  # Add Admin User

  1. Changes
    - Creates admin user with email admin@taskgenie.com and password admin123
    - Sets admin flag in profile
    - Ensures idempotency with ON CONFLICT clauses

  2. Security
    - Password is properly hashed
    - Admin flag is set in profile
*/

-- Add is_admin column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Insert admin user if not exists
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'admin@taskgenie.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"System Admin"}',
  now(),
  now(),
  'authenticated',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create admin profile
INSERT INTO profiles (
  id,
  username,
  is_admin,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin',
  true,
  now()
) ON CONFLICT (id) DO UPDATE
SET is_admin = true;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON profiles(is_admin);

-- Update RLS policies to allow admin access
CREATE POLICY "Admins can access all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (is_admin = true)
  WITH CHECK (is_admin = true);