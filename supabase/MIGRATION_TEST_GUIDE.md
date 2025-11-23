# TradeLens Database Migration Test Guide

## Quick Start

### 1. Reset Local Database (if needed)

```bash
# Stop local Supabase
supabase stop

# Start fresh
supabase start
```

### 2. Apply Migrations

```bash
# Apply all migrations
supabase db reset

# Or apply migrations manually
supabase migration up
```

### 3. Verify Migration Success

```bash
# Check migration status
supabase migration list

# All migrations should show as "Applied"
```

## Testing Checklist

### Phase 1: Core Auth & Users ✓

```sql
-- Test user creation
SELECT * FROM app_users LIMIT 1;
SELECT * FROM trader_profiles LIMIT 1;
SELECT * FROM user_settings LIMIT 1;

-- Test username generation
SELECT generate_username_from_email('test@example.com');

-- Test affiliate code generation
SELECT generate_affiliate_code();
```

### Phase 2: Subscriptions & Payments ✓

```sql
-- Check default plans were created
SELECT * FROM subscription_plans ORDER BY sort_order;

-- Should return 4 plans: free, basic, pro, premium
SELECT COUNT(*) FROM subscription_plans;
```

### Phase 3: Trading Core ✓

```sql
-- Test plan limit checking
SELECT check_plan_limit('user-uuid-here'::UUID, 'accounts');

-- Test get user plan
SELECT * FROM get_user_plan('user-uuid-here'::UUID);
```

### Phase 4: Trades & Metrics ✓

```sql
-- Test trade metrics calculation
-- (Will be tested after creating sample trades)
```

### Phase 5: Community Features ✓

```sql
-- Test community functions
SELECT get_follower_count('user-uuid-here'::UUID);
SELECT get_following_count('user-uuid-here'::UUID);
```

### Phase 6: Content & Journal ✓

```sql
-- Test note search
SELECT * FROM search_notes('user-uuid-here'::UUID, 'trading strategy', 10);
```

### Phase 7: Notifications & System ✓

```sql
-- Test notification functions
SELECT get_unread_notification_count('user-uuid-here'::UUID);
```

### Phase 8: Database Functions ✓

```sql
-- Test triggers by creating a test user
-- (Requires Supabase Auth, will be tested in integration)
```

### Phase 9: Row Level Security ✓

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- All tables should have rowsecurity = true
```

### Phase 10: Indexes & Performance ✓

```sql
-- Check indexes were created
SELECT * FROM index_usage ORDER BY idx_scan DESC LIMIT 10;

-- Check table sizes
SELECT * FROM table_sizes ORDER BY size_bytes DESC;

-- Check for unused indexes
SELECT * FROM unused_indexes;
```

### Phase 11: Views & Helpers ✓

```sql
-- Test views
SELECT * FROM active_subscriptions LIMIT 5;
SELECT * FROM user_trade_summary LIMIT 5;
SELECT * FROM community_feed LIMIT 5;
SELECT * FROM expiring_trials LIMIT 5;

-- Test analytics functions
SELECT * FROM get_admin_dashboard_metrics();
```

## Integration Tests

### Test 1: Complete User Signup Flow

```sql
-- 1. Create auth user (simulated - normally done by Supabase Auth)
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
    gen_random_uuid(),
    'testuser@example.com',
    '{"username": "testuser", "first_name": "Test", "last_name": "User"}'::jsonb
);

-- 2. Verify app_users was created automatically
SELECT * FROM app_users WHERE email = 'testuser@example.com';

-- 3. Verify trader_profiles was created
SELECT * FROM trader_profiles WHERE user_id = (
    SELECT id FROM app_users WHERE email = 'testuser@example.com'
);

-- 4. Verify user_settings were created
SELECT * FROM user_settings WHERE user_id = (
    SELECT id FROM app_users WHERE email = 'testuser@example.com'
);

-- 5. Verify trial subscription was created
SELECT * FROM user_subscriptions WHERE user_id = (
    SELECT id FROM app_users WHERE email = 'testuser@example.com'
);
```

### Test 2: Trade Creation and Metrics

```sql
-- Get test user ID
DO $$
DECLARE
    v_user_id UUID;
    v_account_id UUID;
    v_trade_id UUID;
