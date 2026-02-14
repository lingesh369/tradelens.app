# Critical Schema Mismatch Issue

## Problem

Your codebase has a critical schema mismatch:

### Actual Database Schema:
```sql
CREATE TABLE app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    ...
);
```

### What Your Code Expects:
```typescript
app_users: {
  Row: {
    auth_id: string  // ❌ DOES NOT EXIST
    user_id: string  // ❌ DOES NOT EXIST (this is just 'id')
    email: string
    ...
  }
}
```

## Impact

This causes 400 Bad Request errors throughout your app:
- `column app_users.user_id does not exist`
- `column app_users.auth_id does not exist`

## Root Cause

The TypeScript types in `src/integrations/supabase/types.ts` and `types/database.types.ts` don't match your actual database schema.

## Solution Options

### Option 1: Fix TypeScript Types (RECOMMENDED)

Regenerate your types from the actual database:

```bash
# Generate types from your local Supabase
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

This will create types that match your actual schema where:
- `app_users.id` is the primary key (UUID)
- `app_users.id` = `auth.users.id` (same value, direct reference)

### Option 2: Update Database Schema (NOT RECOMMENDED)

Add the columns your code expects:

```sql
ALTER TABLE app_users 
  ADD COLUMN auth_id UUID REFERENCES auth.users(id),
  ADD COLUMN user_id UUID DEFAULT gen_random_uuid();
```

But this creates redundancy and confusion.

## Files Affected

Over 30 files are using the wrong column names:

### Hooks:
- `src/hooks/useAppUserId.tsx` ✅ FIXED
- `src/hooks/useUserProfile.tsx`
- `src/hooks/useSubscription.tsx`
- `src/hooks/useAnalyticsAccess.tsx`
- `src/hooks/useTradeAnalysis.ts`
- `src/hooks/useStrategyAnalysis.ts`
- `src/hooks/useChat.tsx`
- `src/hooks/useJournalImages.tsx`
- `src/hooks/useCommunity.tsx`
- `src/hooks/useStrategyRules.tsx`

### Components:
- `src/components/ui/profile-picture-upload.tsx`
- `src/components/strategies/*.tsx` (multiple files)
- `src/components/profile/*.tsx` (multiple files)
- `src/components/community/LeaderboardCard.tsx`

### Services:
- `src/services/adminSecurityService.ts`
- `src/lib/user-profile.ts`

### Edge Functions:
- `supabase/functions/trader-profile/index.ts`
- `supabase/functions/community-*.ts` (multiple files)
- `supabase/functions/capture-paypal-order/index.ts`

### Pages:
- `src/pages/TraderProfile.tsx`

## Quick Fix Steps

### 1. Regenerate Types
```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### 2. Update Common Pattern

Replace this pattern:
```typescript
// ❌ WRONG
.from('app_users')
.select('user_id')
.eq('auth_id', user.id)
```

With:
```typescript
// ✅ CORRECT
.from('app_users')
.select('id')
.eq('id', user.id)
```

### 3. Update Type Interfaces

Replace:
```typescript
// ❌ WRONG
interface UserProfile {
  user_id: string;
  auth_id: string;
}
```

With:
```typescript
// ✅ CORRECT
interface UserProfile {
  id: string;  // This IS the auth user ID
}
```

## Understanding the Schema

In your database:
- `auth.users.id` = User's authentication ID (UUID)
- `app_users.id` = Same as `auth.users.id` (foreign key reference)
- There is NO separate `user_id` or `auth_id` column

When you query:
```typescript
const { data } = await supabase
  .from('app_users')
  .select('id, email, username')
  .eq('id', user.id)  // user.id from auth context
  .single();

// data.id === user.id (they're the same!)
```

## Next Steps

1. Run: `supabase gen types typescript --local > src/integrations/supabase/types.ts`
2. Search and replace `auth_id` with `id` in queries
3. Search and replace `user_id` with `id` where it refers to app_users
4. Test thoroughly

## Automated Fix Script

I can create a script to automatically fix the most common patterns. Would you like me to do that?
