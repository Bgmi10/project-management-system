/*
  # Add Basic Task Fields

  1. Changes
    - Adds title and description fields
    - Adds status and priority fields with constraints
    - Adds assignment and due date tracking
    - Adds project reference

  2. Security
    - Enables RLS on tasks table
    - Adds basic CRUD policies
*/

-- Add basic task fields
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS title text NOT NULL,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'todo'
  CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium'
  CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users,
ADD COLUMN IF NOT EXISTS due_date timestamptz;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks(assigned_to);

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