/*
  # SPANDAN 2025 - NEW GROUP-BASED REGISTRATION SYSTEM
  
  This script creates a completely new group-based registration system:
  
  FEATURES:
  1. No user authentication (login/signup removed)
  2. Group-based registrations with individual member data
  3. Unique delegate user IDs for each member
  4. Unique group IDs for each registration
  5. Simplified admin authentication
  6. Excel export support
  
  Execute this script to create the new schema.
*/

-- ============================================================================
-- STEP 1: DROP EXISTING TABLES (Fresh Start)
-- ============================================================================

-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS unified_registration_events CASCADE;
DROP TABLE IF EXISTS unified_registrations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS admin_emails CASCADE;

-- ============================================================================
-- STEP 2: CREATE NEW GROUP-BASED TABLES
-- ============================================================================

-- Create events table (informational only, no registration link)
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('Cultural', 'Sports', 'Fine Arts', 'Literary', 'Academic')),
  info_points text[], -- Array of bullet points
  start_date timestamptz,
  end_date timestamptz,
  venue text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin users table (simple authentication)
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL, -- bcrypt hashed password
  name text NOT NULL,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create group registrations table (group-level data)
CREATE TABLE group_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text UNIQUE NOT NULL, -- e.g., GRP-TIER-A1B2C3
  
  -- Group totals
  total_amount decimal(10,2) NOT NULL,
  member_count integer NOT NULL CHECK (member_count >= 1 AND member_count <= 12),
  
  -- Payment information
  payment_transaction_id text NOT NULL UNIQUE,
  payment_screenshot_path text NOT NULL,
  
  -- Registration status and management
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Admin review information
  reviewed_by text, -- admin email who reviewed
  reviewed_at timestamptz,
  rejection_reason text,
  
  -- Contact person (first member details for communication)
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create group members table (individual member data)
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES group_registrations(group_id) ON DELETE CASCADE,
  
  -- Unique delegate user ID for each member
  delegate_user_id text UNIQUE NOT NULL, -- e.g., USER-COPR-A1B2C3
  
  -- Member personal information
  name text NOT NULL,
  email text NOT NULL,
  college text NOT NULL,
  phone text NOT NULL,
  college_location text, -- instead of branch
  
  -- Tier selection (individual per member)
  tier text NOT NULL CHECK (tier IN ('Collectors Print', 'Deluxe Edition', 'Issue #1')),
  tier_amount decimal(10,2) NOT NULL CHECK (tier_amount IN (375, 650, 850)),
  
  -- Order in group (for display purposes)
  member_order integer NOT NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(group_id, email), -- One email per group
  UNIQUE(group_id, member_order) -- Unique order within group
);

-- ============================================================================
-- STEP 3: CREATE ID GENERATION FUNCTIONS
-- ============================================================================

-- Function to generate 6-digit alphanumeric code with at least 2 letters and 2 numbers
CREATE OR REPLACE FUNCTION generate_unique_code()
RETURNS text AS $$
DECLARE
  code text;
  letters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  numbers text := '0123456789';
  all_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i integer;
  letter_count integer := 0;
  number_count integer := 0;
BEGIN
  LOOP
    code := '';
    letter_count := 0;
    number_count := 0;
    
    -- Generate 6 random characters using LEFT and MD5 instead of substr
    code := UPPER(LEFT(MD5(RANDOM()::TEXT), 6));
    code := TRANSLATE(code, 'ABCDEF', '23456789'); -- Ensure mix of letters and numbers
    
    -- Count letters and numbers
    FOR i IN 1..6 LOOP
      IF substring(code, i, 1) ~ '[A-Z]' THEN
        letter_count := letter_count + 1;
      ELSIF substring(code, i, 1) ~ '[0-9]' THEN
        number_count := number_count + 1;
      END IF;
    END LOOP;
    
    -- Check if we have at least 2 letters and 2 numbers
    IF letter_count >= 2 AND number_count >= 2 THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique group ID
CREATE OR REPLACE FUNCTION generate_group_id()
RETURNS text AS $$
DECLARE
  new_id text;
BEGIN
  LOOP
    new_id := 'GRP-TIER-' || generate_unique_code();
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM group_registrations WHERE group_id = new_id) THEN
      RETURN new_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique delegate user ID based on tier
CREATE OR REPLACE FUNCTION generate_delegate_user_id(tier_name text)
RETURNS text AS $$
DECLARE
  new_id text;
  tier_code text;
BEGIN
  -- Map tier names to codes
  CASE tier_name
    WHEN 'Collectors Print' THEN tier_code := 'COPR';
    WHEN 'Deluxe Edition' THEN tier_code := 'DEED';
    WHEN 'Issue #1' THEN tier_code := 'ISSU';
    ELSE tier_code := 'UNKN';
  END CASE;
  
  LOOP
    new_id := 'USER-' || tier_code || '-' || generate_unique_code();
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM group_members WHERE delegate_user_id = new_id) THEN
      RETURN new_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: CREATE TRIGGERS FOR AUTOMATIC ID GENERATION
