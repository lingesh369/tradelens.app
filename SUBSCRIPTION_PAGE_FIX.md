# Subscription Page Fix

## Problem
The `/subscription` page was crashing with error:
```
TypeError: Cannot read properties of undefined (reading 'filter')
at Subscription (Subscription.tsx:41:32)
```

The issue was that `useSubscription()` hook didn't return `plans` or `isLoadingPlans` properties that the Subscription page was trying to use.

## Root Cause
The `useSubscription` hook was only designed to fetch the current user's subscription, not the available subscription plans. The Subscription page needed both:
1. User's current subscription (for context)
2. All available plans (to display options)

## Solution Applied

### 1. Updated `useSubscription` Hook
Added a second query to fetch all available subscription plans:

```typescript
export function useSubscription() {
  // Existing query for user's subscription
  const subscriptionQuery = useQuery<UserSubscription | null>({...});
  
  // NEW: Query for all available plans
  const plansQuery = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      // Transform data to match expected format
      return data.map(plan => ({
        id: plan.id,
        plan_id: plan.id,
        name: plan.display_name || plan.name,
        display_name: plan.display_name,
        description: plan.description,
        monthly_price: plan.price_monthly || 0,
        yearly_price: plan.price_yearly || 0,
        features: plan.features,
        limits: plan.limits
      }));
    }
  });
  
  // Return both queries
  return {
    data: subscriptionQuery.data,
    isLoading: subscriptionQuery.isLoading,
    userSubscription: subscriptionQuery.data, // Backward compatibility
    plans: plansQuery.data || [],
    isLoadingPlans: plansQuery.isLoading,
    plansError: plansQuery.error
  };
}
```

### 2. Added Safety Check in Subscription Page
Updated the filter to handle undefined plans:

```typescript
// Before (crashed if plans was undefined)
const availablePlans = plans.filter(plan => plan.name !== 'Free Trial');

// After (safe with fallback)
const availablePlans = (plans || []).filter(plan => 
  plan.name !== 'free' && plan.name !== 'Free Trial'
);
```

### 3. Cleaned Up Unused Import
Removed unused `userSubscription` from Upgrade.tsx that was causing a lint warning.

## TypeScript Compatibility
Used `as any` type assertions to bypass Supabase type generation issues. This is a temporary solution until types are regenerated with:
```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## Testing
The fix ensures:
- ✅ Subscription page loads without crashing
- ✅ Plans are fetched from database
- ✅ Free trial plan is filtered out from display
- ✅ Loading state is properly handled
- ✅ Backward compatibility maintained for other components using the hook

## Files Modified
1. `src/hooks/useSubscription.ts` - Added plans query
2. `src/pages/Subscription.tsx` - Added safety check for undefined plans
3. `src/pages/Upgrade.tsx` - Removed unused import

## Database Query
The hook now fetches plans with:
```sql
SELECT * FROM subscription_plans 
WHERE is_active = true 
ORDER BY sort_order ASC
```

This returns plans in the correct order (Free Trial, Starter, Pro) based on the `sort_order` column.
