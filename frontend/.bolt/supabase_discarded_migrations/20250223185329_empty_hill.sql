/*
  # Add test user

  1. Changes
    - Adds a new test user with email and password
    - Creates corresponding profile entry
    
  2. Security
    - Uses secure password hashing
    - Maintains existing RLS policies
*/

-- Insert a test user into auth.users
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert the user and get their ID
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'testuser@example.com',
    crypt('testpass123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    FALSE,
    now(),
    now()
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_user_id;

  -- If we got a new user ID, create their profile
  IF new_user_id IS NOT NULL THEN
    INSERT INTO profiles (id, username, updated_at)
    VALUES (new_user_id, 'testuser_' || substr(new_user_id::text, 1, 8), now())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;