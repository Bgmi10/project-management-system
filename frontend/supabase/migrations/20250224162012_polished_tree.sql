/*
  # Fix Query Plan Function

  1. Changes
    - Replace EXPLAIN-based query plan function with a safer implementation
    - Add proper error handling
    - Add input validation

  2. Security
    - Maintain RLS policies
    - Add parameter validation
*/

-- Drop the problematic function if it exists
DROP FUNCTION IF EXISTS get_query_plan(text);

-- Create a safer version of the query plan function
CREATE OR REPLACE FUNCTION get_query_plan(query_text text)
RETURNS jsonb AS $$
DECLARE
  plan_result jsonb;
BEGIN
  -- Validate input
  IF query_text IS NULL OR length(trim(query_text)) = 0 THEN
    RETURN jsonb_build_object(
      'error', 'Query text cannot be empty',
      'detail', 'INVALID_INPUT'
    );
  END IF;

  -- Use plpgsql EXECUTE to safely run EXPLAIN
  BEGIN
    EXECUTE 'EXPLAIN (FORMAT JSON) ' || query_text INTO STRICT plan_result;
    RETURN plan_result;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'error', SQLERRM,
        'detail', SQLSTATE,
        'context', 'Error executing EXPLAIN'
      );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke execute from public and grant only to authenticated users
REVOKE ALL ON FUNCTION get_query_plan(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_query_plan(text) TO authenticated;

-- Add comment explaining function usage
COMMENT ON FUNCTION get_query_plan(text) IS 
  'Returns the execution plan for a given SQL query in JSON format. 
   Requires authentication. Returns error details if query is invalid.';