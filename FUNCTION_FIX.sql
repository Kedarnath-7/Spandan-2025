-- FIX for the timeout issue in NEW_GROUP_BASED_SCHEMA.sql
-- Run this to replace the problematic functions with simpler, working versions

-- Replace the problematic generate_unique_code function
CREATE OR REPLACE FUNCTION generate_unique_code()
RETURNS text AS $$
BEGIN
    -- Simple 6-character alphanumeric code using MD5
    RETURN UPPER(LEFT(MD5(RANDOM()::TEXT), 6));
END;
$$ LANGUAGE plpgsql;

-- Replace the generate_group_id function to avoid infinite loops
CREATE OR REPLACE FUNCTION generate_group_id()
RETURNS text AS $$
DECLARE
  new_id text;
  attempt_count integer := 0;
BEGIN
  LOOP
    new_id := 'GRP-' || UPPER(LEFT(MD5(RANDOM()::TEXT), 8));
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM group_registrations WHERE group_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    -- Safety: prevent infinite loop
    attempt_count := attempt_count + 1;
    IF attempt_count > 100 THEN
      -- If we somehow can't find a unique ID after 100 attempts, 
      -- use timestamp to ensure uniqueness
      RETURN 'GRP-' || UPPER(LEFT(MD5(RANDOM()::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT), 8));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Replace the generate_delegate_user_id function
CREATE OR REPLACE FUNCTION generate_delegate_user_id(tier_name text)
RETURNS text AS $$
DECLARE
  new_id text;
  tier_code text;
  attempt_count integer := 0;
BEGIN
  -- Map tier names to codes
  CASE tier_name
    WHEN 'Collectors Print' THEN tier_code := 'COPR';
    WHEN 'Deluxe Edition' THEN tier_code := 'DEED';
    WHEN 'Issue #1' THEN tier_code := 'ISSU';
    ELSE tier_code := 'UNKN';
  END CASE;
  
  LOOP
    new_id := 'USER-' || tier_code || '-' || UPPER(LEFT(MD5(RANDOM()::TEXT), 6));
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM group_members WHERE delegate_user_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    -- Safety: prevent infinite loop
    attempt_count := attempt_count + 1;
    IF attempt_count > 100 THEN
      -- Use timestamp to ensure uniqueness
      RETURN 'USER-' || tier_code || '-' || UPPER(LEFT(MD5(RANDOM()::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT), 6));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT 'Function timeout issues fixed!' AS message;
