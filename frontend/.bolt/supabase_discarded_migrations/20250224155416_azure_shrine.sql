/*
  # Add Task Creation Fields

  1. Changes
    - Adds title and description fields
    - Adds status field with default 'todo'
    - Adds project reference and user assignments
    - Adds basic task tracking fields

  2. Security
    - Enables RLS on tasks table
    - Adds policies for task creation and management
*/

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority text DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid REFERENCES auth.users,
  due_date timestamptz,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_created_by_idx ON tasks(created_by);

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