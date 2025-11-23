# Subscription Plans & Limits Guide

## Overview
This document explains the subscription plan structure, feature limits, and how they're enforced in both the database and frontend.

## Database Structure

### Subscription Plans Table
The `subscription_plans` table uses JSONB fields for flexible feature and limit management:

```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    plan_type TEXT, -- 'trial', 'paid', 'lifetime'
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    ...
);
```

### Features JSONB Structure
```json
{
    "notes": true,
    "profile": true,
    "analytics": true,
    "community": true,
    "ai": true,
    "csv_import": true,
    "advanced_analytics": true,
    "broker_sync": true,
    "trade_replay": true,
    "priority_support": true,
    "custom_reports": true,
    "api_access": true,
    "data_storage_gb": 50
}
```

### Limits JSONB Structure
```json
{
    "accounts": 5,        // Max trading accounts (-1 = unlimited)
    "strategies": 10,     // Max trading strategies (-1 = unlimited)
    "trades": -1,         // Max trades (-1 = unlimited)
    "journal_entries": -1,// Max journal entries (-1 = unlimited)
    "notes": -1           // Max notes (-1 = unlimited)
}
```

**Note:** `-1` means unlimited access

## Current Plans

### 1. Free Trial (Default)
- **Duration:** 7 days
- **Price:** $0
- **Limits:**
  - Accounts: 2
  - Strategies: 3
  - Trades: Unlimited
  - Journal Entries: 20
  - Notes: 50
- **Features:**
  - ✅ Basic notes
  - ✅ Basic analytics
  - ✅ Community features
  - ✅ CSV import
  - ❌ AI insights
  - ❌ Advanced analytics
  - ❌ Broker sync

### 2. Starter Plan
- **Duration:** Recurring (monthly/yearly)
- **Price:** $9/month or $84/year
- **Limits:**
  - Accounts: 5
  - Strategies: 10
  - Trades: Unlimited
  - Journal Entries: Unlimited
  - Notes: Unlimited
- **Features:**
  - ✅ All Free Trial features
  - ✅ AI insights
  - ✅ Advanced analytics
  - ✅ 5GB data storage
  - ❌ Broker sync
  - ❌ Trade replay
  - ❌ Priority support

### 3. Pro Plan
- **Duration:** Recurring (monthly/yearly)
- **Price:** $19/month or $180/year
- **Limits:**
  - Accounts: Unlimited
  - Strategies: Unlimited
  - Trades: Unlimited
  - Journal Entries: Unlimited
  - Notes: Unlimited
- **Features:**
  - ✅ All Starter features
  - ✅ Broker sync
  - ✅ Trade replay
  - ✅ Priority support
  - ✅ Custom reports
  - ✅ API access
  - ✅ 50GB data storage

## Database Functions

### 1. get_user_access_matrix(auth_user_id UUID)
Returns comprehensive user access information including:
- User details
- Current subscription status
- Plan name and type
- Feature access flags
- Resource limits
- Current usage counts

**Example:**
```sql
SELECT * FROM get_user_access_matrix('user-uuid-here');
```

**Returns:**
```
userId | email | plan_name | accountsLimit | accountsUsed | strategiesLimit | strategiesUsed | ...
```

### 2. check_resource_limit(auth_user_id UUID, resource_type TEXT)
Checks if user can create more of a specific resource.

**Example:**
```sql
SELECT * FROM check_resource_limit('user-uuid-here', 'accounts');
```

**Returns:**
```json
{
    "resource_type": "accounts",
    "limit": 5,
    "used": 3,
    "available": 2,
    "unlimited": false,
    "can_create": true
}
```

### 3. check_feature_access(auth_user_id UUID, feature_name TEXT)
Checks if user has access to a specific feature.

**Example:**
```sql
SELECT check_feature_access('user-uuid-here', 'ai');
```

**Returns:** `true` or `false`

## Frontend Integration

### Using SubscriptionContext

```typescript
import { useSubscription } from '@/context/SubscriptionContext';

function MyComponent() {
    const { 
        planName, 
        canAccessFeature, 
        checkResourceLimit 
    } = useSubscription();
    
    // Check feature access
    const hasAI = await canAccessFeature('ai');
    
    // Check resource limit
    const accountsRemaining = await checkResourceLimit('accounts');
    
    return (
        <div>
            <p>Plan: {planName}</p>
            <p>Accounts remaining: {accountsRemaining}</p>
        </div>
    );
}
```

### Using usePlanAccess Hook

```typescript
import { usePlanAccess } from '@/hooks/usePlanAccess';

function MyComponent() {
    const { 
        hasFeature, 
        canCreateAccount, 
        canCreateStrategy,
        accountsLimit,
        strategiesLimit 
    } = usePlanAccess();
    
    if (!canCreateAccount) {
        return <UpgradePrompt feature="accounts" />;
    }
    
    return <CreateAccountForm />;
}
```

## Enforcement Points

### 1. Database Level (RLS Policies)
- Policies check limits before INSERT operations
- Prevents exceeding limits even if frontend is bypassed

### 2. Database Triggers
- `enforce_account_limit` - Prevents creating accounts beyond limit
- `enforce_strategy_limit` - Prevents creating strategies beyond limit

### 3. Frontend Level
- UI disables "Create" buttons when limit reached
- Shows upgrade prompts when features are locked
- Displays usage indicators (e.g., "3/5 accounts used")

## Migration to New Structure

If you have old data with columns like `trading_account_limit` and `trading_strategy_limit`, they should be migrated to the JSONB `limits` field:

```sql
-- Example migration
UPDATE subscription_plans
SET limits = jsonb_build_object(
    'accounts', trading_account_limit,
    'strategies', trading_strategy_limit,
    'trades', -1
)
WHERE limits = '{}';
```

## Best Practices

1. **Always use -1 for unlimited** - Don't use NULL or large numbers
2. **Check limits on both frontend and backend** - Defense in depth
3. **Use database functions** - They're cached and optimized
4. **Show clear upgrade paths** - When users hit limits, show them what they get by upgrading
5. **Track usage accurately** - Update counts in real-time

## Testing Limits

```sql
-- Test account limit
INSERT INTO accounts (user_id, account_name, ...)
VALUES ('user-id', 'Test Account', ...);
-- Should fail if limit reached

-- Check current usage
SELECT 
    accountsLimit,
    accountsUsed,
    accountsLimit - accountsUsed as remaining
FROM get_user_access_matrix('user-id');
```

## Updating Plans

To add a new feature or change limits:

```sql
-- Add new feature
UPDATE subscription_plans
SET features = features || '{"new_feature": true}'::jsonb
WHERE name = 'Pro Plan';

-- Update limit
UPDATE subscription_plans
SET limits = jsonb_set(limits, '{accounts}', '10')
WHERE name = 'Starter Plan';
```

## Industry Standards Followed

1. **Tiered Pricing** - Free → Starter → Pro progression
2. **Unlimited on Top Tier** - Pro plan has no limits
3. **Feature Gating** - Advanced features locked to paid plans
4. **Usage-Based Limits** - Limits on resources (accounts, strategies)
5. **Yearly Discount** - ~20-30% discount for annual billing
6. **Trial Period** - 7-day free trial to test the platform
