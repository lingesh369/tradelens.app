# TradeLens Database Migration Plan

## Executive Summary

This document outlines the complete migration plan for rebuilding the TradeLens Supabase database from scratch. The plan consolidates the old database structure (35+ tables) into a clean, industry-standard schema with proper naming conventions, relationships, and Row Level Security.

## Old Database Analysis

### Issues Identified

1. **Broken app_users table** - Cannot be referenced, needs complete rebuild
2. **Inconsistent naming** - Mix of conventions (user_subscriptions_new, trades_with_images)
3. **Redundant tables** - Multiple settings tables (settings, user_settings)
4. **Poor normalization** - trades_with_images appears to be a view/denormalized table
5. **Missing constraints** - Likely missing proper foreign keys and cascades
6. **Unclear relationships** - Some tables have ambiguous purposes

### Tables to Consolidate/Rename

| Old Table | New Table | Action | Reason |
|-----------|-----------|--------|--------|
| `app_users` | `app_users` | **REBUILD** | Broken, needs fresh start |
| `user_subscriptions_new` | `user_subscriptions` | **RENAME** | Remove "_new" suffix |
| `settings` + `user_settings` | `user_settings` | **MERGE** | Consolidate into one table |
| `trades_with_images` | **REMOVE** | **DELETE** | Create as view instead |
| `payments` | `payment_history` | **RENAME** | More descriptive name |
| `email_logs` | `email_logs` | **KEEP** | Good as is |
| `trial_email_logs` | **MERGE** | **MERGE** | Merge into email_logs |
| `welcome_emails` | **MERGE** | **MERGE** | Merge into email_logs |
| `email_queue` | **REMOVE** | **DELETE** | Handle in edge functions |
| `scheduled_notifications` | **REMOVE** | **DELETE** | Handle in edge functions |
| `notification_logs` | **MERGE** | **MERGE** | Merge into notifications |
| `user_activity_tracking` | **REMOVE** | **DELETE** | Not in requirements |
| `subscription_event_logs` | **ADD** | **NEW** | For audit trail |

## New Database Schema Structure

### Phase 1: Core Authentication & Users (Migration 001)
- `app_users` - Main user profiles
- `trader_profiles` - Extended trader information
- `user_settings` - User preferences (key-value pairs)

### Phase 2: Subscription & Payments (Migration 002)
- `subscription_plans` - Available plans
- `user_subscriptions` - Active subscriptions
- `payment_history` - Payment records
- `coupons` - Discount codes
- `coupon_usage` - Coupon redemption tracking

### Phase 3: Trading Core (Migration 003)
- `accounts` - Trading accounts
- `strategies` - Trading strategies
- `strategy_rules` - Strategy rule definitions
- `tags` - User-defined tags
- `commissions` - Commission structures

### Phase 4: Trades & Metrics (Migration 004)
- `trades` - Main trades table
- `trade_metrics` - Calculated performance metrics
- `trade_images` - Trade screenshots/charts
- `trade_tags` - Many-to-many trade tagging
- `partial_exits` - Partial exit tracking

### Phase 5: Community Features (Migration 005)
- `community_follows` - Follow relationships
- `trade_likes` - Trade likes
- `trade_comments` - Trade comments

### Phase 6: Content & Journal (Migration 006)
- `journal` - Daily journal entries
- `journal_images` - Journal images
- `notes` - User notes

### Phase 7: Notifications & System (Migration 007)
- `notifications` - User notifications
- `user_push_tokens` - Push notification tokens
- `email_logs` - Email delivery tracking
- `subscription_event_logs` - Subscription audit trail

### Phase 8: Database Functions (Migration 008)
- Trigger functions (updated_at, new signup, etc.)
- Utility functions (subscription status, plan limits, etc.)
- Analytics functions

### Phase 9: Row Level Security (Migration 009)
- RLS policies for all tables
- Security definer functions

### Phase 10: Indexes & Performance (Migration 010)
- Performance indexes
- Full-text search indexes
- Composite indexes

### Phase 11: Views & Helpers (Migration 011)
- `trades_with_images` view
- `active_subscriptions` view
- Analytics helper views

## Migration File Structure

```
supabase/migrations/
├── 20241123100000_phase1_core_auth_users.sql
├── 20241123100001_phase2_subscriptions_payments.sql
├── 20241123100002_phase3_trading_core.sql
├── 20241123100003_phase4_trades_metrics.sql
├── 20241123100004_phase5_community_features.sql
├── 20241123100005_phase6_content_journal.sql
├── 20241123100006_phase7_notifications_system.sql
├── 20241123100007_phase8_database_functions.sql
├── 20241123100008_phase9_row_level_security.sql
├── 20241123100009_phase10_indexes_performance.sql
└── 20241123100010_phase11_views_helpers.sql
```

## Key Design Decisions

### 1. User Management
- **app_users** references `auth.users(id)` with CASCADE DELETE
- Username is UNIQUE and required (generated from email if not provided)
- Subscription status tracked in app_users for quick access
- Trial period is 7 days (changed from 14 days in old system)

### 2. Subscription System
- Single active subscription per user (enforced by unique index)
- Support for multiple payment gateways (Cashfree, Stripe, manual)
- Coupon system with usage limits and expiration
- Audit trail via subscription_event_logs

### 3. Trading System
- Trades reference accounts and strategies (SET NULL on delete)
- Trade metrics in separate table for performance
- Support for partial exits with remaining quantity tracking
- Tags as separate table with many-to-many relationship

### 4. Community Features
- Follow relationships with self-follow prevention
- Trade likes with duplicate prevention
- Comments with user attribution
- Shared trades via is_shared flag

