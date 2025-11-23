# 🎯 Frontend Migration Plan - Database Schema Update

## Overview
This plan outlines the step-by-step migration of frontend pages to work with the new database schema. We'll prioritize critical pages first and ensure platform access restrictions are properly implemented.

---

## 📊 Priority Levels

### 🔴 **Critical (Phase 1)** - Platform Access & Core Features
These pages control access and core functionality:

1. **AuthContext** - User authentication and role management
2. **App.tsx** - Route protection and access control
3. **Profile Page** - User profile management
4. **Settings Page** - User settings and preferences
5. **Dashboard** - Main landing page after login

### 🟡 **High Priority (Phase 2)** - Core Trading Features
Essential trading functionality:

6. **Trades Page** - Trade management
7. **Analytics Page** - Performance analytics
8. **Strategies Page** - Strategy management
9. **Journal Page** - Trading journal

### 🟢 **Medium Priority (Phase 3)** - Enhanced Features
10. **Community Page** - Social features
11. **AI CoPilot** - AI assistance
12. **Notes Page** - Note-taking
13. **Subscription/Pricing** - Payment management

### 🔵 **Low Priority (Phase 4)** - Admin & Misc
14. **Admin Pages** - Admin functionality
15. **Shared Trade Page** - Public trade sharing
16. **Trader Profile** - Public profiles

---

## 🔍 Current Issues Identified

### Schema Mismatches
1. **app_users table**: Uses `id` (UUID) as primary key, not `user_id`
2. **AuthContext**: Queries use old column names
3. **Subscription queries**: Need to use new `user_subscriptions` table structure
4. **Profile queries**: Need to match new `trader_profiles` structure

### Missing Functionality
1. **Access control**: No subscription-based feature restrictions
2. **Trial management**: Limited trial period handling
3. **Role-based access**: Admin/Manager roles not fully implemented
4. **Error handling**: Inconsistent error handling across pages

---

## 📋 Phase 1: Critical Pages (Platform Access & Core)

### 1. AuthContext.tsx ✅ (Already Updated)
**Status**: Mostly correct, minor fixes needed

**Changes Needed**:
- ✅ Uses `app_users.id` correctly
- ✅ Fetches subscription status
- ✅ Calculates trial days
- ⚠️ Subscription query needs update for new schema

**Action Items**:
```typescript
// Update subscription query to use new schema
const { data: subData } = await supabase
  .from('user_subscriptions')
  .select(`
    status,
    current_period_end,
    subscription_plans!inner(
      name,
      display_name,
      features
    )
  `)
  .eq('user_id', authUser.id)
  .eq('status', 'active')
  .single();
```

---

### 2. App.tsx - Route Protection
**Current State**: Basic authentication check
**Needed**: Subscription-based access control

**Changes Required**:
1. Add subscription status check
2. Implement feature-based access control
3. Add trial expiration handling
4. Redirect to upgrade page for expired subscriptions

**New Components Needed**:
- `ProtectedRoute` - Checks authentication
- `SubscriptionRoute` - Checks subscription status
- `FeatureGate` - Checks feature access based on plan

---

### 3. Profile Page
**Current State**: Unknown (need to check)
**Database Tables**: `app_users`, `trader_profiles`

**Required Fields**:
```typescript
interface UserProfile {
  // From app_users
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  user_role: string;
  subscription_status: string;
  trial_end_date: string;
  
  // From trader_profiles
  bio: string;
  about_content: string;
  trading_experience: string;
  risk_tolerance: string;
  preferred_markets: string[];
  location: string;
  timezone: string;
  is_public: boolean;
}
```

**Actions**:
1. Update profile fetch query
2. Update profile update mutation
3. Add avatar upload functionality
4. Add trader profile toggle (public/private)

---

### 4. Settings Page
**Current State**: Unknown
**Database Tables**: `user_settings`, `app_users`

**Required Sections**:
1. **Account Settings**
   - Email, username, password
   - Profile information
   
2. **Trading Settings**
   - Default account, strategy
   - Commission settings
   - Timezone preferences
   
3. **Notification Settings**
   - Email notifications
   - Push notifications
   - Notification preferences
   
4. **Privacy Settings**
   - Profile visibility
   - Trade sharing defaults
   
5. **Subscription Management**
   - Current plan
   - Usage statistics
   - Upgrade/downgrade options

---

### 5. Dashboard
**Current State**: Unknown
**Required Data**:
- User statistics
- Recent trades
- Performance metrics
- Subscription status
- Trial countdown (if applicable)

**Access Control**:
- Show trial banner if trialing
- Limit features based on subscription
- Show upgrade prompts for premium features

