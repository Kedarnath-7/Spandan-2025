-- Quick fix for custom categories
-- Run this SQL in your Supabase SQL editor or database client

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;
