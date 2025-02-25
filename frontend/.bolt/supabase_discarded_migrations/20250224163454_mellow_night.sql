/*
  # Set up Tasks Table

  1. New Tables
    - `tasks` - Core tasks table with all necessary fields
    
  2. Security
    - Enable RLS
    - Set up policies for task access
    - Grant necessary permissions
*/

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id),
  due_date timestamptz,
  position integer DEFAULT 0,
  column_id text DEFAULT 'todo'
    CHECK (column_id IN ('todo', 'in_progress', 'review', 'done')),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view tasks in their projects"
  ON tasks
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their projects"
  ON tasks
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their projects"
  ON tasks
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in their projects"
  ON tasks
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_column_id_idx ON tasks(column_id);
CREATE INDEX IF NOT EXISTS tasks_position_idx ON tasks(position);

-- Create trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample tasks for testing
INSERT INTO tasks (
  title,
  description,
  status,
  priority,
  project_id,
  created_by,
  column_id,
  position
)
SELECT
  'Sample Task ' || i,
  'This is a sample task description ' || i,
  CASE (i % 4)
    WHEN 0 THEN 'todo'
    WHEN 1 THEN 'in_progress'
    WHEN 2 THEN 'review'
    ELSE 'done'
  END,
  CASE (i % 4)
    WHEN 0 THEN 'low'
    WHEN 1 THEN 'medium'
    WHEN 2 THEN 'high'
    ELSE 'urgent'
  END,
  p.id,
  p.created_by,
  CASE (i % 4)
    WHEN 0 THEN 'todo'
    WHEN 1 THEN 'in_progress'
    WHEN 2 THEN 'review'
    ELSE 'done'
  END,
  i
FROM generate_series(1, 12) i
CROSS JOIN (
  SELECT id, created_by 
  FROM projects 
  WHERE name = 'Default Project'
  LIMIT 1
) p
ON CONFLICT DO NOTHING;