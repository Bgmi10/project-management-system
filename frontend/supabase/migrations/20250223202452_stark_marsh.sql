/*
  # Add WordPress Integration Fields

  1. Changes
    - Add wordpress_config to profiles table
    - Add wordpress_status and wordpress_url to saved_pages table
    - Add updated_at column to saved_pages table
    - Add trigger to update updated_at column

  2. Security
    - Maintain existing RLS policies
    - Ensure wordpress_config is only accessible by the user
*/

-- Add wordpress_config to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS wordpress_config jsonb;

-- Add wordpress fields to saved_pages
ALTER TABLE saved_pages
ADD COLUMN IF NOT EXISTS wordpress_status text,
ADD COLUMN IF NOT EXISTS wordpress_url text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to saved_pages
DROP TRIGGER IF EXISTS update_saved_pages_updated_at ON saved_pages;
CREATE TRIGGER update_saved_pages_updated_at
  BEFORE UPDATE ON saved_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update existing RLS policies
CREATE POLICY "Users can update wordpress status"
  ON saved_pages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);