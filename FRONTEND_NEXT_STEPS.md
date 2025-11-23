# 🎯 Frontend Migration - Next Steps & Action Plan

## Current Status: 60% Complete ✅

### ✅ Completed
- AuthContext fixed
- Access control system built
- Custom hooks created
- ProfileDetails updated (44% less code)
- SubscriptionInfo updated (better UX)
- Settings verified (already compatible)

### ⏳ Remaining: 40%
- Dashboard update
- Trading pages verification
- Hook compatibility checks
- Testing across subscription tiers

---

## 🚀 Action Plan

### Step 1: Dashboard Update (30 min) - HIGHEST PRIORITY

**File**: `src/pages/Dashboard.tsx`

**Changes Needed**:
1. Add trial banner at top (if trial active)
2. Add subscription status card
3. Show usage statistics with progress bars
4. Add feature access indicators
5. Add quick actions based on plan

**Implementation**:
```typescript
import { useAuth } from '@/context/AuthContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/access/FeatureGate';

// Add trial banner
{trialActive && daysLeftInTrial > 0 && (
  <TrialBanner daysLeft={daysLeftInTrial} />
)}

// Add usage stats
<UsageStatsCard 
  trades={currentTrades}
  maxTrades={features.maxTrades}
  strategies={currentStrategies}
  maxStrategies={features.maxStrategies}
/>

// Gate premium features
<FeatureGate feature="advancedAnalytics">
  <AdvancedAnalyticsWidget />
</FeatureGate>
```

---

### Step 2: Verify Trading Pages (1 hour)

#### A. Trades Page (20 min)
**File**: `src/pages/Trades.tsx`

**Verification Checklist**:
- [ ] Check if `useTrades` hook uses `user.id` correctly
- [ ] Add usage limit check before adding trade
- [ ] Show remaining trade quota
- [ ] Add upgrade prompt when limit reached

**Code to Add**:
```typescript
const { checkLimit, getRemaining } = useFeatureAccess();
const canAddTrade = checkLimit('maxTrades', trades?.length || 0);
const remaining = getRemaining('maxTrades', trades?.length || 0);

// In Add Trade button
<Button 
  disabled={!canAddTrade}
  onClick={handleAddTrade}
>
  Add Trade {!canAddTrade && `(Limit Reached)`}
</Button>

{!canAddTrade && (
  <UpgradePrompt 
    feature="More Trades" 
    requiredPlan="Starter Plan"
    variant="banner"
  />
)}
```

#### B. Analytics Page (15 min)
**File**: `src/pages/Analytics.tsx`

**Changes**:
- [ ] Verify data queries use correct user ID
- [ ] Gate advanced analytics features
- [ ] Show upgrade prompt for Pro features

```typescript
<FeatureGate 
  feature="advancedAnalytics" 
  requiredPlan="Starter Plan"
>
  <AdvancedCharts />
</FeatureGate>
```

#### C. Strategies Page (15 min)
**File**: `src/pages/Strategies.tsx`

**Changes**:
- [ ] Check `useStrategies` hook
- [ ] Add usage limit check
- [ ] Show remaining quota

#### D. Journal Page (10 min)
**File**: `src/pages/Journal.tsx`

**Changes**:
- [ ] Check `useJournal` hook
- [ ] Add usage limit check
- [ ] Show remaining quota

---

### Step 3: Verify Hooks (30 min)

Check these hooks for schema compatibility:

#### useAccounts
```typescript
// Should use:
.from('accounts')
.select('*')
.eq('user_id', user.id) // ✅
```

#### useTrades
```typescript
// Should use:
.from('trades')
.select('*')
.eq('user_id', user.id) // ✅
```

#### useStrategies
```typescript
// Should use:
.from('strategies')
.select('*')
.eq('user_id', user.id) // ✅
```

#### useJournal
```typescript
// Should use:
.from('journal')
.select('*')
.eq('user_id', user.id) // ✅
```

---

### Step 4: Testing (1 hour)

#### Test Scenarios

**A. Free Trial User**
- [ ] Can see trial banner with countdown
- [ ] Can add up to 50 trades
- [ ] Gets blocked at 51st trade
- [ ] Sees upgrade prompt
- [ ] Can access basic features
- [ ] Cannot access advanced analytics

**B. Starter Plan User**
- [ ] No trial banner
- [ ] Can add up to 500 trades
- [ ] Can create up to 10 strategies
- [ ] Has advanced analytics
- [ ] Cannot access API features

