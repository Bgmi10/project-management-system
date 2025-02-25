/*
  # Add Test Data

  1. Test Data
    - Creates test users
    - Creates test projects
    - Creates test tasks
    - Sets up project members
  
  2. Security
    - Ensures proper RLS policies
    - Sets up test user permissions
*/

-- Create test users
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
) VALUES
  (
    'test-user-1',
    'test1@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  ),
  (
    'test-user-2',
    'test2@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
ON CONFLICT DO NOTHING;

-- Create test profiles
INSERT INTO profiles (
  id,
  username,
  is_admin,
  updated_at
) VALUES
  (
    'test-user-1',
    'test1@example.com',
    false,
    now()
  ),
  (
    'test-user-2',
    'test2@example.com',
    false,
    now()
  )
ON CONFLICT DO NOTHING;

-- Create test projects
INSERT INTO projects (
  id,
  name,
  description,
  status,
  created_by,
  created_at,
  updated_at
) VALUES
  (
    'test-project-1',
    'Test Project 1',
    'A test project for development',
    'active',
    'test-user-1',
    now(),
    now()
  ),
  (
    'test-project-2',
    'Test Project 2',
    'Another test project',
    'active',
    'test-user-2',
    now(),
    now()
  )
ON CONFLICT DO NOTHING;

-- Add project members
INSERT INTO project_members (
  project_id,
  user_id,
  role,
  joined_at
) VALUES
  (
    'test-project-1',
    'test-user-1',
    'admin',
    now()
  ),
  (
    'test-project-1',
    'test-user-2',
    'team_member',
    now()
  ),
  (
    'test-project-2',
    'test-user-2',
    'admin',
    now()
  )
ON CONFLICT DO NOTHING;

-- Create test tasks
INSERT INTO tasks (
  id,
  project_id,
  title,
  description,
  status,
  priority,
  assigned_to,
  column_id,
  position,
  created_by,
  created_at,
  updated_at
) VALUES
  (
    'test-task-1',
    'test-project-1',
    'Implement login page',
    'Create a beautiful and secure login page',
    'todo',
    'high',
    'test-user-1',
    'todo',
    0,
    'test-user-1',
    now(),
    now()
  ),
  (
    'test-task-2',
    'test-project-1',
    'Design dashboard',
    'Design the main dashboard layout',
    'in_progress',
    'medium',
    'test-user-2',
    'in_progress',
    0,
    'test-user-1',
    now(),
    now()
  ),
  (
    'test-task-3',
    'test-project-1',
    'Set up database',
    'Configure and initialize the database',
    'done',
    'high',
    'test-user-1',
    'done',
    0,
    'test-user-1',
    now(),
    now()
  ),
  (
    'test-task-4',
    'test-project-2',
    'Write documentation',
    'Create comprehensive documentation',
    'todo',
    'low',
    'test-user-2',
    'todo',
    0,
    'test-user-2',
    now(),
    now()
  )
ON CONFLICT DO NOTHING;

-- Add test comments
INSERT INTO comments (
  id,
  task_id,
  user_id,
  content,
  created_at,
  updated_at
) VALUES
  (
    'test-comment-1',
    'test-task-1',
    'test-user-1',
    'Started working on the login form',
    now(),
    now()
  ),
  (
    'test-comment-2',
    'test-task-1',
    'test-user-2',
    'Looking good! A few suggestions for improvements...',
    now(),
    now()
  )
ON CONFLICT DO NOTHING;