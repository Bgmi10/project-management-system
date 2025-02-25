/*
  # Create saved pages table

  1. New Tables
    - `saved_pages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `form_data` (jsonb)
      - `previews` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `saved_pages` table
    - Add policies for authenticated users to:
      - Read their own saved pages
      - Create new saved pages
      - Delete their own saved pages
*/

CREATE TABLE IF NOT EXISTS saved_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  form_data jsonb NOT NULL,
  previews jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_pages ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own saved pages
CREATE POLICY "Users can read own saved pages"
  ON saved_pages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to create saved pages
CREATE POLICY "Users can create saved pages"
  ON saved_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own saved pages
CREATE POLICY "Users can delete own saved pages"
  ON saved_pages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS saved_pages_user_id_idx ON saved_pages (user_id);