**C. Pro Plan User**
- [ ] Unlimited trades
- [ ] Unlimited strategies
- [ ] All features unlocked
- [ ] No upgrade prompts

**D. Expired Subscription**
- [ ] Sees expiration warning
- [ ] Gets redirected to pricing
- [ ] Cannot access premium features
- [ ] Can still view existing data

---

## 🔧 Quick Fix Commands

### Find Old Patterns
```bash
# Find old auth_id references
grep -r "auth_id" src/

# Find old profile_picture_url
grep -r "profile_picture_url" src/

# Find old user_status
grep -r "user_status" src/

# Find old usePlanAccess
grep -r "usePlanAccess" src/
```

### Replace Patterns
```bash
# Replace auth_id with id
# Replace profile_picture_url with avatar_url
# Replace user_status with is_active
# Replace usePlanAccess with useFeatureAccess
```

---

## 📊 Progress Tracking

### Day 1 (Today) ✅
- [x] Phase 1: Foundation complete
- [x] Phase 2: Core pages complete
- [x] Documentation complete

### Day 2 (Tomorrow)
- [ ] Dashboard update
- [ ] Trades page verification
- [ ] Analytics page verification
- [ ] Strategies page verification
- [ ] Journal page verification

### Day 3 (Testing)
- [ ] Test all subscription tiers
- [ ] Test feature gates
- [ ] Test usage limits
- [ ] Test upgrade flow
- [ ] Fix any issues found

---

## 🎯 Success Metrics

### Code Quality
- [ ] No `auth_id` references
- [ ] No `profile_picture_url` references
- [ ] All hooks use new schema
- [ ] Consistent error handling
- [ ] Proper loading states

### User Experience
- [ ] Clear trial status
- [ ] Visible usage limits
- [ ] Easy upgrade path
- [ ] No confusing errors
- [ ] Smooth navigation

### Functionality
- [ ] All queries work
- [ ] Feature gates work
- [ ] Usage limits enforced
- [ ] Subscriptions activate correctly
- [ ] Payments process correctly

---

## 🚨 Common Issues & Solutions

### Issue 1: "User not found"
**Cause**: Using `auth_id` instead of `id`
**Solution**: Update query to use `user.id` directly

### Issue 2: "Column does not exist"
**Cause**: Using old column names
**Solution**: Update to new schema column names

### Issue 3: Feature gate not working
**Cause**: Hook not returning correct data
**Solution**: Check `useFeatureAccess` is imported and used

### Issue 4: Usage limit not enforced
**Cause**: Not checking limits before action
**Solution**: Add `checkLimit()` call before allowing action

---

## 📝 Checklist for Each Page

When updating/verifying a page:

- [ ] Import necessary hooks (`useFeatureAccess`, `useAuth`)
- [ ] Check all database queries use correct user ID
- [ ] Add usage limit checks where applicable
- [ ] Add feature gates for premium features
- [ ] Add upgrade prompts when limits reached
- [ ] Test loading states
- [ ] Test error states
- [ ] Test with different subscription tiers

---

## 🎉 Final Deliverables

### Code
- [ ] All pages updated/verified
- [ ] All hooks compatible
- [ ] All feature gates working
- [ ] All usage limits enforced

### Documentation
- [x] Migration plan
- [x] Phase 1 summary
- [x] Phase 2 updates
- [x] Complete summary
- [x] Next steps (this file)
- [ ] Testing report (after testing)

### Testing
- [ ] Test report with screenshots
- [ ] Bug list (if any)
- [ ] Performance metrics
- [ ] User acceptance testing

---

## 💡 Tips for Success

1. **Test Frequently** - Test after each page update
2. **Use TypeScript** - Let types catch errors early
3. **Check Console** - Watch for errors in browser console
4. **Use React DevTools** - Inspect hook states
5. **Test Edge Cases** - Try limits, expiration, etc.

---

## 🎯 Estimated Timeline

- **Dashboard**: 30 minutes
- **Trading Pages**: 1 hour
- **Hook Verification**: 30 minutes
- **Testing**: 1 hour
- **Bug Fixes**: 30 minutes
- **Total**: ~3.5 hours

---

## ✅ Ready to Continue!

You now have:
- ✅ Complete foundation (Phase 1)
- ✅ Core pages updated (Phase 2)
- ✅ Clear action plan
- ✅ Testing strategy
- ✅ Success criteria

**Next Action**: Update Dashboard page (30 minutes)

Let me know when you're ready to continue! 🚀
