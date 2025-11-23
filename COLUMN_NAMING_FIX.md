# Column Naming Convention Fix

## Problem
There was inconsistency between database column naming and frontend code:
- Database uses `name` column in `subscription_plans` table
- Frontend code extensively uses `plan.name` throughout
- Previous fix attempted to handle both camelCase and snake_case, causing confusion

## Solution Applied
**Industry Standard Practice**: Use snake_case for database columns and be consistent in the frontend.

### Database Changes
1. **Access Control Function** (`get_user_access_matrix`):
   - Returns `plan_name` (snake_case) instead of `planName`
   - Returns `plan_id`, `plan_type` (snake_case)
   - All other fields use snake_case: `is_active`, `access_blocked`, etc.

2. **Query Updates**:
   - Added explicit alias: `sp.name AS plan_name` in JOIN queries
   - Ensures consistent column naming in function returns

### Frontend Changes
1. **SubscriptionContext.tsx**:
   - Updated to use `userData.plan_name` instead of `planName`
   - Updated to use `accessData.isactive` instead of `isActive`
   - Updated to use `accessData.accessblocked` instead of `accessBlocked`
   - Removed fallback to camelCase variants

2. **usePlanAccess.ts**:
   - Updated to use `accessData.plan_name`
   - Updated to use snake_case for all fields: `isactive`, `accessblocked`, `notesaccess`, etc.
   - Removed fallback to camelCase variants

3. **Test Scripts**:
   - Updated `test-access-matrix.js` to use `data.plan_name`

## Why This Approach?
1. **PostgreSQL Convention**: PostgreSQL automatically converts unquoted identifiers to lowercase
2. **Consistency**: Using snake_case throughout eliminates confusion
3. **Industry Standard**: Most PostgreSQL projects use snake_case for column names
4. **Maintainability**: Single source of truth - no need to handle multiple naming conventions

## Database Schema
The `subscription_plans` table has:
```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,  -- This is the plan identifier (e.g., 'free', 'starter', 'pro')
    display_name TEXT NOT NULL,  -- This is the user-facing name (e.g., 'Free Trial', 'Starter', 'Pro')
    ...
);
```

## Frontend Usage
When accessing plan data:
```typescript
// ✅ Correct
const planName = accessData.plan_name;
const isActive = accessData.isactive;

// ❌ Incorrect (old way)
const planName = accessData.planName || accessData.plan_name;
const isActive = accessData.isActive ?? accessData.isactive;
```

## Testing
All tests pass:
- ✅ Signup creates user with trial subscription
- ✅ Access matrix returns correct plan_name: "free"
- ✅ Frontend properly reads snake_case columns
- ✅ No more "undefined" plan names

## Files Modified
1. `supabase/migrations/20241123210000_access_control_functions.sql`
2. `src/context/SubscriptionContext.tsx`
3. `src/hooks/usePlanAccess.ts`
4. `test-access-matrix.js`
