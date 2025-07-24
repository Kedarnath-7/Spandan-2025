# Event Registration System Database Setup

## Overview
This document provides instructions for setting up the event registration system database schema in Supabase.

## Prerequisites
- Access to Supabase dashboard
- Admin privileges on the project database

## Manual Database Setup

Since the Supabase CLI is not properly configured, you'll need to apply the database migrations manually through the Supabase dashboard.

### Step 1: Apply Database Migrations

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Execute the following migration files in order:

#### Migration 1: Allow Custom Categories
```sql
-- File: supabase/migrations/20250125000000_allow_custom_categories.sql
-- Remove the check constraint that restricts event categories
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;
```

#### Migration 2: Event Registration System
Execute the contents of `supabase/migrations/20250125000001_event_registration_system.sql`

This migration includes:
- `event_registrations` table for group-level registration data
- `event_registration_members` table for individual participants
- Database functions for validation and capacity checking
- Row Level Security (RLS) policies
- Indexes for performance

### Step 2: Verify Database Structure

After applying the migrations, verify that the following tables exist:

1. **event_registrations** - Contains group registration information
   - group_id (primary key, format: EVT-XXXXXXXX)
   - event_id (foreign key to events table)
   - contact information
   - payment details
   - status tracking

2. **event_registration_members** - Contains individual participant details
   - user_id (references approved tier/pass registrations)
   - personal information
   - group membership details

3. **Database Functions**:
   - `validate_approved_user_id()` - Validates user against approved registrations
   - `get_approved_user_details()` - Retrieves user information
   - `generate_event_group_id()` - Generates unique group IDs
   - `get_event_registration_count()` - Counts event participants
   - `check_event_capacity()` - Validates event capacity

### Step 3: Test the System

1. **Frontend Access**:
   - Event Registration: `/events/register`
   - Admin Interface: `/admin/event-registrations`

2. **Test Flow**:
   - Register users for events (requires approved tier/pass registration)
   - Admin review and approval process
   - Capacity management

## Security Features

- Row Level Security (RLS) enabled on all tables
- User validation against approved registrations
- Event capacity checking
- Secure group ID generation

## Integration Notes

The event registration system integrates with:
- Existing tier/pass registration system
- Events management system
- Admin dashboard
- Payment tracking system

## Troubleshooting

If you encounter issues:

1. **User Validation Errors**: Ensure users are in approved tier/pass registrations
2. **Capacity Issues**: Check event max_participants settings
3. **Permission Errors**: Verify RLS policies are correctly applied
4. **Function Errors**: Check that all database functions were created successfully

## Support

For technical support or issues with the database setup, review the migration files and ensure all SQL commands executed successfully without errors.
