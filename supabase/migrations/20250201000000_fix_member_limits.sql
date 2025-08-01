-- IMMEDIATE FIX FOR MEMBER COUNT LIMITS
-- Run this script directly in your Supabase SQL editor

-- 1. Fix group_registrations table (tier/pass registrations) - Allow up to 25 members
ALTER TABLE group_registrations 
DROP CONSTRAINT IF EXISTS group_registrations_member_count_check;

ALTER TABLE group_registrations 
ADD CONSTRAINT group_registrations_member_count_check 
CHECK (member_count >= 1 AND member_count <= 25);

-- 2. Fix event_registrations table - Remove member count limit (allow unlimited)
ALTER TABLE event_registrations 
DROP CONSTRAINT IF EXISTS event_registrations_member_count_check;

ALTER TABLE event_registrations 
ADD CONSTRAINT event_registrations_member_count_check 
CHECK (member_count >= 1);

-- Verify the changes
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('group_registrations', 'event_registrations')
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name LIKE '%member_count%';
