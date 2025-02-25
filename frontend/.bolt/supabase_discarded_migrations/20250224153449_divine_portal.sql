/*
  # Task Management Schema Update

  1. Changes
    - Updates tasks table with new fields while preserving existing relationships
    - Adds support for task ordering and column management
    - Adds subtasks and tags support
  
  2. Security
    - Maintains existing RLS policies
    - Updates policies for new functionality
    
  3. Dependencies
    - Preserves existing foreign key relationships
    - Maintains compatibility with comments and file_uploads tables
*/

-- Create enums if they don't exist
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS status task_status DEFAULT 'todo',
ADD COLUMN IF NOT EXISTS priority task_priority DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS column_id text DEFAULT 'todo'
  CHECK (column_id IN ('todo', 'in_progress', 'review', 'done')),
ADD COLUMN IF NOT EXISTS position integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtasks jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS tasks_column_id_idx ON tasks(column_id);
CREATE INDEX IF NOT EXISTS tasks_position_idx ON tasks(position);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

-- Create trigger for task reordering
DROP TRIGGER IF EXISTS task_reorder_trigger ON tasks;
CREATE TRIGGER task_reorder_trigger
  BEFORE INSERT OR UPDATE OF position, column_id
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION reorder_tasks();

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks they created or are assigned to" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks they created or as project manager" ON tasks;

-- Create RLS policies
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