/*
  # Add SQL Editor Tables and Functions

  1. New Tables
    - `sql_queries`
      - Stores saved SQL queries with metadata
      - Includes query text, name, description, and execution stats
    - `sql_query_results`
      - Stores query execution history and results
      - Tracks execution time, row count, and error messages
    - `sql_query_favorites`
      - Manages user's favorite queries
      - Links users to their preferred queries

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Restrict access to own queries and results

  3. Functions
    - Add helper functions for query management
    - Add execution tracking functions
*/

-- Create sql_queries table
CREATE TABLE IF NOT EXISTS sql_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  description text,
  query_text text NOT NULL,
  is_public boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  last_executed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sql_query_results table
CREATE TABLE IF NOT EXISTS sql_query_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid REFERENCES sql_queries ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users NOT NULL,
  execution_time interval,
  row_count integer,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create sql_query_favorites table
CREATE TABLE IF NOT EXISTS sql_query_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  query_id uuid REFERENCES sql_queries ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, query_id)
);

-- Enable RLS
ALTER TABLE sql_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sql_query_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE sql_query_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own and public queries"
  ON sql_queries
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR is_public = true
  );

CREATE POLICY "Users can manage their own queries"
  ON sql_queries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own query results"
  ON sql_query_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own query results"
  ON sql_query_results
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their favorites"
  ON sql_query_favorites
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS sql_queries_user_id_idx ON sql_queries(user_id);
CREATE INDEX IF NOT EXISTS sql_queries_tags_idx ON sql_queries USING gin(tags);
CREATE INDEX IF NOT EXISTS sql_query_results_query_id_idx ON sql_query_results(query_id);
CREATE INDEX IF NOT EXISTS sql_query_results_user_id_idx ON sql_query_results(user_id);
CREATE INDEX IF NOT EXISTS sql_query_favorites_user_id_idx ON sql_query_favorites(user_id);
CREATE INDEX IF NOT EXISTS sql_query_favorites_query_id_idx ON sql_query_favorites(query_id);

-- Create updated_at trigger for sql_queries
CREATE TRIGGER update_sql_queries_updated_at
  BEFORE UPDATE ON sql_queries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get table columns
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'column_name', column_name,
        'data_type', data_type,
        'is_nullable', is_nullable = 'YES',
        'column_default', column_default,
        'is_primary_key', EXISTS (
          SELECT 1
          FROM information_schema.key_column_usage kcu
          JOIN information_schema.table_constraints tc
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = c.table_name
            AND kcu.column_name = c.column_name
            AND tc.constraint_type = 'PRIMARY KEY'
        )
      )
    )
    FROM information_schema.columns c
    WHERE table_schema = 'public'
    AND table_name = $1
    ORDER BY ordinal_position
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get table relationships
CREATE OR REPLACE FUNCTION get_table_relationships(table_name text)
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'constraint_name', tc.constraint_name,
        'column_name', kcu.column_name,
        'foreign_table_name', ccu.table_name,
        'foreign_column_name', ccu.column_name
      )
    )
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = $1
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get query execution plan
CREATE OR REPLACE FUNCTION get_query_plan(query_text text)
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(jsonb_build_object(
      'Plan', plan->'Plan',
      'Planning Time', plan->'Planning Time',
      'Execution Time', plan->'Execution Time'
    ))
    FROM EXPLAIN (FORMAT JSON) $1 AS plan
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Grant access to functions
GRANT EXECUTE ON FUNCTION get_table_columns TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_relationships TO authenticated;
GRANT EXECUTE ON FUNCTION get_query_plan TO authenticated;