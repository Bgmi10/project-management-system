/*
  # Enable email signup without confirmation

  This migration configures Supabase Auth to allow email signup without requiring email confirmation.
  This is useful for development and testing purposes.

  1. Changes
    - Disable email confirmation requirement for new signups
    - Set email_confirm_required to false in auth settings
*/

-- Create a function to disable email confirmation
CREATE OR REPLACE FUNCTION auth.disable_email_confirmation()
RETURNS void AS $$
BEGIN
  UPDATE auth.config
  SET value = jsonb_set(value, '{email_confirm_required}', 'false')
  WHERE name = 'auth';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to disable email confirmation
SELECT auth.disable_email_confirmation();

-- Drop the function as it's no longer needed
DROP FUNCTION auth.disable_email_confirmation();