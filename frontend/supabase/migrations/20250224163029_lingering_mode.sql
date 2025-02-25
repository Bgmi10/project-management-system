-- Add is_admin column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can read profiles" ON profiles;
CREATE POLICY "Users can read profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true); -- Allow all authenticated users to read profiles

-- Update RLS policies for tasks
DROP POLICY IF EXISTS "Users can read tasks" ON tasks;
CREATE POLICY "Users can read tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
CREATE POLICY "Users can insert tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
CREATE POLICY "Users can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;
CREATE POLICY "Users can delete tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Create function to safely get task count
CREATE OR REPLACE FUNCTION get_task_count(p_project_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM tasks
    WHERE project_id = p_project_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_task_count TO authenticated;

-- Create function to safely get project members
CREATE OR REPLACE FUNCTION get_project_members(p_project_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  role text,
  joined_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.user_id,
    p.username as email,
    pm.role::text,
    pm.joined_at
  FROM project_members pm
  JOIN profiles p ON p.id = pm.user_id
  WHERE pm.project_id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_project_members TO authenticated;

-- Add default admin user if not exists
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  true,
  'authenticated'
) ON CONFLICT DO NOTHING;

-- Add admin profile
INSERT INTO profiles (
  id,
  username,
  is_admin,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  true,
  now()
) ON CONFLICT (id) DO UPDATE
SET is_admin = true;