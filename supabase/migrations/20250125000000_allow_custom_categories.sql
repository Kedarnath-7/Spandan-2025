/*
  # Allow Custom Categories for Events
  
  This migration removes the check constraint on the events.category column
  to allow custom categories in addition to the predefined ones.
  
  Changes:
  1. Drop the existing check constraint on events.category
  2. Allow any string value for category field
*/

-- Remove the check constraint that restricts categories
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;

-- The category field will now accept any text value
-- No need to recreate the constraint as we want to allow custom categories
