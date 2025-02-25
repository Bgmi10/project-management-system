/*
  # Task Management Schema Update

  1. Changes
    - Adds task_status and task_priority enums
    - Updates tasks table with new fields and constraints
    - Adds support for task ordering and column management
    - Adds subtasks and tags support
    - Updates RLS policies for better access control

  2. Security
    - Enables RLS on tasks table
    - Adds policies for CRUD operations
    - Ensures proper access control based on project membership
*/

-- Create task_status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create task_priority enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to tasks table if they don't exist
DO $$ BEGIN
  ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS status task_status DEFAULT 'todo',
    ADD COLUMN IF NOT EXISTS priority task_priority DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS column_id text DEFAULT 'todo'
      CHECK (column_id IN ('todo', 'in_progress', 'review', 'done')),
    ADD COLUMN IF NOT EXISTS position integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS subtasks jsonb DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS filters jsonb DEFAULT '{}';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_column_id_idx ON tasks(column_id);
CREATE INDEX IF NOT EXISTS tasks_position_idx ON tasks(position);
CREATE INDEX IF NOT EXISTS tasks_tags_idx ON tasks USING gin(tags);
CREATE INDEX IF NOT EXISTS tasks_filters_idx ON tasks USING gin(filters);

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

-- Create function to handle task reordering
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

-- Create triggers for task ordering
DROP TRIGGER IF EXISTS task_reorder_trigger ON tasks;
CREATE TRIGGER task_reorder_trigger
  BEFORE INSERT OR UPDATE OF position, column_id
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION reorder_tasks();

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

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks they created or are assigned to" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks they created or as project manager" ON tasks;

CREATE POLICY "Users can view tasks in their projects"
  ON tasks
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their projects"
  ON tasks
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks they created or are assigned to"
  ON tasks
  FOR UPDATE
  USING (
    auth.uid() = created_by OR
    auth.uid() = assigned_to OR
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
      AND role IN ('project_manager', 'admin')
    )
  );

CREATE POLICY "Users can delete tasks they created or as project manager"
  ON tasks
  FOR DELETE
  USING (
    auth.uid() = created_by OR
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
      AND role IN ('project_manager', 'admin')
    )
  );