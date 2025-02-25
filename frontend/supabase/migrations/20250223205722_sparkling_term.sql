/*
  # Add Page Generation Queue Table

  1. New Tables
    - `page_generation_queue`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `form_data` (jsonb)
      - `status` (text)
      - `error_message` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `page_generation_queue` table
    - Add policies for authenticated users
*/

-- Create page generation queue table
CREATE TABLE IF NOT EXISTS page_generation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  form_data jsonb NOT NULL,
  status text NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE page_generation_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own queue items"
  ON page_generation_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue items"
  ON page_generation_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue items"
  ON page_generation_queue
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS page_generation_queue_user_id_idx ON page_generation_queue(user_id);
CREATE INDEX IF NOT EXISTS page_generation_queue_status_idx ON page_generation_queue(status);

-- Add trigger for updated_at
CREATE TRIGGER update_page_generation_queue_updated_at
  BEFORE UPDATE ON page_generation_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();