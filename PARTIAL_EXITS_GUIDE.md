# 📊 Partial Exits Guide

## Overview

Partial exits allow you to close portions of your trade at different price levels, enabling better risk management and profit-taking strategies.

## ✅ What's Fixed

### Issues Resolved:
1. ✅ **Metrics Calculation** - Now calculates correctly for partially_closed trades
2. ✅ **Database Trigger** - Triggers metrics calculation for both 'closed' and 'partially_closed' status
3. ✅ **Trade Edit Modal** - Fixed `id` vs `trade_id` parameter issue
4. ✅ **Weighted Exit Price** - Properly calculates weighted average exit price
5. ✅ **Remaining Quantity** - Tracks remaining open quantity correctly

## How Partial Exits Work

### Trade Status Flow:
```
open → partially_closed → closed
```

- **open**: No exits yet
- **partially_closed**: Some quantity exited, some remaining
- **closed**: All quantity exited

### Metrics Calculation:

For **partially_closed** trades:
- Metrics are calculated based on the **exited quantity only**
- Remaining quantity is not included in P&L calculations
- Weighted average exit price is used

For **closed** trades:
- All quantity is included in calculations
- Final P&L reflects complete trade

## Example Scenarios

### Scenario 1: Partial Exit (70% closed)

```
Entry: $150 x 100 shares
Exit 1: $152 x 30 shares (30% closed)
Exit 2: $154 x 40 shares (40% more closed)
Remaining: 30 shares (30% still open)

Status: partially_closed
Total Exited: 70 shares
Weighted Exit Price: $153.14
Gross P&L: ($153.14 - $150) × 70 = $220.00
Net P&L: $220.00 - $2.50 (fees) = $217.50
```

### Scenario 2: Fully Closed with Partial Exits

```
Entry: $200 x 100 shares
Exit 1: $202 x 50 shares
Exit 2: $205 x 50 shares
Remaining: 0 shares

Status: closed
Total Exited: 100 shares
Weighted Exit Price: $203.50
Gross P&L: ($203.50 - $200) × 100 = $350.00
Net P&L: $350.00 - $3.00 (fees) = $347.00
```

## Using Partial Exits in the UI

### Adding Partial Exits:

1. **Create Trade**:
   - Enter initial position details
   - Add first exit row
   - Click "Add Row" for additional exits
   - Each exit row represents a partial exit

2. **Edit Trade**:
   - Click on trade to view details
   - Click "Edit" button
   - Add more exit rows for additional partial exits
   - Save changes

### Trade Edit Modal:

The modal shows:
- **Main Entry Row**: Your initial position
- **Exit Rows**: Each partial exit with:
  - Date & Time
  - Quantity
  - Price
  - Fee

**Adding More Exits**:
1. Click "Add Row" button
2. Select opposite action (sell for long, buy for short)
3. Enter exit details
4. Save

## Database Structure

### Trades Table Fields:

```sql
quantity              -- Total initial quantity
exit_price            -- Weighted average exit price
status                -- 'open', 'partially_closed', or 'closed'
total_exit_quantity   -- Total quantity exited
remaining_quantity    -- Quantity still open
partial_exits         -- JSONB array of exit details
```

### Partial Exits JSON Format:

```json
[
  {
    "action": "sell",
    "datetime": "2026-02-08T10:00:00Z",
    "quantity": 30,
    "price": 152.00,
    "fee": 1.00
  },
  {
    "action": "sell",
    "datetime": "2026-02-08T12:00:00Z",
    "quantity": 40,
    "price": 154.00,
    "fee": 1.50
  }
]
```

## Metrics Calculation Logic

### For Partially Closed Trades:

```javascript
// Use exited quantity only
const exitedQuantity = total_exit_quantity;

// Calculate P&L on exited portion
const grossPnL = (weightedExitPrice - entryPrice) * exitedQuantity;
const netPnL = grossPnL - totalFees;

// Percent gain based on exited portion
const costBasis = entryPrice * exitedQuantity;
const percentGain = (netPnL / costBasis) * 100;

// R-Multiple uses original risk (full quantity)
const riskAmount = Math.abs(entryPrice - stopLoss) * originalQuantity;
const rMultiple = netPnL / riskAmount;
```

### Weighted Exit Price Calculation:

```javascript
const weightedExitPrice = partialExits.reduce((sum, exit) => {
  return sum + (exit.quantity * exit.price);
}, 0) / totalExitQuantity;
```

## Testing Partial Exits

### Run Test Script:

