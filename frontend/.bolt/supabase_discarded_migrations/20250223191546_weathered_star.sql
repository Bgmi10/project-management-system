/*
  # Configure authentication settings

  This migration sets up the initial authentication configuration for the application.

  1. Changes
    - Create a trigger to automatically confirm email addresses for new users
    - Set up default profile for new users
*/

-- Create a trigger to automatically confirm email addresses for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Set email_confirmed_at for new users
  NEW.email_confirmed_at = NOW();
  
  -- Create a profile entry
  INSERT INTO public.profiles (id, username, updated_at)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Confirm emails for existing users
UPDATE auth.users
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;