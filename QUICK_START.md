# TradeLens Database - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Supabase CLI installed
- Local Supabase running OR new Supabase project created

### Option 1: Local Development

```bash
# 1. Start local Supabase
supabase start

# 2. Apply all migrations
supabase db reset

# 3. Check status
supabase migration list

# 4. Open Supabase Studio
# Visit: http://localhost:54323
```

### Option 2: Remote Project

```bash
# 1. Link to your Supabase project
supabase link --project-ref your-project-ref

# 2. Push migrations
supabase db push

# 3. Check status
supabase migration list --remote
```

## ✅ Verify Setup

### Check Tables Were Created

```sql
-- Should return 31 tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- List all tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### Check Default Data

```sql
-- Should return 4 subscription plans
SELECT name, display_name, price_monthly 
FROM subscription_plans 
ORDER BY sort_order;
```

### Check RLS is Enabled

```sql
-- All should return true
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

## 🧪 Test with Sample Data

### Create a Test User

```sql
-- 1. Create auth user (simulated)
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'demo@tradelens.com',
    '{"username": "demouser", "first_name": "Demo", "last_name": "User"}'::jsonb
);

-- 2. Verify profile was created automatically
SELECT * FROM app_users WHERE email = 'demo@tradelens.com';
```

### Create a Test Trade

```sql
-- Get demo user ID
DO $$
DECLARE
    v_user_id UUID := '00000000-0000-0000-0000-000000000001';
    v_account_id UUID;
    v_trade_id UUID;
BEGIN
    -- Create account
    INSERT INTO accounts (user_id, name, initial_balance, current_balance)
    VALUES (v_user_id, 'Demo Account', 10000, 10000)
    RETURNING id INTO v_account_id;
    
    -- Create winning trade
    INSERT INTO trades (
        user_id, account_id, instrument, action, 
        entry_price, exit_price, quantity,
        entry_time, exit_time, status,
        commission, fees
    ) VALUES (
        v_user_id, v_account_id, 'AAPL', 'long',
        150.00, 155.00, 10,
        NOW() - INTERVAL '1 day', NOW(), 'closed',
        1.00, 0.50
    ) RETURNING id INTO v_trade_id;
    
    RAISE NOTICE 'Created trade: %', v_trade_id;
    
    -- Wait for triggers
    PERFORM pg_sleep(1);
    
    -- Check metrics were calculated
    IF EXISTS (SELECT 1 FROM trade_metrics WHERE trade_id = v_trade_id) THEN
        RAISE NOTICE '✓ Trade metrics calculated';
        RAISE NOTICE 'Net P&L: %', (SELECT net_pnl FROM trade_metrics WHERE trade_id = v_trade_id);
    END IF;
    
    -- Check account balance updated
    RAISE NOTICE 'Account balance: %', (SELECT current_balance FROM accounts WHERE id = v_account_id);
END $$;
```

### View Analytics

```sql
-- Get user analytics
SELECT * FROM get_user_analytics('00000000-0000-0000-0000-000000000001'::UUID);

-- View trade summary
SELECT * FROM user_trade_summary 
WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID;
```

## 📱 Frontend Integration

### Environment Variables

```env
# .env.local
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Example: Fetch User Trades

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Fetch user's trades
const { data: trades, error } = await supabase
  .from('trades')
  .select(`
    *,
    trade_metrics(*),
    account:accounts(name),
    strategy:strategies(name)
  `)
  .order('entry_time', { ascending: false })
  .limit(20)

// RLS automatically filters to current user's trades
```

### Example: Get Analytics

```typescript
// Call analytics function
const { data, error } = await supabase
  .rpc('get_user_analytics', {
    p_user_id: userId,
    p_start_date: startDate,
    p_end_date: endDate
  })

console.log('Win Rate:', data.win_rate)
console.log('Total P&L:', data.total_pnl)
```

## 🔧 Common Tasks

### Add a New User Manually

```sql
-- Create user with trial subscription
INSERT INTO app_users (id, email, username, first_name, last_name)
VALUES (
    gen_random_uuid(),
    'newuser@example.com',
    'newuser',
    'New',
    'User'
);
-- Triggers will automatically create profile, settings, and trial subscription
```

### Upgrade User to Paid Plan

```sql
-- Update subscription
UPDATE user_subscriptions
SET 
    status = 'active',
    plan_id = (SELECT id FROM subscription_plans WHERE name = 'pro'),
    billing_cycle = 'monthly',
    current_period_end = NOW() + INTERVAL '30 days',
    payment_gateway = 'manual'
WHERE user_id = 'user-uuid-here'::UUID;
-- Triggers will sync status to app_users and create notification
```

### Create Admin User

```sql
-- Set user role to admin
UPDATE app_users
SET user_role = 'admin'
WHERE email = 'admin@tradelens.com';
```

### View Expiring Trials

```sql
-- See trials expiring soon
SELECT * FROM expiring_trials;
```

## 📊 Monitoring

### Check Database Health

```sql
-- Table sizes
SELECT * FROM table_sizes ORDER BY size_bytes DESC LIMIT 10;

-- Index usage
SELECT * FROM index_usage ORDER BY idx_scan DESC LIMIT 10;

-- Unused indexes
SELECT * FROM unused_indexes;
```

### Check Recent Activity

```sql
-- Recent signups
SELECT email, username, created_at 
FROM app_users 
ORDER BY created_at DESC 
LIMIT 10;

-- Recent trades
SELECT user_id, instrument, action, entry_time 
FROM trades 
ORDER BY entry_time DESC 
LIMIT 10;

-- Recent payments
SELECT user_id, amount, status, created_at 
FROM payment_history 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🐛 Troubleshooting

### Migrations Won't Apply

```bash
# Reset and try again
supabase db reset

# Or check specific migration
supabase migration repair --status applied 20241123100000
```

### RLS Blocking Queries

```sql
-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE trades DISABLE ROW LEVEL SECURITY;

-- Re-enable when done
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
```

### Triggers Not Firing

```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname LIKE '%trade%';

-- Check trigger function
SELECT proname FROM pg_proc WHERE proname LIKE '%trade%';
```

### Performance Issues

```sql
-- Update statistics
ANALYZE;

-- Reindex if needed
REINDEX DATABASE postgres;
```

## 📚 Next Steps

1. ✅ Database setup complete
2. ⏳ Create edge functions for webhooks
3. ⏳ Configure storage buckets
4. ⏳ Update frontend code
5. ⏳ Test authentication flow
6. ⏳ Test payment flow
7. ⏳ Deploy to production

## 📖 Documentation

- **Full Migration Plan**: `.kiro/specs/supabase-database-rebuild/MIGRATION_PLAN.md`
- **Design Document**: `.kiro/specs/supabase-database-rebuild/design.md`
- **Requirements**: `.kiro/specs/supabase-database-rebuild/requirements.md`
- **Test Guide**: `supabase/MIGRATION_TEST_GUIDE.md`
- **Summary**: `DATABASE_REBUILD_SUMMARY.md`

## 🎉 You're Ready!

Your TradeLens database is now set up with:
- ✅ 31 tables
- ✅ 36 functions
- ✅ 60+ RLS policies
- ✅ 30+ indexes
- ✅ 8 views
- ✅ 15 automated triggers

Start building your frontend and edge functions!

---

**Need Help?** Check the documentation files listed above or review the migration files in `supabase/migrations/`.
