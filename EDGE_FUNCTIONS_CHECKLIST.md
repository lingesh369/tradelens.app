# Edge Functions Deployment Checklist

## Pre-Deployment

### 1. Environment Setup
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Logged in to Supabase (`supabase login`)
- [ ] Project linked (`supabase link --project-ref tzhhxeyisppkzyjacodu`)

### 2. API Credentials Ready
- [ ] Cashfree App ID and Secret Key
- [ ] PayPal Client ID and Secret
- [ ] NOWPayments API Key
- [ ] OpenAI API Key
- [ ] Frontend URL configured

### 3. Set Environment Variables
```bash
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

## Deployment

### 4. Deploy Functions
- [ ] Run deployment script: `supabase\deploy-functions.bat`
- [ ] Verify all functions deployed: `supabase functions list`
- [ ] Check for deployment errors

### 5. Configure Webhooks

#### Cashfree
- [ ] Go to Cashfree Dashboard → Webhooks
- [ ] Add URL: `https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/cashfree-webhook`
- [ ] Select events: ORDER_PAID, ORDER_FAILED
- [ ] Save and test webhook

#### NOWPayments
- [ ] Go to NOWPayments Dashboard → Settings → IPN
- [ ] Add URL: `https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/nowpayments-webhook`
- [ ] Save configuration

#### PayPal (Optional)
- [ ] Go to PayPal Developer Dashboard → Webhooks
- [ ] Add URL: `https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/paypal-webhook`
- [ ] Select events: PAYMENT.CAPTURE.COMPLETED
- [ ] Save configuration

## Testing

### 6. Test Payment Functions

#### Cashfree
- [ ] Create test order via frontend
- [ ] Complete payment in sandbox
- [ ] Verify webhook received
- [ ] Check subscription activated
- [ ] View logs: `supabase functions logs cashfree-webhook`

#### PayPal
- [ ] Create test order via frontend
- [ ] Complete payment in sandbox
- [ ] Verify payment captured
- [ ] Check subscription activated
- [ ] View logs: `supabase functions logs process-paypal-confirmation`

#### NOWPayments
- [ ] Create test invoice via frontend
- [ ] Complete crypto payment in sandbox
- [ ] Verify webhook received
- [ ] Check subscription activated
- [ ] View logs: `supabase functions logs process-nowpayments-confirmation`

### 7. Test AI Functions

#### AI Chat
- [ ] Send test message via frontend
- [ ] Verify AI response received
- [ ] Check response quality
- [ ] View logs: `supabase functions logs ai-chat`

#### Intent Classifier
- [ ] Test with different message types
- [ ] Verify correct intent classification
- [ ] View logs: `supabase functions logs ai-intent-classifier`

#### Trade Analysis
- [ ] Submit trades for analysis
- [ ] Verify analysis received
- [ ] Check analysis quality
- [ ] View logs: `supabase functions logs analyze-trades-with-gpt`

## Post-Deployment

### 8. Monitoring Setup
- [ ] Set up error alerts in Supabase Dashboard
- [ ] Monitor function invocation counts
- [ ] Track error rates
- [ ] Set up cost alerts for OpenAI usage

### 9. Database Verification
- [ ] Check payments table for new records
- [ ] Verify subscriptions table updates
- [ ] Confirm user profiles updated
- [ ] Test RLS policies working

### 10. Frontend Integration
- [ ] Test all payment flows end-to-end
- [ ] Verify AI chat working
- [ ] Check error handling
- [ ] Test loading states
- [ ] Verify success/error messages

## Production Readiness

### 11. Switch to Production
- [ ] Update Cashfree to production environment
- [ ] Update PayPal to production environment
- [ ] Update NOWPayments to production (if applicable)
- [ ] Update webhook URLs to production
- [ ] Test with real (small) payment

### 12. Documentation
- [ ] Document function URLs for team
- [ ] Share webhook configuration details
- [ ] Document error handling procedures
- [ ] Create runbook for common issues

### 13. Security Review
- [ ] Verify all secrets are set (not hardcoded)
- [ ] Check webhook signature verification working
- [ ] Confirm JWT authentication on all endpoints
- [ ] Review CORS configuration
- [ ] Test rate limiting (if implemented)

## Troubleshooting

### Common Issues

#### Function Not Found
```bash
# List all functions
supabase functions list

# Redeploy specific function
supabase functions deploy <function-name>
```

#### Authentication Errors
```bash
# Check if token is valid
# Verify Authorization header format: Bearer <token>
# Check token expiration
```

#### Webhook Not Receiving
```bash
# Check webhook URL is correct
# Verify webhook is enabled in provider dashboard
# Check function logs for errors
supabase functions logs <webhook-function> --follow
```

#### Payment Not Activating Subscription
```bash
# Check payment status in database
# Verify webhook received and processed
# Check subscription table for errors
# Review function logs
```

## Success Criteria

- [ ] All payment providers working
- [ ] Webhooks receiving and processing events
- [ ] Subscriptions activating automatically
- [ ] AI chat responding accurately
- [ ] No authentication errors
- [ ] Error handling working properly
- [ ] Logs showing successful operations
- [ ] Frontend showing correct status

## ✅ All Functions Implemented!

### Completed Features
- [x] Community features (4 functions)
- [x] Notification system (3 functions)
- [x] Image upload (1 function)
- [x] Cron jobs (2 functions)

### Completed Enhancements
- [x] Add rate limiting to AI functions
- [x] Implement request logging/analytics
- [x] Add performance monitoring
- [ ] Set up automated testing (optional)
- [ ] Create CI/CD pipeline (optional)

## Notes

- Keep this checklist updated as you deploy
- Document any issues encountered
- Share learnings with team
- Update documentation as needed

---

**Last Updated:** [Date]
**Deployed By:** [Name]
**Environment:** [Sandbox/Production]
