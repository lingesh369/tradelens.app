# TradeLens Testing Guide

## Overview
This guide walks you through testing the complete trade functionality after the database rebuild.

## Prerequisites
- ✅ Supabase local instance running (`npm run supabase:start`)
- ✅ Development server running (`npm run dev`)
- ✅ Test data created (see below)

## Test Data Setup

### 1. Create Test User and Initial Data
```bash
node scripts/test-trade-flow.js
```

This creates:
- Test user: `test@tradelens.com` / `Test123456!`
- 1 test account
- 1 test strategy
- 1 test trade (AAPL)

### 2. Confirm Test User Email
```bash
node scripts/confirm-test-user.js
```

This confirms the test user's email so they can log in.

### 3. Create Multiple Test Trades
```bash
node scripts/test-multiple-trades.js
```

This creates 7 additional trades with various scenarios:
- Winning trades (TSLA, MSFT, NVDA, BTC/USD, EUR/USD)
- Losing trade (GOOGL)
- Open trade (AMZN)
- Different market types (stocks, crypto, forex)
- Different actions (long, short)

## Testing Checklist

### 🔐 Authentication
- [ ] Login with test credentials
- [ ] User profile loads correctly
- [ ] Subscription info displays

### 📊 Dashboard
- [ ] Dashboard loads without errors
- [ ] Statistics cards show correct data:
  - Total P&L
  - Win Rate
  - Total Trades
  - Average Win/Loss
- [ ] Charts render properly:
  - Equity curve
  - P&L by instrument
  - Win/Loss distribution
- [ ] Calendar shows trade dates
- [ ] Recent trades list displays

### 📈 Trades Page
- [ ] All trades display in table
- [ ] Trade count matches database (15 trades)
- [ ] Columns show correct data:
  - Instrument
  - Action (long/short)
  - Entry/Exit prices
  - P&L
  - Status
  - Rating
- [ ] Sorting works on all columns
- [ ] Search/filter functionality works
- [ ] Pagination works correctly

### ➕ Add New Trade
- [ ] Click "Add Trade" button
- [ ] Form opens with all fields
- [ ] Required fields validation works
- [ ] Can select account from dropdown
- [ ] Can select strategy from dropdown
- [ ] Market type dropdown works
- [ ] Date/time pickers work
- [ ] Submit creates trade successfully
- [ ] New trade appears immediately in list
- [ ] Metrics calculate correctly

### ✏️ Edit Trade
- [ ] Click on a trade to view details
- [ ] Edit button opens form with existing data
- [ ] Can modify all fields
- [ ] Save updates trade successfully
- [ ] Changes reflect immediately
- [ ] Metrics recalculate correctly

### 🗑️ Delete Trade
- [ ] Select one or more trades
- [ ] Delete button appears
- [ ] Confirmation dialog shows
- [ ] Delete removes trade(s)
- [ ] Statistics update correctly

### 🔍 Filtering & Search
- [ ] Account filter works
- [ ] Strategy filter works
- [ ] Date range filter works
- [ ] Market type filter works
- [ ] Status filter (open/closed) works
- [ ] Search by instrument works
- [ ] Multiple filters work together

### 📊 Trade Metrics
Verify these metrics calculate correctly:
- [ ] Net P&L (after commissions/fees)
- [ ] Gross P&L (before costs)
- [ ] Percent Gain
- [ ] R-Multiple (risk/reward ratio)
- [ ] Trade Duration
- [ ] Trade Result (win/loss/breakeven)

### 🎯 Strategy Performance
- [ ] Navigate to Strategies page
- [ ] Test strategy shows correct stats:
  - Total trades
  - Win rate
  - Total P&L
- [ ] Click strategy to view details
- [ ] Strategy trades list shows all trades
- [ ] Strategy metrics update when trades change

### 📱 Responsive Design
- [ ] Test on mobile viewport (< 640px)
- [ ] Test on tablet viewport (640px - 1024px)
- [ ] Test on desktop viewport (> 1024px)
- [ ] All features work on all screen sizes

### 🔄 Real-time Updates
- [ ] Add trade in one tab
- [ ] Verify it appears in another tab (if real-time enabled)
- [ ] Edit trade and verify updates propagate

## Expected Results

### Database State
After running all test scripts, you should have:
- 1 test user
- 1 account
- 1 strategy
- 15 trades total:
  - 13 closed trades
  - 2 open trades
  - 11 winning trades
  - 2 losing trades
  - Win rate: ~84.62%
  - Total P&L: ~$1,735.50

### Trade Breakdown
1. AAPL - Long - Closed - Win ($47.00)
2. TSLA - Long - Closed - Win ($48.25)
3. GOOGL - Long - Closed - Loss (-$18.30)
4. MSFT - Long - Closed - Win ($28.80)
5. NVDA - Short - Closed - Win ($38.00)
6. AMZN - Long - Open (no P&L yet)
7. BTC/USD - Long - Closed - Win ($720.00)
8. EUR/USD - Short - Closed - Win ($27.50)

## Common Issues & Solutions

### Issue: Trades not showing up
**Solution:** 
- Check browser console for errors
- Verify Supabase connection
- Check RLS policies are correct
- Verify user_id matches in database

### Issue: Metrics not calculating
**Solution:**
- Check database triggers are enabled
- Verify trade has exit_price and exit_time
- Check trade status is 'closed'
- Look for errors in Supabase logs

### Issue: Can't login
**Solution:**
- Run `node scripts/confirm-test-user.js`
- Check Supabase auth is running
- Verify credentials are correct

### Issue: Filters not working
**Solution:**
- Check FilterContext is properly set up
- Verify filter state is being passed to components
- Check console for filter-related errors

## Database Verification

### Check trades directly in database:
```sql
-- View all trades
SELECT id, instrument, action, status, entry_price, exit_price
FROM trades
ORDER BY entry_time DESC;

-- View trade metrics
SELECT t.instrument, tm.net_pnl, tm.trade_result, tm.percent_gain
FROM trades t
LEFT JOIN trade_metrics tm ON t.id = tm.trade_id
WHERE t.status = 'closed'
ORDER BY tm.net_pnl DESC;

-- Check user statistics
SELECT 
  COUNT(*) as total_trades,
  SUM(CASE WHEN tm.trade_result = 'win' THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN tm.trade_result = 'loss' THEN 1 ELSE 0 END) as losses,
  SUM(tm.net_pnl) as total_pnl
FROM trades t
LEFT JOIN trade_metrics tm ON t.id = tm.trade_id
WHERE t.user_id = 'YOUR_USER_ID';
```

## Performance Testing

### Load Testing
1. Create 100+ trades using a script
2. Verify dashboard loads in < 2 seconds
3. Verify trades table loads in < 1 second
4. Check pagination performance

### Stress Testing
1. Add/edit/delete trades rapidly
2. Verify no race conditions
3. Check for memory leaks
4. Monitor database connection pool

## Next Steps

After completing all tests:
1. ✅ Document any issues found
2. ✅ Fix critical bugs
3. ✅ Optimize slow queries
4. ✅ Add missing features
5. ✅ Update user documentation
6. ✅ Prepare for production deployment

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs: `npm run supabase:status`
3. Review migration files in `supabase/migrations/`
4. Check RLS policies in Supabase Studio
5. Verify environment variables in `.env.local`

## Test Credentials

**Test User:**
- Email: `test@tradelens.com`
- Password: `Test123456!`

**Supabase Studio:**
- URL: http://127.0.0.1:54323
- No password required for local development

**Application:**
- URL: http://localhost:8081
