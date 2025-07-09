/*
  # USERS TABLE FIX - Update ID to Reference auth.users
  
  This script fixes the users table to properly reference auth.users(id)
  instead of using auto-generated UUIDs.
  
  Execute this ONLY if you already ran PURE_UNIFIED_SYSTEM_COMPLETE.sql
  and got the "relation users already exists" error.
*/

-- Step 1: Drop the existing users table and its policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;

-- Step 2: Drop the table
DROP TABLE IF EXISTS users CASCADE;

-- Step 3: Recreate the users table with correct structure
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

-- Step 4: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Recreate RLS policies
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

-- Step 6: Recreate the trigger for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verification
SELECT 'Users table updated successfully! ID now references auth.users(id)' as message;

-- Check the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
