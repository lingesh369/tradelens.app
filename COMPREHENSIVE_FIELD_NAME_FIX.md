# Comprehensive Field Name Fix Summary

## Overview
This document summarizes all the field name mismatches found and fixed across the frontend codebase, particularly related to database schema changes and snake_case vs camelCase issues.

## Database Schema Facts

### app_users Table Structure
```sql
CREATE TABLE app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),  -- This IS the auth user ID
    email TEXT,
    username TEXT,
    -- NO auth_id column
    -- NO user_id column
    ...
);
```

**Key Point:** The `id` field in `app_users` IS the auth user ID. There is NO separate `auth_id` or `user_id` column.

### PostgreSQL Column Naming
PostgreSQL returns column names in **lowercase (snake_case)** by default:
- `accountsLimit` → `accountslimit`
- `strategiesLimit` → `strategieslimit`
- `notesAccess` → `notesaccess`
- `profileAccess` → `profileaccess`
- `isActive` → `isactive`

## Issues Found & Fixed

### 1. **src/hooks/useStrategies.tsx** ✅ FIXED
**Problem:** Trying to query non-existent `auth_id` column in `app_users` table

**Before:**
```typescript
const { data: appUser } = await supabase
  .from("app_users")
  .select("user_id")  // user_id doesn't exist
  .eq("auth_id", userData.user.id)  // auth_id doesn't exist
  .single();

const { data } = await supabase
  .from("strategies")
  .eq("user_id", appUser.user_id);  // appUser.user_id is undefined
```

**After:**
```typescript
// The user.id from auth IS the user_id in other tables
const userId = userData.user.id;

const { data } = await supabase
  .from("strategies")
  .eq("user_id", userId);
```

**Impact:** 
- ❌ Strategies were never loading
- ❌ Creating strategies failed
- ❌ Deleting strategies failed
- ✅ All fixed now

### 2. **src/hooks/useTrades.tsx** ✅ FIXED (Previously)
**Problem:** Using `profile?.user_id` which doesn't exist

**Fixed to:** Use `user?.id` from Auth context

### 3. **src/hooks/useAccounts.tsx** ✅ FIXED (Previously)
**Problem:** Using `profile?.user_id` which doesn't exist

**Fixed to:** Use `user?.id` from Auth context

### 4. **src/hooks/useJournal.tsx** ✅ FIXED (Previously)
**Problem:** Using `profile?.user_id` which doesn't exist

**Fixed to:** Use `user?.id` from Auth context

### 5. **src/hooks/useNotes.tsx** ✅ FIXED (Previously)
**Problem:** Using `profile?.user_id` which doesn't exist

**Fixed to:** Use `user?.id` from Auth context

### 6. **src/hooks/useTags.tsx** ✅ FIXED (Previously)
**Problem:** Using `profile?.user_id` which doesn't exist

**Fixed to:** Use `user?.id` from Auth context

### 7. **src/hooks/useCommissions.tsx** ✅ FIXED (Previously)
**Problem:** Using `profile?.user_id` which doesn't exist

**Fixed to:** Use `user?.id` from Auth context

### 8. **src/hooks/useStrategyLimits.ts** ✅ FIXED
**Problem:** Not handling snake_case from database and unlimited (-1) values

**Fixed to:** 
- Check both `strategieslimit` and `strategiesLimit`
- Handle unlimited (-1) properly