```bash
node scripts/test-partial-exits.js
```

This creates:
1. A partially closed trade (70% exited)
2. A fully closed trade with partial exits (100% exited)
3. Verifies metrics are calculated correctly

### Expected Results:

```
✅ Partially closed trade created
✅ Metrics calculated for partial exits
✅ Weighted exit price correct
✅ Remaining quantity tracked
✅ Status updates correctly
```

## Common Use Cases

### 1. Scaling Out (Taking Profits)

```
Entry: 100 shares @ $100
Exit 1: 33 shares @ $105 (take 1/3 off at +5%)
Exit 2: 33 shares @ $110 (take 1/3 off at +10%)
Exit 3: 34 shares @ $115 (close remaining at +15%)
```

### 2. Risk Management

```
Entry: 100 shares @ $100
Stop Loss: $95
Exit 1: 50 shares @ $105 (secure profit, reduce risk)
Move stop to breakeven on remaining 50 shares
Exit 2: 50 shares @ $110 (close remaining)
```

### 3. Pyramiding (Adding to Winners)

```
Entry 1: 50 shares @ $100
Entry 2: 30 shares @ $105 (add to position)
Entry 3: 20 shares @ $110 (add more)
Exit 1: 50 shares @ $115
Exit 2: 50 shares @ $120
```

## Dashboard Display

### Trade List:
- Shows weighted exit price
- Displays "Partially Closed" badge
- Shows remaining quantity
- Calculates P&L on exited portion only

### Statistics:
- Win rate includes partially closed trades
- Total P&L includes realized P&L from partial exits
- Open trades count excludes partially closed (they're in progress)

### Charts:
- Equity curve includes partial exit P&L
- P&L distribution shows partial exit results
- Timeline shows each partial exit event

## Best Practices

### 1. Plan Your Exits

Before entering:
- Decide exit levels (1/3 at target 1, 1/3 at target 2, etc.)
- Set stop loss for remaining position
- Document strategy in notes

### 2. Track Fees

- Enter fees for each partial exit
- Fees reduce net P&L
- Consider fee impact on small exits

### 3. Update Stop Loss

After partial exits:
- Move stop loss to protect profits
- Reduce risk on remaining position
- Document stop loss changes

### 4. Document Reasoning

In trade notes:
- Why you took partial exit
- What triggered the exit
- Plan for remaining position

## Troubleshooting

### Issue: Partial exits not saving

**Solution:**
- Check that exit action is opposite of entry (sell for long, buy for short)
- Verify exit quantity doesn't exceed remaining quantity
- Ensure exit date/time is after entry

### Issue: Metrics not calculating

**Solution:**
- Verify trade has exit_price set
- Check status is 'partially_closed' or 'closed'
- Wait a moment for database trigger to complete
- Refresh page

### Issue: Wrong P&L displayed

**Solution:**
- Verify weighted exit price is correct
- Check that total_exit_quantity matches sum of partial exits
- Ensure fees are included
- Run verification script: `node scripts/verify-metrics-calculations.js`

## API Reference

### Update Trade with Partial Exits:

```typescript
await updateTrade({
  id: tradeId,
  status: 'partially_closed',
  exit_price: weightedExitPrice,
  exit_time: lastExitTime,
  total_exit_quantity: totalExited,
  remaining_quantity: totalQuantity - totalExited,
  fees: totalFees,
  partial_exits: [
    {
      action: 'sell',
      datetime: '2026-02-08T10:00:00Z',
      quantity: 30,
      price: 152.00,
      fee: 1.00
    },
    // ... more exits
  ]
});
```

## Database Migrations

### Applied Migrations:

1. **20260208000000_fix_partial_exits_metrics.sql**
   - Updates `calculate_trade_metrics` function
   - Handles partially_closed status
   - Calculates metrics on exited quantity

2. **20260208000001_fix_partial_exits_trigger.sql**
   - Updates trigger to fire for partially_closed trades
   - Ensures metrics calculate automatically

## Summary

✅ **Partial exits are fully functional**
✅ **Metrics calculate correctly**
✅ **UI supports adding/editing partial exits**
✅ **Database triggers work properly**
✅ **All test cases pass**

**You can now:**
- Create trades with partial exits
- Edit trades to add more exits
- View correct metrics for partial exits
- Track remaining open quantity
- See weighted exit prices

---

**Need Help?**

Run the test script to verify everything works:
```bash
node scripts/test-partial-exits.js
```

Check metrics calculations:
```bash
node scripts/verify-metrics-calculations.js
```
