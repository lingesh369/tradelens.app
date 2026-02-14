# Shared Trade Page - FIXED

## Issues Found and Fixed

### 1. Incorrect Foreign Key Reference
**Problem**: The query was using `app_users!fk_trades_user_id(...)` which doesn't exist
**Solution**: Changed to `app_users!user_id(...)` to use the column name directly

### 2. Wrong Field Name in User Data
**Problem**: Code was accessing `userData.user_id` but the query returns `id`
**Solution**: Changed all references from `user_id` to `id` when accessing user data

### 3. Missing Trade Metrics
**Problem**: Trade metrics (P&L, win rate, etc.) were not being fetched
**Solution**: Added `trade_metrics` join to the query with proper field mapping

### 4. Incorrect Trader Profile Query
**Problem**: Using `app_users!user_id(...)` and wrong field `profile_picture_url`
**Solution**: Changed to `app_users(...)` and corrected to `avatar_url`

## Changes Made

### File: src/pages/SharedTradePage.tsx

1. **Trade Query** (Line ~65)
```typescript
// BEFORE
.select(`
  *,
  app_users!fk_trades_user_id(username, email, user_id)
`)

// AFTER
.select(`
  *,
  app_users!user_id(username, email, id),
  trade_metrics(
    net_p_and_l,
    gross_p_and_l,
    percent_gain,
    trade_outcome,
    r2r,
    trade_duration
  )
`)
```

2. **User Data Access** (Line ~113)
```typescript
// BEFORE
tradeOwnerId = userData[0].user_id;
tradeOwnerId = userData.user_id;

// AFTER
tradeOwnerId = userData[0].id;
tradeOwnerId = userData.id;
```

3. **Metrics Mapping** (Line ~90)
```typescript
// ADDED
const metricsRaw = tradeData?.trade_metrics;
const metrics = Array.isArray(metricsRaw) ? metricsRaw[0] : metricsRaw;

const tradeWithSharing: Trade = {
  ...tradeData,
  // Map metrics fields
  net_pl: metrics?.net_p_and_l ?? null,
  percent_gain: metrics?.percent_gain ?? null,
  trade_result: metrics?.trade_outcome ?? null,
  r2r: metrics?.r2r ?? null,
  trade_duration: metrics?.trade_duration ?? null,
  // ... rest of fields
}
```

4. **Trader Profile Query** (Line ~127)
```typescript
// BEFORE
.select(`
  *,
  app_users!user_id(
    username,
    email,
    first_name,
    last_name,
    profile_picture_url
  )
`)

// AFTER
.select(`
  *,
  app_users(
    username,
    email,
    first_name,
    last_name,
    avatar_url
  )
`)
```

## Expected Results

After these fixes:

✅ Shared trade page loads without 400 errors
✅ Trade metrics (P&L, win rate, etc.) display correctly
✅ Trade owner information displays properly
✅ Trader profile data loads correctly
✅ No more "column does not exist" errors

## Testing

1. Share a trade from your trades page
2. Navigate to the shared trade URL
3. Verify all trade details display correctly
4. Check that metrics show proper values
5. Confirm trader profile information appears

## Notes

- The RLS policies for shared trades are correct and allow public viewing
- The issue was purely with the query syntax and field mapping
- Metrics are now properly joined and mapped to the Trade interface
- All field names now match the actual database schema
