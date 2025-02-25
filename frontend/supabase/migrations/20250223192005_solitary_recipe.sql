/*
  # SEO Metrics Tables

  This migration creates tables for storing and tracking SEO performance metrics.

  1. New Tables
    - `page_metrics`
      - Basic page information and metrics
      - Performance scores
      - Traffic data
    - `keyword_rankings`
      - Keyword tracking
      - Position history
      - Search volume data
    - `location_metrics`
      - Geographic performance data
      - Regional rankings
    - `performance_history`
      - Historical tracking of key metrics
      - Daily snapshots

  2. Security
    - Enable RLS on all tables
    - Add policies for data access
*/

-- Create page_metrics table
CREATE TABLE IF NOT EXISTS page_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  page_id uuid REFERENCES saved_pages(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text NOT NULL,
  target_location jsonb NOT NULL,
  performance_score int CHECK (performance_score BETWEEN 0 AND 100),
  organic_traffic int DEFAULT 0,
  bounce_rate decimal CHECK (bounce_rate BETWEEN 0 AND 100),
  avg_time_on_page interval,
  internal_links int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create keyword_rankings table
CREATE TABLE IF NOT EXISTS keyword_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES page_metrics(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  position int,
  search_volume int,
  keyword_difficulty int CHECK (keyword_difficulty BETWEEN 0 AND 100),
  featured_snippet boolean DEFAULT false,
  last_updated timestamptz DEFAULT now()
);

-- Create location_metrics table
CREATE TABLE IF NOT EXISTS location_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES page_metrics(id) ON DELETE CASCADE,
  city text NOT NULL,
  state text NOT NULL,
  local_ranking int,
  local_traffic int DEFAULT 0,
  market_share decimal CHECK (market_share BETWEEN 0 AND 100),
  last_updated timestamptz DEFAULT now()
);

-- Create performance_history table
CREATE TABLE IF NOT EXISTS performance_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES page_metrics(id) ON DELETE CASCADE,
  date date NOT NULL,
  organic_traffic int DEFAULT 0,
  bounce_rate decimal CHECK (bounce_rate BETWEEN 0 AND 100),
  avg_position decimal,
  conversions int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE page_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_history ENABLE ROW LEVEL SECURITY;

-- Create policies for page_metrics
CREATE POLICY "Users can read own page metrics"
  ON page_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own page metrics"
  ON page_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own page metrics"
  ON page_metrics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for keyword_rankings
DO $$ 
BEGIN
  CREATE POLICY "Users can access own keyword rankings"
    ON keyword_rankings
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM page_metrics
      WHERE page_metrics.id = keyword_rankings.page_id
      AND page_metrics.user_id = auth.uid()
    ));
END $$;

-- Create policies for location_metrics
DO $$ 
BEGIN
  CREATE POLICY "Users can access own location metrics"
    ON location_metrics
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM page_metrics
      WHERE page_metrics.id = location_metrics.page_id
      AND page_metrics.user_id = auth.uid()
    ));
END $$;

-- Create policies for performance_history
DO $$ 
BEGIN
  CREATE POLICY "Users can access own performance history"
    ON performance_history
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM page_metrics
      WHERE page_metrics.id = performance_history.page_id
      AND page_metrics.user_id = auth.uid()
    ));
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS page_metrics_user_id_idx ON page_metrics(user_id);
CREATE INDEX IF NOT EXISTS page_metrics_url_idx ON page_metrics(url);
CREATE INDEX IF NOT EXISTS keyword_rankings_keyword_idx ON keyword_rankings(keyword);
CREATE INDEX IF NOT EXISTS location_metrics_location_idx ON location_metrics(city, state);
CREATE INDEX IF NOT EXISTS performance_history_date_idx ON performance_history(date);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for page_metrics
CREATE TRIGGER update_page_metrics_updated_at
  BEFORE UPDATE ON page_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();