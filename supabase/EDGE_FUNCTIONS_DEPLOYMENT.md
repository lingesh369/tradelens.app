# Edge Functions Deployment Guide

## Overview
This guide covers deploying all TradeLens edge functions to Supabase.

## Prerequisites
1. Supabase CLI installed: `npm install -g supabase`
2. Logged in to Supabase: `supabase login`
3. Linked to your project: `supabase link --project-ref tzhhxeyisppkzyjacodu`

## Environment Variables Required

### Payment Providers
```bash
# Cashfree
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_ENV=sandbox  # or production

# PayPal
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_ENV=sandbox  # or production

# NOWPayments (Crypto)
NOWPAYMENTS_API_KEY=your_api_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Frontend URL
FRONTEND_URL=https://your-domain.com
```

### Set Secrets in Supabase
```bash
# Set all secrets at once
supabase secrets set \
  CASHFREE_APP_ID=xxx \
  CASHFREE_SECRET_KEY=xxx \
  CASHFREE_ENV=sandbox \
  PAYPAL_CLIENT_ID=xxx \
  PAYPAL_CLIENT_SECRET=xxx \
  PAYPAL_ENV=sandbox \
  NOWPAYMENTS_API_KEY=xxx \
  OPENAI_API_KEY=xxx \
  FRONTEND_URL=https://your-domain.com
```

## Deployment Commands

### Deploy All Functions
```bash
# Deploy all functions at once
supabase functions deploy

# Or deploy individually
supabase functions deploy create-cashfree-order
supabase functions deploy cashfree-webhook
supabase functions deploy process-cashfree-confirmation
supabase functions deploy create-paypal-subscription
supabase functions deploy process-paypal-confirmation
supabase functions deploy create-nowpayments-invoice
supabase functions deploy process-nowpayments-confirmation
supabase functions deploy check-nowpayments-status
supabase functions deploy process-upi-payment
supabase functions deploy process-payment-success
supabase functions deploy ai-chat
supabase functions deploy ai-intent-classifier
supabase functions deploy ai-context-fetcher
supabase functions deploy analyze-trades-with-gpt
```

## Function URLs
After deployment, your functions will be available at:
```
https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/{function-name}
```

## Webhook Configuration

### Cashfree Webhook
1. Go to Cashfree Dashboard → Webhooks
2. Add webhook URL: `https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/cashfree-webhook`
3. Select events: `ORDER_PAID`, `ORDER_FAILED`

### PayPal Webhook (if needed)
1. Go to PayPal Developer Dashboard → Webhooks
2. Add webhook URL: `https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/paypal-webhook`
3. Select events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

### NOWPayments Webhook
1. Go to NOWPayments Dashboard → Settings → IPN
2. Add IPN URL: `https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/nowpayments-webhook`

## Testing Functions Locally

### Start Local Development
```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve
```

### Test with curl
```bash
# Test create-cashfree-order
curl -i --location --request POST 'http://localhost:54321/functions/v1/create-cashfree-order' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"planId":"pro","billingCycle":"monthly","amount":999}'

# Test AI chat
curl -i --location --request POST 'http://localhost:54321/functions/v1/ai-chat' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"message":"Analyze my recent trades"}'
```

## Monitoring & Logs

### View Function Logs
```bash
# View logs for specific function
supabase functions logs create-cashfree-order

# Follow logs in real-time
supabase functions logs create-cashfree-order --follow
```

### Check Function Status
```bash
# List all deployed functions
supabase functions list
```

## Security Best Practices

1. **Always verify authentication** - All functions use `verifyAuth()` except webhooks
2. **Validate webhook signatures** - Cashfree, PayPal, NOWPayments webhooks verify signatures
3. **Use CORS headers** - All functions include proper CORS configuration
4. **Rate limiting** - Consider implementing rate limiting for AI functions
5. **Input validation** - All functions validate required parameters
6. **Error handling** - Comprehensive error handling with proper status codes

## Function Dependencies

### Shared Utilities
All functions depend on shared utilities in `_shared/`:
- `auth.ts` - Authentication helpers
- `cors.ts` - CORS configuration
- `response.ts` - Response helpers
- `payment-providers/` - Payment provider integrations
- `ai/` - AI service integrations

These are automatically included during deployment.

## Troubleshooting

### Function Not Found
- Ensure function is deployed: `supabase functions list`
- Check function name matches exactly

### Authentication Errors
- Verify `Authorization` header is included
- Check token is valid and not expired

### Payment Provider Errors
- Verify all environment variables are set
- Check API credentials are correct
- Ensure webhook URLs are configured

### AI Function Errors
- Verify OpenAI API key is set
- Check API quota/limits
- Monitor token usage

## Next Steps

1. Deploy all payment functions first (critical for revenue)
2. Test payment flows end-to-end
3. Deploy AI functions
4. Set up monitoring and alerts
5. Configure webhooks in provider dashboards
6. Test webhook deliveries
7. Monitor function logs for errors

## Support
For issues, check:
- Supabase Dashboard → Edge Functions → Logs
- Function-specific error messages
- Payment provider dashboards
