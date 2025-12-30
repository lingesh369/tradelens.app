# Old Database Structure Analysis

## Critical Findings from Old Database Inspection

### 1. app_users Table Structure (CRITICAL DIFFERENCES)

**Old Structure:**
```
- user_id (UUID) - NOT id!
- email
- username
- first_name
- last_name
- display_name (separate field, not generated)
- profile_completed (boolean)
- email_verified (boolean)
- signup_source
- last_login_at
- created_at
- updated_at
- user_role
```

**Issues Found:**
- ❌ Primary key is `user_id` NOT `id`
- ❌ `display_name` is a separate field, not generated
- ❌ Has `profile_completed` flag (we're missing this)
- ❌ Has `email_verified` flag (we're missing this)
- ❌ Has `signup_source` field (we're missing this)
- ❌ Missing `avatar_url`
- ❌ Missing `subscription_status` (stored separately)
- ❌ Missing `trial_end_date`
- ❌ Missing `affiliate_code` and `referred_by`

### 2. user_subscriptions_new Table Structure

**Old Structure:**
```
- subscription_id (UUID)
- user_id (UUID)
- plan_id (UUID)
- status
- start_date (not current_period_start)
- end_date (not current_period_end)
- billing_cycle
- next_billing_date
- payment_method
- created_at
- updated_at
- email (denormalized!)
- plan_name (denormalized!)
```

**Issues Found:**
- ❌ Uses `start_date` and `end_date` instead of `current_period_start/end`
- ❌ Has `next_billing_date` (we're missing this)
- ❌ Denormalizes `email` and `plan_name` (not ideal but exists)
- ❌ Missing `cancel_at_period_end`
- ❌ Missing `cancelled_at`
- ❌ Missing `gateway_subscription_id`
- ❌ Missing `gateway_customer_id`

### 3. subscription_plans Table Structure

**Old Structure:**
```
- plan_id (UUID)
- name
- validity_days (not in our schema!)
- notes_access (boolean)
- analytics_overview_access (boolean)
- analytics_other_access (boolean)
- trading_account_limit
- trading_strategy_limit
- profile_access (boolean)
- price_monthly
- price_yearly
- features (JSONB - different structure)
- limits (JSONB - different structure)
- is_active
- created_at
- plan_type (trial/paid)
- is_default
```

**Issues Found:**
- ❌ Has `validity_days` field (important for trial logic!)
- ❌ Has individual boolean fields for access control
- ❌ Has `plan_type` field (trial vs paid)
- ❌ Different features structure
- ❌ Missing `display_name`
- ❌ Missing `description`
- ❌ Missing `sort_order`
- ❌ Missing gateway IDs

### 4. trades Table Structure

**Old Structure:**
```
- trade_id (UUID) - NOT id!
- account_id
- user_id
- instrument
- action
- entry_price
- exit_price
- quantity
- entry_time
- exit_time
- market_type
- chart_link
- sl
- target
- rating
- notes
- commission
- fees
- strategy_id
- contract
- trade_time_frame
- contract_multiplier
- tick_size
- tick_value
- trade_rating (duplicate of rating?)
- remaining_quantity
- parent_trade_id
- status
- total_exit_quantity
- partial_exits (JSONB)
- tags (array)
- main_image
- additional_images (array)
- is_shared
- shared_at
- shared_by_user_id
- trade_date
- created_at
```

**Issues Found:**
- ❌ Primary key is `trade_id` NOT `id`
- ❌ Has both `rating` and `trade_rating` (redundant)
- ❌ Has `chart_link` (we don't have this)
- ❌ Has `shared_by_user_id` (for re-sharing?)
- ❌ Has `trade_date` separate from `entry_time`
- ❌ Missing `exit_time` in some records
- ✅ Has `partial_exits` as JSONB (we have separate table)
- ✅ Has `tags` as array (we have junction table)

### 5. accounts Table Structure

**Old Structure:**
```
- account_id (UUID) - NOT id!
- user_id
- account_name (not just "name")
- broker
- type (not account_type)
- starting_balance (not initial_balance)
- current_balance
- profit_loss (calculated field)
- commission (account-level?)
- fees (account-level?)
- status (not is_active boolean)
- created_on (not created_at)
```

**Issues Found:**
- ❌ Primary key is `account_id` NOT `id`
- ❌ Uses `account_name` not `name`
- ❌ Uses `type` not `account_type`
- ❌ Uses `starting_balance` not `initial_balance`
- ❌ Has `profit_loss` as calculated field
- ❌ Has `status` as text not boolean `is_active`
- ❌ Uses `created_on` not `created_at`
- ❌ Missing `currency`
- ❌ Missing `notes`
- ❌ Missing `updated_at`

### 6. trader_profiles Table Structure

**Old Structure:**
```
- id (UUID) ✅
- user_id
- is_public
- bio
- about_content
- profile_data (JSONB)
- social_links (JSONB)
- stats_visibility (JSONB?)
- privacy_settings (JSONB?)
- created_at
- updated_at
```

**Issues Found:**
- ❌ Missing `trading_experience`
- ❌ Missing `risk_tolerance`
- ❌ Missing `preferred_markets`
- ❌ Missing `location`
- ❌ Missing `timezone`
- ❌ Missing `website_url`
- ❌ Missing `total_trades`, `win_rate`, `total_pnl` (cached stats)
- ✅ Has `about_content` (we have `bio`)
- ✅ Has `profile_data` (generic JSONB)
- ✅ Has `stats_visibility` and `privacy_settings`

### 7. payments Table Structure

**Old Structure:**
```
- payment_id (UUID)
- user_id
- amount
- currency
- payment_status (not just "status")
- payment_method
- payment_date (not paid_at)
- description
- subscription_plan (text, not reference)
- plan_id
- billing_cycle
- transaction_id
- invoice_id
- order_number
- original_amount
- discount_applied
- coupon_code
- coupon_id
- provider_ref
- admin_notes
- created_at
- cashfree_order_id
- cashfree_payment_session_id
```

**Issues Found:**
- ❌ Uses `payment_status` not `status`
- ❌ Uses `payment_date` not `paid_at`
- ❌ Has `subscription_plan` as text (denormalized)
- ❌ Has `order_number`
- ❌ Has `original_amount` (before discount)
- ❌ Has `discount_applied` (amount)
- ❌ Has `provider_ref`
- ❌ Has `admin_notes`
- ❌ Has specific Cashfree fields
- ❌ Missing `subscription_id` reference
- ❌ Missing `refunded_at`
- ❌ Missing `metadata` JSONB

## Key Architectural Differences

### 1. Primary Key Naming
- **Old**: Uses descriptive names (`user_id`, `trade_id`, `account_id`, `payment_id`)
- **New**: Uses generic `id` for all tables
- **Decision**: Keep `id` for consistency, but ensure foreign keys match

### 2. Field Naming Conventions
- **Old**: Inconsistent (`account_name` vs `name`, `created_on` vs `created_at`)
- **New**: Consistent naming
- **Decision**: Standardize on our naming

### 3. Denormalization
- **Old**: Denormalizes `email`, `plan_name` in subscriptions
- **New**: Normalized structure
- **Decision**: Keep normalized, use views for denormalized queries

### 4. Missing Critical Fields

**Must Add to app_users:**
- `profile_completed` BOOLEAN
- `email_verified` BOOLEAN  
- `signup_source` TEXT

**Must Add to subscription_plans:**
- `validity_days` INT (for trial duration)
- `plan_type` TEXT (trial/paid)

**Must Add to user_subscriptions:**
- `next_billing_date` TIMESTAMPTZ

**Must Add to trades:**
- `chart_link` TEXT

**Must Add to accounts:**
- `profit_loss` DECIMAL (calculated)

## Recommendations

### HIGH PRIORITY - Must Fix

1. ✅ **Add missing fields to app_users**
   - profile_completed
   - email_verified
   - signup_source

2. ✅ **Add missing fields to subscription_plans**
   - validity_days
   - plan_type

3. ✅ **Add missing fields to user_subscriptions**
   - next_billing_date

4. ✅ **Add missing fields to trades**
   - chart_link

5. ✅ **Add missing fields to accounts**
   - profit_loss (calculated)

### MEDIUM PRIORITY - Consider Adding

1. **trader_profiles enhancements**
   - stats_visibility JSONB
   - privacy_settings JSONB
   - about_content TEXT (in addition to bio)

2. **payments enhancements**
   - order_number TEXT
   - original_amount DECIMAL
   - discount_applied DECIMAL
   - provider_ref TEXT
   - admin_notes TEXT

### LOW PRIORITY - Nice to Have

1. **Denormalized views** for performance
   - trades_with_account_name
   - subscriptions_with_user_email

## Action Items

1. ✅ Update Phase 1 migration (app_users)
2. ✅ Update Phase 2 migration (subscriptions)
3. ✅ Update Phase 3 migration (accounts)
4. ✅ Update Phase 4 migration (trades)
5. ✅ Update Phase 5 migration (trader_profiles)
6. ⏳ Test all migrations
7. ⏳ Verify compatibility with existing frontend code

---

**Analysis Date**: November 23, 2024
**Old Database**: tjbrbmywiucblznkjqyi.supabase.co
**Status**: Ready for migration updates
