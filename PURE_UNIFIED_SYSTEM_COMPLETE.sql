/*
  # SPANDAN 2025 - PURE UNIFIED SYSTEM (Complete)
  
  This script creates a complete Pure Unified System for SPANDAN 2025:
  
  FEATURES:
  1. Single source of truth - no legacy tables
  2. All registration data in unified_registrations table
  3. Event selections in unified_registration_events junction table
  4. Enhanced admin management
  5. Proper storage setup with RLS policies
  6. Sample data for testing
  
  Execute this AFTER running SCHEMA_RESET.sql
  
  Execute this entire script in the Supabase SQL Editor.
*/

-- ============================================================================
-- STEP 1: CREATE CORE TABLES
-- ============================================================================

-- Create users table (enhanced) - uses auth.users.id
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  college text NOT NULL,
  phone text NOT NULL,
  year text,
  branch text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create events table (enhanced)
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('Cultural', 'Sports', 'Fine Arts', 'Literary')),
  price decimal(10,2) DEFAULT 0,
  max_participants integer,
  info_points text[], -- Array of bullet points
  start_date timestamptz,
  end_date timestamptz,
  venue text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_emails table
CREATE TABLE admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'coordinator', 'finance')),
  added_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create unified_registrations table (PURE - no foreign keys to legacy tables)
CREATE TABLE unified_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User information (stored directly)
  user_email text NOT NULL,
  user_name text NOT NULL,
  user_phone text NOT NULL,
  user_college text NOT NULL,
  user_year text,
  user_branch text,
  
  -- Registration details
  registration_tier text NOT NULL CHECK (registration_tier IN ('Tier 1', 'Tier 2', 'Tier 3')),
  total_amount decimal(10,2) NOT NULL,
  
  -- Payment information (stored directly)
  payment_transaction_id text NOT NULL,
  payment_screenshot_path text NOT NULL,
  payment_amount decimal(10,2) NOT NULL,
  
  -- Registration status and management
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  delegate_id text UNIQUE, -- Generated after approval
  
  -- Admin review information
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(user_email), -- One registration per email
  UNIQUE(payment_transaction_id) -- Unique transaction IDs
);

-- Create junction table for registration events
CREATE TABLE unified_registration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unified_registration_id uuid REFERENCES unified_registrations(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate event selections for the same registration
  UNIQUE(unified_registration_id, event_id)
);

-- ============================================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_registration_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: CREATE RLS POLICIES
-- ============================================================================

-- Users table policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails WHERE is_active = true
    )
  );

-- Events table policies (public read, admin write)
CREATE POLICY "Anyone can read active events" ON events
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can insert events" ON events
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails WHERE is_active = true
    )
  );

CREATE POLICY "Admins can update events" ON events
  FOR UPDATE TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails WHERE is_active = true
    )
  );

CREATE POLICY "Admins can delete events" ON events
  FOR DELETE TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails WHERE is_active = true
    )
  );

-- Admin emails policies
CREATE POLICY "Public can read active admin emails" ON admin_emails
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can add admins" ON admin_emails
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails WHERE role = 'super_admin' AND is_active = true
    )
  );

CREATE POLICY "Super admins can update admins" ON admin_emails
  FOR UPDATE TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails WHERE role = 'super_admin' AND is_active = true
    )
  );

-- Unified registrations policies
CREATE POLICY "Users can read own registrations" ON unified_registrations
  FOR SELECT USING (user_email = (auth.jwt() ->> 'email'));

CREATE POLICY "Users can insert own registrations" ON unified_registrations
  FOR INSERT WITH CHECK (user_email = (auth.jwt() ->> 'email'));

CREATE POLICY "Admins can read all registrations" ON unified_registrations
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails WHERE is_active = true
    )
  );

CREATE POLICY "Admins can update all registrations" ON unified_registrations
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails WHERE is_active = true
    )
  );

