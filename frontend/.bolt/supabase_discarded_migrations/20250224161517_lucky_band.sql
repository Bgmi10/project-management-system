/*
  # Add Task Creation Support

  1. New Fields
    - Add subtasks array to tasks table
    - Add tags array to tasks table
    - Add estimated_time field
    - Add actual_time field
    - Add completion_percentage field
  
  2. Security
    - Update RLS policies for task creation
    - Add policies for task updates
*/

-- Add new fields to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS subtasks jsonb[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS estimated_time interval,
ADD COLUMN IF NOT EXISTS actual_time interval,
ADD COLUMN IF NOT EXISTS completion_percentage integer DEFAULT 0
  CHECK (completion_percentage BETWEEN 0 AND 100);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_tags_idx ON tasks USING gin(tags);
CREATE INDEX IF NOT EXISTS tasks_completion_percentage_idx ON tasks(completion_percentage);

-- Create function to calculate completion percentage based on subtasks
CREATE OR REPLACE FUNCTION calculate_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subtasks IS NOT NULL AND array_length(NEW.subtasks, 1) > 0 THEN
    -- Calculate percentage based on completed subtasks
    SELECT 
      ROUND(
        (COUNT(*) FILTER (WHERE (value->>'completed')::boolean = true)::float / 
        COUNT(*)::float * 100)::numeric
      )::integer
    INTO NEW.completion_percentage
    FROM unnest(NEW.subtasks) AS value;
  END IF;
  
  -- If task status is 'done', set completion to 100%
  IF NEW.status = 'done' THEN
    NEW.completion_percentage := 100;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for completion percentage calculation
DROP TRIGGER IF EXISTS update_task_completion_trigger ON tasks;
CREATE TRIGGER update_task_completion_trigger
  BEFORE INSERT OR UPDATE OF subtasks, status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION calculate_task_completion();

-- Update RLS policies for task creation and updates
CREATE POLICY "Users can create tasks in their projects"
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

CREATE POLICY "Users can update tasks in their projects"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Create function to notify task assignee
CREATE OR REPLACE FUNCTION notify_task_assignee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND 
     (OLD IS NULL OR OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      reference_id
    ) VALUES (
      NEW.assigned_to,
      'task_assigned',
      'New Task Assigned',
      format('You have been assigned to task: %s', NEW.title),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for assignee notifications
DROP TRIGGER IF EXISTS task_assignee_notification_trigger ON tasks;
CREATE TRIGGER task_assignee_notification_trigger
  AFTER INSERT OR UPDATE OF assigned_to ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assignee();

-- Create function to log task history
CREATE OR REPLACE FUNCTION log_task_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_history (
    task_id,
    changed_by,
    old_data,
    new_data
  ) VALUES (
    NEW.id,
    auth.uid(),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task history logging
DROP TRIGGER IF EXISTS task_history_trigger ON tasks;
CREATE TRIGGER task_history_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_history();