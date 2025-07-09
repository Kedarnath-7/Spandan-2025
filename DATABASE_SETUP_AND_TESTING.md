# DATABASE SETUP AND TESTING CHECKLIST

## 🗄️ Database Setup (Execute in Order)

### 1. Schema Reset
```sql
-- Execute SCHEMA_RESET.sql in Supabase SQL Editor
-- This removes all legacy tables and data
-- ⚠️ WARNING: This deletes ALL existing data!
```

### 2. Pure Unified System Setup
```sql
-- Execute PURE_UNIFIED_SYSTEM_COMPLETE.sql in Supabase SQL Editor
-- This creates the new unified schema with proper RLS policies
```

### 3. Environment Configuration
```env
# Add to your .env.local file
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 🧪 Testing Checklist

### Signup Flow Test
1. **Navigate to Signup Page**: `/signup`
2. **Fill Complete Form**:
   - Full Name: "John Doe"
   - Email: "john@example.com"  
   - Phone: "+91 9876543210"
   - College: "Test University"
   - Year: "3rd Year"
   - Branch: "Computer Science"
   - Password: "password123"
   - Confirm Password: "password123"

3. **Expected Results**:
   - ✅ Account created successfully
   - ✅ Email verification prompt shown
   - ✅ Check database: `users` table should have the complete profile
   - ✅ Console logs should show "Profile created successfully during signup"

### Database Verification
```sql
-- Check if user profile was stored
SELECT * FROM users WHERE email = 'john@example.com';

-- Should show:
-- id, email, name, college, phone, year, branch, created_at, updated_at
```

### Registration Flow Test
1. **Login with verified account**
2. **Navigate to Registration**: `/register`
3. **Expected Results**:
   - ✅ Profile form should be PRE-POPULATED with signup data
   - ✅ Should NOT show "Complete Your Profile" screen
   - ✅ Can proceed directly to tier selection and event registration

### Profile Dashboard Test
1. **Navigate to Profile**: `/profile`
2. **Check Settings Tab**:
   - ✅ All fields should be pre-populated from signup
   - ✅ Should be able to edit and update profile
   - ✅ Updates should persist in database

## 🐛 Troubleshooting

### Issue: Profile not created during signup
**Check:**
1. Service role key is correctly set in environment
2. Console logs for any errors in profile creation
3. Database `users` table exists and has correct structure
4. RLS policies are properly set up

### Issue: "Complete Your Profile" still shows
**Check:**
1. User record exists in `users` table
2. All required fields (name, college, phone, year, branch) have values
3. `getUserProfile()` function is working correctly

### Issue: Admin client errors
**Check:**
1. `SUPABASE_SERVICE_ROLE_KEY` environment variable is set
2. Service role key is valid and has proper permissions
3. Supabase project settings allow admin operations

## 📋 Console Log Verification

During signup, you should see these logs:
```
Starting signup process for: john@example.com
Profile data: { name: "John Doe", phone: "+91 9876543210", college: "Test University", year: "3rd Year", branch: "Computer Science" }
User created successfully, creating profile for user ID: [uuid]
Creating profile with data: { id: [uuid], email: "john@example.com", name: "John Doe", ... }
Creating user profile during signup with admin client: { ... }
Profile created successfully during signup: { ... }
```

## ✅ Success Criteria

The fix is working correctly when:
1. User completes signup with all profile fields
2. Profile data is immediately stored in `users` table
3. User can proceed directly to registration without re-entering profile data
4. Profile dashboard shows pre-populated data
5. No "Complete Your Profile" prompts appear

## 🚀 Deployment Notes

For production deployment:
1. Execute SQL scripts in production Supabase instance
2. Set `SUPABASE_SERVICE_ROLE_KEY` in production environment
3. Test the complete flow in production
4. Monitor logs for any issues
5. (Optional) Remove debugging console.log statements after validation
