# Cashfree Edge Function 500 Error - Debug Solution

## Current Status
✅ **Edge Function is deployed and accessible**
✅ **CORS is configured correctly**
✅ **Authentication is working (returns 401 when no auth provided)**

❌ **500 Internal Server Error occurs when authenticated user calls the function**

## Debug Results

Our debug script confirmed:
1. Function URL is accessible: `https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/create-cashfree-order`
2. Returns 401 without authentication (expected behavior)
3. CORS headers are properly configured
4. The issue occurs specifically when an authenticated user makes the request

## Root Cause Analysis

Since the function works for unauthenticated requests but fails with 500 for authenticated requests, the error is likely in one of these areas:

### 1. Environment Variables Missing
The most common cause is missing environment variables in Supabase:
- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY` 
- `CASHFREE_BASE_URL`
- `FRONTEND_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. Database Connection Issues
The function tries to insert into the `payments` table after authentication.

### 3. Cashfree API Issues
Invalid credentials or API endpoint problems.

## Step-by-Step Solution

### Step 1: Check Supabase Edge Function Logs
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `tzhhxeyisppkzyjacodu`
3. Navigate to **Edge Functions** → **Logs**
4. Look for `create-cashfree-order` function logs
5. Check the exact error message when the 500 occurs

### Step 2: Verify Environment Variables
1. In Supabase Dashboard, go to **Settings** → **Edge Functions**
2. Ensure these variables are set:

```
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg/orders
FRONTEND_URL=http://localhost:8080
SUPABASE_URL=https://tzhhxeyisppkzyjacodu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Test Database Permissions
Run this SQL in Supabase SQL Editor:
```sql
-- Check if payments table exists and has correct permissions
SELECT table_name, grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'payments' 
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;
```

### Step 4: Test User Authentication
In your browser console, check if user is properly authenticated:
```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Check session
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
```

### Step 5: Test with Minimal Payload
Try calling the function with minimal data:
```javascript
const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
  body: {
    planId: 'test-plan',
    billingCycle: 'monthly',
    amount: 100,
    customerDetails: {
      customer_name: 'Test User',
      customer_email: 'test@example.com',
      customer_phone: '9999999999'
    }
  }
});

console.log('Response:', data);
console.log('Error:', error);
```

## Common Solutions

### If Environment Variables are Missing:
1. Add all required environment variables in Supabase Dashboard
2. Redeploy the Edge Function: `supabase functions deploy create-cashfree-order`

### If Database Issues:
```sql
-- Grant permissions to payments table
GRANT ALL PRIVILEGES ON payments TO authenticated;
GRANT SELECT ON payments TO anon;
```

### If Cashfree API Issues:
1. Verify your Cashfree credentials in the merchant dashboard
2. Ensure you're using the correct base URL (sandbox vs production)
3. Check if your Cashfree account has the required permissions

## Next Steps

1. **Check the Supabase logs first** - this will give you the exact error message
2. **Verify all environment variables are set correctly**
3. **Test the database permissions**
4. **If still failing, share the exact error from Supabase logs**

## Testing Commands

Run the debug script again if needed:
```bash
node debug-cashfree-error.cjs
```

This will help confirm the function is still accessible and working for basic requests.