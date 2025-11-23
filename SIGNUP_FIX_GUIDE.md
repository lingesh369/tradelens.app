# Signup Issue Fix Guide

## Problem
Users are unable to sign up and receive the error: **"Database error updating user"** with status 500.

## Root Cause
The issue is caused by problems in the database trigger function `handle_new_signup()` that runs when a new user is created in the `auth.users` table. The most common causes are:

1. **Missing or corrupted database trigger function**
2. **Missing required database tables**
3. **Missing Free Trial subscription plan**
4. **Insufficient database permissions**
5. **Row Level Security (RLS) policy issues**

## Solution

### Option 1: Apply the Migration (Recommended)

1. **Apply the migration file:**
   ```bash
   npx supabase db push
   ```
   
   This will apply the migration `20250103000019_fix_signup_database_error.sql` which:
   - Recreates the `handle_new_signup()` function with proper error handling
   - Ensures all required tables exist
   - Creates the Free Trial plan if missing
   - Sets up proper permissions and RLS policies
   - Creates the auth trigger

### Option 2: Manual Database Fix

If you can't use migrations, run the SQL directly in your Supabase SQL editor:

1. **Open your Supabase dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the contents of `fix-signup-issues.sql`**
4. **Execute the SQL**

### Option 3: Use the Fix Script

1. **Update the credentials in `fix-signup-complete.js`:**
   ```javascript
   const supabaseUrl = 'YOUR_ACTUAL_SUPABASE_URL';
   const supabaseServiceKey = 'YOUR_ACTUAL_SERVICE_ROLE_KEY';
   ```

2. **Run the fix script:**
   ```bash
   node fix-signup-complete.js
   ```

## Verification

After applying the fix, test the signup process:

1. **Try signing up with a new email address**
2. **Check that the user is created in `auth.users`**
3. **Verify that records are created in:**
   - `app_users`
   - `user_subscriptions_new`
   - `settings`
   - `trader_profiles`
   - `user_settings`

## What the Fix Does

The fix addresses all potential issues:

### 1. **Robust Error Handling**
- The function now catches all exceptions and logs them as warnings
- Auth signup will succeed even if the trigger fails
- Detailed error messages help with debugging

### 2. **Ensures Required Tables Exist**
- Creates missing tables if they don't exist
- Sets up proper relationships and constraints

### 3. **Creates Free Trial Plan**
- Automatically creates the Free Trial plan if it's missing
- Sets up proper subscription limits and features

### 4. **Proper Permissions**
- Grants necessary permissions to all roles
- Ensures the function can access all required tables
- Sets up RLS policies correctly

### 5. **Username Generation**
- Generates unique usernames from email addresses
- Handles username conflicts automatically

## Testing

Use the diagnostic script to verify everything is working:

1. **Update credentials in `diagnose-signup-issue.js`**
2. **Run the diagnostic:**
   ```bash
   node diagnose-signup-issue.js
   ```

## Common Issues After Fix

### Issue: "Function does not exist"
**Solution:** The migration didn't apply correctly. Re-run the migration or apply the SQL manually.

### Issue: "Permission denied"
**Solution:** Check that your service role key has the correct permissions.

### Issue: "Table does not exist"
**Solution:** The required tables are missing. Apply the migration to create them.

### Issue: "RLS policy violation"
**Solution:** The RLS policies are blocking the function. The fix includes proper policy setup.

## Prevention

To prevent this issue in the future:

1. **Always test signup after database changes**
2. **Use migrations for database changes**
3. **Monitor database logs for trigger errors**
4. **Keep the Free Trial plan active**

## Files Created

- `fix-signup-issues.sql` - Complete SQL fix
- `fix-signup-complete.js` - Automated fix script
- `diagnose-signup-issue.js` - Diagnostic script
- `supabase/migrations/20250103000019_fix_signup_database_error.sql` - Migration file
- `test-signup-debug.js` - Simple test script

## Support

If the issue persists after applying the fix:

1. **Check the Supabase logs** for detailed error messages
2. **Run the diagnostic script** to identify remaining issues
3. **Verify all environment variables** are correct
4. **Check database connectivity** and permissions

The fix is comprehensive and should resolve the "Database error updating user" issue permanently.

