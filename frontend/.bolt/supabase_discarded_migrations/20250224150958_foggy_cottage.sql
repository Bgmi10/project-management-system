/*
  # Kanban Board Task Management System

  1. Tables
    - `kanban_columns`: Stores board columns
    - `kanban_tasks`: Stores tasks with position tracking
  
  2. Security
    - RLS enabled on all tables
    - Project-based access control
*/

-- Create kanban_columns table
CREATE TABLE IF NOT EXISTS kanban_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (project_id, position)
);

-- Create kanban_tasks table
CREATE TABLE IF NOT EXISTS kanban_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  column_id uuid REFERENCES kanban_columns ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  position integer NOT NULL,
  assigned_to uuid REFERENCES auth.users,
  due_date timestamptz,
  priority task_priority DEFAULT 'medium',
  labels text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (column_id, position)
);

-- Enable RLS
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kanban_columns_project ON kanban_columns(project_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_column ON kanban_tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_project ON kanban_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_assigned ON kanban_tasks(assigned_to);

-- Create updated_at triggers
CREATE TRIGGER update_kanban_columns_updated_at
  BEFORE UPDATE ON kanban_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_tasks_updated_at
  BEFORE UPDATE ON kanban_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for kanban_columns
CREATE POLICY "View columns" ON kanban_columns
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Manage columns" ON kanban_columns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = kanban_columns.project_id
      AND user_id = auth.uid()
      AND role IN ('project_manager', 'admin')
    )
  );

-- RLS Policies for kanban_tasks
CREATE POLICY "View tasks" ON kanban_tasks
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Create tasks" ON kanban_tasks
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Update tasks" ON kanban_tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = kanban_tasks.project_id
      AND user_id = auth.uid()
      AND role IN ('project_manager', 'admin')
    )
  );

CREATE POLICY "Delete tasks" ON kanban_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = kanban_tasks.project_id
      AND user_id = auth.uid()
      AND role IN ('project_manager', 'admin')
    )
  );

-- Function to create default columns
CREATE OR REPLACE FUNCTION create_default_columns()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO kanban_columns (project_id, title, position)
  VALUES
    (NEW.id, 'To Do', 1),
    (NEW.id, 'In Progress', 2),
    (NEW.id, 'Done', 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default columns for new projects
CREATE TRIGGER create_default_columns_trigger
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_default_columns();