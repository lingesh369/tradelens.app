# Fix for Cashfree Payment 500 Error

## Problem
You're getting a 500 Internal Server Error when calling the `create-cashfree-order` Edge Function. This is **NOT** related to localhost - the error occurs because required environment variables are missing in your Supabase project.

## Root Cause
The Edge Function requires several environment variables to work properly, and they are likely not set in your Supabase project settings.

## Required Environment Variables

You need to set these environment variables in your Supabase project:

### 1. Cashfree API Credentials
- `CASHFREE_APP_ID` - Your Cashfree App ID
- `CASHFREE_SECRET_KEY` - Your Cashfree Secret Key
- `CASHFREE_BASE_URL` - Cashfree API base URL
  - Sandbox: `https://sandbox.cashfree.com/pg`
  - Production: `https://api.cashfree.com/pg`

### 2. Application URLs
- `FRONTEND_URL` - Your frontend URL (e.g., `http://localhost:8080` for development)
- `SUPABASE_URL` - Your Supabase project URL (should be auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (should be auto-set)

## How to Fix

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project: `tzhhxeyisppkzyjacodu`
3. Go to **Settings** → **Edge Functions**

### Step 2: Add Environment Variables
Add each of the following environment variables:

```
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg
FRONTEND_URL=http://localhost:8080
```

### Step 3: Get Cashfree Credentials
If you don't have Cashfree credentials:
1. Sign up at https://www.cashfree.com/
2. Go to your Cashfree dashboard
3. Navigate to **Developers** → **API Keys**
4. Copy your App ID and Secret Key
5. Use sandbox credentials for testing

### Step 4: Redeploy Edge Functions (if needed)
After setting environment variables, you may need to redeploy your Edge Functions for the changes to take effect.

## Testing
Once you've set the environment variables:
1. Try making a payment again from your checkout page
2. The 500 error should be resolved
3. You should see proper error messages if there are other issues (like authentication)

## Common Issues
- **Still getting 500 error**: Double-check all environment variable names and values
- **401 Unauthorized**: This is normal when not logged in - make sure you're authenticated
- **Cashfree API errors**: Check your Cashfree credentials and API limits

## Next Steps
1. Set up the environment variables in Supabase
2. Test the payment flow again
3. If you still get errors, check the Supabase Edge Function logs for more specific error messages