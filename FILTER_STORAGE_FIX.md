# Filter Storage Fix - All Time Default

## Issue
When users sign up or use the app, they were seeing "Today" filter instead of "All Time" because:
1. Old filter values were persisted in sessionStorage
2. No version control for filter defaults
3. Users couldn't see their historical data without manually changing filters

## Solution
Implemented a versioning system for filter storage that automatically resets filters when defaults change.

## Changes Made

### 1. FilterContext Version Control ✅
**File**: `src/context/FilterContext.tsx`

**Added**:
```typescript
// Version for filter storage - increment when defaults change
const FILTER_VERSION = '2'; // Changed to force reset to "All Time"

const STORAGE_KEYS = {
  DATE_RANGE: 'tradelens_global_date_range',
  SELECTED_ACCOUNTS: 'tradelens_global_selected_accounts',
  VERSION: 'tradelens_filter_version' // NEW
};
```

**Updated loadFromStorage**:
```typescript
const loadFromStorage = (): GlobalFilters => {
  try {
    const savedVersion = sessionStorage.getItem(STORAGE_KEYS.VERSION);
    
    // If version doesn't match, clear old storage and use defaults
    if (savedVersion !== FILTER_VERSION) {
      console.log('Filter version mismatch, resetting to defaults');
      sessionStorage.removeItem(STORAGE_KEYS.DATE_RANGE);
      sessionStorage.removeItem(STORAGE_KEYS.SELECTED_ACCOUNTS);
      sessionStorage.setItem(STORAGE_KEYS.VERSION, FILTER_VERSION);
      return {
        dateRange: getDefaultDateRange(), // "All Time"
        selectedAccounts: getDefaultSelectedAccounts()
      };
    }
    // ... rest of the code
  }
}
```

**Updated saveToStorage**:
```typescript
const saveToStorage = (filters: GlobalFilters) => {
  try {
    sessionStorage.setItem(STORAGE_KEYS.DATE_RANGE, JSON.stringify(filters.dateRange));
    sessionStorage.setItem(STORAGE_KEYS.SELECTED_ACCOUNTS, JSON.stringify(filters.selectedAccounts));
    sessionStorage.setItem(STORAGE_KEYS.VERSION, FILTER_VERSION); // Save version
  } catch (error) {
    console.error('Error saving filters to storage:', error);
  }
};
```

### 2. Clear Storage Tool ✅
**File**: `scripts/clear-filter-storage.html`

Created a browser tool to manually clear filter storage for testing:
- Shows current storage values
- Clear filter storage only
- Clear all storage
- Refresh to see changes

## How It Works

### For New Users
1. No storage exists → defaults to "All Time"
2. Version is set to '2'
3. All data is visible immediately

### For Existing Users
1. Old storage has no version or version '1'
2. Version mismatch detected
3. Old storage cleared automatically
4. Defaults to "All Time"
5. New version '2' saved

### When User Changes Filter
1. User selects different date range (e.g., "This Month")
2. New selection saved to storage with version '2'
3. Selection persists across page refreshes
4. User can always change back to "All Time" or any other range

## Testing

### Test Scenario 1: New User Signup
1. Sign up for new account
2. Navigate to Dashboard
3. ✅ Should see "All Time" filter
4. ✅ Should see all trades (if any exist)

### Test Scenario 2: Existing User with Old Storage
1. Have old storage with "Today" filter
2. Refresh page
3. ✅ Storage automatically cleared
4. ✅ Defaults to "All Time"
5. ✅ All historical data visible

### Test Scenario 3: User Changes Filter
1. Change filter to "This Month"
2. Refresh page
3. ✅ "This Month" persists
4. Change to "This Week"
5. ✅ "This Week" persists
6. Change back to "All Time"
7. ✅ "All Time" persists

### Test Scenario 4: Manual Storage Clear
1. Open `scripts/clear-filter-storage.html` in browser
2. Click "Clear Filter Storage"
3. ✅ Storage cleared
4. Refresh TradeLens app
5. ✅ Defaults to "All Time"

## Files Modified

1. `src/context/FilterContext.tsx` - Added version control
2. `scripts/clear-filter-storage.html` - Created storage clear tool

## User Experience

### Before Fix
- ❌ New users see "Today" filter
- ❌ No trades visible on signup
- ❌ Confusing for users with historical data
- ❌ Manual filter change required

### After Fix
- ✅ New users see "All Time" filter
- ✅ All trades visible immediately
- ✅ Clear and intuitive
- ✅ User preferences still persist when changed

## Future Version Updates

To change defaults in the future:
1. Update `FILTER_VERSION` constant (e.g., '3', '4', etc.)
2. Update `getDefaultDateRange()` or `getDefaultSelectedAccounts()`
3. All users will automatically get new defaults on next page load
4. Their custom selections will be reset (intentional for major changes)

## Backward Compatibility

- Old storage without version → treated as version mismatch → reset to defaults
- Old storage with version '1' → version mismatch → reset to defaults
- Current storage with version '2' → no change → persists user selection

## Notes

- Version is stored in sessionStorage (per-tab)
- Clearing browser data will reset to defaults
- Each tab maintains its own filter state
- Closing tab clears sessionStorage (by design)
- User selections persist within same session
- New session starts with defaults

## Conclusion

✅ Filter storage now has version control
✅ Automatic reset to "All Time" for all users
✅ User preferences still work and persist
✅ Easy to update defaults in future
✅ Clear tool available for testing
