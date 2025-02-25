/*
  # Add page generation analytics

  1. New Tables
    - `page_generation_analytics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `pages_count` (int)
      - `keyword` (text)
      - `location` (jsonb)
      - `status` (text)
      - `generation_time` (interval)
      - `created_at` (timestamptz)
    
  2. Security
    - Enable RLS on new table
    - Add policies for authenticated users
*/

-- Create page generation analytics table
CREATE TABLE IF NOT EXISTS page_generation_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  pages_count int NOT NULL,
  keyword text NOT NULL,
  location jsonb NOT NULL,
  status text NOT NULL,
  generation_time interval NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE page_generation_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own analytics"
  ON page_generation_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON page_generation_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS page_generation_analytics_user_id_idx ON page_generation_analytics(user_id);
CREATE INDEX IF NOT EXISTS page_generation_analytics_created_at_idx ON page_generation_analytics(created_at);
CREATE INDEX IF NOT EXISTS page_generation_analytics_keyword_idx ON page_generation_analytics(keyword);