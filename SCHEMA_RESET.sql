/*
  # SPANDAN 2025 - Complete Schema Reset
  
  This script completely resets the database schema to prepare for the Pure Unified System.
  
  WARNING: This will delete ALL existing data!
  
  Execute this first, then run the PURE_UNIFIED_SYSTEM_COMPLETE.sql script.
*/

-- STEP 1: Drop all views first (they have dependencies)
DROP VIEW IF EXISTS admin_unified_registrations CASCADE;

-- STEP 2: Drop all storage policies
DROP POLICY IF EXISTS "Users can upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload event attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage event attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all objects" ON storage.objects;

-- STEP 3: Drop all functions and triggers
DROP TRIGGER IF EXISTS sync_registration_status_trigger ON unified_registrations;
DROP FUNCTION IF EXISTS sync_registration_status() CASCADE;
DROP FUNCTION IF EXISTS migrate_to_unified_registrations() CASCADE;
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;

-- STEP 4: Drop all tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS unified_registration_events CASCADE;
DROP TABLE IF EXISTS unified_registrations CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS delegate_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS admin_emails CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- STEP 5: Delete storage objects first, then buckets
DELETE FROM storage.objects WHERE bucket_id IN ('payment-screenshots', 'event-attachments');
DELETE FROM storage.buckets WHERE id IN ('payment-screenshots', 'event-attachments');

-- STEP 6: Drop any custom types
DROP TYPE IF EXISTS registration_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

SELECT 'Schema reset complete! Now run PURE_UNIFIED_SYSTEM_COMPLETE.sql' as message;
