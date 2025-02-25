/*
  # Project Management System Schema

  1. New Tables
    - `roles` - User roles (Admin, Project Manager, Team Member)
    - `projects` - Project information
    - `tasks` - Task details and assignments
    - `comments` - Task comments
    - `notifications` - User notifications
    - `file_uploads` - Project and task attachments
    
  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

-- Create roles enum
CREATE TYPE user_role AS ENUM ('admin', 'project_manager', 'team_member');

-- Create project status enum
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');

-- Create task status enum
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');

-- Create task priority enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create notification type enum
CREATE TYPE notification_type AS ENUM ('task_assigned', 'task_updated', 'comment_added', 'deadline_approaching', 'project_updated');

-- Update profiles table to include role
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'team_member',
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS department text;

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status project_status DEFAULT 'planning',
  start_date timestamptz,
  end_date timestamptz,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  role user_role DEFAULT 'team_member',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  assigned_to uuid REFERENCES auth.users,
  due_date timestamptz,
  estimated_hours decimal,
  actual_hours decimal,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  reference_id uuid, -- Can reference a task, project, or comment
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create file_uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  task_id uuid REFERENCES tasks ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  size_bytes bigint NOT NULL,
  uploaded_by uuid REFERENCES auth.users NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS projects_created_by_idx ON projects(created_by);
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS comments_task_id_idx ON comments(task_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS file_uploads_project_id_idx ON file_uploads(project_id);
CREATE INDEX IF NOT EXISTS file_uploads_task_id_idx ON file_uploads(task_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Projects policies
CREATE POLICY "Users can view projects they are members of"
  ON projects
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM project_members WHERE project_id = projects.id
    ) OR
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE auth.jwt() ->> 'role' = 'admin'
    )
  );

CREATE POLICY "Project managers and admins can create projects"
  ON projects
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'project_manager')
  );

CREATE POLICY "Project managers and admins can update their projects"
  ON projects
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role' IN ('admin', 'project_manager')) AND
    (auth.uid() = created_by OR auth.jwt() ->> 'role' = 'admin')
  );

-- Tasks policies
CREATE POLICY "Users can view tasks in their projects"
  ON tasks
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create tasks"
  ON tasks
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Assigned users and project managers can update tasks"
  ON tasks
  FOR UPDATE
  USING (
    auth.uid() = assigned_to OR
    auth.uid() IN (
      SELECT user_id FROM project_members
      WHERE project_id = tasks.project_id
      AND role IN ('project_manager', 'admin')
    )
  );

-- Comments policies
CREATE POLICY "Project members can view comments"
  ON comments
  FOR SELECT
  USING (
    task_id IN (
      SELECT tasks.id FROM tasks
      JOIN project_members ON tasks.project_id = project_members.project_id
      WHERE project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create comments"
  ON comments
  FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT tasks.id FROM tasks
      JOIN project_members ON tasks.project_id = project_members.project_id
      WHERE project_members.user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- File uploads policies
CREATE POLICY "Project members can view files"
  ON file_uploads
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can upload files"
  ON file_uploads
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );