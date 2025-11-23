# Cashfree 500 Error - Complete Solution Guide

## Problem Summary
The `create-cashfree-order` Edge Function returns a **500 Internal Server Error** when called from the frontend, despite:
- ✅ Function being deployed and accessible
- ✅ CORS configuration working correctly
- ✅ Authentication handling working (returns 401 for unauthenticated requests)
- ✅ Database permissions configured correctly for the `payments` table
- ✅ Function code implementation being correct

## Root Cause Analysis

### Confirmed Working Components
1. **Edge Function Deployment**: Function is deployed and accessible at the correct URL
2. **CORS Configuration**: Function handles CORS preflight requests correctly
3. **Authentication**: Function properly validates JWT tokens (returns 401 for invalid tokens)
4. **Database Permissions**: The `payments` table has full CRUD permissions for both `anon` and `authenticated` roles
5. **Function Code**: The implementation in `supabase/functions/create-cashfree-order/index.ts` is correct

### Root Cause: Missing Environment Variables
The 500 error occurs because the Edge Function is missing required environment variables in the Supabase project settings.

## Required Environment Variables

The following environment variables must be configured in Supabase Dashboard → Settings → Edge Functions:

```
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg
FRONTEND_URL=http://localhost:8080
```

**Note**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase.

## Step-by-Step Solution

### Step 1: Get Cashfree Credentials
1. Go to [Cashfree Merchant Dashboard](https://merchant.cashfree.com/merchants/login)
2. Sign up for a new account or log in to existing account
3. Navigate to **Developers** → **API Keys**
4. Copy your **App ID** and **Secret Key**
5. Note: Use sandbox credentials for testing

### Step 2: Configure Environment Variables in Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `tzhhxeyisppkzyjacodu`
3. Navigate to **Settings** → **Edge Functions**
4. Add the following environment variables:

   ```
   CASHFREE_APP_ID=your_actual_app_id_from_step_1
   CASHFREE_SECRET_KEY=your_actual_secret_key_from_step_1
   CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg
   FRONTEND_URL=http://localhost:8080
   ```

### Step 3: Verify Configuration
1. After adding environment variables, wait 1-2 minutes for changes to propagate
2. Test the payment flow again from the checkout page
3. The Edge Function should now work correctly

## Testing the Fix

### Test 1: Frontend Integration
1. Go to `http://localhost:8080/checkout`
2. Ensure you're logged in
3. Select a plan and click "Subscribe"
4. The function should now return a successful response with Cashfree order details

### Test 2: Direct API Test
You can also test directly using the debug script:
```bash
node comprehensive-cashfree-debug.js
```

## Expected Behavior After Fix

### Successful Response Format
```json
{
  "success": true,
  "orderId": "order_123456789",
  "paymentSessionId": "session_abc123",
  "checkoutUrl": "https://sandbox.cashfree.com/pg/view/order_123456789"
}
```

### Error Scenarios (After Fix)
- **401 Unauthorized**: User not logged in (expected behavior)
- **400 Bad Request**: Invalid request payload
- **500 Internal Server Error**: Should no longer occur with proper environment variables

## Troubleshooting

### If 500 Error Persists
1. **Check Supabase Edge Function Logs**:
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for detailed error messages from `create-cashfree-order`

2. **Verify Environment Variables**:
   - Ensure all variables are set correctly
   - Check for typos in variable names
   - Verify Cashfree credentials are valid

3. **Test Cashfree API Directly**:
   ```bash
   curl -X POST https://sandbox.cashfree.com/pg/orders \
     -H "Content-Type: application/json" \
     -H "x-client-id: YOUR_APP_ID" \
     -H "x-client-secret: YOUR_SECRET_KEY" \
     -d '{"order_id":"test_order_123","order_amount":1,"order_currency":"INR"}'
   ```

### Common Issues
1. **Invalid Cashfree Credentials**: Verify credentials in Cashfree dashboard
2. **Wrong Base URL**: Use `https://sandbox.cashfree.com/pg` for testing
3. **Environment Variable Typos**: Double-check variable names
4. **Propagation Delay**: Wait 1-2 minutes after setting environment variables

## Files Modified/Created During Debugging
- `comprehensive-cashfree-debug.js` - Debug script for testing
- `test-500-error-simulation.js` - Error reproduction script
- `CASHFREE_500_ERROR_DEBUG_SOLUTION.md` - Previous debug documentation
- `CASHFREE_ERROR_FIX.md` - Initial error analysis

## Next Steps After Fix
1. Test the complete payment flow
2. Verify webhook handling works correctly
3. Test with real Cashfree credentials (production environment)
4. Implement proper error handling for edge cases

---

**Summary**: The 500 error is caused by missing environment variables in Supabase Edge Functions. Adding the required Cashfree credentials and configuration will resolve the issue.