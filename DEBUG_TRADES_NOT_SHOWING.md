# 🐛 Debug: Trades Not Showing on Dashboard

## Issue
Trades are being created successfully in the database but not appearing on the Dashboard.

## Root Cause Analysis

### Possible Causes:
1. **Date Range Filter** - Dashboard filters trades by date range
2. **Session Storage** - Cached filters from previous session
3. **React Query Cache** - Stale data in React Query
4. **Account Filter** - Trades filtered by account selection
5. **Authentication** - User ID mismatch

## Quick Fixes

### Fix 1: Clear Browser Cache & Filters
1. Open: `scripts/clear-browser-cache.html` in your browser
2. Click "Clear Everything"
3. Click "Refresh Page"
4. Login again
5. Check if trades appear

### Fix 2: Reset Date Filter to "All Time"
1. On Dashboard, look for date filter dropdown
2. Select "All Time" from the dropdown
3. Trades should appear

### Fix 3: Hard Refresh Browser
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### Fix 4: Clear Session Storage via Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run:
```javascript
sessionStorage.clear();
localStorage.clear();
location.reload();
```

## Detailed Debugging Steps

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for these log messages:
   - "Fetching trades for user ID: ..."
   - "Fetched X trades from database"
   - "Dashboard filtering trades with global filters"
   - "Total trades before filtering: X"
   - "Dashboard filtered trades count: X"

### Step 2: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "trades"
4. Refresh page
5. Check the response:
   - Should see a request to `/rest/v1/trades`
   - Response should contain your trades
   - Check the count in response

### Step 3: Check Application Storage
1. Open DevTools (F12)
2. Go to Application tab
3. Check Session Storage:
   - Look for `tradelens_global_date_range`
   - Check the date range values
4. Check Local Storage:
   - Look for Supabase auth tokens

### Step 4: Verify Trade in Database
Run this script:
```bash
node scripts/debug-dashboard-issue.js
```

Expected output:
- Should show your new trade (KAITOUSD)
- Should show total of 19 trades
- Should confirm trade is accessible

### Step 5: Check Date Range
The most common issue is date filtering. Check:

1. **What's the current date filter?**
   - Open browser console
   - Look for log: "Date range filter: ..."
   - Should show: `{ from: Date, to: Date, preset: "allTime" }`

2. **What's the trade entry_time?**
   - Check console logs for: "Trade KAITOUSD: ..."
   - Compare with filter range

3. **Is the trade within range?**
   - If trade entry_time is outside the filter range, it won't show

## Common Issues & Solutions

### Issue 1: Date Filter Too Restrictive
**Symptom:** Trades exist but dashboard shows 0 trades

**Solution:**
```javascript
// In browser console:
sessionStorage.setItem('tradelens_global_date_range', JSON.stringify({
  from: new Date('2020-01-01').toISOString(),
  to: new Date('2030-12-31').toISOString(),
  preset: 'allTime'
}));
location.reload();
```

### Issue 2: Account Filter Active
**Symptom:** Some trades show but not all

**Solution:**
1. Check if "All Accounts" is selected
2. Or select the specific account for your trade

### Issue 3: React Query Cache
**Symptom:** Old data showing, new trades not appearing

**Solution:**
```javascript
// In browser console:
// Force refetch
window.location.reload(true);
```

### Issue 4: User ID Mismatch
**Symptom:** No trades show at all

**Solution:**
1. Check console for user ID
2. Verify it matches the database
3. Run: `node scripts/debug-dashboard-issue.js`

## Verification Checklist

After applying fixes, verify:

- [ ] Browser console shows correct trade count
- [ ] Network tab shows trades in response
- [ ] Date filter is set to "All Time" or appropriate range
- [ ] Account filter is set to "All Accounts" or correct account
- [ ] No errors in console
- [ ] Trades appear on Dashboard
- [ ] Statistics are correct
- [ ] Charts render properly

## Manual Override (Temporary)

If you need to see trades immediately while debugging:

### Option 1: Disable Date Filtering
Edit `src/pages/Dashboard.tsx`:

```typescript
const filteredTrades = useMemo(() => {
  // TEMPORARY: Return all trades without filtering
  return trades;
  
  // Original filtering code commented out
  // if (trades.length === 0) return trades;
  // ...
}, [trades]);
```

### Option 2: Force "All Time" Filter
Edit `src/context/FilterContext.tsx`:

```typescript
const getDefaultDateRange = (): DateRange => ({
  from: new Date('2000-01-01'),
  to: new Date('2099-12-31'),
  preset: 'allTime'
});
```

## Testing After Fix

1. **Add a new trade:**
   - Use today's date
   - Use the test account
   - Submit form

2. **Verify it appears:**
   - Should show immediately on Dashboard
   - Should appear in trades list
   - Statistics should update

3. **Test filtering:**
   - Change date range to "Today"
   - Should only show today's trades
   - Change back to "All Time"
   - Should show all trades

## Debug Script Output

When you run `node scripts/debug-dashboard-issue.js`, you should see:

```
✅ User ID: cb818590-8948-473c-aa3b-aba4ca99660a
✅ Found 19 total trades
✅ Frontend query returned 19 trades
✅ All trades are accessible via frontend query
```

If you see different numbers, there's a query issue.

## Still Not Working?

### Check These:
1. Is Supabase running? `npm run supabase:status`
2. Is dev server running? Check http://localhost:8081
3. Are you logged in? Check for auth token in Application tab
4. Is the correct user logged in? Check console for user ID
5. Are there any errors in console? Fix those first

### Get More Info:
```bash
# Check database directly
node scripts/verify-trade-display.js

# Check API
node scripts/test-add-trade-api.js

# Check user and trades
node scripts/debug-dashboard-issue.js
```

### Nuclear Option (Reset Everything):
```bash
# Stop everything
npm run supabase:stop

# Reset database
npm run supabase:reset

# Start again
npm run supabase:start

# Recreate test data
node scripts/test-trade-flow.js
node scripts/confirm-test-user.js
node scripts/test-multiple-trades.js

# Clear browser
# Open scripts/clear-browser-cache.html
# Click "Clear Everything"

# Restart dev server
npm run dev
```

## Expected Behavior

After fixing, you should see:

1. **Dashboard:**
   - Total trades: 19
   - Win rate: ~81%
   - Total P&L: ~$1,843
   - Recent trades list showing latest trades
   - Charts with data

2. **Console Logs:**
   ```
   Fetching trades for user ID: cb818590-8948-473c-aa3b-aba4ca99660a
   Fetched 19 trades from database
   Dashboard filtering trades with global filters
   Total trades before filtering: 19
   Dashboard filtered trades count: 19
   ```

3. **Network Tab:**
   - Request to `/rest/v1/trades?user_id=eq.cb818590...`
   - Response with 19 trades
   - Status: 200 OK

## Contact Support

If none of these fixes work:
1. Share browser console output
2. Share network tab screenshot
3. Share output of `node scripts/debug-dashboard-issue.js`
4. Describe what you see vs what you expect