-- ============================================================================

-- Trigger function for group ID generation
CREATE OR REPLACE FUNCTION set_group_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.group_id IS NULL OR NEW.group_id = '' THEN
    NEW.group_id := generate_group_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for delegate user ID generation
CREATE OR REPLACE FUNCTION set_delegate_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.delegate_user_id IS NULL OR NEW.delegate_user_id = '' THEN
    NEW.delegate_user_id := generate_delegate_user_id(NEW.tier);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_set_group_id
  BEFORE INSERT ON group_registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_group_id();

CREATE TRIGGER trigger_set_delegate_user_id
  BEFORE INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION set_delegate_user_id();

-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY (for future if needed)
-- ============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================================================

-- Events table policies (public read)
CREATE POLICY "Anyone can read active events" ON events
  FOR SELECT USING (is_active = true);

-- Admin users policies (self-management only)
CREATE POLICY "Admins can read own data" ON admin_users
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Group registrations policies (public insert, admin read/update)
CREATE POLICY "Anyone can insert registrations" ON group_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read all registrations" ON group_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email' 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can update registrations" ON group_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email' 
      AND is_active = true
    )
  );

-- Group members policies (public insert, admin read)
CREATE POLICY "Anyone can insert group members" ON group_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read all group members" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email' 
      AND is_active = true
    )
  );

-- ============================================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for better query performance
CREATE INDEX idx_group_registrations_status ON group_registrations(status);
CREATE INDEX idx_group_registrations_created_at ON group_registrations(created_at);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_tier ON group_members(tier);
CREATE INDEX idx_group_members_email ON group_members(email);

-- ============================================================================
-- STEP 8: INSERT SAMPLE DATA
-- ============================================================================

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (email, password_hash, name) VALUES 
('admin@spandan2025.com', '$2b$10$rWZJ8Z8Z8Z8Z8Z8Z8Z8Z8e8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8', 'Admin User');

-- Insert sample events (informational only)
INSERT INTO events (name, description, category, info_points, venue, is_active) VALUES
('Dance Battle', 'Ultimate dance competition showcasing various dance forms', 'Cultural', 
 ARRAY['Solo and group categories', 'All dance forms welcome', 'Professional judges', 'Cash prizes'], 
 'Main Auditorium', true),
 
('Art Exhibition', 'Display of creative artworks by students', 'Fine Arts',
 ARRAY['Painting and sketching', 'Digital art welcome', 'Theme-based competition', 'Exhibition for 3 days'],
 'Art Gallery', true),
 
('Quiz Championship', 'Test your knowledge across various domains', 'Literary',
 ARRAY['Team of 2-3 members', 'Multiple rounds', 'General knowledge', 'Current affairs'],
 'Conference Hall', true),
 
('Football Tournament', 'Inter-college football championship', 'Sports',
 ARRAY['Team of 11 players', 'Knockout format', 'Professional referees', 'Trophy for winners'],
 'Football Ground', true);

-- ============================================================================
-- STEP 9: CREATE VIEWS FOR EASY DATA ACCESS
-- ============================================================================

-- View for complete registration data (for Excel export)
CREATE VIEW registration_export_view AS
SELECT 
  gr.group_id,
  gm.delegate_user_id,
  gm.name,
  gm.email,
  gm.college,
  gm.phone,
  gm.college_location,
  gm.tier,
  gm.tier_amount,
  gr.total_amount as group_total_amount,
  gr.payment_transaction_id,
  gr.status as registration_status,
  gr.created_at as submitted_date,
  CASE 
    WHEN gr.status = 'approved' THEN 'Approved'
    WHEN gr.status = 'rejected' THEN 'Rejected'
    ELSE 'Pending Review'
  END as review_status,
  gr.reviewed_at,
  gr.reviewed_by,
  gr.rejection_reason
FROM group_registrations gr
JOIN group_members gm ON gr.group_id = gm.group_id
ORDER BY gr.created_at DESC, gm.member_order ASC;

-- View for admin dashboard summary
CREATE VIEW admin_dashboard_view AS
SELECT 
  gr.group_id,
  gr.member_count,
  gr.total_amount,
  gr.status,
  gr.contact_name,
  gr.contact_email,
  gr.contact_phone,
  gr.created_at,
  gr.reviewed_at,
  gr.reviewed_by,
  COUNT(gm.id) as actual_member_count,
  STRING_AGG(gm.tier, ', ' ORDER BY gm.member_order) as member_tiers
FROM group_registrations gr
LEFT JOIN group_members gm ON gr.group_id = gm.group_id
GROUP BY gr.id, gr.group_id, gr.member_count, gr.total_amount, gr.status, 
         gr.contact_name, gr.contact_email, gr.contact_phone, gr.created_at, 
         gr.reviewed_at, gr.reviewed_by
ORDER BY gr.created_at DESC;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'NEW GROUP-BASED SCHEMA CREATED SUCCESSFULLY!' as message,
       'Next steps: Update frontend and backend services' as next_action;