BEGIN
    -- Get or create test user
    SELECT id INTO v_user_id FROM app_users LIMIT 1;
    
    -- Create test account
    INSERT INTO accounts (user_id, name, initial_balance, current_balance)
    VALUES (v_user_id, 'Test Account', 10000, 10000)
    RETURNING id INTO v_account_id;
    
    -- Create test trade
    INSERT INTO trades (
        user_id, account_id, instrument, action, entry_price, quantity,
        entry_time, exit_price, exit_time, status, commission, fees
    ) VALUES (
        v_user_id, v_account_id, 'AAPL', 'long', 150.00, 10,
        NOW() - INTERVAL '1 day', 155.00, NOW(), 'closed', 1.00, 0.50
    ) RETURNING id INTO v_trade_id;
    
    -- Verify trade metrics were calculated
    RAISE NOTICE 'Trade ID: %', v_trade_id;
    RAISE NOTICE 'Checking trade metrics...';
    
    PERFORM pg_sleep(1); -- Wait for trigger
    
    IF EXISTS (SELECT 1 FROM trade_metrics WHERE trade_id = v_trade_id) THEN
        RAISE NOTICE '✓ Trade metrics calculated successfully';
    ELSE
        RAISE EXCEPTION '✗ Trade metrics NOT calculated';
    END IF;
    
    -- Verify account balance was updated
    IF EXISTS (
        SELECT 1 FROM accounts 
        WHERE id = v_account_id 
        AND current_balance != initial_balance
    ) THEN
        RAISE NOTICE '✓ Account balance updated successfully';
    ELSE
        RAISE EXCEPTION '✗ Account balance NOT updated';
    END IF;
END $$;
```

### Test 3: RLS Policy Enforcement

```sql
-- Test that users can only see their own data
-- (Requires setting auth.uid() context - done in application)

-- Test admin access
-- (Requires user with user_role = 'admin')
```

### Test 4: Subscription Status Sync

```sql
-- Test that subscription status syncs to app_users
DO $$
DECLARE
    v_user_id UUID;
    v_subscription_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM app_users LIMIT 1;
    
    -- Update subscription status
    UPDATE user_subscriptions
    SET status = 'expired'
    WHERE user_id = v_user_id
    RETURNING id INTO v_subscription_id;
    
    -- Verify app_users was updated
    IF EXISTS (
        SELECT 1 FROM app_users 
        WHERE id = v_user_id 
        AND subscription_status = 'expired'
    ) THEN
        RAISE NOTICE '✓ Subscription status synced to app_users';
    ELSE
        RAISE EXCEPTION '✗ Subscription status NOT synced';
    END IF;
    
    -- Verify notification was created
    IF EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = v_user_id 
        AND type = 'subscription_expired'
    ) THEN
        RAISE NOTICE '✓ Notification created for subscription change';
    ELSE
        RAISE WARNING '✗ Notification NOT created';
    END IF;
END $$;
```

## Performance Tests

### Test Query Performance

```sql
-- Test trade list query (should use index)
EXPLAIN ANALYZE
SELECT * FROM trades 
WHERE user_id = 'user-uuid-here'::UUID 
ORDER BY entry_time DESC 
LIMIT 20;

-- Should show "Index Scan" on idx_trades_user_entry_time

-- Test analytics query
EXPLAIN ANALYZE
SELECT * FROM get_user_analytics('user-uuid-here'::UUID);

-- Test community feed query
EXPLAIN ANALYZE
SELECT * FROM community_feed LIMIT 20;
```

## Common Issues & Solutions

### Issue: Migrations fail with "relation already exists"

**Solution:** Reset the database
```bash
supabase db reset
```

### Issue: RLS policies block all access

**Solution:** Check that auth.uid() is set correctly in your application context

### Issue: Triggers not firing

**Solution:** Verify trigger was created
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%trade%';
```

### Issue: Functions return NULL

**Solution:** Check function permissions and SECURITY DEFINER settings

## Next Steps After Testing

1. ✅ All migrations apply successfully
2. ✅ All tables created with correct structure
3. ✅ All triggers fire correctly
4. ✅ All RLS policies enforce correctly
5. ✅ All indexes created
6. ✅ All views return data
7. ⏳ Deploy to production
8. ⏳ Update frontend code
9. ⏳ Create edge functions

## Production Deployment Checklist

- [ ] Backup existing database (if any)
- [ ] Review all migration files
- [ ] Test on staging environment
- [ ] Run migrations on production
- [ ] Verify all tables and data
- [ ] Test authentication flow
- [ ] Test payment webhooks
- [ ] Monitor error logs
- [ ] Update frontend environment variables
- [ ] Deploy edge functions
- [ ] Test end-to-end flows

---

**Last Updated:** November 23, 2024
**Status:** Ready for Testing
