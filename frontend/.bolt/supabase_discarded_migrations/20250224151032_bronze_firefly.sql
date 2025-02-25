/*
  # Kanban Board Updates

  1. New Features
    - Add labels and filters to tasks
    - Add task analytics view
    - Add bulk position update function

  2. Changes
    - Add new indexes for performance
    - Update RLS policies
*/

-- Add new fields to tasks if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'filters'
  ) THEN
    ALTER TABLE tasks ADD COLUMN filters jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'labels'
  ) THEN
    ALTER TABLE tasks ADD COLUMN labels text[] DEFAULT '{}';
  END IF;
END $$;

-- Create function to calculate next position if it doesn't exist
CREATE OR REPLACE FUNCTION get_next_task_position(p_column_id text)
RETURNS integer AS $$
DECLARE
  max_pos integer;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1
  INTO max_pos
  FROM tasks
  WHERE column_id = p_column_id;
  
  RETURN max_pos;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle bulk task updates
CREATE OR REPLACE FUNCTION bulk_update_task_positions(
  p_updates jsonb
)
RETURNS void AS $$
BEGIN
  -- Update each task's position and column
  FOR i IN 0..jsonb_array_length(p_updates) - 1 LOOP
    UPDATE tasks
    SET 
      position = (p_updates->i->>'position')::integer,
      column_id = p_updates->i->>'column_id'
    WHERE id = (p_updates->i->>'id')::uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for improved query performance
CREATE INDEX IF NOT EXISTS tasks_labels_idx ON tasks USING gin(labels);
CREATE INDEX IF NOT EXISTS tasks_filters_idx ON tasks USING gin(filters);

-- Create view for task analytics
CREATE OR REPLACE VIEW task_analytics AS
SELECT
  project_id,
  column_id,
  COUNT(*) as task_count,
  COUNT(CASE WHEN priority = 'high' OR priority = 'urgent' THEN 1 END) as high_priority_count,
  COUNT(CASE WHEN due_date < CURRENT_DATE THEN 1 END) as overdue_count,
  AVG(CASE WHEN actual_hours IS NOT NULL THEN actual_hours::float END) as avg_completion_time
FROM tasks
GROUP BY project_id, column_id;

-- Grant access to the view
GRANT SELECT ON task_analytics TO authenticated;

-- Update task RLS policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' AND policyname = 'Users can update task positions in bulk'
  ) THEN
    CREATE POLICY "Users can update task positions in bulk"
      ON tasks
      FOR UPDATE
      USING (
        project_id IN (
          SELECT project_id 
          FROM project_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;