### 9. **src/components/accounts/AccountDialog.tsx** ✅ FIXED
**Problems:**
- Using `profile.user_id` (doesn't exist)
- Using `profile.auth_id` (doesn't exist)
- Not handling snake_case `accountslimit`
- Not handling unlimited (-1)

**Fixed to:**
- Use `user.id`
- Check both `accountslimit` and `accountsLimit`
- Handle unlimited (-1)

### 10. **src/components/trades/enhanced-form/AddAccountDialog.tsx** ✅ FIXED
**Problem:** Not handling snake_case and unlimited

**Fixed to:** Check both cases and handle -1

### 11. **src/components/trades/enhanced-form/AddStrategyDialog.tsx** ✅ FIXED
**Problem:** Not handling snake_case and unlimited

**Fixed to:** Check both cases and handle -1

### 12. **src/pages/Strategies.tsx** ✅ FIXED
**Problem:** Showing "-1" instead of "Unlimited"

**Fixed to:** Display "Unlimited" when limit is -1

### 13. **src/hooks/useChat.tsx** ✅ FIXED
**Problem:** Querying non-existent `auth_id` and `user_id` columns

**Fixed to:** Use `user.id` directly, also fixed field names in select (profile_picture_url → avatar_url)

### 14. **src/hooks/useSubscription.tsx** ✅ FIXED (2 occurrences)
**Problem:** Querying non-existent `auth_id` and `user_id` columns in two places

**Fixed to:** Use `user.id` directly for both subscription and payment history queries

### 15. **src/hooks/usePlanInfo.tsx** ✅ FIXED
**Problem:** Querying non-existent `auth_id` and `user_id` columns

**Fixed to:** Use `user.id` directly

## Already Correct

### ✅ src/context/SubscriptionContext.tsx
- Already handles both snake_case and camelCase
- Already handles unlimited (-1)
- No changes needed

### ✅ src/hooks/usePlanAccess.ts
- Already uses snake_case properly
- Already handles unlimited (-1)
- No changes needed

## Common Patterns to Follow

### 1. Getting User ID
```typescript
// ✅ CORRECT
const { user } = useAuth();
const userId = user?.id;

// ❌ WRONG
const userId = profile?.user_id;  // doesn't exist
const userId = profile?.auth_id;  // doesn't exist
```

### 2. Accessing Database Fields
```typescript
// ✅ CORRECT - Handle both cases
const limit = data.accountslimit ?? data.accountsLimit ?? 0;

// ❌ WRONG - Only checks camelCase
const limit = data.accountsLimit || 0;
```

### 3. Checking Unlimited
```typescript
// ✅ CORRECT
if (limit === -1 || currentCount < limit) {
  // Can create
}

// ❌ WRONG - Doesn't handle unlimited
if (currentCount < limit) {
  // Can create
}
```

### 4. Displaying Limits
```typescript
// ✅ CORRECT
{limit === -1 ? 'Unlimited' : limit}

// ❌ WRONG
{limit}  // Shows "-1" for unlimited
```

## Testing Checklist

- [x] Strategies load correctly
- [x] Can create strategies (respects limits)
- [x] Can delete strategies
- [x] Accounts load correctly
- [x] Can create accounts (respects limits)
- [x] Trades load correctly
- [x] Journal entries load correctly
- [x] Notes load correctly
- [x] Tags load correctly
- [x] Commissions load correctly
- [x] Chats load correctly
- [x] Subscription info loads correctly
- [x] Payment history loads correctly
- [x] Plan info displays correctly
- [x] Pro plan shows "Unlimited"
- [x] Free Trial shows correct limits (2 accounts, 3 strategies)
- [x] Starter Plan shows correct limits (5 accounts, 10 strategies)

## Key Takeaways

1. **app_users.id IS the auth user ID** - No separate auth_id or user_id column
2. **PostgreSQL returns lowercase** - Always check snake_case first
3. **-1 means unlimited** - Always handle this special value
4. **Use user.id from Auth** - Don't use profile.user_id or profile.auth_id
5. **Fallback to camelCase** - For backward compatibility during transition

## Related Documents

- `PROFILE_USER_ID_FIX.md` - Initial profile.user_id fix
- `FRONTEND_LIMITS_FIX.md` - Limits checking fix
- `SUBSCRIPTION_PLANS_LIMITS_GUIDE.md` - Comprehensive limits guide
- `SUBSCRIPTION_PLANS_UPDATE_SUMMARY.md` - Plan structure update

## Migration Notes

If you're migrating from an old schema:
1. The old schema might have had `auth_id` or separate `user_id` columns
2. The new schema uses `id` as the primary key that references `auth.users(id)`
3. All foreign keys in other tables use `user_id` which references `app_users(id)`
4. This is a cleaner, more standard approach

## Future Prevention

To prevent these issues in the future:

1. **Always use TypeScript interfaces** for database responses
2. **Create helper functions** for common database queries
3. **Use the Auth context** for user ID, not profile
4. **Test with different plans** (Free Trial, Starter, Pro)
5. **Check console logs** for database errors
