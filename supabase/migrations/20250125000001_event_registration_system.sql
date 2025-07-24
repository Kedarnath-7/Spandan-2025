/*
  # Event Registration System Extension
  
  This migration adds event registration support following the same pattern as tier/pass registrations.
  Each registration is for ONE event only, and all group members participate in the same event.
  
  Requirements:
  - Only users with approved tier/pass registrations can register for events
  - One event per registration (but users can make multiple separate registrations)
  - Group registration supported (all members join the same event)
  - Event capacity tracking
  - Same payment and admin approval flow
*/

-- ============================================================================
-- EVENT REGISTRATION TABLES
-- ============================================================================

-- Create event registrations table (main registration record per group/event)
CREATE TABLE event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text UNIQUE NOT NULL, -- Generated: EVT-XXXXXXXX
  
  -- Event information
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  event_name text NOT NULL, -- Cached for performance/history
  event_price decimal(10,2) NOT NULL, -- Cached from event at registration time
  
  -- Group summary
  total_amount decimal(10,2) NOT NULL, -- event_price * member_count
  member_count integer NOT NULL CHECK (member_count >= 1 AND member_count <= 12),
  
  -- Payment information
  payment_transaction_id text NOT NULL,
  payment_screenshot_path text,
  
  -- Contact person (first member)
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  contact_user_id text NOT NULL, -- Must be valid tier/pass user_id
  
  -- Registration status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event registration members table (individual participants)
CREATE TABLE event_registration_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES event_registrations(group_id) ON DELETE CASCADE,
  
  -- Member identification (must be valid tier/pass user)
  user_id text NOT NULL, -- Either delegate_user_id OR pass_id from approved registrations
  
  -- Member personal information (copied from tier/pass registration)
  name text NOT NULL,
  email text NOT NULL,
  college text NOT NULL,
  phone text NOT NULL,
  
  -- Original registration reference (for validation)
  original_group_id text NOT NULL, -- References the tier/pass group_registrations.group_id
  
  -- Order in group (for display purposes)
  member_order integer NOT NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(group_id, email), -- One email per event registration group
  UNIQUE(group_id, member_order), -- Unique order within group
  UNIQUE(group_id, user_id) -- One user_id per event registration group
);

-- ============================================================================
-- ID GENERATION FUNCTIONS FOR EVENT REGISTRATIONS
-- ============================================================================

-- Generate unique event registration group ID in format GRP-EVT-{6digit alphanumeric}
CREATE OR REPLACE FUNCTION generate_event_group_id()
RETURNS text AS $$
DECLARE
  new_id text;
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  numbers text := '0123456789';
  letters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  random_part text := '';
  num_count integer := 0;
  letter_count integer := 0;
  i integer;
  temp_char text;
  attempt_count integer := 0;
BEGIN
  LOOP
    random_part := '';
    num_count := 0;
    letter_count := 0;
    
    -- Generate 6 characters ensuring at least 2 numbers and 2 letters
    FOR i IN 1..6 LOOP
      IF i <= 6 THEN
        -- Choose character type based on current counts
        IF num_count < 2 AND letter_count >= 2 THEN
          -- Force number
          temp_char := substr(numbers, floor(random() * length(numbers))::int + 1, 1);
          num_count := num_count + 1;
        ELSIF letter_count < 2 AND num_count >= 2 THEN
          -- Force letter
          temp_char := substr(letters, floor(random() * length(letters))::int + 1, 1);
          letter_count := letter_count + 1;
        ELSIF num_count < 2 AND letter_count < 2 THEN
          -- Need both, choose randomly
          IF random() < 0.5 THEN
            temp_char := substr(numbers, floor(random() * length(numbers))::int + 1, 1);
            num_count := num_count + 1;
          ELSE
            temp_char := substr(letters, floor(random() * length(letters))::int + 1, 1);
            letter_count := letter_count + 1;
          END IF;
        ELSE
          -- Requirements met, random choice
          temp_char := substr(chars, floor(random() * length(chars))::int + 1, 1);
          IF temp_char ~ '[0-9]' THEN
            num_count := num_count + 1;
          ELSE
            letter_count := letter_count + 1;
          END IF;
        END IF;
        
        random_part := random_part || temp_char;
      END IF;
    END LOOP;
    
    new_id := 'GRP-EVT-' || random_part;
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM event_registrations WHERE group_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    -- Safety: prevent infinite loop
    attempt_count := attempt_count + 1;
    IF attempt_count > 100 THEN
      -- Use timestamp to ensure uniqueness
      RETURN 'GRP-EVT-' || UPPER(LEFT(MD5(RANDOM()::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT), 6));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate if a user_id belongs to an approved tier/pass registration
