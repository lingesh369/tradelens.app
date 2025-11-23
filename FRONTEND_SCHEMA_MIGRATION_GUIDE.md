# 🔧 Frontend Schema Migration Guide

## Database Schema Changes Reference

### Primary Key Changes
```typescript
// OLD SCHEMA
app_users.user_id (UUID) - Primary key
app_users.auth_id (UUID) - References auth.users(id)

// NEW SCHEMA  
app_users.id (UUID) - Primary key, references auth.users(id)
// No separate auth_id column
```

### Column Name Changes
```typescript
// OLD → NEW
profile_picture_url → avatar_url
user_status → is_active (boolean) or subscription_status (enum)
```

---

## Global Find & Replace Patterns

### Pattern 1: User ID References in Queries

**OLD**:
```typescript
// Querying app_users table
.from('app_users')
.select('*')
.eq('auth_id', user.id)

// Querying related tables
.from('trades')
.select('*')
.eq('user_id', userData.user_id) // where userData came from app_users
```

**NEW**:
```typescript
// Querying app_users table
.from('app_users')
.select('*')
.eq('id', user.id)

// Querying related tables
.from('trades')
.select('*')
.eq('user_id', user.id) // Direct reference
```

### Pattern 2: Profile Picture URL

**OLD**:
```typescript
profile.profile_picture_url
user.profile_picture_url
trader.profile_picture_url
```

**NEW**:
```typescript
profile.avatar_url
user.avatar_url
trader.avatar_url
```

### Pattern 3: User Status

**OLD**:
```typescript
profile.user_status === 'active'
profile.user_status === 'inactive'
```

**NEW**:
```typescript
profile.is_active === true
profile.is_active === false
// OR for subscription status:
profile.subscription_status === 'active'
```

---

## Component-by-Component Migration

### ✅ Already Updated
1. AuthContext
2. ProfileDetails
3. SubscriptionInfo

### 🔄 Need Verification/Update

#### Community Components
**Files to Check**:
- `src/hooks/useCommunity.tsx`
- `src/components/community/*`

**Expected Issues**:
- May use `profile_picture_url` instead of `avatar_url`
- May reference `user_id` from old schema

**Fix**:
```typescript
// In community queries
app_users (
  username,
  first_name,
  last_name,
  avatar_url  // ✅ Not profile_picture_url
)
```

#### Trading Components
**Files to Check**:
- `src/hooks/useAccounts.tsx`
- `src/hooks/useTrades.tsx`
- `src/hooks/useStrategies.tsx`
- `src/hooks/useJournal.tsx`

**Expected Pattern** (Should already be correct):
```typescript
.from('trades')
.select('*')
.eq('user_id', user.id) // ✅ Correct
```

#### Profile Components
**Files to Check**:
- `src/components/profile/TraderProfileEdit.tsx`
- `src/components/profile/ChatPanel.tsx`

**Expected Issues**:
- Avatar URL references
- User ID references

---

## Automated Migration Steps

### Step 1: Find All Occurrences
```bash
# Find profile_picture_url
grep -r "profile_picture_url" src/ --include="*.ts" --include="*.tsx"

# Find user_status
grep -r "user_status" src/ --include="*.ts" --include="*.tsx"

# Find auth_id
grep -r "auth_id" src/ --include="*.ts" --include="*.tsx"

# Find old user_id patterns
grep -r "userData.user_id" src/ --include="*.ts" --include="*.tsx"
```

### Step 2: Replace Patterns
Use your IDE's find & replace:

1. **Replace profile_picture_url → avatar_url**
   - Find: `profile_picture_url`
   - Replace: `avatar_url`
   - Files: `src/**/*.{ts,tsx}`

2. **Replace user_status checks**
   - Find: `user_status === 'active'`
   - Replace: `is_active === true`
   - Manual review needed for context

3. **Replace auth_id queries**
   - Find: `.eq('auth_id', user.id)`
   - Replace: `.eq('id', user.id)`
   - Only in app_users queries

---

## Hook Verification Checklist

### useAccounts
```typescript
// Should use:
const { data: accounts } = await supabase
  .from('accounts')
  .select('*')
  .eq('user_id', user.id); // ✅ Correct
```

