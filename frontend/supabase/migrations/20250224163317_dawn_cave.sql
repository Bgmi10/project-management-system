/*
  # Set up Task Management System

  1. New Tables
    - `tasks` - Stores task information
    - `task_comments` - Stores task comments
    - `task_attachments` - Stores task file attachments
    - `task_labels` - Stores task labels/tags
    - `task_assignments` - Stores task assignments

  2. Security
    - Enable RLS on all tables
    - Set up appropriate policies for task management
    - Ensure data access control
*/

-- Create task_labels table
CREATE TABLE IF NOT EXISTS task_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (task_id, user_id)
);

-- Enable RLS
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for task_labels
CREATE POLICY "Users can view task labels in their projects"
  ON task_labels
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create task labels in their projects"
  ON task_labels
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update task labels in their projects"
  ON task_labels
  FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete task labels in their projects"
  ON task_labels
  FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Create policies for task_comments
CREATE POLICY "Users can view task comments in their projects"
  ON task_comments
  FOR SELECT
  USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create task comments in their projects"
  ON task_comments
  FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own task comments"
  ON task_comments
  FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own task comments"
  ON task_comments
  FOR DELETE
  USING (created_by = auth.uid());

-- Create policies for task_attachments
CREATE POLICY "Users can view task attachments in their projects"
  ON task_attachments
  FOR SELECT
  USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload task attachments in their projects"
  ON task_attachments
  FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own task attachments"
  ON task_attachments
  FOR DELETE
  USING (created_by = auth.uid());

-- Create policies for task_assignments
CREATE POLICY "Users can view task assignments in their projects"
  ON task_assignments
  FOR SELECT
  USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage task assignments in their projects"
  ON task_assignments
  FOR ALL
  USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS task_labels_project_id_idx ON task_labels(project_id);
CREATE INDEX IF NOT EXISTS task_comments_task_id_idx ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS task_attachments_task_id_idx ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS task_assignments_task_id_idx ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS task_assignments_user_id_idx ON task_assignments(user_id);

-- Create function to get task details
CREATE OR REPLACE FUNCTION get_task_details(p_task_id uuid)
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'task', jsonb_build_object(
        'id', t.id,
        'title', t.title,
        'description', t.description,
        'status', t.status,
        'priority', t.priority,
        'due_date', t.due_date,
        'created_at', t.created_at,
        'updated_at', t.updated_at
      ),
      'comments', (
        SELECT jsonb_agg(jsonb_build_object(
          'id', c.id,
          'content', c.content,
          'created_at', c.created_at,
          'created_by', c.created_by
        ))
        FROM task_comments c
        WHERE c.task_id = t.id
      ),
      'attachments', (
        SELECT jsonb_agg(jsonb_build_object(
          'id', a.id,
          'file_name', a.file_name,
          'file_type', a.file_type,
          'file_size', a.file_size,
          'file_url', a.file_url,
          'created_at', a.created_at
        ))
        FROM task_attachments a
        WHERE a.task_id = t.id
      ),
      'assignments', (
        SELECT jsonb_agg(jsonb_build_object(
          'user_id', ta.user_id,
          'assigned_at', ta.assigned_at,
          'assigned_by', ta.assigned_by
        ))
        FROM task_assignments ta
        WHERE ta.task_id = t.id
      ),
      'labels', (
        SELECT jsonb_agg(jsonb_build_object(
          'id', l.id,
          'name', l.name,
          'color', l.color
        ))
        FROM task_labels l
        WHERE l.project_id = t.project_id
      )
    )
    FROM tasks t
    WHERE t.id = p_task_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_task_details TO authenticated;

-- Add some default task labels
INSERT INTO task_labels (name, color, project_id, created_by)
SELECT 
  label.name,
  label.color,
  p.id as project_id,
  p.created_by
FROM (
  VALUES 
    ('Bug', '#EF4444'),
    ('Feature', '#10B981'),
    ('Enhancement', '#3B82F6'),
    ('Documentation', '#8B5CF6'),
    ('High Priority', '#F59E0B')
) as label(name, color)
CROSS JOIN projects p
WHERE p.name = 'Default Project'
ON CONFLICT DO NOTHING;