CREATE OR REPLACE FUNCTION validate_approved_user_id(input_user_id text)
RETURNS boolean AS $$
DECLARE
  is_valid boolean := false;
BEGIN
  -- Check if user_id exists in approved group_members
  SELECT EXISTS(
    SELECT 1 
    FROM group_members gm
    JOIN group_registrations gr ON gm.group_id = gr.group_id
    WHERE gm.user_id = input_user_id
    AND gr.status = 'approved'
  ) INTO is_valid;
  
  RETURN is_valid;
END;
$$ LANGUAGE plpgsql;

-- Function to get user details from approved tier/pass registration
CREATE OR REPLACE FUNCTION get_approved_user_details(input_user_id text)
RETURNS TABLE(
  user_id text,
  name text,
  email text,
  college text,
  phone text,
  group_id text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    input_user_id,
    gm.name,
    gm.email,
    gm.college,
    gm.phone,
    gm.group_id
  FROM group_members gm
  JOIN group_registrations gr ON gm.group_id = gr.group_id
  WHERE gm.user_id = input_user_id
  AND gr.status = 'approved'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EVENT CAPACITY TRACKING
-- ============================================================================

-- Function to get current event registration count
CREATE OR REPLACE FUNCTION get_event_registration_count(event_uuid uuid)
RETURNS integer AS $$
DECLARE
  total_registered integer := 0;
BEGIN
  SELECT COALESCE(SUM(member_count), 0)
  FROM event_registrations
  WHERE event_id = event_uuid
  AND status IN ('pending', 'approved')
  INTO total_registered;
  
  RETURN total_registered;
END;
$$ LANGUAGE plpgsql;

-- Function to check if event has capacity for new registrations
CREATE OR REPLACE FUNCTION check_event_capacity(event_uuid uuid, requested_spots integer)
RETURNS boolean AS $$
DECLARE
  max_capacity integer;
  current_count integer;
BEGIN
  -- Get event max_participants
  SELECT max_participants INTO max_capacity
  FROM events
  WHERE id = event_uuid;
  
  -- Get current registration count
  SELECT get_event_registration_count(event_uuid) INTO current_count;
  
  -- Check if there's enough capacity
  RETURN (current_count + requested_spots) <= max_capacity;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registration_members ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to event registrations (for admins)
CREATE POLICY "Public read access for event registrations" ON event_registrations
  FOR SELECT USING (true);

-- Policy for public insert access to event registrations
CREATE POLICY "Public insert access for event registrations" ON event_registrations
  FOR INSERT WITH CHECK (true);

-- Policy for public read access to event registration members (for admins)
CREATE POLICY "Public read access for event registration members" ON event_registration_members
  FOR SELECT USING (true);

-- Policy for public insert access to event registration members
CREATE POLICY "Public insert access for event registration members" ON event_registration_members
  FOR INSERT WITH CHECK (true);

-- Policy for public update access to event registrations (for admin status updates)
CREATE POLICY "Public update access for event registrations" ON event_registrations
  FOR UPDATE USING (true);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for efficient queries
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);
CREATE INDEX idx_event_registrations_contact_user_id ON event_registrations(contact_user_id);
CREATE INDEX idx_event_registration_members_user_id ON event_registration_members(user_id);
CREATE INDEX idx_event_registration_members_original_group_id ON event_registration_members(original_group_id);

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Note: Sample data would be inserted here if needed for testing