-- Unified registration events policies
CREATE POLICY "Users can read own registration events" ON unified_registration_events
  FOR SELECT USING (
    unified_registration_id IN (
      SELECT id FROM unified_registrations 
      WHERE user_email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can insert own registration events" ON unified_registration_events
  FOR INSERT WITH CHECK (
    unified_registration_id IN (
      SELECT id FROM unified_registrations 
      WHERE user_email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Admins can read all registration events" ON unified_registration_events
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails WHERE is_active = true
    )
  );

-- ============================================================================
-- STEP 4: CREATE STORAGE BUCKETS AND POLICIES
-- ============================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('payment-screenshots', 'payment-screenshots', true),
  ('event-attachments', 'event-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Payment Screenshots Storage Policies
CREATE POLICY "Users can upload payment screenshots"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-screenshots');

CREATE POLICY "Users can view payment screenshots"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-screenshots' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      auth.jwt() ->> 'email' IN (
        SELECT email FROM admin_emails WHERE is_active = true
      )
    )
  );

CREATE POLICY "Users can update payment screenshots"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'payment-screenshots' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      auth.jwt() ->> 'email' IN (
        SELECT email FROM admin_emails WHERE is_active = true
      )
    )
  );

CREATE POLICY "Users can delete payment screenshots"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'payment-screenshots' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      auth.jwt() ->> 'email' IN (
        SELECT email FROM admin_emails WHERE is_active = true
      )
    )
  );

-- Event Attachments Storage Policies
CREATE POLICY "Public can view event attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-attachments');

CREATE POLICY "Admins can manage event attachments"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'event-attachments' AND
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails WHERE is_active = true
    )
  )
  WITH CHECK (
    bucket_id = 'event-attachments' AND
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails WHERE is_active = true
    )
  );

-- ============================================================================
-- STEP 5: CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS generate_delegate_id() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Function to generate delegate ID after approval
CREATE OR REPLACE FUNCTION generate_delegate_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate delegate ID when status changes to approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.delegate_id IS NULL THEN
    NEW.delegate_id := 'SPD25-' || LPAD((
      SELECT COUNT(*) + 1 
      FROM unified_registrations 
      WHERE status = 'approved' AND delegate_id IS NOT NULL
    )::text, 6, '0');
  END IF;
  
  -- Update timestamps
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for delegate ID generation
CREATE TRIGGER generate_delegate_id_trigger
  BEFORE UPDATE ON unified_registrations
  FOR EACH ROW
  EXECUTE FUNCTION generate_delegate_id();

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_emails_updated_at BEFORE UPDATE ON admin_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 6: CREATE ADMIN VIEW
-- ============================================================================

CREATE OR REPLACE VIEW admin_unified_registrations AS
SELECT 
  ur.id,
  ur.user_email,
  ur.user_name,
  ur.user_phone,
  ur.user_college,
  ur.user_year,
  ur.user_branch,
  ur.registration_tier,
  ur.total_amount,
  ur.payment_transaction_id,
  ur.payment_screenshot_path as payment_screenshot,
  ur.payment_amount,
  ur.status,
  ur.delegate_id,
  ur.reviewed_by,
  ur.reviewed_at,
  ur.rejection_reason,
  ur.created_at,
  ur.updated_at,
  
  -- Selected events as JSON array
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', e.id,
          'name', e.name,
          'category', e.category,
          'price', e.price
        )
      )
      FROM unified_registration_events ure
      JOIN events e ON e.id = ure.event_id
      WHERE ure.unified_registration_id = ur.id
    ),
    '[]'::json
  ) as selected_events

FROM unified_registrations ur
ORDER BY ur.created_at DESC;

-- ============================================================================
-- STEP 7: INSERT INITIAL DATA
-- ============================================================================

