# 🚀 TradeLens Quick Reference

## 🔑 Test Credentials
```
Email: test@tradelens.com
Password: Test123456!
```

## 🌐 URLs
```
Application:      http://localhost:8081
Supabase Studio:  http://127.0.0.1:54323
Supabase API:     http://127.0.0.1:54321
Mailpit:          http://127.0.0.1:54324
```

## 📊 Current Test Data
```
Trades:     18 total (16 closed, 2 open)
Win Rate:   ~81.25%
Total P&L:  ~$1,843.75
Accounts:   1 (Test Trading Account)
Strategies: 1 (Test Strategy)
```

## ⚡ Quick Commands

### Start Everything
```bash
npm run supabase:start  # Start Supabase
npm run dev             # Start dev server
```

### Stop Everything
```bash
npm run supabase:stop   # Stop Supabase
# Ctrl+C in dev server terminal
```

### Check Status
```bash
npm run supabase:status
```

### Reset & Recreate Test Data
```bash
npm run supabase:reset                  # Reset database
node scripts/test-trade-flow.js         # Create initial data
node scripts/confirm-test-user.js       # Confirm email
node scripts/test-multiple-trades.js    # Add more trades
```

### Verify Everything Works
```bash
node scripts/verify-trade-display.js    # Check all data
node scripts/test-add-trade-api.js      # Test API
```

## 🧪 Quick Test Flow

1. **Login**
   - Go to http://localhost:8081
   - Login with test credentials
   - Verify dashboard loads

2. **View Trades**
   - Navigate to Trades page
   - Verify 18 trades display
   - Check metrics are correct

3. **Add Trade**
   - Click "Add Trade"
   - Fill form and submit
   - Verify trade appears

4. **Edit Trade**
   - Click on any trade
   - Edit and save
   - Verify changes appear

5. **Delete Trade**
   - Select trade(s)
   - Delete and confirm
   - Verify removal

## 🔧 Common Tasks

### View Database
```bash
npm run supabase:studio
# Opens http://127.0.0.1:54323
```

### Check Logs
```bash
# In Supabase Studio:
# 1. Go to Logs section
# 2. Select "Database" or "API"
# 3. View real-time logs
```

### Run SQL Query
```sql
-- In Supabase Studio SQL Editor:

-- View all trades
SELECT * FROM trades ORDER BY entry_time DESC;

-- View trade metrics
SELECT t.instrument, tm.net_pnl, tm.trade_result
FROM trades t
LEFT JOIN trade_metrics tm ON t.id = tm.trade_id
WHERE t.status = 'closed';

-- Check user stats
SELECT 
  COUNT(*) as total_trades,
  SUM(CASE WHEN tm.trade_result = 'win' THEN 1 ELSE 0 END) as wins,
  SUM(tm.net_pnl) as total_pnl
FROM trades t
LEFT JOIN trade_metrics tm ON t.id = tm.trade_id
WHERE t.user_id = 'YOUR_USER_ID';
```

## 🐛 Quick Fixes

### Trades Not Showing
```bash
# 1. Check Supabase is running
npm run supabase:status

# 2. Check browser console for errors
# 3. Verify user is logged in
# 4. Check RLS policies in Studio
```

### Metrics Not Calculating
```bash
# 1. Verify trade is closed
# 2. Check exit_price and exit_time exist
# 3. Wait a moment for triggers
# 4. Check Supabase logs
```

### Can't Login
```bash
# Confirm email
node scripts/confirm-test-user.js

# Or create new user
node scripts/test-trade-flow.js
```

### Port Conflict
```bash
# Vite auto-selects next available port
# Check console output for actual port
# Or kill process using port:
# Windows: netstat -ano | findstr :8080
#          taskkill /PID <PID> /F
```

## 📁 Key Files

### Configuration
```
.env.local              # Local environment
supabase/config.toml    # Supabase config
vite.config.ts          # Vite config
```

### Database
```
supabase/migrations/    # All migrations
supabase/functions/     # Edge functions
```

### Frontend
```
src/hooks/useTrades.tsx           # Trade hook
src/api/trades/                   # Trade API
src/components/trades/            # Trade UI
src/pages/Dashboard.tsx           # Dashboard
```

### Scripts
```
scripts/test-trade-flow.js        # Initial setup
scripts/confirm-test-user.js      # Confirm email
scripts/test-multiple-trades.js   # Add trades
scripts/verify-trade-display.js   # Verify data
scripts/test-add-trade-api.js     # Test API
```

## 🎯 Testing Checklist

- [ ] Login works
- [ ] Dashboard displays correctly
- [ ] Trades page shows all trades
- [ ] Add trade works
- [ ] Edit trade works
- [ ] Delete trade works
- [ ] Filters work
- [ ] Search works
- [ ] Metrics calculate
- [ ] Charts render
- [ ] Responsive on mobile
- [ ] No console errors

## 📞 Need Help?

1. Check `TESTING_GUIDE.md` for detailed testing
2. Check `SETUP_COMPLETE.md` for full documentation
3. Check browser console for errors
4. Check Supabase Studio logs
5. Verify environment variables

## 🎉 You're Ready!

Everything is set up and working. Start testing at:
**http://localhost:8081**

Login with: `test@tradelens.com` / `Test123456!`
