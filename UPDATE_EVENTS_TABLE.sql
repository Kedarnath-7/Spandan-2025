-- Add missing columns to events table
-- Run this script if the events table already exists but is missing the new columns

-- First, check if the columns exist and add them if they don't
DO $$ 
BEGIN
    -- Add price column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'price') THEN
        ALTER TABLE events ADD COLUMN price numeric NOT NULL DEFAULT 0;
    END IF;
    
    -- Add max_participants column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'max_participants') THEN
        ALTER TABLE events ADD COLUMN max_participants integer DEFAULT 20;
    END IF;
END $$;

-- Ensure the admin policy exists for events management
DROP POLICY IF EXISTS "Enable all for admin operations" ON events;
CREATE POLICY "Enable all for admin operations" ON events
  FOR ALL USING (true);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;
