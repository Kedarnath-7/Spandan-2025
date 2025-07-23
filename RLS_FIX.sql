-- FIX RLS policies to allow public registrations
-- The NEW_GROUP_BASED_SCHEMA has restrictive RLS policies that block anonymous users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can insert registrations" ON group_registrations;
DROP POLICY IF EXISTS "Anyone can insert group members" ON group_members;
DROP POLICY IF EXISTS "Admins can read all registrations" ON group_registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON group_registrations;
DROP POLICY IF EXISTS "Admins can read all group members" ON group_members;

-- Create permissive policies for public registration
CREATE POLICY "Enable insert for all users" ON group_registrations 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for all users" ON group_registrations 
  FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON group_registrations 
  FOR UPDATE USING (true);

CREATE POLICY "Enable insert for all users" ON group_members 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for all users" ON group_members 
  FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON group_members 
  FOR UPDATE USING (true);

-- Ensure events are readable
DROP POLICY IF EXISTS "Anyone can read active events" ON events;
CREATE POLICY "Enable read for all users" ON events 
  FOR SELECT USING (is_active = true);

-- Admin users can manage their own data
DROP POLICY IF EXISTS "Admins can read own data" ON admin_users;
CREATE POLICY "Enable all for admin users" ON admin_users 
  FOR ALL USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

SELECT 'RLS policies updated to allow public registrations!' AS message;
