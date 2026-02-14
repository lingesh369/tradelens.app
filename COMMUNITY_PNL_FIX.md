# Community Page P&L Display Fix

## Issue
The Net P&L field in the community page trader profiles was displaying as a percentage (e.g., "+1000.0%") instead of as a currency amount with proper formatting (e.g., "$1.5K", "₹1.7M").

## Files Fixed

### 1. `src/components/community/TraderCard.tsx`
- Updated `formatPnL` function to always display currency format with $ sign
- Format: `+$1.50K`, `-$2.30M`, `+$150.00`
- Shows "--" for zero values

### 2. `src/components/profile/ProfileHeader.tsx`
- Updated the `pnl` stat value calculation to use currency formatting
- Applies same formatting logic as TraderCard
- Format: `+$1.50K`, `-$2.30M`, `+$150.00`

## Formatting Logic

The P&L now displays with:
- **Sign**: `+` for positive, `-` for negative
- **Currency symbol**: `$` (can be changed to ₹ or other currencies)
- **Large number formatting**:
  - Values >= 1,000,000: Shows as "M" (millions) - e.g., `$1.50M`
  - Values >= 1,000: Shows as "K" (thousands) - e.g., `$1.50K`
  - Values < 1,000: Shows with 2 decimal places - e.g., `$150.00`
- **Zero values**: Shows as `--`

## Testing

Run the test script to verify:
```bash
node scripts/test-community-page.js
```

The community page should now display trader P&L values in proper currency format across:
- Community page trader cards
- Trader profile headers
- All responsive layouts (desktop, tablet, mobile)

## Status
✅ Fixed and verified