---

## 🛡️ Access Control Implementation

### Subscription Tiers
```typescript
enum SubscriptionTier {
  FREE_TRIAL = 'trialing',
  STARTER = 'starter',
  PRO = 'pro',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

interface FeatureAccess {
  maxTrades: number;
  maxStrategies: number;
  maxAccounts: number;
  aiAnalysis: boolean;
  advancedAnalytics: boolean;
  communityFeatures: boolean;
  csvImport: boolean;
  apiAccess: boolean;
}
```

### Feature Gates
```typescript
const FEATURE_ACCESS: Record<SubscriptionTier, FeatureAccess> = {
  [SubscriptionTier.FREE_TRIAL]: {
    maxTrades: 50,
    maxStrategies: 3,
    maxAccounts: 2,
    aiAnalysis: true,
    advancedAnalytics: false,
    communityFeatures: true,
    csvImport: true,
    apiAccess: false,
  },
  [SubscriptionTier.STARTER]: {
    maxTrades: 500,
    maxStrategies: 10,
    maxAccounts: 5,
    aiAnalysis: true,
    advancedAnalytics: true,
    communityFeatures: true,
    csvImport: true,
    apiAccess: false,
  },
  [SubscriptionTier.PRO]: {
    maxTrades: -1, // unlimited
    maxStrategies: -1,
    maxAccounts: -1,
    aiAnalysis: true,
    advancedAnalytics: true,
    communityFeatures: true,
    csvImport: true,
    apiAccess: true,
  },
  // ... other tiers
};
```

---

## 🔧 Implementation Strategy

### Step 1: Create Shared Utilities
```
src/lib/
├── access-control.ts      # Feature access logic
├── subscription.ts        # Subscription helpers
├── database-helpers.ts    # Common queries
└── types/
    ├── user.ts           # User types
    ├── subscription.ts   # Subscription types
    └── features.ts       # Feature types
```

### Step 2: Create Custom Hooks
```
src/hooks/
├── useSubscription.ts     # Subscription status
├── useFeatureAccess.ts    # Feature access check
├── useUserProfile.ts      # User profile data
└── useSettings.ts         # User settings
```

### Step 3: Create Access Control Components
```
src/components/access/
├── ProtectedRoute.tsx     # Auth check
├── SubscriptionGate.tsx   # Subscription check
├── FeatureGate.tsx        # Feature check
├── UpgradePrompt.tsx      # Upgrade CTA
└── TrialBanner.tsx        # Trial countdown
```

### Step 4: Update Pages Sequentially
1. Fix AuthContext subscription query
2. Implement access control utilities
3. Update Profile page
4. Update Settings page
5. Update Dashboard
6. Continue with other pages

---

## 📝 Database Query Patterns

### Fetch User Profile
```typescript
const { data: profile } = await supabase
  .from('app_users')
  .select(`
    *,
    trader_profiles(*),
    user_settings(*),
    user_subscriptions!inner(
      status,
      current_period_end,
      subscription_plans(*)
    )
  `)
  .eq('id', userId)
  .single();
```

### Check Feature Access
```typescript
const { data: subscription } = await supabase
  .from('user_subscriptions')
  .select(`
    status,
    subscription_plans!inner(
      name,
      features
    )
  `)
  .eq('user_id', userId)
  .eq('status', 'active')
  .single();
```

### Update Profile
```typescript
// Update app_users
await supabase
  .from('app_users')
  .update({
    first_name,
    last_name,
    avatar_url
  })
  .eq('id', userId);

// Update trader_profiles
await supabase
  .from('trader_profiles')
  .upsert({
    user_id: userId,
    bio,
    trading_experience,
    risk_tolerance
  });
```

---

## ✅ Success Criteria

### Phase 1 Complete When:
- [ ] AuthContext uses correct schema
- [ ] Access control utilities implemented
- [ ] Profile page fully functional
- [ ] Settings page fully functional
- [ ] Dashboard shows correct data
- [ ] Trial banner works correctly
- [ ] Subscription status displayed accurately
- [ ] Feature gates prevent unauthorized access

---

## 🚀 Next Steps

1. **Review this plan** - Confirm priorities and approach
2. **Start with AuthContext** - Fix subscription query
3. **Implement utilities** - Access control and helpers
4. **Update Profile page** - First major page update
5. **Continue sequentially** - One page at a time

---

## 📞 Questions to Answer

1. What features should be restricted by subscription tier?
2. What happens when trial expires?
3. Should we allow grace period after expiration?
4. How to handle downgrade scenarios?
5. What data should be visible in free tier?

---

**Ready to start? Let's begin with Phase 1!** 🎯
