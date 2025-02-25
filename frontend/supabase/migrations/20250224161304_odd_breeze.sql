/*
  # Add Table Editor Functionality

  1. New Tables
    - table_editor_settings: Store user preferences for table views
    - table_editor_filters: Store saved filters
    - table_editor_views: Store custom views
  
  2. Security
    - Enable RLS on all tables
    - Add policies for user access
*/

-- Create table_editor_settings table
CREATE TABLE IF NOT EXISTS table_editor_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  table_name text NOT NULL,
  column_order jsonb DEFAULT '[]',
  hidden_columns text[] DEFAULT '{}',
  sort_settings jsonb DEFAULT '{}',
  page_size integer DEFAULT 25,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, table_name)
);

-- Create table_editor_filters table
CREATE TABLE IF NOT EXISTS table_editor_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  table_name text NOT NULL,
  name text NOT NULL,
  filter_config jsonb NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create table_editor_views table
CREATE TABLE IF NOT EXISTS table_editor_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  table_name text NOT NULL,
  name text NOT NULL,
  view_config jsonb NOT NULL,
  is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE table_editor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_editor_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_editor_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own table settings"
  ON table_editor_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own filters"
  ON table_editor_filters
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own views"
  ON table_editor_views
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR is_shared = true)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS table_editor_settings_user_table_idx 
  ON table_editor_settings(user_id, table_name);

CREATE INDEX IF NOT EXISTS table_editor_filters_user_table_idx 
  ON table_editor_filters(user_id, table_name);

CREATE INDEX IF NOT EXISTS table_editor_views_user_table_idx 
  ON table_editor_views(user_id, table_name);

-- Create updated_at triggers
CREATE TRIGGER update_table_editor_settings_updated_at
  BEFORE UPDATE ON table_editor_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_editor_filters_updated_at
  BEFORE UPDATE ON table_editor_filters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_editor_views_updated_at
  BEFORE UPDATE ON table_editor_views
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle default filter management
CREATE OR REPLACE FUNCTION manage_default_filters()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    -- Set is_default to false for other filters for the same table
    UPDATE table_editor_filters
    SET is_default = false
    WHERE user_id = NEW.user_id
    AND table_name = NEW.table_name
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default filter management
CREATE TRIGGER manage_default_filters_trigger
  BEFORE INSERT OR UPDATE OF is_default ON table_editor_filters
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION manage_default_filters();

-- Create function to get table schema
CREATE OR REPLACE FUNCTION get_table_schema(table_name text)
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'column_name', column_name,
        'data_type', data_type,
        'is_nullable', is_nullable,
        'column_default', column_default,
        'is_identity', is_identity,
        'is_updatable', is_updatable
      )
    )
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1
  );
END;
$$ LANGUAGE plpgsql;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_table_schema TO authenticated;