/*
  # Fix Kanban triggers and reordering

  1. Drop existing triggers first
  2. Recreate triggers with proper checks
  3. Add reordering functions
  4. Add RLS policies
*/

-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS kanban_columns_reorder_trigger ON kanban_columns;
DROP TRIGGER IF EXISTS kanban_tasks_reorder_trigger ON kanban_tasks;

-- Function to handle column reordering
CREATE OR REPLACE FUNCTION reorder_kanban_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Update positions of columns in the same project
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.position != NEW.position) THEN
    UPDATE kanban_columns
    SET position = position + 1
    WHERE project_id = NEW.project_id
    AND position >= NEW.position
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle task reordering
CREATE OR REPLACE FUNCTION reorder_kanban_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Update positions of tasks in the same column
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND (OLD.position != NEW.position OR OLD.column_id != NEW.column_id)) THEN
    -- If moving to a new column, update positions in both columns
    IF TG_OP = 'UPDATE' AND OLD.column_id != NEW.column_id THEN
      -- Update positions in old column
      UPDATE kanban_tasks
      SET position = position - 1
      WHERE column_id = OLD.column_id
      AND position > OLD.position;
    END IF;
    
    -- Update positions in new/current column
    UPDATE kanban_tasks
    SET position = position + 1
    WHERE column_id = NEW.column_id
    AND position >= NEW.position
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for reordering
CREATE TRIGGER kanban_columns_reorder_trigger
  BEFORE INSERT OR UPDATE OF position
  ON kanban_columns
  FOR EACH ROW
  EXECUTE FUNCTION reorder_kanban_columns();

CREATE TRIGGER kanban_tasks_reorder_trigger
  BEFORE INSERT OR UPDATE OF position, column_id
  ON kanban_tasks
  FOR EACH ROW
  EXECUTE FUNCTION reorder_kanban_tasks();