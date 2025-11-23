# Profile user_id vs id Fix - Complete Summary

## Issue Description
Multiple hooks throughout the application were incorrectly trying to access `profile?.user_id` from the `useUserProfile()` hook. However, the `UserProfile` type extends `AppUser` which has an `id` field, not `user_id`. This caused:

1. **Queries never executing** - The `enabled` condition was always false
2. **Data never fetching** - No trades, accounts, notes, etc. were loaded
3. **Dummy data not showing** - The logic couldn't determine if users had real data

## Root Cause
The `UserProfile` interface extends `AppUser`:
```typescript
export interface AppUser {
  id: string;  // ← This is the correct field
  email: string;
  username: string;
  // ... other fields
}

export interface UserProfile extends AppUser {
  trader_profile?: TraderProfile;
}
```

But hooks were trying to access `profile?.user_id` which doesn't exist.

## Solution
Changed all hooks to use `user?.id` directly from the Auth context instead of `profile?.user_id`:

```typescript
// Before (WRONG):
const { profile } = useUserProfile();
if (!profile?.user_id) return [];

// After (CORRECT):
const { user } = useAuth();
const userId = user?.id;
if (!userId) return [];
```

## Files Fixed

### 1. **src/hooks/useTrades.tsx**
- Changed query key from `["trades", profile?.user_id]` to `["trades", userId]`
- Updated all mutations to use `userId` instead of `profile?.user_id`
- Fixed dummy data generation to use `userId`

### 2. **src/hooks/useAccounts.tsx**
- Changed query key from `["accounts", profile?.user_id]` to `["accounts", userId]`
- Updated all CRUD operations to use `userId`
- Fixed all query invalidations

### 3. **src/hooks/useJournal.tsx**
- Added `useAuth` import
- Changed query key from `["journal", profile?.user_id]` to `["journal", userId]`
- Updated all journal operations (create, update, delete) to use `userId`
- Fixed cache keys to use `userId`

### 4. **src/hooks/useNotes.tsx**
- Changed query key from `["notes", profile?.user_id]` to `["notes", userId]`
- Updated all note operations to use `userId`
- Fixed all query invalidations

### 5. **src/hooks/useTags.tsx**
- Changed query key from `["tags", profile?.user_id]` to `["tags", userId]`
- Updated all tag operations to use `userId`
- Fixed all query invalidations

### 6. **src/hooks/useCommissions.tsx**
- Changed query key from `["commissions", profile?.user_id]` to `["commissions", userId]`
- Updated all commission operations to use `userId`
- Fixed all query invalidations

## Impact
This fix resolves:
- ✅ Trades not loading for users
- ✅ Dummy trades not showing for new users
- ✅ Accounts not loading
- ✅ Journal entries not loading
- ✅ Notes not loading
- ✅ Tags not loading
- ✅ Commission structures not loading
- ✅ All related CRUD operations failing silently

## Additional Fix: Trade Detail Page Loading State

### Issue
The TradeDetailPage was stuck in loading state when viewing dummy trades because `isLoading` from `useTrades` was still `true` even though dummy data was available.

### Solution
Updated the `isLoading` return value in `useTrades` to check if dummy data is being shown:

```typescript
// Before:
isLoading: tradesQuery.isLoading,

// After:
isLoading: isShowingDummyData ? false : tradesQuery.isLoading,
```

This ensures that when dummy data is displayed, the loading state is `false`, allowing the TradeDetailPage to render properly.

## Testing Recommendations
1. Test with a new user account (should see dummy trades)
2. Click on a dummy trade to view details (should load immediately, not stuck)
3. Add a real trade (dummy trades should disappear)
4. Test all CRUD operations for:
   - Trades
   - Accounts
   - Journal entries
   - Notes
   - Tags
   - Commissions

## Additional Notes
- The `useStrategies` hook was already using a different pattern (fetching user_id from app_users table) so it wasn't affected
- All TypeScript diagnostics pass with no errors
- The fix maintains backward compatibility with existing data
- Dummy trade detail pages now load correctly without being stuck in loading state
