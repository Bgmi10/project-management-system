/*
  # Task Order Schema

  1. New Fields
    - Add `position` field to tasks table for ordering within columns
    - Add `column_id` field to track which column the task belongs to

  2. Security
    - Update RLS policies to handle position updates
*/

-- Add new fields to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS position integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS column_id text DEFAULT 'todo'
  CHECK (column_id IN ('todo', 'in_progress', 'review', 'done'));

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS tasks_position_idx ON tasks(position);
CREATE INDEX IF NOT EXISTS tasks_column_id_idx ON tasks(column_id);

-- Function to handle task reordering
CREATE OR REPLACE FUNCTION reorder_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Update positions of tasks in the same column
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.column_id != NEW.column_id) THEN
    UPDATE tasks
    SET position = position + 1
    WHERE column_id = NEW.column_id
    AND position >= NEW.position
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task reordering
DROP TRIGGER IF EXISTS task_reorder_trigger ON tasks;
CREATE TRIGGER task_reorder_trigger
  BEFORE INSERT OR UPDATE OF position, column_id
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION reorder_tasks();

-- Update RLS policies to allow position updates
CREATE POLICY "Users can update task positions"
  ON tasks
  FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );