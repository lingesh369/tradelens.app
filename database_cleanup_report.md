# Database Cleanup Analysis Report

**Generated:** January 25, 2025  
**Database:** Supabase Project `tzhhxeyisppkzyjacodu`  
**Analysis Scope:** All tables in `public` schema

## 📊 Executive Summary

- **Total Tables Analyzed:** 26 tables
- **Tables Referenced in Code:** 21 tables actively used
- **Safe to Delete:** 5 tables (debug/log tables with no dependencies)
- **Requires Investigation:** 5 tables (have foreign keys but unused in code)
- **No True Duplicates Found:** All tables serve distinct purposes

## 🟢 Safe for Immediate Removal (5 tables)

### Debug/Analysis Tables
1. **`rls_analysis_summary`** 
   - Purpose: RLS debugging data
   - Dependencies: None
   - Data: 6 rows of debug info
   - **Status: SAFE TO DELETE**

2. **`rls_verification_results`**
   - Purpose: RLS testing results
   - Dependencies: None  
   - Data: 7 rows of test results
   - **Status: SAFE TO DELETE**

3. **`migration_backup_foreign_keys`**
   - Purpose: Migration backup data
   - Dependencies: None
   - Data: 37 rows of backup info
   - **Status: SAFE TO DELETE**

### Log Tables
4. **`user_creation_log`**
   - Purpose: User creation debugging
   - Dependencies: None
   - Data: 7 rows of creation logs
   - **Status: SAFE TO DELETE**

5. **`migration_log`**
   - Purpose: Migration tracking
   - Dependencies: None
   - Data: 1 row of migration history
   - **Status: SAFE TO DELETE**

## 🟡 Requires Manual Investigation (5 tables)

### Email System Tables
1. **`welcome_emails`**
   - Purpose: Welcome email tracking
   - Dependencies: FK to `app_users`
   - Code Usage: **NOT FOUND** in current codebase
   - Data: 0 live rows, 4 dead rows
   - **Recommendation:** Investigate if email system is deprecated

2. **`email_queue`**
   - Purpose: Email queue management
   - Dependencies: FK to `app_users`
   - Code Usage: **NOT FOUND** in current codebase
   - Data: 0 live rows, 3 dead rows
   - **Recommendation:** Investigate if email system is deprecated

### Feature Tables
3. **`trading_rules`**
   - Purpose: User trading rules
   - Dependencies: FK to `app_users`
   - Code Usage: **NOT FOUND** in current codebase
   - Data: 0 rows
   - **Recommendation:** Check if feature was removed or not yet implemented

4. **`trade_images`**
   - Purpose: Trade image attachments
   - Dependencies: FK to `trades` and `app_users`
   - Code Usage: **NOT FOUND** in current codebase
   - Data: 0 live rows, 4 dead rows
   - **Recommendation:** Check if image feature was deprecated

5. **`subscription_event_logs`**
   - Purpose: Subscription event logging
   - Dependencies: FK to `app_users`
   - Code Usage: **NOT FOUND** in current codebase
   - Data: 0 live rows, 30 dead rows
   - **Recommendation:** Check if logging was moved elsewhere

## 🟢 Active Tables (21 tables)

These tables are actively referenced in the codebase and should **NOT** be deleted:

### Core User & Auth
- `app_users` - Main user profiles
- `accounts` - Trading accounts
- `trader_profiles` - Public trader profiles

### Subscription System
- `subscription_plans` - Available plans
- `user_subscriptions_new` - Active subscriptions
- `payments` - Payment records
- `coupons` - Discount coupons
- `coupon_usage` - Coupon usage tracking

### Trading System
- `trades` - Trade records
- `strategies` - Trading strategies
- `strategy_rules` - Strategy rule definitions
- `trade_metrics` - Trade performance metrics
- `partial_exits` - Partial trade exits

### Social Features
- `community_follows` - User following relationships
- `trade_likes` - Trade likes/reactions
- `trade_comments` - Trade comments
- `pinned_trades` - Pinned trade posts

### Content & Settings
- `journal` - Trading journal entries
- `journal_images` - Journal image attachments
- `notes` - User notes
- `tags` - Content tags
- `settings` - Application settings
- `user_settings` - User-specific settings

### Notifications & Communication
- `notifications` - User notifications
- `scheduled_notifications` - Scheduled notifications
- `user_push_tokens` - Push notification tokens

### System & Tracking
- `commissions` - Commission tracking
- `email_logs` - Email delivery logs
- `trial_email_logs` - Trial email tracking

## 🔍 Duplicate Analysis

**No true duplicates found.** The following pairs were investigated:

### `settings` vs `user_settings`
- **`settings`**: Application-wide configuration settings
- **`user_settings`**: User-specific preference settings
- **Conclusion:** Both serve distinct purposes, no duplication

### `user_subscriptions_new` vs `user_subscriptions`
- **`user_subscriptions_new`**: Current active table
- **`user_subscriptions`**: Does not exist in database
- **Conclusion:** No duplication, migration was completed

## 📋 Recommended Actions

### Immediate Actions (Safe)
1. **Execute Phase 1** of the cleanup script to remove 5 debug/log tables
2. **Backup data** before deletion (optional but recommended)
3. **Run verification queries** after cleanup

### Investigation Required
1. **Review email system** - Determine if `welcome_emails` and `email_queue` are still needed
2. **Check trading features** - Verify if `trading_rules` and `trade_images` features were deprecated
3. **Audit logging** - Confirm if `subscription_event_logs` was replaced by another system

### Next Steps
1. Execute the safe cleanup migration
2. Investigate the 5 tables with dependencies
3. Create follow-up migration for additional cleanup if needed
4. Update documentation to reflect removed tables

## 💾 Estimated Space Savings

Removing the 5 safe tables will free up approximately:
- **Debug tables:** ~48 KB (16 KB each × 3)
- **Log tables:** ~146 KB (80 KB + 64 KB + 2 KB)
- **Total:** ~194 KB of immediate savings

Additional cleanup after investigation could free up:
- **Email tables:** ~176 KB
- **Feature tables:** ~194 KB  
- **Potential total:** ~564 KB

## ⚠️ Important Notes

1. **Always backup** before running any DROP statements
2. **Test in staging** environment first if available
3. **Coordinate with team** before removing tables with foreign keys
4. **Update application code** if any removed tables had planned future usage
5. **Monitor logs** after cleanup for any unexpected errors

---

**Script Location:** `database_cleanup_migration.sql`  
**Contact:** Database Administrator  
**Review Date:** January 25, 2