# 🚀 Edge Functions Quick Start

## What You Have Now

✅ **14 Production-Ready Edge Functions**
- 10 Payment functions (Cashfree, PayPal, Crypto, UPI)
- 4 AI functions (GPT-4 powered chat & analysis)

✅ **Industry Standard Architecture**
- Shared utilities (no code duplication)
- Full TypeScript support
- Proper authentication & security
- Comprehensive error handling

✅ **Complete Documentation**
- Deployment guides
- Testing procedures
- Troubleshooting tips

## 3-Step Deployment

### Step 1: Set Secrets (2 minutes)
```bash
supabase secrets set \
  CASHFREE_APP_ID=your_app_id \
  CASHFREE_SECRET_KEY=your_secret_key \
  CASHFREE_ENV=sandbox \
  PAYPAL_CLIENT_ID=your_client_id \
  PAYPAL_CLIENT_SECRET=your_client_secret \
  PAYPAL_ENV=sandbox \
  NOWPAYMENTS_API_KEY=your_api_key \
  OPENAI_API_KEY=your_openai_key \
  FRONTEND_URL=https://your-domain.com
```

### Step 2: Deploy (5 minutes)
```bash
# Windows
supabase\deploy-functions.bat

# Linux/Mac
bash supabase/deploy-functions.sh
```

### Step 3: Configure Webhooks (3 minutes)

**Cashfree:**
`https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/cashfree-webhook`

**NOWPayments:**
`https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/nowpayments-webhook`

## Function URLs

All functions available at:
```
https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/{function-name}
```

### Payment Functions
- `create-cashfree-order`
- `cashfree-webhook`
- `process-cashfree-confirmation`
- `create-paypal-subscription`
- `process-paypal-confirmation`
- `create-nowpayments-invoice`
- `process-nowpayments-confirmation`
- `check-nowpayments-status`
- `process-upi-payment`
- `process-payment-success`

### AI Functions
- `ai-chat`
- `ai-intent-classifier`
- `ai-context-fetcher`
- `analyze-trades-with-gpt`

## Test It

```bash
# Test AI Chat
curl -X POST https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Analyze my recent trades"}'

# Test Cashfree Order
curl -X POST https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/create-cashfree-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId":"pro","billingCycle":"monthly","amount":999}'
```

## Monitor It

```bash
# View logs
supabase functions logs ai-chat --follow
supabase functions logs cashfree-webhook --follow

# List all functions
supabase functions list
```

## Documentation Files

📄 **EDGE_FUNCTIONS_SETUP_COMPLETE.md** - Overview & what was done
📄 **EDGE_FUNCTIONS_ANALYSIS.md** - Detailed analysis
📄 **EDGE_FUNCTIONS_DEPLOYMENT.md** - Complete deployment guide
📄 **EDGE_FUNCTIONS_SUMMARY.md** - Implementation summary
📄 **EDGE_FUNCTIONS_CHECKLIST.md** - Step-by-step checklist
📄 **This file** - Quick start guide

## Need Help?

1. Check function logs: `supabase functions logs <name>`
2. Review EDGE_FUNCTIONS_DEPLOYMENT.md for troubleshooting
3. Verify environment variables are set
4. Test locally first: `supabase functions serve`

## What's Next?

Optional functions to implement later:
- Community features (4 functions)
- Notifications (3 functions)
- Image upload (1 function)
- Cron jobs (2 functions)

These are lower priority and can be added when needed.

---

**You're ready to deploy! 🎉**

Run `supabase\deploy-functions.bat` to get started.
