-- Fix admin_users table access for authentication
-- Drop existing policies that might be blocking access
DROP POLICY IF EXISTS "Admins can read own data" ON admin_users;

-- Create a policy that allows authentication lookups
CREATE POLICY "Allow authentication" ON admin_users
  FOR SELECT USING (true);

-- Alternative: Temporarily disable RLS on admin_users for testing
-- ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Verify the admin user exists
SELECT id, email, password_hash, name, is_active FROM admin_users WHERE email = 'admin@spandan2025.com';