### useTrades
```typescript
// Should use:
const { data: trades } = await supabase
  .from('trades')
  .select(`
    *,
    app_users!inner(
      username,
      first_name,
      last_name,
      avatar_url  // ✅ Not profile_picture_url
    )
  `)
  .eq('user_id', user.id); // ✅ Correct
```

### useStrategies
```typescript
// Should use:
const { data: strategies } = await supabase
  .from('strategies')
  .select('*')
  .eq('user_id', user.id); // ✅ Correct
```

### useCommunity
```typescript
// Should use:
const { data: traders } = await supabase
  .from('trader_profiles')
  .select(`
    *,
    app_users!inner(
      username,
      first_name,
      last_name,
      avatar_url  // ✅ Not profile_picture_url
    )
  `)
  .eq('is_public', true);
```

---

## Type Definitions to Update

### Old Type Definitions
```typescript
interface UserProfile {
  user_id: string;
  auth_id: string;
  profile_picture_url: string;
  user_status: string;
}
```

### New Type Definitions
```typescript
interface UserProfile {
  id: string; // Primary key
  avatar_url: string;
  is_active: boolean;
  subscription_status: string;
}
```

---

## Testing Strategy

### 1. Unit Testing
Test each hook individually:
```typescript
// Test useUserProfile
const { profile } = useUserProfile();
expect(profile?.id).toBeDefined();
expect(profile?.avatar_url).toBeDefined();

// Test useSubscription
const { data: subscription } = useSubscription();
expect(subscription?.subscription_plans).toBeDefined();
```

### 2. Integration Testing
Test complete flows:
- Sign up → Profile creation → Profile display
- Update profile → Cache invalidation → UI update
- Upload avatar → URL update → Display update

### 3. Subscription Testing
Test each tier:
- Free Trial: Limits enforced
- Starter: Correct limits
- Pro: Unlimited access

---

## Common Issues & Solutions

### Issue 1: "Column auth_id does not exist"
**Solution**: Change `.eq('auth_id', user.id)` to `.eq('id', user.id)` for app_users queries

### Issue 2: "profile_picture_url is undefined"
**Solution**: Change to `avatar_url`

### Issue 3: "user_status is undefined"
**Solution**: Use `is_active` (boolean) or `subscription_status` (string)

### Issue 4: "user_id is undefined"
**Solution**: For app_users table, use `id` as primary key

---

## Migration Checklist

### Database Schema
- [x] Migrations applied
- [x] Tables created
- [x] RLS policies active
- [x] Functions created
- [x] Triggers active

### Frontend Core
- [x] AuthContext updated
- [x] Access control system created
- [x] Custom hooks built
- [x] Type definitions created

### Components
- [x] ProfileDetails updated
- [x] SubscriptionInfo updated
- [x] Settings verified
- [ ] Dashboard (next)
- [ ] Trading pages (verify)
- [ ] Community pages (verify)

### Hooks
- [ ] useAccounts (verify)
- [ ] useTrades (verify)
- [ ] useStrategies (verify)
- [ ] useJournal (verify)
- [ ] useCommunity (verify)
- [ ] useAnalytics (verify)

### Edge Functions
- [x] All 24 functions implemented
- [x] Deployed locally
- [ ] Test with frontend

---

## Quick Verification Commands

### Check for Old Patterns
```bash
# Count occurrences
grep -r "profile_picture_url" src/ | wc -l
grep -r "auth_id" src/ | wc -l
grep -r "user_status" src/ | wc -l
grep -r "usePlanAccess" src/ | wc -l
```

### After Migration
All counts should be 0 (except in comments/docs)

---

## Next Actions

1. **Run comprehensive search** for old patterns
2. **Update all occurrences** systematically
3. **Verify all hooks** use correct schema
4. **Test each page** individually
5. **Document any issues** found

---

## Success Criteria

- [ ] No `auth_id` references in queries
- [ ] No `profile_picture_url` references
- [ ] No `user_status` string comparisons
- [ ] All hooks use `user.id` correctly
- [ ] All pages load without errors
- [ ] All CRUD operations work
- [ ] Feature gates work
- [ ] Usage limits enforced

---

**Status**: Ready for systematic migration! 🚀

Let's continue with comprehensive updates across all pages.
