-- SQL script to delete test projects and all related data
-- Run this in the Supabase SQL Editor

-- This script will delete ALL projects and related data
-- To delete specific projects, modify the WHERE clauses to target specific project IDs
-- For example: WHERE project_id = 'your-project-id-here'

-- Step 1: Delete project images
DELETE FROM project_images
WHERE project_id IN (SELECT id FROM projects);

-- Step 2: Delete project milestones
DELETE FROM project_milestones
WHERE project_id IN (SELECT id FROM projects);

-- Step 3: Delete project updates
DELETE FROM project_updates
WHERE project_id IN (SELECT id FROM projects);

-- Step 4: Delete role skills (if they exist)
DELETE FROM role_skills
WHERE role_id IN (
  SELECT id FROM roles
  WHERE project_id IN (SELECT id FROM projects)
);

-- Step 5: Delete roles
DELETE FROM roles
WHERE project_id IN (SELECT id FROM projects);

-- Step 6: Delete projects
DELETE FROM projects;

-- Confirmation message
SELECT 'All test projects and related data have been deleted.' AS message;
