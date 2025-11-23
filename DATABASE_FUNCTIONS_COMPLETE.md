# Database Functions - Complete Implementation

## Overview
Comprehensive database functions implementation matching old database functionality with industry best practices.

## New Migrations Created

### 1. `20241123210000_access_control_functions.sql`
**Core Access Control & Subscription Management**

#### Access Control Functions
- `get_user_access_matrix(auth_user_id)` - Comprehensive user access data
  - Returns: subscription info, feature access, resource limits, usage tracking
  - Used by: Frontend hooks, subscription context, feature gates
  
- `check_feature_access(auth_user_id, feature_key)` - Simple boolean feature check
  - Features: notes, profile, analytics, community, ai
  
- `check_resource_limit(auth_user_id, resource_type)` - Detailed limit info
  - Resources: accounts, strategies, trades
  - Returns: limit, used, available, unlimited flag

#### Admin Functions
- `update_user_role(target_user_id, new_role, reason)` - Secure role management
  - Validates admin permissions
  - Logs all changes to audit table
  - Roles: User, Admin, Manager
  
- `assign_user_plan(target_user_id, plan_name, billing_cycle, start_date)` - Plan assignment
  - Admin-only function
  - Cancels existing subscriptions
  - Creates new subscription with proper dates

- `invalidate_user_access_cache(target_user_id)` - Cache invalidation
  - Placeholder for Redis/Memcached integration
  - Currently updates timestamp to signal changes

#### Notification Functions
- `get_segment_user_ids(segment_type)` - Bulk notification targeting
  - Segments: all_users, trial_users, active_subscribers, expired_users, premium_users
  - Returns array of user IDs

#### Journal Aggregation Functions
- `aggregate_trade_notes_for_date(user_id, date)` - Aggregates trade notes
  - Combines all trade notes for a specific date
  - Updates journal.all_trades_notes
  - Auto-triggered on trade insert/update

- `update_journal_images_notes_for_date(user_id, date)` - Aggregates image notes
  - Combines all journal image notes for a date
  - Updates journal.all_journal_images_notes
  - Auto-triggered on journal_images insert/update

#### Subscription Management
- `upsert_user_subscription(user_id, plan_name, billing_cycle, start_date)` - Create/update subscription
  - Used by payment processors
  - Handles plan transitions
  - Calculates proper end dates

#### Auto-Triggers
- `on_trade_notes_change` - Auto-aggregates trade notes to journal
- `on_journal_image_notes_change` - Auto-aggregates image notes to journal

---

### 2. `20241123220000_additional_helper_functions.sql`
**User Management & Utility Functions**

#### User Profile Functions
- `get_current_user_internal_id()` - Returns auth.uid()
- `get_current_user_profile()` - Returns full user profile
- `ensure_user_profile_exists(user_auth_id)` - Creates missing profile records
  - Creates trader_profiles if missing
  - Creates user_settings if missing
  - Returns status of what was created

#### Setup & Onboarding
- `is_user_setup_complete()` - Boolean check for setup completion
- `check_user_setup_status()` - Detailed setup status
  - Returns: profile_completed, onboarding_completed, email_verified
  - Counts: accounts, strategies, trades
  - Overall setup_complete flag

- `initialize_default_user_accounts_strategies(user_id)` - Creates defaults
  - Creates "Main Trading Account" if no accounts exist
  - Creates 3 default strategies: Trend Following, Breakout Trading, Scalping

#### Admin Checks
- `check_admin_role()` - Returns true if current user is admin

#### Subscription Maintenance
- `check_expired_subscriptions()` - Cron job function
  - Updates expired subscriptions
  - Syncs status to app_users
  - Returns count of expired and expiring soon
  
- `update_expired_subscriptions()` - Legacy wrapper

---

## Function Usage Map

### Frontend Components Using These Functions

#### Subscription Context (`src/context/SubscriptionContext.tsx`)
```typescript
- get_user_access_matrix(auth_user_id)
  → Used for: planName, isActive, feature access, resource limits
```

#### Admin Security Service (`src/services/adminSecurityService.ts`)
```typescript
- update_user_role(target_user_id, new_role, reason)
  → Used for: Role management in admin panel
```

#### Admin Utils (`src/lib/admin-utils.ts`)
```typescript
- assign_user_plan(target_user_id, plan_name, billing_cycle)
- invalidate_user_access_cache(target_user_id)
  → Used for: Admin subscription management
```

#### Trade Actions Hook (`src/hooks/useTradeActions.tsx`)
```typescript
- create_notification(target_user_id, notification_type, ...)
  → Used for: Like and comment notifications
```

#### Journal Services
```typescript
- aggregate_trade_notes_for_date(user_id, date)
- update_journal_images_notes_for_date(user_id, date)
  → Auto-triggered by database, also callable manually
```

---

## Comparison with Old Database

