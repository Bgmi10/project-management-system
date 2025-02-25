/*
  # Update Database Schema

  This migration updates the database schema with additional tables and security policies.
  It includes checks to prevent conflicts with existing objects.

  1. Tables
    - Ensures saved_pages table exists with proper structure
    - Adds necessary indexes and foreign key constraints

  2. Security
    - Enables RLS
    - Creates policies if they don't exist
    - Sets up user email confirmation handling
*/

-- Create saved_pages table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  form_data jsonb NOT NULL,
  previews jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE saved_pages ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
  -- Check and create select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_pages' 
    AND policyname = 'Users can read own saved pages'
  ) THEN
    CREATE POLICY "Users can read own saved pages"
      ON saved_pages
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Check and create insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_pages' 
    AND policyname = 'Users can create saved pages'
  ) THEN
    CREATE POLICY "Users can create saved pages"
      ON saved_pages
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check and create delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_pages' 
    AND policyname = 'Users can delete own saved pages'
  ) THEN
    CREATE POLICY "Users can delete own saved pages"
      ON saved_pages
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS saved_pages_user_id_idx ON saved_pages (user_id);

-- Create function to handle new user creation if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Set email_confirmed_at for new users
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Confirm emails for existing users
UPDATE auth.users
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;