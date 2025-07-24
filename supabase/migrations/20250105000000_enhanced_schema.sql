/*
  # SPANDAN 2025 - ENHANCED GROUP-BASED REGISTRATION SYSTEM WITH PASSES
  
  This script creates the enhanced group-based registration system with:
  
  FEATURES:
  1. No user authentication (login/signup removed)
  2. Group-based registrations with individual member data
  3. TIERS: Collectors Print, Deluxe Edition, Issue #1
  4. PASSES: Nexus Arena (Sports), Nexus Spotlight (CULT), Nexus Forum (LIT - Standard/Premium)
  5. Mixed groups (members can choose tiers OR passes)
  6. Unique user IDs for both delegate tiers and passes
  7. Simplified admin authentication
  8. Excel export support
  
  Execute this script to create the enhanced schema with all fixes included.
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
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS group_registrations CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- ============================================================================
-- STEP 2: CREATE NEW ENHANCED GROUP-BASED TABLES
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
  price numeric NOT NULL DEFAULT 0,
  max_participants integer DEFAULT 20,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin users table (simple authentication)
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL, -- Plain text for demo: "admin123"
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create group registrations table (main registration record per group)
CREATE TABLE group_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text UNIQUE NOT NULL, -- Generated: GRP-XXXXXXXX
  
  -- Group summary
  total_amount decimal(10,2) NOT NULL,
  member_count integer NOT NULL CHECK (member_count >= 1 AND member_count <= 12),
  
  -- Payment information
  payment_transaction_id text NOT NULL,
  payment_screenshot_path text,
  
  -- Contact person (first member)
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  
  -- Registration status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create group members table (individual member data with tiers OR passes)
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES group_registrations(group_id) ON DELETE CASCADE,
  user_id text UNIQUE NOT NULL, -- Either delegate_user_id OR pass_id
  
  -- Member personal information
  name text NOT NULL,
  email text NOT NULL,
  college text NOT NULL,
  phone text NOT NULL,
  college_location text, -- instead of branch
  
  -- Selection type: either 'tier' or 'pass'
  selection_type text NOT NULL CHECK (selection_type IN ('tier', 'pass')),
  
  -- TIER selection (for delegates)
  tier text CHECK (tier IN ('Collectors Print', 'Deluxe Edition', 'Issue #1')),
  delegate_user_id text, -- Generated: USER-COPR-XXXXXX (only if tier selected)
  
  -- PASS selection (for pass holders)
  pass_type text CHECK (pass_type IN ('Nexus Arena', 'Nexus Spotlight', 'Nexus Forum')),
  pass_tier text CHECK (pass_tier IN ('Standard', 'Premium')), -- Only for Nexus Forum
  pass_id text, -- Generated: USER-PANA-XXXXXX, USER-PANS-XXXXXX, USER-PANFS/PANFP-XXXXXX
  
  -- Amount paid
  amount decimal(10,2) NOT NULL,
  
  -- Order in group (for display purposes)
  member_order integer NOT NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(group_id, email), -- One email per group
  UNIQUE(group_id, member_order), -- Unique order within group
  
  -- Ensure proper selection logic
  CHECK (
    (selection_type = 'tier' AND tier IS NOT NULL AND delegate_user_id IS NOT NULL AND pass_type IS NULL AND pass_id IS NULL) OR
    (selection_type = 'pass' AND pass_type IS NOT NULL AND pass_id IS NOT NULL AND tier IS NULL AND delegate_user_id IS NULL)
  ),
  
  -- Ensure pass_tier is set only for Nexus Forum
  CHECK (
    (pass_type = 'Nexus Forum' AND pass_tier IS NOT NULL) OR
    (pass_type != 'Nexus Forum' AND pass_tier IS NULL) OR
    (pass_type IS NULL)
  )
);

-- ============================================================================
-- STEP 3: CREATE ENHANCED ID GENERATION FUNCTIONS
-- ============================================================================

-- Simple random code generator (fixed from timeout issues)
CREATE OR REPLACE FUNCTION generate_unique_code()
RETURNS text AS $$
BEGIN
    -- Simple 6-character alphanumeric code using MD5
    RETURN UPPER(LEFT(MD5(RANDOM()::TEXT), 6));
END;
$$ LANGUAGE plpgsql;

-- Generate unique group ID
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
      -- Use timestamp to ensure uniqueness
      RETURN 'GRP-' || UPPER(LEFT(MD5(RANDOM()::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT), 8));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate unique delegate user ID based on tier
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
    IF NOT EXISTS (SELECT 1 FROM group_members WHERE user_id = new_id OR delegate_user_id = new_id) THEN
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

-- Generate unique pass ID based on pass type and tier
CREATE OR REPLACE FUNCTION generate_pass_id(pass_type_name text, pass_tier_name text DEFAULT NULL)
RETURNS text AS $$
DECLARE
  new_id text;
  pass_code text;
  attempt_count integer := 0;
BEGIN
  -- Map pass types to codes
  CASE pass_type_name
    WHEN 'Nexus Arena' THEN pass_code := 'PANA';
    WHEN 'Nexus Spotlight' THEN pass_code := 'PANS';
    WHEN 'Nexus Forum' THEN 
      CASE pass_tier_name
        WHEN 'Standard' THEN pass_code := 'PANFS';
        WHEN 'Premium' THEN pass_code := 'PANFP';
        ELSE pass_code := 'PANF';
      END CASE;
    ELSE pass_code := 'PASS';
  END CASE;
  
  LOOP
    new_id := 'USER-' || pass_code || '-' || UPPER(LEFT(MD5(RANDOM()::TEXT), 6));
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM group_members WHERE user_id = new_id OR pass_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    -- Safety: prevent infinite loop
    attempt_count := attempt_count + 1;
    IF attempt_count > 100 THEN
      -- Use timestamp to ensure uniqueness
      RETURN 'USER-' || pass_code || '-' || UPPER(LEFT(MD5(RANDOM()::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT), 6));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: CREATE TRIGGERS FOR AUTO ID GENERATION
-- ============================================================================

-- Auto-generate group_id before insert
CREATE OR REPLACE FUNCTION set_group_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.group_id IS NULL OR NEW.group_id = '' THEN
    NEW.group_id := generate_group_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_group_id
  BEFORE INSERT ON group_registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_group_id();

-- Auto-generate user_id, delegate_user_id, or pass_id before insert
CREATE OR REPLACE FUNCTION set_member_ids()
RETURNS trigger AS $$
BEGIN
  -- Generate appropriate IDs based on selection type
  IF NEW.selection_type = 'tier' THEN
    -- Generate delegate user ID
    IF NEW.delegate_user_id IS NULL OR NEW.delegate_user_id = '' THEN
      NEW.delegate_user_id := generate_delegate_user_id(NEW.tier);
    END IF;
    -- Set user_id to delegate_user_id
    NEW.user_id := NEW.delegate_user_id;
    -- Clear pass-related fields
    NEW.pass_id := NULL;
    
  ELSIF NEW.selection_type = 'pass' THEN
    -- Generate pass ID
    IF NEW.pass_id IS NULL OR NEW.pass_id = '' THEN
      NEW.pass_id := generate_pass_id(NEW.pass_type, NEW.pass_tier);
    END IF;
    -- Set user_id to pass_id
    NEW.user_id := NEW.pass_id;
    -- Clear tier-related fields
    NEW.delegate_user_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_member_ids
  BEFORE INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION set_member_ids();

-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: CREATE PERMISSIVE RLS POLICIES (FIXED)
-- ============================================================================

-- Events table policies (public read, admin full access)
CREATE POLICY "Enable read for all users" ON events
  FOR SELECT USING (is_active = true);

-- Policy for admin users to manage events (insert, update, delete)
-- This allows bypassing RLS for admin operations via service role key
CREATE POLICY "Enable all for admin operations" ON events
  FOR ALL USING (true);

-- Admin users policies
CREATE POLICY "Enable all for admin users" ON admin_users
  FOR ALL USING (true);

-- Group registrations policies (public access)
CREATE POLICY "Enable insert for all users" ON group_registrations 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for all users" ON group_registrations 
  FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON group_registrations 
  FOR UPDATE USING (true);

-- Group members policies (public access)
CREATE POLICY "Enable insert for all users" ON group_members 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for all users" ON group_members 
  FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON group_members 
  FOR UPDATE USING (true);

-- ============================================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_group_registrations_group_id ON group_registrations(group_id);
CREATE INDEX idx_group_registrations_status ON group_registrations(status);
CREATE INDEX idx_group_registrations_created_at ON group_registrations(created_at);
CREATE INDEX idx_group_registrations_contact_email ON group_registrations(contact_email);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_email ON group_members(email);
CREATE INDEX idx_group_members_selection_type ON group_members(selection_type);
CREATE INDEX idx_group_members_tier ON group_members(tier);
CREATE INDEX idx_group_members_pass_type ON group_members(pass_type);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);

CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_is_active ON events(is_active);

-- ============================================================================
-- STEP 8: CREATE ENHANCED VIEWS
-- ============================================================================

-- Enhanced registration view for admin dashboard (handles both tiers and passes)
CREATE VIEW registration_view AS
SELECT 
  gr.group_id,
  gm.user_id,
  gm.name,
  gm.email,
  gm.college,
  gm.phone,
  gm.college_location,
  gm.selection_type,
  gm.tier,
  gm.delegate_user_id,
  gm.pass_type,
  gm.pass_tier,
  gm.pass_id,
  gm.amount,
  gr.total_amount,
  gr.payment_transaction_id,
  gr.status,
  gr.created_at,
  gr.reviewed_at,
  gr.reviewed_by,
  gr.rejection_reason,
  gr.member_count
FROM group_registrations gr
JOIN group_members gm ON gr.group_id = gm.group_id
ORDER BY gr.created_at DESC, gm.member_order ASC;

-- Admin dashboard summary view
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
  STRING_AGG(
    CASE 
      WHEN gm.selection_type = 'tier' THEN gm.tier
      WHEN gm.selection_type = 'pass' THEN 
        CASE 
          WHEN gm.pass_tier IS NOT NULL THEN gm.pass_type || ' (' || gm.pass_tier || ')'
          ELSE gm.pass_type
        END
    END, 
    ', ' ORDER BY gm.member_order
  ) as member_selections
FROM group_registrations gr
LEFT JOIN group_members gm ON gr.group_id = gm.group_id
GROUP BY gr.id, gr.group_id, gr.member_count, gr.total_amount, gr.status, 
         gr.contact_name, gr.contact_email, gr.contact_phone, gr.created_at, 
         gr.reviewed_at, gr.reviewed_by
ORDER BY gr.created_at DESC;

-- ============================================================================
-- STEP 9: INSERT SAMPLE DATA
-- ============================================================================

-- Insert sample admin user (password: admin123)
INSERT INTO admin_users (email, name, password_hash, is_active) 
VALUES ('admin@spandan2025.com', 'Admin User', 'admin123', true);

-- Insert sample events
INSERT INTO events (name, description, category, info_points, is_active) VALUES
('Dance Competition', 'Showcase your dancing skills in various dance forms', 'Cultural', 
 ARRAY['Solo and group categories', 'Multiple dance forms allowed', 'Professional judging panel', 'Cash prizes for winners'], true),
('Singing Competition', 'Solo and group singing performances', 'Cultural',
 ARRAY['Classical and modern categories', 'Instrumental allowed', 'Live band support', 'Recording opportunities'], true),
('Basketball Tournament', 'Inter-college basketball championship', 'Sports',
 ARRAY['5v5 format', 'Knockout rounds', 'Professional referees', 'Trophies and medals'], true),
('Art Exhibition', 'Display your artistic creations', 'Fine Arts',
 ARRAY['Painting and sculpture', 'Digital art welcome', 'Live art sessions', 'Expert critique sessions'], true);

-- ============================================================================
-- STEP 10: GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions for public access
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'ENHANCED SCHEMA WITH PASSES CREATED SUCCESSFULLY!' as message,
       'Features: Tiers + Passes, Mixed Groups, Enhanced IDs, All Fixes Included' as features;