### Functions Implemented ✅
- ✅ `get_user_access_matrix` - Enhanced with more data
- ✅ `update_user_role` - With audit logging
- ✅ `assign_user_plan` - Admin plan assignment
- ✅ `invalidate_user_access_cache` - Cache management
- ✅ `get_segment_user_ids` - Notification targeting
- ✅ `aggregate_trade_notes_for_date` - Journal aggregation
- ✅ `update_journal_images_notes_for_date` - Image notes aggregation
- ✅ `upsert_user_subscription` - Subscription management
- ✅ `get_current_user_internal_id` - User ID helper
- ✅ `get_current_user_profile` - Profile data
- ✅ `check_admin_role` - Admin check
- ✅ `is_user_setup_complete` - Setup status
- ✅ `check_user_setup_status` - Detailed setup info
- ✅ `ensure_user_profile_exists` - Profile creation
- ✅ `initialize_default_user_accounts_strategies` - Onboarding defaults
- ✅ `check_expired_subscriptions` - Subscription maintenance
- ✅ `update_expired_subscriptions` - Legacy wrapper

### Functions NOT Needed (Handled by New Architecture)
- ❌ `add_trade_image` - Direct table access with RLS
- ❌ `remove_trade_image` - Direct table access with RLS
- ❌ `set_main_trade_image` - Direct table access with RLS
- ❌ `get_trade_sharing_status` - Direct table access
- ❌ `update_trade_sharing` - Direct table access
- ❌ `create_settings` - Handled by signup trigger
- ❌ `create_trader_profile` - Handled by signup trigger
- ❌ `create_user_settings` - Handled by signup trigger
- ❌ `auto_populate_subscription_email` - Handled by trigger
- ❌ `handle_new_user` - Replaced by handle_new_signup
- ❌ `sql` / `exec_sql` - Security risk, removed

### Functions in Existing Migrations
- ✅ `handle_new_signup` - Phase 8 (signup automation)
- ✅ `calculate_trade_metrics` - Phase 4 (trade calculations)
- ✅ `create_notification` - Phase 7 (notifications)
- ✅ `get_user_plan` - Phase 3 (subscription queries)
- ✅ `check_plan_limit` - Phase 3 (resource limits)
- ✅ `generate_username_from_email` - Phase 1 (user creation)
- ✅ `generate_affiliate_code` - Phase 1 (user creation)

---

## Security Features

### 1. SECURITY DEFINER
All functions use `SECURITY DEFINER` to run with elevated privileges while maintaining security through:
- Explicit permission checks (admin role validation)
- auth.uid() for current user context
- Audit logging for sensitive operations

### 2. Audit Logging
- Role changes logged to `user_role_audit`
- Subscription changes logged to `subscription_event_logs`
- All admin actions tracked with reason and IP

### 3. Permission Grants
All functions explicitly granted to `authenticated` role only:
```sql
GRANT EXECUTE ON FUNCTION function_name TO authenticated;
```

---

## Testing Checklist

### Access Control Functions
- [ ] `get_user_access_matrix` returns correct data for trial users
- [ ] `get_user_access_matrix` returns correct data for premium users
- [ ] `check_feature_access` correctly blocks/allows features
- [ ] `check_resource_limit` returns accurate usage counts

### Admin Functions
- [ ] `update_user_role` requires admin permission
- [ ] `update_user_role` logs changes to audit table
- [ ] `assign_user_plan` creates subscription correctly
- [ ] `assign_user_plan` cancels old subscriptions

### Journal Functions
- [ ] Trade notes auto-aggregate to journal
- [ ] Image notes auto-aggregate to journal
- [ ] Manual aggregation works for specific dates

### User Management
- [ ] `ensure_user_profile_exists` creates missing records
- [ ] `initialize_default_user_accounts_strategies` creates defaults
- [ ] `check_user_setup_status` returns accurate data

### Subscription Maintenance
- [ ] `check_expired_subscriptions` updates expired subs
- [ ] Expired status syncs to app_users table

---

## Next Steps

1. **Apply Migrations**
   ```bash
   supabase db reset
   # or
   supabase migration up
   ```

2. **Test Functions**
   - Test in Supabase SQL Editor
   - Test via frontend components
   - Verify RLS policies work with functions

3. **Update Frontend**
   - All RPC calls should now work
   - No frontend changes needed (functions match expected signatures)

4. **Monitor Performance**
   - Check function execution times
   - Add indexes if needed
   - Monitor auto-trigger performance

---

## Performance Considerations

### Indexed Columns
All functions use indexed columns for queries:
- `app_users.id` (primary key)
- `user_subscriptions.user_id` (indexed)
- `trades.user_id, trade_date` (composite index)
- `journal_images.user_id, created_at` (composite index)

### Auto-Trigger Optimization
- Triggers only fire when notes are not null/empty
- Aggregation uses efficient STRING_AGG
- Date-based queries use indexed columns

### Caching Strategy
- `invalidate_user_access_cache` prepared for Redis integration
- Frontend should cache `get_user_access_matrix` results
- Invalidate cache on subscription/role changes

---

## Industry Best Practices Applied

✅ **Security First**
- All admin functions validate permissions
- Audit logging for sensitive operations
- SECURITY DEFINER with explicit grants

✅ **Performance Optimized**
- Efficient queries using indexes
- Conditional trigger execution
- Batch operations where possible

✅ **Maintainability**
- Clear function naming
- Comprehensive comments
- Consistent return types (JSONB for complex data)

✅ **Error Handling**
- Graceful fallbacks
- Informative error messages
- Transaction safety

✅ **Scalability**
- Prepared for caching layer
- Efficient aggregation queries
- Minimal database round-trips
