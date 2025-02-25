/*
  # Kanban Board Schema

  1. New Fields
    - Add `position` field to tasks table for ordering within columns
    - Add `column_id` field to track which column the task belongs to
    - Add `filters` field for storing task filters
    - Add `labels` field for task categorization

  2. Security
    - Update RLS policies to handle position updates
    - Add policies for filter management
*/

-- Add new fields to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS filters jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS labels text[] DEFAULT '{}';

-- Create function to calculate next position
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

-- Create function to reorder tasks after deletion
CREATE OR REPLACE FUNCTION reorder_tasks_after_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Reorder remaining tasks in the same column
  UPDATE tasks
  SET position = position - 1
  WHERE column_id = OLD.column_id
  AND position > OLD.position;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task deletion reordering
DROP TRIGGER IF EXISTS task_delete_reorder_trigger ON tasks;
CREATE TRIGGER task_delete_reorder_trigger
  AFTER DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION reorder_tasks_after_delete();

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

-- Update task RLS policies
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