-- Insert initial admin emails
INSERT INTO admin_emails (email, role) VALUES 
  ('admin@spandan2025.com', 'super_admin'),
  ('coordinator@spandan2025.com', 'admin'),
  ('finance@spandan2025.com', 'finance'),
  ('admin@fest2024.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert comprehensive sample events with enhanced descriptions and info points
INSERT INTO events (name, description, category, price, max_participants, info_points, venue) VALUES 
  -- Cultural Events
  ('Solo Dance', 'Showcase your dancing skills in this individual dance competition with professional judging and exciting prizes', 'Cultural', 100, 50, 
   ARRAY['3-5 minute performance time limit', 'Any dance style allowed (classical, contemporary, hip-hop, folk)', 'Music to be provided by participant (USB/CD)', 'Judged on technique, creativity, stage presence, and choreography', 'Professional dance instructors as judges', 'Cash prizes for top 3 positions'], 'Main Auditorium'),
  
  ('Group Dance', 'Team dance competition for groups showcasing choreography, coordination, and creativity', 'Cultural', 200, 20, 
   ARRAY['Team size: 4-8 members', '5-8 minute performance duration', 'Props and costumes allowed', 'Fusion and traditional styles welcome', 'Theme-based choreography encouraged', 'Group coordination and synchronization will be judged'], 'Main Auditorium'),
  
  ('Solo Singing', 'Individual singing competition across various genres with live accompaniment options', 'Cultural', 100, 40, 
   ARRAY['Maximum 5 minutes per performance', 'Karaoke tracks or live instruments available', 'Any genre accepted (classical, bollywood, western, regional)', 'Original compositions highly encouraged', 'Professional sound system provided', 'Microphone technique will be considered in judging'], 'Music Hall'),
  
  ('Drama Competition', 'Short play performance competition featuring original and adapted scripts', 'Cultural', 300, 15, 
   ARRAY['15-20 minute performance duration', 'Team of 5-10 members', 'Props, costumes, and makeup allowed', 'Original scripts preferred, adaptations accepted', 'Professional lighting and sound support', 'Judged on script, acting, direction, and overall presentation'], 'Drama Theatre'),

  ('Band Performance', 'Live band competition featuring original music and popular covers', 'Cultural', 400, 12, 
   ARRAY['Band size: 3-6 members', '15-20 minute performance slot', 'Basic instruments provided (drums, amps)', 'Original compositions earn bonus points', 'Sound engineer support included', 'All genres welcome'], 'Open Air Stage'),

  -- Sports Events
  ('Basketball Tournament', 'Inter-college 5v5 basketball tournament with professional referees', 'Sports', 500, 12, 
   ARRAY['Team of 5 players + 3 substitutes maximum', 'FIBA standard court and rules', 'Knockout tournament format', 'Professional referees provided', 'Match duration: 4 quarters of 10 minutes', 'Team jerseys must be uniform'], 'Basketball Court'),
  
  ('Football Championship', 'Full-field football tournament with FIFA standard regulations', 'Sports', 600, 16, 
   ARRAY['Team of 11 players + 5 substitutes', 'FIFA standard rules and regulations', 'Group stage followed by knockout rounds', '90-minute matches (45 min each half)', 'Professional linesmen and referees', 'Yellow/red card system in effect'], 'Football Ground'),
  
  ('Cricket Tournament', 'T20 cricket tournament with professional umpiring and live scoring', 'Sports', 800, 10, 
   ARRAY['Team of 11 players + 4 substitutes', 'T20 format: 20 overs per side', 'ICC T20 rules followed', 'Professional cricket equipment provided', 'Qualified umpires for all matches', 'Live scoring and commentary'], 'Cricket Ground'),
  
  ('Badminton Championship', 'Singles and doubles badminton competition with tournament format', 'Sports', 150, 32, 
   ARRAY['Both singles and doubles categories', 'BWF rules and regulations', 'Best of 3 sets format', 'Professional quality shuttlecocks provided', 'Standard international court dimensions', 'Separate mens and womens categories'], 'Sports Complex Indoor'),

  ('Table Tennis Tournament', 'Fast-paced table tennis competition with international standards', 'Sports', 120, 40, 
   ARRAY['Singles and doubles categories available', 'ITTF international rules', 'Best of 5 games per match', 'Professional tournament tables', 'Official ITTF approved balls', 'Knockout tournament format'], 'TT Hall'),

  ('Volleyball Tournament', 'Indoor volleyball competition with professional court setup', 'Sports', 300, 8, 
   ARRAY['Team of 6 players + 2 substitutes', 'FIVB international rules', 'Best of 5 sets format', 'Professional net and court markings', 'Qualified referees and line judges', 'Mixed team format allowed'], 'Volleyball Court'),

  -- Fine Arts Events
  ('Painting Competition', 'On-the-spot painting competition with provided materials and themes', 'Fine Arts', 100, 30, 
   ARRAY['2.5 hour time limit', 'Canvas (A2 size) and basic acrylic paints provided', 'Any painting medium allowed', 'Theme will be announced 30 minutes before start', 'Professional art supplies available for purchase', 'Judged on creativity, technique, and theme interpretation'], 'Art Studio'),
  
  ('Photography Contest', 'Photography contest with multiple themes and categories', 'Fine Arts', 150, 25, 
   ARRAY['Submit maximum 3 photos', 'Digital submission only (minimum 5MP resolution)', 'Original work only - no stock images', 'Categories: Portrait, Landscape, Street, Abstract', 'EXIF data required for verification', 'Professional photographers as judges'], 'Online Submission'),
  
  ('Sketching Competition', 'Live sketching competition with model and still-life options', 'Fine Arts', 80, 35, 
   ARRAY['1.5 hour duration', 'Drawing paper and basic pencils provided', 'Portrait, landscape, or still-life themes', 'Live model available for portrait category', 'Charcoal and other mediums allowed', 'Judged on proportions, shading, and artistic expression'], 'Art Room'),

  ('Sculpture Workshop', 'Clay sculpture making with expert guidance and tools', 'Fine Arts', 200, 20, 
   ARRAY['3-hour hands-on workshop', 'Clay, tools, and workspace provided', 'Expert sculptor guidance throughout', 'Take your creation home', 'No prior experience required', 'Focus on basic sculpting techniques'], 'Sculpture Studio'),

  ('Digital Art Competition', 'Modern digital art contest using professional software', 'Fine Arts', 250, 15, 
   ARRAY['Software provided: Photoshop, Illustrator, Procreate', 'High-end graphics tablets and workstations', 'Theme: "Future of Technology"', '3-hour time limit', 'High-resolution prints of winners displayed', 'Digital art files will be judged'], 'Computer Graphics Lab'),

  -- Literary Events
  ('Debate Championship', 'Parliamentary style debate competition with current affair topics', 'Literary', 100, 24, 
   ARRAY['Team of 2 debaters', 'Oxford Parliamentary debate format', 'Topics announced 30 minutes prior to each round', 'English language only', 'Professional debate judges', '7-minute speeches per speaker'], 'Seminar Hall'),
  
  ('Creative Writing Contest', 'Short story and poetry writing competition with creative themes', 'Literary', 80, 40, 
   ARRAY['2.5 hour time limit', 'Choice between short story or poetry', 'Word limit: 1000 words for stories, 50 lines for poetry', 'Theme provided on the spot', 'Handwritten or typed submissions accepted', 'Judged on creativity, language, and theme adherence'], 'Library Reading Hall'),
  
  ('Quiz Competition', 'Multi-round quiz covering general knowledge and current affairs', 'Literary', 120, 30, 
   ARRAY['Team of 2-3 members', 'Multiple rounds: written, buzzer, and rapid fire', 'Topics: GK, current affairs, science, sports, entertainment', 'Audio-visual questions included', 'Tiebreaker rounds if needed', 'Prizes for top 3 teams'], 'Conference Hall'),
  
  ('Extempore Speaking', 'Impromptu speaking competition testing quick thinking and oratory skills', 'Literary', 80, 20, 
   ARRAY['2-3 minute impromptu speeches', 'Topics given on the spot', 'No preparation time allowed', 'Judged on content, delivery, confidence, and time management', 'Current affairs and general topics', 'English language only'], 'Seminar Hall'),

  ('Poetry Slam', 'Live poetry performance with original compositions', 'Literary', 60, 25, 
   ARRAY['Original poetry only', '3-5 minute performance time', 'Any language accepted', 'Props and background music allowed', 'Judged on content, delivery, and audience engagement', 'Theme: "Dreams and Aspirations"'], 'Open Stage'),

  ('Storytelling Competition', 'Oral storytelling competition with engaging narratives', 'Literary', 90, 20, 
   ARRAY['8-10 minute storytelling session', 'Original stories or folklore adaptations', 'Props and costumes allowed', 'Audience interaction encouraged', 'Judged on narration skills, creativity, and audience engagement', 'All age-appropriate content'], 'Story Corner')

ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 8: VERIFICATION QUERIES
-- ============================================================================

-- Display setup summary
SELECT 'Pure Unified System Setup Complete!' as message;

SELECT 'Tables created:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT 'Storage buckets:' as info;
SELECT id, name, public FROM storage.buckets;

SELECT 'Admin emails:' as info;
SELECT email, role, is_active FROM admin_emails;

SELECT 'Sample events:' as info;
SELECT name, category, price FROM events ORDER BY category, name;

SELECT 'Ready for registration testing!' as final_message;
