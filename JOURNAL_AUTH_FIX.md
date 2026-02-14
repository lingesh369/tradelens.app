# Journal Authentication Fix

## Issues Found

Based on the screenshots provided, there were two critical errors:

1. **"User not authenticated"** - Error in Trading Calendar section
2. **"User profile not loaded"** - Error when trying to save journal notes

## Root Cause

The hooks were using incorrect field names to access the user profile:
- Using `profile?.user_id` instead of `profile?.id`
- Using `profile?.auth_id` instead of `profile?.id`

The `UserProfile` type extends `AppUser` which has `id` as the primary field (the auth user ID), not `user_id` or `auth_id`.

## Files Fixed

### 1. `src/hooks/useSimpleJournal.tsx`
**Changes:**
- Changed `profile?.user_id` to `profile?.id` in `getJournalByDate`
- Changed `profile.user_id` to `profile.id` in database queries
- Updated dependency array from `[profile?.user_id]` to `[profile?.id]`

**Impact:** Fixes the "User profile not loaded" error when saving notes

### 2. `src/hooks/useJournalImages.tsx`
**Changes:**
- Changed all `profile?.user_id` to `profile?.id`
- Changed all `profile?.auth_id` to `profile?.id`
- Updated storage paths to use `profile.id` instead of `profile.auth_id`
- Updated dependency arrays accordingly

**Impact:** Fixes image upload and deletion functionality

### 3. `src/hooks/useJournal.tsx`
**Status:** Already correct, no changes needed

## Technical Details

### UserProfile Type Structure
```typescript
interface AppUser {
  id: string;  // This is the auth user ID
  email: string;
  username: string;
  // ... other fields
}

interface UserProfile extends AppUser {
  trader_profile?: TraderProfile;
}
```

### Correct Usage
```typescript
// ✅ CORRECT
if (!profile?.id) return null;
const userId = profile.id;

// ❌ INCORRECT
if (!profile?.user_id) return null;  // user_id doesn't exist
if (!profile?.auth_id) return null;  // auth_id doesn't exist
```

## Testing Checklist

After these fixes, test the following:

- [ ] Journal page loads without errors
- [ ] No "User not authenticated" error in Trading Calendar
- [ ] No "User profile not loaded" error when typing notes
- [ ] Can save journal notes successfully
- [ ] Can upload images to journal
- [ ] Can delete images from journal
- [ ] Can link images to trades
- [ ] All three tabs (Notes, Trades, Images) work correctly

## Why This Happened

The confusion likely arose from:
1. Database tables using `user_id` as foreign key column name
2. Profile object using `id` as the primary identifier
3. Previous code possibly using different field names

## Prevention

To prevent similar issues:
1. Always check the TypeScript type definitions
2. Use TypeScript strict mode to catch these errors
3. Consistent naming: database `user_id` columns reference `app_users.id`

## Related Files

- `src/lib/types/user.ts` - UserProfile type definition
- `src/hooks/useUserProfile.ts` - Profile loading hook
- `src/context/AuthContext.tsx` - Authentication context

## Next Steps

1. Refresh your browser to clear any cached errors
2. Test journal functionality
3. If issues persist, check browser console for specific errors
4. Verify database migration was applied successfully
