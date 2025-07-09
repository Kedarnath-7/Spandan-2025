# SIGNUP PROFILE STORAGE FIX - Updated

## Issue Description
During the signup process, user profile data (name, phone, college, year, branch) was not being stored in the `users` table immediately after account creation. The data was only being stored later when the user clicked the register button and went through the profile completion flow.

## Root Cause Analysis
The issue had two main causes:

1. **Row Level Security (RLS) policies** on the `users` table blocking insertions during signup
2. **Client-side environment variable limitation**: The `SUPABASE_SERVICE_ROLE_KEY` is not available on the client side (where signup happens)

The specific RLS policy blocking the insertion:
```sql
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## Solution Implemented

### 1. Server-Side API Endpoint
Created a new API route `/api/create-profile/route.ts` that:
- Runs on the server side where `SUPABASE_SERVICE_ROLE_KEY` is available
- Uses the admin client to bypass RLS policies during legitimate signup
- Provides proper error handling and validation

```typescript
// app/api/create-profile/route.ts
export async function POST(request: NextRequest) {
  // Uses server-side admin client with service role key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  
  // Insert profile with admin privileges
  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert(profileData)
    .select()
    .single();
}
```

### 2. Updated Signup Flow
Modified `lib/auth/auth-utils.ts` to call the server-side API:

```typescript
const createUserProfileOnSignup = async (profile) => {
  const response = await fetch('/api/create-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  
  const result = await response.json();
  return result.data;
};
```

### 3. Database Schema Fix
Ensured the `users` table properly references `auth.users(id)`:
```sql
-- Fixed users table structure
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
```

## Files Modified

1. **`app/api/create-profile/route.ts`** - New server-side API endpoint
2. **`lib/auth/auth-utils.ts`** - Updated to use API endpoint instead of client-side admin client
3. **`FIX_USERS_TABLE.sql`** - Script to fix users table structure

## Environment Variables Required

Ensure these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing the Fix

### 1. Signup Flow Test
1. Navigate to `/signup`
2. Fill in all fields (name, email, phone, college, year, branch, password)
3. Click "Create Account"
4. **Expected**: Profile should be stored immediately in `users` table

### 2. Console Log Verification
During signup, you should see:
```
Starting signup process for: user@example.com
Profile data: { name: "John Doe", phone: "+91 1234567890", ... }
User created successfully, creating profile for user ID: [uuid]
Creating user profile during signup via API: { ... }
Profile created successfully via API: { ... }
```

### 3. Database Verification
```sql
-- Check if profile was stored
SELECT * FROM users WHERE email = 'user@example.com';
-- Should show complete profile data
```

### 4. Registration Flow Test
1. Login with the new account (after email verification)
2. Navigate to `/register`
3. **Expected**: Should NOT show "Complete Your Profile" - should go directly to tier selection

## Benefits of This Approach

1. **Security**: Service role key stays on server side
2. **Reliability**: Proper error handling and validation
3. **Scalability**: Can be extended for other admin operations
4. **Debugging**: Clear API logs for troubleshooting
5. **Client-side simplicity**: Clean separation of concerns

## Troubleshooting

### Issue: API returns 500 error
**Check**: 
- `SUPABASE_SERVICE_ROLE_KEY` is correctly set in environment
- Users table structure is correct (uses `auth.users(id)` reference)

### Issue: Profile still not created
**Check**: 
- Browser network tab for API call status
- API logs in deployment platform
- Console logs for any client-side errors

### Issue: "Complete Your Profile" still shows
**Check**: 
- User record exists in `users` table with all required fields
- `getUserProfile()` function is working correctly

## Production Deployment

1. ✅ Execute `FIX_USERS_TABLE.sql` if users table needs fixing
2. ✅ Deploy the updated code with new API endpoint
3. ✅ Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in production environment
4. ✅ Test the complete signup → registration flow
5. ✅ Monitor API logs for any issues

## Success Criteria

The fix is working when:
- ✅ User completes signup with all profile fields
- ✅ Profile data is immediately stored in `users` table
- ✅ API endpoint returns success response
- ✅ User can proceed directly to registration without profile completion
- ✅ Profile dashboard shows pre-populated data
- ✅ No "Complete Your Profile" prompts appear
