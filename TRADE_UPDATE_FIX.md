# Trade Update Fix - Immediate Refetch

## Issue
When editing a trade, the changes weren't showing up immediately in the UI. Users had to manually refresh the page to see updates.

## Root Cause
The `updateTradeMutation` in `useTrades` hook was only invalidating the query cache but not forcing an immediate refetch like the create mutation does.

## Solution
Updated the `updateTradeMutation` to immediately refetch trades after a successful update, matching the behavior of `createTradeMutation`.

## Changes Made

### File: `src/hooks/useTrades.tsx`

**Before**:
```typescript
const updateTradeMutation = useMutation({
  mutationFn: async (tradeData: Partial<Trade> & { id: string }) => {
    // ... mutation logic
    return updateTrade(processedData);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["trades", userId] });
    toast({
      title: "Trade updated successfully",
    });
  },
  // ...
});
```

**After**:
```typescript
const updateTradeMutation = useMutation({
  mutationFn: async (tradeData: Partial<Trade> & { id: string }) => {
    // ... mutation logic
    return updateTrade(processedData);
  },
  onSuccess: (data) => {
    console.log('Trade updated successfully:', data);
    // Invalidate and refetch trades immediately
    queryClient.invalidateQueries({ queryKey: ["trades", userId] });
    queryClient.refetchQueries({ queryKey: ["trades", userId] });
    console.log('Refetching trades for user:', userId);
    toast({
      title: "Trade updated successfully",
    });
  },
  // ...
});
```

## How It Works

### Update Flow
1. User edits trade in TradeEditModal
2. Form submits → calls `updateTrade()` from `useTrades` hook
3. Mutation executes → updates database
4. `onSuccess` callback:
   - Invalidates query cache (marks data as stale)
   - **Immediately refetches** trades from database
   - Shows success toast
5. React Query updates component with fresh data
6. UI reflects changes instantly

### Handles All Cases

#### Regular Trade Update
- Change entry/exit prices
- Update quantity
- Modify strategy, account, etc.
- ✅ Changes show immediately

#### Partial Exit Updates
- Add partial exits
- Modify existing partial exits
- Update remaining quantity
- ✅ Metrics recalculate and display

#### Old Trade Edits
- Edit historical trades
- Change dates
- Update notes
- ✅ All changes persist and display

## Testing

### Test Scenario 1: Simple Price Update
1. Open trade detail page
2. Click edit
3. Change exit price
4. Save
5. ✅ New price shows immediately
6. ✅ P&L recalculates
7. ✅ Metrics update

### Test Scenario 2: Add Partial Exit
1. Open trade with no partial exits
2. Click edit
3. Add partial exit row
4. Fill in quantity and price
5. Save
6. ✅ Status changes to "partially_closed"
7. ✅ Remaining quantity updates
8. ✅ Weighted exit price calculates

### Test Scenario 3: Edit Old Trade
1. Find trade from last week
2. Edit entry date
3. Change strategy
4. Save
5. ✅ Changes persist
6. ✅ Trade shows in correct date filter
7. ✅ Strategy stats update

## Additional Benefits

### Consistency
- Update behavior now matches create behavior
- Both immediately refetch after success
- Predictable user experience

### Debugging
- Added console logs for tracking
- Easier to debug refetch issues
- Clear visibility into update flow

### Performance
- Immediate refetch ensures fresh data
- No stale data issues
- Cache invalidation + refetch = always current

## Files Modified

1. `src/hooks/useTrades.tsx` - Added immediate refetch to updateTradeMutation

## Related Components

These components benefit from the fix:
- `TradeEditModal` - Edit form
- `TradeDetail` - Trade detail page
- `TradeDetailPage` - Page wrapper
- `Dashboard` - Shows updated metrics
- `Trades` - Shows updated trade list
- `Journal` - Shows updated daily stats

## Conclusion

✅ Trade updates now show immediately
✅ No manual refresh needed
✅ Works for all update types (regular, partial exits, old trades)
✅ Consistent with create behavior
✅ Better user experience
