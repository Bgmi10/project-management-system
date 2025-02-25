-- Create a function to get or create default project
CREATE OR REPLACE FUNCTION get_or_create_default_project(user_id uuid)
RETURNS uuid AS $$
DECLARE
  project_id uuid;
BEGIN
  -- First try to find existing default project
  SELECT id INTO project_id
  FROM projects
  WHERE created_by = user_id
  AND name = 'Default Project'
  LIMIT 1;

  -- If no default project exists, create one
  IF project_id IS NULL THEN
    INSERT INTO projects (
      name,
      description,
      status,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      'Default Project',
      'Default project for personal tasks',
      'active',
      user_id,
      now(),
      now()
    )
    RETURNING id INTO project_id;

    -- Add user as project member
    INSERT INTO project_members (
      project_id,
      user_id,
      role,
      joined_at
    ) VALUES (
      project_id,
      user_id,
      'admin',
      now()
    );
  END IF;

  RETURN project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_default_project TO authenticated;