# Frontend Limits Fix Summary

## Issue
The frontend was incorrectly restricting account and strategy creation because:
1. Database returns snake_case field names (`accountslimit`, `strategieslimit`)
2. Frontend was looking for camelCase (`accountsLimit`, `strategiesLimit`)
3. No handling for unlimited (-1) values
4. Some components were using wrong user ID fields

## Files Fixed

### 1. **src/hooks/useStrategyLimits.ts**
**Changes:**
- Added fallback to check both snake_case and camelCase field names
- Added handling for unlimited (-1) values
- Fixed array handling for database response
- Updated `canCreateStrategy` logic to handle unlimited

**Before:**
```typescript
const limit = userAccess.strategiesLimit || 3;
const canCreateStrategy = currentStrategiesCount < strategiesLimit;
```

**After:**
```typescript
const limit = userAccess.strategieslimit ?? userAccess.strategiesLimit ?? 3;
const canCreateStrategy = strategiesLimit === -1 || currentStrategiesCount < strategiesLimit;
```

### 2. **src/components/accounts/AccountDialog.tsx**
**Changes:**
- Fixed user ID reference from `profile.user_id` to `user.id`
- Fixed auth ID reference from `profile.auth_id` to `user.id`
- Added snake_case fallback for `accountslimit`
- Added unlimited (-1) handling

**Before:**
```typescript
.eq('user_id', profile.user_id)
.rpc('get_user_access_matrix', { auth_user_id: profile.auth_id })
const accountLimit = userAccess.accountsLimit || 0;
if (currentAccountsCount >= accountLimit) { ... }
```

**After:**
```typescript
.eq('user_id', user.id)
.rpc('get_user_access_matrix', { auth_user_id: user.id })
const accountLimit = userAccess.accountslimit ?? userAccess.accountsLimit ?? 0;
if (accountLimit !== -1 && currentAccountsCount >= accountLimit) { ... }
```

### 3. **src/components/trades/enhanced-form/AddAccountDialog.tsx**
**Changes:**
- Added snake_case fallback for `accountslimit`
- Added unlimited (-1) handling

### 4. **src/components/trades/enhanced-form/AddStrategyDialog.tsx**
**Changes:**
- Added snake_case fallback for `strategieslimit`
- Added unlimited (-1) handling

### 5. **src/pages/Strategies.tsx**
**Changes:**
- Updated UI to show "Unlimited" instead of "-1"
- Fixed button text and usage display

**Before:**
```typescript
{currentStrategiesCount}/{strategiesLimit} used
```

**After:**
```typescript
{currentStrategiesCount}/{strategiesLimit === -1 ? 'Unlimited' : strategiesLimit} used
```

## How It Works Now

### For Free Trial Users (2 accounts, 3 strategies)
- Can create up to 2 accounts
- Can create up to 3 strategies
- Shows "2/2 used" or "3/3 used"
- Shows "Limit Reached" when limit hit

### For Starter Plan Users (5 accounts, 10 strategies)
- Can create up to 5 accounts
- Can create up to 10 strategies
- Shows "5/5 used" or "10/10 used"

### For Pro Plan Users (Unlimited)
- Can create unlimited accounts
- Can create unlimited strategies
- Shows "X/Unlimited used"
- Never shows "Limit Reached"

## Database Values

The limits are stored in the `subscription_plans` table:

```json
{
  "limits": {
    "accounts": 5,      // or -1 for unlimited
    "strategies": 10,   // or -1 for unlimited
    "trades": -1,
    "journal_entries": -1,
    "notes": -1
  }
}
```

## Testing

To test the fixes:

1. **Free Trial User:**
   ```sql
   -- Should have limits
   SELECT accountslimit, strategieslimit 
   FROM get_user_access_matrix('user-id');
   -- Expected: 2, 3
   ```

2. **Try creating accounts:**
   - Create 2 accounts → Should succeed
   - Try creating 3rd account → Should show "Limit Exceeded"

3. **Try creating strategies:**
   - Create 3 strategies → Should succeed
   - Try creating 4th strategy → Should show "Limit Exceeded"

4. **Pro Plan User:**
   ```sql
   -- Should have unlimited
   SELECT accountslimit, strategieslimit 
   FROM get_user_access_matrix('pro-user-id');
   -- Expected: -1, -1
   ```

5. **Try creating resources:**
   - Should be able to create unlimited accounts
   - Should be able to create unlimited strategies
   - UI should show "Unlimited"

## Key Points

1. **-1 means unlimited** - Always check for this value
2. **snake_case from DB** - PostgreSQL returns lowercase field names
3. **Fallback to camelCase** - For backward compatibility
4. **Check on both sides** - Frontend for UX, database triggers for security
5. **Use user.id** - Not profile.user_id or profile.auth_id

## Related Files

- `supabase/migrations/20241124000000_subscription_plans_seed_data.sql` - Plan definitions
- `SUBSCRIPTION_PLANS_LIMITS_GUIDE.md` - Comprehensive guide
- `SUBSCRIPTION_PLANS_UPDATE_SUMMARY.md` - Migration summary
- `PROFILE_USER_ID_FIX.md` - Related user ID fix

## Next Steps

1. Apply the subscription plans migration if not done:
   ```bash
   supabase db push
   ```

2. Test with different plan types

3. Verify upgrade prompts work correctly

4. Check that Pro plan users see "Unlimited"
