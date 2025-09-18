-- SQL script to delete a specific project and all its related data
-- Run this in the Supabase SQL Editor

-- Replace 'YOUR_PROJECT_ID_HERE' with the actual UUID of the project you want to delete
-- For example: '75d5833f-07b8-4a51-851b-270f2daa1f5e'
DECLARE
  project_id UUID := 'YOUR_PROJECT_ID_HERE';

BEGIN
  -- Step 1: Delete project images
  DELETE FROM project_images
  WHERE project_id = project_id;
  
  -- Step 2: Delete project milestones
  DELETE FROM project_milestones
  WHERE project_id = project_id;
  
  -- Step 3: Delete project updates
  DELETE FROM project_updates
  WHERE project_id = project_id;
  
  -- Step 4: Delete role skills (if they exist)
  DELETE FROM role_skills
  WHERE role_id IN (
    SELECT id FROM roles
    WHERE project_id = project_id
  );
  
  -- Step 5: Delete roles
  DELETE FROM roles
  WHERE project_id = project_id;
  
  -- Step 6: Delete the project
  DELETE FROM projects
  WHERE id = project_id;
  
  -- Return confirmation message
  RAISE NOTICE 'Project % and all related data have been deleted.', project_id;
END;
