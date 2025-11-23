# Subscription Plans Update Summary

## Issue Identified
The old database had explicit columns (`trading_account_limit`, `trading_strategy_limit`) for plan limits, but the new database uses a JSONB `limits` field. The frontend was checking these limits, but the new structure needed proper seed data.

## Solution Implemented

### 1. Created Migration with Seed Data
**File:** `supabase/migrations/20241124000000_subscription_plans_seed_data.sql`

This migration:
- Clears any existing plans
- Inserts 3 industry-standard plans:
  - **Free Trial** (7 days, limited features)
  - **Starter Plan** ($9/month, good for individuals)
  - **Pro Plan** ($19/month, unlimited everything)

### 2. Plan Structure (Industry Standard)

#### Free Trial
- 2 accounts, 3 strategies
- Unlimited trades
- Basic features only
- 7-day duration

#### Starter Plan  
- 5 accounts, 10 strategies
- Unlimited trades
- AI insights included
- Advanced analytics
- $9/month or $84/year

#### Pro Plan
- Unlimited everything
- All features unlocked
- Priority support
- API access
- $19/month or $180/year

### 3. JSONB Structure

**Features:**
```json
{
    "notes": true,
    "analytics": true,
    "ai": true,
    "csv_import": true,
    "advanced_analytics": true,
    "broker_sync": true,
    "priority_support": true,
    ...
}
```

**Limits:**
```json
{
    "accounts": 5,      // -1 = unlimited
    "strategies": 10,   // -1 = unlimited
    "trades": -1,       // unlimited
    "journal_entries": -1,
    "notes": -1
}
```

## How It Works

### Database Layer
1. **get_user_access_matrix()** - Returns user's plan limits and usage
2. **check_resource_limit()** - Checks if user can create more resources
3. **check_feature_access()** - Checks if user has access to a feature
4. **Database triggers** - Enforce limits automatically

### Frontend Layer
1. **SubscriptionContext** - Provides plan info to all components
2. **usePlanAccess hook** - Easy access to limits and features
3. **access-control.ts** - Hardcoded limits (should be replaced with DB calls)

## What's Already Working

✅ Database functions to check limits
✅ Database triggers to enforce limits  
✅ Frontend hooks to access subscription data
✅ RLS policies for security
✅ Upgrade prompts when limits reached

## What Needs to Be Done

### Option 1: Keep Frontend Hardcoded (Current)
**Pros:**
- Faster (no DB calls)
- Works offline
- Simpler code

**Cons:**
- Must update code when plans change
- Can get out of sync with database
- Less flexible

**Action:** Update `src/lib/access-control.ts` to match new plan limits

### Option 2: Fetch from Database (Recommended)
**Pros:**
- Always in sync with database
- Can change plans without code deploy
- More flexible
- Industry standard

**Cons:**
- Slightly slower (cached though)
- More complex

**Action:** Update frontend to use `get_user_access_matrix()` for limits

## Recommendation: Hybrid Approach

1. **Use database for limits** - Call `get_user_access_matrix()` and cache in context
2. **Keep feature flags in code** - For UI rendering decisions
3. **Enforce on both sides** - Frontend for UX, database for security

### Implementation:

```typescript
// In SubscriptionContext
const [planLimits, setPlanLimits] = useState({
    accounts: 2,
    strategies: 3,
    trades: -1
});

useEffect(() => {
    async function fetchLimits() {
        const { data } = await supabase.rpc('get_user_access_matrix', {
            auth_user_id: user.id
        });
        
        if (data) {
            setPlanLimits({
                accounts: data.accountslimit,
                strategies: data.strategieslimit,
                trades: data.tradeslimit
            });
        }
    }
    
    fetchLimits();
}, [user]);
```

## Next Steps

1. **Apply the migration:**
   ```bash
   supabase db push
   ```

2. **Verify plans are created:**
   ```sql
   SELECT name, limits, features FROM subscription_plans;
   ```

3. **Test limit enforcement:**
   - Try creating accounts beyond limit
   - Verify upgrade prompts appear
   - Check database triggers work

4. **Update frontend (optional):**
   - Modify `SubscriptionContext` to fetch limits from DB
   - Update `usePlanAccess` to use context limits
   - Remove hardcoded limits from `access-control.ts`

## Files Created

1. `supabase/migrations/20241124000000_subscription_plans_seed_data.sql` - Migration with seed data
2. `SUBSCRIPTION_PLANS_LIMITS_GUIDE.md` - Comprehensive guide
3. `SUBSCRIPTION_PLANS_UPDATE_SUMMARY.md` - This file

## Testing Checklist

- [ ] Migration applies successfully
- [ ] Three plans exist in database
- [ ] Free Trial is set as default
- [ ] Limits are correctly structured in JSONB
- [ ] Features are correctly structured in JSONB
- [ ] Frontend can read plan data
- [ ] Account creation respects limits
- [ ] Strategy creation respects limits
- [ ] Upgrade prompts appear when limits reached
- [ ] Pro plan shows "unlimited" correctly

## Industry Standards Followed

✅ Freemium model (free trial → paid)
✅ Tiered pricing (3 tiers)
✅ Clear value progression
✅ Unlimited on top tier
✅ Yearly discount (~20-30%)
✅ Feature gating
✅ Usage-based limits
✅ Trial period (7 days)
✅ Reasonable pricing ($9-$19/month)