### 5. Notifications
- Single notifications table (no separate logs)
- Push tokens for mobile notifications
- Email logs with delivery tracking
- Subscription events for audit trail

## Data Migration Strategy

### Option 1: Fresh Start (RECOMMENDED)
- Start with empty database
- Users re-register (send migration email)
- No data migration needed
- Clean slate with proper structure

### Option 2: Selective Migration
- Migrate only critical data:
  - User emails (for re-invitation)
  - Subscription status (for continuity)
  - Active trades (last 30 days)
- Skip broken/inconsistent data
- Requires data transformation scripts

### Option 3: Full Migration
- Attempt to migrate all data
- High risk due to broken app_users
- Requires extensive data cleaning
- NOT RECOMMENDED

## Recommended Approach: Fresh Start

### Rationale
1. **app_users is broken** - Cannot reliably reference old data
2. **Inconsistent schema** - Would require extensive transformation
3. **Clean architecture** - Opportunity to implement best practices
4. **Faster implementation** - No complex migration scripts
5. **Lower risk** - No data corruption from bad migration

### Migration Steps

1. **Backup old database** (for reference only)
2. **Create new Supabase project** (already done)
3. **Run all migration files** (001-011)
4. **Test with sample data**
5. **Deploy edge functions**
6. **Update frontend to new schema**
7. **Send migration email to users**
8. **Monitor signup and onboarding**

### User Communication

**Email Template:**
```
Subject: TradeLens Platform Upgrade - Action Required

Hi [User],

We're excited to announce a major upgrade to TradeLens with improved
performance, new features, and better reliability.

As part of this upgrade, we've rebuilt our platform from the ground up.
You'll need to create a new account to continue using TradeLens.

✨ What's New:
- Faster performance
- Improved analytics
- Better mobile experience
- Enhanced security

🎁 Special Offer:
As a valued existing user, we're offering you [X days/months] free
when you sign up again.

👉 Get Started: [signup_link]

Your trading data from the old platform will be available for download
until [date].

Questions? Reply to this email or visit our help center.

Best regards,
The TradeLens Team
```

## Next Steps

1. ✅ Review this migration plan
2. ✅ Create migration files (001-011) - **COMPLETE**
3. ⏳ Test migrations on local Supabase
4. ⏳ Create edge functions
5. ⏳ Update frontend code
6. ⏳ Deploy to production
7. ⏳ Send user migration emails

## Migration Files Created

All 11 migration files have been successfully created:

- ✅ `20241123100000_phase1_core_auth_users.sql` (3 tables, 2 functions)
- ✅ `20241123100001_phase2_subscriptions_payments.sql` (6 tables, 4 default plans)
- ✅ `20241123100002_phase3_trading_core.sql` (5 tables, 2 functions)
- ✅ `20241123100003_phase4_trades_metrics.sql` (5 tables, 1 function)
- ✅ `20241123100004_phase5_community_features.sql` (4 tables, 6 functions)
- ✅ `20241123100005_phase6_content_journal.sql` (3 tables, 2 functions)
- ✅ `20241123100006_phase7_notifications_system.sql` (5 tables, 4 functions)
- ✅ `20241123100007_phase8_database_functions.sql` (15 triggers, 8 trigger functions)
- ✅ `20241123100008_phase9_row_level_security.sql` (60+ RLS policies)
- ✅ `20241123100009_phase10_indexes_performance.sql` (30+ indexes, 3 views)
- ✅ `20241123100010_phase11_views_helpers.sql` (5 views, 7 analytics functions)

**Total:** 31 tables, 37 functions, 60+ RLS policies, 32+ indexes

## Latest Updates (Post Old-DB Analysis)

After inspecting the old Supabase database, we added **23 critical fields** to ensure full compatibility:

- ✅ **app_users**: Added `display_name`, `profile_completed`, `email_verified`, `signup_source`
- ✅ **trader_profiles**: Added `about_content`, `profile_data`, `stats_visibility`, `privacy_settings`
- ✅ **subscription_plans**: Added `plan_type`, `validity_days`
- ✅ **user_subscriptions**: Added `next_billing_date`
- ✅ **payment_history**: Added 8 fields for detailed payment tracking
- ✅ **accounts**: Added `profit_loss` (calculated field)
- ✅ **trades**: Added `chart_link`, `trade_date`, `shared_by_user_id`
- ✅ **New trigger**: Auto-populate `trade_date` from `entry_time`

See `.kiro/specs/supabase-database-rebuild/MIGRATION_UPDATES.md` for complete details., 8 views

## Timeline Estimate

- **Migration files creation**: 4-6 hours
- **Testing**: 2-3 hours
- **Edge functions**: 3-4 hours
- **Frontend updates**: 6-8 hours
- **Total**: 15-21 hours (2-3 days)

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Migration file errors | Medium | High | Thorough testing on local |
| User resistance to re-signup | High | Medium | Offer incentives, clear communication |
| Data loss concerns | Medium | High | Provide export of old data |
| Frontend breaking changes | Medium | High | Comprehensive testing, staged rollout |
| RLS policy gaps | Low | High | Security audit, penetration testing |

## Success Criteria

- ✅ All migrations run without errors
- ✅ All RLS policies enforce correct access
- ✅ All edge functions deploy successfully
- ✅ Frontend connects to new database
- ✅ User signup and trial flow works end-to-end
- ✅ Payment webhooks process correctly
- ✅ Email notifications send successfully
- ✅ Analytics queries perform under 2 seconds

---

**Status**: Ready for Implementation
**Last Updated**: November 23, 2024
**Approved By**: [Pending]
