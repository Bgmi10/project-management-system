/*
  # Project Tables Migration

  1. New Tables
    - Add project_id to tasks table
    - Add position and column_id fields to tasks
    - Add task reordering functionality

  2. Security
    - Update RLS policies for task management
    - Add policies for task position updates

  3. Changes
    - Add task position management
    - Add column tracking
    - Create indexes for performance
*/

-- Add new fields to tasks table if they don't exist
DO $$ 
BEGIN
  -- Add project_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN project_id uuid REFERENCES projects ON DELETE CASCADE;
  END IF;

  -- Add position if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'position'
  ) THEN
    ALTER TABLE tasks ADD COLUMN position integer DEFAULT 0;
  END IF;

  -- Add column_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'column_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN column_id text DEFAULT 'todo'
      CHECK (column_id IN ('todo', 'in_progress', 'review', 'done'));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_position_idx ON tasks(position);
CREATE INDEX IF NOT EXISTS tasks_column_id_idx ON tasks(column_id);

-- Create function to handle task reordering if it doesn't exist
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

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS task_reorder_trigger ON tasks;
CREATE TRIGGER task_reorder_trigger
  BEFORE INSERT OR UPDATE OF position, column_id
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION reorder_tasks();

-- Update RLS policies for tasks
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can update task positions" ON tasks;

  -- Create new policy for task position updates
  CREATE POLICY "Users can update task positions"
    ON tasks
    FOR UPDATE
    USING (
      project_id IN (
        SELECT id FROM projects WHERE created_by = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    );
END $$;