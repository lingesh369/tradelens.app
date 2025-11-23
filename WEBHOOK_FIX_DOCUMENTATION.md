# Webhook Fix Documentation

## Problem Summary
The user signup webhook was failing to create user profiles in the `app_users` table, causing new users (especially Google signups) to not have proper profiles created.

## Root Cause Analysis
1. **Parameter Name Mismatch**: The Edge Function was calling RPC functions with incorrect parameter names
2. **Timing Issue**: The webhook was triggering before the `auth.users` record was fully committed
3. **Silent Failures**: No proper error logging made debugging difficult

## Solution Implemented

### 1. Fixed Parameter Names
**Before (Incorrect):**
```typescript
.rpc('create_app_user_profile', {
  user_id: userId,
  email: email,           // ❌ Wrong
  first_name: firstName,  // ❌ Wrong
  last_name: lastName,    // ❌ Wrong
  username: username,     // ❌ Wrong
  signup_source: signupSource // ❌ Wrong
})
```

**After (Correct):**
```typescript
.rpc('create_app_user_profile', {
  user_id: userId,
  user_email: email,           // ✅ Correct
  user_first_name: firstName,  // ✅ Correct
  user_last_name: lastName,    // ✅ Correct
  user_username: username,     // ✅ Correct
  user_signup_source: signupSource // ✅ Correct
})
```

### 2. Added Timing Delay
```typescript
// Add delay to ensure auth.users record is fully committed
await new Promise(resolve => setTimeout(resolve, 1500));
```

### 3. Fixed Both RPC Calls
- `create_app_user_profile`: Fixed all 6 parameters
- `create_additional_user_profiles`: Fixed `email` → `user_email`

## Files Modified
- `supabase/functions/create-user-profile/index.ts`

## Testing
- ✅ Created test user: `d85533bb-ba51-4c70-9902-9c2386f4430b`
- ✅ Verified `app_users` record creation
- ✅ Verified `user_subscriptions_new` record creation
- ✅ Edge Function logs show 200 status code
- ✅ Execution time: ~6.2 seconds (includes 1.5s delay)

## Monitoring
- Created `monitor-webhook.js` script to check for orphaned users
- Created `test-webhook-signup.js` for testing new signups
- Monitor Edge Function logs at: https://supabase.com/dashboard/project/tzhhxeyisppkzyjacodu/functions

## Prevention Steps
1. **Always test parameter names** when calling RPC functions
2. **Add appropriate delays** for database consistency
3. **Monitor Edge Function logs** regularly
4. **Run monitoring script** weekly to catch issues early

## Commands for Future Reference

### Deploy Edge Function
```bash
npx supabase functions deploy create-user-profile
```

### Test Webhook
```bash
node test-webhook-signup.js
```

### Monitor Health
```bash
node monitor-webhook.js
```

### Check Logs
```bash
# Via Supabase CLI (if configured)
npx supabase functions logs create-user-profile

# Or check dashboard:
# https://supabase.com/dashboard/project/tzhhxeyisppkzyjacodu/functions
```

## Key Learnings
1. **Parameter naming is critical** - RPC functions expect exact parameter names
2. **Database timing matters** - Webhooks can trigger before records are committed
3. **Proper testing is essential** - Always test the complete signup flow
4. **Monitoring prevents issues** - Regular health checks catch problems early

## Date Fixed
October 6, 2025

## Status
✅ **RESOLVED** - Webhook now successfully creates user profiles for all signup methods